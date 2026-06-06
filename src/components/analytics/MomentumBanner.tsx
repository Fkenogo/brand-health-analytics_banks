import React from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface MomentumBannerProps {
  moduleSummary: AwarenessInsightResult | null;
  score: number | null;
  velocity: number | null;
  velocityLabel: string;
  selectedRank: number | null;
  totalBanks: number;
  positionLabel: string;
  sampleSize: number;
}

function fmtScore(v: number | null): string {
  if (v === null || !isFinite(v)) return '—';
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}

function fmtVelocity(v: number | null): string {
  if (v === null || !isFinite(v)) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}`;
}

export const MomentumBanner: React.FC<MomentumBannerProps> = ({
  moduleSummary,
  score,
  velocity,
  velocityLabel,
  selectedRank,
  totalBanks,
  positionLabel,
  sampleSize,
}) => {
  const takeaway = moduleSummary?.snapshot ?? '';

  const metrics = [
    { label: 'Momentum Score', value: fmtScore(score), sub: null },
    { label: 'Recent Movement', value: fmtVelocity(velocity), sub: velocityLabel || null },
    {
      label: 'Competitive Rank',
      value: selectedRank !== null ? `#${selectedRank} of ${totalBanks}` : '—',
      sub: null,
    },
  ];

  return (
    <div className="rounded-3xl border border-[#E4E7EC] bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* LEFT — position chip + context line */}
        <div className="flex-shrink-0 lg:w-48">
          {positionLabel && positionLabel !== 'N/A' ? (
            <div className="mb-3 inline-block rounded-full border border-[#E10613]/20 bg-[#FFF0F0] px-3 py-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#E10613]">{positionLabel}</span>
            </div>
          ) : (
            <div className="mb-3 inline-block rounded-full border border-[#E4E7EC] bg-[#F9FAFB] px-3 py-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#667085]">MOMENTUM</span>
            </div>
          )}
          {/* Fixed: was missing font-medium uppercase tracking-widest */}
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#667085]">
            N={sampleSize}
          </p>
        </div>

        {/* CENTER — module title + narrative */}
        <div className="min-w-0 flex-1">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#667085]">
            <span className="text-[#E10613]" aria-hidden="true">◈</span>
            Momentum Overview
          </p>
          {takeaway ? (
            <p className="text-sm leading-relaxed text-[#1F2230]">{takeaway}</p>
          ) : (
            <p className="text-sm text-[#667085]">No momentum data available for this selection.</p>
          )}
        </div>

        {/* RIGHT — light metric tiles */}
        <div className="flex-shrink-0 lg:w-56">
          <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-1 lg:gap-3">
            {metrics.map(({ label, value, sub }) => (
              <div key={label} className="min-w-0 rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] px-3 py-2.5">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#667085] truncate">{label}</p>
                <p className="text-xl font-black text-[#1F2230]">{value}</p>
                {sub && (
                  <p className="mt-0.5 text-[10px] text-[#667085] truncate">{sub}</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
