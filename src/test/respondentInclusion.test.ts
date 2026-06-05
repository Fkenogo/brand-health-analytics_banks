import { describe, expect, it } from 'vitest';
import type { SurveyResponse } from '@/types';
import { normalizeResponseForAnalyticsRead } from '@/utils/survey/normalization';
import { deriveSurveyAnalyticsInclusion, isIncludedInAnalytics } from '@/utils/survey/respondentInclusion';
import { computeDemographics } from '@/utils/subscriberDashboard';

const makeResponse = (overrides: Partial<SurveyResponse>): SurveyResponse =>
  normalizeResponseForAnalyticsRead({
    response_id: overrides.response_id || `resp_${Math.random().toString(36).slice(2)}`,
    device_id: overrides.device_id || 'dev',
    country: (overrides.country || overrides.selected_country || 'burundi') as SurveyResponse['country'],
    selected_country: (overrides.selected_country || overrides.country || 'burundi') as SurveyResponse['country'],
    timestamp: overrides.timestamp || '2026-03-20T00:00:00.000Z',
    duration_seconds: overrides.duration_seconds ?? 60,
    question_timings: overrides.question_timings || {},
    language_at_submission: overrides.language_at_submission || 'en',
    _status: overrides._status,
    consent: overrides.consent,
    b1_recency: overrides.b1_recency,
    b2_age: overrides.b2_age,
    e1_employment: overrides.e1_employment,
    e2_education: overrides.e2_education,
    e3_gender: overrides.e3_gender,
    gender: overrides.gender,
    c3_aware_banks: overrides.c3_aware_banks || [],
    c4_ever_used: overrides.c4_ever_used || [],
    c5_currently_using: overrides.c5_currently_using || [],
    preferred_bank: overrides.preferred_bank,
    committed_bank: overrides.committed_bank,
    d2_future_intent: overrides.d2_future_intent,
    d7_nps: overrides.d7_nps,
    d3_relevance: overrides.d3_relevance || [],
  } as SurveyResponse);

describe('survey analytics inclusion', () => {
  it('marks explicit below-18 terminations as screened out and excluded from analytics', () => {
    const response = makeResponse({
      _status: 'terminated',
      consent: 'yes',
      b1_recency: 'this_week',
      b2_age: 'below_18',
    });

    expect(deriveSurveyAnalyticsInclusion(response)).toEqual({
      responseState: 'screened_out',
      screeningOutcome: 'under_18',
      includedInAnalytics: false,
    });
    expect(isIncludedInAnalytics(response)).toBe(false);
  });

  it('does not let screened-out respondents inflate demographic unknown buckets', () => {
    const eligibleWithSkippedGender = makeResponse({
      response_id: 'eligible-1',
      _status: 'completed',
      consent: 'yes',
      b1_recency: 'this_week',
      b2_age: '25-34',
      e1_employment: 'full_time',
      e2_education: 'university',
    });
    const screenedOutUnder18 = makeResponse({
      response_id: 'screened-1',
      _status: 'terminated',
      consent: 'yes',
      b1_recency: 'this_week',
      b2_age: 'below_18',
    });

    const demographics = computeDemographics([eligibleWithSkippedGender, screenedOutUnder18]);

    expect(demographics.sample).toBe(1);
    expect(demographics.gender).toEqual([{ label: 'unknown', value: 100 }]);
    expect(demographics.employment).toEqual([{ label: 'full_time', value: 100 }]);
    expect(demographics.education).toEqual([{ label: 'university', value: 100 }]);
  });

  it('still counts valid eligible respondents with skipped demographics as unknown', () => {
    const eligibleMissingEmployment = makeResponse({
      response_id: 'eligible-2',
      _status: 'completed',
      consent: 'yes',
      b1_recency: 'this_week',
      b2_age: '35-44',
      gender: 'female',
    });
    const eligibleKnownEmployment = makeResponse({
      response_id: 'eligible-3',
      _status: 'completed',
      consent: 'yes',
      b1_recency: 'this_week',
      b2_age: '45-54',
      gender: 'male',
      e1_employment: 'self_employed',
    });

    const demographics = computeDemographics([eligibleMissingEmployment, eligibleKnownEmployment]);

    expect(demographics.sample).toBe(2);
    expect(demographics.employment).toEqual([
      { label: 'unknown', value: 50 },
      { label: 'self_employed', value: 50 },
    ]);
  });
});
