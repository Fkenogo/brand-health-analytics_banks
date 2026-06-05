import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDocsFromServerMock = vi.fn();
const collectionMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();
const httpsCallableMock = vi.fn();
const getIdTokenResultMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  getDocsFromServer: (...args: unknown[]) => getDocsFromServerMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallableMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
  auth: {
    currentUser: {
      getIdTokenResult: (...args: unknown[]) => getIdTokenResultMock(...args),
    },
  },
}));

describe('subscriptionPlanService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('routes admin list/save/delete/initialize through backend callables', async () => {
    const listFn = vi.fn().mockResolvedValue({ data: { plans: [{ id: 'standard' }] } });
    const initializeFn = vi.fn().mockResolvedValue({ data: { plans: [{ id: 'free' }], initialized: true } });
    const saveFn = vi.fn().mockResolvedValue({ data: { ok: true, plan: { id: 'premium' } } });
    const deleteFn = vi.fn().mockResolvedValue({ data: { ok: true, planId: 'premium' } });

    httpsCallableMock
      .mockReturnValueOnce(listFn)
      .mockReturnValueOnce(initializeFn)
      .mockReturnValueOnce(saveFn)
      .mockReturnValueOnce(deleteFn);

    const { subscriptionPlanService } = await import('@/services/subscriptionPlanService');

    await expect(subscriptionPlanService.listAllAdmin()).resolves.toEqual([{ id: 'standard' }]);
    await expect(subscriptionPlanService.initializeDefaultsAdmin()).resolves.toEqual({ plans: [{ id: 'free' }], initialized: true });
    await expect(subscriptionPlanService.savePlanAdmin({ id: 'premium' } as never)).resolves.toEqual({ id: 'premium' });
    await expect(subscriptionPlanService.deletePlanAdmin('premium')).resolves.toBeUndefined();

    expect(listFn).toHaveBeenCalledWith({});
    expect(initializeFn).toHaveBeenCalledWith({});
    expect(saveFn).toHaveBeenCalledWith({ plan: { id: 'premium' } });
    expect(deleteFn).toHaveBeenCalledWith({ planId: 'premium' });
  });

  it('explains permission failures caused by missing admin claim', async () => {
    getIdTokenResultMock.mockResolvedValue({ claims: {} });
    const { diagnoseAdminPlanAccessError } = await import('@/services/subscriptionPlanService');

    await expect(diagnoseAdminPlanAccessError(new Error('Missing or insufficient permissions.'))).resolves.toEqual({
      kind: 'missing_admin_claim',
      message: 'Admin profile found, but your current token is missing the admin claim. Use Repair Admin Access to restore runtime claims and refresh your token.',
    });
  });

  it('explains internal and 404 callable failures as missing backend deployment', async () => {
    const { diagnoseAdminPlanAccessError } = await import('@/services/subscriptionPlanService');

    await expect(diagnoseAdminPlanAccessError({
      code: 'functions/internal',
      message: 'Preflight response is not successful. Status code: 404',
    })).resolves.toEqual({
      kind: 'callable_unavailable',
      message: 'Subscription plan backend not deployed or not reachable. Deploy the latest Cloud Functions before using Subscription Management.',
    });
  });

  it('classifies invalid plan payload failures as validation errors', async () => {
    const { diagnoseAdminPlanAccessError } = await import('@/services/subscriptionPlanService');

    await expect(diagnoseAdminPlanAccessError({
      code: 'functions/invalid-argument',
      message: 'A valid subscription plan payload is required.',
    })).resolves.toEqual({
      kind: 'validation_failure',
      message: 'Subscription plan payload is invalid. Check internal id, pricing values, and entitlement mapping before saving.',
    });
  });

  it('returns live public plans from Firestore when the query succeeds', async () => {
    getDocsFromServerMock.mockResolvedValue({
      docs: [
        { data: () => ({ id: 'premium', publicName: 'Premium', positioningLine: 'Premium', benefits: [], isActive: true, sortOrder: 30, featured: false, ctaLabel: 'Go', ctaTarget: '/signup', entitlementMapping: { tier: 'standard', aiAddon: true }, pricing: { monthly: { USD: 699, BIF: 0, RWF: 0, UGX: 0 }, annual: { USD: 7339, BIF: 0, RWF: 0, UGX: 0 } } }) },
        { data: () => ({ id: 'standard', publicName: 'Standard', positioningLine: 'Standard', benefits: [], isActive: true, sortOrder: 20, featured: false, ctaLabel: 'Go', ctaTarget: '/signup', entitlementMapping: { tier: 'standard', aiAddon: false }, pricing: { monthly: { USD: 499, BIF: 0, RWF: 0, UGX: 0 }, annual: { USD: 5240, BIF: 0, RWF: 0, UGX: 0 } } }) },
      ],
    });

    const { subscriptionPlanService } = await import('@/services/subscriptionPlanService');

    await expect(subscriptionPlanService.listPublicPlansWithFallback()).resolves.toMatchObject({
      source: 'firestore',
      fallbackReason: null,
      plans: [
        { id: 'standard' },
        { id: 'premium' },
      ],
    });
  });

  it('falls back to default public plans when the live request fails', async () => {
    getDocsFromServerMock.mockRejectedValue(new Error('network stalled'));

    const { subscriptionPlanService } = await import('@/services/subscriptionPlanService');

    await expect(subscriptionPlanService.listPublicPlansWithFallback()).resolves.toMatchObject({
      source: 'fallback',
      fallbackReason: 'network stalled',
    });

    await expect(subscriptionPlanService.listPublicPlans()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'free' }),
        expect.objectContaining({ id: 'standard' }),
        expect.objectContaining({ id: 'premium' }),
      ]),
    );
  });
});
