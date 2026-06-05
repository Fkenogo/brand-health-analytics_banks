import type { CountryCode } from '@/types';
import type { CountryTheme } from '@/constants';

export interface SurveyThemeTokens {
  variant: 'default' | 'uganda';
  primaryFill: string;
  primaryText: string;
  primaryBorder: string;
  primaryHoverFill: string;
  emphasisText: string;
  emphasisSoftBackground: string;
  emphasisSoftBorder: string;
  badgeFill: string;
  badgeText: string;
  focusRing: string;
}

const DEFAULT_PRIMARY = '#2563EB';
const DEFAULT_SECONDARY = '#FACC15';

export const UGANDA_SURVEY_THEME: SurveyThemeTokens = {
  variant: 'uganda',
  primaryFill: '#F5C542',
  primaryText: '#0B1A2B',
  primaryBorder: '#D9A514',
  primaryHoverFill: '#FFD45C',
  emphasisText: '#F5C542',
  emphasisSoftBackground: 'rgba(245, 197, 66, 0.14)',
  emphasisSoftBorder: '#D9A514',
  badgeFill: '#F5C542',
  badgeText: '#0B1A2B',
  focusRing: '#F5C542',
};

export const getSurveyThemeTokens = (
  country: CountryCode | undefined,
  countryTheme?: CountryTheme | null,
): SurveyThemeTokens => {
  if (country === 'uganda') {
    return UGANDA_SURVEY_THEME;
  }

  const primary = countryTheme?.primary || DEFAULT_PRIMARY;
  const secondary = countryTheme?.secondary || DEFAULT_SECONDARY;

  return {
    variant: 'default',
    primaryFill: primary,
    primaryText: '#FFFFFF',
    primaryBorder: primary,
    primaryHoverFill: primary,
    emphasisText: secondary,
    emphasisSoftBackground: `${primary}10`,
    emphasisSoftBorder: `${primary}40`,
    badgeFill: primary,
    badgeText: '#FFFFFF',
    focusRing: primary,
  };
};
