import React from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface MetricRowAnalysisDrawerProps {
  insight: AwarenessInsightResult;
  title: string;
  definition?: string;
  onClose: () => void;
}

function parseSection(para: string): { heading: string | null; body: string } {
  const colonIdx = para.indexOf(':');
  if (colonIdx > 0) {
    const maybeHeading = para.slice(0, colonIdx);
    if (/^[A-Z][A-Z\s&/]+$/.test(maybeHeading)) {
      return { heading: maybeHeading, body: para.slice(colonIdx + 1).trim() };
    }
  }
  return { heading: null, body: para };
}

export const MetricRowAnalysisDrawer: React.FC<MetricRowAnalysisDrawerProps> = ({
  insight,
  title,
  definition,
  onClose,
}) => {
  const sections = insight.detail.split('\n\n').filter(Boolean).map(parseSection);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Detailed Analysis
          </p>
          <h4 className="text-sm font-bold text-slate-200">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors text-sm"
          aria-label="Close analysis"
        >
          ✕
        </button>
      </div>

      {/* Metric definition strip */}
      {definition && (
        <div className="border-b border-white/10 px-6 py-2.5">
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-slate-600">
              What this measures:{' '}
            </span>
            {definition}
          </p>
        </div>
      )}

      {/* Two-zone body — stacks vertically on mobile, side-by-side on lg+ */}
      <div className="flex flex-col gap-5 p-6 lg:flex-row">
        {/* Left zone: executive snapshot */}
        <div className="flex-shrink-0 lg:w-72 xl:w-80">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-5 py-4 h-full">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
              Executive Takeaway
            </p>
            <p className="text-sm font-medium leading-relaxed text-slate-200">
              {insight.snapshot}
            </p>
          </div>
        </div>

        {/* Right zone: section grid */}
        <div className="flex-1 grid gap-3 sm:grid-cols-2 content-start">
          {sections.map((sec, idx) => (
            <div key={sec.heading ?? idx} className="rounded-lg border border-white/10 bg-slate-900/50 p-3.5">
              {sec.heading && (
                <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  {sec.heading}
                </p>
              )}
              <p className="text-xs leading-relaxed text-slate-400">{sec.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
