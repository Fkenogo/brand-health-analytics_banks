import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';
import { CountryCode, SurveyResponse } from '@/types';
import { normalizeResponseForAnalyticsRead } from '@/utils/survey/normalization';

const RESPONSES_COLLECTION = 'responses';
const responseCache = new Map<string, SurveyResponse[]>();
const listDashboardResponsesCallable = httpsCallable<
  { country: CountryCode },
  { ok: boolean; responses: SurveyResponse[] }
>(functions, 'listDashboardResponses');
const submitPublicSurveyResponseCallable = httpsCallable<
  { response: Partial<SurveyResponse>; trapField?: string },
  {
    ok: boolean;
    responseId: string;
    flags: {
      suspicious_submission_flag: boolean;
      repeat_submission_flag: boolean;
      completion_speed_flag: boolean;
      duplicate_payload_flag: boolean;
      app_check_verified: boolean;
    };
  }
>(functions, 'submitPublicSurveyResponse');
const submitPublicFollowUpContactCallable = httpsCallable<
  {
    responseId?: string;
    deviceId: string;
    country: CountryCode;
    joinPanel: boolean;
    enterRaffle: boolean;
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    source?: 'survey' | 'external' | 'manual';
    language?: 'en' | 'rw' | 'fr';
  },
  {
    ok: boolean;
    saved: {
      panel: boolean;
      raffle: boolean;
      responseId?: string | null;
    };
  }
>(functions, 'submitPublicFollowUpContact');

const toMessage = (error: unknown): string => {
  const code = String((error as { code?: string })?.code || '').toLowerCase();
  const message = String((error as { message?: string })?.message || '');
  const details = (error as { details?: { code?: string; nextAllowedAt?: string } })?.details;

  if (code.includes('failed-precondition') && details?.code === 'cooldown_active') {
    if (details.nextAllowedAt) {
      return `This device has already submitted a survey recently. Please return after ${new Date(details.nextAllowedAt).toLocaleDateString()}.`;
    }
    return 'This device has already submitted a survey recently. Please return later.';
  }

  if (code.includes('invalid-argument') && details?.code === 'submission_too_fast') {
    return 'Submission was too fast to validate. Please review your answers and try again.';
  }

  if (code.includes('invalid-argument') && details?.code === 'abuse_detected') {
    return 'Submission rejected. Please refresh and try again.';
  }

  if (code.includes('app-check') || code.includes('unauthenticated')) {
    return 'Survey security verification is unavailable right now. Please retry in a moment. If it keeps failing, contact support and mention App Check verification.';
  }

  return message || 'We could not save your response. Please retry.';
};

export const responseService = {
  submitPublicResponse: async (data: Partial<SurveyResponse>, trapField = '') => {
    try {
      const result = await submitPublicSurveyResponseCallable({
        response: {
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        },
        trapField,
      });
      return result.data;
    } catch (error) {
      throw new Error(toMessage(error));
    }
  },
  submitPublicFollowUpContact: async (data: {
    responseId?: string;
    deviceId: string;
    country: CountryCode;
    joinPanel: boolean;
    enterRaffle: boolean;
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    source?: 'survey' | 'external' | 'manual';
    language?: 'en' | 'rw' | 'fr';
  }) => {
    try {
      const result = await submitPublicFollowUpContactCallable(data);
      return result.data;
    } catch (error) {
      throw new Error(toMessage(error));
    }
  },
  listResponses: async (options?: { country?: CountryCode; forceRefresh?: boolean }): Promise<SurveyResponse[]> => {
    const country = options?.country || null;
    const cacheKey = country ? `country:${country}` : 'all';
    if (!options?.forceRefresh && responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey) || [];
    }

    const queries = country
      ? [
          query(collection(db, RESPONSES_COLLECTION), where('selected_country', '==', country)),
          query(collection(db, RESPONSES_COLLECTION), where('country', '==', country)),
        ]
      : [query(collection(db, RESPONSES_COLLECTION))];

    const snapshots = await Promise.all(queries.map((nextQuery) => getDocs(nextQuery)));
    const seenDocIds = new Set<string>();
    const rows: SurveyResponse[] = [];

    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        if (seenDocIds.has(docSnap.id)) return;
        seenDocIds.add(docSnap.id);
        rows.push({
          ...normalizeResponseForAnalyticsRead(docSnap.data() as SurveyResponse),
          _docId: docSnap.id,
        });
      });
    });

    responseCache.set(cacheKey, rows);
    return rows;
  },
  listDashboardResponses: async (options: { country: CountryCode; forceRefresh?: boolean }): Promise<SurveyResponse[]> => {
    const cacheKey = `dashboard:${options.country}`;
    if (!options?.forceRefresh && responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey) || [];
    }

    const result = await listDashboardResponsesCallable({ country: options.country });
    const rows = (result.data.responses || []).map((row) => normalizeResponseForAnalyticsRead(row as SurveyResponse));
    responseCache.set(cacheKey, rows);
    return rows;
  },
  listDashboardResponsesWithFallback: async (
    options: { country: CountryCode; forceRefresh?: boolean },
  ): Promise<{ responses: SurveyResponse[]; source: 'callable' | 'firestore'; fallbackReason: string | null }> => {
    const cacheKey = `dashboard:${options.country}`;
    if (!options?.forceRefresh && responseCache.has(cacheKey)) {
      return {
        responses: responseCache.get(cacheKey) || [],
        source: 'callable',
        fallbackReason: null,
      };
    }

    try {
      const responses = await responseService.listDashboardResponses(options);
      return {
        responses,
        source: 'callable',
        fallbackReason: null,
      };
    } catch (error) {
      const fallbackReason = String((error as { message?: string })?.message || '')
        || (error instanceof Error ? error.message : 'Dashboard response callable failed.');
      const responses = await responseService.listResponses({
        country: options.country,
        forceRefresh: options.forceRefresh,
      });
      responseCache.set(cacheKey, responses);
      return {
        responses,
        source: 'firestore',
        fallbackReason,
      };
    }
  },
  updateResponse: async (docId: string, patch: Partial<SurveyResponse>) => {
    await updateDoc(doc(db, RESPONSES_COLLECTION, docId), {
      ...patch,
      _updatedAt: new Date().toISOString(),
    });
    responseCache.clear();
  },
};
