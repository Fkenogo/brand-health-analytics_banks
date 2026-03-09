import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.mjs';

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
