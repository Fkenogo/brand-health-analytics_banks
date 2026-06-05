import React from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface LoyaltyBannerProps {
  moduleSummary: AwarenessInsightResult | null;
  loyaltyIndex: number | null;
  nps: number | null;
  committedPct: number | null;
  positionLabel: string;
  sampleSize: number;
}

function fmtMetric(v: number | null, isIndex?: boolean): string {
  if (v === null || !isFinite(v)) return '—';
  if (isIndex) return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
  const sign = v > 0 ? '+' : '';
  return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}`;
}

function fmtPct(v: number | null): string {
  if (v === null || !isFinite(v)) return '—';
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

export const LoyaltyBanner: React.FC<LoyaltyBannerProps> = ({
  moduleSummary,
  loyaltyIndex,
  nps,
  committedPct,
  positionLabel,
  sampleSize,
}) => {
  const takeaway = moduleSummary?.snapshot ?? '';

  const metrics = [
    { label: 'Loyalty Index', value: fmtMetric(loyaltyIndex, true) },
    { label: 'NPS', value: fmtMetric(nps) },
    { label: 'Committed', value: fmtPct(committedPct) },
  ];

  const locationLabel =
    positionLabel && positionLabel !== 'N/A'
      ? `${positionLabel} · N=${sampleSize}`
      : `N=${sampleSize}`;

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
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#667085]">LOYALTY</span>
            </div>
          )}
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#98A2B3]">
            {locationLabel}
          </p>
        </div>

        {/* CENTER — module title + narrative */}
        <div className="min-w-0 flex-1">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">
            <span className="text-[#E10613]" aria-hidden="true">◈</span>
            Loyalty Overview
          </p>
          {takeaway ? (
            <p className="text-sm leading-relaxed text-[#1F2230]">{takeaway}</p>
          ) : (
            <p className="text-sm text-[#667085]">No loyalty data available for this selection.</p>
          )}
        </div>

        {/* RIGHT — light metric tiles */}
        <div className="flex-shrink-0 lg:w-56">
          <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-1 lg:gap-3">
            {metrics.map(({ label, value }) => (
              <div key={label} className="min-w-0 rounded-xl border border-[#E4E7EC] bg-[#F8FAFC] px-3 py-2.5">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#667085] truncate">{label}</p>
                <p className="text-xl font-black text-[#1F2230]">{value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
