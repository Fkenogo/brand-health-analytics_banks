import { describe, expect, it } from 'vitest';
import type { SurveyResponse } from '@/types';
import { computeDemographicDiagnostics } from '@/utils/subscriberDashboard';
import { SAMPLE_GUARD_THRESHOLDS } from '@/utils/sampleGuards';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _id = 0;
const baseResponse = (overrides: Partial<SurveyResponse>): SurveyResponse => ({
  response_id: overrides.response_id ?? `r${++_id}`,
  device_id: 'dev',
  country: 'rwanda',
  selected_country: 'rwanda',
  timestamp: '2026-01-01T00:00:00.000Z',
  duration_seconds: 120,
  question_timings: {},
  language_at_submission: 'en',
  _status: 'completed',
  included_in_analytics: true,
  response_state: 'completed',
  screening_outcome: 'eligible',
  ...overrides,
});

const makeResponses = (
  bankId: string,
  groups: Array<{ age: string; count: number; isCurrentUser?: boolean }>,
): SurveyResponse[] => {
  const rows: SurveyResponse[] = [];
  let seq = 0;
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) {
      rows.push(
        baseResponse({
          response_id: `r_${bankId}_${g.age}_${seq++}`,
          b2_age: g.age,
          c5_currently_using: g.isCurrentUser ? [bankId] : [],
        }),
      );
    }
  }
  return rows;
};

// ---------------------------------------------------------------------------
// DemographicCohortRow — guard metadata
// ---------------------------------------------------------------------------

describe('DemographicCohortRow guard metadata', () => {
  it('attaches guard to every cohort row', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: 20 },
      { age: '25-34', count: 3 },
    ]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    expect(ageRows.every((row) => row.guard !== undefined)).toBe(true);
  });

  it('guard.n matches cohort sample count', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: 12 },
      { age: '25-34', count: 4 },
    ]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    for (const row of ageRows) {
      expect(row.guard!.n).toBe(row.sample);
    }
  });

  it('segment with n < 5 is suppressed', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: 20 },
      { age: '25-34', count: 4 },
    ]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    const small = ageRows.find((r) => r.sample === 4)!;
    expect(small.guard!.sampleGuardStatus).toBe('suppressed');
    expect(small.guard!.displayEligible).toBe(false);
    expect(small.guard!.diagnosticEligible).toBe(false);
    expect(small.guard!.recommendationEligible).toBe(false);
  });

  it('segment with n >= 15 is reliable', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: 20 },
    ]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    const row = ageRows[0];
    expect(row.guard!.sampleGuardStatus).toBe('reliable');
    expect(row.guard!.displayEligible).toBe(true);
    expect(row.guard!.diagnosticEligible).toBe(true);
    expect(row.guard!.recommendationEligible).toBe(true);
  });

  it('segment with 5 <= n < 10 is directional', () => {
    const responses = makeResponses('BANK_A', [
      { age: '35-44', count: 7 },
    ]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    const row = ageRows[0];
    expect(row.guard!.sampleGuardStatus).toBe('directional');
    expect(row.guard!.displayEligible).toBe(true);
    expect(row.guard!.diagnosticEligible).toBe(false);
  });

  it('segment with 10 <= n < 15 is directional (not yet reliable)', () => {
    const responses = makeResponses('BANK_A', [
      { age: '45-54', count: 12 },
    ]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    const row = ageRows[0];
    expect(row.guard!.sampleGuardStatus).toBe('directional');
    expect(row.guard!.diagnosticEligible).toBe(true);
    expect(row.guard!.recommendationEligible).toBe(false);
  });

  it('low-n rows still carry raw metric values', () => {
    const responses = makeResponses('BANK_A', [
      { age: '55+', count: 3, isCurrentUser: true },
    ]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    const row = ageRows[0];
    // guard is suppressed but raw values are still present
    expect(row.guard!.displayEligible).toBe(false);
    expect(row.sample).toBe(3);
    expect(row.currentUsage).toBe(100); // 3/3 current users
  });

  it('threshold boundary: n=5 is displayEligible', () => {
    const responses = makeResponses('BANK_A', [{ age: '18-24', count: 5 }]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    expect(ageRows[0].guard!.displayEligible).toBe(true);
  });

  it('threshold boundary: n=10 is diagnosticEligible', () => {
    const responses = makeResponses('BANK_A', [{ age: '18-24', count: 10 }]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    expect(ageRows[0].guard!.diagnosticEligible).toBe(true);
  });

  it('threshold boundary: n=15 is recommendationEligible', () => {
    const responses = makeResponses('BANK_A', [{ age: '18-24', count: 15 }]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    expect(ageRows[0].guard!.recommendationEligible).toBe(true);
  });

  it('suppressionReasons mirror eligibility flags', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: 7 },
    ]);
    const { ageRows } = computeDemographicDiagnostics(responses, 'BANK_A');
    const row = ageRows[0];
    expect(row.guard!.suppressionReasons.display).toBe(!row.guard!.displayEligible);
    expect(row.guard!.suppressionReasons.diagnostic).toBe(!row.guard!.diagnosticEligible);
    expect(row.guard!.suppressionReasons.recommendation).toBe(!row.guard!.recommendationEligible);
  });

  it('applies guard to all four dimensions', () => {
    const responses: SurveyResponse[] = [
      ...Array.from({ length: 3 }, (_, i) =>
        baseResponse({ response_id: `age_${i}`, b2_age: '18-24', gender: 'male', e1_employment: 'employed', e2_education: 'tertiary' }),
      ),
      ...Array.from({ length: 20 }, (_, i) =>
        baseResponse({ response_id: `big_${i}`, b2_age: '25-34', gender: 'female', e1_employment: 'self_employed', e2_education: 'secondary' }),
      ),
    ];
    const diag = computeDemographicDiagnostics(responses, 'BANK_A');
    for (const arr of [diag.ageRows, diag.genderRows, diag.employmentRows, diag.educationRows]) {
      expect(arr.every((r) => r.guard !== undefined)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// DemographicOpportunityRow — guard metadata
// ---------------------------------------------------------------------------

describe('DemographicOpportunityRow guard metadata', () => {
  it('attaches guard to every opportunity row', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: 20, isCurrentUser: true },
      { age: '25-34', count: 6 },
    ]);
    const { opportunities } = computeDemographicDiagnostics(responses, 'BANK_A');
    expect(opportunities.every((row) => row.guard !== undefined)).toBe(true);
  });

  it('opportunity guard.n matches source cohort sample', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: 20, isCurrentUser: true },
      { age: '25-34', count: 6 },
    ]);
    const { ageRows, opportunities } = computeDemographicDiagnostics(responses, 'BANK_A');
    const ageOpps = opportunities.filter((o) => o.dimension === 'age');
    for (const opp of ageOpps) {
      const sourceRow = ageRows.find((r) => r.segment === opp.segment)!;
      expect(opp.guard!.n).toBe(sourceRow.sample);
    }
  });

  it('low-n opportunity row still has computed gap/priority values', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: 20, isCurrentUser: true },
      { age: '25-34', count: 3 },
    ]);
    const { opportunities } = computeDemographicDiagnostics(responses, 'BANK_A');
    const smallOpp = opportunities.find(
      (o) => o.dimension === 'age' && o.guard!.n === 3,
    )!;
    // guard is suppressed but computed values remain
    expect(smallOpp.guard!.sampleGuardStatus).toBe('suppressed');
    expect(typeof smallOpp.usageGap).toBe('number');
    expect(smallOpp.priority).toMatch(/^(High|Medium|Low)$/);
  });

  it('thresholds match SAMPLE_GUARD_THRESHOLDS', () => {
    const responses = makeResponses('BANK_A', [
      { age: '18-24', count: SAMPLE_GUARD_THRESHOLDS.recommendation },
    ]);
    const { opportunities } = computeDemographicDiagnostics(responses, 'BANK_A');
    const opp = opportunities.find((o) => o.dimension === 'age')!;
    expect(opp.guard!.recommendationEligible).toBe(true);
  });
});
