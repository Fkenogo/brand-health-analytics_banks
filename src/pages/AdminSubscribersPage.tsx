import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { inviteService, SubscriberInvite } from '@/services/inviteService';
import { auditService, AuditEvent } from '@/services/auditService';
import { User, CountryCode } from '@/auth/types';
import { COUNTRY_CHOICES } from '@/constants';
import { useAuth } from '@/auth/context';

const AdminSubscribersPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inviteConfig, setInviteConfig] = useState<Record<string, { countries: CountryCode[]; validityDays: number }>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<SubscriberInvite[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const refresh = async () => {
    const [subscriberUsers, inviteDocs, auditEvents] = await Promise.all([
      userService.listSubscribers(),
      inviteService.listInvites(),
      auditService.list(),
    ]);
    setUsers(subscriberUsers);
    setInvites(inviteDocs);
    setAudit(auditEvents);
  };

  React.useEffect(() => {
    refresh();
  }, []);

  const groups = useMemo(() => {
    const draft = users.filter(u => u.status === 'draft');
    const pending = users.filter(u => u.status === 'pending');
    const active = users.filter(u => u.status === 'active');
    const suspended = users.filter(u => u.status === 'suspended');
    const rejected = users.filter(u => u.status === 'rejected');
    return { draft, pending, active, suspended, rejected };
  }, [users]);

  const createDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email) {
      setError('Email is required.');
      return;
    }
    const existing = await userService.getUserByEmail(email);
    if (existing) {
      setError('Subscriber already exists.');
      return;
    }
    const draft = await userService.createDraftSubscriber(email, companyName);
    await auditService.log({ action: 'subscriber_draft_created', actorEmail: state.user?.email, targetId: draft.id });
    setEmail('');
    setCompanyName('');
    refresh();
  };

  const createInvite = async (userId: string) => {
    const config = inviteConfig[userId] || { countries: [], validityDays: 7 };
    if (config.countries.length === 0) {
      setError('Select at least one country for the subscription.');
      return;
    }
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const invite = await inviteService.createInvite(userId, user.email, user.companyName || user.email, config.countries, config.validityDays);
    await userService.setUserCountries(userId, config.countries);
    await auditService.log({ action: 'subscriber_invite_created', actorEmail: state.user?.email, targetId: userId, details: { inviteId: invite.id } });
    setInviteConfig(prev => ({ ...prev, [userId]: { countries: [], validityDays: 7 } }));
    refresh();
  };

  const updateStatus = async (id: string, status: User['status']) => {
    await userService.setUserStatus(id, status);
    await auditService.log({ action: 'subscriber_status_updated', actorEmail: state.user?.email, targetId: id, details: { status } });
    refresh();
  };

  const updateSubscription = async (user: User, patch: Partial<User>) => {
    const nextTier = (patch.subscription_tier ?? user.subscription_tier ?? 'free') as 'free' | 'standard';
    const nextAddon = nextTier === 'free'
      ? false
      : Boolean(patch.subscription_addon_ai ?? user.subscription_addon_ai ?? false);
    await userService.updateUser(user.id, {
      subscription_tier: nextTier,
      subscription_addon_ai: nextAddon,
    });
    await auditService.log({
      action: 'subscriber_subscription_updated',
      actorEmail: state.user?.email,
      targetId: user.id,
      details: {
        subscription_tier: nextTier,
        subscription_addon_ai: nextAddon,
      },
    });
    refresh();
  };

  const inviteFor = (userId: string) => invites.find((invite) => invite.userId === userId);
  const baseUrl = window.location.origin;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">Subscriber Management</h1>
            <p className="mt-2 text-sm text-slate-400">Create drafts, send invites, and approve access.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
          >
            Back to Admin
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Create Draft Subscriber</h2>
          <p className="mt-1 text-sm text-slate-400">Drafts are not active and cannot access dashboards.</p>
          <form onSubmit={createDraft} className="mt-6 grid gap-4 md:grid-cols-3">
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Organization / Bank name"
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Admin contact email"
              className="h-12 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-white outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="h-12 rounded-2xl bg-blue-600 font-bold uppercase tracking-widest text-xs text-white hover:bg-blue-500"
            >
              Create Draft
            </button>
          </form>
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Draft Subscribers</h2>
          <p className="mt-1 text-sm text-slate-400">Select countries and generate a single-use invitation link.</p>
          <div className="mt-6 space-y-4">
            {groups.draft.map(user => {
              const invite = inviteFor(user.id);
              return (
                <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{user.companyName || user.email}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Tier: {(user.subscription_tier || 'free').toUpperCase()} · AI Add-On: {user.subscription_addon_ai ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.subscription_tier || 'free'}
                        onChange={(event) => {
                          const nextTier = event.target.value as 'free' | 'standard';
                          void updateSubscription(user, {
                            subscription_tier: nextTier,
                            subscription_addon_ai: nextTier === 'standard' ? user.subscription_addon_ai : false,
                          });
                        }}
                        className="h-9 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-xs text-slate-200"
                      >
                        <option value="free">Free</option>
                        <option value="standard">Standard</option>
                      </select>
                      <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(user.subscription_addon_ai)}
                          disabled={(user.subscription_tier || 'free') === 'free'}
                          onChange={(event) => {
                            void updateSubscription(user, {
                              subscription_tier: (user.subscription_tier || 'free') as 'free' | 'standard',
                              subscription_addon_ai: event.target.checked,
                            });
                          }}
                        />
                        AI Add-On
                      </label>
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">draft</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRY_CHOICES.map(choice => {
                      const country = choice.value as CountryCode;
                      const checked = (inviteConfig[user.id]?.countries || []).includes(country);
                      return (
                        <label
                          key={`${user.id}-${choice.value}`}
                          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                            checked ? 'border-blue-500/50 bg-blue-500/10 text-blue-200' : 'border-white/10 text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setInviteConfig(prev => {
                                const current = prev[user.id]?.countries || [];
                                const next = event.target.checked
                                  ? [...current, country]
                                  : current.filter(c => c !== country);
                                return { ...prev, [user.id]: { countries: next, validityDays: prev[user.id]?.validityDays || 7 } };
                              });
                            }}
                          />
                          {choice.label.en}
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs text-slate-400">
                      Validity (days)
                      <input
                        type="number"
                        min={1}
                        value={inviteConfig[user.id]?.validityDays || 7}
                        onChange={(event) => {
                          const nextVal = Number(event.target.value);
                          setInviteConfig(prev => ({
                            ...prev,
                            [user.id]: { countries: prev[user.id]?.countries || [], validityDays: nextVal },
                          }));
                        }}
                        className="ml-2 h-8 w-20 rounded-xl border border-white/10 bg-slate-950/40 px-2 text-xs text-white"
                      />
                    </label>
                    <button
                      onClick={() => createInvite(user.id)}
                      className="rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-emerald-200"
                    >
                      Generate Invite
                    </button>
                  </div>
                  {invite && (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
                      Invitation link:
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-xl bg-slate-950/60 px-3 py-2 text-xs text-slate-200">
                          {baseUrl}/invite/{invite.token}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${baseUrl}/invite/${invite.token}`)}
                          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Expires on {new Date(invite.expiresAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {groups.draft.length === 0 && (
              <p className="text-sm text-slate-500">No draft subscribers.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Pending Approval</h2>
          <p className="mt-1 text-sm text-slate-400">Review onboarding submissions and approve or reject.</p>
          <div className="mt-6 space-y-4">
            {groups.pending.map(user => (
              <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{user.companyName || user.email}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Tier: {(user.subscription_tier || 'free').toUpperCase()} · AI Add-On: {user.subscription_addon_ai ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.subscription_tier || 'free'}
                      onChange={(event) => {
                        const nextTier = event.target.value as 'free' | 'standard';
                        void updateSubscription(user, {
                          subscription_tier: nextTier,
                          subscription_addon_ai: nextTier === 'standard' ? user.subscription_addon_ai : false,
                        });
                      }}
                      className="h-9 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-xs text-slate-200"
                    >
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                    </select>
                    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(user.subscription_addon_ai)}
                        disabled={(user.subscription_tier || 'free') === 'free'}
                        onChange={(event) => {
                          void updateSubscription(user, {
                            subscription_tier: (user.subscription_tier || 'free') as 'free' | 'standard',
                            subscription_addon_ai: event.target.checked,
                          });
                        }}
                      />
                      AI Add-On
                    </label>
                    <button
                      onClick={() => setReviewId(prev => (prev === user.id ? null : user.id))}
                      className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                    >
                      {reviewId === user.id ? 'Hide' : 'Review'}
                    </button>
                    <button
                      onClick={() => updateStatus(user.id, 'active')}
                      className="rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-emerald-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(user.id, 'rejected')}
                      className="rounded-2xl bg-rose-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-rose-200"
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {reviewId === user.id && (
                  <div className="mt-4 grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">Contact Person</p>
                      <p className="text-sm text-slate-200">{user.contactName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">Phone</p>
                      <p className="text-sm text-slate-200">{user.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">Organization</p>
                      <p className="text-sm text-slate-200">{user.companyName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">Email</p>
                      <p className="text-sm text-slate-200">{user.email}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500">Requested Countries</p>
                      <p className="text-sm text-slate-200">{(user.requestedCountries || []).join(', ') || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {groups.pending.length === 0 && (
              <p className="text-sm text-slate-500">No pending approvals.</p>
            )}
          </div>
        </section>

        {(['active', 'suspended', 'rejected'] as const).map(status => (
          <section key={status} className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <h2 className="text-lg font-bold capitalize">{status}</h2>
            <div className="mt-4 space-y-3">
              {groups[status].map(user => (
                <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{user.companyName || user.email}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Tier: {(user.subscription_tier || 'free').toUpperCase()} · AI Add-On: {user.subscription_addon_ai ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.subscription_tier || 'free'}
                      onChange={(event) => {
                        const nextTier = event.target.value as 'free' | 'standard';
                        void updateSubscription(user, {
                          subscription_tier: nextTier,
                          subscription_addon_ai: nextTier === 'standard' ? user.subscription_addon_ai : false,
                        });
                      }}
                      className="h-9 rounded-xl border border-white/10 bg-slate-900/60 px-3 text-xs text-slate-200"
                    >
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                    </select>
                    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(user.subscription_addon_ai)}
                        disabled={(user.subscription_tier || 'free') === 'free'}
                        onChange={(event) => {
                          void updateSubscription(user, {
                            subscription_tier: (user.subscription_tier || 'free') as 'free' | 'standard',
                            subscription_addon_ai: event.target.checked,
                          });
                        }}
                      />
                      AI Add-On
                    </label>
                    {status !== 'active' && (
                      <button
                        onClick={() => updateStatus(user.id, 'active')}
                        className="rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-emerald-200"
                      >
                        Activate
                      </button>
                    )}
                    {status !== 'suspended' && (
                      <button
                        onClick={() => updateStatus(user.id, 'suspended')}
                        className="rounded-2xl bg-rose-500/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-rose-200"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {groups[status].length === 0 && (
                <p className="text-sm text-slate-500">No {status} subscribers.</p>
              )}
            </div>
          </section>
        ))}
      </main>
      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">Subscriber Audit Log</h2>
          <p className="mt-1 text-sm text-slate-400">Recent admin actions affecting subscriber access.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            {audit.slice(0, 8).map(entry => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{entry.action.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                {entry.actorEmail && (
                  <p className="text-xs text-slate-500 mt-1">Actor: {entry.actorEmail}</p>
                )}
              </div>
            ))}
            {audit.length === 0 && (
              <p className="text-sm text-slate-500">No audit events yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminSubscribersPage;
