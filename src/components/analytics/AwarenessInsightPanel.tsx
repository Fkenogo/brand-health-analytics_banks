import React from 'react';

interface AwarenessInsightPanelProps {
  insight: string | null;
  label?: string;
}

export const AwarenessInsightPanel: React.FC<AwarenessInsightPanelProps> = ({
  insight,
  label = 'Analysis',
}) => {
  if (!insight) return null;
  return (
    <details className="group mt-2">
      <summary className="cursor-pointer list-none select-none text-[11px] font-semibold text-slate-400 hover:text-slate-200">
        <span className="group-open:hidden">▸ {label}</span>
        <span className="hidden group-open:inline">▾ {label}</span>
      </summary>
      <div className="mt-2 rounded-lg border border-white/5 bg-slate-900/50 px-3 py-2 text-xs leading-relaxed text-slate-300">
        {insight}
      </div>
    </details>
  );
};
