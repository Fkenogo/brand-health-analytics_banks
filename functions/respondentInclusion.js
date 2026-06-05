const RECENT_RECENCY_VALUES = new Set(['this_week', 'this_month', 'last_3_months']);
const NON_RECENT_RECENCY_VALUES = new Set(['longer_than_3_months', 'never']);

const deriveSurveyAnalyticsInclusion = (response = {}) => {
  const explicitIncluded = response.included_in_analytics;
  const explicitState = response.response_state;
  const explicitOutcome = response.screening_outcome;

  if (typeof explicitIncluded === 'boolean' && explicitState && explicitOutcome) {
    return {
      responseState: explicitState,
      screeningOutcome: explicitOutcome,
      includedInAnalytics: explicitIncluded,
    };
  }

  const status = String(response._status || '').trim().toLowerCase();
  const consent = String(response.consent || '').trim().toLowerCase();
  const recency = String(response.b1_recency || '').trim().toLowerCase();
  const age = String(response.b2_age || '').trim().toLowerCase();

  if (status === 'completed') {
    return {
      responseState: 'completed',
      screeningOutcome: explicitOutcome || 'eligible',
      includedInAnalytics: explicitIncluded ?? true,
    };
  }

  if (status === 'terminated') {
    if (consent === 'no') {
      return {
        responseState: 'screened_out',
        screeningOutcome: 'consent_declined',
        includedInAnalytics: false,
      };
    }

    if (NON_RECENT_RECENCY_VALUES.has(recency)) {
      return {
        responseState: 'screened_out',
        screeningOutcome: 'non_recent_user',
        includedInAnalytics: false,
      };
    }

    if (age === 'below_18') {
      return {
        responseState: 'screened_out',
        screeningOutcome: 'under_18',
        includedInAnalytics: false,
      };
    }

    return {
      responseState: 'screened_out',
      screeningOutcome: explicitOutcome || 'unknown',
      includedInAnalytics: explicitIncluded ?? false,
    };
  }

  if (RECENT_RECENCY_VALUES.has(recency) && age && age !== 'below_18') {
    return {
      responseState: 'completed',
      screeningOutcome: explicitOutcome || 'eligible',
      includedInAnalytics: explicitIncluded ?? true,
    };
  }

  return {
    responseState: explicitState || 'abandoned_partial',
    screeningOutcome: explicitOutcome || 'unknown',
    includedInAnalytics: explicitIncluded ?? false,
  };
};

const isIncludedInAnalytics = (response) => deriveSurveyAnalyticsInclusion(response).includedInAnalytics;

module.exports = {
  deriveSurveyAnalyticsInclusion,
  isIncludedInAnalytics,
};
