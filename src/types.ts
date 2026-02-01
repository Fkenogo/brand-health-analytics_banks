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
  | 'rating-0-10-dk';

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
  params?: any;
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
  logic?: (data: any) => boolean;
  filterChoices?: (data: any) => Choice[];
  repeatFor?: 'all_country_banks' | 'c4_ever_used';
  isTerminationPoint?: boolean;
}

export interface SurveyResponse {
  response_id: string;
  device_id: string;
  country: CountryCode;
  timestamp: string;
  duration_seconds: number;
  question_timings: Record<string, number>;
  language_at_submission: Language;
  _status?: string;
  [key: string]: any;
}
