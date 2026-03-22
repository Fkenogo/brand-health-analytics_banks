const ANNUAL_PRICING_MULTIPLIER = 10.5;
const DEFAULT_SEED_EXCHANGE_RATES = {
  USD: 1,
  BIF: 5914,
  RWF: 1467,
  UGX: 3709,
};

const deriveAnnualPrice = (monthlyPrice) => Math.round(monthlyPrice * ANNUAL_PRICING_MULTIPLIER);

const buildCurrencyPricingFromUsd = (monthlyUsd) => {
  const monthly = {
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

const normalizeSubscriptionPlan = (plan) => {
  const now = new Date().toISOString();
  return {
    ...plan,
    publicName: String(plan.publicName || '').trim(),
    positioningLine: String(plan.positioningLine || '').trim(),
    benefits: Array.isArray(plan.benefits) ? plan.benefits.map((item) => String(item || '').trim()).filter(Boolean) : [],
    ctaLabel: String(plan.ctaLabel || '').trim(),
    ctaTarget: String(plan.ctaTarget || '/signup').trim() || '/signup',
    featured: Boolean(plan.featured),
    sortOrder: Number.isFinite(plan.sortOrder) ? plan.sortOrder : 999,
    pricing: {
      monthly: {
        USD: Math.max(0, Math.round(plan.pricing?.monthly?.USD || 0)),
        BIF: Math.max(0, Math.round(plan.pricing?.monthly?.BIF || 0)),
        RWF: Math.max(0, Math.round(plan.pricing?.monthly?.RWF || 0)),
        UGX: Math.max(0, Math.round(plan.pricing?.monthly?.UGX || 0)),
      },
      annual: {
        USD: Math.max(0, Math.round(plan.pricing?.annual?.USD || 0)),
        BIF: Math.max(0, Math.round(plan.pricing?.annual?.BIF || 0)),
        RWF: Math.max(0, Math.round(plan.pricing?.annual?.RWF || 0)),
        UGX: Math.max(0, Math.round(plan.pricing?.annual?.UGX || 0)),
      },
    },
    createdAt: plan.createdAt || now,
    updatedAt: now,
  };
};

const buildDefaultSubscriptionPlans = () => {
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

const sortSubscriptionPlans = (plans) => (
  [...plans].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return String(left.publicName || '').localeCompare(String(right.publicName || ''));
  })
);

module.exports = {
  deriveAnnualPrice,
  buildCurrencyPricingFromUsd,
  normalizeSubscriptionPlan,
  buildDefaultSubscriptionPlans,
  sortSubscriptionPlans,
};
