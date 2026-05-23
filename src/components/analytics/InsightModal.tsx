import React, { useEffect } from 'react';
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
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
            <h4 className="text-sm font-bold text-[#1F2230]">{title}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close analysis"
            className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-[#667085] transition-colors hover:bg-[#F7F8FA] hover:text-[#1F2230] focus:outline-none"
          >
            ✕
          </button>
        </div>

        {/* Definition strip */}
        {definition && (
          <div
            className="flex-shrink-0 bg-[#F7F8FA] px-6 py-2.5"
            style={{ borderBottom: '1px solid #E4E7EC' }}
          >
            <p className="text-[11px] text-[#667085]">
              <span className="font-semibold uppercase tracking-wider text-[#1F2230]">
                What this measures:{' '}
              </span>
              {definition}
            </p>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Executive takeaway */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #E4E7EC' }}>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#667085]">
              Executive Takeaway
            </p>
            <p className="text-sm font-medium leading-relaxed text-[#1F2230]">{insight.snapshot}</p>
          </div>

          {/* Section grid */}
          <div className="p-6">
            <div className="grid items-start gap-3 sm:grid-cols-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.heading ?? idx}
                  className="self-start rounded-lg bg-[#F7F8FA] p-4"
                  style={{ border: '1px solid #E4E7EC' }}
                >
                  {sec.heading && (
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#1F2230]">
                      {sec.heading}
                    </p>
                  )}
                  <p className="max-w-prose text-xs leading-relaxed text-[#667085]">{sec.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
