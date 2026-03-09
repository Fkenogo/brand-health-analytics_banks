import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const teaserMetrics = [
  { label: 'Multi-Bank Customers', value: '61%' },
  { label: 'Average Banks per Customer', value: '2.3' },
  { label: 'Primary Bank Share', value: '34%' },
  { label: 'Top Second-Choice Competitor', value: 'KCB' },
];

const modules = [
  {
    title: 'Continuous Data Collection',
    body: 'BrandEdge captures fresh customer feedback throughout the year, giving banks a live signal of market movement instead of one-time snapshots.',
  },
  {
    title: 'Standardized Brand Health Framework',
    body: 'Every wave uses a consistent questionnaire structure for awareness, usage, preference, commitment, and switching dynamics so metrics remain comparable.',
  },
  {
    title: 'Privacy & Anonymity',
    body: 'Survey participation is anonymous by default. Subscriber analytics are generated from aggregated response patterns, not personal identity tracking.',
  },
  {
    title: 'Market-Level Reporting',
    body: 'Subscribers read country-level and trend-level reporting with controlled filters, helping leadership compare performance across markets and time.',
  },
  {
    title: 'How to Interpret the Metrics',
    body: 'BrandEdge separates ownership, preference, and commitment so teams can distinguish true loyalty from mere account presence and react early.',
  },
];

const benefits = [
  'Identify hidden competitive threats',
  'Understand multi-bank behavior',
  'Track brand momentum over time',
  'Detect early signs of customer switching',
  'Measure the strength of customer loyalty',
];

const accessPlans = [
  {
    title: 'Free',
    line: 'Entry access for initial platform evaluation',
    features: [
      'Dashboard login enabled',
      'One country access',
      'Overview summary tab only',
      'No advanced report tabs',
      'Limited filters',
      'No export',
      'No AI',
    ],
    cta: 'Start Free Access',
    ctaTarget: '/login',
    highlight: false,
  },
  {
    title: 'Standard',
    line: 'Full operating view for subscriber teams',
    features: [
      'Full country dashboard access',
      'All report tabs and metrics',
      'Full filter controls',
      'Time comparison views',
      'Exports enabled',
      'AI locked',
    ],
    cta: 'Request Standard Access',
    ctaTarget: '/login',
    highlight: true,
  },
  {
    title: 'Premium',
    line: 'Executive decision layer with AI support',
    features: [
      'Everything in Standard',
      'AI Insights assistant',
      'Personalized report summaries',
      'Explain-this-metric support',
      'Monthly AI executive summary',
      'Commercially mapped to Standard + AI add-on',
    ],
    cta: 'Discuss Premium Access',
    ctaTarget: '/login',
    highlight: false,
  },
];

const PublicLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate('/')} className="text-left">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">BrandEdge</p>
            <p className="text-[11px] text-slate-500">Banking Intelligence Platform</p>
          </button>
          <nav className="hidden items-center gap-6 text-xs uppercase tracking-widest text-slate-300 md:flex">
            <a href="#insights" className="hover:text-white">Insights</a>
            <a href="#methodology" className="hover:text-white">Methodology</a>
            <a href="#coverage" className="hover:text-white">Coverage</a>
            <Link to="/survey" className="hover:text-white">Survey</Link>
            <Link to="/login" className="hover:text-white">Login</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-10" id="insights">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">BrandEdge</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
            BrandEdge
            <br />
            See where your bank wins — and where competitors take the edge.
          </h1>
          <p className="mt-5 max-w-4xl text-base text-slate-300 md:text-lg">
            BrandEdge continuously tracks how customers choose, use, and switch between banks across East Africa — giving banks real visibility into awareness, loyalty, and competitive pressure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
              Request Access
            </Link>
            <a href="#snapshot" className="rounded-2xl border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-200 hover:border-cyan-300">
              View Sample Insights
            </a>
            <Link to="/login" className="rounded-2xl border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-200 hover:border-cyan-300">
              Login
            </Link>
          </div>
        </section>

        <section className="mt-12" id="snapshot">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Executive Snapshot</h2>
          <p className="mt-2 text-sm text-slate-500">Illustrative regional benchmarks for product preview only.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {teaserMetrics.map((metric) => (
              <article key={metric.label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">{metric.label}</p>
                <p className="mt-3 text-3xl font-black text-white">{metric.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12" id="methodology">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">How BrandEdge Works</h2>
          <p className="mt-2 max-w-4xl text-sm text-slate-400">
            BrandEdge combines continuous, anonymous customer input with a standardized framework to deliver reliable, market-level intelligence for banking leadership.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {modules.map((module) => (
              <article key={module.title} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300">{module.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{module.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <h2 className="text-2xl font-black text-white">Understand the real competitive landscape.</h2>
            <p className="mt-3 text-sm text-slate-300">
              Track how customers move between banks, where your brand wins, and where competitors gain ground.
            </p>
            <Link to="/login" className="mt-6 inline-flex rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
              Request Dashboard Access
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>BrandEdge Preview</span>
                <span>East Africa</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-cyan-500/10 p-3">
                  <p className="text-slate-400">Awareness</p>
                  <p className="mt-1 text-xl font-black text-white">72%</p>
                </div>
                <div className="rounded-xl bg-violet-500/10 p-3">
                  <p className="text-slate-400">Current Usage</p>
                  <p className="mt-1 text-xl font-black text-white">41%</p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <p className="text-slate-400">Commitment</p>
                  <p className="mt-1 text-xl font-black text-white">27%</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between"><span>Multi-bank share</span><span>61%</span></div>
                <div className="flex items-center justify-between"><span>Second-choice pressure</span><span>High</span></div>
                <div className="flex items-center justify-between"><span>Momentum trend</span><span>+4.2 pts</span></div>
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

        <section className="mt-12 rounded-3xl border border-white/10 bg-slate-900/40 p-6" id="coverage">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Continuous Banking Intelligence Across East Africa</h2>
          <p className="mt-3 text-sm text-slate-300">
            Active coverage includes Rwanda, Uganda, and Burundi with a continuous tracking model designed for year-round signal monitoring.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Subscriber dashboards support country-level filtering today, while the data model is already structured to scale into broader regional coverage.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-widest">
            <span className="rounded-full border border-white/10 px-4 py-2">Rwanda</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Uganda</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Burundi</span>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Choose the BrandEdge plan that fits your institution</h2>
          <p className="mt-3 text-sm text-slate-300">
            BrandEdge dashboard access is subscription-based. Package definitions are aligned to current platform entitlement logic.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {accessPlans.map((plan) => (
              <article
                key={plan.title}
                className={`rounded-2xl border p-5 ${plan.highlight ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-slate-950/60'}`}
              >
                <h3 className="text-base font-black uppercase tracking-wide text-white">{plan.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{plan.line}</p>
                <div className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <p key={feature} className="text-xs text-slate-300">- {feature}</p>
                  ))}
                </div>
                <Link
                  to={plan.ctaTarget}
                  className={`mt-5 inline-flex rounded-2xl px-4 py-2 text-[11px] font-bold uppercase tracking-widest ${
                    plan.highlight
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                      : 'border border-white/20 text-slate-100 hover:border-cyan-300'
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Pricing values are not displayed on this page because no production pricing table is currently encoded in the codebase.
          </p>
        </section>

        <section className="mt-12 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-amber-200">
            What banks think they know vs what BrandEdge reveals
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
              <p className="mt-2 text-xs text-amber-200">Reality: Commitment and switching pressure can diverge from ownership metrics.</p>
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
            <Link to="/login" className="rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
              Request Access
            </Link>
            <a href="#snapshot" className="rounded-2xl border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-100 hover:border-cyan-300">
              View Sample Insights
            </a>
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
