import { describe, expect, it } from 'vitest';
import {
  buildAwarenessReportPayload,
  AWARENESS_REPORT_METHODOLOGY_VERSION,
} from '@/services/aiStrategyAdvisorService';

const BASE_ARGS = {
  country: 'rwanda',
  period: 'All data',
  bankId: 'BK_RW',
  bankName: 'Bank of Kigali',
  filters: { time_window: 'all' } as Record<string, unknown>,
  sampleSize: 50,
  topOfMind: 35,
  spontaneous: 45,
  totalAwareness: 80,
  awarenessQuality: 43.75,
  shareOfVoice: 28,
  awarenessDepthScore: 55,
  awarenessShareIndex: 32,
  momGrowthPct: 2.5,
  funnelAware: 80,
  funnelSpontaneous: 45,
  funnelTopOfMind: 35,
  funnelAided: 20,
  intent: {
    averageIntent: 6.8,
    highIntentPct: 0.62,
    highIntentNonUserPct: 0.45,
    lowIntentCurrentUserCount: 8,
    responseBase: 42,
  },
  rankings: [
    { bankName: 'Bank of Kigali', awareness: 80, topOfMind: 35, rank: 1 },
    { bankName: 'Equity Bank', awareness: 70, topOfMind: 22, rank: 2 },
  ],
};

describe('buildAwarenessReportPayload', () => {
  it('sets reportType to awareness_consideration', () => {
    expect(buildAwarenessReportPayload(BASE_ARGS).reportType).toBe('awareness_consideration');
  });

  it('includes AWARENESS_REPORT_METHODOLOGY_VERSION', () => {
    expect(buildAwarenessReportPayload(BASE_ARGS).methodologyVersion).toBe(AWARENESS_REPORT_METHODOLOGY_VERSION);
  });

  it('is deterministic — same inputs produce same output', () => {
    const a = buildAwarenessReportPayload(BASE_ARGS);
    const b = buildAwarenessReportPayload(BASE_ARGS);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('passes null metric values through as null', () => {
    const payload = buildAwarenessReportPayload({ ...BASE_ARGS, topOfMind: null, shareOfVoice: null });
    expect(payload.metrics.topOfMind).toBeNull();
    expect(payload.metrics.shareOfVoice).toBeNull();
  });

  it('sets compareMetrics to null when no compareBankId', () => {
    const payload = buildAwarenessReportPayload(BASE_ARGS);
    expect(payload.compareMetrics).toBeNull();
    expect(payload.compareBankId).toBeNull();
  });

  it('includes compareMetrics when compareBankId is provided', () => {
    const payload = buildAwarenessReportPayload({
      ...BASE_ARGS,
      compareBankId: 'EQ_RW',
      compareBankName: 'Equity Bank',
      compareTopOfMind: 22,
      compareAwareness: 70,
    });
    expect(payload.compareBankId).toBe('EQ_RW');
    expect(payload.compareMetrics).not.toBeNull();
    expect(payload.compareMetrics?.topOfMind).toBe(22);
  });

  it('passes null intent through as null', () => {
    const payload = buildAwarenessReportPayload({ ...BASE_ARGS, intent: null });
    expect(payload.intent).toBeNull();
  });

  it('copies rankings array', () => {
    const payload = buildAwarenessReportPayload(BASE_ARGS);
    expect(payload.rankings).toHaveLength(2);
    expect(payload.rankings[0].rank).toBe(1);
  });
});
