import { describe, expect, it } from 'vitest';
import {
  COOLDOWN_DAYS,
  FAST_COMPLETION_FLAG_SECONDS,
  MIN_SUBMIT_DURATION_SECONDS,
  buildSubmissionHash,
  buildSubmissionMonitoringMetadata,
  buildSurveyAbuseAssessment,
  buildSurveyContextMetadata,
  inferRequestCountry,
  shouldEnforcePublicSurveyAppCheck,
} from './publicSurvey';

const baseResponse = {
  response_id: 'resp-1',
  device_id: 'device-1',
  selected_country: 'rwanda',
  country: 'rwanda',
  timestamp: '2026-03-13T08:00:00.000Z',
  duration_seconds: 120,
  c5_currently_using: ['bank-a', 'bank-b'],
  preferred_bank: 'bank-a',
  committed_bank: 'bank-a',
  b2_age: '25-34',
  gender: 'female',
  c1_top_of_mind: 'BK',
  c2_spontaneous: 'BK, KCB',
  c10_nps: 8,
  _status: 'completed',
};

describe('public survey abuse guard helpers', () => {
  it('does not enforce App Check unless explicitly enabled for production', () => {
    const previousEmulator = process.env.FUNCTIONS_EMULATOR;
    const previousEnforce = process.env.PUBLIC_SURVEY_APPCHECK_ENFORCED;

    process.env.FUNCTIONS_EMULATOR = 'false';
    process.env.PUBLIC_SURVEY_APPCHECK_ENFORCED = '';
    expect(shouldEnforcePublicSurveyAppCheck()).toBe(false);

    process.env.PUBLIC_SURVEY_APPCHECK_ENFORCED = 'true';
    expect(shouldEnforcePublicSurveyAppCheck()).toBe(true);

    process.env.FUNCTIONS_EMULATOR = 'true';
    expect(shouldEnforcePublicSurveyAppCheck()).toBe(false);

    process.env.FUNCTIONS_EMULATOR = previousEmulator;
    process.env.PUBLIC_SURVEY_APPCHECK_ENFORCED = previousEnforce;
  });

  it('builds a stable submission hash for materially identical payloads', () => {
    const first = buildSubmissionHash(baseResponse);
    const second = buildSubmissionHash({
      ...baseResponse,
      response_id: 'resp-2',
      timestamp: '2026-03-13T09:00:00.000Z',
      c5_currently_using: ['bank-b', 'bank-a'],
    });

    expect(first).toBe(second);
  });

  it('blocks submissions that are implausibly fast', () => {
    const result = buildSurveyAbuseAssessment({
      response: { ...baseResponse, duration_seconds: MIN_SUBMIT_DURATION_SECONDS - 1 },
      existingResponses: [],
      trapField: '',
      nowIso: '2026-03-13T09:00:00.000Z',
      appCheckVerified: true,
      userAgent: 'Mozilla/5.0',
    });

    expect(result.rejection?.code).toBe('submission_too_fast');
    expect(result.suspiciousSignals.completion_speed_flag).toBe(true);
  });

  it('blocks repeated submissions inside the 90-day cooldown window', () => {
    const result = buildSurveyAbuseAssessment({
      response: baseResponse,
      existingResponses: [
        {
          ...baseResponse,
          timestamp: '2026-02-20T09:00:00.000Z',
        },
      ],
      trapField: '',
      nowIso: '2026-03-13T09:00:00.000Z',
      appCheckVerified: true,
      userAgent: 'Mozilla/5.0',
    });

    expect(result.rejection?.code).toBe('cooldown_active');
    expect(result.rejection?.nextAllowedAt).toBeTruthy();
    expect(result.suspiciousSignals.repeat_submission_flag).toBe(true);
  });

  it('lets trusted admin survey testers bypass the cooldown rejection while keeping the bypass marker', () => {
    const result = buildSurveyAbuseAssessment({
      response: baseResponse,
      existingResponses: [
        {
          ...baseResponse,
          timestamp: '2026-02-20T09:00:00.000Z',
        },
      ],
      trapField: '',
      nowIso: '2026-03-13T09:00:00.000Z',
      appCheckVerified: true,
      userAgent: 'Mozilla/5.0',
      bypassCooldown: true,
    });

    expect(result.rejection).toBeNull();
    expect(result.suspiciousSignals.repeat_submission_flag).toBe(false);
    expect(result.suspiciousSignals.admin_testing_bypass).toBe(true);
  });

  it('flags suspicious duplicate payloads without blocking them automatically', () => {
    const hash = buildSubmissionHash(baseResponse);
    const result = buildSurveyAbuseAssessment({
      response: { ...baseResponse, duration_seconds: FAST_COMPLETION_FLAG_SECONDS + 10 },
      existingResponses: [
        {
          ...baseResponse,
          selected_country: 'uganda',
          country: 'uganda',
          submission_hash: hash,
          timestamp: '2026-03-10T09:00:00.000Z',
        },
      ],
      trapField: '',
      nowIso: '2026-03-13T09:00:00.000Z',
      appCheckVerified: true,
      userAgent: 'Mozilla/5.0',
    });

    expect(result.rejection).toBeNull();
    expect(result.suspiciousSignals.duplicate_payload_flag).toBe(true);
    expect(result.suspiciousSignals.suspicious_submission_flag).toBe(true);
  });

  it('rejects honeypot-triggered submissions', () => {
    const result = buildSurveyAbuseAssessment({
      response: baseResponse,
      existingResponses: [],
      trapField: 'bot-filled',
      nowIso: '2026-03-13T09:00:00.000Z',
      appCheckVerified: true,
      userAgent: 'Mozilla/5.0',
    });

    expect(result.rejection?.code).toBe('abuse_detected');
    expect(result.suspiciousSignals.honeypot_triggered).toBe(true);
  });

  it('exports the cooldown constant used by the backend guard', () => {
    expect(COOLDOWN_DAYS).toBe(90);
  });

  it('infers coarse request country from trusted edge headers when available', () => {
    expect(inferRequestCountry({ 'x-vercel-ip-country': 'rwanda' })).toBe('rwanda');
    expect(inferRequestCountry({ 'cf-ipcountry': 'UGANDA' })).toBe('uganda');
    expect(inferRequestCountry({ 'x-country-code': 'unknown' })).toBeNull();
  });

  it('builds submission context metadata with mismatch flagging only for coarse country differences', () => {
    const context = buildSurveyContextMetadata({
      response: baseResponse,
      headers: { 'x-vercel-ip-country': 'uganda' },
      nowIso: '2026-03-13T09:00:00.000Z',
    });

    expect(context.country).toBe('rwanda');
    expect(context.selected_country).toBe('rwanda');
    expect(context.request_country).toBe('uganda');
    expect(context.country_mismatch_flag).toBe(true);
    expect(context.submitted_at_iso).toBe('2026-03-13T09:00:00.000Z');
  });

  it('prefers canonical country metadata over legacy selected_country when both exist', () => {
    const context = buildSurveyContextMetadata({
      response: {
        ...baseResponse,
        country: 'burundi',
        selected_country: 'rwanda',
      },
      headers: {},
      nowIso: '2026-03-13T09:00:00.000Z',
    });

    expect(context.country).toBe('burundi');
    expect(context.selected_country).toBe('burundi');
  });

  it('builds explicit monitoring metadata for admin test and public pilot submissions', () => {
    expect(buildSubmissionMonitoringMetadata(true)).toEqual({
      admin_test_submission: true,
      submission_mode: 'admin_test',
    });
    expect(buildSubmissionMonitoringMetadata(false)).toEqual({
      admin_test_submission: false,
      submission_mode: 'public_pilot',
    });
  });
});
