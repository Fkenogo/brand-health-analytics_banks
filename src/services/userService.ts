import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { User, UserStatus, Permission, CountryCode } from '@/auth/types';

const USERS_COLLECTION = 'users';
const ENTITLEMENT_CONTROLLED_FIELDS = new Set([
  'status',
  'subscription_tier',
  'subscription_addon_ai',
  'assignedCountries',
]);

const createDraftSubscriberCallable = httpsCallable<{ email: string; companyName: string }, { user: User }>(
  functions,
  'adminCreateDraftSubscriber',
);
const updateSubscriberStatusCallable = httpsCallable<
  { uid: string; status: UserStatus },
  { ok: boolean; uid: string; claims_sync_pending: boolean; token_refresh_required: boolean }
>(functions, 'updateSubscriberStatus');
const updateSubscriberTierCallable = httpsCallable<
  { uid: string; subscription_tier: 'free' | 'standard' },
  { ok: boolean; uid: string; claims_sync_pending: boolean; token_refresh_required: boolean }
>(functions, 'updateSubscriberTier');
const updateSubscriberCountriesCallable = httpsCallable<
  { uid: string; assignedCountries: CountryCode[] },
  { ok: boolean; uid: string; claims_sync_pending: boolean; token_refresh_required: boolean }
>(functions, 'updateSubscriberCountries');
const updateSubscriberAiAddonCallable = httpsCallable<
  { uid: string; subscription_addon_ai: boolean },
  { ok: boolean; uid: string; claims_sync_pending: boolean; token_refresh_required: boolean }
>(functions, 'updateSubscriberAiAddon');
const createFreeSubscriberSelfServeCallable = httpsCallable<
  { companyName?: string; contactName?: string; requestedCountry: CountryCode },
  { ok: boolean; user: User; token_refresh_required: boolean }
>(functions, 'createFreeSubscriberSelfServe');
const scanLegacyUserRecordsCallable = httpsCallable<
  void,
  { ok: boolean; summary: LegacyUserIdentitySummary; records: LegacyUserIdentityRecord[] }
>(functions, 'scanLegacyUserRecords');
const migrateLegacyUserRecordCallable = httpsCallable<
  { legacyDocId: string },
  { ok: boolean; legacyDocId: string; canonicalUid: string; migrationStatus: 'migrated' | 'shadowed' }
>(functions, 'migrateLegacyUserRecord');
const migrateSafeLegacyUserRecordsCallable = httpsCallable<
  void,
  { ok: boolean; migrated: Array<{ legacyDocId: string; canonicalUid: string; migrationStatus: 'migrated' | 'shadowed' }>; migratedCount: number; skippedCount: number }
>(functions, 'migrateSafeLegacyUserRecords');

export interface LegacyUserIdentitySummary {
  totalUsers: number;
  legacyRecords: number;
  emailKeyedDocs: number;
  idMismatches: number;
  duplicateEmails: number;
  duplicateAuthUids: number;
  alreadyMigrated: number;
  safeMigrationCandidates: number;
}

export interface LegacyUserIdentityRecord {
  docId: string;
  canonicalUid: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  migratedToUid: string | null;
  issueTypes: string[];
  migrationAction: 'copy_to_uid' | 'link_to_existing_uid' | null;
  safeToMigrate: boolean;
}

export type SubscriberAdminCommandDiagnosis =
  | { kind: 'missing_admin_claim'; message: string }
  | { kind: 'permission_denied'; message: string }
  | { kind: 'validation_failure'; message: string }
  | { kind: 'callable_unavailable'; message: string }
  | { kind: 'unknown'; message: string };

export const diagnoseSubscriberAdminCommandError = (error: unknown): SubscriberAdminCommandDiagnosis => {
  const code = String((error as { code?: string })?.code || '').toLowerCase();
  const message = String((error as { message?: string })?.message || '');
  const lowerMessage = message.toLowerCase();

  if (code.includes('permission-denied')) {
    return lowerMessage.includes('admin')
      ? {
          kind: 'missing_admin_claim',
          message: 'Admin claim is missing or stale for this action. Repair admin access, refresh the token, and retry.',
        }
      : {
          kind: 'permission_denied',
          message: 'This subscriber management action was denied by backend permissions.',
        };
  }

  if (code.includes('invalid-argument') || code.includes('failed-precondition')) {
    return {
      kind: 'validation_failure',
      message: message || 'Subscriber update failed validation. Review the selected status, tier, countries, or AI add-on combination.',
    };
  }

  if (code.includes('functions/not-found') || code.includes('unavailable') || lowerMessage.includes('status code: 404')) {
    return {
      kind: 'callable_unavailable',
      message: 'Subscriber management backend is not deployed or not reachable. Deploy the latest Cloud Functions before retrying.',
    };
  }

  return {
    kind: 'unknown',
    message: message || 'Subscriber management action failed.',
  };
};

const isCanonicalUserDoc = (user: User): boolean => !user.migratedToUid
  && user.legacyMigrationStatus !== 'shadowed'
  && user.legacyMigrationStatus !== 'migrated';

export const userService = {
  listUsers: async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs
      .map((docSnap) => docSnap.data() as User)
      .filter(isCanonicalUserDoc);
  },

  listSubscribers: async (): Promise<User[]> => {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'subscriber'));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((docSnap) => docSnap.data() as User)
      .filter(isCanonicalUserDoc);
  },

  getUserById: async (uid: string): Promise<User | null> => {
    const ref = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as User) : null;
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const canonicalMatch = snapshot.docs
      .map((docSnap) => docSnap.data() as User)
      .find(isCanonicalUserDoc);
    return canonicalMatch || (snapshot.docs[0].data() as User);
  },

  createAdmin: async (uid: string, email: string): Promise<User> => {
    const user: User = {
      id: uid,
      email,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      permissions: [],
      emailVerified: true,
      subscription_tier: 'standard',
      subscription_addon_ai: true,
      ai_usage_count: 0,
      ai_usage_reset_date: new Date().toISOString(),
      entitlements_version: 1,
    };
    await setDoc(doc(db, USERS_COLLECTION, uid), user);
    return user;
  },

  createInitialAdmin: async (uid: string, email: string): Promise<User> => {
    const user: User & { bootstrap: boolean } = {
      id: uid,
      email,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      permissions: [],
      emailVerified: true,
      bootstrap: true,
      subscription_tier: 'standard',
      subscription_addon_ai: true,
      ai_usage_count: 0,
      ai_usage_reset_date: new Date().toISOString(),
      entitlements_version: 1,
    };
    const batch = writeBatch(db);
    batch.set(doc(db, USERS_COLLECTION, uid), user);
    batch.set(doc(db, 'config', 'bootstrap'), {
      createdAt: new Date().toISOString(),
      adminId: uid,
      email,
    });
    await batch.commit();
    return user;
  },

  createDraftSubscriber: async (email: string, companyName: string): Promise<User> => {
    const result = await createDraftSubscriberCallable({ email: email.toLowerCase(), companyName });
    return result.data.user;
  },

  createSubscriberProfile: async (): Promise<never> => {
    throw new Error('Deprecated: subscriber profile creation is backend-mediated via invite acceptance.');
  },

  createFreeSubscriberSelfServe: async (input: {
    companyName?: string;
    contactName?: string;
    requestedCountry: CountryCode;
  }): Promise<User> => {
    const result = await createFreeSubscriberSelfServeCallable(input);
    return result.data.user;
  },

  updateUser: async (id: string, patch: Partial<User>): Promise<void> => {
    const forbiddenField = Object.keys(patch).find((field) => ENTITLEMENT_CONTROLLED_FIELDS.has(field));
    if (forbiddenField) {
      throw new Error(`Direct updateUser writes are blocked for entitlement field: ${forbiddenField}`);
    }
    await updateDoc(doc(db, USERS_COLLECTION, id), patch);
  },

  setUserStatus: async (id: string, status: UserStatus): Promise<void> => {
    await updateSubscriberStatusCallable({ uid: id, status });
  },

  setUserCountries: async (id: string, countries: CountryCode[]): Promise<void> => {
    await updateSubscriberCountriesCallable({ uid: id, assignedCountries: countries });
  },

  setUserTier: async (id: string, subscription_tier: 'free' | 'standard'): Promise<void> => {
    await updateSubscriberTierCallable({ uid: id, subscription_tier });
  },

  setUserAiAddon: async (id: string, subscription_addon_ai: boolean): Promise<void> => {
    await updateSubscriberAiAddonCallable({ uid: id, subscription_addon_ai });
  },

  setUserPermissions: async (id: string, permissions: Permission[]): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, id), { permissions });
  },

  scanLegacyIdentityRecords: async (): Promise<{ summary: LegacyUserIdentitySummary; records: LegacyUserIdentityRecord[] }> => {
    const result = await scanLegacyUserRecordsCallable();
    return result.data;
  },

  migrateLegacyIdentityRecord: async (legacyDocId: string): Promise<{ legacyDocId: string; canonicalUid: string; migrationStatus: 'migrated' | 'shadowed' }> => {
    const result = await migrateLegacyUserRecordCallable({ legacyDocId });
    return result.data;
  },

  migrateSafeLegacyIdentityRecords: async (): Promise<{ migrated: Array<{ legacyDocId: string; canonicalUid: string; migrationStatus: 'migrated' | 'shadowed' }>; migratedCount: number; skippedCount: number }> => {
    const result = await migrateSafeLegacyUserRecordsCallable();
    return result.data;
  },
};
