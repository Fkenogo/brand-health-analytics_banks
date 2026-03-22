import { describe, expect, it } from 'vitest';
import {
  buildCurrencyPricingFromUsd,
  buildDefaultSubscriptionPlans,
  deriveAnnualPrice,
} from './subscriptionPlanDefaults';

describe('subscription plan backend defaults', () => {
  it('keeps the annual multiplier at 10.5x monthly', () => {
    expect(deriveAnnualPrice(499)).toBe(5240);
    expect(deriveAnnualPrice(699)).toBe(7340);
  });

  it('builds seeded default plans with expected entitlement mapping', () => {
    const plans = buildDefaultSubscriptionPlans();
    expect(plans.map((plan) => plan.id)).toEqual(['free', 'standard', 'premium']);
    expect(plans.find((plan) => plan.id === 'free').entitlementMapping).toEqual({ tier: 'free', aiAddon: false });
    expect(plans.find((plan) => plan.id === 'standard').entitlementMapping).toEqual({ tier: 'standard', aiAddon: false });
    expect(plans.find((plan) => plan.id === 'premium').entitlementMapping).toEqual({ tier: 'standard', aiAddon: true });
  });

  it('keeps the doubled BIF seed pricing logic', () => {
    const pricing = buildCurrencyPricingFromUsd(499);
    expect(pricing.monthly.BIF).toBe(2951086);
    expect(pricing.annual.BIF).toBe(30986403);
  });
});
