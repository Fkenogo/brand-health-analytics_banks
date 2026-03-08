import { MetricInsightContent, SectionInsightContent } from '@/config/awarenessInsights';

export type CompetitiveMetricKey =
  | 'market_share'
  | 'market_concentration'
  | 'sov_vs_market_share'
  | 'avg_banks_per_customer_ci'
  | 'multi_banking_rate_ci'
  | 'wallet_share_estimation'
  | 'win_rate_ci'
  | 'relative_strength_index'
  | 'threat_indicator';

export type CompetitiveSectionInsightKey =
  | 'market_structure_ci'
  | 'customer_behavior_ci'
  | 'competitive_analysis_ci'
  | 'share_wallet_ci'
  | 'win_loss_ci'
  | 'strengths_weaknesses_ci'
  | 'white_space_ci'
  | 'threat_assessment_ci';

export const COMPETITIVE_METRIC_CONTENT: Record<CompetitiveMetricKey, MetricInsightContent> = {
  market_share: {
    title: 'Market Share',
    definition: 'Your share of respondents who identify your bank as primary (preferred bank/BUMO).',
    formulaPlain: 'Market Share = Preferred bank count / Total sample × 100',
  },
  market_concentration: {
    title: 'Market Concentration (HHI)',
    definition: 'Concentration of the market based on squared market shares across competitors.',
    formulaPlain: 'HHI = Sum of each competitor market share squared',
  },
  sov_vs_market_share: {
    title: 'Share of Voice vs Market Share',
    definition: 'Comparison of your top-of-mind visibility versus actual primary-bank share.',
    formulaPlain: 'Gap = Share of Voice - Market Share',
  },
  avg_banks_per_customer_ci: {
    title: 'Average Banks per Customer',
    definition: 'Average number of currently used banks among active banking customers.',
    formulaPlain: 'Avg banks = Total currently-used bank selections / Active banking customers',
  },
  multi_banking_rate_ci: {
    title: 'Multi-Banking Rate',
    definition: 'Share of active banking customers who use two or more banks.',
    formulaPlain: 'Multi-banking rate = Customers with 2+ active banks / Active banking customers × 100',
  },
  wallet_share_estimation: {
    title: 'Wallet Share Estimation',
    definition: 'Estimated share of customer wallet captured by your brand among your active users.',
    formulaPlain: 'Estimated wallet share uses inverse bank count allocation (1 / number of active banks)',
  },
  win_rate_ci: {
    title: 'Win Rate',
    definition: 'Share of competitive customer battles won versus losses over the comparison period.',
    formulaPlain: 'Win rate = Gains / (Gains + Losses) × 100',
  },
  relative_strength_index: {
    title: 'Relative Strength Index',
    definition: 'Average relative performance versus market average across key competitive metrics.',
    formulaPlain: 'Relative strength = (Your value - Market average) / Market average × 100',
  },
  threat_indicator: {
    title: 'Threat Indicator',
    definition: 'Early warning score from competitor likelihood and impact signals.',
    formulaPlain: 'Threat level derives from overlap intensity, share growth, and visibility pressure',
  },
};

export const COMPETITIVE_SECTION_INSIGHTS: Record<CompetitiveSectionInsightKey, SectionInsightContent> = {
  market_structure_ci: {
    title: 'Market Structure Analysis',
    interpretationThresholds: [
      'HHI < 1,500: highly competitive.',
      'HHI 1,500-2,500: moderately concentrated.',
      'HHI > 2,500: highly concentrated.',
      'SOV > Market Share: potential future share gain if conversion improves.',
      'SOV < Market Share: likely share pressure unless salience improves.',
    ],
    keyInsight: 'Pair market-share trend with SOV gap to detect whether visibility is translating into share capture.',
  },
  customer_behavior_ci: {
    title: 'Customer Behaviour',
    interpretationThresholds: [
      'Higher average banks per customer implies broader wallet fragmentation.',
      'Multi-banking above 70% indicates high overlap and lower exclusivity.',
      'High overlap with one competitor marks your direct wallet-share battle.',
    ],
    keyInsight: 'Competitive pressure is strongest where your users share the most wallet with the same alternative bank.',
  },
  competitive_analysis_ci: {
    title: 'Competitive Analysis',
    interpretationThresholds: [
      'Overlap >40%: direct competitor.',
      'Overlap 20-40%: moderate competitor.',
      'Overlap <20%: indirect competitor.',
      'Leaders combine high share and stronger NPS.',
    ],
    keyInsight: 'Tiering and positioning map clarify who threatens share now versus who may disrupt next.',
  },
  share_wallet_ci: {
    title: 'Share of Wallet',
    interpretationThresholds: [
      'Higher estimated wallet share indicates deeper relationship capture.',
      'Large competitor wallet share among your users implies cross-sell leakage risk.',
    ],
    keyInsight: 'Wallet depth often improves faster through primary-bank conversion than through pure awareness growth.',
  },
  win_loss_ci: {
    title: 'Win/Loss Analysis',
    interpretationThresholds: [
      'Win rate >50%: winning competitive battles.',
      'Win rate 45-50%: balanced/unstable.',
      'Win rate <45%: losing competitive battles.',
    ],
    keyInsight: 'Track net gains by competitor to isolate where losses are concentrated.',
  },
  strengths_weaknesses_ci: {
    title: 'Competitive Strengths & Weaknesses',
    interpretationThresholds: [
      'Positive relative strength: above market average.',
      'Negative relative strength: below market average.',
      'Largest negative metrics should be prioritized for recovery.',
    ],
    keyInsight: 'Use relative strength profile to defend advantages and close the highest-impact performance gaps.',
  },
  white_space_ci: {
    title: 'White Space Opportunities',
    interpretationThresholds: [
      'Gap <= -6pp: high opportunity.',
      'Gap -5pp to -3pp: moderate opportunity.',
      'Gap > -3pp: lower immediate opportunity.',
    ],
    keyInsight: 'Demographic gaps indicate where targeted acquisition can produce faster share gains.',
  },
  threat_assessment_ci: {
    title: 'Threat Assessment',
    interpretationThresholds: [
      'Critical: high likelihood and high impact.',
      'Monitor: high likelihood, lower immediate impact.',
      'Emerging: lower likelihood, high potential impact.',
      'Low Priority: lower likelihood and impact.',
    ],
    keyInsight: 'Threat indicators provide early warning so response can begin before share decline becomes structural.',
  },
};
