import { BANKS } from '@/constants';
import { CountryCode, SurveyResponse } from '@/types';

export type TimeWindow = 'all' | '30d' | '90d' | '12m';
export type LoyaltyBucket = 'Committed' | 'Favors' | 'Potential' | 'Accessibles' | 'Rejectors';

const MOMENTUM_WEIGHTS = {
  awarenessGrowth: 0.15,
  consideration: 0.25,
  conversion: 0.25,
  retention: 0.2,
  adoption: 0.15,
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface SubscriberFilters {
  country: CountryCode;
  bankId: string;
  timeWindow: TimeWindow;
  ageGroups: string[];
  genders: string[];
}

export interface BankMetrics {
  bankId: string;
  sample: number;
  aware: number;
  topOfMind: number;
  spontaneous: number;
  aided: number;
  awarenessQuality: number;
  everUsed: number;
  currentUsing: number;
  preferred: number;
  trialRate: number;
  retentionRate: number;
  preferenceRate: number;
  lapseRate: number;
  considerationRate: number;
  marketPenetration: number;
  nps: number;
  promoters: number;
  passives: number;
  detractors: number;
  loyalty: Record<LoyaltyBucket, number>;
  loyaltyCounts: Record<LoyaltyBucket, number>;
  loyaltyIndex: number;
  momentum: number;
}

export interface IntentSummary {
  averageIntent: number;
  highIntentPct: number;
  veryHighPct: number;
  highPct: number;
  mediumPct: number;
  lowPct: number;
  veryLowPct: number;
  highIntentNonUserPct: number;
  highIntentCurrentUserPct: number;
  highIntentNonUserCount: number;
  lowIntentCurrentUserCount: number;
  responseBase: number;
}

export interface TrendPoint {
  month: string;
  awareness: number;
  usage: number;
  nps: number;
}

export interface CompetitiveRow {
  bankId: string;
  bankName: string;
  topOfMind: number;
  awareness: number;
  currentUsage: number;
  nps: number;
  momentum: number;
  shareOfVoice: number;
}

export interface GeographyRow {
  country: CountryCode;
  sample: number;
  awareness: number;
  usage: number;
  nps: number;
}

export interface DemographicSummary {
  sample: number;
  age: Array<{ label: string; value: number }>;
  gender: Array<{ label: string; value: number }>;
  employment: Array<{ label: string; value: number }>;
  education: Array<{ label: string; value: number }>;
}

export interface DemographicCohortRow {
  segment: string;
  sample: number;
  samplePct: number;
  awareness: number;
  everUsed: number;
  currentUsage: number;
  preferred: number;
  nps: number;
  avgIntent: number;
  multiBankRate: number;
}

export interface DemographicOpportunityRow {
  dimension: 'age' | 'gender' | 'employment' | 'education';
  segment: string;
  currentUsage: number;
  bestInDimension: number;
  usageGap: number;
  nps: number;
  priority: 'High' | 'Medium' | 'Low';
}

export interface DemographicDiagnostics {
  sample: number;
  ageRows: DemographicCohortRow[];
  genderRows: DemographicCohortRow[];
  employmentRows: DemographicCohortRow[];
  educationRows: DemographicCohortRow[];
  opportunities: DemographicOpportunityRow[];
  highValueSegments: Array<{ dimension: string; segment: string; score: number; preferred: number; nps: number }>;
}

export interface UsageOverlapRow {
  bankId: string;
  bankName: string;
  overlapCount: number;
  overlapPct: number;
}

export interface UsageDropoffStage {
  stage: 'Aware -> Ever Used' | 'Ever Used -> Currently Using' | 'Currently Using -> Preferred (BUMO)';
  lostCount: number;
  dropoffPct: number;
  frictionScore: number;
  diagnosis: string;
}

export interface UsageOpportunity {
  name: string;
  size: number;
  pct: number;
  note: string;
}

export interface UsageDiagnostics {
  sample: number;
  awareCount: number;
  everCount: number;
  currentCount: number;
  preferredCount: number;
  trialRate: number;
  currentUsageRate: number;
  retentionRate: number;
  churnRate: number;
  preferenceRate: number;
  bumoPenetration: number;
  lapseRate: number;
  avgBanksPerUser: number;
  multiBankingPct: number;
  singleBankerPct: number;
  dualBankerPct: number;
  multiBankerPct: number;
  primaryPositionInMultiPct: number;
  nonTriersCount: number;
  lapsedUsersCount: number;
  secondaryUsersCount: number;
  primaryUsersCount: number;
  overlapRows: UsageOverlapRow[];
  dropoffStages: UsageDropoffStage[];
  highestFrictionStage: string;
  funnelHealthDiagnosis: string;
  positionLabel: string;
  usageMedian: number;
  retentionMedian: number;
  opportunities: UsageOpportunity[];
}

export interface LoyaltySegmentProfile {
  segment: LoyaltyBucket;
  count: number;
  pct: number;
  avgNps: number;
  avgIntent: number;
  topAge: string;
  topGender: string;
  multiBankPct: number;
}

export interface LoyaltyMovementRow {
  segment: LoyaltyBucket;
  currentPct: number;
  previousPct: number;
  deltaPct: number;
}

export interface LoyaltyDiagnostics {
  awareCount: number;
  segmentCounts: Record<LoyaltyBucket, number>;
  segmentPcts: Record<LoyaltyBucket, number>;
  loyaltyIndex: number;
  nps: number;
  movementRows: LoyaltyMovementRow[];
  profileCards: LoyaltySegmentProfile[];
  awareToPotential: number;
  potentialToFavors: number;
  favorsToCommitted: number;
}

export type MomentumComponentKey =
  | 'awarenessGrowth'
  | 'consideration'
  | 'conversion'
  | 'retention'
  | 'adoption';

export interface MomentumComponentScores {
  awarenessGrowth: number;
  consideration: number;
  conversion: number;
  retention: number;
  adoption: number;
}

export interface MomentumContributionRow {
  key: MomentumComponentKey;
  label: string;
  weightPct: number;
  score: number;
  contribution: number;
  shareOfTotal: number;
}

export interface MomentumSensitivityRow {
  key: MomentumComponentKey;
  label: string;
  currentScore: number;
  improvedScore: number;
  momentumGain: number;
}

export interface MomentumPriorityRow {
  key: MomentumComponentKey;
  label: string;
  currentScore: number;
  gapToExcellence: number;
  weightPct: number;
  difficulty: number;
  priorityScore: number;
}

export interface MomentumTrendPoint {
  month: string;
  score: number;
  delta: number | null;
}

export interface MomentumForecastPoint {
  month: string;
  projectedScore: number;
}

export interface CompetitiveMomentumRow {
  bankId: string;
  bankName: string;
  score: number;
  previousScore: number;
  delta: number;
  growthRate: number | null;
  components: MomentumComponentScores;
}

export interface MomentumDiagnostics {
  score: number;
  status: 'Excellent Momentum' | 'Good Momentum' | 'Moderate Momentum' | 'Weak Momentum' | 'Crisis Momentum';
  strategy: 'Scale and defend' | 'Optimize and grow' | 'Fix and rebuild' | 'Urgent intervention' | 'Emergency turnaround';
  components: MomentumComponentScores;
  contributions: MomentumContributionRow[];
  sensitivity: MomentumSensitivityRow[];
  priorities: MomentumPriorityRow[];
  trends: MomentumTrendPoint[];
  velocity: number;
  velocityLabel: 'Accelerating' | 'Steady growth' | 'Decelerating';
  forecast: MomentumForecastPoint[];
  volatilityCv: number;
  volatilityLabel: 'Low volatility' | 'Moderate volatility' | 'High volatility';
  competitiveRows: CompetitiveMomentumRow[];
  selectedRank: number;
  gapToLeader: number;
}

export interface MarketShareRow {
  bankId: string;
  bankName: string;
  preferredCount: number;
  marketShare: number;
  marketShareDelta: number;
  shareOfVoice: number;
  sovVsShareGap: number;
}

export interface PortfolioCompositionRow {
  label: 'Exclusive' | 'Bank + 1 Other' | 'Bank + 2+ Others';
  count: number;
  pct: number;
}

export interface CompetitiveSetRow {
  bankId: string;
  bankName: string;
  overlapPct: number;
  competitorType: 'Direct' | 'Moderate' | 'Indirect';
}

export interface PositioningRow {
  bankId: string;
  bankName: string;
  marketShare: number;
  nps: number;
  position: 'Leader' | 'Quality Challenger' | 'Vulnerable Leader' | 'Struggler';
  tier: 'Tier 1: Market Leaders' | 'Tier 2: Strong Challengers' | 'Tier 3: Niche Players';
}

export interface WalletShareCompetitorRow {
  bankId: string;
  bankName: string;
  estimatedWalletShare: number;
}

export interface WinLossRow {
  competitorBankId: string;
  competitorBankName: string;
  gainedFrom: number;
  lostTo: number;
  winRate: number;
  net: number;
}

export interface RelativeStrengthRow {
  metric: string;
  yourValue: number;
  marketAvg: number;
  relativeStrength: number;
  strengthType: 'Strength' | 'Weakness';
}

export interface WhiteSpaceRow {
  segment: string;
  marketAvg: number;
  yourPenetration: number;
  gap: number;
  opportunity: 'High' | 'Moderate' | 'Low';
}

export interface ThreatRow {
  competitorBankId: string;
  competitorBankName: string;
  likelihoodScore: number;
  impactScore: number;
  threatLevel: 'Critical' | 'Monitor' | 'Emerging' | 'Low Priority';
}

export interface CompetitiveIntelligenceDiagnostics {
  marketStructure: {
    marketRows: MarketShareRow[];
    hhi: number;
    concentrationLabel: 'Highly Competitive' | 'Moderately Concentrated' | 'Highly Concentrated';
  };
  customerBehavior: {
    averageBanksPerCustomer: number;
    multiBankingRate: number;
    overlapRows: UsageOverlapRow[];
    portfolioComposition: PortfolioCompositionRow[];
  };
  competitiveAnalysis: {
    directCompetitors: CompetitiveSetRow[];
    positioningRows: PositioningRow[];
  };
  shareOfWallet: {
    estimatedWalletShare: number;
    byCompetitor: WalletShareCompetitorRow[];
  };
  winLoss: {
    rows: WinLossRow[];
    overallWinRate: number;
    hasPanelTransitions: boolean;
  };
  strengthsWeaknesses: {
    relativeRows: RelativeStrengthRow[];
    relativeStrengthIndex: number;
  };
  whiteSpace: {
    ageRows: WhiteSpaceRow[];
    genderRows: WhiteSpaceRow[];
  };
  threats: {
    rows: ThreatRow[];
    indicators: Array<{ label: string; status: string; alert: 'Red' | 'Yellow' | 'Green' }>;
  };
}

export interface TrendMonthlyPoint {
  month: string;
  awareness: number;
  usage: number;
  nps: number;
}

export interface TrendForecastDiagnostics {
  monthly: TrendMonthlyPoint[];
  periodComparisons: {
    momPp: number | null;
    momPct: number | null;
    qoqPp: number | null;
    qoqPct: number | null;
    yoyPp: number | null;
    yoyPct: number | null;
    ytdAverage: number;
  };
  growth: {
    averageGrowthPct: number;
    cagrPct: number | null;
    exponentialSignal: boolean;
  };
  volatility: {
    stdDev: number;
    cv: number;
    range: number;
    stabilityScore: number;
    reversals: number;
    label: 'Low volatility' | 'Moderate volatility' | 'High volatility';
  };
  seasonality: {
    currentMonthIndex: number | null;
    strongestMonth: string | null;
    weakestMonth: string | null;
  };
  forecast: {
    smaNext: number | null;
    wmaNext: number | null;
    regressionNext: number | null;
    regressionR2: number | null;
    expSmoothingNext: number | null;
    seasonalAdjustedNext: number | null;
    confidenceLow: number | null;
    confidenceHigh: number | null;
  };
  signal: {
    slope: number;
    isSignificantSignal: boolean;
    diagnosis: string;
  };
  highlights: string[];
}

const round = (value: number) => Math.round(value);
const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

const responseCountry = (response: SurveyResponse): CountryCode | null =>
  (response.selected_country || response.country || null) as CountryCode | null;

const parseTimestamp = (value?: string): number | null => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

export const filterResponsesForDashboard = (responses: SurveyResponse[], filters: SubscriberFilters): SurveyResponse[] => {
  const now = Date.now();
  const windowStart = (() => {
    if (filters.timeWindow === '30d') return now - 30 * 24 * 60 * 60 * 1000;
    if (filters.timeWindow === '90d') return now - 90 * 24 * 60 * 60 * 1000;
    if (filters.timeWindow === '12m') return now - 365 * 24 * 60 * 60 * 1000;
    return null;
  })();

  return responses.filter((response) => {
    const country = responseCountry(response);
    if (!country || country !== filters.country) return false;

    if (filters.ageGroups.length > 0 && (!response.b2_age || !filters.ageGroups.includes(response.b2_age))) {
      return false;
    }
    if (filters.genders.length > 0 && (!response.gender || !filters.genders.includes(response.gender))) {
      return false;
    }

    if (windowStart !== null) {
      const ts = parseTimestamp(response.timestamp);
      if (ts === null || ts < windowStart) return false;
    }
    return true;
  });
};

const isAwareOfBank = (response: SurveyResponse, bankId: string) =>
  response.c1_recognized_bank_id === bankId ||
  (response.c2_recognized_bank_ids || []).includes(bankId) ||
  (response.c3_aware_banks || []).includes(bankId);

const isSpontaneousBank = (response: SurveyResponse, bankId: string) =>
  response.c1_recognized_bank_id === bankId || (response.c2_recognized_bank_ids || []).includes(bankId);

const isCurrentBank = (response: SurveyResponse, bankId: string) => (response.c5_currently_using || []).includes(bankId);
const isEverBank = (response: SurveyResponse, bankId: string) => (response.c4_ever_used || []).includes(bankId);

const isPreferredBank = (response: SurveyResponse, bankId: string) =>
  response.preferred_bank === bankId;

const getIntentForBank = (response: SurveyResponse, bankId: string) => {
  if (response.d2_future_intent && typeof response.d2_future_intent === 'object' && bankId in response.d2_future_intent) {
    return response.d2_future_intent[bankId] || 0;
  }
  return 0;
};

const getNpsForBank = (response: SurveyResponse, bankId: string) => {
  if (response.d7_nps && typeof response.d7_nps === 'object' && bankId in response.d7_nps) {
    return response.d7_nps[bankId];
  }
  if (typeof response.c10_nps === 'number') return response.c10_nps;
  return null;
};

const loyaltySegment = (response: SurveyResponse, bankId: string): LoyaltyBucket | null => {
  const aware = isAwareOfBank(response, bankId);
  if (!aware) return null;

  const current = isCurrentBank(response, bankId);
  const ever = isEverBank(response, bankId);
  const preferred = isPreferredBank(response, bankId);
  const committed = response.committed_bank === bankId;
  const intent = getIntentForBank(response, bankId);
  const nps = getNpsForBank(response, bankId) ?? 0;
  const relevant = (response.d3_relevance || []).includes(bankId);

  if (current) {
    if (preferred && committed && nps >= 9) return 'Committed';
    return 'Favors';
  }

  if (ever) {
    if (intent >= 7 && nps >= 7) return 'Potential';
    if (intent <= 3 || nps <= 6) return 'Rejectors';
    return 'Accessibles';
  }

  if (intent >= 7 && (relevant || intent >= 8)) return 'Potential';
  if (intent >= 4) return 'Accessibles';
  return 'Rejectors';
};

const momentumFromComponents = (
  awarenessGrowthScore: number,
  considerationRate: number,
  conversionRate: number,
  retentionRate: number,
  adoptionRate: number,
) => {
  const weighted =
    awarenessGrowthScore * MOMENTUM_WEIGHTS.awarenessGrowth +
    considerationRate * MOMENTUM_WEIGHTS.consideration +
    conversionRate * MOMENTUM_WEIGHTS.conversion +
    retentionRate * MOMENTUM_WEIGHTS.retention +
    adoptionRate * MOMENTUM_WEIGHTS.adoption;
  return Math.max(0, Math.min(100, round(weighted)));
};

const growthToScore = (growthPoints: number) => {
  if (growthPoints >= 10) return 100;
  if (growthPoints <= -10) return 0;
  return round(((growthPoints + 10) / 20) * 100);
};

export const computeBankMetrics = (
  responses: SurveyResponse[],
  bankId: string,
  previousAwareness: number,
): BankMetrics => {
  const sample = responses.length || 1;
  let awareCount = 0;
  let topCount = 0;
  let spontaneousCount = 0;
  let aidedCount = 0;
  let everCount = 0;
  let currentCount = 0;
  let preferredCount = 0;
  let considerCount = 0;
  let promoterCount = 0;
  let passiveCount = 0;
  let detractorCount = 0;
  let npsBase = 0;
  const loyaltyCounts: Record<LoyaltyBucket, number> = {
    Committed: 0,
    Favors: 0,
    Potential: 0,
    Accessibles: 0,
    Rejectors: 0,
  };

  responses.forEach((response) => {
    const aware = isAwareOfBank(response, bankId);
    const top = response.c1_recognized_bank_id === bankId;
    const spontaneous = isSpontaneousBank(response, bankId);
    const aided = (response.c3_aware_banks || []).includes(bankId);
    const ever = isEverBank(response, bankId);
    const current = isCurrentBank(response, bankId);
    const preferred = isPreferredBank(response, bankId);
    const intent = getIntentForBank(response, bankId);
    const considers = intent >= 7 || (response.d3_relevance || []).includes(bankId) || (response.c9_would_consider || []).includes(bankId);
    const nps = getNpsForBank(response, bankId);

    if (aware) awareCount += 1;
    if (top) topCount += 1;
    if (spontaneous) spontaneousCount += 1;
    if (aided) aidedCount += 1;
    if (ever) everCount += 1;
    if (current) currentCount += 1;
    if (preferred) preferredCount += 1;
    if (considers) considerCount += 1;

    if (nps !== null && (ever || current)) {
      npsBase += 1;
      if (nps >= 9) promoterCount += 1;
      else if (nps >= 7) passiveCount += 1;
      else detractorCount += 1;
    }

    const segment = loyaltySegment(response, bankId);
    if (segment) loyaltyCounts[segment] += 1;
  });

  const awareness = pct(awareCount, sample);
  const topOfMind = pct(topCount, sample);
  const spontaneous = pct(spontaneousCount, sample);
  const aided = pct(aidedCount, sample);
  const everUsed = pct(everCount, sample);
  const currentUsing = pct(currentCount, sample);
  const preferred = pct(preferredCount, sample);
  const trialRate = pct(everCount, awareCount);
  const retentionRate = pct(currentCount, everCount);
  const preferenceRate = pct(preferredCount, currentCount);
  const considerationRate = pct(considerCount, awareCount);
  const lapseRate = pct(Math.max(everCount - currentCount, 0), everCount);
  const awarenessQuality = pct(topCount, awareCount);
  const promoterPct = pct(promoterCount, npsBase);
  const detractorPct = pct(detractorCount, npsBase);
  const nps = round(promoterPct - detractorPct);

  const loyaltyAwareTotal = Object.values(loyaltyCounts).reduce((sum, v) => sum + v, 0);
  const loyalty: Record<LoyaltyBucket, number> = {
    Committed: round(pct(loyaltyCounts.Committed, loyaltyAwareTotal)),
    Favors: round(pct(loyaltyCounts.Favors, loyaltyAwareTotal)),
    Potential: round(pct(loyaltyCounts.Potential, loyaltyAwareTotal)),
    Accessibles: round(pct(loyaltyCounts.Accessibles, loyaltyAwareTotal)),
    Rejectors: round(pct(loyaltyCounts.Rejectors, loyaltyAwareTotal)),
  };
  const loyaltyIndexDen = loyaltyAwareTotal || 1;
  const loyaltyIndexRaw =
    loyaltyCounts.Committed * 100 +
    loyaltyCounts.Favors * 70 +
    loyaltyCounts.Potential * 40 +
    loyaltyCounts.Accessibles * 20;
  const loyaltyIndex = round(loyaltyIndexRaw / loyaltyIndexDen);

  const awarenessGrowthScore = growthToScore(awareness - previousAwareness);
  const momentum = momentumFromComponents(awarenessGrowthScore, considerationRate, trialRate, retentionRate, preferenceRate);

  return {
    bankId,
    sample,
    aware: round(awareness),
    topOfMind: round(topOfMind),
    spontaneous: round(spontaneous),
    aided: round(aided),
    awarenessQuality: round(awarenessQuality),
    everUsed: round(everUsed),
    currentUsing: round(currentUsing),
    preferred: round(preferred),
    trialRate: round(trialRate),
    retentionRate: round(retentionRate),
    preferenceRate: round(preferenceRate),
    lapseRate: round(lapseRate),
    considerationRate: round(considerationRate),
    marketPenetration: round(currentUsing),
    nps,
    promoters: round(promoterPct),
    passives: round(pct(passiveCount, npsBase)),
    detractors: round(detractorPct),
    loyalty,
    loyaltyCounts,
    loyaltyIndex,
    momentum,
  };
};

export const computeIntentSummary = (
  responses: SurveyResponse[],
  bankId: string,
): IntentSummary => {
  let scoredAware = 0;
  let totalScore = 0;
  let veryHigh = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  let veryLow = 0;
  let currentUsers = 0;
  let nonUsers = 0;
  let highIntentCurrentUsers = 0;
  let highIntentNonUsers = 0;
  let lowIntentCurrentUsers = 0;

  responses.forEach((response) => {
    if (!isAwareOfBank(response, bankId)) return;
    const intent = getIntentForBank(response, bankId);
    if (!Number.isFinite(intent)) return;

    scoredAware += 1;
    totalScore += intent;

    if (intent >= 9) veryHigh += 1;
    else if (intent >= 7) high += 1;
    else if (intent >= 5) medium += 1;
    else if (intent >= 3) low += 1;
    else veryLow += 1;

    const current = isCurrentBank(response, bankId);
    if (current) {
      currentUsers += 1;
      if (intent >= 7) highIntentCurrentUsers += 1;
      if (intent <= 6) lowIntentCurrentUsers += 1;
    } else {
      nonUsers += 1;
      if (intent >= 7) highIntentNonUsers += 1;
    }
  });

  return {
    averageIntent: round(scoredAware > 0 ? (totalScore / scoredAware) * 10 : 0) / 10,
    highIntentPct: round(pct(veryHigh + high, scoredAware)),
    veryHighPct: round(pct(veryHigh, scoredAware)),
    highPct: round(pct(high, scoredAware)),
    mediumPct: round(pct(medium, scoredAware)),
    lowPct: round(pct(low, scoredAware)),
    veryLowPct: round(pct(veryLow, scoredAware)),
    highIntentNonUserPct: round(pct(highIntentNonUsers, nonUsers)),
    highIntentCurrentUserPct: round(pct(highIntentCurrentUsers, currentUsers)),
    highIntentNonUserCount: highIntentNonUsers,
    lowIntentCurrentUserCount: lowIntentCurrentUsers,
    responseBase: scoredAware,
  };
};

export const computeUsageDiagnostics = (
  responses: SurveyResponse[],
  country: CountryCode,
  bankId: string,
): UsageDiagnostics => {
  const sample = responses.length || 1;
  const awareResponses = responses.filter((response) => isAwareOfBank(response, bankId));
  const awareCount = awareResponses.length;
  const everResponses = awareResponses.filter((response) => isEverBank(response, bankId));
  const everCount = everResponses.length;
  const currentResponses = awareResponses.filter((response) => isCurrentBank(response, bankId));
  const currentCount = currentResponses.length;
  const preferredResponses = awareResponses.filter((response) => isPreferredBank(response, bankId));
  const preferredCount = preferredResponses.length;

  const trialRate = round(pct(everCount, awareCount));
  const currentUsageRate = round(pct(currentCount, awareCount));
  const retentionRate = round(pct(currentCount, everCount));
  const churnRate = round(Math.max(0, 100 - retentionRate));
  const preferenceRate = round(pct(preferredCount, currentCount));
  const bumoPenetration = round(pct(preferredCount, awareCount));
  const lapseRate = round(pct(Math.max(everCount - currentCount, 0), everCount));

  const selectedCurrentUsers = responses.filter((response) => isCurrentBank(response, bankId));
  const selectedCurrentBase = selectedCurrentUsers.length || 1;
  const banksPerUser = selectedCurrentUsers.map((response) => (response.c5_currently_using || []).length || 0);
  const avgBanksPerUser = banksPerUser.length > 0
    ? Math.round((banksPerUser.reduce((sum, count) => sum + count, 0) / banksPerUser.length) * 10) / 10
    : 0;
  const multiBankUsers = selectedCurrentUsers.filter((response) => (response.c5_currently_using || []).length >= 2);
  const singleBankers = selectedCurrentUsers.filter((response) => (response.c5_currently_using || []).length === 1);
  const dualBankers = selectedCurrentUsers.filter((response) => (response.c5_currently_using || []).length === 2);
  const triplePlusBankers = selectedCurrentUsers.filter((response) => (response.c5_currently_using || []).length >= 3);
  const primaryInMulti = multiBankUsers.filter((response) => isPreferredBank(response, bankId)).length;

  const overlapMap = new Map<string, number>();
  selectedCurrentUsers.forEach((response) => {
    const competitors = (response.c5_currently_using || []).filter((otherBankId) => otherBankId !== bankId);
    competitors.forEach((competitorId) => {
      overlapMap.set(competitorId, (overlapMap.get(competitorId) || 0) + 1);
    });
  });
  const overlapRows: UsageOverlapRow[] = Array.from(overlapMap.entries())
    .map(([otherBankId, overlapCount]) => {
      const bank = BANKS.find((item) => item.id === otherBankId);
      return {
        bankId: otherBankId,
        bankName: bank?.name || otherBankId,
        overlapCount,
        overlapPct: round(pct(overlapCount, selectedCurrentUsers.length)),
      };
    })
    .sort((a, b) => b.overlapCount - a.overlapCount)
    .slice(0, 8);

  const nonTriersCount = Math.max(awareCount - everCount, 0);
  const lapsedUsersCount = Math.max(everCount - currentCount, 0);
  const secondaryUsersCount = Math.max(currentCount - preferredCount, 0);
  const primaryUsersCount = preferredCount;

  const dropoffAwareEver = round(pct(nonTriersCount, awareCount));
  const dropoffEverCurrent = round(pct(lapsedUsersCount, everCount));
  const dropoffCurrentPreferred = round(pct(secondaryUsersCount, currentCount));

  const dropoffStages: UsageDropoffStage[] = [
    {
      stage: 'Aware -> Ever Used',
      lostCount: nonTriersCount,
      dropoffPct: dropoffAwareEver,
      frictionScore: Math.round(dropoffAwareEver * 1.0),
      diagnosis: dropoffAwareEver > 60 ? 'Trial conversion problem' : 'Within expected range',
    },
    {
      stage: 'Ever Used -> Currently Using',
      lostCount: lapsedUsersCount,
      dropoffPct: dropoffEverCurrent,
      frictionScore: Math.round(dropoffEverCurrent * 2.0),
      diagnosis: dropoffEverCurrent > 35 ? 'Retention problem' : 'Within expected range',
    },
    {
      stage: 'Currently Using -> Preferred (BUMO)',
      lostCount: secondaryUsersCount,
      dropoffPct: dropoffCurrentPreferred,
      frictionScore: Math.round(dropoffCurrentPreferred * 1.5),
      diagnosis: dropoffCurrentPreferred > 70 ? 'Preference-capture problem' : 'Within expected range',
    },
  ];
  const highestFriction = [...dropoffStages].sort((a, b) => b.frictionScore - a.frictionScore)[0];

  const countryBanks = BANKS.filter((bank) => bank.country === country);
  const countryMetrics = countryBanks.map((bank) => ({
    bankId: bank.id,
    metrics: computeBankMetrics(responses, bank.id, 0),
  }));
  const usageValues = countryMetrics.map((item) => item.metrics.currentUsing).sort((a, b) => a - b);
  const retentionValues = countryMetrics.map((item) => item.metrics.retentionRate).sort((a, b) => a - b);
  const median = (values: number[]) => {
    if (values.length === 0) return 0;
    const mid = Math.floor(values.length / 2);
    if (values.length % 2 === 0) return Math.round((values[mid - 1] + values[mid]) / 2);
    return values[mid];
  };
  const usageMedian = median(usageValues);
  const retentionMedian = median(retentionValues);
  const selectedMetrics = computeBankMetrics(responses, bankId, 0);
  const usageBucket = selectedMetrics.currentUsing >= usageMedian ? 'High Usage' : 'Low Usage';
  const retentionBucket = selectedMetrics.retentionRate >= retentionMedian ? 'High Retention' : 'Low Retention';
  const positionLabel = (() => {
    if (usageBucket === 'High Usage' && retentionBucket === 'High Retention') return 'Market Leader';
    if (usageBucket === 'High Usage' && retentionBucket === 'Low Retention') return 'Vulnerable Leader';
    if (usageBucket === 'Low Usage' && retentionBucket === 'High Retention') return 'Growing Challenger';
    return 'Struggling Brand';
  })();

  const funnelHealthDiagnosis = (() => {
    if (trialRate < 25) return "Awareness doesn't convert: trial barriers are likely limiting growth.";
    if (trialRate >= 50 && retentionRate < 50) return 'Leaky bucket: acquisition is working but retention is weak.';
    if (retentionRate >= 65 && preferenceRate < 25) return 'Secondary bank syndrome: active users are not choosing you as primary.';
    if (trialRate >= 30 && retentionRate >= 65 && preferenceRate >= 35) return 'Healthy usage funnel: conversion, retention, and preference are balanced.';
    return `Mixed funnel performance: prioritize the highest friction stage (${highestFriction.stage}).`;
  })();

  const opportunities: UsageOpportunity[] = [
    {
      name: 'Convert Non-Triers',
      size: nonTriersCount,
      pct: round(pct(nonTriersCount, awareCount)),
      note: 'Aware users not yet converted to trial.',
    },
    {
      name: 'Reactivate Lapsed Users',
      size: lapsedUsersCount,
      pct: round(pct(lapsedUsersCount, everCount)),
      note: 'Previous users who are no longer active.',
    },
    {
      name: 'Primary Conversion',
      size: secondaryUsersCount,
      pct: round(pct(secondaryUsersCount, currentCount)),
      note: 'Current users who still treat you as secondary.',
    },
  ].sort((a, b) => b.size - a.size);

  return {
    sample: responses.length,
    awareCount,
    everCount,
    currentCount,
    preferredCount,
    trialRate,
    currentUsageRate,
    retentionRate,
    churnRate,
    preferenceRate,
    bumoPenetration,
    lapseRate,
    avgBanksPerUser,
    multiBankingPct: round(pct(multiBankUsers.length, selectedCurrentUsers.length)),
    singleBankerPct: round(pct(singleBankers.length, selectedCurrentBase)),
    dualBankerPct: round(pct(dualBankers.length, selectedCurrentBase)),
    multiBankerPct: round(pct(triplePlusBankers.length, selectedCurrentBase)),
    primaryPositionInMultiPct: round(pct(primaryInMulti, multiBankUsers.length)),
    nonTriersCount,
    lapsedUsersCount,
    secondaryUsersCount,
    primaryUsersCount,
    overlapRows,
    dropoffStages,
    highestFrictionStage: highestFriction.stage,
    funnelHealthDiagnosis,
    positionLabel,
    usageMedian,
    retentionMedian,
    opportunities,
  };
};

const modeFromValues = (values: Array<string | undefined | null>, fallback: string) => {
  const map = new Map<string, number>();
  values.forEach((value) => {
    const key = value && value.trim() ? value : fallback;
    map.set(key, (map.get(key) || 0) + 1);
  });
  const top = Array.from(map.entries()).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : fallback;
};

const computeLoyaltyDistribution = (responses: SurveyResponse[], bankId: string) => {
  const aware = responses.filter((response) => isAwareOfBank(response, bankId));
  const bySegment: Record<LoyaltyBucket, SurveyResponse[]> = {
    Committed: [],
    Favors: [],
    Potential: [],
    Accessibles: [],
    Rejectors: [],
  };
  aware.forEach((response) => {
    const segment = loyaltySegment(response, bankId);
    if (segment) bySegment[segment].push(response);
  });
  const awareCount = aware.length || 1;
  const segmentCounts: Record<LoyaltyBucket, number> = {
    Committed: bySegment.Committed.length,
    Favors: bySegment.Favors.length,
    Potential: bySegment.Potential.length,
    Accessibles: bySegment.Accessibles.length,
    Rejectors: bySegment.Rejectors.length,
  };
  const segmentPcts: Record<LoyaltyBucket, number> = {
    Committed: round(pct(segmentCounts.Committed, awareCount)),
    Favors: round(pct(segmentCounts.Favors, awareCount)),
    Potential: round(pct(segmentCounts.Potential, awareCount)),
    Accessibles: round(pct(segmentCounts.Accessibles, awareCount)),
    Rejectors: round(pct(segmentCounts.Rejectors, awareCount)),
  };

  const loyaltyIndex = round(
    (
      segmentCounts.Committed * 100 +
      segmentCounts.Favors * 70 +
      segmentCounts.Potential * 40 +
      segmentCounts.Accessibles * 20
    ) / awareCount,
  );

  const profileCards: LoyaltySegmentProfile[] = (['Committed', 'Favors', 'Potential', 'Accessibles', 'Rejectors'] as LoyaltyBucket[])
    .map((segment) => {
      const members = bySegment[segment];
      const base = members.length || 1;
      const npsValues = members
        .map((response) => getNpsForBank(response, bankId))
        .filter((score): score is number => typeof score === 'number');
      const avgNps = npsValues.length > 0
        ? Math.round((npsValues.reduce((sum, score) => sum + score, 0) / npsValues.length) * 10) / 10
        : 0;
      const intentValues = members.map((response) => getIntentForBank(response, bankId)).filter((value) => Number.isFinite(value));
      const avgIntent = intentValues.length > 0
        ? Math.round((intentValues.reduce((sum, value) => sum + value, 0) / intentValues.length) * 10) / 10
        : 0;
      const multiBankCount = members.filter((response) => (response.c5_currently_using || []).length >= 2).length;
      return {
        segment,
        count: members.length,
        pct: round(pct(members.length, awareCount)),
        avgNps,
        avgIntent,
        topAge: modeFromValues(members.map((response) => response.b2_age), 'unknown'),
        topGender: modeFromValues(members.map((response) => response.gender), 'unknown'),
        multiBankPct: round(pct(multiBankCount, base)),
      };
    });

  const npsBase = aware
    .map((response) => getNpsForBank(response, bankId))
    .filter((score): score is number => typeof score === 'number');
  const promoters = npsBase.filter((score) => score >= 9).length;
  const detractors = npsBase.filter((score) => score <= 6).length;
  const nps = round(pct(promoters, npsBase.length) - pct(detractors, npsBase.length));

  return {
    awareCount,
    segmentCounts,
    segmentPcts,
    loyaltyIndex,
    profileCards,
    nps,
  };
};

export const computeLoyaltyDiagnostics = (
  responses: SurveyResponse[],
  bankId: string,
  previousResponses: SurveyResponse[] = [],
): LoyaltyDiagnostics => {
  const current = computeLoyaltyDistribution(responses, bankId);
  const previous = computeLoyaltyDistribution(previousResponses, bankId);

  const movementRows: LoyaltyMovementRow[] = (['Committed', 'Favors', 'Potential', 'Accessibles', 'Rejectors'] as LoyaltyBucket[]).map((segment) => ({
    segment,
    currentPct: current.segmentPcts[segment],
    previousPct: previous.segmentPcts[segment],
    deltaPct: current.segmentPcts[segment] - previous.segmentPcts[segment],
  }));

  const awareToPotential = current.segmentPcts.Potential;
  const potentialToFavors = round(pct(current.segmentCounts.Favors, current.segmentCounts.Potential));
  const favorsToCommitted = round(pct(current.segmentCounts.Committed, current.segmentCounts.Favors));

  return {
    awareCount: current.awareCount,
    segmentCounts: current.segmentCounts,
    segmentPcts: current.segmentPcts,
    loyaltyIndex: current.loyaltyIndex,
    nps: current.nps,
    movementRows,
    profileCards: current.profileCards,
    awareToPotential,
    potentialToFavors,
    favorsToCommitted,
  };
};

const MOMENTUM_COMPONENT_META: Array<{
  key: MomentumComponentKey;
  label: string;
  weight: number;
  difficulty: number;
}> = [
  { key: 'awarenessGrowth', label: 'Awareness Growth', weight: MOMENTUM_WEIGHTS.awarenessGrowth, difficulty: 3 },
  { key: 'consideration', label: 'Consideration', weight: MOMENTUM_WEIGHTS.consideration, difficulty: 2 },
  { key: 'conversion', label: 'Conversion', weight: MOMENTUM_WEIGHTS.conversion, difficulty: 3 },
  { key: 'retention', label: 'Retention', weight: MOMENTUM_WEIGHTS.retention, difficulty: 4 },
  { key: 'adoption', label: 'Adoption', weight: MOMENTUM_WEIGHTS.adoption, difficulty: 2 },
];

const addMonthLabel = (date: Date, plusMonths: number) => {
  const copy = new Date(date.getTime());
  copy.setMonth(copy.getMonth() + plusMonths);
  return MONTH_NAMES[copy.getMonth()];
};

const scoreStatus = (score: number): MomentumDiagnostics['status'] => {
  if (score >= 80) return 'Excellent Momentum';
  if (score >= 60) return 'Good Momentum';
  if (score >= 40) return 'Moderate Momentum';
  if (score >= 20) return 'Weak Momentum';
  return 'Crisis Momentum';
};

const scoreStrategy = (score: number): MomentumDiagnostics['strategy'] => {
  if (score >= 80) return 'Scale and defend';
  if (score >= 60) return 'Optimize and grow';
  if (score >= 40) return 'Fix and rebuild';
  if (score >= 20) return 'Urgent intervention';
  return 'Emergency turnaround';
};

const momentumComponentsFromMetrics = (metrics: BankMetrics, previousAwareness: number): MomentumComponentScores => ({
  awarenessGrowth: growthToScore(metrics.aware - previousAwareness),
  consideration: metrics.considerationRate,
  conversion: metrics.trialRate,
  retention: metrics.retentionRate,
  adoption: metrics.preferenceRate,
});

const momentumScoreFromComponents = (components: MomentumComponentScores) =>
  momentumFromComponents(
    components.awarenessGrowth,
    components.consideration,
    components.conversion,
    components.retention,
    components.adoption,
  );

export const computeMomentumDiagnostics = (
  responses: SurveyResponse[],
  trendResponses: SurveyResponse[],
  country: CountryCode,
  bankId: string,
  months = 6,
): MomentumDiagnostics => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const previousMonthEnd = currentMonthStart;

  const previousMonthResponses = trendResponses.filter((response) => {
    const ts = parseTimestamp(response.timestamp);
    return ts !== null && ts >= previousMonthStart && ts < previousMonthEnd;
  });

  const previousMonthMetrics = computeBankMetrics(previousMonthResponses, bankId, 0);
  const currentMetrics = computeBankMetrics(responses, bankId, previousMonthMetrics.aware);
  const components = momentumComponentsFromMetrics(currentMetrics, previousMonthMetrics.aware);
  const score = momentumScoreFromComponents(components);

  const contributionsRaw = MOMENTUM_COMPONENT_META.map((meta) => {
    const componentScore = components[meta.key];
    const contribution = Number((componentScore * meta.weight).toFixed(1));
    return {
      key: meta.key,
      label: meta.label,
      weightPct: Math.round(meta.weight * 100),
      score: componentScore,
      contribution,
    };
  });
  const contributionTotal = contributionsRaw.reduce((sum, row) => sum + row.contribution, 0) || 1;
  const contributions: MomentumContributionRow[] = contributionsRaw.map((row) => ({
    ...row,
    shareOfTotal: round(pct(row.contribution, contributionTotal)),
  }));

  const sensitivity: MomentumSensitivityRow[] = MOMENTUM_COMPONENT_META.map((meta) => {
    const currentComponent = components[meta.key];
    const improved = Math.min(100, currentComponent + 10);
    const improvedComponents = { ...components, [meta.key]: improved };
    const improvedScore = momentumScoreFromComponents(improvedComponents);
    return {
      key: meta.key,
      label: meta.label,
      currentScore: currentComponent,
      improvedScore: improved,
      momentumGain: Number((improvedScore - score).toFixed(1)),
    };
  }).sort((a, b) => b.momentumGain - a.momentumGain);

  const priorities: MomentumPriorityRow[] = MOMENTUM_COMPONENT_META.map((meta) => {
    const currentScore = components[meta.key];
    const gapToExcellence = Math.max(90 - currentScore, 0);
    const priorityScore = Number(((gapToExcellence * meta.weight) / meta.difficulty).toFixed(1));
    return {
      key: meta.key,
      label: meta.label,
      currentScore,
      gapToExcellence,
      weightPct: Math.round(meta.weight * 100),
      difficulty: meta.difficulty,
      priorityScore,
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  const monthStarts: number[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    monthStarts.push(new Date(now.getFullYear(), now.getMonth() - i, 1).getTime());
  }

  const monthRows = monthStarts.map((start, idx) => {
    const end = idx < monthStarts.length - 1 ? monthStarts[idx + 1] : new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const monthResponses = trendResponses.filter((response) => {
      const ts = parseTimestamp(response.timestamp);
      return ts !== null && ts >= start && ts < end;
    });
    const previousStart = idx > 0 ? monthStarts[idx - 1] : null;
    const previousEnd = start;
    const previousResponsesForMonth = previousStart === null
      ? monthResponses
      : trendResponses.filter((response) => {
        const ts = parseTimestamp(response.timestamp);
        return ts !== null && ts >= previousStart && ts < previousEnd;
      });
    const prevAwareness = computeBankMetrics(previousResponsesForMonth, bankId, 0).aware;
    const monthMetrics = computeBankMetrics(monthResponses, bankId, prevAwareness);
    return {
      month: MONTH_NAMES[new Date(start).getMonth()],
      score: monthMetrics.momentum,
    };
  });

  const trends: MomentumTrendPoint[] = monthRows.map((row, idx) => ({
    month: row.month,
    score: row.score,
    delta: idx === 0 ? null : Number((row.score - monthRows[idx - 1].score).toFixed(1)),
  }));

  const recent = monthRows.slice(-3).map((row) => row.score);
  const earlier = monthRows.slice(0, 3).map((row) => row.score);
  const avg = (values: number[]) => (values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
  const velocity = Number((avg(recent) - avg(earlier)).toFixed(1));
  const velocityLabel: MomentumDiagnostics['velocityLabel'] = velocity > 3 ? 'Accelerating' : velocity >= 0 ? 'Steady growth' : 'Decelerating';

  const mean = avg(monthRows.map((row) => row.score));
  const variance = monthRows.length > 0
    ? monthRows.reduce((sum, row) => sum + (row.score - mean) ** 2, 0) / monthRows.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const volatilityCv = mean > 0 ? Number(((stdDev / mean) * 100).toFixed(1)) : 0;
  const volatilityLabel: MomentumDiagnostics['volatilityLabel'] =
    volatilityCv < 10 ? 'Low volatility' : volatilityCv <= 20 ? 'Moderate volatility' : 'High volatility';

  const slope = monthRows.length > 1 ? (monthRows[monthRows.length - 1].score - monthRows[0].score) / (monthRows.length - 1) : 0;
  const forecastBase = monthRows.length > 0 ? monthRows[monthRows.length - 1].score : score;
  const forecast: MomentumForecastPoint[] = [1, 2, 3].map((step) => ({
    month: addMonthLabel(now, step),
    projectedScore: round(Math.max(0, Math.min(100, forecastBase + slope * step))),
  }));

  const countryBankIds = BANKS.filter((bank) => bank.country === country).map((bank) => bank.id);
  const bankCompetitiveRows: CompetitiveMomentumRow[] = countryBankIds.map((candidateBankId) => {
    const currentResponses = responses;
    const previousResponses = trendResponses.filter((response) => {
      const ts = parseTimestamp(response.timestamp);
      return ts !== null && ts >= previousMonthStart && ts < previousMonthEnd;
    });
    const previousMetrics = computeBankMetrics(previousResponses, candidateBankId, 0);
    const currentMetricsForCandidate = computeBankMetrics(currentResponses, candidateBankId, previousMetrics.aware);
    const currentComponents = momentumComponentsFromMetrics(currentMetricsForCandidate, previousMetrics.aware);
    const currentScore = momentumScoreFromComponents(currentComponents);
    const previousComponents = momentumComponentsFromMetrics(previousMetrics, previousMetrics.aware);
    const previousScore = momentumScoreFromComponents(previousComponents);
    const delta = Number((currentScore - previousScore).toFixed(1));
    const growthRate = previousScore > 0 ? Number((((currentScore - previousScore) / previousScore) * 100).toFixed(1)) : null;
    return {
      bankId: candidateBankId,
      bankName: BANKS.find((bank) => bank.id === candidateBankId)?.name || candidateBankId,
      score: currentScore,
      previousScore,
      delta,
      growthRate,
      components: currentComponents,
    };
  }).sort((a, b) => b.score - a.score);

  const selectedRank = Math.max(bankCompetitiveRows.findIndex((row) => row.bankId === bankId) + 1, 1);
  const gapToLeader = bankCompetitiveRows.length > 0
    ? Number((bankCompetitiveRows[0].score - (bankCompetitiveRows.find((row) => row.bankId === bankId)?.score || 0)).toFixed(1))
    : 0;

  return {
    score,
    status: scoreStatus(score),
    strategy: scoreStrategy(score),
    components,
    contributions,
    sensitivity,
    priorities,
    trends,
    velocity,
    velocityLabel,
    forecast,
    volatilityCv,
    volatilityLabel,
    competitiveRows: bankCompetitiveRows,
    selectedRank,
    gapToLeader,
  };
};

const classifyTier = (marketShare: number, awareness: number, nps: number): PositioningRow['tier'] => {
  if (marketShare > 10 && awareness > 70 && nps > 30) return 'Tier 1: Market Leaders';
  if (marketShare >= 5 && marketShare <= 10 && awareness >= 50 && awareness <= 70 && nps >= 15) return 'Tier 2: Strong Challengers';
  return 'Tier 3: Niche Players';
};

const positioningFromShareNps = (marketShare: number, nps: number): PositioningRow['position'] => {
  if (marketShare >= 10 && nps >= 20) return 'Leader';
  if (marketShare < 10 && nps >= 20) return 'Quality Challenger';
  if (marketShare >= 10 && nps < 20) return 'Vulnerable Leader';
  return 'Struggler';
};

const segmentOpportunity = (gap: number): WhiteSpaceRow['opportunity'] => {
  if (gap <= -6) return 'High';
  if (gap <= -3) return 'Moderate';
  return 'Low';
};

export const computeCompetitiveIntelligenceDiagnostics = (
  responses: SurveyResponse[],
  trendResponses: SurveyResponse[],
  country: CountryCode,
  bankId: string,
): CompetitiveIntelligenceDiagnostics => {
  const countryBanks = BANKS.filter((bank) => bank.country === country);
  const countryBankIds = countryBanks.map((bank) => bank.id);
  const sample = responses.length || 1;

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const previousResponses = trendResponses.filter((response) => {
    const ts = parseTimestamp(response.timestamp);
    return ts !== null && ts >= previousStart && ts < currentStart;
  });

  const currentCompetitiveRows = computeCompetitiveRows(responses, country, countryBankIds);
  const previousCompetitiveRows = computeCompetitiveRows(previousResponses, country, countryBankIds);
  const previousShareMap = new Map(previousCompetitiveRows.map((row) => [row.bankId, row.currentUsage]));

  const marketRows: MarketShareRow[] = countryBanks.map((bank) => {
    const preferredCount = responses.filter((response) => isPreferredBank(response, bank.id)).length;
    const marketShare = round(pct(preferredCount, sample));
    const previousPreferredCount = previousResponses.filter((response) => isPreferredBank(response, bank.id)).length;
    const previousShare = round(pct(previousPreferredCount, previousResponses.length || 1));
    const competitiveRow = currentCompetitiveRows.find((row) => row.bankId === bank.id);
    const shareOfVoice = competitiveRow?.shareOfVoice || 0;
    return {
      bankId: bank.id,
      bankName: bank.name,
      preferredCount,
      marketShare,
      marketShareDelta: marketShare - previousShare,
      shareOfVoice,
      sovVsShareGap: round(shareOfVoice - marketShare),
    };
  }).sort((a, b) => b.marketShare - a.marketShare);

  const hhi = Math.round(
    marketRows.reduce((sum, row) => {
      const share = row.marketShare;
      return sum + share * share;
    }, 0),
  );
  const concentrationLabel: CompetitiveIntelligenceDiagnostics['marketStructure']['concentrationLabel'] =
    hhi < 1500 ? 'Highly Competitive' : hhi <= 2500 ? 'Moderately Concentrated' : 'Highly Concentrated';

  const activeCustomers = responses.filter((response) => (response.c5_currently_using || []).length > 0);
  const avgBanksPerCustomer = activeCustomers.length > 0
    ? Math.round((activeCustomers.reduce((sum, response) => sum + (response.c5_currently_using || []).length, 0) / activeCustomers.length) * 10) / 10
    : 0;
  const multiBankingRate = round(
    pct(activeCustomers.filter((response) => (response.c5_currently_using || []).length >= 2).length, activeCustomers.length),
  );

  const selectedCurrentUsers = responses.filter((response) => isCurrentBank(response, bankId));
  const overlapMap = new Map<string, number>();
  selectedCurrentUsers.forEach((response) => {
    (response.c5_currently_using || [])
      .filter((other) => other !== bankId)
      .forEach((other) => overlapMap.set(other, (overlapMap.get(other) || 0) + 1));
  });
  const overlapRows: UsageOverlapRow[] = Array.from(overlapMap.entries())
    .map(([otherBankId, overlapCount]) => ({
      bankId: otherBankId,
      bankName: BANKS.find((bank) => bank.id === otherBankId)?.name || otherBankId,
      overlapCount,
      overlapPct: round(pct(overlapCount, selectedCurrentUsers.length)),
    }))
    .sort((a, b) => b.overlapPct - a.overlapPct);

  const exclusive = selectedCurrentUsers.filter((response) => (response.c5_currently_using || []).length === 1).length;
  const plusOne = selectedCurrentUsers.filter((response) => (response.c5_currently_using || []).length === 2).length;
  const plusTwo = selectedCurrentUsers.filter((response) => (response.c5_currently_using || []).length >= 3).length;
  const portfolioComposition: PortfolioCompositionRow[] = [
    { label: 'Exclusive', count: exclusive, pct: round(pct(exclusive, selectedCurrentUsers.length)) },
    { label: 'Bank + 1 Other', count: plusOne, pct: round(pct(plusOne, selectedCurrentUsers.length)) },
    { label: 'Bank + 2+ Others', count: plusTwo, pct: round(pct(plusTwo, selectedCurrentUsers.length)) },
  ];

  const directCompetitors: CompetitiveSetRow[] = overlapRows.map((row) => ({
    bankId: row.bankId,
    bankName: row.bankName,
    overlapPct: row.overlapPct,
    competitorType: row.overlapPct > 40 ? 'Direct' : row.overlapPct >= 20 ? 'Moderate' : 'Indirect',
  }));

  const positioningRows: PositioningRow[] = countryBanks.map((bank) => {
    const metrics = computeBankMetrics(responses, bank.id, previousShareMap.get(bank.id) || 0);
    const marketShare = marketRows.find((row) => row.bankId === bank.id)?.marketShare || 0;
    return {
      bankId: bank.id,
      bankName: bank.name,
      marketShare,
      nps: metrics.nps,
      position: positioningFromShareNps(marketShare, metrics.nps),
      tier: classifyTier(marketShare, metrics.aware, metrics.nps),
    };
  }).sort((a, b) => b.marketShare - a.marketShare);

  const walletSharePoints = selectedCurrentUsers.reduce((sum, response) => {
    const bankCount = (response.c5_currently_using || []).length;
    if (bankCount <= 0) return sum;
    return sum + (100 / bankCount);
  }, 0);
  const estimatedWalletShare = selectedCurrentUsers.length > 0
    ? Math.round((walletSharePoints / selectedCurrentUsers.length) * 10) / 10
    : 0;

  const byCompetitor: WalletShareCompetitorRow[] = overlapRows.map((row) => ({
    bankId: row.bankId,
    bankName: row.bankName,
    estimatedWalletShare: round((row.overlapPct / 100) * (100 - estimatedWalletShare)),
  })).sort((a, b) => b.estimatedWalletShare - a.estimatedWalletShare);

  const prevByDevice = new Map(
    previousResponses
      .filter((response) => response.device_id && response.preferred_bank)
      .map((response) => [response.device_id, response.preferred_bank as string]),
  );
  const currentByDevice = new Map(
    responses
      .filter((response) => response.device_id && response.preferred_bank)
      .map((response) => [response.device_id, response.preferred_bank as string]),
  );

  const switchPairs: Array<{ from: string; to: string }> = [];
  currentByDevice.forEach((currentPreferred, deviceId) => {
    const previousPreferred = prevByDevice.get(deviceId);
    if (previousPreferred && previousPreferred !== currentPreferred) {
      switchPairs.push({ from: previousPreferred, to: currentPreferred });
    }
  });

  const hasPanelTransitions = switchPairs.length > 0;
  const winLossRows: WinLossRow[] = countryBanks
    .filter((bank) => bank.id !== bankId)
    .map((bank) => {
      const gainedFrom = switchPairs.filter((pair) => pair.from === bank.id && pair.to === bankId).length;
      const lostTo = switchPairs.filter((pair) => pair.from === bankId && pair.to === bank.id).length;
      const fallbackGained = Math.max(0, (marketRows.find((row) => row.bankId === bankId)?.marketShareDelta || 0));
      const fallbackLost = Math.max(0, -(marketRows.find((row) => row.bankId === bankId)?.marketShareDelta || 0));
      const effectiveGained = hasPanelTransitions
        ? gainedFrom
        : round((fallbackGained * (overlapRows.find((row) => row.bankId === bank.id)?.overlapPct || 0)) / 100);
      const effectiveLost = hasPanelTransitions ? lostTo : round((fallbackLost * (overlapRows.find((row) => row.bankId === bank.id)?.overlapPct || 0)) / 100);
      const totalBattles = effectiveGained + effectiveLost;
      const winRate = round(pct(effectiveGained, totalBattles));
      return {
        competitorBankId: bank.id,
        competitorBankName: bank.name,
        gainedFrom: effectiveGained,
        lostTo: effectiveLost,
        winRate,
        net: effectiveGained - effectiveLost,
      };
    })
    .sort((a, b) => b.gainedFrom + b.lostTo - (a.gainedFrom + a.lostTo));

  const overallGained = winLossRows.reduce((sum, row) => sum + row.gainedFrom, 0);
  const overallLost = winLossRows.reduce((sum, row) => sum + row.lostTo, 0);
  const overallWinRate = round(pct(overallGained, overallGained + overallLost));

  const bankMetricsMap = new Map(countryBanks.map((bank) => [bank.id, computeBankMetrics(responses, bank.id, 0)]));
  const yourMetrics = bankMetricsMap.get(bankId) || computeBankMetrics(responses, bankId, 0);
  const marketAvg = (extractor: (metrics: BankMetrics) => number) => {
    const values = Array.from(bankMetricsMap.values()).map(extractor);
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  };

  const strengthCandidates: RelativeStrengthRow[] = [
    { metric: 'Awareness', yourValue: yourMetrics.aware, marketAvg: Math.round(marketAvg((m) => m.aware)), relativeStrength: 0, strengthType: 'Strength' },
    { metric: 'Trial Rate', yourValue: yourMetrics.trialRate, marketAvg: Math.round(marketAvg((m) => m.trialRate)), relativeStrength: 0, strengthType: 'Strength' },
    { metric: 'Retention', yourValue: yourMetrics.retentionRate, marketAvg: Math.round(marketAvg((m) => m.retentionRate)), relativeStrength: 0, strengthType: 'Strength' },
    { metric: 'NPS', yourValue: yourMetrics.nps, marketAvg: Math.round(marketAvg((m) => m.nps)), relativeStrength: 0, strengthType: 'Strength' },
    { metric: 'Momentum', yourValue: yourMetrics.momentum, marketAvg: Math.round(marketAvg((m) => m.momentum)), relativeStrength: 0, strengthType: 'Strength' },
  ].map((row) => {
    const relativeStrength = row.marketAvg !== 0 ? Math.round(((row.yourValue - row.marketAvg) / row.marketAvg) * 100) : 0;
    return {
      ...row,
      relativeStrength,
      strengthType: relativeStrength >= 0 ? 'Strength' : 'Weakness',
    };
  });
  const relativeStrengthIndex = round(
    strengthCandidates.reduce((sum, row) => sum + row.relativeStrength, 0) / (strengthCandidates.length || 1),
  );

  const segmentRows = (field: 'b2_age' | 'gender'): WhiteSpaceRow[] => {
    const segments = Array.from(
      new Set(
        responses
          .map((response) => (field === 'b2_age' ? response.b2_age : response.gender))
          .filter((value): value is string => !!value && value.trim().length > 0),
      ),
    );
    return segments.map((segment) => {
      const scoped = responses.filter((response) => (field === 'b2_age' ? response.b2_age : response.gender) === segment);
      const segmentSample = scoped.length || 1;
      const yourPenetration = round(pct(scoped.filter((response) => isPreferredBank(response, bankId)).length, segmentSample));
      const marketRates = countryBankIds.map((id) => round(pct(scoped.filter((response) => isPreferredBank(response, id)).length, segmentSample)));
      const marketAvgRate = marketRates.length > 0
        ? Math.round(marketRates.reduce((sum, value) => sum + value, 0) / marketRates.length)
        : 0;
      const gap = yourPenetration - marketAvgRate;
      return {
        segment,
        marketAvg: marketAvgRate,
        yourPenetration,
        gap,
        opportunity: segmentOpportunity(gap),
      };
    }).sort((a, b) => a.gap - b.gap);
  };

  const ageRows = segmentRows('b2_age');
  const genderRows = segmentRows('gender');

  const threats: ThreatRow[] = countryBanks
    .filter((bank) => bank.id !== bankId)
    .map((bank) => {
      const marketRow = marketRows.find((row) => row.bankId === bank.id);
      const overlap = overlapRows.find((row) => row.bankId === bank.id)?.overlapPct || 0;
      const growth = marketRow?.marketShareDelta || 0;
      const likelihoodScore = round(Math.max(0, Math.min(100, overlap + Math.max(growth, 0) * 10)));
      const impactScore = round(Math.max(0, Math.min(100, (marketRow?.marketShare || 0) * 4 + Math.max(0, marketRow?.sovVsShareGap || 0))));
      const threatLevel: ThreatRow['threatLevel'] =
        likelihoodScore >= 60 && impactScore >= 50
          ? 'Critical'
          : likelihoodScore >= 60
            ? 'Monitor'
            : impactScore >= 50
              ? 'Emerging'
              : 'Low Priority';
      return {
        competitorBankId: bank.id,
        competitorBankName: bank.name,
        likelihoodScore,
        impactScore,
        threatLevel,
      };
    })
    .sort((a, b) => (b.likelihoodScore + b.impactScore) - (a.likelihoodScore + a.impactScore));

  const selectedMarketRow = marketRows.find((row) => row.bankId === bankId);
  const selectedShareDelta = selectedMarketRow?.marketShareDelta || 0;
  const selectedSovGap = selectedMarketRow?.sovVsShareGap || 0;
  const indicators: CompetitiveIntelligenceDiagnostics['threats']['indicators'] = [
    {
      label: 'Selected market share delta',
      status: `${selectedShareDelta > 0 ? '+' : ''}${selectedShareDelta}pp`,
      alert: selectedShareDelta < 0 ? 'Red' : selectedShareDelta === 0 ? 'Yellow' : 'Green',
    },
    {
      label: 'Selected SOV vs Share gap',
      status: `${selectedSovGap > 0 ? '+' : ''}${selectedSovGap}pp`,
      alert: selectedSovGap < -5 ? 'Red' : selectedSovGap < 0 ? 'Yellow' : 'Green',
    },
    {
      label: 'Overall win rate',
      status: `${overallWinRate}%`,
      alert: overallWinRate < 45 ? 'Red' : overallWinRate < 55 ? 'Yellow' : 'Green',
    },
    {
      label: 'Multi-banking rate',
      status: `${multiBankingRate}%`,
      alert: multiBankingRate > 70 ? 'Yellow' : 'Green',
    },
  ];

  return {
    marketStructure: {
      marketRows,
      hhi,
      concentrationLabel,
    },
    customerBehavior: {
      averageBanksPerCustomer: avgBanksPerCustomer,
      multiBankingRate,
      overlapRows,
      portfolioComposition,
    },
    competitiveAnalysis: {
      directCompetitors,
      positioningRows,
    },
    shareOfWallet: {
      estimatedWalletShare,
      byCompetitor,
    },
    winLoss: {
      rows: winLossRows,
      overallWinRate,
      hasPanelTransitions,
    },
    strengthsWeaknesses: {
      relativeRows: strengthCandidates,
      relativeStrengthIndex,
    },
    whiteSpace: {
      ageRows,
      genderRows,
    },
    threats: {
      rows: threats,
      indicators,
    },
  };
};

const stdDevFromValues = (values: number[]) => {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const linearRegression = (values: number[]) => {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, intercept: values[0] || 0, r2: 0 };
  }
  const xs = values.map((_, idx) => idx + 1);
  const xMean = xs.reduce((sum, x) => sum + x, 0) / n;
  const yMean = values.reduce((sum, y) => sum + y, 0) / n;
  const numerator = xs.reduce((sum, x, idx) => sum + (x - xMean) * (values[idx] - yMean), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0) || 1;
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  const predicted = xs.map((x) => slope * x + intercept);
  const ssTot = values.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const ssRes = values.reduce((sum, y, idx) => sum + (y - predicted[idx]) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
  return { slope, intercept, r2 };
};

export const computeTrendForecastDiagnostics = (
  responses: SurveyResponse[],
  bankId: string,
  months = 12,
): TrendForecastDiagnostics => {
  const now = new Date();
  const monthStarts: number[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    monthStarts.push(new Date(now.getFullYear(), now.getMonth() - i, 1).getTime());
  }

  const monthly: TrendMonthlyPoint[] = monthStarts.map((start, idx) => {
    const end = idx < monthStarts.length - 1 ? monthStarts[idx + 1] : new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const monthResponses = responses.filter((response) => {
      const ts = parseTimestamp(response.timestamp);
      return ts !== null && ts >= start && ts < end;
    });
    const metrics = computeBankMetrics(monthResponses, bankId, 0);
    return {
      month: MONTH_NAMES[new Date(start).getMonth()],
      awareness: metrics.aware,
      usage: metrics.currentUsing,
      nps: metrics.nps,
    };
  });

  const awarenessSeries = monthly.map((row) => row.awareness);
  const last = awarenessSeries[awarenessSeries.length - 1] ?? 0;
  const prev = awarenessSeries[awarenessSeries.length - 2] ?? null;
  const momPp = prev === null ? null : Number((last - prev).toFixed(1));
  const momPct = prev === null || prev === 0 ? null : Number((((last - prev) / prev) * 100).toFixed(1));

  const qCurrent = awarenessSeries.slice(-3);
  const qPrevious = awarenessSeries.slice(-6, -3);
  const qCurrentAvg = qCurrent.length > 0 ? qCurrent.reduce((sum, value) => sum + value, 0) / qCurrent.length : 0;
  const qPrevAvg = qPrevious.length > 0 ? qPrevious.reduce((sum, value) => sum + value, 0) / qPrevious.length : null;
  const qoqPp = qPrevAvg === null ? null : Number((qCurrentAvg - qPrevAvg).toFixed(1));
  const qoqPct = qPrevAvg === null || qPrevAvg === 0 ? null : Number((((qCurrentAvg - qPrevAvg) / qPrevAvg) * 100).toFixed(1));

  const yoyCurrent = awarenessSeries[awarenessSeries.length - 1] ?? null;
  const yoyPrev = awarenessSeries.length >= 12 ? awarenessSeries[awarenessSeries.length - 12] : null;
  const yoyPp = yoyCurrent === null || yoyPrev === null ? null : Number((yoyCurrent - yoyPrev).toFixed(1));
  const yoyPct = yoyCurrent === null || yoyPrev === null || yoyPrev === 0 ? null : Number((((yoyCurrent - yoyPrev) / yoyPrev) * 100).toFixed(1));
  const ytdAverage = awarenessSeries.length > 0
    ? Math.round((awarenessSeries.reduce((sum, value) => sum + value, 0) / awarenessSeries.length) * 10) / 10
    : 0;

  const periodGrowthRates = awarenessSeries
    .map((value, idx) => {
      if (idx === 0) return null;
      const prior = awarenessSeries[idx - 1];
      if (!prior) return null;
      return ((value - prior) / prior) * 100;
    })
    .filter((value): value is number => value !== null);
  const averageGrowthPct = periodGrowthRates.length > 0
    ? Math.round((periodGrowthRates.reduce((sum, value) => sum + value, 0) / periodGrowthRates.length) * 10) / 10
    : 0;
  const firstPositive = awarenessSeries.find((value) => value > 0) ?? null;
  const lastPositive = [...awarenessSeries].reverse().find((value) => value > 0) ?? null;
  const cagrPct = firstPositive && lastPositive && months > 1
    ? Math.round((((Math.pow(lastPositive / firstPositive, 1 / ((months - 1) / 12)) - 1) * 100) || 0) * 10) / 10
    : null;
  const exponentialSignal = periodGrowthRates.length >= 3
    && periodGrowthRates.slice(-3).every((value, idx, arr) => idx === 0 || value >= arr[idx - 1]);

  const stdDev = Number(stdDevFromValues(awarenessSeries).toFixed(2));
  const mean = awarenessSeries.length > 0 ? awarenessSeries.reduce((sum, value) => sum + value, 0) / awarenessSeries.length : 0;
  const cv = mean > 0 ? Number(((stdDev / mean) * 100).toFixed(1)) : 0;
  const range = awarenessSeries.length > 0 ? Math.max(...awarenessSeries) - Math.min(...awarenessSeries) : 0;
  let reversals = 0;
  for (let i = 2; i < awarenessSeries.length; i += 1) {
    const delta1 = awarenessSeries[i - 1] - awarenessSeries[i - 2];
    const delta2 = awarenessSeries[i] - awarenessSeries[i - 1];
    if ((delta1 > 0 && delta2 < 0) || (delta1 < 0 && delta2 > 0)) reversals += 1;
  }
  const directionalChanges = awarenessSeries.length > 0 ? (reversals / awarenessSeries.length) * 100 : 0;
  const stabilityScore = Math.max(0, Math.min(100, round(100 - (cv + directionalChanges))));
  const volatilityLabel: TrendForecastDiagnostics['volatility']['label'] =
    cv < 10 ? 'Low volatility' : cv <= 20 ? 'Moderate volatility' : 'High volatility';

  const monthBuckets = new Map<number, number[]>();
  monthly.forEach((row, idx) => {
    const monthIndex = (new Date(now.getFullYear(), now.getMonth() - (monthly.length - 1 - idx), 1)).getMonth();
    const existing = monthBuckets.get(monthIndex) || [];
    existing.push(row.awareness);
    monthBuckets.set(monthIndex, existing);
  });
  const overallAvg = mean || 1;
  const monthIndices = Array.from(monthBuckets.entries()).map(([monthIndex, values]) => {
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return {
      monthIndex,
      month: MONTH_NAMES[monthIndex],
      index: (avg / overallAvg) * 100,
    };
  });
  const strongestMonth = monthIndices.length > 0 ? [...monthIndices].sort((a, b) => b.index - a.index)[0].month : null;
  const weakestMonth = monthIndices.length > 0 ? [...monthIndices].sort((a, b) => a.index - b.index)[0].month : null;
  const currentMonthIndex = monthIndices.find((row) => row.monthIndex === now.getMonth())?.index ?? null;

  const smaNext = awarenessSeries.length >= 3
    ? Math.round((awarenessSeries.slice(-3).reduce((sum, value) => sum + value, 0) / 3) * 10) / 10
    : null;
  const wmaNext = awarenessSeries.length >= 3
    ? Math.round((awarenessSeries[awarenessSeries.length - 3] * 0.2 + awarenessSeries[awarenessSeries.length - 2] * 0.3 + awarenessSeries[awarenessSeries.length - 1] * 0.5) * 10) / 10
    : null;
  const { slope, intercept, r2 } = linearRegression(awarenessSeries);
  const regressionNextRaw = slope * (awarenessSeries.length + 1) + intercept;
  const regressionNext = awarenessSeries.length >= 2
    ? Math.round(Math.max(0, Math.min(100, regressionNextRaw)) * 10) / 10
    : null;
  const regressionR2 = awarenessSeries.length >= 2 ? Math.round(r2 * 100) / 100 : null;

  const alpha = 0.3;
  let expForecast = awarenessSeries[0] ?? 0;
  for (let i = 1; i < awarenessSeries.length; i += 1) {
    expForecast = alpha * awarenessSeries[i] + (1 - alpha) * expForecast;
  }
  const expSmoothingNext = awarenessSeries.length > 0 ? Math.round(expForecast * 10) / 10 : null;

  const nextMonth = (now.getMonth() + 1) % 12;
  const nextIndex = monthIndices.find((row) => row.monthIndex === nextMonth)?.index || 100;
  const seasonalAdjustedNext = regressionNext !== null
    ? Math.round((regressionNext * nextIndex / 100) * 10) / 10
    : null;

  const predicted = awarenessSeries.map((_, idx) => slope * (idx + 1) + intercept);
  const residuals = awarenessSeries.map((actual, idx) => actual - predicted[idx]);
  const residualStd = stdDevFromValues(residuals);
  const baseForecast = regressionNext ?? smaNext ?? wmaNext ?? expSmoothingNext ?? 0;
  const confidenceLow = baseForecast ? Math.round(Math.max(0, baseForecast - 1.96 * residualStd) * 10) / 10 : null;
  const confidenceHigh = baseForecast ? Math.round(Math.min(100, baseForecast + 1.96 * residualStd) * 10) / 10 : null;

  const significantSignal = Math.abs(momPp || 0) > (2 * stdDev);
  const diagnosis = (() => {
    if (significantSignal && (momPp || 0) > 0) return 'Positive acceleration signal detected above normal volatility.';
    if (significantSignal && (momPp || 0) < 0) return 'Negative signal detected; decline exceeds normal volatility.';
    if (cv > 20) return 'High volatility indicates unstable trend; treat short-term changes cautiously.';
    return 'Trend movement is within expected variation range.';
  })();

  const highlights: string[] = [];
  if ((momPp || 0) > 0 && cv < 15) highlights.push('Recent month is improving with low volatility, supporting near-term confidence.');
  if ((qoqPp || 0) > 0) highlights.push('Quarter trend is positive, indicating broader improvement beyond one month.');
  if ((yoyPp || 0) > 0) highlights.push('Year-over-year awareness is up, reducing seasonality distortion risk.');
  if (exponentialSignal) highlights.push('Growth pattern is accelerating across recent periods.');
  if ((volatilityLabel === 'High volatility')) highlights.push('High volatility flagged: use conservative planning and monitor weekly signal quality.');
  if ((regressionR2 || 0) > 0.7) highlights.push('Regression fit is strong; forecast reliability is comparatively higher.');
  if (highlights.length === 0) highlights.push('Trend remains mixed; prioritize stabilizing consistency before scaling investment.');

  return {
    monthly,
    periodComparisons: {
      momPp,
      momPct,
      qoqPp,
      qoqPct,
      yoyPp,
      yoyPct,
      ytdAverage,
    },
    growth: {
      averageGrowthPct,
      cagrPct,
      exponentialSignal,
    },
    volatility: {
      stdDev,
      cv,
      range,
      stabilityScore,
      reversals,
      label: volatilityLabel,
    },
    seasonality: {
      currentMonthIndex: currentMonthIndex ? Math.round(currentMonthIndex * 10) / 10 : null,
      strongestMonth,
      weakestMonth,
    },
    forecast: {
      smaNext,
      wmaNext,
      regressionNext,
      regressionR2,
      expSmoothingNext,
      seasonalAdjustedNext,
      confidenceLow,
      confidenceHigh,
    },
    signal: {
      slope: Math.round(slope * 10) / 10,
      isSignificantSignal: significantSignal,
      diagnosis,
    },
    highlights,
  };
};

export const computeTrendSeries = (
  responses: SurveyResponse[],
  bankId: string,
  months = 6,
): TrendPoint[] => {
  const now = new Date();
  const output: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
    const monthResponses = responses.filter((response) => {
      const ts = parseTimestamp(response.timestamp);
      return ts !== null && ts >= start && ts < end;
    });
    const current = computeBankMetrics(monthResponses, bankId, 0);
    output.push({
      month: MONTH_NAMES[new Date(start).getMonth()],
      awareness: current.aware,
      usage: current.currentUsing,
      nps: current.nps,
    });
  }
  return output;
};

export const computeCompetitiveRows = (
  responses: SurveyResponse[],
  country: CountryCode,
  bankIds: string[],
): CompetitiveRow[] => {
  const countryBanks = BANKS.filter((bank) => bank.country === country && bankIds.includes(bank.id));
  const trendMap = new Map<string, TrendPoint[]>();
  countryBanks.forEach((bank) => {
    trendMap.set(bank.id, computeTrendSeries(responses, bank.id, 2));
  });
  const rawRows = countryBanks.map((bank) => {
    const trend = trendMap.get(bank.id) || [];
    const previousAwareness = trend.length > 1 ? trend[trend.length - 2].awareness : 0;
    const metrics = computeBankMetrics(responses, bank.id, previousAwareness);
    return { bank, metrics };
  });
  const tomTotal = rawRows.reduce((sum, row) => sum + row.metrics.topOfMind, 0) || 1;

  return rawRows
    .map(({ bank, metrics }) => ({
      bankId: bank.id,
      bankName: bank.name,
      topOfMind: metrics.topOfMind,
      awareness: metrics.aware,
      currentUsage: metrics.currentUsing,
      nps: metrics.nps,
      momentum: metrics.momentum,
      shareOfVoice: round(pct(metrics.topOfMind, tomTotal)),
    }))
    .sort((a, b) => b.awareness - a.awareness);
};

export const computeGeography = (
  responses: SurveyResponse[],
  countries: CountryCode[],
  bankId: string,
): GeographyRow[] => {
  return countries.map((country) => {
    const scoped = responses.filter((response) => responseCountry(response) === country);
    const metrics = computeBankMetrics(scoped, bankId, 0);
    return {
      country,
      sample: scoped.length,
      awareness: metrics.aware,
      usage: metrics.currentUsing,
      nps: metrics.nps,
    };
  });
};

const cohortRowsForDimension = (
  responses: SurveyResponse[],
  bankId: string,
  dimension: 'age' | 'gender' | 'employment' | 'education',
): DemographicCohortRow[] => {
  const keyFn = (response: SurveyResponse) => {
    if (dimension === 'age') return response.b2_age || 'unknown';
    if (dimension === 'gender') return response.gender || 'unknown';
    if (dimension === 'employment') return response.e1_employment || 'unknown';
    return response.e2_education || 'unknown';
  };

  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    const key = keyFn(response);
    const current = groups.get(key) || [];
    current.push(response);
    groups.set(key, current);
  });

  const total = responses.length || 1;
  return Array.from(groups.entries())
    .map(([segment, cohort]) => {
      const sample = cohort.length || 1;
      const awareCount = cohort.filter((response) => isAwareOfBank(response, bankId)).length;
      const everCount = cohort.filter((response) => isEverBank(response, bankId)).length;
      const currentCount = cohort.filter((response) => isCurrentBank(response, bankId)).length;
      const preferredCount = cohort.filter((response) => isPreferredBank(response, bankId)).length;
      const npsValues = cohort
        .map((response) => getNpsForBank(response, bankId))
        .filter((score): score is number => typeof score === 'number');
      const promoters = npsValues.filter((score) => score >= 9).length;
      const detractors = npsValues.filter((score) => score <= 6).length;
      const nps = npsValues.length > 0 ? round(pct(promoters, npsValues.length) - pct(detractors, npsValues.length)) : 0;
      const intentValues = cohort
        .map((response) => getIntentForBank(response, bankId))
        .filter((value) => Number.isFinite(value) && value > 0);
      const avgIntent = intentValues.length > 0
        ? Math.round((intentValues.reduce((sum, value) => sum + value, 0) / intentValues.length) * 10) / 10
        : 0;
      const currentUsers = cohort.filter((response) => isCurrentBank(response, bankId));
      const multiBankRate = round(
        pct(currentUsers.filter((response) => (response.c5_currently_using || []).length >= 2).length, currentUsers.length),
      );
      return {
        segment,
        sample: cohort.length,
        samplePct: round(pct(cohort.length, total)),
        awareness: round(pct(awareCount, sample)),
        everUsed: round(pct(everCount, sample)),
        currentUsage: round(pct(currentCount, sample)),
        preferred: round(pct(preferredCount, sample)),
        nps,
        avgIntent,
        multiBankRate,
      };
    })
    .sort((a, b) => b.sample - a.sample);
};

const opportunitiesForDimension = (
  rows: DemographicCohortRow[],
  dimension: DemographicOpportunityRow['dimension'],
): DemographicOpportunityRow[] => {
  const bestUsage = rows.length > 0 ? Math.max(...rows.map((row) => row.currentUsage)) : 0;
  return rows.map((row) => {
    const gap = row.currentUsage - bestUsage;
    const priority: DemographicOpportunityRow['priority'] =
      gap <= -10 ? 'High' : gap <= -5 ? 'Medium' : 'Low';
    return {
      dimension,
      segment: row.segment,
      currentUsage: row.currentUsage,
      bestInDimension: bestUsage,
      usageGap: gap,
      nps: row.nps,
      priority,
    };
  });
};

export const computeDemographicDiagnostics = (
  responses: SurveyResponse[],
  bankId: string,
): DemographicDiagnostics => {
  const ageRows = cohortRowsForDimension(responses, bankId, 'age');
  const genderRows = cohortRowsForDimension(responses, bankId, 'gender');
  const employmentRows = cohortRowsForDimension(responses, bankId, 'employment');
  const educationRows = cohortRowsForDimension(responses, bankId, 'education');

  const opportunities = [
    ...opportunitiesForDimension(ageRows, 'age'),
    ...opportunitiesForDimension(genderRows, 'gender'),
    ...opportunitiesForDimension(employmentRows, 'employment'),
    ...opportunitiesForDimension(educationRows, 'education'),
  ]
    .sort((a, b) => (a.priority === b.priority ? a.usageGap - b.usageGap : a.priority === 'High' ? -1 : a.priority === 'Low' ? 1 : 0))
    .slice(0, 8);

  const highValueSegments = [
    ...ageRows.map((row) => ({ dimension: 'Age', segment: row.segment, preferred: row.preferred, nps: row.nps, score: row.preferred * 0.6 + row.nps * 0.4 })),
    ...genderRows.map((row) => ({ dimension: 'Gender', segment: row.segment, preferred: row.preferred, nps: row.nps, score: row.preferred * 0.6 + row.nps * 0.4 })),
    ...employmentRows.map((row) => ({ dimension: 'Employment', segment: row.segment, preferred: row.preferred, nps: row.nps, score: row.preferred * 0.6 + row.nps * 0.4 })),
    ...educationRows.map((row) => ({ dimension: 'Education', segment: row.segment, preferred: row.preferred, nps: row.nps, score: row.preferred * 0.6 + row.nps * 0.4 })),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((row) => ({
      ...row,
      score: Math.round(row.score * 10) / 10,
    }));

  return {
    sample: responses.length,
    ageRows,
    genderRows,
    employmentRows,
    educationRows,
    opportunities,
    highValueSegments,
  };
};

export const computeDemographics = (responses: SurveyResponse[]): DemographicSummary => {
  const sample = responses.length || 1;
  const countMap = (values: Array<string | undefined | null>) => {
    const map = new Map<string, number>();
    values.forEach((value) => {
      const key = value && value.trim() ? value : 'unknown';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, value: round(pct(count, sample)) }));
  };

  return {
    sample: responses.length,
    age: countMap(responses.map((response) => response.b2_age)).slice(0, 6),
    gender: countMap(responses.map((response) => response.gender)).slice(0, 4),
    employment: countMap(responses.map((response) => response.e1_employment)).slice(0, 6),
    education: countMap(responses.map((response) => response.e2_education)).slice(0, 6),
  };
};
