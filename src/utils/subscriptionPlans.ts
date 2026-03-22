import type {
  BillingPeriod,
  PlanEntitlementMapping,
  PlanPricingByCurrency,
  SubscriptionPlan,
  SupportedCurrency,
} from '@/types/subscriptionPlans';

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['USD', 'BIF', 'RWF', 'UGX'];
export const BILLING_PERIODS: BillingPeriod[] = ['monthly', 'annual'];
export const ANNUAL_PRICING_MULTIPLIER = 10.5;
export const LOWEST_PLAN_SORT_ORDER = 999;

// Seed defaults use fixed FX references so the admin can review and edit them manually.
// BIF intentionally uses double the March 12, 2026 public USD/BIF rate reference.
export const DEFAULT_SEED_EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  BIF: 5914,
  RWF: 1467,
  UGX: 3709,
};

export const deriveAnnualPrice = (monthlyPrice: number): number => Math.round(monthlyPrice * ANNUAL_PRICING_MULTIPLIER);

export const buildCurrencyPricingFromUsd = (monthlyUsd: number): { monthly: PlanPricingByCurrency; annual: PlanPricingByCurrency } => {
  const monthly: PlanPricingByCurrency = {
    USD: monthlyUsd,
    BIF: Math.round(monthlyUsd * DEFAULT_SEED_EXCHANGE_RATES.BIF),
    RWF: Math.round(monthlyUsd * DEFAULT_SEED_EXCHANGE_RATES.RWF),
    UGX: Math.round(monthlyUsd * DEFAULT_SEED_EXCHANGE_RATES.UGX),
  };

  return {
    monthly,
    annual: {
      USD: deriveAnnualPrice(monthly.USD),
      BIF: deriveAnnualPrice(monthly.BIF),
      RWF: deriveAnnualPrice(monthly.RWF),
      UGX: deriveAnnualPrice(monthly.UGX),
    },
  };
};

export const formatPlanPrice = (amount: number, currency: SupportedCurrency): string => {
  if (amount === 0) {
    return currency === 'USD' ? '$0' : `0 ${currency}`;
  }

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return `${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount)} ${currency}`;
};

export const getPlanPrice = (
  plan: SubscriptionPlan,
  period: BillingPeriod,
  currency: SupportedCurrency,
): number => plan.pricing?.[period]?.[currency] ?? 0;

export const getPlanTagline = (mapping: PlanEntitlementMapping): string => {
  if (mapping.tier === 'free') return 'Maps to free tier';
  if (mapping.aiAddon) return 'Maps to standard tier + AI add-on';
  return 'Maps to standard tier';
};

export const sortSubscriptionPlans = (plans: SubscriptionPlan[]): SubscriptionPlan[] => (
  [...plans].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.publicName.localeCompare(right.publicName);
  })
);

export const getVisibleSubscriptionPlans = (plans: SubscriptionPlan[]): SubscriptionPlan[] => (
  sortSubscriptionPlans(plans.filter((plan) => plan.isActive))
);

const normalizeBenefits = (benefits: string[]): string[] => benefits.map((item) => item.trim()).filter(Boolean);

export const normalizeSubscriptionPlan = (plan: SubscriptionPlan): SubscriptionPlan => {
  const now = new Date().toISOString();
  return {
    ...plan,
    publicName: plan.publicName.trim(),
    positioningLine: plan.positioningLine.trim(),
    benefits: normalizeBenefits(plan.benefits),
    ctaLabel: plan.ctaLabel.trim(),
    ctaTarget: plan.ctaTarget.trim() || '/signup',
    featured: Boolean(plan.featured),
    sortOrder: Number.isFinite(plan.sortOrder) ? plan.sortOrder : LOWEST_PLAN_SORT_ORDER,
    pricing: {
      monthly: {
        USD: Math.max(0, Math.round(plan.pricing.monthly.USD || 0)),
        BIF: Math.max(0, Math.round(plan.pricing.monthly.BIF || 0)),
        RWF: Math.max(0, Math.round(plan.pricing.monthly.RWF || 0)),
        UGX: Math.max(0, Math.round(plan.pricing.monthly.UGX || 0)),
      },
      annual: {
        USD: Math.max(0, Math.round(plan.pricing.annual.USD || 0)),
        BIF: Math.max(0, Math.round(plan.pricing.annual.BIF || 0)),
        RWF: Math.max(0, Math.round(plan.pricing.annual.RWF || 0)),
        UGX: Math.max(0, Math.round(plan.pricing.annual.UGX || 0)),
      },
    },
    createdAt: plan.createdAt || now,
    updatedAt: now,
  };
};

export const buildDefaultSubscriptionPlans = (): SubscriptionPlan[] => {
  const now = new Date().toISOString();
  return [
    normalizeSubscriptionPlan({
      id: 'free',
      publicName: 'Free',
      positioningLine: 'Entry access for initial platform evaluation',
      benefits: [
        'Dashboard login enabled',
        'One country access',
        'Overview summary tab only',
        'No advanced report tabs',
        'Limited filters',
        'No export',
        'No AI',
      ],
      isActive: true,
      sortOrder: 10,
      featured: false,
      ctaLabel: 'Start Free Access',
      ctaTarget: '/signup',
      entitlementMapping: { tier: 'free', aiAddon: false },
      pricing: buildCurrencyPricingFromUsd(0),
      createdAt: now,
      updatedAt: now,
    }),
    normalizeSubscriptionPlan({
      id: 'standard',
      publicName: 'Standard',
      positioningLine: 'Full operating view for subscriber teams',
      benefits: [
        'Full country dashboard access',
        'All report tabs and metrics',
        'Full filter controls',
        'Time comparison views',
        'Exports enabled',
        'AI locked',
      ],
      isActive: true,
      sortOrder: 20,
      featured: true,
      ctaLabel: 'Request Standard Access',
      ctaTarget: '/signup',
      entitlementMapping: { tier: 'standard', aiAddon: false },
      pricing: buildCurrencyPricingFromUsd(499),
      createdAt: now,
      updatedAt: now,
    }),
    normalizeSubscriptionPlan({
      id: 'premium',
      publicName: 'Premium',
      positioningLine: 'Executive decision layer with AI support',
      benefits: [
        'Everything in Standard',
        'AI Insights assistant',
        'Personalized report summaries',
        'Explain-this-metric support',
        'Monthly AI executive summary',
        'Commercially mapped to Standard + AI add-on',
      ],
      isActive: true,
      sortOrder: 30,
      featured: false,
      ctaLabel: 'Discuss Premium Access',
      ctaTarget: '/signup',
      entitlementMapping: { tier: 'standard', aiAddon: true },
      pricing: buildCurrencyPricingFromUsd(699),
      createdAt: now,
      updatedAt: now,
    }),
  ];
};
