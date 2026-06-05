import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { CountryCode } from '@/types';

export interface SurveyQuestionAuditRow {
  question_id: string;
  viewed?: number;
  skipped?: number;
  dropped?: number;
  drop_off_rate?: number;
  skip_rate?: number;
  average_elapsed_seconds?: number;
}

export interface SurveyDemographicAuditRow {
  field: string;
  answered: number;
  prefer_not_to_say: number;
  completion_rate: number;
}

export interface SurveyFunnelAudit {
  ok: boolean;
  country?: CountryCode | null;
  total_starts: number;
  total_submissions: number;
  completion_rate: number;
  drop_off_by_question: SurveyQuestionAuditRow[];
  average_time_per_question: SurveyQuestionAuditRow[];
  skip_rate_by_question: SurveyQuestionAuditRow[];
  demographic_completion: SurveyDemographicAuditRow[];
  problematic_questions: SurveyQuestionAuditRow[];
  abandonment_proxy: {
    method: string;
    inactivity_minutes: number;
  };
}

const getSurveyFunnelAuditCallable = httpsCallable<
  { country?: CountryCode; inactivityMinutes?: number },
  SurveyFunnelAudit
>(functions, 'getSurveyFunnelAudit');

export const surveyFunnelService = {
  getAudit: async (options: { country?: CountryCode; inactivityMinutes?: number } = {}) => {
    const result = await getSurveyFunnelAuditCallable(options);
    return result.data;
  },
};
