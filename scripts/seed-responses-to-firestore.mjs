import fs from 'node:fs/promises';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { addDoc, collection, getFirestore } from 'firebase/firestore';

const DEFAULT_INPUT = path.join(process.cwd(), 'testing', 'sample-responses.seed.json');
const DEFAULT_MANIFEST = path.join(process.cwd(), 'testing', 'sample-responses.seed.manifest.json');

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

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputArg = args.find((arg) => arg.startsWith('--input='));
const inputPath = inputArg ? path.resolve(inputArg.split('=')[1]) : DEFAULT_INPUT;
const manifestArg = args.find((arg) => arg.startsWith('--manifest='));
const manifestPath = manifestArg ? path.resolve(manifestArg.split('=')[1]) : DEFAULT_MANIFEST;

const raw = await fs.readFile(inputPath, 'utf-8');
const payload = JSON.parse(raw);
if (!Array.isArray(payload)) {
  throw new Error(`Input JSON must be an array. Got: ${typeof payload}`);
}

if (dryRun) {
  console.log(`[dry-run] Parsed ${payload.length} responses from ${inputPath}`);
  console.log('[dry-run] First response preview:', payload[0]);
  process.exit(0);
}

let inserted = 0;
const manifest = {
  createdAt: new Date().toISOString(),
  source: inputPath,
  docs: [],
};
for (const item of payload) {
  if (!item.response_id) {
    throw new Error('Each response must include response_id for deterministic seeding.');
  }
  const ref = await addDoc(collection(db, 'responses'), item);
  manifest.docs.push({
    docId: ref.id,
    response_id: item.response_id,
    country: item.selected_country || item.country || 'unknown',
  });
  inserted += 1;
  if (inserted % 25 === 0) {
    console.log(`Inserted ${inserted}/${payload.length}...`);
  }
}

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`Done. Inserted ${inserted} sample responses into Firestore collection: responses`);
console.log('Tag used for cleanup tracking: _status = sample_seed_v1');
console.log(`Manifest written: ${manifestPath}`);
