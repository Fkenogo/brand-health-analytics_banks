import { describe, it, expect } from 'vitest';
import {
  buildLoyaltyModuleSummary,
  buildLoyaltyIndexInsight,
  buildNpsInsight,
  buildCommittedInsight,
  buildRejectorsInsight,
  buildSegmentDistributionInsight,
  buildSegmentMovementInsight,
  buildLoyaltyFunnelInsight,
} from './loyaltyInsights';
import type { LoyaltyDiagnostics, LoyaltyMovementRow } from './subscriberDashboard';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const BANK_NAME = 'Equity Bank';

const HEALTHY_PCTS = {
  Committed: 18,
  Favors: 22,
  Potential: 25,
  Accessibles: 20,
  Rejectors: 15,
};

const HEALTHY_COUNTS = {
  Committed: 90,
  Favors: 110,
  Potential: 125,
  Accessibles: 100,
  Rejectors: 75,
};

const HEALTHY_DIAGNOSTICS: LoyaltyDiagnostics = {
  awareCount: 500,
  segmentCounts: HEALTHY_COUNTS,
  segmentPcts: HEALTHY_PCTS,
  loyaltyIndex: 62,
  nps: 22,
  movementRows: [
    { segment: 'Committed', currentPct: 18, previousPct: 16, deltaPct: 2 },
    { segment: 'Favors', currentPct: 22, previousPct: 23, deltaPct: -1 },
    { segment: 'Potential', currentPct: 25, previousPct: 24, deltaPct: 1 },
    { segment: 'Accessibles', currentPct: 20, previousPct: 22, deltaPct: -2 },
    { segment: 'Rejectors', currentPct: 15, previousPct: 15, deltaPct: 0 },
  ],
  profileCards: [],
  awareToPotential: 43,
  potentialToFavors: 47,
  favorsToCommitted: 45,
};

const WEAK_DIAGNOSTICS: LoyaltyDiagnostics = {
  awareCount: 200,
  segmentCounts: { Committed: 4, Favors: 10, Potential: 40, Accessibles: 80, Rejectors: 66 },
  segmentPcts: { Committed: 2, Favors: 5, Potential: 20, Accessibles: 40, Rejectors: 33 },
  loyaltyIndex: 18,
  nps: -12,
  movementRows: [
    { segment: 'Committed', currentPct: 2, previousPct: 4, deltaPct: -2 },
    { segment: 'Rejectors', currentPct: 33, previousPct: 28, deltaPct: 5 },
    { segment: 'Favors', currentPct: 5, previousPct: 6, deltaPct: -1 },
    { segment: 'Potential', currentPct: 20, previousPct: 22, deltaPct: -2 },
    { segment: 'Accessibles', currentPct: 40, previousPct: 40, deltaPct: 0 },
  ],
  profileCards: [],
  awareToPotential: 20,
  potentialToFavors: 15,
  favorsToCommitted: 20,
};

// ─── buildLoyaltyModuleSummary ─────────────────────────────────────────────────

describe('buildLoyaltyModuleSummary', () => {
  it('returns null when awareCount is 0', () => {
    const diagnostics = { ...HEALTHY_DIAGNOSTICS, awareCount: 0 };
    expect(buildLoyaltyModuleSummary(diagnostics, BANK_NAME)).toBeNull();
  });

  it('returns a non-empty snapshot for healthy diagnostics', () => {
    const result = buildLoyaltyModuleSummary(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result).not.toBeNull();
    expect(result!.snapshot.length).toBeGreaterThan(0);
  });

  it('snapshot includes bank name and index', () => {
    const result = buildLoyaltyModuleSummary(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.snapshot).toContain(BANK_NAME);
    expect(result!.snapshot).toContain('62');
  });

  it('detail contains LOYALTY POSITION heading', () => {
    const result = buildLoyaltyModuleSummary(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.detail).toContain('LOYALTY POSITION:');
  });

  it('detail contains CUSTOMER MIX heading', () => {
    const result = buildLoyaltyModuleSummary(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.detail).toContain('CUSTOMER MIX:');
  });

  it('detail contains NPS READING heading', () => {
    const result = buildLoyaltyModuleSummary(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.detail).toContain('NPS READING:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildLoyaltyModuleSummary(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.detail).toContain('MANAGEMENT PRIORITY:');
  });

  it('identifies high rejector share override correctly', () => {
    const highRejectors = {
      ...HEALTHY_DIAGNOSTICS,
      segmentPcts: { ...HEALTHY_PCTS, Rejectors: 28 },
    };
    const result = buildLoyaltyModuleSummary(highRejectors, BANK_NAME);
    expect(result!.detail).toContain('rejector');
  });

  it('works for weak diagnostics with negative NPS', () => {
    const result = buildLoyaltyModuleSummary(WEAK_DIAGNOSTICS, BANK_NAME);
    expect(result).not.toBeNull();
    expect(result!.snapshot).toContain('-12');
  });
});

// ─── buildLoyaltyIndexInsight ──────────────────────────────────────────────────

describe('buildLoyaltyIndexInsight', () => {
  it('returns null for non-finite index', () => {
    expect(buildLoyaltyIndexInsight(NaN, HEALTHY_PCTS, BANK_NAME)).toBeNull();
    expect(buildLoyaltyIndexInsight(Infinity, HEALTHY_PCTS, BANK_NAME)).toBeNull();
  });

  it('returns a result for a valid index', () => {
    const result = buildLoyaltyIndexInsight(62, HEALTHY_PCTS, BANK_NAME);
    expect(result).not.toBeNull();
  });

  it('snapshot is non-empty and mentions bank name', () => {
    const result = buildLoyaltyIndexInsight(62, HEALTHY_PCTS, BANK_NAME);
    expect(result!.snapshot).toContain(BANK_NAME);
  });

  it('detail contains CURRENT POSITION heading', () => {
    const result = buildLoyaltyIndexInsight(62, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('CURRENT POSITION:');
  });

  it('detail contains CUSTOMER MIX heading', () => {
    const result = buildLoyaltyIndexInsight(62, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('CUSTOMER MIX:');
  });

  it('detail contains BUSINESS IMPACT heading', () => {
    const result = buildLoyaltyIndexInsight(62, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('BUSINESS IMPACT:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildLoyaltyIndexInsight(62, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('MANAGEMENT PRIORITY:');
  });

  it('identifies strong tier for index >= 75', () => {
    const result = buildLoyaltyIndexInsight(78, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('strong');
  });

  it('identifies weak tier for index < 40', () => {
    const result = buildLoyaltyIndexInsight(25, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('weak');
  });
});

// ─── buildNpsInsight ───────────────────────────────────────────────────────────

describe('buildNpsInsight', () => {
  it('returns null when everCount is 0', () => {
    expect(buildNpsInsight(20, 40, 30, 20, 0, BANK_NAME)).toBeNull();
  });

  it('returns null for non-finite NPS', () => {
    expect(buildNpsInsight(NaN, 40, 30, 20, 100, BANK_NAME)).toBeNull();
  });

  it('returns a result for valid inputs', () => {
    const result = buildNpsInsight(22, 42, 30, 20, 300, BANK_NAME);
    expect(result).not.toBeNull();
  });

  it('snapshot mentions bank name and NPS value', () => {
    const result = buildNpsInsight(22, 42, 30, 20, 300, BANK_NAME);
    expect(result!.snapshot).toContain(BANK_NAME);
    expect(result!.snapshot).toContain('+22');
  });

  it('snapshot includes N= base', () => {
    const result = buildNpsInsight(22, 42, 30, 20, 300, BANK_NAME);
    expect(result!.snapshot).toContain('N=300');
  });

  it('detail contains NPS POSITION heading', () => {
    const result = buildNpsInsight(22, 42, 30, 20, 300, BANK_NAME);
    expect(result!.detail).toContain('NPS POSITION:');
  });

  it('detail contains PROMOTER BASE heading', () => {
    const result = buildNpsInsight(22, 42, 30, 20, 300, BANK_NAME);
    expect(result!.detail).toContain('PROMOTER BASE:');
  });

  it('detail contains DETRACTOR PROFILE heading', () => {
    const result = buildNpsInsight(22, 42, 30, 20, 300, BANK_NAME);
    expect(result!.detail).toContain('DETRACTOR PROFILE:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildNpsInsight(22, 42, 30, 20, 300, BANK_NAME);
    expect(result!.detail).toContain('MANAGEMENT PRIORITY:');
  });

  it('handles negative NPS correctly', () => {
    const result = buildNpsInsight(-10, 20, 35, 30, 200, BANK_NAME);
    expect(result!.snapshot).toContain('-10');
  });

  it('works when breakdown is NaN (no breakdown available)', () => {
    const result = buildNpsInsight(15, NaN, NaN, NaN, 150, BANK_NAME);
    expect(result).not.toBeNull();
    expect(result!.detail).toContain('NPS POSITION:');
  });
});

// ─── buildCommittedInsight ─────────────────────────────────────────────────────

describe('buildCommittedInsight', () => {
  it('returns null when awareCount is 0', () => {
    expect(buildCommittedInsight(15, 75, 0, BANK_NAME)).toBeNull();
  });

  it('returns null for non-finite committedPct', () => {
    expect(buildCommittedInsight(NaN, 75, 500, BANK_NAME)).toBeNull();
  });

  it('returns a result for valid inputs', () => {
    const result = buildCommittedInsight(18, 90, 500, BANK_NAME);
    expect(result).not.toBeNull();
  });

  it('snapshot mentions bank name and percentage', () => {
    const result = buildCommittedInsight(18, 90, 500, BANK_NAME);
    expect(result!.snapshot).toContain(BANK_NAME);
    expect(result!.snapshot).toContain('18');
  });

  it('detail contains COMMITTED BASE SIZE heading', () => {
    const result = buildCommittedInsight(18, 90, 500, BANK_NAME);
    expect(result!.detail).toContain('COMMITTED BASE SIZE:');
  });

  it('detail contains BUSINESS IMPACT heading', () => {
    const result = buildCommittedInsight(18, 90, 500, BANK_NAME);
    expect(result!.detail).toContain('BUSINESS IMPACT:');
  });

  it('detail contains COMPETITIVE POSITION heading', () => {
    const result = buildCommittedInsight(18, 90, 500, BANK_NAME);
    expect(result!.detail).toContain('COMPETITIVE POSITION:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildCommittedInsight(18, 90, 500, BANK_NAME);
    expect(result!.detail).toContain('MANAGEMENT PRIORITY:');
  });

  it('uses "strong" language for committed >= 20', () => {
    const result = buildCommittedInsight(22, 110, 500, BANK_NAME);
    expect(result!.detail).toContain('well-developed');
  });

  it('uses "thin" language for committed < 6', () => {
    const result = buildCommittedInsight(3, 15, 500, BANK_NAME);
    expect(result!.detail).toContain('thin');
  });
});

// ─── buildRejectorsInsight ─────────────────────────────────────────────────────

describe('buildRejectorsInsight', () => {
  it('returns null when awareCount is 0', () => {
    expect(buildRejectorsInsight(15, 75, 0, HEALTHY_PCTS, BANK_NAME)).toBeNull();
  });

  it('returns null for non-finite rejectorsPct', () => {
    expect(buildRejectorsInsight(NaN, 75, 500, HEALTHY_PCTS, BANK_NAME)).toBeNull();
  });

  it('returns a result for valid inputs', () => {
    const result = buildRejectorsInsight(15, 75, 500, HEALTHY_PCTS, BANK_NAME);
    expect(result).not.toBeNull();
  });

  it('snapshot mentions bank name and percentage', () => {
    const result = buildRejectorsInsight(22, 110, 500, HEALTHY_PCTS, BANK_NAME);
    expect(result!.snapshot).toContain(BANK_NAME);
    expect(result!.snapshot).toContain('22');
  });

  it('detail contains REJECTION PROFILE heading', () => {
    const result = buildRejectorsInsight(22, 110, 500, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('REJECTION PROFILE:');
  });

  it('detail contains COMPETITIVE EXPOSURE heading', () => {
    const result = buildRejectorsInsight(22, 110, 500, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('COMPETITIVE EXPOSURE:');
  });

  it('detail contains REACTIVATION POTENTIAL heading', () => {
    const result = buildRejectorsInsight(22, 110, 500, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('REACTIVATION POTENTIAL:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildRejectorsInsight(22, 110, 500, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('MANAGEMENT PRIORITY:');
  });

  it('flags high risk for rejectors > 30', () => {
    const result = buildRejectorsInsight(35, 175, 500, HEALTHY_PCTS, BANK_NAME);
    expect(result!.detail).toContain('30%');
  });

  it('uses low-risk language for rejectors <= 12', () => {
    const result = buildRejectorsInsight(8, 40, 500, HEALTHY_PCTS, BANK_NAME);
    expect(result!.snapshot).toContain('low');
  });
});

// ─── buildSegmentDistributionInsight ──────────────────────────────────────────

describe('buildSegmentDistributionInsight', () => {
  it('returns null when awareCount is 0', () => {
    const diagnostics = { ...HEALTHY_DIAGNOSTICS, awareCount: 0 };
    expect(buildSegmentDistributionInsight(diagnostics, BANK_NAME)).toBeNull();
  });

  it('returns a result for healthy diagnostics', () => {
    const result = buildSegmentDistributionInsight(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result).not.toBeNull();
  });

  it('snapshot includes bank name', () => {
    const result = buildSegmentDistributionInsight(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.snapshot).toContain(BANK_NAME);
  });

  it('detail contains CUSTOMER MIX heading', () => {
    const result = buildSegmentDistributionInsight(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.detail).toContain('CUSTOMER MIX:');
  });

  it('detail contains BUSINESS IMPACT heading', () => {
    const result = buildSegmentDistributionInsight(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.detail).toContain('BUSINESS IMPACT:');
  });

  it('detail contains GROWTH OPPORTUNITY heading', () => {
    const result = buildSegmentDistributionInsight(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.detail).toContain('GROWTH OPPORTUNITY:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildSegmentDistributionInsight(HEALTHY_DIAGNOSTICS, BANK_NAME);
    expect(result!.detail).toContain('MANAGEMENT PRIORITY:');
  });

  it('identifies top-heavy profile when Committed + Favors >= 40', () => {
    const topHeavy = {
      ...HEALTHY_DIAGNOSTICS,
      segmentPcts: { Committed: 25, Favors: 20, Potential: 20, Accessibles: 20, Rejectors: 15 },
    };
    const result = buildSegmentDistributionInsight(topHeavy, BANK_NAME);
    expect(result!.snapshot).toContain('strong committed and favoring core');
  });

  it('identifies bottom-heavy profile when Rejectors + Accessibles >= 60', () => {
    const bottomHeavy = {
      ...HEALTHY_DIAGNOSTICS,
      segmentPcts: { Committed: 4, Favors: 8, Potential: 20, Accessibles: 38, Rejectors: 30 },
    };
    const result = buildSegmentDistributionInsight(bottomHeavy, BANK_NAME);
    expect(result!.snapshot).toContain('broad accessible and potential base');
  });
});

// ─── buildSegmentMovementInsight ──────────────────────────────────────────────

describe('buildSegmentMovementInsight', () => {
  it('returns null when movementRows is empty', () => {
    expect(buildSegmentMovementInsight([], BANK_NAME)).toBeNull();
  });

  it('returns null when all rows have zero values', () => {
    const emptyRows: LoyaltyMovementRow[] = [
      { segment: 'Committed', currentPct: 0, previousPct: 0, deltaPct: 0 },
    ];
    expect(buildSegmentMovementInsight(emptyRows, BANK_NAME)).toBeNull();
  });

  it('returns a result for movement rows with data', () => {
    const result = buildSegmentMovementInsight(HEALTHY_DIAGNOSTICS.movementRows, BANK_NAME);
    expect(result).not.toBeNull();
  });

  it('snapshot includes bank name', () => {
    const result = buildSegmentMovementInsight(HEALTHY_DIAGNOSTICS.movementRows, BANK_NAME);
    expect(result!.snapshot).toContain(BANK_NAME);
  });

  it('detail contains CUSTOMER BEHAVIOUR heading', () => {
    const result = buildSegmentMovementInsight(HEALTHY_DIAGNOSTICS.movementRows, BANK_NAME);
    expect(result!.detail).toContain('CUSTOMER BEHAVIOUR:');
  });

  it('detail contains MARKET DIRECTION heading', () => {
    const result = buildSegmentMovementInsight(HEALTHY_DIAGNOSTICS.movementRows, BANK_NAME);
    expect(result!.detail).toContain('MARKET DIRECTION:');
  });

  it('detail contains BUSINESS IMPACT heading', () => {
    const result = buildSegmentMovementInsight(HEALTHY_DIAGNOSTICS.movementRows, BANK_NAME);
    expect(result!.detail).toContain('BUSINESS IMPACT:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildSegmentMovementInsight(HEALTHY_DIAGNOSTICS.movementRows, BANK_NAME);
    expect(result!.detail).toContain('MANAGEMENT PRIORITY:');
  });

  it('identifies clearly negative direction when committed down and rejectors up', () => {
    const result = buildSegmentMovementInsight(WEAK_DIAGNOSTICS.movementRows, BANK_NAME);
    expect(result!.detail).toContain('clearly negative');
  });

  it('identifies clearly positive direction when committed up and rejectors stable', () => {
    const positiveRows: LoyaltyMovementRow[] = [
      { segment: 'Committed', currentPct: 18, previousPct: 15, deltaPct: 3 },
      { segment: 'Rejectors', currentPct: 14, previousPct: 16, deltaPct: -2 },
      { segment: 'Favors', currentPct: 22, previousPct: 20, deltaPct: 2 },
      { segment: 'Potential', currentPct: 25, previousPct: 26, deltaPct: -1 },
      { segment: 'Accessibles', currentPct: 21, previousPct: 23, deltaPct: -2 },
    ];
    const result = buildSegmentMovementInsight(positiveRows, BANK_NAME);
    expect(result!.detail).toContain('clearly positive');
  });
});

// ─── buildLoyaltyFunnelInsight ─────────────────────────────────────────────────

describe('buildLoyaltyFunnelInsight', () => {
  it('returns null when awareCount is 0', () => {
    expect(buildLoyaltyFunnelInsight(43, 47, 45, 0, BANK_NAME)).toBeNull();
  });

  it('returns insufficient data result when rates are NaN', () => {
    const result = buildLoyaltyFunnelInsight(NaN, 47, 45, 500, BANK_NAME);
    expect(result).not.toBeNull();
    expect(result!.snapshot).toContain('Insufficient');
  });

  it('returns a result for valid inputs', () => {
    const result = buildLoyaltyFunnelInsight(43, 47, 45, 500, BANK_NAME);
    expect(result).not.toBeNull();
  });

  it('snapshot mentions bank name', () => {
    const result = buildLoyaltyFunnelInsight(43, 47, 45, 500, BANK_NAME);
    expect(result!.snapshot).toContain(BANK_NAME);
  });

  it('detail contains CONVERSION RATES heading', () => {
    const result = buildLoyaltyFunnelInsight(43, 47, 45, 500, BANK_NAME);
    expect(result!.detail).toContain('CONVERSION RATES:');
  });

  it('detail contains WHERE CONVERSION DROPS heading', () => {
    const result = buildLoyaltyFunnelInsight(43, 47, 45, 500, BANK_NAME);
    expect(result!.detail).toContain('WHERE CONVERSION DROPS:');
  });

  it('detail contains BUSINESS IMPACT heading', () => {
    const result = buildLoyaltyFunnelInsight(43, 47, 45, 500, BANK_NAME);
    expect(result!.detail).toContain('BUSINESS IMPACT:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildLoyaltyFunnelInsight(43, 47, 45, 500, BANK_NAME);
    expect(result!.detail).toContain('MANAGEMENT PRIORITY:');
  });

  it('identifies Aware to Potential as weakest stage when it is lowest', () => {
    const result = buildLoyaltyFunnelInsight(15, 60, 70, 500, BANK_NAME);
    expect(result!.snapshot).toContain('Aware to Potential');
  });

  it('identifies Potential to Favors as weakest stage', () => {
    const result = buildLoyaltyFunnelInsight(60, 20, 70, 500, BANK_NAME);
    expect(result!.snapshot).toContain('Potential to Favors');
  });

  it('identifies Favors to Committed as weakest stage', () => {
    const result = buildLoyaltyFunnelInsight(60, 70, 15, 500, BANK_NAME);
    expect(result!.snapshot).toContain('Favors to Committed');
  });
});

// ─── Defensive formatting: undefined/NaN inputs must not crash ───────────────

import { buildLoyaltyModuleSummary, buildLoyaltyIndexInsight, buildNpsInsight } from './loyaltyInsights';

const BASE_DIAGNOSTICS = {
  awareCount: 100,
  loyaltyIndex: NaN,
  nps: NaN,
  segmentPcts: { Committed: NaN, Favors: NaN, Potential: NaN, Accessibles: NaN, Rejectors: NaN },
  segmentCounts: { Committed: 10, Favors: 20, Potential: 30, Accessibles: 25, Rejectors: 15 },
  movementRows: [],
  profileCards: [],
  awareToPotential: NaN,
  potentialToFavors: NaN,
  favorsToCommitted: NaN,
};

describe('loyaltyInsights: safe number formatting (no toFixed crash)', () => {
  it('buildLoyaltyModuleSummary does not throw when loyaltyIndex is NaN', () => {
    expect(() => buildLoyaltyModuleSummary(BASE_DIAGNOSTICS as any, 'Bank A')).not.toThrow();
  });

  it('buildLoyaltyModuleSummary snapshot does not contain NaN text', () => {
    const result = buildLoyaltyModuleSummary(BASE_DIAGNOSTICS as any, 'Bank A');
    expect(result?.snapshot ?? '').not.toContain('NaN');
  });

  it('buildLoyaltyIndexInsight returns null when loyaltyIndex is NaN', () => {
    expect(buildLoyaltyIndexInsight(NaN, { Committed: 10, Favors: 20, Potential: 30, Accessibles: 25, Rejectors: 15 }, 'Bank A')).toBeNull();
  });

  it('buildNpsInsight returns null when nps is NaN', () => {
    expect(buildNpsInsight(NaN, NaN, NaN, NaN, 50, 'Bank A')).toBeNull();
  });
});
