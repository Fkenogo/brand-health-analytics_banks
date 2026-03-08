import { describe, expect, it } from 'vitest';
import type { SurveyResponse } from '@/types';
import {
  computeMultiBankCompetitionDiagnostics,
  filterResponsesForDashboard,
  type SubscriberFilters,
} from '@/utils/subscriberDashboard';

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

describe('multi-bank competition diagnostics', () => {
  it('computes usage/preferred/committed shares for selected and compare brands', () => {
    const rows: SurveyResponse[] = [
      baseResponse({ response_id: '1', c5_currently_using: ['a', 'b'], preferred_bank: 'a', committed_bank: 'a' }),
      baseResponse({ response_id: '2', c5_currently_using: ['a', 'c'], preferred_bank: 'c', committed_bank: 'c' }),
      baseResponse({ response_id: '3', c5_currently_using: ['b', 'c'], preferred_bank: 'b', committed_bank: 'b' }),
      baseResponse({ response_id: '4', c5_currently_using: ['a'], preferred_bank: 'a', committed_bank: 'a' }), // not multi-bank
    ];

    const metrics = computeMultiBankCompetitionDiagnostics(rows, 'a', 'b');

    expect(metrics.multiBankBase).toBe(3);

    expect(metrics.selected.multiBankUsageShare).toBe(67); // 2/3
    expect(metrics.selected.multiBankPreferredShare).toBe(33); // 1/3
    expect(metrics.selected.multiBankCommittedShare).toBe(33); // 1/3

    expect(metrics.compare?.multiBankUsageShare).toBe(67); // 2/3
    expect(metrics.compare?.multiBankPreferredShare).toBe(33); // 1/3
    expect(metrics.compare?.multiBankCommittedShare).toBe(33); // 1/3
  });

  it('computes second-choice distribution for selected brand', () => {
    const rows: SurveyResponse[] = [
      baseResponse({ response_id: '1', c5_currently_using: ['a', 'b'], preferred_bank: 'b', committed_bank: 'b' }),
      baseResponse({ response_id: '2', c5_currently_using: ['a', 'c'], preferred_bank: 'c', committed_bank: 'c' }),
      baseResponse({ response_id: '3', c5_currently_using: ['a', 'c'], preferred_bank: 'c', committed_bank: 'c' }),
      baseResponse({ response_id: '4', c5_currently_using: ['a', 'd'], preferred_bank: 'a', committed_bank: 'a' }), // excluded: selected is preferred
      baseResponse({ response_id: '5', c5_currently_using: ['b', 'c'], preferred_bank: 'c', committed_bank: 'c' }), // excluded: not using selected
    ];

    const metrics = computeMultiBankCompetitionDiagnostics(rows, 'a', 'b');

    expect(metrics.secondChoiceBase).toBe(3);
    expect(metrics.secondChoiceRows[0]).toMatchObject({ bankId: 'c', count: 2, share: 67 });
    expect(metrics.secondChoiceRows[1]).toMatchObject({ bankId: 'b', count: 1, share: 33 });
  });

  it('returns zero shares on empty denominator', () => {
    const metrics = computeMultiBankCompetitionDiagnostics([], 'a', 'b');

    expect(metrics.multiBankBase).toBe(0);
    expect(metrics.selected.multiBankUsageShare).toBe(0);
    expect(metrics.selected.multiBankPreferredShare).toBe(0);
    expect(metrics.selected.multiBankCommittedShare).toBe(0);
    expect(metrics.secondChoiceBase).toBe(0);
    expect(metrics.secondChoiceRows).toHaveLength(0);
  });

  it('respects country/age/gender/time filters when combined with dashboard filter selector', () => {
    const rows: SurveyResponse[] = [
      baseResponse({
        response_id: 'r1',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '25-34',
        gender: 'female',
        timestamp: '2026-03-05T00:00:00.000Z',
        c5_currently_using: ['a', 'b'],
        preferred_bank: 'b',
        committed_bank: 'b',
      }),
      baseResponse({
        response_id: 'r2',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '45-54',
        gender: 'female',
        timestamp: '2026-03-05T00:00:00.000Z',
        c5_currently_using: ['a', 'c'],
        preferred_bank: 'c',
        committed_bank: 'c',
      }),
      baseResponse({
        response_id: 'r3',
        selected_country: 'uganda',
        country: 'uganda',
        b2_age: '25-34',
        gender: 'female',
        timestamp: '2026-03-05T00:00:00.000Z',
        c5_currently_using: ['a', 'd'],
        preferred_bank: 'd',
        committed_bank: 'd',
      }),
    ];

    const filters: SubscriberFilters = {
      country: 'rwanda',
      bankId: 'a',
      timeWindow: '30d',
      ageGroups: ['25-34'],
      genders: ['female'],
    };

    const scoped = filterResponsesForDashboard(rows, filters);
    const metrics = computeMultiBankCompetitionDiagnostics(scoped, 'a', 'b');

    expect(scoped).toHaveLength(1);
    expect(metrics.multiBankBase).toBe(1);
    expect(metrics.selected.multiBankUsageShare).toBe(100);
    expect(metrics.compare?.multiBankUsageShare).toBe(100);
  });
});
