import { beforeEach, describe, expect, it, vi } from 'vitest';

const addDocMock = vi.fn();
const collectionMock = vi.fn();
const docMock = vi.fn();
const getDocsMock = vi.fn();
const queryMock = vi.fn();
const updateDocMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDocMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

describe('responseService reliability', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('propagates persistence failures (no silent catch)', async () => {
    addDocMock.mockRejectedValue(new Error('write failed'));
    const { responseService } = await import('@/services/responseService');

    await expect(
      responseService.addResponse({
        response_id: 'resp-1',
        device_id: 'dev-1',
        country: 'rwanda',
        timestamp: '2026-03-08T00:00:00.000Z',
        duration_seconds: 12,
        question_timings: {},
        language_at_submission: 'en',
      }),
    ).rejects.toThrow('write failed');
  });

  it('normalizes legacy read fields into canonical analytics fields', async () => {
    queryMock.mockReturnValue({});
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
});
