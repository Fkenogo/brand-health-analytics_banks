import { collection, addDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AuditEvent {
  id?: string;
  action: string;
  actorEmail?: string;
  targetId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

const AUDIT_COLLECTION = 'audit';

export const auditService = {
  log: async (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    await addDoc(collection(db, AUDIT_COLLECTION), {
      ...event,
      timestamp: new Date().toISOString(),
    });
  },
  list: async (): Promise<AuditEvent[]> => {
    const q = query(collection(db, AUDIT_COLLECTION), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as AuditEvent) }));
  },
};
