import { ALL_BANKS } from '@/constants';
import { SurveyResponse } from '@/types';

export type RecognitionIssueType = 'unrecognized' | 'low_confidence';

export interface RecognitionReviewRow {
  key: string;
  entry: string;
  count: number;
  countries: Record<string, number>;
  sources: Record<string, number>;
  issueType: RecognitionIssueType;
  matchedBankId?: string;
  matchedBankName?: string;
  averageConfidence?: number;
  minConfidence?: number;
}

interface AggregateRow extends RecognitionReviewRow {
  confidenceTotal: number;
  confidenceSamples: number;
}

export const DEFAULT_LOW_CONFIDENCE_THRESHOLD = 0.9;

const normalizeEntry = (value: string) => value.trim();

const buildKey = (
  issueType: RecognitionIssueType,
  source: string,
  entry: string,
  matchedBankId?: string,
) => [issueType, source, entry.toLowerCase(), matchedBankId || ''].join('::');

const bankNameById = new Map(ALL_BANKS.map((bank) => [bank.id, bank.name]));

const addAggregate = (
  map: Map<string, AggregateRow>,
  {
    issueType,
    entry,
    country,
    source,
    matchedBankId,
    confidence,
  }: {
    issueType: RecognitionIssueType;
    entry: string;
    country: string;
    source: string;
    matchedBankId?: string;
    confidence?: number;
  },
) => {
  const trimmed = normalizeEntry(entry);
  if (!trimmed) return;
  const key = buildKey(issueType, source, trimmed, matchedBankId);
  const existing = map.get(key) || {
    key,
    entry: trimmed,
    count: 0,
    countries: {},
    sources: {},
    issueType,
    matchedBankId,
    matchedBankName: matchedBankId ? bankNameById.get(matchedBankId) : undefined,
    averageConfidence: undefined,
    minConfidence: undefined,
    confidenceTotal: 0,
    confidenceSamples: 0,
  };
  existing.count += 1;
  existing.countries[country] = (existing.countries[country] || 0) + 1;
  existing.sources[source] = (existing.sources[source] || 0) + 1;

  if (typeof confidence === 'number' && Number.isFinite(confidence)) {
    existing.confidenceTotal += confidence;
    existing.confidenceSamples += 1;
    existing.averageConfidence = existing.confidenceTotal / existing.confidenceSamples;
    existing.minConfidence =
      existing.minConfidence === undefined ? confidence : Math.min(existing.minConfidence, confidence);
  }

  map.set(key, existing);
};

export const collectRecognitionReviewRows = (
  responses: SurveyResponse[],
  options?: { lowConfidenceThreshold?: number },
): RecognitionReviewRow[] => {
  const lowConfidenceThreshold = options?.lowConfidenceThreshold ?? DEFAULT_LOW_CONFIDENCE_THRESHOLD;
  const map = new Map<string, AggregateRow>();

  responses.forEach((response) => {
    const country = response.country || response.selected_country || 'unknown';
    const topOfMind = String(response.c1_top_of_mind || '').trim();
    const recognizedTopBankId = String(response.c1_recognized_bank_id || '').trim();
    const topConfidence = Number(response.c1_recognition_confidence);

    if (topOfMind && !recognizedTopBankId) {
      addAggregate(map, {
        issueType: 'unrecognized',
        entry: topOfMind,
        country,
        source: 'top_of_mind',
      });
    } else if (
      topOfMind
      && recognizedTopBankId
      && Number.isFinite(topConfidence)
      && topConfidence < lowConfidenceThreshold
    ) {
      addAggregate(map, {
        issueType: 'low_confidence',
        entry: topOfMind,
        country,
        source: 'top_of_mind',
        matchedBankId: recognizedTopBankId,
        confidence: topConfidence,
      });
    }

    (response.c2_unrecognized_entries || []).forEach((entry) => {
      addAggregate(map, {
        issueType: 'unrecognized',
        entry,
        country,
        source: 'spontaneous',
      });
    });
  });

  return Array.from(map.values())
    .map(({ confidenceTotal: _confidenceTotal, confidenceSamples: _confidenceSamples, ...row }) => row)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (a.issueType !== b.issueType) return a.issueType.localeCompare(b.issueType);
      return a.entry.localeCompare(b.entry);
    });
};
