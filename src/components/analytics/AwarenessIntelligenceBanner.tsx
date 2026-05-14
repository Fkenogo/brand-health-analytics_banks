import React from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface AwarenessIntelligenceBannerProps {
  moduleSummary: AwarenessInsightResult | null;
  totalAwareness: number | null;
  topOfMind: number | null;
  awarenessQuality: number | null;
  country: string;
  sampleSize: number;
}

function extractPattern(snapshot: string | undefined): string | null {
  if (!snapshot) return null;
  const match = snapshot.match(/^Awareness pattern:\s*([^.]+)/i);
  return match ? match[1].trim() : null;
}

function extractTakeaway(snapshot: string | undefined): string {
  if (!snapshot) return '';
  return snapshot.replace(/^Awareness pattern:\s*[^.]+\.\s*/i, '').trim();
}

function fmt(v: number | null): string {
  if (v === null || !isFinite(v)) return '—';
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}


export const AwarenessIntelligenceBanner: React.FC<AwarenessIntelligenceBannerProps> = ({
  moduleSummary,
  totalAwareness,
  topOfMind,
  awarenessQuality,
  country,
  sampleSize,
}) => {
  const pattern = extractPattern(moduleSummary?.snapshot);
  const takeaway = extractTakeaway(moduleSummary?.snapshot);

  const metrics = [
    { label: 'Total Awareness', value: fmt(totalAwareness) },
    { label: 'Top of Mind', value: fmt(topOfMind) },
    { label: 'Quality Ratio', value: fmt(awarenessQuality) },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/60 px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400" aria-hidden="true">◈</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Awareness Intelligence
          </span>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
          {country} · N={sampleSize}
        </span>
      </div>

      {pattern && (
        <div className="mb-3 inline-block rounded-md border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
            {pattern}
          </span>
        </div>
      )}

      {takeaway && (
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-slate-300">
          {takeaway}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {label}
            </p>
            <p className="text-2xl font-black text-slate-100">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
