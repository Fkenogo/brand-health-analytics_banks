import { getResponses } from './storage';
import { BANKS } from '../constants';
import { normalizeResponse, calculateMetrics, determineLoyaltySegment } from './analytics/DataProcessor';
import { AnalyticSurveyResponse } from './analytics/types';

// Simulated API Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface DashboardMetrics {
  bank_id: string;
  metrics: {
    topOfMind: { value: number; rank: number; change: number };
    spontaneous: { value: number; rank: number; change: number };
    totalAwareness: { value: number; rank: number; change: number };
    awarenessQuality: { value: number };
    nps: { value: number; rank: number; change: number; p: number; pass: number; d: number };
    momentum: { 
      value: number; 
      rank: number; 
      change: number;
      awareness: number;
      consideration: number;
      everUsed: number;
      current: number;
      preferred: number;
      conversion: number;
      retention: number;
      adoption: number;
    };
    consideration: { value: number; rank: number; change: number };
    loyalty: {
      committed: number;
      favors: number;
      potential: number;
      rejectors: number;
      accessibles: number;
    };
    snapshot: {
      aware: number;
      notAware: number;
      triers: number;
      nonTriers: number;
      current: number;
      lapsers: number;
      bumo: number;
      nonBumo: number;
      nps: {
        nonTriers: number;
        lapsers: number;
        nonBumo: number;
        bumo: number;
      }
    };
  };
  sampleSize: number;
  timestamp: string;
}

export interface TrendData {
  month: string;
  awareness: number;
  nps: number;
  usage: number;
}

export interface CompetitorData {
  id: string;
  name: string;
  tom: number;
  total: number;
  nps: number;
  consideration: number;
  trend: number;
  usage: {
    everUsed: number;
    current: number;
    preferred: number;
  };
  loyalty: {
    committed: number;
    favors: number;
    potential: number;
    rejectors: number;
    accessibles: number;
  };
}

export interface NPSDriver {
  attribute: string;
  performance: number; // 0-100
  importance: number;  // Correlation coefficient (0-1)
  impact: 'positive' | 'negative';
  rank: number;
}

const calculateRank = (scores: Record<string, number>, targetId: string): number => {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const rank = sorted.findIndex(([id]) => id === targetId) + 1;
  return rank > 0 ? rank : sorted.length + 1;
};

// Helper to filter normalized responses
const filterResponses = (responses: AnalyticSurveyResponse[], filters: Record<string, unknown>) => {
  return responses.filter(res => {
     const countryMatch = !filters.country || res.country === filters.country;
     const ageMatch = !filters.ageGroups || !Array.isArray(filters.ageGroups) || filters.ageGroups.length === 0 || filters.ageGroups.includes(res.b2_age);
     const genderMatch = !filters.genders || !Array.isArray(filters.genders) || filters.genders.length === 0 || filters.genders.includes(res.gender);
     return countryMatch && ageMatch && genderMatch;
  });
};

export const fetchDashboardMetrics = async (bankId: string, filters: Record<string, unknown>): Promise<DashboardMetrics> => {
  await delay(600); 
  
  const allRaw = getResponses();
  const allNormalized = allRaw.map(normalizeResponse);
  const filtered = filterResponses(allNormalized, filters);
  const total = filtered.length || 1;
  
  // Calculate metrics for the target bank using new processor
  const analytics = calculateMetrics(filtered, bankId);
  
  // Calculate Ranks (Need scores for all banks)
  const allBanks = BANKS; 
  // Awareness metrics
  const tomScores: Record<string, number> = {};
  const spontaneousScores: Record<string, number> = {};
  const totalAwareScores: Record<string, number> = {};
  
  allBanks.forEach(b => {
     const bMetrics = calculateMetrics(filtered, b.id);
     tomScores[b.id] = bMetrics.awareness.topOfMind;
     spontaneousScores[b.id] = bMetrics.awareness.spontaneousRecall;
     totalAwareScores[b.id] = bMetrics.awareness.totalAwareness;
  });

  // Calculate Snapshot segments
  const awarePct = analytics.midFunnel.totalAwareness;
  const everUsedPct = analytics.midFunnel.everUsed;
  const currentPct = analytics.midFunnel.currentlyUsing;
  const preferredPct = analytics.midFunnel.preferred;
  
  const notAwarePct = 100 - awarePct;
  const triersPct = everUsedPct;
  const nonTriersPct = awarePct - everUsedPct;
  const lapsersPct = everUsedPct - currentPct;
  const bumoPct = preferredPct;
  const nonBumoPct = currentPct - preferredPct;

  return {
    bank_id: bankId,
    metrics: {
      topOfMind: { value: Math.round(analytics.awareness.topOfMind), rank: calculateRank(tomScores, bankId), change: 3 },
      spontaneous: { value: Math.round(analytics.awareness.spontaneousRecall), rank: calculateRank(spontaneousScores, bankId), change: 2 },
      totalAwareness: { value: Math.round(analytics.awareness.totalAwareness), rank: calculateRank(totalAwareScores, bankId), change: 2 },
      awarenessQuality: { value: Math.round(analytics.awareness.awarenessQuality) },
      nps: { 
        value: Math.round(analytics.nps.score), 
        rank: 1, change: 3, 
        p: analytics.nps.breakdown.promoters, 
        pass: analytics.nps.breakdown.passives, 
        d: analytics.nps.breakdown.detractors 
      },
      momentum: { 
        value: Math.round(analytics.momentum.score), 
        rank: 2, 
        change: 1,
        awareness: Math.round(analytics.midFunnel.totalAwareness),
        consideration: Math.round(analytics.midFunnel.consideration),
        everUsed: Math.round(analytics.midFunnel.everUsed),
        current: Math.round(analytics.midFunnel.currentlyUsing),
        preferred: Math.round(analytics.midFunnel.preferred),
        conversion: Math.round(analytics.momentum.components.conversionRate),
        retention: Math.round(analytics.momentum.components.retentionRate),
        adoption: Math.round(analytics.momentum.components.adoptionRate)
      },
      consideration: { value: Math.round(analytics.midFunnel.consideration), rank: 3, change: 4 },
      loyalty: {
        committed: Math.round((analytics.loyalty.distribution.Committed / total) * 100),
        favors: Math.round((analytics.loyalty.distribution.Favors / total) * 100),
        potential: Math.round((analytics.loyalty.distribution.Potential / total) * 100),
        rejectors: Math.round((analytics.loyalty.distribution.Rejectors / total) * 100),
        accessibles: Math.round((analytics.loyalty.distribution.Accessibles / total) * 100)
      },
      snapshot: {
        aware: Math.round(awarePct),
        notAware: Math.round(notAwarePct),
        triers: Math.round(triersPct),
        nonTriers: Math.round(nonTriersPct),
        current: Math.round(currentPct),
        lapsers: Math.round(lapsersPct),
        bumo: Math.round(bumoPct),
        nonBumo: Math.round(nonBumoPct),
        nps: {
          nonTriers: 0, // Placeholder
          lapsers: 0,
          nonBumo: 0,
          bumo: 0
        }
      }
    },
    sampleSize: total,
    timestamp: new Date().toISOString()
  };
};

export const fetchTrendData = async (bankId: string): Promise<TrendData[]> => {
  await delay(400);
  return [
    { month: 'Aug', awareness: 68, nps: 22, usage: 12 },
    { month: 'Sep', awareness: 70, nps: 24, usage: 13 },
    { month: 'Oct', awareness: 72, nps: 26, usage: 14 },
    { month: 'Nov', awareness: 71, nps: 25, usage: 14 },
    { month: 'Dec', awareness: 74, nps: 27, usage: 15 },
    { month: 'Jan', awareness: 75, nps: 28, usage: 15 },
  ];
};

export const fetchCompetitorData = async (country?: string): Promise<CompetitorData[]> => {
  await delay(800);
  const allRaw = getResponses();
  const allNormalized = allRaw.map(normalizeResponse);
  const filtered = country ? allNormalized.filter(r => r.country === country) : allNormalized;
  const total = filtered.length || 1;

  const countryBanks = country 
    ? BANKS.filter(b => b.country === country)
    : BANKS;

  return countryBanks.map((b) => {
    const metrics = calculateMetrics(filtered, b.id);
    
    return {
      id: b.id,
      name: b.name.split(' (')[0],
      tom: Math.round(metrics.awareness.topOfMind),
      total: Math.round(metrics.awareness.totalAwareness),
      nps: Math.round(metrics.nps.score),
      consideration: Math.round(metrics.midFunnel.consideration),
      trend: 1.2,
      usage: {
        everUsed: Math.round(metrics.midFunnel.everUsed),
        current: Math.round(metrics.midFunnel.currentlyUsing),
        preferred: Math.round(metrics.midFunnel.preferred)
      },
      loyalty: {
        committed: Math.round((metrics.loyalty.distribution.Committed / total) * 100),
        favors: Math.round((metrics.loyalty.distribution.Favors / total) * 100),
        potential: Math.round((metrics.loyalty.distribution.Potential / total) * 100),
        rejectors: Math.round((metrics.loyalty.distribution.Rejectors / total) * 100),
        accessibles: Math.round((metrics.loyalty.distribution.Accessibles / total) * 100)
      }
    };
  }).sort((a, b) => b.total - a.total);
};

export const fetchNPSDrivers = async (bankId: string): Promise<NPSDriver[]> => {
  await delay(700);
  return [
    { attribute: 'Digital Trust', performance: 82, importance: 0.88, impact: 'positive', rank: 1 },
    { attribute: 'Mobile App', performance: 74, importance: 0.75, impact: 'positive', rank: 2 },
    { attribute: 'Service Speed', performance: 45, importance: 0.82, impact: 'negative', rank: 3 },
    { attribute: 'Fee Transparency', performance: 61, importance: 0.65, impact: 'positive', rank: 4 }
  ];
};

