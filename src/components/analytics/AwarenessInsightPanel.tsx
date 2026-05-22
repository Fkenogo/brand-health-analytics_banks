import React, { useState } from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface AwarenessInsightPanelProps {
  insight: AwarenessInsightResult | null;
  definition?: string;
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

export const AwarenessInsightPanel: React.FC<AwarenessInsightPanelProps> = ({
  insight,
  definition,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!insight) return null;

  const sections = insight.detail.split('\n\n').filter(Boolean).map(parseSection);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {definition && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          What this measures:{' '}
          <span className="normal-case tracking-normal font-normal text-slate-500">{definition}</span>
        </p>
      )}
      <p className="text-xs leading-relaxed text-slate-700">{insight.snapshot}</p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#E10613] hover:text-[#B5040F] transition-colors"
      >
        {expanded ? 'HIDE ANALYSIS ▲' : 'FULL ANALYSIS ▼'}
      </button>
      {expanded && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {sections.map((sec, idx) => (
              <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                {sec.heading && (
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    {sec.heading}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-slate-600">{sec.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
