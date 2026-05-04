import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpsCallable } from 'firebase/functions';
import {
  buildAwarenessReportPayload,
  generateAwarenessReport,
  AWARENESS_REPORT_METHODOLOGY_VERSION,
} from '@/services/aiStrategyAdvisorService';

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  functions: {},
  db: {},
}));

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

  it('coerces NaN and Infinity metric values to null', () => {
    const payload = buildAwarenessReportPayload({ ...BASE_ARGS, momGrowthPct: NaN, topOfMind: Infinity });
    expect(payload.metrics.momGrowthPct).toBeNull();
    expect(payload.metrics.topOfMind).toBeNull();
  });
});

const MOCK_PAYLOAD = buildAwarenessReportPayload(BASE_ARGS);

describe('generateAwarenessReport', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns response from callable on cache miss', async () => {
    const mockFn = vi.fn().mockResolvedValue({
      data: { response: '## Market Awareness Position\n- Strong', generatedAt: '2026-05-04T10:00:00Z', fromCache: false },
    });
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

    const result = await generateAwarenessReport(MOCK_PAYLOAD, 'user123');
    expect(result.response).toContain('Market Awareness Position');
    expect(result.fromCache).toBe(false);
  });

  it('returns fromCache: true when callable returns cached result', async () => {
    const mockFn = vi.fn().mockResolvedValue({
      data: { response: '## Market Awareness Position\n- Cached', generatedAt: '2026-05-04T09:00:00Z', fromCache: true },
    });
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

    const result = await generateAwarenessReport(MOCK_PAYLOAD, 'user123');
    expect(result.fromCache).toBe(true);
  });

  it('throws insufficient-data when sampleSize is 0', async () => {
    const zeroPayload = buildAwarenessReportPayload({ ...BASE_ARGS, sampleSize: 0 });
    await expect(generateAwarenessReport(zeroPayload, 'user123')).rejects.toMatchObject({ code: 'insufficient-data' });
    expect(vi.mocked(httpsCallable)).not.toHaveBeenCalled();
  });

  it('throws insufficient-data when all metric values are null', async () => {
    const nullPayload = buildAwarenessReportPayload({
      ...BASE_ARGS,
      topOfMind: null, spontaneous: null, totalAwareness: null,
      awarenessQuality: null, shareOfVoice: null, awarenessDepthScore: null,
      awarenessShareIndex: null, momGrowthPct: null,
    });
    await expect(generateAwarenessReport({ ...nullPayload, sampleSize: 10 }, 'user123')).rejects.toMatchObject({ code: 'insufficient-data' });
    expect(vi.mocked(httpsCallable)).not.toHaveBeenCalled();
  });

  it('throws rate-limited on resource-exhausted error', async () => {
    const mockFn = vi.fn().mockRejectedValue(Object.assign(new Error('RESOURCE_EXHAUSTED'), { code: 'functions/resource-exhausted' }));
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

    await expect(generateAwarenessReport(MOCK_PAYLOAD, 'user123')).rejects.toMatchObject({ code: 'rate-limited' });
  });

  it('throws generation-failed on generic error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('network error'));
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

    await expect(generateAwarenessReport(MOCK_PAYLOAD, 'user123')).rejects.toMatchObject({ code: 'generation-failed' });
  });

  it('throws generation-failed on permission-denied error', async () => {
    const mockFn = vi.fn().mockRejectedValue(
      Object.assign(new Error('permission-denied'), { code: 'functions/permission-denied' }),
    );
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);
    await expect(generateAwarenessReport(MOCK_PAYLOAD, 'user123')).rejects.toMatchObject({ code: 'generation-failed' });
  });

  it('does not throw when sampleSize > 0 and at least one metric is non-null', async () => {
    const mockFn = vi.fn().mockResolvedValue({
      data: { response: '## Market Awareness Position\n- ok', generatedAt: '2026-05-04T10:00:00Z', fromCache: false },
    });
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);
    const partialPayload = buildAwarenessReportPayload({
      ...BASE_ARGS,
      topOfMind: 35,
      spontaneous: null, totalAwareness: null, awarenessQuality: null,
      shareOfVoice: null, awarenessDepthScore: null, awarenessShareIndex: null, momGrowthPct: null,
    });
    await expect(generateAwarenessReport(partialPayload, 'user123')).resolves.toBeDefined();
    expect(mockFn).toHaveBeenCalledOnce();
  });
});
