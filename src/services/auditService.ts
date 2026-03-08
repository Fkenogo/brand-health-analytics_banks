import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';

export interface AuditEvent {
  id?: string;
  action: string;
  actorEmail?: string;
  targetId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const AUDIT_COLLECTION = 'audit';
const logAuditCallable = httpsCallable<
  Omit<AuditEvent, 'id' | 'timestamp'>,
  { ok: boolean }
>(functions, 'logAuditEvent');

export const auditService = {
  log: async (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    await logAuditCallable(event);
  },
  list: async (): Promise<AuditEvent[]> => {
    const q = query(collection(db, AUDIT_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as AuditEvent) }));
  },
};
