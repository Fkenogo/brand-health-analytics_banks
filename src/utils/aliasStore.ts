import { ALL_BANKS } from '@/constants';

const ALIAS_KEY = 'bank_aliases_v1';

interface AliasState {
  [bankId: string]: {
    active: string[];
    inactive: string[];
  };
}

const readAliases = (): AliasState => {
  try {
    const raw = localStorage.getItem(ALIAS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeAliases = (state: AliasState): void => {
  localStorage.setItem(ALIAS_KEY, JSON.stringify(state));
};

export const aliasStore = {
  listAll: (): AliasState => readAliases(),
  getAliases: (bankId: string): string[] => {
    const state = readAliases();
    return state[bankId]?.active || [];
  },
  addAlias: (bankId: string, alias: string): void => {
    const state = readAliases();
    const entry = state[bankId] || { active: [], inactive: [] };
    const normalized = alias.trim();
    if (!normalized) return;
    const hasActive = entry.active.some(item => item.toLowerCase() === normalized.toLowerCase());
    if (!hasActive) {
      entry.active.push(normalized);
    }
    entry.inactive = entry.inactive.filter(item => item.toLowerCase() !== normalized.toLowerCase());
    state[bankId] = entry;
    writeAliases(state);
  },
  deactivateAlias: (bankId: string, alias: string): void => {
    const state = readAliases();
    const entry = state[bankId] || { active: [], inactive: [] };
    entry.active = entry.active.filter(item => item.toLowerCase() !== alias.toLowerCase());
    const hasInactive = entry.inactive.some(item => item.toLowerCase() === alias.toLowerCase());
    if (!hasInactive) entry.inactive.push(alias);
    state[bankId] = entry;
    writeAliases(state);
  },
  listBanksWithAliases: () => {
    const state = readAliases();
    return ALL_BANKS.map(bank => ({
      bank,
      aliases: state[bank.id]?.active || [],
      inactive: state[bank.id]?.inactive || [],
    }));
  }
};
