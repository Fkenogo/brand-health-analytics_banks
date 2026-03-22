const VALID_COUNTRIES = ['rwanda', 'uganda', 'burundi'];
const VALID_SOURCES = ['survey', 'external', 'manual'];
const VALID_LANGUAGES = ['en', 'rw', 'fr'];
const PANEL_COOLDOWN_DAYS = 90;

const normalizeString = (value, maxLength = 200) => {
  const normalized = String(value || '').trim();
  return normalized.slice(0, maxLength);
};

const normalizeCountry = (value) => {
  const normalized = normalizeString(value, 32).toLowerCase();
  return VALID_COUNTRIES.includes(normalized) ? normalized : null;
};

const normalizeSource = (value) => {
  const normalized = normalizeString(value, 32).toLowerCase();
  return VALID_SOURCES.includes(normalized) ? normalized : 'survey';
};

const normalizeLanguage = (value) => {
  const normalized = normalizeString(value, 8).toLowerCase();
  return VALID_LANGUAGES.includes(normalized) ? normalized : 'en';
};

const normalizeEmail = (value) => normalizeString(value, 160).toLowerCase();
const normalizePhone = (value) => normalizeString(value, 40);

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 20;
};

const buildPanelistId = (deviceId, country) => `${deviceId}_${country}`;
const buildRaffleEntryId = ({ responseId, deviceId, country }) => `${country}_${responseId || deviceId}`;
const mergeFollowUpOptIns = (existing = {}, requested = {}) => ({
  panelOptIn: Boolean(existing.panelOptIn) || Boolean(requested.panelOptIn),
  raffleOptIn: Boolean(existing.raffleOptIn) || Boolean(requested.raffleOptIn),
});
const buildNextEligibleAt = (isoString) => {
  const date = new Date(isoString);
  return new Date(date.getTime() + (PANEL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)).toISOString();
};

const normalizePublicFollowUpInput = (payload) => {
  const joinPanel = Boolean(payload?.joinPanel);
  const enterRaffle = Boolean(payload?.enterRaffle);
  const country = normalizeCountry(payload?.country);
  const deviceId = normalizeString(payload?.deviceId, 256);
  const responseId = normalizeString(payload?.responseId, 128);
  const contactName = normalizeString(payload?.contactName, 120);
  const contactEmail = normalizeEmail(payload?.contactEmail);
  const contactPhone = normalizePhone(payload?.contactPhone);
  const source = normalizeSource(payload?.source);
  const language = normalizeLanguage(payload?.language);

  if (!joinPanel && !enterRaffle) {
    return { ok: false, code: 'selection_required', message: 'Select raffle and/or panel participation before submitting contacts.' };
  }

  if (!country) {
    return { ok: false, code: 'invalid_country', message: 'A valid survey country is required.' };
  }

  if (!deviceId) {
    return { ok: false, code: 'missing_device_id', message: 'A device identifier is required.' };
  }

  if (!responseId) {
    return { ok: false, code: 'missing_response_id', message: 'A saved survey response is required before contact details can be linked.' };
  }

  if (!contactName) {
    return { ok: false, code: 'missing_contact_name', message: 'Enter your name before saving contact details.' };
  }

  if (!contactEmail && !contactPhone) {
    return { ok: false, code: 'missing_contact_channel', message: 'Provide an email address or phone number.' };
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    return { ok: false, code: 'invalid_contact_email', message: 'Enter a valid email address.' };
  }

  if (contactPhone && !isValidPhone(contactPhone)) {
    return { ok: false, code: 'invalid_contact_phone', message: 'Enter a valid phone number.' };
  }

  return {
    ok: true,
    value: {
      joinPanel,
      enterRaffle,
      country,
      deviceId,
      responseId: responseId || null,
      contactName,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      source,
      language,
    },
  };
};

module.exports = {
  PANEL_COOLDOWN_DAYS,
  buildNextEligibleAt,
  buildPanelistId,
  buildRaffleEntryId,
  mergeFollowUpOptIns,
  normalizePublicFollowUpInput,
};
