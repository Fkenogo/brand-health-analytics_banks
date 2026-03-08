/* Define supported country codes */
export type CountryCode = 'rwanda' | 'uganda' | 'burundi';

export type Language = 'en' | 'rw' | 'fr';

export interface Localized {
  en: string;
  rw: string;
  fr: string;
}

export type QuestionType = 
  | 'note' 
  | 'radio' 
  | 'checkbox' 
  | 'text' 
  | 'longtext' 
  | 'dropdown' 
  | 'date' 
  | 'rating-0-10-nr' 
  | 'rating-0-10-dk'
  | 'rating-matrix';

export interface Bank {
  id: string;
  name: string;
  country: CountryCode;
  aliases?: string[]; 
}

export interface Choice {
  label: Localized;
  value: string;
}

// Added ValidationRule interface to resolve export error in validation utility
export interface ValidationRule {
  type: 'bank-name' | 'min-length' | 'required' | string;
  message: Localized;
  params?: Record<string, unknown>;
}

export interface Question {
  id: string;
  type: QuestionType;
  section: string;
  label: Localized;
  description?: Localized;
  required?: boolean;
  choices?: Choice[];
  placeholder?: Localized;
  logic?: (data: SurveyResponse) => boolean;
  filterChoices?: (data: SurveyResponse) => Choice[];
  repeatFor?: 'all_country_banks' | 'c3_aware_banks' | 'c4_ever_used';
  isTerminationPoint?: boolean;
}

export interface SurveyResponse {
  _docId?: string;
  _updatedAt?: string;
  response_id: string;
  device_id: string;
  country: CountryCode;
  timestamp: string;
  duration_seconds: number;
  question_timings: Record<string, number>;
  language_at_submission: Language;
  _status?: string;
  // Dynamic survey fields
  selected_country?: CountryCode;
  consent?: 'yes' | 'no';
  b1_recency?: string;
  b2_age?: string;
  c1_top_of_mind?: string;
  c2_spontaneous?: string;
  c3_aware_banks?: string[];
  c1_recognized_bank_id?: string | null;
  c1_recognition_confidence?: number;
  c2_recognized_bank_ids?: string[];
  c2_unrecognized_entries?: string[];
  c3_total_awareness?: string[];
  raw_input_q1?: string;
  recognized_bank_id_q1?: string | null;
  recognition_confidence_q1?: number;
  raw_input_q2?: string;
  recognized_bank_ids_q2?: string[];
  unrecognized_entries_q2?: string[];
  top_of_mind_bank_id?: string | null;
  spontaneous_awareness_bank_ids?: string[];
  assisted_awareness_bank_ids?: string[];
  total_awareness_bank_ids?: string[];
  c4_ever_used?: string[];
  c5_currently_using?: string[];
  bank_count?: number;
  c6_main_bank?: string;
  c6_often_used?: string;
  preferred_bank?: string;
  preferred_bank_source?: 'auto_single_usage' | 'respondent_selected';
  committed_bank?: string;
  committed_bank_source?: 'auto_single_usage' | 'respondent_selected';
  c9_would_consider?: string[];
  c9_favourites?: string[];
  c9_interested_dont_know?: string[];
  c9_never_consider?: string[];
  c9_only_consider?: string;
  c10_nps?: number;
  d2_future_intent?: Record<string, number>;
  d3_relevance?: string[];
  d4_popularity?: string;
  d5_committed?: string;
  d7_nps?: Record<string, number>;
  e1_employment?: string;
  e2_education?: string;
  e3_gender?: string;
  gender?: string;
}
