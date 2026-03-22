import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const requireEnv = (name: string): string => {
  const value = import.meta.env[name];
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('VITE_FIREBASE_APP_ID'),
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
const isFirebaseHostingHost = runtimeHost.endsWith('.web.app') || runtimeHost.endsWith('.firebaseapp.com');
const isPreviewLikeHost = runtimeHost === 'localhost'
  || runtimeHost === '127.0.0.1'
  || runtimeHost.includes('--preview-');
const effectiveAuthDomain = isFirebaseHostingHost ? runtimeHost : firebaseConfig.authDomain;

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  authDomain: effectiveAuthDomain,
};

export const firebaseRuntimeDebug = {
  apiKey: resolvedFirebaseConfig.apiKey,
  apiKeyPrefix: resolvedFirebaseConfig.apiKey.slice(0, 8),
  configuredAuthDomain: firebaseConfig.authDomain,
  authDomain: resolvedFirebaseConfig.authDomain,
  authDomainSource: isFirebaseHostingHost ? 'runtime-host' : 'env',
  projectId: resolvedFirebaseConfig.projectId,
  appId: resolvedFirebaseConfig.appId,
  origin: typeof window !== 'undefined' ? window.location.origin : null,
  host: runtimeHost || null,
};

const app = initializeApp(resolvedFirebaseConfig);
const FUNCTIONS_REGION = 'us-central1';
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY || '';

if (typeof window !== 'undefined' && appCheckSiteKey) {
  const debugToken = import.meta.env.VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN;
  if (import.meta.env.DEV && debugToken) {
    (self as Window & { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      debugToken === 'true' ? true : debugToken;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else if (typeof window !== 'undefined' && !import.meta.env.DEV && !appCheckSiteKey) {
  console.warn('Firebase App Check is not configured. Public survey submit protection will remain incomplete until VITE_FIREBASE_APP_CHECK_SITE_KEY is set.');
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, FUNCTIONS_REGION);

if (typeof window !== 'undefined' && isPreviewLikeHost) {
  console.info('[firebase:init]', {
    origin: firebaseRuntimeDebug.origin,
    authDomain: firebaseRuntimeDebug.authDomain,
    configuredAuthDomain: firebaseRuntimeDebug.configuredAuthDomain,
    authDomainSource: firebaseRuntimeDebug.authDomainSource,
    projectId: firebaseRuntimeDebug.projectId,
    appId: firebaseRuntimeDebug.appId,
    apiKeyPrefix: firebaseRuntimeDebug.apiKeyPrefix,
  });

  if (runtimeHost === '127.0.0.1') {
    console.warn(
      '[firebase:auth] Running on 127.0.0.1. Firebase Authentication often requires 127.0.0.1 to be added to Authorized domains. For local QA, prefer localhost unless 127.0.0.1 is explicitly authorized.',
    );
  }

  if (runtimeHost.includes('--preview-')) {
    console.warn(
      '[firebase:auth] Running on a preview host. This exact preview domain must be present in Firebase Authentication > Settings > Authorized domains for web sign-in flows to work reliably.',
    );
  }
}

if (typeof window !== 'undefined' && isFirebaseHostingHost && firebaseConfig.authDomain !== effectiveAuthDomain) {
  console.info('[firebase:auth] Using the current Firebase Hosting domain as authDomain for same-site auth helpers.', {
    host: runtimeHost,
    configuredAuthDomain: firebaseConfig.authDomain,
    effectiveAuthDomain,
  });
}
