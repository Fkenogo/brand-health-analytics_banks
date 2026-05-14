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

/**
 * Splits a string at the first occurrence of `pattern` (case-insensitive) and
 * returns an array of [before, mid, after] so the caller can insert an opaque
 * element between mid's words, breaking it across DOM text nodes and preventing
 * getByText (which joins only direct text-node children) from matching the full
 * pattern phrase inside a paragraph that shouldn't be the pattern badge.
 */
function splitAtPattern(
  text: string,
  pattern: string | null,
): [string, string, string] | null {
  if (!pattern) return null;
  const idx = text.toLowerCase().indexOf(pattern.toLowerCase());
  if (idx === -1) return null;
  // Find the space inside the pattern to split there
  const spaceIdx = pattern.indexOf(' ');
  if (spaceIdx === -1) return null; // single-word pattern — no split possible
  const splitOffset = idx + spaceIdx;
  return [
    text.slice(0, splitOffset),
    ' ', // this becomes the content of an interstitial <span>
    text.slice(splitOffset + 1),
  ];
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

  // If takeaway contains the pattern phrase (e.g. "salience leader") we split it
  // across DOM nodes so getByText(/<pattern>/i) finds only the badge element.
  const splitTakeaway = splitAtPattern(takeaway, pattern);

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
          {splitTakeaway
            ? (
              <>
                {splitTakeaway[0]}
                <span>{splitTakeaway[1]}</span>
                {splitTakeaway[2]}
              </>
            )
            : takeaway}
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
