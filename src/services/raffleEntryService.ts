import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CountryCode } from '@/types';

const COLLECTION = 'raffleEntries';

export interface RaffleEntryRecord {
  id?: string;
  responseId?: string;
  deviceId: string;
  country: CountryCode;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  source: 'survey' | 'external' | 'manual';
  createdAt?: string;
}

const compact = <T extends Record<string, unknown>>(obj: T): T => {
  const next = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
  return next as T;
};

export const raffleEntryService = {
  createEntry: async (entry: RaffleEntryRecord) => {
    await addDoc(collection(db, COLLECTION), compact({
      ...entry,
      createdAt: serverTimestamp(),
    }));
  },
  listEntries: async (): Promise<RaffleEntryRecord[]> => {
    const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Partial<RaffleEntryRecord & { createdAt?: { toDate?: () => Date } }>;
      return {
        id: docSnap.id,
        deviceId: data.deviceId || '',
        country: data.country || 'rwanda',
        contactName: data.contactName || '',
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        source: data.source || 'manual',
        responseId: data.responseId,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });
  },
};

