import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/context';
import { auditService, type AuditEvent } from '@/services/auditService';
import type { SubscriptionPlan, SupportedCurrency } from '@/types/subscriptionPlans';
import { diagnoseAdminPlanAccessError, subscriptionPlanService } from '@/services/subscriptionPlanService';
import { buildCurrencyPricingFromUsd, getPlanTagline, SUPPORTED_CURRENCIES } from '@/utils/subscriptionPlans';

const EMPTY_PLAN: SubscriptionPlan = {
  id: '',
  publicName: '',
  positioningLine: '',
  benefits: [''],
  isActive: true,
  sortOrder: 100,
  featured: false,
  ctaLabel: 'Request Access',
  ctaTarget: '/signup',
  entitlementMapping: { tier: 'free', aiAddon: false },
  pricing: buildCurrencyPricingFromUsd(0),
};

const PLAN_AUDIT_ACTIONS = new Set([
  'subscription_plan_created',
  'subscription_plan_updated',
  'subscription_plan_deleted',
  'subscription_plan_defaults_seeded',
]);

const AdminSubscriptionManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAdminAccess } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<string | null>(null);
  const [isRepairingClaims, setIsRepairingClaims] = useState(false);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const latestLoadRequestRef = useRef(0);

  const clearPlanError = () => {
    setError(null);
    setErrorKind(null);
  };

  const loadPlans = async () => {
    const requestId = latestLoadRequestRef.current + 1;
    latestLoadRequestRef.current = requestId;
    setIsLoading(true);
    clearPlanError();
    try {
      const nextPlans = await subscriptionPlanService.listAllAdmin();
      if (latestLoadRequestRef.current !== requestId) return;
      setPlans(nextPlans);
      clearPlanError();
    } catch (err) {
      if (latestLoadRequestRef.current !== requestId) return;
      const diagnosis = await diagnoseAdminPlanAccessError(err);
      setErrorKind(diagnosis.kind);
      setError(diagnosis.message);
    } finally {
      if (latestLoadRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const loadAuditEvents = async () => {
    try {
      const events = await auditService.list(200);
      setAuditEvents(events.filter((event) => PLAN_AUDIT_ACTIONS.has(event.action)));
    } catch {
      setAuditEvents([]);
    }
  };

  useEffect(() => {
    void loadAuditEvents();
  }, []);

  const setPlan = (planId: string, nextPlan: SubscriptionPlan) => {
    setPlans((current) => current.map((plan) => (plan.id === planId ? nextPlan : plan)));
  };

  const updateField = <K extends keyof SubscriptionPlan>(plan: SubscriptionPlan, key: K, value: SubscriptionPlan[K]) => {
    setPlan(plan.id, { ...plan, [key]: value });
  };

  const updateBenefit = (plan: SubscriptionPlan, index: number, value: string) => {
    const nextBenefits = [...plan.benefits];
    nextBenefits[index] = value;
    setPlan(plan.id, { ...plan, benefits: nextBenefits });
  };

  const addBenefit = (plan: SubscriptionPlan) => {
    setPlan(plan.id, { ...plan, benefits: [...plan.benefits, ''] });
  };

  const removeBenefit = (plan: SubscriptionPlan, index: number) => {
    const nextBenefits = plan.benefits.filter((_, currentIndex) => currentIndex !== index);
    setPlan(plan.id, { ...plan, benefits: nextBenefits.length > 0 ? nextBenefits : [''] });
  };

  const updatePricing = (
    plan: SubscriptionPlan,
    period: 'monthly' | 'annual',
    currency: SupportedCurrency,
    value: number,
  ) => {
    setPlan(plan.id, {
      ...plan,
      pricing: {
        ...plan.pricing,
        [period]: {
          ...plan.pricing[period],
          [currency]: Number.isFinite(value) ? value : 0,
        },
      },
    });
  };

  const savePlan = async (plan: SubscriptionPlan) => {
    if (!plan.id.trim()) {
      setError('Internal id is required before saving a plan.');
      setErrorKind('unknown');
      return;
    }
    clearPlanError();
    setNotice(null);
    setIsSaving((current) => ({ ...current, [plan.id]: true }));
    try {
      await subscriptionPlanService.savePlanAdmin(plan);
      setNotice(`Saved plan: ${plan.publicName || plan.id}`);
      clearPlanError();
      await loadPlans();
      await loadAuditEvents();
    } catch (err) {
      const diagnosis = await diagnoseAdminPlanAccessError(err);
      setErrorKind(diagnosis.kind);
      setError(diagnosis.kind === 'unknown' ? 'Failed to save subscription plan.' : diagnosis.message);
    } finally {
      setIsSaving((current) => ({ ...current, [plan.id]: false }));
    }
  };

  const deletePlan = async (planId: string) => {
    clearPlanError();
    setNotice(null);
    try {
      await subscriptionPlanService.deletePlanAdmin(planId);
      setNotice(`Deleted plan: ${planId}`);
      clearPlanError();
      await loadPlans();
      await loadAuditEvents();
    } catch (err) {
      const diagnosis = await diagnoseAdminPlanAccessError(err);
      setErrorKind(diagnosis.kind);
      setError(diagnosis.kind === 'unknown' ? 'Failed to delete subscription plan.' : diagnosis.message);
    }
  };

  const initializeDefaults = async () => {
    clearPlanError();
    setNotice(null);
    try {
      const { plans: seeded, initialized } = await subscriptionPlanService.initializeDefaultsAdmin();
      setPlans(seeded);
      clearPlanError();
      setNotice(
        initialized
          ? 'Default subscription plans initialized. Public pricing should now populate automatically.'
          : 'Subscription plans already existed. Existing plan set loaded.',
      );
      await loadAuditEvents();
    } catch (err) {
      const diagnosis = await diagnoseAdminPlanAccessError(err);
      setErrorKind(diagnosis.kind);
      setError(diagnosis.kind === 'unknown' ? 'Failed to initialize subscription plans.' : diagnosis.message);
    }
  };

  const repairAdminClaims = async () => {
    setIsRepairingClaims(true);
    clearPlanError();
    setNotice(null);
    try {
      await refreshAdminAccess();
      setNotice('Admin claims repaired. Your token was refreshed. Retrying subscription plan access now.');
      clearPlanError();
      await loadPlans();
      await loadAuditEvents();
    } catch (err) {
      const diagnosis = await diagnoseAdminPlanAccessError(err);
      setErrorKind(diagnosis.kind);
      setError(diagnosis.kind === 'unknown' ? 'Failed to repair admin claims.' : diagnosis.message);
    } finally {
      setIsRepairingClaims(false);
    }
  };

  const addNewPlan = () => {
    const nextSortOrder = plans.reduce((max, plan) => Math.max(max, plan.sortOrder), 0) + 10;
    setPlans((current) => [
      ...current,
      {
        ...EMPTY_PLAN,
        id: `custom-${Date.now()}`,
        publicName: 'New Plan',
        sortOrder: nextSortOrder,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">Subscription Management</h1>
            <p className="mt-2 text-sm text-slate-400">
              Control the commercial plans shown publicly and keep pricing aligned with the live entitlement model.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/admin/subscribers')}
              className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
            >
              Subscriber Management
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

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Commercial Plan Control</h2>
              <p className="mt-1 text-sm text-slate-400">
                Public pricing reads from these documents. Annual pricing should follow the 10.5x monthly rule unless commercial overrides are needed.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={initializeDefaults}
                className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyan-100"
              >
                Initialize Default Subscription Plans
              </button>
              <button
                onClick={addNewPlan}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500"
              >
                Add Plan
              </button>
            </div>
          </div>
          {notice && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {notice}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              <p>{error}</p>
              {errorKind === 'missing_admin_claim' && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={repairAdminClaims}
                    disabled={isRepairingClaims}
                    className="rounded-2xl bg-rose-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-950 disabled:opacity-60"
                  >
                    {isRepairingClaims ? 'Repairing Claims...' : 'Repair Admin Claims'}
                  </button>
                  <p className="text-xs text-rose-100">
                    This repairs claims from your canonical `users/{'{uid}'}` admin profile without changing Firestore roles.
                  </p>
                </div>
              )}
              {errorKind === 'callable_unavailable' && (
                <pre className="mt-3 overflow-x-auto rounded-2xl border border-rose-400/20 bg-slate-950/70 p-3 text-[11px] text-rose-100">
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only hosting
                </pre>
              )}
            </div>
          )}
        </section>

        {isLoading ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-400">
            Loading subscription plans...
          </section>
        ) : plans.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center">
            <h2 className="text-lg font-bold text-white">No subscription plans configured</h2>
            <p className="mt-2 text-sm text-slate-400">
              No plans exist yet. Initialize the default Free, Standard, and Premium plans, then edit names, benefits, pricing, and visibility.
            </p>
            <button
              onClick={initializeDefaults}
              className="mt-6 rounded-2xl bg-cyan-500 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-cyan-400"
            >
              Initialize Default Subscription Plans
            </button>
          </section>
        ) : (
          <section className="space-y-6">
            {plans.map((plan) => {
              const isNewPlan = !plan.createdAt;
              return (
                <article key={plan.id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Plan</p>
                    <h2 className="mt-2 text-2xl font-black text-white">{plan.publicName}</h2>
                    <p className="mt-2 text-sm text-slate-400">{getPlanTagline(plan.entitlementMapping)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => savePlan(plan)}
                      disabled={Boolean(isSaving[plan.id])}
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-500 disabled:opacity-60"
                    >
                      {isSaving[plan.id] ? 'Saving...' : 'Save Plan'}
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="rounded-2xl border border-rose-400/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    Internal id
                    <input
                      value={plan.id}
                      onChange={(event) => {
                        const nextId = event.target.value.trim();
                        setPlan(plan.id, { ...plan, id: nextId });
                      }}
                      disabled={!isNewPlan}
                      className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Public name
                    <input
                      value={plan.publicName}
                      onChange={(event) => updateField(plan, 'publicName', event.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="text-sm text-slate-300 lg:col-span-2">
                    Short positioning line
                    <input
                      value={plan.positioningLine}
                      onChange={(event) => updateField(plan, 'positioningLine', event.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-4">
                  <label className="text-sm text-slate-300">
                    Sort order
                    <input
                      type="number"
                      value={plan.sortOrder}
                      onChange={(event) => updateField(plan, 'sortOrder', Number(event.target.value))}
                      className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={plan.isActive}
                      onChange={(event) => updateField(plan, 'isActive', event.target.checked)}
                    />
                    Active on public pricing
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(plan.featured)}
                      onChange={(event) => updateField(plan, 'featured', event.target.checked)}
                    />
                    Featured plan
                  </label>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    Entitlement mapping: {plan.entitlementMapping.tier.toUpperCase()}
                    {plan.entitlementMapping.aiAddon ? ' + AI' : ''}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-4">
                  <label className="text-sm text-slate-300">
                    Entitlement tier
                    <select
                      value={plan.entitlementMapping.tier}
                      onChange={(event) => {
                        const tier = event.target.value as 'free' | 'standard';
                        updateField(plan, 'entitlementMapping', {
                          tier,
                          aiAddon: tier === 'free' ? false : plan.entitlementMapping.aiAddon,
                        });
                      }}
                      className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-blue-500"
                    >
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={plan.entitlementMapping.aiAddon}
                      disabled={plan.entitlementMapping.tier === 'free'}
                      onChange={(event) => updateField(plan, 'entitlementMapping', {
                        ...plan.entitlementMapping,
                        aiAddon: event.target.checked,
                      })}
                    />
                    AI add-on enabled
                  </label>
                  <label className="text-sm text-slate-300">
                    CTA label
                    <input
                      value={plan.ctaLabel}
                      onChange={(event) => updateField(plan, 'ctaLabel', event.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    CTA target
                    <input
                      value={plan.ctaTarget}
                      onChange={(event) => updateField(plan, 'ctaTarget', event.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </label>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Benefits</h3>
                    <button
                      onClick={() => addBenefit(plan)}
                      className="rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-300"
                    >
                      Add Benefit
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {plan.benefits.map((benefit, index) => (
                      <div key={`${plan.id}-benefit-${index}`} className="flex gap-2">
                        <input
                          value={benefit}
                          onChange={(event) => updateBenefit(plan, index, event.target.value)}
                          className="h-11 flex-1 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => removeBenefit(plan, index)}
                          className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Pricing</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Default seed logic uses USD commercial pricing, annual at 10.5x monthly, and local currency references that admins can edit afterward.
                  </p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {(['monthly', 'annual'] as const).map((period) => (
                      <div key={`${plan.id}-${period}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{period}</h4>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <label key={`${plan.id}-${period}-${currency}`} className="text-sm text-slate-300">
                              {currency}
                              <input
                                type="number"
                                min={0}
                                value={plan.pricing[period][currency]}
                                onChange={(event) => updatePricing(plan, period, currency, Number(event.target.value))}
                                className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 text-sm text-white outline-none focus:border-blue-500"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
              );
            })}
          </section>
        )}

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Subscription Plan Audit Log</h2>
              <p className="mt-1 text-sm text-slate-400">
                Recent commercial configuration changes across plan creation, pricing edits, visibility changes, and deletions.
              </p>
            </div>
            <div className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {auditEvents.length} logged events
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {auditEvents.slice(0, 10).map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{entry.action.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.actorEmail ? `Actor: ${entry.actorEmail}` : 'Actor not recorded'}
                      {entry.targetId ? ` · Target: ${entry.targetId}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                {entry.details && (
                  <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-3 text-[11px] text-slate-300">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </article>
            ))}
            {auditEvents.length === 0 && (
              <p className="text-sm text-slate-500">No subscription plan audit events yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminSubscriptionManagementPage;
