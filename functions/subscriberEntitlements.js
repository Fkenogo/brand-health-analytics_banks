const ALLOWED_COUNTRIES = new Set(['rwanda', 'uganda', 'burundi']);
const CLAIM_SYNC_FIELDS = ['role', 'status', 'assignedCountries', 'subscription_tier', 'subscription_addon_ai'];
const SUBSCRIBER_STATUSES = ['pending', 'active', 'suspended', 'rejected'];
const SUBSCRIPTION_TIERS = ['free', 'standard'];

const normalizeCountryList = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((item) => String(item || '').toLowerCase().trim())
    .filter((item) => ALLOWED_COUNTRIES.has(item)))];
};

const normalizeSubscriberState = (status) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (SUBSCRIBER_STATUSES.includes(normalized)) return normalized;
  return 'pending';
};

const buildClaimsPayload = (userData) => {
  const role = userData?.role === 'admin' ? 'admin' : 'subscriber';
  const subscriberState = role === 'admin' ? 'active' : normalizeSubscriberState(userData?.status);
  const entitlementsVersionRaw = Number(userData?.entitlements_version);
  const entitlementsVersion = Number.isInteger(entitlementsVersionRaw) && entitlementsVersionRaw > 0
    ? entitlementsVersionRaw
    : 1;

  return {
    role,
    subscriber_state: subscriberState,
    entitlements_version: entitlementsVersion,
  };
};

const isAdminAuth = (auth) => Boolean(auth?.token?.role === 'admin');

const computeClaimsSyncPlan = (beforeData, afterData) => {
  const entitlementsChanged = CLAIM_SYNC_FIELDS.some(
    (field) => JSON.stringify(beforeData?.[field]) !== JSON.stringify(afterData?.[field]),
  );
  const previousVersion = Number(beforeData?.entitlements_version || 0);
  const currentVersion = Number(afterData?.entitlements_version || 0);

  if (!entitlementsChanged) {
    return {
      entitlementsChanged: false,
      shouldBumpVersion: false,
      nextVersion: currentVersion,
    };
  }

  const nextVersion = Math.max(previousVersion, currentVersion, 0) + 1;
  return {
    entitlementsChanged: true,
    shouldBumpVersion: nextVersion !== currentVersion,
    nextVersion,
  };
};

const validateSubscriberStatus = (status) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (!SUBSCRIBER_STATUSES.includes(normalized)) {
    throw new Error('invalid_status');
  }
  return normalized;
};

const validateSubscriptionTier = (tier) => {
  const normalized = String(tier || '').toLowerCase().trim();
  if (!SUBSCRIPTION_TIERS.includes(normalized)) {
    throw new Error('invalid_tier');
  }
  return normalized;
};

const buildStatusUpdate = (beforeData, nextStatus) => {
  const status = validateSubscriberStatus(nextStatus);
  return {
    updates: {
      status,
    },
    audit: {
      before: { status: beforeData?.status || null },
      after: { status },
    },
  };
};

const buildTierUpdate = (beforeData, nextTier) => {
  const subscription_tier = validateSubscriptionTier(nextTier);
  const subscription_addon_ai = subscription_tier === 'free'
    ? false
    : Boolean(beforeData?.subscription_addon_ai || false);

  return {
    updates: {
      subscription_tier,
      subscription_addon_ai,
    },
    audit: {
      before: {
        subscription_tier: beforeData?.subscription_tier || 'free',
        subscription_addon_ai: Boolean(beforeData?.subscription_addon_ai || false),
      },
      after: {
        subscription_tier,
        subscription_addon_ai,
      },
    },
  };
};

const buildAiAddonUpdate = (beforeData, enabled) => {
  const currentTier = validateSubscriptionTier(beforeData?.subscription_tier || 'free');
  const subscription_addon_ai = Boolean(enabled);

  if (subscription_addon_ai && currentTier !== 'standard') {
    throw new Error('ai_requires_standard_tier');
  }

  return {
    updates: {
      subscription_addon_ai,
    },
    audit: {
      before: {
        subscription_tier: currentTier,
        subscription_addon_ai: Boolean(beforeData?.subscription_addon_ai || false),
      },
      after: {
        subscription_tier: currentTier,
        subscription_addon_ai,
      },
    },
  };
};

const buildCountriesUpdate = (beforeData, countries) => {
  const assignedCountries = normalizeCountryList(countries);
  return {
    updates: {
      assignedCountries,
    },
    audit: {
      before: {
        assignedCountries: normalizeCountryList(beforeData?.assignedCountries || []),
      },
      after: {
        assignedCountries,
      },
    },
  };
};

module.exports = {
  CLAIM_SYNC_FIELDS,
  SUBSCRIBER_STATUSES,
  normalizeCountryList,
  normalizeSubscriberState,
  buildClaimsPayload,
  isAdminAuth,
  computeClaimsSyncPlan,
  buildStatusUpdate,
  buildTierUpdate,
  buildAiAddonUpdate,
  buildCountriesUpdate,
};
