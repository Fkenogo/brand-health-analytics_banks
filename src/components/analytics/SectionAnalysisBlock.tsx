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
    <div
      className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm"
      style={{ border: '1px solid #E4E7EC', borderLeft: '3px solid #E10613' }}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#1F2230]">
              <span className="text-[#E10613]" aria-hidden="true">◈</span>
              {title}
            </p>
            <p className="text-sm leading-relaxed text-[#667085]">{insight.snapshot}</p>
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[#E10613] transition-colors hover:text-[#B5040F]"
          >
            {expanded ? 'COLLAPSE ANALYSIS ▲' : 'VIEW DETAILED ANALYSIS ▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5" style={{ borderTop: '1px solid #E4E7EC' }}>
          <div className="grid gap-3 sm:grid-cols-2 items-start">
            {sections.map((sec, idx) => (
              <div
                key={sec.heading ?? idx}
                className="rounded-lg bg-[#F7F8FA] p-4 self-start"
                style={{ border: '1px solid #E4E7EC' }}
              >
                {sec.heading && (
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#1F2230]">
                    {sec.heading}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-[#667085] max-w-prose">{sec.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
