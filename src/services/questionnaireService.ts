import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Question } from '@/types';
import { QuestionnaireVersion } from '@/utils/questionnaireStore';

const COLLECTION = 'questionnaires';

const sortByCreatedAt = (a: QuestionnaireVersion, b: QuestionnaireVersion) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export const questionnaireService = {
  list: async (): Promise<QuestionnaireVersion[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const versions = snapshot.docs.map((docSnap) => docSnap.data() as QuestionnaireVersion);
    return versions.sort(sortByCreatedAt);
  },
  getActive: async (): Promise<QuestionnaireVersion | null> => {
    const snapshot = await getDocs(query(collection(db, COLLECTION), where('status', '==', 'active'), limit(1)));
    const docSnap = snapshot.docs[0];
    return docSnap ? (docSnap.data() as QuestionnaireVersion) : null;
  },
  getByWaveTag: async (waveTag: string): Promise<QuestionnaireVersion | null> => {
    const normalized = waveTag.toLowerCase();
    const versions = await questionnaireService.list();
    const match = versions.find(
      (version) => (version.waveTag || '').toLowerCase() === normalized || version.name.toLowerCase().includes(normalized)
    );
    return match || null;
  },
  ensureSeed: async (versions: QuestionnaireVersion[]) => {
    const existing = await questionnaireService.list();
    if (existing.length > 0) return;
    await Promise.all(
      versions.map((version) =>
        setDoc(doc(db, COLLECTION, version.id), version, { merge: true })
      )
    );
  },
  createDraftFrom: async (baseId: string): Promise<QuestionnaireVersion | null> => {
    const baseDoc = await getDoc(doc(db, COLLECTION, baseId));
    if (!baseDoc.exists()) return null;
    const base = baseDoc.data() as QuestionnaireVersion;
    const draft: QuestionnaireVersion = {
      ...base,
      id: `version-${Date.now()}`,
      name: `${base.name.replace('(Active)', '').replace('(Draft)', '').trim()} Draft`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      usedInWaves: [],
    };
    await setDoc(doc(db, COLLECTION, draft.id), draft);
    return draft;
  },
  setActive: async (id: string) => {
    const versions = await questionnaireService.list();
    await Promise.all(
      versions.map((version) => {
        if (version.id === id) {
          return updateDoc(doc(db, COLLECTION, version.id), {
            status: 'active',
            name: version.name.replace('(Draft)', '').trim(),
          });
        }
        if (version.status === 'active') {
          return updateDoc(doc(db, COLLECTION, version.id), { status: 'archived' });
        }
        return Promise.resolve();
      })
    );
  },
  updateQuestion: async (versionId: string, questionId: string, patch: Partial<Question>) => {
    const versionDoc = await getDoc(doc(db, COLLECTION, versionId));
    if (!versionDoc.exists()) return;
    const version = versionDoc.data() as QuestionnaireVersion;
    if (version.status !== 'draft' || (version.usedInWaves?.length || 0) > 0) return;
    const questions = version.questions.map((q) => (q.id === questionId ? { ...q, ...patch } : q));
    await updateDoc(doc(db, COLLECTION, versionId), { questions });
  },
  updateVersionMeta: async (versionId: string, patch: Partial<QuestionnaireVersion>) => {
    await updateDoc(doc(db, COLLECTION, versionId), patch);
  },
  addQuestion: async (versionId: string, question: Question) => {
    const versionDoc = await getDoc(doc(db, COLLECTION, versionId));
    if (!versionDoc.exists()) return;
    const version = versionDoc.data() as QuestionnaireVersion;
    if (version.status !== 'draft' || (version.usedInWaves?.length || 0) > 0) return;
    const questions = [...version.questions, question];
    await updateDoc(doc(db, COLLECTION, versionId), { questions });
  },
  removeQuestion: async (versionId: string, questionId: string) => {
    const versionDoc = await getDoc(doc(db, COLLECTION, versionId));
    if (!versionDoc.exists()) return;
    const version = versionDoc.data() as QuestionnaireVersion;
    if (version.status !== 'draft' || (version.usedInWaves?.length || 0) > 0) return;
    const questions = version.questions.filter((q) => q.id !== questionId);
    await updateDoc(doc(db, COLLECTION, versionId), { questions });
  },
  moveQuestion: async (versionId: string, fromIndex: number, toIndex: number) => {
    const versionDoc = await getDoc(doc(db, COLLECTION, versionId));
    if (!versionDoc.exists()) return;
    const version = versionDoc.data() as QuestionnaireVersion;
    if (version.status !== 'draft' || (version.usedInWaves?.length || 0) > 0) return;
    const questions = [...version.questions];
    const [item] = questions.splice(fromIndex, 1);
    questions.splice(toIndex, 0, item);
    await updateDoc(doc(db, COLLECTION, versionId), { questions });
  },
};
