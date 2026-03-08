import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserStatus, Permission, CountryCode } from '@/auth/types';

const USERS_COLLECTION = 'users';

export const userService = {
  listUsers: async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION));
    return snapshot.docs.map(docSnap => docSnap.data() as User);
  },
  listSubscribers: async (): Promise<User[]> => {
    const q = query(collection(db, USERS_COLLECTION), where('role', '==', 'subscriber'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => docSnap.data() as User);
  },
  getUserById: async (uid: string): Promise<User | null> => {
    const ref = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as User) : null;
  },
  getUserByEmail: async (email: string): Promise<User | null> => {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
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
    const user: User = {
      id: email,
      email,
      role: 'subscriber',
      status: 'draft',
      createdAt: new Date().toISOString(),
      companyName,
      assignedCountries: [],
      emailVerified: false,
      permissions: [],
      subscription_tier: 'free',
      subscription_addon_ai: false,
      ai_usage_count: 0,
      ai_usage_reset_date: new Date().toISOString(),
    };
    await setDoc(doc(db, USERS_COLLECTION, user.id), user);
    return user;
  },
  createSubscriberProfile: async (uid: string, data: Partial<User>): Promise<User> => {
    const user: User & { authUid: string } = {
      id: data.email || uid,
      email: data.email || '',
      role: 'subscriber',
      status: 'pending',
      createdAt: new Date().toISOString(),
      companyName: data.companyName || data.email || '',
      assignedCountries: data.assignedCountries || [],
      requestedCountries: data.requestedCountries || [],
      contactName: data.contactName,
      phone: data.phone,
      emailVerified: false,
      permissions: [],
      subscription_tier: 'free',
      subscription_addon_ai: false,
      ai_usage_count: 0,
      ai_usage_reset_date: new Date().toISOString(),
      authUid: uid,
    };
    await setDoc(doc(db, USERS_COLLECTION, user.id), user, { merge: true });
    return user;
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
