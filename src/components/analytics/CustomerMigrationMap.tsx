import React from 'react';
import type { CustomerMigrationMapResult } from '@/utils/customerMigrationMap';

type CustomerMigrationMapProps = {
  metrics: CustomerMigrationMapResult;
  resolveCompetitorLabel?: (competitor: string) => string;
  /** Human-readable name for the selected bank, e.g. "BK Rwanda". Falls back to "Selected bank" if not provided. */
  selectedBankName?: string;
};

export const CustomerMigrationMap: React.FC<CustomerMigrationMapProps> = ({
  metrics,
  resolveCompetitorLabel,
  selectedBankName = 'Selected bank',
}) => {
  const labelFor = (competitor: string) => resolveCompetitorLabel?.(competitor) || competitor;

  return (
    <section className="rounded-3xl border border-[#E4E7EC] bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#1F2230]">Preference Shift Among Current Users</h2>
        <p className="mt-1.5 text-sm text-[#475467]">
          Among customers who currently use your bank and at least one competitor, this shows where primary preference sits today.
        </p>
      </div>

      {/* Base counts */}
      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">User base</p>
          <p className="mt-2 text-2xl font-black text-[#1F2230]">{metrics.selectedBankUserBase}</p>
        </div>
        <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Also using competitors</p>
          <p className="mt-2 text-2xl font-black text-[#1F2230]">{metrics.selectedBankMultiBankBase}</p>
        </div>
        <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Prefer this bank</p>
          <p className="mt-2 text-2xl font-black text-[#1F2230]">{metrics.selectedBankPreferredBase}</p>
        </div>
        <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Prefer another bank</p>
          <p className="mt-2 text-2xl font-black text-[#1F2230]">{metrics.migrationAwayBase}</p>
        </div>
      </div>

      {/* Key KPI tiles */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[#E10613]/20 bg-[#FFF5F5] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#E10613]">Using competitors too</p>
          <p className="mt-2 text-3xl font-black text-[#1F2230]">{metrics.multiBankRateAmongSelectedUsers}%</p>
          <p className="mt-1 text-[11px] text-[#667085]">of current users</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">Choosing another bank</p>
          <p className="mt-2 text-3xl font-black text-[#1F2230]">{metrics.driftRateAmongSelectedMultiBankUsers}%</p>
          <p className="mt-1 text-[11px] text-[#667085]">of multi-bank users</p>
        </div>
        <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Most chosen competitor</p>
          <p className="mt-2 text-3xl font-black text-[#1F2230]">{metrics.topMigrationCompetitor ? labelFor(metrics.topMigrationCompetitor) : 'None'}</p>
          <p className="mt-1 text-[11px] text-[#667085]">among those who shifted</p>
        </div>
      </div>

      {metrics.lowSample && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Small sample: interpret with caution (n={metrics.selectedBankMultiBankBase} users of this bank who also use a competitor).
        </p>
      )}

      {!metrics.hasData ? (
        <p className="mt-4 rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475467]">
          {metrics.emptyReason === 'NO_SELECTED_BANK_USERS'
            ? 'No users of this bank found in this data slice.'
            : 'No preference shift pattern is visible in this slice.'}
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Progress bars */}
          <div className="rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1F2230]">Where Customers Are Moving</h3>
            <div className="mt-4 space-y-4">
              {metrics.rows.map((row) => (
                <div key={row.competitor}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-[#344054]">
                      {selectedBankName} customers now preferring {labelFor(row.competitor)}
                    </span>
                    <span className="text-xs font-bold text-[#1F2230]">{row.share}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#E4E7EC]">
                    <div className="h-2.5 rounded-full bg-[#E10613]" style={{ width: `${row.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preference destinations table */}
          <div className="rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#1F2230]">Top Competitor Choices</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E4E7EC] text-[11px] uppercase tracking-wider text-[#667085]">
                    <th className="py-2 pr-2">Competitor</th>
                    <th className="py-2 pr-2">Count</th>
                    <th className="py-2 pr-0">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.rows.map((row) => (
                    <tr key={row.competitor} className="border-b border-[#F2F4F7]">
                      <td className="py-2 pr-2 font-semibold text-[#1F2230]">{labelFor(row.competitor)}</td>
                      <td className="py-2 pr-2 text-[#344054]">{row.count}</td>
                      <td className="py-2 pr-0 font-bold text-[#E10613]">{row.share}%</td>
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
