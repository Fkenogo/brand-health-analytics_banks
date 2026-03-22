import React from 'react';
import { Link } from 'react-router-dom';
import { PublicSiteHeader } from '@/components/public/PublicSiteHeader';

const coveragePillars = [
  {
    title: 'Active Countries',
    text: 'Current operational coverage includes Rwanda, Uganda, and Burundi.',
  },
  {
    title: 'Continuous Tracking',
    text: 'Data collection runs year-round to capture momentum shifts and competitive movement early.',
  },
  {
    title: 'Country-Level Filtering',
    text: 'Subscriber dashboards support country-level views for focused market performance analysis.',
  },
  {
    title: 'Regional Expansion Readiness',
    text: 'Data model and reporting structure are designed to scale as additional East African markets are activated.',
  },
];

const CoveragePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicSiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Coverage</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
            Continuous Banking Intelligence Across East Africa
          </h1>
          <p className="mt-4 max-w-4xl text-base text-slate-300">
            BrandEdge tracks banking behavior continuously from real customers, giving leadership teams a live view of competitive dynamics across priority markets.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-widest">
            <span className="rounded-full border border-white/10 px-4 py-2">Rwanda</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Uganda</span>
            <span className="rounded-full border border-white/10 px-4 py-2">Burundi</span>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {coveragePillars.map((pillar) => (
            <article key={pillar.title} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">{pillar.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{pillar.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Commercial Access</h2>
          <p className="mt-3 text-sm text-slate-300">
            Subscriber plans are designed for institutional decision teams that need country-level and trend-level visibility.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
              Request Access
            </Link>
            <Link to="/" className="rounded-2xl border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-100 hover:border-cyan-300">
              Back to Home
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CoveragePage;
