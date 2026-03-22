import { describe, expect, it } from 'vitest';
import type { SurveyResponse } from '@/types';
import { filterResponsesForReport, responseSubmissionMode } from '@/pages/AdminReportsPage';

const baseResponse = (overrides: Partial<SurveyResponse> = {}): SurveyResponse => ({
  response_id: 'resp-1',
  device_id: 'device-1',
  country: 'rwanda',
  timestamp: '2026-03-22T00:00:00.000Z',
  duration_seconds: 120,
  question_timings: {},
  language_at_submission: 'en',
  ...overrides,
} as SurveyResponse);

describe('responseSubmissionMode', () => {
  it('treats admin-tagged responses as admin test traffic', () => {
    expect(responseSubmissionMode(baseResponse({
      submission_mode: 'admin_test',
    }))).toBe('admin_test');

    expect(responseSubmissionMode(baseResponse({
      admin_test_submission: true,
    }))).toBe('admin_test');
  });

  it('treats untagged and public-tagged responses as public pilot traffic', () => {
    expect(responseSubmissionMode(baseResponse({
      submission_mode: 'public_pilot',
      admin_test_submission: false,
    }))).toBe('public_pilot');

    expect(responseSubmissionMode(baseResponse())).toBe('public_pilot');
  });
});

describe('filterResponsesForReport', () => {
  it('respects submission mode, canonical country-first matching, and completed/terminated status filters', () => {
    const rows = [
      baseResponse({
        response_id: 'pilot-completed',
        country: 'rwanda',
        selected_country: 'uganda',
        _status: 'completed',
        submission_mode: 'public_pilot',
      }),
      baseResponse({
        response_id: 'pilot-terminated',
        country: 'rwanda',
        _status: 'terminated',
        submission_mode: 'public_pilot',
      }),
      baseResponse({
        response_id: 'admin-completed',
        country: 'rwanda',
        _status: 'completed',
        submission_mode: 'admin_test',
      }),
      baseResponse({
        response_id: 'other-country',
        country: 'uganda',
        _status: 'completed',
        submission_mode: 'public_pilot',
      }),
    ];

    const baseOptions = {
      country: 'rwanda' as const,
      period: 'all' as const,
      status: 'all' as const,
      submissionMode: 'all' as const,
      abuseFilter: 'all' as const,
      selectedBankId: '',
      compareBankId: '',
      comparisonEnabled: false,
    };

    expect(filterResponsesForReport(rows, {
      ...baseOptions,
      submissionMode: 'public_pilot',
    }, () => true).map((row) => row.response_id)).toEqual(['pilot-completed', 'pilot-terminated']);

    expect(filterResponsesForReport(rows, {
      ...baseOptions,
      submissionMode: 'admin_test',
    }, () => true).map((row) => row.response_id)).toEqual(['admin-completed']);

    expect(filterResponsesForReport(rows, {
      ...baseOptions,
      submissionMode: 'public_pilot',
      status: 'completed',
    }, () => true).map((row) => row.response_id)).toEqual(['pilot-completed']);

    expect(filterResponsesForReport(rows, {
      ...baseOptions,
      submissionMode: 'public_pilot',
      status: 'terminated',
    }, () => true).map((row) => row.response_id)).toEqual(['pilot-terminated']);
  });
});
