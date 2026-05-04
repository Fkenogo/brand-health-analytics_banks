const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const crypto = require('node:crypto');
const {
  normalizeCountryList,
  normalizeSubscriberState,
  buildClaimsPayload,
  isAdminAuth,
  computeClaimsSyncPlan,
  buildStatusUpdate,
  buildTierUpdate,
  buildAiAddonUpdate,
  buildCountriesUpdate,
} = require('./subscriberEntitlements');
const { isCanonicalAdminProfile, canBootstrapAdminClaims } = require('./adminClaims');
const {
  listPlans,
  initializeDefaultPlans,
  upsertPlan,
  deletePlan,
} = require('./subscriptionPlans');
const {
  buildSurveyAbuseAssessment,
  buildSurveyContextMetadata,
  buildSubmissionMonitoringMetadata,
  shouldEnforcePublicSurveyAppCheck,
} = require('./publicSurvey');
const { deriveSurveyAnalyticsInclusion } = require('./respondentInclusion');
const {
  buildNextEligibleAt,
  buildPanelistId,
  buildRaffleEntryId,
  mergeFollowUpOptIns,
  normalizePublicFollowUpInput,
} = require('./publicFollowUp');
const {
  scanLegacyUserRecords,
  buildCanonicalUserPatch,
} = require('./userIdentityMigration');
const {
  AGGREGATE_SCHEMA_VERSION,
  METHODOLOGY_VERSION,
  SUPPORTED_METRICS,
  SUPPORTED_FILTERS,
  SUPPORTED_MODULES,
  SUPPORTED_COMPARE_METRICS,
  normalizeCountry,
  responseCountry,
  responseDateBucket,
  toDateBucket,
  toMonthBucket,
  buildDailyAggregateFromResponses,
  mergeAggregateDocs,
  buildOverviewSnapshot,
  dateBucketRangeForWindow,
  previousMonthRange,
  monthKeyLabel,
} = require('./analyticsAggregation');
const {
  CANONICAL_BANKS_BY_COUNTRY,
  normalizeBankDefinitions,
  mergeBankDefinitions,
} = require('./dashboardAggregateConfig');

admin.initializeApp();

const db = admin.firestore();
const ENFORCE_PUBLIC_SURVEY_APPCHECK = shouldEnforcePublicSurveyAppCheck();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
];

const MAX_RESPONSE_WORDS = 800;

const toWordLimitedText = (text, maxWords) => {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return String(text || '').trim();
  return `${words.slice(0, maxWords).join(' ')}...`;
};

const normalizeWhitespace = (value) => String(value || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

const REQUIRED_SECTIONS = [
  'Strategic Context',
  'Performance Analysis',
  'Market Position',
  'Brand Strength & Conversion',
  'Customer Advocacy',
  'Business Implications',
  'Risk & Opportunity Zones',
  'Strategic Priorities',
];

const ensureRequiredSections = (raw) => {
  const normalized = normalizeWhitespace(raw);
  const lower = normalized.toLowerCase();
  const hasAll = REQUIRED_SECTIONS.every((section) => lower.includes(section.toLowerCase()));
  if (hasAll) return toWordLimitedText(normalized, MAX_RESPONSE_WORDS);

  const fallback = REQUIRED_SECTIONS.map((section) => {
    const body = section === 'Strategic Priorities'
      ? normalized
      : 'Not enough signal from current snapshot to provide a confident section-level readout.';
    return `## ${section}\n${body}`;
  }).join('\n\n');

  return toWordLimitedText(fallback, MAX_RESPONSE_WORDS);
};

const buildPrompt = (payload) => {
  return [
    'Use only this structured dashboard snapshot.',
    'Do not introduce external assumptions or invent data.',
    'No raw table dumps and no technical implementation details.',
    'Return only the requested executive analysis sections in order.',
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n');
};

const parseGeminiText = (result) => {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
};

const callGeminiModel = async ({ apiKey, model, payload, systemPrompt }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(payload) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1800,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Gemini request failed (${response.status}): ${body || 'Unknown error'}`);
    error.statusCode = response.status;
    throw error;
  }

  const result = await response.json();
  const text = parseGeminiText(result);
  if (!text) throw new Error('Gemini returned an empty response.');
  return ensureRequiredSections(text);
};

const isAdminCaller = (auth) => {
  return isAdminAuth(auth);
};

const writeAuditEvent = async ({
  action,
  actorUid,
  actorEmail,
  targetUid,
  details,
}) => {
  const payload = {
    action,
    actorUid,
    timestamp: new Date().toISOString(),
  };

  const normalizedActorEmail = actorEmail ? String(actorEmail).trim() : '';
  if (normalizedActorEmail) payload.actorEmail = normalizedActorEmail;

  const normalizedTargetId = targetUid ? String(targetUid).trim() : '';
  if (normalizedTargetId) payload.targetId = normalizedTargetId;

  if (details && typeof details === 'object') {
    payload.details = details;
  }

  await db.collection('audit').add(payload);
};

const SURVEY_TELEMETRY_COLLECTION = 'surveySessionEvents';
const SURVEY_SESSIONS_COLLECTION = 'surveySessions';
const SURVEY_TELEMETRY_EVENT_TYPES = new Set([
  'survey_session_started',
  'consent_viewed',
  'consent_confirmed',
  'question_viewed',
  'question_answered',
  'question_skipped',
  'survey_submitted',
  'survey_abandoned',
]);
const SURVEY_QUESTION_TYPES = new Set([
  'note',
  'radio',
  'checkbox',
  'text',
  'longtext',
  'dropdown',
  'date',
  'rating-0-10-nr',
  'rating-0-10-dk',
  'rating-matrix',
]);

const normalizeQuestionType = (value) => {
  const normalized = String(value || '').trim();
  return SURVEY_QUESTION_TYPES.has(normalized) ? normalized : null;
};

const normalizeTelemetryEventType = (value) => {
  const normalized = String(value || '').trim();
  return SURVEY_TELEMETRY_EVENT_TYPES.has(normalized) ? normalized : null;
};

const normalizeSurveyTelemetryEvent = (payload = {}) => {
  const sessionId = String(payload.sessionId || '').trim();
  const eventType = normalizeTelemetryEventType(payload.eventType);
  const country = normalizeCountry(payload.country);
  const language = ['en', 'rw', 'fr'].includes(String(payload.language || '').trim())
    ? String(payload.language || '').trim()
    : null;
  const responseId = String(payload.responseId || '').trim() || null;
  const questionId = String(payload.questionId || '').trim() || null;
  const questionType = normalizeQuestionType(payload.questionType);
  const elapsedSeconds = Number(payload.elapsedSeconds);
  const metadata = payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
    ? payload.metadata
    : {};

  if (!sessionId) {
    return { ok: false, message: 'sessionId is required.' };
  }

  if (!eventType) {
    return { ok: false, message: 'eventType is invalid.' };
  }

  return {
    ok: true,
    value: {
      sessionId,
      eventType,
      country,
      language,
      responseId,
      questionId,
      questionType,
      elapsedSeconds: Number.isFinite(elapsedSeconds) && elapsedSeconds >= 0 ? Math.round(elapsedSeconds) : null,
      metadata,
    },
  };
};

const isTelemetrySessionAbandoned = (session, thresholdMs) => {
  if (!session || session.submittedAt) return false;
  const lastEventIso = String(session.lastEventAt || session.startedAt || '');
  const lastEventMs = new Date(lastEventIso).getTime();
  return Number.isFinite(lastEventMs) && (Date.now() - lastEventMs) >= thresholdMs;
};

const normalizeEntitlementsVersion = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const getInviteByToken = async (token) => {
  const snapshot = await db.collection('invites').where('token', '==', token).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
};

const isInviteExpired = (invite) => {
  if (!invite?.expiresAt) return true;
  const expiresAt = new Date(String(invite.expiresAt)).getTime();
  return Number.isNaN(expiresAt) || expiresAt < Date.now();
};

const syncClaimsForUser = async (uid, userData) => {
  try {
    await admin.auth().getUser(uid);
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      return { synced: false, skipped: true, reason: 'auth_user_not_found' };
    }
    throw error;
  }

  const claims = buildClaimsPayload(userData || {});
  await admin.auth().setCustomUserClaims(uid, claims);
  return { synced: true, claims };
};

const toLoggableError = (error) => ({
  code: String(error?.code || 'unknown'),
  message: String(error?.message || error || 'Unknown error'),
});

const classifyOpsError = (error) => {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  if (code.includes('permission-denied')) return 'permission_denied';
  if (code.includes('unauthenticated')) return 'auth_required';
  if (code.includes('invalid-argument')) return 'validation_failure';
  if (code.includes('failed-precondition')) return 'failed_precondition';
  if (code.includes('not-found')) return 'not_found';
  if (code.includes('already-exists')) return 'already_exists';
  if (code.includes('resource-exhausted')) return 'resource_exhausted';
  if (message.includes('requires manual review')) return 'migration_conflict';
  return 'internal';
};

const logInfo = (event, details) => logger.info(event, { event, ...details });
const logWarn = (event, details) => logger.warn(event, { event, ...details });
const logError = (event, details) => logger.error(event, { event, ...details });
const RESPONSE_ANALYTICS_COLLECTION = 'responseAnalyticsDaily';
const RESPONSE_ANALYTICS_STATUS_COLLECTION = 'responseAnalyticsStatus';

const toIsoString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value?.toDate === 'function') {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted.toISOString() : null;
  }
  if (typeof value === 'object' && Number.isFinite(value.seconds)) {
    const converted = new Date(Number(value.seconds) * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted.toISOString();
  }
  if (typeof value === 'object' && Number.isFinite(value._seconds)) {
    const converted = new Date(Number(value._seconds) * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted.toISOString();
  }
  const converted = new Date(String(value || ''));
  return Number.isNaN(converted.getTime()) ? null : converted.toISOString();
};

const getBanksForCountry = async (country) => {
  const normalizedCountry = normalizeCountry(country);
  if (!normalizedCountry) return [];

  const snapshot = await db.collection('questionnaires').where('country', '==', normalizedCountry).limit(1).get();
  const questionnaire = snapshot.docs[0]?.data() || {};
  const questionnaireBanks = normalizeBankDefinitions(questionnaire.banks);

  const configSnapshot = await db.collection('config').doc('banks').get();
  const configData = configSnapshot.exists ? configSnapshot.data() || {} : {};
  const configBanks = normalizeBankDefinitions(configData[normalizedCountry]);
  const canonicalBanks = normalizeBankDefinitions(CANONICAL_BANKS_BY_COUNTRY[normalizedCountry]);

  return mergeBankDefinitions(questionnaireBanks, configBanks, canonicalBanks);
};

const analyticsDocId = (country, dateBucket) => `${country}__${dateBucket}`;
const analyticsStatusRef = (country) => db.collection(RESPONSE_ANALYTICS_STATUS_COLLECTION).doc(country);
const buildAggregateContract = () => ({
  aggregateSchemaVersion: AGGREGATE_SCHEMA_VERSION,
  methodologyVersion: METHODOLOGY_VERSION,
  methodology_version: METHODOLOGY_VERSION,
  supportedMetrics: SUPPORTED_METRICS,
  supportedFilters: SUPPORTED_FILTERS,
  supportedModules: SUPPORTED_MODULES,
  supportedCompareMetrics: SUPPORTED_COMPARE_METRICS,
});

const aggregateMethodologyVersion = (docData) =>
  String(docData?.methodologyVersion || docData?.methodology_version || METHODOLOGY_VERSION);

const validateAggregateDocIntegrity = ({ country, docData, context }) => {
  const failures = [];
  if (!Object.prototype.hasOwnProperty.call(docData, 'analyticsIncludedCount')) {
    failures.push('missing_analyticsIncludedCount');
  }
  const denominator = Number(docData.analyticsIncludedCount);
  if (!Number.isFinite(denominator) || denominator < 0) failures.push('invalid_analyticsIncludedCount');

  Object.entries(docData.banks || {}).forEach(([bankId, bank]) => {
    [
      ['awareCount', bank?.awareCount],
      ['topOfMindCount', bank?.topOfMindCount],
      ['spontaneousCount', bank?.spontaneousCount],
      ['aidedCount', bank?.aidedCount],
      ['everUsedCount', bank?.everUsedCount],
      ['currentUsingCount', bank?.currentUsingCount],
      ['preferredCount', bank?.preferredCount],
      ['considerCount', bank?.considerCount],
    ].forEach(([field, raw]) => {
      const value = Number(raw || 0);
      if (!Number.isFinite(value) || value < 0) failures.push(`${bankId}.${field}_invalid`);
      if (Number.isFinite(denominator) && value > denominator) {
        failures.push(`${bankId}.${field}_exceeds_denominator`);
      }
    });
  });

  if (failures.length > 0) {
    logWarn('aggregate_bucket_validation_failed', {
      country,
      dateBucket: docData.dateBucket || 'unknown',
      methodologyVersion: aggregateMethodologyVersion(docData),
      context,
      failures,
    });
  }
  return failures;
};

const assertAggregateDocsIntegrity = ({ country, docs, context }) => {
  if (!docs.length) {
    logWarn('aggregate_validation_failed', {
      country,
      context,
      failures: ['no_aggregate_buckets'],
    });
    throw new HttpsError('failed-precondition', 'Overview aggregate data is not available for this filter context.');
  }
  const failures = docs.flatMap((docData) => validateAggregateDocIntegrity({ country, docData, context }));
  if (failures.length > 0) {
    logWarn('aggregate_raw_fallback_triggered', {
      country,
      context,
      bucketCount: docs.length,
      failureCount: failures.length,
    });
    throw new HttpsError('failed-precondition', 'Overview aggregate integrity validation failed. Use raw dashboard analytics for this filter context.');
  }
};

const listResponsesForCountryDateBucket = async ({ country, dateBucket, includeLegacyFallback = false }) => {
  const selectedCountryQuery = db.collection('responses')
    .where('selected_country', '==', country)
    .where('analytics_date_bucket', '==', dateBucket);
  const legacyCountryQuery = db.collection('responses')
    .where('country', '==', country)
    .where('analytics_date_bucket', '==', dateBucket);

  const [selectedCountrySnapshot, legacyCountrySnapshot] = await Promise.all([
    selectedCountryQuery.get(),
    legacyCountryQuery.get(),
  ]);

  const seen = new Set();
  const rows = [];
  [selectedCountrySnapshot, legacyCountrySnapshot].forEach((snapshot) => {
    snapshot.docs.forEach((docSnap) => {
      if (seen.has(docSnap.id)) return;
      seen.add(docSnap.id);
      rows.push(docSnap.data() || {});
    });
  });

  if (includeLegacyFallback) {
    const [selectedCountryFallbackSnapshot, legacyCountryFallbackSnapshot] = await Promise.all([
      db.collection('responses').where('selected_country', '==', country).get(),
      db.collection('responses').where('country', '==', country).get(),
    ]);

    [selectedCountryFallbackSnapshot, legacyCountryFallbackSnapshot].forEach((snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        if (seen.has(docSnap.id)) return;
        const data = docSnap.data() || {};
        const storedBucket = String(data.analytics_date_bucket || '').trim();
        if (storedBucket) return;
        if (responseDateBucket(data) !== dateBucket) return;
        seen.add(docSnap.id);
        rows.push(data);
      });
    });
  }

  return rows;
};

const listAnalyticsBucketsForCountry = async (country) => {
  const [selectedCountrySnapshot, legacyCountrySnapshot] = await Promise.all([
    db.collection('responses').where('selected_country', '==', country).get(),
    db.collection('responses').where('country', '==', country).get(),
  ]);

  const seen = new Set();
  const buckets = new Set();
  [selectedCountrySnapshot, legacyCountrySnapshot].forEach((snapshot) => {
    snapshot.docs.forEach((docSnap) => {
      if (seen.has(docSnap.id)) return;
      seen.add(docSnap.id);
      const data = docSnap.data() || {};
      const dateBucket = responseDateBucket(data);
      if (dateBucket) buckets.add(dateBucket);
    });
  });

  return Array.from(buckets.values()).sort((left, right) => left.localeCompare(right));
};

const rebuildAnalyticsBucket = async ({ country, dateBucket, includeLegacyFallback = false }) => {
  const normalizedCountry = normalizeCountry(country);
  if (!normalizedCountry || !dateBucket) return false;

  const banks = await getBanksForCountry(normalizedCountry);
  const bankIds = banks.map((bank) => bank.id);
  const responses = await listResponsesForCountryDateBucket({
    country: normalizedCountry,
    dateBucket,
    includeLegacyFallback,
  });
  const aggregate = buildDailyAggregateFromResponses({
    country: normalizedCountry,
    dateBucket,
    responses,
    bankIds,
  });

  await db.collection(RESPONSE_ANALYTICS_COLLECTION).doc(analyticsDocId(normalizedCountry, dateBucket)).set({
    ...aggregate,
    ...buildAggregateContract(),
    bankNames: Object.fromEntries(banks.map((bank) => [bank.id, bank.name])),
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    rebuiltAt: admin.firestore.FieldValue.serverTimestamp(),
    sourceResponseCount: responses.length,
    rebuildStatus: 'ready',
    source: 'response_daily_materialized_view',
  }, { merge: false });
  return true;
};

const queryAnalyticsBuckets = (country, startBucket, endBucket) => {
  const startKey = analyticsDocId(country, startBucket || '0000-00-00');
  const endKey = analyticsDocId(country, endBucket);
  return db.collection(RESPONSE_ANALYTICS_COLLECTION)
    .where(admin.firestore.FieldPath.documentId(), '>=', startKey)
    .where(admin.firestore.FieldPath.documentId(), '<=', endKey);
};

const summarizeOverviewForCountry = async ({ country, bankId, timeWindow }) => {
  const normalizedCountry = normalizeCountry(country);
  if (!normalizedCountry) {
    throw new HttpsError('invalid-argument', 'A valid country is required.');
  }
  if (!bankId) {
    throw new HttpsError('invalid-argument', 'bankId is required.');
  }

  const banks = await getBanksForCountry(normalizedCountry);
  const bankIds = banks.map((bank) => bank.id);
  const bankNames = Object.fromEntries(banks.map((bank) => [bank.id, bank.name]));
  if (!bankIds.includes(bankId)) {
    throw new HttpsError('failed-precondition', 'Selected bank is not available for this country.');
  }

  const statusSnap = await analyticsStatusRef(normalizedCountry).get();
  const statusData = statusSnap.exists ? statusSnap.data() || {} : {};
  if (String(statusData.rebuildStatus || '') !== 'ready' || statusData.coverageComplete !== true) {
    throw new HttpsError('failed-precondition', 'Overview aggregates are not ready for this country yet.');
  }

  const currentWindow = dateBucketRangeForWindow(timeWindow);
  const currentSnapshot = await queryAnalyticsBuckets(normalizedCountry, currentWindow.startBucket, currentWindow.endBucket).get();
  const currentDocs = currentSnapshot.docs.map((docSnap) => docSnap.data() || {});
  assertAggregateDocsIntegrity({
    country: normalizedCountry,
    docs: currentDocs,
    context: {
      request: 'getDashboardOverviewAggregate',
      bankId,
      timeWindow,
      startBucket: currentWindow.startBucket,
      endBucket: currentWindow.endBucket,
    },
  });
  const currentMerged = mergeAggregateDocs(currentDocs);
  const currentOverview = buildOverviewSnapshot({
    aggregate: currentMerged,
    bankIds,
    bankNames,
    selectedBankId: bankId,
  });

  const monthRanges = previousMonthRange();
  const [currentMonthSnapshot, previousMonthSnapshot, trendSnapshot] = await Promise.all([
    queryAnalyticsBuckets(normalizedCountry, monthRanges.currentMonthStartBucket, currentWindow.endBucket).get(),
    queryAnalyticsBuckets(normalizedCountry, monthRanges.previousMonthStartBucket, monthRanges.previousMonthEndBucket).get(),
    queryAnalyticsBuckets(normalizedCountry, (() => {
        const start = new Date();
        start.setUTCDate(1);
        start.setUTCMonth(start.getUTCMonth() - 5);
        return start.toISOString().slice(0, 10);
      })(), currentWindow.endBucket).get(),
  ]);
  const currentMonthDocs = currentMonthSnapshot.docs.map((docSnap) => docSnap.data() || {});
  const previousMonthDocs = previousMonthSnapshot.docs.map((docSnap) => docSnap.data() || {});
  const trendDocs = trendSnapshot.docs.map((docSnap) => docSnap.data() || {});
  if (currentMonthDocs.length > 0) {
    assertAggregateDocsIntegrity({
      country: normalizedCountry,
      docs: currentMonthDocs,
      context: { request: 'getDashboardOverviewAggregate', bankId, timeWindow, window: 'current_month' },
    });
  }
  if (previousMonthDocs.length > 0) {
    assertAggregateDocsIntegrity({
      country: normalizedCountry,
      docs: previousMonthDocs,
      context: { request: 'getDashboardOverviewAggregate', bankId, timeWindow, window: 'previous_month' },
    });
  }
  if (trendDocs.length > 0) {
    assertAggregateDocsIntegrity({
      country: normalizedCountry,
      docs: trendDocs,
      context: { request: 'getDashboardOverviewAggregate', bankId, timeWindow, window: 'trend' },
    });
  }

  const currentMonthOverview = buildOverviewSnapshot({
    aggregate: mergeAggregateDocs(currentMonthDocs),
    bankIds,
    bankNames,
    selectedBankId: bankId,
  });
  const previousMonthOverview = buildOverviewSnapshot({
    aggregate: mergeAggregateDocs(previousMonthDocs),
    bankIds,
    bankNames,
    selectedBankId: bankId,
  });

  const currentMonthMetrics = currentMonthOverview.selectedMetrics;
  const previousMonthMetrics = previousMonthOverview.selectedMetrics;
  const monthOverMonth = {
    current: currentMonthMetrics,
    previous: previousMonthMetrics,
    deltas: {
      awareness: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.aware - previousMonthMetrics.aware : null,
      topOfMind: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.topOfMind - previousMonthMetrics.topOfMind : null,
      spontaneous: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.spontaneous - previousMonthMetrics.spontaneous : null,
      quality: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.awarenessQuality - previousMonthMetrics.awarenessQuality : null,
      usage: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.currentUsing - previousMonthMetrics.currentUsing : null,
    },
  };

  const trendGroups = new Map();
  trendDocs.forEach((data) => {
    const monthKey = toMonthBucket(data.dateBucket);
    if (!monthKey) return;
    const existing = trendGroups.get(monthKey) || [];
    existing.push(data);
    trendGroups.set(monthKey, existing);
  });

  const monthlyTrend = Array.from(trendGroups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([monthKey, docs]) => {
      const snapshot = buildOverviewSnapshot({
        aggregate: mergeAggregateDocs(docs),
        bankIds,
        bankNames,
        selectedBankId: bankId,
      });
      const marketShare = snapshot.marketRows.find((row) => row.bankId === bankId)?.marketShare || 0;
      return {
        monthKey,
        month: monthKeyLabel(monthKey),
        awareness: snapshot.selectedMetrics?.aware || 0,
        topOfMind: snapshot.selectedMetrics?.topOfMind || 0,
        spontaneous: snapshot.selectedMetrics?.spontaneous || 0,
        usage: snapshot.selectedMetrics?.currentUsing || 0,
        nps: snapshot.selectedMetrics?.nps || 0,
        brandEdgeScore: snapshot.selectedMetrics?.brandEdgeScore || 0,
        marketShare,
      };
    });

  const previousMovementMap = new Map(
    previousMonthOverview.marketRows.map((row, index) => [row.bankId, index + 1]),
  );
  const marketRows = currentOverview.marketRows.map((row, index) => {
    const previousRank = previousMovementMap.get(row.bankId);
    return {
      ...row,
      rank: index + 1,
      movement: previousRank ? previousRank - (index + 1) : null,
    };
  });

  return {
    country: normalizedCountry,
    bankId,
    timeWindow,
    generatedAt: new Date().toISOString(),
    contract: buildAggregateContract(),
    integrity: {
      rebuildStatus: 'ready',
      coverageComplete: true,
      rebuiltAt: toIsoString(statusData.lastSuccessfulRebuildAt || statusData.rebuildCompletedAt),
    },
    sampleSize: currentOverview.sampleSize,
    statusCounts: currentOverview.statusCounts,
    flagCounts: currentOverview.flagCounts,
    selectedMetrics: currentOverview.selectedMetrics,
    marketRows,
    monthOverMonth,
    monthlyTrend,
  };
};

const listDashboardResponsesForCountry = async (country) => {
  const [selectedCountrySnapshot, legacyCountrySnapshot] = await Promise.all([
    db.collection('responses').where('selected_country', '==', country).get(),
    db.collection('responses').where('country', '==', country).get(),
  ]);

  const seenDocIds = new Set();
  const rows = [];

  [selectedCountrySnapshot, legacyCountrySnapshot].forEach((snapshot) => {
    snapshot.forEach((docSnap) => {
      if (seenDocIds.has(docSnap.id)) return;
      seenDocIds.add(docSnap.id);
      rows.push({
        ...docSnap.data(),
        _docId: docSnap.id,
      });
    });
  });

  return rows;
};

exports.submitPublicSurveyResponse = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 50,
  timeoutSeconds: 30,
  enforceAppCheck: ENFORCE_PUBLIC_SURVEY_APPCHECK,
}, async (request) => {
  const response = request.data?.response;
  const trapField = String(request.data?.trapField || '');

  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new HttpsError('invalid-argument', 'A normalized survey response payload is required.');
  }

  const responseId = String(response.response_id || '').trim();
  const deviceId = String(response.device_id || '').trim();
  const selectedCountry = String(response.country || response.selected_country || '').trim().toLowerCase();
  const status = String(response._status || '').trim();

  if (!responseId || !deviceId || !selectedCountry || !['completed', 'terminated'].includes(status)) {
    throw new HttpsError('invalid-argument', 'Survey payload is incomplete.');
  }

  const existingSnapshot = await db.collection('responses')
    .where('device_id', '==', deviceId)
    .limit(25)
    .get();

  const existingResponses = existingSnapshot.docs.map((docSnap) => docSnap.data());
  const nowIso = new Date().toISOString();
  const userAgent = String(request.rawRequest?.headers?.['user-agent'] || '');
  const isAdminSurveyTester = isAdminAuth(request.auth);
  const contextMetadata = buildSurveyContextMetadata({
    response,
    headers: request.rawRequest?.headers || {},
    nowIso,
  });
  const assessment = buildSurveyAbuseAssessment({
    response,
    existingResponses,
    trapField,
    nowIso,
    appCheckVerified: Boolean(request.app),
    userAgent,
    bypassCooldown: isAdminSurveyTester,
  });
  const monitoringMetadata = buildSubmissionMonitoringMetadata(isAdminSurveyTester);

  if (ENFORCE_PUBLIC_SURVEY_APPCHECK && !request.app) {
    logWarn('public_survey_missing_app_check', {
      responseId,
      selectedCountry,
    });
  }

  if (assessment.rejection?.code === 'cooldown_active') {
    logWarn('public_survey_submission_rejected', {
      category: 'cooldown_active',
      responseId,
      selectedCountry,
      appCheckVerified: Boolean(request.app),
    });
    throw new HttpsError('failed-precondition', assessment.rejection.message, {
      code: assessment.rejection.code,
      nextAllowedAt: assessment.rejection.nextAllowedAt,
    });
  }

  if (assessment.rejection) {
    logWarn('public_survey_submission_rejected', {
      category: assessment.rejection.code || 'abuse_detected',
      responseId,
      selectedCountry,
      appCheckVerified: Boolean(request.app),
    });
    throw new HttpsError('invalid-argument', assessment.rejection.message, {
      code: assessment.rejection.code,
    });
  }

  const payload = {
    ...response,
    ...contextMetadata,
    ...monitoringMetadata,
    submitted_at: admin.firestore.FieldValue.serverTimestamp(),
    analytics_date_bucket: toDateBucket(response.timestamp || nowIso),
    app_check_verified: Boolean(request.app),
    suspicious_submission_flag: assessment.suspiciousSignals.suspicious_submission_flag,
    repeat_submission_flag: assessment.suspiciousSignals.repeat_submission_flag,
    completion_speed_flag: assessment.suspiciousSignals.completion_speed_flag,
    duplicate_payload_flag: assessment.suspiciousSignals.duplicate_payload_flag,
    metadata_missing_flag: assessment.suspiciousSignals.metadata_missing_flag,
    submission_hash: assessment.submissionHash,
    _source: 'public_callable',
    timestamp: response.timestamp || nowIso,
  };
  const inclusion = deriveSurveyAnalyticsInclusion(payload);
  payload.response_state = inclusion.responseState;
  payload.screening_outcome = inclusion.screeningOutcome;
  payload.included_in_analytics = inclusion.includedInAnalytics;

  await db.collection('responses').add(payload);

  if (
    payload.suspicious_submission_flag
    || payload.repeat_submission_flag
    || payload.completion_speed_flag
    || payload.duplicate_payload_flag
    || payload.metadata_missing_flag
  ) {
    logWarn('public_survey_submission_flagged', {
      responseId,
      selectedCountry,
      appCheckVerified: payload.app_check_verified,
      flags: {
        suspicious_submission_flag: payload.suspicious_submission_flag,
        repeat_submission_flag: payload.repeat_submission_flag,
        completion_speed_flag: payload.completion_speed_flag,
        duplicate_payload_flag: payload.duplicate_payload_flag,
        metadata_missing_flag: payload.metadata_missing_flag,
      },
    });
  } else {
    logInfo('public_survey_submission_accepted', {
      responseId,
      selectedCountry,
      appCheckVerified: payload.app_check_verified,
      status,
      adminSurveyTester: isAdminSurveyTester,
    });
  }

  return {
    ok: true,
    responseId,
    flags: {
      suspicious_submission_flag: payload.suspicious_submission_flag,
      repeat_submission_flag: payload.repeat_submission_flag,
      completion_speed_flag: payload.completion_speed_flag,
      duplicate_payload_flag: payload.duplicate_payload_flag,
      app_check_verified: payload.app_check_verified,
    },
  };
});

exports.submitPublicFollowUpContact = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 30,
  timeoutSeconds: 30,
  enforceAppCheck: ENFORCE_PUBLIC_SURVEY_APPCHECK,
}, async (request) => {
  const normalized = normalizePublicFollowUpInput(request.data || {});
  if (!normalized.ok) {
    throw new HttpsError('invalid-argument', normalized.message, { code: normalized.code });
  }

  const {
    joinPanel,
    enterRaffle,
    country,
    deviceId,
    responseId,
    contactName,
    contactEmail,
    contactPhone,
    source,
    language,
  } = normalized.value;
  const nowIso = new Date().toISOString();
  const followUpMonitoringMetadata = buildSubmissionMonitoringMetadata(isAdminAuth(request.auth));

  if (ENFORCE_PUBLIC_SURVEY_APPCHECK && !request.app) {
    logWarn('public_follow_up_missing_app_check', {
      country,
      responseId,
      joinPanel,
      enterRaffle,
    });
  }

  if (joinPanel) {
    const panelistId = buildPanelistId(deviceId, country);
    const panelistRef = db.collection('panelists').doc(panelistId);
    await db.runTransaction(async (tx) => {
      const existingSnap = await tx.get(panelistRef);
      const existing = existingSnap.exists ? existingSnap.data() || {} : {};
      const previousCount = Number(existing.participationCount || 0);
      const previousResponseId = String(existing.lastResponseId || '').trim();
      const isDuplicateResponseSave = previousResponseId === responseId;
      const mergedOptIns = mergeFollowUpOptIns(existing, {
        panelOptIn: true,
        raffleOptIn: enterRaffle,
      });
      const lastParticipationAt = isDuplicateResponseSave
        ? String(existing.lastParticipationAt || nowIso)
        : nowIso;
      const nextEligibleAt = isDuplicateResponseSave
        ? String(existing.nextEligibleAt || buildNextEligibleAt(nowIso))
        : buildNextEligibleAt(nowIso);

      tx.set(panelistRef, {
        panelistId,
        deviceId,
        country,
        contactName,
        contactEmail,
        contactPhone,
        source,
        status: 'active',
        lastParticipationAt,
        nextEligibleAt,
        participationCount: existingSnap.exists ? (isDuplicateResponseSave ? previousCount || 1 : previousCount + 1) : 1,
        lastResponseId: responseId,
        raffleOptIn: mergedOptIns.raffleOptIn,
        panelOptIn: mergedOptIns.panelOptIn,
        language_at_submission: language,
        ...followUpMonitoringMetadata,
        createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: nowIso,
        _source: 'public_follow_up_callable',
      }, { merge: true });
    });

    const raffleEntryId = buildRaffleEntryId({ responseId, deviceId, country });
    const existingRaffleSnap = await db.collection('raffleEntries').doc(raffleEntryId).get();
    if (existingRaffleSnap.exists) {
      const mergedOptIns = mergeFollowUpOptIns(existingRaffleSnap.data() || {}, {
        panelOptIn: true,
        raffleOptIn: enterRaffle,
      });
      await db.collection('raffleEntries').doc(raffleEntryId).set({
        contactName,
        contactEmail,
        contactPhone,
        source,
        panelOptIn: mergedOptIns.panelOptIn,
        raffleOptIn: mergedOptIns.raffleOptIn,
        language_at_submission: language,
        ...followUpMonitoringMetadata,
        _source: 'public_follow_up_callable',
      }, { merge: true });
    }
  }

  if (enterRaffle) {
    const raffleEntryId = buildRaffleEntryId({ responseId, deviceId, country });
    const raffleRef = db.collection('raffleEntries').doc(raffleEntryId);
    await db.runTransaction(async (tx) => {
      const existingSnap = await tx.get(raffleRef);
      const existing = existingSnap.exists ? existingSnap.data() || {} : {};
      const mergedOptIns = mergeFollowUpOptIns(existing, {
        panelOptIn: joinPanel,
        raffleOptIn: true,
      });

      tx.set(raffleRef, {
        entryId: raffleEntryId,
        responseId,
        deviceId,
        country,
        contactName,
        contactEmail,
        contactPhone,
        source,
        raffleOptIn: mergedOptIns.raffleOptIn,
        panelOptIn: mergedOptIns.panelOptIn,
        language_at_submission: language,
        ...followUpMonitoringMetadata,
        createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        createdAtIso: existing.createdAtIso || nowIso,
        _source: 'public_follow_up_callable',
      }, { merge: true });
    });
  }

  logInfo('public_follow_up_contact_saved', {
    country,
    responseId,
    joinPanel,
    enterRaffle,
    appCheckVerified: Boolean(request.app),
  });

  return {
    ok: true,
    saved: {
      panel: joinPanel,
      raffle: enterRaffle,
      responseId,
    },
  };
});

exports.syncUserClaimsOnProfileWrite = onDocumentWritten({
  region: 'us-central1',
  document: 'users/{uid}',
}, async (event) => {
  const beforeData = event.data?.before?.exists ? event.data.before.data() : null;
  const afterData = event.data?.after?.exists ? event.data.after.data() : null;
  const { uid } = event.params;

  if (!afterData) {
    return;
  }

  if (!['admin', 'subscriber'].includes(String(afterData.role || ''))) {
    return;
  }

  const syncPlan = computeClaimsSyncPlan(beforeData, afterData);

  if (syncPlan.shouldBumpVersion) {
      await event.data.after.ref.set({
        entitlements_version: syncPlan.nextVersion,
        claimsSyncPending: true,
        claimsLastSyncError: admin.firestore.FieldValue.delete(),
        claimsLastSyncRequestedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
  }

  const syncResult = await syncClaimsForUser(uid, afterData);
  if (!syncResult.synced && syncResult.skipped) {
    return;
  }

  await event.data.after.ref.set({
    claimsSyncPending: false,
    claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    claimsLastSyncError: admin.firestore.FieldValue.delete(),
  }, { merge: true });
});

exports.adminCreateDraftSubscriber = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const email = String(request.data?.email || '').trim().toLowerCase();
  const companyName = String(request.data?.companyName || '').trim();
  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid email is required.');
  }

  const existing = await db.collection('users').where('email', '==', email).limit(1).get();
  if (!existing.empty) {
    throw new HttpsError('already-exists', 'Subscriber already exists.');
  }

  const id = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const user = {
    id,
    email,
    role: 'subscriber',
    status: 'draft',
    createdAt: now,
    companyName: companyName || email,
    assignedCountries: [],
    emailVerified: false,
    permissions: [],
    subscription_tier: 'free',
    subscription_addon_ai: false,
    ai_usage_count: 0,
    ai_usage_reset_date: now,
    entitlements_version: 1,
    createdBy: request.auth.uid,
  };

  await db.collection('users').doc(id).set(user);
  return { user };
});

exports.createFreeSubscriberSelfServe = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 30,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }

  const uid = request.auth.uid;
  const email = String(request.auth.token.email || '').trim().toLowerCase();
  const requestedCountry = normalizeCountryList([request.data?.requestedCountry])[0];
  const contactName = String(request.data?.contactName || '').trim();
  const companyName = String(request.data?.companyName || '').trim();

  if (!email || !email.includes('@')) {
    throw new HttpsError('failed-precondition', 'A verified account email is required.');
  }
  if (!requestedCountry) {
    throw new HttpsError('invalid-argument', 'A valid requested country is required.');
  }

  const userRef = db.collection('users').doc(uid);
  const existingSnap = await userRef.get();
  const existingUser = existingSnap.exists ? existingSnap.data() : null;

  if (existingUser?.role === 'admin') {
    throw new HttpsError('failed-precondition', 'Admin accounts cannot enter the free self-serve signup flow.');
  }

  const now = new Date().toISOString();
  const nextUser = {
    id: uid,
    email,
    role: 'subscriber',
    status: 'active',
    createdAt: existingUser?.createdAt || now,
    contactName: contactName || String(existingUser?.contactName || request.auth.token.name || ''),
    companyName: companyName || String(existingUser?.companyName || request.auth.token.name || email.split('@')[0]),
    requestedCountries: [requestedCountry],
    assignedCountries: [requestedCountry],
    emailVerified: Boolean(request.auth.token.email_verified),
    permissions: existingUser?.permissions || [],
    subscription_tier: 'free',
    subscription_addon_ai: false,
    ai_usage_count: Number(existingUser?.ai_usage_count || 0),
    ai_usage_reset_date: existingUser?.ai_usage_reset_date || now,
    entitlements_version: normalizeEntitlementsVersion(existingUser?.entitlements_version || 1),
    claimsSyncPending: false,
    claimsLastSyncError: admin.firestore.FieldValue.delete(),
    claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userRef.set(nextUser, { merge: true });
  await syncClaimsForUser(uid, nextUser);

  await writeAuditEvent({
    action: existingUser ? 'free_access_self_serve_updated' : 'free_access_self_serve_created',
    actorUid: uid,
    actorEmail: email,
    targetUid: uid,
    details: {
      requestedCountry,
      subscription_tier: 'free',
      status: 'active',
    },
  });

  return {
    ok: true,
    user: {
      ...nextUser,
      claimsLastSyncedAt: now,
    },
    token_refresh_required: true,
  };
});

exports.adminCreateInvite = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const userId = String(request.data?.userId || '').trim();
  const countries = normalizeCountryList(request.data?.countries || []);
  const validityDays = Number(request.data?.validityDays || 7);

  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId is required.');
  }

  if (countries.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one country must be selected.');
  }

  if (!Number.isFinite(validityDays) || validityDays < 1 || validityDays > 30) {
    throw new HttpsError('invalid-argument', 'validityDays must be between 1 and 30.');
  }

  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Subscriber draft not found.');
  }

  const user = userSnap.data() || {};
  if (String(user.role || '') !== 'subscriber') {
    throw new HttpsError('failed-precondition', 'Invite can only be created for subscriber users.');
  }

  const email = String(user.email || '').trim().toLowerCase();
  if (!email) {
    throw new HttpsError('failed-precondition', 'Subscriber email is missing.');
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
  const token = `invite_${crypto.randomBytes(18).toString('hex')}`;
  const inviteId = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const invite = {
    id: inviteId,
    token,
    userId,
    email,
    companyName: String(user.companyName || email),
    countries,
    status: 'sent',
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdBy: request.auth.uid,
  };

  await db.runTransaction(async (tx) => {
    tx.set(db.collection('invites').doc(inviteId), invite);
    tx.set(userRef, {
      assignedCountries: countries,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  });

  return {
    invite: {
      id: invite.id,
      token: invite.token,
      userId: invite.userId,
      email: invite.email,
      companyName: invite.companyName,
      countries: invite.countries,
      status: invite.status,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    },
  };
});

exports.validateInvite = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  const token = String(request.data?.token || '').trim();
  if (!token) {
    throw new HttpsError('invalid-argument', 'Invite token is required.');
  }

  const inviteMatch = await getInviteByToken(token);
  if (!inviteMatch) {
    return { valid: false, reason: 'not_found' };
  }

  const invite = inviteMatch.data;
  if (String(invite.status || '') === 'used') {
    return { valid: false, reason: 'used' };
  }

  if (String(invite.status || '') === 'expired' || isInviteExpired(invite)) {
    return { valid: false, reason: 'expired' };
  }

  return {
    valid: true,
    invite: {
      email: String(invite.email || ''),
      companyName: String(invite.companyName || ''),
      countries: normalizeCountryList(invite.countries),
      expiresAt: String(invite.expiresAt || ''),
    },
  };
});

exports.acceptInvite = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  let uid = request.auth?.uid || null;
  let inviteId = null;
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to accept an invite.');
    }

    const token = String(request.data?.token || '').trim();
    const contactName = String(request.data?.contactName || '').trim();
    const phone = String(request.data?.phone || '').trim();
    const companyName = String(request.data?.companyName || '').trim();
    const requestedCountries = normalizeCountryList(request.data?.requestedCountries || []);

    if (!token) {
      throw new HttpsError('invalid-argument', 'Invite token is required.');
    }

    if (!contactName || !phone) {
      throw new HttpsError('invalid-argument', 'Contact name and phone are required.');
    }

    const authEmail = String(request.auth.token.email || '').trim().toLowerCase();
    if (!authEmail) {
      throw new HttpsError('failed-precondition', 'Authenticated email is missing.');
    }

    const inviteMatch = await getInviteByToken(token);
    if (!inviteMatch) {
      throw new HttpsError('not-found', 'Invite not found.');
    }

    inviteId = inviteMatch.ref.id;
    const inviteData = inviteMatch.data;
    const inviteEmail = String(inviteData.email || '').trim().toLowerCase();
    if (inviteEmail !== authEmail) {
      throw new HttpsError('permission-denied', 'Invite email does not match authenticated account.');
    }

    uid = request.auth.uid;
    const userRef = db.collection('users').doc(uid);
    const inviteRef = inviteMatch.ref;
    const draftRef = inviteData.userId && inviteData.userId !== uid ? db.collection('users').doc(String(inviteData.userId)) : null;

    const now = new Date().toISOString();

    await db.runTransaction(async (tx) => {
      const latestInviteSnap = await tx.get(inviteRef);
      if (!latestInviteSnap.exists) {
        throw new HttpsError('not-found', 'Invite no longer exists.');
      }

      const latestInvite = latestInviteSnap.data() || {};
      if (String(latestInvite.status || '') === 'used') {
        throw new HttpsError('already-exists', 'Invite has already been used.');
      }

      if (String(latestInvite.status || '') === 'expired' || isInviteExpired(latestInvite)) {
        tx.set(inviteRef, { status: 'expired' }, { merge: true });
        throw new HttpsError('failed-precondition', 'Invite has expired.');
      }

      const assignedCountries = normalizeCountryList(latestInvite.countries || []);

      const existingUserSnap = await tx.get(userRef);
      const existingUser = existingUserSnap.exists ? existingUserSnap.data() : null;
      const nextEntitlementsVersion = Math.max(Number(existingUser?.entitlements_version || 0), 0) + 1;

      tx.set(userRef, {
        id: uid,
        authUid: uid,
        email: inviteEmail,
        role: 'subscriber',
        status: 'pending',
        createdAt: existingUser?.createdAt || now,
        updatedAt: now,
        companyName: companyName || String(latestInvite.companyName || inviteEmail),
        assignedCountries,
        requestedCountries: requestedCountries.length ? requestedCountries : assignedCountries,
        contactName,
        phone,
        emailVerified: Boolean(request.auth.token.email_verified),
        permissions: existingUser?.permissions || [],
        subscription_tier: existingUser?.subscription_tier || 'free',
        subscription_addon_ai: Boolean(existingUser?.subscription_addon_ai || false),
        ai_usage_count: Number(existingUser?.ai_usage_count || 0),
        ai_usage_reset_date: existingUser?.ai_usage_reset_date || now,
        entitlements_version: nextEntitlementsVersion,
        claimsSyncPending: true,
        acceptedInviteId: inviteRef.id,
      }, { merge: true });

      tx.set(inviteRef, {
        status: 'used',
        usedAt: now,
        acceptedUid: uid,
        requestedCountries: requestedCountries.length ? requestedCountries : assignedCountries,
        companyName: companyName || String(latestInvite.companyName || inviteEmail),
        contactName,
        phone,
      }, { merge: true });

      if (draftRef) {
        const draftSnap = await tx.get(draftRef);
        if (draftSnap.exists) {
          tx.set(draftRef, {
            migratedToUid: uid,
            migratedAt: now,
          }, { merge: true });
        }
      }
    });

    let claimsSynced = false;
    try {
      const finalUserSnap = await userRef.get();
      const finalUserData = finalUserSnap.data() || {};
      await syncClaimsForUser(uid, finalUserData);
      claimsSynced = true;
      await userRef.set({
        claimsSyncPending: false,
        claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        claimsLastSyncError: admin.firestore.FieldValue.delete(),
      }, { merge: true });
    } catch (error) {
      logWarn('invite_accept_claims_sync_deferred', {
        uid,
        inviteId,
        category: classifyOpsError(error),
        error: toLoggableError(error),
      });
      await userRef.set({
        claimsSyncPending: true,
        claimsLastSyncError: String(error?.message || error),
        claimsLastSyncAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    logInfo('invite_accept_succeeded', {
      uid,
      inviteId,
      requestedCountriesCount: requestedCountries.length,
      claimsSynced,
    });

    return {
      ok: true,
      subscriber_state: 'pending',
      claims_synced: claimsSynced,
    };
  } catch (error) {
    logWarn('invite_accept_failed', {
      uid,
      inviteId,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
});

const applySubscriberCommand = async ({
  request,
  commandName,
  action,
  buildChange,
}) => {
  try {
    if (!request.auth || !isAdminCaller(request.auth)) {
      throw new HttpsError('permission-denied', 'Admin access is required.');
    }

    const uid = String(request.data?.uid || '').trim();
    if (!uid) {
      throw new HttpsError('invalid-argument', 'uid is required.');
    }

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Subscriber not found.');
    }

    const beforeData = userSnap.data() || {};
    if (String(beforeData.role || '') !== 'subscriber') {
      throw new HttpsError('failed-precondition', `${commandName} can only target subscriber users.`);
    }

    let change;
    try {
      change = buildChange(beforeData);
    } catch (error) {
      const message = String(error?.message || '');
      if (message === 'invalid_status' || message === 'invalid_tier') {
        throw new HttpsError('invalid-argument', message);
      }
      if (message === 'ai_requires_standard_tier') {
        throw new HttpsError('failed-precondition', 'AI add-on requires Standard tier.');
      }
      throw error;
    }

    const updates = {
      ...change.updates,
      updatedAt: new Date().toISOString(),
      claimsSyncPending: true,
      claimsLastSyncError: admin.firestore.FieldValue.delete(),
    };

    await userRef.set(updates, { merge: true });
    await writeAuditEvent({
      action,
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email,
      targetUid: uid,
      details: {
        command: commandName,
        ...change.audit,
      },
    });

    logInfo('subscriber_entitlement_command_succeeded', {
      commandName,
      actorUid: request.auth.uid,
      targetUid: uid,
      category: 'entitlement_change',
    });

    return {
      ok: true,
      uid,
      claims_sync_pending: true,
      token_refresh_required: true,
    };
  } catch (error) {
    logWarn('subscriber_entitlement_command_failed', {
      commandName,
      actorUid: request.auth?.uid || null,
      targetUid: String(request.data?.uid || '').trim() || null,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
};

exports.updateSubscriberStatus = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => applySubscriberCommand({
  request,
  commandName: 'updateSubscriberStatus',
  action: 'subscriber_status_updated',
  buildChange: (beforeData) => buildStatusUpdate(beforeData, request.data?.status),
}));

exports.updateSubscriberTier = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => applySubscriberCommand({
  request,
  commandName: 'updateSubscriberTier',
  action: 'subscriber_tier_updated',
  buildChange: (beforeData) => buildTierUpdate(beforeData, request.data?.subscription_tier),
}));

exports.updateSubscriberCountries = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => applySubscriberCommand({
  request,
  commandName: 'updateSubscriberCountries',
  action: 'subscriber_countries_updated',
  buildChange: (beforeData) => buildCountriesUpdate(beforeData, request.data?.assignedCountries),
}));

exports.updateSubscriberAiAddon = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => applySubscriberCommand({
  request,
  commandName: 'updateSubscriberAiAddon',
  action: 'subscriber_ai_addon_updated',
  buildChange: (beforeData) => buildAiAddonUpdate(beforeData, request.data?.subscription_addon_ai),
}));

exports.logAuditEvent = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const action = String(request.data?.action || '').trim();
  if (!action) {
    throw new HttpsError('invalid-argument', 'action is required.');
  }

  await writeAuditEvent({
    action,
    actorUid: request.auth.uid,
    actorEmail: request.data?.actorEmail,
    targetUid: request.data?.targetId,
    details: request.data?.details,
  });
  return { ok: true };
});

exports.logSurveyTelemetryEvent = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 80,
  timeoutSeconds: 20,
  enforceAppCheck: ENFORCE_PUBLIC_SURVEY_APPCHECK,
}, async (request) => {
  const normalized = normalizeSurveyTelemetryEvent(request.data || {});
  if (!normalized.ok) {
    throw new HttpsError('invalid-argument', normalized.message);
  }

  const event = normalized.value;
  const nowIso = new Date().toISOString();
  const sessionRef = db.collection(SURVEY_SESSIONS_COLLECTION).doc(event.sessionId);

  await db.collection(SURVEY_TELEMETRY_COLLECTION).add({
    ...event,
    recordedAt: nowIso,
    userAgent: String(request.rawRequest?.headers?.['user-agent'] || '').slice(0, 300),
    appCheckVerified: Boolean(request.app),
    authUid: request.auth?.uid || null,
  });

  const sessionPatch = {
    sessionId: event.sessionId,
    country: event.country || null,
    language: event.language || null,
    responseId: event.responseId || null,
    lastEventType: event.eventType,
    lastEventAt: nowIso,
    lastQuestionId: event.questionId || null,
    lastQuestionType: event.questionType || null,
    lastElapsedSeconds: event.elapsedSeconds,
    appCheckVerified: Boolean(request.app),
    updatedAt: nowIso,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    eventCount: admin.firestore.FieldValue.increment(1),
  };

  if (event.eventType === 'survey_session_started') {
    sessionPatch.startedAt = nowIso;
    sessionPatch.started = true;
    sessionPatch.status = 'started';
  }
  if (event.eventType === 'survey_submitted') {
    sessionPatch.submittedAt = nowIso;
    sessionPatch.submitted = true;
    sessionPatch.status = 'submitted';
  }
  if (event.eventType === 'survey_abandoned') {
    sessionPatch.abandonedAt = nowIso;
    sessionPatch.abandoned = true;
    sessionPatch.status = 'abandoned';
  }

  await sessionRef.set(sessionPatch, { merge: true });
  return { ok: true, recordedAt: nowIso };
});

exports.getSurveyFunnelAudit = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const requestedCountry = normalizeCountry(request.data?.country);
  const inactivityMinutes = Math.max(10, Number(request.data?.inactivityMinutes || 30));
  const inactivityThresholdMs = inactivityMinutes * 60 * 1000;

  const [sessionsSnapshot, eventsSnapshot, responsesSnapshot] = await Promise.all([
    requestedCountry
      ? db.collection(SURVEY_SESSIONS_COLLECTION).where('country', '==', requestedCountry).get()
      : db.collection(SURVEY_SESSIONS_COLLECTION).get(),
    requestedCountry
      ? db.collection(SURVEY_TELEMETRY_COLLECTION).where('country', '==', requestedCountry).get()
      : db.collection(SURVEY_TELEMETRY_COLLECTION).get(),
    requestedCountry
      ? db.collection('responses').where('selected_country', '==', requestedCountry).get()
      : db.collection('responses').get(),
  ]);

  const sessions = sessionsSnapshot.docs.map((docSnap) => docSnap.data() || {});
  const events = eventsSnapshot.docs.map((docSnap) => docSnap.data() || {});
  const responses = responsesSnapshot.docs.map((docSnap) => docSnap.data() || {});
  const viewedByQuestion = new Map();
  const answeredByQuestion = new Map();
  const skippedByQuestion = new Map();
  const droppedByQuestion = new Map();
  const elapsedByQuestion = new Map();

  events.forEach((event) => {
    const questionId = String(event.questionId || '').trim();
    if (!questionId) return;

    if (event.eventType === 'question_viewed') {
      viewedByQuestion.set(questionId, Number(viewedByQuestion.get(questionId) || 0) + 1);
    }
    if (event.eventType === 'question_answered') {
      answeredByQuestion.set(questionId, Number(answeredByQuestion.get(questionId) || 0) + 1);
    }
    if (event.eventType === 'question_skipped') {
      skippedByQuestion.set(questionId, Number(skippedByQuestion.get(questionId) || 0) + 1);
    }
    if ((event.eventType === 'question_answered' || event.eventType === 'question_skipped') && Number.isFinite(Number(event.elapsedSeconds))) {
      const elapsedValues = elapsedByQuestion.get(questionId) || [];
      elapsedValues.push(Number(event.elapsedSeconds));
      elapsedByQuestion.set(questionId, elapsedValues);
    }
  });

  sessions.forEach((session) => {
    if (!session.abandonedAt && !isTelemetrySessionAbandoned(session, inactivityThresholdMs)) return;
    const questionId = String(session.lastQuestionId || '').trim();
    if (!questionId) return;
    droppedByQuestion.set(questionId, Number(droppedByQuestion.get(questionId) || 0) + 1);
  });

  const totalStarts = sessions.filter((session) => session.startedAt || session.started).length;
  const totalSubmissions = sessions.filter((session) => session.submittedAt || session.submitted).length;
  const completionRate = totalStarts > 0 ? totalSubmissions / totalStarts : 0;
  const questionIds = Array.from(new Set([
    ...viewedByQuestion.keys(),
    ...answeredByQuestion.keys(),
    ...skippedByQuestion.keys(),
    ...droppedByQuestion.keys(),
  ]));

  const questionSummary = questionIds.map((questionId) => {
    const viewed = Number(viewedByQuestion.get(questionId) || 0);
    const skipped = Number(skippedByQuestion.get(questionId) || 0);
    const dropped = Number(droppedByQuestion.get(questionId) || 0);
    const elapsedValues = elapsedByQuestion.get(questionId) || [];
    const averageElapsedSeconds = elapsedValues.length > 0
      ? elapsedValues.reduce((sum, value) => sum + value, 0) / elapsedValues.length
      : 0;
    return {
      question_id: questionId,
      viewed,
      answered: Number(answeredByQuestion.get(questionId) || 0),
      skipped,
      dropped,
      drop_off_rate: viewed > 0 ? dropped / viewed : 0,
      skip_rate: viewed > 0 ? skipped / viewed : 0,
      average_elapsed_seconds: averageElapsedSeconds,
    };
  }).sort((left, right) => right.drop_off_rate - left.drop_off_rate);

  const submittedResponses = responses.filter((response) => String(response._status || '') === 'completed');
  const demographicCompletion = ['b2_age', 'e1_employment', 'e2_education', 'e3_gender'].map((field) => {
    const answered = submittedResponses.filter((response) => {
      const value = String(response[field] || '').trim();
      return value.length > 0 && value !== 'prefer_not_to_say';
    }).length;
    const preferNotToSay = submittedResponses.filter((response) => String(response[field] || '').trim() === 'prefer_not_to_say').length;
    return {
      field,
      answered,
      prefer_not_to_say: preferNotToSay,
      completion_rate: submittedResponses.length > 0 ? answered / submittedResponses.length : 0,
    };
  });

  return {
    ok: true,
    country: requestedCountry,
    total_starts: totalStarts,
    total_submissions: totalSubmissions,
    completion_rate: completionRate,
    drop_off_by_question: questionSummary.map((item) => ({
      question_id: item.question_id,
      dropped: item.dropped,
      viewed: item.viewed,
      drop_off_rate: item.drop_off_rate,
    })),
    average_time_per_question: questionSummary.map((item) => ({
      question_id: item.question_id,
      average_elapsed_seconds: item.average_elapsed_seconds,
    })),
    skip_rate_by_question: questionSummary.map((item) => ({
      question_id: item.question_id,
      skipped: item.skipped,
      viewed: item.viewed,
      skip_rate: item.skip_rate,
    })),
    demographic_completion: demographicCompletion,
    problematic_questions: questionSummary.filter((item) =>
      item.drop_off_rate >= 0.2 || item.skip_rate >= 0.2 || item.average_elapsed_seconds >= 30,
    ),
    abandonment_proxy: {
      method: 'stale_started_session_without_submission',
      inactivity_minutes: inactivityMinutes,
    },
  };
});

exports.repairMyAdminClaims = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    const userRef = db.collection('users').doc(request.auth.uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Canonical user profile not found.');
    }

    const userData = userSnap.data() || {};
    if (!isCanonicalAdminProfile(userData)) {
      throw new HttpsError('permission-denied', 'Only canonical admin profiles can repair admin claims.');
    }

    const effectiveUserData = {
      ...userData,
      entitlements_version: normalizeEntitlementsVersion(userData.entitlements_version),
    };

    await syncClaimsForUser(request.auth.uid, effectiveUserData);
    await userRef.set({
      entitlements_version: effectiveUserData.entitlements_version,
      claimsSyncPending: false,
      claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      claimsLastSyncError: admin.firestore.FieldValue.delete(),
    }, { merge: true });

    await writeAuditEvent({
      action: 'admin_claims_repaired',
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email,
      targetUid: request.auth.uid,
      details: {
        role: userData.role,
        entitlements_version: effectiveUserData.entitlements_version,
      },
    });

    logInfo('admin_claim_repair_succeeded', {
      uid: request.auth.uid,
      entitlementsVersion: effectiveUserData.entitlements_version,
    });

    return {
      ok: true,
      uid: request.auth.uid,
      role: 'admin',
      token_refresh_required: true,
    };
  } catch (error) {
    logWarn('admin_claim_repair_failed', {
      uid: request.auth?.uid || null,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
});

exports.bootstrapAdminClaims = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    const [userSnap, bootstrapSnap] = await Promise.all([
      db.collection('users').doc(request.auth.uid).get(),
      db.collection('config').doc('bootstrap').get(),
    ]);

    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Canonical user profile not found.');
    }
    if (!bootstrapSnap.exists) {
      throw new HttpsError('failed-precondition', 'Bootstrap admin marker not found.');
    }

    const userData = userSnap.data() || {};
    const bootstrapData = bootstrapSnap.data() || {};

    if (!canBootstrapAdminClaims({ auth: request.auth, userData, bootstrapData })) {
      throw new HttpsError('permission-denied', 'Caller is not allowed to bootstrap admin claims.');
    }

    const claims = buildClaimsPayload(userData);
    await admin.auth().setCustomUserClaims(request.auth.uid, claims);
    await userSnap.ref.set({
      claimsSyncPending: false,
      claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      claimsLastSyncError: admin.firestore.FieldValue.delete(),
    }, { merge: true });

    await writeAuditEvent({
      action: 'admin_claims_bootstrapped',
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email,
      targetUid: request.auth.uid,
      details: {
        bootstrapAdminId: bootstrapData.adminId || null,
        bootstrapEmail: bootstrapData.email || null,
      },
    });

    logInfo('admin_claim_bootstrap_succeeded', {
      uid: request.auth.uid,
      bootstrapAdminId: bootstrapData.adminId || null,
    });

    return {
      ok: true,
      uid: request.auth.uid,
      role: 'admin',
      token_refresh_required: true,
    };
  } catch (error) {
    logWarn('admin_claim_bootstrap_failed', {
      uid: request.auth?.uid || null,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
});

exports.syncUserClaimsNow = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth || !isAdminCaller(request.auth)) {
      throw new HttpsError('permission-denied', 'Admin access is required.');
    }

    const uid = String(request.data?.uid || '').trim();
    if (!uid) {
      throw new HttpsError('invalid-argument', 'uid is required.');
    }

    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'Canonical user profile not found.');
    }

    const userData = userSnap.data() || {};
    const effectiveUserData = {
      ...userData,
      entitlements_version: normalizeEntitlementsVersion(userData.entitlements_version),
    };

    const syncResult = await syncClaimsForUser(uid, effectiveUserData);
    if (!syncResult.synced && syncResult.skipped) {
      throw new HttpsError('failed-precondition', 'Target auth user does not exist.');
    }

    await userSnap.ref.set({
      entitlements_version: effectiveUserData.entitlements_version,
      claimsSyncPending: false,
      claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      claimsLastSyncError: admin.firestore.FieldValue.delete(),
    }, { merge: true });

    await writeAuditEvent({
      action: 'user_claims_synced_now',
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email,
      targetUid: uid,
      details: {
        role: userData.role || null,
        entitlements_version: effectiveUserData.entitlements_version,
      },
    });

    logInfo('user_claim_sync_succeeded', {
      actorUid: request.auth.uid,
      targetUid: uid,
    });

    return {
      ok: true,
      uid,
      token_refresh_required: true,
    };
  } catch (error) {
    logWarn('user_claim_sync_failed', {
      actorUid: request.auth?.uid || null,
      targetUid: String(request.data?.uid || '').trim() || null,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
});

exports.listSubscriptionPlansAdmin = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth || !isAdminCaller(request.auth)) {
      throw new HttpsError('permission-denied', 'Admin access is required.');
    }

    const plans = await listPlans(db);
    logInfo('subscription_plan_list_succeeded', {
      actorUid: request.auth.uid,
      planCount: plans.length,
    });
    return { plans };
  } catch (error) {
    logWarn('subscription_plan_list_failed', {
      actorUid: request.auth?.uid || null,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
});

exports.initializeDefaultSubscriptionPlans = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth || !isAdminCaller(request.auth)) {
      throw new HttpsError('permission-denied', 'Admin access is required.');
    }

    const result = await initializeDefaultPlans(db);
    await writeAuditEvent({
      action: 'subscription_plan_defaults_seeded',
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email,
      details: {
        initialized: result.initialized,
        count: result.plans.length,
        planIds: result.plans.map((plan) => plan.id),
      },
    });

    logInfo('subscription_plan_initialize_succeeded', {
      actorUid: request.auth.uid,
      initialized: result.initialized,
      planCount: result.plans.length,
    });

    return result;
  } catch (error) {
    logWarn('subscription_plan_initialize_failed', {
      actorUid: request.auth?.uid || null,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
});

exports.saveSubscriptionPlan = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth || !isAdminCaller(request.auth)) {
      throw new HttpsError('permission-denied', 'Admin access is required.');
    }

    const plan = request.data?.plan;
    const planId = String(plan?.id || '').trim();
    if (!plan || typeof plan !== 'object' || !planId) {
      throw new HttpsError('invalid-argument', 'A valid subscription plan payload is required.');
    }

    const previousSnap = await db.collection('subscriptionPlans').doc(planId).get();
    const previousPlan = previousSnap.exists ? previousSnap.data() : null;
    const savedPlan = await upsertPlan(db, plan);

    await writeAuditEvent({
      action: previousPlan ? 'subscription_plan_updated' : 'subscription_plan_created',
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email,
      targetUid: planId,
      details: {
        before: previousPlan,
        after: savedPlan,
      },
    });

    logInfo('subscription_plan_save_succeeded', {
      actorUid: request.auth.uid,
      planId,
      operation: previousPlan ? 'update' : 'create',
    });

    return { ok: true, plan: savedPlan };
  } catch (error) {
    logWarn('subscription_plan_save_failed', {
      actorUid: request.auth?.uid || null,
      planId: String(request.data?.plan?.id || '').trim() || null,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
});

exports.deleteSubscriptionPlan = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth || !isAdminCaller(request.auth)) {
      throw new HttpsError('permission-denied', 'Admin access is required.');
    }

    const planId = String(request.data?.planId || '').trim();
    if (!planId) {
      throw new HttpsError('invalid-argument', 'planId is required.');
    }

    const previousSnap = await db.collection('subscriptionPlans').doc(planId).get();
    if (!previousSnap.exists) {
      throw new HttpsError('not-found', 'Subscription plan not found.');
    }

    const previousPlan = previousSnap.data();
    await deletePlan(db, planId);

    await writeAuditEvent({
      action: 'subscription_plan_deleted',
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email,
      targetUid: planId,
      details: {
        before: previousPlan,
      },
    });

    logInfo('subscription_plan_delete_succeeded', {
      actorUid: request.auth.uid,
      planId,
    });

    return { ok: true, planId };
  } catch (error) {
    logWarn('subscription_plan_delete_failed', {
      actorUid: request.auth?.uid || null,
      planId: String(request.data?.planId || '').trim() || null,
      category: classifyOpsError(error),
      error: toLoggableError(error),
    });
    throw error;
  }
});

const migrateLegacyUserRecordInternal = async ({ legacyDocId, actorUid, actorEmail }) => {
  const legacyRef = db.collection('users').doc(legacyDocId);
  const legacySnap = await legacyRef.get();
  if (!legacySnap.exists) {
    throw new HttpsError('not-found', 'Legacy user record not found.');
  }

  const legacyData = legacySnap.data() || {};
  const canonicalUid = String(legacyData.authUid || '').trim();
  if (!canonicalUid || canonicalUid === legacyDocId) {
    throw new HttpsError('failed-precondition', 'This record does not have a separate canonical UID target.');
  }

  const canonicalRef = db.collection('users').doc(canonicalUid);
  const canonicalSnap = await canonicalRef.get();
  const canonicalData = canonicalSnap.exists ? canonicalSnap.data() || {} : null;

  if (
    canonicalData
    && legacyData.email
    && canonicalData.email
    && String(legacyData.email).trim().toLowerCase() !== String(canonicalData.email).trim().toLowerCase()
  ) {
    logWarn('legacy_user_migration_conflict', {
      actorUid,
      legacyDocId,
      canonicalUid,
      category: 'migration_conflict',
    });
    throw new HttpsError('failed-precondition', 'Canonical UID target exists with a different email and requires manual review.');
  }

  const nowIso = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    const legacyCheck = await tx.get(legacyRef);
    if (!legacyCheck.exists) {
      throw new HttpsError('not-found', 'Legacy user record no longer exists.');
    }

    const freshLegacyData = legacyCheck.data() || {};
    const targetRef = db.collection('users').doc(canonicalUid);
    const canonicalCheck = await tx.get(targetRef);
    const existingCanonical = canonicalCheck.exists ? canonicalCheck.data() || {} : null;

    if (
      existingCanonical
      && freshLegacyData.email
      && existingCanonical.email
      && String(freshLegacyData.email).trim().toLowerCase() !== String(existingCanonical.email).trim().toLowerCase()
    ) {
      logWarn('legacy_user_migration_conflict', {
        actorUid,
        legacyDocId,
        canonicalUid,
        category: 'migration_conflict',
      });
      throw new HttpsError('failed-precondition', 'Canonical UID target changed and now requires manual review.');
    }

    const targetPatch = buildCanonicalUserPatch({
      legacyDocId,
      legacyData: freshLegacyData,
      canonicalUid,
      nowIso,
      existingCanonicalData: existingCanonical,
    });

    tx.set(targetRef, targetPatch, { merge: true });
    tx.set(legacyRef, {
      migratedToUid: canonicalUid,
      migratedAt: nowIso,
      legacyMigrationStatus: existingCanonical ? 'shadowed' : 'migrated',
      legacyCanonicalUid: canonicalUid,
      claimsSyncPending: false,
    }, { merge: true });
  });

  await writeAuditEvent({
    action: 'legacy_user_record_migrated',
    actorUid,
    actorEmail,
    targetUid: canonicalUid,
    details: {
      legacyDocId,
      canonicalUid,
    },
  });

  logInfo('legacy_user_migration_succeeded', {
    actorUid,
    legacyDocId,
    canonicalUid,
    migrationStatus: canonicalData ? 'shadowed' : 'migrated',
  });

  return {
    legacyDocId,
    canonicalUid,
    migrationStatus: canonicalData ? 'shadowed' : 'migrated',
  };
};

exports.scanLegacyUserRecords = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const snapshot = await db.collection('users').get();
  const records = snapshot.docs.map((docSnap) => ({
    docId: docSnap.id,
    data: docSnap.data() || {},
  }));

  return {
    ok: true,
    ...scanLegacyUserRecords(records),
  };
});

exports.migrateLegacyUserRecord = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const legacyDocId = String(request.data?.legacyDocId || '').trim();
  if (!legacyDocId) {
    throw new HttpsError('invalid-argument', 'legacyDocId is required.');
  }

  const result = await migrateLegacyUserRecordInternal({
    legacyDocId,
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email,
  });

  return { ok: true, ...result };
});

exports.migrateSafeLegacyUserRecords = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 60,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const snapshot = await db.collection('users').get();
  const report = scanLegacyUserRecords(snapshot.docs.map((docSnap) => ({
    docId: docSnap.id,
    data: docSnap.data() || {},
  })));

  const safeRecords = report.records.filter((record) => record.safeToMigrate);
  const migrated = [];

  for (const record of safeRecords) {
    const result = await migrateLegacyUserRecordInternal({
      legacyDocId: record.docId,
      actorUid: request.auth.uid,
      actorEmail: request.auth.token.email,
    });
    migrated.push(result);
  }

  await writeAuditEvent({
    action: 'legacy_user_records_batch_migrated',
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email,
    details: {
      migratedCount: migrated.length,
      migratedLegacyDocIds: migrated.map((item) => item.legacyDocId),
    },
  });

  return {
    ok: true,
    migrated,
    migratedCount: migrated.length,
    skippedCount: report.records.length - migrated.length,
  };
});

exports.aggregateResponseAnalyticsOnWrite = onDocumentWritten({
  region: 'us-central1',
  document: 'responses/{responseId}',
}, async (event) => {
  const beforeData = event.data?.before?.exists ? event.data.before.data() : null;
  const afterData = event.data?.after?.exists ? event.data.after.data() : null;
  const targets = new Map();

  [
    { country: responseCountry(beforeData), dateBucket: responseDateBucket(beforeData) },
    { country: responseCountry(afterData), dateBucket: responseDateBucket(afterData) },
  ].forEach((target) => {
    if (!target.country || !target.dateBucket) return;
    targets.set(`${target.country}__${target.dateBucket}`, target);
  });

  if (targets.size === 0) return;

  await Promise.all(Array.from(targets.values()).map(async (target) => {
    try {
      await rebuildAnalyticsBucket(target);
      await analyticsStatusRef(target.country).set({
        country: target.country,
        aggregateSchemaVersion: AGGREGATE_SCHEMA_VERSION,
        methodologyVersion: METHODOLOGY_VERSION,
        methodology_version: METHODOLOGY_VERSION,
        supportedMetrics: SUPPORTED_METRICS,
        supportedFilters: SUPPORTED_FILTERS,
        supportedModules: SUPPORTED_MODULES,
        supportedCompareMetrics: SUPPORTED_COMPARE_METRICS,
        lastIncrementalRefreshAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      logError('response_analytics_aggregate_failed', {
        category: classifyOpsError(error),
        country: target.country,
        dateBucket: target.dateBucket,
        error: toLoggableError(error),
      });
      throw error;
    }
  }));
});

exports.getDashboardOverviewAggregate = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    const country = normalizeCountry(request.data?.country);
    const bankId = String(request.data?.bankId || '').trim();
    const timeWindow = ['30d', '90d', '12m', 'all'].includes(String(request.data?.timeWindow || ''))
      ? String(request.data?.timeWindow)
      : 'all';

    if (!country || !bankId) {
      throw new HttpsError('invalid-argument', 'country and bankId are required.');
    }

    if (isAdminCaller(request.auth)) {
      return { ok: true, aggregate: await summarizeOverviewForCountry({ country, bankId, timeWindow }) };
    }

    const callerRole = String(request.auth.token.role || '').trim();
    if (callerRole !== 'subscriber') {
      throw new HttpsError('permission-denied', 'Subscriber access is required.');
    }

    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};
    const assignedCountries = normalizeCountryList(userData.assignedCountries || []);
    if (!assignedCountries.includes(country)) {
      throw new HttpsError('permission-denied', 'You do not have access to this country.');
    }

    return { ok: true, aggregate: await summarizeOverviewForCountry({ country, bankId, timeWindow }) };
  } catch (error) {
    logWarn('dashboard_overview_aggregate_failed', {
      actorUid: request.auth?.uid || null,
      category: classifyOpsError(error),
      country: normalizeCountry(request.data?.country),
      bankId: String(request.data?.bankId || '').trim() || null,
      error: toLoggableError(error),
    });
    throw error;
  }
});

exports.listDashboardResponses = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication is required.');
    }

    const country = normalizeCountry(request.data?.country);
    if (!country) {
      throw new HttpsError('invalid-argument', 'country is required.');
    }

    if (isAdminCaller(request.auth)) {
      return { ok: true, responses: await listDashboardResponsesForCountry(country) };
    }

    const callerRole = String(request.auth.token.role || '').trim();
    if (callerRole !== 'subscriber') {
      throw new HttpsError('permission-denied', 'Subscriber access is required.');
    }

    const userSnap = await db.collection('users').doc(request.auth.uid).get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};
    const assignedCountries = normalizeCountryList(userData.assignedCountries || []);
    if (!assignedCountries.includes(country)) {
      throw new HttpsError('permission-denied', 'You do not have access to this country.');
    }

    return { ok: true, responses: await listDashboardResponsesForCountry(country) };
  } catch (error) {
    logWarn('dashboard_response_list_failed', {
      actorUid: request.auth?.uid || null,
      category: classifyOpsError(error),
      country: normalizeCountry(request.data?.country),
      error: toLoggableError(error),
    });
    throw error;
  }
});

exports.rebuildDashboardAggregates = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 5,
  timeoutSeconds: 60,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const requestedCountry = normalizeCountry(request.data?.country);
  if (!requestedCountry) {
    throw new HttpsError('invalid-argument', 'country is required for bounded aggregate rebuilds.');
  }

  const rawCursor = String(request.data?.cursor || '').trim();
  const parsedCursor = Number.parseInt(rawCursor || '0', 10);
  const cursor = Number.isFinite(parsedCursor) && parsedCursor >= 0 ? parsedCursor : 0;
  const requestedMaxBuckets = Number(request.data?.maxBuckets || 20);
  const maxBuckets = Number.isFinite(requestedMaxBuckets)
    ? Math.max(1, Math.min(25, Math.trunc(requestedMaxBuckets)))
    : 20;

  const allBuckets = await listAnalyticsBucketsForCountry(requestedCountry);
  const bucketSlice = allBuckets.slice(cursor, cursor + maxBuckets);

  await analyticsStatusRef(requestedCountry).set({
    country: requestedCountry,
    aggregateSchemaVersion: AGGREGATE_SCHEMA_VERSION,
    methodologyVersion: METHODOLOGY_VERSION,
    methodology_version: METHODOLOGY_VERSION,
    supportedMetrics: SUPPORTED_METRICS,
    supportedFilters: SUPPORTED_FILTERS,
    supportedModules: SUPPORTED_MODULES,
    supportedCompareMetrics: SUPPORTED_COMPARE_METRICS,
    rebuildStatus: 'rebuilding',
    coverageComplete: false,
    rebuildStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    rebuiltBucketCount: cursor,
    totalBuckets: allBuckets.length,
    source: 'admin_rebuild',
  }, { merge: true });

  let rebuilt = 0;
  for (const dateBucket of bucketSlice) {
    await rebuildAnalyticsBucket({ country: requestedCountry, dateBucket, includeLegacyFallback: true });
    rebuilt += 1;
  }

  const nextCursor = cursor + rebuilt;
  const hasMore = nextCursor < allBuckets.length;

  await analyticsStatusRef(requestedCountry).set({
    country: requestedCountry,
    aggregateSchemaVersion: AGGREGATE_SCHEMA_VERSION,
    methodologyVersion: METHODOLOGY_VERSION,
    methodology_version: METHODOLOGY_VERSION,
    supportedMetrics: SUPPORTED_METRICS,
    supportedFilters: SUPPORTED_FILTERS,
    supportedModules: SUPPORTED_MODULES,
    supportedCompareMetrics: SUPPORTED_COMPARE_METRICS,
    rebuildStatus: hasMore ? 'rebuilding' : 'ready',
    coverageComplete: !hasMore,
    rebuiltBucketCount: nextCursor,
    totalBuckets: allBuckets.length,
    lastRebuildChunkAt: admin.firestore.FieldValue.serverTimestamp(),
    rebuildCompletedAt: hasMore ? admin.firestore.FieldValue.delete() : admin.firestore.FieldValue.serverTimestamp(),
    lastSuccessfulRebuildAt: hasMore ? admin.firestore.FieldValue.delete() : admin.firestore.FieldValue.serverTimestamp(),
    source: 'admin_rebuild',
  }, { merge: true });

  await writeAuditEvent({
    action: 'dashboard_aggregates_rebuilt',
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email,
    details: {
      country: requestedCountry,
      cursor,
      maxBuckets,
      rebuiltBuckets: rebuilt,
      totalBuckets: allBuckets.length,
      hasMore,
    },
  });

  return {
    ok: true,
    country: requestedCountry,
    rebuiltBuckets: rebuilt,
    totalBuckets: allBuckets.length,
    nextCursor: hasMore ? String(nextCursor) : null,
    hasMore,
    remainingBuckets: Math.max(allBuckets.length - nextCursor, 0),
  };
});

const deleteCollectionDocs = async (collectionName) => {
  let deleted = 0;
  while (true) {
    const snapshot = await db.collection(collectionName).limit(200).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    deleted += snapshot.size;
  }
  return deleted;
};

exports.resetSurveyAnalyticsData = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 2,
  timeoutSeconds: 120,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const confirmation = String(request.data?.confirmText || '').trim();
  if (confirmation !== 'RESET SURVEY DATA') {
    throw new HttpsError('failed-precondition', 'Explicit confirmation text is required.');
  }

  const clearResponses = Boolean(request.data?.clearResponses);
  const clearAggregates = Boolean(request.data?.clearAggregates);
  if (!clearResponses && !clearAggregates) {
    throw new HttpsError('invalid-argument', 'At least one reset target must be selected.');
  }

  const deletedResponses = clearResponses ? await deleteCollectionDocs('responses') : 0;
  const deletedAggregates = clearAggregates ? await deleteCollectionDocs(RESPONSE_ANALYTICS_COLLECTION) : 0;

  await writeAuditEvent({
    action: 'survey_analytics_data_reset',
    actorUid: request.auth.uid,
    actorEmail: request.auth.token.email,
    details: {
      clearResponses,
      clearAggregates,
      deletedResponses,
      deletedAggregates,
    },
  });

  return {
    ok: true,
    deletedResponses,
    deletedAggregates,
  };
});

// ---------------------------------------------------------------------------
// Awareness Insight Report helpers
// ---------------------------------------------------------------------------

const AWARENESS_REQUIRED_SECTIONS = [
  'Market Awareness Position',
  'Awareness Funnel',
  'Competitive Landscape',
  'Future Consideration',
  'Strategic Implications',
];

const buildAwarenessSystemPrompt = () =>
  'You are a brand analytics advisor for a bank executive. ' +
  'Analyze only the awareness metrics provided below. ' +
  'Do not introduce data not listed in this snapshot. ' +
  'If a metric value is null or listed as unavailable, say so explicitly — do not substitute estimates. ' +
  'Use ## headings for each of the 5 required sections. Use bullet points. Maximum 600 words.';

const buildAwarenessUserPrompt = (payload) => {
  const m = payload.metrics || {};
  const f = payload.funnel || {};
  const lines = [
    payload.sampleSize > 0 && payload.sampleSize < 30
      ? `NOTE: Limited sample (n=${payload.sampleSize}). Treat all findings as indicative only.`
      : null,
    `Country: ${payload.country}`,
    `Period: ${payload.period}`,
    `Bank: ${payload.bankName} (${payload.bankId})`,
    payload.compareBankName ? `Compare bank: ${payload.compareBankName}` : null,
    `Sample size: n=${payload.sampleSize}`,
    '',
    '## Awareness Metrics',
    `Top of Mind: ${m.topOfMind !== null && m.topOfMind !== undefined ? m.topOfMind + '%' : 'unavailable'}`,
    `Spontaneous Recall: ${m.spontaneous !== null && m.spontaneous !== undefined ? m.spontaneous + '%' : 'unavailable'}`,
    `Total Awareness: ${m.totalAwareness !== null && m.totalAwareness !== undefined ? m.totalAwareness + '%' : 'unavailable'}`,
    `Awareness Quality: ${m.awarenessQuality !== null && m.awarenessQuality !== undefined ? m.awarenessQuality + '%' : 'unavailable'}`,
    `Share of Voice: ${m.shareOfVoice !== null && m.shareOfVoice !== undefined ? m.shareOfVoice + '%' : 'unavailable'}`,
    `Awareness Depth Score: ${m.awarenessDepthScore !== null && m.awarenessDepthScore !== undefined ? m.awarenessDepthScore + '/100' : 'unavailable'}`,
    `Awareness Share Index: ${m.awarenessShareIndex !== null && m.awarenessShareIndex !== undefined ? m.awarenessShareIndex + '%' : 'unavailable'}`,
    `MoM Growth: ${m.momGrowthPct !== null && m.momGrowthPct !== undefined ? m.momGrowthPct + '%' : 'unavailable'}`,
    '',
    '## Awareness Funnel',
    `Aware: ${f.aware !== null && f.aware !== undefined ? f.aware + '%' : 'unavailable'}`,
    `Spontaneous: ${f.spontaneous !== null && f.spontaneous !== undefined ? f.spontaneous + '%' : 'unavailable'}`,
    `Top of Mind: ${f.topOfMind !== null && f.topOfMind !== undefined ? f.topOfMind + '%' : 'unavailable'}`,
    `Aided: ${f.aided !== null && f.aided !== undefined ? f.aided + '%' : 'unavailable'}`,
  ].filter((l) => l !== null);

  if (payload.intent) {
    const i = payload.intent;
    lines.push('', '## Future Intent');
    lines.push(`Average Intent: ${i.averageIntent !== null ? i.averageIntent.toFixed(1) + '/10' : 'unavailable'}`);
    lines.push(`High Intent (7-10): ${i.highIntentPct !== null ? Math.round(i.highIntentPct * 100) + '%' : 'unavailable'}`);
    lines.push(`High Intent Non-Users: ${i.highIntentNonUserPct !== null ? Math.round(i.highIntentNonUserPct * 100) + '%' : 'unavailable'}`);
    lines.push(`At-Risk Current Users: ${i.lowIntentCurrentUserCount !== null ? i.lowIntentCurrentUserCount : 'unavailable'}`);
    lines.push(`Response base: ${i.responseBase}`);
  }

  if (Array.isArray(payload.rankings) && payload.rankings.length > 0) {
    lines.push('', '## Brand Rankings');
    payload.rankings.forEach((row) => {
      lines.push(`Rank ${row.rank}: ${row.bankName} — Awareness ${row.awareness}%, Top-of-Mind ${row.topOfMind}%`);
    });
  }

  if (payload.compareMetrics) {
    lines.push('', '## Compare Bank Metrics');
    const cm = payload.compareMetrics;
    lines.push(`Top of Mind: ${cm.topOfMind !== null ? cm.topOfMind + '%' : 'unavailable'}`);
    lines.push(`Total Awareness: ${cm.awareness !== null ? cm.awareness + '%' : 'unavailable'}`);
  }

  lines.push(
    '',
    'Respond with only the 5 required sections in this order:',
    '1. ## Market Awareness Position',
    '2. ## Awareness Funnel',
    '3. ## Competitive Landscape',
    '4. ## Future Consideration',
    '5. ## Strategic Implications',
    '',
    'Use ## headings and bullet points. Do not invent or estimate data not provided above.',
  );

  return lines.join('\n');
};

const ensureAwarenessSections = (raw) => {
  const normalized = normalizeWhitespace(raw);
  const lower = normalized.toLowerCase();
  const hasAll = AWARENESS_REQUIRED_SECTIONS.every((s) => lower.includes(s.toLowerCase()));
  if (hasAll) return toWordLimitedText(normalized, 600);
  return AWARENESS_REQUIRED_SECTIONS.map((s) =>
    `## ${s}\nNot enough signal in this snapshot to provide a confident analysis.`
  ).join('\n\n');
};

const computeAwarenessCacheHash = (fields) =>
  crypto.createHash('sha256').update(JSON.stringify(fields)).digest('hex').slice(0, 32);

const callGeminiWithText = async ({ apiKey, model, promptText, systemPrompt }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1800 },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Gemini request failed (${response.status}): ${body || 'Unknown error'}`);
    error.statusCode = response.status;
    throw error;
  }
  const result = await response.json();
  const text = parseGeminiText(result);
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
};

const handleAwarenessInsightReport = async (payload, request) => {
  const uid = request.auth.uid;
  const role = request.auth.token?.role;

  // Access control: subscribers must have country entitlement
  if (role !== 'admin') {
    const userSnap = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userSnap.data() || {};
    const assignedCountries = Array.isArray(userData.assignedCountries) ? userData.assignedCountries : [];
    if (!assignedCountries.includes(String(payload.country || '').toLowerCase())) {
      throw new HttpsError('permission-denied', 'You do not have access to this country context.');
    }
    if (Array.isArray(userData.assignedBanks) && !userData.assignedBanks.includes(String(payload.bankId || ''))) {
      throw new HttpsError('permission-denied', 'You do not have access to this bank.');
    }
  }

  const country = String(payload.country || '').toLowerCase();
  const bankId = String(payload.bankId || '');
  if (!country || !bankId) {
    throw new HttpsError('invalid-argument', 'country and bankId are required.');
  }
  if (typeof payload.sampleSize !== 'number' || payload.sampleSize === 0) {
    throw new HttpsError('invalid-argument', 'insufficient-data: sampleSize must be > 0.');
  }

  const methodologyVersion = String(payload.methodologyVersion || '1.0');
  const compareBankId = String(payload.compareBankId || '');
  const filtersHash = crypto.createHash('sha256')
    .update(JSON.stringify(payload.filters || {}))
    .digest('hex')
    .slice(0, 16);
  const cacheKeyHash = computeAwarenessCacheHash({
    reportType: 'awareness_consideration',
    userId: uid,
    country,
    bankId,
    compareBankId,
    methodologyVersion,
    filtersHash,
  });

  const cacheRef = admin.firestore().doc(`aiInsightReports/${cacheKeyHash}`);
  const cacheSnap = await cacheRef.get();
  if (cacheSnap.exists) {
    const cached = cacheSnap.data();
    if (cached.expiresAt && cached.expiresAt.toMillis() > Date.now()) {
      return {
        response: cached.response,
        generatedAt: cached.generatedAt.toDate().toISOString(),
        fromCache: true,
      };
    }
  }

  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) throw new HttpsError('failed-precondition', 'GEMINI_API_KEY secret is not configured.');

  const systemPrompt = buildAwarenessSystemPrompt();
  const promptText = buildAwarenessUserPrompt(payload);

  let rawText = '';
  let lastError = null;
  for (const model of DEFAULT_GEMINI_MODELS) {
    try {
      rawText = await callGeminiWithText({ apiKey, model, promptText, systemPrompt });
      break;
    } catch (err) {
      const msg = String(err?.message || err);
      if (msg.includes('(404)') || msg.includes('NOT_FOUND') || msg.includes('not supported')) {
        lastError = err;
        continue;
      }
      if (msg.includes('(429)') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpsError('resource-exhausted', 'AI request quota exceeded. Please try again later.');
      }
      throw new HttpsError('internal', 'AI generation failed. Please try again.');
    }
  }
  if (!rawText) throw new HttpsError('internal', String(lastError?.message || 'No Gemini model available.'));

  const finalResponse = ensureAwarenessSections(rawText);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32);

  await cacheRef.set({
    reportType: 'awareness_consideration',
    userId: uid,
    country,
    bankId,
    compareBankId: compareBankId || null,
    methodologyVersion,
    filtersHash,
    payloadHash,
    generatedAt: admin.firestore.Timestamp.fromDate(now),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    response: finalResponse,
  });

  return { response: finalResponse, generatedAt: now.toISOString(), fromCache: false };
};

exports.aiStrategyAdvisor = onCall({
  region: 'us-central1',
  secrets: [GEMINI_API_KEY],
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 60,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required for AI Strategy Advisor.');
  }

  const systemPrompt = String(request.data?.systemPrompt || '').trim();
  const payload = request.data?.payload;
  if (!payload || typeof payload !== 'object') {
    throw new HttpsError('invalid-argument', 'Invalid payload for AI Strategy Advisor.');
  }

  // Awareness Insight Report branch — handled separately from strategy advisor
  if (payload.reportType === 'awareness_consideration') {
    return handleAwarenessInsightReport(payload, request);
  }

  const requiredKeys = ['country', 'period', 'filters', 'metrics', 'previous_period', 'competitors', 'user_query'];
  const missing = requiredKeys.filter((key) => !(key in payload));
  if (missing.length > 0) {
    throw new HttpsError('invalid-argument', `Missing required payload fields: ${missing.join(', ')}`);
  }

  if (!systemPrompt) {
    throw new HttpsError('invalid-argument', 'System prompt is required.');
  }

  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'GEMINI_API_KEY secret is not configured.');
  }

  let lastError = null;
  for (const model of DEFAULT_GEMINI_MODELS) {
    try {
      const response = await callGeminiModel({ apiKey, model, payload, systemPrompt });
      return { response };
    } catch (error) {
      const message = String(error?.message || error);
      if (message.includes('(404)') || message.includes('NOT_FOUND') || message.includes('not supported')) {
        lastError = error;
        continue;
      }
      if (message.includes('(429)') || message.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpsError('resource-exhausted', message);
      }
      throw new HttpsError('internal', message);
    }
  }

  throw new HttpsError('internal', String(lastError?.message || 'No compatible Gemini model found.'));
});
