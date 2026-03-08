import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CountryCode } from '@/types';
import { PANEL_CONFIG } from '@/auth/utils';

const PANEL_COLLECTION = 'panelists';
const COOLDOWN_MS = PANEL_CONFIG.COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type PanelSource = 'survey' | 'external' | 'manual';
export type PanelStatus = 'active' | 'inactive' | 'removed';

export interface PanelistRecord {
  panelistId: string;
  deviceId?: string;
  country: CountryCode;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  source: PanelSource;
  status: PanelStatus;
  lastParticipationAt?: string;
  nextEligibleAt?: string;
  participationCount: number;
  lastResponseId?: string;
  createdAt: string;
  updatedAt: string;
}

const buildPanelistId = (deviceId: string, country: CountryCode) => `${deviceId}_${country}`;

const buildNextEligible = (isoDate: string) => new Date(new Date(isoDate).getTime() + COOLDOWN_MS).toISOString();
const compact = <T extends Record<string, unknown>>(obj: T): T => {
  const next = Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
  return next as T;
};

export const panelService = {
  buildPanelistId,
  buildRecruitmentLink: (country: CountryCode) => {
    return `${window.location.origin}/survey/${country}?source=external`;
  },
  recordParticipation: async (input: {
    deviceId: string;
    country: CountryCode;
    responseId?: string;
    source?: PanelSource;
  }) => {
    const panelistId = buildPanelistId(input.deviceId, input.country);
    const panelistRef = doc(db, PANEL_COLLECTION, panelistId);
    const now = new Date().toISOString();
    const source = input.source || 'survey';
    const nextEligibleAt = buildNextEligible(now);
    await setDoc(panelistRef, compact({
      panelistId,
      deviceId: input.deviceId,
      country: input.country,
      source,
      status: 'active',
      lastParticipationAt: now,
      nextEligibleAt,
      participationCount: increment(1),
      lastResponseId: input.responseId || null,
      createdAt: serverTimestamp(),
      updatedAt: now,
    }), { merge: true });
  },
  savePanelContact: async (input: {
    deviceId: string;
    country: CountryCode;
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    source?: PanelSource;
  }) => {
    const panelistId = buildPanelistId(input.deviceId, input.country);
    const panelistRef = doc(db, PANEL_COLLECTION, panelistId);
    const now = new Date().toISOString();
    await setDoc(panelistRef, compact({
      panelistId,
      deviceId: input.deviceId,
      country: input.country,
      contactName: input.contactName,
      contactEmail: input.contactEmail || null,
      contactPhone: input.contactPhone || null,
      source: input.source || 'survey',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: now,
    }), { merge: true });
  },
  listPanelists: async (): Promise<PanelistRecord[]> => {
    const snapshot = await getDocs(query(collection(db, PANEL_COLLECTION)));
    return snapshot.docs.map((d) => d.data() as PanelistRecord);
  },
  createManualPanelist: async (input: {
    country: CountryCode;
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    source?: PanelSource;
  }) => {
    const now = new Date().toISOString();
    const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const panelist = compact({
      panelistId: id,
      country: input.country,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      source: input.source || 'manual',
      status: 'active',
      participationCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    await setDoc(doc(db, PANEL_COLLECTION, id), panelist);
  },
  updateStatus: async (panelistId: string, status: PanelStatus) => {
    await updateDoc(doc(db, PANEL_COLLECTION, panelistId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  },
  removePanelist: async (panelistId: string) => {
    await deleteDoc(doc(db, PANEL_COLLECTION, panelistId));
  },
};
