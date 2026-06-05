import { describe, expect, it } from 'vitest';
import { COUNTRY_THEMES } from '@/constants';
import { UGANDA_SURVEY_THEME, getSurveyThemeTokens } from '@/utils/surveyTheme';

describe('survey theme tokens', () => {
  it('uses the Uganda yellow palette only for the Uganda survey theme', () => {
    const uganda = getSurveyThemeTokens('uganda', COUNTRY_THEMES.uganda);
    const rwanda = getSurveyThemeTokens('rwanda', COUNTRY_THEMES.rwanda);
    const burundi = getSurveyThemeTokens('burundi', COUNTRY_THEMES.burundi);

    expect(uganda).toEqual(UGANDA_SURVEY_THEME);
    expect(rwanda.primaryFill).toBe(COUNTRY_THEMES.rwanda.primary);
    expect(burundi.primaryFill).toBe(COUNTRY_THEMES.burundi.primary);
    expect(rwanda.variant).toBe('default');
    expect(burundi.variant).toBe('default');
  });
});
