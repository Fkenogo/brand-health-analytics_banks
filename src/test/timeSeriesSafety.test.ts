import { describe, expect, it } from 'vitest';
import {
  computeMomentumDiagnostics,
  computeTrendForecastDiagnostics,
} from '@/utils/subscriberDashboard';
import type { SurveyResponse } from '@/types';

const makeTimestamp = (monthsAgo: number) => {
  const date = new Date();
  date.setDate(15);
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString();
};

const makeResponse = ({
  monthsAgo,
  aware = true,
  ever = true,
  current = true,
  preferred = false,
  nps = 8,
}: {
  monthsAgo: number;
  aware?: boolean;
  ever?: boolean;
  current?: boolean;
  preferred?: boolean;
  nps?: number;
}): SurveyResponse => ({
  timestamp: makeTimestamp(monthsAgo),
  selected_country: 'rwanda',
  c1_recognized_bank_id: aware ? 'BK_RW' : 'OTHER_RW',
  c2_recognized_bank_ids: [],
  c3_aware_banks: aware ? ['BK_RW'] : ['OTHER_RW'],
  c4_ever_used: ever ? ['BK_RW'] : [],
  c5_currently_using: current ? ['BK_RW'] : [],
  preferred_bank: preferred ? 'BK_RW' : 'OTHER_RW',
  d2_future_intent: { BK_RW: aware ? 8 : 2 },
  d3_relevance: aware ? ['BK_RW'] : [],
  c9_would_consider: aware ? ['BK_RW'] : [],
  d7_nps: { BK_RW: nps },
  committed_bank: preferred ? 'BK_RW' : undefined,
} as SurveyResponse);

describe('time-series safety guards', () => {
  it('treats missing months as null and suppresses forecast on sparse trend history', () => {
    const responses = [
      makeResponse({ monthsAgo: 0 }),
      makeResponse({ monthsAgo: 2 }),
    ];

    const diagnostics = computeTrendForecastDiagnostics(responses, 'BK_RW', 4);

    expect(diagnostics.monthly).toHaveLength(4);
    expect(diagnostics.monthly.filter((row) => row.sample === 0)).not.toHaveLength(0);
    expect(diagnostics.monthly.filter((row) => row.sample === 0).every((row) => row.awareness === null)).toBe(true);
    expect(diagnostics.periodComparisons.momPp).toBeNull();
    expect(diagnostics.forecast.eligible).toBe(false);
    expect(diagnostics.forecast.regressionNext).toBeNull();
  });

  it('preserves real measured zero values when a month has responses but no bank observations', () => {
    const responses = [
      makeResponse({ monthsAgo: 1, aware: false, ever: false, current: false, preferred: false }),
      makeResponse({ monthsAgo: 0 }),
    ];

    const diagnostics = computeTrendForecastDiagnostics(responses, 'BK_RW', 2);
    const zeroMonth = diagnostics.monthly.find((row) => row.sample > 0 && row.awareness === 0);

    expect(zeroMonth).toBeTruthy();
    expect(zeroMonth?.awareness).toBe(0);
  });

  it('suppresses momentum forecast when recent history is sparse and keeps missing trend periods null', () => {
    const currentResponses = [makeResponse({ monthsAgo: 0 })];
    const trendResponses = [
      makeResponse({ monthsAgo: 0 }),
      makeResponse({ monthsAgo: 2 }),
    ];

    const diagnostics = computeMomentumDiagnostics(currentResponses, trendResponses, 'rwanda', 'BK_RW', 4);

    expect(diagnostics.trends.some((point) => point.score === null)).toBe(true);
    expect(diagnostics.trends.some((point) => point.delta === null)).toBe(true);
    expect(diagnostics.forecastEligible).toBe(false);
    expect(diagnostics.forecast.every((point) => point.projectedScore === null)).toBe(true);
  });

  it('allows forecast output when there is enough contiguous valid history', () => {
    const responses = [
      makeResponse({ monthsAgo: 5 }),
      makeResponse({ monthsAgo: 4 }),
      makeResponse({ monthsAgo: 3 }),
      makeResponse({ monthsAgo: 2 }),
      makeResponse({ monthsAgo: 1 }),
      makeResponse({ monthsAgo: 0 }),
    ];

    const diagnostics = computeTrendForecastDiagnostics(responses, 'BK_RW', 6);

    expect(diagnostics.validPeriods).toBe(6);
    expect(diagnostics.forecast.eligible).toBe(true);
    expect(diagnostics.forecast.regressionNext).not.toBeNull();
  });
});
