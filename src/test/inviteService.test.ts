import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDocsMock = vi.fn();
const collectionMock = vi.fn();
const httpsCallableMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallableMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
}));

describe('inviteService backend mediation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('validates invite token via callable', async () => {
    const validateFn = vi.fn().mockResolvedValue({ data: { valid: true, invite: { email: 'x@y.com', companyName: 'X', countries: ['rwanda'], expiresAt: '2026-12-01' } } });
    const acceptFn = vi.fn();
    const createFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(createFn)
      .mockReturnValueOnce(validateFn)
      .mockReturnValueOnce(acceptFn);

    const { inviteService } = await import('@/services/inviteService');
    const result = await inviteService.getInviteByToken('token-1');

    expect(validateFn).toHaveBeenCalledWith({ token: 'token-1' });
    expect(result.valid).toBe(true);
  });

  it('accepts invite via callable and returns backend status', async () => {
    const createFn = vi.fn();
    const validateFn = vi.fn();
    const acceptFn = vi.fn().mockResolvedValue({ data: { ok: true, subscriber_state: 'pending', claims_synced: true } });

    httpsCallableMock
      .mockReturnValueOnce(createFn)
      .mockReturnValueOnce(validateFn)
      .mockReturnValueOnce(acceptFn);

    const { inviteService } = await import('@/services/inviteService');
    const result = await inviteService.acceptInvite('token-2', {
      contactName: 'Jane',
      phone: '+250700000000',
      requestedCountries: ['rwanda'],
      companyName: 'Acme Bank',
    });

    expect(acceptFn).toHaveBeenCalledWith({
      token: 'token-2',
      contactName: 'Jane',
      phone: '+250700000000',
      requestedCountries: ['rwanda'],
      companyName: 'Acme Bank',
    });
    expect(result.ok).toBe(true);
    expect(result.subscriber_state).toBe('pending');
  });

  it('creates invite via admin callable', async () => {
    const createFn = vi.fn().mockResolvedValue({
      data: {
        invite: {
          id: 'invite-1',
          token: 'token-1',
          userId: 'draft-1',
          email: 'sub@example.com',
          companyName: 'Acme',
          countries: ['rwanda'],
          status: 'sent',
          createdAt: '2026-03-08T00:00:00.000Z',
          expiresAt: '2026-03-15T00:00:00.000Z',
        },
      },
    });
    const validateFn = vi.fn();
    const acceptFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(createFn)
      .mockReturnValueOnce(validateFn)
      .mockReturnValueOnce(acceptFn);

    const { inviteService } = await import('@/services/inviteService');
    const invite = await inviteService.createInvite('draft-1', 'sub@example.com', 'Acme', ['rwanda'], 7);

    expect(createFn).toHaveBeenCalledWith({ userId: 'draft-1', countries: ['rwanda'], validityDays: 7 });
    expect(invite.token).toBe('token-1');
  });
});
