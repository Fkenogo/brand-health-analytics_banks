import { describe, expect, it } from 'vitest';
import {
  buildDailyAggregateFromResponses,
  buildOverviewSnapshot,
  mergeAggregateDocs,
  responseDateBucket,
  toDateBucket,
  toMonthBucket,
} from './analyticsAggregation';

const bankIds = ['BK_RW', 'KCB_RW'];
const bankNames = { BK_RW: 'Bank of Kigali', KCB_RW: 'KCB Rwanda' };

const rows = [
  {
    response_id: 'r1',
    selected_country: 'rwanda',
    analytics_date_bucket: '2026-03-01',
    _status: 'completed',
    c1_recognized_bank_id: 'BK_RW',
    c2_recognized_bank_ids: ['BK_RW'],
    c3_aware_banks: ['BK_RW', 'KCB_RW'],
    c4_ever_used: ['BK_RW'],
    c5_currently_using: ['BK_RW'],
    preferred_bank: 'BK_RW',
    committed_bank: 'BK_RW',
    d2_future_intent: { BK_RW: 9, KCB_RW: 5 },
    d7_nps: { BK_RW: 10 },
    d3_relevance: ['BK_RW'],
  },
  {
    response_id: 'r2',
    selected_country: 'rwanda',
    analytics_date_bucket: '2026-03-01',
    _status: 'completed',
    c1_recognized_bank_id: 'KCB_RW',
    c2_recognized_bank_ids: ['KCB_RW'],
    c3_aware_banks: ['BK_RW', 'KCB_RW'],
    c4_ever_used: ['BK_RW', 'KCB_RW'],
    c5_currently_using: ['BK_RW', 'KCB_RW'],
    preferred_bank: 'KCB_RW',
    committed_bank: 'KCB_RW',
    d2_future_intent: { BK_RW: 6, KCB_RW: 8 },
    d7_nps: { BK_RW: 6, KCB_RW: 9 },
    d3_relevance: ['BK_RW', 'KCB_RW'],
  },
  {
    response_id: 'r3',
    selected_country: 'rwanda',
    analytics_date_bucket: '2026-03-02',
    _status: 'terminated',
    c1_recognized_bank_id: '',
    c2_recognized_bank_ids: [],
    c3_aware_banks: ['KCB_RW'],
    c4_ever_used: [],
    c5_currently_using: [],
    preferred_bank: '',
    committed_bank: '',
    d2_future_intent: { KCB_RW: 2 },
    d3_relevance: [],
    suspicious_submission_flag: true,
  },
];

describe('analytics aggregation helpers', () => {
  it('normalizes date and month buckets', () => {
    expect(toDateBucket('2026-03-14T10:00:00.000Z')).toBe('2026-03-14');
    expect(toMonthBucket('2026-03-14')).toBe('2026-03');
    expect(responseDateBucket({ timestamp: '2026-03-15T10:00:00.000Z' })).toBe('2026-03-15');
    expect(responseDateBucket({ createdAt: '2026-03-16T10:00:00.000Z' })).toBe('2026-03-16');
  });

  it('builds daily aggregates with status and bank counts', () => {
    const aggregate = buildDailyAggregateFromResponses({
      country: 'rwanda',
      dateBucket: '2026-03-01',
      responses: rows.slice(0, 2),
      bankIds,
    });

    expect(aggregate.responseCount).toBe(2);
    expect(aggregate.completedCount).toBe(2);
    expect(aggregate.banks.BK_RW.awareCount).toBe(2);
    expect(aggregate.banks.BK_RW.currentUsingCount).toBe(2);
    expect(aggregate.banks.BK_RW.preferredCount).toBe(1);
    expect(aggregate.banks.BK_RW.promoterCount).toBe(1);
    expect(aggregate.banks.BK_RW.detractorCount).toBe(1);
  });

  it('merges daily docs into an overview snapshot with bank metrics', () => {
    const dayOne = buildDailyAggregateFromResponses({
      country: 'rwanda',
      dateBucket: '2026-03-01',
      responses: rows.slice(0, 2),
      bankIds,
    });
    const dayTwo = buildDailyAggregateFromResponses({
      country: 'rwanda',
      dateBucket: '2026-03-02',
      responses: rows.slice(2),
      bankIds,
    });

    const merged = mergeAggregateDocs([dayOne, dayTwo]);
    const overview = buildOverviewSnapshot({
      aggregate: merged,
      bankIds,
      bankNames,
      selectedBankId: 'BK_RW',
    });

    expect(overview.sampleSize).toBe(3);
    expect(overview.statusCounts.completed).toBe(2);
    expect(overview.statusCounts.terminated).toBe(1);
    expect(overview.flagCounts.suspicious).toBe(1);
    expect(overview.selectedMetrics?.aware).toBe(67);
    expect(overview.selectedMetrics?.currentUsing).toBe(67);
    expect(overview.selectedMetrics?.preferred).toBe(33);
    expect(overview.selectedMetrics?.consider).toBe(67);
    expect(overview.selectedMetrics?.retentionRate).toBe(100);
    expect(overview.selectedMetrics?.churnRate).toBe(0);
    expect(overview.selectedMetrics?.considerationRate).toBe(100);
    expect(overview.selectedMetrics?.nps).toBe(0);
    expect(overview.selectedMetrics?.loyaltyIndex).toBeGreaterThan(0);
    expect(overview.marketRows[0]).toHaveProperty('trialRate');
    expect(overview.marketRows[0]).toHaveProperty('retentionRate');
    expect(overview.marketRows.map((row) => row.bankId)).toEqual(['KCB_RW', 'BK_RW']);
  });

  it('returns empty-safe metrics when aggregates are empty', () => {
    const overview = buildOverviewSnapshot({
      aggregate: mergeAggregateDocs([]),
      bankIds,
      bankNames,
      selectedBankId: 'BK_RW',
    });

    expect(overview.sampleSize).toBe(0);
    expect(overview.selectedMetrics?.aware).toBe(0);
    expect(overview.marketRows).toHaveLength(2);
  });
});
