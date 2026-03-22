import { describe, expect, it } from 'vitest';
import type { Question, SurveyResponse } from '@/types';
import {
  normalizeResponseForAnalyticsRead,
  isAnsweredValue,
  isMatrixAnswerComplete,
  normalizeResponseForSubmission,
  resolveResponseCountry,
} from '@/utils/survey/normalization';
import { getRuntimeSurveyQuestions, SURVEY_QUESTIONS } from '@/constants';

describe('survey normalization and validation', () => {
  it('treats numeric 0 as a valid required answer', () => {
    expect(isAnsweredValue(0)).toBe(true);
    expect(isAnsweredValue(5)).toBe(true);
    expect(isAnsweredValue('')).toBe(false);
    expect(isAnsweredValue('  ')).toBe(false);
    expect(isAnsweredValue([])).toBe(false);
    expect(isAnsweredValue(['x'])).toBe(true);
    expect(isAnsweredValue({})).toBe(false);
    expect(isAnsweredValue({ bankA: 0 })).toBe(true);
    expect(isAnsweredValue(null)).toBe(false);
    expect(isAnsweredValue(undefined)).toBe(false);
  });

  it('requires full matrix completion and accepts 0 ratings', () => {
    const question: Question = {
      id: 'd2_future_intent',
      type: 'rating-matrix',
      section: 'D',
      label: { en: 'Future intent', rw: 'Future intent', fr: 'Future intent' },
      required: true,
      choices: [
        { value: 'bank_a', label: { en: 'A', rw: 'A', fr: 'A' } },
        { value: 'bank_b', label: { en: 'B', rw: 'B', fr: 'B' } },
      ],
    };

    const formData: Partial<SurveyResponse> = {};
    expect(isMatrixAnswerComplete(question, { bank_a: 0, bank_b: 8 }, formData)).toBe(true);
    expect(isMatrixAnswerComplete(question, { bank_a: 0 }, formData)).toBe(false);
  });

  it('normalizes gender and derives bank_count', () => {
    const result = normalizeResponseForSubmission({
      data: {
        selected_country: 'rwanda',
        c5_currently_using: ['bank_a', 'bank_b'],
        e3_gender: 'Female',
        preferred_bank: 'bank_a',
        committed_bank: 'bank_a',
      },
      responseId: 'resp-1',
      deviceId: 'dev-1',
      language: 'en',
      status: 'completed',
      startedAtMs: Date.now() - 4000,
      nowIso: '2026-03-08T00:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.response?.gender).toBe('female');
    expect(result.response?.bank_count).toBe(2);
  });

  it('uses response metadata country as the canonical source of truth for new submissions', () => {
    const result = normalizeResponseForSubmission({
      data: {
        country: 'uganda',
        c5_currently_using: ['bank_a'],
      },
      responseId: 'resp-meta-country',
      deviceId: 'dev-meta-country',
      language: 'en',
      status: 'completed',
      startedAtMs: Date.now() - 4000,
      nowIso: '2026-03-08T00:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.response?.country).toBe('uganda');
    expect(result.response?.selected_country).toBe('uganda');
  });

  it('falls back to legacy selected_country only when canonical country metadata is missing', () => {
    expect(resolveResponseCountry({ country: 'burundi', selected_country: 'rwanda' })).toBe('burundi');
    expect(resolveResponseCountry({ selected_country: 'rwanda' })).toBe('rwanda');
    expect(normalizeResponseForAnalyticsRead({
      response_id: 'legacy-1',
      device_id: 'dev-legacy',
      country: 'uganda',
      selected_country: 'rwanda',
      timestamp: '2026-03-08T00:00:00.000Z',
      duration_seconds: 10,
      question_timings: {},
      language_at_submission: 'en',
    } as SurveyResponse).country).toBe('uganda');
  });

  it('filters legacy preamble steps out of the active respondent runtime question flow', () => {
    const runtimeIds = getRuntimeSurveyQuestions(SURVEY_QUESTIONS).map((question) => question.id);

    expect(runtimeIds).not.toContain('intro');
    expect(runtimeIds).not.toContain('selected_country');
    expect(runtimeIds).not.toContain('consent');
    expect(runtimeIds).not.toContain('termination_consent');
    expect(runtimeIds[0]).toBe('b1_recency');
  });

  it('auto-assigns preferred and committed bank for single-bank users', () => {
    const result = normalizeResponseForSubmission({
      data: {
        selected_country: 'rwanda',
        c5_currently_using: ['bank_a'],
      },
      responseId: 'resp-2',
      deviceId: 'dev-2',
      language: 'en',
      status: 'completed',
      startedAtMs: Date.now() - 3000,
      nowIso: '2026-03-08T00:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.response?.preferred_bank).toBe('bank_a');
    expect(result.response?.committed_bank).toBe('bank_a');
    expect(result.response?.preferred_bank_source).toBe('auto_single_usage');
    expect(result.response?.committed_bank_source).toBe('auto_single_usage');
  });

  it('fails submission for multi-bank users missing preferred/committed values', () => {
    const result = normalizeResponseForSubmission({
      data: {
        selected_country: 'rwanda',
        c5_currently_using: ['bank_a', 'bank_b'],
      },
      responseId: 'resp-3',
      deviceId: 'dev-3',
      language: 'en',
      status: 'completed',
      startedAtMs: Date.now() - 3000,
      nowIso: '2026-03-08T00:00:00.000Z',
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('preferred_bank_required_for_multi_bank');
    expect(result.errors).toContain('committed_bank_required_for_multi_bank');
  });
});
