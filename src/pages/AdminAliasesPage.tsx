import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aliasStore } from '@/utils/aliasStore';
import { SurveyResponse, CountryCode } from '@/types';
import { ALL_BANKS, COUNTRY_CHOICES } from '@/constants';
import { responseService } from '@/services/responseService';

interface SuggestionRow {
  entry: string;
  count: number;
  countries: Record<string, number>;
}

const AdminAliasesPage: React.FC = () => {
  const navigate = useNavigate();
  const [aliasState, setAliasState] = useState(aliasStore.listBanksWithAliases());
  const [newAlias, setNewAlias] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [manualCountry, setManualCountry] = useState<CountryCode>('rwanda');
  const [manualBankId, setManualBankId] = useState<string>('');
  const [manualAliases, setManualAliases] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await responseService.listResponses();
        setResponses(data);
      } catch {
        setError('Failed to load responses from Firestore.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const banksByCountry = useMemo(
    () => ALL_BANKS.filter((bank) => bank.country === manualCountry),
    [manualCountry]
  );

  useEffect(() => {
    if (banksByCountry.length > 0) setManualBankId((prev) => prev || banksByCountry[0].id);
  }, [banksByCountry]);

  const suggestions = useMemo(() => {
    const map = new Map<string, SuggestionRow>();
    responses.forEach((response) => {
      const country = response.selected_country || response.country || 'unknown';
      if (!response.c1_recognized_bank_id && response.c1_top_of_mind) {
        const normalized = response.c1_top_of_mind.trim();
        if (normalized) {
          const row = map.get(normalized) || { entry: normalized, count: 0, countries: {} };
          row.count += 1;
          row.countries[country] = (row.countries[country] || 0) + 1;
          map.set(normalized, row);
        }
      }
      (response.c2_unrecognized_entries || []).forEach((entry) => {
        const normalized = entry.trim();
        if (!normalized) return;
        const row = map.get(normalized) || { entry: normalized, count: 0, countries: {} };
        row.count += 1;
        row.countries[country] = (row.countries[country] || 0) + 1;
        map.set(normalized, row);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [responses]);

  const aliasUsage = useMemo(() => {
    const usage = new Map<string, { mentions: number; countries: Set<string> }>();
    responses.forEach((response) => {
      const entries = [response.c1_top_of_mind, ...(response.c2_unrecognized_entries || [])]
        .filter(Boolean)
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean);
      const country = response.selected_country || response.country || 'unknown';
      entries.forEach((entry) => {
        const row = usage.get(entry) || { mentions: 0, countries: new Set<string>() };
        row.mentions += 1;
        row.countries.add(country);
        usage.set(entry, row);
      });
    });
    return usage;
  }, [responses]);

  const refreshAliases = () => {
    setAliasState(aliasStore.listBanksWithAliases());
  };

  const handleAddAlias = (bankId: string) => {
    const alias = (newAlias[bankId] || '').trim();
    if (!alias) return;
    aliasStore.addAlias(bankId, alias);
    setNewAlias((prev) => ({ ...prev, [bankId]: '' }));
    refreshAliases();
  };

  const handleManualAdd = () => {
    if (!manualBankId || !manualAliases.trim()) return;
    const aliases = manualAliases
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    aliases.forEach((alias) => aliasStore.addAlias(manualBankId, alias));
    setManualAliases('');
    refreshAliases();
  };

  const handleDeactivate = (bankId: string, alias: string) => {
    aliasStore.deactivateAlias(bankId, alias);
    refreshAliases();
  };

  const handleReactivate = (bankId: string, alias: string) => {
    aliasStore.addAlias(bankId, alias);
    refreshAliases();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">Alias Management</h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage canonical bank aliases by country and resolve Recognition Exceptions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin/unrecognized')}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-200 hover:border-emerald-400"
            >
              Open Exceptions
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Manual Alias Creation</h2>
          <p className="mt-2 text-sm text-slate-400">
            Select canonical bank and country, then add one or more aliases.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <select
              value={manualCountry}
              onChange={(event) => setManualCountry(event.target.value as CountryCode)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-3 text-xs text-slate-200"
            >
              {COUNTRY_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>{choice.label.en}</option>
              ))}
            </select>
            <select
              value={manualBankId}
              onChange={(event) => setManualBankId(event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-3 text-xs text-slate-200"
            >
              {banksByCountry.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} ({bank.id})
                </option>
              ))}
            </select>
            <input
              value={manualAliases}
              onChange={(event) => setManualAliases(event.target.value)}
              placeholder="Alias names, comma-separated"
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-3 text-xs text-slate-200 md:col-span-2"
            />
          </div>
          <div className="mt-3">
            <button
              onClick={handleManualAdd}
              disabled={!manualBankId || !manualAliases.trim()}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
            >
              Add Alias
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Suggestions from Recognition Exceptions</h2>
          <p className="mt-2 text-sm text-slate-400">
            Map frequently unrecognized entries to canonical banks.
          </p>
          {loading && <p className="mt-4 text-sm text-slate-500">Loading responses...</p>}
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {!loading && suggestions.map((item) => (
              <div key={item.entry} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{item.entry}</span>
                  <span className="text-xs text-slate-500">{item.count} mentions</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  {Object.entries(item.countries).map(([country, count]) => (
                    <span key={country} className="rounded-full border border-white/10 px-2 py-1">
                      {country}: {count}
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      const bankId = event.target.value;
                      if (!bankId) return;
                      aliasStore.addAlias(bankId, item.entry);
                      refreshAliases();
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="">Assign to canonical bank</option>
                    {ALL_BANKS.map((bank) => (
                      <option key={bank.id} value={bank.id}>{bank.name} ({bank.country})</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {!loading && suggestions.length === 0 && (
              <p className="text-sm text-slate-500">No suggestions yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Alias List + Usage Statistics</h2>
          <div className="mt-4 space-y-4">
            {aliasState.map(({ bank, aliases, inactive }) => (
              <div key={bank.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{bank.name}</p>
                    <p className="text-xs text-slate-500">{bank.id} · {bank.country}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={newAlias[bank.id] || ''}
                      onChange={(event) => setNewAlias((prev) => ({ ...prev, [bank.id]: event.target.value }))}
                      placeholder="Add alias"
                      className="h-10 rounded-2xl border border-white/10 bg-slate-950/60 px-3 text-xs text-slate-200"
                    />
                    <button
                      onClick={() => handleAddAlias(bank.id)}
                      disabled={!(newAlias[bank.id] || '').trim()}
                      className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      Add Alias
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {aliases.map((alias) => {
                    const usage = aliasUsage.get(alias.toLowerCase());
                    return (
                      <button
                        key={alias}
                        onClick={() => handleDeactivate(bank.id, alias)}
                        className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200"
                      >
                        {alias}
                        {usage ? (
                          <span className="ml-2 text-[10px] text-emerald-100/70">
                            {usage.mentions} mentions · {Array.from(usage.countries).join(', ')}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                  {aliases.length === 0 && (
                    <span className="text-xs text-slate-500">No active aliases</span>
                  )}
                </div>
                {inactive.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="self-center">Inactive:</span>
                    {inactive.map((alias) => (
                      <button
                        key={alias}
                        onClick={() => handleReactivate(bank.id, alias)}
                        className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                      >
                        {alias} (reactivate)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminAliasesPage;

