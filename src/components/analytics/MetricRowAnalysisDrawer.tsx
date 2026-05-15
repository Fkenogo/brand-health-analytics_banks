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
    <div className="rounded-xl bg-white shadow-lg" style={{ border: '1px solid #E4E7EC' }}>

      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4" style={{ borderBottom: '1px solid #E4E7EC' }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">
            Detailed Analysis
          </p>
          <h4 className="text-sm font-bold text-[#1F2230]">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-[#667085] transition-colors hover:bg-[#F7F8FA] hover:text-[#1F2230]"
          aria-label="Close analysis"
        >
          ✕
        </button>
      </div>

      {/* Metric definition strip */}
      {definition && (
        <div className="bg-[#F7F8FA] px-6 py-2.5" style={{ borderBottom: '1px solid #E4E7EC' }}>
          <p className="text-[11px] text-[#667085]">
            <span className="font-semibold uppercase tracking-wider text-[#1F2230]">
              What this measures:{' '}
            </span>
            {definition}
          </p>
        </div>
      )}

      {/* Executive Takeaway — full width */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #E4E7EC' }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#667085]">
          Executive Takeaway
        </p>
        <p className="max-w-2xl text-sm font-medium leading-relaxed text-[#1F2230]">{insight.snapshot}</p>
      </div>

      {/* 2-column section grid — items-start prevents equal-height stretching */}
      <div className="p-6">
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

    </div>
  );
};
