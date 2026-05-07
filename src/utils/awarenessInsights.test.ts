import { describe, it, expect } from 'vitest';
import {
  buildAwarenessMetricInsight,
  buildAwarenessFunnelInsight,
  buildAwarenessRankingInsight,
  buildIntentInsight,
  buildAwarenessModuleSummary,
} from './awarenessInsights';
import type { AwarenessReportPayload } from '@/services/aiStrategyAdvisorService';

// ---- buildAwarenessMetricInsight ----------------------------------------

describe('buildAwarenessMetricInsight', () => {
  it('returns null when value is null', () => {
    expect(buildAwarenessMetricInsight({ key: 'top_of_mind', value: null })).toBeNull();
  });

  it('returns null when value is NaN', () => {
    expect(buildAwarenessMetricInsight({ key: 'mom_growth', value: NaN })).toBeNull();
  });

  it('returns null for metrics with no implemented case (e.g. aided_awareness)', () => {
    expect(buildAwarenessMetricInsight({ key: 'aided_awareness', value: 50 })).toBeNull();
  });

  it('identifies top-of-mind leader tier (>=30)', () => {
    const result = buildAwarenessMetricInsight({ key: 'top_of_mind', value: 35 });
    expect(result).toMatch(/leader/i);
  });

  it('identifies weak top-of-mind (5-9)', () => {
    const result = buildAwarenessMetricInsight({ key: 'top_of_mind', value: 7 });
    expect(result).toMatch(/weak/i);
  });

  it('identifies poor awareness quality (below 10)', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_quality', value: 6 });
    expect(result).toMatch(/poor/i);
  });

  it('includes priority action copy for weak quality (10-14)', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_quality', value: 12 });
    expect(result).toMatch(/priority action/i);
  });

  it('identifies excellent awareness quality (>=40)', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_quality', value: 45 });
    expect(result).toMatch(/excellent/i);
  });

  it('mentions compare bank name when compareValue is provided', () => {
    const result = buildAwarenessMetricInsight({
      key: 'top_of_mind',
      value: 25,
      compareValue: 30,
      compareBankName: 'Equity Bank',
    });
    expect(result).toContain('Equity Bank');
  });

  it('says "ahead" when value > compareValue', () => {
    const result = buildAwarenessMetricInsight({
      key: 'total_awareness',
      value: 75,
      compareValue: 60,
      compareBankName: 'Equity',
    });
    expect(result).toMatch(/ahead/i);
  });

  it('says "behind" when value < compareValue', () => {
    const result = buildAwarenessMetricInsight({
      key: 'total_awareness',
      value: 55,
      compareValue: 70,
      compareBankName: 'Equity',
    });
    expect(result).toMatch(/behind/i);
  });

  it('does not add compare text when compareValue is null', () => {
    const result = buildAwarenessMetricInsight({
      key: 'top_of_mind',
      value: 25,
      compareValue: null,
      compareBankName: 'Equity',
    });
    expect(result).not.toMatch(/ahead|behind|tracking/i);
  });

  it('adds caution note when sampleSize < 30', () => {
    const result = buildAwarenessMetricInsight({ key: 'top_of_mind', value: 45, sampleSize: 15 });
    expect(result).toMatch(/caution/i);
  });

  it('does not add caution when sampleSize >= 30', () => {
    const result = buildAwarenessMetricInsight({ key: 'top_of_mind', value: 45, sampleSize: 50 });
    expect(result).not.toMatch(/caution/i);
  });

  it('returns null for mom_growth when value is null (no prior period)', () => {
    expect(buildAwarenessMetricInsight({ key: 'mom_growth', value: null })).toBeNull();
  });

  it('describes positive MoM growth', () => {
    const result = buildAwarenessMetricInsight({ key: 'mom_growth', value: 5 });
    expect(result).toMatch(/grew/i);
  });

  it('describes negative MoM growth', () => {
    const result = buildAwarenessMetricInsight({ key: 'mom_growth', value: -3 });
    expect(result).toMatch(/fell/i);
  });

  it('describes awareness_depth_score using thresholds (excellent >= 60)', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_depth_score', value: 65 });
    expect(result).toMatch(/excellent/i);
  });

  it('describes weak awareness_depth_score (< 20)', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_depth_score', value: 10 });
    expect(result).toMatch(/weak/i);
  });
});

// ---- buildAwarenessFunnelInsight ----------------------------------------

describe('buildAwarenessFunnelInsight', () => {
  it('returns null when aware is null', () => {
    expect(buildAwarenessFunnelInsight({ aware: null, spontaneous: 40, topOfMind: 20, aided: 60 })).toBeNull();
  });

  it('returns null when aware is zero', () => {
    expect(buildAwarenessFunnelInsight({ aware: 0, spontaneous: 0, topOfMind: 0, aided: 0 })).toBeNull();
  });

  it('describes strong spontaneous conversion when spontaneous/aware >= 0.6', () => {
    // 52/80 = 0.65
    const result = buildAwarenessFunnelInsight({ aware: 80, spontaneous: 52, topOfMind: 30, aided: 70 });
    expect(result).toMatch(/high/i);
  });

  it('flags low top-of-mind within aware base when topOfMind/aware < 0.1', () => {
    // 6/80 = 0.075
    const result = buildAwarenessFunnelInsight({ aware: 80, spontaneous: 40, topOfMind: 6, aided: 70 });
    expect(result).toMatch(/rarely the first recalled/i);
  });

  it('returns non-null string for valid inputs', () => {
    const result = buildAwarenessFunnelInsight({ aware: 70, spontaneous: 35, topOfMind: 20, aided: 60 });
    expect(typeof result).toBe('string');
    expect(result!.length).toBeGreaterThan(0);
  });
});

// ---- buildAwarenessRankingInsight ----------------------------------------

const rankRows = [
  { bankId: 'EQ_RW', bankName: 'Equity', awareness: 82, topOfMind: 38, rank: 1, movement: 1 },
  { bankId: 'BK_RW', bankName: 'BK',     awareness: 70, topOfMind: 25, rank: 2, movement: -1 },
  { bankId: 'KCB_RW', bankName: 'KCB',   awareness: 55, topOfMind: 15, rank: 3, movement: 0 },
];

describe('buildAwarenessRankingInsight', () => {
  it('returns null when rows is empty', () => {
    expect(buildAwarenessRankingInsight({ rows: [], selectedBankId: 'BK_RW', sampleSize: 100 })).toBeNull();
  });

  it('returns null when selected bank is not in rows', () => {
    expect(buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'UNKNOWN', sampleSize: 100 })).toBeNull();
  });

  it('includes rank number and bank name in output', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'BK_RW', sampleSize: 100 });
    expect(result).toContain('BK');
    expect(result).toMatch(/#2/);
  });

  it('describes rank drop when movement is negative', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'BK_RW', sampleSize: 100 });
    expect(result).toMatch(/dropped/i);
  });

  it('describes rank improvement when movement is positive', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'EQ_RW', sampleSize: 100 });
    expect(result).toMatch(/improved/i);
  });

  it('mentions market leader name when selected bank is not #1', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'BK_RW', sampleSize: 100 });
    expect(result).toContain('Equity');
  });

  it('does not mention leader gap when selected bank is already #1', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'EQ_RW', sampleSize: 100 });
    expect(result).not.toMatch(/gap to close/i);
  });

  it('adds low sample caution when sampleSize < 30', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'BK_RW', sampleSize: 20 });
    expect(result).toMatch(/caution/i);
  });
});

// ---- buildIntentInsight --------------------------------------------------

describe('buildIntentInsight', () => {
  it('returns null when responseBase is 0', () => {
    expect(buildIntentInsight({
      averageIntent: 0, highIntentPct: 0, highIntentNonUserPct: 0,
      lowIntentCurrentUserCount: 0, responseBase: 0,
    })).toBeNull();
  });

  it('identifies very high average intent (>= 8)', () => {
    const result = buildIntentInsight({
      averageIntent: 8.5, highIntentPct: 0.70, highIntentNonUserPct: 0.30,
      lowIntentCurrentUserCount: 2, responseBase: 50,
    });
    expect(result).toMatch(/very high/i);
  });

  it('identifies strong acquisition pipeline when highIntentNonUserPct > 0.25', () => {
    const result = buildIntentInsight({
      averageIntent: 7.5, highIntentPct: 0.65, highIntentNonUserPct: 0.45,
      lowIntentCurrentUserCount: 5, responseBase: 80,
    });
    expect(result).toMatch(/acquisition/i);
  });

  it('flags churn risk when lowIntentCurrentUserCount > 10', () => {
    const result = buildIntentInsight({
      averageIntent: 5.2, highIntentPct: 0.40, highIntentNonUserPct: 0.20,
      lowIntentCurrentUserCount: 25, responseBase: 80,
    });
    expect(result).toMatch(/churn/i);
  });

  it('includes moderate acquisition text when highIntentNonUserPct is 0.10-0.25', () => {
    const result = buildIntentInsight({
      averageIntent: 6.0, highIntentPct: 0.45, highIntentNonUserPct: 0.18,
      lowIntentCurrentUserCount: 3, responseBase: 60,
    });
    expect(result).toMatch(/moderate acquisition/i);
  });
});

// ---- buildAwarenessModuleSummary -----------------------------------------

const basePayload: AwarenessReportPayload = {
  reportType: 'awareness_consideration',
  methodologyVersion: '1.0',
  country: 'rwanda',
  period: 'All data',
  bankId: 'BK_RW',
  bankName: 'BK',
  compareBankId: null,
  compareBankName: null,
  filters: {},
  sampleSize: 100,
  metrics: {
    topOfMind: 30,
    spontaneous: 55,
    totalAwareness: 80,
    awarenessQuality: 35,
    shareOfVoice: 25,
    awarenessDepthScore: 55,
    awarenessShareIndex: 20,
    momGrowthPct: 2,
  },
  funnel: {
    aware: 80,
    spontaneous: 55,
    topOfMind: 30,
    aided: 72,
  },
  intent: null,
  rankings: [],
  compareMetrics: null,
};

describe('buildAwarenessModuleSummary', () => {
  it('returns null when totalAwareness is null', () => {
    expect(buildAwarenessModuleSummary({
      ...basePayload,
      metrics: { ...basePayload.metrics, totalAwareness: null },
    })).toBeNull();
  });

  it('returns null when sampleSize is 0', () => {
    expect(buildAwarenessModuleSummary({ ...basePayload, sampleSize: 0 })).toBeNull();
  });

  it('identifies salience leader when ToM >= 20 and quality >= 25', () => {
    const result = buildAwarenessModuleSummary({
      ...basePayload,
      metrics: { ...basePayload.metrics, topOfMind: 30, awarenessQuality: 35 },
    });
    expect(result).toMatch(/salience leader/i);
  });

  it('identifies recognized-but-forgotten pattern (high awareness, low ToM, weak quality)', () => {
    const result = buildAwarenessModuleSummary({
      ...basePayload,
      metrics: { ...basePayload.metrics, totalAwareness: 80, topOfMind: 8, awarenessQuality: 10 },
    });
    expect(result).toMatch(/recognized.{0,5}but.{0,5}forgotten/i);
  });

  it('identifies hidden gem (low awareness, strong top-of-mind)', () => {
    const result = buildAwarenessModuleSummary({
      ...basePayload,
      metrics: { ...basePayload.metrics, totalAwareness: 30, topOfMind: 22, awarenessQuality: 45 },
    });
    expect(result).toMatch(/hidden gem/i);
  });

  it('adds small sample note when sampleSize < 50', () => {
    const result = buildAwarenessModuleSummary({
      ...basePayload,
      sampleSize: 30,
      metrics: { ...basePayload.metrics, topOfMind: 30, awarenessQuality: 35 },
    });
    expect(result).toMatch(/small sample/i);
  });
});
