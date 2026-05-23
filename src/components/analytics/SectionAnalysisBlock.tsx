import React, { useState } from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';
import { InsightModal } from './InsightModal';

interface SectionAnalysisBlockProps {
  title: string;
  insight: AwarenessInsightResult | null;
}

export const SectionAnalysisBlock: React.FC<SectionAnalysisBlockProps> = ({ title, insight }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!insight) return null;

  return (
    <>
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
              onClick={() => setIsOpen(true)}
              className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[#E10613] transition-colors hover:text-[#B5040F] focus:outline-none"
            >
              VIEW DETAILED ANALYSIS ▼
            </button>
          </div>
        </div>
      </div>
      <InsightModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        insight={insight}
        title={title}
      />
    </>
  );
};
