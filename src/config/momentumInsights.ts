import { MetricInsightContent, SectionInsightContent } from '@/config/awarenessInsights';

export type MomentumMetricKey =
  | 'momentum_score'
  | 'awareness_growth_score'
  | 'consideration_rate_momentum'
  | 'conversion_rate_momentum'
  | 'retention_rate_momentum'
  | 'adoption_rate_momentum'
  | 'momentum_velocity'
  | 'trajectory_forecast'
  | 'volatility_score'
  | 'relative_momentum';

export type MomentumSectionInsightKey =
  | 'momentum_drivers'
  | 'momentum_trends'
  | 'competitive_momentum';

export const MOMENTUM_METRIC_CONTENT: Record<MomentumMetricKey, MetricInsightContent> = {
  momentum_score: {
    title: 'Brand Momentum Score',
    definition: 'Composite score showing whether brand performance is strengthening or weakening across the full funnel.',
    formulaPlain: 'Momentum = (Awareness Growth×15%) + (Consideration×25%) + (Conversion×25%) + (Retention×20%) + (Adoption×15%)',
    interpretationThresholds: [
      '80-100: excellent momentum.',
      '60-79: good momentum.',
      '40-59: moderate momentum.',
      '20-39: weak momentum.',
      '0-19: crisis momentum.',
    ],
  },
  awareness_growth_score: {
    title: 'Awareness Growth Score',
    definition: 'Normalized score based on period-over-period awareness percentage-point change.',
    formulaPlain: 'If growth >= +10pp: 100; if growth <= -10pp: 0; else 50 + (growth×5)',
  },
  consideration_rate_momentum: {
    title: 'Consideration Rate',
    definition: 'Share of aware respondents with strong future intent or relevance signals.',
    formulaPlain: 'Consideration = Considerers / Aware × 100',
  },
  conversion_rate_momentum: {
    title: 'Conversion Rate',
    definition: 'Ability to convert awareness into first-time trial.',
    formulaPlain: 'Conversion = Ever Used / Aware × 100',
  },
  retention_rate_momentum: {
    title: 'Retention Rate',
    definition: 'Ability to keep triers as active users.',
    formulaPlain: 'Retention = Currently Using / Ever Used × 100',
  },
  adoption_rate_momentum: {
    title: 'Adoption Rate',
    definition: 'Ability to convert active users into primary-bank relationships.',
    formulaPlain: 'Adoption = Preferred / Currently Using × 100',
  },
  momentum_velocity: {
    title: 'Momentum Velocity',
    definition: 'Rate of momentum acceleration between recent and earlier periods.',
    formulaPlain: 'Velocity = Recent 3-month average score - Earlier 3-month average score',
  },
  trajectory_forecast: {
    title: 'Momentum Trajectory Forecast',
    definition: 'Near-term projected momentum based on observed trend slope.',
    formulaPlain: 'Projection = Current score + (monthly trend slope × forecast horizon)',
  },
  volatility_score: {
    title: 'Momentum Volatility',
    definition: 'Stability of momentum scores over time.',
    formulaPlain: 'Volatility CV = (Standard deviation / Mean momentum) × 100',
  },
  relative_momentum: {
    title: 'Relative Momentum',
    definition: 'Your momentum position versus other banks in the same market.',
    formulaPlain: 'Relative rank based on current momentum score and growth delta',
  },
};

export const MOMENTUM_SECTION_INSIGHTS: Record<MomentumSectionInsightKey, SectionInsightContent> = {
  momentum_drivers: {
    title: 'Momentum Drivers: How to Interpret',
    interpretationThresholds: [
      'Largest contribution share identifies your current momentum strength.',
      'Lowest contribution share identifies your weakest link.',
      'Higher sensitivity gain means each +10 points yields more momentum lift.',
      'Higher investment priority score indicates stronger return potential.',
    ],
    keyInsight: 'Prioritize high-weight components with large quality gaps for fastest momentum improvement.',
  },
  momentum_trends: {
    title: 'Momentum Trends & Stability',
    interpretationThresholds: [
      'Velocity > +3: accelerating momentum.',
      'Velocity 0 to +3: steady growth.',
      'Velocity < 0: decelerating momentum.',
      'Volatility CV < 10%: low volatility.',
      'Volatility CV 10-20%: moderate volatility.',
      'Volatility CV > 20%: high volatility.',
    ],
    keyInsight: 'Sustained upward momentum with low volatility indicates healthier, more predictable growth.',
  },
  competitive_momentum: {
    title: 'Competitive Momentum Analysis',
    interpretationThresholds: [
      'Positive score delta indicates momentum improvement vs previous period.',
      'Higher growth rate than leader suggests challenger acceleration.',
      'Component-level gaps reveal where competitors outperform you.',
    ],
    keyInsight: 'Use component-level gaps to target the exact levers needed to close momentum rank distance.',
  },
};
