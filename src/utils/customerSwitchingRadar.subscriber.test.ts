import { describe, expect, it } from 'vitest';
import type { SurveyResponse } from '@/types';
import { computeCustomerSwitchingRadar } from '@/utils/customerSwitchingRadar';
import { filterResponsesForDashboard, type SubscriberFilters } from '@/utils/subscriberDashboard';

const baseResponse = (overrides: Partial<SurveyResponse>): SurveyResponse => ({
  response_id: overrides.response_id || `resp_${Math.random().toString(36).slice(2)}`,
  device_id: overrides.device_id || 'dev',
  country: (overrides.country || 'rwanda') as 'rwanda' | 'uganda' | 'burundi',
  selected_country: (overrides.selected_country || overrides.country || 'rwanda') as 'rwanda' | 'uganda' | 'burundi',
  timestamp: overrides.timestamp || '2026-03-01T00:00:00.000Z',
  duration_seconds: overrides.duration_seconds ?? 100,
  question_timings: overrides.question_timings || {},
  language_at_submission: overrides.language_at_submission || 'en',
  _status: overrides._status || 'completed',
  c5_currently_using: overrides.c5_currently_using || [],
  bank_count: overrides.bank_count ?? (overrides.c5_currently_using || []).length,
  preferred_bank: overrides.preferred_bank,
  committed_bank: overrides.committed_bank,
  b2_age: overrides.b2_age,
  gender: overrides.gender,
});

describe('customer switching radar with subscriber dashboard filters', () => {
  it('uses live filtered responses and keeps selected-brand logic intact', () => {
    const rows: SurveyResponse[] = [
      baseResponse({
        response_id: 'r1',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '25-34',
        gender: 'female',
        timestamp: '2026-03-05T00:00:00.000Z',
        c5_currently_using: ['BK_RW', 'KCB_RW'],
        preferred_bank: 'KCB_RW',
      }),
      baseResponse({
        response_id: 'r2',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '25-34',
        gender: 'female',
        timestamp: '2026-03-06T00:00:00.000Z',
        c5_currently_using: ['BK_RW', 'EQU_RW'],
        preferred_bank: 'EQU_RW',
      }),
      baseResponse({
        response_id: 'r3',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '25-34',
        gender: 'female',
        timestamp: '2026-03-06T00:00:00.000Z',
        c5_currently_using: ['BK_RW', 'EQU_RW'],
        preferred_bank: 'BK_RW',
      }),
      baseResponse({
        response_id: 'r4',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '45-54',
        gender: 'female',
        timestamp: '2026-03-05T00:00:00.000Z',
        c5_currently_using: ['BK_RW', 'IM_RW'],
        preferred_bank: 'IM_RW',
      }),
      baseResponse({
        response_id: 'r5',
        selected_country: 'uganda',
        country: 'uganda',
        b2_age: '25-34',
        gender: 'female',
        timestamp: '2026-03-05T00:00:00.000Z',
        c5_currently_using: ['BK_RW', 'KCB_RW'],
        preferred_bank: 'KCB_RW',
      }),
    ];

    const filters: SubscriberFilters = {
      country: 'rwanda',
      bankId: 'BK_RW',
      timeWindow: '30d',
      ageGroups: ['25-34'],
      genders: ['female'],
    };

    const scoped = filterResponsesForDashboard(rows, filters);
    const result = computeCustomerSwitchingRadar(scoped, 'BK_RW');

    expect(scoped).toHaveLength(3);
    expect(result.multiBankUsingSelectedBase).toBe(3);
    expect(result.secondChoiceBase).toBe(2);
    expect(result.competitors.map((row) => row.competitor)).toEqual(['EQU_RW', 'KCB_RW']);
    expect(result.competitors[0]).toMatchObject({
      competitor: 'EQU_RW',
      secondChoiceShare: 50,
      overlapShare: 67,
      switchingPressureScore: 57,
    });
    expect(result.competitors[1]).toMatchObject({
      competitor: 'KCB_RW',
      secondChoiceShare: 50,
      overlapShare: 33,
      switchingPressureScore: 43,
    });
  });

  it('returns empty output when filtered scope leaves no selected-bank multi-bank users', () => {
    const rows: SurveyResponse[] = [
      baseResponse({
        response_id: 'r1',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '25-34',
        gender: 'female',
        timestamp: '2026-03-05T00:00:00.000Z',
        c5_currently_using: ['KCB_RW'],
        preferred_bank: 'KCB_RW',
      }),
    ];

    const filters: SubscriberFilters = {
      country: 'rwanda',
      bankId: 'BK_RW',
      timeWindow: '30d',
      ageGroups: ['25-34'],
      genders: ['female'],
    };

    const scoped = filterResponsesForDashboard(rows, filters);
    const result = computeCustomerSwitchingRadar(scoped, 'BK_RW');

    expect(scoped).toHaveLength(1);
    expect(result.hasData).toBe(false);
    expect(result.multiBankUsingSelectedBase).toBe(0);
    expect(result.secondChoiceBase).toBe(0);
    expect(result.competitors).toHaveLength(0);
  });

  it('keeps competitor ordering stable when filtered competitors tie', () => {
    const rows: SurveyResponse[] = [
      baseResponse({
        response_id: 't1',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '25-34',
        gender: 'male',
        timestamp: '2026-03-05T00:00:00.000Z',
        c5_currently_using: ['BK_RW', 'ACC_RW'],
        preferred_bank: 'BK_RW',
      }),
      baseResponse({
        response_id: 't2',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '25-34',
        gender: 'male',
        timestamp: '2026-03-06T00:00:00.000Z',
        c5_currently_using: ['BK_RW', 'BOA_RW'],
        preferred_bank: 'BK_RW',
      }),
    ];

    const filters: SubscriberFilters = {
      country: 'rwanda',
      bankId: 'BK_RW',
      timeWindow: '30d',
      ageGroups: ['25-34'],
      genders: ['male'],
    };

    const scoped = filterResponsesForDashboard(rows, filters);
    const result = computeCustomerSwitchingRadar(scoped, 'BK_RW');

    expect(result.competitors.map((row) => row.competitor)).toEqual(['ACC_RW', 'BOA_RW']);
    expect(result.competitors[0].switchingPressureScore).toBe(result.competitors[1].switchingPressureScore);
  });
});
