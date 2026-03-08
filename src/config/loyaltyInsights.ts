import { MetricInsightContent, SectionInsightContent } from '@/config/awarenessInsights';

export type LoyaltyMetricKey =
  | 'segment_committed'
  | 'segment_favors'
  | 'segment_potential'
  | 'segment_accessibles'
  | 'segment_rejectors'
  | 'loyalty_index'
  | 'nps_loyalty'
  | 'segment_movement'
  | 'segment_profile'
  | 'loyalty_conversion_funnel';

export type LoyaltySectionInsightKey =
  | 'loyalty_segmentation'
  | 'decision_tree'
  | 'movement_tracker'
  | 'segment_profiles'
  | 'loyalty_conversion';

export const LOYALTY_METRIC_CONTENT: Record<LoyaltyMetricKey, MetricInsightContent> = {
  segment_committed: {
    title: 'Committed',
    definition: 'Highest-loyalty customers who actively use, prefer, and advocate for the brand.',
    formulaPlain: 'Committed % = Committed respondents / Aware respondents × 100',
  },
  segment_favors: {
    title: 'Favors',
    definition: 'Current users with positive sentiment but not full commitment yet.',
    formulaPlain: 'Favors % = Favors respondents / Aware respondents × 100',
  },
  segment_potential: {
    title: 'Potential',
    definition: 'Aware non-users with strong future intent and relevance signals.',
    formulaPlain: 'Potential % = Potential respondents / Aware respondents × 100',
  },
  segment_accessibles: {
    title: 'Accessibles',
    definition: 'Aware non-users with neutral intent who are open but not strongly motivated yet.',
    formulaPlain: 'Accessibles % = Accessibles respondents / Aware respondents × 100',
  },
  segment_rejectors: {
    title: 'Rejectors',
    definition: 'Aware respondents with strong non-adoption signals or negative sentiment.',
    formulaPlain: 'Rejectors % = Rejectors respondents / Aware respondents × 100',
  },
  loyalty_index: {
    title: 'Loyalty Index',
    definition: 'Weighted loyalty score summarizing quality of the segment mix on a 0-100 scale.',
    formulaPlain: 'Index = (Committed×100 + Favors×70 + Potential×40 + Accessibles×20 + Rejectors×0) / Aware',
  },
  nps_loyalty: {
    title: 'Net Promoter Score (NPS)',
    definition: 'Loyalty advocacy measure from recommendation ratings.',
    formulaPlain: 'NPS = % Promoters (9-10) - % Detractors (0-6)',
  },
  segment_movement: {
    title: 'Segment Movement',
    definition: 'Change in segment share versus previous period.',
    formulaPlain: 'Movement = Current segment % - Previous segment %',
  },
  segment_profile: {
    title: 'Segment Profile',
    definition: 'Segment-level behavior and demographic summary to support action planning.',
    formulaPlain: 'Profile combines size, average NPS, intent, dominant age/gender, and multi-bank behavior',
  },
  loyalty_conversion_funnel: {
    title: 'Loyalty Conversion Funnel',
    definition: 'Stepwise progression from broad awareness to high-value committed customers.',
    formulaPlain: 'Aware -> Potential -> Favors -> Committed conversion rates',
  },
};

export const LOYALTY_SECTION_INSIGHTS: Record<LoyaltySectionInsightKey, SectionInsightContent> = {
  loyalty_segmentation: {
    title: 'Loyalty Segmentation: How to Interpret',
    interpretationThresholds: [
      'Committed: healthy target often 5-15% of aware base.',
      'Favors: healthy range often 10-25%.',
      'Potential: growth pipeline often 15-35%.',
      'Accessibles: broad neutral pool often 30-50%.',
      'Rejectors: aim to keep below 15-25%.',
    ],
    keyInsight: 'A healthy loyalty mix grows committed and favors while shrinking rejectors over time.',
  },
  decision_tree: {
    title: 'Segmentation Decision Tree',
    interpretationThresholds: [
      'Current users split into Committed or Favors based on commitment and advocacy quality.',
      'Non-current users split into Potential, Accessibles, or Rejectors by intent and sentiment.',
      'Segments should be mutually exclusive and sum to 100% of aware respondents.',
    ],
    keyInsight: 'Decision-tree discipline prevents defaulting most respondents into a single neutral segment.',
  },
  movement_tracker: {
    title: 'Segment Movement Tracker',
    interpretationThresholds: [
      'Committed/Favors rising is typically a positive loyalty signal.',
      'Potential rising can indicate future pipeline growth.',
      'Rejectors rising may indicate worsening experience or trust issues.',
    ],
    keyInsight: 'Direction matters as much as level; monitor segment momentum each period.',
  },
  segment_profiles: {
    title: 'Segment Profile Cards',
    interpretationThresholds: [
      'Higher segment NPS and intent indicate stronger immediate monetization potential.',
      'High multi-bank behavior indicates wallet-share competition risk.',
      'Demographic skews identify where messaging and offer strategy should be tailored.',
    ],
    keyInsight: 'Profiles translate segment size into targeted action plans.',
  },
  loyalty_conversion: {
    title: 'Loyalty Conversion Funnel',
    interpretationThresholds: [
      'Aware -> Potential reflects consideration creation.',
      'Potential -> Favors reflects trial/active conversion quality.',
      'Favors -> Committed reflects deep relationship capture.',
    ],
    keyInsight: 'The strongest long-term growth comes from improving later-stage conversion into Committed.',
  },
};
