import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountryCode } from '@/types';
import { COUNTRY_CHOICES } from '@/constants';
import { exportToCSV } from '@/utils/export';
import { panelService, PanelistRecord } from '@/services/panelService';

type ActivityFilter = 'all' | 'eligible' | 'cooldown';
type StatusFilter = 'all' | 'active' | 'inactive' | 'removed';

const AdminPanelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [countryFilter, setCountryFilter] = useState<CountryCode | 'all'>('all');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelistsRaw, setPanelistsRaw] = useState<PanelistRecord[]>([]);

  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCountry, setManualCountry] = useState<CountryCode>('rwanda');
  const [bulkInput, setBulkInput] = useState('');
  const [recruitCountry, setRecruitCountry] = useState<CountryCode>('rwanda');
  const [recruitLink, setRecruitLink] = useState('');

  const loadPanelists = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await panelService.listPanelists();
      setPanelistsRaw(data);
    } catch (e) {
      setError('Failed to load panelists from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPanelists();
  }, []);

  const panelists = useMemo(() => {
    const now = Date.now();
    return panelistsRaw
      .map((p) => {
        const nextTs = p.nextEligibleAt ? new Date(p.nextEligibleAt).getTime() : 0;
        const isEligible = p.status === 'active' && (p.participationCount === 0 || nextTs <= now);
        return { ...p, isEligible };
      })
      .filter((p) => (countryFilter === 'all' ? true : p.country === countryFilter))
      .filter((p) => (statusFilter === 'all' ? true : p.status === statusFilter))
      .filter((p) => {
        if (activityFilter === 'all') return true;
        if (activityFilter === 'eligible') return p.isEligible;
        return !p.isEligible;
      })
      .sort((a, b) => {
        const aTs = a.lastParticipationAt ? new Date(a.lastParticipationAt).getTime() : 0;
        const bTs = b.lastParticipationAt ? new Date(b.lastParticipationAt).getTime() : 0;
        return bTs - aTs;
      });
  }, [panelistsRaw, countryFilter, activityFilter, statusFilter]);

  const handleDeactivate = async (panelistId: string) => {
    await panelService.updateStatus(panelistId, 'inactive');
    await loadPanelists();
  };

  const handleActivate = async (panelistId: string) => {
    await panelService.updateStatus(panelistId, 'active');
    await loadPanelists();
  };

  const handleRemove = async (panelistId: string) => {
    await panelService.removePanelist(panelistId);
    await loadPanelists();
  };

  const createManual = async () => {
    if (!manualName.trim()) return;
    await panelService.createManualPanelist({
      country: manualCountry,
      contactName: manualName.trim(),
      contactEmail: manualEmail.trim() || undefined,
      contactPhone: manualPhone.trim() || undefined,
      source: 'manual',
    });
    setManualName('');
    setManualEmail('');
    setManualPhone('');
    await loadPanelists();
  };

  const createRecruitLink = () => {
    setRecruitLink(panelService.buildRecruitmentLink(recruitCountry));
  };

  const importBulk = async () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      const [name, email, phone, country] = line.split(',').map((s) => s?.trim());
      if (!name) continue;
      const parsedCountry = (country || 'rwanda') as CountryCode;
      if (!['rwanda', 'uganda', 'burundi'].includes(parsedCountry)) continue;
      await panelService.createManualPanelist({
        country: parsedCountry,
        contactName: name,
        contactEmail: email || undefined,
        contactPhone: phone || undefined,
        source: 'manual',
      });
    }
    setBulkInput('');
    await loadPanelists();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">Respondent Panels</h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage longitudinal panelists from survey opt-ins, recruitment links, and manual uploads.
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

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Panel Entry Sources</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
              <p className="text-sm font-semibold">Manual add (single)</p>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Contact name"
                className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm"
              />
              <input
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="Email (optional)"
                className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm"
              />
              <input
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm"
              />
              <select
                value={manualCountry}
                onChange={(e) => setManualCountry(e.target.value as CountryCode)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm"
              >
                {COUNTRY_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label.en}
                  </option>
                ))}
              </select>
              <button
                onClick={createManual}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest"
              >
                Add Panelist
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
              <p className="text-sm font-semibold">External recruitment</p>
              <select
                value={recruitCountry}
                onChange={(e) => setRecruitCountry(e.target.value as CountryCode)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm"
              >
                {COUNTRY_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label.en}
                  </option>
                ))}
              </select>
              <button
                onClick={createRecruitLink}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest"
              >
                Generate Recruitment Link
              </button>
              {recruitLink && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs break-all">
                  {recruitLink}
                </div>
              )}
              <p className="text-xs text-slate-400">Subscribers joining via this link are marked with source `external`.</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
            <p className="text-sm font-semibold">Manual upload (optional)</p>
            <p className="text-xs text-slate-400">Format per line: `Name, Email, Phone, Country`</p>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm"
              placeholder="Jane Doe, jane@email.com, +250..., rwanda"
            />
            <button
              onClick={importBulk}
              className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest"
            >
              Import Lines
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Panel Dashboard</h2>
              <p className="text-sm text-slate-400">Track participation history and respondent eligibility.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={countryFilter}
                onChange={(event) => setCountryFilter(event.target.value as CountryCode | 'all')}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
              >
                <option value="all">All countries</option>
                {COUNTRY_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label.en}
                  </option>
                ))}
              </select>
              <select
                value={activityFilter}
                onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
              >
                <option value="all">All activity</option>
                <option value="eligible">Eligible now</option>
                <option value="cooldown">In cooldown</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="removed">Removed</option>
              </select>
              <button
                onClick={() => exportToCSV(panelists)}
                className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading && <p className="text-sm text-slate-500">Loading panelists...</p>}
            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
            {!loading &&
              panelists.map((panelist) => (
                <div key={panelist.panelistId} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Panelist ID: {panelist.panelistId}</p>
                      <p className="text-sm text-slate-200">
                        {panelist.contactName || 'No contact name'}
                        {' · '}
                        {panelist.contactEmail || 'No email'}
                        {' · '}
                        {panelist.contactPhone || 'No phone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full border border-white/10 px-2 py-1">{panelist.country}</span>
                      <span className="rounded-full border border-white/10 px-2 py-1">{panelist.source}</span>
                      <span className="rounded-full border border-white/10 px-2 py-1">{panelist.status}</span>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-slate-400 md:grid-cols-4">
                    <span>Last: {panelist.lastParticipationAt ? new Date(panelist.lastParticipationAt).toLocaleDateString() : '—'}</span>
                    <span>Next eligible: {panelist.nextEligibleAt ? new Date(panelist.nextEligibleAt).toLocaleDateString() : '—'}</span>
                    <span>Participations: {panelist.participationCount}</span>
                    <span>Eligibility: {panelist.isEligible ? 'Eligible' : 'Cooldown'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {panelist.status !== 'inactive' && (
                      <button
                        onClick={() => handleDeactivate(panelist.panelistId)}
                        className="rounded-xl border border-amber-500/40 px-3 py-1 text-xs text-amber-200"
                      >
                        Deactivate
                      </button>
                    )}
                    {panelist.status === 'inactive' && (
                      <button
                        onClick={() => handleActivate(panelist.panelistId)}
                        className="rounded-xl border border-emerald-500/40 px-3 py-1 text-xs text-emerald-200"
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(panelist.panelistId)}
                      className="rounded-xl border border-rose-500/40 px-3 py-1 text-xs text-rose-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            {!loading && panelists.length === 0 && <p className="text-sm text-slate-500">No panelists found.</p>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminPanelsPage;
