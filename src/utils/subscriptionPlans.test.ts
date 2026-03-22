import { describe, expect, it } from 'vitest';
import {
  ANNUAL_PRICING_MULTIPLIER,
  buildDefaultSubscriptionPlans,
  deriveAnnualPrice,
  formatPlanPrice,
  getPlanTagline,
  getVisibleSubscriptionPlans,
} from '@/utils/subscriptionPlans';

describe('subscription plan pricing defaults', () => {
  it('applies the annual pricing rule at 10.5x monthly', () => {
    expect(ANNUAL_PRICING_MULTIPLIER).toBe(10.5);
    expect(deriveAnnualPrice(499)).toBe(5240);
    expect(deriveAnnualPrice(699)).toBe(7340);
  });

  it('seeds default plans with the expected commercial pricing and entitlement mappings', () => {
    const plans = buildDefaultSubscriptionPlans();
    const free = plans.find((plan) => plan.id === 'free');
    const standard = plans.find((plan) => plan.id === 'standard');
    const premium = plans.find((plan) => plan.id === 'premium');

    expect(free).toMatchObject({
      entitlementMapping: { tier: 'free', aiAddon: false },
      pricing: { monthly: { USD: 0 }, annual: { USD: 0 } },
    });
    expect(standard).toMatchObject({
      entitlementMapping: { tier: 'standard', aiAddon: false },
      pricing: { monthly: { USD: 499 }, annual: { USD: 5240 } },
    });
    expect(premium).toMatchObject({
      entitlementMapping: { tier: 'standard', aiAddon: true },
      pricing: { monthly: { USD: 699 }, annual: { USD: 7340 } },
    });
  });

  it('uses the doubled BIF seed logic and keeps local pricing editable afterward', () => {
    const standard = buildDefaultSubscriptionPlans().find((plan) => plan.id === 'standard');

    expect(standard?.pricing.monthly.BIF).toBe(2951086);
    expect(standard?.pricing.annual.BIF).toBe(30986403);
  });
});

describe('subscription plan display helpers', () => {
  it('sorts and filters public plans deterministically', () => {
    const plans = buildDefaultSubscriptionPlans();
    const inactivePremium = { ...plans[2], isActive: false };
    const reordered = [inactivePremium, plans[0], { ...plans[1], sortOrder: 5 }];

    expect(getVisibleSubscriptionPlans(reordered).map((plan) => plan.id)).toEqual(['standard', 'free']);
  });

  it('formats prices and plan mapping labels for landing-page display', () => {
    expect(formatPlanPrice(499, 'USD')).toBe('$499');
    expect(formatPlanPrice(120000, 'UGX')).toBe('120,000 UGX');
    expect(getPlanTagline({ tier: 'standard', aiAddon: true })).toBe('Maps to standard tier + AI add-on');
  });
});
