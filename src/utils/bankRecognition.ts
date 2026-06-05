import { ALL_BANKS, CONFIDENCE_THRESHOLD, MAX_SUGGESTIONS } from '../constants';
import type { Bank, CountryCode } from '../types';
import { aliasStore } from './aliasStore';

export interface RecognitionResult {
  input: string;
  recognized: boolean;
  standardName: string | null;
  bankId: string | null;
  confidence: number;
  suggestions?: string[];
  // Alias properties for compatibility
  bank_id?: string | null;
  matched_name?: string | null;
  recognition_confidence?: number;
  recognized_bank_id?: string | null;
  raw_input?: string;
}

export interface SpontaneousResult {
  rawInput: string;
  banks: RecognitionResult[];
  // Alias properties for compatibility
  recognized_banks: RecognitionResult[];
  unrecognized_entries: string[];
  recognized_bank_ids: string[];
  excluded_entries?: string[];
  raw_input?: string;
}

export interface AwarenessData {
  topOfMind: RecognitionResult;
  spontaneous: SpontaneousResult;
  total: string[];
  // Alias properties for compatibility
  top_of_mind: {
    raw_input: string;
    recognized_bank_id: string | null;
    recognition_confidence: number;
  };
  assisted: {
    selected_bank_ids: string[];
  };
  total_awareness: string[];
  recognized_bank_ids: string[];
}

const normalize = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const buildInitials = (value: string): string => {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0) return value;
  return words.map(word => word[0]).join('');
};

interface CandidateVariant {
  value: string;
  sourceWeight: number;
}

const dedupeCandidates = (variants: CandidateVariant[]): CandidateVariant[] => {
  const seen = new Map<string, CandidateVariant>();
  variants.forEach((variant) => {
    const current = seen.get(variant.value);
    if (!current || variant.sourceWeight > current.sourceWeight) {
      seen.set(variant.value, variant);
    }
  });
  return Array.from(seen.values());
};

const getBankCandidates = (bank: Bank): CandidateVariant[] => {
  const baseId = bank.id.split('_')[0];
  const name = bank.name;
  const nameWithoutBank = name.replace(/\bbank\b/i, '').trim();
  const withBankSuffix = name.toLowerCase().includes('bank') ? name : `${name} Bank`;
  const initials = buildInitials(nameWithoutBank || name);
  const variants: CandidateVariant[] = [
    { value: name, sourceWeight: 6 },
    { value: nameWithoutBank, sourceWeight: 5 },
    { value: withBankSuffix, sourceWeight: 5 },
    { value: bank.id, sourceWeight: 3 },
    { value: baseId, sourceWeight: 4 },
    { value: initials, sourceWeight: 3 },
    { value: `${baseId} bank`, sourceWeight: 3 },
  ];
  const aliases = bank.aliases || [];
  const dynamicAliases = (() => {
    try {
      return aliasStore.getAliases(bank.id);
    } catch (error) {
      console.warn('Alias store error for bank', bank.id, error);
      return [];
    }
  })();
  const generic = new Set(['bank', 'finance', 'credit', 'union', 'trust']);
  return dedupeCandidates(
    variants
      .concat(aliases.map((alias) => ({ value: alias, sourceWeight: 7 })))
      .concat(dynamicAliases.map((alias) => ({ value: alias, sourceWeight: 7 })))
      .map((variant) => ({ ...variant, value: normalize(variant.value) }))
      .filter((variant) => variant.value && variant.value.length >= 3 && !generic.has(variant.value))
  );
};

export const levenshteinDistance = (str1: string, str2: string): number => {
  const a = str1.split('');
  const b = str2.split('');
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

type MatchType = 'exact' | 'startsWith' | 'contains' | 'fuzzy';

const MATCH_TYPE_WEIGHTS: Record<MatchType, number> = {
  exact: 4,
  startsWith: 3,
  contains: 2,
  fuzzy: 1,
};

const similarityScore = (input: string, candidate: string): { score: number; type: MatchType; distance: number; lengthDelta: number } => {
  const normalizedInput = normalize(input);
  const normalizedCandidate = normalize(candidate);
  if (!normalizedInput || !normalizedCandidate) return { score: 0, type: 'fuzzy', distance: Number.POSITIVE_INFINITY, lengthDelta: Number.POSITIVE_INFINITY };
  if (normalizedInput === normalizedCandidate) return { score: 1.0, type: 'exact', distance: 0, lengthDelta: 0 };
  if (normalizedCandidate.startsWith(normalizedInput) || normalizedInput.startsWith(normalizedCandidate)) {
    return {
      score: 0.9,
      type: 'startsWith',
      distance: levenshteinDistance(normalizedInput, normalizedCandidate),
      lengthDelta: Math.abs(normalizedInput.length - normalizedCandidate.length),
    };
  }
  if (normalizedCandidate.includes(normalizedInput) || normalizedInput.includes(normalizedCandidate)) {
    return {
      score: 0.8,
      type: 'contains',
      distance: levenshteinDistance(normalizedInput, normalizedCandidate),
      lengthDelta: Math.abs(normalizedInput.length - normalizedCandidate.length),
    };
  }

  const distance = levenshteinDistance(normalizedInput, normalizedCandidate);
  const maxLen = Math.max(normalizedInput.length, normalizedCandidate.length);
  if (maxLen === 0) return { score: 0, type: 'fuzzy', distance: 0, lengthDelta: 0 };
  return {
    score: Math.max(0, 1 - distance / maxLen),
    type: 'fuzzy',
    distance,
    lengthDelta: Math.abs(normalizedInput.length - normalizedCandidate.length),
  };
};

const EXTRA_BANKS: Bank[] = [
  { id: 'ZENITH_RW', name: 'Zenith Bank', country: 'rwanda' },
  { id: 'FIRST_RW', name: 'First Bank', country: 'rwanda' },
];

const getBanksByCountry = (country?: CountryCode): Bank[] => {
  const allBanks = [...ALL_BANKS, ...EXTRA_BANKS];
  if (!country) return allBanks;
  return allBanks.filter(bank => bank.country === country);
};

const getDisplayName = (bank: Bank, input: string): string => {
  if (bank.name.toLowerCase().includes('bank')) return bank.name;
  if (input.toLowerCase().includes('bank')) return `${bank.name} Bank`;
  return bank.name;
};

const buildRecognitionResult = (
  input: string,
  recognized: boolean,
  standardName: string | null,
  bankId: string | null,
  confidence: number,
  suggestions?: string[]
): RecognitionResult => ({
  input,
  recognized,
  standardName,
  bankId,
  confidence,
  suggestions,
  bank_id: bankId,
  matched_name: standardName,
  recognition_confidence: confidence,
  recognized_bank_id: bankId,
  raw_input: input,
});

export const recognizeTopOfMindBank = (input: string, country: CountryCode = 'rwanda'): RecognitionResult => {
  const trimmed = input.trim();
  if (!trimmed) {
    return buildRecognitionResult(input, false, null, null, 0, []);
  }

  const banks = getBanksByCountry(country);
  let bestMatch: {
    bank: Bank;
    score: number;
    type: MatchType;
    distance: number;
    lengthDelta: number;
    sourceWeight: number;
    candidate: string;
  } | null = null;

  banks.forEach(bank => {
    const candidates = getBankCandidates(bank);
    candidates.forEach(({ value: candidate, sourceWeight }) => {
      const result = similarityScore(trimmed, candidate);
      const nextMatch = {
        bank,
        score: result.score,
        type: result.type,
        distance: result.distance,
        lengthDelta: result.lengthDelta,
        sourceWeight,
        candidate,
      };
      if (!bestMatch) {
        bestMatch = nextMatch;
        return;
      }
      if (nextMatch.score > bestMatch.score + 0.015) {
        bestMatch = nextMatch;
        return;
      }
      if (Math.abs(nextMatch.score - bestMatch.score) <= 0.015) {
        if (MATCH_TYPE_WEIGHTS[nextMatch.type] > MATCH_TYPE_WEIGHTS[bestMatch.type]) {
          bestMatch = nextMatch;
          return;
        }
        if (MATCH_TYPE_WEIGHTS[nextMatch.type] === MATCH_TYPE_WEIGHTS[bestMatch.type]) {
          if (nextMatch.sourceWeight > bestMatch.sourceWeight) {
            bestMatch = nextMatch;
            return;
          }
          if (nextMatch.sourceWeight === bestMatch.sourceWeight) {
            if (nextMatch.distance < bestMatch.distance) {
              bestMatch = nextMatch;
              return;
            }
            if (nextMatch.distance === bestMatch.distance && nextMatch.lengthDelta < bestMatch.lengthDelta) {
              bestMatch = nextMatch;
            }
          }
        }
      }
    });
  });

  const fuzzyThreshold = Math.max(CONFIDENCE_THRESHOLD, 0.75);
  const isFuzzyBelow = bestMatch && bestMatch.type === 'fuzzy' && bestMatch.score < fuzzyThreshold;

  if (!bestMatch || bestMatch.score < CONFIDENCE_THRESHOLD || isFuzzyBelow) {
    const suggestions = banks
      .map(bank => ({
        name: bank.name,
        score: similarityScore(trimmed, bank.name).score,
      }))
      .filter(entry => entry.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SUGGESTIONS)
      .map(entry => entry.name);

    return buildRecognitionResult(input, false, null, null, 0, suggestions);
  }

  return buildRecognitionResult(
    input,
    true,
    getDisplayName(bestMatch.bank, trimmed),
    bestMatch.bank.id,
    Number(bestMatch.score.toFixed(2)),
    undefined
  );
};

const scanBankNames = (input: string, country: CountryCode): string[] => {
  const normalizedInput = normalize(input);
  if (!normalizedInput) return [];

  const banks = getBanksByCountry(country);
  const candidates = banks.flatMap(bank => getBankCandidates(bank).map(candidate => ({ bank, candidate: candidate.value })));

  const matches = new Set<string>();
  candidates.forEach(({ bank, candidate }) => {
    if (!candidate || candidate.length < 3) return;
    const pattern = new RegExp(`\\b${candidate.replace(/[-/\\\\^$*+?.()|[\]{}]/g, '\\\\$&')}\\b`, 'i');
    if (pattern.test(normalizedInput)) {
      matches.add(bank.name);
    }
  });

  return Array.from(matches);
};

const splitSpontaneousEntries = (input: string, country: CountryCode): string[] => {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const hasSeparators = /[,;\n]/.test(trimmed);
  if (hasSeparators) {
    return trimmed.split(/[,;\n]+/).map(entry => entry.trim()).filter(Boolean);
  }

  const scanned = scanBankNames(trimmed, country);
  if (scanned.length > 0) return scanned;

  const parts = trimmed.split(/\s{2,}|\s+and\s+/i);
  return parts.map(entry => entry.trim()).filter(Boolean);
};

export const parseSpontaneousBanks = (
  input: string,
  country: CountryCode = 'rwanda',
  options?: { excludeBankIds?: string[] }
): SpontaneousResult => {
  const rawInput = input;
  const entries = splitSpontaneousEntries(input, country);

  const banks = entries.map(entry => recognizeTopOfMindBank(entry, country));
  const excludeSet = new Set(options?.excludeBankIds || []);
  const seenRecognizedIds = new Set<string>();
  const recognized = banks.filter(result => {
    if (!result.recognized || !result.bankId || excludeSet.has(result.bankId) || seenRecognizedIds.has(result.bankId)) {
      return false;
    }
    seenRecognizedIds.add(result.bankId);
    return true;
  });
  const excluded = Array.from(new Set(banks
    .filter(result => result.recognized && result.bankId && excludeSet.has(result.bankId))
    .map(result => result.standardName || result.input)
    .filter(Boolean)));
  const unrecognized = Array.from(new Set(banks.filter(result => !result.recognized).map(result => result.input).filter(Boolean)));
  const recognizedIds = Array.from(new Set(recognized.map(result => result.bankId!).filter(Boolean)));

  return {
    rawInput,
    banks,
    recognized_banks: recognized,
    unrecognized_entries: unrecognized,
    recognized_bank_ids: recognizedIds,
    excluded_entries: excluded,
    raw_input: rawInput,
  };
};

export const processAwarenessData = (
  topOfMindInput: string,
  spontaneousInput: string,
  assistedSelections: string[],
  country: CountryCode = 'rwanda'
): AwarenessData => {
  const topResult = recognizeTopOfMindBank(topOfMindInput, country);
  const spontResult = parseSpontaneousBanks(spontaneousInput, country, {
    excludeBankIds: topResult.bankId ? [topResult.bankId] : [],
  });

  const totalSet = new Set<string>();
  if (topResult.bankId) totalSet.add(topResult.bankId);
  const knownIds = new Set(ALL_BANKS.map(bank => bank.id));
  spontResult.recognized_bank_ids.forEach(id => {
    if (knownIds.has(id)) totalSet.add(id);
  });
  assistedSelections.forEach(id => totalSet.add(id));

  const total = Array.from(totalSet);

  return {
    topOfMind: topResult,
    spontaneous: spontResult,
    total,
    top_of_mind: {
      raw_input: topOfMindInput,
      recognized_bank_id: topResult.bankId,
      recognition_confidence: topResult.confidence,
    },
    assisted: {
      selected_bank_ids: assistedSelections,
    },
    total_awareness: total,
    recognized_bank_ids: total,
  };
};

export const bankRecognitionEngine = {
  getBanksByCountry,
  recognizeTopOfMindBank,
  parseSpontaneousBanks,
  processAwarenessData,
};

export default bankRecognitionEngine;
