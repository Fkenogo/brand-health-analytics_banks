import { addDoc, collection, doc, getDocs, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CountryCode } from '@/types';

const COLLECTION = 'raffleCampaigns';

export type EntrySource = 'all' | 'survey' | 'external' | 'manual';
export type ContactRequirement = 'any' | 'email' | 'phone';
export type CampaignStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface RaffleEligibility {
  completedOnly: boolean;
  source: EntrySource;
  contactRequired: ContactRequirement;
}

export interface CampaignWinner {
  id: string;
  entryId: string;
  responseId?: string;
  deviceId: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  selectedAt: string;
  method: 'random' | 'manual';
}

export interface RaffleCampaign {
  id?: string;
  name: string;
  country: CountryCode;
  startDate: string;
  endDate: string;
  maxWinners: number;
  status: CampaignStatus;
  eligibility: RaffleEligibility;
  winners: CampaignWinner[];
  createdAt: string;
  updatedAt: string;
}

const compact = <T extends Record<string, unknown>>(obj: T): T => {
  const next = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
  return next as T;
};

export const raffleCampaignService = {
  list: async (): Promise<RaffleCampaign[]> => {
    const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((d) => {
      const data = d.data() as Partial<RaffleCampaign>;
      return {
        id: d.id,
        name: data.name || 'Untitled Campaign',
        country: data.country as CountryCode,
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        maxWinners: data.maxWinners || 1,
        status: data.status || 'active',
        eligibility: data.eligibility || {
          completedOnly: true,
          source: 'all',
          contactRequired: 'any',
        },
        winners: data.winners || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || data.createdAt || new Date().toISOString(),
      };
    });
  },
  create: async (input: Omit<RaffleCampaign, 'id' | 'winners' | 'createdAt' | 'updatedAt' | 'status'> & { status?: CampaignStatus }) => {
    const now = new Date().toISOString();
    await addDoc(collection(db, COLLECTION), {
      ...input,
      status: input.status || 'active',
      winners: [],
      createdAt: now,
      updatedAt: now,
    });
  },
  updateWinners: async (campaignId: string, winners: CampaignWinner[]) => {
    await updateDoc(doc(db, COLLECTION, campaignId), {
      winners: winners.map((winner) => compact(winner)),
      updatedAt: new Date().toISOString(),
    });
  },
  updateCampaign: async (campaignId: string, patch: Partial<RaffleCampaign>) => {
    await updateDoc(doc(db, COLLECTION, campaignId), {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  },
  remove: async (campaignId: string) => {
    await setDoc(doc(db, COLLECTION, campaignId), { status: 'archived', updatedAt: new Date().toISOString() }, { merge: true });
  },
};
