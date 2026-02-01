import { getResponses } from './storage';
import { SurveyResponse } from '../types';
import { BANKS } from '../constants';

// Simulated API Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface DashboardMetrics {
  bank_id: string;
  metrics: {
    topOfMind: { value: number; rank: number; change: number };
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

const calculateNPSForSegment = (segment: SurveyResponse[], bankId: string): number => {
  const npsField = `c10_nps_${bankId}`;
  const scores = segment
    .map(r => r[npsField] ?? r.c10_nps)
    .filter(s => typeof s === 'number');
  
  if (scores.length === 0) return 0;
  const p = scores.filter(s => s >= 9).length;
  const d = scores.filter(s => s <= 6).length;
  return Math.round(((p - d) / scores.length) * 100);
};

export const fetchDashboardMetrics = async (bankId: string, filters: any): Promise<DashboardMetrics> => {
  await delay(600); 
  
  const allResponses = getResponses();
  const filtered = allResponses.filter(res => {
    const countryMatch = !filters.country || res.selected_country === filters.country;
    const ageMatch = !filters.ageGroups?.length || filters.ageGroups.includes(res.b2_age);
    const genderMatch = !filters.genders?.length || filters.genders.includes(res.gender);
    return countryMatch && ageMatch && genderMatch;
  });

  const total = filtered.length || 1;
  
  // Awareness metrics
  const tomScores: Record<string, number> = {};
  const totalAwareScores: Record<string, number> = {};
  
  BANKS.forEach(b => {
    const mentions = filtered.filter(r => {
      const input = (r.c1_first_bank || '').trim().toLowerCase();
      return b.name.toLowerCase().includes(input) || b.aliases?.some(a => a.toLowerCase() === input);
    }).length;
    tomScores[b.id] = (mentions / total) * 100;
    
    const awareCount = filtered.filter(r => (r.c3_aware_banks || []).includes(b.id)).length;
    totalAwareScores[b.id] = (awareCount / total) * 100;
  });

  // Momentum Stages
  const awareCount = filtered.filter(r => (r.c3_aware_banks || []).includes(bankId)).length;
  const considerCount = filtered.filter(r => (r.c9_would_consider || []).includes(bankId)).length;
  const everUsedCount = filtered.filter(r => (r.c4_ever_used || []).includes(bankId)).length;
  const currentUsedCount = filtered.filter(r => (r.c5_currently_using || []).includes(bankId)).length;
  const preferredCount = filtered.filter(r => r.c6_often_used === bankId).length;

  const conversion = awareCount > 0 ? (everUsedCount / awareCount) * 100 : 0;
  const retention = everUsedCount > 0 ? (currentUsedCount / everUsedCount) * 100 : 0;
  const adoption = currentUsedCount > 0 ? (preferredCount / currentUsedCount) * 100 : 0;
  const momentumScore = (conversion + retention + adoption) / 3;

  // Loyalty Tiers
  const committed = filtered.filter(r => r.c9_only_consider === bankId).length;
  const favors = filtered.filter(r => (r.c9_favourites || []).includes(bankId)).length;
  const potential = filtered.filter(r => (r.c9_would_consider || []).includes(bankId) || (r.c9_interested_dont_know || []).includes(bankId)).length;
  const rejectors = filtered.filter(r => (r.c9_never_consider || []).includes(bankId)).length;
  const accessibles = total - awareCount;

  // Snapshot Segments & NPS
  const nonTriers = filtered.filter(r => (r.c3_aware_banks || []).includes(bankId) && !(r.c4_ever_used || []).includes(bankId));
  const lapsers = filtered.filter(r => (r.c4_ever_used || []).includes(bankId) && !(r.c5_currently_using || []).includes(bankId));
  const nonBumo = filtered.filter(r => (r.c5_currently_using || []).includes(bankId) && r.c6_often_used !== bankId);
  const bumo = filtered.filter(r => r.c6_often_used === bankId);

  return {
    bank_id: bankId,
    metrics: {
      topOfMind: { value: Math.round(tomScores[bankId] || 0), rank: calculateRank(tomScores, bankId), change: 3 },
      totalAwareness: { value: Math.round(totalAwareScores[bankId] || 0), rank: calculateRank(totalAwareScores, bankId), change: 2 },
      awarenessQuality: { value: Math.round((tomScores[bankId] / (totalAwareScores[bankId] || 1)) * 100) },
      nps: { 
        value: calculateNPSForSegment(filtered, bankId), 
        rank: 1, change: 3, 
        p: 30, pass: 40, d: 30 
      },
      momentum: {
        value: Math.round(momentumScore),
        rank: 2,
        change: 1,
        awareness: Math.round((awareCount / total) * 100),
        consideration: Math.round((considerCount / total) * 100),
        everUsed: Math.round((everUsedCount / total) * 100),
        current: Math.round((currentUsedCount / total) * 100),
        preferred: Math.round((preferredCount / total) * 100),
        conversion: Math.round(conversion),
        retention: Math.round(retention),
        adoption: Math.round(adoption)
      },
      consideration: { value: Math.round((considerCount / total) * 100), rank: 3, change: 4 },
      loyalty: {
        committed: Math.round((committed / total) * 100),
        favors: Math.round((favors / total) * 100),
        potential: Math.round((potential / total) * 100),
        rejectors: Math.round((rejectors / total) * 100),
        accessibles: Math.round((accessibles / total) * 100)
      },
      snapshot: {
        aware: Math.round((awareCount / total) * 100),
        notAware: Math.round(((total - awareCount) / total) * 100),
        triers: Math.round((everUsedCount / total) * 100),
        nonTriers: Math.round((nonTriers.length / total) * 100),
        current: Math.round((currentUsedCount / total) * 100),
        lapsers: Math.round((lapsers.length / total) * 100),
        bumo: Math.round((bumo.length / total) * 100),
        nonBumo: Math.round((nonBumo.length / total) * 100),
        nps: {
          nonTriers: calculateNPSForSegment(nonTriers, bankId),
          lapsers: calculateNPSForSegment(lapsers, bankId),
          nonBumo: calculateNPSForSegment(nonBumo, bankId),
          bumo: calculateNPSForSegment(bumo, bankId)
        }
      }
    },
    sampleSize: filtered.length,
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
  const allResponses = getResponses();
  const filtered = country ? allResponses.filter(r => r.selected_country === country) : allResponses;
  const total = filtered.length || 1;

  // Pre-calculate ranks for all banks for competitive table
  const tomScores: Record<string, number> = {};
  const awarenessScores: Record<string, number> = {};
  const npsScores: Record<string, number> = {};
  const considerationScores: Record<string, number> = {};

  const countryBanks = country 
    ? BANKS.filter(b => b.country === country)
    : BANKS;

  countryBanks.forEach(b => {
    const tomMentions = filtered.filter(r => {
      const input = (r.c1_first_bank || '').trim().toLowerCase();
      return b.name.toLowerCase().includes(input) || b.aliases?.some(a => a.toLowerCase() === input);
    }).length;
    tomScores[b.id] = (tomMentions / total) * 100;

    const awareCount = filtered.filter(r => (r.c3_aware_banks || []).includes(b.id)).length;
    awarenessScores[b.id] = (awareCount / total) * 100;

    npsScores[b.id] = calculateNPSForSegment(filtered, b.id);

    const considerCount = filtered.filter(r => (r.c9_would_consider || []).includes(b.id)).length;
    considerationScores[b.id] = (considerCount / total) * 100;
  });

  return countryBanks.map((b) => {
    const awareCount = filtered.filter(r => (r.c3_aware_banks || []).includes(b.id)).length;
    const committed = filtered.filter(r => r.c9_only_consider === b.id).length;
    const favors = filtered.filter(r => (r.c9_favourites || []).includes(b.id)).length;
    const potential = filtered.filter(r => (r.c9_would_consider || []).includes(b.id)).length;
    const rejectors = filtered.filter(r => (r.c9_never_consider || []).includes(b.id)).length;

    return {
      id: b.id,
      name: b.name.split(' (')[0],
      tom: Math.round(tomScores[b.id]),
      total: Math.round(awarenessScores[b.id]),
      nps: npsScores[b.id],
      consideration: Math.round(considerationScores[b.id]),
      trend: 1.2,
      loyalty: {
        committed: Math.round((committed / total) * 100),
        favors: Math.round((favors / total) * 100),
        potential: Math.round((potential / total) * 100),
        rejectors: Math.round((rejectors / total) * 100),
        accessibles: Math.round(((total - awareCount) / total) * 100)
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
