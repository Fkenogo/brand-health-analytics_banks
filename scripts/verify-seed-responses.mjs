import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

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
const db = getFirestore(app);

const snapshot = await getDocs(query(collection(db, 'responses'), where('_status', '==', 'sample_seed_v1')));

const byCountry = {};
const ids = [];
snapshot.forEach((docSnap) => {
  const data = docSnap.data();
  const country = data.selected_country || data.country || 'unknown';
  byCountry[country] = (byCountry[country] || 0) + 1;
  if (ids.length < 10) ids.push(docSnap.id);
});

console.log('Seed verification result');
console.log(`Total seeded docs: ${snapshot.size}`);
console.log('By country:', byCountry);
console.log('Example doc IDs:', ids);
