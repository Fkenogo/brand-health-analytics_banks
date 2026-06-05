import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ALL_BANKS } from '@/constants';
import { db, functions } from '@/lib/firebase';
import { ANALYTICS_BASE_TYPES } from '@/constants';
import type { AnalyticsMetricCompare, AnalyticsMetricValue, CountryCode } from '@/types';
import { createCompareMetric, createMetric } from '@/utils/subscriberDashboard';

export type OverviewTimeWindow = '30d' | '90d' | '12m' | 'all';
export type AggregateMetricKey =
  | 'aware'
  | 'topOfMind'
  | 'spontaneous'
  | 'aided'
  | 'everUsed'
  | 'currentUsing'
  | 'preferred'
  | 'considerationRate'
  | 'trialRate'
  | 'retentionRate'
  | 'churnRate'
  | 'preferenceRate'
  | 'awarenessQuality'
  | 'nps'
  | 'loyaltyIndex'
  | 'brandEdgeScore';

export interface OverviewAggregateSelectedMetrics {
  sample: number;
  aware: number;
  topOfMind: number;
  spontaneous: number;
  aided: number;
  everUsed: number;
  currentUsing: number;
  preferred: number;
  consider: number;
  considerCount: number;
  awareCount: number;
  everUsedCount: number;
  currentUsingCount: number;
  preferredCount: number;
  trialRate: number;
  retentionRate: number;
  churnRate: number;
  preferenceRate: number;
  considerationRate: number;
  awarenessQuality: number;
  nps: number;
  promoters: number;
  passives: number;
  detractors: number;
  loyaltyIndex: number;
  loyaltyCounts: Record<string, number>;
  segmentPcts: Record<string, number>;
  switchingRisk: number;
  brandEdgeScore: number;
}

export interface OverviewAggregateMarketRow {
  bankId: string;
  bankName: string;
  sample: number;
  awareCount: number;
  everUsedCount: number;
  currentUsingCount: number;
  preferredCount: number;
  considerCount: number;
  awareness: number;
  topOfMind: number;
  everUsed: number;
  currentUsage: number;
  preferredUsage: number;
  consideration: number;
  trialRate: number;
  retentionRate: number;
  churnRate: number;
  preferenceRate: number;
  nps: number;
  preferred: number;
  marketShare: number;
  shareOfVoice: number;
  rank: number;
  movement: number | null;
}

export interface AggregateContract {
  aggregateSchemaVersion: number;
  methodologyVersion: string;
  supportedMetrics: AggregateMetricKey[];
  supportedFilters: {
    country: boolean;
    selectedBank: boolean;
    timeWindow: boolean;
    ageGroups: boolean;
    genders: boolean;
  };
  supportedModules: {
    overview: boolean;
    awareness: boolean;
    usageTopline: boolean;
    usageDeep: boolean;
    momentum: boolean;
    trends: boolean;
    competitive: boolean;
  };
  supportedCompareMetrics: AggregateMetricKey[];
}

export type UsageAggregateMetricKey =
  | 'everUsed'
  | 'currentUsage'
  | 'preferred'
  | 'consideration'
  | 'trialRate'
  | 'retention'
  | 'churn'
  | 'preferenceCapture';

export interface UsageAggregateMetric extends AnalyticsMetricValue {
  key: UsageAggregateMetricKey;
  label: string;
  count: number;
}

export type UsageAggregateMetrics = Record<UsageAggregateMetricKey, UsageAggregateMetric>;

export interface DashboardOverviewAggregate {
  country: CountryCode;
  bankId: string;
  timeWindow: OverviewTimeWindow;
  generatedAt: string;
  contract: AggregateContract;
  integrity?: {
    rebuildStatus: 'ready' | 'rebuilding' | 'stale' | 'missing';
    coverageComplete: boolean;
    rebuiltAt: string | null;
  };
  sampleSize: number;
  statusCounts: {
    completed: number;
    terminated: number;
    included: number;
    screenedOut: number;
    under18: number;
  };
  flagCounts: {
    suspicious: number;
    repeat: number;
    fast: number;
    duplicate: number;
  };
  selectedMetrics: OverviewAggregateSelectedMetrics | null;
  marketRows: OverviewAggregateMarketRow[];
  monthOverMonth: {
    current: OverviewAggregateSelectedMetrics | null;
    previous: OverviewAggregateSelectedMetrics | null;
    deltas: {
      awareness: number | null;
      topOfMind: number | null;
      spontaneous: number | null;
      quality: number | null;
      usage: number | null;
    };
  };
  monthlyTrend: Array<{
    monthKey: string;
    month: string;
    awareness: number;
    topOfMind: number;
    spontaneous: number;
    usage: number;
    nps: number;
    brandEdgeScore: number;
    marketShare: number;
  }>;
}

export interface AggregateBackedLoyaltySummary {
  awareCount: number;
  segmentCounts: Record<string, number>;
  segmentPcts: Record<string, number>;
  loyaltyIndex: number;
  nps: number;
  movementRows: Array<{
    segment: string;
    currentPct: number;
    previousPct: number;
    deltaPct: number;
  }>;
  awareToPotential: number;
  potentialToFavors: number;
  favorsToCommitted: number;
}

export interface AggregateBackedMomentumSummary {
  score: number;
  status: 'Excellent Momentum' | 'Good Momentum' | 'Moderate Momentum' | 'Weak Momentum' | 'Crisis Momentum';
  strategy: 'Scale and defend' | 'Optimize and grow' | 'Fix and rebuild' | 'Urgent intervention' | 'Emergency turnaround';
  components: {
    awarenessGrowth: number;
    consideration: number;
    conversion: number;
    retention: number;
    adoption: number;
  };
}

type AggregateBankCounts = {
  awareCount: number;
  topOfMindCount: number;
  spontaneousCount: number;
  aidedCount: number;
  everUsedCount: number;
  currentUsingCount: number;
  preferredCount: number;
  considerCount: number;
  promoterCount: number;
  passiveCount: number;
  detractorCount: number;
  npsBase: number;
  loyaltyCounts: Record<string, number>;
};

type AggregateDoc = {
  country?: CountryCode;
  dateBucket?: string;
  methodology_version?: string;
  methodologyVersion?: string;
  responseCount?: number;
  analyticsIncludedCount?: number;
  screenedOutCount?: number;
  screenedOutUnder18Count?: number;
  completedCount?: number;
  terminatedCount?: number;
  suspiciousCount?: number;
  repeatCount?: number;
  fastCount?: number;
  duplicateCount?: number;
  banks?: Record<string, Partial<AggregateBankCounts>>;
};

type AggregateLoadResult = {
  aggregate: DashboardOverviewAggregate | null;
  source: 'callable' | 'firestore';
  fallbackReason: string | null;
};

type AggregateFilterScope = {
  ageGroups?: string[];
  genders?: string[];
};

type AggregateValidationContext = {
  country: CountryCode;
  timeWindow?: OverviewTimeWindow;
  source: 'callable' | 'firestore';
  phase: 'bucket' | 'payload' | 'filter';
};

const RESPONSE_ANALYTICS_COLLECTION = 'responseAnalyticsDaily';
const RESPONSE_ANALYTICS_STATUS_COLLECTION = 'responseAnalyticsStatus';
const DEFAULT_METHODOLOGY_VERSION = 'v1';
const BRAND_EDGE_WEIGHTS = {
  awareness: 0.3,
  usage: 0.3,
  loyalty: 0.2,
  primaryShare: 0.1,
  switchingRisk: -0.1,
} as const;

const round = (value: number) => Math.round(Number(value || 0));
const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const aggregateWarn = (event: string, details: Record<string, unknown>) => {
  console.warn(`[analytics_aggregate] ${event}`, { event, ...details });
};

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

const methodologyVersionFor = (value: { methodology_version?: string; methodologyVersion?: string } | null | undefined) =>
  String(value?.methodology_version || value?.methodologyVersion || DEFAULT_METHODOLOGY_VERSION);

const unsupportedFilterReasons = (contract: AggregateContract | null | undefined, filters?: AggregateFilterScope) => {
  const reasons: string[] = [];
  if (!contract?.supportedFilters?.country) reasons.push('country');
  if (!contract?.supportedFilters?.selectedBank) reasons.push('selectedBank');
  if (!contract?.supportedFilters?.timeWindow) reasons.push('timeWindow');
  if ((filters?.ageGroups?.length || 0) > 0 && !contract?.supportedFilters?.ageGroups) reasons.push('ageGroups');
  if ((filters?.genders?.length || 0) > 0 && !contract?.supportedFilters?.genders) reasons.push('genders');
  return reasons;
};

const validateAggregateBucket = (docData: AggregateDoc, context: AggregateValidationContext) => {
  const failures: string[] = [];
  const requiredFields = ['analyticsIncludedCount'];
  requiredFields.forEach((field) => {
    if (!hasOwn(docData, field)) failures.push(`missing_${field}`);
  });

  const sample = Number(docData.analyticsIncludedCount);
  if (!Number.isFinite(sample) || sample < 0) failures.push('invalid_analyticsIncludedCount');

  Object.entries(docData.banks || {}).forEach(([bankId, bankData]) => {
    const checks = [
      ['awareCount', bankData.awareCount],
      ['topOfMindCount', bankData.topOfMindCount],
      ['spontaneousCount', bankData.spontaneousCount],
      ['aidedCount', bankData.aidedCount],
      ['everUsedCount', bankData.everUsedCount],
      ['currentUsingCount', bankData.currentUsingCount],
      ['preferredCount', bankData.preferredCount],
      ['considerCount', bankData.considerCount],
    ] as const;
    checks.forEach(([field, raw]) => {
      const value = Number(raw || 0);
      if (Number.isFinite(sample) && value > sample) {
        failures.push(`${bankId}.${field}_exceeds_denominator`);
      }
      if (!Number.isFinite(value) || value < 0) {
        failures.push(`${bankId}.${field}_invalid`);
      }
    });
  });

  if (failures.length > 0) {
    aggregateWarn('aggregate_bucket_validation_failed', {
      ...context,
      country: docData.country || context.country,
      dateBucket: docData.dateBucket || 'unknown',
      methodologyVersion: methodologyVersionFor(docData),
      failures,
    });
  }
  return failures;
};

const validateAggregatePayload = (
  aggregate: DashboardOverviewAggregate,
  context: AggregateValidationContext,
  filters?: AggregateFilterScope,
) => {
  const failures: string[] = [];
  const sample = Number(aggregate.sampleSize);
  if (!Number.isFinite(sample) || sample < 0) failures.push('invalid_sampleSize');
  if (!aggregate.contract?.methodologyVersion) failures.push('missing_methodologyVersion');
  const unsupportedFilters = unsupportedFilterReasons(aggregate.contract, filters);
  unsupportedFilters.forEach((filter) => failures.push(`unsupported_filter_${filter}`));

  aggregate.marketRows.forEach((row) => {
    const checks = [
      ['awareCount', row.awareCount],
      ['everUsedCount', row.everUsedCount],
      ['currentUsingCount', row.currentUsingCount],
      ['preferredCount', row.preferredCount],
      ['considerCount', row.considerCount],
    ] as const;
    checks.forEach(([field, raw]) => {
      const value = Number(raw || 0);
      if (Number.isFinite(sample) && value > sample) failures.push(`${row.bankId}.${field}_exceeds_denominator`);
      if (!Number.isFinite(value) || value < 0) failures.push(`${row.bankId}.${field}_invalid`);
    });
  });

  if (aggregate.selectedMetrics) {
    const selected = aggregate.selectedMetrics;
    [
      ['selected.awareCount', selected.awareCount],
      ['selected.everUsedCount', selected.everUsedCount],
      ['selected.currentUsingCount', selected.currentUsingCount],
      ['selected.preferredCount', selected.preferredCount],
      ['selected.considerCount', selected.considerCount],
    ].forEach(([field, raw]) => {
      const value = Number(raw || 0);
      if (Number.isFinite(sample) && value > sample) failures.push(`${field}_exceeds_denominator`);
    });
  }

  if (failures.length > 0) {
    aggregateWarn('aggregate_payload_validation_failed', {
      ...context,
      bankId: aggregate.bankId,
      methodologyVersion: aggregate.contract?.methodologyVersion || null,
      failures,
    });
  }
  return failures;
};

const momentumFromComponents = (
  awarenessGrowthScore: number,
  considerationRate: number,
  conversionRate: number,
  retentionRate: number,
  adoptionRate: number,
) => {
  const weighted =
    awarenessGrowthScore * 0.25 +
    considerationRate * 0.2 +
    conversionRate * 0.2 +
    retentionRate * 0.2 +
    adoptionRate * 0.15;
  return clamp(round(weighted), 0, 100);
};

const growthToScore = (growthPoints: number) => {
  if (growthPoints >= 10) return 100;
  if (growthPoints <= -10) return 0;
  return round(((growthPoints + 10) / 20) * 100);
};

const scoreStatus = (score: number): AggregateBackedMomentumSummary['status'] => {
  if (score >= 80) return 'Excellent Momentum';
  if (score >= 60) return 'Good Momentum';
  if (score >= 40) return 'Moderate Momentum';
  if (score >= 20) return 'Weak Momentum';
  return 'Crisis Momentum';
};

const scoreStrategy = (score: number): AggregateBackedMomentumSummary['strategy'] => {
  if (score >= 80) return 'Scale and defend';
  if (score >= 60) return 'Optimize and grow';
  if (score >= 40) return 'Fix and rebuild';
  if (score >= 20) return 'Urgent intervention';
  return 'Emergency turnaround';
};

const emptyBankCounts = (): AggregateBankCounts => ({
  awareCount: 0,
  topOfMindCount: 0,
  spontaneousCount: 0,
  aidedCount: 0,
  everUsedCount: 0,
  currentUsingCount: 0,
  preferredCount: 0,
  considerCount: 0,
  promoterCount: 0,
  passiveCount: 0,
  detractorCount: 0,
  npsBase: 0,
  loyaltyCounts: {
    Committed: 0,
    Favors: 0,
    Potential: 0,
    Accessibles: 0,
    Rejectors: 0,
  },
});

const ensureBankCounts = (aggregate: AggregateDoc, bankId: string) => {
  aggregate.banks ||= {};
  if (!aggregate.banks[bankId]) {
    aggregate.banks[bankId] = emptyBankCounts();
  }
  return aggregate.banks[bankId] as AggregateBankCounts;
};

const createEmptyAggregateDoc = (country: CountryCode): AggregateDoc => ({
  country,
  dateBucket: 'merged',
  methodology_version: DEFAULT_METHODOLOGY_VERSION,
  responseCount: 0,
  analyticsIncludedCount: 0,
  screenedOutCount: 0,
  screenedOutUnder18Count: 0,
  completedCount: 0,
  terminatedCount: 0,
  suspiciousCount: 0,
  repeatCount: 0,
  fastCount: 0,
  duplicateCount: 0,
  banks: {},
});

const mergeAggregateDocs = (country: CountryCode, docs: AggregateDoc[]): AggregateDoc => {
  const merged = createEmptyAggregateDoc(country);
  merged.methodology_version = methodologyVersionFor(docs[0]);
  docs.forEach((docData) => {
    merged.responseCount = Number(merged.responseCount || 0) + Number(docData.responseCount || 0);
    merged.analyticsIncludedCount = Number(merged.analyticsIncludedCount || 0) + Number(docData.analyticsIncludedCount || 0);
    merged.screenedOutCount = Number(merged.screenedOutCount || 0) + Number(docData.screenedOutCount || 0);
    merged.screenedOutUnder18Count = Number(merged.screenedOutUnder18Count || 0) + Number(docData.screenedOutUnder18Count || 0);
    merged.completedCount = Number(merged.completedCount || 0) + Number(docData.completedCount || 0);
    merged.terminatedCount = Number(merged.terminatedCount || 0) + Number(docData.terminatedCount || 0);
    merged.suspiciousCount = Number(merged.suspiciousCount || 0) + Number(docData.suspiciousCount || 0);
    merged.repeatCount = Number(merged.repeatCount || 0) + Number(docData.repeatCount || 0);
    merged.fastCount = Number(merged.fastCount || 0) + Number(docData.fastCount || 0);
    merged.duplicateCount = Number(merged.duplicateCount || 0) + Number(docData.duplicateCount || 0);

    Object.entries(docData.banks || {}).forEach(([bankId, bankData]) => {
      const counts = ensureBankCounts(merged, bankId);
      counts.awareCount += Number(bankData.awareCount || 0);
      counts.topOfMindCount += Number(bankData.topOfMindCount || 0);
      counts.spontaneousCount += Number(bankData.spontaneousCount || 0);
      counts.aidedCount += Number(bankData.aidedCount || 0);
      counts.everUsedCount += Number(bankData.everUsedCount || 0);
      counts.currentUsingCount += Number(bankData.currentUsingCount || 0);
      counts.preferredCount += Number(bankData.preferredCount || 0);
      counts.considerCount += Number(bankData.considerCount || 0);
      counts.promoterCount += Number(bankData.promoterCount || 0);
      counts.passiveCount += Number(bankData.passiveCount || 0);
      counts.detractorCount += Number(bankData.detractorCount || 0);
      counts.npsBase += Number(bankData.npsBase || 0);
      Object.keys(counts.loyaltyCounts).forEach((key) => {
        counts.loyaltyCounts[key] += Number(bankData.loyaltyCounts?.[key] || 0);
      });
    });
  });
  return merged;
};

const summarizeBankCounts = (counts: AggregateBankCounts, sampleSize: number): OverviewAggregateSelectedMetrics => {
  const aware = round(pct(counts.awareCount, sampleSize));
  const topOfMind = round(pct(counts.topOfMindCount, sampleSize));
  const spontaneous = round(pct(counts.spontaneousCount, sampleSize));
  const aided = round(pct(counts.aidedCount, sampleSize));
  const everUsed = round(pct(counts.everUsedCount, sampleSize));
  const currentUsing = round(pct(counts.currentUsingCount, sampleSize));
  const preferred = round(pct(counts.preferredCount, sampleSize));
  const considerationRate = round(pct(counts.considerCount, counts.awareCount));
  const trialRate = round(pct(counts.everUsedCount, counts.awareCount));
  const retentionRate = round(pct(counts.currentUsingCount, counts.everUsedCount));
  const preferenceRate = round(pct(counts.preferredCount, counts.currentUsingCount));
  const churnRate = round(Math.max(0, 100 - retentionRate));
  const awarenessQuality = round(pct(counts.topOfMindCount, counts.awareCount));
  const promoters = round(pct(counts.promoterCount, counts.npsBase));
  const passives = round(pct(counts.passiveCount, counts.npsBase));
  const detractors = round(pct(counts.detractorCount, counts.npsBase));
  const nps = round(promoters - detractors);
  const loyaltyAwareTotal = Object.values(counts.loyaltyCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const segmentPcts = {
    Committed: round(pct(counts.loyaltyCounts.Committed, loyaltyAwareTotal)),
    Favors: round(pct(counts.loyaltyCounts.Favors, loyaltyAwareTotal)),
    Potential: round(pct(counts.loyaltyCounts.Potential, loyaltyAwareTotal)),
    Accessibles: round(pct(counts.loyaltyCounts.Accessibles, loyaltyAwareTotal)),
    Rejectors: round(pct(counts.loyaltyCounts.Rejectors, loyaltyAwareTotal)),
  };
  const loyaltyIndexRaw =
    counts.loyaltyCounts.Committed * 100 +
    counts.loyaltyCounts.Favors * 70 +
    counts.loyaltyCounts.Potential * 40 +
    counts.loyaltyCounts.Accessibles * 20;
  const loyaltyIndex = round(loyaltyIndexRaw / (loyaltyAwareTotal || 1));

  return {
    sample: sampleSize,
    aware,
    topOfMind,
    spontaneous,
    aided,
    everUsed,
    currentUsing,
    preferred,
    consider: round(pct(counts.considerCount, sampleSize)),
    considerCount: Number(counts.considerCount || 0),
    awareCount: Number(counts.awareCount || 0),
    everUsedCount: Number(counts.everUsedCount || 0),
    currentUsingCount: Number(counts.currentUsingCount || 0),
    preferredCount: Number(counts.preferredCount || 0),
    trialRate,
    retentionRate,
    churnRate,
    preferenceRate,
    considerationRate,
    awarenessQuality,
    nps,
    promoters,
    passives,
    detractors,
    loyaltyIndex,
    loyaltyCounts: counts.loyaltyCounts,
    segmentPcts,
    switchingRisk: churnRate,
    brandEdgeScore: 0,
  };
};

const computeBrandEdgeScore = (metrics: {
  awareness: number;
  usage: number;
  loyalty: number;
  primaryShare: number;
  switchingRisk: number;
}) => {
  const score =
    metrics.awareness * BRAND_EDGE_WEIGHTS.awareness +
    metrics.usage * BRAND_EDGE_WEIGHTS.usage +
    metrics.loyalty * BRAND_EDGE_WEIGHTS.loyalty +
    metrics.primaryShare * BRAND_EDGE_WEIGHTS.primaryShare +
    metrics.switchingRisk * BRAND_EDGE_WEIGHTS.switchingRisk;
  return clamp(round(score), 0, 100);
};

const monthKeyLabel = (monthKey: string) => {
  const date = new Date(`${monthKey}-01T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? monthKey : date.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
};

const dateBucketRangeForWindow = (timeWindow: OverviewTimeWindow, now = new Date()) => {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (timeWindow === 'all') {
    return { startBucket: null as string | null, endBucket: end.toISOString().slice(0, 10) };
  }
  const start = new Date(now);
  const days = timeWindow === '30d' ? 29 : timeWindow === '90d' ? 89 : 364;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  return {
    startBucket: start.toISOString().slice(0, 10),
    endBucket: end.toISOString().slice(0, 10),
  };
};

const previousMonthRange = (now = new Date()) => {
  const currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const previousEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  return {
    currentMonthStartBucket: currentStart.toISOString().slice(0, 10),
    previousMonthStartBucket: previousStart.toISOString().slice(0, 10),
    previousMonthEndBucket: previousEnd.toISOString().slice(0, 10),
  };
};

const buildOverviewSnapshot = (
  country: CountryCode,
  aggregate: AggregateDoc,
  selectedBankId: string,
) => {
  const banks = ALL_BANKS.filter((bank) => bank.country === country);
  const responseCount = Number(aggregate.responseCount || 0);
  const includedCount = Number(aggregate.analyticsIncludedCount ?? aggregate.completedCount ?? 0);
  const screenedOutCount = Number(aggregate.screenedOutCount ?? Math.max(0, responseCount - includedCount));
  const under18Count = Number(aggregate.screenedOutUnder18Count || 0);
  const sampleSize = includedCount;
  const rawRows = banks.map((bank) => {
    const counts = (aggregate.banks?.[bank.id] as AggregateBankCounts | undefined) || emptyBankCounts();
    const metrics = summarizeBankCounts(counts, sampleSize);
    return {
      bankId: bank.id,
      bankName: bank.name,
      metrics,
      preferredCount: Number(counts.preferredCount || 0),
    };
  });
  const tomTotal = rawRows.reduce((sum, row) => sum + row.metrics.topOfMind, 0) || 1;
  const marketRows = rawRows.map((row, index) => ({
    bankId: row.bankId,
    bankName: row.bankName,
    sample: sampleSize,
    awareCount: row.metrics.awareCount,
    everUsedCount: row.metrics.everUsedCount,
    currentUsingCount: row.metrics.currentUsingCount,
    preferredCount: row.metrics.preferredCount,
    considerCount: row.metrics.considerCount,
    awareness: row.metrics.aware,
    topOfMind: row.metrics.topOfMind,
    everUsed: row.metrics.everUsed,
    currentUsage: row.metrics.currentUsing,
    preferredUsage: row.metrics.preferred,
    consideration: row.metrics.consider,
    trialRate: row.metrics.trialRate,
    retentionRate: row.metrics.retentionRate,
    churnRate: row.metrics.churnRate,
    preferenceRate: row.metrics.preferenceRate,
    nps: row.metrics.nps,
    preferred: row.metrics.preferred,
    marketShare: round(pct(row.preferredCount, sampleSize)),
    shareOfVoice: round(pct(row.metrics.topOfMind, tomTotal)),
    rank: index + 1,
    movement: null,
  })).sort((a, b) => b.awareness - a.awareness).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));

  const selected = rawRows.find((row) => row.bankId === selectedBankId) || null;
  const selectedShare = marketRows.find((row) => row.bankId === selectedBankId)?.marketShare || 0;
  const selectedMetrics = selected
    ? {
        ...selected.metrics,
        brandEdgeScore: computeBrandEdgeScore({
          awareness: selected.metrics.aware,
          usage: selected.metrics.currentUsing,
          loyalty: selected.metrics.loyaltyIndex,
          primaryShare: selectedShare,
          switchingRisk: selected.metrics.switchingRisk,
        }),
      }
    : null;

  return {
    sampleSize,
    statusCounts: {
      completed: Number(aggregate.completedCount || 0),
      terminated: Number(aggregate.terminatedCount || 0),
      included: includedCount,
      screenedOut: screenedOutCount,
      under18: under18Count,
    },
    flagCounts: {
      suspicious: Number(aggregate.suspiciousCount || 0),
      repeat: Number(aggregate.repeatCount || 0),
      fast: Number(aggregate.fastCount || 0),
      duplicate: Number(aggregate.duplicateCount || 0),
    },
    selectedMetrics,
    marketRows,
  };
};

const fetchAggregateDocs = async (country: CountryCode, startBucket: string | null, endBucket: string) => {
  const constraints = [
    where('country', '==', country),
    where('dateBucket', '<=', endBucket),
  ];
  if (startBucket) {
    constraints.push(where('dateBucket', '>=', startBucket));
  }
  const snapshot = await getDocs(query(collection(db, RESPONSE_ANALYTICS_COLLECTION), ...constraints));
  return snapshot.docs.map((docSnap) => docSnap.data() as AggregateDoc);
};

const assertValidAggregateDocs = (
  docs: AggregateDoc[],
  context: Omit<AggregateValidationContext, 'phase'>,
) => {
  if (docs.length === 0) {
    aggregateWarn('aggregate_validation_failed', {
      ...context,
      phase: 'bucket',
      failures: ['no_aggregate_buckets'],
    });
    throw new Error('Overview aggregate data is not available for this filter context.');
  }
  const failures = docs.flatMap((docData) => validateAggregateBucket(docData, { ...context, phase: 'bucket' }));
  if (failures.length > 0) {
    aggregateWarn('aggregate_raw_fallback_triggered', {
      ...context,
      phase: 'bucket',
      bucketCount: docs.length,
      failureCount: failures.length,
    });
    throw new Error('Overview aggregate integrity validation failed. Falling back to live-response analytics.');
  }
};

const assertValidAggregatePayload = (
  aggregate: DashboardOverviewAggregate,
  context: Omit<AggregateValidationContext, 'phase'>,
  filters?: AggregateFilterScope,
) => {
  const failures = validateAggregatePayload(aggregate, { ...context, phase: 'payload' }, filters);
  if (failures.length > 0) {
    aggregateWarn('aggregate_raw_fallback_triggered', {
      ...context,
      phase: 'payload',
      bankId: aggregate.bankId,
      failureCount: failures.length,
    });
    throw new Error('Overview aggregate integrity validation failed. Falling back to live-response analytics.');
  }
};

const buildDirectOverviewAggregate = async (
  country: CountryCode,
  bankId: string,
  timeWindow: OverviewTimeWindow,
): Promise<DashboardOverviewAggregate> => {
  const statusSnap = await getDoc(doc(db, RESPONSE_ANALYTICS_STATUS_COLLECTION, country));
  const statusData = statusSnap.exists() ? statusSnap.data() || {} : {};
  if (String(statusData.rebuildStatus || '') !== 'ready' || statusData.coverageComplete !== true) {
    throw new Error('Overview aggregates are still rebuilding for this country. The dashboard should fall back to live-response analytics until rebuild completes.');
  }

  const currentWindow = dateBucketRangeForWindow(timeWindow);
  const monthRanges = previousMonthRange();
  const [currentDocs, currentMonthDocs, previousMonthDocs, trendDocs] = await Promise.all([
    fetchAggregateDocs(country, currentWindow.startBucket, currentWindow.endBucket),
    fetchAggregateDocs(country, monthRanges.currentMonthStartBucket, currentWindow.endBucket),
    fetchAggregateDocs(country, monthRanges.previousMonthStartBucket, monthRanges.previousMonthEndBucket),
    fetchAggregateDocs(country, (() => {
      const start = new Date();
      start.setUTCDate(1);
      start.setUTCMonth(start.getUTCMonth() - 5);
      return start.toISOString().slice(0, 10);
    })(), currentWindow.endBucket),
  ]);

  const baseContext = { country, timeWindow, source: 'firestore' as const };
  assertValidAggregateDocs(currentDocs, baseContext);
  if (currentMonthDocs.length > 0) assertValidAggregateDocs(currentMonthDocs, baseContext);
  if (previousMonthDocs.length > 0) assertValidAggregateDocs(previousMonthDocs, baseContext);
  if (trendDocs.length > 0) assertValidAggregateDocs(trendDocs, baseContext);

  const currentOverview = buildOverviewSnapshot(country, mergeAggregateDocs(country, currentDocs), bankId);
  const currentMonthOverview = buildOverviewSnapshot(country, mergeAggregateDocs(country, currentMonthDocs), bankId);
  const previousMonthOverview = buildOverviewSnapshot(country, mergeAggregateDocs(country, previousMonthDocs), bankId);

  const currentMonthMetrics = currentMonthOverview.selectedMetrics;
  const previousMonthMetrics = previousMonthOverview.selectedMetrics;

  const trendByMonth = new Map<string, AggregateDoc[]>();
  trendDocs.forEach((docData) => {
    const monthKey = String(docData.dateBucket || '').slice(0, 7);
    if (!monthKey) return;
    const group = trendByMonth.get(monthKey) || [];
    group.push(docData);
    trendByMonth.set(monthKey, group);
  });

  const monthlyTrend = Array.from(trendByMonth.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([monthKey, monthDocs]) => {
      const snapshot = buildOverviewSnapshot(country, mergeAggregateDocs(country, monthDocs), bankId);
      const selectedMetrics = snapshot.selectedMetrics;
      const selectedRow = snapshot.marketRows.find((row) => row.bankId === bankId) || null;
      return {
        monthKey,
        month: monthKeyLabel(monthKey),
        awareness: selectedMetrics?.aware || 0,
        topOfMind: selectedMetrics?.topOfMind || 0,
        spontaneous: selectedMetrics?.spontaneous || 0,
        usage: selectedMetrics?.currentUsing || 0,
        nps: selectedMetrics?.nps || 0,
        brandEdgeScore: selectedMetrics?.brandEdgeScore || 0,
        marketShare: selectedRow?.marketShare || 0,
      };
    });

  return {
    country,
    bankId,
    timeWindow,
    generatedAt: new Date().toISOString(),
    contract: {
      aggregateSchemaVersion: Number(statusData.aggregateSchemaVersion || 2),
      methodologyVersion: String(statusData.methodologyVersion || statusData.methodology_version || DEFAULT_METHODOLOGY_VERSION),
      supportedMetrics: Array.isArray(statusData.supportedMetrics) ? statusData.supportedMetrics : [],
      supportedFilters: statusData.supportedFilters || {
        country: true,
        selectedBank: true,
        timeWindow: true,
        ageGroups: false,
        genders: false,
      },
      supportedModules: statusData.supportedModules || {
        overview: true,
        awareness: true,
        usageTopline: true,
        usageDeep: false,
        momentum: false,
        trends: false,
        competitive: false,
      },
      supportedCompareMetrics: Array.isArray(statusData.supportedCompareMetrics) ? statusData.supportedCompareMetrics : [],
    },
    integrity: {
      rebuildStatus: 'ready',
      coverageComplete: true,
      rebuiltAt: statusData.lastSuccessfulRebuildAt?.toDate?.()?.toISOString?.()
        || statusData.rebuildCompletedAt?.toDate?.()?.toISOString?.()
        || null,
    },
    sampleSize: currentOverview.sampleSize,
    statusCounts: currentOverview.statusCounts,
    flagCounts: currentOverview.flagCounts,
    selectedMetrics: currentOverview.selectedMetrics,
    marketRows: currentOverview.marketRows,
    monthOverMonth: {
      current: currentMonthMetrics,
      previous: previousMonthMetrics,
      deltas: {
        awareness: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.aware - previousMonthMetrics.aware : null,
        topOfMind: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.topOfMind - previousMonthMetrics.topOfMind : null,
        spontaneous: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.spontaneous - previousMonthMetrics.spontaneous : null,
        quality: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.awarenessQuality - previousMonthMetrics.awarenessQuality : null,
        usage: currentMonthMetrics && previousMonthMetrics ? currentMonthMetrics.currentUsing - previousMonthMetrics.currentUsing : null,
      },
    },
    monthlyTrend,
  };
};

const hasSupportedMetric = (aggregate: DashboardOverviewAggregate | null | undefined, metric: AggregateMetricKey) =>
  Boolean(aggregate?.contract?.supportedMetrics?.includes(metric));

const hasSupportedCompareMetric = (aggregate: DashboardOverviewAggregate | null | undefined, metric: AggregateMetricKey) =>
  Boolean(aggregate?.contract?.supportedCompareMetrics?.includes(metric));

const supportsUsageToplineAggregates = (aggregate: DashboardOverviewAggregate | null | undefined) =>
  Boolean(
    aggregate?.integrity?.coverageComplete
    && aggregate?.integrity?.rebuildStatus === 'ready'
    && aggregate?.contract?.supportedModules?.usageTopline
    && aggregate?.contract?.supportedFilters?.country
    && aggregate?.contract?.supportedFilters?.selectedBank
    && aggregate?.contract?.supportedFilters?.timeWindow,
  );

const buildUsageMetric = (
  key: UsageAggregateMetricKey,
  label: string,
  value: number,
  count: number,
  base_n: number,
  base_type: UsageAggregateMetric['base_type'],
  source: UsageAggregateMetric['source'],
  compare?: AnalyticsMetricCompare,
): UsageAggregateMetric => ({
  key,
  label,
  ...createMetric({
    value,
    count,
    base_n,
    base_type,
    source,
    metric_family: 'usage_topline',
    compare_supported: Boolean(compare),
    compare: compare ?? null,
  }),
});

export const buildUsageAggregateMetrics = (
  aggregate: DashboardOverviewAggregate | null | undefined,
  compareBankId?: string | null,
): UsageAggregateMetrics | null => {
  if (!aggregate || !supportsUsageToplineAggregates(aggregate) || !aggregate.selectedMetrics) return null;
  const requiredMetrics: AggregateMetricKey[] = [
    'everUsed',
    'currentUsing',
    'preferred',
    'considerationRate',
    'trialRate',
    'retentionRate',
    'churnRate',
    'preferenceRate',
  ];
  if (!requiredMetrics.every((metric) => hasSupportedMetric(aggregate, metric))) {
    return null;
  }

  const selected = aggregate.selectedMetrics;
  const compareRow = compareBankId
    ? aggregate.marketRows.find((row) => row.bankId === compareBankId) || null
    : null;
  const compareAllowed = (metric: AggregateMetricKey) => Boolean(compareRow && hasSupportedCompareMetric(aggregate, metric));
  const scopeSignature = `usage_topline:${aggregate.country}:${aggregate.timeWindow}`;

  const compareMetricFor = (
    value: number,
    baseN: number,
    baseType: UsageAggregateMetric['base_type'],
    compareValue: number | null | undefined,
    compareBaseN: number | null | undefined,
    compareRowValue: OverviewAggregateMarketRow | null,
  ) => {
    if (!compareRowValue || compareValue === null || compareValue === undefined || compareBaseN === null || compareBaseN === undefined) return undefined;
    return createCompareMetric(
      createMetric({
        value,
        base_n: baseN,
        base_type: baseType,
        source: 'aggregate',
        metric_family: 'usage_topline',
        scope_signature: scopeSignature,
      }),
      createMetric({
        value: compareValue,
        base_n: compareBaseN,
        base_type: baseType,
        source: 'aggregate',
        metric_family: 'usage_topline',
        scope_signature: scopeSignature,
      }),
      { bankId: compareRowValue.bankId, bankName: compareRowValue.bankName },
    ) || undefined;
  };

  return {
    everUsed: buildUsageMetric(
      'everUsed',
      'Ever Used',
      selected.everUsed,
      selected.everUsedCount,
      selected.sample,
      ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      'aggregate',
      compareAllowed('everUsed') && compareRow
        ? compareMetricFor(selected.everUsed, selected.sample, ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, compareRow.everUsed, compareRow.sample, compareRow)
        : undefined,
    ),
    currentUsage: buildUsageMetric(
      'currentUsage',
      'Current Usage',
      selected.currentUsing,
      selected.currentUsingCount,
      selected.sample,
      ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      'aggregate',
      compareAllowed('currentUsing') && compareRow
        ? compareMetricFor(selected.currentUsing, selected.sample, ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, compareRow.currentUsage, compareRow.sample, compareRow)
        : undefined,
    ),
    preferred: buildUsageMetric(
      'preferred',
      'Preferred',
      selected.preferred,
      selected.preferredCount,
      selected.sample,
      ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      'aggregate',
      compareAllowed('preferred') && compareRow
        ? compareMetricFor(selected.preferred, selected.sample, ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, compareRow.preferredUsage, compareRow.sample, compareRow)
        : undefined,
    ),
    consideration: buildUsageMetric(
      'consideration',
      'Consideration',
      selected.consider,
      selected.considerCount,
      selected.awareCount,
      ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS,
      'aggregate',
      undefined,
    ),
    trialRate: buildUsageMetric(
      'trialRate',
      'Trial Rate',
      selected.trialRate,
      selected.everUsedCount,
      selected.awareCount,
      ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS,
      'aggregate',
      compareAllowed('trialRate') && compareRow
        ? compareMetricFor(selected.trialRate, selected.awareCount, ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS, compareRow.trialRate, compareRow.awareCount, compareRow)
        : undefined,
    ),
    retention: buildUsageMetric(
      'retention',
      'Retention',
      selected.retentionRate,
      selected.currentUsingCount,
      selected.everUsedCount,
      ANALYTICS_BASE_TYPES.EVER_USED_RESPONDENTS,
      'aggregate',
      compareAllowed('retentionRate') && compareRow
        ? compareMetricFor(selected.retentionRate, selected.everUsedCount, ANALYTICS_BASE_TYPES.EVER_USED_RESPONDENTS, compareRow.retentionRate, compareRow.everUsedCount, compareRow)
        : undefined,
    ),
    churn: buildUsageMetric(
      'churn',
      'Churn',
      selected.churnRate,
      Math.max(selected.everUsedCount - selected.currentUsingCount, 0),
      selected.everUsedCount,
      ANALYTICS_BASE_TYPES.EVER_USED_RESPONDENTS,
      'aggregate',
      compareAllowed('churnRate') && compareRow
        ? compareMetricFor(selected.churnRate, selected.everUsedCount, ANALYTICS_BASE_TYPES.EVER_USED_RESPONDENTS, compareRow.churnRate, compareRow.everUsedCount, compareRow)
        : undefined,
    ),
    preferenceCapture: buildUsageMetric(
      'preferenceCapture',
      'Preference Capture',
      selected.preferenceRate,
      selected.preferredCount,
      selected.currentUsingCount,
      ANALYTICS_BASE_TYPES.CURRENT_USERS,
      'aggregate',
      compareAllowed('preferenceRate') && compareRow
        ? compareMetricFor(selected.preferenceRate, selected.currentUsingCount, ANALYTICS_BASE_TYPES.CURRENT_USERS, compareRow.preferenceRate, compareRow.currentUsingCount, compareRow)
        : undefined,
    ),
  };
};

export const buildAggregateBackedLoyaltySummary = (
  aggregate: DashboardOverviewAggregate | null | undefined,
): AggregateBackedLoyaltySummary | null => {
  const selected = aggregate?.selectedMetrics;
  if (!aggregate || !selected) return null;

  const current = aggregate.monthOverMonth.current;
  const previous = aggregate.monthOverMonth.previous;
  const segmentKeys = ['Committed', 'Favors', 'Potential', 'Accessibles', 'Rejectors'];

  return {
    awareCount: selected.awareCount,
    segmentCounts: { ...selected.loyaltyCounts },
    segmentPcts: { ...selected.segmentPcts },
    loyaltyIndex: selected.loyaltyIndex,
    nps: selected.nps,
    movementRows: segmentKeys.map((segment) => ({
      segment,
      currentPct: current?.segmentPcts?.[segment] ?? selected.segmentPcts[segment] ?? 0,
      previousPct: previous?.segmentPcts?.[segment] ?? 0,
      deltaPct: (current?.segmentPcts?.[segment] ?? selected.segmentPcts[segment] ?? 0) - (previous?.segmentPcts?.[segment] ?? 0),
    })),
    awareToPotential: selected.segmentPcts.Potential || 0,
    potentialToFavors: round(pct(selected.loyaltyCounts.Favors || 0, selected.loyaltyCounts.Potential || 0)),
    favorsToCommitted: round(pct(selected.loyaltyCounts.Committed || 0, selected.loyaltyCounts.Favors || 0)),
  };
};

export const buildAggregateBackedMomentumSummary = (
  aggregate: DashboardOverviewAggregate | null | undefined,
): AggregateBackedMomentumSummary | null => {
  const selected = aggregate?.selectedMetrics;
  if (!aggregate || !selected) return null;

  const previousAwareness = aggregate.monthOverMonth.previous?.aware ?? 0;
  const components = {
    awarenessGrowth: growthToScore(selected.aware - previousAwareness),
    consideration: selected.considerationRate,
    conversion: selected.trialRate,
    retention: selected.retentionRate,
    adoption: selected.preferenceRate,
  };
  const score = momentumFromComponents(
    components.awarenessGrowth,
    components.consideration,
    components.conversion,
    components.retention,
    components.adoption,
  );

  return {
    score,
    status: scoreStatus(score),
    strategy: scoreStrategy(score),
    components,
  };
};

const getDashboardOverviewAggregateCallable = httpsCallable<
  { country: CountryCode; bankId: string; timeWindow: OverviewTimeWindow },
  { ok: boolean; aggregate: DashboardOverviewAggregate }
>(functions, 'getDashboardOverviewAggregate');
const rebuildDashboardAggregatesCallable = httpsCallable<
  { country: CountryCode; cursor?: string | null; maxBuckets?: number },
  {
    ok: boolean;
    country: CountryCode;
    rebuiltBuckets: number;
    totalBuckets: number;
    nextCursor: string | null;
    hasMore: boolean;
    remainingBuckets: number;
  }
>(functions, 'rebuildDashboardAggregates');
const resetSurveyAnalyticsDataCallable = httpsCallable<
  { confirmText: string; clearResponses: boolean; clearAggregates: boolean },
  { ok: boolean; deletedResponses: number; deletedAggregates: number }
>(functions, 'resetSurveyAnalyticsData');

const toAggregateError = (error: unknown): string => {
  const code = String((error as { code?: string })?.code || '').toLowerCase();
  const message = String((error as { message?: string })?.message || '');

  if (code.includes('permission-denied')) return 'Overview aggregate access was denied for this country.';
  if (code.includes('not-found')) return 'Overview aggregate data is not available yet.';
  if (code.includes('failed-precondition') && message.toLowerCase().includes('selected bank is not available for this country')) {
    return 'Overview aggregates are not aligned with the selected bank for this country yet. The dashboard can continue with live-response analytics while aggregates are rebuilt.';
  }
  if (code.includes('failed-precondition') && message.toLowerCase().includes('overview aggregates are not ready for this country yet')) {
    return 'Overview aggregates are still rebuilding for this country. The dashboard should fall back to live-response analytics until rebuild completes.';
  }
  if (code.includes('failed-precondition') && message.toLowerCase().includes('explicit confirmation text is required')) {
    return 'Reset confirmation text did not match. Type the exact confirmation phrase and retry.';
  }
  if (code.includes('invalid-argument') && message.toLowerCase().includes('country is required')) {
    return 'Aggregate rebuilds must run against a specific country scope.';
  }
  if (code.includes('deadline-exceeded')) return 'Aggregate rebuild timed out before the previous implementation could finish. Use the bounded rebuild flow and retry.';
  if (code.includes('internal')) return 'Aggregate processing failed on the backend. Check the rebuild or overview function logs and retry.';
  return message || 'Failed to load overview aggregate.';
};

const shouldForceRawFallback = (reason: string) => {
  const normalized = reason.toLowerCase();
  return normalized.includes('integrity validation failed')
    || normalized.includes('unsupported_filter')
    || normalized.includes('does not support active filters');
};

export const analyticsAggregateService = {
  getDashboardOverviewAggregateWithFallback: async (
    country: CountryCode,
    bankId: string,
    timeWindow: OverviewTimeWindow,
    filters?: AggregateFilterScope,
  ): Promise<AggregateLoadResult> => {
    try {
      const aggregate = await analyticsAggregateService.getDashboardOverviewAggregate(country, bankId, timeWindow, filters);
      return {
        aggregate,
        source: 'callable',
        fallbackReason: null,
      };
    } catch (error) {
      const fallbackReason = error instanceof Error ? error.message : 'Overview aggregate callable failed.';
      if (shouldForceRawFallback(fallbackReason)) {
        aggregateWarn('aggregate_raw_fallback_triggered', {
          country,
          bankId,
          timeWindow,
          source: 'callable',
          phase: 'payload',
          reason: fallbackReason,
        });
        return {
          aggregate: null,
          source: 'callable',
          fallbackReason,
        };
      }
      try {
        const aggregate = await buildDirectOverviewAggregate(country, bankId, timeWindow);
        assertValidAggregatePayload(aggregate, { country, timeWindow, source: 'firestore' }, filters);
        return {
          aggregate,
          source: 'firestore',
          fallbackReason,
        };
      } catch (fallbackError) {
        const directReason = fallbackError instanceof Error ? fallbackError.message : 'Direct aggregate fallback failed.';
        aggregateWarn('aggregate_raw_fallback_triggered', {
          country,
          bankId,
          timeWindow,
          source: 'firestore',
          phase: 'payload',
          callableReason: fallbackReason,
          directReason,
        });
        return {
          aggregate: null,
          source: 'firestore',
          fallbackReason: `${fallbackReason} ${directReason}`,
        };
      }
    }
  },
  getDashboardOverviewAggregate: async (
    country: CountryCode,
    bankId: string,
    timeWindow: OverviewTimeWindow,
    filters?: AggregateFilterScope,
  ) => {
    try {
      const result = await getDashboardOverviewAggregateCallable({ country, bankId, timeWindow });
      const aggregate = {
        ...result.data.aggregate,
        contract: {
          ...result.data.aggregate.contract,
          methodologyVersion: result.data.aggregate.contract?.methodologyVersion || DEFAULT_METHODOLOGY_VERSION,
        },
      };
      assertValidAggregatePayload(aggregate, { country, timeWindow, source: 'callable' }, filters);
      return aggregate;
    } catch (error) {
      throw new Error(toAggregateError(error));
    }
  },
  rebuildDashboardAggregates: async (country: CountryCode, options?: { cursor?: string | null; maxBuckets?: number }) => {
    try {
      const result = await rebuildDashboardAggregatesCallable({
        country,
        cursor: options?.cursor ?? null,
        maxBuckets: options?.maxBuckets ?? 20,
      });
      return result.data;
    } catch (error) {
      throw new Error(toAggregateError(error));
    }
  },
  resetSurveyAnalyticsData: async (input: { confirmText: string; clearResponses: boolean; clearAggregates: boolean }) => {
    try {
      const result = await resetSurveyAnalyticsDataCallable(input);
      return result.data;
    } catch (error) {
      throw new Error(toAggregateError(error));
    }
  },
};
