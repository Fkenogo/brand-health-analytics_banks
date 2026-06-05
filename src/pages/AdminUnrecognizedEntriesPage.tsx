import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurveyResponse } from '@/types';
import { aliasStore } from '@/utils/aliasStore';
import { ALL_BANKS } from '@/constants';
import { responseService } from '@/services/responseService';
import { collectRecognitionReviewRows, type RecognitionReviewRow } from '@/utils/recognitionMonitoring';

const STATUS_KEY = 'bank_insights_unrecognized_status';
type EntryStatus = 'new' | 'resolved' | 'ignored' | 'flagged';

const loadStatus = (): Record<string, EntryStatus> => {
  const raw = localStorage.getItem(STATUS_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveStatus = (data: Record<string, EntryStatus>) => {
  localStorage.setItem(STATUS_KEY, JSON.stringify(data));
};

const AdminUnrecognizedEntriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusMap, setStatusMap] = useState<Record<string, EntryStatus>>(loadStatus());
  const [showSample, setShowSample] = useState(false);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await responseService.listResponses();
        setResponses(data);
      } catch (err) {
        setError('Failed to load responses from Firestore.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const aggregates = useMemo(() => collectRecognitionReviewRows(responses), [responses]);

  const updateStatus = (entry: string, status: EntryStatus) => {
    const next = { ...statusMap, [entry]: status };
    setStatusMap(next);
    saveStatus(next);
  };

  const classifyEntry = (entry: string) => {
    const trimmed = entry.trim();
    if (trimmed.length <= 2) return 'malformed';
    if (/[^a-zA-Z\s&'.-]/.test(trimmed)) return 'suspicious';
    return 'unrecognized';
  };

  const sampleEntries: RecognitionReviewRow[] = [
    {
      key: 'unrecognized::top_of_mind::k c b bank::',
      entry: 'K C B Bank',
      count: 3,
      countries: { rwanda: 2, uganda: 1 },
      sources: { top_of_mind: 2, spontaneous: 1 },
      issueType: 'unrecognized',
    },
    {
      key: 'low_confidence::top_of_mind::stanchrt::STAN_UG',
      issueType: 'low_confidence',
      entry: 'Stanchrt',
      count: 1,
      countries: { uganda: 1 },
      sources: { top_of_mind: 1 },
      matchedBankId: 'STAN_UG',
      matchedBankName: 'StanChart',
      averageConfidence: 0.82,
      minConfidence: 0.82,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">Recognition Exceptions</h1>
            <p className="mt-2 text-sm text-slate-400">
              System-generated review queue for unmatched awareness entries and low-confidence top-of-mind matches.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Entries to review</h2>
            <div className="flex items-center gap-3">
              {aggregates.length === 0 && (
                <button
                  onClick={() => setShowSample((prev) => !prev)}
                  className="rounded-2xl border border-white/10 px-3 py-1 text-[10px] uppercase tracking-widest text-slate-300"
                >
                  {showSample ? 'Hide sample' : 'Show sample'}
                </button>
              )}
              <span className="text-xs text-slate-500">Total: {aggregates.length}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading && (
              <p className="text-sm text-slate-500">Loading entries...</p>
            )}
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
            {(aggregates.length > 0 ? aggregates : showSample ? sampleEntries : []).map(entry => (
              <div key={entry.key} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{entry.entry}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{entry.count} mentions</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                      {statusMap[entry.entry] || 'new'}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-400">
                      {entry.issueType === 'low_confidence' ? 'low confidence' : classifyEntry(entry.entry)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  {Object.entries(entry.countries).map(([country, count]) => (
                    <span key={country} className="rounded-full border border-white/10 px-2 py-1">
                      {country}: {count}
                    </span>
                  ))}
                  {Object.entries(entry.sources).map(([source, count]) => (
                    <span key={source} className="rounded-full border border-white/10 px-2 py-1">
                      {source.replace('_', ' ')}: {count}
                    </span>
                  ))}
                  {entry.matchedBankName && (
                    <span className="rounded-full border border-amber-500/20 px-2 py-1 text-amber-200">
                      matched: {entry.matchedBankName}
                    </span>
                  )}
                  {entry.averageConfidence !== undefined && (
                    <span className="rounded-full border border-amber-500/20 px-2 py-1 text-amber-200">
                      avg confidence: {Math.round(entry.averageConfidence * 100)}%
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      const bankId = event.target.value;
                      if (!bankId) return;
                      aliasStore.addAlias(bankId, entry.entry);
                      updateStatus(entry.entry, 'resolved');
                    }}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="">Approve & map to bank</option>
                    {ALL_BANKS.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateStatus(entry.entry, 'resolved')}
                    className="rounded-2xl border border-emerald-500/40 px-3 py-2 text-xs text-emerald-200"
                  >
                    Approve as valid
                  </button>
                  <button
                    onClick={() => updateStatus(entry.entry, 'ignored')}
                    className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                  >
                    Mark ignored
                  </button>
                  <button
                    onClick={() => updateStatus(entry.entry, 'flagged')}
                    className="rounded-2xl border border-amber-500/40 px-3 py-2 text-xs text-amber-200"
                  >
                    Flag for review
                  </button>
                  <button
                    onClick={() => updateStatus(entry.entry, 'new')}
                    className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ))}

            {!loading && aggregates.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-400">
                No unrecognized entries yet. As new survey responses arrive, this list will populate with system‑generated exceptions.
                Use “Show sample” to preview available actions.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUnrecognizedEntriesPage;
