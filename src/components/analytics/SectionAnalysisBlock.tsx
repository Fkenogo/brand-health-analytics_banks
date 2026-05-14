import React, { useState } from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface SectionAnalysisBlockProps {
  title: string;
  insight: AwarenessInsightResult | null;
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

export const SectionAnalysisBlock: React.FC<SectionAnalysisBlockProps> = ({
  title,
  insight,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!insight) return null;

  const sections = insight.detail.split('\n\n').filter(Boolean).map(parseSection);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/40">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="text-indigo-400" aria-hidden="true">◈</span>
              {title}
            </p>
            <p className="text-sm leading-relaxed text-slate-300">{insight.snapshot}</p>
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {expanded ? 'COLLAPSE ANALYSIS ▲' : 'VIEW DETAILED ANALYSIS ▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
};
