import type { AwarenessInsightResult } from '@/utils/awarenessInsights';
import type { LoyaltyBucket, LoyaltyDiagnostics, LoyaltyMovementRow } from '@/utils/subscriberDashboard';

// ─── Local helpers ────────────────────────────────────────────────────────────

const LOW_SAMPLE = 30;

function s(...parts: string[]): string {
  return parts.filter((p) => p && p.length > 0).join('\n\n');
}

function smplSection(sampleSize: number | undefined): string {
  if (sampleSize === undefined || sampleSize >= LOW_SAMPLE) return '';
  return `\n\nSAMPLE CAUTION: With ${sampleSize} respondents in this slice, percentages carry wide confidence intervals. Use these figures as directional guidance, not precise targets, until sample reaches 30+.`;
}

function fmtPct(v: number | null | undefined, fallback = '--'): string {
  if (v == null || !isFinite(v)) return fallback;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

function fmt(v: number | null | undefined, d = 0, fallback = '--'): string {
  if (v == null || !isFinite(v)) return fallback;
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(d);
}

// Loyalty Index tier classification
function loyaltyIndexTier(index: number): 'strong' | 'solid' | 'developing' | 'weak' {
  if (index >= 75) return 'strong';
  if (index >= 60) return 'solid';
  if (index >= 40) return 'developing';
  return 'weak';
}

// ─── 1. Module summary (banner) ───────────────────────────────────────────────

export function buildLoyaltyModuleSummary(
  diagnostics: LoyaltyDiagnostics,
  bankName: string,
): AwarenessInsightResult | null {
  if (diagnostics.awareCount === 0) return null;

  const { loyaltyIndex, nps, segmentPcts } = diagnostics;
  const tier = loyaltyIndexTier(loyaltyIndex);
  const committedPct = segmentPcts.Committed;
  const rejectorsPct = segmentPcts.Rejectors;

  const indexRead =
    tier === 'strong' ? 'a strong loyalty position'
    : tier === 'solid' ? 'a solid loyalty position'
    : tier === 'developing' ? 'a developing loyalty position'
    : 'a weak loyalty position';

  const npsRead =
    nps > 40 ? 'strong advocacy'
    : nps > 20 ? 'moderate advocacy'
    : nps >= 0 ? 'marginal advocacy'
    : 'a negative advocacy position';

  const forwardNote =
    committedPct < 10
    ? `Growing the committed base is the primary commercial lever.`
    : rejectorsPct > 25
    ? `Reducing rejector share is the immediate management priority.`
    : tier === 'weak' || tier === 'developing'
    ? `Moving customers from accessible and potential segments into active commitment represents the clearest growth opportunity.`
    : `Deepening relationships within the existing committed and favoring base supports further loyalty improvement.`;

  const snapshot = `${bankName} holds ${indexRead} (index ${fmt(loyaltyIndex)}/100) with ${npsRead} (NPS ${nps > 0 ? '+' : ''}${fmt(nps)}). ${forwardNote}`;

  const loyaltyPositionSection = `LOYALTY POSITION: The Loyalty Index of ${fmt(loyaltyIndex)}/100 places ${bankName} in the ${tier} tier (strong: 75+, solid: 60–74, developing: 40–59, weak: below 40). ${
    tier === 'strong' ? `A strong index reflects a customer base with deep commitment and genuine brand preference, supporting durable revenue and low churn risk.`
    : tier === 'solid' ? `A solid index reflects a meaningful base of committed and favoring customers, with clear room to deepen relationships further.`
    : tier === 'developing' ? `A developing index indicates a customer base that is largely accessible or potential, with limited committed depth. The commercial opportunity is to convert this broad base into deeper loyalty.`
    : `A weak index signals limited customer commitment across the base. The majority of aware customers have either rejected the brand or hold only superficial interest.`
  }`;

  const segmentMixSection = `CUSTOMER MIX: Committed customers represent ${fmtPct(committedPct)} of the aware base, with Favors at ${fmtPct(segmentPcts.Favors)}, Potential at ${fmtPct(segmentPcts.Potential)}, Accessibles at ${fmtPct(segmentPcts.Accessibles)}, and Rejectors at ${fmtPct(rejectorsPct)}. ${
    committedPct >= 20
    ? `The committed core is well-developed and provides a stable revenue base.`
    : committedPct >= 10
    ? `The committed core is modest, representing a concentration of high-value customers that requires active retention focus.`
    : `The committed core is thin, and a significant share of the aware base has yet to be converted into active brand commitment.`
  }`;

  const npsReadSection = `NPS READING: An NPS of ${nps > 0 ? '+' : ''}${fmt(nps)} reflects ${npsRead}. ${
    nps > 40 ? `Strong advocacy indicates that a significant portion of the customer base is actively recommending the bank, supporting organic growth and reducing acquisition costs.`
    : nps > 20 ? `Moderate advocacy provides a useful referral base, though there is material headroom to convert more passives into active promoters.`
    : nps >= 0 ? `Marginal advocacy means the bank has roughly as many detractors offsetting promoters, limiting organic word-of-mouth benefit.`
    : `A negative NPS indicates that detractors are outweighing promoters, creating a word-of-mouth drag that can impede growth and damage reputation.`
  }`;

  const priorityActionSection = `MANAGEMENT PRIORITY: ${
    rejectorsPct > 25
    ? `Rejector share at ${fmtPct(rejectorsPct)} is elevated and should be addressed first. High rejector levels reflect competitive displacement and active dissatisfaction, both of which erode the Loyalty Index regardless of other segment improvements.`
    : committedPct < 10
    ? `Committed share at ${fmtPct(committedPct)} is thin. The highest-value near-term action is converting favoring and potential customers into full commitment through relationship-deepening programs, salary account migration, and product cross-sell.`
    : tier === 'developing' || tier === 'weak'
    ? `Improving funnel conversion from potential and accessible segments into favoring customers is the primary lever. This requires active trial incentives, onboarding improvement, and stronger preference capture.`
    : `Sustaining and deepening the committed base is the primary priority. Protecting this segment from competitive erosion and building NPS through service quality are the most durable commercial investments available.`
  }`;

  return {
    snapshot,
    detail: s(loyaltyPositionSection, segmentMixSection, npsReadSection, priorityActionSection),
  };
}

// ─── 2. Loyalty Index KPI insight ────────────────────────────────────────────

export function buildLoyaltyIndexInsight(
  loyaltyIndex: number,
  segmentPcts: Record<LoyaltyBucket, number>,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(loyaltyIndex)) return null;

  const tier = loyaltyIndexTier(loyaltyIndex);

  const topContributors: { segment: LoyaltyBucket; weight: number; pct: number }[] = [
    { segment: 'Committed', weight: 100, pct: segmentPcts.Committed },
    { segment: 'Favors', weight: 70, pct: segmentPcts.Favors },
    { segment: 'Potential', weight: 40, pct: segmentPcts.Potential },
    { segment: 'Accessibles', weight: 20, pct: segmentPcts.Accessibles },
    { segment: 'Rejectors', weight: 0, pct: segmentPcts.Rejectors },
  ].sort((a, b) => b.weight * b.pct - a.weight * a.pct);

  const topDriver = topContributors[0];
  const secondDriver = topContributors[1];
  const drag = segmentPcts.Rejectors > 15 ? `Rejector share at ${fmtPct(segmentPcts.Rejectors)} contributes zero weight to the index and represents a floor constraint on further improvement.` : '';

  const snapshot =
    tier === 'strong' ? `${bankName}'s Loyalty Index of ${fmt(loyaltyIndex)} reflects a strong, committed customer base with durable revenue characteristics.`
    : tier === 'solid' ? `${bankName}'s Loyalty Index of ${fmt(loyaltyIndex)} reflects a solid customer base with clear opportunity to deepen commitment further.`
    : tier === 'developing' ? `${bankName}'s Loyalty Index of ${fmt(loyaltyIndex)} sits in the developing range — broad awareness has not yet converted into committed customer depth.`
    : `${bankName}'s Loyalty Index of ${fmt(loyaltyIndex)} is weak, indicating limited customer commitment and significant commercial exposure to churn and competitive displacement.`;

  const currentPositionSection = `CURRENT POSITION: A score of ${fmt(loyaltyIndex)}/100 places ${bankName} in the ${tier} tier. Strong (75+) reflects a deep, committed customer base. Solid (60–74) reflects healthy loyalty with headroom. Developing (40–59) indicates a broad but shallow base. Weak (below 40) signals limited commitment across the customer base. ${
    tier === 'strong' ? `At this level, the bank's customer relationships are durable and commercially resilient.`
    : tier === 'solid' ? `This level supports stable revenue but offers clear room to improve committed depth.`
    : tier === 'developing' ? `The commercial risk is moderate — a large proportion of aware customers are not yet committed, leaving them susceptible to competitor offers.`
    : `The commercial risk is material — most aware customers hold no strong positive relationship with the bank.`
  }`;

  const customerMixSection = `CUSTOMER MIX: The index is primarily driven by ${topDriver.segment} (${fmtPct(topDriver.pct)}) and ${secondDriver.segment} (${fmtPct(secondDriver.pct)}). ${drag ? drag : `Rejector share at ${fmtPct(segmentPcts.Rejectors)} is currently manageable.`} The weighted mix reflects the depth of customer relationships across the aware base.`;

  const businessImpactSection = `BUSINESS IMPACT: ${
    tier === 'strong' ? `A strong Loyalty Index supports sustained revenue concentration in the committed segment, lower churn costs, and organic growth through advocacy. The financial durability of this customer base reduces dependence on continuous acquisition spend.`
    : tier === 'solid' ? `A solid index supports reliable revenue from the committed and favoring segments, but significant revenue uplift is available if additional customers can be moved into committed status. The gap between current and full-commitment relationships represents a quantifiable share-of-wallet opportunity.`
    : tier === 'developing' ? `A developing index means that a large portion of the aware base is not generating full commercial value. Customers in accessible and potential segments contribute lower balances, fewer products, and reduced transaction activity compared to committed customers.`
    : `A weak index signals that most customers are not deeply engaged: low balances, limited product use, and high switching intent. Without improvement, the bank is exposed to ongoing churn and share-of-wallet loss to competitors.`
  }`;

  const managementPrioritySection = `MANAGEMENT PRIORITY: ${
    segmentPcts.Rejectors > 20
    ? `Reducing rejector share is the single highest-leverage action. Each percentage point reduction in rejectors directly improves the index and reduces competitive displacement. Targeted reactivation or win-back analysis should determine which rejectors are recoverable.`
    : segmentPcts.Committed < 10
    ? `Growing the committed base is the primary commercial lever. Converting favoring customers into fully committed ones — through salary migration, primary account status, and relationship deepening — produces the largest index improvement per customer.`
    : tier === 'developing' || tier === 'weak'
    ? `Accelerating the conversion of potential and accessible customers into favoring status is the near-term priority. This requires improving the product and service experience that drives customers from awareness to active preference.`
    : `Defending the committed base from competitive pressure is the priority. Monitoring committed segment movement month-on-month provides the earliest signal of relationship erosion.`
  }`;

  return {
    snapshot,
    detail: s(currentPositionSection, customerMixSection, businessImpactSection, managementPrioritySection),
  };
}

// ─── 3. NPS KPI insight ───────────────────────────────────────────────────────

export function buildNpsInsight(
  nps: number,
  promoterPct: number,
  passivePct: number,
  detractorPct: number,
  everCount: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(nps) || everCount === 0) return null;

  const hasBreakdown = isFinite(promoterPct) && isFinite(detractorPct) && isFinite(passivePct);

  const npsPosition =
    nps > 40 ? 'strong'
    : nps >= 20 ? 'adequate'
    : nps >= 0 ? 'marginal'
    : 'negative';

  const snapshot = hasBreakdown
    ? `${bankName} holds an NPS of ${nps > 0 ? '+' : ''}${fmt(nps)} among its customer base (N=${everCount}), with promoters at ${fmtPct(promoterPct)} and detractors at ${fmtPct(detractorPct)} — ${
        npsPosition === 'strong' ? 'a strong advocacy surplus.'
        : npsPosition === 'adequate' ? 'a moderate advocacy position with room to strengthen.'
        : npsPosition === 'marginal' ? 'a marginal position where detractor volume is limiting net advocacy.'
        : 'a negative advocacy position where detractors outnumber promoters.'
      }`
    : `${bankName}'s NPS of ${nps > 0 ? '+' : ''}${fmt(nps)} (N=${everCount}) reflects ${
        npsPosition === 'strong' ? 'strong customer advocacy.'
        : npsPosition === 'adequate' ? 'adequate advocacy with clear improvement headroom.'
        : npsPosition === 'marginal' ? 'marginal net advocacy.'
        : 'a negative advocacy position requiring immediate management attention.'
      }`;

  const npsPositionSection = `NPS POSITION: A score of ${nps > 0 ? '+' : ''}${fmt(nps)} among ${everCount} ever-used and current customers is ${npsPosition}. Strong (above +40) reflects a customer base that actively recommends the bank. Adequate (+20 to +40) is a positive but not dominant advocacy position. Marginal (0 to +20) means detractor volume is holding the score down. Negative (below 0) means detractors outnumber promoters, so the bank generates more negative word-of-mouth than positive. ${
    npsPosition === 'strong' ? `At this level, the bank benefits from meaningful organic referral activity that reduces acquisition costs and reinforces brand trust.`
    : npsPosition === 'adequate' ? `The advocacy position is positive but not yet strong enough to generate significant organic acquisition. The opportunity to grow promoters is real and commercially valuable.`
    : npsPosition === 'marginal' ? `The bank is close to a neutral advocacy position, meaning positive and negative word-of-mouth are roughly balanced. Small improvements in detractor reduction or promoter conversion produce disproportionate NPS gains at this level.`
    : `A negative NPS creates active reputational drag. Detractors are warning others away at higher volume than promoters are recommending the bank, which directly limits organic growth and elevates brand recovery costs.`
  }`;

  const promoterBaseSection = hasBreakdown
    ? `PROMOTER BASE: Promoters represent ${fmtPct(promoterPct)} of the NPS base (${everCount} respondents). ${
        promoterPct >= 40
        ? `A promoter share above 40% generates meaningful organic referral volume and supports word-of-mouth acquisition across the customer network.`
        : promoterPct >= 25
        ? `A promoter share in this range provides a useful referral base, though growing it further — particularly by converting passives — would materially strengthen the bank's organic acquisition position.`
        : `A promoter share below 25% is modest. The recommendation volume is limited, and the bank relies more on direct acquisition channels than organic referral. Growing the promoter base is a near-term commercial priority.`
      }${passivePct !== undefined && isFinite(passivePct) ? ` Passives represent ${fmtPct(passivePct)} of the base — satisfied but not actively advocating, and convertible to promoters with targeted experience investment.` : ''}`
    : `PROMOTER BASE: Breakdown data is unavailable for this period. The overall NPS reflects the net balance of promoter and detractor activity among ${everCount} customers.`;

  const detractorProfileSection = hasBreakdown
    ? `DETRACTOR PROFILE: Detractors represent ${fmtPct(detractorPct)} of the NPS base. ${
        detractorPct > 30
        ? `A detractor share above 30% is high. These customers are actively warning others, and advertising alone cannot offset negative word-of-mouth at that scale. Reducing detractor volume is the most urgent NPS action.`
        : detractorPct > 20
        ? `Detractors at this level create a meaningful drag on the net score. Targeted service recovery and experience improvement in the segments generating detractors would produce a faster NPS improvement than promoter growth alone.`
        : detractorPct > 10
        ? `Detractors are present but manageable. The NPS position could be materially improved by converting even a portion of this cohort to passives, which would directly raise the net score without requiring growth in promoters.`
        : `Detractor volume is low, and the primary NPS lever is growing the promoter share rather than defending against detractor growth.`
      }`
    : `DETRACTOR PROFILE: Detailed breakdown data is unavailable. Monitor promoter and detractor split in subsequent periods to assess the structural composition of the NPS score.`;

  const priorityActionSection = `MANAGEMENT PRIORITY: ${
    !hasBreakdown || detractorPct > promoterPct
    ? `Reducing detractor volume is the primary lever. NPS improvement through detractor reduction produces faster score movement than promoter growth, as each converted detractor has a double effect — removing a negative score and releasing the passive or promoter upside. Investigate the dominant reasons for detractor sentiment and address them through service quality and complaint resolution.`
    : detractorPct > 20
    ? `While promoters are ahead of detractors, the detractor level remains high enough to limit net advocacy. Prioritise service recovery for the detractor cohort to stabilise the score, then invest in promoter conversion through loyalty recognition and service excellence.`
    : `With detractors at a manageable level, the primary lever is growing the promoter base. Converting passives (${hasBreakdown ? fmtPct(passivePct) : 'a significant share'} of respondents) into promoters is the most efficient path — they are already satisfied and require a smaller investment to activate as advocates than converting neutral or new customers.`
  }`;

  return {
    snapshot,
    detail: s(npsPositionSection, promoterBaseSection, detractorProfileSection, priorityActionSection),
  };
}

// ─── 4. Committed KPI insight ─────────────────────────────────────────────────

export function buildCommittedInsight(
  committedPct: number,
  committedCount: number,
  awareCount: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(committedPct) || awareCount === 0) return null;

  const tier =
    committedPct >= 20 ? 'strong'
    : committedPct >= 12 ? 'moderate'
    : committedPct >= 6 ? 'thin'
    : 'very thin';

  const snapshot =
    tier === 'strong'
    ? `${bankName}'s committed base of ${fmtPct(committedPct)} (${committedCount} respondents) represents a well-developed core of primary-bank customers.`
    : tier === 'moderate'
    ? `${bankName}'s committed base of ${fmtPct(committedPct)} (${committedCount} respondents) is a meaningful customer core, though with clear room to deepen.`
    : tier === 'thin'
    ? `${bankName}'s committed base of ${fmtPct(committedPct)} (${committedCount} respondents) is thin relative to its aware base — most active customers have not yet reached full commitment.`
    : `${bankName}'s committed base of ${fmtPct(committedPct)} (${committedCount} respondents) is very thin, indicating limited depth of primary-bank relationship within the aware population.`;

  const committedBaseSizeSection = `COMMITTED BASE SIZE: ${committedCount} respondents (${fmtPct(committedPct)} of ${awareCount} aware customers) are classified as committed — current primary customers who name this bank as preferred and rate NPS 9–10. ${
    tier === 'strong'
    ? `A committed base above 20% is well-developed by category standards. These customers generate the strongest revenue per head — higher deposit balances, broader product use, and much lower churn than any other segment.`
    : tier === 'moderate'
    ? `A committed base in the 12–20% range is meaningful and commercially productive, but the majority of aware customers are at lower loyalty tiers. Moving additional Favors customers into committed status is the clearest near-term growth lever.`
    : tier === 'thin'
    ? `A committed base below 12% means the bank's highest-value customer relationship type is limited in scale. The wide gap between the aware base and committed base indicates that conversion from awareness to deep commitment is incomplete.`
    : `A very thin committed base means the bank has very few fully committed primary-bank customers relative to its awareness footprint. This limits revenue concentration and creates broad exposure to competitive switching.`
  }`;

  const stabilityOutlookSection = `BUSINESS IMPACT: Committed customers are the bank's most commercially valuable segment — they generate higher revenue per customer, refer at higher rates, and resist competitive switching. ${
    tier === 'strong' || tier === 'moderate'
    ? `Protecting this base from competitive attrition is the first priority. The key retention risks are competitor product offers, service quality deterioration, and pricing changes. Committed customers who leave are difficult and expensive to recapture once their primary account has moved.`
    : `Building this base is the primary commercial objective for long-term revenue growth. Each customer converted from Favors to Committed represents a substantial uplift in lifetime value, product depth, and referral activity.`
  }`;

  const businessImplicationsSection = `COMPETITIVE POSITION: ${
    tier === 'strong'
    ? `A committed base of ${fmtPct(committedPct)} is a genuine competitive strength — it reflects that a meaningful share of aware customers has chosen this bank as their primary banking relationship. This concentration supports pricing stability, lower churn costs, and stronger word-of-mouth positioning.`
    : tier === 'moderate'
    ? `The current committed base provides a stable revenue foundation, but the gap between aware customers and committed customers represents a substantial revenue opportunity. Competitor banks with higher committed shares are capturing a disproportionate share of primary relationship value within the shared aware base.`
    : `The low committed share means that competitors are holding primary-bank relationships with a significant portion of this bank's aware customers. These are customers who know and may use the bank but have not made it their primary home.`
  }`;

  const priorityActionSection = `MANAGEMENT PRIORITY: ${
    tier === 'strong'
    ? `Defend the committed base through continued investment in relationship quality, service differentiation, and loyalty recognition. Monitor committed segment movement month-on-month for early signs of erosion. A 1–2pp decline in committed share is a leading indicator that should trigger a structured retention response.`
    : tier === 'moderate'
    ? `Prioritise conversion of Favors customers into committed status. The most effective levers are salary account migration, product cross-sell that creates switching cost, and service excellence that reinforces primary-bank identity. Set a specific committed share target (e.g. 18%+) as a planning cycle KPI.`
    : `The most urgent commercial action is a structured programme to deepen Favors relationships toward commitment. This typically requires primary account incentives, direct salary migration offers, and product bundles that make the bank the natural primary-bank choice. Targeting the Favors segment specifically — rather than the broader base — produces faster committed share growth.`
  }`;

  return {
    snapshot,
    detail: s(committedBaseSizeSection, stabilityOutlookSection, businessImplicationsSection, priorityActionSection),
  };
}

// ─── 5. Rejectors KPI insight ─────────────────────────────────────────────────

export function buildRejectorsInsight(
  rejectorsPct: number,
  rejectorsCount: number,
  awareCount: number,
  segmentPcts: Record<LoyaltyBucket, number>,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(rejectorsPct) || awareCount === 0) return null;

  const riskLevel =
    rejectorsPct > 30 ? 'high'
    : rejectorsPct > 20 ? 'elevated'
    : rejectorsPct > 12 ? 'moderate'
    : 'low';

  const snapshot =
    riskLevel === 'high'
    ? `${bankName}'s rejector share of ${fmtPct(rejectorsPct)} (${rejectorsCount} respondents) is high — a material portion of the aware base has formed a negative view of the bank.`
    : riskLevel === 'elevated'
    ? `${bankName}'s rejector share of ${fmtPct(rejectorsPct)} (${rejectorsCount} respondents) is elevated and warrants active management attention.`
    : riskLevel === 'moderate'
    ? `${bankName}'s rejector share of ${fmtPct(rejectorsPct)} (${rejectorsCount} respondents) is moderate — manageable at current levels but worth monitoring for growth.`
    : `${bankName}'s rejector share of ${fmtPct(rejectorsPct)} (${rejectorsCount} respondents) is low and does not represent a near-term strategic concern.`;

  const rejectionProfileSection = `REJECTION PROFILE: ${rejectorsCount} aware respondents (${fmtPct(rejectorsPct)} of the aware base) are classified as rejectors — customers or aware non-users who show low return intent (score ≤3) and negative NPS (score ≤6). ${
    riskLevel === 'high'
    ? `A rejector share above 30% is a material competitive exposure. It indicates that a significant portion of aware customers have had a sufficiently poor experience or perception that they are actively adverse to the bank — not merely indifferent.`
    : riskLevel === 'elevated'
    ? `A rejector share in the 20–30% range is a persistent drag on growth. Each rejector is either a lost customer or a permanently closed door, which gradually reduces the pool of people the bank can realistically win over.`
    : riskLevel === 'moderate'
    ? `Rejector share is present but not yet limiting commercial performance. At this level, rejectors reduce the effective aware base but do not dominate the segment mix.`
    : `A low rejector share is commercially healthy. The bank has a minimal proportion of aware customers with active negative sentiment.`
  }`;

  const reactivationPotentialSection = `COMPETITIVE EXPOSURE: ${
    riskLevel === 'high' || riskLevel === 'elevated'
    ? `Rejectors are disproportionately likely to be active customers of competing banks. Their departure — or non-adoption — typically reflects either a direct experience failure or a competitor product that met their needs more effectively. Understanding which competitor is capturing these customers, and why, is the most commercially important diagnostic question. Not all rejectors are recoverable. Those with a long-established primary relationship elsewhere are unlikely to return. But those who rejected recently or over a single service issue are often still winnable.`
    : `At this rejector level, competitive displacement is limited. The bank is not generating significant numbers of aware customers who actively prefer alternatives, which reduces the competitive pressure from within the aware base.`
  }`;

  const competitiveExposureSection = `REACTIVATION POTENTIAL: ${
    riskLevel === 'high'
    ? `The recovery economics for the rejector base depend on how recently customers rejected the bank. Recent rejectors (past 6–12 months) carry some reactivation potential if the root issue is addressed. Long-term rejectors who have consolidated with a competitor are unlikely to return without a significant product or offer event. A structured segmentation of the rejector base by recency and rejection reason would allow targeted investment in the recoverable cohort, rather than applying broad-based win-back spend to the full segment.`
    : riskLevel === 'elevated'
    ? `Some portion of the rejector base is plausibly recoverable — particularly those who rejected on a specific service issue rather than a structural product preference. Targeted service recovery or a direct reactivation offer for former customers in this cohort can produce measurable returns at moderate cost.`
    : `At current rejector levels, reactivation investment is not the highest-priority commercial use of resources. Focusing on converting potential and accessible customers is likely to produce better commercial returns than pursuing rejector reactivation.`
  }`;

  const managementPrioritySection = `MANAGEMENT PRIORITY: ${
    riskLevel === 'high'
    ? `Reducing rejector share is a top-three commercial priority. The most effective interventions depend on the rejection source: experience-driven rejection requires service quality and complaint resolution investment; competitor-driven rejection requires product and pricing competitiveness review. In either case, continued growth in rejector share directly depresses the Loyalty Index and limits the addressable market for acquisition and retention programs.`
    : riskLevel === 'elevated'
    ? `Monitor rejector movement monthly. If rejector share is growing, it warrants immediate root-cause investigation — the most common drivers are service deterioration, fee increases, or competitor product launches. If stable, a targeted reactivation program for recoverable rejectors is a worthwhile investment alongside the primary focus on potential and accessible conversion.`
    : `Rejector share is within a normal commercial range. Maintain current service quality standards to prevent rejector growth, and direct investment toward the larger commercial opportunity in converting potential and accessible customers into active users.`
  }`;

  return {
    snapshot,
    detail: s(rejectionProfileSection, reactivationPotentialSection, competitiveExposureSection, managementPrioritySection),
  };
}

// ─── 6. Segment Distribution insight ─────────────────────────────────────────

export function buildSegmentDistributionInsight(
  diagnostics: LoyaltyDiagnostics,
  bankName: string,
): AwarenessInsightResult | null {
  if (diagnostics.awareCount === 0) return null;

  const { segmentPcts, awareCount } = diagnostics;
  const { Committed, Favors, Potential, Accessibles, Rejectors } = segmentPcts;

  const topTier = Committed + Favors;
  const bottomTier = Rejectors + Accessibles;
  const middleTier = Potential;

  const shape =
    topTier >= 40 ? 'top-heavy'
    : bottomTier >= 60 ? 'bottom-heavy'
    : Math.abs(Committed - Rejectors) < 5 && Committed > 15 ? 'polarised'
    : 'mid-weighted';

  const shapeDesc =
    shape === 'top-heavy' ? 'strong committed and favoring core'
    : shape === 'bottom-heavy' ? 'broad accessible and potential base with limited committed depth'
    : shape === 'polarised' ? 'polarised distribution with significant committed and rejector segments'
    : 'mid-weighted distribution with the majority in potential and accessible segments';

  const snapshot = `${bankName}'s customer mix shows a ${shapeDesc} — Committed ${fmtPct(Committed)}, Favors ${fmtPct(Favors)}, Potential ${fmtPct(Potential)}, Accessibles ${fmtPct(Accessibles)}, Rejectors ${fmtPct(Rejectors)}.`;

  const segmentMixSection = `CUSTOMER MIX: Across ${awareCount} aware respondents, the loyalty distribution is: Committed ${fmtPct(Committed)} · Favors ${fmtPct(Favors)} · Potential ${fmtPct(Potential)} · Accessibles ${fmtPct(Accessibles)} · Rejectors ${fmtPct(Rejectors)}. ${
    shape === 'top-heavy'
    ? `A top-heavy distribution indicates that the brand has successfully converted a substantial portion of its aware base into active loyalty. This is a commercially strong profile.`
    : shape === 'bottom-heavy'
    ? `A bottom-heavy distribution indicates broad awareness that has not converted into loyalty depth. The majority of the aware base remains in low-commitment positions.`
    : shape === 'polarised'
    ? `A polarised distribution indicates a split customer base — a segment of deeply committed customers alongside a significant rejector cohort. This creates a high average index in the committed group but persistent competitive exposure from the rejectors.`
    : `A mid-weighted distribution indicates that the majority of aware customers are in the potential and accessible segments — open to the brand but not yet committed. This is a typical developing-market loyalty profile.`
  }`;

  const businessImpactSection = `BUSINESS IMPACT: ${
    shape === 'top-heavy'
    ? `The top-heavy mix supports strong revenue concentration and customer economics. Committed and favoring customers (${fmtPct(topTier)} combined) generate higher balances, broader product use, and lower churn than any other segment combination. This distribution is a genuine commercial asset.`
    : shape === 'bottom-heavy'
    ? `The bottom-heavy mix means that a large proportion of aware customers are generating limited commercial value. Accessible and potential customers (${fmtPct(bottomTier)} combined) contribute lower balances and product depth than favoring or committed customers. The commercial opportunity is to convert this broad base into deeper relationships.`
    : shape === 'polarised'
    ? `The polarised mix creates a two-speed commercial profile. The committed segment delivers strong revenue concentration, but the rejector segment (${fmtPct(Rejectors)}) actively limits addressable market size and generates word-of-mouth drag. Management must both protect the committed base and address rejector growth.`
    : `The mid-weighted distribution represents a significant commercial opportunity. Potential customers (${fmtPct(Potential)}) are the most convertible segment — they have demonstrated some interest and are closer to commitment than accessible customers.`
  }`;

  const commercialPrioritySection = `GROWTH OPPORTUNITY: ${
    Potential > 20
    ? `The Potential segment at ${fmtPct(Potential)} represents the largest near-term conversion opportunity. These customers show meaningful intent and engagement but have not yet moved into active favoring or committed status. Targeted product trials, direct-to-consumer offers, and service demonstrations are the most effective conversion tools for this segment.`
    : Accessibles > 30
    ? `The Accessible segment at ${fmtPct(Accessibles)} represents a broad but lower-intent audience. Converting even a modest share of accessibles into potential customers — through relevant product messaging and direct channel investment — would materially grow the conversion pipeline.`
    : Favors > 20
    ? `The Favors segment at ${fmtPct(Favors)} is the most efficient route to Committed growth. These customers are already active users with positive sentiment — the conversion requirement is deepening the relationship through salary migration, product cross-sell, and primary account incentives.`
    : `The immediate priority is stabilising Rejector share and activating the Accessible and Potential base before pursuing aggressive committed growth.`
  }`;

  const managementPrioritySection = `MANAGEMENT PRIORITY: ${
    Rejectors > 20
    ? `Rejector share at ${fmtPct(Rejectors)} is the most urgent concern. Reducing this segment prevents further competitive displacement and improves the effective addressable base for all other conversion activity. Without addressing the rejection driver, growth in upper segments will be offset by continued rejector accumulation.`
    : Committed < 10
    ? `Growing committed share from ${fmtPct(Committed)} is the primary strategic objective. The gap between committed and favoring customers represents customers who are engaged but have not been converted to primary-bank status. Direct investment in the Favors-to-Committed conversion is the highest-leverage loyalty action available.`
    : `Maintaining and extending the current mix quality — protecting Committed share while converting Potential customers into the Favoring tier — is the right balance of defensive and growth investment.`
  }`;

  return {
    snapshot,
    detail: s(segmentMixSection, businessImpactSection, commercialPrioritySection, managementPrioritySection),
  };
}

// ─── 7. Segment Movement insight ──────────────────────────────────────────────

export function buildSegmentMovementInsight(
  movementRows: LoyaltyMovementRow[],
  bankName: string,
): AwarenessInsightResult | null {
  if (!movementRows.length) return null;

  const hasData = movementRows.some(
    (r) => isFinite(r.deltaPct) && (r.previousPct > 0 || r.currentPct > 0),
  );
  if (!hasData) return null;

  const sortedByDelta = [...movementRows].sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));
  const biggestGainer = movementRows.filter((r) => r.deltaPct > 0).sort((a, b) => b.deltaPct - a.deltaPct)[0] ?? null;
  const biggestDecline = movementRows.filter((r) => r.deltaPct < 0).sort((a, b) => a.deltaPct - b.deltaPct)[0] ?? null;

  const committedRow = movementRows.find((r) => r.segment === 'Committed');
  const rejectorRow = movementRows.find((r) => r.segment === 'Rejectors');

  const committedMovement = committedRow ? committedRow.deltaPct : 0;
  const rejectorMovement = rejectorRow ? rejectorRow.deltaPct : 0;

  const netDirection =
    committedMovement > 0 && rejectorMovement <= 0 ? 'clearly positive'
    : committedMovement < 0 && rejectorMovement > 0 ? 'clearly negative'
    : committedMovement > 0 ? 'broadly positive'
    : committedMovement < 0 ? 'broadly negative'
    : 'mixed or stable';

  const biggestChange = sortedByDelta[0];
  const secondBiggestChange = sortedByDelta[1];

  const snapshot = biggestGainer && biggestDecline
    ? `${bankName}'s loyalty base is moving ${netDirection} — ${biggestGainer.segment} gained ${biggestGainer.deltaPct > 0 ? '+' : ''}${fmtPct(biggestGainer.deltaPct)} while ${biggestDecline.segment} declined ${fmtPct(biggestDecline.deltaPct)} month-on-month.`
    : biggestChange
    ? `${bankName}'s loyalty base shows ${biggestChange.deltaPct > 0 ? 'growth' : 'decline'} in ${biggestChange.segment} of ${biggestChange.deltaPct > 0 ? '+' : ''}${fmtPct(biggestChange.deltaPct)} — the most significant movement in the period.`
    : `${bankName}'s loyalty segment distribution was broadly stable month-on-month with limited movement across all segments.`;

  const monthOnMonthSection = `CUSTOMER BEHAVIOUR: The largest month-on-month movements are: ${sortedByDelta.slice(0, 2).map((r) => `${r.segment} ${r.deltaPct > 0 ? '+' : ''}${fmtPct(r.deltaPct)}`).join('; ')}. ${
    biggestChange && Math.abs(biggestChange.deltaPct) < 1
    ? `Movements this period are small — all segments are within 1pp of their prior position, indicating a stable loyalty distribution.`
    : biggestChange
    ? `Movement in ${biggestChange.segment} of ${fmt(Math.abs(biggestChange.deltaPct), 1)}pp is the primary shift this period.`
    : `No material movement detected.`
  }`;

  const netDirectionSection = `MARKET DIRECTION: The net loyalty direction for ${bankName} this period is ${netDirection}. ${
    netDirection === 'clearly positive'
    ? `Committed segment growth alongside Rejector decline is the strongest possible combination — the bank is simultaneously deepening its best relationships and reducing competitive displacement.`
    : netDirection === 'broadly positive'
    ? `Committed segment growth indicates the bank is deepening customer relationships, though Rejector movement requires monitoring to ensure the positive trend is not being offset at the base.`
    : netDirection === 'clearly negative'
    ? `Committed decline alongside Rejector growth is the most commercially concerning combination — the bank is losing its highest-value customers while gaining more adverse sentiment at the base. This trend, if sustained, will compress the Loyalty Index materially.`
    : netDirection === 'broadly negative'
    ? `Committed segment decline indicates erosion of the highest-value customer relationships. Even with stable Rejector share, this direction reduces revenue concentration and increases churn risk.`
    : `Segment movements are mixed or minimal this period. No clear directional trend is visible from a single month of data — monitor across the next 2–3 periods before drawing conclusions.`
  }`;

  const businessImplicationsSection = `BUSINESS IMPACT: ${
    committedMovement > 1
    ? `A ${fmtPct(committedMovement)} gain in committed share, if sustained over 3–6 months, would represent a material improvement in customer economics — higher revenue concentration, stronger retention, and improved NPS. The commercial value of each committed customer gained is significantly higher than acquiring an equivalent number of accessible or potential customers.`
    : committedMovement < -1
    ? `A ${fmtPct(Math.abs(committedMovement))} decline in committed share, if sustained, puts real pressure on revenue. Committed customers are expensive to replace — the cost of winning back or recruiting equivalent customers through new acquisition is far higher than what it costs to retain them.`
    : rejectorMovement > 1
    ? `Rejector growth of ${fmtPct(rejectorMovement)}, if sustained over 2–3 months, will create increasing competitive displacement and a depressing effect on the Loyalty Index. Arresting this trend before it compounds is more cost-effective than reversing it after it has established.`
    : `Movement is within normal month-on-month variation. Single-period movements of less than 1pp are not commercially significant without sustained direction across multiple periods.`
  }`;

  const managementPrioritySection = `MANAGEMENT PRIORITY: ${
    netDirection === 'clearly negative' || netDirection === 'broadly negative'
    ? `The declining committed trend requires immediate investigation. Identify whether the movement is driven by competitive switching, service experience deterioration, or demographic churn, and act accordingly. Do not wait for a second period of decline before responding — the cost of reversal grows with each period.`
    : netDirection === 'clearly positive' || netDirection === 'broadly positive'
    ? `The positive trend should be reinforced. Identify what is driving committed growth — whether a specific campaign, service improvement, or seasonal effect — and sustain or accelerate it. Positive momentum in loyalty is self-reinforcing when it reaches the committed segment.`
    : `With mixed or stable movements, monitor the next 2–3 periods before concluding whether a trend is forming. Focus management attention on the segment showing the largest absolute movement: ${biggestChange ? biggestChange.segment : 'no single segment is dominant this period'}.`
  }`;

  return {
    snapshot,
    detail: s(monthOnMonthSection, netDirectionSection, businessImplicationsSection, managementPrioritySection),
  };
}

// ─── 8. Loyalty Funnel insight ────────────────────────────────────────────────

export function buildLoyaltyFunnelInsight(
  awareToPotential: number,
  potentialToFavors: number,
  favorsToCommitted: number,
  awareCount: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (awareCount === 0) return null;

  if (!isFinite(awareToPotential) || !isFinite(potentialToFavors) || !isFinite(favorsToCommitted)) {
    return {
      snapshot: `Insufficient sample data to evaluate the full conversion funnel for ${bankName}. Funnel analysis requires valid counts at each stage.`,
      detail: s(`CONVERSION RATES: Funnel conversion data is incomplete for this slice. One or more stages has insufficient respondents to calculate a conversion rate. Analysis will be available once sample volumes are adequate at each funnel stage.`),
    };
  }

  const weakestRate = Math.min(awareToPotential, potentialToFavors, favorsToCommitted);
  const weakestStage =
    weakestRate === awareToPotential ? 'Aware to Potential'
    : weakestRate === potentialToFavors ? 'Potential to Favors'
    : 'Favors to Committed';

  const weakestDesc =
    weakestStage === 'Aware to Potential'
    ? 'consideration creation — converting aware customers into early interest'
    : weakestStage === 'Potential to Favors'
    ? 'active conversion — moving interested customers into regular use'
    : 'relationship depth — converting active users into primary committed customers';

  const snapshot = `The sharpest drop in ${bankName}'s loyalty funnel is at the ${weakestStage} stage (${fmtPct(weakestRate)}), indicating that ${weakestDesc} is the primary constraint on committed growth.`;

  const conversionRatesSection = `CONVERSION RATES: The three-stage funnel converts as follows: Aware to Potential at ${fmtPct(awareToPotential)}, Potential to Favors at ${fmtPct(potentialToFavors)}, Favors to Committed at ${fmtPct(favorsToCommitted)}. ${
    awareToPotential >= 50 && potentialToFavors >= 50 && favorsToCommitted >= 50
    ? `All three stages are converting at or above 50% — a strong funnel that compounds efficiently toward the committed segment.`
    : awareToPotential < 30
    ? `The Aware to Potential conversion at ${fmtPct(awareToPotential)} is the primary bottleneck — the majority of aware customers are not entering the active consideration set.`
    : potentialToFavors < 40
    ? `The Potential to Favors conversion at ${fmtPct(potentialToFavors)} indicates that interested customers are not progressing to active use — a trial or engagement barrier is likely.`
    : favorsToCommitted < 30
    ? `The Favors to Committed conversion at ${fmtPct(favorsToCommitted)} indicates that active users are not being converted into primary committed customers — the relationship depth program is the limiting factor.`
    : `The funnel is converting adequately across all stages, with no single stage causing extreme drop-off.`
  }`;

  const whereConversionDropsSection = `WHERE CONVERSION DROPS: The weakest stage is ${weakestStage} at ${fmtPct(weakestRate)}. ${
    weakestStage === 'Aware to Potential'
    ? `Low Aware-to-Potential conversion typically reflects a gap between brand awareness and active product consideration. Customers know the bank but are not engaging with it as a serious option. The barrier is usually one of trust, perceived relevance, or limited product differentiation that gives aware customers a reason to investigate further.`
    : weakestStage === 'Potential to Favors'
    ? `Low Potential-to-Favors conversion means interested customers are not being activated into regular use. The barrier is typically a trial friction issue — onboarding complexity, insufficient first-product offer, or a competing bank that meets the customer's need more conveniently at the point of decision.`
    : `Low Favors-to-Committed conversion means the bank is retaining active users but not converting them into primary relationships. These customers are satisfied but have their primary banking elsewhere. The barrier is relationship inertia and the absence of a clear, compelling reason to consolidate with this bank.`
  }`;

  const businessImplicationsSection = `BUSINESS IMPACT: ${
    weakestStage === 'Aware to Potential'
    ? `Improving Aware-to-Potential conversion by 10pp would add a meaningful number of customers to the active consideration pipeline, compounding through all subsequent stages. At the current Potential-to-Favors and Favors-to-Committed conversion rates, each additional potential customer added at this stage ultimately produces a calculable number of committed customers.`
    : weakestStage === 'Potential to Favors'
    ? `Improving Potential-to-Favors conversion by 10pp would materially expand the Favors segment — the direct feeder to Committed. Given the current Favors-to-Committed rate of ${fmtPct(favorsToCommitted)}, a 10pp improvement at this stage would produce a meaningful addition to the committed base without requiring any upstream awareness investment.`
    : `Improving Favors-to-Committed conversion by 10pp would directly and immediately expand the committed base — the highest-value segment. These customers are already active users of the bank; the conversion investment is significantly lower than acquiring new customers to the same outcome.`
  }`;

  const managementPrioritySection = `MANAGEMENT PRIORITY: The primary intervention should be at the ${weakestStage} stage. ${
    weakestStage === 'Aware to Potential'
    ? `Invest in consideration-stage content and direct-to-consumer campaigns that move aware customers from passive recognition to active evaluation. Clear product differentiation, proof points, and accessible information about the bank's offer are the levers at this stage. Until this conversion improves, investments further down the funnel will underperform.`
    : weakestStage === 'Potential to Favors'
    ? `Remove the trial barrier at the Potential-to-Favors stage. This typically requires an accessible first-product offer, simplified onboarding, and direct-channel campaigns targeting the Potential segment specifically. Consider a dedicated acquisition campaign with a converting offer for customers who are in the consideration set but have not yet transacted.`
    : `Focus retention and relationship deepening programs on the Favors segment — specifically programs designed to make this bank the primary account. Salary migration incentives, primary account fee benefits, and product cross-sell that creates switching cost are the most effective tools. The Favors segment is the closest to Committed and the most cost-efficient conversion target.`
  }`;

  return {
    snapshot,
    detail: s(conversionRatesSection, whereConversionDropsSection, businessImplicationsSection, managementPrioritySection),
  };
}
