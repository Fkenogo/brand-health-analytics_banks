import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CountryCode } from '@/auth/types';

export type InviteStatus = 'draft' | 'sent' | 'used' | 'expired';

export interface SubscriberInvite {
  id: string;
  token: string;
  userId: string;
  email: string;
  companyName: string;
  countries: CountryCode[];
  requestedCountries?: CountryCode[];
  contactName?: string;
  phone?: string;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

const INVITES_COLLECTION = 'invites';

export const inviteService = {
  listInvites: async (): Promise<SubscriberInvite[]> => {
    const snapshot = await getDocs(collection(db, INVITES_COLLECTION));
    return snapshot.docs.map(docSnap => docSnap.data() as SubscriberInvite);
  },
  getInviteByToken: async (token: string): Promise<SubscriberInvite | null> => {
    const q = query(collection(db, INVITES_COLLECTION), where('token', '==', token));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as SubscriberInvite;
  },
  createInvite: async (userId: string, email: string, companyName: string, countries: CountryCode[], validityDays: number): Promise<SubscriberInvite> => {
    const token = `invite_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const invite: SubscriberInvite = {
      id: `invite-${Date.now()}`,
      token,
      userId,
      email,
      companyName,
      countries,
      status: 'sent',
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    await setDoc(doc(db, INVITES_COLLECTION, invite.id), invite);
    return invite;
  },
  acceptInvite: async (invite: SubscriberInvite, data: { contactName: string; phone: string; requestedCountries: CountryCode[]; companyName: string }): Promise<void> => {
    await updateDoc(doc(db, INVITES_COLLECTION, invite.id), {
      status: 'used',
      usedAt: new Date().toISOString(),
      contactName: data.contactName,
      phone: data.phone,
      requestedCountries: data.requestedCountries,
      companyName: data.companyName,
    });
  },
};
