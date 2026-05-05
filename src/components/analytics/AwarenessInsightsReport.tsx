import React, { useCallback, useState } from 'react';
import { useAuth } from '@/auth/context';
import {
  generateAwarenessReport,
  type AwarenessReportError,
  type AwarenessReportPayload,
} from '@/services/aiStrategyAdvisorService';

type ReportState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'generated'; response: string; generatedAt: string; fromCache: boolean; contextHash: string }
  | { status: 'error'; code: AwarenessReportError };

function stableSortedJson(val: unknown): string {
  if (val === null || typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) return '[' + val.map(stableSortedJson).join(',') + ']';
  const keys = Object.keys(val as Record<string, unknown>).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableSortedJson((val as Record<string, unknown>)[k])).join(',') + '}';
}

function computeContextHash(payload: AwarenessReportPayload): string {
  const fields = {
    country: payload.country,
    bankId: payload.bankId,
    compareBankId: payload.compareBankId ?? null,
    period: payload.period,
    filters: payload.filters,
    methodologyVersion: payload.methodologyVersion,
  };
  const stable = stableSortedJson(fields);
  let h = 5381;
  for (let i = 0; i < stable.length; i++) { h = (h * 33) ^ stable.charCodeAt(i); }
  return Math.abs(h >>> 0).toString(36);
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let currentList: string[] = [];
  let idx = 0;

  const flushList = () => {
    if (currentList.length === 0) return;
    nodes.push(
      <ul key={`ul-${idx++}`} className="mt-1 list-disc space-y-1 pl-4">
        {currentList.map((item, i) => <li key={i} className="text-xs text-slate-400">{item}</li>)}
      </ul>,
    );
    currentList = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }
    if (trimmed.startsWith('## ')) {
      flushList();
      nodes.push(<h3 key={`h3-${idx++}`} className="mt-4 text-sm font-semibold text-slate-200 first:mt-0">{trimmed.slice(3)}</h3>);
    } else if (trimmed.startsWith('- ')) {
      currentList.push(trimmed.slice(2));
    } else {
      flushList();
      nodes.push(<p key={`p-${idx++}`} className="mt-1 text-xs text-slate-400">{trimmed}</p>);
    }
  }
  flushList();
  return nodes;
}

interface AwarenessInsightsReportProps {
  awarenessPayload: AwarenessReportPayload;
}

export function AwarenessInsightsReport({ awarenessPayload }: AwarenessInsightsReportProps) {
  const { state: authState } = useAuth();
  const userId = (authState as { user?: { uid?: string } }).user?.uid ?? '';
  const [reportState, setReportState] = useState<ReportState>({ status: 'idle' });
  const [isExpanded, setIsExpanded] = useState(false);

  const currentHash = computeContextHash(awarenessPayload);
  const isStale = reportState.status === 'generated' && reportState.contextHash !== currentHash;
  const isLoading = reportState.status === 'loading';

  const payloadRef = React.useRef(awarenessPayload);
  payloadRef.current = awarenessPayload;

  const generate = useCallback(async () => {
    const payload = payloadRef.current;
    const hash = computeContextHash(payload);
    setReportState({ status: 'loading' });
    setIsExpanded(true);
    try {
      const result = await generateAwarenessReport(payload, userId);
      setReportState({
        status: 'generated',
        response: result.response,
        generatedAt: result.generatedAt,
        fromCache: result.fromCache,
        contextHash: hash,
      });
    } catch (err: unknown) {
      const code = ((err as { code?: string }).code ?? 'generation-failed') as AwarenessReportError;
      setReportState({ status: 'error', code });
    }
  }, [userId, currentHash]);

  const buttonLabel = isLoading
    ? 'Generating…'
    : reportState.status === 'idle' || reportState.status === 'error'
      ? 'Generate Insights'
      : 'Refresh Insights';

  return (
    <div className="mt-6 dashboard-section">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">
          Awareness Insights Report
        </h3>
        <button
          type="button"
          disabled={isLoading || !userId}
          onClick={generate}
          className="rounded px-3 py-1 text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      </div>

      {isExpanded && reportState.status !== 'idle' && (
        <div className="mt-4">
          {isStale && (
            <div className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              Context changed — refresh for updated analysis.
            </div>
          )}

          {reportState.status === 'loading' && (
            <div
              className="flex items-center gap-2 text-xs text-slate-400"
              aria-live="polite"
              data-testid="awareness-spinner"
            >
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              Generating analysis…
            </div>
          )}

          {reportState.status === 'generated' && (
            <>
              <div className="mb-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
                <span>Generated: {new Date(reportState.generatedAt).toLocaleString()}</span>
                <span>·</span>
                <span>{awarenessPayload.country}</span>
                <span>·</span>
                <span>{awarenessPayload.bankName}</span>
                {awarenessPayload.compareBankName && (
                  <><span>·</span><span>vs {awarenessPayload.compareBankName}</span></>
                )}
                <span>·</span>
                <span>{awarenessPayload.period}</span>
                {reportState.fromCache && <span>(cached)</span>}
              </div>
              <p className="mb-3 text-[10px] text-slate-600">
                Based on survey response data. Treat as directional for small samples.
              </p>
              <div>{parseMarkdown(reportState.response)}</div>
            </>
          )}

          {reportState.status === 'error' && (
            <div className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              {reportState.code === 'rate-limited'
                ? 'Monthly insight limit reached. Please try again after your allowance resets.'
                : reportState.code === 'insufficient-data'
                  ? 'Not enough data to generate a report for this filter combination.'
                  : 'Report generation failed.'}
              {reportState.code === 'generation-failed' && (
                <button type="button" onClick={generate} className="ml-2 underline hover:no-underline">
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
