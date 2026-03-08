import { MetricInsightContent, SectionInsightContent } from '@/config/awarenessInsights';

export type DemographicsMetricKey =
  | 'demo_segment_size'
  | 'demo_awareness'
  | 'demo_current_usage'
  | 'demo_preferred'
  | 'demo_nps'
  | 'demo_avg_intent'
  | 'demo_multi_banking'
  | 'demo_gap_score';

export type DemographicsSectionInsightKey =
  | 'demographics_overview'
  | 'cohort_comparison'
  | 'demographic_opportunities';

export const DEMOGRAPHICS_METRIC_CONTENT: Record<DemographicsMetricKey, MetricInsightContent> = {
  demo_segment_size: {
    title: 'Segment Size',
    definition: 'Share of filtered respondents represented by a demographic cohort.',
    formulaPlain: 'Segment size % = Cohort respondents / Total filtered respondents × 100',
  },
  demo_awareness: {
    title: 'Awareness by Cohort',
    definition: 'Brand awareness within a demographic cohort.',
    formulaPlain: 'Awareness % = Aware in cohort / Cohort respondents × 100',
  },
  demo_current_usage: {
    title: 'Current Usage by Cohort',
    definition: 'Active usage penetration within a demographic cohort.',
    formulaPlain: 'Current usage % = Current users in cohort / Cohort respondents × 100',
  },
  demo_preferred: {
    title: 'Preferred (BUMO) by Cohort',
    definition: 'Primary-bank share within a demographic cohort.',
    formulaPlain: 'Preferred % = Preferred in cohort / Cohort respondents × 100',
  },
  demo_nps: {
    title: 'NPS by Cohort',
    definition: 'Recommendation loyalty score inside each cohort.',
    formulaPlain: 'NPS = % Promoters (9-10) - % Detractors (0-6)',
  },
  demo_avg_intent: {
    title: 'Average Intent by Cohort',
    definition: 'Average future-intent score (0-10) in each cohort.',
    formulaPlain: 'Average intent = Sum of intent scores / Number of scored respondents',
  },
  demo_multi_banking: {
    title: 'Multi-Banking by Cohort',
    definition: 'Share of current users in a cohort who use two or more banks.',
    formulaPlain: 'Multi-banking % = Cohort current users with 2+ banks / Cohort current users × 100',
  },
  demo_gap_score: {
    title: 'Usage Gap',
    definition: 'Distance between cohort usage and best-performing cohort usage in the same dimension.',
    formulaPlain: 'Gap (pp) = Cohort current usage - Best cohort current usage',
  },
};

export const DEMOGRAPHICS_SECTION_INSIGHTS: Record<DemographicsSectionInsightKey, SectionInsightContent> = {
  demographics_overview: {
    title: 'Demographics Overview',
    interpretationThresholds: [
      'Large cohorts with weak usage represent high-impact growth opportunities.',
      'Small cohorts with strong preferred share indicate niche strengths to protect.',
      'High NPS + high preferred suggests resilient value concentration.',
    ],
    keyInsight: 'Demographics should be interpreted as both market size and conversion quality, not size alone.',
  },
  cohort_comparison: {
    title: 'Cohort Comparison',
    interpretationThresholds: [
      'Awareness to usage drop highlights conversion friction by cohort.',
      'Usage to preferred drop highlights relationship-depth friction by cohort.',
      'High multi-banking with low preferred indicates wallet-share leakage risk.',
    ],
    keyInsight: 'Cross-cohort comparisons isolate where acquisition, retention, or primary conversion interventions are needed most.',
  },
  demographic_opportunities: {
    title: 'Demographic Opportunities',
    interpretationThresholds: [
      'Usage gap <= -10pp: high-priority opportunity.',
      'Usage gap -9pp to -5pp: medium-priority opportunity.',
      'Usage gap > -5pp: lower-priority opportunity.',
    ],
    keyInsight: 'Prioritize cohorts with large negative usage gaps and adequate sample size for the strongest growth return.',
  },
};
