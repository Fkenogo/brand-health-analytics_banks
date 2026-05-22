import React from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface UsageIntelligenceBannerProps {
  moduleSummary: AwarenessInsightResult | null;
  retentionRate: number | null;
  bumoPenetration: number | null;
  multiBankingPct: number | null;
  positionLabel: string;
  sampleSize: number;
}

function extractPattern(snapshot: string | undefined): string | null {
  if (!snapshot) return null;
  const match = snapshot.match(/^([^:]+):/);
  return match ? match[1].trim() : null;
}

function extractTakeaway(snapshot: string | undefined): string {
  if (!snapshot) return '';
  return snapshot.replace(/^[^:]+:\s*/, '').trim();
}

function fmt(v: number | null): string {
  if (v === null || !isFinite(v)) return '—';
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

export const UsageIntelligenceBanner: React.FC<UsageIntelligenceBannerProps> = ({
  moduleSummary,
  retentionRate,
  bumoPenetration,
  multiBankingPct,
  positionLabel,
  sampleSize,
}) => {
  const pattern = extractPattern(moduleSummary?.snapshot);
  const takeaway = extractTakeaway(moduleSummary?.snapshot);

  const metrics = [
    { label: 'Retention Rate', value: fmt(retentionRate) },
    { label: 'BUMO Penetration', value: fmt(bumoPenetration) },
    { label: 'Multi-Banking', value: fmt(multiBankingPct) },
  ];

  const locationLabel =
    positionLabel && positionLabel !== 'N/A'
      ? `${positionLabel} · N=${sampleSize}`
      : `N=${sampleSize}`;

  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{ background: 'linear-gradient(135deg, #1F2230 0%, #200406 55%, #1F2230 100%)' }}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* LEFT — strategic classification tag */}
        <div className="flex-shrink-0 lg:w-48">
          {pattern ? (
            <div className="mb-3 inline-block rounded border border-[#E10613]/30 bg-[#E10613]/10 px-2.5 py-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#E10613]">{pattern}</span>
            </div>
          ) : (
            <div className="mb-3 inline-block rounded border border-white/10 bg-white/5 px-2.5 py-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#667085]">USAGE INTELLIGENCE</span>
            </div>
          )}
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#667085]">
            {locationLabel}
          </p>
        </div>

        {/* CENTER — executive narrative */}
        <div className="min-w-0 flex-1">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#667085]">
            <span className="text-[#E10613]" aria-hidden="true">◈</span>
            Usage Intelligence
          </p>
          {takeaway ? (
            <p className="text-sm leading-relaxed text-[#F7F8FA]">{takeaway}</p>
          ) : (
            <p className="text-sm text-[#667085]">No intelligence data available.</p>
          )}
        </div>

        {/* RIGHT — compact stats column */}
        <div className="flex-shrink-0 lg:w-52">
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-2">
            {metrics.map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-[#101828] px-3 py-2.5">
                <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#667085]">{label}</p>
                <p className="text-xl font-black text-[#F7F8FA]">{value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
