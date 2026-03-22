import { describe, expect, it } from 'vitest';
import {
  buildAiAddonUpdate,
  buildCountriesUpdate,
  buildTierUpdate,
  buildStatusUpdate,
  computeClaimsSyncPlan,
  isAdminAuth,
  normalizeCountryList,
} from './subscriberEntitlements';

describe('subscriber entitlement command helpers', () => {
  it('enforces admin-only auth at helper level', () => {
    expect(isAdminAuth({ token: { role: 'admin' } })).toBe(true);
    expect(isAdminAuth({ token: { role: 'subscriber' } })).toBe(false);
    expect(isAdminAuth(null)).toBe(false);
  });

  it('builds status updates with before/after audit data', () => {
    const result = buildStatusUpdate({ status: 'pending' }, 'active');

    expect(result.updates).toEqual({ status: 'active' });
    expect(result.audit).toEqual({
      before: { status: 'pending' },
      after: { status: 'active' },
    });
  });

  it('builds tier updates and disables AI when downgraded to free', () => {
    const result = buildTierUpdate(
      { subscription_tier: 'standard', subscription_addon_ai: true },
      'free',
    );

    expect(result.updates).toEqual({
      subscription_tier: 'free',
      subscription_addon_ai: false,
    });
  });

  it('builds country updates using normalized canonical values', () => {
    const result = buildCountriesUpdate(
      { assignedCountries: ['uganda'] },
      ['Rwanda', 'rwanda', 'invalid', 'burundi'],
    );

    expect(normalizeCountryList(['Rwanda', 'rwanda', 'invalid', 'burundi'])).toEqual(['rwanda', 'burundi']);
    expect(result.updates).toEqual({ assignedCountries: ['rwanda', 'burundi'] });
    expect(result.audit.after).toEqual({ assignedCountries: ['rwanda', 'burundi'] });
  });

  it('blocks AI add-on enablement when tier is not standard', () => {
    expect(() => buildAiAddonUpdate({ subscription_tier: 'free', subscription_addon_ai: false }, true))
      .toThrow('ai_requires_standard_tier');

    const result = buildAiAddonUpdate({ subscription_tier: 'standard', subscription_addon_ai: false }, true);
    expect(result.updates).toEqual({ subscription_addon_ai: true });
  });

  it('computes entitlements version bump when claims-relevant fields change', () => {
    const plan = computeClaimsSyncPlan(
      { status: 'pending', entitlements_version: 3, subscription_tier: 'free' },
      { status: 'active', entitlements_version: 3, subscription_tier: 'free' },
    );

    expect(plan.entitlementsChanged).toBe(true);
    expect(plan.shouldBumpVersion).toBe(true);
    expect(plan.nextVersion).toBe(4);
  });

  it('does not bump entitlements version when claims-relevant fields are unchanged', () => {
    const plan = computeClaimsSyncPlan(
      { status: 'active', entitlements_version: 4, subscription_tier: 'standard' },
      { status: 'active', entitlements_version: 4, subscription_tier: 'standard' },
    );

    expect(plan.entitlementsChanged).toBe(false);
    expect(plan.shouldBumpVersion).toBe(false);
    expect(plan.nextVersion).toBe(4);
  });
});
