# Aggregate Repair Validation Report

**Date:** 2026-05-03
**Phase:** Pre-Phase 2 Gate

---

## Summary

The implementation work is substantially complete in code. The rebuild has not been executed against live Firestore (requires Firebase credentials not available in this environment). Status by task below.

---

## Task 1 — Rebuild Script

**Status: IMPLEMENTED, not yet executed**

`scripts/rebuild-burundi-aggregates.cjs` exists and implements the full pipeline:

- Deletes stale docs with wrong ID format
- Discovers banks from `questionnaires` + `config/banks` + canonical fallback
- Discovers all date buckets by scanning `responses` collection
- Rebuilds each bucket using `buildDailyAggregateFromResponses` (same function as Cloud Function)
- Marks status doc `rebuildStatus='ready'`, `coverageComplete=true`, `totalBuckets=rebuiltBucketCount`

**To execute:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  node scripts/rebuild-burundi-aggregates.cjs
```

---

## Backend Changes — `functions/analyticsAggregation.js`

These changes make rebuilt aggregates structurally valid:

| Change | Detail |
|--------|--------|
| `AGGREGATE_SCHEMA_VERSION` | Bumped from 2 → **3** |
| `METHODOLOGY_VERSION` | Added `'v1'` (both `methodologyVersion` and `methodology_version` written to every doc) |
| `analyticsIncludedCount` | Now tracked via `deriveSurveyAnalyticsInclusion()` — correct denominator |
| `screenedOutCount` / `screenedOutUnder18Count` | Now tracked |
| `sampleSize` | Uses `analyticsIncludedCount` as denominator (was using raw `responseCount`) |
| `statusCounts` | Now includes `included`, `screenedOut`, `under18` |

Verified locally: `buildDailyAggregateFromResponses` with 2 included + 1 under-18-screened produces:

```json
{
  "analyticsIncludedCount": 2,
  "screenedOutCount": 1,
  "screenedOutUnder18Count": 1,
  "methodologyVersion": "v1",
  "aggregateSchemaVersion": 3
}
```

---

## Tasks 2 & 3 — Firestore Verification

**Status: PENDING — requires live Firebase credentials**

The rebuild script prints per-bucket output including `analyticsIncludedCount`, `screenedOut`, and bank counts. After a successful run, the status doc (`responseAnalyticsStatus/burundi`) will contain:

| Field | Expected Value |
|-------|---------------|
| `rebuildStatus` | `ready` |
| `coverageComplete` | `true` |
| `methodologyVersion` | `v1` |
| `methodology_version` | `v1` |
| `aggregateSchemaVersion` | `3` |
| `totalBuckets` | equals `rebuiltBucketCount` |

Buckets to verify after rebuild:

| Date Bucket | Expected `analyticsIncludedCount` |
|-------------|----------------------------------|
| 2026-03-22 | > 0 |
| 2026-03-23 | > 0 |
| 2026-03-24 | > 0 |
| 2026-03-27 | > 0 |
| 2026-03-28 | > 0 |
| 2026-03-29 | > 0 |
| 2026-03-30 | > 0 |

Each bucket must satisfy: all bank counts ≤ `analyticsIncludedCount`.

---

## Task 4 — Dashboard Validation

**Status: PENDING — requires live Firestore + browser**

The service layer (`src/services/analyticsAggregateService.ts`) has been updated with full validation:

- `validateAggregateBucket()`: blocks docs where `analyticsIncludedCount` is missing/zero, or where any bank count exceeds the denominator
- `validateAggregatePayload()`: blocks payloads with unsupported filters (age/gender → raw fallback)
- `shouldForceRawFallback()`: routes integrity failures to raw with no Firestore retry

Expected dashboard state after rebuild:

| Check | Expected |
|-------|----------|
| Overview sample size | 62 |
| Demographics sample size | 62 (same filter context) |
| Awareness values | ≤ 100% |
| BANCOBU awareness | 57 / 62 = 92% |
| CRDB awareness | 57 / 62 = 92% |
| KCB awareness | 57 / 62 = 92% |
| Aggregate fallback warning (unfiltered) | Not triggered |
| Age / gender filter | Raw fallback triggered (by design — contract declares `ageGroups: false`, `genders: false`) |

---

## Task 5 — Tests

**Status: COMPLETE — 12 / 12 passing**

Four new tests were added to `src/test/analyticsAggregateService.test.ts`:

| Test | Result |
|------|--------|
| Callable integrity validation failure → `aggregate === null` | ✅ Pass |
| Firestore bucket bank count exceeds denominator → `aggregate === null` | ✅ Pass |
| Active `ageGroups` filter unsupported → raw fallback triggered | ✅ Pass |
| **Valid aggregate accepted — all invariants pass** | ✅ Pass |

The last test explicitly validates the post-rebuild Burundi contract:

```
sampleSize:      62  (equals analyticsIncludedCount)
BANCOBU awareCount: 57
BANCOBU awareness:  92  (57/62 = 92.2% → rounds to 92)
methodologyVersion: v1
aggregateSchemaVersion: 3
fallbackReason:  null  (no fallback triggered)
source:          callable
```

Full test run output:

```
✓ src/test/analyticsAggregateService.test.ts (12 tests) 153ms
Test Files  1 passed (1)
     Tests  12 passed (12)
```

---

## Blocker Before Phase 2

One action remains before Phase 2 can begin:

**Run the rebuild script against live Firestore:**

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json \
  node scripts/rebuild-burundi-aggregates.cjs
```

Expected console output shape:

```
=== Burundi Aggregate Rebuild (corrected) ===
Project: brand-health-analytics | Country: burundi

[1/4] Cleaning up stale docs...
[2/4] Discovering banks...
[3/4] Discovering date buckets...
[4/4] Rebuilding buckets...
  ✓ burundi__2026-03-22: responses=N, included=N, screened_out=N | ...
  ...

=== Rebuild Summary ===
Rebuilt:          7/7 buckets
Total included:   62  (expect 62)
Status:           ready, coverageComplete=true
```

Once this completes, verify the Firestore docs (Tasks 2 & 3) and load the Burundi dashboard to confirm Task 4. No code changes are needed to unblock Phase 2.
