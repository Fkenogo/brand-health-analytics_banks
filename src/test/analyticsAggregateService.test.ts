import { beforeEach, describe, expect, it, vi } from 'vitest';

const collectionMock = vi.fn();
const docMock = vi.fn();
const getDocMock = vi.fn();
const getDocsMock = vi.fn();
const httpsCallableMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallableMock(...args),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
}));

describe('analyticsAggregateService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    queryMock.mockImplementation((...args: unknown[]) => ({ args }));
    collectionMock.mockImplementation((...args: unknown[]) => ({ args }));
    docMock.mockImplementation((...args: unknown[]) => ({ args }));
  });

  it('loads overview aggregates through the backend callable', async () => {
    const getAggregateFn = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        aggregate: {
          country: 'rwanda',
          bankId: 'BK_RW',
          timeWindow: '90d',
          generatedAt: '2026-03-16T00:00:00.000Z',
          contract: {
            aggregateSchemaVersion: 2,
            supportedMetrics: ['everUsed', 'currentUsing', 'preferred', 'considerationRate', 'trialRate', 'retentionRate', 'churnRate', 'preferenceRate'],
            supportedFilters: { country: true, selectedBank: true, timeWindow: true, ageGroups: false, genders: false },
            supportedModules: { overview: true, awareness: true, usageTopline: true, usageDeep: false, momentum: false, trends: false, competitive: false },
            supportedCompareMetrics: ['everUsed', 'currentUsing', 'preferred', 'trialRate', 'retentionRate', 'churnRate', 'preferenceRate'],
          },
          integrity: { rebuildStatus: 'ready', coverageComplete: true, rebuiltAt: '2026-03-16T00:00:00.000Z' },
          sampleSize: 42,
          statusCounts: { completed: 39, terminated: 3 },
          flagCounts: { suspicious: 1, repeat: 0, fast: 0, duplicate: 0 },
          selectedMetrics: null,
          marketRows: [],
          monthOverMonth: {
            current: null,
            previous: null,
            deltas: { awareness: null, topOfMind: null, spontaneous: null, quality: null, usage: null },
          },
          monthlyTrend: [],
        },
      },
    });
    const rebuildFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');
    const result = await analyticsAggregateService.getDashboardOverviewAggregate('rwanda', 'BK_RW', '90d');

    expect(getAggregateFn).toHaveBeenCalledWith({ country: 'rwanda', bankId: 'BK_RW', timeWindow: '90d' });
    expect(result.sampleSize).toBe(42);
  });

  it('builds usage topline metrics from an aggregate contract', async () => {
    const module = await import('@/services/analyticsAggregateService');
    const { buildAggregateBackedLoyaltySummary, buildAggregateBackedMomentumSummary, buildUsageAggregateMetrics } = module;
    const aggregate = {
      country: 'rwanda',
      bankId: 'BK_RW',
      timeWindow: '90d',
      generatedAt: '2026-03-16T00:00:00.000Z',
      contract: {
        aggregateSchemaVersion: 2,
        supportedMetrics: ['everUsed', 'currentUsing', 'preferred', 'considerationRate', 'trialRate', 'retentionRate', 'churnRate', 'preferenceRate'],
        supportedFilters: { country: true, selectedBank: true, timeWindow: true, ageGroups: false, genders: false },
        supportedModules: { overview: true, awareness: true, usageTopline: true, usageDeep: false, momentum: false, trends: false, competitive: false },
        supportedCompareMetrics: ['everUsed', 'currentUsing', 'preferred', 'trialRate', 'retentionRate', 'churnRate', 'preferenceRate'],
      },
      integrity: { rebuildStatus: 'ready', coverageComplete: true, rebuiltAt: '2026-03-16T00:00:00.000Z' },
      sampleSize: 40,
      statusCounts: { completed: 39, terminated: 1 },
      flagCounts: { suspicious: 0, repeat: 0, fast: 0, duplicate: 0 },
      selectedMetrics: {
        sample: 40,
        aware: 70,
        topOfMind: 20,
        spontaneous: 50,
        aided: 20,
        everUsed: 45,
        currentUsing: 30,
        preferred: 18,
        consider: 41,
        considerCount: 12,
        awareCount: 28,
        everUsedCount: 18,
        currentUsingCount: 12,
        preferredCount: 7,
        trialRate: 64,
        retentionRate: 67,
        churnRate: 33,
        preferenceRate: 58,
        considerationRate: 43,
        awarenessQuality: 29,
        nps: 12,
        promoters: 30,
        passives: 52,
        detractors: 18,
        loyaltyIndex: 40,
        loyaltyCounts: { Committed: 1, Favors: 2, Potential: 3, Accessibles: 4, Rejectors: 1 },
        segmentPcts: { Committed: 9, Favors: 18, Potential: 27, Accessibles: 36, Rejectors: 9 },
        switchingRisk: 33,
        brandEdgeScore: 38,
      },
      marketRows: [{
        bankId: 'EQ_RW',
        bankName: 'Equity Rwanda',
        sample: 40,
        awareCount: 25,
        everUsedCount: 16,
        currentUsingCount: 10,
        preferredCount: 5,
        considerCount: 11,
        awareness: 63,
        topOfMind: 19,
        everUsed: 40,
        currentUsage: 25,
        preferredUsage: 13,
        consideration: 44,
        trialRate: 64,
        retentionRate: 63,
        churnRate: 37,
        preferenceRate: 50,
        nps: 8,
        preferred: 13,
        marketShare: 13,
        shareOfVoice: 17,
        rank: 2,
        movement: null,
      }],
      monthOverMonth: {
        current: null,
        previous: null,
        deltas: { awareness: null, topOfMind: null, spontaneous: null, quality: null, usage: null },
      },
      monthlyTrend: [],
    } as import('@/services/analyticsAggregateService').DashboardOverviewAggregate;

    const metrics = buildUsageAggregateMetrics(aggregate, 'EQ_RW');
    expect(metrics?.everUsed.value).toBe(45);
    expect(metrics?.retention.base_n).toBe(18);
    expect(metrics?.preferenceCapture.compare?.value).toBe(50);

    const loyalty = buildAggregateBackedLoyaltySummary(aggregate);
    expect(loyalty?.loyaltyIndex).toBe(40);
    expect(loyalty?.segmentPcts.Committed).toBe(9);

    const momentum = buildAggregateBackedMomentumSummary(aggregate);
    expect(momentum?.components.consideration).toBe(43);
    expect(momentum?.score).toBeGreaterThan(0);
  });

  it('routes aggregate rebuild requests through the backend callable', async () => {
    const getAggregateFn = vi.fn();
    const rebuildFn = vi.fn().mockResolvedValue({
      data: { ok: true, country: 'rwanda', rebuiltBuckets: 14, totalBuckets: 20, nextCursor: '14', hasMore: true, remainingBuckets: 6 },
    });

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');
    const firstChunk = await analyticsAggregateService.rebuildDashboardAggregates('rwanda');
    const nextChunk = await analyticsAggregateService.rebuildDashboardAggregates('uganda', { cursor: '14', maxBuckets: 10 });

    expect(rebuildFn).toHaveBeenNthCalledWith(1, { country: 'rwanda', cursor: null, maxBuckets: 20 });
    expect(rebuildFn).toHaveBeenNthCalledWith(2, { country: 'uganda', cursor: '14', maxBuckets: 10 });
    expect(firstChunk.rebuiltBuckets).toBe(14);
    expect(nextChunk.nextCursor).toBe('14');
  });

  it('maps selected-bank aggregate validation failures to an actionable message', async () => {
    const getAggregateFn = vi.fn().mockRejectedValue({
      code: 'functions/failed-precondition',
      message: 'Selected bank is not available for this country.',
    });
    const rebuildFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');

    await expect(
      analyticsAggregateService.getDashboardOverviewAggregate('rwanda', 'BK_RW', '90d'),
    ).rejects.toThrow('Overview aggregates are not aligned with the selected bank for this country yet.');
  });

  it('maps not-ready aggregate status to a raw-fallback message', async () => {
    const getAggregateFn = vi.fn().mockRejectedValue({
      code: 'functions/failed-precondition',
      message: 'Overview aggregates are not ready for this country yet.',
    });
    const rebuildFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');

    await expect(
      analyticsAggregateService.getDashboardOverviewAggregate('rwanda', 'BK_RW', '90d'),
    ).rejects.toThrow('Overview aggregates are still rebuilding for this country.');
  });

  it('falls back to direct Firestore aggregate reads when the callable is denied', async () => {
    const getAggregateFn = vi.fn().mockRejectedValue({
      code: 'functions/permission-denied',
      message: 'Subscriber access is required.',
    });
    const rebuildFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        aggregateSchemaVersion: 2,
        supportedMetrics: ['aware', 'currentUsing', 'loyaltyIndex', 'brandEdgeScore'],
        supportedFilters: { country: true, selectedBank: true, timeWindow: true, ageGroups: false, genders: false },
        supportedModules: { overview: true, awareness: true, usageTopline: true, usageDeep: false, momentum: false, trends: false, competitive: false },
        supportedCompareMetrics: ['aware', 'currentUsing'],
        rebuildStatus: 'ready',
        coverageComplete: true,
      }),
    });

    getDocsMock.mockResolvedValue({
      docs: [
        {
          data: () => ({
            country: 'rwanda',
            dateBucket: '2026-03-08',
            responseCount: 10,
            analyticsIncludedCount: 10,
            completedCount: 9,
            terminatedCount: 1,
            suspiciousCount: 0,
            repeatCount: 0,
            fastCount: 0,
            duplicateCount: 0,
            banks: {
              BK_RW: {
                awareCount: 6,
                topOfMindCount: 2,
                spontaneousCount: 4,
                aidedCount: 2,
                everUsedCount: 5,
                currentUsingCount: 3,
                preferredCount: 2,
                considerCount: 5,
                promoterCount: 2,
                passiveCount: 2,
                detractorCount: 1,
                npsBase: 5,
                loyaltyCounts: {
                  Committed: 1,
                  Favors: 1,
                  Potential: 1,
                  Accessibles: 1,
                  Rejectors: 1,
                },
              },
            },
          }),
        },
      ],
    });

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');
    const result = await analyticsAggregateService.getDashboardOverviewAggregateWithFallback('rwanda', 'BK_RW', '90d');

    expect(result.source).toBe('firestore');
    expect(result.fallbackReason).toContain('Overview aggregate access was denied');
    expect(result.aggregate.sampleSize).toBe(10);
    expect(whereMock).toHaveBeenCalledWith('country', '==', 'rwanda');
  });

  it('maps backend aggregate rebuild crashes to a clearer operational message', async () => {
    const getAggregateFn = vi.fn();
    const rebuildFn = vi.fn().mockRejectedValue({
      code: 'functions/internal',
      message: 'INTERNAL',
    });

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');

    await expect(
      analyticsAggregateService.rebuildDashboardAggregates('rwanda'),
    ).rejects.toThrow('Aggregate processing failed on the backend.');
  });

  it('returns null aggregate when callable reports integrity validation failure', async () => {
    const getAggregateFn = vi.fn().mockRejectedValue({
      code: 'functions/failed-precondition',
      message: 'Overview aggregate integrity validation failed. Use raw dashboard analytics for this filter context.',
    });
    const rebuildFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');
    const result = await analyticsAggregateService.getDashboardOverviewAggregateWithFallback('burundi', 'BANCOBU', 'all');

    expect(result.aggregate).toBeNull();
    expect(result.fallbackReason).toContain('integrity validation failed');
  });

  it('returns null aggregate when Firestore bucket has bank counts exceeding the denominator', async () => {
    const getAggregateFn = vi.fn().mockRejectedValue({
      code: 'functions/permission-denied',
      message: 'Subscriber access is required.',
    });
    const rebuildFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        rebuildStatus: 'ready',
        coverageComplete: true,
        supportedMetrics: [],
        supportedFilters: { country: true, selectedBank: true, timeWindow: true, ageGroups: false, genders: false },
        supportedModules: { overview: true, awareness: true, usageTopline: true, usageDeep: false, momentum: false, trends: false, competitive: false },
        supportedCompareMetrics: [],
      }),
    });

    getDocsMock.mockResolvedValue({
      docs: [
        {
          data: () => ({
            country: 'burundi',
            dateBucket: '2026-03-27',
            responseCount: 40,
            analyticsIncludedCount: 43,
            completedCount: 40,
            terminatedCount: 0,
            suspiciousCount: 0,
            repeatCount: 0,
            fastCount: 0,
            duplicateCount: 0,
            banks: {
              BANCOBU: {
                awareCount: 57,
                topOfMindCount: 10,
                spontaneousCount: 30,
                aidedCount: 20,
                everUsedCount: 15,
                currentUsingCount: 10,
                preferredCount: 8,
                considerCount: 5,
              },
            },
          }),
        },
      ],
    });

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');
    const result = await analyticsAggregateService.getDashboardOverviewAggregateWithFallback('burundi', 'BANCOBU', 'all');

    expect(result.aggregate).toBeNull();
  });

  it('returns null aggregate when active ageGroups filter is unsupported by the aggregate contract', async () => {
    const getAggregateFn = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        aggregate: {
          country: 'burundi',
          bankId: 'BANCOBU',
          timeWindow: 'all',
          generatedAt: '2026-04-01T00:00:00.000Z',
          contract: {
            aggregateSchemaVersion: 3,
            methodologyVersion: 'v1',
            supportedMetrics: ['aware', 'currentUsing'],
            supportedFilters: { country: true, selectedBank: true, timeWindow: true, ageGroups: false, genders: false },
            supportedModules: { overview: true, awareness: true, usageTopline: true, usageDeep: false, momentum: false, trends: false, competitive: false },
            supportedCompareMetrics: [],
          },
          integrity: { rebuildStatus: 'ready', coverageComplete: true, rebuiltAt: '2026-04-01T00:00:00.000Z' },
          sampleSize: 62,
          statusCounts: { completed: 62, terminated: 13 },
          flagCounts: { suspicious: 0, repeat: 0, fast: 0, duplicate: 0 },
          selectedMetrics: null,
          marketRows: [],
          monthOverMonth: {
            current: null,
            previous: null,
            deltas: { awareness: null, topOfMind: null, spontaneous: null, quality: null, usage: null },
          },
          monthlyTrend: [],
        },
      },
    });
    const rebuildFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');
    const result = await analyticsAggregateService.getDashboardOverviewAggregateWithFallback(
      'burundi',
      'BANCOBU',
      'all',
      { ageGroups: ['25-34'] },
    );

    expect(result.aggregate).toBeNull();
    expect(result.fallbackReason).toContain('integrity validation failed');
  });

  it('accepts a valid aggregate and returns it without fallback when all invariants pass', async () => {
    const getAggregateFn = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        aggregate: {
          country: 'burundi',
          bankId: 'BAN_BI',
          timeWindow: 'all',
          generatedAt: '2026-05-02T16:36:35.000Z',
          contract: {
            aggregateSchemaVersion: 3,
            methodologyVersion: 'v1',
            supportedMetrics: ['aware', 'topOfMind', 'currentUsing', 'preferred', 'everUsed', 'considerationRate', 'trialRate', 'retentionRate', 'churnRate', 'preferenceRate'],
            supportedFilters: { country: true, selectedBank: true, timeWindow: true, ageGroups: false, genders: false },
            supportedModules: { overview: true, awareness: true, usageTopline: true, usageDeep: false, momentum: false, trends: false, competitive: false },
            supportedCompareMetrics: ['aware', 'currentUsing'],
          },
          integrity: { rebuildStatus: 'ready', coverageComplete: true, rebuiltAt: '2026-05-02T16:36:35.000Z' },
          sampleSize: 62,
          statusCounts: { completed: 62, terminated: 13, included: 62, screenedOut: 13, under18: 0 },
          flagCounts: { suspicious: 0, repeat: 0, fast: 0, duplicate: 0 },
          selectedMetrics: null,
          marketRows: [
            {
              bankId: 'BAN_BI', bankName: 'BANCOBU', sample: 62,
              awareCount: 57, everUsedCount: 15, currentUsingCount: 12, preferredCount: 8, considerCount: 30,
              awareness: 92, topOfMind: 20, everUsed: 24, currentUsage: 19, preferredUsage: 13,
              consideration: 48, trialRate: 26, retentionRate: 80, churnRate: 20, preferenceRate: 67,
              nps: 5, preferred: 13, marketShare: 13, shareOfVoice: 15, rank: 1, movement: null,
            },
          ],
          monthOverMonth: {
            current: null,
            previous: null,
            deltas: { awareness: null, topOfMind: null, spontaneous: null, quality: null, usage: null },
          },
          monthlyTrend: [],
        },
      },
    });
    const rebuildFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');
    const result = await analyticsAggregateService.getDashboardOverviewAggregateWithFallback('burundi', 'BAN_BI', 'all');

    expect(result.aggregate).not.toBeNull();
    expect(result.fallbackReason).toBeNull();
    expect(result.aggregate!.sampleSize).toBe(62);
    expect(result.source).toBe('callable');
  });

  it('routes destructive survey reset requests through the backend callable', async () => {
    const getAggregateFn = vi.fn();
    const rebuildFn = vi.fn();
    const resetFn = vi.fn().mockResolvedValue({
      data: { ok: true, deletedResponses: 95, deletedAggregates: 41 },
    });

    httpsCallableMock
      .mockReturnValueOnce(getAggregateFn)
      .mockReturnValueOnce(rebuildFn)
      .mockReturnValueOnce(resetFn);

    const { analyticsAggregateService } = await import('@/services/analyticsAggregateService');
    const result = await analyticsAggregateService.resetSurveyAnalyticsData({
      confirmText: 'RESET SURVEY DATA',
      clearResponses: true,
      clearAggregates: true,
    });

    expect(resetFn).toHaveBeenCalledWith({
      confirmText: 'RESET SURVEY DATA',
      clearResponses: true,
      clearAggregates: true,
    });
    expect(result.deletedResponses).toBe(95);
    expect(result.deletedAggregates).toBe(41);
  });
});
