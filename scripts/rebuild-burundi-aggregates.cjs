'use strict';

// Admin script: rebuild Burundi responseAnalyticsDaily aggregate docs.
// Uses Application Default Credentials + exact same logic as functions/index.js.

const admin = require('../functions/node_modules/firebase-admin');
const {
  AGGREGATE_SCHEMA_VERSION,
  METHODOLOGY_VERSION,
  SUPPORTED_METRICS,
  SUPPORTED_FILTERS,
  SUPPORTED_MODULES,
  SUPPORTED_COMPARE_METRICS,
  normalizeCountry,
  responseDateBucket,
  buildDailyAggregateFromResponses,
} = require('../functions/analyticsAggregation');
const {
  CANONICAL_BANKS_BY_COUNTRY,
  normalizeBankDefinitions,
  mergeBankDefinitions,
} = require('../functions/dashboardAggregateConfig');

const PROJECT_ID = 'brand-health-analytics';
const COUNTRY = 'burundi';
const RESPONSE_ANALYTICS_COLLECTION = 'responseAnalyticsDaily';
const RESPONSE_ANALYTICS_STATUS_COLLECTION = 'responseAnalyticsStatus';

// Matches functions/index.js exactly — double underscore separator.
const analyticsDocId = (country, dateBucket) => `${country}__${dateBucket}`;
const analyticsStatusRef = (db, country) =>
  db.collection(RESPONSE_ANALYTICS_STATUS_COLLECTION).doc(country);

const buildAggregateContract = () => ({
  aggregateSchemaVersion: AGGREGATE_SCHEMA_VERSION,
  methodologyVersion: METHODOLOGY_VERSION,
  methodology_version: METHODOLOGY_VERSION,
  supportedMetrics: SUPPORTED_METRICS,
  supportedFilters: SUPPORTED_FILTERS,
  supportedModules: SUPPORTED_MODULES,
  supportedCompareMetrics: SUPPORTED_COMPARE_METRICS,
});

const getBanksForCountry = async (db, country) => {
  const normalizedCountry = normalizeCountry(country);
  if (!normalizedCountry) return [];

  // Mirrors functions/index.js getBanksForCountry
  const snapshot = await db.collection('questionnaires').where('country', '==', normalizedCountry).limit(1).get();
  const questionnaire = snapshot.docs[0]?.data() || {};
  const questionnaireBanks = normalizeBankDefinitions(questionnaire.banks);

  const configSnapshot = await db.collection('config').doc('banks').get();
  const configData = configSnapshot.exists ? configSnapshot.data() || {} : {};
  const configBanks = normalizeBankDefinitions(configData[normalizedCountry]);

  const canonicalBanks = normalizeBankDefinitions(CANONICAL_BANKS_BY_COUNTRY[normalizedCountry]);
  return mergeBankDefinitions(questionnaireBanks, configBanks, canonicalBanks);
};

const listResponsesForCountryDateBucket = async (db, { country, dateBucket }) => {
  const [snap1, snap2] = await Promise.all([
    db.collection('responses').where('selected_country', '==', country).where('analytics_date_bucket', '==', dateBucket).get(),
    db.collection('responses').where('country', '==', country).where('analytics_date_bucket', '==', dateBucket).get(),
  ]);
  const seen = new Set();
  const rows = [];
  [snap1, snap2].forEach((snap) => {
    snap.docs.forEach((docSnap) => {
      if (seen.has(docSnap.id)) return;
      seen.add(docSnap.id);
      rows.push(docSnap.data() || {});
    });
  });

  // Legacy fallback for responses without analytics_date_bucket field
  const [legacySnap1, legacySnap2] = await Promise.all([
    db.collection('responses').where('selected_country', '==', country).get(),
    db.collection('responses').where('country', '==', country).get(),
  ]);
  [legacySnap1, legacySnap2].forEach((snap) => {
    snap.docs.forEach((docSnap) => {
      if (seen.has(docSnap.id)) return;
      const data = docSnap.data() || {};
      const storedBucket = String(data.analytics_date_bucket || '').trim();
      if (storedBucket) return; // already indexed properly
      if (responseDateBucket(data) !== dateBucket) return;
      seen.add(docSnap.id);
      rows.push(data);
    });
  });
  return rows;
};

const listAnalyticsBucketsForCountry = async (db, country) => {
  const [snap1, snap2] = await Promise.all([
    db.collection('responses').where('selected_country', '==', country).get(),
    db.collection('responses').where('country', '==', country).get(),
  ]);
  const seen = new Set();
  const buckets = new Set();
  [snap1, snap2].forEach((snap) => {
    snap.docs.forEach((docSnap) => {
      if (seen.has(docSnap.id)) return;
      seen.add(docSnap.id);
      const data = docSnap.data() || {};
      const bucket = responseDateBucket(data);
      if (bucket) buckets.add(bucket);
    });
  });
  return Array.from(buckets.values()).sort((a, b) => a.localeCompare(b));
};

const deleteStaleDocsForCountry = async (db, country) => {
  // Remove any documents that match country field but were written with wrong doc ID formats.
  // Canonical format is ${country}__${dateBucket}. We also sweep by field query.
  const snap = await db.collection(RESPONSE_ANALYTICS_COLLECTION).where('country', '==', country).get();
  const correctPrefix = `${country}__`;
  const toDelete = snap.docs.filter((d) => !d.id.startsWith(correctPrefix));
  if (toDelete.length === 0) {
    console.log('  No stale docs found (all docs have correct ID prefix).');
    return 0;
  }
  const batch = db.batch();
  toDelete.forEach((d) => {
    console.log(`  Deleting stale doc: ${d.id}`);
    batch.delete(d.ref);
  });
  await batch.commit();
  return toDelete.length;
};

async function run() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
  const db = admin.firestore();
  const normalizedCountry = normalizeCountry(COUNTRY);

  console.log(`\n=== Burundi Aggregate Rebuild (corrected) ===`);
  console.log(`Project: ${PROJECT_ID} | Country: ${normalizedCountry}`);

  // 1. Clean up stale docs from any previous incorrect rebuild attempts
  console.log('\n[1/4] Cleaning up stale docs...');
  const deleted = await deleteStaleDocsForCountry(db, normalizedCountry);
  console.log(`  Deleted ${deleted} stale doc(s).`);

  // 2. Discover banks
  console.log('\n[2/4] Discovering banks...');
  const banks = await getBanksForCountry(db, normalizedCountry);
  const bankIds = banks.map((b) => b.id);
  const bankNames = Object.fromEntries(banks.map((b) => [b.id, b.name]));
  console.log(`  Banks (${bankIds.length}): ${bankIds.join(', ')}`);

  // 3. Discover date buckets
  console.log('\n[3/4] Discovering date buckets...');
  const allBuckets = await listAnalyticsBucketsForCountry(db, normalizedCountry);
  console.log(`  Buckets (${allBuckets.length}): ${allBuckets.join(', ')}`);

  if (allBuckets.length === 0) {
    console.error('  ERROR: No buckets found. Aborting.');
    process.exit(1);
  }

  // Mark status as rebuilding
  await analyticsStatusRef(db, normalizedCountry).set({
    country: normalizedCountry,
    ...buildAggregateContract(),
    rebuildStatus: 'rebuilding',
    coverageComplete: false,
    rebuildStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    rebuiltBucketCount: 0,
    totalBuckets: allBuckets.length,
    source: 'admin_script_rebuild',
  }, { merge: true });

  // 4. Rebuild each bucket
  console.log('\n[4/4] Rebuilding buckets...');
  let totalRebuilt = 0;
  const results = [];

  for (const dateBucket of allBuckets) {
    const responses = await listResponsesForCountryDateBucket(db, { country: normalizedCountry, dateBucket });
    const aggregate = buildDailyAggregateFromResponses({ country: normalizedCountry, dateBucket, responses, bankIds });

    const docId = analyticsDocId(normalizedCountry, dateBucket);
    await db.collection(RESPONSE_ANALYTICS_COLLECTION).doc(docId).set({
      ...aggregate,
      ...buildAggregateContract(),
      bankNames,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      rebuiltAt: admin.firestore.FieldValue.serverTimestamp(),
      sourceResponseCount: responses.length,
      rebuildStatus: 'ready',
      source: 'admin_script_rebuild',
    }, { merge: false });

    const bankCountSample = Object.entries(aggregate.banks || {}).map(([id, b]) =>
      `${id}:aware=${b.awareCount}`).slice(0, 3).join(', ');

    console.log(`  ✓ ${docId}: responses=${responses.length}, included=${aggregate.analyticsIncludedCount}, screened_out=${aggregate.screenedOutCount} | ${bankCountSample}`);
    results.push({ dateBucket, docId, responseCount: responses.length, analyticsIncludedCount: aggregate.analyticsIncludedCount });
    totalRebuilt += 1;
  }

  // Mark status as complete
  await analyticsStatusRef(db, normalizedCountry).set({
    country: normalizedCountry,
    ...buildAggregateContract(),
    rebuildStatus: 'ready',
    coverageComplete: true,
    rebuiltBucketCount: totalRebuilt,
    totalBuckets: allBuckets.length,
    lastRebuildChunkAt: admin.firestore.FieldValue.serverTimestamp(),
    rebuildCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastSuccessfulRebuildAt: admin.firestore.FieldValue.serverTimestamp(),
    source: 'admin_script_rebuild',
  }, { merge: true });

  // Summary
  const totalIncluded = results.reduce((s, r) => s + r.analyticsIncludedCount, 0);
  const totalResponses = results.reduce((s, r) => s + r.responseCount, 0);
  console.log(`\n=== Rebuild Summary ===`);
  console.log(`Rebuilt:          ${totalRebuilt}/${allBuckets.length} buckets`);
  console.log(`Total responses:  ${totalResponses}`);
  console.log(`Total included:   ${totalIncluded}  (expect 62)`);
  console.log(`Status:           ready, coverageComplete=true`);
}

run().catch((err) => {
  console.error('\nRebuild failed:', err.message || err);
  process.exit(1);
});
