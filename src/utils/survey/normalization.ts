import { Question, SurveyResponse, CountryCode, Language } from '@/types';

export type PreferredSource = 'auto_single_usage' | 'respondent_selected';

const ANALYTICS_FIELD_ALLOWLIST: Array<keyof SurveyResponse> = [
  'response_id',
  'device_id',
  'country',
  'selected_country',
  'timestamp',
  'duration_seconds',
  'question_timings',
  'language_at_submission',
  '_status',
  'consent',
  'b1_recency',
  'b2_age',
  'c1_top_of_mind',
  'c2_spontaneous',
  'c3_aware_banks',
  'c1_recognized_bank_id',
  'c1_recognition_confidence',
  'c2_recognized_bank_ids',
  'c2_unrecognized_entries',
  'c3_total_awareness',
  'raw_input_q1',
  'recognized_bank_id_q1',
  'recognition_confidence_q1',
  'raw_input_q2',
  'recognized_bank_ids_q2',
  'unrecognized_entries_q2',
  'top_of_mind_bank_id',
  'spontaneous_awareness_bank_ids',
  'assisted_awareness_bank_ids',
  'total_awareness_bank_ids',
  'c4_ever_used',
  'c5_currently_using',
  'c6_main_bank',
  'c6_often_used',
  'preferred_bank',
  'preferred_bank_source',
  'committed_bank',
  'committed_bank_source',
  'bank_count',
  'c9_would_consider',
  'c9_favourites',
  'c9_interested_dont_know',
  'c9_never_consider',
  'c9_only_consider',
  'c10_nps',
  'd2_future_intent',
  'd3_relevance',
  'd4_popularity',
  'd5_committed',
  'd7_nps',
  'e1_employment',
  'e2_education',
  'e3_gender',
  'gender',
];

const COUNTRY_SET: ReadonlyArray<CountryCode> = ['rwanda', 'uganda', 'burundi'];

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter((item, index, list) => item.length > 0 && list.indexOf(item) === index);
};

const asRecordNumber = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value).reduce<Record<string, number>>((acc, [key, raw]) => {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      acc[key] = raw;
    }
    return acc;
  }, {});
};

const coerceCountry = (value: unknown, fallback: CountryCode): CountryCode => {
  const normalized = String(value || '').toLowerCase().trim() as CountryCode;
  return COUNTRY_SET.includes(normalized) ? normalized : fallback;
};

export const isAnsweredValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return false;
    return entries.some(([, nestedValue]) => isAnsweredValue(nestedValue));
  }

  return false;
};

export const isMatrixAnswerComplete = (
  question: Question,
  value: unknown,
  formData: Partial<SurveyResponse>,
): boolean => {
  const matrixValues = value as Record<string, unknown> | undefined;
  if (!matrixValues || typeof matrixValues !== 'object' || Array.isArray(matrixValues)) return false;

  const choices = question.filterChoices ? question.filterChoices(formData as SurveyResponse) : question.choices || [];
  if (choices.length === 0) return false;

  return choices.every((choice) => {
    const cellValue = matrixValues[choice.value];
    return typeof cellValue === 'number' && Number.isFinite(cellValue);
  });
};

export const isQuestionAnswered = (question: Question, formData: Partial<SurveyResponse>): boolean => {
  const value = formData[question.id as keyof SurveyResponse];
  if (question.type === 'rating-matrix') {
    return isMatrixAnswerComplete(question, value, formData);
  }
  return isAnsweredValue(value);
};

export const validateRequiredQuestions = (
  questions: Question[],
  formData: Partial<SurveyResponse>,
): { valid: boolean; missingQuestionIds: string[] } => {
  const missingQuestionIds = questions
    .filter((question) => question.required)
    .filter((question) => !isQuestionAnswered(question, formData))
    .map((question) => question.id);

  return {
    valid: missingQuestionIds.length === 0,
    missingQuestionIds,
  };
};

interface NormalizeInput {
  data: Partial<SurveyResponse>;
  responseId: string;
  deviceId: string;
  language: Language;
  status: 'completed' | 'terminated';
  startedAtMs: number;
  nowIso?: string;
}

interface NormalizeOutput {
  ok: boolean;
  errors: string[];
  response?: SurveyResponse;
}

const buildAnalyticsSafeResponse = (source: Partial<SurveyResponse>): Partial<SurveyResponse> => {
  return ANALYTICS_FIELD_ALLOWLIST.reduce<Partial<SurveyResponse>>((acc, key) => {
    if (source[key] !== undefined) {
      (acc as Record<string, unknown>)[key] = source[key] as unknown;
    }
    return acc;
  }, {});
};

export const normalizeResponseForSubmission = (input: NormalizeInput): NormalizeOutput => {
  const nowIso = input.nowIso || new Date().toISOString();
  const selectedCountry = coerceCountry(input.data.selected_country || input.data.country, 'rwanda');
  const currentlyUsing = asStringArray(input.data.c5_currently_using);
  const bankCount = currentlyUsing.length;

  let preferredBank = String(
    input.data.preferred_bank
      || input.data.c6_main_bank
      || input.data.c6_often_used
      || '',
  ).trim();

  let committedBank = String(
    input.data.committed_bank || input.data.d5_committed || '',
  ).trim();

  let preferredSource: PreferredSource | undefined = preferredBank ? 'respondent_selected' : undefined;
  let committedSource: PreferredSource | undefined = committedBank ? 'respondent_selected' : undefined;

  if (bankCount === 1) {
    preferredBank = currentlyUsing[0];
    committedBank = currentlyUsing[0];
    preferredSource = 'auto_single_usage';
    committedSource = 'auto_single_usage';
  }

  const errors: string[] = [];
  if (bankCount > 1) {
    if (!preferredBank) errors.push('preferred_bank_required_for_multi_bank');
    if (!committedBank) errors.push('committed_bank_required_for_multi_bank');
  }

  const normalizedGender = String(input.data.gender || input.data.e3_gender || '').trim().toLowerCase();
  const durationSeconds = Math.max(0, Math.round((Date.now() - input.startedAtMs) / 1000));

  const normalized: Partial<SurveyResponse> = buildAnalyticsSafeResponse(input.data);

  normalized.response_id = input.responseId;
  normalized.device_id = input.deviceId;
  normalized.country = selectedCountry;
  normalized.selected_country = selectedCountry;
  normalized.timestamp = nowIso;
  normalized.duration_seconds = Number.isFinite(input.data.duration_seconds as number)
    ? Number(input.data.duration_seconds)
    : durationSeconds;
  normalized.question_timings = asRecordNumber(input.data.question_timings);
  normalized.language_at_submission = input.language;
  normalized._status = input.status;

  normalized.c5_currently_using = currentlyUsing;
  normalized.bank_count = bankCount;

  normalized.preferred_bank = preferredBank || undefined;
  normalized.preferred_bank_source = preferredSource;
  normalized.committed_bank = committedBank || undefined;
  normalized.committed_bank_source = committedSource;

  normalized.c6_main_bank = preferredBank || undefined;
  normalized.c6_often_used = preferredBank || undefined;
  normalized.d5_committed = committedBank || undefined;

  normalized.gender = normalizedGender || 'unknown';

  if (!normalized.response_id || !normalized.device_id) {
    errors.push('missing_identity_fields');
  }

  if (!normalized.language_at_submission) {
    errors.push('missing_language');
  }

  if (!Number.isInteger(normalized.duration_seconds) || normalized.duration_seconds < 0) {
    errors.push('invalid_duration_seconds');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, errors: [], response: normalized as SurveyResponse };
};

export const normalizeResponseForAnalyticsRead = (response: SurveyResponse): SurveyResponse => {
  const selectedCountry = coerceCountry(response.selected_country || response.country, 'rwanda');
  const currentlyUsing = asStringArray(response.c5_currently_using);
  const bankCount = Number.isInteger(response.bank_count)
    ? Number(response.bank_count)
    : currentlyUsing.length;

  const preferredBank = String(response.preferred_bank || response.c6_main_bank || response.c6_often_used || '').trim();
  const committedBank = String(response.committed_bank || response.d5_committed || '').trim();

  return {
    ...response,
    country: selectedCountry,
    selected_country: selectedCountry,
    c5_currently_using: currentlyUsing,
    bank_count: bankCount,
    preferred_bank: preferredBank || undefined,
    committed_bank: committedBank || undefined,
    c6_main_bank: preferredBank || response.c6_main_bank,
    c6_often_used: preferredBank || response.c6_often_used,
    d5_committed: committedBank || response.d5_committed,
    gender: String(response.gender || response.e3_gender || 'unknown').trim().toLowerCase(),
  };
};
