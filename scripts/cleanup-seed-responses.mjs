import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const DEFAULT_INPUT = path.join(process.cwd(), 'testing', 'sample-responses.seed.json');
const DEFAULT_MANIFEST = path.join(process.cwd(), 'testing', 'sample-responses.seed.manifest.json');
const args = process.argv.slice(2);
const inputArg = args.find((arg) => arg.startsWith('--input='));
const inputPath = inputArg ? path.resolve(inputArg.split('=')[1]) : DEFAULT_INPUT;
const manifestArg = args.find((arg) => arg.startsWith('--manifest='));
const manifestPath = manifestArg ? path.resolve(manifestArg.split('=')[1]) : DEFAULT_MANIFEST;
const dryRun = args.includes('--dry-run');

let ids = [];
try {
  const manifestRaw = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestRaw);
  if (manifest && Array.isArray(manifest.docs)) {
    ids = manifest.docs.map((item) => item.docId).filter(Boolean);
  }
} catch {
  // fallback to previous behavior if manifest is not present
}

if (ids.length === 0) {
  const raw = await fs.readFile(inputPath, 'utf-8');
  const payload = JSON.parse(raw);
  if (!Array.isArray(payload)) {
    throw new Error(`Input JSON must be an array. Got: ${typeof payload}`);
  }
  ids = payload.map((item) => item.response_id).filter(Boolean);
}

if (dryRun) {
  console.log(`[dry-run] Would delete ${ids.length} seeded docs from Firestore.`);
  console.log(ids.slice(0, 10));
  process.exit(0);
}

for (let i = 0; i < ids.length; i += 1) {
  const id = ids[i];
  const result = spawnSync('firebase', ['firestore:delete', '--force', `responses/${id}`], {
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`Failed while deleting responses/${id}`);
    process.exit(result.status || 1);
  }
  if ((i + 1) % 20 === 0) {
    console.log(`Deleted ${i + 1}/${ids.length}...`);
  }
}

console.log(`Done. Deleted ${ids.length} seeded docs from responses.`);
