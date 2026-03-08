import { AnalyticSurveyResponse, DashboardAnalytics, LoyaltyMetrics, LoyaltySegment, AwarenessMetrics, MomentumMetrics, FunnelMetrics, DemographicFilters } from './types';
import { SurveyResponse } from '../../types';

// Constants for weighting (Methodology Part 2)
const MOMENTUM_WEIGHTS = {
  AWARENESS_GROWTH: 0.15,
  CONSIDERATION: 0.25,
  CONVERSION: 0.25,
  RETENTION: 0.20,
  ADOPTION: 0.15
};

/**
 * Transforms raw application SurveyResponse to AnalyticSurveyResponse
 * handling nulls and data normalization.
 */
export const normalizeResponse = (raw: SurveyResponse): AnalyticSurveyResponse => {
  return {
    id: raw._docId || raw.response_id,
    response_id: raw.response_id,
    country: raw.country,
    date: raw.timestamp,
    weight: 1, // Default weight
    
    b2_age: raw.b2_age || 'Unknown',
    gender: raw.gender || 'Unknown',
    
    top_of_mind_brand: raw.c1_recognized_bank_id || null, // Assuming this maps to processed ID
    spontaneous_brands: raw.c2_recognized_bank_ids || [],
    aided_brands: raw.c3_aware_banks || [], // This usually contains All Aware in some datasets, checking usage
    
    ever_used_brands: raw.c4_ever_used || [],
    currently_using_brands: raw.c5_currently_using || [],
    main_bank: raw.c6_main_bank || null,
    preferred_bank: raw.c9_favourites?.[0] || null, // Best proxy if c9_favourites is "Preferred"
    
    consideration_set: raw.c9_would_consider || [],
    
    nps_score: raw.c10_nps || 0,
    satisfaction_drivers: {}, // Needs mapping if raw data has it
    
    future_intent: raw.d2_future_intent ? Object.values(raw.d2_future_intent)[0] || 0 : 0, // Simplified
    relevance_brands: raw.d3_relevance || [],
    popularity_brand: raw.d4_popularity || null,
    commitment_brand: raw.d5_committed || null,
  };
};

/**
 * Implements the Loyalty Segmentation Decision Tree
 * Ref: Loyalty_Segmentation_Methodology.md
 */
export const determineLoyaltySegment = (
  nps: number,
  intent: number,
  isPreferred: boolean,
  isUser: boolean
): LoyaltySegment => {
  // 1. Committed: High NPS + High Intent + Preferred
  if (isUser && nps >= 9 && intent >= 9 && isPreferred) return 'Committed';
  
  // 2. Favors: High NPS + High Intent + NOT Preferred
  if (isUser && nps >= 9 && intent >= 9 && !isPreferred) return 'Favors';
  
  // 3. Potential: Non-User + High Intent/Consideration
  // Note: Docs say "Non-users with High Future Intent (7-10)"
  if (!isUser && intent >= 7) return 'Potential';
  
  // 4. Rejectors: Low NPS OR Low Intent
  if (nps <= 6 || intent <= 6) return 'Rejectors';
  
  // 5. Accessibles: The rest
  return 'Accessibles';
};

/**
 * Aggregates metrics for a specific Bank
 */
export const calculateMetrics = (
  data: AnalyticSurveyResponse[], 
  targetBankId: string
): DashboardAnalytics => {
  const total = data.length;
  if (total === 0) return createEmptyAnalytics();

  let awareCount = 0;
  let tomCount = 0;
  let spontaneousCount = 0;
  let everUsedCount = 0;
  let currentCount = 0;
  let preferredCount = 0;
  let considerCount = 0;
  
  const loyaltyCounts: Record<LoyaltySegment, number> = {
    'Committed': 0, 'Favors': 0, 'Potential': 0, 'Rejectors': 0, 'Accessibles': 0
  };
  
  const npsScores: number[] = [];
  let promoters = 0;
  let detractors = 0;

  data.forEach(r => {
    // Awareness
    const isTom = r.top_of_mind_brand === targetBankId;
    const isSpontaneous = isTom || r.spontaneous_brands.includes(targetBankId);
    // Assuming data.aided_brands contains ALL aware brands (aided + unaided)
    // Or we strictly use the field for "Total Awareness" check
    const isAware = isSpontaneous || r.aided_brands.includes(targetBankId) || (r.total_awareness_bank_ids?.includes(targetBankId) ?? false);
    
    if (isTom) tomCount++;
    if (isSpontaneous) spontaneousCount++;
    if (isAware) awareCount++;
    
    // Usage Funnel
    const isEverUsed = r.ever_used_brands.includes(targetBankId);
    const isCurrent = r.currently_using_brands.includes(targetBankId);
    const isPreferred = r.preferred_bank === targetBankId; // Or r.commitment_brand
    const considers = r.consideration_set.includes(targetBankId);

    if (isEverUsed) everUsedCount++;
    if (isCurrent) currentCount++;
    if (isPreferred) preferredCount++;
    if (considers) considerCount++;

    // Loyalty Segmentation (for User/Non-User of Target Bank)
    // We need target bank specific NPS/Intent. 
    // Assuming r.nps_score is for THIS bank or we filter beforehand.
    // In multi-bank surveys, these fields usually are records { [bankId]: value }.
    // Detailed mapping needed in normalizeResponse if fields are objects.
    
    const segment = determineLoyaltySegment(r.nps_score, r.future_intent, isPreferred, isCurrent);
    loyaltyCounts[segment]++;

    // NPS
    if (isCurrent || isEverUsed) { // Usually NPS is asked to users
         npsScores.push(r.nps_score);
         if (r.nps_score >= 9) promoters++;
         if (r.nps_score <= 6) detractors++;
    }
  });

  // Calculations
  const awarenessMetrics: AwarenessMetrics = {
    totalAwareness: (awareCount / total) * 100,
    topOfMind: (tomCount / total) * 100,
    spontaneousRecall: (spontaneousCount / total) * 100,
    aidedAwareness: ((awareCount - spontaneousCount) / total) * 100,
    awarenessQuality: awareCount > 0 ? (tomCount / awareCount) * 100 : 0,
    shareOfVoice: 0 // Requires competitive context (Total TOM mentions across all banks)
  };

  const funnelMetrics: FunnelMetrics = {
    totalAwareness: awarenessMetrics.totalAwareness,
    consideration: (considerCount / total) * 100,
    everUsed: (everUsedCount / total) * 100,
    currentlyUsing: (currentCount / total) * 100,
    preferred: (preferredCount / total) * 100
  };

  // Momentum Score (Simplified approx without historical growth for now)
  // Need to calculate rates relative to funnel stages
  // Awareness Growth (N/A in single snapshot) -> assume 50 (neutral)
  // Consideration Rate = Consider / Aware
  // Conversion Rate = Ever Used / Aware
  // Retention Rate = Current / Ever Used
  // Adoption Rate = Preferred / Current
  
  const safeDiv = (n: number, d: number) => d === 0 ? 0 : (n / d) * 100;
  
  const considerationRate = safeDiv(considerCount, awareCount);
  const conversionRate = safeDiv(everUsedCount, awareCount);
  const retentionRate = safeDiv(currentCount, everUsedCount);
  const adoptionRate = safeDiv(preferredCount, currentCount);
  
  const momentumScore = 
    (50 * MOMENTUM_WEIGHTS.AWARENESS_GROWTH) + 
    (considerationRate * MOMENTUM_WEIGHTS.CONSIDERATION) +
    (conversionRate * MOMENTUM_WEIGHTS.CONVERSION) +
    (retentionRate * MOMENTUM_WEIGHTS.RETENTION) +
    (adoptionRate * MOMENTUM_WEIGHTS.ADOPTION);

  return {
    awareness: awarenessMetrics,
    midFunnel: funnelMetrics,
    loyalty: {
        distribution: loyaltyCounts, // Raw counts, UI converts to %
        loyaltyIndex: 0 // To implement weighted index
    },
    momentum: {
        score: momentumScore,
        components: {
            awarenessGrowth: 0,
            considerationRate,
            conversionRate,
            retentionRate,
            adoptionRate
        },
        trend: 'stable'
    },
    nps: {
        score: npsScores.length ? ((promoters - detractors) / npsScores.length) * 100 : 0,
        breakdown: { promoters, passives: npsScores.length - promoters - detractors, detractors }
    }
  };
};

const createEmptyAnalytics = (): DashboardAnalytics => ({
    awareness: { totalAwareness: 0, topOfMind: 0, spontaneousRecall: 0, aidedAwareness: 0, awarenessQuality: 0, shareOfVoice: 0 },
    midFunnel: { totalAwareness: 0, consideration: 0, everUsed: 0, currentlyUsing: 0, preferred: 0 },
    loyalty: { 
        distribution: { 'Committed': 0, 'Favors': 0, 'Potential': 0, 'Rejectors': 0, 'Accessibles': 0 }, 
        loyaltyIndex: 0 
    },
    momentum: { score: 0, components: { awarenessGrowth: 0, considerationRate: 0, conversionRate: 0, retentionRate: 0, adoptionRate: 0 }, trend: 'stable' },
    nps: { score: 0, breakdown: { promoters: 0, passives: 0, detractors: 0 } }
});
