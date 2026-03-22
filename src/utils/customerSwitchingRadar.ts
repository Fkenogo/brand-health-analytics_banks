export type CompetitiveSignalResponse = {
  bank_count?: number;
  c5_currently_using?: string[];
  preferred_bank?: string | null;
};

export type SwitchingRadarCompetitorRow = {
  competitor: string;
  secondChoiceCount: number;
  secondChoiceShare: number;
  overlapCount: number;
  overlapShare: number;
  switchingPressureScore: number;
};

export type CustomerSwitchingRadarResult = {
  selectedBankId: string;
  multiBankUsingSelectedBase: number;
  secondChoiceBase: number;
  lowSample: boolean;
  hasData: boolean;
  emptyReason: 'NO_SELECTED_MULTI_BANK_USERS' | null;
  competitors: SwitchingRadarCompetitorRow[];
};

export const computeSwitchingPressureScore = (secondChoiceShare: number, overlapShare: number): number =>
  Math.round((0.6 * secondChoiceShare) + (0.4 * overlapShare));

const pct = (part: number, total: number): number => (total > 0 ? Math.round((part / total) * 100) : 0);

export const getCompetitiveSignalBankCount = (response: CompetitiveSignalResponse): number =>
  response.bank_count || (response.c5_currently_using || []).length;

type ComputeCustomerSwitchingRadarOptions = {
  lowSampleThreshold?: number;
};

export const computeCustomerSwitchingRadar = (
  responses: CompetitiveSignalResponse[],
  selectedBankId: string,
  options?: ComputeCustomerSwitchingRadarOptions,
): CustomerSwitchingRadarResult => {
  const lowSampleThreshold = options?.lowSampleThreshold ?? 15;

  const multiBankUsingSelected = responses.filter((response) =>
    getCompetitiveSignalBankCount(response) > 1 && (response.c5_currently_using || []).includes(selectedBankId),
  );

  const multiBankUsingSelectedBase = multiBankUsingSelected.length;
  if (multiBankUsingSelectedBase === 0) {
    return {
      selectedBankId,
      multiBankUsingSelectedBase: 0,
      secondChoiceBase: 0,
      lowSample: false,
      hasData: false,
      emptyReason: 'NO_SELECTED_MULTI_BANK_USERS',
      competitors: [],
    };
  }

  const secondChoiceCounts = new Map<string, number>();
  const overlapCounts = new Map<string, number>();

  multiBankUsingSelected.forEach((response) => {
    const usedBanks = [...new Set(response.c5_currently_using || [])];
    const preferred = response.preferred_bank;

    if (preferred && preferred !== selectedBankId) {
      secondChoiceCounts.set(preferred, (secondChoiceCounts.get(preferred) || 0) + 1);
    }

    usedBanks
      .filter((bankId) => bankId !== selectedBankId)
      .forEach((bankId) => {
        overlapCounts.set(bankId, (overlapCounts.get(bankId) || 0) + 1);
      });
  });

  const secondChoiceBase = Array.from(secondChoiceCounts.values()).reduce((sum, count) => sum + count, 0);
  const competitorSet = new Set<string>([
    ...Array.from(secondChoiceCounts.keys()),
    ...Array.from(overlapCounts.keys()),
  ]);

  const competitors = Array.from(competitorSet)
    .map((competitor) => {
      const secondChoiceCount = secondChoiceCounts.get(competitor) || 0;
      const overlapCount = overlapCounts.get(competitor) || 0;
      const secondChoiceShare = pct(secondChoiceCount, secondChoiceBase);
      const overlapShare = pct(overlapCount, multiBankUsingSelectedBase);
      return {
        competitor,
        secondChoiceCount,
        secondChoiceShare,
        overlapCount,
        overlapShare,
        switchingPressureScore: computeSwitchingPressureScore(secondChoiceShare, overlapShare),
      };
    })
    .sort((a, b) => (
      b.switchingPressureScore - a.switchingPressureScore ||
      b.secondChoiceShare - a.secondChoiceShare ||
      b.overlapShare - a.overlapShare ||
      a.competitor.localeCompare(b.competitor)
    ));

  return {
    selectedBankId,
    multiBankUsingSelectedBase,
    secondChoiceBase,
    lowSample: multiBankUsingSelectedBase < lowSampleThreshold,
    hasData: competitors.length > 0,
    emptyReason: competitors.length > 0 ? null : 'NO_SELECTED_MULTI_BANK_USERS',
    competitors,
  };
};
