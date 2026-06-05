import type { AwarenessInsightResult } from '@/utils/awarenessInsights';
import type {
  MomentumDiagnostics,
  MomentumContributionRow,
  MomentumSensitivityRow,
  MomentumPriorityRow,
  MomentumTrendPoint,
  MomentumForecastPoint,
  CompetitiveMomentumRow,
} from '@/utils/subscriberDashboard';

// ─── Local helpers ────────────────────────────────────────────────────────────

function s(...parts: string[]): string {
  return parts.filter((p) => p && p.length > 0).join('\n\n');
}

function fmt(v: number | null | undefined, decimals = 1, fallback = '--'): string {
  if (v == null || !isFinite(v)) return fallback;
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(decimals);
}

function fmtPct(v: number | null | undefined, fallback = '--'): string {
  if (v == null || !isFinite(v)) return fallback;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

// ─── 1. Module summary (banner) ───────────────────────────────────────────────

export function buildMomentumModuleSummary(
  diagnostics: MomentumDiagnostics,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(diagnostics.score) || (diagnostics.score === 0 && diagnostics.validTrendPeriods === 0 && diagnostics.contributions.length === 0)) return null;

  const { score, status, strategy, velocity, velocityLabel, priorities } = diagnostics;

  const velocityRead =
    velocity !== null && velocity > 3 ? 'momentum is accelerating'
    : velocity !== null && velocity < 0 ? 'momentum is declining'
    : 'momentum is holding steady';

  const primaryAction =
    strategy === 'Scale and defend' ? 'The priority is protecting the lead and extending reach.'
    : strategy === 'Optimize and grow' ? 'The priority is improving weak components to sustain growth.'
    : strategy === 'Fix and rebuild' ? 'The priority is reversing declines in the lowest-scoring components.'
    : strategy === 'Urgent intervention' ? 'Urgent action is needed to stop further deterioration.'
    : 'An emergency turnaround plan is required across all funnel stages.';

  const snapshot = `${bankName} has a momentum score of ${fmt(score)}/100 (${status}), ${velocityRead}. ${primaryAction}`;

  const topPriority = priorities[0];

  const momentumPositionSection = `MOMENTUM POSITION: A score of ${fmt(score)}/100 places ${bankName} in the ${status} tier. Excellent (80+) indicates strong funnel performance across awareness, consideration, conversion, retention, and adoption. Good (60–79) reflects solid performance with room to improve. Moderate (40–59) indicates mixed funnel health with clear gaps. Weak (20–39) signals significant funnel underperformance. Crisis (below 20) requires immediate corrective action across all stages.`;

  const trendDirectionSection = `TREND DIRECTION: ${
    velocity === null
    ? `Insufficient trend data is available to calculate velocity. The current score should be treated as a point-in-time reading until more periods are collected.`
    : velocity > 3
    ? `Momentum is accelerating at ${fmt(velocity)} points per month. The trajectory is positive and supports continued investment in the leading components.`
    : velocity >= 0
    ? `Momentum is growing steadily at ${fmt(velocity)} points per month. The trend is stable and manageable, though there is headroom to accelerate.`
    : `Momentum is declining at ${fmt(Math.abs(velocity))} points per month. Identifying the source of the decline and stabilizing the trend is the immediate priority.`
  }`;

  const primaryLeverSection = `PRIMARY LEVER: ${
    topPriority
    ? `Based on weight, current gap, and improvement potential, ${topPriority.label} is the highest-priority component to address. It carries ${fmt(topPriority.weightPct)}% of the total momentum score, and closing the gap to a higher performance level would have a measurable impact on the overall score.`
    : `The current diagnostics do not identify a single dominant improvement lever. Balanced improvement across components is indicated.`
  }`;

  const riskWatchSection = `RISK WATCH: ${
    status === 'Crisis Momentum' || status === 'Weak Momentum'
    ? `At this score level, ${bankName} is at risk of losing ground to competitors across multiple funnel stages simultaneously. Without corrective action on the weakest components, the score is likely to deteriorate further.`
    : diagnostics.velocityLabel === 'Decelerating'
    ? `The score is positive but the trend is decelerating. If the rate of decline in velocity continues, the current tier may not hold over the next two to three months.`
    : diagnostics.volatilityLabel === 'High volatility'
    ? `Score volatility is high, meaning individual period readings carry significant uncertainty. Sustained improvement requires stabilizing the underlying components before reading the trend as directional.`
    : `Current conditions do not flag an acute risk. Continued monitoring of component scores and velocity over the next two periods will confirm whether the trend is durable.`
  }`;

  return {
    snapshot,
    detail: s(momentumPositionSection, trendDirectionSection, primaryLeverSection, riskWatchSection),
  };
}

// ─── 2. Momentum Score KPI insight ───────────────────────────────────────────

export function buildMomentumScoreInsight(
  score: number,
  status: string,
  strategy: string,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(score)) return null;

  const tier =
    score >= 80 ? 'excellent'
    : score >= 60 ? 'good'
    : score >= 40 ? 'moderate'
    : score >= 20 ? 'weak'
    : 'crisis';

  const snapshot =
    tier === 'excellent' ? `${bankName}'s momentum score of ${fmt(score)}/100 reflects excellent funnel performance — the brand is converting awareness into loyalty at a high rate.`
    : tier === 'good' ? `${bankName}'s momentum score of ${fmt(score)}/100 reflects good funnel health, with most stages performing above average and clear room to strengthen specific components.`
    : tier === 'moderate' ? `${bankName}'s momentum score of ${fmt(score)}/100 indicates moderate funnel performance — some stages are working, but significant gaps are suppressing the overall score.`
    : tier === 'weak' ? `${bankName}'s momentum score of ${fmt(score)}/100 is weak, with multiple funnel stages underperforming and the bank losing ground to competitors.`
    : `${bankName}'s momentum score of ${fmt(score)}/100 is in the crisis range — every stage of the funnel needs immediate attention.`;

  const scorePositionSection = `SCORE POSITION: A score of ${fmt(score)}/100 places ${bankName} in the ${status} tier. The momentum score combines weighted performance across five funnel stages: awareness growth (15%), consideration (25%), conversion (25%), retention (20%), and adoption (15%). A higher score reflects stronger and more balanced performance across this funnel.`;

  const whatThisMeansSection = `COMMERCIAL IMPACT: ${
    tier === 'excellent' ? `Excellent momentum indicates that ${bankName} is growing awareness, converting prospects at high rates, retaining customers, and driving active product use. This level of performance is difficult to achieve and reflects coordinated strength across marketing, product, and service delivery.`
    : tier === 'good' ? `Good momentum indicates that most funnel stages are working effectively. Some components will be pulling the score below its potential ceiling — identifying and addressing those gaps is the clearest path to improvement.`
    : tier === 'moderate' ? `Moderate momentum reflects a mixed picture. Some funnel stages are performing adequately, but one or more components are materially below the level needed to drive strong overall performance. The overall score is being held back by these gaps.`
    : tier === 'weak' ? `Weak momentum reflects broad underperformance. Multiple funnel stages are below adequate levels, and the brand's ability to grow market position is constrained. Without targeted intervention, this trajectory is likely to worsen.`
    : `Crisis momentum reflects widespread funnel failure. The brand is not converting awareness into consideration, prospects into customers, or customers into active users at rates sufficient to maintain market position.`
  }`;

  const strategyFocusSection = `STRATEGY FOCUS: The recommended strategy at this score level is to ${strategy.toLowerCase()}. ${
    strategy === 'Scale and defend' ? `This means protecting the strongest-performing components from competitive erosion while expanding reach in the areas where performance is already high.`
    : strategy === 'Optimize and grow' ? `This means improving the specific components that are below their potential while sustaining the areas of existing strength.`
    : strategy === 'Fix and rebuild' ? `This means prioritizing recovery in the lowest-scoring components before attempting broader expansion. Fixing the weakest links has the greatest impact on the overall score.`
    : strategy === 'Urgent intervention' ? `This means making immediate, concentrated changes to the most critical failing funnel stages. Speed matters more than comprehensiveness at this level.`
    : `This means treating the entire funnel as broken and applying emergency-level resources across all stages. The goal is stabilization first, followed by systematic rebuilding.`
  }`;

  const nextStepSection = `NEXT STEP: ${
    tier === 'excellent' ? `Focus should be on maintaining current performance levels, protecting market share in the highest-weight components (consideration and conversion), and identifying any early warning signs of deceleration.`
    : tier === 'good' ? `Review the individual component scores to identify which one or two are below 60. Those components represent the most direct path to moving the overall score into the excellent tier.`
    : tier === 'moderate' ? `Identify the two lowest-scoring components and build an improvement plan for each. Component scores below 40 in high-weight categories (consideration, conversion, retention) have an outsized negative effect on the total score.`
    : tier === 'weak' ? `Prioritize the components with the highest weights first — consideration (25%) and conversion (25%). Even a moderate improvement in these two will move the overall score more than large gains in lower-weight components.`
    : `Conduct an immediate root-cause review of each component. The priority order should follow component weight: consideration first, then conversion, then retention, then adoption and awareness growth.`
  }`;

  return {
    snapshot,
    detail: s(scorePositionSection, whatThisMeansSection, strategyFocusSection, nextStepSection),
  };
}

// ─── 3. Velocity and Volatility insight ──────────────────────────────────────

export function buildVelocityInsight(
  velocity: number | null,
  velocityLabel: string,
  volatilityCv: number | null,
  volatilityLabel: string,
  bankName: string,
): AwarenessInsightResult | null {
  if (velocity === null && volatilityCv === null) return null;

  const velDir =
    velocity === null ? 'insufficient data to calculate a velocity reading'
    : velocity > 3 ? `accelerating at ${fmt(velocity)} points per month`
    : velocity >= 0 ? `growing steadily at ${fmt(velocity)} points per month`
    : `declining at ${fmt(Math.abs(velocity))} points per month`;

  const snapshot = `${bankName}'s momentum is ${velDir}. ${volatilityLabel} in score consistency reinforces this reading.`;

  const velocityReadSection = `VELOCITY READ: ${
    velocity === null
    ? `Velocity cannot be calculated with the available data. At least two valid monthly readings are required to measure directional change.`
    : velocity > 3
    ? `A velocity of +${fmt(velocity)} points per month is in the accelerating range. The trend is meaningfully positive and reflects improving funnel performance over recent periods.`
    : velocity >= 0
    ? `A velocity of +${fmt(velocity)} points per month indicates steady, stable growth. The trend is positive and consistent, though there is room to push the rate of improvement higher.`
    : `A velocity of ${fmt(velocity)} points per month means momentum is being lost. Each month that passes at this rate erodes the current score, and if sustained, will move the bank into a lower tier.`
  }`;

  const volatilityReadSection = `VOLATILITY READ: ${
    volatilityCv === null
    ? `Score volatility cannot be calculated — insufficient data periods are available.`
    : `${volatilityLabel} is indicated by a coefficient of variation of ${fmt(volatilityCv)}%. ${
        volatilityLabel === 'Low volatility'
        ? `Low volatility means the score is moving predictably and trend readings are reliable. A stable trend is easier to manage and forecast.`
        : volatilityLabel === 'Moderate volatility'
        ? `Moderate volatility indicates some inconsistency in underlying component performance. The trend direction is broadly reliable, but individual period readings should not be over-interpreted.`
        : `High volatility means the score is fluctuating significantly between periods, which reduces the reliability of trend readings. Focus on the three-period moving pattern rather than any single month.`
      }`
  }`;

  const combinedSignalSection = `COMBINED SIGNAL: ${
    velocity !== null && velocity > 3 && volatilityLabel === 'Low volatility'
    ? `Accelerating momentum with low volatility is the strongest possible signal — the trend is real, consistent, and pointing in the right direction. This combination supports confidence in continued improvement.`
    : velocity !== null && velocity > 3 && volatilityLabel === 'High volatility'
    ? `Accelerating average velocity is positive, but high volatility suggests the gains are uneven. Some periods are pulling the average up while others are pulling it down. Verify whether a single strong period is driving the velocity reading.`
    : velocity !== null && velocity < 0 && volatilityLabel === 'High volatility'
    ? `Declining momentum combined with high volatility is a concerning signal. The score is falling and the readings are unreliable, making it harder to identify what is driving the decline.`
    : velocity !== null && velocity < 0 && volatilityLabel === 'Low volatility'
    ? `Declining momentum with low volatility is a clear, consistent negative signal. The trend is real and sustained — not noise. Corrective action should be taken before the score drops further.`
    : `The velocity and volatility readings together provide a mixed or neutral picture. Monitor the next two periods before drawing strong conclusions about trend direction.`
  }`;

  const managementImplicationSection = `MANAGEMENT IMPLICATION: ${
    velocity === null
    ? `With limited data, management decisions should be based on the current score level and component analysis rather than trend direction. Build towards sufficient period coverage to enable trend-based management.`
    : velocity > 3
    ? `An accelerating trend supports continued investment in the current approach. The priority is ensuring that the leading components sustain their performance and that no single-period anomaly is inflating the velocity reading.`
    : velocity >= 0
    ? `Steady growth is positive but leaves room for acceleration. Identifying the highest-leverage component improvements would be the most effective way to increase velocity without disrupting what is already working.`
    : `Declining momentum requires an immediate component-level review. The goal is to identify which stage or stages are deteriorating and take targeted action before the trend compounds into a tier change.`
  }`;

  return {
    snapshot,
    detail: s(velocityReadSection, volatilityReadSection, combinedSignalSection, managementImplicationSection),
  };
}

// ─── 4. Individual component insight ─────────────────────────────────────────

export function buildComponentInsight(
  componentLabel: string,
  componentScore: number,
  weightPct: number,
  contribution: number,
  shareOfTotal: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(componentScore)) return null;

  const perfTier =
    componentScore >= 70 ? 'strong'
    : componentScore >= 50 ? 'adequate'
    : 'weak';

  const importanceRead =
    weightPct >= 22 ? 'a high-weight component'
    : weightPct >= 17 ? 'a significant component'
    : 'a supporting component';

  const snapshot = `${bankName}'s ${componentLabel} score of ${fmt(componentScore)}/100 is ${perfTier} and represents ${importanceRead} (${fmt(weightPct)}% of the total momentum score).`;

  const componentPerformanceSection = `COMPONENT PERFORMANCE: A ${componentLabel} score of ${fmt(componentScore)}/100 is in the ${perfTier} range. Strong (70+) means this stage of the funnel is working well and contributing positively to overall momentum. Adequate (50–69) means the stage is performing acceptably but has clear room for improvement. Weak (below 50) means this stage is underperforming and is likely a drag on the overall momentum score.`;

  const weightAndImpactSection = `WEIGHT AND IMPACT: ${componentLabel} carries ${fmt(weightPct)}% of the total momentum score. Its current contribution to the overall score is ${fmt(contribution, 1)} points, representing ${fmt(shareOfTotal)}% of the total score. ${
    weightPct >= 22
    ? `As a high-weight component, improvements here will have a disproportionately large effect on the overall momentum score. Conversely, declines in this component will pull the overall score down more than equivalent declines in lower-weight components.`
    : weightPct >= 17
    ? `As a significant component, this stage meaningfully shapes the total score. Targeted investment here produces a visible and commercially relevant improvement in momentum.`
    : `As a supporting component, this stage adds meaningful color to the momentum picture but a single-point change here has less total effect than an equivalent change in consideration or conversion.`
  }`;

  const whatThisMeansSection = `FUNNEL INTERPRETATION: ${
    perfTier === 'strong'
    ? `A strong score in ${componentLabel} means this part of the customer funnel is working effectively. ${bankName} is competitive at this stage and the component is actively supporting rather than constraining overall momentum.`
    : perfTier === 'adequate'
    ? `An adequate score in ${componentLabel} indicates that this stage is functional but not a source of competitive advantage. There is headroom to improve, and doing so would contribute directly to a higher overall momentum score.`
    : `A weak score in ${componentLabel} identifies this as a constraining stage in the funnel. Customers or prospects are being lost at this point, and the component is actively limiting overall momentum growth.`
  }`;

  const improvementLeverSection = `IMPROVEMENT LEVER: ${
    componentLabel === 'Consideration'
    ? `Consideration improves when brand salience increases among prospects actively evaluating banking options. Targeted media, relevant product messaging, and distribution channel presence are the primary drivers.`
    : componentLabel === 'Conversion'
    ? `Conversion improves through friction reduction in the onboarding journey, clarity of the value proposition at the point of decision, and competitive offer terms. Even small improvements in conversion efficiency compound into significant customer volume gains over time.`
    : componentLabel === 'Retention'
    ? `Retention improves through service quality, proactive relationship management, and early intervention when engagement signals decline. Reducing churn is typically more cost-effective than replacing lost customers through new acquisition.`
    : componentLabel === 'Adoption'
    ? `Adoption improves through targeted cross-sell, onboarding nudges toward second and third product use, and digital engagement that deepens the product relationship. Higher adoption directly reduces switching risk.`
    : `Awareness growth improves through sustained media investment, share of voice relative to competitors, and PR or social presence that keeps the brand visible in the consideration set. Without growing awareness, the top of the funnel narrows over time.`
  }`;

  return {
    snapshot,
    detail: s(componentPerformanceSection, weightAndImpactSection, whatThisMeansSection, improvementLeverSection),
  };
}

// ─── 5. Drivers insight ───────────────────────────────────────────────────────

export function buildDriversInsight(
  contributions: MomentumContributionRow[],
  priorities: MomentumPriorityRow[],
  bankName: string,
): AwarenessInsightResult | null {
  if (contributions.length === 0) return null;

  const sorted = [...contributions].sort((a, b) => b.contribution - a.contribution);
  const topDriver = sorted[0];
  const weakest = [...contributions].sort((a, b) => a.score - b.score)[0];

  const snapshot = `${bankName}'s strongest momentum contribution comes from ${topDriver.label} (${fmt(topDriver.contribution, 1)} pts). ${weakest.label} is the weakest component with a score of ${fmt(weakest.score)}/100 and requires the most attention.`;

  const topDriverSection = `TOP DRIVER: ${topDriver.label} contributes ${fmt(topDriver.contribution, 1)} points to the overall momentum score, representing ${fmt(topDriver.shareOfTotal)}% of the total. With a component score of ${fmt(topDriver.score)}/100 and a weight of ${fmt(topDriver.weightPct)}%, this is the strongest-performing element of the momentum calculation. Sustaining this performance is as important as improving weaker components — a decline here would meaningfully reduce the overall score.`;

  const weakestLinkSection = `WEAKEST LINK: ${weakest.label} has the lowest component score at ${fmt(weakest.score)}/100. It carries ${fmt(weakest.weightPct)}% of the total score and contributes ${fmt(weakest.contribution, 1)} points. ${
    weakest.weightPct >= 20
    ? `Given its high weight, this weakness has a material drag on overall momentum. Addressing it is a high-priority action.`
    : `While its weight is lower than the headline components, a weak score here still represents an underperforming stage of the customer funnel.`
  }`;

  const priorityOrderSection = `PRIORITY ORDER: ${
    priorities.length > 0
    ? `Based on weighted gap analysis, the recommended order for improvement focus is: ${priorities.slice(0, 3).map((p, i) => `${i + 1}. ${p.label} (priority score: ${fmt(p.priorityScore, 1)})`).join(', ')}. This ranking accounts for component weight, distance from excellence, and estimated difficulty of improvement.`
    : `A formal priority ranking is not available. Focus effort on the lowest-scoring high-weight components first.`
  }`;

  const actionFocusSection = `ACTION FOCUS: The highest-return action is typically to close the gap in the weakest high-weight component. Improving ${weakest.label} from its current level toward 60+ would produce a measurable improvement in overall momentum. Simultaneously, protecting the top driver — ${topDriver.label} — from regression is equally important to maintaining the current score floor.`;

  return {
    snapshot,
    detail: s(topDriverSection, weakestLinkSection, priorityOrderSection, actionFocusSection),
  };
}

// ─── 6. Scenario sensitivity insight ─────────────────────────────────────────

export function buildScenarioSensitivityInsight(
  sensitivity: MomentumSensitivityRow[],
  priorities: MomentumPriorityRow[],
  bankName: string,
): AwarenessInsightResult | null {
  if (sensitivity.length === 0) return null;

  const sorted = [...sensitivity].sort((a, b) => b.momentumGain - a.momentumGain);
  const topLever = sorted[0];
  const secondLever = sorted[1];

  const snapshot = `Improving ${topLever.label} would add the most to ${bankName}'s overall momentum score — a gain of ${fmt(topLever.momentumGain, 1)} points if this component reaches an improved level.`;

  const highestLeverageSection = `HIGHEST LEVERAGE: Of all the components modeled, improving ${topLever.label} from its current score of ${fmt(topLever.currentScore)}/100 to ${fmt(topLever.improvedScore)}/100 would produce a momentum gain of ${fmt(topLever.momentumGain, 1)} points. This is the single lever with the greatest impact on the overall score under a realistic improvement scenario.${secondLever ? ` The second-highest lever is ${secondLever.label}, which would contribute ${fmt(secondLever.momentumGain, 1)} additional points.` : ''}`;

  const priorityRankingSection = `PRIORITY RANKING: ${
    priorities.length > 0
    ? `The diagnostic priority ranking — which incorporates weight, gap size, and difficulty — identifies ${priorities[0]?.label ?? topLever.label} as the first priority. ${
        priorities[0]?.label !== topLever.label
        ? `Note that the highest-leverage scenario lever (${topLever.label}) and the highest diagnostic priority (${priorities[0].label}) differ. The priority ranking accounts for difficulty of improvement, which the leverage scenario does not.`
        : `This aligns with the leverage scenario finding, reinforcing ${topLever.label} as the most important component to address.`
      }`
    : `A formal priority ranking is not available to cross-reference. Use the leverage scenario as the primary guide for investment focus.`
  }`;

  const whyItMattersSection = `WHY IT MATTERS: Scenario sensitivity shows where improvement effort will move the overall momentum score the most. A high leverage reading means even a modest gain in that component produces a visible change in the total. A low leverage reading means large gains there would have limited total effect — either the weight is low or the score is already close to its ceiling.`;

  const recommendedActionSection = `RECOMMENDED ACTION: Prioritize ${topLever.label} as the primary improvement workstream. The current score of ${fmt(topLever.currentScore)}/100 represents a clear gap to a higher-performing level. Identify the specific operational or commercial drivers of this component's score and set a target improvement timeline. Reassess the sensitivity model after two periods to confirm whether the gap is closing as planned.`;

  return {
    snapshot,
    detail: s(highestLeverageSection, priorityRankingSection, whyItMattersSection, recommendedActionSection),
  };
}

// ─── 7. Trend insight ────────────────────────────────────────────────────────

export function buildTrendInsight(
  trends: MomentumTrendPoint[],
  velocity: number | null,
  velocityLabel: string,
  forecastEligible: boolean,
  validTrendPeriods: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (trends.length === 0) return null;

  const validPoints = trends.filter((t) => t.score !== null);
  const firstValid = validPoints[0];
  const lastValid = validPoints[validPoints.length - 1];
  const overallDirection =
    validPoints.length < 2 ? 'insufficient'
    : (lastValid.score ?? 0) > (firstValid.score ?? 0) + 2 ? 'improving'
    : (lastValid.score ?? 0) < (firstValid.score ?? 0) - 2 ? 'declining'
    : 'stable';

  const snapshot =
    validPoints.length < 2 ? `Only one valid data point is available for ${bankName} — trend direction cannot be determined yet.`
    : overallDirection === 'improving' ? `${bankName}'s momentum has been improving over the observed window, moving from ${fmt(firstValid.score ?? 0)} to ${fmt(lastValid.score ?? 0)}.`
    : overallDirection === 'declining' ? `${bankName}'s momentum has been declining over the observed window, falling from ${fmt(firstValid.score ?? 0)} to ${fmt(lastValid.score ?? 0)}.`
    : `${bankName}'s momentum has been broadly stable over the observed window, moving between ${fmt(firstValid.score ?? 0)} and ${fmt(lastValid.score ?? 0)}.`;

  const trendDirectionSection = `TREND DIRECTION: ${
    validPoints.length < 2
    ? `With only ${validPoints.length} valid period reading, it is not possible to assess trend direction. Continue data collection until at least two periods are available.`
    : overallDirection === 'improving'
    ? `The overall trend is positive. The score has moved from ${fmt(firstValid.score ?? 0)} to ${fmt(lastValid.score ?? 0)} over ${validTrendPeriods} valid periods. ${velocityLabel === 'Accelerating' ? 'The rate of improvement is accelerating, suggesting the positive trend is building.' : 'Growth is steady rather than accelerating.'}`
    : overallDirection === 'declining'
    ? `The overall trend is negative. The score has moved from ${fmt(firstValid.score ?? 0)} to ${fmt(lastValid.score ?? 0)} over ${validTrendPeriods} valid periods. ${velocity !== null && velocity < -3 ? 'The rate of decline is meaningful and should be treated as an urgent signal.' : 'The decline is gradual, but consistent declines compound into tier changes over time.'}`
    : `The score has been broadly stable over the observed window. This stability may reflect a performance plateau or a balance of improving and declining components that is netting to zero.`
  }`;

  const periodCoverageSection = `PERIOD COVERAGE: The trend analysis covers ${trends.length} periods in total, of which ${validTrendPeriods} have valid score readings. ${
    validTrendPeriods < 4
    ? `With fewer than four valid periods, the trend reading carries limited statistical weight. Directional conclusions should be treated as indicative rather than definitive.`
    : validTrendPeriods < 7
    ? `Four to six valid periods provide a reasonable basis for trend assessment, though the reading will strengthen further as additional periods are collected.`
    : `Seven or more valid periods provide a solid basis for trend analysis. The directional reading is reliable.`
  }`;

  const stabilitySignalSection = `STABILITY SIGNAL: ${
    velocity === null
    ? `Velocity cannot be calculated from the available data. The stability of the trend is unknown.`
    : velocityLabel === 'Accelerating'
    ? `The trend is accelerating — each recent period shows a larger improvement than the last. This is a positive stability signal and suggests the underlying drivers are strengthening.`
    : velocityLabel === 'Steady growth'
    ? `The trend is steady. The score is improving at a consistent rate without sharp acceleration or deceleration.`
    : `The trend is decelerating. Even if the score is still positive, the rate of improvement is slowing — which, if it continues, will result in stagnation or decline.`
  }`;

  const watchPointSection = `WATCH POINT: ${
    forecastEligible
    ? `With ${validTrendPeriods} valid periods, this data qualifies for forward projection. Check the trajectory section for the 3-month forecast. The most important thing to monitor is whether the current trend direction holds into the next period.`
    : `The data does not yet meet the four-period minimum required for reliable forward projection. Continue building the period history to unlock trend-based forecasting.`
  }`;

  return {
    snapshot,
    detail: s(trendDirectionSection, periodCoverageSection, stabilitySignalSection, watchPointSection),
  };
}

// ─── 8. Trajectory (forecast) insight ────────────────────────────────────────

export function buildTrajectoryInsight(
  forecast: MomentumForecastPoint[],
  forecastEligible: boolean,
  currentScore: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (forecast.length === 0) return null;

  const validForecast = forecast.filter((f) => f.projectedScore !== null);
  const endPoint = validForecast[validForecast.length - 1];
  const endScore = endPoint?.projectedScore ?? null;

  const direction =
    !forecastEligible ? 'not eligible'
    : endScore === null ? 'unknown'
    : endScore > currentScore + 2 ? 'improving'
    : endScore < currentScore - 2 ? 'declining'
    : 'flat';

  const snapshot =
    !forecastEligible ? `${bankName}'s momentum data does not yet meet the minimum requirement for forward projection — at least 4 valid periods are needed.`
    : direction === 'improving' ? `${bankName}'s momentum is projected to improve from ${fmt(currentScore)} to approximately ${fmt(endScore ?? 0)} over the next three months.`
    : direction === 'declining' ? `${bankName}'s momentum is projected to decline from ${fmt(currentScore)} to approximately ${fmt(endScore ?? 0)} over the next three months if current trends continue.`
    : `${bankName}'s momentum is projected to remain broadly flat over the next three months, near the current level of ${fmt(currentScore)}.`;

  const forecastOutlookSection = `FORECAST OUTLOOK: ${
    !forecastEligible
    ? `A forward projection is not available because the data does not meet the four-period minimum required for trend-based forecasting. The current score should be used as the reference point for planning purposes.`
    : direction === 'improving'
    ? `The three-month projection shows momentum improving from ${fmt(currentScore)} to approximately ${fmt(endScore ?? 0)}. If the current trajectory holds, ${bankName} is on course to post a higher score over the forecast window.`
    : direction === 'declining'
    ? `The three-month projection shows momentum declining from ${fmt(currentScore)} to approximately ${fmt(endScore ?? 0)}. Without intervention in the component drivers, the score is expected to fall further.`
    : `The three-month projection shows momentum holding broadly flat near ${fmt(currentScore)}. The current trajectory does not indicate a meaningful move in either direction over the near term.`
  }`;

  const basisForProjectionSection = `BASIS FOR PROJECTION: The forecast is built by extending the observed trend velocity forward across three monthly periods. It assumes that the rate of change seen in the historical window continues at a similar pace. Sudden changes in any of the five component scores — particularly in high-weight components like consideration or conversion — would move the actual outcome away from the projection.`;

  const whatToWatchSection = `WHAT TO WATCH: ${
    direction === 'improving'
    ? `The key risk to the positive forecast is deceleration — if the improvement rate slows, the actual end score will fall below the projection. Monitor velocity each period and confirm that the leading components are sustaining their gains.`
    : direction === 'declining'
    ? `The priority is to stabilize the declining components before the projected score drop materializes. The further the score falls into a lower tier, the harder and more expensive the recovery becomes. Act now rather than waiting for the next period.`
    : `A flat projection means neither improvement nor deterioration is expected. The opportunity is to introduce a deliberate component-level improvement plan that would push the trajectory into positive territory.`
  }`;

  const caveatSection = `CAVEAT: Trend-based projections carry inherent uncertainty. They are directional tools, not precise forecasts. The projection becomes less reliable further from the observation window, and it does not account for external events, competitor actions, or campaign-driven changes in brand performance. Use the forecast to set expectations and trigger review checkpoints, not as a definitive prediction.`;

  return {
    snapshot,
    detail: s(forecastOutlookSection, basisForProjectionSection, whatToWatchSection, caveatSection),
  };
}

// ─── 9. Competitive momentum insight ─────────────────────────────────────────

export function buildCompetitiveMomentumInsight(
  competitiveRows: CompetitiveMomentumRow[],
  selectedBankId: string,
  selectedRank: number,
  gapToLeader: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (competitiveRows.length === 0) return null;

  const selectedRow = competitiveRows.find((r) => r.bankId === selectedBankId);
  const sortedRows = [...competitiveRows].sort((a, b) => b.score - a.score);
  const leaderRow = sortedRows[0];

  const positionRead =
    selectedRank === 1 ? 'leads the competitive set'
    : selectedRank <= 3 && gapToLeader < 10 ? 'is a close challenger to the market leader'
    : gapToLeader < 10 ? 'is within range of the leader'
    : 'is trailing the market leader by a significant margin';

  const snapshot = `${bankName} ${positionRead} with a momentum score of ${fmt(selectedRow?.score ?? 0)}/100 — ranked ${selectedRank} of ${competitiveRows.length} and ${fmt(Math.abs(gapToLeader))} points ${gapToLeader <= 0 ? 'behind' : 'ahead of'} the leader.`;

  const marketPositionSection = `MARKET POSITION: ${bankName} ranks ${selectedRank} of ${competitiveRows.length} banks in the competitive set. ${
    selectedRank === 1
    ? `As the market leader on momentum, ${bankName} sets the pace for funnel performance across the category. The priority is protecting this position while identifying any signs of challenger pressure.`
    : gapToLeader < 5
    ? `The gap to the leader is narrow at ${fmt(Math.abs(gapToLeader))} points. ${bankName} is competitive and a focused improvement in one or two components could shift the ranking.`
    : gapToLeader < 15
    ? `The gap to the leader is moderate at ${fmt(Math.abs(gapToLeader))} points. Closing this gap is achievable over two to three periods if the highest-leverage components are improved.`
    : `The gap to the leader is substantial at ${fmt(Math.abs(gapToLeader))} points. Closing this gap will require sustained improvement across multiple components over several periods.`
  }`;

  const scoreComparisonSection = `SCORE COMPARISON: ${bankName}'s current momentum score of ${fmt(selectedRow?.score ?? 0)}/100 compares to the market leader's score of ${fmt(leaderRow.score)}/100. ${
    selectedRow && selectedRow.delta > 0
    ? `${bankName}'s score has improved by ${fmt(selectedRow.delta, 1)} points versus the prior period, indicating positive recent momentum.`
    : selectedRow && selectedRow.delta < 0
    ? `${bankName}'s score has declined by ${fmt(Math.abs(selectedRow.delta), 1)} points versus the prior period, while the competitive set continues to move.`
    : `${bankName}'s score is unchanged from the prior period.`
  }`;

  const componentGapsSection = `COMPONENT GAPS: ${
    selectedRow && leaderRow.bankId !== selectedRow.bankId
    ? `Comparing component scores to the market leader (${leaderRow.bankName}): Consideration ${fmt(selectedRow.components.consideration)} vs ${fmt(leaderRow.components.consideration)}, Conversion ${fmt(selectedRow.components.conversion)} vs ${fmt(leaderRow.components.conversion)}, Retention ${fmt(selectedRow.components.retention)} vs ${fmt(leaderRow.components.retention)}, Adoption ${fmt(selectedRow.components.adoption)} vs ${fmt(leaderRow.components.adoption)}, Awareness Growth ${fmt(selectedRow.components.awarenessGrowth)} vs ${fmt(leaderRow.components.awarenessGrowth)}. The largest component gaps represent the most direct path to closing the overall score difference.`
    : `${bankName} is the market leader. Component performance across the competitive set should be monitored to detect any challenger gaining ground in high-weight components.`
  }`;

  const strategicImplicationSection = `STRATEGIC IMPLICATION: ${
    selectedRank === 1
    ? `Leading market momentum is a commercial advantage — it reflects stronger funnel performance than competitors and reduces the risk of losing ground to challengers. The strategic priority is maintaining lead by monitoring competitor trajectories and defending performance in the highest-weight components.`
    : selectedRank <= 3 && gapToLeader < 10
    ? `${bankName} is in a strong challenger position. Closing a gap of ${fmt(Math.abs(gapToLeader))} points is realistic within a two-to-three period horizon if improvement focus is applied to the components where the gap to the leader is largest.`
    : `Closing a gap of ${fmt(Math.abs(gapToLeader))} points requires a sustained, multi-period effort. The most efficient path is to identify the one or two components where ${bankName} underperforms the leader most significantly and concentrate improvement resources there.`
  }`;

  return {
    snapshot,
    detail: s(marketPositionSection, scoreComparisonSection, componentGapsSection, strategicImplicationSection),
  };
}
