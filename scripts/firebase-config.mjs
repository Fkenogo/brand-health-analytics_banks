import { loadLocalEnv } from './load-env.mjs';

loadLocalEnv();

const read = (key) => {
  return process.env[key] || process.env[`VITE_${key}`] || '';
};

const requireEnv = (key) => {
  const value = read(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key} (or VITE_${key})`);
  }
  return value;
};

export const firebaseConfig = {
  apiKey: requireEnv('FIREBASE_API_KEY'),
  authDomain: requireEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('FIREBASE_APP_ID'),
  measurementId: read('FIREBASE_MEASUREMENT_ID') || undefined,
};
