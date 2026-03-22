const crypto = require('node:crypto');

const COOLDOWN_DAYS = 90;
const MIN_SUBMIT_DURATION_SECONDS = 8;
const FAST_COMPLETION_FLAG_SECONDS = 45;
const DUPLICATE_HASH_LOOKBACK_DAYS = 14;
const VALID_COUNTRIES = ['rwanda', 'uganda', 'burundi'];

const shouldEnforcePublicSurveyAppCheck = () =>
  process.env.FUNCTIONS_EMULATOR !== 'true'
  && String(process.env.PUBLIC_SURVEY_APPCHECK_ENFORCED || '').trim().toLowerCase() === 'true';

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .sort();
};

const toIsoString = (value) => {
  const date = new Date(String(value || ''));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const addDays = (isoString, days) => {
  const date = new Date(String(isoString || ''));
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + (days * 24 * 60 * 60 * 1000)).toISOString();
};

const normalizeCountry = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_COUNTRIES.includes(normalized) ? normalized : null;
};

const inferRequestCountry = (headers) => {
  const headerCandidates = [
    headers?.['x-vercel-ip-country'],
    headers?.['cf-ipcountry'],
    headers?.['x-country-code'],
    headers?.['x-appengine-country'],
    headers?.['cloudfront-viewer-country'],
  ];

  for (const candidate of headerCandidates) {
    const normalized = normalizeCountry(candidate);
    if (normalized) return normalized;
  }

  return null;
};

const buildSubmissionHash = (response) => {
  const stablePayload = {
    status: String(response._status || '').trim().toLowerCase(),
    age: String(response.b2_age || '').trim(),
    gender: String(response.gender || response.e3_gender || '').trim().toLowerCase(),
    currentlyUsing: normalizeStringArray(response.c5_currently_using),
    preferredBank: String(response.preferred_bank || '').trim(),
    committedBank: String(response.committed_bank || '').trim(),
    topOfMind: String(response.c1_top_of_mind || '').trim().toLowerCase(),
    spontaneous: String(response.c2_spontaneous || '').trim().toLowerCase(),
    nps: Number.isFinite(Number(response.c10_nps)) ? Number(response.c10_nps) : null,
  };

  return crypto.createHash('sha256').update(JSON.stringify(stablePayload)).digest('hex');
};

const responseCountry = (response) => normalizeCountry(response?.country || response?.selected_country);

const findLatestSubmissionInCooldown = (existingResponses, response, nowIso) => {
  const nowMs = new Date(nowIso).getTime();
  const targetCountry = responseCountry(response);
  return existingResponses
    .filter((item) => responseCountry(item) === targetCountry)
    .filter((item) => {
      const timestampMs = new Date(String(item.timestamp || '')).getTime();
      if (Number.isNaN(timestampMs)) return false;
      return (nowMs - timestampMs) < (COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    })
    .sort((left, right) => String(right.timestamp || '').localeCompare(String(left.timestamp || '')))[0] || null;
};

const buildSurveyAbuseAssessment = ({
  response,
  existingResponses,
  trapField,
  nowIso,
  appCheckVerified,
  userAgent,
  bypassCooldown = false,
}) => {
  const duration = Number(response.duration_seconds || 0);
  const submissionHash = buildSubmissionHash(response);
  const cooldownHit = bypassCooldown ? null : findLatestSubmissionInCooldown(existingResponses, response, nowIso);
  const duplicateHashHit = existingResponses.find((item) => {
    if (String(item.submission_hash || '') !== submissionHash) return false;
    const timestampMs = new Date(String(item.timestamp || '')).getTime();
    if (Number.isNaN(timestampMs)) return false;
    return (new Date(nowIso).getTime() - timestampMs) < (DUPLICATE_HASH_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  }) || null;

  const signals = {
    app_check_verified: Boolean(appCheckVerified),
    suspicious_submission_flag: false,
    repeat_submission_flag: Boolean(cooldownHit),
    completion_speed_flag: duration > 0 && duration < FAST_COMPLETION_FLAG_SECONDS,
    duplicate_payload_flag: Boolean(duplicateHashHit),
    metadata_missing_flag: !String(userAgent || '').trim(),
    honeypot_triggered: Boolean(String(trapField || '').trim()),
  };

  const suspicious = signals.completion_speed_flag
    || signals.duplicate_payload_flag
    || signals.metadata_missing_flag
    || signals.honeypot_triggered;

  return {
    submissionHash,
    suspiciousSignals: {
      ...signals,
      suspicious_submission_flag: suspicious,
      admin_testing_bypass: Boolean(bypassCooldown),
    },
    rejection: signals.honeypot_triggered
      ? { code: 'abuse_detected', message: 'Submission rejected.' }
      : duration < MIN_SUBMIT_DURATION_SECONDS
        ? { code: 'submission_too_fast', message: 'Submission was too fast to validate. Please review your answers and try again.' }
        : cooldownHit
          ? {
              code: 'cooldown_active',
              message: 'A survey from this device has already been submitted recently for this country.',
              nextAllowedAt: addDays(cooldownHit.timestamp, COOLDOWN_DAYS),
            }
          : null,
  };
};

const buildSurveyContextMetadata = ({ response, headers, nowIso }) => {
  const selectedCountry = responseCountry(response);
  const requestCountry = inferRequestCountry(headers);

  return {
    country: selectedCountry,
    selected_country: selectedCountry,
    request_country: requestCountry,
    country_mismatch_flag: Boolean(selectedCountry && requestCountry && selectedCountry !== requestCountry),
    submitted_at_iso: nowIso,
  };
};

const buildSubmissionMonitoringMetadata = (isAdminSurveyTester) => ({
  admin_test_submission: Boolean(isAdminSurveyTester),
  submission_mode: isAdminSurveyTester ? 'admin_test' : 'public_pilot',
});

module.exports = {
  COOLDOWN_DAYS,
  MIN_SUBMIT_DURATION_SECONDS,
  FAST_COMPLETION_FLAG_SECONDS,
  shouldEnforcePublicSurveyAppCheck,
  inferRequestCountry,
  buildSubmissionHash,
  buildSurveyAbuseAssessment,
  buildSurveyContextMetadata,
  buildSubmissionMonitoringMetadata,
};
