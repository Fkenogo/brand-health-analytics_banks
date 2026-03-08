import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COUNTRY_CHOICES } from '@/constants';
import { CountryCode, SurveyResponse } from '@/types';
import { raffleEntryService, RaffleEntryRecord } from '@/services/raffleEntryService';
import {
  raffleCampaignService,
  RaffleCampaign,
  CampaignWinner,
  EntrySource,
  ContactRequirement,
  CampaignStatus,
} from '@/services/raffleCampaignService';
import { responseService } from '@/services/responseService';
import { auditService } from '@/services/auditService';
import { exportToCSV } from '@/utils/export';
import { useAuth } from '@/auth/context';

const pickRandom = <T,>(items: T[], count: number): T[] => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, count);
};

const AdminRafflesPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const actorEmail = state.user?.email;

  const [campaigns, setCampaigns] = useState<RaffleCampaign[]>([]);
  const [entries, setEntries] = useState<RaffleEntryRecord[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [auditEvents, setAuditEvents] = useState<Array<{ id?: string; action: string; timestamp: string; details?: Record<string, unknown> }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [country, setCountry] = useState<CountryCode>('rwanda');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxWinners, setMaxWinners] = useState(3);
  const [source, setSource] = useState<EntrySource>('all');
  const [contactRequired, setContactRequired] = useState<ContactRequirement>('any');
  const [completedOnly, setCompletedOnly] = useState(true);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('active');
  const [manualCampaignId, setManualCampaignId] = useState('');
  const [manualEntryId, setManualEntryId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignRows, entryRows, responseRows, auditRows] = await Promise.all([
        raffleCampaignService.list(),
        raffleEntryService.listEntries(),
        responseService.listResponses(),
        auditService.list(),
      ]);
      setCampaigns(campaignRows.filter((c) => c.status !== 'archived'));
      setEntries(entryRows);
      setResponses(responseRows);
      setAuditEvents(auditRows.filter((e) => e.action.startsWith('raffle_')));
    } catch (e) {
      setError('Failed to load raffle module data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!name.trim() || !startDate || !endDate) {
      setError('Campaign name, start date, and end date are required.');
      return;
    }
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      setError('Start date cannot be after end date.');
      return;
    }
    if (maxWinners < 1) {
      setError('Maximum winners must be at least 1.');
      return;
    }
    try {
      await raffleCampaignService.create({
        name: name.trim(),
        country,
        startDate,
        endDate,
        maxWinners,
        status: campaignStatus,
        eligibility: {
          completedOnly,
          source,
          contactRequired,
        },
      });
      await auditService.log({
        action: 'raffle_campaign_created',
        actorEmail,
        details: {
          name: name.trim(),
          country,
          startDate,
          endDate,
          maxWinners,
          source,
          contactRequired,
          completedOnly,
          status: campaignStatus,
        },
      });
      setName('');
      setStartDate('');
      setEndDate('');
      setMaxWinners(3);
      setSource('all');
      setContactRequired('any');
      setCompletedOnly(true);
      setCampaignStatus('active');
      setSuccess('Campaign created.');
      await loadAll();
    } catch (e) {
      setError('Failed to create raffle campaign.');
    }
  };

  const getEligiblePool = (campaign: RaffleCampaign) => {
    const from = new Date(campaign.startDate).getTime();
    const to = new Date(campaign.endDate).getTime() + (24 * 60 * 60 * 1000 - 1);
    const completedResponseIds = new Set(
      responses
        .filter((r) => r._status === 'completed')
        .map((r) => r.response_id)
    );

    const existingWinnerEntryIds = new Set((campaign.winners || []).map((winner) => winner.entryId));
    const existingWinnerResponseIds = new Set((campaign.winners || []).map((winner) => winner.responseId).filter(Boolean));

    return entries.filter((entry) => {
      if (entry.country !== campaign.country) return false;
      const createdTs = entry.createdAt ? new Date(entry.createdAt).getTime() : 0;
      if (createdTs < from || createdTs > to) return false;
      if (campaign.eligibility.source !== 'all' && entry.source !== campaign.eligibility.source) return false;
      if (campaign.eligibility.contactRequired === 'email' && !entry.contactEmail) return false;
      if (campaign.eligibility.contactRequired === 'phone' && !entry.contactPhone) return false;
      if (campaign.eligibility.completedOnly && entry.responseId && !completedResponseIds.has(entry.responseId)) return false;
      if (existingWinnerEntryIds.has(entry.id || '')) return false;
      if (entry.responseId && existingWinnerResponseIds.has(entry.responseId)) return false;
      return true;
    });
  };

  const drawWinners = async (campaign: RaffleCampaign) => {
    if (!campaign.id) return;
    if (campaign.status !== 'active') {
      setError('Only active campaigns can draw winners.');
      return;
    }
    const pool = getEligiblePool(campaign);
    const remainingSlots = Math.max(0, campaign.maxWinners - (campaign.winners?.length || 0));
    if (remainingSlots <= 0 || pool.length === 0) {
      setError('No eligible entrants available or winner slots already filled.');
      return;
    }
    const selected = pickRandom(pool, remainingSlots);
    const newWinners: CampaignWinner[] = selected.map((entry) => ({
      id: `winner_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entryId: entry.id || '',
      responseId: entry.responseId,
      deviceId: entry.deviceId,
      contactName: entry.contactName,
      contactEmail: entry.contactEmail,
      contactPhone: entry.contactPhone,
      selectedAt: new Date().toISOString(),
      method: 'random',
    }));
    const merged = [...(campaign.winners || []), ...newWinners];
    try {
      await raffleCampaignService.updateWinners(campaign.id, merged);
      await auditService.log({
        action: 'raffle_winners_drawn',
        actorEmail,
        targetId: campaign.id,
        details: {
          campaignName: campaign.name,
          addedWinnerCount: newWinners.length,
          totalWinners: merged.length,
        },
      });
      setSuccess(`Added ${newWinners.length} winner(s) to ${campaign.name}.`);
      await loadAll();
    } catch (e) {
      setError('Failed to draw raffle winners.');
    }
  };

  const manualAddWinner = async () => {
    const campaign = campaigns.find((item) => item.id === manualCampaignId);
    const entry = entries.find((item) => item.id === manualEntryId);
    if (!campaign || !campaign.id || !entry || !entry.id) return;
    if (campaign.status !== 'active') {
      setError('Manual overrides are allowed only for active campaigns.');
      return;
    }
    const winnerIds = new Set((campaign.winners || []).map((winner) => winner.entryId));
    const winnerResponseIds = new Set((campaign.winners || []).map((winner) => winner.responseId).filter(Boolean));
    if (winnerIds.has(entry.id) || (entry.responseId && winnerResponseIds.has(entry.responseId))) return;

    const newWinner: CampaignWinner = {
      id: `winner_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      entryId: entry.id,
      responseId: entry.responseId,
      deviceId: entry.deviceId,
      contactName: entry.contactName,
      contactEmail: entry.contactEmail,
      contactPhone: entry.contactPhone,
      selectedAt: new Date().toISOString(),
      method: 'manual',
    };
    try {
      await raffleCampaignService.updateWinners(campaign.id, [...(campaign.winners || []), newWinner]);
      await auditService.log({
        action: 'raffle_manual_override_add_winner',
        actorEmail,
        targetId: campaign.id,
        details: { entryId: entry.id, responseId: entry.responseId },
      });
      setManualEntryId('');
      setSuccess('Manual winner added.');
      await loadAll();
    } catch (e) {
      setError('Failed to add manual winner.');
    }
  };

  const removeWinner = async (campaign: RaffleCampaign, winnerId: string) => {
    if (!campaign.id) return;
    const next = (campaign.winners || []).filter((winner) => winner.id !== winnerId);
    try {
      await raffleCampaignService.updateWinners(campaign.id, next);
      await auditService.log({
        action: 'raffle_manual_override_remove_winner',
        actorEmail,
        targetId: campaign.id,
        details: { winnerId },
      });
      setSuccess('Winner removed.');
      await loadAll();
    } catch (e) {
      setError('Failed to remove winner.');
    }
  };

  const exportWinners = (campaign: RaffleCampaign) => {
    const rows = (campaign.winners || []).map((winner) => ({
      campaign: campaign.name,
      country: campaign.country,
      selectedAt: winner.selectedAt,
      method: winner.method,
      responseId: winner.responseId || '',
      deviceId: winner.deviceId,
      contactName: winner.contactName,
      contactEmail: winner.contactEmail || '',
      contactPhone: winner.contactPhone || '',
    }));
    exportToCSV(rows, `raffle_winners_${campaign.country}`);
  };

  const exportEligiblePool = (campaign: RaffleCampaign) => {
    const rows = getEligiblePool(campaign).map((entry) => ({
      campaign: campaign.name,
      country: entry.country,
      source: entry.source,
      responseId: entry.responseId || '',
      deviceId: entry.deviceId,
      contactName: entry.contactName,
      contactEmail: entry.contactEmail || '',
      contactPhone: entry.contactPhone || '',
      createdAt: entry.createdAt || '',
    }));
    exportToCSV(rows, `raffle_eligible_pool_${campaign.country}`);
  };

  const setCampaignLifecycleStatus = async (campaign: RaffleCampaign, status: CampaignStatus) => {
    if (!campaign.id) return;
    try {
      if (status === 'archived') {
        await raffleCampaignService.remove(campaign.id);
      } else {
        await raffleCampaignService.updateCampaign(campaign.id, { status });
      }
      await auditService.log({
        action: 'raffle_campaign_status_updated',
        actorEmail,
        targetId: campaign.id,
        details: { campaignName: campaign.name, status },
      });
      setSuccess(`Campaign ${campaign.name} marked as ${status}.`);
      await loadAll();
    } catch (e) {
      setError('Failed to update campaign status.');
    }
  };

  const manualEntryCandidates = useMemo(() => {
    const campaign = campaigns.find((item) => item.id === manualCampaignId);
    if (!campaign) return [];
    return getEligiblePool(campaign).slice(0, 100);
  }, [manualCampaignId, campaigns, entries, responses, getEligiblePool]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">Raffle Management</h1>
            <p className="mt-2 text-sm text-slate-400">Configure incentive campaigns, draw winners, and audit selections.</p>
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
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}
        {loading && <p className="text-sm text-slate-500">Loading raffle module...</p>}

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Create Campaign</h2>
          <form onSubmit={createCampaign} className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Campaign name"
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white md:col-span-2"
            />
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value as CountryCode)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white"
            >
              {COUNTRY_CHOICES.map((choice) => (
                <option key={choice.value} value={choice.value}>{choice.label.en}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white"
            />
            <input
              type="number"
              min={1}
              value={maxWinners}
              onChange={(event) => setMaxWinners(Number(event.target.value))}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white"
            />
            <select
              value={campaignStatus}
              onChange={(event) => setCampaignStatus(event.target.value as CampaignStatus)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
            <label className="flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={completedOnly}
                onChange={(event) => setCompletedOnly(event.target.checked)}
              />
              Require completed survey
            </label>
            <select
              value={source}
              onChange={(event) => setSource(event.target.value as EntrySource)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white"
            >
              <option value="all">Any source</option>
              <option value="survey">Survey</option>
              <option value="external">External link</option>
              <option value="manual">Manual</option>
            </select>
            <select
              value={contactRequired}
              onChange={(event) => setContactRequired(event.target.value as ContactRequirement)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white"
            >
              <option value="any">Any contact</option>
              <option value="email">Email required</option>
              <option value="phone">Phone required</option>
            </select>
            <button
              type="submit"
              className="h-11 rounded-2xl bg-blue-600 px-4 text-xs font-bold uppercase tracking-widest text-white md:col-span-3"
            >
              Create Campaign
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Campaigns + Draw Controls</h2>
          <div className="mt-4 space-y-4">
            {campaigns.map((campaign) => {
              const eligiblePool = getEligiblePool(campaign);
              return (
                <div key={campaign.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{campaign.name}</p>
                      <p className="text-xs text-slate-400">
                        {campaign.country} · {campaign.startDate} to {campaign.endDate}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Eligibility: {campaign.eligibility.completedOnly ? 'completed only' : 'all responses'} · {campaign.eligibility.source} source · {campaign.eligibility.contactRequired} contact
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                        Status: {campaign.status || 'active'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => drawWinners(campaign)}
                        disabled={campaign.status !== 'active'}
                        className="rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-emerald-200"
                      >
                        Draw Winners
                      </button>
                      <button
                        onClick={() => exportEligiblePool(campaign)}
                        className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200"
                      >
                        Export Eligible Pool
                      </button>
                      <button
                        onClick={() => exportWinners(campaign)}
                        className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200"
                      >
                        Export Winners
                      </button>
                      <select
                        value={campaign.status || 'active'}
                        onChange={(event) => setCampaignLifecycleStatus(campaign, event.target.value as CampaignStatus)}
                        className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-200"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="closed">Closed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Eligible pool: {eligiblePool.length} · Winners: {(campaign.winners || []).length}/{campaign.maxWinners}
                  </div>
                  {(campaign.winners || []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {(campaign.winners || []).map((winner) => (
                        <div key={winner.id} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>
                              {winner.contactName} · {winner.contactEmail || 'No email'} · {winner.contactPhone || 'No phone'}
                            </span>
                            <button
                              onClick={() => removeWinner(campaign, winner.id)}
                              className="rounded-lg border border-rose-500/40 px-2 py-1 text-[10px] text-rose-200"
                            >
                              Remove (override)
                            </button>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            Method: {winner.method} · Response: {winner.responseId || '—'} · Selected: {new Date(winner.selectedAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && campaigns.length === 0 && (
              <p className="text-sm text-slate-500">No raffle campaigns yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Manual Override</h2>
          <p className="mt-2 text-sm text-slate-400">Add a specific entrant as winner when needed. Duplicate winners are blocked.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <select
              value={manualCampaignId}
              onChange={(event) => {
                setManualCampaignId(event.target.value);
                setManualEntryId('');
              }}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white"
            >
              <option value="">Select campaign</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
            <select
              value={manualEntryId}
              onChange={(event) => setManualEntryId(event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-3 text-sm text-white md:col-span-2"
            >
              <option value="">Select entrant</option>
              {manualEntryCandidates.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.contactName} · {entry.country} · {entry.contactEmail || entry.contactPhone || 'No contact'}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <button
              onClick={manualAddWinner}
              disabled={!manualCampaignId || !manualEntryId}
              className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-200 disabled:opacity-50"
            >
              Add Winner (Manual Override)
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Audit Log</h2>
          <p className="mt-2 text-sm text-slate-400">Selection and override actions are tracked for governance.</p>
          <div className="mt-4 space-y-2">
            {auditEvents.slice(0, 40).map((event) => (
              <div key={event.id} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{event.action}</span>
                  <span className="text-slate-500">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">{JSON.stringify(event.details || {})}</div>
              </div>
            ))}
            {auditEvents.length === 0 && <p className="text-sm text-slate-500">No raffle audit entries yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminRafflesPage;
