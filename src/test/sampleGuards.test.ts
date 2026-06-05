import { describe, expect, it } from 'vitest';
import {
  SAMPLE_GUARD_THRESHOLDS,
  applyGuardedRendering,
  computeSampleGuard,
  type GuardRenderContext,
  type SampleGuard,
} from '../utils/sampleGuards';

describe('SAMPLE_GUARD_THRESHOLDS', () => {
  it('has correct threshold values', () => {
    expect(SAMPLE_GUARD_THRESHOLDS.display).toBe(5);
    expect(SAMPLE_GUARD_THRESHOLDS.diagnostic).toBe(10);
    expect(SAMPLE_GUARD_THRESHOLDS.recommendation).toBe(15);
  });
});

describe('computeSampleGuard', () => {
  it.each([
    // [n, displayEligible, diagnosticEligible, recommendationEligible, status]
    [0,  false, false, false, 'suppressed'],
    [4,  false, false, false, 'suppressed'],
    [5,  true,  false, false, 'directional'],
    [9,  true,  false, false, 'directional'],
    [10, true,  true,  false, 'directional'],
    [14, true,  true,  false, 'directional'],
    [15, true,  true,  true,  'reliable'],
    [30, true,  true,  true,  'reliable'],
  ] as const)(
    'n=%i → display=%s diagnostic=%s recommendation=%s status=%s',
    (n, display, diagnostic, recommendation, status) => {
      const guard = computeSampleGuard(n);
      expect(guard.n).toBe(n);
      expect(guard.displayEligible).toBe(display);
      expect(guard.diagnosticEligible).toBe(diagnostic);
      expect(guard.recommendationEligible).toBe(recommendation);
      expect(guard.sampleGuardStatus).toBe(status);
      expect(guard.suppressionReasons.display).toBe(!display);
      expect(guard.suppressionReasons.diagnostic).toBe(!diagnostic);
      expect(guard.suppressionReasons.recommendation).toBe(!recommendation);
    },
  );
});

// ---------------------------------------------------------------------------
// applyGuardedRendering helpers
// ---------------------------------------------------------------------------

type TestRow = { id: string; value: number; guard?: SampleGuard };

const makeRow = (id: string, n: number): TestRow => ({
  id,
  value: 42,
  guard: computeSampleGuard(n),
});

const makeUnguardedRow = (id: string): TestRow => ({ id, value: 42 });

// ---------------------------------------------------------------------------
// Table context
// ---------------------------------------------------------------------------

describe('applyGuardedRendering — table', () => {
  it('keeps all rows', () => {
    const rows = [makeRow('a', 3), makeRow('b', 10), makeRow('c', 20)];
    expect(applyGuardedRendering(rows, 'table')).toHaveLength(3);
  });

  it('dims and suppresses metrics for n < 5', () => {
    const [r] = applyGuardedRendering([makeRow('a', 4)], 'table');
    expect(r.dimmed).toBe(true);
    expect(r.suppressMetrics).toBe(true);
    expect(r.chartIndicator).toBe(false);
  });

  it('does not dim rows with n >= 5', () => {
    const result = applyGuardedRendering([makeRow('a', 5), makeRow('b', 15)], 'table');
    expect(result[0].dimmed).toBe(false);
    expect(result[0].suppressMetrics).toBe(false);
    expect(result[1].dimmed).toBe(false);
  });

  it('boundary: n=5 is not dimmed', () => {
    const [r] = applyGuardedRendering([makeRow('a', 5)], 'table');
    expect(r.dimmed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Chart-profile context
// ---------------------------------------------------------------------------

describe('applyGuardedRendering — chart-profile', () => {
  it('keeps all rows', () => {
    const rows = [makeRow('a', 2), makeRow('b', 10)];
    expect(applyGuardedRendering(rows, 'chart-profile')).toHaveLength(2);
  });

  it('dims and sets chartIndicator for n < 5', () => {
    const [r] = applyGuardedRendering([makeRow('a', 4)], 'chart-profile');
    expect(r.dimmed).toBe(true);
    expect(r.chartIndicator).toBe(true);
    expect(r.suppressMetrics).toBe(false);
  });

  it('does not dim rows with n >= 5', () => {
    const [r] = applyGuardedRendering([makeRow('a', 5)], 'chart-profile');
    expect(r.dimmed).toBe(false);
    expect(r.chartIndicator).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Ranking context
// ---------------------------------------------------------------------------

describe('applyGuardedRendering — ranking', () => {
  it('removes rows with n < 10', () => {
    const rows = [makeRow('a', 9), makeRow('b', 10), makeRow('c', 15)];
    const result = applyGuardedRendering(rows, 'ranking');
    expect(result).toHaveLength(2);
    expect(result.map(r => r.data.id)).toEqual(['b', 'c']);
  });

  it('returns empty when all rows have n < 10', () => {
    expect(applyGuardedRendering([makeRow('a', 4), makeRow('b', 9)], 'ranking')).toHaveLength(0);
  });

  it('boundary: n=10 is kept undimmed', () => {
    const [r] = applyGuardedRendering([makeRow('a', 10)], 'ranking');
    expect(r.dimmed).toBe(false);
    expect(r.suppressMetrics).toBe(false);
  });

  it('boundary: n=9 is removed', () => {
    expect(applyGuardedRendering([makeRow('a', 9)], 'ranking')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Chart-diagnostic context
// ---------------------------------------------------------------------------

describe('applyGuardedRendering — chart-diagnostic', () => {
  it('removes rows with n < 10', () => {
    const rows = [makeRow('a', 9), makeRow('b', 10)];
    const result = applyGuardedRendering(rows, 'chart-diagnostic');
    expect(result).toHaveLength(1);
    expect(result[0].data.id).toBe('b');
  });

  it('boundary: n=10 is kept', () => {
    expect(applyGuardedRendering([makeRow('a', 10)], 'chart-diagnostic')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Executive-summary context
// ---------------------------------------------------------------------------

describe('applyGuardedRendering — executive-summary', () => {
  it('removes rows with n < 15', () => {
    const rows = [makeRow('a', 14), makeRow('b', 15), makeRow('c', 30)];
    const result = applyGuardedRendering(rows, 'executive-summary');
    expect(result).toHaveLength(2);
    expect(result.map(r => r.data.id)).toEqual(['b', 'c']);
  });

  it('returns empty when all rows have n < 15', () => {
    const rows = [makeRow('a', 5), makeRow('b', 14)];
    expect(applyGuardedRendering(rows, 'executive-summary')).toHaveLength(0);
  });

  it('boundary: n=15 is kept', () => {
    expect(applyGuardedRendering([makeRow('a', 15)], 'executive-summary')).toHaveLength(1);
  });

  it('boundary: n=14 is removed', () => {
    expect(applyGuardedRendering([makeRow('a', 14)], 'executive-summary')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Strategy-advisor context
// ---------------------------------------------------------------------------

describe('applyGuardedRendering — strategy-advisor', () => {
  it('removes rows with n < 15', () => {
    const rows = [makeRow('a', 14), makeRow('b', 15)];
    const result = applyGuardedRendering(rows, 'strategy-advisor');
    expect(result).toHaveLength(1);
    expect(result[0].data.id).toBe('b');
  });

  it('boundary: n=15 is kept undimmed', () => {
    const [r] = applyGuardedRendering([makeRow('a', 15)], 'strategy-advisor');
    expect(r.dimmed).toBe(false);
    expect(r.suppressMetrics).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rows without guard
// ---------------------------------------------------------------------------

describe('applyGuardedRendering — rows without guard', () => {
  const allContexts: GuardRenderContext[] = [
    'table',
    'ranking',
    'chart-profile',
    'chart-diagnostic',
    'executive-summary',
    'strategy-advisor',
  ];

  it.each(allContexts)('passes through unguarded row in %s context', (context) => {
    const result = applyGuardedRendering([makeUnguardedRow('x')], context);
    expect(result).toHaveLength(1);
    expect(result[0].dimmed).toBe(false);
    expect(result[0].suppressMetrics).toBe(false);
    expect(result[0].chartIndicator).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('applyGuardedRendering — immutability', () => {
  it('does not mutate input rows', () => {
    const rows = [makeRow('a', 4), makeRow('b', 10)];
    const snapshot = JSON.stringify(rows);
    applyGuardedRendering(rows, 'table');
    applyGuardedRendering(rows, 'ranking');
    applyGuardedRendering(rows, 'executive-summary');
    expect(JSON.stringify(rows)).toBe(snapshot);
  });
});
