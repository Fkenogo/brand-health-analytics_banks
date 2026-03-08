import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyBK2d5ds_wQuTVBgquPoDnFd_LXLIoF_dU',
  authDomain: 'brand-health-analytics.firebaseapp.com',
  projectId: 'brand-health-analytics',
  storageBucket: 'brand-health-analytics.firebasestorage.app',
  messagingSenderId: '581759118685',
  appId: '1:581759118685:web:e24265fcea207636624cb4',
  measurementId: 'G-1R4LEXBTEW',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
