export const SAMPLE_GUARD_THRESHOLDS = {
  display: 5,
  diagnostic: 10,
  recommendation: 15,
} as const;

export type SampleGuardStatus = 'reliable' | 'directional' | 'suppressed';

export interface SampleGuard {
  n: number;
  displayEligible: boolean;
  diagnosticEligible: boolean;
  recommendationEligible: boolean;
  sampleGuardStatus: SampleGuardStatus;
  suppressionReasons: {
    display: boolean;
    diagnostic: boolean;
    recommendation: boolean;
  };
}

export type GuardRenderContext =
  | 'table'
  | 'ranking'
  | 'chart-profile'
  | 'chart-diagnostic'
  | 'executive-summary'
  | 'strategy-advisor';

export type GuardedRow<T> = {
  data: T;
  dimmed: boolean;
  suppressMetrics: boolean;
  chartIndicator: boolean;
};

export function computeSampleGuard(n: number): SampleGuard {
  const displayEligible = n >= SAMPLE_GUARD_THRESHOLDS.display;
  const diagnosticEligible = n >= SAMPLE_GUARD_THRESHOLDS.diagnostic;
  const recommendationEligible = n >= SAMPLE_GUARD_THRESHOLDS.recommendation;

  const sampleGuardStatus: SampleGuardStatus = recommendationEligible
    ? 'reliable'
    : displayEligible
      ? 'directional'
      : 'suppressed';

  return {
    n,
    displayEligible,
    diagnosticEligible,
    recommendationEligible,
    sampleGuardStatus,
    suppressionReasons: {
      display: !displayEligible,
      diagnostic: !diagnosticEligible,
      recommendation: !recommendationEligible,
    },
  };
}

export function applyGuardedRendering<T extends { guard?: SampleGuard }>(
  rows: T[],
  context: GuardRenderContext,
): GuardedRow<T>[] {
  const result: GuardedRow<T>[] = [];

  for (const row of rows) {
    const { guard } = row;

    if (!guard) {
      result.push({ data: row, dimmed: false, suppressMetrics: false, chartIndicator: false });
      continue;
    }

    if (context === 'table') {
      result.push({
        data: row,
        dimmed: !guard.displayEligible,
        suppressMetrics: !guard.displayEligible,
        chartIndicator: false,
      });
    } else if (context === 'chart-profile') {
      result.push({
        data: row,
        dimmed: !guard.displayEligible,
        suppressMetrics: false,
        chartIndicator: !guard.displayEligible,
      });
    } else if (context === 'ranking' || context === 'chart-diagnostic') {
      if (guard.diagnosticEligible) {
        result.push({ data: row, dimmed: false, suppressMetrics: false, chartIndicator: false });
      }
    } else if (context === 'executive-summary' || context === 'strategy-advisor') {
      if (guard.recommendationEligible) {
        result.push({ data: row, dimmed: false, suppressMetrics: false, chartIndicator: false });
      }
    }
  }

  return result;
}
