import type { AwarenessInsightResult } from '@/utils/awarenessInsights';
import type {
  CompetitiveIntelligenceDiagnostics,
  MarketShareRow,
  PositioningRow,
  CompetitiveSetRow,
  RelativeStrengthRow,
  WhiteSpaceRow,
  WinLossRow,
  ThreatRow,
} from '@/utils/subscriberDashboard';
import type { CustomerSwitchingRadarResult } from '@/utils/customerSwitchingRadar';
import type { CustomerMigrationMapResult } from '@/utils/customerMigrationMap';

// ─── Local helpers ────────────────────────────────────────────────────────────

function s(...parts: string[]): string {
  return parts.filter((p) => p && p.length > 0).join('\n\n');
}

/** Safe percent formatter — returns fallback for null/undefined/NaN/Infinity */
function fmtPct(v: number | null | undefined, fallback = '--'): string {
  if (v == null || !isFinite(v)) return fallback;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

/** Safe number formatter — returns fallback for null/undefined/NaN/Infinity */
function fmt(v: number | null | undefined, d = 1, fallback = '--'): string {
  if (v == null || !isFinite(v)) return fallback;
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(d);
}

/** Top-level guard: wraps a builder so any unexpected throw returns null instead of crashing the dashboard */
function safe<T>(fn: () => T | null): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

// ─── 1. Module summary ────────────────────────────────────────────────────────

export function buildCompetitiveModuleSummary(
  diagnostics: CompetitiveIntelligenceDiagnostics,
  bankName: string,
  selectedBankId: string,
): AwarenessInsightResult | null {
  const { marketRows, concentrationLabel } = diagnostics.marketStructure;
  if (marketRows.length === 0) return null;

  const sorted = [...marketRows].sort((a, b) => b.marketShare - a.marketShare);
  const rank = sorted.findIndex((r) => r.bankId === selectedBankId) + 1;
  const row = sorted.find((r) => r.bankId === selectedBankId);
  const share = row?.marketShare ?? 0;
  const delta = row?.marketShareDelta ?? 0;

  const positionLabel =
    rank === 1 ? 'market leader'
    : rank <= 3 ? 'challenger'
    : 'developing player';

  const riskOrOpp =
    delta < -1
      ? `Share has declined ${fmtPct(Math.abs(delta))} points, which is the primary risk to address.`
      : share < 10
      ? `Limited scale creates vulnerability to further competitive pressure.`
      : diagnostics.threats.rows.some((r) => r.threatLevel === 'Critical')
      ? `At least one competitor poses a critical threat level based on momentum and overlap signals.`
      : `The competitive set is ${concentrationLabel.toLowerCase()}, which creates room for further share gains.`;

  const snapshot = `${bankName} ranks ${rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`} in preferred market share at ${fmtPct(share)}, operating as a ${positionLabel}. ${riskOrOpp}`;

  const marketPositionSection = `MARKET POSITION: ${bankName} holds ${fmtPct(share)} preferred share, ranking ${rank} of ${sorted.length} banks tracked. ${
    rank === 1
      ? `As market leader, the priority is defending scale and preventing share migration to challengers gaining momentum.`
      : rank <= 3
      ? `As a challenger, the primary opportunity is converting share-of-voice investment into preferred share gains.`
      : `Building scale is the immediate priority to reduce vulnerability and improve competitive leverage.`
  }`;

  const landscapeSection = `COMPETITIVE LANDSCAPE: The market is ${concentrationLabel.toLowerCase()} with ${sorted.length} banks tracked. ${
    concentrationLabel === 'Highly Concentrated'
      ? `High concentration means a small number of banks dominate preferred share, limiting competitive mobility for smaller players.`
      : concentrationLabel === 'Moderately Concentrated'
      ? `Moderate concentration suggests a tiered structure where the top banks hold meaningful advantage but challengers can realistically close the gap.`
      : `A competitive market distributes share broadly, making differentiation and customer loyalty especially important for sustaining position.`
  }`;

  const criticalThreat = diagnostics.threats.rows.find((r) => r.threatLevel === 'Critical');
  const keyRiskSection = `KEY RISK: ${
    delta < -2
      ? `${bankName} has lost ${fmtPct(Math.abs(delta))} percentage points of preferred share in the tracked period. Continued erosion at this pace will drop the bank's competitive rank and reduce bargaining leverage with customers.`
      : criticalThreat
      ? `${criticalThreat.competitorBankName} is flagged at critical threat level based on competitive momentum and usage overlap signals. This competitor should be tracked closely for further share encroachment.`
      : diagnostics.customerBehavior.multiBankingRate > 60
      ? `Multi-banking is widespread among surveyed customers (${fmtPct(diagnostics.customerBehavior.multiBankingRate)}), meaning wallet share competition is active across the customer base.`
      : `No single dominant risk has been flagged, but maintaining share leadership requires ongoing retention focus and continued investment in brand preference.`
  }`;

  const priorityActionSection = `PRIORITY ACTION: ${
    rank === 1 && delta >= 0
      ? `Reinforce the loyalty base and monitor challenger momentum indicators. Defending the top position requires both retaining committed customers and limiting the appeal of competitors who are gaining share-of-voice relative to their share.`
      : rank <= 3 && delta > 0
      ? `Momentum is moving in a positive direction. Converting share-of-voice advantage into preferred share gains should be the primary commercial focus over the next period.`
      : delta < -1
      ? `Arresting share decline is the first priority. Identify the segments or geographies where migration is occurring and deploy targeted retention and reactivation activity.`
      : `Building scale and deepening customer commitment are the most durable routes to improved competitive position.`
  }`;

  return {
    snapshot,
    detail: s(marketPositionSection, landscapeSection, keyRiskSection, priorityActionSection),
  };
}

// ─── 2. Market share insight ──────────────────────────────────────────────────

export function buildMarketShareInsight(
  marketRows: MarketShareRow[],
  selectedBankId: string,
  concentrationLabel: string,
  bankName: string,
): AwarenessInsightResult | null {
  if (marketRows.length === 0) return null;

  const sorted = [...marketRows].sort((a, b) => b.marketShare - a.marketShare);
  const rank = sorted.findIndex((r) => r.bankId === selectedBankId) + 1;
  const row = sorted.find((r) => r.bankId === selectedBankId);
  const share = row?.marketShare ?? 0;
  const delta = row?.marketShareDelta ?? 0;
  const sov = row?.shareOfVoice ?? 0;
  const sovGap = row?.sovVsShareGap ?? 0;

  const rankLabel =
    rank === 1 ? '1st'
    : rank === 2 ? '2nd'
    : rank === 3 ? '3rd'
    : `${rank}th`;

  const snapshot = `${bankName} holds ${fmtPct(share)} preferred market share, ranking ${rankLabel} of ${sorted.length} banks tracked${delta !== 0 ? `, with a ${delta > 0 ? '+' : ''}${fmtPct(delta)} point change in the latest period` : ''}.`;

  const sharePositionSection = `SHARE POSITION: ${bankName} sits at ${fmtPct(share)} preferred share (rank ${rank}). ${
    rank === 1
      ? `Holding first position provides a material advantage in brand recognition, distribution leverage, and customer retention. Sustaining this lead requires active defense rather than passive management.`
      : rank <= 3
      ? `A top-three position provides meaningful scale but still leaves room to close the gap on the leader. Focus on the segments where share-of-voice and customer overlap can be converted into preferred gains.`
      : `A sub-top-three position limits competitive influence and makes the customer base more susceptible to poaching. Building share is the clearest near-term priority.`
  }`;

  const marketStructureSection = `MARKET STRUCTURE: The market is ${concentrationLabel.toLowerCase()} across ${sorted.length} tracked banks. ${
    sorted.length > 0
      ? `The leading bank holds ${fmtPct(sorted[0].marketShare)} preferred share${sorted[0].bankId !== selectedBankId ? `, a gap of ${fmtPct(sorted[0].marketShare - share)} points above ${bankName}` : ''}.`
      : ''
  } Market structure affects the feasibility of share gains — competitive markets reward differentiation while concentrated ones require scale plays.`;

  const trendSignalSection = `TREND SIGNAL: ${
    delta > 1
      ? `Preferred share has increased ${fmtPct(delta)} points in the latest period, a positive directional signal. If sustained, this trajectory will improve the bank's competitive rank and reduce vulnerability.`
      : delta < -1
      ? `Preferred share has declined ${fmtPct(Math.abs(delta))} points in the latest period. This is an early warning of customer preference erosion and merits investigation into which competitors are gaining.`
      : `Preferred share is broadly stable (${delta > 0 ? '+' : ''}${fmtPct(delta)} points), with no material movement in the latest period. Stability at a lower rank is not the same as health — share must grow to improve competitive standing.`
  } Share-of-voice stands at ${fmtPct(sov)}, giving a SOV-to-share gap of ${sovGap > 0 ? '+' : ''}${fmtPct(sovGap)} points.`;

  const managementPrioritySection = `MANAGEMENT PRIORITY: ${
    rank === 1
      ? `Maintain market leadership by retaining the committed customer base and monitoring challengers who are over-investing in share-of-voice relative to their current share — a pattern that often precedes share gains.`
      : sovGap > 5
      ? `Share-of-voice exceeds preferred share by ${fmtPct(sovGap)} points, which means the bank is generating awareness without converting it into preference. The commercial priority is improving the awareness-to-preference conversion rate.`
      : sovGap < -5
      ? `Preferred share exceeds share-of-voice, suggesting the bank is punching above its weight on conversion but underinvesting in brand reach. Increasing SOV is likely the highest-leverage growth investment.`
      : delta < -1
      ? `Arresting share decline is the first priority. Identify the specific competitor(s) and segments driving the erosion.`
      : `Continue building preferred share through customer commitment programs and competitive differentiation. There is still a gap to close before the position is secure.`
  }`;

  return {
    snapshot,
    detail: s(sharePositionSection, marketStructureSection, trendSignalSection, managementPrioritySection),
  };
}

// ─── 3. HHI insight ───────────────────────────────────────────────────────────

export function buildHHIInsight(
  hhi: number,
  concentrationLabel: string,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(hhi)) return null;

  const tier =
    hhi < 1500 ? 'competitive'
    : hhi < 2500 ? 'moderately concentrated'
    : 'highly concentrated';

  const snapshot = `The market's HHI of ${Math.round(hhi)} signals a ${tier} structure, which shapes how ${bankName} should approach share growth and competitive defense.`;

  const concentrationReadingSection = `CONCENTRATION READING: The Herfindahl-Hirschman Index (HHI) for this market is ${Math.round(hhi)}, classified as ${concentrationLabel}. The standard thresholds are: below 1,500 (competitive), 1,500–2,500 (moderately concentrated), above 2,500 (highly concentrated).`;

  const whatThisMeansSection = `MARKET IMPLICATIONS: ${
    tier === 'competitive'
      ? `A competitive market means no single bank dominates preferred share. Multiple banks hold meaningful positions, making differentiation, brand investment, and customer experience the primary levers for gaining share. Small movements in relative brand preference can produce material shifts in share.`
      : tier === 'moderately concentrated'
      ? `Moderate concentration means a small number of banks hold a significant portion of preferred share. Challengers can close the gap through focused investment, but the scale advantage sits with the top one or two players.`
      : `High concentration means one or two banks dominate preferred share. For smaller players, competing head-to-head with the dominant bank is typically less effective than targeting specific segments or geographies where the leader is less entrenched.`
  }`;

  const competitiveDynamicsSection = `COMPETITIVE DYNAMICS: ${
    tier === 'competitive'
      ? `In a fragmented market, brand switching tends to be more fluid. Customers have more alternatives they consider credible, and retention becomes as important as acquisition. Competitive pressure is distributed across many banks rather than concentrated in one or two.`
      : tier === 'moderately concentrated'
      ? `The market sits in a transition zone. The top banks have sufficient scale to enjoy retention advantages, but the market is not so concentrated that challenger strategies are futile. Share is contestable for well-resourced challengers.`
      : `Dominant-player markets tend to exhibit stickiness — customers default to the leading bank. Displacing the leader requires sustained long-term investment and usually targets segments where the dominant bank under-serves, rather than direct competitive substitution.`
  }`;

  const strategicImplicationSection = `STRATEGIC IMPLICATION: ${
    tier === 'competitive'
      ? `${bankName} competes in a fragmented market. Customer loyalty programs, NPS improvement, and share-of-voice investment are especially high-leverage because small preference advantages translate into meaningful share gains when no one bank commands loyalty.`
      : tier === 'moderately concentrated'
      ? `${bankName} should be selective about where it competes head-to-head versus where it can carve out differentiated positions. Attacking the leader on all fronts is inefficient; targeting underserved segments is more productive.`
      : `${bankName} operates in a concentrated market. The strategic priority is identifying white-space segments and younger customer cohorts where habitual loyalty to the dominant player has not yet solidified.`
  }`;

  return {
    snapshot,
    detail: s(concentrationReadingSection, whatThisMeansSection, competitiveDynamicsSection, strategicImplicationSection),
  };
}

// ─── 4. Multi-banking insight ─────────────────────────────────────────────────

export function buildCompetitiveMultiBankingInsight(
  multiBankingRate: number,
  averageBanksPerCustomer: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (!isFinite(multiBankingRate)) return null;

  const level =
    multiBankingRate >= 60 ? 'high'
    : multiBankingRate >= 35 ? 'moderate'
    : 'low';

  const snapshot = `${fmtPct(multiBankingRate)} of surveyed customers use more than one bank (avg ${fmt(averageBanksPerCustomer)} banks per customer), indicating ${level} wallet fragmentation and active competition for primary-bank status.`;

  const multiBankingLandscapeSection = `MULTI-BANKING LANDSCAPE: ${fmtPct(multiBankingRate)} of surveyed customers hold accounts at more than one bank, with an average of ${fmt(averageBanksPerCustomer)} banks per multi-banking customer. ${
    level === 'high'
      ? `This is a high multi-banking environment. Most customers have relationships with multiple institutions, which means preferred share and primary-bank designation are actively contested.`
      : level === 'moderate'
      ? `Multi-banking is present but not universal. A significant share of customers are single-bank, creating a stable base, while multi-bankers represent both a retention risk and a cross-sell opportunity.`
      : `Most customers in this market use a single bank, indicating habitual loyalty and lower switching fluidity. This benefits the market leader but limits growth opportunities for challengers.`
  }`;

  const walletCompetitionSection = `WALLET COMPETITION: In a ${level}-multi-banking environment, ${bankName}'s competitive priority is ${
    level === 'high'
      ? `securing primary-bank designation — salary account, primary transaction account, or main savings relationship. Customers who use multiple banks will allocate the most valuable financial products to their primary bank, making "most important bank" status more commercially significant than simple usage share.`
      : level === 'moderate'
      ? `retaining single-bank customers and converting multi-bankers into primary relationships. Single-bank customers typically allocate more products and higher balances to their one institution, creating a materially higher customer lifetime value.`
      : `sustaining primary-bank relationships. Low multi-banking means customers are already committed, and the risk is disruption from new entrants or digital challengers attracting the next generation of customers before habitual loyalty forms.`
  }`;

  const whatThisMeansSection = `PRIMARY BANK STATUS: Multi-banking rates measure the prevalence of split financial relationships in the customer population. A high rate does not mean customers are disloyal — many multi-bank deliberately for product variety. However, only one bank holds the primary relationship at any point, and that primary status drives revenue concentration, cross-sell rates, and long-term retention. The average of ${fmt(averageBanksPerCustomer)} banks per multi-banking customer gives a rough sense of how fragmented individual wallets are.`;

  const managementPrioritySection = `MANAGEMENT PRIORITY: ${
    level === 'high'
      ? `With multi-banking widespread, ${bankName} should track primary-bank designation rates specifically, not just usage share. Salary account acquisition, daily-use product bundling, and digital engagement depth are the most reliable indicators of primary status and should be treated as key performance metrics.`
      : level === 'moderate'
      ? `Segment the customer base by banking relationship count. Single-bank customers should be prioritised for retention programs, while multi-bankers should be targeted for consolidation — converting secondary relationships into primary ones through product incentives and onboarding improvement.`
      : `Low multi-banking is a structural advantage if ${bankName} holds the primary position. The risk is complacency — digital challengers and new entrants tend to gain traction first among younger, less habituated customers who have not yet formed a primary-bank relationship.`
  }`;

  return {
    snapshot,
    detail: s(multiBankingLandscapeSection, walletCompetitionSection, whatThisMeansSection, managementPrioritySection),
  };
}

// ─── 5. Market structure insight ──────────────────────────────────────────────

export function buildMarketStructureInsight(
  marketRows: MarketShareRow[],
  hhi: number,
  concentrationLabel: string,
  bankName: string,
  selectedBankId: string,
): AwarenessInsightResult | null {
  if (marketRows.length === 0) return null;

  const sorted = [...marketRows].sort((a, b) => b.marketShare - a.marketShare);
  const selected = sorted.find((r) => r.bankId === selectedBankId);
  const top = sorted[0];
  const totalSov = marketRows.reduce((acc, r) => acc + r.shareOfVoice, 0);

  const snapshot = `The market is ${concentrationLabel.toLowerCase()} (HHI ${Math.round(hhi)}) across ${sorted.length} banks, with ${top.bankName} leading at ${fmtPct(top.marketShare)} preferred share.`;

  const marketDistributionSection = `MARKET DISTRIBUTION: ${sorted.length} banks are tracked across this competitive set. ${top.bankName} leads with ${fmtPct(top.marketShare)} preferred share${sorted.length > 1 ? `, followed by ${sorted[1].bankName} at ${fmtPct(sorted[1].marketShare)}` : ''}. ${bankName} holds ${fmtPct(selected?.marketShare ?? 0)} preferred share.`;

  const sovGapRows = [...marketRows].sort((a, b) => Math.abs(b.sovVsShareGap) - Math.abs(a.sovVsShareGap));
  const biggestSovGap = sovGapRows[0];
  const sovGapsSection = `SOV VS SHARE GAPS: Share-of-voice gaps indicate where banks are over- or under-investing in brand visibility relative to their preference share. ${
    biggestSovGap
      ? `The largest gap in this market belongs to ${biggestSovGap.bankName} (SOV ${fmtPct(biggestSovGap.shareOfVoice)}, share ${fmtPct(biggestSovGap.marketShare)}, gap ${biggestSovGap.sovVsShareGap > 0 ? '+' : ''}${fmtPct(biggestSovGap.sovVsShareGap)}). ${biggestSovGap.sovVsShareGap > 5 ? `This bank is investing heavily in awareness without converting it into preferred share — a conversion challenge to monitor.` : biggestSovGap.sovVsShareGap < -5 ? `This bank is generating more preferred share than its share-of-voice would predict — a signal of strong conversion efficiency or underreported brand investment.` : `Gaps are broadly in line with competitive shares.`}`
      : `SOV data is limited in this period.`
  }${selected && selected.sovVsShareGap !== 0 ? ` ${bankName}'s own SOV-to-share gap is ${selected.sovVsShareGap > 0 ? '+' : ''}${fmtPct(selected.sovVsShareGap)} points.` : ''}`;

  const concentrationSignalSection = `CONCENTRATION SIGNAL: An HHI of ${Math.round(hhi)} places this market in the ${concentrationLabel.toLowerCase()} category. ${
    hhi < 1500
      ? `Competitive markets reward brand investment and customer experience improvements, as share is more fluid and customers hold fewer habitual loyalties.`
      : hhi < 2500
      ? `Moderate concentration means the top banks have scale advantages, but the market is not locked. Targeted challenger strategies remain viable.`
      : `High concentration means customer relationships tend to be sticky. New share gains require identifying underserved segments rather than head-to-head competition with the dominant bank.`
  }`;

  const opportunityReadSection = `OPPORTUNITY READ: ${
    selected && selected.marketShare < top.marketShare * 0.5 && hhi < 2500
      ? `${bankName} operates with meaningful room to grow share in a market that remains contestable. The most productive routes are segment-level targeting and improving preferred status conversion among customers who already use the bank.`
      : selected && selected.marketShare >= top.marketShare * 0.8
      ? `${bankName} is within striking distance of the market leader. Incremental share gains are achievable through focused competitive investment and capturing momentum from challengers who are gaining SOV but not yet share.`
      : `${bankName}'s share position is established. Sustaining and building on current share requires disciplined customer retention, quality-of-service investment, and selective competitive targeting.`
  }`;

  return {
    snapshot,
    detail: s(marketDistributionSection, sovGapsSection, concentrationSignalSection, opportunityReadSection),
  };
}

// ─── 6. Customer behavior insight ─────────────────────────────────────────────

export function buildCustomerBehaviorInsight(
  overlapRows: CompetitiveIntelligenceDiagnostics['customerBehavior']['overlapRows'],
  portfolioComposition: CompetitiveIntelligenceDiagnostics['customerBehavior']['portfolioComposition'],
  multiBankingRate: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (portfolioComposition.length === 0) return null;

  const exclusiveRow = portfolioComposition.find((r) => r.label === 'Exclusive');
  const exclusivePct = exclusiveRow?.pct ?? 0;
  const multiPct = 100 - exclusivePct;

  const topOverlap = [...(overlapRows ?? [])].sort((a, b) => b.overlapPct - a.overlapPct)[0];

  const snapshot = `${fmtPct(exclusivePct)} of ${bankName}'s customers use no other bank, while ${fmtPct(multiPct)} hold accounts elsewhere${topOverlap ? `, with ${topOverlap.bankName} being the most common co-held institution (${fmtPct(topOverlap.overlapPct)} overlap)` : ''}.`;

  const portfolioMixSection = `PORTFOLIO MIX: Among ${bankName}'s customers, ${fmtPct(exclusivePct)} are exclusive (no other bank), ${portfolioComposition.find((r) => r.label === 'Bank + 1 Other')?.pct !== undefined ? fmtPct(portfolioComposition.find((r) => r.label === 'Bank + 1 Other')!.pct) : 'some proportion'} use one additional bank, and ${portfolioComposition.find((r) => r.label === 'Bank + 2+ Others')?.pct !== undefined ? fmtPct(portfolioComposition.find((r) => r.label === 'Bank + 2+ Others')!.pct) : 'some proportion'} use two or more. ${
    exclusivePct >= 60
      ? `Majority exclusivity indicates strong primary-bank designation, which typically correlates with higher product depth and customer lifetime value.`
      : exclusivePct >= 35
      ? `A moderate exclusive base means wallet competition is real but not dominant. A meaningful portion of customers maintain depth with ${bankName} as their primary institution.`
      : `Low exclusivity suggests most customers view ${bankName} as one of several banking relationships rather than their primary institution. This creates vulnerability to consolidation by competitors who actively seek primary-bank status.`
  }`;

  const overlapPressureSection = `OVERLAP PRESSURE: ${
    topOverlap
      ? `The most common co-held institution is ${topOverlap.bankName}, with ${fmtPct(topOverlap.overlapPct)} of ${bankName}'s customers also using that bank. High co-usage with a direct competitor indicates that many customers are actively evaluating which institution should receive their primary business.${overlapRows && overlapRows.length > 1 ? ` Overlap extends across ${overlapRows.length} banks in the competitive set.` : ''}`
      : `Overlap data is limited for this period. Tracking which institutions co-exist in customers' banking portfolios is a useful leading indicator of competitive pressure.`
  }`;

  const walletCompetitionSection = `WALLET COMPETITION: Multi-banking rate among surveyed customers is ${fmtPct(multiBankingRate)}. ${
    multiBankingRate >= 60
      ? `With the majority of customers splitting banking relationships, wallet competition is a structural feature of this market rather than an edge case. ${bankName} competes not just for account acquisition but for the allocation of primary financial products — salary, savings, and primary transaction accounts.`
      : multiBankingRate >= 35
      ? `Multi-banking is common enough that wallet competition is a consistent management consideration. Customer who use multiple banks may be consolidating over time, and ${bankName}'s ability to capture primary-bank status is the key commercial variable.`
      : `Most customers in this market maintain a single banking relationship. This limits active wallet competition, but it also means that customers who do switch or add a second bank represent a meaningful signal worth monitoring.`
  }`;

  const retentionSignalSection = `RETENTION SIGNAL: ${
    exclusivePct < 30
      ? `Low exclusivity combined with broad overlap is an early warning of customer base vulnerability. Customers who hold multiple accounts have lower switching friction and are more susceptible to competitive offers. Deepening engagement, simplifying consolidation, and improving primary-product adoption are the most direct levers for improving retention quality.`
      : exclusivePct >= 60
      ? `High exclusivity is a strong retention foundation. The risk to monitor is whether competitors are building meaningful overlap among the remaining multi-bank segment, which can expand over time if unchecked.`
      : `Moderate exclusivity provides a stable core but leaves the multi-bank segment as an active competitive battleground. Segmenting these customers by product depth and recency of engagement can identify those most at risk of consolidating elsewhere.`
  }`;

  return {
    snapshot,
    detail: s(portfolioMixSection, overlapPressureSection, walletCompetitionSection, retentionSignalSection),
  };
}

// ─── 7. Competitive positioning insight ───────────────────────────────────────

export function buildCompetitivePositioningInsight(
  positioningRows: PositioningRow[],
  directCompetitors: CompetitiveSetRow[],
  bankName: string,
  selectedBankId: string,
): AwarenessInsightResult | null {
  if (positioningRows.length === 0) return null;

  const selectedRow = positioningRows.find((r) => r.bankId === selectedBankId);
  const position = selectedRow?.position ?? 'Struggler';
  const tier = selectedRow?.tier ?? 'Tier 3: Niche Players';
  const nps = selectedRow?.nps ?? 0;
  const share = selectedRow?.marketShare ?? 0;

  const positionRead =
    position === 'Leader' ? 'a market leader position'
    : position === 'Quality Challenger' ? 'a quality challenger position'
    : position === 'Vulnerable Leader' ? 'a vulnerable leader position'
    : 'a struggler position';

  const snapshot = `${bankName} holds ${positionRead} (${tier}) with ${fmtPct(share)} preferred share and NPS ${nps > 0 ? '+' : ''}${fmt(nps, 0)}.`;

  const competitivePositionSection = `COMPETITIVE POSITION: ${bankName} is classified as a ${position} within ${tier}. ${
    position === 'Leader'
      ? `A Leader position combines high market share with strong customer advocacy (NPS). This is the most defensible competitive position and typically reflects a durable brand preference advantage.`
      : position === 'Quality Challenger'
      ? `A Quality Challenger position indicates strong NPS relative to market share — the bank delivers quality outcomes but has not yet converted them into dominant scale. The opportunity is to use advocacy strength as a platform for share growth.`
      : position === 'Vulnerable Leader'
      ? `A Vulnerable Leader holds meaningful market share but lower NPS than the position warrants. Customers use the bank but do not strongly advocate for it. This is a fragile competitive position that can erode as challengers with stronger advocacy build scale.`
      : `A Struggler position reflects both limited share and limited advocacy. Improving NPS is typically the prerequisite for share growth, as customers who do not advocate are unlikely to deepen their relationship or refer others.`
  }`;

  const topDirect = directCompetitors.slice(0, 3);
  const directThreatsSection = `DIRECT THREATS: ${
    topDirect.length > 0
      ? `The most closely overlapping competitors are ${topDirect.map((r) => `${r.bankName} (${fmtPct(r.overlapPct)} customer overlap)`).join(', ')}. Direct competitors with high customer overlap represent the highest-priority retention risks, as their customers and ${bankName}'s customers regularly appear in each other's consideration sets.`
      : `No direct competitor overlap data is available for this period.`
  }`;

  const tier1Banks = positioningRows.filter((r) => r.tier === 'Tier 1: Market Leaders');
  const tier2Banks = positioningRows.filter((r) => r.tier === 'Tier 2: Strong Challengers');
  const tier3Banks = positioningRows.filter((r) => r.tier === 'Tier 3: Niche Players');
  const tierStructureSection = `TIER STRUCTURE: ${tier1Banks.length} bank${tier1Banks.length !== 1 ? 's' : ''} occupy${tier1Banks.length === 1 ? 's' : ''} Tier 1 (Market Leaders), ${tier2Banks.length} sit in Tier 2 (Strong Challengers), and ${tier3Banks.length} are classified as Tier 3 (Niche Players). ${
    tier === 'Tier 1: Market Leaders'
      ? `${bankName}'s Tier 1 position confers scale advantages and brand recognition that are difficult for smaller competitors to replicate in the short term.`
      : tier === 'Tier 2: Strong Challengers'
      ? `Tier 2 banks are close enough in scale to contest share with Tier 1 leaders, particularly in segments where the leader is less entrenched.`
      : `Tier 3 banks typically succeed through niche positioning, geography, or specific customer segment focus rather than broad market competition.`
  }`;

  const strategicImplicationSection = `STRATEGIC IMPLICATION: ${
    position === 'Leader'
      ? `Defending the leadership position requires continued NPS investment and monitoring of Quality Challengers who may be converting high advocacy scores into share gains. Complacency at the top is the most common cause of erosion.`
      : position === 'Quality Challenger'
      ? `${bankName} has a differentiation advantage (NPS) that is not yet fully reflected in market share. Increasing marketing investment, improving product distribution, and targeting segments where the leader under-performs are the most direct routes to converting quality into scale.`
      : position === 'Vulnerable Leader'
      ? `Improving customer advocacy (NPS) is the first-order strategic priority. Market share held without strong advocacy is structurally at risk, particularly from Quality Challengers who are building preference with a smaller but more committed customer base.`
      : `Both NPS improvement and scale building are needed. Focusing on a specific segment where ${bankName} can credibly win — rather than competing broadly — tends to be the most effective path out of a Struggler position.`
  }`;

  return {
    snapshot,
    detail: s(competitivePositionSection, directThreatsSection, tierStructureSection, strategicImplicationSection),
  };
}

// ─── 8. Switching radar insight ───────────────────────────────────────────────

export function buildSwitchingRadarInsight(
  radar: CustomerSwitchingRadarResult,
  bankName: string,
  resolveLabel?: (id: string) => string,
): AwarenessInsightResult | null {
  if (!radar.hasData) return null;

  const sorted = [...radar.competitors].sort((a, b) => b.switchingPressureScore - a.switchingPressureScore);
  const top = sorted[0];
  const topName = top?.competitor
    ? (resolveLabel ? resolveLabel(top.competitor) : top.competitor)
    : null;

  const snapshot = topName
    ? `${topName} generates the highest estimated switching pressure on ${bankName} customers (pressure score ${top.switchingPressureScore}), based on second-choice preference and usage overlap signals This is an estimated indicator, not confirmed switching activity.`
    : `Switching pressure data is available but no dominant competitor is identified in the top position.`;

  const topPressureSection = `TOP PRESSURE SOURCE: ${
    topName && top
      ? `${topName} scores ${top.switchingPressureScore} on the switching pressure index, a composite of second-choice preference share (${fmtPct(top.secondChoiceShare)}) and usage overlap (${fmtPct(top.overlapShare)}). Second-choice share reflects how often this competitor is the preferred alternative when customers do not name ${bankName} as primary. Overlap share reflects how commonly both banks appear in the same customer's portfolio.`
      : `No clear top pressure source was identified from available data.`
  }`;

  const whatThisMeasuresSection = `WHAT THIS MEASURES: The switching pressure score is an estimated indicator derived from stated second-choice preferences and self-reported multi-bank usage patterns. It estimates competitive proximity: which banks are most likely to attract ${bankName}'s customers if they were to change primary bank — It does not record actual account closures or transfers. The score is directional and should be used to prioritise which competitors to monitor, not to quantify observed customer movement.`;

  const signalLimitationsSection = `LIMITATIONS: This analysis is based on ${radar.multiBankUsingSelectedBase} customers who use ${bankName} and hold accounts at other banks. Second-choice preference is a stated-preference measure that does not capture transactional or balance migration. Customers who name a competitor as second choice have not necessarily moved any products or funds. Low sample sizes (base below 30) should be treated with additional caution, and findings should be validated against transaction data and direct customer feedback where available.${radar.lowSample ? ' NOTE: The sample for this analysis is below the recommended threshold Treat results as indicative only.' : ''}`;

  const recommendedWatchSection = `RECOMMENDED WATCH: ${
    sorted.length > 1
      ? `The top three banks by pressure score are ${sorted.slice(0, 3).map((r) => {
          const name = resolveLabel ? resolveLabel(r.competitor) : r.competitor;
          return `${name} (${r.switchingPressureScore})`;
        }).join(', ')}. Monitor these competitors for changes in share-of-voice, NPS, product launches, and pricing that could accelerate preference migration. Rising pressure scores over successive periods are the most actionable signal.`
      : topName
      ? `Focus monitoring on ${topName}. Track that bank's brand investment, product positioning, and any shifts in its own preferred share that might signal it is successfully converting pressure into acquisition.`
      : `Continue collecting preference data to build a more complete picture of competitive pressure sources.`
  }`;

  return {
    snapshot,
    detail: s(topPressureSection, whatThisMeasuresSection, signalLimitationsSection, recommendedWatchSection),
  };
}

// ─── 9. Migration map insight ─────────────────────────────────────────────────

export function buildMigrationMapInsight(
  migration: CustomerMigrationMapResult,
  bankName: string,
  resolveLabel?: (id: string) => string,
): AwarenessInsightResult | null {
  if (!migration.hasData) return null;

  const driftRate = migration.driftRateAmongSelectedMultiBankUsers;
  const topDest = migration.topMigrationCompetitor
    ? (resolveLabel ? resolveLabel(migration.topMigrationCompetitor) : migration.topMigrationCompetitor)
    : null;

  const snapshot = `${fmtPct(driftRate)} of ${bankName}'s multi-banking customers show a stated preference shift away from ${bankName}${topDest ? `, with ${topDest} as the most common destination` : ''}. This is an estimated view based on stated preference, not confirmed account closures.`;

  const driftRateSection = `PREFERENCE SHIFT RATE: ${fmtPct(driftRate)} of ${bankName}'s multi-banking customers (those who use at least one other bank) have stated a preference for another institution as their primary bank. The base for this calculation is ${migration.selectedBankMultiBankBase} multi-banking customers within ${bankName}'s user base. ${
    driftRate >= 30
      ? `A rate above 30% is an elevated signal. A significant portion of multi-banking customers appear to be deprioritising ${bankName} in their stated preference hierarchy.`
      : driftRate >= 15
      ? `A rate in this range is moderate. Some customer preference movement is expected in competitive multi-banking environments, but the rate warrants ongoing monitoring.`
      : `A low preference shift rate suggests ${bankName} is retaining primary-bank preference among most of its multi-banking customers, even where they maintain parallel accounts elsewhere.`
  }`;

  const topDestinationSection = `TOP DESTINATION: ${
    topDest && migration.rows.length > 0
      ? `${topDest} is the most frequently cited preference destination among ${bankName} customers who prefer another bank, appearing in ${fmtPct(migration.rows[0]?.share ?? 0)} of migration cases. ${migration.rows.length > 1 ? `Other notable destinations include ${migration.rows.slice(1, 3).map((r) => resolveLabel ? resolveLabel(r.competitor) : r.competitor).join(' and ')}.` : ''} Understanding the specific product or service attributes driving this preference is the next step in developing a targeted retention response.`
      : `No dominant destination bank has been identified from available data. Preference drift is distributed across multiple competitors rather than concentrated in one.`
  }`;

  const signalBasisSection = `WHAT THIS MEASURES: Drift rate is calculated from stated preferences among multi-banking customers in the survey sample. It measures which bank customers say they prefer as their primary institution — not which bank they have actually transferred accounts or balances to. A customer in this category may still maintain their ${bankName} account and continue using it actively. This is a directional estimate that identifies the direction of stated preference, and is most useful as an early warning indicator rather than a direct measure of revenue loss. The total sample for this analysis is ${migration.selectedBankUserBase} ${bankName} users.`;

  const retentionPrioritySection = `RETENTION PRIORITY: ${
    driftRate >= 30
      ? `An elevated preference shift rate among multi-banking customers should be treated as an early warning. Intervention priorities include identifying product gaps that competitor banks are filling, reviewing onboarding and engagement quality for multi-bank customers, and creating targeted retention offers for customers at risk of consolidating their primary relationship elsewhere.`
      : driftRate >= 15
      ? `This rate warrants a structured retention review. Segmenting customers who prefer another bank by tenure, product depth, and the specific destination bank can identify whether drift is concentrated in a particular customer profile or spread across the base.`
      : `The current preference shift rate is manageable, but the rate should be tracked over successive periods. A sustained increase is more informative than any single-period reading.`
  }${migration.lowSample ? ' NOTE: Sample size is below the recommended threshold — treat these findings as indicative until more data is collected.' : ''}`;

  return {
    snapshot,
    detail: s(driftRateSection, topDestinationSection, signalBasisSection, retentionPrioritySection),
  };
}

// ─── 10. Win/loss insight ─────────────────────────────────────────────────────

export function buildWinLossInsight(
  winLoss: CompetitiveIntelligenceDiagnostics['winLoss'],
  hasObservedWinLoss: boolean,
  bankName: string,
): AwarenessInsightResult | null {
  if (winLoss.rows.length === 0) return null;

  const { rows, overallWinRate } = winLoss;
  const bestWin = [...rows].sort((a, b) => b.winRate - a.winRate)[0];
  const worstLoss = [...rows].sort((a, b) => a.winRate - b.winRate)[0];

  const balanceLabel =
    overallWinRate > 55 ? 'net positive'
    : overallWinRate < 45 ? 'net negative'
    : 'broadly neutral';

  const snapshot = hasObservedWinLoss
    ? `${bankName} shows a ${balanceLabel} competitive balance with an overall win rate of ${fmtPct(overallWinRate)} across ${rows.length} tracked competitor${rows.length !== 1 ? 's' : ''}.`
    : `Based on estimated competitive signals, ${bankName} shows a ${balanceLabel} balance with an estimated win rate of ${fmtPct(overallWinRate)}. These are directional figures derived from estimated indicators, not confirmed customer movements.`;

  const balanceReadingSection = `BALANCE READING: ${
    hasObservedWinLoss
      ? `Observed competitive flows show an overall win rate of ${fmtPct(overallWinRate)} across ${rows.length} tracked competitor${rows.length !== 1 ? 's' : ''}. A win rate above 50% means ${bankName} is gaining more customers from competitors than it is losing to them; below 50% means the reverse.`
      : `Estimated competitive flows indicate an overall win rate of ${fmtPct(overallWinRate)} across ${rows.length} tracked competitor${rows.length !== 1 ? 's' : ''}. These figures are derived from stated preference changes in panel data and should be treated as directional estimates, not confirmed transaction counts.`
  }`;

  const dataSourceSection = hasObservedWinLoss
    ? `OBSERVED DATA: Win/loss figures are based on panel transitions — customers whose recorded primary bank changed between survey periods. This is a direct measure of competitive switching, though it captures only the portion of movement visible within the survey panel.`
    : `ESTIMATED BASIS: These win/loss estimates are derived from stated preference changes across survey periods, not from confirmed account transactions or balance transfers. A customer classified as "lost" has changed their stated preferred bank — they may still hold and use their ${bankName} account. Use these figures to identify directional patterns and prioritise competitive monitoring, rather than as a precise count of customer departures.`;

  const keyOpponentSection = `KEY OPPONENT: ${
    worstLoss && worstLoss.winRate < 50
      ? `${bankName} has the lowest win rate against ${worstLoss.competitorBankName} (win rate: ${fmtPct(worstLoss.winRate)}). This means that when ${bankName} and ${worstLoss.competitorBankName} are competing for the same customer, ${bankName} loses the majority of those contests. Understanding what ${worstLoss.competitorBankName} offers that ${bankName} does not is the most direct route to improving this specific competitive record.`
      : bestWin
      ? `${bankName}'s best competitive record is against ${bestWin.competitorBankName} (win rate: ${fmtPct(bestWin.winRate)}). Building on this advantage and extending it to other competitive matchups is a viable near-term strategy.`
      : `No dominant win or loss pattern is evident from the available data.`
  }`;

  const managementPrioritySection = `MANAGEMENT PRIORITY: ${
    overallWinRate < 45 && !hasObservedWinLoss
      ? `The estimated negative balance warrants a review of the competitive acquisition and retention pipeline. Even if figures are directional, a consistently negative estimated flow over multiple periods is a reliable early warning. Identify the specific competitor interactions where the loss rate is highest and investigate root causes.`
      : overallWinRate < 45 && hasObservedWinLoss
      ? `The observed negative balance means ${bankName} is losing more competitive exchanges than it is winning. The most urgent response is to identify the segments and product lines driving the loss rate and implement targeted retention and win-back programs.`
      : overallWinRate < 50
      ? `Even with a broadly neutral balance, a win rate below 45% indicates that when competitive exchanges occur, ${bankName} loses more than it wins. Improving competitive conversion in direct matchups — through pricing, product, or experience — is the priority.`
      : `The positive or neutral balance is a healthy signal. The focus should be on sustaining and growing the win rate against the competitors where performance is weakest.`
  }`;

  return {
    snapshot,
    detail: s(balanceReadingSection, dataSourceSection, keyOpponentSection, managementPrioritySection),
  };
}

// ─── 11. Strengths and weaknesses insight ────────────────────────────────────

export function buildStrengthsWeaknessesInsight(
  relativeRows: RelativeStrengthRow[],
  relativeStrengthIndex: number,
  bankName: string,
): AwarenessInsightResult | null {
  if (relativeRows.length === 0) return null;

  const strengths = relativeRows.filter((r) => r.strengthType === 'Strength');
  const weaknesses = relativeRows.filter((r) => r.strengthType === 'Weakness');
  const sortedWeaknesses = [...weaknesses].sort((a, b) => a.relativeStrength - b.relativeStrength);
  const biggestGap = sortedWeaknesses[0];
  const topStrength = [...strengths].sort((a, b) => b.relativeStrength - a.relativeStrength)[0];

  const indexTier =
    relativeStrengthIndex >= 60 ? 'above average'
    : relativeStrengthIndex >= 40 ? 'average'
    : 'below average';

  const snapshot = `${bankName}'s overall relative strength index is ${fmt(relativeStrengthIndex, 0)}/100 (${indexTier}), with ${strengths.length} metric${strengths.length !== 1 ? 's' : ''} above market average and ${weaknesses.length} below${biggestGap ? ` — the largest gap is in ${biggestGap.metric}` : ''}.`;

  const strengthProfileSection = `STRENGTH PROFILE: ${bankName} scores above the market average on ${strengths.length} of ${relativeRows.length} tracked metrics. ${
    topStrength
      ? `The strongest competitive advantage is in ${topStrength.metric} (${bankName}: ${fmt(topStrength.yourValue)}, market avg: ${fmt(topStrength.marketAvg)}, relative strength: +${fmtPct(topStrength.relativeStrength - 100)}). This metric represents a differentiating advantage that can support customer acquisition and retention messaging.`
      : `No metrics currently exceed the market average. Building a clear competitive advantage in at least one dimension is the strategic priority.`
  }`;

  const largestGapSection = `LARGEST GAP: ${
    biggestGap
      ? `The most significant underperformance relative to market average is in ${biggestGap.metric}. ${bankName} scores ${fmt(biggestGap.yourValue)}, against a market average of ${fmt(biggestGap.marketAvg)} — a relative strength index of ${fmtPct(biggestGap.relativeStrength)} (100% = market average). Closing this gap is the highest-priority investment for competitive parity.`
      : `No meaningful underperformance gaps are identified at this time.`
  }`;

  const competitiveExposureSection = `COMPETITIVE EXPOSURE: ${
    weaknesses.length > strengths.length
      ? `${bankName} underperforms the market average on more metrics than it outperforms. This broad weakness profile creates multiple competitive exposure points that competitors can exploit in acquisition messaging. Prioritise closing the largest gaps before investing in extending existing strengths.`
      : weaknesses.length === 0
      ? `${bankName} outperforms the market average on all tracked metrics, which is an unusually strong competitive position. The risk to monitor is complacency — competitors may be closing gaps that are not yet visible in this data.`
      : `${bankName} has a mixed profile — above average in some areas and below average in others. This is typical for mid-tier competitors. The priority is ensuring that strength areas are commercially visible to customers and that weakness areas are not actively driving attrition.`
  }`;

  const focusAreaSection = `FOCUS AREA: ${
    biggestGap
      ? `Improving performance in ${biggestGap.metric} should be treated as a competitive priority. A gap of this magnitude is likely visible to customers who are actively comparing options, and may be contributing to loss rates in competitive exchanges. Identify the operational or product changes that would most efficiently close this gap.`
      : topStrength
      ? `With no significant weakness gaps, the focus should be on extending the lead in ${topStrength.metric} and ensuring it is prominently communicated in customer-facing marketing and sales materials.`
      : `Build a structured programme to improve performance on the weakest tracked metric in each successive period.`
  }`;

  return {
    snapshot,
    detail: s(strengthProfileSection, largestGapSection, competitiveExposureSection, focusAreaSection),
  };
}

// ─── 12. Whitespace insight ────────────────────────────────────────────────────

export function buildWhitespaceInsight(
  ageRows: WhiteSpaceRow[],
  genderRows: WhiteSpaceRow[],
  bankName: string,
): AwarenessInsightResult | null {
  if (ageRows.length === 0 && genderRows.length === 0) return null;

  const allRows = [...ageRows, ...genderRows];
  const highOpp = allRows.filter((r) => r.opportunity === 'High').sort((a, b) => b.gap - a.gap);
  const topOpp = highOpp[0] ?? allRows.sort((a, b) => b.gap - a.gap)[0];

  const topAgeOpp = ageRows.filter((r) => r.opportunity === 'High').sort((a, b) => b.gap - a.gap)[0]
    ?? ageRows.sort((a, b) => b.gap - a.gap)[0];
  const topGenderOpp = genderRows.filter((r) => r.opportunity === 'High').sort((a, b) => b.gap - a.gap)[0]
    ?? genderRows.sort((a, b) => b.gap - a.gap)[0];

  const snapshot = topOpp
    ? `The largest white-space opportunity for ${bankName} is the ${topOpp.segment} segment, where market penetration averages ${fmtPct(topOpp.marketAvg)} but ${bankName} reaches only ${fmtPct(topOpp.yourPenetration)} — a ${fmtPct(topOpp.gap)} point gap.`
    : `White-space analysis identifies segments where ${bankName} is underrepresented relative to market averages across age and gender dimensions.`;

  const ageOpportunitiesSection = `AGE OPPORTUNITIES: ${
    ageRows.length > 0
      ? ageRows.map((r) => `${r.segment}: market avg ${fmtPct(r.marketAvg)}, ${bankName} ${fmtPct(r.yourPenetration)}, gap ${r.gap > 0 ? '-' : '+'}${fmtPct(Math.abs(r.gap))} (${r.opportunity} opportunity)`).join('; ') + `. ${topAgeOpp ? `The highest-priority age segment is ${topAgeOpp.segment}, where ${bankName} is ${fmtPct(topAgeOpp.gap)} points behind the market average. ${topAgeOpp.opportunity === 'High' ? 'This represents a material acquisition opportunity.' : 'There is moderate scope for growth in this segment.'}` : ''}`
      : `No age segment data is available for this period.`
  }`;

  const genderOpportunitiesSection = `GENDER OPPORTUNITIES: ${
    genderRows.length > 0
      ? genderRows.map((r) => `${r.segment}: market avg ${fmtPct(r.marketAvg)}, ${bankName} ${fmtPct(r.yourPenetration)}, gap ${r.gap > 0 ? '-' : '+'}${fmtPct(Math.abs(r.gap))} (${r.opportunity} opportunity)`).join('; ') + `. ${topGenderOpp ? `The highest-priority gender segment is ${topGenderOpp.segment}, where ${bankName} is ${fmtPct(topGenderOpp.gap)} points behind the market average.` : ''}`
      : `No gender segment data is available for this period.`
  }`;

  const topPrioritySection = `TOP PRIORITY: ${
    topOpp
      ? `${topOpp.segment} is the highest-priority white-space segment (${topOpp.opportunity} opportunity, ${fmtPct(topOpp.gap)} point gap). A gap of this size between market average penetration and ${bankName}'s current penetration means the bank is materially underrepresented in this segment. Closing even a portion of this gap would add meaningful scale.`
      : `No single dominant white-space priority has been identified. Focus should be on the segment with the largest absolute gap between market penetration and ${bankName}'s current reach.`
  }`;

  const acquisitionLeverSection = `ACQUISITION LEVER: White-space segments are most effectively addressed through targeted acquisition campaigns, product positioning tailored to the segment's specific financial needs, and channel strategies that reach the underserved demographic. ${
    topOpp?.segment?.toLowerCase().includes('young') || topOpp?.segment?.toLowerCase().includes('18') || topOpp?.segment?.toLowerCase().includes('25')
      ? `For younger age segments, digital-first onboarding, student and early-career product offerings, and social-channel marketing tend to be the most effective acquisition levers.`
      : topOpp?.segment?.toLowerCase().includes('female') || topOpp?.segment?.toLowerCase().includes('women')
      ? `For female segments, tailored financial literacy programs, women's financial planning products, and representation in marketing materials have shown success in comparable markets.`
      : `Identify the specific barriers to adoption in the priority segment — whether product, price, channel, or awareness — before committing to an acquisition strategy.`
  } White-space analysis shows where opportunity exists; market research with the specific segment will reveal what ${bankName} needs to offer to capture it.`;

  return {
    snapshot,
    detail: s(ageOpportunitiesSection, genderOpportunitiesSection, topPrioritySection, acquisitionLeverSection),
  };
}

// ─── 13. Risk signals insight ──────────────────────────────────────────────────

export function buildRiskSignalsInsight(
  threats: CompetitiveIntelligenceDiagnostics['threats'],
  bankName: string,
): AwarenessInsightResult | null {
  if (threats.rows.length === 0 && threats.indicators.length === 0) return null;

  const { rows, indicators } = threats;
  const critical = rows.filter((r) => r.threatLevel === 'Critical');
  const monitor = rows.filter((r) => r.threatLevel === 'Monitor');
  const emerging = rows.filter((r) => r.threatLevel === 'Emerging');
  const redIndicators = indicators.filter((i) => i.alert === 'Red');
  const yellowIndicators = indicators.filter((i) => i.alert === 'Yellow');

  const topThreat = [...rows].sort((a, b) => b.likelihoodScore * b.impactScore - a.likelihoodScore * a.impactScore)[0];

  const snapshot = `${bankName} faces ${critical.length} critical-level threat${critical.length !== 1 ? 's' : ''} and ${redIndicators.length} red-alert indicator${redIndicators.length !== 1 ? 's' : ''} — these are estimated warning indicators based on competitive momentum and overlap patterns, not confirmed customer losses.`;

  const threatLandscapeSection = `THREAT LANDSCAPE: ${rows.length} competitors are assessed for threat level in this period: ${critical.length} Critical, ${monitor.length} Monitor, ${emerging.length} Emerging, ${rows.length - critical.length - monitor.length - emerging.length} Low Priority. ${
    critical.length > 0
      ? `Critical-level threats require active management attention. The banks in this category — ${critical.map((r) => r.competitorBankName).join(', ')} — combine high likelihood of competitive impact with significant potential effect on ${bankName}'s share or customer base.`
      : monitor.length > 0
      ? `No competitors are at critical threat level, but ${monitor.length} are classified as Monitor, meaning their trajectory warrants structured tracking. Early intervention is easier than reactive response once a competitor has established momentum.`
      : `The current competitive threat level is broadly manageable. No competitors have been flagged at critical or monitor level, though this should be reviewed against actual market dynamics on a regular basis.`
  }`;

  const indicatorSummarySection = `INDICATOR SUMMARY: ${
    indicators.length > 0
      ? `${indicators.length} competitive health indicators are tracked. ${redIndicators.length > 0 ? `${redIndicators.length} are at red alert: ${redIndicators.map((i) => i.label).join(', ')}. Red alerts indicate that the indicator has crossed a threshold associated with competitive risk.` : 'No indicators are at red alert.'} ${yellowIndicators.length > 0 ? `${yellowIndicators.length} are at yellow: ${yellowIndicators.map((i) => i.label).join(', ')}. Yellow indicators are trending in a concerning direction but have not yet reached critical thresholds.` : ''}`
      : `No structured competitive indicators are available for this period.`
  }`;

  const signalBasisSection = `WHAT THIS MEASURES: Threat levels are calculated from estimated scoring across competitive momentum and customer overlap signals — they are warning indicators, not confirmed evidence of customer loss or revenue impact. A competitor classified as Critical has demonstrated a combination of high likelihood of competitive action (based on share trajectory and brand investment signals) and high potential impact (based on overlap with ${bankName}'s customer base). These classifications should be used to prioritise monitoring and proactive response, not to quantify losses that have already occurred.`;

  const watchListSection = `WATCH LIST: ${
    topThreat
      ? `${topThreat.competitorBankName} scores highest on the combined threat assessment (likelihood: ${topThreat.likelihoodScore}, impact: ${topThreat.impactScore}, level: ${topThreat.threatLevel}). ${
          topThreat.threatLevel === 'Critical'
            ? `This competitor should be the subject of active competitive intelligence gathering, including tracking their product launches, pricing changes, marketing investment, and any share-of-voice changes that might signal an upcoming acquisition push.`
            : topThreat.threatLevel === 'Monitor'
            ? `Monitor this competitor's trajectory over the next two periods. If likelihood or impact scores increase, escalate to active management response.`
            : `This competitor is emerging but not yet at a level requiring active response. Maintain passive monitoring and reassess if conditions change.`
        }`
      : `No dominant threat has been identified. Continue monitoring the full competitive set with standard frequency.`
  }${rows.length > 1 ? ` The full threat list covers ${rows.length} competitors, providing a comprehensive view of the competitive risk horizon.` : ''}`;

  return {
    snapshot,
    detail: s(threatLandscapeSection, indicatorSummarySection, signalBasisSection, watchListSection),
  };
}
