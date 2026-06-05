import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: AwarenessInsightResult;
  title: string;
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

export const InsightModal: React.FC<InsightModalProps> = ({
  isOpen,
  onClose,
  insight,
  title,
  definition,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sections = insight.detail.split('\n\n').filter(Boolean).map(parseSection);

  // Portal renders at document.body level, bypassing any ancestor CSS transform/filter
  // stacking contexts that would break position:fixed (dashboard-section:hover uses
  // transform; kpi-card-primary:hover uses filter — both break fixed positioning).
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/75 sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[90vh] sm:w-[92vw] sm:max-w-[1400px] sm:rounded-2xl"
        style={{ animation: 'fadeIn 180ms ease-out' }}
      >
        {/* Sticky header */}
        <div
          className="flex flex-shrink-0 items-start justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #E4E7EC' }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">
              Detailed Analysis
            </p>
            <h4 className="text-base font-bold text-[#1F2230]">{title}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close analysis"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm text-[#667085] transition-colors hover:bg-[#F7F8FA] hover:text-[#1F2230] focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Definition strip */}
        {definition && (
          <div
            className="flex-shrink-0 bg-[#F7F8FA] px-6 py-3"
            style={{ borderBottom: '1px solid #E4E7EC' }}
          >
            <p className="text-[11px] leading-relaxed text-[#667085]">
              <span className="font-semibold uppercase tracking-wider text-[#1F2230]">
                What this measures:{' '}
              </span>
              {definition}
            </p>
          </div>
        )}

        {/* Scrollable body — flex-1 ensures it fills remaining height */}
        <div className="flex-1 overflow-y-auto">
          {/* Executive takeaway — full-width accent block */}
          <div
            className="px-6 py-5 sm:px-8"
            style={{ borderBottom: '1px solid #E4E7EC', borderLeft: '4px solid #E10613' }}
          >
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#667085]">
              Executive Takeaway
            </p>
            <p className="max-w-4xl text-sm font-medium leading-relaxed text-[#1F2230] sm:text-[15px]">
              {insight.snapshot}
            </p>
          </div>

          {/* Section grid */}
          <div className="p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2 items-start">
              {sections.map((sec, idx) => (
                <div
                  key={sec.heading ?? idx}
                  className="self-start rounded-xl bg-[#F7F8FA] p-5"
                  style={{ border: '1px solid #E4E7EC' }}
                >
                  {sec.heading && (
                    <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#1F2230]">
                      <span className="text-[#E10613]" aria-hidden="true">◈</span>
                      {sec.heading}
                    </p>
                  )}
                  <p className="text-[13px] leading-relaxed text-[#667085]">{sec.body}</p>
                </div>
              ))}
            </div>
            <div className="h-6" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
