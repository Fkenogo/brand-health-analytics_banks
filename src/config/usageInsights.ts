import { MetricInsightContent, SectionInsightContent } from '@/config/awarenessInsights';

export type UsageMetricKey =
  | 'ever_used'
  | 'current_usage'
  | 'bumo'
  | 'trial_rate'
  | 'lapsed_usage'
  | 'retention_rate'
  | 'churn_rate'
  | 'preference_rate'
  | 'multi_banking_rate'
  | 'avg_banks_per_user'
  | 'friction_score'
  | 'position_matrix'
  | 'growth_opportunity';

export type UsageSectionInsightKey =
  | 'usage_funnel'
  | 'conversion_chain'
  | 'multi_banking_overlap'
  | 'dropoff_friction'
  | 'competitive_growth';

export const USAGE_METRIC_CONTENT: Record<UsageMetricKey, MetricInsightContent> = {
  ever_used: {
    title: 'Ever Used',
    definition: 'Share of aware respondents who have ever tried the brand.',
    formulaPlain: 'Ever Used Rate = Ever Used / Aware × 100',
  },
  current_usage: {
    title: 'Current Usage',
    definition: 'Share of aware respondents who are currently active users.',
    formulaPlain: 'Current Usage Rate = Currently Using / Aware × 100',
  },
  bumo: {
    title: 'Preferred Bank (BUMO)',
    definition: 'Share of aware respondents who identify this bank as their main day-to-day bank.',
    formulaPlain: 'BUMO Penetration = Preferred / Aware × 100',
  },
  trial_rate: {
    title: 'Trial Rate',
    definition: 'Conversion from awareness to first-time usage.',
    formulaPlain: 'Trial Rate = Ever Used / Aware × 100',
  },
  lapsed_usage: {
    title: 'Lapsed Usage',
    definition: 'Share of triers who no longer use the bank currently.',
    formulaPlain: 'Lapsed Usage = (Ever Used - Currently Using) / Ever Used × 100',
  },
  retention_rate: {
    title: 'Retention Rate',
    definition: 'Share of triers who remain active users.',
    formulaPlain: 'Retention Rate = Currently Using / Ever Used × 100',
  },
  churn_rate: {
    title: 'Churn Rate',
    definition: 'Share of triers who dropped from active usage.',
    formulaPlain: 'Churn Rate = 100 - Retention Rate',
  },
  preference_rate: {
    title: 'Preference Rate',
    definition: 'Ability to convert active users into primary-bank relationships.',
    formulaPlain: 'Preference Rate = Preferred / Currently Using × 100',
  },
  multi_banking_rate: {
    title: 'Multi-Banking Rate',
    definition: 'Share of your current users who also use at least one other bank.',
    formulaPlain: 'Multi-Banking % = Users with 2+ active banks / Your current users × 100',
  },
  avg_banks_per_user: {
    title: 'Average Banks per User',
    definition: 'Average number of active banks held by your current users.',
    formulaPlain: 'Avg Banks = Total active-bank selections / Your current users',
  },
  friction_score: {
    title: 'Friction Score',
    definition: 'Weighted drop-off indicator used to prioritize funnel bottlenecks.',
    formulaPlain: 'Friction Score = Drop-off % × Stage Weight',
  },
  position_matrix: {
    title: 'Position Matrix',
    definition: 'Competitive market position based on current usage and retention.',
    formulaPlain: 'Usage vs Retention compared to country median benchmarks',
  },
  growth_opportunity: {
    title: 'Growth Opportunity',
    definition: 'Addressable opportunity size in each funnel segment.',
    formulaPlain: 'Opportunity Size = Segment count eligible for conversion',
  },
};

export const USAGE_SECTION_INSIGHTS: Record<UsageSectionInsightKey, SectionInsightContent> = {
  usage_funnel: {
    title: 'Usage Funnel: How to Interpret',
    interpretationThresholds: [
      'Trial Rate: >50% excellent, 30-50% good, 20-30% average, <20% poor.',
      'Retention Rate: >80% excellent, 65-80% good, 50-65% average, <50% poor.',
      'Preference Rate: >50% excellent, 35-50% good, 25-35% average, <25% poor.',
    ],
    keyInsight: 'The strongest funnel combines healthy trial, strong retention, and rising primary-bank capture.',
  },
  conversion_chain: {
    title: 'Conversion Chain: How to Interpret',
    interpretationThresholds: [
      'High trial but low current usage indicates retention weakness.',
      'High current usage but low preference indicates secondary-bank syndrome.',
      'Low trial with high awareness indicates onboarding or relevance barriers.',
    ],
    keyInsight: 'Use the chain to decide whether to prioritize acquisition, retention, or primary conversion.',
  },
  multi_banking_overlap: {
    title: 'Multi-Banking & Overlap: How to Interpret',
    interpretationThresholds: [
      'Higher multi-banking suggests lower exclusivity and stronger wallet competition.',
      'Large overlap with a competitor indicates direct wallet-share battle.',
      'Primary share among multi-bankers below 40% suggests weak relationship depth.',
    ],
    keyInsight: 'Overlap patterns reveal your true competitive set for usage and wallet share.',
  },
  dropoff_friction: {
    title: 'Drop-off & Friction: How to Interpret',
    interpretationThresholds: [
      'Aware -> Ever Used drop-off above 60% indicates trial-conversion friction.',
      'Ever Used -> Current drop-off above 35% indicates retention/churn friction.',
      'Current -> Preferred drop-off above 70% indicates preference-capture friction.',
    ],
    keyInsight: 'Prioritize the stage with the highest weighted friction score.',
  },
  competitive_growth: {
    title: 'Competitive Position & Growth Opportunity',
    interpretationThresholds: [
      'High Usage + High Retention: Market Leader.',
      'High Usage + Low Retention: Vulnerable Leader.',
      'Low Usage + High Retention: Growing Challenger.',
      'Low Usage + Low Retention: Struggling Brand.',
    ],
    keyInsight: 'Opportunity sizing shows where incremental growth is most scalable with current demand.',
  },
};
