import { addDoc, collection, doc, getDocs, query, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SurveyResponse } from '@/types';

const RESPONSES_COLLECTION = 'responses';

export const responseService = {
  addResponse: async (data: Partial<SurveyResponse>) => {
    await addDoc(collection(db, RESPONSES_COLLECTION), {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    });
  },
  listResponses: async (): Promise<SurveyResponse[]> => {
    const snapshot = await getDocs(query(collection(db, RESPONSES_COLLECTION)));
    return snapshot.docs.map(docSnap => ({
      ...(docSnap.data() as SurveyResponse),
      _docId: docSnap.id,
    }));
  },
  updateResponse: async (docId: string, patch: Partial<SurveyResponse>) => {
    await updateDoc(doc(db, RESPONSES_COLLECTION, docId), {
      ...patch,
      _updatedAt: new Date().toISOString(),
    });
  },
};
