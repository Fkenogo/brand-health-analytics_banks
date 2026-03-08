const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('node:crypto');

admin.initializeApp();

const db = admin.firestore();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
];

const MAX_RESPONSE_WORDS = 800;
const ALLOWED_COUNTRIES = new Set(['rwanda', 'uganda', 'burundi']);
const CLAIM_SYNC_FIELDS = ['role', 'status', 'assignedCountries', 'subscription_tier', 'subscription_addon_ai'];

const toWordLimitedText = (text, maxWords) => {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return String(text || '').trim();
  return `${words.slice(0, maxWords).join(' ')}...`;
};

const normalizeWhitespace = (value) => String(value || '').replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

const REQUIRED_SECTIONS = [
  'Strategic Context',
  'Performance Analysis',
  'Market Position',
  'Brand Strength & Conversion',
  'Customer Advocacy',
  'Business Implications',
  'Risk & Opportunity Zones',
  'Strategic Priorities',
];

const ensureRequiredSections = (raw) => {
  const normalized = normalizeWhitespace(raw);
  const lower = normalized.toLowerCase();
  const hasAll = REQUIRED_SECTIONS.every((section) => lower.includes(section.toLowerCase()));
  if (hasAll) return toWordLimitedText(normalized, MAX_RESPONSE_WORDS);

  const fallback = REQUIRED_SECTIONS.map((section) => {
    const body = section === 'Strategic Priorities'
      ? normalized
      : 'Not enough signal from current snapshot to provide a confident section-level readout.';
    return `## ${section}\n${body}`;
  }).join('\n\n');

  return toWordLimitedText(fallback, MAX_RESPONSE_WORDS);
};

const buildPrompt = (payload) => {
  return [
    'Use only this structured dashboard snapshot.',
    'Do not introduce external assumptions or invent data.',
    'No raw table dumps and no technical implementation details.',
    'Return only the requested executive analysis sections in order.',
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n');
};

const parseGeminiText = (result) => {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
};

const callGeminiModel = async ({ apiKey, model, payload, systemPrompt }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(payload) }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1800,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Gemini request failed (${response.status}): ${body || 'Unknown error'}`);
    error.statusCode = response.status;
    throw error;
  }

  const result = await response.json();
  const text = parseGeminiText(result);
  if (!text) throw new Error('Gemini returned an empty response.');
  return ensureRequiredSections(text);
};

const normalizeCountryList = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map((item) => String(item || '').toLowerCase().trim())
    .filter((item) => ALLOWED_COUNTRIES.has(item)))];
};

const normalizeSubscriberState = (status) => {
  const normalized = String(status || '').toLowerCase().trim();
  if (['pending', 'active', 'suspended', 'rejected'].includes(normalized)) return normalized;
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

const isAdminCaller = (auth) => {
  return Boolean(auth?.token?.role === 'admin');
};

const getInviteByToken = async (token) => {
  const snapshot = await db.collection('invites').where('token', '==', token).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ref: doc.ref, data: doc.data() };
};

const isInviteExpired = (invite) => {
  if (!invite?.expiresAt) return true;
  const expiresAt = new Date(String(invite.expiresAt)).getTime();
  return Number.isNaN(expiresAt) || expiresAt < Date.now();
};

const syncClaimsForUser = async (uid, userData) => {
  try {
    await admin.auth().getUser(uid);
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      return { synced: false, skipped: true, reason: 'auth_user_not_found' };
    }
    throw error;
  }

  const claims = buildClaimsPayload(userData || {});
  await admin.auth().setCustomUserClaims(uid, claims);
  return { synced: true, claims };
};

exports.syncUserClaimsOnProfileWrite = onDocumentWritten({
  region: 'us-central1',
  document: 'users/{uid}',
}, async (event) => {
  const beforeData = event.data?.before?.exists ? event.data.before.data() : null;
  const afterData = event.data?.after?.exists ? event.data.after.data() : null;
  const { uid } = event.params;

  if (!afterData) {
    return;
  }

  if (!['admin', 'subscriber'].includes(String(afterData.role || ''))) {
    return;
  }

  const entitlementsChanged = CLAIM_SYNC_FIELDS.some((field) => JSON.stringify(beforeData?.[field]) !== JSON.stringify(afterData?.[field]));
  const previousVersion = Number(beforeData?.entitlements_version || 0);
  const currentVersion = Number(afterData?.entitlements_version || 0);

  if (entitlementsChanged) {
    const nextVersion = Math.max(previousVersion, currentVersion, 0) + 1;
    if (nextVersion !== currentVersion) {
      await event.data.after.ref.set({
        entitlements_version: nextVersion,
        claimsSyncPending: false,
        claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return;
    }
  }

  const syncResult = await syncClaimsForUser(uid, afterData);
  if (!syncResult.synced && syncResult.skipped) {
    return;
  }

  await event.data.after.ref.set({
    claimsSyncPending: false,
    claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
    claimsLastSyncError: admin.firestore.FieldValue.delete(),
  }, { merge: true });
});

exports.adminCreateDraftSubscriber = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const email = String(request.data?.email || '').trim().toLowerCase();
  const companyName = String(request.data?.companyName || '').trim();
  if (!email || !email.includes('@')) {
    throw new HttpsError('invalid-argument', 'A valid email is required.');
  }

  const existing = await db.collection('users').where('email', '==', email).limit(1).get();
  if (!existing.empty) {
    throw new HttpsError('already-exists', 'Subscriber already exists.');
  }

  const id = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const user = {
    id,
    email,
    role: 'subscriber',
    status: 'draft',
    createdAt: now,
    companyName: companyName || email,
    assignedCountries: [],
    emailVerified: false,
    permissions: [],
    subscription_tier: 'free',
    subscription_addon_ai: false,
    ai_usage_count: 0,
    ai_usage_reset_date: now,
    entitlements_version: 1,
    createdBy: request.auth.uid,
  };

  await db.collection('users').doc(id).set(user);
  return { user };
});

exports.adminCreateInvite = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const userId = String(request.data?.userId || '').trim();
  const countries = normalizeCountryList(request.data?.countries || []);
  const validityDays = Number(request.data?.validityDays || 7);

  if (!userId) {
    throw new HttpsError('invalid-argument', 'userId is required.');
  }

  if (countries.length === 0) {
    throw new HttpsError('invalid-argument', 'At least one country must be selected.');
  }

  if (!Number.isFinite(validityDays) || validityDays < 1 || validityDays > 30) {
    throw new HttpsError('invalid-argument', 'validityDays must be between 1 and 30.');
  }

  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'Subscriber draft not found.');
  }

  const user = userSnap.data() || {};
  if (String(user.role || '') !== 'subscriber') {
    throw new HttpsError('failed-precondition', 'Invite can only be created for subscriber users.');
  }

  const email = String(user.email || '').trim().toLowerCase();
  if (!email) {
    throw new HttpsError('failed-precondition', 'Subscriber email is missing.');
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + validityDays * 24 * 60 * 60 * 1000);
  const token = `invite_${crypto.randomBytes(18).toString('hex')}`;
  const inviteId = `invite_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const invite = {
    id: inviteId,
    token,
    userId,
    email,
    companyName: String(user.companyName || email),
    countries,
    status: 'sent',
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdBy: request.auth.uid,
  };

  await db.runTransaction(async (tx) => {
    tx.set(db.collection('invites').doc(inviteId), invite);
    tx.set(userRef, {
      assignedCountries: countries,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  });

  return {
    invite: {
      id: invite.id,
      token: invite.token,
      userId: invite.userId,
      email: invite.email,
      companyName: invite.companyName,
      countries: invite.countries,
      status: invite.status,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    },
  };
});

exports.validateInvite = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  const token = String(request.data?.token || '').trim();
  if (!token) {
    throw new HttpsError('invalid-argument', 'Invite token is required.');
  }

  const inviteMatch = await getInviteByToken(token);
  if (!inviteMatch) {
    return { valid: false, reason: 'not_found' };
  }

  const invite = inviteMatch.data;
  if (String(invite.status || '') === 'used') {
    return { valid: false, reason: 'used' };
  }

  if (String(invite.status || '') === 'expired' || isInviteExpired(invite)) {
    return { valid: false, reason: 'expired' };
  }

  return {
    valid: true,
    invite: {
      email: String(invite.email || ''),
      companyName: String(invite.companyName || ''),
      countries: normalizeCountryList(invite.countries),
      expiresAt: String(invite.expiresAt || ''),
    },
  };
});

exports.acceptInvite = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to accept an invite.');
  }

  const token = String(request.data?.token || '').trim();
  const contactName = String(request.data?.contactName || '').trim();
  const phone = String(request.data?.phone || '').trim();
  const companyName = String(request.data?.companyName || '').trim();
  const requestedCountries = normalizeCountryList(request.data?.requestedCountries || []);

  if (!token) {
    throw new HttpsError('invalid-argument', 'Invite token is required.');
  }

  if (!contactName || !phone) {
    throw new HttpsError('invalid-argument', 'Contact name and phone are required.');
  }

  const authEmail = String(request.auth.token.email || '').trim().toLowerCase();
  if (!authEmail) {
    throw new HttpsError('failed-precondition', 'Authenticated email is missing.');
  }

  const inviteMatch = await getInviteByToken(token);
  if (!inviteMatch) {
    throw new HttpsError('not-found', 'Invite not found.');
  }

  const inviteData = inviteMatch.data;
  const inviteEmail = String(inviteData.email || '').trim().toLowerCase();
  if (inviteEmail !== authEmail) {
    throw new HttpsError('permission-denied', 'Invite email does not match authenticated account.');
  }

  const uid = request.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const inviteRef = inviteMatch.ref;
  const draftRef = inviteData.userId && inviteData.userId !== uid ? db.collection('users').doc(String(inviteData.userId)) : null;

  const now = new Date().toISOString();

  await db.runTransaction(async (tx) => {
    const latestInviteSnap = await tx.get(inviteRef);
    if (!latestInviteSnap.exists) {
      throw new HttpsError('not-found', 'Invite no longer exists.');
    }

    const latestInvite = latestInviteSnap.data() || {};
    if (String(latestInvite.status || '') === 'used') {
      throw new HttpsError('already-exists', 'Invite has already been used.');
    }

    if (String(latestInvite.status || '') === 'expired' || isInviteExpired(latestInvite)) {
      tx.set(inviteRef, { status: 'expired' }, { merge: true });
      throw new HttpsError('failed-precondition', 'Invite has expired.');
    }

    const assignedCountries = normalizeCountryList(latestInvite.countries || []);

    const existingUserSnap = await tx.get(userRef);
    const existingUser = existingUserSnap.exists ? existingUserSnap.data() : null;
    const nextEntitlementsVersion = Math.max(Number(existingUser?.entitlements_version || 0), 0) + 1;

    tx.set(userRef, {
      id: uid,
      authUid: uid,
      email: inviteEmail,
      role: 'subscriber',
      status: 'pending',
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
      companyName: companyName || String(latestInvite.companyName || inviteEmail),
      assignedCountries,
      requestedCountries: requestedCountries.length ? requestedCountries : assignedCountries,
      contactName,
      phone,
      emailVerified: Boolean(request.auth.token.email_verified),
      permissions: existingUser?.permissions || [],
      subscription_tier: existingUser?.subscription_tier || 'free',
      subscription_addon_ai: Boolean(existingUser?.subscription_addon_ai || false),
      ai_usage_count: Number(existingUser?.ai_usage_count || 0),
      ai_usage_reset_date: existingUser?.ai_usage_reset_date || now,
      entitlements_version: nextEntitlementsVersion,
      claimsSyncPending: true,
      acceptedInviteId: inviteRef.id,
    }, { merge: true });

    tx.set(inviteRef, {
      status: 'used',
      usedAt: now,
      acceptedUid: uid,
      requestedCountries: requestedCountries.length ? requestedCountries : assignedCountries,
      companyName: companyName || String(latestInvite.companyName || inviteEmail),
      contactName,
      phone,
    }, { merge: true });

    if (draftRef) {
      const draftSnap = await tx.get(draftRef);
      if (draftSnap.exists) {
        tx.set(draftRef, {
          migratedToUid: uid,
          migratedAt: now,
        }, { merge: true });
      }
    }
  });

  let claimsSynced = false;
  try {
    const finalUserSnap = await userRef.get();
    const finalUserData = finalUserSnap.data() || {};
    await syncClaimsForUser(uid, finalUserData);
    claimsSynced = true;
    await userRef.set({
      claimsSyncPending: false,
      claimsLastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
      claimsLastSyncError: admin.firestore.FieldValue.delete(),
    }, { merge: true });
  } catch (error) {
    await userRef.set({
      claimsSyncPending: true,
      claimsLastSyncError: String(error?.message || error),
      claimsLastSyncAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  return {
    ok: true,
    subscriber_state: 'pending',
    claims_synced: claimsSynced,
  };
});

exports.logAuditEvent = onCall({
  region: 'us-central1',
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 30,
}, async (request) => {
  if (!request.auth || !isAdminCaller(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }

  const action = String(request.data?.action || '').trim();
  if (!action) {
    throw new HttpsError('invalid-argument', 'action is required.');
  }

  const payload = {
    action,
    actorEmail: request.data?.actorEmail ? String(request.data.actorEmail).trim() : undefined,
    targetId: request.data?.targetId ? String(request.data.targetId).trim() : undefined,
    details: request.data?.details && typeof request.data.details === 'object' ? request.data.details : undefined,
    timestamp: new Date().toISOString(),
    actorUid: request.auth.uid,
  };

  await db.collection('audit').add(payload);
  return { ok: true };
});

exports.aiStrategyAdvisor = onCall({
  region: 'us-central1',
  secrets: [GEMINI_API_KEY],
  cors: true,
  maxInstances: 20,
  timeoutSeconds: 60,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication is required for AI Strategy Advisor.');
  }

  const systemPrompt = String(request.data?.systemPrompt || '').trim();
  const payload = request.data?.payload;
  if (!payload || typeof payload !== 'object') {
    throw new HttpsError('invalid-argument', 'Invalid payload for AI Strategy Advisor.');
  }

  const requiredKeys = ['country', 'period', 'filters', 'metrics', 'previous_period', 'competitors', 'user_query'];
  const missing = requiredKeys.filter((key) => !(key in payload));
  if (missing.length > 0) {
    throw new HttpsError('invalid-argument', `Missing required payload fields: ${missing.join(', ')}`);
  }

  if (!systemPrompt) {
    throw new HttpsError('invalid-argument', 'System prompt is required.');
  }

  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'GEMINI_API_KEY secret is not configured.');
  }

  let lastError = null;
  for (const model of DEFAULT_GEMINI_MODELS) {
    try {
      const response = await callGeminiModel({ apiKey, model, payload, systemPrompt });
      return { response };
    } catch (error) {
      const message = String(error?.message || error);
      if (message.includes('(404)') || message.includes('NOT_FOUND') || message.includes('not supported')) {
        lastError = error;
        continue;
      }
      if (message.includes('(429)') || message.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpsError('resource-exhausted', message);
      }
      throw new HttpsError('internal', message);
    }
  }

  throw new HttpsError('internal', String(lastError?.message || 'No compatible Gemini model found.'));
});
