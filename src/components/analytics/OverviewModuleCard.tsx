import React from 'react';
import type { ModulePriorityBadge } from '@/utils/overviewInsights';

export type StatusTone = 'positive' | 'neutral' | 'negative';

export interface OverviewModuleCardProps {
  /** Module display name, e.g. "Awareness & Consideration" */
  title: string;
  /** Formatted headline metric value, e.g. "72%" or "48" */
  metric: string;
  /** Short descriptor for the metric, e.g. "awareness" or "loyalty index" */
  metricLabel: string;
  /** Plain-language status label, e.g. "Strong reach" or "Needs attention" */
  statusLabel: string;
  statusTone: StatusTone;
  /**
   * One-sentence plain-language summary.
   * Pass `moduleSummary.snapshot` from the relevant insight builder.
   * Any "Label: " prefix is stripped before display.
   */
  snapshot: string | null;
  /**
   * Optional priority badge shown in the top-right corner.
   * Derived from module diagnostics — does not affect scores.
   */
  priorityBadge?: ModulePriorityBadge | null;
  /** Called when the user clicks "Open report". */
  onOpen: () => void;
}

const TONE_CLASSES: Record<StatusTone, string> = {
  positive: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  neutral:  'bg-[#F9FAFB] text-[#344054] border border-[#E4E7EC]',
  negative: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const BADGE_CLASSES: Record<ModulePriorityBadge, string> = {
  'Highest Priority': 'bg-[#E10613] text-white',
  'Priority':         'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
  'Monitor':          'bg-[#F9FAFB] text-[#98A2B3] border border-[#E4E7EC]',
};

/** Strip a leading "Label: " prefix (e.g. "Leaky Bucket: ") and capitalise the first character. */
function stripSnapshotPrefix(text: string): string {
  const stripped = text.replace(/^[^:]+:\s*/, '').trim();
  return stripped.length > 0 ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : stripped;
}

/** Truncate to the last whole word before `max` characters. */
function truncate(text: string, max = 145): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(' ', max);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, max)) + '…';
}

export const OverviewModuleCard: React.FC<OverviewModuleCardProps> = ({
  title,
  metric,
  metricLabel,
  statusLabel,
  statusTone,
  snapshot,
  priorityBadge,
  onOpen,
}) => {
  const displayText = snapshot ? truncate(stripSnapshotPrefix(snapshot)) : null;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm"
      style={{ border: '1px solid #E4E7EC', borderLeft: '3px solid #E10613' }}
    >
      <div className="flex flex-1 flex-col p-5">
        {/* Module name + priority badge row */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#667085]">
            {title}
          </p>
          {priorityBadge && priorityBadge !== 'Monitor' && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${BADGE_CLASSES[priorityBadge]}`}
            >
              {priorityBadge}
            </span>
          )}
        </div>

        {/* Headline metric */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black leading-none text-[#1F2230]">{metric}</span>
          {metricLabel && (
            <span className="text-xs text-[#98A2B3]">{metricLabel}</span>
          )}
        </div>

        {/* Status badge */}
        <div className="mt-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${TONE_CLASSES[statusTone]}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Snapshot */}
        <p className="mt-3 flex-1 text-xs leading-relaxed text-[#667085]">
          {displayText ?? 'No summary available yet.'}
        </p>
      </div>

      {/* Action */}
      <div className="border-t border-[#F2F4F7] px-5 py-3">
        <button
          type="button"
          onClick={onOpen}
          className="text-[11px] font-semibold uppercase tracking-widest text-[#E10613] transition-colors hover:text-[#B5040F] focus:outline-none"
        >
          Open report
        </button>
      </div>
    </div>
  );
};
