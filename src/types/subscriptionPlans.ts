export type SupportedCurrency = 'USD' | 'BIF' | 'RWF' | 'UGX';
export type BillingPeriod = 'monthly' | 'annual';
export type PlanTier = 'free' | 'standard';

export interface PlanEntitlementMapping {
  tier: PlanTier;
  aiAddon: boolean;
}

export interface PlanPricingByCurrency {
  USD: number;
  BIF: number;
  RWF: number;
  UGX: number;
}

export interface SubscriptionPlanPricing {
  monthly: PlanPricingByCurrency;
  annual: PlanPricingByCurrency;
}

export interface SubscriptionPlan {
  id: string;
  publicName: string;
  positioningLine: string;
  benefits: string[];
  isActive: boolean;
  sortOrder: number;
  featured?: boolean;
  ctaLabel: string;
  ctaTarget: string;
  entitlementMapping: PlanEntitlementMapping;
  pricing: SubscriptionPlanPricing;
  createdAt?: string;
  updatedAt?: string;
}
