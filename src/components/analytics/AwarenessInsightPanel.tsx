import React, { useState } from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';
import { InsightModal } from './InsightModal';

interface AwarenessInsightPanelProps {
  insight: AwarenessInsightResult | null;
  definition?: string;
  title?: string;
}

export const AwarenessInsightPanel: React.FC<AwarenessInsightPanelProps> = ({
  insight,
  definition,
  title,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!insight) return null;

  return (
    <>
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
          onClick={() => setIsOpen(true)}
          className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-[#E10613] hover:text-[#B5040F] transition-colors focus:outline-none"
        >
          FULL ANALYSIS ▼
        </button>
      </div>
      <InsightModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        insight={insight}
        title={title ?? 'Metric Analysis'}
        definition={definition}
      />
    </>
  );
};
