import { SurveyResponse } from '../types';
import { ALL_BANKS } from '../constants';

const STORAGE_KEY = 'regional_banking_survey_responses_v5';
const COMPLETED_FLAG = 'regional_banking_survey_completed_flag_v5';
const DRAFT_KEY = 'regional_banking_survey_draft_v5';

export const getResponses = (): SurveyResponse[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveResponse = (data: Partial<SurveyResponse>) => {
  const existing = getResponses();
  const newResponse: SurveyResponse = {
    response_id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...data
  } as SurveyResponse;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, newResponse]));
  return newResponse;
};

export const setSurveyCompleted = () => {
  localStorage.setItem(COMPLETED_FLAG, 'true');
  localStorage.removeItem(DRAFT_KEY);
};

export const isSurveyCompleted = (deviceId: string): boolean => {
  const responses = getResponses();
  return responses.some(r => r.device_id === deviceId && r._status === 'completed');
};

export const saveDraft = (step: number, formData: any) => {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, formData }));
};

export const getDraft = (): { step: number, formData: any } | null => {
  const data = localStorage.getItem(DRAFT_KEY);
  return data ? JSON.parse(data) : null;
};

export const seedSampleData = () => {
  const existing = getResponses();
  if (existing.length > 0) return;

  const totalRespondents = 600; // 200 per country
  const mockResponses: SurveyResponse[] = [];
  const countries: ('rwanda' | 'uganda' | 'burundi')[] = ['rwanda', 'uganda', 'burundi'];
  const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];
  const employmentTypes = ['full_time', 'part_time', 'self_employed', 'student'];
  const educationLevels = ['secondary', 'vocational', 'university', 'postgraduate'];

  for (let i = 0; i < totalRespondents; i++) {
    const country = countries[i % 3];
    const countryBanks = ALL_BANKS.filter(b => b.country === country);
    
    // Weighted selection for realistic distribution
    const awareness = [
      countryBanks[0]?.id, 
      countryBanks[1]?.id, 
      countryBanks[Math.floor(Math.random() * countryBanks.length)]?.id
    ].filter(Boolean);
    const used = [countryBanks[0]?.id].filter(Boolean);
    const current = [countryBanks[0]?.id].filter(Boolean);
    const preferred = countryBanks[0]?.id;

    mockResponses.push({
      response_id: `seed_${i}`,
      device_id: 'seed_device',
      selected_country: country,
      timestamp: new Date().toISOString(),
      duration_seconds: 150,
      language_at_submission: 'en',
      consent: 'yes',
      gender: i % 2 === 0 ? 'male' : 'female',
      b1_last_used: 'past_7_days',
      b2_age: ageGroups[i % 5],
      c1_first_bank: countryBanks[0]?.name || 'Bank',
      c3_aware_banks: awareness,
      c4_ever_used: used,
      c5_currently_using: current,
      c6_often_used: preferred,
      c10_nps: Math.floor(Math.random() * 11),
      d2_employment: employmentTypes[i % 4],
      d3_education: educationLevels[i % 4],
      _status: 'completed',
      question_timings: {},
      country: country
    } as SurveyResponse);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockResponses));
  console.log('Seeded 600 market responses (200 per country) into LocalStorage');
};
