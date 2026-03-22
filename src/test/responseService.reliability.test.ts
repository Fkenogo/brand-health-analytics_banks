import { beforeEach, describe, expect, it, vi } from 'vitest';

const addDocMock = vi.fn();
const collectionMock = vi.fn();
const docMock = vi.fn();
const getDocsMock = vi.fn();
const httpsCallableMock = vi.fn();
const queryMock = vi.fn();
const updateDocMock = vi.fn();
const whereMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallableMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
}));

describe('responseService reliability', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    httpsCallableMock.mockReturnValue(vi.fn());
    queryMock.mockImplementation((...args: unknown[]) => ({ args }));
  });

  it('propagates public submit callable failures as user-facing messages', async () => {
    const callable = vi.fn().mockRejectedValue({
      code: 'failed-precondition',
      message: 'cooldown active',
      details: {
        code: 'cooldown_active',
        nextAllowedAt: '2026-06-01T00:00:00.000Z',
      },
    });
    httpsCallableMock.mockReturnValue(callable);
    const { responseService } = await import('@/services/responseService');

    await expect(
      responseService.submitPublicResponse({
        response_id: 'resp-1',
        device_id: 'dev-1',
        country: 'rwanda',
        timestamp: '2026-03-08T00:00:00.000Z',
        duration_seconds: 12,
        question_timings: {},
        language_at_submission: 'en',
      }),
    ).rejects.toThrow('This device has already submitted a survey recently.');
  });

  it('submits public survey responses through the protected callable path', async () => {
    const callable = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        responseId: 'resp-1',
        flags: {
          suspicious_submission_flag: false,
          repeat_submission_flag: false,
          completion_speed_flag: false,
          duplicate_payload_flag: false,
          app_check_verified: true,
        },
      },
    });
    httpsCallableMock.mockReturnValue(callable);
    const { responseService } = await import('@/services/responseService');

    const result = await responseService.submitPublicResponse({
      response_id: 'resp-1',
      device_id: 'dev-1',
      country: 'rwanda',
      selected_country: 'rwanda',
      timestamp: '2026-03-08T00:00:00.000Z',
      duration_seconds: 12,
      question_timings: {},
      language_at_submission: 'en',
      _status: 'completed',
    }, '');

    expect(callable).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
  });

  it('normalizes legacy read fields into canonical analytics fields', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'doc-1',
          data: () => ({
            response_id: 'resp-legacy',
            device_id: 'dev-legacy',
            country: 'rwanda',
            selected_country: 'rwanda',
            timestamp: '2026-03-08T00:00:00.000Z',
            duration_seconds: 10,
            question_timings: {},
            language_at_submission: 'en',
            c5_currently_using: ['bank_a'],
            c6_main_bank: 'bank_a',
            d5_committed: 'bank_a',
            e3_gender: 'Female',
          }),
        },
      ],
    });

    const { responseService } = await import('@/services/responseService');
    const rows = await responseService.listResponses();

    expect(rows[0].preferred_bank).toBe('bank_a');
    expect(rows[0].committed_bank).toBe('bank_a');
    expect(rows[0].gender).toBe('female');
    expect(rows[0].bank_count).toBe(1);
  });

  it('narrows response reads by country and merges canonical plus legacy country fields without duplicates', async () => {
    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'doc-1',
            data: () => ({
              response_id: 'resp-1',
              device_id: 'dev-1',
              selected_country: 'rwanda',
              timestamp: '2026-03-08T00:00:00.000Z',
              duration_seconds: 10,
              question_timings: {},
              language_at_submission: 'en',
            }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'doc-1',
            data: () => ({
              response_id: 'resp-1',
              device_id: 'dev-1',
              country: 'rwanda',
              timestamp: '2026-03-08T00:00:00.000Z',
              duration_seconds: 10,
              question_timings: {},
              language_at_submission: 'en',
            }),
          },
          {
            id: 'doc-2',
            data: () => ({
              response_id: 'resp-2',
              device_id: 'dev-2',
              country: 'rwanda',
              timestamp: '2026-03-09T00:00:00.000Z',
              duration_seconds: 11,
              question_timings: {},
              language_at_submission: 'en',
            }),
          },
        ],
      });

    const { responseService } = await import('@/services/responseService');
    const rows = await responseService.listResponses({ country: 'rwanda' });

    expect(whereMock).toHaveBeenCalledWith('selected_country', '==', 'rwanda');
    expect(whereMock).toHaveBeenCalledWith('country', '==', 'rwanda');
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row._docId)).toEqual(['doc-1', 'doc-2']);
  });

  it('loads dashboard responses through the backend callable path', async () => {
    const dashboardSubmitPlaceholder = vi.fn();
    const dashboardCallable = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        responses: [
          {
            _docId: 'doc-1',
            response_id: 'resp-1',
            device_id: 'dev-1',
            selected_country: 'rwanda',
            timestamp: '2026-03-08T00:00:00.000Z',
            duration_seconds: 10,
            question_timings: {},
            language_at_submission: 'en',
            c5_currently_using: ['bank_a'],
            c6_main_bank: 'bank_a',
          },
        ],
      },
    });

    httpsCallableMock
      .mockReturnValueOnce(dashboardCallable)
      .mockReturnValueOnce(dashboardSubmitPlaceholder);

    const { responseService } = await import('@/services/responseService');
    const rows = await responseService.listDashboardResponses({ country: 'rwanda' });

    expect(dashboardCallable).toHaveBeenCalledWith({ country: 'rwanda' });
    expect(rows[0]._docId).toBe('doc-1');
    expect(rows[0].preferred_bank).toBe('bank_a');
  });

  it('falls back to direct Firestore reads when the dashboard callable is denied', async () => {
    const callable = vi.fn().mockRejectedValue({
      code: 'functions/permission-denied',
      message: 'Subscriber access is required.',
    });
    const submitPlaceholder = vi.fn();

    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'doc-1',
            data: () => ({
              response_id: 'resp-1',
              device_id: 'dev-1',
              selected_country: 'rwanda',
              timestamp: '2026-03-08T00:00:00.000Z',
              duration_seconds: 10,
              question_timings: {},
              language_at_submission: 'en',
            }),
          },
        ],
      })
      .mockResolvedValueOnce({ docs: [] });

    httpsCallableMock
      .mockReturnValueOnce(callable)
      .mockReturnValueOnce(submitPlaceholder);

    const { responseService } = await import('@/services/responseService');
    const result = await responseService.listDashboardResponsesWithFallback({ country: 'rwanda', forceRefresh: true });

    expect(result.source).toBe('firestore');
    expect(result.fallbackReason).toContain('Subscriber access is required.');
    expect(result.responses).toHaveLength(1);
    expect(whereMock).toHaveBeenCalledWith('selected_country', '==', 'rwanda');
  });
});
