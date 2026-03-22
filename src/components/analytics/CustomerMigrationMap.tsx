import React from 'react';
import type { CustomerMigrationMapResult } from '@/utils/customerMigrationMap';

type CustomerMigrationMapProps = {
  metrics: CustomerMigrationMapResult;
  resolveCompetitorLabel?: (competitor: string) => string;
};

export const CustomerMigrationMap: React.FC<CustomerMigrationMapProps> = ({
  metrics,
  resolveCompetitorLabel,
}) => {
  const labelFor = (competitor: string) => resolveCompetitorLabel?.(competitor) || competitor;

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Preference Drift Among Current Users</h2>
        <p className="mt-2 text-sm text-slate-400">
          Among customers who currently use your bank and at least one competitor, this shows where primary preference sits today.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Selected-bank user base</p>
          <p className="mt-2 text-2xl font-black text-white">{metrics.selectedBankUserBase}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Multi-bank selected-bank base</p>
          <p className="mt-2 text-2xl font-black text-white">{metrics.selectedBankMultiBankBase}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Selected preferred in multi-bank base</p>
          <p className="mt-2 text-2xl font-black text-white">{metrics.selectedBankPreferredBase}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Preference-drift base</p>
          <p className="mt-2 text-2xl font-black text-white">{metrics.migrationAwayBase}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-cyan-200">Selected-bank users also using competitors</p>
          <p className="mt-2 text-3xl font-black text-white">{metrics.multiBankRateAmongSelectedUsers}%</p>
        </div>
        <div className="rounded-xl border border-amber-300/20 bg-amber-500/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-amber-100">Multi-bank users preferring another bank</p>
          <p className="mt-2 text-3xl font-black text-white">{metrics.driftRateAmongSelectedMultiBankUsers}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Top drift destination</p>
          <p className="mt-2 text-3xl font-black text-white">{metrics.topMigrationCompetitor ? labelFor(metrics.topMigrationCompetitor) : 'None'}</p>
        </div>
      </div>

      {metrics.lowSample && (
        <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-amber-100">
          Low sample warning: interpret with caution (n={metrics.selectedBankMultiBankBase} multi-bank users of selected bank).
        </p>
      )}

      {!metrics.hasData ? (
        <p className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
          {metrics.emptyReason === 'NO_SELECTED_BANK_USERS'
            ? 'No selected-bank users in this slice.'
            : 'No preference-drift pattern is visible in this slice.'}
        </p>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Direction of Current Preference Drift</h3>
            <div className="mt-4 space-y-4">
              {metrics.rows.map((row) => (
                <div key={row.competitor}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>{metrics.selectedBankId} users now preferring {labelFor(row.competitor)}</span>
                    <span>{row.share}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${row.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Preference Destinations</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2 pr-2">Competitor</th>
                    <th className="py-2 pr-2">Current users</th>
                    <th className="py-2 pr-0">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.rows.map((row) => (
                    <tr key={row.competitor} className="border-t border-white/10">
                      <td className="py-2 pr-2 font-semibold text-white">{labelFor(row.competitor)}</td>
                      <td className="py-2 pr-2">{row.count}</td>
                      <td className="py-2 pr-0 font-bold text-cyan-300">{row.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
