import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BANKS, COUNTRY_CHOICES } from '@/constants';
import { CountryCode, SurveyResponse } from '@/types';
import { exportReportToPDF, exportToCSV, exportToExcel } from '@/utils/export';
import { responseService } from '@/services/responseService';

type Period = '30' | '90' | '365' | 'all';
type ResponseStatus = 'all' | 'completed' | 'terminated';

interface ReportTemplate {
  id: string;
  name: string;
  country: CountryCode;
  period: Period;
  status: ResponseStatus;
  selectedBankId: string;
  compareBankId: string;
  comparisonEnabled: boolean;
}

const TEMPLATE_KEY = 'bank_insights_admin_report_templates';

const readTemplates = (): ReportTemplate[] => {
  const raw = localStorage.getItem(TEMPLATE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const writeTemplates = (templates: ReportTemplate[]) => {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
};

const convertResponseForExport = (response: SurveyResponse): Record<string, string | number | boolean | string[]> => {
  const result: Record<string, string | number | boolean | string[]> = {};
  
  // Convert all properties, handling nested objects
  Object.entries(response).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      result[key] = '';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Handle nested objects by converting to JSON string
      result[key] = JSON.stringify(value);
    } else {
      result[key] = value;
    }
  });
  
  return result;
};

const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<CountryCode>('rwanda');
  const [period, setPeriod] = useState<Period>('90');
  const [status, setStatus] = useState<ResponseStatus>('all');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [compareBankId, setCompareBankId] = useState('');
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<ReportTemplate[]>(readTemplates());
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editTopOfMind, setEditTopOfMind] = useState('');
  const [editSpontaneous, setEditSpontaneous] = useState('');

  const countryBanks = useMemo(() => BANKS.filter((bank) => bank.country === country), [country]);

  useEffect(() => {
    if (countryBanks.length > 0) {
      setSelectedBankId(countryBanks[0].id);
      setCompareBankId(countryBanks[1]?.id || '');
    }
  }, [countryBanks]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await responseService.listResponses();
        setResponses(data);
      } catch (e) {
        setError('Failed to load report data from Firestore.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const matchesBank = (response: SurveyResponse, bankId: string) =>
    response.c3_aware_banks?.includes(bankId) ||
    response.c4_ever_used?.includes(bankId) ||
    response.c5_currently_using?.includes(bankId) ||
    response.preferred_bank === bankId ||
    response.committed_bank === bankId ||
    response.c9_would_consider?.includes(bankId) ||
    response.c9_favourites?.includes(bankId) ||
    response.c9_only_consider === bankId ||
    response.c9_never_consider?.includes(bankId);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    if (period !== 'all') cutoff.setDate(cutoff.getDate() - Number(period));

    const bankScope = comparisonEnabled && compareBankId ? [selectedBankId, compareBankId] : [selectedBankId];

    return responses.filter((response) => {
      if (response.selected_country !== country) return false;
      if (status !== 'all' && response._status !== status) return false;
      if (period !== 'all') {
        const date = new Date(response.timestamp || 0);
        if (date < cutoff) return false;
      }
      if (selectedBankId) {
        return bankScope.some((bankId) => matchesBank(response, bankId));
      }
      return true;
    });
  }, [responses, country, period, status, selectedBankId, compareBankId, comparisonEnabled]);

  const summarySections = useMemo(() => {
    const completed = filtered.filter((r) => r._status === 'completed').length;
    const terminated = filtered.filter((r) => r._status === 'terminated').length;
    const withTopOfMind = filtered.filter((r) => !!r.c1_top_of_mind).length;
    return [
      { label: 'Country', value: country },
      { label: 'Time Period', value: period === 'all' ? 'All time' : `Last ${period} days` },
      { label: 'Total responses', value: filtered.length },
      { label: 'Completed', value: completed },
      { label: 'Terminated', value: terminated },
      { label: 'Top-of-mind captured', value: withTopOfMind },
      { label: 'Primary bank filter', value: selectedBankId || 'Not set' },
      { label: 'Comparison bank', value: comparisonEnabled ? compareBankId || 'Not set' : 'Disabled' },
    ];
  }, [filtered, country, period, selectedBankId, compareBankId, comparisonEnabled]);

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const next: ReportTemplate[] = [
      {
        id: `tpl_${Date.now()}`,
        name: templateName.trim(),
        country,
        period,
        status,
        selectedBankId,
        compareBankId,
        comparisonEnabled,
      },
      ...templates,
    ];
    setTemplates(next);
    writeTemplates(next);
    setTemplateName('');
  };

  const applyTemplate = (template: ReportTemplate) => {
    setCountry(template.country);
    setPeriod(template.period);
    setStatus(template.status);
    setSelectedBankId(template.selectedBankId);
    setCompareBankId(template.compareBankId);
    setComparisonEnabled(template.comparisonEnabled);
  };

  const removeTemplate = (id: string) => {
    const next = templates.filter((tpl) => tpl.id !== id);
    setTemplates(next);
    writeTemplates(next);
  };

  const startEdit = (response: SurveyResponse) => {
    setEditingDocId(response._docId || null);
    setEditTopOfMind(response.c1_top_of_mind || '');
    setEditSpontaneous(response.c2_spontaneous || '');
  };

  const saveEdit = async () => {
    if (!editingDocId) return;
    await responseService.updateResponse(editingDocId, {
      c1_top_of_mind: editTopOfMind,
      c2_spontaneous: editSpontaneous,
    });
    const next = await responseService.listResponses();
    setResponses(next);
    setEditingDocId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">Admin Reports</h1>
            <p className="mt-2 text-sm text-slate-400">
              Country analytics, client-support exports, and raw data access for custom analysis.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
          >
            Back to Admin
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value as CountryCode)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
            >
              {COUNTRY_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>{choice.label.en}</option>
              ))}
            </select>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
            >
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 12 months</option>
              <option value="all">All time</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ResponseStatus)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
            >
              <option value="all">All statuses</option>
              <option value="completed">Completed</option>
              <option value="terminated">Terminated</option>
            </select>
            <select
              value={selectedBankId}
              onChange={(event) => setSelectedBankId(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
            >
              <option value="">All banks</option>
              {countryBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
            <select
              value={compareBankId}
              onChange={(event) => setCompareBankId(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
            >
              <option value="">No comparison</option>
              {countryBanks
                .filter((bank) => bank.id !== selectedBankId)
                .map((bank) => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
            </select>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={comparisonEnabled}
                onChange={(event) => setComparisonEnabled(event.target.checked)}
              />
              Compare banks
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => exportToCSV(filtered.map(r => convertResponseForExport(r)), `admin_report_${country}`)}
                className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white"
              >
                CSV
              </button>
              <button
                onClick={() => exportToExcel(filtered.map(r => convertResponseForExport(r)), `admin_report_${country}`)}
                className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200"
              >
                Excel
              </button>
              <button
                onClick={() => exportReportToPDF(`Admin Report - ${country}`, summarySections)}
                className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200"
              >
                PDF
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Template name"
              className="h-10 rounded-2xl border border-white/10 bg-slate-950/60 px-3 text-xs text-slate-200"
            />
            <button
              onClick={saveTemplate}
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200"
            >
              Save Template
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {templates.map((template) => (
              <div key={template.id} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs">
                <button onClick={() => applyTemplate(template)} className="text-slate-200">
                  {template.name}
                </button>
                <button onClick={() => removeTemplate(template.id)} className="text-rose-300">x</button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Summary</h2>
          {loading && <p className="mt-3 text-sm text-slate-500">Loading report data...</p>}
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
          {!loading && !error && (
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {summarySections.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-widest text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm text-white">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Raw Data Access</h2>
            <button
              onClick={() => exportToCSV(filtered.map(r => convertResponseForExport(r)), `admin_raw_data_${country}`)}
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200"
            >
              Export Raw CSV
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Review and align text entries for custom analysis support.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-widest text-slate-500">
                  <th className="py-2">Response ID</th>
                  <th className="py-2">Country</th>
                  <th className="py-2">Top of mind</th>
                  <th className="py-2">Spontaneous</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 80).map((row) => (
                  <tr key={row._docId || row.response_id} className="border-t border-white/5">
                    <td className="py-2 text-slate-300">{row.response_id}</td>
                    <td className="py-2 text-slate-400">{row.selected_country}</td>
                    <td className="py-2 text-slate-300">{row.c1_top_of_mind || '—'}</td>
                    <td className="py-2 text-slate-300">{row.c2_spontaneous || '—'}</td>
                    <td className="py-2 text-slate-400">{row._status || '—'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => startEdit(row)}
                        disabled={!row._docId}
                        className="rounded-xl border border-white/10 px-2 py-1 text-xs text-slate-300 disabled:opacity-40"
                      >
                        Edit text
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 80 && (
            <p className="mt-3 text-xs text-slate-500">Showing first 80 rows. Export raw CSV for full dataset.</p>
          )}
        </section>
      </main>

      {editingDocId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 space-y-4">
            <h3 className="text-lg font-bold">Edit Text Entries</h3>
            <input
              value={editTopOfMind}
              onChange={(event) => setEditTopOfMind(event.target.value)}
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950 px-3 text-sm text-white"
              placeholder="Top-of-mind text"
            />
            <textarea
              value={editSpontaneous}
              onChange={(event) => setEditSpontaneous(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="Spontaneous text"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingDocId(null)}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
