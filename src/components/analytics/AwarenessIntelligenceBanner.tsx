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
    <div className="rounded-3xl border border-[#E4E7EC] bg-white px-6 py-5 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* LEFT — classification chip + context line */}
        <div className="flex-shrink-0 lg:w-48">
          {pattern ? (
            <div className="mb-3 inline-block rounded-full border border-[#E10613]/20 bg-[#FFF0F0] px-3 py-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#E10613]">{pattern}</span>
            </div>
          ) : (
            <div className="mb-3 inline-block rounded-full border border-[#E4E7EC] bg-[#F9FAFB] px-3 py-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#667085]">INTELLIGENCE</span>
            </div>
          )}
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#667085]">
            {country} · N={sampleSize}
          </p>
        </div>

        {/* CENTER — module title + narrative */}
        <div className="min-w-0 flex-1">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#667085]">
            <span className="text-[#E10613]" aria-hidden="true">◈</span>
            Awareness Intelligence
          </p>
          {takeaway ? (
            <p className="text-sm leading-relaxed text-[#1F2230]">{takeaway}</p>
          ) : (
            <p className="text-sm text-[#667085]">No intelligence data available.</p>
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
