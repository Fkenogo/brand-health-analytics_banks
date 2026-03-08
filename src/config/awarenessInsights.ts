export type AwarenessMetricKey =
  | 'top_of_mind'
  | 'spontaneous_recall'
  | 'total_awareness'
  | 'awareness_quality'
  | 'aided_awareness'
  | 'future_consideration_rate'
  | 'avg_intent'
  | 'high_intent_non_users'
  | 'at_risk_current_users'
  | 'share_of_voice'
  | 'mom_growth'
  | 'awareness_share_index'
  | 'awareness_depth_score';

export type AwarenessSectionInsightKey =
  | 'awareness_analysis'
  | 'brand_rankings'
  | 'future_intent_consideration';

export interface MetricInsightContent {
  title: string;
  definition: string;
  formulaPlain: string;
  interpretationThresholds?: string[];
  keyInsight?: string;
  strategicImplications?: string[];
}

export interface SectionInsightContent {
  title: string;
  interpretationThresholds: string[];
  keyInsight: string;
  strategicImplications?: string[];
}

export const AWARENESS_METRIC_CONTENT: Record<AwarenessMetricKey, MetricInsightContent> = {
  top_of_mind: {
    title: 'Top-of-Mind Awareness',
    definition: 'Percentage of people who mention your brand first when asked about banks.',
    formulaPlain: 'Top-of-Mind = First mentions / Total sample × 100',
  },
  spontaneous_recall: {
    title: 'Spontaneous Recall',
    definition: 'Percentage who mention your brand without prompting, counted uniquely.',
    formulaPlain: 'Spontaneous Recall = Unprompted mentions / Total sample × 100',
  },
  total_awareness: {
    title: 'Total Awareness',
    definition: 'Percentage who know the brand through unaided or aided awareness.',
    formulaPlain: 'Total Awareness = Aware respondents / Total sample × 100',
  },
  awareness_quality: {
    title: 'Awareness Quality',
    definition: 'Ratio of top-of-mind awareness to total awareness; measures salience depth.',
    formulaPlain: 'Awareness Quality = Top-of-Mind / Total Awareness × 100',
    interpretationThresholds: [
      '40%+: excellent quality (strong salience).',
      '25-39%: good quality (healthy mind-share).',
      '15-24%: moderate quality.',
      '10-14%: weak quality (passive awareness).',
      '<10%: poor quality (shallow awareness).',
    ],
    strategicImplications: [
      'High Awareness + High Quality (>30%): Top-of-Mind Leader; defend leadership.',
      'High Awareness + Low Quality (<20%): Recognized but Forgotten; improve distinctive salience.',
      'Low Awareness + High Quality (>30%): Hidden Gem; scale reach.',
      'Low Awareness + Low Quality (<20%): Struggle Brand; fundamental brand building required.',
    ],
  },
  aided_awareness: {
    title: 'Aided Awareness',
    definition: 'Percentage who recognize the brand when shown a list of banks.',
    formulaPlain: 'Aided Awareness = Selected in prompted list / Total sample × 100',
  },
  future_consideration_rate: {
    title: 'Future Consideration Rate',
    definition: 'Share of aware respondents with strong intent or relevance signals for future use.',
    formulaPlain: 'Future Consideration = Considerers among aware respondents / Aware respondents × 100',
  },
  avg_intent: {
    title: 'Average Intent Score',
    definition: 'Average future intent rating (0-10) among aware respondents for the selected bank.',
    formulaPlain: 'Average Intent = Sum of intent scores / Number of scored aware respondents',
  },
  high_intent_non_users: {
    title: 'High Intent Non-Users',
    definition: 'Share of non-users who still report high intent (7-10), indicating acquisition opportunity.',
    formulaPlain: 'High Intent Non-Users = Non-users with intent 7-10 / Total non-users × 100',
  },
  at_risk_current_users: {
    title: 'At-Risk Current Users',
    definition: 'Current users with low-to-medium intent scores (<=6), signaling possible churn risk.',
    formulaPlain: 'At-Risk Current Users = Current users with intent <=6',
  },
  share_of_voice: {
    title: 'Share of Voice (SOV)',
    definition: 'Your proportion of total top-of-mind mentions in the market.',
    formulaPlain: 'SOV = Your top-of-mind mentions / All top-of-mind mentions × 100',
  },
  mom_growth: {
    title: 'Month-over-Month Growth',
    definition: 'Relative awareness change from previous month to current month.',
    formulaPlain: 'MoM Growth % = (Current awareness - Previous awareness) / Previous awareness × 100',
  },
  awareness_share_index: {
    title: 'Awareness Share Index',
    definition: 'Your share of total awareness across all brands in the market.',
    formulaPlain: 'Awareness Share Index = Your awareness / Sum of all banks awareness × 100',
  },
  awareness_depth_score: {
    title: 'Awareness Depth Score',
    definition: 'Weighted awareness depth favoring top-of-mind and spontaneous awareness over aided-only.',
    formulaPlain: 'Depth Score = (Top-of-Mind×3 + Spontaneous×2 + Aided only×1) / 3',
    interpretationThresholds: [
      '60-100: excellent depth.',
      '40-59: good depth.',
      '20-39: moderate depth.',
      '0-19: weak depth.',
    ],
    keyInsight: 'Higher depth means awareness is active and choice-relevant, not only passive recognition.',
  },
};

export const AWARENESS_SECTION_INSIGHTS: Record<AwarenessSectionInsightKey, SectionInsightContent> = {
  awareness_analysis: {
    title: 'Awareness Analysis: How to Interpret',
    interpretationThresholds: [
      'Top-of-Mind: 30%+ leader, 20-29% strong salience, 10-19% moderate, 5-9% weak, <5% minimal.',
      'Total Awareness: 90-100% dominant, 70-89% strong, 50-69% moderate, 30-49% emerging, 0-29% weak.',
      'Spontaneous Recall: 60%+ excellent, 40-59% good, 20-39% moderate, 10-19% weak, <10% minimal.',
    ],
    keyInsight: 'Brands that come to mind first are 3-5x more likely to be chosen.',
  },
  brand_rankings: {
    title: 'Brand Rankings: How to Interpret',
    interpretationThresholds: [
      'SOV > Market Share: brand is typically gaining momentum.',
      'SOV = Market Share: brand is typically in steady state.',
      'SOV < Market Share: brand is typically losing momentum.',
      'Rank improving over time: campaigns and salience are strengthening.',
      'Rank declining over time: competitors are gaining ground.',
    ],
    keyInsight: 'Track rank movement and SOV together to detect early share shifts before usage changes.',
  },
  future_intent_consideration: {
    title: 'Future Intent & Consideration: How to Interpret',
    interpretationThresholds: [
      'Intent 9-10: very high intent (strong leads).',
      'Intent 7-8: high intent (warm prospects).',
      'Intent 5-6: medium intent (persuadable).',
      'Intent 3-4: low intent.',
      'Intent 0-2: very low intent (rejectors).',
    ],
    keyInsight: 'High-intent non-users are the acquisition pipeline; low-intent current users are churn risk.',
    strategicImplications: [
      'Awareness Quality 40%+: excellent salience.',
      'Awareness Quality 25-39%: good mind-share.',
      'Awareness Quality 15-24%: moderate.',
      'Awareness Quality 10-14%: weak (passive awareness).',
      'Awareness Quality <10%: poor (shallow awareness).',
      'Depth Score 60-100: excellent depth, 40-59: good, 20-39: moderate, 0-19: weak.',
      'High Awareness + Low Quality: recognized but forgotten; improve distinctive salience.',
      'Low Awareness + High Quality: hidden gem; scale reach.',
    ],
  },
};
