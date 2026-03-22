import { describe, expect, it } from 'vitest';
import type { SurveyResponse } from '@/types';
import { computeCustomerMigrationMap } from '@/utils/customerMigrationMap';
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

describe('customer migration map', () => {
  it('computes migration-away grouping and denominators for selected bank', () => {
    const rows: SurveyResponse[] = [
      baseResponse({ response_id: '1', c5_currently_using: ['a', 'b'], preferred_bank: 'b' }),
      baseResponse({ response_id: '2', c5_currently_using: ['a', 'c'], preferred_bank: 'c' }),
      baseResponse({ response_id: '3', c5_currently_using: ['a', 'c'], preferred_bank: 'a' }),
      baseResponse({ response_id: '4', c5_currently_using: ['a'], preferred_bank: 'a' }),
      baseResponse({ response_id: '5', c5_currently_using: ['b', 'c'], preferred_bank: 'c' }),
    ];

    const result = computeCustomerMigrationMap(rows, 'a');

    expect(result.selectedBankUserBase).toBe(4);
    expect(result.selectedBankMultiBankBase).toBe(3);
    expect(result.selectedBankPreferredBase).toBe(1);
    expect(result.migrationAwayBase).toBe(2);
    expect(result.multiBankRateAmongSelectedUsers).toBe(75);
    expect(result.driftRateAmongSelectedMultiBankUsers).toBe(67);
    expect(result.rows).toEqual([
      { competitor: 'b', count: 1, share: 50 },
      { competitor: 'c', count: 1, share: 50 },
    ]);
  });

  it('returns empty state when there is no migration-away base', () => {
    const rows: SurveyResponse[] = [
      baseResponse({ response_id: '1', c5_currently_using: ['a', 'b'], preferred_bank: 'a' }),
      baseResponse({ response_id: '2', c5_currently_using: ['a'], preferred_bank: 'a' }),
    ];

    const result = computeCustomerMigrationMap(rows, 'a');

    expect(result.hasData).toBe(false);
    expect(result.emptyReason).toBe('NO_MIGRATION_AWAY_BASE');
    expect(result.selectedBankUserBase).toBe(2);
    expect(result.selectedBankMultiBankBase).toBe(1);
    expect(result.migrationAwayBase).toBe(0);
    expect(result.rows).toHaveLength(0);
  });

  it('keeps ordering stable when migration shares tie', () => {
    const rows: SurveyResponse[] = [
      baseResponse({ response_id: '1', c5_currently_using: ['a', 'x'], preferred_bank: 'x' }),
      baseResponse({ response_id: '2', c5_currently_using: ['a', 'y'], preferred_bank: 'y' }),
    ];

    const result = computeCustomerMigrationMap(rows, 'a');

    expect(result.rows.map((row) => row.competitor)).toEqual(['x', 'y']);
  });

  it('respects live dashboard filters before migration computation', () => {
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
        preferred_bank: 'BK_RW',
      }),
      baseResponse({
        response_id: 'r3',
        selected_country: 'rwanda',
        country: 'rwanda',
        b2_age: '45-54',
        gender: 'female',
        timestamp: '2026-03-06T00:00:00.000Z',
        c5_currently_using: ['BK_RW', 'EQU_RW'],
        preferred_bank: 'EQU_RW',
      }),
      baseResponse({
        response_id: 'r4',
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
    const result = computeCustomerMigrationMap(scoped, 'BK_RW');

    expect(scoped).toHaveLength(2);
    expect(result.selectedBankUserBase).toBe(2);
    expect(result.selectedBankMultiBankBase).toBe(2);
    expect(result.selectedBankPreferredBase).toBe(1);
    expect(result.migrationAwayBase).toBe(1);
    expect(result.topMigrationCompetitor).toBe('KCB_RW');
    expect(result.rows[0]).toEqual({ competitor: 'KCB_RW', count: 1, share: 100 });
  });
});
