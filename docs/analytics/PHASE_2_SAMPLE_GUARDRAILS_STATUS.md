# Phase 2: Statistical Reliability / Sample Guardrails — Implementation Status

Generated: 2026-05-03

---

## Summary

**Phase 2 has not been started.** The IDE restart occurred before any guardrail code was written.
The approved architecture exists only in conversation context — no files, types, functions,
components, or tests have been created.

---

## Approved Architecture (not yet implemented)

### Layer 1 — Data layer
```ts
computeSampleGuard(n: number): SampleGuard
```
Attaches guard metadata to rows. Thresholds:
- `displayEligible`: n >= 5
- `diagnosticEligible`: n >= 10
- `recommendationEligible`: n >= 15

### Layer 2 — Rendering layer
```ts
applyGuardedRendering(rows, context): rows
```
Controls suppression/removal per context — never mutates originals.

| Context | Behavior when n < threshold |
|---|---|
| Tables | Keep row; dim row; suppress metric cells with "—" if n < 5 |
| Profile charts | Keep segment; dim/mute; show Low n indicator if n < 5 |
| Rankings / diagnostics | Remove row if n < 10 |
| Executive summary / strategy advisor | Remove row if n < 15 |

### Layer 3 — UI layer
- `SampleGuardBadge` — inline badge for low-n segments
- `SampleGuardFooter` — footnote explaining suppressed rows

### Unchanged
- `getMetricReliability()` stays as-is: high >= 30, medium >= 10, low < 10

---

## What Was Completed

**Nothing.** Zero Phase 2 lines of code exist in the repository.

---

## What Is Partially Completed

None.

---

## What Is Missing (full list)

| Item | Status |
|---|---|
| `src/utils/sampleGuards.ts` | MISSING |
| `src/components/ui/SampleGuardBadge.tsx` | MISSING |
| `src/components/ui/SampleGuardFooter.tsx` | MISSING |
| `SampleGuard` type in `src/types.ts` | MISSING |
| `guard?: SampleGuard` field on `DemographicCohortRow` | MISSING |
| `guard?: SampleGuard` field on `CompetitiveRow` | MISSING |
| `guard?: SampleGuard` field on `DemographicOpportunityRow` | MISSING |
| `guard?: SampleGuard` field on all other affected row types | MISSING |
| `computeSampleGuard()` call in demographic row builders | MISSING |
| `computeSampleGuard()` call in cohort/ranking/diagnostic row builders | MISSING |
| `applyGuardedRendering()` used in table UI surfaces | MISSING |
| `applyGuardedRendering()` used in chart UI surfaces | MISSING |
| `applyGuardedRendering()` used in rankings/diagnostics surfaces | MISSING |
| `applyGuardedRendering()` used in executive summary / strategy advisor | MISSING |
| Tests for `computeSampleGuard()` | MISSING |
| Tests for `applyGuardedRendering()` | MISSING |

---

## Files Changed So Far

None. The following files will be modified or created when implementation begins:

**New files (to create):**
- `src/utils/sampleGuards.ts`
- `src/components/ui/SampleGuardBadge.tsx`
- `src/components/ui/SampleGuardFooter.tsx`
- `src/test/sampleGuards.test.ts`

**Modified files (to update):**
- `src/types.ts` — add `SampleGuard` interface; add `guard?` to row types
- `src/utils/subscriberDashboard.ts` — attach `computeSampleGuard()` in row builders
- `src/services/analyticsAggregateService.ts` — attach in any aggregate row builders
- `src/pages/SubscriberDashboardPage.tsx` — apply `applyGuardedRendering()` and render `SampleGuardBadge`/`SampleGuardFooter` at table/chart/ranking surfaces

---

## Current Build / Test Status

| Check | Result |
|---|---|
| `npm run build` | ✅ PASS — 2610 modules, 0 errors |
| `npm run test -- src/test/analyticsAggregateService.test.ts` | ✅ PASS — 12/12 tests |
| Any sampleGuards test | N/A — file does not exist |

The build and existing tests are clean. Phase 2 has a green baseline to start from.

---

## Risks and Gaps

1. **Row type coverage** — `subscriberDashboard.ts` defines at least 15+ `*Row` interfaces (e.g.
   `DemographicCohortRow`, `CompetitiveRow`, `GeographyRow`, `SecondChoiceShareRow`,
   `LoyaltyMovementRow`, `MomentumContributionRow`, `MarketShareRow`, `WinLossRow`, etc.).
   Each one used in a context governed by guardrail rules needs `guard?` added. Missing even one
   will leave data silently unguarded.

2. **`applyGuardedRendering` context taxonomy** — the four contexts (table, profile-chart,
   rankings/diagnostics, executive/strategy) must be mapped to actual component call sites in
   `SubscriberDashboardPage.tsx` (which is ~1800 lines). This mapping does not yet exist.

3. **Immutability contract** — approved behavior requires no mutation of original rows. The
   implementation must use spread/filter, never in-place modification.

4. **No `pointer-events-none` on dimmed rows** — approved constraint; easy to violate accidentally
   when adding Tailwind dim classes.

5. **`SubscriberDashboardPage.tsx` size** — at 246 KB minified, this file is already very large.
   Wiring `applyGuardedRendering` and guard UI into every relevant surface without creating
   duplicate logic is a non-trivial scope. Consider extracting table/chart renderers before or
   alongside Phase 2.

---

## Recommended Implementation Order

1. **`src/utils/sampleGuards.ts`** — implement `SampleGuard` type, `computeSampleGuard()`,
   and `applyGuardedRendering()` with all four context modes.

2. **`src/test/sampleGuards.test.ts`** — unit tests for every threshold boundary and every
   context mode before touching any row types or UI.

3. **`src/types.ts`** — add `SampleGuard` interface and `guard?: SampleGuard` field to the
   row types that will be used in guarded surfaces (start with `DemographicCohortRow`).

4. **Row builders in `subscriberDashboard.ts`** — attach `computeSampleGuard(row.sample)` in
   `buildDemographicCohortRows()` (around line 2350) and any other builder that produces rows
   for guarded surfaces.

5. **`src/components/ui/SampleGuardBadge.tsx`** — inline badge component.

6. **`src/components/ui/SampleGuardFooter.tsx`** — footnote component.

7. **`SubscriberDashboardPage.tsx` table surfaces** — wrap with `applyGuardedRendering(rows, 'table')`.

8. **`SubscriberDashboardPage.tsx` chart surfaces** — wrap with `applyGuardedRendering(rows, 'profile-chart')`.

9. **`SubscriberDashboardPage.tsx` ranking/diagnostic surfaces** — wrap with `applyGuardedRendering(rows, 'diagnostics')`.

10. **`SubscriberDashboardPage.tsx` executive/strategy surfaces** — wrap with `applyGuardedRendering(rows, 'executive')`.
