import { demoBrandEdgeData, type DemoBrandEdgeData } from '@/data/demoBrandEdgeData';
import { computeBrandEdgeScore, describeBrandEdgeScore } from '@/utils/brandEdgeScore';
import { computeCustomerSwitchingRadar } from '@/utils/customerSwitchingRadar';

type DemoTrendPoint = {
  quarter: string;
  score: number;
};

type DemoExecutiveSnapshot = {
  multiBankShare: number;
  avgBanksPerCustomer: number;
  primaryBankLeader: string;
  primaryBankLeaderShare: number;
  topSecondChoiceCompetitor: string;
  topSecondChoiceShare: number;
  secondChoicePressureLabel: string;
};

type DemoBrandEdgePreview = {
  awareness: number;
  currentUsage: number;
  loyaltyIndex: number;
  multiBankShare: number;
  secondChoicePressureLabel: string;
  momentumTrend: number;
};

export type PublicDemoModel = {
  country: string;
  brandEdgeScore: number;
  brandEdgeLabel: string;
  executiveSnapshot: DemoExecutiveSnapshot;
  brandEdgePreview: DemoBrandEdgePreview;
  competitivePressureByBank: Record<string, number>;
  scoreTrend: DemoTrendPoint[];
  switchingRisk: number;
  switchingRadarBankOptions: string[];
};

const pct = (part: number, total: number): number => (total > 0 ? Math.round((part / total) * 100) : 0);
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const describeSecondChoicePressure = (share: number): string => {
  if (share >= 40) return 'High';
  if (share >= 25) return 'Moderate';
  return 'Contained';
};

const deriveTopSecondChoiceCompetitor = (data: DemoBrandEdgeData) => {
  const multiBankResponses = data.switchingRadarResponses.filter((response) =>
    (response.bank_count || response.c5_currently_using.length) > 1 && response.preferred_bank,
  );

  const counts = new Map<string, number>();
  multiBankResponses.forEach((response) => {
    const preferredBank = response.preferred_bank;
    if (!preferredBank) {
      return;
    }
    counts.set(preferredBank, (counts.get(preferredBank) || 0) + 1);
  });

  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const [leader = 'No signal', leaderCount = 0] = ranked[0] || [];
  const share = pct(leaderCount, multiBankResponses.length);

  return {
    competitor: leader,
    share,
    pressureLabel: describeSecondChoicePressure(share),
  };
};

const buildIllustrativeScoreTrend = (currentScore: number, momentumTrend: number): DemoTrendPoint[] => {
  const roundedDelta = Math.max(2, Math.round(momentumTrend));
  const start = clamp(currentScore - roundedDelta, 0, 100);
  const middle = clamp(Math.round((start + currentScore) / 2), 0, 100);

  return [
    { quarter: 'Q1', score: start },
    { quarter: 'Q2', score: middle },
    { quarter: 'Q3', score: currentScore },
  ];
};

export const buildPublicDemoModel = (data: DemoBrandEdgeData): PublicDemoModel => {
  const primaryBankEntries = Object.entries(data.primaryBankShare).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const [primaryBankLeader = 'Unknown', primaryBankLeaderShare = 0] = primaryBankEntries[0] || [];
  const secondChoiceLeader = deriveTopSecondChoiceCompetitor(data);
  const brandEdgeScore = computeBrandEdgeScore({
    awareness: data.awareness,
    usage: data.usage,
    loyalty: data.loyalty,
    primaryShare: primaryBankLeaderShare,
    switchingRisk: data.switchingRisk,
  });

  return {
    country: data.country,
    brandEdgeScore,
    brandEdgeLabel: describeBrandEdgeScore(brandEdgeScore),
    executiveSnapshot: {
      multiBankShare: data.multiBankShare,
      avgBanksPerCustomer: data.avgBanksPerCustomer,
      primaryBankLeader,
      primaryBankLeaderShare,
      topSecondChoiceCompetitor: secondChoiceLeader.competitor,
      topSecondChoiceShare: secondChoiceLeader.share,
      secondChoicePressureLabel: secondChoiceLeader.pressureLabel,
    },
    brandEdgePreview: {
      awareness: data.awareness,
      currentUsage: data.usage,
      loyaltyIndex: data.loyalty,
      multiBankShare: data.multiBankShare,
      secondChoicePressureLabel: secondChoiceLeader.pressureLabel,
      momentumTrend: data.momentumTrend,
    },
    competitivePressureByBank: data.primaryBankShare,
    scoreTrend: buildIllustrativeScoreTrend(brandEdgeScore, data.momentumTrend),
    switchingRisk: data.switchingRisk,
    switchingRadarBankOptions: Array.from(new Set(data.switchingRadarResponses.flatMap((response) => response.c5_currently_using))).sort(),
  };
};

export const publicDemoModel = buildPublicDemoModel(demoBrandEdgeData);

export const getSelectedBankSwitchingRadar = (selectedBankId: string) =>
  computeCustomerSwitchingRadar(demoBrandEdgeData.switchingRadarResponses, selectedBankId);
