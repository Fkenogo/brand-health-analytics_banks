import React from 'react';
import { Link } from 'react-router-dom';
import { PublicSiteHeader } from '@/components/public/PublicSiteHeader';
import { publicDemoModel } from '@/data/publicDemoModel';
import { subscriptionPlanService } from '@/services/subscriptionPlanService';
import type { BillingPeriod, SubscriptionPlan, SupportedCurrency } from '@/types/subscriptionPlans';
import { formatPlanPrice, getPlanPrice, SUPPORTED_CURRENCIES } from '@/utils/subscriptionPlans';

const teaserMetrics = [
  { label: 'Multi-Bank Customers', value: `${publicDemoModel.executiveSnapshot.multiBankShare}%` },
  { label: 'Average Banks per Customer', value: String(publicDemoModel.executiveSnapshot.avgBanksPerCustomer) },
  { label: 'Primary Bank Share', value: `${publicDemoModel.executiveSnapshot.primaryBankLeaderShare}%` },
  { label: 'Top Second-Choice Competitor', value: publicDemoModel.executiveSnapshot.topSecondChoiceCompetitor },
];

const benefits = [
  'Identify hidden competitive threats',
  'Understand multi-bank behavior',
  'Track brand momentum over time',
  'Detect early signs of customer switching',
  'Measure the strength of customer loyalty',
];

const getPlanJourney = (plan: SubscriptionPlan): { label: string; target: string } => {
  if (plan.entitlementMapping.tier === 'free') {
    return { label: 'Start Free Access', target: '/get-started?plan=free' };
  }

  if (plan.entitlementMapping.aiAddon) {
    return { label: 'Discuss Premium Access', target: '/get-started?plan=premium' };
  }

  return { label: 'Request Standard Access', target: '/get-started?plan=standard' };
};

const PublicLandingPage: React.FC = () => {
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = React.useState(true);
  const [plansError, setPlansError] = React.useState<string | null>(null);
  const [plansSource, setPlansSource] = React.useState<'firestore' | 'fallback'>('firestore');
  const [pricingPeriod, setPricingPeriod] = React.useState<BillingPeriod>('monthly');
  const [currency, setCurrency] = React.useState<SupportedCurrency>('USD');

  React.useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      try {
        const result = await subscriptionPlanService.listPublicPlansWithFallback();
        if (isMounted) {
          setPlans(result.plans);
          setPlansSource(result.source);
          setPlansError(result.fallbackReason);
        }
      } catch (_err) {
        if (isMounted) {
          setPlans([]);
          setPlansSource('fallback');
          setPlansError('Subscription pricing could not be loaded right now.');
        }
      } finally {
        if (isMounted) {
          setPlansLoading(false);
        }
      }
    };

    void loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicSiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">BrandEdge</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
            See where your bank wins — before competitors take your customers.
          </h1>
          <p className="mt-5 max-w-4xl text-base text-slate-300 md:text-lg">
            BrandEdge tracks how customers choose, use, and switch between banks across East Africa — giving executives continuous visibility into brand strength, loyalty, and competitive pressure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/get-started" className="rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
              Get Started
            </Link>
            <Link to="/demo" className="rounded-2xl border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-200 hover:border-cyan-300">
              View Sample Insights
            </Link>
          </div>
          <p className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Always-on visibility into brand strength and switching risk
          </p>
        </section>

        <section className="mt-12" id="insights">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Executive Snapshot</h2>
          <p className="mt-2 text-sm text-slate-500">
            Illustrative {publicDemoModel.country} demo benchmarks for product preview only, not live filtered market data.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {teaserMetrics.map((metric) => (
              <article key={metric.label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-black text-white">{metric.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Methodology</p>
            <h2 className="mt-2 text-2xl font-black text-white">Decision-grade measurement framework</h2>
            <p className="mt-3 text-sm text-slate-300">
              Review exactly how BrandEdge collects, standardizes, and interprets customer signals for executive reporting.
            </p>
            <Link to="/methodology" className="mt-5 inline-flex rounded-2xl border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-100 hover:border-cyan-300">
              View Methodology
            </Link>
          </article>
          <article className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Coverage</p>
            <h2 className="mt-2 text-2xl font-black text-white">Continuous East Africa intelligence footprint</h2>
            <p className="mt-3 text-sm text-slate-300">
              See active markets, country filtering model, and regional expansion readiness.
            </p>
            <Link to="/coverage" className="mt-5 inline-flex rounded-2xl border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-100 hover:border-cyan-300">
              View Coverage
            </Link>
          </article>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <h2 className="text-2xl font-black text-white">Understand the real competitive landscape.</h2>
            <p className="mt-3 text-sm text-slate-300">
              Track how customers move between banks, where your brand wins, and where competitors gain ground.
            </p>
            <Link to="/get-started?plan=standard" className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
              Register to See More
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>BrandEdge Preview</span>
                <span>{publicDemoModel.country} Demo Market</span>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Illustrative marketwide demo values, not live dashboard output
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-cyan-500/10 p-3">
                  <p className="text-slate-400">Awareness</p>
                  <p className="mt-1 text-xl font-black text-white">{publicDemoModel.brandEdgePreview.awareness}%</p>
                </div>
                <div className="rounded-xl bg-violet-500/10 p-3">
                  <p className="text-slate-400">Current Usage</p>
                  <p className="mt-1 text-xl font-black text-white">{publicDemoModel.brandEdgePreview.currentUsage}%</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <p className="text-slate-400">Loyalty Index</p>
                  <p className="mt-1 text-xl font-black text-white">{publicDemoModel.brandEdgePreview.loyaltyIndex}%</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between"><span>Multi-bank share</span><span>{publicDemoModel.brandEdgePreview.multiBankShare}%</span></div>
                <div className="flex items-center justify-between"><span>Second-choice pressure</span><span>{publicDemoModel.brandEdgePreview.secondChoicePressureLabel}</span></div>
                <div className="flex items-center justify-between"><span>Momentum trend</span><span>+{publicDemoModel.brandEdgePreview.momentumTrend} pts</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Why Banks Use BrandEdge</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {benefits.map((benefit) => (
              <p key={benefit} className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">{benefit}</p>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Choose the BrandEdge plan that fits your institution</h2>
          <p className="mt-3 text-sm text-slate-300">
            BrandEdge dashboard access is subscription-based. Public plan presentation now reads from admin-managed subscription configuration.
          </p>
          {!plansLoading && plansSource === 'fallback' && (
            <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
              Live subscription pricing could not be reached, so this page is showing the current BrandEdge default plan set.
              {plansError ? ` (${plansError})` : ''}
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-2xl border border-white/10 bg-slate-950/60 p-1">
              {(['monthly', 'annual'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setPricingPeriod(period)}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                    pricingPeriod === period ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-2xl border border-white/10 bg-slate-950/60 p-1">
              {SUPPORTED_CURRENCIES.map((supportedCurrency) => (
                <button
                  key={supportedCurrency}
                  onClick={() => setCurrency(supportedCurrency)}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                    currency === supportedCurrency ? 'bg-white text-slate-950' : 'text-slate-300'
                  }`}
                >
                  {supportedCurrency}
                </button>
              ))}
            </div>
          </div>
          {plansLoading ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 px-5 py-6 text-sm text-slate-400">
              Loading subscription plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-950/60 px-5 py-6">
              <p className="text-sm text-slate-300">Subscription pricing is being configured.</p>
              <p className="mt-2 text-xs text-slate-500">
                Admin-managed plans have not been published yet. Use Get Started to register interest while pricing is finalized.
              </p>
              <Link to="/get-started" className="mt-4 inline-flex rounded-2xl bg-cyan-500 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => {
                const journey = getPlanJourney(plan);
                return (
                  <article
                    key={plan.id}
                    className={`rounded-2xl border p-5 ${plan.featured ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-slate-950/60'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black uppercase tracking-wide text-white">{plan.publicName}</h3>
                        <p className="mt-2 text-sm text-slate-300">{plan.positioningLine}</p>
                      </div>
                      {plan.featured && (
                        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="mt-5">
                      <p className="text-3xl font-black text-white">
                        {formatPlanPrice(getPlanPrice(plan, pricingPeriod, currency), currency)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {pricingPeriod} pricing · {currency}
                      </p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {plan.benefits.map((feature) => (
                        <p key={`${plan.id}-${feature}`} className="text-xs text-slate-300">- {feature}</p>
                      ))}
                    </div>
                    <Link
                      to={journey.target}
                      className={`mt-5 inline-flex rounded-2xl px-4 py-2 text-[11px] font-bold uppercase tracking-widest ${
                        plan.featured
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                          : 'border border-white/20 text-slate-100 hover:border-cyan-300'
                      }`}
                    >
                      {journey.label}
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">
            From periodic research to continuous market intelligence
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            BrandEdge replaces delayed market studies with an always-on view of awareness, usage, loyalty, and competitive movement.
          </p>
        </section>

        <section className="mt-12 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-amber-200">
            What Banks Learn
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Assumption</p>
              <p className="mt-2 text-sm text-slate-200">Usage means the customer prefers us.</p>
              <p className="mt-2 text-xs text-amber-200">Reality: Multi-bank customers often use one bank while preferring another.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Assumption</p>
              <p className="mt-2 text-sm text-slate-200">Account ownership equals loyalty.</p>
              <p className="mt-2 text-xs text-amber-200">Reality: Loyalty and switching pressure can diverge from ownership metrics.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Assumption</p>
              <p className="mt-2 text-sm text-slate-200">The loudest competitor is our biggest risk.</p>
              <p className="mt-2 text-xs text-amber-200">Reality: Second-choice patterns expose hidden competitors before market share shifts.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Assumption</p>
              <p className="mt-2 text-sm text-slate-200">Current momentum is stable.</p>
              <p className="mt-2 text-xs text-amber-200">Reality: Continuous tracking detects preference drift early enough to act.</p>
            </article>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/get-started?plan=standard" className="rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
              Get Started
            </Link>
            <Link to="/demo" className="rounded-2xl border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-100 hover:border-cyan-300">
              View Sample Insights
            </Link>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Survey Participation</h2>
          <p className="mt-3 text-sm text-slate-300">
            Participate in the national banking survey and share your banking experience.
          </p>
          <Link to="/survey" className="mt-5 inline-flex rounded-2xl border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-100 hover:border-cyan-300">
            Take the Survey
          </Link>
        </section>
      </main>
    </div>
  );
};

export default PublicLandingPage;
