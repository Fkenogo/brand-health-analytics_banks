const VALID_COUNTRIES = ['rwanda', 'uganda', 'burundi'];
const { deriveSurveyAnalyticsInclusion } = require('./respondentInclusion');
const BRAND_EDGE_WEIGHTS = {
  awareness: 0.3,
  usage: 0.3,
  loyalty: 0.2,
  primaryShare: 0.1,
  switchingRisk: -0.1,
};
const AGGREGATE_SCHEMA_VERSION = 3;
const METHODOLOGY_VERSION = 'v1';
const SUPPORTED_MODULES = {
  overview: true,
  awareness: true,
  usageTopline: true,
  usageDeep: false,
  momentum: false,
  trends: false,
  competitive: false,
};
const SUPPORTED_FILTERS = {
  country: true,
  selectedBank: true,
  timeWindow: true,
  ageGroups: false,
  genders: false,
};
const SUPPORTED_METRICS = [
  'aware',
  'topOfMind',
  'spontaneous',
  'aided',
  'everUsed',
  'currentUsing',
  'preferred',
  'considerationRate',
  'trialRate',
  'retentionRate',
  'churnRate',
  'preferenceRate',
  'awarenessQuality',
  'nps',
  'loyaltyIndex',
  'brandEdgeScore',
];
const SUPPORTED_COMPARE_METRICS = [
  'aware',
  'topOfMind',
  'spontaneous',
  'everUsed',
  'currentUsing',
  'preferred',
  'trialRate',
  'retentionRate',
  'churnRate',
  'preferenceRate',
];

const round = (value) => Math.round(Number(value || 0));
const pct = (num, den) => (den > 0 ? (num / den) * 100 : 0);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeCountry = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_COUNTRIES.includes(normalized) ? normalized : null;
};

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value?.toDate === 'function') {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted : null;
  }
  if (typeof value === 'object' && Number.isFinite(value.seconds)) {
    const converted = new Date(Number(value.seconds) * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  if (typeof value === 'object' && Number.isFinite(value._seconds)) {
    const converted = new Date(Number(value._seconds) * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateBucket = (value) => {
  const parsed = parseDate(value);
  if (!parsed) return null;
  return parsed.toISOString().slice(0, 10);
};

const toMonthBucket = (value) => {
  const dateBucket = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateBucket)) return null;
  return dateBucket.slice(0, 7);
};

const responseCountry = (response) => normalizeCountry(response?.country || response?.selected_country);
const responseDateBucket = (response) =>
  String(response?.analytics_date_bucket || '').trim()
  || toDateBucket(
    response?.timestamp
    || response?.submitted_at_iso
    || response?.submitted_at
    || response?.createdAt
    || response?.created_at,
  )
  || '';
const isAwareOfBank = (response, bankId) =>
  response?.c1_recognized_bank_id === bankId
  || (Array.isArray(response?.c2_recognized_bank_ids) && response.c2_recognized_bank_ids.includes(bankId))
  || (Array.isArray(response?.c3_aware_banks) && response.c3_aware_banks.includes(bankId));
const isSpontaneousBank = (response, bankId) =>
  response?.c1_recognized_bank_id === bankId
  || (Array.isArray(response?.c2_recognized_bank_ids) && response.c2_recognized_bank_ids.includes(bankId));
const isCurrentBank = (response, bankId) => (Array.isArray(response?.c5_currently_using) ? response.c5_currently_using.includes(bankId) : false);
const isEverBank = (response, bankId) => (Array.isArray(response?.c4_ever_used) ? response.c4_ever_used.includes(bankId) : false);
const isPreferredBank = (response, bankId) => String(response?.preferred_bank || '') === bankId;

const getIntentForBank = (response, bankId) => {
  if (response?.d2_future_intent && typeof response.d2_future_intent === 'object' && bankId in response.d2_future_intent) {
    return Number(response.d2_future_intent[bankId] || 0);
  }
  return 0;
};

const getNpsForBank = (response, bankId) => {
  if (response?.d7_nps && typeof response.d7_nps === 'object' && bankId in response.d7_nps) {
    const value = Number(response.d7_nps[bankId]);
    return Number.isFinite(value) ? value : null;
  }
  const direct = Number(response?.c10_nps);
  return Number.isFinite(direct) ? direct : null;
};

const loyaltySegment = (response, bankId) => {
  const aware = isAwareOfBank(response, bankId);
  if (!aware) return null;

  const current = isCurrentBank(response, bankId);
  const ever = isEverBank(response, bankId);
  const preferred = isPreferredBank(response, bankId);
  const committed = String(response?.committed_bank || '') === bankId;
  const intent = getIntentForBank(response, bankId);
  const nps = getNpsForBank(response, bankId) ?? 0;
  const relevant = Array.isArray(response?.d3_relevance) && response.d3_relevance.includes(bankId);

  if (current) {
    if (preferred && committed && nps >= 9) return 'Committed';
    return 'Favors';
  }

  if (ever) {
    if (intent >= 7 && nps >= 7) return 'Potential';
    if (intent <= 3 || nps <= 6) return 'Rejectors';
    return 'Accessibles';
  }

  if (intent >= 7 && (relevant || intent >= 8)) return 'Potential';
  if (intent >= 4) return 'Accessibles';
  return 'Rejectors';
};

const emptyBankCounts = () => ({
  awareCount: 0,
  topOfMindCount: 0,
  spontaneousCount: 0,
  aidedCount: 0,
  everUsedCount: 0,
  currentUsingCount: 0,
  preferredCount: 0,
  considerCount: 0,
  promoterCount: 0,
  passiveCount: 0,
  detractorCount: 0,
  npsBase: 0,
  loyaltyCounts: {
    Committed: 0,
    Favors: 0,
    Potential: 0,
    Accessibles: 0,
    Rejectors: 0,
  },
});

const createEmptyAggregate = ({ country, dateBucket }) => ({
  country,
  dateBucket,
  aggregateSchemaVersion: AGGREGATE_SCHEMA_VERSION,
  methodologyVersion: METHODOLOGY_VERSION,
  methodology_version: METHODOLOGY_VERSION,
  responseCount: 0,
  analyticsIncludedCount: 0,
  screenedOutCount: 0,
  screenedOutUnder18Count: 0,
  completedCount: 0,
  terminatedCount: 0,
  suspiciousCount: 0,
  repeatCount: 0,
  fastCount: 0,
  duplicateCount: 0,
  banks: {},
});

const ensureBankCounts = (aggregate, bankId) => {
  if (!aggregate.banks[bankId]) aggregate.banks[bankId] = emptyBankCounts();
  return aggregate.banks[bankId];
};

const accumulateResponse = (aggregate, response, bankIds) => {
  const inclusion = deriveSurveyAnalyticsInclusion(response);
  aggregate.responseCount += 1;
  if (inclusion.includedInAnalytics) aggregate.analyticsIncludedCount += 1;
  else aggregate.screenedOutCount += 1;
  if (inclusion.screeningOutcome === 'under_18') aggregate.screenedOutUnder18Count += 1;
  if (String(response?._status || '') === 'completed') aggregate.completedCount += 1;
  if (String(response?._status || '') === 'terminated') aggregate.terminatedCount += 1;
  if (response?.suspicious_submission_flag) aggregate.suspiciousCount += 1;
  if (response?.repeat_submission_flag) aggregate.repeatCount += 1;
  if (response?.completion_speed_flag) aggregate.fastCount += 1;
  if (response?.duplicate_payload_flag) aggregate.duplicateCount += 1;
  if (!inclusion.includedInAnalytics) return;

  bankIds.forEach((bankId) => {
    const counts = ensureBankCounts(aggregate, bankId);
    const aware = isAwareOfBank(response, bankId);
    const top = String(response?.c1_recognized_bank_id || '') === bankId;
    const spontaneous = isSpontaneousBank(response, bankId);
    const aided = Array.isArray(response?.c3_aware_banks) && response.c3_aware_banks.includes(bankId);
    const ever = isEverBank(response, bankId);
    const current = isCurrentBank(response, bankId);
    const preferred = isPreferredBank(response, bankId);
    const intent = getIntentForBank(response, bankId);
    const considers = intent >= 7 || (Array.isArray(response?.d3_relevance) && response.d3_relevance.includes(bankId)) || (Array.isArray(response?.c9_would_consider) && response.c9_would_consider.includes(bankId));
    const nps = getNpsForBank(response, bankId);

    if (aware) counts.awareCount += 1;
    if (top) counts.topOfMindCount += 1;
    if (spontaneous) counts.spontaneousCount += 1;
    if (aided) counts.aidedCount += 1;
    if (ever) counts.everUsedCount += 1;
    if (current) counts.currentUsingCount += 1;
    if (preferred) counts.preferredCount += 1;
    if (considers) counts.considerCount += 1;

    if (nps !== null && (ever || current)) {
      counts.npsBase += 1;
      if (nps >= 9) counts.promoterCount += 1;
      else if (nps >= 7) counts.passiveCount += 1;
      else counts.detractorCount += 1;
    }

    const segment = loyaltySegment(response, bankId);
    if (segment) counts.loyaltyCounts[segment] += 1;
  });
};

const buildDailyAggregateFromResponses = ({ country, dateBucket, responses, bankIds }) => {
  const aggregate = createEmptyAggregate({ country, dateBucket });
  responses.forEach((response) => accumulateResponse(aggregate, response, bankIds));
  return aggregate;
};

const mergeAggregateDocs = (docs) => {
  const merged = createEmptyAggregate({ country: docs[0]?.country || null, dateBucket: 'merged' });
  merged.methodologyVersion = docs[0]?.methodologyVersion || docs[0]?.methodology_version || METHODOLOGY_VERSION;
  merged.methodology_version = merged.methodologyVersion;
  docs.forEach((doc) => {
    merged.responseCount += Number(doc.responseCount || 0);
    merged.analyticsIncludedCount += Number(doc.analyticsIncludedCount || 0);
    merged.screenedOutCount += Number(doc.screenedOutCount || 0);
    merged.screenedOutUnder18Count += Number(doc.screenedOutUnder18Count || 0);
    merged.completedCount += Number(doc.completedCount || 0);
    merged.terminatedCount += Number(doc.terminatedCount || 0);
    merged.suspiciousCount += Number(doc.suspiciousCount || 0);
    merged.repeatCount += Number(doc.repeatCount || 0);
    merged.fastCount += Number(doc.fastCount || 0);
    merged.duplicateCount += Number(doc.duplicateCount || 0);
    Object.entries(doc.banks || {}).forEach(([bankId, bank]) => {
      const counts = ensureBankCounts(merged, bankId);
      counts.awareCount += Number(bank.awareCount || 0);
      counts.topOfMindCount += Number(bank.topOfMindCount || 0);
      counts.spontaneousCount += Number(bank.spontaneousCount || 0);
      counts.aidedCount += Number(bank.aidedCount || 0);
      counts.everUsedCount += Number(bank.everUsedCount || 0);
      counts.currentUsingCount += Number(bank.currentUsingCount || 0);
      counts.preferredCount += Number(bank.preferredCount || 0);
      counts.considerCount += Number(bank.considerCount || 0);
      counts.promoterCount += Number(bank.promoterCount || 0);
      counts.passiveCount += Number(bank.passiveCount || 0);
      counts.detractorCount += Number(bank.detractorCount || 0);
      counts.npsBase += Number(bank.npsBase || 0);
      Object.keys(counts.loyaltyCounts).forEach((key) => {
        counts.loyaltyCounts[key] += Number(bank.loyaltyCounts?.[key] || 0);
      });
    });
  });
  return merged;
};

const summarizeBankCounts = (counts, sampleSize) => {
  const aware = round(pct(counts.awareCount, sampleSize));
  const topOfMind = round(pct(counts.topOfMindCount, sampleSize));
  const spontaneous = round(pct(counts.spontaneousCount, sampleSize));
  const aided = round(pct(counts.aidedCount, sampleSize));
  const everUsed = round(pct(counts.everUsedCount, sampleSize));
  const currentUsing = round(pct(counts.currentUsingCount, sampleSize));
  const preferred = round(pct(counts.preferredCount, sampleSize));
  const considerationRate = round(pct(counts.considerCount, counts.awareCount));
  const trialRate = round(pct(counts.everUsedCount, counts.awareCount));
  const retentionRate = round(pct(counts.currentUsingCount, counts.everUsedCount));
  const preferenceRate = round(pct(counts.preferredCount, counts.currentUsingCount));
  const churnRate = round(Math.max(0, 100 - retentionRate));
  const awarenessQuality = round(pct(counts.topOfMindCount, counts.awareCount));
  const promoterPct = round(pct(counts.promoterCount, counts.npsBase));
  const passivePct = round(pct(counts.passiveCount, counts.npsBase));
  const detractorPct = round(pct(counts.detractorCount, counts.npsBase));
  const nps = round(promoterPct - detractorPct);
  const loyaltyAwareTotal = Object.values(counts.loyaltyCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const segmentPcts = {
    Committed: round(pct(counts.loyaltyCounts.Committed, loyaltyAwareTotal)),
    Favors: round(pct(counts.loyaltyCounts.Favors, loyaltyAwareTotal)),
    Potential: round(pct(counts.loyaltyCounts.Potential, loyaltyAwareTotal)),
    Accessibles: round(pct(counts.loyaltyCounts.Accessibles, loyaltyAwareTotal)),
    Rejectors: round(pct(counts.loyaltyCounts.Rejectors, loyaltyAwareTotal)),
  };
  const loyaltyIndexRaw =
    counts.loyaltyCounts.Committed * 100 +
    counts.loyaltyCounts.Favors * 70 +
    counts.loyaltyCounts.Potential * 40 +
    counts.loyaltyCounts.Accessibles * 20;
  const loyaltyIndex = round(loyaltyIndexRaw / (loyaltyAwareTotal || 1));

  return {
    sample: sampleSize,
    aware,
    topOfMind,
    spontaneous,
    aided,
    everUsed,
    currentUsing,
    preferred,
    consider: round(pct(counts.considerCount, sampleSize)),
    considerCount: Number(counts.considerCount || 0),
    awareCount: Number(counts.awareCount || 0),
    everUsedCount: Number(counts.everUsedCount || 0),
    currentUsingCount: Number(counts.currentUsingCount || 0),
    preferredCount: Number(counts.preferredCount || 0),
    trialRate,
    retentionRate,
    churnRate,
    preferenceRate,
    considerationRate,
    awarenessQuality,
    nps,
    promoters: promoterPct,
    passives: passivePct,
    detractors: detractorPct,
    loyaltyIndex,
    loyaltyCounts: counts.loyaltyCounts,
    segmentPcts,
    switchingRisk: churnRate,
  };
};

const computeBrandEdgeScore = (metrics) => {
  const score =
    metrics.awareness * BRAND_EDGE_WEIGHTS.awareness +
    metrics.usage * BRAND_EDGE_WEIGHTS.usage +
    metrics.loyalty * BRAND_EDGE_WEIGHTS.loyalty +
    metrics.primaryShare * BRAND_EDGE_WEIGHTS.primaryShare +
    metrics.switchingRisk * BRAND_EDGE_WEIGHTS.switchingRisk;
  return clamp(round(score), 0, 100);
};

const buildOverviewSnapshot = ({ aggregate, bankIds, bankNames, selectedBankId }) => {
  const responseCount = Number(aggregate.responseCount || 0);
  const includedCount = Number(aggregate.analyticsIncludedCount ?? aggregate.completedCount ?? 0);
  const screenedOutCount = Number(aggregate.screenedOutCount ?? Math.max(0, responseCount - includedCount));
  const under18Count = Number(aggregate.screenedOutUnder18Count || 0);
  const sampleSize = includedCount;
  const rawRows = bankIds.map((bankId) => {
    const counts = aggregate.banks[bankId] || emptyBankCounts();
    const metrics = summarizeBankCounts(counts, sampleSize);
    return {
      bankId,
      bankName: bankNames[bankId] || bankId,
      metrics,
      preferredCount: Number(counts.preferredCount || 0),
    };
  });
  const tomTotal = rawRows.reduce((sum, row) => sum + row.metrics.topOfMind, 0) || 1;
  const marketRows = rawRows.map((row) => ({
    bankId: row.bankId,
    bankName: row.bankName,
    sample: sampleSize,
    awareCount: row.metrics.awareCount,
    everUsedCount: row.metrics.everUsedCount,
    currentUsingCount: row.metrics.currentUsingCount,
    preferredCount: row.metrics.preferredCount,
    considerCount: row.metrics.considerCount,
    awareness: row.metrics.aware,
    topOfMind: row.metrics.topOfMind,
    everUsed: row.metrics.everUsed,
    currentUsage: row.metrics.currentUsing,
    preferredUsage: row.metrics.preferred,
    consideration: row.metrics.consider,
    trialRate: row.metrics.trialRate,
    retentionRate: row.metrics.retentionRate,
    churnRate: row.metrics.churnRate,
    preferenceRate: row.metrics.preferenceRate,
    nps: row.metrics.nps,
    preferred: row.metrics.preferred,
    marketShare: round(pct(row.preferredCount, sampleSize)),
    shareOfVoice: round(pct(row.metrics.topOfMind, tomTotal)),
  })).sort((a, b) => b.awareness - a.awareness);

  const selected = rawRows.find((row) => row.bankId === selectedBankId) || null;
  const selectedShare = marketRows.find((row) => row.bankId === selectedBankId)?.marketShare || 0;
  const selectedMetrics = selected
    ? {
        ...selected.metrics,
        brandEdgeScore: computeBrandEdgeScore({
          awareness: selected.metrics.aware,
          usage: selected.metrics.currentUsing,
          loyalty: selected.metrics.loyaltyIndex,
          primaryShare: selectedShare,
          switchingRisk: selected.metrics.switchingRisk,
        }),
      }
    : null;

  return {
    sampleSize,
    statusCounts: {
      completed: Number(aggregate.completedCount || 0),
      terminated: Number(aggregate.terminatedCount || 0),
      included: includedCount,
      screenedOut: screenedOutCount,
      under18: under18Count,
    },
    flagCounts: {
      suspicious: Number(aggregate.suspiciousCount || 0),
      repeat: Number(aggregate.repeatCount || 0),
      fast: Number(aggregate.fastCount || 0),
      duplicate: Number(aggregate.duplicateCount || 0),
    },
    selectedMetrics,
    marketRows,
  };
};

const dateBucketRangeForWindow = (timeWindow, now = new Date()) => {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (timeWindow === 'all') return { startBucket: null, endBucket: end.toISOString().slice(0, 10) };
  const start = new Date(now);
  const days = timeWindow === '30d' ? 29 : timeWindow === '90d' ? 89 : 364;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  return {
    startBucket: start.toISOString().slice(0, 10),
    endBucket: end.toISOString().slice(0, 10),
  };
};

const previousMonthRange = (now = new Date()) => {
  const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const previousEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  return {
    currentMonthStartBucket: currentStart.toISOString().slice(0, 10),
    previousMonthStartBucket: previousStart.toISOString().slice(0, 10),
    previousMonthEndBucket: previousEnd.toISOString().slice(0, 10),
  };
};

const monthKeyLabel = (monthKey) => {
  const date = new Date(`${monthKey}-01T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? monthKey : date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
};

module.exports = {
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
};
