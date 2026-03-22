import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LegacyUserIdentityRecord, LegacyUserIdentitySummary, userService } from '@/services/userService';
import { analyticsAggregateService } from '@/services/analyticsAggregateService';
import { User } from '@/auth/types';
import { COUNTRY_CHOICES } from '@/constants';

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [identitySummary, setIdentitySummary] = useState<LegacyUserIdentitySummary | null>(null);
  const [identityRecords, setIdentityRecords] = useState<LegacyUserIdentityRecord[]>([]);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [identityNotice, setIdentityNotice] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [migratingDocId, setMigratingDocId] = useState<string | null>(null);
  const [isBatchMigrating, setIsBatchMigrating] = useState(false);
  const [aggregateCountry, setAggregateCountry] = useState<'all' | 'rwanda' | 'uganda' | 'burundi'>('all');
  const [aggregateNotice, setAggregateNotice] = useState<string | null>(null);
  const [aggregateError, setAggregateError] = useState<string | null>(null);
  const [isRebuildingAggregates, setIsRebuildingAggregates] = useState(false);
  const [aggregateProgress, setAggregateProgress] = useState<string | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetResponses, setResetResponses] = useState(true);
  const [resetAggregates, setResetAggregates] = useState(true);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResettingSurveyData, setIsResettingSurveyData] = useState(false);

  const loadUsers = async () => {
    const allUsers = await userService.listUsers();
    setUsers(allUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const scanLegacyIdentity = async () => {
    setIsScanning(true);
    setIdentityError(null);
    setIdentityNotice(null);
    try {
      const report = await userService.scanLegacyIdentityRecords();
      setIdentitySummary(report.summary);
      setIdentityRecords(report.records);
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Failed to scan legacy user records.');
    } finally {
      setIsScanning(false);
    }
  };

  const migrateLegacyRecord = async (legacyDocId: string) => {
    setMigratingDocId(legacyDocId);
    setIdentityError(null);
    setIdentityNotice(null);
    try {
      await userService.migrateLegacyIdentityRecord(legacyDocId);
      setIdentityNotice(`Legacy record ${legacyDocId} was migrated to its canonical UID.`);
      await Promise.all([loadUsers(), scanLegacyIdentity()]);
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Failed to migrate legacy user record.');
    } finally {
      setMigratingDocId(null);
    }
  };

  const migrateSafeLegacyRecords = async () => {
    setIsBatchMigrating(true);
    setIdentityError(null);
    setIdentityNotice(null);
    try {
      const result = await userService.migrateSafeLegacyIdentityRecords();
      setIdentityNotice(`Migrated ${result.migratedCount} safe legacy record${result.migratedCount === 1 ? '' : 's'}.`);
      await Promise.all([loadUsers(), scanLegacyIdentity()]);
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : 'Failed to batch-migrate legacy user records.');
    } finally {
      setIsBatchMigrating(false);
    }
  };

  const setStatus = async (userId: string, status: User['status']) => {
    await userService.setUserStatus(userId, status);
    loadUsers();
  };

  const rebuildAggregates = async () => {
    setIsRebuildingAggregates(true);
    setAggregateNotice(null);
    setAggregateError(null);
    setAggregateProgress(null);
    try {
      const countries = aggregateCountry === 'all'
        ? (COUNTRY_CHOICES.map((choice) => choice.value) as Array<'rwanda' | 'uganda' | 'burundi'>)
        : [aggregateCountry];

      let totalRebuilt = 0;
      for (const country of countries) {
        let cursor: string | null = null;
        let hasMore = true;
        let countryTotal = 0;

        while (hasMore) {
          setAggregateProgress(`Rebuilding ${country} aggregates${cursor ? ' (continuing...)' : '...'} `);
          const result = await analyticsAggregateService.rebuildDashboardAggregates(country, {
            cursor,
            maxBuckets: 15,
          });
          totalRebuilt += result.rebuiltBuckets;
          countryTotal += result.rebuiltBuckets;
          cursor = result.nextCursor;
          hasMore = result.hasMore;
          setAggregateProgress(
            `Rebuilt ${countryTotal}/${result.totalBuckets} bucket${result.totalBuckets === 1 ? '' : 's'} for ${country}.`,
          );
        }
      }

      setAggregateNotice(
        `Rebuilt ${totalRebuilt} aggregate bucket${totalRebuilt === 1 ? '' : 's'}${aggregateCountry === 'all' ? ' across all countries' : ` for ${aggregateCountry}`}.`,
      );
    } catch (error) {
      setAggregateError(error instanceof Error ? error.message : 'Failed to rebuild dashboard aggregates.');
    } finally {
      setIsRebuildingAggregates(false);
      setAggregateProgress(null);
    }
  };

  const resetSurveyAnalyticsData = async () => {
    setIsResettingSurveyData(true);
    setResetNotice(null);
    setResetError(null);
    try {
      const result = await analyticsAggregateService.resetSurveyAnalyticsData({
        confirmText: resetConfirmText,
        clearResponses: resetResponses,
        clearAggregates: resetAggregates,
      });
      setResetNotice(
        `Deleted ${result.deletedResponses} response${result.deletedResponses === 1 ? '' : 's'} and ${result.deletedAggregates} aggregate bucket${result.deletedAggregates === 1 ? '' : 's'}.`,
      );
      setResetConfirmText('');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Failed to reset survey and aggregate data.');
    } finally {
      setIsResettingSurveyData(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-black">User Management</h1>
            <p className="mt-2 text-sm text-slate-400">Review subscribers and audit admin actions.</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">User Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            System-wide user directory. Subscriber onboarding and approvals are handled in Subscriber Management.
          </p>
          <button
            onClick={() => navigate('/admin/subscribers')}
            className="mt-4 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500"
          >
            Go to Subscriber Management
          </button>
          <button
            onClick={() => navigate('/admin/subscriptions')}
            className="mt-4 ml-3 rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
          >
            Subscription Management
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Dashboard Aggregates</h2>
              <p className="mt-1 text-sm text-slate-400">
                Rebuild backend materialized overview summaries after deployment or when historical response backfill is required.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={aggregateCountry}
                onChange={(event) => setAggregateCountry(event.target.value as typeof aggregateCountry)}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300"
              >
                <option value="all">All countries</option>
                {COUNTRY_CHOICES.map((choice) => (
                  <option key={choice.value} value={choice.value}>{choice.label.en}</option>
                ))}
              </select>
              <button
                onClick={() => rebuildAggregates()}
                disabled={isRebuildingAggregates}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {isRebuildingAggregates ? 'Rebuilding In Chunks...' : 'Rebuild Aggregates'}
              </button>
            </div>
          </div>
          {aggregateProgress && (
            <div className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
              {aggregateProgress}
            </div>
          )}
          {aggregateError && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {aggregateError}
            </div>
          )}
          {aggregateNotice && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {aggregateNotice}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-rose-500/20 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Pre-Launch Data Reset</h2>
              <p className="mt-1 max-w-3xl text-sm text-slate-400">
                Explicitly clear test survey responses and/or materialized daily aggregates before launch. This is destructive and requires the exact confirmation phrase.
              </p>
            </div>
            <button
              onClick={() => resetSurveyAnalyticsData()}
              disabled={
                isResettingSurveyData
                || (!resetResponses && !resetAggregates)
                || resetConfirmText.trim() !== 'RESET SURVEY DATA'
              }
              className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-rose-500 disabled:opacity-60"
            >
              {isResettingSurveyData ? 'Resetting Data...' : 'Reset Survey Data'}
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={resetResponses}
                onChange={(event) => setResetResponses(event.target.checked)}
              />
              Clear responses
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={resetAggregates}
                onChange={(event) => setResetAggregates(event.target.checked)}
              />
              Clear responseAnalyticsDaily
            </label>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Confirmation</p>
              <input
                value={resetConfirmText}
                onChange={(event) => setResetConfirmText(event.target.value)}
                placeholder="RESET SURVEY DATA"
                className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100"
              />
            </div>
          </div>
          {resetError && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {resetError}
            </div>
          )}
          {resetNotice && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {resetNotice}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Identity Cleanup</h2>
              <p className="mt-1 text-sm text-slate-400">
                Scan for legacy email-keyed user docs, UID mismatches, and duplicate identity records. Safe migrations only run when a canonical auth UID is already known.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {identitySummary?.safeMigrationCandidates ? (
                <button
                  onClick={() => migrateSafeLegacyRecords()}
                  disabled={isBatchMigrating}
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {isBatchMigrating ? 'Migrating Safe Records...' : 'Migrate All Safe Records'}
                </button>
              ) : null}
              <button
                onClick={() => scanLegacyIdentity()}
                disabled={isScanning}
                className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500 disabled:opacity-60"
              >
                {isScanning ? 'Scanning...' : 'Scan Legacy Records'}
              </button>
            </div>
          </div>
          {identityError && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {identityError}
            </div>
          )}
          {identityNotice && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {identityNotice}
            </div>
          )}
          {identitySummary && (
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Legacy records</p>
                <p className="mt-2 text-3xl font-black text-white">{identitySummary.legacyRecords}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Safe migration candidates</p>
                <p className="mt-2 text-3xl font-black text-white">{identitySummary.safeMigrationCandidates}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Duplicate emails</p>
                <p className="mt-2 text-3xl font-black text-white">{identitySummary.duplicateEmails}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">UID mismatches</p>
                <p className="mt-2 text-3xl font-black text-white">{identitySummary.idMismatches}</p>
              </div>
            </div>
          )}
          {identityRecords.length > 0 && (
            <div className="mt-6 space-y-4">
              {identityRecords.map((record) => (
                <div key={record.docId} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{record.email || record.docId}</p>
                      <p className="text-xs text-slate-400">Doc: {record.docId}</p>
                      {record.canonicalUid && (
                        <p className="text-xs text-slate-500">Canonical UID: {record.canonicalUid}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {record.issueTypes.map((issue) => (
                          <span key={issue} className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-300">
                            {issue.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.safeToMigrate && (
                        <button
                          onClick={() => migrateLegacyRecord(record.docId)}
                          disabled={migratingDocId === record.docId}
                          className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-blue-500 disabled:opacity-60"
                        >
                          {migratingDocId === record.docId ? 'Migrating...' : 'Migrate to UID'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-lg font-bold">All Users</h2>
          <div className="mt-6 space-y-4">
            {users.map(user => (
              <div key={user.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{user.companyName || user.email}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{user.role} · {user.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role === 'subscriber' && (
                      <button
                        onClick={() => setStatus(user.id, user.status === 'suspended' ? 'active' : 'suspended')}
                        className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-slate-300"
                      >
                        {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                    )}
                  </div>
                </div>
                {user.role === 'subscriber' && (
                  <div className="mt-4 text-xs text-slate-500">
                    Country access is managed in Subscriber Management after approval.
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

export default AdminUsersPage;
