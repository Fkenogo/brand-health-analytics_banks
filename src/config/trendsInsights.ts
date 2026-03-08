import { MetricInsightContent, SectionInsightContent } from '@/config/awarenessInsights';

export type TrendsMetricKey =
  | 'mom_change'
  | 'qoq_change'
  | 'yoy_change'
  | 'ytd_average'
  | 'cagr_trend'
  | 'volatility_cv'
  | 'stability_score'
  | 'forecast_regression'
  | 'forecast_confidence'
  | 'trend_signal';

export type TrendsSectionInsightKey =
  | 'trend_period_analysis'
  | 'volatility_patterns'
  | 'forecast_methods'
  | 'signal_noise';

export const TRENDS_METRIC_CONTENT: Record<TrendsMetricKey, MetricInsightContent> = {
  mom_change: {
    title: 'Month-over-Month (MoM) Change',
    definition: 'Change from the latest month to the immediately previous month.',
    formulaPlain: 'MoM (pp) = Current month - Previous month; MoM (%) = (Change / Previous month) × 100',
  },
  qoq_change: {
    title: 'Quarter-over-Quarter (QoQ) Change',
    definition: 'Change between the latest quarter average and prior quarter average.',
    formulaPlain: 'QoQ (pp) = Current quarter avg - Previous quarter avg',
  },
  yoy_change: {
    title: 'Year-over-Year (YoY) Change',
    definition: 'Change between the latest month and the same month last year.',
    formulaPlain: 'YoY (pp) = Current month - Same month last year',
  },
  ytd_average: {
    title: 'Year-to-Date (YTD) Average',
    definition: 'Average value from the start of the trend window through the latest month.',
    formulaPlain: 'YTD average = Sum of monthly values / Number of months',
  },
  cagr_trend: {
    title: 'Compound Annual Growth Rate (CAGR)',
    definition: 'Average annualized growth rate over a multi-period trend horizon.',
    formulaPlain: 'CAGR = ((Ending value / Beginning value)^(1/years) - 1) × 100',
  },
  volatility_cv: {
    title: 'Volatility (CV)',
    definition: 'Relative volatility of the trend based on standard deviation as a percentage of mean.',
    formulaPlain: 'CV = (Standard deviation / Mean) × 100',
  },
  stability_score: {
    title: 'Trend Stability Score',
    definition: 'Composite stability metric combining volatility and directional reversals.',
    formulaPlain: 'Stability = 100 - (CV + Directional change rate)',
  },
  forecast_regression: {
    title: 'Regression Forecast',
    definition: 'Next-period estimate from a fitted linear trend line.',
    formulaPlain: 'Forecast = slope × (next period index) + intercept',
  },
  forecast_confidence: {
    title: 'Forecast Confidence Band',
    definition: 'Estimated 95% confidence interval around baseline forecast.',
    formulaPlain: 'Confidence interval = Forecast ± (1.96 × residual standard error)',
  },
  trend_signal: {
    title: 'Signal vs Noise',
    definition: 'Assessment of whether recent changes exceed expected normal variation.',
    formulaPlain: 'Signal if recent change magnitude > 2 × historical standard deviation',
  },
};

export const TRENDS_SECTION_INSIGHTS: Record<TrendsSectionInsightKey, SectionInsightContent> = {
  trend_period_analysis: {
    title: 'Time Period Trend Analysis',
    interpretationThresholds: [
      'MoM is useful for early warning but can be noisy.',
      'QoQ smooths short-term volatility and is stronger for planning.',
      'YoY is best when seasonality may distort monthly interpretation.',
    ],
    keyInsight: 'Read MoM, QoQ, and YoY together to separate short-term movement from structural change.',
  },
  volatility_patterns: {
    title: 'Volatility & Stability',
    interpretationThresholds: [
      'CV < 10%: low volatility.',
      'CV 10-20%: moderate volatility.',
      'CV > 20%: high volatility.',
      'Stability score >= 80: very stable.',
      'Stability score 60-79: moderately stable.',
      'Stability score < 60: unstable.',
    ],
    keyInsight: 'Stable trends support confident planning; unstable trends require cautious scenario-based decisions.',
  },
  forecast_methods: {
    title: 'Forecast Methods & Use Cases',
    interpretationThresholds: [
      'Simple moving average suits short, stable horizons.',
      'Weighted moving average responds faster to recent shifts.',
      'Regression forecast is stronger when fit quality is high (R² > 0.7).',
      'Seasonal adjustment is preferred when monthly pattern differences are material.',
    ],
    keyInsight: 'Use multiple methods together and anchor decisions on the confidence interval, not one point estimate.',
  },
  signal_noise: {
    title: 'Signal vs Noise Diagnostics',
    interpretationThresholds: [
      'Significant signal when movement exceeds typical fluctuation range.',
      'High volatility lowers confidence in single-period spikes.',
      'Persistent 3+ period directional movement indicates stronger trend validity.',
    ],
    keyInsight: 'Treat isolated spikes as noise until supported by repeat periods or stronger significance evidence.',
  },
};
