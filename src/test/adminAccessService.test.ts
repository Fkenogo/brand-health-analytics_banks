import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpsCallableMock = vi.fn();
const getIdTokenMock = vi.fn();

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallableMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  functions: {},
  auth: {
    currentUser: {
      getIdToken: (...args: unknown[]) => getIdTokenMock(...args),
    },
  },
}));

describe('adminAccessService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('refreshes the token after bootstrap and repair claim commands', async () => {
    const bootstrapFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const repairFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const syncFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    httpsCallableMock
      .mockReturnValueOnce(bootstrapFn)
      .mockReturnValueOnce(repairFn)
      .mockReturnValueOnce(syncFn);
    getIdTokenMock.mockResolvedValue('token');

    const { adminAccessService } = await import('@/services/adminAccessService');

    await adminAccessService.bootstrapAdminClaims();
    await adminAccessService.repairMyAdminClaims();
    await adminAccessService.syncUserClaimsNow('sub-1');

    expect(bootstrapFn).toHaveBeenCalledWith({});
    expect(repairFn).toHaveBeenCalledWith({});
    expect(syncFn).toHaveBeenCalledWith({ uid: 'sub-1' });
    expect(getIdTokenMock).toHaveBeenCalledTimes(2);
    expect(getIdTokenMock).toHaveBeenCalledWith(true);
  });

  it('classifies admin access repair failures into actionable messages', async () => {
    const { diagnoseAdminAccessError } = await import('@/services/adminAccessService');

    expect(diagnoseAdminAccessError({
      code: 'functions/permission-denied',
      message: 'Only canonical admin profiles can repair admin claims.',
    })).toEqual({
      kind: 'missing_admin_claim',
      message: 'Admin claim repair was denied. Verify the canonical profile is active admin and retry the repair action.',
    });

    expect(diagnoseAdminAccessError({
      code: 'functions/not-found',
      message: 'Canonical user profile not found.',
    })).toEqual({
      kind: 'profile_missing',
      message: 'Canonical admin profile was not found. Verify the users/{uid} record before retrying claim repair.',
    });
  });
});
