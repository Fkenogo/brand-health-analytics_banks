import { describe, it, expect } from 'vitest';
import {
  buildCompetitiveModuleSummary,
  buildMarketShareInsight,
  buildHHIInsight,
  buildCompetitiveMultiBankingInsight,
  buildMarketStructureInsight,
  buildCustomerBehaviorInsight,
  buildCompetitivePositioningInsight,
  buildSwitchingRadarInsight,
  buildMigrationMapInsight,
  buildWinLossInsight,
  buildStrengthsWeaknessesInsight,
  buildWhitespaceInsight,
  buildRiskSignalsInsight,
} from './competitiveInsights';
import type { CustomerSwitchingRadarResult } from '@/utils/customerSwitchingRadar';
import type { CustomerMigrationMapResult } from '@/utils/customerMigrationMap';
import type {
  CompetitiveIntelligenceDiagnostics,
} from '@/utils/subscriberDashboard';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const bankA = { bankId: 'bank-a', bankName: 'Bank A' };
const bankB = { bankId: 'bank-b', bankName: 'Bank B' };
const bankC = { bankId: 'bank-c', bankName: 'Bank C' };

function makeMarketRow(overrides: Partial<{ bankId: string; bankName: string; preferredCount: number; marketShare: number; marketShareDelta: number; shareOfVoice: number; sovVsShareGap: number }> = {}) {
  return { bankId: 'bank-a', bankName: 'Bank A', preferredCount: 100, marketShare: 25, marketShareDelta: 1, shareOfVoice: 28, sovVsShareGap: 3, ...overrides };
}

function makePositioningRow(overrides = {}) {
  return { bankId: 'bank-a', bankName: 'Bank A', marketShare: 25, nps: 35, position: 'Leader' as const, tier: 'Tier 1: Market Leaders' as const, ...overrides };
}

function makeCompetitiveSetRow(overrides = {}) {
  return { bankId: 'bank-b', bankName: 'Bank B', overlapPct: 45, competitorType: 'Direct' as const, ...overrides };
}

function makeWinLossRow(overrides = {}) {
  return { competitorBankId: 'bank-b', competitorBankName: 'Bank B', gainedFrom: 10, lostTo: 6, winRate: 63, net: 4, ...overrides };
}

function makeRelativeStrengthRow(overrides = {}) {
  return { metric: 'Awareness', yourValue: 65, marketAvg: 55, relativeStrength: 118, strengthType: 'Strength' as const, ...overrides };
}

function makeWhiteSpaceRow(overrides = {}) {
  return { segment: '18-25', marketAvg: 35, yourPenetration: 20, gap: -15, opportunity: 'High' as const, ...overrides };
}

function makeThreatRow(overrides = {}) {
  return { competitorBankId: 'bank-b', competitorBankName: 'Bank B', likelihoodScore: 75, impactScore: 80, threatLevel: 'Critical' as const, ...overrides };
}

function makeRiskIndicator(overrides = {}) {
  return { label: 'Market share pressure', status: 'Above threshold', alert: 'Red' as const, ...overrides };
}

const makeSwitchingRadar = (overrides = {}): CustomerSwitchingRadarResult => ({
  selectedBankId: 'bank-a', multiBankUsingSelectedBase: 50, secondChoiceBase: 35,
  lowSample: false, hasData: true, emptyReason: null,
  competitors: [
    { competitor: 'bank-b', secondChoiceShare: 40, overlapShare: 55, switchingPressureScore: 46 },
    { competitor: 'bank-c', secondChoiceShare: 25, overlapShare: 30, switchingPressureScore: 27 },
  ],
  ...overrides,
});

const makeMigrationMap = (overrides = {}): CustomerMigrationMapResult => ({
  selectedBankId: 'bank-a', selectedBankUserBase: 200, selectedBankMultiBankBase: 80,
  selectedBankPreferredBase: 60, migrationAwayBase: 20, lowSample: false, hasData: true, emptyReason: null,
  topMigrationCompetitor: 'bank-b', multiBankRateAmongSelectedUsers: 40, driftRateAmongSelectedMultiBankUsers: 25,
  rows: [{ competitor: 'bank-b', count: 12, share: 60 }, { competitor: 'bank-c', count: 8, share: 40 }],
  ...overrides,
});

function makeDiagnostics(overrides: Partial<CompetitiveIntelligenceDiagnostics> = {}): CompetitiveIntelligenceDiagnostics {
  return {
    marketStructure: {
      marketRows: [
        makeMarketRow({ bankId: 'bank-a', bankName: 'Bank A', marketShare: 25 }),
        makeMarketRow({ bankId: 'bank-b', bankName: 'Bank B', marketShare: 15 }),
      ],
      hhi: 1800,
      concentrationLabel: 'Moderately Concentrated',
    },
    customerBehavior: {
      averageBanksPerCustomer: 2.1,
      multiBankingRate: 45,
      overlapRows: [],
      portfolioComposition: [
        { label: 'Exclusive', pct: 55 },
        { label: 'Bank + 1 Other', pct: 30 },
        { label: 'Bank + 2+ Others', pct: 15 },
      ],
    },
    competitiveAnalysis: {
      directCompetitors: [makeCompetitiveSetRow()],
      positioningRows: [makePositioningRow()],
    },
    shareOfWallet: {
      estimatedWalletShare: 60,
      byCompetitor: [],
    },
    winLoss: {
      rows: [makeWinLossRow()],
      overallWinRate: 63,
      hasPanelTransitions: false,
    },
    strengthsWeaknesses: {
      relativeRows: [makeRelativeStrengthRow()],
      relativeStrengthIndex: 65,
    },
    whiteSpace: {
      ageRows: [makeWhiteSpaceRow()],
      genderRows: [],
    },
    threats: {
      rows: [makeThreatRow()],
      indicators: [makeRiskIndicator()],
    },
    ...overrides,
  };
}

// ─── 1. buildCompetitiveModuleSummary ─────────────────────────────────────────

describe('buildCompetitiveModuleSummary', () => {
  it('returns null when marketRows is empty', () => {
    const d = makeDiagnostics({ marketStructure: { marketRows: [], hhi: 1800, concentrationLabel: 'Moderately Concentrated' } });
    expect(buildCompetitiveModuleSummary(d, 'Bank A', 'bank-a')).toBeNull();
  });

  it('snapshot includes bankName', () => {
    const result = buildCompetitiveModuleSummary(makeDiagnostics(), 'Bank A', 'bank-a');
    expect(result?.snapshot).toContain('Bank A');
  });

  it('detail contains MARKET POSITION heading', () => {
    const result = buildCompetitiveModuleSummary(makeDiagnostics(), 'Bank A', 'bank-a');
    expect(result?.detail).toContain('MARKET POSITION:');
  });

  it('detail contains KEY RISK heading', () => {
    const result = buildCompetitiveModuleSummary(makeDiagnostics(), 'Bank A', 'bank-a');
    expect(result?.detail).toContain('KEY RISK:');
  });

  it('detail contains PRIORITY ACTION heading', () => {
    const result = buildCompetitiveModuleSummary(makeDiagnostics(), 'Bank A', 'bank-a');
    expect(result?.detail).toContain('PRIORITY ACTION:');
  });

  it('leader position (rank 1) mentioned in snapshot when bank is first', () => {
    const d = makeDiagnostics({
      marketStructure: {
        marketRows: [
          makeMarketRow({ bankId: 'bank-a', bankName: 'Bank A', marketShare: 40 }),
          makeMarketRow({ bankId: 'bank-b', bankName: 'Bank B', marketShare: 15 }),
        ],
        hhi: 1800,
        concentrationLabel: 'Moderately Concentrated',
      },
    });
    const result = buildCompetitiveModuleSummary(d, 'Bank A', 'bank-a');
    expect(result?.snapshot).toContain('1st');
  });
});

// ─── 2. buildMarketShareInsight ───────────────────────────────────────────────

describe('buildMarketShareInsight', () => {
  it('returns null when marketRows is empty', () => {
    expect(buildMarketShareInsight([], 'bank-a', 'Moderately Concentrated', 'Bank A')).toBeNull();
  });

  it('snapshot includes bankName and a share percentage', () => {
    const rows = [makeMarketRow({ bankId: 'bank-a', marketShare: 25 })];
    const result = buildMarketShareInsight(rows, 'bank-a', 'Moderately Concentrated', 'Bank A');
    expect(result?.snapshot).toContain('Bank A');
    expect(result?.snapshot).toContain('25%');
  });

  it('detail contains SHARE POSITION heading', () => {
    const rows = [makeMarketRow()];
    const result = buildMarketShareInsight(rows, 'bank-a', 'Moderately Concentrated', 'Bank A');
    expect(result?.detail).toContain('SHARE POSITION:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const rows = [makeMarketRow()];
    const result = buildMarketShareInsight(rows, 'bank-a', 'Moderately Concentrated', 'Bank A');
    expect(result?.detail).toContain('MANAGEMENT PRIORITY:');
  });
});

// ─── 3. buildHHIInsight ───────────────────────────────────────────────────────

describe('buildHHIInsight', () => {
  it('returns null when hhi is NaN', () => {
    expect(buildHHIInsight(NaN, 'Moderately Concentrated', 'Bank A')).toBeNull();
  });

  it('covers highly competitive (hhi=1200): snapshot mentions competitive', () => {
    const result = buildHHIInsight(1200, 'Highly Competitive', 'Bank A');
    expect(result?.snapshot).toMatch(/competitive/i);
  });

  it('covers moderately concentrated (hhi=1800): snapshot mentions moderate', () => {
    const result = buildHHIInsight(1800, 'Moderately Concentrated', 'Bank A');
    expect(result?.snapshot).toMatch(/moderate/i);
  });

  it('covers highly concentrated (hhi=3000): snapshot mentions concentrated', () => {
    const result = buildHHIInsight(3000, 'Highly Concentrated', 'Bank A');
    expect(result?.snapshot).toMatch(/concentrated/i);
  });

  it('detail contains CONCENTRATION READING heading', () => {
    const result = buildHHIInsight(1800, 'Moderately Concentrated', 'Bank A');
    expect(result?.detail).toContain('CONCENTRATION READING:');
  });
});

// ─── 4. buildCompetitiveMultiBankingInsight ──────────────────────────────────────────────

describe('buildCompetitiveMultiBankingInsight', () => {
  it('returns null when multiBankingRate is NaN', () => {
    expect(buildCompetitiveMultiBankingInsight(NaN, 2.1, 'Bank A')).toBeNull();
  });

  it('detail includes bankName', () => {
    const result = buildCompetitiveMultiBankingInsight(45, 2.1, 'Bank A');
    expect(result?.detail).toContain('Bank A');
  });

  it('detail contains MULTI-BANKING LANDSCAPE heading', () => {
    const result = buildCompetitiveMultiBankingInsight(45, 2.1, 'Bank A');
    expect(result?.detail).toContain('MULTI-BANKING LANDSCAPE:');
  });

  it('detail contains WALLET COMPETITION heading', () => {
    const result = buildCompetitiveMultiBankingInsight(45, 2.1, 'Bank A');
    expect(result?.detail).toContain('WALLET COMPETITION:');
  });
});

// ─── 5. buildMarketStructureInsight ──────────────────────────────────────────

describe('buildMarketStructureInsight', () => {
  it('returns null when marketRows is empty', () => {
    expect(buildMarketStructureInsight([], 1800, 'Moderately Concentrated', 'Bank A', 'bank-a')).toBeNull();
  });

  it('snapshot includes bankName', () => {
    const rows = [
      makeMarketRow({ bankId: 'bank-a', bankName: 'Bank A', marketShare: 25 }),
      makeMarketRow({ bankId: 'bank-b', bankName: 'Bank B', marketShare: 15 }),
    ];
    const result = buildMarketStructureInsight(rows, 1800, 'Moderately Concentrated', 'Bank A', 'bank-a');
    expect(result?.snapshot).toContain('Bank A');
  });

  it('detail contains MARKET DISTRIBUTION heading', () => {
    const rows = [makeMarketRow()];
    const result = buildMarketStructureInsight(rows, 1800, 'Moderately Concentrated', 'Bank A', 'bank-a');
    expect(result?.detail).toContain('MARKET DISTRIBUTION:');
  });

  it('detail contains SOV VS SHARE GAPS heading', () => {
    const rows = [makeMarketRow()];
    const result = buildMarketStructureInsight(rows, 1800, 'Moderately Concentrated', 'Bank A', 'bank-a');
    expect(result?.detail).toContain('SOV VS SHARE GAPS:');
  });
});

// ─── 6. buildCustomerBehaviorInsight ─────────────────────────────────────────

describe('buildCustomerBehaviorInsight', () => {
  const portfolioComposition = [
    { label: 'Exclusive', pct: 55 },
    { label: 'Bank + 1 Other', pct: 30 },
    { label: 'Bank + 2+ Others', pct: 15 },
  ];

  it('returns null when portfolioComposition is empty', () => {
    expect(buildCustomerBehaviorInsight([], [], 45, 'Bank A')).toBeNull();
  });

  it('snapshot includes bankName', () => {
    const result = buildCustomerBehaviorInsight([], portfolioComposition, 45, 'Bank A');
    expect(result?.snapshot).toContain('Bank A');
  });

  it('detail contains PORTFOLIO MIX heading', () => {
    const result = buildCustomerBehaviorInsight([], portfolioComposition, 45, 'Bank A');
    expect(result?.detail).toContain('PORTFOLIO MIX:');
  });

  it('detail contains OVERLAP PRESSURE heading', () => {
    const result = buildCustomerBehaviorInsight([], portfolioComposition, 45, 'Bank A');
    expect(result?.detail).toContain('OVERLAP PRESSURE:');
  });
});

// ─── 7. buildCompetitivePositioningInsight ────────────────────────────────────

describe('buildCompetitivePositioningInsight', () => {
  it('returns null when positioningRows is empty', () => {
    expect(buildCompetitivePositioningInsight([], [], 'Bank A', 'bank-a')).toBeNull();
  });

  it('snapshot includes bankName', () => {
    const rows = [makePositioningRow()];
    const result = buildCompetitivePositioningInsight(rows, [], 'Bank A', 'bank-a');
    expect(result?.snapshot).toContain('Bank A');
  });

  it('detail contains COMPETITIVE POSITION heading', () => {
    const rows = [makePositioningRow()];
    const result = buildCompetitivePositioningInsight(rows, [], 'Bank A', 'bank-a');
    expect(result?.detail).toContain('COMPETITIVE POSITION:');
  });

  it('detail contains DIRECT THREATS heading', () => {
    const rows = [makePositioningRow()];
    const result = buildCompetitivePositioningInsight(rows, [], 'Bank A', 'bank-a');
    expect(result?.detail).toContain('DIRECT THREATS:');
  });
});

// ─── 8. buildSwitchingRadarInsight ────────────────────────────────────────────

describe('buildSwitchingRadarInsight', () => {
  it('returns null when hasData is false', () => {
    const radar = makeSwitchingRadar({ hasData: false });
    expect(buildSwitchingRadarInsight(radar, 'Bank A')).toBeNull();
  });

  it('snapshot mentions top competitor', () => {
    const radar = makeSwitchingRadar();
    const result = buildSwitchingRadarInsight(radar, 'Bank A', (id) => id === 'bank-b' ? 'Bank B' : id);
    expect(result?.snapshot).toContain('Bank B');
  });

  it('detail contains proxy/directional/estimated language (case insensitive)', () => {
    const radar = makeSwitchingRadar();
    const result = buildSwitchingRadarInsight(radar, 'Bank A');
    expect(result?.detail).toMatch(/proxy|directional|estimated/i);
  });

  it('detail contains WHAT THIS MEASURES heading', () => {
    const radar = makeSwitchingRadar();
    const result = buildSwitchingRadarInsight(radar, 'Bank A');
    expect(result?.detail).toContain('WHAT THIS MEASURES:');
  });

  it('detail contains SIGNAL LIMITATIONS heading', () => {
    const radar = makeSwitchingRadar();
    const result = buildSwitchingRadarInsight(radar, 'Bank A');
    expect(result?.detail).toContain('LIMITATIONS:');
  });
});

// ─── 9. buildMigrationMapInsight ──────────────────────────────────────────────

describe('buildMigrationMapInsight', () => {
  it('returns null when hasData is false', () => {
    const migration = makeMigrationMap({ hasData: false });
    expect(buildMigrationMapInsight(migration, 'Bank A')).toBeNull();
  });

  it('snapshot mentions drift rate', () => {
    const migration = makeMigrationMap({ driftRateAmongSelectedMultiBankUsers: 25 });
    const result = buildMigrationMapInsight(migration, 'Bank A');
    expect(result?.snapshot).toContain('25%');
  });

  it('detail contains proxy/directional/preference language (case insensitive)', () => {
    const migration = makeMigrationMap();
    const result = buildMigrationMapInsight(migration, 'Bank A');
    expect(result?.detail).toMatch(/proxy|directional|preference/i);
  });

  it('detail contains DRIFT RATE heading', () => {
    const migration = makeMigrationMap();
    const result = buildMigrationMapInsight(migration, 'Bank A');
    expect(result?.detail).toContain('PREFERENCE SHIFT RATE:');
  });

  it('detail contains RETENTION PRIORITY heading', () => {
    const migration = makeMigrationMap();
    const result = buildMigrationMapInsight(migration, 'Bank A');
    expect(result?.detail).toContain('RETENTION PRIORITY:');
  });
});

// ─── 10. buildWinLossInsight ──────────────────────────────────────────────────

describe('buildWinLossInsight', () => {
  const winLossData = {
    rows: [makeWinLossRow()],
    overallWinRate: 63,
    hasPanelTransitions: false,
  };

  it('returns null when rows is empty', () => {
    expect(buildWinLossInsight({ rows: [], overallWinRate: 0, hasPanelTransitions: false }, false, 'Bank A')).toBeNull();
  });

  it('observed mode (hasObservedWinLoss=true): snapshot does NOT contain "estimated" or "proxy"', () => {
    const result = buildWinLossInsight(winLossData, true, 'Bank A');
    expect(result?.snapshot).not.toMatch(/estimated|proxy/i);
  });

  it('proxy mode (hasObservedWinLoss=false): detail contains "estimated" or "proxy" or "directional"', () => {
    const result = buildWinLossInsight(winLossData, false, 'Bank A');
    expect(result?.detail).toMatch(/estimated|proxy|directional/i);
  });

  it('detail contains BALANCE READING heading', () => {
    const result = buildWinLossInsight(winLossData, false, 'Bank A');
    expect(result?.detail).toContain('BALANCE READING:');
  });

  it('detail contains MANAGEMENT PRIORITY heading', () => {
    const result = buildWinLossInsight(winLossData, false, 'Bank A');
    expect(result?.detail).toContain('MANAGEMENT PRIORITY:');
  });
});

// ─── 11. buildStrengthsWeaknessesInsight ──────────────────────────────────────

describe('buildStrengthsWeaknessesInsight', () => {
  it('returns null when relativeRows is empty', () => {
    expect(buildStrengthsWeaknessesInsight([], 50, 'Bank A')).toBeNull();
  });

  it('snapshot includes bankName', () => {
    const rows = [makeRelativeStrengthRow()];
    const result = buildStrengthsWeaknessesInsight(rows, 65, 'Bank A');
    expect(result?.snapshot).toContain('Bank A');
  });

  it('detail contains STRENGTH PROFILE heading', () => {
    const rows = [makeRelativeStrengthRow()];
    const result = buildStrengthsWeaknessesInsight(rows, 65, 'Bank A');
    expect(result?.detail).toContain('STRENGTH PROFILE:');
  });

  it('detail contains LARGEST GAP heading', () => {
    const rows = [makeRelativeStrengthRow()];
    const result = buildStrengthsWeaknessesInsight(rows, 65, 'Bank A');
    expect(result?.detail).toContain('LARGEST GAP:');
  });
});

// ─── 12. buildWhitespaceInsight ───────────────────────────────────────────────

describe('buildWhitespaceInsight', () => {
  it('returns null when both ageRows and genderRows are empty', () => {
    expect(buildWhitespaceInsight([], [], 'Bank A')).toBeNull();
  });

  it('does NOT return null when only ageRows is empty (genderRows has data)', () => {
    const genderRows = [makeWhiteSpaceRow({ segment: 'Female' })];
    expect(buildWhitespaceInsight([], genderRows, 'Bank A')).not.toBeNull();
  });

  it('snapshot includes bankName', () => {
    const ageRows = [makeWhiteSpaceRow()];
    const result = buildWhitespaceInsight(ageRows, [], 'Bank A');
    expect(result?.snapshot).toContain('Bank A');
  });

  it('detail contains AGE OPPORTUNITIES heading', () => {
    const ageRows = [makeWhiteSpaceRow()];
    const result = buildWhitespaceInsight(ageRows, [], 'Bank A');
    expect(result?.detail).toContain('AGE OPPORTUNITIES:');
  });

  it('detail contains GENDER OPPORTUNITIES heading', () => {
    const ageRows = [makeWhiteSpaceRow()];
    const result = buildWhitespaceInsight(ageRows, [], 'Bank A');
    expect(result?.detail).toContain('GENDER OPPORTUNITIES:');
  });
});

// ─── 13. buildRiskSignalsInsight ──────────────────────────────────────────────

describe('buildRiskSignalsInsight', () => {
  it('returns null when both rows and indicators are empty', () => {
    expect(buildRiskSignalsInsight({ rows: [], indicators: [] }, 'Bank A')).toBeNull();
  });

  it('does NOT return null when only rows is empty (indicators has data)', () => {
    const threats = { rows: [], indicators: [makeRiskIndicator()] };
    expect(buildRiskSignalsInsight(threats, 'Bank A')).not.toBeNull();
  });

  it('detail contains "heuristic" or "warning" or "estimated" (case insensitive)', () => {
    const threats = { rows: [makeThreatRow()], indicators: [makeRiskIndicator()] };
    const result = buildRiskSignalsInsight(threats, 'Bank A');
    expect(result?.detail).toMatch(/heuristic|warning|estimated/i);
  });

  it('detail contains THREAT LANDSCAPE heading', () => {
    const threats = { rows: [makeThreatRow()], indicators: [] };
    const result = buildRiskSignalsInsight(threats, 'Bank A');
    expect(result?.detail).toContain('THREAT LANDSCAPE:');
  });

  it('detail contains SIGNAL BASIS heading', () => {
    const threats = { rows: [makeThreatRow()], indicators: [] };
    const result = buildRiskSignalsInsight(threats, 'Bank A');
    expect(result?.detail).toContain('WHAT THIS MEASURES:');
  });

  it('critical threat level mentioned when present', () => {
    const threats = { rows: [makeThreatRow({ threatLevel: 'Critical' as const })], indicators: [] };
    const result = buildRiskSignalsInsight(threats, 'Bank A');
    expect(result?.detail).toContain('Critical');
  });
});

// ─── Regression tests: unsafe/missing field handling ─────────────────────────

describe('regression: unsafe inputs — no toFixed crash', () => {
  it('buildMarketShareInsight: does not throw when marketShareDelta is NaN', () => {
    const rows = [makeMarketRow({ bankId: 'bank-a', marketShare: 20, marketShareDelta: NaN, shareOfVoice: 22, sovVsShareGap: 2 })];
    expect(() => buildMarketShareInsight(rows, 'bank-a', 'Competitive', 'Bank A')).not.toThrow();
  });

  it('buildMarketShareInsight: does not throw when shareOfVoice is undefined', () => {
    const rows = [makeMarketRow({ bankId: 'bank-a', marketShare: 20, marketShareDelta: 1, shareOfVoice: undefined as unknown as number, sovVsShareGap: undefined as unknown as number })];
    expect(() => buildMarketShareInsight(rows, 'bank-a', 'Competitive', 'Bank A')).not.toThrow();
  });

  it('buildHHIInsight: returns null when hhi is NaN', () => {
    expect(buildHHIInsight(NaN, 'Competitive', 'Bank A')).toBeNull();
  });

  it('buildHHIInsight: returns null when hhi is Infinity', () => {
    expect(buildHHIInsight(Infinity, 'Competitive', 'Bank A')).toBeNull();
  });

  it('buildCompetitiveMultiBankingInsight: returns null when multiBankingRate is NaN', () => {
    expect(buildCompetitiveMultiBankingInsight(NaN, 2.1, 'Bank A')).toBeNull();
  });

  it('buildCompetitiveMultiBankingInsight: does not throw when averageBanksPerCustomer is NaN', () => {
    expect(() => buildCompetitiveMultiBankingInsight(65, NaN, 'Bank A')).not.toThrow();
    const result = buildCompetitiveMultiBankingInsight(65, NaN, 'Bank A');
    expect(result).not.toBeNull();
    expect(result?.snapshot).not.toContain('undefined');
  });

  it('buildMarketStructureInsight: does not throw with undefined hhi', () => {
    const rows = [makeMarketRow({ bankId: 'bank-a' })];
    expect(() => buildMarketStructureInsight(rows, undefined as unknown as number, 'Competitive', 'Bank A', 'bank-a')).not.toThrow();
  });

  it('buildCustomerBehaviorInsight: does not throw when overlapPct is undefined', () => {
    const overlap = [{ bankId: 'bank-b', bankName: 'Bank B', overlapCount: 30, overlapPct: undefined as unknown as number }];
    const portfolio = [{ label: 'Exclusive' as const, count: 100, pct: 60 }];
    expect(() => buildCustomerBehaviorInsight(overlap, portfolio, 60, 'Bank A')).not.toThrow();
  });

  it('buildCompetitivePositioningInsight: does not throw when overlapPct is undefined on directCompetitor', () => {
    const posRows = [makePositioningRow({ bankId: 'bank-a' })];
    const direct = [{ bankId: 'bank-b', bankName: 'Bank B', overlapPct: undefined as unknown as number, competitorType: 'Direct' as const }];
    expect(() => buildCompetitivePositioningInsight(posRows, direct, 'Bank A', 'bank-a')).not.toThrow();
  });

  it('buildSwitchingRadarInsight: does not throw when switchingPressureScore is NaN', () => {
    const radar = makeSwitchingRadar({
      competitors: [{ competitor: 'bank-b', secondChoiceShare: NaN, overlapShare: NaN, switchingPressureScore: NaN }],
    });
    expect(() => buildSwitchingRadarInsight(radar, 'Bank A')).not.toThrow();
  });

  it('buildMigrationMapInsight: does not throw when driftRateAmongSelectedMultiBankUsers is NaN', () => {
    const migration = makeMigrationMap({ driftRateAmongSelectedMultiBankUsers: NaN });
    expect(() => buildMigrationMapInsight(migration, 'Bank A')).not.toThrow();
  });

  it('buildMigrationMapInsight: snapshot does not contain NaN text', () => {
    const migration = makeMigrationMap({ driftRateAmongSelectedMultiBankUsers: NaN });
    const result = buildMigrationMapInsight(migration, 'Bank A');
    expect(result?.snapshot).not.toContain('NaN');
    expect(result?.snapshot).not.toContain('undefined');
  });

  it('buildWinLossInsight: does not throw when winRate is NaN on a row', () => {
    const winLoss = {
      rows: [makeWinLossRow({ winRate: NaN, gainedFrom: 10, lostTo: 5, net: 5 })],
      overallWinRate: NaN,
      hasPanelTransitions: false,
    };
    expect(() => buildWinLossInsight(winLoss, false, 'Bank A')).not.toThrow();
  });

  it('buildStrengthsWeaknessesInsight: does not throw when relativeStrengthIndex is NaN', () => {
    const rows = [makeRelativeStrengthRow()];
    expect(() => buildStrengthsWeaknessesInsight(rows, NaN, 'Bank A')).not.toThrow();
    const result = buildStrengthsWeaknessesInsight(rows, NaN, 'Bank A');
    expect(result?.snapshot).not.toContain('NaN');
  });

  it('buildStrengthsWeaknessesInsight: does not throw when yourValue or marketAvg is undefined', () => {
    const rows = [makeRelativeStrengthRow({ yourValue: undefined as unknown as number, marketAvg: undefined as unknown as number })];
    expect(() => buildStrengthsWeaknessesInsight(rows, 55, 'Bank A')).not.toThrow();
  });

  it('buildWhitespaceInsight: does not throw when marketAvg/yourPenetration/gap are NaN', () => {
    const rows = [makeWhiteSpaceRow({ marketAvg: NaN, yourPenetration: NaN, gap: NaN })];
    expect(() => buildWhitespaceInsight(rows, [], 'Bank A')).not.toThrow();
    const result = buildWhitespaceInsight(rows, [], 'Bank A');
    expect(result?.snapshot).not.toContain('NaN');
  });

  it('buildRiskSignalsInsight: does not throw when likelihoodScore or impactScore are undefined', () => {
    const rows = [makeThreatRow({ likelihoodScore: undefined as unknown as number, impactScore: undefined as unknown as number })];
    const threats = { rows, indicators: [] };
    expect(() => buildRiskSignalsInsight(threats, 'Bank A')).not.toThrow();
  });
});

// ─── Naming collision regression ─────────────────────────────────────────────

describe('naming collision guard: buildCompetitiveMultiBankingInsight vs buildMultiBankingInsight', () => {
  it('competitive version accepts positional args and returns an insight object', () => {
    const result = buildCompetitiveMultiBankingInsight(65, 2.1, 'Bank A');
    expect(result).not.toBeNull();
    expect(result?.snapshot).toContain('65%'); // multiBankingRate formatted
    expect(result?.detail).toContain('Bank A'); // bankName in detail sections
  });

  it('competitive version snapshot contains formatted percentage (not NaN or undefined)', () => {
    const result = buildCompetitiveMultiBankingInsight(65, 2.1, 'Bank A');
    expect(result?.snapshot).not.toContain('NaN');
    expect(result?.snapshot).not.toContain('undefined');
    expect(result?.snapshot).toContain('%');
  });

  it('competitive version does not crash when called with positional numbers (the crash scenario)', () => {
    // This test replicates the exact call that was crashing:
    // buildMultiBankingInsight(multiBankingRate, averageBanksPerCustomer, bankName)
    expect(() => buildCompetitiveMultiBankingInsight(74.5, 2.3, 'BANCOBU')).not.toThrow();
  });

  it('competitive version returns null when multiBankingRate is NaN', () => {
    expect(buildCompetitiveMultiBankingInsight(NaN, 2.1, 'Bank A')).toBeNull();
  });

  it('competitive version does not throw when averageBanksPerCustomer is NaN', () => {
    expect(() => buildCompetitiveMultiBankingInsight(65, NaN, 'Bank A')).not.toThrow();
    const result = buildCompetitiveMultiBankingInsight(65, NaN, 'Bank A');
    expect(result?.snapshot).not.toContain('NaN');
  });
});
