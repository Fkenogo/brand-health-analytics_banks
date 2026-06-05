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
  title = 'Multi-Bank Competitive Pressure',
  subtitle = 'Among customers who use your bank and at least one competitor, this highlights where secondary preference is strongest.',
  headerRight,
  resolveCompetitorLabel,
}) => {
  const labelFor = (competitor: string) => resolveCompetitorLabel?.(competitor) || competitor;

  if (!metrics.hasData) {
    return (
      <section className="rounded-3xl border border-[#E4E7EC] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#1F2230]">{title}</h2>}
            <p className="mt-1.5 text-sm text-[#475467]">{subtitle}</p>
          </div>
          {headerRight ? <div>{headerRight}</div> : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Multi-bank base</p>
            <p className="mt-2 text-2xl font-black text-[#1F2230]">{metrics.multiBankUsingSelectedBase}</p>
          </div>
          <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Second-choice base</p>
            <p className="mt-2 text-2xl font-black text-[#1F2230]">{metrics.secondChoiceBase}</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
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
    <section className="rounded-3xl border border-[#E4E7EC] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {title && <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#1F2230]">{title}</h2>}
          <p className="mt-1.5 text-sm text-[#475467]">{subtitle}</p>
        </div>
        {headerRight ? <div>{headerRight}</div> : null}
      </div>

      <p className="mt-2 text-xs text-[#667085]">
        Estimated view based on customers who use more than one bank. This does not confirm actual switching.
      </p>

      {/* Base count tiles */}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Multi-bank base</p>
          <p className="mt-2 text-2xl font-black text-[#1F2230]">{metrics.multiBankUsingSelectedBase}</p>
        </div>
        <div className="rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Second-choice base</p>
          <p className="mt-2 text-2xl font-black text-[#1F2230]">{metrics.secondChoiceBase}</p>
        </div>
      </div>

      {metrics.lowSample && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          Low sample: interpret with caution (n={metrics.multiBankUsingSelectedBase} multi-bank users).
        </p>
      )}

      {/* Chart + table */}
      <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="h-[320px] rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#CBD5E1" />
              <PolarAngleAxis
                dataKey="competitor"
                stroke="#94a3b8"
                tick={{ fill: '#1F2230', fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: '#667085', fontSize: 10 }}
              />
              <Radar dataKey="score" stroke="#E10613" fill="#E10613" fillOpacity={0.25} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E4E7EC', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#1F2230', fontWeight: 600 }}
                itemStyle={{ color: '#344054' }}
                formatter={(value, _name, item) => {
                  const payload = item?.payload as { secondChoiceShare: number; overlapShare: number } | undefined;
                  return [
                    `${value}% score · ${payload?.secondChoiceShare ?? 0}% 2nd choice · ${payload?.overlapShare ?? 0}% overlap`,
                    'Competitive pressure',
                  ];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-[#E4E7EC] bg-[#F8FAFC] p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#1F2230]">Ranked Competitive Pressure</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4E7EC] text-[11px] uppercase tracking-wider text-[#667085]">
                  <th className="py-2 pr-2">Competitor</th>
                  <th className="py-2 pr-2">2nd Choice</th>
                  <th className="py-2 pr-2">Overlap</th>
                  <th className="py-2 pr-0">Score</th>
                </tr>
              </thead>
              <tbody>
                {metrics.competitors.map((row) => (
                  <tr key={row.competitor} className="border-b border-[#F2F4F7]">
                    <td className="py-2 pr-2 font-semibold text-[#1F2230]">{labelFor(row.competitor)}</td>
                    <td className="py-2 pr-2 text-[#344054]">{row.secondChoiceShare}%</td>
                    <td className="py-2 pr-2 text-[#344054]">{row.overlapShare}%</td>
                    <td className="py-2 pr-0 font-bold text-[#E10613]">{row.switchingPressureScore}</td>
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
