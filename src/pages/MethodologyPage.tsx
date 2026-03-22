import React from 'react';
import { Link } from 'react-router-dom';
import { PublicSiteHeader } from '@/components/public/PublicSiteHeader';

const methodologyBlocks = [
  {
    title: 'Continuous Data Collection',
    text: 'BrandEdge captures fresh customer feedback throughout the year so leadership tracks real market movement, not static quarterly assumptions.',
  },
  {
    title: 'Standardized Brand Health Framework',
    text: 'Each wave follows a consistent framework for awareness, usage, preference, commitment, and switching pressure so trend comparison is reliable.',
  },
  {
    title: 'Privacy & Anonymity',
    text: 'Survey participation is anonymous by default. Subscriber reporting is aggregated and does not expose respondent identity in dashboard analytics.',
  },
  {
    title: 'Market-Level Reporting',
    text: 'Outputs are structured for country-level and trend-level decision making, with filterable views designed for executive and strategy teams.',
  },
  {
    title: 'How to Interpret the Metrics',
    text: 'BrandEdge separates usage, preferred, and committed indicators to reveal hidden competitive risk that ownership-only metrics miss.',
  },
];

const MethodologyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicSiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-slate-900 p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Methodology</p>
          <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">How BrandEdge Works</h1>
          <p className="mt-4 max-w-4xl text-base text-slate-300">
            BrandEdge combines continuous anonymous customer feedback with a standardized measurement framework to produce decision-grade banking intelligence.
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {methodologyBlocks.map((block) => (
            <article key={block.title} className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-300">{block.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{block.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/40 p-6">
          <h2 className="text-lg font-bold uppercase tracking-[0.2em] text-slate-300">Next Step</h2>
          <p className="mt-3 text-sm text-slate-300">
            Review sample insights and request subscriber access for your institution.
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

export default MethodologyPage;
