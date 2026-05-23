import React, { useState } from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';
import { InsightModal } from './InsightModal';

interface KpiCardAnalysisFooterProps {
  insight: AwarenessInsightResult;
  title: string;
  definition?: string;
}

export const KpiCardAnalysisFooter: React.FC<KpiCardAnalysisFooterProps> = ({
  insight,
  title,
  definition,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="kpi-card-footer">
      <p className="text-[11px] leading-snug text-slate-600">{insight.snapshot}</p>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#E10613] hover:text-[#B5040F] transition-colors focus:outline-none"
      >
        VIEW DETAILED ANALYSIS ▼
      </button>
      <InsightModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        insight={insight}
        title={title}
        definition={definition}
      />
    </div>
  );
};
