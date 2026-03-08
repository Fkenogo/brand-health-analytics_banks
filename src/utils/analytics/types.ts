import { CountryCode } from '../../types';

export type LoyaltySegment = 
  | 'Committed' 
  | 'Favors' 
  | 'Potential' 
  | 'Rejectors' 
  | 'Accessibles';

export interface DemographicFilters {
  country?: CountryCode;
  ageGroups?: string[];
  genders?: string[];
  timePeriod?: string;
}

// Enhanced SurveyResponse based on the Methodology Docs
// Mapping to specific Section Questions
export interface AnalyticSurveyResponse {
  id: string;
  response_id: string;
  country: CountryCode;
  date: string;
  weight?: number; // For weighted analysis if needed

  // Section B: Demographics
  b2_age: string;
  gender: string;
  
  // Section C: Brand Awareness & Usage
  top_of_mind_brand: string | null;     // Q2a
  spontaneous_brands: string[];         // Q2b
  aided_brands: string[];               // Q3
  
  ever_used_brands: string[];           // Q4
  currently_using_brands: string[];     // Q5
  main_bank: string | null;             // Q6
  preferred_bank: string | null;        // Q4b (Methodology ref) / C9/C6 in raw data? 
                                        // Note: Methodology says "Preferred" is often Q4b or derived
  
  consideration_set: string[];          // Q9 / Banks would consider

  // Section E: NPS & Loyalty
  nps_score: number;                    // Q5 (0-10)
  satisfaction_drivers: Record<string, number>; // Attributes
  
  // Section D: Future Intent & Brand Perception
  future_intent: number;                // Q1 (0-10)
  relevance_brands: string[];           // Q2
  popularity_brand: string | null;      // Q3
  commitment_brand: string | null;      // Q4 (Single choice)
}

export interface FunnelMetrics {
  totalAwareness: number;
  consideration: number;
  everUsed: number;
  currentlyUsing: number;
  preferred: number;
}

export interface AwarenessMetrics {
  topOfMind: number;
  totalAwareness: number;
  spontaneousRecall: number;
  aidedAwareness: number;
  awarenessQuality: number; // TOM / Total Awareness
  shareOfVoice: number;
}

export interface MomentumMetrics {
  score: number;
  components: {
    awarenessGrowth: number;
    considerationRate: number;
    conversionRate: number;
    retentionRate: number;
    adoptionRate: number;
  };
  trend: 'rising' | 'declining' | 'stable';
}

export interface LoyaltyMetrics {
  distribution: Record<LoyaltySegment, number>;
  loyaltyIndex: number;
}

export interface DashboardAnalytics {
  awareness: AwarenessMetrics;
  midFunnel: FunnelMetrics;
  loyalty: LoyaltyMetrics;
  momentum: MomentumMetrics;
  nps: {
    score: number;
    breakdown: { promoters: number; passives: number; detractors: number };
  };
}
