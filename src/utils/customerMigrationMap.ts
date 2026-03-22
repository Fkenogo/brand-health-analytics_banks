import {
  getCompetitiveSignalBankCount,
  type CompetitiveSignalResponse,
} from '@/utils/customerSwitchingRadar';

export type CustomerMigrationRow = {
  competitor: string;
  count: number;
  share: number;
};

export type CustomerMigrationMapResult = {
  selectedBankId: string;
  selectedBankUserBase: number;
  selectedBankMultiBankBase: number;
  selectedBankPreferredBase: number;
  migrationAwayBase: number;
  lowSample: boolean;
  hasData: boolean;
  emptyReason: 'NO_MIGRATION_AWAY_BASE' | 'NO_SELECTED_BANK_USERS' | null;
  topMigrationCompetitor: string | null;
  multiBankRateAmongSelectedUsers: number;
  driftRateAmongSelectedMultiBankUsers: number;
  rows: CustomerMigrationRow[];
};

const pct = (part: number, total: number): number => (total > 0 ? Math.round((part / total) * 100) : 0);

type ComputeCustomerMigrationMapOptions = {
  lowSampleThreshold?: number;
};

export const computeCustomerMigrationMap = (
  responses: CompetitiveSignalResponse[],
  selectedBankId: string,
  options?: ComputeCustomerMigrationMapOptions,
): CustomerMigrationMapResult => {
  const lowSampleThreshold = options?.lowSampleThreshold ?? 15;

  const selectedBankUsers = responses.filter((response) => (response.c5_currently_using || []).includes(selectedBankId));
  const selectedBankUserBase = selectedBankUsers.length;

  if (selectedBankUserBase === 0) {
    return {
      selectedBankId,
      selectedBankUserBase: 0,
      selectedBankMultiBankBase: 0,
      selectedBankPreferredBase: 0,
      migrationAwayBase: 0,
      lowSample: false,
      hasData: false,
      emptyReason: 'NO_SELECTED_BANK_USERS',
      topMigrationCompetitor: null,
      multiBankRateAmongSelectedUsers: 0,
      driftRateAmongSelectedMultiBankUsers: 0,
      rows: [],
    };
  }

  const selectedBankMultiBankUsers = selectedBankUsers.filter((response) => getCompetitiveSignalBankCount(response) > 1);
  const selectedBankMultiBankBase = selectedBankMultiBankUsers.length;
  const selectedBankPreferredBase = selectedBankMultiBankUsers.filter((response) => response.preferred_bank === selectedBankId).length;
  const migrationAwayPool = selectedBankMultiBankUsers.filter((response) => Boolean(response.preferred_bank) && response.preferred_bank !== selectedBankId);
  const migrationAwayBase = migrationAwayPool.length;

  if (migrationAwayBase === 0) {
    return {
      selectedBankId,
      selectedBankUserBase,
      selectedBankMultiBankBase,
      selectedBankPreferredBase,
      migrationAwayBase: 0,
      lowSample: selectedBankMultiBankBase > 0 && selectedBankMultiBankBase < lowSampleThreshold,
      hasData: false,
      emptyReason: 'NO_MIGRATION_AWAY_BASE',
      topMigrationCompetitor: null,
      multiBankRateAmongSelectedUsers: pct(selectedBankMultiBankBase, selectedBankUserBase),
      driftRateAmongSelectedMultiBankUsers: 0,
      rows: [],
    };
  }

  const counts = new Map<string, number>();
  migrationAwayPool.forEach((response) => {
    const preferred = response.preferred_bank as string;
    counts.set(preferred, (counts.get(preferred) || 0) + 1);
  });

  const rows = Array.from(counts.entries())
    .map(([competitor, count]) => ({
      competitor,
      count,
      share: pct(count, migrationAwayBase),
    }))
    .sort((a, b) => (
      b.count - a.count ||
      b.share - a.share ||
      a.competitor.localeCompare(b.competitor)
    ));

  return {
    selectedBankId,
    selectedBankUserBase,
    selectedBankMultiBankBase,
    selectedBankPreferredBase,
    migrationAwayBase,
    lowSample: selectedBankMultiBankBase < lowSampleThreshold,
    hasData: rows.length > 0,
    emptyReason: rows.length > 0 ? null : 'NO_MIGRATION_AWAY_BASE',
    topMigrationCompetitor: rows[0]?.competitor || null,
    multiBankRateAmongSelectedUsers: pct(selectedBankMultiBankBase, selectedBankUserBase),
    driftRateAmongSelectedMultiBankUsers: pct(migrationAwayBase, selectedBankMultiBankBase),
    rows,
  };
};
