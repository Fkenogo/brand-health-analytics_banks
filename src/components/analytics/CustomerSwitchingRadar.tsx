import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CustomerSwitchingRadarResult } from '@/utils/customerSwitchingRadar';

type CustomerSwitchingRadarProps = {
  metrics: CustomerSwitchingRadarResult;
  title?: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  resolveCompetitorLabel?: (competitor: string) => string;
};

export const CustomerSwitchingRadar: React.FC<CustomerSwitchingRadarProps> = ({
  metrics,
  title = 'Competitive Pressure Among Multi-Bank Users',
  subtitle = 'Among customers in the current sample who also use the selected bank, this highlights competitors that capture more secondary preference.',
  headerRight,
  resolveCompetitorLabel,
}) => {
  const labelFor = (competitor: string) => resolveCompetitorLabel?.(competitor) || competitor;

  if (!metrics.hasData) {
    return (
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>
          {headerRight ? <div>{headerRight}</div> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Selected-bank multi-bank base</p>
            <p className="mt-2 text-2xl font-black text-white">{metrics.multiBankUsingSelectedBase}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Second-choice base</p>
            <p className="mt-2 text-2xl font-black text-white">{metrics.secondChoiceBase}</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No competitive pressure view is available for this bank in the current sample.
        </p>
      </section>
    );
  }

  const radarData = metrics.competitors.map((row) => ({
    competitor: labelFor(row.competitor),
    score: row.switchingPressureScore,
    secondChoiceShare: row.secondChoiceShare,
    overlapShare: row.overlapShare,
  }));

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">{title}</h2>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        {headerRight ? <div>{headerRight}</div> : null}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        This demo view is a directional pressure signal built from multi-bank overlap and second-choice preference in the selected sample, not observed customer switching or live filtered dashboard data.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Selected-bank multi-bank base</p>
          <p className="mt-2 text-2xl font-black text-white">{metrics.multiBankUsingSelectedBase}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Second-choice base</p>
          <p className="mt-2 text-2xl font-black text-white">{metrics.secondChoiceBase}</p>
        </div>
      </div>

      {metrics.lowSample && (
        <p className="mt-4 rounded-xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-amber-100">
          Low sample warning: interpret with caution (n={metrics.multiBankUsingSelectedBase} multi-bank users of selected bank).
        </p>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="h-[320px] rounded-2xl border border-white/10 bg-slate-950/60 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="competitor" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar dataKey="score" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value, _name, item) => {
                  const payload = item?.payload as { secondChoiceShare: number; overlapShare: number } | undefined;
                  return [
                    `${value}% score · ${payload?.secondChoiceShare ?? 0}% second-choice · ${payload?.overlapShare ?? 0}% overlap`,
                    'Pressure signal',
                  ];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Ranked Competitive Pressure</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-2 pr-2">Competitor</th>
                  <th className="py-2 pr-2">2nd Choice</th>
                  <th className="py-2 pr-2">Overlap</th>
                  <th className="py-2 pr-0">Score</th>
                </tr>
              </thead>
              <tbody>
                {metrics.competitors.map((row) => (
                  <tr key={row.competitor} className="border-t border-white/10">
                    <td className="py-2 pr-2 font-semibold text-white">{labelFor(row.competitor)}</td>
                    <td className="py-2 pr-2">{row.secondChoiceShare}%</td>
                    <td className="py-2 pr-2">{row.overlapShare}%</td>
                    <td className="py-2 pr-0 font-bold text-cyan-300">{row.switchingPressureScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
