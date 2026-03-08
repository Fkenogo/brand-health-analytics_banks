import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
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

export interface PublicInviteView {
  email: string;
  companyName: string;
  countries: CountryCode[];
  expiresAt: string;
}

export interface InviteValidationResult {
  valid: boolean;
  reason?: 'not_found' | 'expired' | 'used';
  invite?: PublicInviteView;
}

const INVITES_COLLECTION = 'invites';

const adminCreateInviteCallable = httpsCallable<
  { userId: string; countries: CountryCode[]; validityDays: number },
  { invite: SubscriberInvite }
>(functions, 'adminCreateInvite');

const validateInviteCallable = httpsCallable<{ token: string }, InviteValidationResult>(functions, 'validateInvite');

const acceptInviteCallable = httpsCallable<
  { token: string; contactName: string; phone: string; requestedCountries: CountryCode[]; companyName: string },
  { ok: boolean; subscriber_state: 'pending'; claims_synced: boolean }
>(functions, 'acceptInvite');

export const inviteService = {
  listInvites: async (): Promise<SubscriberInvite[]> => {
    const snapshot = await getDocs(collection(db, INVITES_COLLECTION));
    return snapshot.docs.map((docSnap) => docSnap.data() as SubscriberInvite);
  },

  getInviteByToken: async (token: string): Promise<InviteValidationResult> => {
    const result = await validateInviteCallable({ token });
    return result.data;
  },

  createInvite: async (
    userId: string,
    _email: string,
    _companyName: string,
    countries: CountryCode[],
    validityDays: number,
  ): Promise<SubscriberInvite> => {
    const result = await adminCreateInviteCallable({ userId, countries, validityDays });
    return result.data.invite;
  },

  acceptInvite: async (
    token: string,
    data: { contactName: string; phone: string; requestedCountries: CountryCode[]; companyName: string },
  ): Promise<{ ok: boolean; subscriber_state: 'pending'; claims_synced: boolean }> => {
    const result = await acceptInviteCallable({
      token,
      contactName: data.contactName,
      phone: data.phone,
      requestedCountries: data.requestedCountries,
      companyName: data.companyName,
    });
    return result.data;
  },
};
