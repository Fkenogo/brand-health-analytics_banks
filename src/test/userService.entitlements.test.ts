import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDocsMock = vi.fn();
const getDocMock = vi.fn();
const collectionMock = vi.fn();
const docMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();
const setDocMock = vi.fn();
const updateDocMock = vi.fn();
const writeBatchMock = vi.fn();
const httpsCallableMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  writeBatch: (...args: unknown[]) => writeBatchMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallableMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
}));

describe('userService entitlement mediation', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    docMock.mockReturnValue({});
  });

  it('routes subscriber status changes through backend callable', async () => {
    const createDraftFn = vi.fn();
    const updateStatusFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const updateTierFn = vi.fn();
    const updateCountriesFn = vi.fn();
    const updateAiAddonFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(createDraftFn)
      .mockReturnValueOnce(updateStatusFn)
      .mockReturnValueOnce(updateTierFn)
      .mockReturnValueOnce(updateCountriesFn)
      .mockReturnValueOnce(updateAiAddonFn);

    const { userService } = await import('@/services/userService');
    await userService.setUserStatus('sub-1', 'active');

    expect(updateStatusFn).toHaveBeenCalledWith({ uid: 'sub-1', status: 'active' });
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('routes tier, countries, and AI add-on changes through backend callables', async () => {
    const createDraftFn = vi.fn();
    const updateStatusFn = vi.fn();
    const updateTierFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const updateCountriesFn = vi.fn().mockResolvedValue({ data: { ok: true } });
    const updateAiAddonFn = vi.fn().mockResolvedValue({ data: { ok: true } });

    httpsCallableMock
      .mockReturnValueOnce(createDraftFn)
      .mockReturnValueOnce(updateStatusFn)
      .mockReturnValueOnce(updateTierFn)
      .mockReturnValueOnce(updateCountriesFn)
      .mockReturnValueOnce(updateAiAddonFn);

    const { userService } = await import('@/services/userService');
    await userService.setUserTier('sub-2', 'standard');
    await userService.setUserCountries('sub-2', ['rwanda', 'uganda']);
    await userService.setUserAiAddon('sub-2', true);

    expect(updateTierFn).toHaveBeenCalledWith({ uid: 'sub-2', subscription_tier: 'standard' });
    expect(updateCountriesFn).toHaveBeenCalledWith({ uid: 'sub-2', assignedCountries: ['rwanda', 'uganda'] });
    expect(updateAiAddonFn).toHaveBeenCalledWith({ uid: 'sub-2', subscription_addon_ai: true });
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('blocks direct entitlement writes through updateUser', async () => {
    const createDraftFn = vi.fn();
    const updateStatusFn = vi.fn();
    const updateTierFn = vi.fn();
    const updateCountriesFn = vi.fn();
    const updateAiAddonFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(createDraftFn)
      .mockReturnValueOnce(updateStatusFn)
      .mockReturnValueOnce(updateTierFn)
      .mockReturnValueOnce(updateCountriesFn)
      .mockReturnValueOnce(updateAiAddonFn);

    const { userService } = await import('@/services/userService');

    await expect(userService.updateUser('sub-3', { status: 'suspended' }))
      .rejects.toThrow('Direct updateUser writes are blocked for entitlement field: status');
    await expect(userService.updateUser('sub-3', { assignedCountries: ['rwanda'] }))
      .rejects.toThrow('Direct updateUser writes are blocked for entitlement field: assignedCountries');

    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('classifies subscriber admin command failures into actionable messages', async () => {
    const createDraftFn = vi.fn();
    const updateStatusFn = vi.fn();
    const updateTierFn = vi.fn();
    const updateCountriesFn = vi.fn();
    const updateAiAddonFn = vi.fn();
    const createFreeFn = vi.fn();
    const scanLegacyFn = vi.fn();
    const migrateLegacyFn = vi.fn();
    const migrateSafeLegacyFn = vi.fn();

    httpsCallableMock
      .mockReturnValueOnce(createDraftFn)
      .mockReturnValueOnce(updateStatusFn)
      .mockReturnValueOnce(updateTierFn)
      .mockReturnValueOnce(updateCountriesFn)
      .mockReturnValueOnce(updateAiAddonFn)
      .mockReturnValueOnce(createFreeFn)
      .mockReturnValueOnce(scanLegacyFn)
      .mockReturnValueOnce(migrateLegacyFn)
      .mockReturnValueOnce(migrateSafeLegacyFn);

    const { diagnoseSubscriberAdminCommandError } = await import('@/services/userService');

    expect(diagnoseSubscriberAdminCommandError({
      code: 'functions/permission-denied',
      message: 'Admin access is required.',
    })).toEqual({
      kind: 'missing_admin_claim',
      message: 'Admin claim is missing or stale for this action. Repair admin access, refresh the token, and retry.',
    });

    expect(diagnoseSubscriberAdminCommandError({
      code: 'functions/failed-precondition',
      message: 'AI add-on requires Standard tier.',
    })).toEqual({
      kind: 'validation_failure',
      message: 'AI add-on requires Standard tier.',
    });
  });
});
