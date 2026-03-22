import { beforeEach, describe, expect, it, vi } from 'vitest';

const getDocsMock = vi.fn();
const getDocMock = vi.fn();
const collectionMock = vi.fn();
const docMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();
const setDocMock = vi.fn();
const updateDocMock = vi.fn();
const writeBatchMock = vi.fn();
const httpsCallableMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  writeBatch: (...args: unknown[]) => writeBatchMock(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallableMock(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  functions: {},
}));

describe('userService legacy identity cleanup', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    docMock.mockReturnValue({});
    collectionMock.mockReturnValue({});
    queryMock.mockReturnValue({});
    whereMock.mockReturnValue({});
  });

  it('filters shadowed legacy docs out of listUsers and listSubscribers', async () => {
    const noop = vi.fn();
    httpsCallableMock
      .mockReturnValueOnce(noop)
      .mockReturnValueOnce(noop)
      .mockReturnValueOnce(noop)
      .mockReturnValueOnce(noop)
      .mockReturnValueOnce(noop)
      .mockReturnValueOnce(noop)
      .mockReturnValueOnce(noop)
      .mockReturnValueOnce(noop)
      .mockReturnValueOnce(noop);

    getDocsMock
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ id: 'uid-1', email: 'active@example.com', role: 'subscriber', status: 'active' }) },
          { data: () => ({ id: 'legacy@example.com', email: 'active@example.com', role: 'subscriber', status: 'pending', migratedToUid: 'uid-1', legacyMigrationStatus: 'shadowed' }) },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ id: 'uid-1', email: 'active@example.com', role: 'subscriber', status: 'active' }) },
          { data: () => ({ id: 'legacy@example.com', email: 'active@example.com', role: 'subscriber', status: 'pending', migratedToUid: 'uid-1', legacyMigrationStatus: 'shadowed' }) },
        ],
      });

    const { userService } = await import('@/services/userService');
    const users = await userService.listUsers();
    const subscribers = await userService.listSubscribers();

    expect(users).toHaveLength(1);
    expect(subscribers).toHaveLength(1);
    expect(users[0].id).toBe('uid-1');
  });

  it('routes legacy identity scan and migrate through backend callables', async () => {
    const createDraftFn = vi.fn();
    const updateStatusFn = vi.fn();
    const updateTierFn = vi.fn();
    const updateCountriesFn = vi.fn();
    const updateAiAddonFn = vi.fn();
    const createFreeFn = vi.fn();
    const scanFn = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        summary: { totalUsers: 2, legacyRecords: 1, emailKeyedDocs: 1, idMismatches: 1, duplicateEmails: 0, duplicateAuthUids: 0, alreadyMigrated: 0, safeMigrationCandidates: 1 },
        records: [{ docId: 'legacy@example.com', canonicalUid: 'uid-1', issueTypes: ['email_keyed_doc'], migrationAction: 'copy_to_uid', safeToMigrate: true }],
      },
    });
    const migrateFn = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        legacyDocId: 'legacy@example.com',
        canonicalUid: 'uid-1',
        migrationStatus: 'migrated',
      },
    });
    const migrateSafeFn = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        migrated: [{ legacyDocId: 'legacy@example.com', canonicalUid: 'uid-1', migrationStatus: 'migrated' }],
        migratedCount: 1,
        skippedCount: 0,
      },
    });

    httpsCallableMock
      .mockReturnValueOnce(createDraftFn)
      .mockReturnValueOnce(updateStatusFn)
      .mockReturnValueOnce(updateTierFn)
      .mockReturnValueOnce(updateCountriesFn)
      .mockReturnValueOnce(updateAiAddonFn)
      .mockReturnValueOnce(createFreeFn)
      .mockReturnValueOnce(scanFn)
      .mockReturnValueOnce(migrateFn)
      .mockReturnValueOnce(migrateSafeFn);

    const { userService } = await import('@/services/userService');
    const report = await userService.scanLegacyIdentityRecords();
    const migration = await userService.migrateLegacyIdentityRecord('legacy@example.com');
    const batch = await userService.migrateSafeLegacyIdentityRecords();

    expect(scanFn).toHaveBeenCalledWith();
    expect(migrateFn).toHaveBeenCalledWith({ legacyDocId: 'legacy@example.com' });
    expect(migrateSafeFn).toHaveBeenCalledWith();
    expect(report.summary.safeMigrationCandidates).toBe(1);
    expect(migration.canonicalUid).toBe('uid-1');
    expect(batch.migratedCount).toBe(1);
  });
});
