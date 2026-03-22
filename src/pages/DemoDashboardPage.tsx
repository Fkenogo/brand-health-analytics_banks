import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSelectedBankSwitchingRadar, publicDemoModel } from '@/data/publicDemoModel';
import { CustomerSwitchingRadar } from '@/components/analytics/CustomerSwitchingRadar';

const DemoDashboardPage: React.FC = () => {
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [selectedRadarBank, setSelectedRadarBank] = useState(() => publicDemoModel.switchingRadarBankOptions[0] || 'BK');
  const switchingRadar = useMemo(
    () => getSelectedBankSwitchingRadar(selectedRadarBank),
    [selectedRadarBank],
  );

  const openLockedModal = () => setShowLockedModal(true);
  const maxPrimaryShare = Math.max(...Object.values(publicDemoModel.competitivePressureByBank));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-left">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">BrandEdge</p>
            <p className="text-[11px] text-slate-500">Demo Dashboard</p>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={openLockedModal} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-200">
              Filters
            </button>
            <button onClick={openLockedModal} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-200">
              Export
            </button>
            <button onClick={openLockedModal} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-200">
              AI Chat
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          Demo Mode — Illustrative {publicDemoModel.country} market sample for product preview. Overview cards and trend values are marketwide demo values, not live Firestore data. The bank selector only changes the switching radar sample below.
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Headline KPI</p>
          <h1 className="mt-2 text-2xl font-black text-white">BrandEdge Score</h1>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-5xl font-black text-cyan-300">{publicDemoModel.brandEdgeScore}</p>
            <p className="pb-1 text-lg text-slate-300">/ 100</p>
          </div>
          <p className="mt-2 text-sm text-slate-300">{publicDemoModel.brandEdgeLabel}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Executive Snapshot</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-4">
            <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Multi-bank customers</p>
              <p className="mt-2 text-3xl font-black text-white">{publicDemoModel.executiveSnapshot.multiBankShare}%</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Average banks per customer</p>
              <p className="mt-2 text-3xl font-black text-white">{publicDemoModel.executiveSnapshot.avgBanksPerCustomer}</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Primary bank share (leader)</p>
              <p className="mt-2 text-3xl font-black text-white">{publicDemoModel.executiveSnapshot.primaryBankLeaderShare}%</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-500">Top second-choice competitor</p>
              <p className="mt-2 text-3xl font-black text-white">{publicDemoModel.executiveSnapshot.topSecondChoiceCompetitor}</p>
            </article>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Competitive Pressure View</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(publicDemoModel.competitivePressureByBank).map(([bank, share]) => (
                <div key={bank}>
                  <div className="mb-1 flex justify-between text-xs text-slate-300">
                    <span>{bank}</span>
                    <span>{share}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${(share / maxPrimaryShare) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Second-choice pressure</p>
                <p className="mt-2 text-xl font-bold text-white">
                  {publicDemoModel.executiveSnapshot.secondChoicePressureLabel} ({publicDemoModel.executiveSnapshot.topSecondChoiceCompetitor})
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Switching risk indicator</p>
                <p className="mt-2 text-xl font-bold text-white">{publicDemoModel.switchingRisk}%</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Customer Behavior Module</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Awareness</p>
                <p className="mt-2 text-2xl font-black text-white">{publicDemoModel.brandEdgePreview.awareness}%</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Active usage</p>
                <p className="mt-2 text-2xl font-black text-white">{publicDemoModel.brandEdgePreview.currentUsage}%</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Loyalty Index</p>
                <p className="mt-2 text-2xl font-black text-white">{publicDemoModel.brandEdgePreview.loyaltyIndex}%</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">Multi-bank share</p>
                <p className="mt-2 text-2xl font-black text-white">{publicDemoModel.brandEdgePreview.multiBankShare}%</p>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6">
          <CustomerSwitchingRadar
            metrics={switchingRadar}
            title="Customer Switching Radar"
            subtitle="Illustrative sample view of where competitors are most likely to pull customers from the selected bank."
            headerRight={(
              <label className="text-xs uppercase tracking-widest text-slate-400">
                Radar sample bank
                <select
                  value={selectedRadarBank}
                  onChange={(event) => setSelectedRadarBank(event.target.value)}
                  className="mt-2 block rounded-xl border border-white/20 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-100"
                >
                  {publicDemoModel.switchingRadarBankOptions.map((bankId) => (
                    <option key={bankId} value={bankId}>{bankId}</option>
                  ))}
                </select>
              </label>
            )}
          />
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Trend Preview</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {publicDemoModel.scoreTrend.map((point) => (
              <article key={point.quarter} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500">{point.quarter}</p>
                <p className="mt-2 text-2xl font-black text-white">{point.score}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-emerald-300">
            Illustrative momentum signal: +{publicDemoModel.brandEdgePreview.momentumTrend} points over the preview window.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/40 p-6">
          <h2 className="text-lg font-black text-white">Explore BrandEdge with your market data</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400">
              Request Dashboard Access
            </Link>
            <Link to="/" className="rounded-2xl border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-100 hover:border-cyan-300">
              Return to BrandEdge
            </Link>
          </div>
        </section>
      </main>

      {showLockedModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 text-center">
            <h3 className="text-lg font-black text-white">Feature Locked in Demo Mode</h3>
            <p className="mt-3 text-sm text-slate-300">Full analytics available to BrandEdge subscribers.</p>
            <button
              onClick={() => setShowLockedModal(false)}
              className="mt-5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoDashboardPage;
