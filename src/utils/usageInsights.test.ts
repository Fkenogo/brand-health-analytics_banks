import { describe, it, expect } from 'vitest';
import {
  buildUsageModuleInsight,
  buildTrialInsight,
  buildRetentionInsight,
  buildPreferenceInsight,
  buildMultiBankingInsight,
  buildUsageFunnelInsight,
  buildDropoffInsight,
  buildSegmentationInsight,
  buildConversionChainInsight,
} from './usageInsights';
import type { UsageDropoffStage, UsageOpportunity } from '@/utils/subscriberDashboard';

// ---- Shared mock data -------------------------------------------------------

const mockDropoffStages: UsageDropoffStage[] = [
  {
    stage: 'Aware -> Ever Used' as const,
    lostCount: 150,
    dropoffPct: 60,
    frictionScore: 60,
    diagnosis: 'High drop-off at trial stage',
  },
  {
    stage: 'Ever Used -> Currently Using' as const,
    lostCount: 80,
    dropoffPct: 40,
    frictionScore: 80,
    diagnosis: 'Moderate retention issue',
  },
  {
    stage: 'Currently Using -> Preferred Bank' as const,
    lostCount: 50,
    dropoffPct: 30,
    frictionScore: 45,
    diagnosis: 'Preference gap — secondary bank syndrome risk',
  },
];

const mockOpportunities: UsageOpportunity[] = [
  { name: 'Convert Non-Triers', size: 150, pct: 60, note: 'High-volume awareness-to-trial activation' },
  { name: 'Reactivate Lapsed', size: 80, pct: 32, note: 'Lower-cost reactivation pipeline' },
  { name: 'Primary Conversion', size: 50, pct: 20, note: 'Upgrade secondary users to primary' },
];

// ---- buildUsageModuleInsight ------------------------------------------------

describe('buildUsageModuleInsight', () => {
  const baseArgs = {
    trialRate: 35,
    retentionRate: 55,
    preferenceRate: 25,
    funnelHealthDiagnosis: 'Healthy usage funnel',
    positionLabel: 'N/A',
    sampleSize: 100,
  };

  it('returns null when sampleSize === 0', () => {
    expect(buildUsageModuleInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it("identifies 'Leaky Bucket' pattern when diagnosis includes 'Leaky bucket'", () => {
    const result = buildUsageModuleInsight({
      ...baseArgs,
      funnelHealthDiagnosis: 'Leaky bucket — retention is failing',
    });
    expect(result?.snapshot).toMatch(/leaky bucket/i);
  });

  it("identifies 'Acquisition Barrier' pattern when diagnosis includes \"Awareness doesn't convert\"", () => {
    const result = buildUsageModuleInsight({
      ...baseArgs,
      funnelHealthDiagnosis: "Awareness doesn't convert to trial",
    });
    expect(result?.snapshot).toMatch(/acquisition barrier/i);
  });

  it("identifies 'Secondary Bank Syndrome' pattern when diagnosis includes 'Secondary bank syndrome'", () => {
    const result = buildUsageModuleInsight({
      ...baseArgs,
      funnelHealthDiagnosis: 'Secondary bank syndrome — users are not going primary',
    });
    expect(result?.snapshot).toMatch(/secondary bank syndrome/i);
  });

  it("identifies 'Healthy Funnel' pattern when diagnosis includes 'Healthy usage funnel'", () => {
    const result = buildUsageModuleInsight({
      ...baseArgs,
      funnelHealthDiagnosis: 'Healthy usage funnel',
    });
    expect(result?.snapshot).toMatch(/healthy funnel/i);
  });

  it("defaults to 'Mixed Performance' for unrecognised diagnosis strings", () => {
    const result = buildUsageModuleInsight({
      ...baseArgs,
      funnelHealthDiagnosis: 'Some unknown diagnosis pattern',
    });
    expect(result?.snapshot).toMatch(/mixed performance/i);
  });

  it('snapshot references the actual trialRate value', () => {
    const result = buildUsageModuleInsight({
      ...baseArgs,
      trialRate: 42.7,
      funnelHealthDiagnosis: 'Healthy usage funnel',
    });
    expect(result?.snapshot).toContain('42.7');
  });

  it('adds sample caution when sampleSize < 30', () => {
    const result = buildUsageModuleInsight({ ...baseArgs, sampleSize: 15 });
    expect(result?.detail).toMatch(/SAMPLE CAUTION/);
  });

  it('does not add sample caution when sampleSize >= 30', () => {
    const result = buildUsageModuleInsight({ ...baseArgs, sampleSize: 50 });
    expect(result?.detail).not.toMatch(/SAMPLE CAUTION/);
  });

  it('result has both snapshot and detail strings', () => {
    const result = buildUsageModuleInsight(baseArgs);
    expect(typeof result?.snapshot).toBe('string');
    expect(typeof result?.detail).toBe('string');
    expect(result!.snapshot.length).toBeGreaterThan(0);
    expect(result!.detail.length).toBeGreaterThan(0);
  });
});

// ---- buildTrialInsight ------------------------------------------------------

describe('buildTrialInsight', () => {
  const baseArgs = {
    trialRate: 45,
    awareCount: 200,
    everCount: 90,
    sampleSize: 100,
  };

  it('returns null when awareCount === 0', () => {
    expect(buildTrialInsight({ ...baseArgs, awareCount: 0 })).toBeNull();
  });

  it('returns null when sampleSize === 0', () => {
    expect(buildTrialInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it('returns null when everCount < 15', () => {
    expect(buildTrialInsight({ ...baseArgs, everCount: 10 })).toBeNull();
  });

  it('identifies severe tier (< 25%): snapshot matches /severe/i or /barrier/i', () => {
    const result = buildTrialInsight({ ...baseArgs, trialRate: 15 });
    expect(result?.snapshot).toMatch(/severe|barrier/i);
  });

  it('identifies moderate tier (25-39%): snapshot references trial gap', () => {
    const result = buildTrialInsight({ ...baseArgs, trialRate: 32 });
    expect(result?.snapshot).toMatch(/gap/i);
  });

  it('identifies strong tier (40-59%): snapshot matches /healthy/i', () => {
    const result = buildTrialInsight({ ...baseArgs, trialRate: 50 });
    expect(result?.snapshot).toMatch(/healthy/i);
  });

  it('identifies excellent tier (>= 60%): snapshot matches /exceptional/i', () => {
    const result = buildTrialInsight({ ...baseArgs, trialRate: 65 });
    expect(result?.snapshot).toMatch(/exceptional/i);
  });

  it('adds sample caution when sampleSize < 30', () => {
    const result = buildTrialInsight({ ...baseArgs, sampleSize: 20 });
    expect(result?.detail).toMatch(/SAMPLE CAUTION/);
  });

  it('does not add sample caution when sampleSize >= 30', () => {
    const result = buildTrialInsight({ ...baseArgs, sampleSize: 50 });
    expect(result?.detail).not.toMatch(/SAMPLE CAUTION/);
  });

  it('detail contains TRIAL CONVERSION SIGNAL section', () => {
    const result = buildTrialInsight(baseArgs);
    expect(result?.detail).toMatch(/TRIAL CONVERSION SIGNAL/);
  });

  it('detail contains ACQUISITION IMPLICATION section', () => {
    const result = buildTrialInsight(baseArgs);
    expect(result?.detail).toMatch(/ACQUISITION IMPLICATION/);
  });
});

// ---- buildRetentionInsight --------------------------------------------------

describe('buildRetentionInsight', () => {
  const baseArgs = {
    retentionRate: 65,
    churnRate: 35,
    lapseRate: 35,
    everCount: 100,
    currentCount: 65,
    retentionMedian: 60,
    sampleSize: 100,
  };

  it('returns null when everCount < 15', () => {
    expect(buildRetentionInsight({ ...baseArgs, everCount: 10 })).toBeNull();
  });

  it('returns null when sampleSize === 0', () => {
    expect(buildRetentionInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it('identifies critical tier (< 40%): snapshot matches /critical/i', () => {
    const result = buildRetentionInsight({ ...baseArgs, retentionRate: 30, currentCount: 30 });
    expect(result?.snapshot).toMatch(/critical/i);
  });

  it('identifies excellent tier (> 82%): snapshot matches /best-in-class|exceptional/i', () => {
    const result = buildRetentionInsight({ ...baseArgs, retentionRate: 85, currentCount: 85 });
    expect(result?.snapshot).toMatch(/best-in-class|exceptional/i);
  });

  it('includes BENCHMARK CONTEXT section when retentionMedian > 0', () => {
    const result = buildRetentionInsight({ ...baseArgs, retentionMedian: 60 });
    expect(result?.detail).toMatch(/BENCHMARK CONTEXT/);
  });

  it('does NOT include BENCHMARK CONTEXT when retentionMedian === 0', () => {
    const result = buildRetentionInsight({ ...baseArgs, retentionMedian: 0 });
    expect(result?.detail).not.toMatch(/BENCHMARK CONTEXT/);
  });

  it('benchmark says "ahead" when retentionRate > retentionMedian + 1', () => {
    const result = buildRetentionInsight({ ...baseArgs, retentionRate: 70, retentionMedian: 55 });
    expect(result?.detail).toMatch(/ahead/i);
  });

  it('benchmark says "behind" when retentionRate < retentionMedian - 1', () => {
    const result = buildRetentionInsight({ ...baseArgs, retentionRate: 50, retentionMedian: 65 });
    expect(result?.detail).toMatch(/behind/i);
  });

  it('detail contains LAPSE RISK section', () => {
    const result = buildRetentionInsight(baseArgs);
    expect(result?.detail).toMatch(/LAPSE RISK/);
  });

  it('result has both snapshot and detail strings', () => {
    const result = buildRetentionInsight(baseArgs);
    expect(typeof result?.snapshot).toBe('string');
    expect(typeof result?.detail).toBe('string');
    expect(result!.snapshot.length).toBeGreaterThan(0);
    expect(result!.detail.length).toBeGreaterThan(0);
  });
});

// ---- buildPreferenceInsight -------------------------------------------------

describe('buildPreferenceInsight', () => {
  const baseArgs = {
    preferenceRate: 35,
    bumoPenetration: 18,
    preferredCount: 35,
    currentCount: 100,
    positionLabel: 'N/A',
    sampleSize: 100,
  };

  it('returns null when currentCount < 10', () => {
    expect(buildPreferenceInsight({ ...baseArgs, currentCount: 5 })).toBeNull();
  });

  it('returns null when sampleSize === 0', () => {
    expect(buildPreferenceInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it('identifies shallow tier (< 20%): snapshot matches /shallow|majority/i', () => {
    const result = buildPreferenceInsight({ ...baseArgs, preferenceRate: 15 });
    expect(result?.snapshot).toMatch(/shallow|majority/i);
  });

  it('identifies dominant tier (> 55%): snapshot matches /dominant/i', () => {
    const result = buildPreferenceInsight({ ...baseArgs, preferenceRate: 60 });
    expect(result?.snapshot).toMatch(/dominant/i);
  });

  it('detail contains PREFERENCE CAPTURE SIGNAL section', () => {
    const result = buildPreferenceInsight(baseArgs);
    expect(result?.detail).toMatch(/PREFERENCE CAPTURE SIGNAL/);
  });

  it('detail contains PRIMARY BANK PENETRATION CONTEXT section', () => {
    const result = buildPreferenceInsight(baseArgs);
    expect(result?.detail).toMatch(/PRIMARY BANK PENETRATION CONTEXT/);
  });

  it('result has both snapshot and detail strings', () => {
    const result = buildPreferenceInsight(baseArgs);
    expect(typeof result?.snapshot).toBe('string');
    expect(typeof result?.detail).toBe('string');
    expect(result!.snapshot.length).toBeGreaterThan(0);
    expect(result!.detail.length).toBeGreaterThan(0);
  });
});

// ---- buildMultiBankingInsight -----------------------------------------------

describe('buildMultiBankingInsight', () => {
  const baseArgs = {
    multiBankingPct: 45,
    singleBankerPct: 55,
    dualBankerPct: 30,
    primaryPositionInMultiPct: 40,
    avgBanksPerUser: 1.8,
    sampleSize: 100,
  };

  it('returns null when sampleSize === 0', () => {
    expect(buildMultiBankingInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it('detects high multi-banking + low primary position vulnerability', () => {
    const result = buildMultiBankingInsight({
      ...baseArgs,
      multiBankingPct: 65,
      primaryPositionInMultiPct: 20,
    });
    expect(result?.snapshot).toMatch(/vulnerability|vulnerable|losing/i);
  });

  it('detects high multi-banking + high primary position as managed exposure', () => {
    const result = buildMultiBankingInsight({
      ...baseArgs,
      multiBankingPct: 65,
      primaryPositionInMultiPct: 70,
    });
    expect(result?.snapshot).toMatch(/managed/i);
  });

  it('detail contains MULTI-BANKING EXPOSURE section', () => {
    const result = buildMultiBankingInsight(baseArgs);
    expect(result?.detail).toMatch(/MULTI-BANKING EXPOSURE/);
  });

  it('detail contains COMPETITIVE SHARE RISK section', () => {
    const result = buildMultiBankingInsight(baseArgs);
    expect(result?.detail).toMatch(/COMPETITIVE SHARE RISK/);
  });

  it('detail contains PRIMARY POSITION STRENGTH section', () => {
    const result = buildMultiBankingInsight(baseArgs);
    expect(result?.detail).toMatch(/PRIMARY POSITION STRENGTH/);
  });

  it('result has both snapshot and detail strings', () => {
    const result = buildMultiBankingInsight(baseArgs);
    expect(typeof result?.snapshot).toBe('string');
    expect(typeof result?.detail).toBe('string');
    expect(result!.snapshot.length).toBeGreaterThan(0);
    expect(result!.detail.length).toBeGreaterThan(0);
  });
});

// ---- buildUsageFunnelInsight ------------------------------------------------

describe('buildUsageFunnelInsight', () => {
  const baseArgs = {
    trialRate: 40,
    retentionRate: 60,
    preferenceRate: 30,
    funnelHealthDiagnosis: 'Healthy usage funnel',
    highestFrictionStage: 'Currently Using -> Preferred Bank',
    sampleSize: 100,
  };

  it('returns null when sampleSize === 0', () => {
    expect(buildUsageFunnelInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it('result has both snapshot and detail strings', () => {
    const result = buildUsageFunnelInsight(baseArgs);
    expect(typeof result?.snapshot).toBe('string');
    expect(typeof result?.detail).toBe('string');
    expect(result!.snapshot.length).toBeGreaterThan(0);
    expect(result!.detail.length).toBeGreaterThan(0);
  });

  it('detail contains FUNNEL ASSESSMENT section', () => {
    const result = buildUsageFunnelInsight(baseArgs);
    expect(result?.detail).toMatch(/FUNNEL ASSESSMENT/);
  });

  it('detail contains HIGHEST FRICTION POINT section', () => {
    const result = buildUsageFunnelInsight(baseArgs);
    expect(result?.detail).toMatch(/HIGHEST FRICTION POINT/);
  });

  it('references highestFrictionStage value in detail', () => {
    const result = buildUsageFunnelInsight(baseArgs);
    expect(result?.detail).toContain('Currently Using -> Preferred Bank');
  });
});

// ---- buildDropoffInsight ----------------------------------------------------

describe('buildDropoffInsight', () => {
  const baseArgs = {
    dropoffStages: mockDropoffStages,
    highestFrictionStage: 'Ever Used -> Currently Using',
    funnelHealthDiagnosis: 'Leaky bucket — retention is failing',
    sampleSize: 100,
  };

  it('returns null when dropoffStages is empty array', () => {
    expect(buildDropoffInsight({ ...baseArgs, dropoffStages: [] })).toBeNull();
  });

  it('returns null when sampleSize === 0', () => {
    expect(buildDropoffInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it('detail contains STAGE-BY-STAGE DIAGNOSIS section', () => {
    const result = buildDropoffInsight(baseArgs);
    expect(result?.detail).toMatch(/STAGE-BY-STAGE DIAGNOSIS/);
  });

  it('detail contains HIGHEST FRICTION STAGE section', () => {
    const result = buildDropoffInsight(baseArgs);
    expect(result?.detail).toMatch(/HIGHEST FRICTION STAGE/);
  });

  it('snapshot references the highest-friction stage name', () => {
    // The highest friction stage is 'Ever Used -> Currently Using' (frictionScore: 80)
    const result = buildDropoffInsight(baseArgs);
    expect(result?.snapshot).toContain('Ever Used -> Currently Using');
  });

  it('handles all 3 stages in the detail', () => {
    const result = buildDropoffInsight(baseArgs);
    expect(result?.detail).toContain('Aware -> Ever Used');
    expect(result?.detail).toContain('Ever Used -> Currently Using');
    expect(result?.detail).toContain('Currently Using -> Preferred Bank');
  });
});

// ---- buildSegmentationInsight -----------------------------------------------

describe('buildSegmentationInsight', () => {
  const baseArgs = {
    nonTriersCount: 150,
    lapsedUsersCount: 80,
    secondaryUsersCount: 50,
    primaryUsersCount: 30,
    awareCount: 310,
    opportunities: mockOpportunities,
    sampleSize: 100,
  };

  it('returns null when awareCount === 0', () => {
    expect(buildSegmentationInsight({ ...baseArgs, awareCount: 0 })).toBeNull();
  });

  it('returns null when sampleSize === 0', () => {
    expect(buildSegmentationInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it('detail contains SEGMENT SIZE BREAKDOWN section', () => {
    const result = buildSegmentationInsight(baseArgs);
    expect(result?.detail).toMatch(/SEGMENT SIZE BREAKDOWN/);
  });

  it('detail contains HIGHEST-ROI TARGET section', () => {
    const result = buildSegmentationInsight(baseArgs);
    expect(result?.detail).toMatch(/HIGHEST-ROI TARGET/);
  });

  it('detail contains ACQUISITION VS REACTIVATION CHOICE section', () => {
    const result = buildSegmentationInsight(baseArgs);
    expect(result?.detail).toMatch(/ACQUISITION VS REACTIVATION CHOICE/);
  });

  it('uses opportunities[0].name in output when provided', () => {
    const result = buildSegmentationInsight(baseArgs);
    expect(result?.snapshot).toContain('Convert Non-Triers');
  });
});

// ---- buildConversionChainInsight --------------------------------------------

describe('buildConversionChainInsight', () => {
  const baseArgs = {
    trialRate: 40,
    retentionRate: 60,
    preferenceRate: 30,
    opportunities: mockOpportunities,
    sampleSize: 100,
  };

  it('returns null when sampleSize === 0', () => {
    expect(buildConversionChainInsight({ ...baseArgs, sampleSize: 0 })).toBeNull();
  });

  it('detail contains KEY CONVERSION DRIVERS section', () => {
    const result = buildConversionChainInsight(baseArgs);
    expect(result?.detail).toMatch(/KEY CONVERSION DRIVERS/);
  });

  it('detail contains STRATEGIC PRIORITY section', () => {
    const result = buildConversionChainInsight(baseArgs);
    expect(result?.detail).toMatch(/STRATEGIC PRIORITY/);
  });

  it('result has both snapshot and detail strings', () => {
    const result = buildConversionChainInsight(baseArgs);
    expect(typeof result?.snapshot).toBe('string');
    expect(typeof result?.detail).toBe('string');
    expect(result!.snapshot.length).toBeGreaterThan(0);
    expect(result!.detail.length).toBeGreaterThan(0);
  });
});

// ─── Defensive formatting: undefined/NaN inputs must not crash ───────────────

import { buildUsageModuleInsight, buildMultiBankingInsight } from './usageInsights';

describe('usageInsights: safe number formatting (no toFixed crash)', () => {
  it('buildUsageModuleInsight does not throw when rates are NaN', () => {
    expect(() => buildUsageModuleInsight({
      trialRate: NaN,
      retentionRate: NaN,
      preferenceRate: NaN,
      funnelHealthDiagnosis: 'Leaky bucket pattern',
      positionLabel: 'N/A',
      sampleSize: 100,
    })).not.toThrow();
  });

  it('buildUsageModuleInsight snapshot does not contain NaN text when rates are NaN', () => {
    const result = buildUsageModuleInsight({
      trialRate: NaN,
      retentionRate: NaN,
      preferenceRate: NaN,
      funnelHealthDiagnosis: 'Leaky bucket pattern',
      positionLabel: 'N/A',
      sampleSize: 100,
    });
    expect(result?.snapshot ?? '').not.toContain('NaN');
  });

  it('buildMultiBankingInsight (usage) does not throw when fields are undefined via object with missing keys', () => {
    const incompleteArgs = { sampleSize: 50 } as Parameters<typeof buildMultiBankingInsight>[0];
    expect(() => buildMultiBankingInsight(incompleteArgs)).not.toThrow();
  });

  it('buildMultiBankingInsight (usage) snapshot does not contain undefined text on missing fields', () => {
    const incompleteArgs = { sampleSize: 50 } as Parameters<typeof buildMultiBankingInsight>[0];
    const result = buildMultiBankingInsight(incompleteArgs);
    expect(result?.snapshot ?? '').not.toContain('undefined');
    expect(result?.snapshot ?? '').not.toContain('NaN');
  });
});
