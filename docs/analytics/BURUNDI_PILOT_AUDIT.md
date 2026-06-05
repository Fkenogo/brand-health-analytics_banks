# Burundi Pilot Analytics Audit

Generated: 2026-05-01

Scope: diagnostic only. No formulas were changed in this pass.

## Executive Finding

The impossible Burundi dashboard values are caused by an aggregate denominator mismatch, not by raw awareness double-counting.

Raw Burundi pilot data has 75 submissions and 62 analytics-qualified submissions. The materialized aggregate has the same bank-level counts as raw data, but its merged `analyticsIncludedCount` is only 43. Example: BANCOBU, CRDB, and KCB each have 57 aware respondents. Raw output is `57 / 62 = 92%`; aggregate output is `57 / 43 = 133%`.

The broken aggregate buckets are:

| Date bucket | Raw total | Raw included | Aggregate responseCount | Aggregate analyticsIncludedCount | Delta |
|---|---:|---:|---:|---:|---:|
| 2026-03-22 | 1 | 1 | 1 | 0 | -1 |
| 2026-03-23 | 25 | 16 | 25 | 0 | -16 |
| 2026-03-24 | 2 | 2 | 2 | 0 | -2 |
| 2026-03-27 | 40 | 36 | 40 | 36 | 0 |
| 2026-03-28 | 4 | 4 | 4 | 4 | 0 |
| 2026-03-29 | 2 | 2 | 2 | 2 | 0 |
| 2026-03-30 | 1 | 1 | 1 | 1 | 0 |

## Raw Burundi Count Snapshot

| Population | Count |
|---|---:|
| Total submissions | 75 |
| Qualified submissions | 62 |
| Completed | 62 |
| Terminated | 13 |
| Screened out: non-recent user | 13 |
| Duplicate response IDs | 0 |
| Duplicate device IDs | 0 |
| Invalid Burundi bank IDs in awareness/usage/preference fields | 0 |

Demographic counts among 62 qualified submissions:

| Field | Counts |
|---|---|
| Age | 25-34: 34; 18-24: 18; 35-44: 7; 45-54: 3 |
| Gender | female: 31; male: 28; prefer_not_to_say: 2; unknown: 1 |
| Employment | full_time: 33; self_employed: 11; prefer_not_to_say: 5; part_time: 4; student: 4; unemployed: 4; retired: 1 |
| Education | university: 50; postgraduate: 7; secondary: 3; prefer_not_to_say: 1; unknown: 1 |

Brand counts among 62 qualified submissions:

| Bank | Aware | Current | Preferred | Raw awareness % | Aggregate awareness % |
|---|---:|---:|---:|---:|---:|
| BANCOBU | 57 | 15 | 12 | 92% | 133% |
| CRDB | 57 | 27 | 23 | 92% | 133% |
| KCB | 57 | 15 | 8 | 92% | 133% |
| EcoBank | 54 | 7 | 2 | 87% | 126% |
| BCB | 52 | 6 | 4 | 84% | 121% |
| BGF | 52 | 13 | 8 | 84% | 121% |
| FinBank | 52 | 4 | 1 | 84% | 121% |
| Interbank (IBB) | 50 | 2 | 1 | 81% | 116% |
| BCAB | 47 | 2 | 0 | 76% | 109% |
| BHB | 41 | 3 | 2 | 66% | 95% |
| BBCI | 39 | 0 | 0 | 63% | 91% |
| DTB | 31 | 1 | 1 | 50% | 72% |
| BIJE | 25 | 0 | 0 | 40% | 58% |
| Others | 10 | 0 | 0 | 16% | 23% |

## Section A: Metric-by-Metric Audit Table

| Module | Metric | Current Formula | Correct? | Issue Found | Recommended Fix |
|---|---|---|---|---|---|
| Overview aggregate | Sample size | Sum `responseAnalyticsDaily.analyticsIncludedCount`; fallback only if merged field is nullish. See `functions/analyticsAggregation.js:264` and `src/services/analyticsAggregateService.ts:344`. | No | Some daily docs have bank counts but no `analyticsIncludedCount`, so missing values are summed as 0. Burundi aggregate sample is 43 instead of 62. | Rebuild affected aggregate docs and add integrity checks that block aggregate use when any bank count exceeds sample. |
| Overview aggregate | Awareness % | `awareCount / sampleSize * 100`. See `functions/analyticsAggregation.js:299` and `src/services/analyticsAggregateService.ts:380`. | Formula yes, input no | Denominator is stale/incomplete, producing 109%-133%. | Same as above; sample must equal qualified responses for the same date/window/filter scope. |
| Overview aggregate | Top-of-mind % | `topOfMindCount / sampleSize * 100`. Source `c1_recognized_bank_id`. | Mostly | Not currently above 100, but uses the same corrupted denominator. | Recompute after denominator repair; add max-count guard. |
| Overview aggregate | Spontaneous % | `(c1_recognized_bank_id == bank) OR c2_recognized_bank_ids includes bank`, divided by sample. See `isSpontaneousBank`. | Mostly | Same denominator risk. Also relies only on recognized IDs, not legacy `spontaneous_awareness_bank_ids`. | Normalize legacy read fields or document non-support. |
| Overview aggregate | Aided % | `c3_aware_banks includes bank`, divided by sample. | No as displayed | In this survey `c3_aware_banks` is total checked awareness, not aided-only incremental awareness. Aided can equal total awareness for many banks. | Either relabel as prompted/checked awareness or compute aided-only as total aware minus spontaneous. |
| Overview aggregate | Consideration | Count if `d2_future_intent[bank] >= 7` OR `d3_relevance` includes bank OR `c9_would_consider` includes bank. Topline `consider = considerCount / sample`; rate `considerationRate = considerCount / awareCount`. | Ambiguous | Counts can include non-aware respondents if malformed data contains intent/relevance for a bank outside awareness. Aggregate row `considerCount` for CRDB is 44 against aware 57, OK in raw snapshot. | Gate consideration count by `aware` unless intentionally modeling non-aware consideration. |
| Usage topline | Ever used | `c4_ever_used includes bank`, divided by total filtered respondents. | Yes | No impossible raw values. Aggregate percentages inherit bad denominator. | Rebuild aggregates and add invariant `ever <= aware` per bank. |
| Usage topline | Current usage | `c5_currently_using includes bank`, divided by total filtered respondents in `computeBankMetrics`; usage diagnostics report `current / aware`. See `src/utils/subscriberDashboard.ts:770` and `:950`. | Mixed | Different modules show current usage on different bases: total respondents vs aware respondents. This can look inconsistent even when mathematically valid. | Label base in UI and metric contracts; keep one base per card/table family. |
| Usage topline | Preferred/BUMO | `preferred_bank == bank`, divided by total filtered respondents in overview/topline; usage diagnostics uses `preferred / aware` for BUMO penetration and `preferred / current` for preference capture. | Mixed | Multiple denominators are valid but not consistently surfaced. | Rename metrics by base: preferred penetration, BUMO among aware, preference capture among current. |
| Usage funnel | Aware -> Ever -> Current -> Preferred | Counts restricted to aware respondents; stage rates use previous stage or aware base. See `src/utils/subscriberDashboard.ts:950`. | Mostly | Funnel can disagree with overview because overview aggregate is stale while funnel diagnostics are raw. | Use the same source for all visible modules in a filter context or show source badges per module. |
| Rankings | Awareness ranking | Aggregate `marketRows` when aggregate exists; raw `computeCompetitiveRows` otherwise. See `SubscriberDashboardPage.tsx:1163`. | No in Burundi aggregate mode | Aggregate rows show impossible awareness and rank on bad percentages. | Suppress aggregate rankings if sample/count invariants fail; fallback to raw. |
| Rankings | Share of voice | Sum of top-of-mind percentages across banks, then row TOM / total TOM. See `functions/analyticsAggregation.js:390`. | Works but fragile | Uses percentages, not raw TOM counts. With a shared denominator the ratio is equivalent, but less direct and can amplify rounding. | Use raw `topOfMindCount` denominator. |
| Competitive | Market share | `preferredCount / sampleSize`. In raw competitive diagnostics sample is filtered raw responses; aggregate marketRows use aggregate sample. | No in aggregate mode | Burundi aggregate preferred share is inflated, e.g. CRDB `23 / 43 = 53%` vs raw `23 / 62 = 37%`. | Same denominator repair; add preferred sum sanity check. |
| Demographics summary | Age/gender/employment/education distribution | Raw `responses.filter(isIncludedInAnalytics)`, then count field values with `unknown` fallback. See `src/utils/subscriberDashboard.ts:2470`. | Yes | Demographics sample is raw 62 while overview aggregate sample is 43, causing the observed same-filter mismatch. | Until aggregates support demographic filters and pass integrity checks, use raw overview or surface aggregate/raw source mismatch. |
| Demographic cohorts | Cohort awareness/usage/preference/NPS/intent | Raw included responses grouped by age/gender/employment/education. See `src/utils/subscriberDashboard.ts:2427`. | Mostly | NPS base is any numeric NPS in the cohort, not clearly limited to ever/current users in cohort diagnostics. | Align NPS base with overview/usage NPS base. |
| Cohort opportunity tables | Usage gap | Segment current usage vs best segment in same dimension. | Yes | Uses raw data only; not comparable to aggregate overview when aggregate sample is corrupt. | Keep raw, but source-label explicitly. |
| Trends | Monthly trend | Aggregate monthly trend if aggregate usable; raw time series otherwise. See `SubscriberDashboardPage.tsx:861` and `:865`. | No in aggregate mode | March trend can be inflated by the same missing included counts. Empty old bucket docs exist from 2025-11 through 2026-02 with zero counts. | Exclude zero-source buckets and validate per-month denominators. |
| BrandEdge score | Weighted score | awareness 30%, usage 30%, loyalty 20%, primary share 10%, switching risk -10%. | No in aggregate mode | Inflated awareness/current/preferred inputs can inflate or distort score. | Block aggregate-backed score when any component violates count/base invariants. |
| Raw analytics processor | `DataProcessor.normalizeResponse` | Maps raw survey to analytics shape. | No / stale | Test expects `preferred_bank = bank-a` but current normalization returns null for that fixture. Also uses simplified first-value intent. | Treat as legacy or update tests/mapper before relying on it. |

## Section B: Data Integrity Findings

1. Aggregate denominator corruption is confirmed. `responseAnalyticsDaily` bank counts match raw counts, but `analyticsIncludedCount` is missing on 2026-03-22, 2026-03-23, and 2026-03-24. Those buckets contain 19 qualified submissions and non-zero bank counts.

2. Aggregate status says ready even though coverage is internally inconsistent. `responseAnalyticsStatus/burundi` has `rebuildStatus: ready`, `coverageComplete: true`, and `lastSuccessfulRebuildAt: 2026-03-16T18:08:40.623Z`, while affected live buckets were refreshed later and contain partial aggregate fields.

3. No duplicate respondent issue was found in the current Burundi snapshot: duplicate `response_id = 0`, duplicate `device_id = 0`.

4. No invalid Burundi bank IDs were found in `c3_aware_banks`, `c4_ever_used`, `c5_currently_using`, or `preferred_bank`.

5. Missing demographic values exist but are small and handled as `unknown`: gender unknown 1; education unknown 1.

6. `c3_aware_banks` is being used as aided awareness. In the questionnaire it means "Tick all banks that you are aware of", so it is total checked awareness. Because total awareness is defined as top-of-mind OR spontaneous OR `c3_aware_banks`, and `aided` is separately `c3_aware_banks`, aided can equal total awareness.

7. Mixed source modules are active. Overview/awareness/rankings/usage topline can be aggregate-backed, while demographics, deep usage diagnostics, competitive diagnostics, migration, and switching remain raw-backed. This creates visible same-filter sample differences.

8. Aggregate filter contract says demographic filters are unsupported: `ageGroups: false`, `genders: false`. If an age/gender filter is applied while aggregate is still used, aggregate cards cannot represent that filter scope.

9. Filter time handling differs: raw filters use `Date.now() - N days`; aggregate filters use date bucket ranges ending at current date. These are close but not identical at day boundaries and can diverge for timestamp/date-bucket mismatches.

10. Several tests now fail around dashboard filters and inclusion, suggesting recent normalization/inclusion changes are not fully reflected in fixtures.

## Section C: Priority Fix List

1. Critical: Rebuild Burundi `responseAnalyticsDaily` aggregates, especially 2026-03-22, 2026-03-23, and 2026-03-24, so `analyticsIncludedCount` and `screenedOutCount` are present and correct.

2. Critical: Add aggregate integrity validation before dashboard use: for every bank, all per-bank counts must be `<= sampleSize` for total-population metrics; sample must reconcile with completed/screened counts; documents missing required count fields should be treated as invalid.

3. Critical: In the dashboard, fall back to raw analytics when aggregate integrity fails, even if `responseAnalyticsStatus` says `ready`.

4. High: Fix incremental aggregate generation/status behavior so a bucket cannot contain bank counts without denominator/status counts.

5. High: Disable aggregate-backed metrics whenever active filters include unsupported aggregate filters such as age or gender.

6. High: Standardize or explicitly label metric denominators: total respondents, aware respondents, ever-used respondents, current users, and segment population.

7. Medium: Rework aided awareness naming/formula. Current `aided` means checked/prompted awareness, not aided-only incremental awareness.

8. Medium: Use raw counts, not rounded percentages, for share-of-voice denominator.

9. Medium: Align NPS base in demographic cohort diagnostics with the NPS base used in bank metrics.

10. Medium: Update analytics tests and fixtures around `isIncludedInAnalytics`, mocked `firebaseRuntimeDebug`, dashboard route copy, and legacy `DataProcessor`.

## Validation Commands

`npm run build`

Result: pass.

Key output:

```text
✓ 2610 modules transformed.
✓ built in 7.67s
Warning: Browserslist data is 11 months old.
Warning: Some chunks are larger than 500 kB after minification.
```

`npm run test`

Result: fail.

Summary:

```text
Test Files  11 failed | 39 passed (50)
Tests       14 failed | 215 passed | 20 skipped (249)
```

Notable failures:

| Area | Failure |
|---|---|
| `src/test/analyticsAggregateService.test.ts` | Firestore aggregate fallback expected sample size 10, received 0. |
| Auth tests | Several mocks do not export `firebaseRuntimeDebug`, causing `AuthProvider` failures. |
| Public routes | `/survey` copy expectation is stale: expected "Participate in the National Banking Survey", rendered "Choose your country to begin". |
| Filtered multi-bank tests | Filtered scopes unexpectedly return empty arrays in customer migration/switching and multi-bank dashboard tests. |
| `DataProcessor.test.ts` | Legacy normalization expected `preferred_bank` to be `bank-a`, received null. |
| Firestore/storage rules suites | Emulator setup unavailable in plain `npm run test`; Firestore connect `EPERM 127.0.0.1:8080`, storage emulator host missing. |

## Source Trace Notes

- Backend aggregate source fields and counters: `functions/analyticsAggregation.js:210`.
- Backend aggregate merge: `functions/analyticsAggregation.js:264`.
- Backend percentage formulas: `functions/analyticsAggregation.js:299`.
- Backend overview sample selection: `functions/analyticsAggregation.js:374`.
- Backend callable aggregate read path: `functions/index.js:493`.
- Backend incremental rebuild trigger: `functions/index.js:2327`.
- Frontend aggregate merge and percentage formulas: `src/services/analyticsAggregateService.ts:344` and `src/services/analyticsAggregateService.ts:380`.
- Raw dashboard filter logic: `src/utils/subscriberDashboard.ts:658`.
- Raw bank metric formulas: `src/utils/subscriberDashboard.ts:770`.
- Raw usage diagnostics: `src/utils/subscriberDashboard.ts:950`.
- Raw demographics and cohorts: `src/utils/subscriberDashboard.ts:2427` and `src/utils/subscriberDashboard.ts:2470`.
- Dashboard aggregate/raw mixing points: `src/pages/SubscriberDashboardPage.tsx:925`, `src/pages/SubscriberDashboardPage.tsx:1041`, `src/pages/SubscriberDashboardPage.tsx:1163`, and `src/pages/SubscriberDashboardPage.tsx:1453`.
