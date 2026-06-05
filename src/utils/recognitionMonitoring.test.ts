import { describe, expect, it } from 'vitest';
import type { SurveyResponse } from '@/types';
import { collectRecognitionReviewRows } from '@/utils/recognitionMonitoring';

describe('collectRecognitionReviewRows', () => {
  it('aggregates unmatched top-of-mind and spontaneous entries', () => {
    const responses = [
      {
        country: 'uganda',
        c1_top_of_mind: 'K C B Bank',
        c2_unrecognized_entries: ['Centernary'],
      },
      {
        country: 'uganda',
        c1_top_of_mind: 'K C B Bank',
        c2_unrecognized_entries: ['Centernary'],
      },
    ] as SurveyResponse[];

    const rows = collectRecognitionReviewRows(responses);

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entry: 'K C B Bank',
          count: 2,
          issueType: 'unrecognized',
          sources: { top_of_mind: 2 },
        }),
        expect.objectContaining({
          entry: 'Centernary',
          count: 2,
          issueType: 'unrecognized',
          sources: { spontaneous: 2 },
        }),
      ]),
    );
  });

  it('surfaces low-confidence top-of-mind matches separately', () => {
    const responses = [
      {
        country: 'uganda',
        c1_top_of_mind: 'Stanchrt',
        c1_recognized_bank_id: 'STAN_UG',
        c1_recognition_confidence: 0.82,
      },
      {
        country: 'uganda',
        c1_top_of_mind: 'Stanchrt',
        c1_recognized_bank_id: 'STAN_UG',
        c1_recognition_confidence: 0.78,
      },
    ] as SurveyResponse[];

    const rows = collectRecognitionReviewRows(responses, { lowConfidenceThreshold: 0.9 });

    expect(rows).toEqual([
      expect.objectContaining({
        entry: 'Stanchrt',
        issueType: 'low_confidence',
        matchedBankId: 'STAN_UG',
        matchedBankName: 'StanChart',
        count: 2,
        averageConfidence: 0.8,
        minConfidence: 0.78,
      }),
    ]);
  });

  it('does not surface confident recognized top-of-mind entries', () => {
    const responses = [
      {
        country: 'uganda',
        c1_top_of_mind: 'Stanbic',
        c1_recognized_bank_id: 'STB_UG',
        c1_recognition_confidence: 1,
      },
    ] as SurveyResponse[];

    expect(collectRecognitionReviewRows(responses)).toEqual([]);
  });
});
