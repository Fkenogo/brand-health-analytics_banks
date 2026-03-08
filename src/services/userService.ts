import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { User, UserStatus, Permission, CountryCode } from '@/auth/types';

const USERS_COLLECTION = 'users';

const createDraftSubscriberCallable = httpsCallable<{ email: string; companyName: string }, { user: User }>(
  functions,
  'adminCreateDraftSubscriber',
);

export const userService = {
  listUsers: async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map((docSnap) => docSnap.data() as User);
  },

  listSubscribers: async (): Promise<User[]> => {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'subscriber'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as User);
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
    return snapshot.docs[0].data() as User;
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

  updateUser: async (id: string, patch: Partial<User>): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, id), patch);
  },

  setUserStatus: async (id: string, status: UserStatus): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, id), { status });
  },

  setUserCountries: async (id: string, countries: CountryCode[]): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, id), { assignedCountries: countries });
  },

  setUserPermissions: async (id: string, permissions: Permission[]): Promise<void> => {
    await updateDoc(doc(db, USERS_COLLECTION, id), { permissions });
  },
};
