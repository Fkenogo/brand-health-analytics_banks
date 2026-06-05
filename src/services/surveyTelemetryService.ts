import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { CountryCode, Language, QuestionType } from '@/types';

export type SurveyTelemetryEventType =
  | 'survey_session_started'
  | 'consent_viewed'
  | 'consent_confirmed'
  | 'question_viewed'
  | 'question_answered'
  | 'question_skipped'
  | 'survey_submitted'
  | 'survey_abandoned';

export interface SurveyTelemetryEvent {
  sessionId: string;
  eventType: SurveyTelemetryEventType;
  country?: CountryCode;
  language?: Language;
  responseId?: string;
  questionId?: string;
  questionType?: QuestionType;
  elapsedSeconds?: number;
  metadata?: Record<string, unknown>;
}

const ACTIVE_SESSION_KEY = 'brandedge_active_survey_session_v1';

interface StoredSurveySession {
  sessionId: string;
  country: CountryCode;
  language: Language;
  responseId?: string;
  submitted?: boolean;
  lastQuestionId?: string;
  lastQuestionType?: QuestionType;
  lastSeenAt: string;
}

const logSurveyTelemetryCallable = httpsCallable<
  SurveyTelemetryEvent,
  { ok: boolean; recordedAt: string }
>(functions, 'logSurveyTelemetryEvent');

const readStoredSession = (): StoredSurveySession | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSurveySession;
  } catch {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    return null;
  }
};

const writeStoredSession = (session: StoredSurveySession | null) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
};

export const surveyTelemetryService = {
  track: async (event: SurveyTelemetryEvent) => {
    try {
      await logSurveyTelemetryCallable(event);
    } catch (error) {
      console.warn('Survey telemetry failed to send.', error);
    }
  },
  getActiveSession: () => readStoredSession(),
  persistActiveSession: (session: StoredSurveySession) => {
    writeStoredSession(session);
  },
  clearActiveSession: () => {
    writeStoredSession(null);
  },
  updateLastSeen: (patch: Partial<StoredSurveySession>) => {
    const existing = readStoredSession();
    if (!existing) return;
    writeStoredSession({
      ...existing,
      ...patch,
      lastSeenAt: new Date().toISOString(),
    });
  },
};
