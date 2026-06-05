import { describe, it, expect } from 'vitest';
import {
  buildMomentumModuleSummary,
  buildMomentumScoreInsight,
  buildVelocityInsight,
  buildComponentInsight,
  buildDriversInsight,
  buildScenarioSensitivityInsight,
  buildTrendInsight,
  buildTrajectoryInsight,
  buildCompetitiveMomentumInsight,
} from './momentumInsights';
import type {
  MomentumDiagnostics,
  MomentumContributionRow,
  MomentumSensitivityRow,
  MomentumPriorityRow,
  MomentumTrendPoint,
  MomentumForecastPoint,
  CompetitiveMomentumRow,
} from '@/utils/subscriberDashboard';

// ─── Helper factory ───────────────────────────────────────────────────────────

function makeDiagnostics(overrides: Partial<MomentumDiagnostics> = {}): MomentumDiagnostics {
  return {
    score: 50,
    status: 'Moderate Momentum',
    strategy: 'Fix and rebuild',
    components: { awarenessGrowth: 50, consideration: 50, conversion: 50, retention: 50, adoption: 50 },
    contributions: [
      { key: 'consideration', label: 'Consideration', weightPct: 25, score: 50, contribution: 12.5, shareOfTotal: 25 },
      { key: 'conversion', label: 'Conversion', weightPct: 25, score: 50, contribution: 12.5, shareOfTotal: 25 },
      { key: 'retention', label: 'Retention', weightPct: 20, score: 40, contribution: 8, shareOfTotal: 20 },
      { key: 'adoption', label: 'Adoption', weightPct: 15, score: 60, contribution: 9, shareOfTotal: 18 },
      { key: 'awarenessGrowth', label: 'Awareness Growth', weightPct: 15, score: 50, contribution: 7.5, shareOfTotal: 12 },
    ],
    sensitivity: [
      { key: 'consideration', label: 'Consideration', currentScore: 50, improvedScore: 60, momentumGain: 2.5 },
      { key: 'conversion', label: 'Conversion', currentScore: 50, improvedScore: 60, momentumGain: 2.5 },
      { key: 'retention', label: 'Retention', currentScore: 40, improvedScore: 50, momentumGain: 2.0 },
      { key: 'adoption', label: 'Adoption', currentScore: 60, improvedScore: 70, momentumGain: 1.5 },
      { key: 'awarenessGrowth', label: 'Awareness Growth', currentScore: 50, improvedScore: 60, momentumGain: 1.5 },
    ],
    priorities: [
      { key: 'retention', label: 'Retention', currentScore: 40, gapToExcellence: 50, weightPct: 20, difficulty: 4, priorityScore: 2.5 },
      { key: 'consideration', label: 'Consideration', currentScore: 50, gapToExcellence: 40, weightPct: 25, difficulty: 2, priorityScore: 5.0 },
      { key: 'conversion', label: 'Conversion', currentScore: 50, gapToExcellence: 40, weightPct: 25, difficulty: 3, priorityScore: 3.3 },
      { key: 'adoption', label: 'Adoption', currentScore: 60, gapToExcellence: 30, weightPct: 15, difficulty: 2, priorityScore: 2.25 },
      { key: 'awarenessGrowth', label: 'Awareness Growth', currentScore: 50, gapToExcellence: 40, weightPct: 15, difficulty: 3, priorityScore: 2.0 },
    ],
    trends: [
      { month: 'Jan', score: 45, delta: null, sample: 50 },
      { month: 'Feb', score: 48, delta: 3, sample: 50 },
      { month: 'Mar', score: 50, delta: 2, sample: 50 },
    ],
    velocity: 2,
    velocityLabel: 'Steady growth',
    forecast: [
      { month: 'Apr', projectedScore: 52 },
      { month: 'May', projectedScore: 54 },
      { month: 'Jun', projectedScore: 56 },
    ],
    volatilityCv: 5,
    volatilityLabel: 'Low volatility',
    competitiveRows: [
      { bankId: 'bank-a', bankName: 'Bank A', score: 70, previousScore: 68, delta: 2, growthRate: 2.9, components: { awarenessGrowth: 70, consideration: 70, conversion: 70, retention: 70, adoption: 70 } },
      { bankId: 'bank-b', bankName: 'Bank B', score: 50, previousScore: 50, delta: 0, growthRate: 0, components: { awarenessGrowth: 50, consideration: 50, conversion: 50, retention: 50, adoption: 50 } },
    ],
    selectedRank: 2,
    gapToLeader: 20,
    validTrendPeriods: 3,
    missingTrendPeriods: 0,
    forecastEligible: true,
    notes: [],
    ...overrides,
  };
}

// ─── 1. buildMomentumModuleSummary ────────────────────────────────────────────

describe('buildMomentumModuleSummary', () => {
  it('returns null when score is 0, validTrendPeriods is 0, and contributions is empty', () => {
    const d = makeDiagnostics({ score: 0, validTrendPeriods: 0, contributions: [] });
    expect(buildMomentumModuleSummary(d, 'Test Bank')).toBeNull();
  });

  it('snapshot includes bankName', () => {
    const result = buildMomentumModuleSummary(makeDiagnostics(), 'MyBank');
    expect(result?.snapshot).toContain('MyBank');
  });

  it('snapshot mentions Excellent tier for score=85', () => {
    const d = makeDiagnostics({ score: 85, status: 'Excellent Momentum' });
    const result = buildMomentumModuleSummary(d, 'Bank');
    expect(result?.snapshot).toContain('Excellent Momentum');
  });

  it('snapshot mentions Good tier for score=65', () => {
    const d = makeDiagnostics({ score: 65, status: 'Good Momentum' });
    const result = buildMomentumModuleSummary(d, 'Bank');
    expect(result?.snapshot).toContain('Good Momentum');
  });

  it('snapshot mentions Moderate tier for score=50', () => {
    const d = makeDiagnostics({ score: 50, status: 'Moderate Momentum' });
    const result = buildMomentumModuleSummary(d, 'Bank');
    expect(result?.snapshot).toContain('Moderate Momentum');
  });

  it('snapshot mentions Weak tier for score=30', () => {
    const d = makeDiagnostics({ score: 30, status: 'Weak Momentum' });
    const result = buildMomentumModuleSummary(d, 'Bank');
    expect(result?.snapshot).toContain('Weak Momentum');
  });

  it('snapshot mentions Crisis tier for score=10', () => {
    const d = makeDiagnostics({ score: 10, status: 'Crisis Momentum' });
    const result = buildMomentumModuleSummary(d, 'Bank');
    expect(result?.snapshot).toContain('Crisis Momentum');
  });

  it('detail contains MOMENTUM POSITION section heading', () => {
    const result = buildMomentumModuleSummary(makeDiagnostics(), 'Bank');
    expect(result?.detail).toContain('MOMENTUM POSITION:');
  });

  it('detail contains TREND DIRECTION section heading', () => {
    const result = buildMomentumModuleSummary(makeDiagnostics(), 'Bank');
    expect(result?.detail).toContain('TREND DIRECTION:');
  });

  it('detail contains PRIMARY LEVER section heading', () => {
    const result = buildMomentumModuleSummary(makeDiagnostics(), 'Bank');
    expect(result?.detail).toContain('PRIMARY LEVER:');
  });
});

// ─── 2. buildMomentumScoreInsight ─────────────────────────────────────────────

describe('buildMomentumScoreInsight', () => {
  it('returns null when score is NaN', () => {
    expect(buildMomentumScoreInsight(NaN, 'Moderate Momentum', 'Fix and rebuild', 'Bank')).toBeNull();
  });

  it('covers excellent tier (score=85)', () => {
    const result = buildMomentumScoreInsight(85, 'Excellent Momentum', 'Scale and defend', 'Bank');
    expect(result?.snapshot).toContain('excellent');
  });

  it('covers good tier (score=65)', () => {
    const result = buildMomentumScoreInsight(65, 'Good Momentum', 'Optimize and grow', 'Bank');
    expect(result?.snapshot).toContain('good');
  });

  it('covers moderate tier (score=50)', () => {
    const result = buildMomentumScoreInsight(50, 'Moderate Momentum', 'Fix and rebuild', 'Bank');
    expect(result?.snapshot).toContain('moderate');
  });

  it('covers weak tier (score=30)', () => {
    const result = buildMomentumScoreInsight(30, 'Weak Momentum', 'Urgent intervention', 'Bank');
    expect(result?.snapshot).toContain('weak');
  });

  it('covers crisis tier (score=10)', () => {
    const result = buildMomentumScoreInsight(10, 'Crisis Momentum', 'Emergency turnaround', 'Bank');
    expect(result?.snapshot).toContain('crisis');
  });

  it('snapshot includes bankName', () => {
    const result = buildMomentumScoreInsight(50, 'Moderate Momentum', 'Fix and rebuild', 'MyBank');
    expect(result?.snapshot).toContain('MyBank');
  });

  it('detail contains SCORE POSITION heading', () => {
    const result = buildMomentumScoreInsight(50, 'Moderate Momentum', 'Fix and rebuild', 'Bank');
    expect(result?.detail).toContain('SCORE POSITION:');
  });

  it('detail contains COMMERCIAL IMPACT heading', () => {
    const result = buildMomentumScoreInsight(50, 'Moderate Momentum', 'Fix and rebuild', 'Bank');
    expect(result?.detail).toContain('COMMERCIAL IMPACT:');
  });
});

// ─── 3. buildVelocityInsight ──────────────────────────────────────────────────

describe('buildVelocityInsight', () => {
  it('returns null when both velocity and volatilityCv are null', () => {
    expect(buildVelocityInsight(null, '', null, '', 'Bank')).toBeNull();
  });

  it('does NOT return null when velocity is null but volatilityCv is valid', () => {
    expect(buildVelocityInsight(null, '', 5, 'Low volatility', 'Bank')).not.toBeNull();
  });

  it('does NOT return null when velocity is valid but volatilityCv is null', () => {
    expect(buildVelocityInsight(2, 'Steady growth', null, '', 'Bank')).not.toBeNull();
  });

  it('snapshot mentions bank name', () => {
    const result = buildVelocityInsight(2, 'Steady growth', 5, 'Low volatility', 'MyBank');
    expect(result?.snapshot).toContain('MyBank');
  });

  it('covers accelerating (velocity=5)', () => {
    const result = buildVelocityInsight(5, 'Accelerating', 5, 'Low volatility', 'Bank');
    expect(result?.snapshot).toContain('accelerating');
  });

  it('covers steady (velocity=1)', () => {
    const result = buildVelocityInsight(1, 'Steady growth', 5, 'Low volatility', 'Bank');
    expect(result?.snapshot).toContain('steadily');
  });

  it('covers decelerating (velocity=-2)', () => {
    const result = buildVelocityInsight(-2, 'Decelerating', 5, 'Low volatility', 'Bank');
    expect(result?.snapshot).toContain('declining');
  });

  it('detail contains VELOCITY READ heading', () => {
    const result = buildVelocityInsight(2, 'Steady growth', 5, 'Low volatility', 'Bank');
    expect(result?.detail).toContain('VELOCITY READ:');
  });

  it('detail contains VOLATILITY READ heading', () => {
    const result = buildVelocityInsight(2, 'Steady growth', 5, 'Low volatility', 'Bank');
    expect(result?.detail).toContain('VOLATILITY READ:');
  });

  it('detail contains COMBINED SIGNAL heading', () => {
    const result = buildVelocityInsight(2, 'Steady growth', 5, 'Low volatility', 'Bank');
    expect(result?.detail).toContain('COMBINED SIGNAL:');
  });

  it('detail contains MANAGEMENT IMPLICATION heading', () => {
    const result = buildVelocityInsight(2, 'Steady growth', 5, 'Low volatility', 'Bank');
    expect(result?.detail).toContain('MANAGEMENT IMPLICATION:');
  });
});

// ─── 4. buildComponentInsight ─────────────────────────────────────────────────

describe('buildComponentInsight', () => {
  it('returns null when componentScore is NaN', () => {
    expect(buildComponentInsight('Consideration', NaN, 25, 12.5, 25, 'Bank')).toBeNull();
  });

  it('strong tier (score=80): snapshot indicates strong', () => {
    const result = buildComponentInsight('Consideration', 80, 25, 20, 25, 'Bank');
    expect(result?.snapshot).toContain('strong');
  });

  it('adequate tier (score=60): snapshot indicates adequate', () => {
    const result = buildComponentInsight('Consideration', 60, 25, 15, 25, 'Bank');
    expect(result?.snapshot).toContain('adequate');
  });

  it('weak tier (score=40): snapshot indicates weak', () => {
    const result = buildComponentInsight('Consideration', 40, 25, 10, 25, 'Bank');
    expect(result?.snapshot).toContain('weak');
  });

  it('detail contains COMPONENT PERFORMANCE heading', () => {
    const result = buildComponentInsight('Consideration', 60, 25, 15, 25, 'Bank');
    expect(result?.detail).toContain('COMPONENT PERFORMANCE:');
  });

  it('detail contains WEIGHT AND IMPACT heading', () => {
    const result = buildComponentInsight('Consideration', 60, 25, 15, 25, 'Bank');
    expect(result?.detail).toContain('WEIGHT AND IMPACT:');
  });

  it('detail contains FUNNEL INTERPRETATION heading', () => {
    const result = buildComponentInsight('Consideration', 60, 25, 15, 25, 'Bank');
    expect(result?.detail).toContain('FUNNEL INTERPRETATION:');
  });

  it('detail contains IMPROVEMENT LEVER heading', () => {
    const result = buildComponentInsight('Consideration', 60, 25, 15, 25, 'Bank');
    expect(result?.detail).toContain('IMPROVEMENT LEVER:');
  });
});

// ─── 5. buildDriversInsight ───────────────────────────────────────────────────

describe('buildDriversInsight', () => {
  const contributions: MomentumContributionRow[] = [
    { key: 'consideration', label: 'Consideration', weightPct: 25, score: 70, contribution: 17.5, shareOfTotal: 35 },
    { key: 'conversion', label: 'Conversion', weightPct: 25, score: 40, contribution: 10, shareOfTotal: 20 },
    { key: 'retention', label: 'Retention', weightPct: 20, score: 50, contribution: 10, shareOfTotal: 20 },
  ];
  const priorities: MomentumPriorityRow[] = [
    { key: 'conversion', label: 'Conversion', currentScore: 40, gapToExcellence: 50, weightPct: 25, difficulty: 3, priorityScore: 4.2 },
  ];

  it('returns null when contributions is empty', () => {
    expect(buildDriversInsight([], priorities, 'Bank')).toBeNull();
  });

  it('snapshot includes bankName', () => {
    const result = buildDriversInsight(contributions, priorities, 'MyBank');
    expect(result?.snapshot).toContain('MyBank');
  });

  it('detail contains TOP DRIVER heading', () => {
    const result = buildDriversInsight(contributions, priorities, 'Bank');
    expect(result?.detail).toContain('TOP DRIVER:');
  });

  it('detail contains WEAKEST LINK heading', () => {
    const result = buildDriversInsight(contributions, priorities, 'Bank');
    expect(result?.detail).toContain('WEAKEST LINK:');
  });

  it('identifies highest shareOfTotal as top driver', () => {
    // Consideration has highest contribution (17.5) and shareOfTotal (35)
    const result = buildDriversInsight(contributions, priorities, 'Bank');
    expect(result?.snapshot).toContain('Consideration');
  });

  it('identifies lowest score as weakest link', () => {
    // Conversion has lowest score (40)
    const result = buildDriversInsight(contributions, priorities, 'Bank');
    expect(result?.snapshot).toContain('Conversion');
  });
});

// ─── 6. buildScenarioSensitivityInsight ──────────────────────────────────────

describe('buildScenarioSensitivityInsight', () => {
  const sensitivity: MomentumSensitivityRow[] = [
    { key: 'consideration', label: 'Consideration', currentScore: 50, improvedScore: 60, momentumGain: 2.5 },
    { key: 'conversion', label: 'Conversion', currentScore: 50, improvedScore: 60, momentumGain: 5.0 },
    { key: 'retention', label: 'Retention', currentScore: 40, improvedScore: 50, momentumGain: 1.5 },
  ];
  const priorities: MomentumPriorityRow[] = [
    { key: 'conversion', label: 'Conversion', currentScore: 50, gapToExcellence: 40, weightPct: 25, difficulty: 3, priorityScore: 4.2 },
  ];

  it('returns null when sensitivity is empty', () => {
    expect(buildScenarioSensitivityInsight([], priorities, 'Bank')).toBeNull();
  });

  it('snapshot mentions top leverage component', () => {
    const result = buildScenarioSensitivityInsight(sensitivity, priorities, 'Bank');
    // Conversion has highest momentumGain (5.0)
    expect(result?.snapshot).toContain('Conversion');
  });

  it('detail contains HIGHEST LEVERAGE heading', () => {
    const result = buildScenarioSensitivityInsight(sensitivity, priorities, 'Bank');
    expect(result?.detail).toContain('HIGHEST LEVERAGE:');
  });

  it('detail contains PRIORITY RANKING heading', () => {
    const result = buildScenarioSensitivityInsight(sensitivity, priorities, 'Bank');
    expect(result?.detail).toContain('PRIORITY RANKING:');
  });

  it('detail contains WHY IT MATTERS heading', () => {
    const result = buildScenarioSensitivityInsight(sensitivity, priorities, 'Bank');
    expect(result?.detail).toContain('WHY IT MATTERS:');
  });

  it('detail contains RECOMMENDED ACTION heading', () => {
    const result = buildScenarioSensitivityInsight(sensitivity, priorities, 'Bank');
    expect(result?.detail).toContain('RECOMMENDED ACTION:');
  });

  it('top lever is the one with highest momentumGain', () => {
    const result = buildScenarioSensitivityInsight(sensitivity, priorities, 'MyBank');
    expect(result?.snapshot).toContain('Conversion');
  });
});

// ─── 7. buildTrendInsight ─────────────────────────────────────────────────────

describe('buildTrendInsight', () => {
  const bankName = 'TestBank';

  it('returns null when trends is empty', () => {
    expect(buildTrendInsight([], 2, 'Steady growth', true, 3, bankName)).toBeNull();
  });

  it('single valid period: snapshot mentions cannot determine trend', () => {
    const trends: MomentumTrendPoint[] = [{ month: 'Jan', score: 50, delta: null, sample: 50 }];
    const result = buildTrendInsight(trends, null, '', false, 1, bankName);
    expect(result?.snapshot).toContain('cannot be determined');
  });

  it('improving trend (first=40, last=60): snapshot mentions improving', () => {
    const trends: MomentumTrendPoint[] = [
      { month: 'Jan', score: 40, delta: null, sample: 50 },
      { month: 'Feb', score: 60, delta: 20, sample: 50 },
    ];
    const result = buildTrendInsight(trends, 20, 'Accelerating', true, 2, bankName);
    expect(result?.snapshot).toContain('improving');
  });

  it('declining trend (first=60, last=40): snapshot mentions declining', () => {
    const trends: MomentumTrendPoint[] = [
      { month: 'Jan', score: 60, delta: null, sample: 50 },
      { month: 'Feb', score: 40, delta: -20, sample: 50 },
    ];
    const result = buildTrendInsight(trends, -20, 'Decelerating', true, 2, bankName);
    expect(result?.snapshot).toContain('declining');
  });

  it('stable trend (first=50, last=51): snapshot mentions stable', () => {
    const trends: MomentumTrendPoint[] = [
      { month: 'Jan', score: 50, delta: null, sample: 50 },
      { month: 'Feb', score: 51, delta: 1, sample: 50 },
    ];
    const result = buildTrendInsight(trends, 1, 'Steady growth', true, 2, bankName);
    expect(result?.snapshot).toContain('stable');
  });

  it('detail contains TREND DIRECTION heading', () => {
    const trends: MomentumTrendPoint[] = [
      { month: 'Jan', score: 45, delta: null, sample: 50 },
      { month: 'Feb', score: 50, delta: 5, sample: 50 },
    ];
    const result = buildTrendInsight(trends, 5, 'Steady growth', true, 2, bankName);
    expect(result?.detail).toContain('TREND DIRECTION:');
  });

  it('detail contains PERIOD COVERAGE heading', () => {
    const trends: MomentumTrendPoint[] = [
      { month: 'Jan', score: 45, delta: null, sample: 50 },
      { month: 'Feb', score: 50, delta: 5, sample: 50 },
    ];
    const result = buildTrendInsight(trends, 5, 'Steady growth', true, 2, bankName);
    expect(result?.detail).toContain('PERIOD COVERAGE:');
  });
});

// ─── 8. buildTrajectoryInsight ────────────────────────────────────────────────

describe('buildTrajectoryInsight', () => {
  const bankName = 'ForecastBank';

  it('returns null when forecast is empty', () => {
    expect(buildTrajectoryInsight([], true, 50, bankName)).toBeNull();
  });

  it('forecastEligible=false: detail explains data requirement', () => {
    const forecast: MomentumForecastPoint[] = [{ month: 'Apr', projectedScore: 52 }];
    const result = buildTrajectoryInsight(forecast, false, 50, bankName);
    expect(result?.detail).toContain('four-period minimum');
  });

  it('improving trajectory: snapshot positive', () => {
    const forecast: MomentumForecastPoint[] = [
      { month: 'Apr', projectedScore: 55 },
      { month: 'May', projectedScore: 60 },
      { month: 'Jun', projectedScore: 65 },
    ];
    const result = buildTrajectoryInsight(forecast, true, 50, bankName);
    expect(result?.snapshot).toContain('improve');
  });

  it('declining trajectory: snapshot negative', () => {
    const forecast: MomentumForecastPoint[] = [
      { month: 'Apr', projectedScore: 45 },
      { month: 'May', projectedScore: 40 },
      { month: 'Jun', projectedScore: 35 },
    ];
    const result = buildTrajectoryInsight(forecast, true, 50, bankName);
    expect(result?.snapshot).toContain('decline');
  });

  it('flat trajectory: snapshot mentions stable', () => {
    const forecast: MomentumForecastPoint[] = [
      { month: 'Apr', projectedScore: 50 },
      { month: 'May', projectedScore: 51 },
      { month: 'Jun', projectedScore: 50 },
    ];
    const result = buildTrajectoryInsight(forecast, true, 50, bankName);
    expect(result?.snapshot).toContain('flat');
  });

  it('detail contains FORECAST OUTLOOK heading', () => {
    const forecast: MomentumForecastPoint[] = [{ month: 'Apr', projectedScore: 55 }];
    const result = buildTrajectoryInsight(forecast, true, 50, bankName);
    expect(result?.detail).toContain('FORECAST OUTLOOK:');
  });

  it('detail contains BASIS FOR PROJECTION heading', () => {
    const forecast: MomentumForecastPoint[] = [{ month: 'Apr', projectedScore: 55 }];
    const result = buildTrajectoryInsight(forecast, true, 50, bankName);
    expect(result?.detail).toContain('BASIS FOR PROJECTION:');
  });

  it('detail contains CAVEAT heading', () => {
    const forecast: MomentumForecastPoint[] = [{ month: 'Apr', projectedScore: 55 }];
    const result = buildTrajectoryInsight(forecast, true, 50, bankName);
    expect(result?.detail).toContain('CAVEAT:');
  });
});

// ─── 9. buildCompetitiveMomentumInsight ───────────────────────────────────────

describe('buildCompetitiveMomentumInsight', () => {
  const makeRows = (): CompetitiveMomentumRow[] => [
    {
      bankId: 'bank-a',
      bankName: 'Bank A',
      score: 70,
      previousScore: 68,
      delta: 2,
      growthRate: 2.9,
      components: { awarenessGrowth: 70, consideration: 70, conversion: 70, retention: 70, adoption: 70 },
    },
    {
      bankId: 'bank-b',
      bankName: 'Bank B',
      score: 65,
      previousScore: 63,
      delta: 2,
      growthRate: 3.2,
      components: { awarenessGrowth: 65, consideration: 65, conversion: 65, retention: 65, adoption: 65 },
    },
    {
      bankId: 'bank-c',
      bankName: 'Bank C',
      score: 60,
      previousScore: 58,
      delta: 2,
      growthRate: 3.4,
      components: { awarenessGrowth: 60, consideration: 60, conversion: 60, retention: 60, adoption: 60 },
    },
    {
      bankId: 'bank-d',
      bankName: 'Bank D',
      score: 50,
      previousScore: 49,
      delta: 1,
      growthRate: 2.0,
      components: { awarenessGrowth: 50, consideration: 50, conversion: 50, retention: 50, adoption: 50 },
    },
  ];

  it('returns null when competitiveRows is empty', () => {
    expect(buildCompetitiveMomentumInsight([], 'bank-a', 1, 0, 'Bank A')).toBeNull();
  });

  it('rank 1 (leader): snapshot mentions leads', () => {
    const result = buildCompetitiveMomentumInsight(makeRows(), 'bank-a', 1, 0, 'Bank A');
    expect(result?.snapshot).toContain('leads');
  });

  it('close challenger (rank=2, gap=5): snapshot mentions challenger', () => {
    const result = buildCompetitiveMomentumInsight(makeRows(), 'bank-b', 2, 5, 'Bank B');
    expect(result?.snapshot).toContain('challenger');
  });

  it('trailing (rank=4, gap=20): snapshot mentions trailing', () => {
    const result = buildCompetitiveMomentumInsight(makeRows(), 'bank-d', 4, 20, 'Bank D');
    expect(result?.snapshot).toContain('trailing');
  });

  it('detail contains MARKET POSITION heading', () => {
    const result = buildCompetitiveMomentumInsight(makeRows(), 'bank-b', 2, 5, 'Bank B');
    expect(result?.detail).toContain('MARKET POSITION:');
  });

  it('detail contains SCORE COMPARISON heading', () => {
    const result = buildCompetitiveMomentumInsight(makeRows(), 'bank-b', 2, 5, 'Bank B');
    expect(result?.detail).toContain('SCORE COMPARISON:');
  });

  it('detail contains COMPONENT GAPS heading', () => {
    const result = buildCompetitiveMomentumInsight(makeRows(), 'bank-b', 2, 5, 'Bank B');
    expect(result?.detail).toContain('COMPONENT GAPS:');
  });

  it('detail contains STRATEGIC IMPLICATION heading', () => {
    const result = buildCompetitiveMomentumInsight(makeRows(), 'bank-b', 2, 5, 'Bank B');
    expect(result?.detail).toContain('STRATEGIC IMPLICATION:');
  });
});

// ─── Defensive formatting: undefined/NaN inputs must not crash ───────────────

import { buildMomentumModuleSummary, buildMomentumScoreInsight, buildVelocityInsight } from './momentumInsights';

const BASE_MOMENTUM = {
  score: NaN,
  status: 'Moderate Momentum' as const,
  strategy: 'Fix and rebuild' as const,
  components: { awarenessGrowth: NaN, consideration: NaN, conversion: NaN, retention: NaN, adoption: NaN },
  contributions: [],
  sensitivity: [],
  priorities: [],
  trends: [],
  velocity: null,
  velocityLabel: 'Steady growth' as const,
  forecast: [],
  volatilityCv: null,
  volatilityLabel: 'Low volatility' as const,
  competitiveRows: [],
  selectedRank: 1,
  gapToLeader: 0,
  validTrendPeriods: 0,
  missingTrendPeriods: 6,
  forecastEligible: false,
  notes: [],
};

describe('momentumInsights: safe number formatting (no toFixed crash)', () => {
  it('buildMomentumModuleSummary does not throw when score is NaN', () => {
    expect(() => buildMomentumModuleSummary(BASE_MOMENTUM as any, 'Bank A')).not.toThrow();
  });

  it('buildMomentumModuleSummary snapshot does not contain NaN text', () => {
    const result = buildMomentumModuleSummary(BASE_MOMENTUM as any, 'Bank A');
    expect(result?.snapshot ?? '').not.toContain('NaN');
  });

  it('buildMomentumScoreInsight does not throw when score is NaN', () => {
    expect(() => buildMomentumScoreInsight(NaN, 'Moderate Momentum', 'Fix and rebuild', 'Bank A')).not.toThrow();
  });

  it('buildVelocityInsight does not throw when velocity and volatilityCv are null', () => {
    expect(() => buildVelocityInsight(null, 'Steady growth', null, 'Low volatility', 'Bank A')).not.toThrow();
  });
});
