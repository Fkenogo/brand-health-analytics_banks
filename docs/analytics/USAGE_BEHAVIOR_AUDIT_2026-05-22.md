# Usage & Behavior Module — Audit Report & Design Spec

**Date:** 2026-05-22
**Phase:** Phase 3 — Usage & Behavior analytical enrichment
**Scope:** Usage & Behavior tab only. No formula, denominator, aggregation, or BrandEdge Score changes.

---

## Table of Contents

1. [Audit Findings](#1-audit-findings)
2. [Current Module Map](#2-current-module-map)
3. [Current Metrics: Full Inventory](#3-current-metrics-full-inventory)
4. [Proposed Insight Builder Functions](#4-proposed-insight-builder-functions)
5. [Proposed UI Layout](#5-proposed-ui-layout)
6. [Data Risks / Formula Risks](#6-data-risks--formula-risks)
7. [Reusable Component Risk Assessment](#7-reusable-component-risk-assessment)
8. [Implementation Plan](#8-implementation-plan-task-by-task)
9. [Formula Confirmation](#9-confirmation-no-formula-or-denominator-changes)

---

## 1. Audit Findings

**Tab location:** `src/pages/SubscriberDashboardPage.tsx` lines 2869–3205 — `<TabsContent value="usage_behavior">`

**Data computation:** `src/utils/subscriberDashboard.ts` — `computeUsageDiagnostics()` (lines 953–1128)

**View-filtered hook:** `usageDiagnosticsView` — derived from `usageDiagnostics` with active period/filter applied

**Aggregate service:** `src/services/analyticsAggregateService.ts` — `buildUsageAggregateMetrics()` (lines 928–1070)

**Cloud function:** `functions/analyticsAggregation.js` — `SUPPORTED_METRICS` includes all usage fields (everUsed, currentUsing, preferred, considerationRate, trialRate, retentionRate, churnRate, preferenceRate)

**What the tab has today:**

- 9 data-rich sections already rendered
- `SectionInsightsTrigger` buttons present on 5 sections — but no insight content wired for usage keys
- No module-level intelligence banner
- No inline metric insight panels
- No expandable section analysis blocks
- All intelligence is implicit in the raw numbers — none is interpreted or surfaced

**Gap vs Awareness tab:**

The Awareness tab received (in Phase 2):
- A module-level `AwarenessIntelligenceBanner`
- `AwarenessInsightPanel` below metric card rows
- `SectionAnalysisBlock` expandable panels per section
- `MetricRowAnalysisDrawer` for deep-dive per metric
- A local deterministic insight builder (`src/utils/awarenessInsights.ts`)

Usage & Behavior has none of these intelligence layers. The data model is equally rich — the interpretation is absent.

---

## 2. Current Module Map

The tab renders 9 sections in sequence. All are data-complete. The gap is intelligence, not data.

| # | Section | Render type | Line range | `SectionInsightsTrigger` key |
|---|---------|-------------|-----------|------------------------------|
| 1 | Top metrics row | 5 `Card` components | 2872–2912 | — |
| 2 | Conversion metrics row | 4 `Card` components | 2914–2937 | — |
| 3 | Usage Funnel | `FunnelSteps` | 2939–2964 | `usage_funnel` |
| 4 | Usage Conversion Chain | 4 `MiniBar` | 2966–2977 | `conversion_chain` |
| 5 | Multiple Banking Analysis | 2 `Card` + 3 `MiniBar` + overlap table | 2980–3023 | `multi_banking_overlap` |
| 6 | Multi-Bank Competition | Selected + compare bank cards + second-choice table | 3026–3115 | — |
| 7 | Usage-Based Segmentation | 4 `Card` (NonTriers, Lapsed, Secondary, Primary) | 3117–3126 | — |
| 8 | Drop-Off Analysis & Friction | Friction table with stage/diagnosis | 3128–3157 | `dropoff_friction` |
| 9 | Funnel Health & Competitive Position | Diagnosis text + opportunities table | 3160–3199 | `competitive_growth` |

### Metric cards in row 1 (5-column grid)

| Card label | `metricKey` | Value source |
|------------|-------------|-------------|
| Ever Used | `ever_used` | `usageDiagnostics.trialRate` (labeled as ever-used %) |
| Current Usage | `current_usage` | `usageDiagnostics.currentUsageRate` |
| Preferred (BUMO) | `bumo` | `usageDiagnostics.bumoPenetration` |
| Consideration | `future_consideration_rate` | consideration metric |
| Trial Rate | `trial_rate` | `usageDiagnostics.trialRate` |

### Metric cards in row 2 (4-column grid)

| Card label | `metricKey` | Value source |
|------------|-------------|-------------|
| Retention | `retention_rate` | `usageDiagnostics.retentionRate` |
| Churn | `churn_rate` | `usageDiagnostics.churnRate` |
| Preference Capture | `preference_rate` | `usageDiagnostics.preferenceRate` |
| Multi-Banking | `multi_banking_rate` | `usageDiagnostics.multiBankingPct` |

---

## 3. Current Metrics: Full Inventory

All computed in `computeUsageDiagnostics()` in `src/utils/subscriberDashboard.ts`. **These formulas and denominators must not change.**

### Primary funnel metrics

| Field | Formula | Denominator | Notes |
|-------|---------|-------------|-------|
| `trialRate` | `everCount / awareCount × 100` | Aware respondents | % of aware who tried |
| `currentUsageRate` | `currentCount / awareCount × 100` | Aware respondents | % of aware currently using |
| `retentionRate` | `currentCount / everCount × 100` | Ever-used respondents | % of trial users retained |
| `churnRate` | `100 − retentionRate` | — | Derived from retention |
| `lapseRate` | `(everCount − currentCount) / everCount × 100` | Ever-used respondents | % of trial who lapsed |
| `preferenceRate` | `preferredCount / currentCount × 100` | Current users | % of current users who prefer |
| `bumoPenetration` | `preferredCount / awareCount × 100` | Aware respondents | Preferred as share of aware |

### Multi-banking metrics

| Field | Formula | Denominator |
|-------|---------|-------------|
| `multiBankingPct` | multi-bank users / currentBase | Current users |
| `singleBankerPct` | single-bank users / currentBase | Current users |
| `dualBankerPct` | dual-bank users / currentBase | Current users |
| `multiBankerPct` (3+) | 3+-bank users / currentBase | Current users |
| `primaryPositionInMultiPct` | (preferred & multi-bank) / multi-bank | Multi-bank users |
| `avgBanksPerUser` | mean of `c5_currently_using.length` | Current users |

### Segmentation counts

| Field | Derivation |
|-------|-----------|
| `nonTriersCount` | `max(awareCount − everCount, 0)` |
| `lapsedUsersCount` | `max(everCount − currentCount, 0)` |
| `secondaryUsersCount` | `max(currentCount − preferredCount, 0)` |
| `primaryUsersCount` | `preferredCount` |

### Friction scoring (do not change weighting)

| Stage | Friction weight |
|-------|----------------|
| Aware → Ever Used | `dropoffPct × 1.0` |
| Ever Used → Current | `dropoffPct × 2.0` (weighted — highest-impact stage) |
| Current → Preferred | `dropoffPct × 1.5` |

### Funnel health decision tree (do not change)

| Condition | Diagnosis |
|-----------|-----------|
| `trialRate < 25` | "Awareness doesn't convert: trial barriers limit growth" |
| `trialRate ≥ 50 && retentionRate < 50` | "Leaky bucket: acquisition works but retention weak" |
| `retentionRate ≥ 65 && preferenceRate < 25` | "Secondary bank syndrome: users not choosing primary" |
| `trialRate ≥ 30 && retentionRate ≥ 65 && preferenceRate ≥ 35` | "Healthy usage funnel: balanced" |
| Otherwise | "Mixed performance: prioritize highest friction stage" |

### Competitive benchmarking

| Field | Derivation |
|-------|-----------|
| `usageMedian` | Median `currentUsing %` across all banks in country |
| `retentionMedian` | Median `retentionRate` across all banks |
| `positionLabel` | Matrix: Leader / Challenger / Vulnerable / Struggling (vs medians) |

### Computed lists

- `overlapRows[]` — top 8 competitors by co-usage count
- `dropoffStages[]` — 3-stage friction scores with lostCount, dropoffPct, frictionScore, diagnosis
- `opportunities[]` — 3 opportunities ranked by count: Convert Non-Triers, Reactivate Lapsed, Primary Conversion

---

## 4. Proposed Insight Builder Functions

**New file:** `src/utils/usageInsights.ts`

Reuses `AwarenessInsightResult` from `./awarenessInsights` — the type is structurally generic (snapshot + detail). No new types required. All components (`SectionAnalysisBlock`, `MetricRowAnalysisDrawer`, `AwarenessInsightPanel`) already accept this type.

The `detail` field follows the established section convention: ALLCAPS heading followed by body text, blocks separated by `\n\n`. The components parse this automatically.

### Builder function signatures

```typescript
// Module-level banner narrative
buildUsageModuleInsight(args: {
  trialRate: number;
  retentionRate: number;
  preferenceRate: number;
  funnelHealthDiagnosis: string;
  positionLabel: string;
  sampleSize: number;
}): AwarenessInsightResult | null

// Trial conversion: aware → ever used
buildTrialInsight(args: {
  trialRate: number;
  awareCount: number;
  everCount: number;
  sampleSize: number;
}): AwarenessInsightResult | null

// Retention vs lapse, benchmarked
buildRetentionInsight(args: {
  retentionRate: number;
  churnRate: number;
  lapseRate: number;
  everCount: number;
  currentCount: number;
  retentionMedian: number;
  sampleSize: number;
}): AwarenessInsightResult | null

// Preference capture strength
buildPreferenceInsight(args: {
  preferenceRate: number;
  bumoPenetration: number;
  preferredCount: number;
  currentCount: number;
  positionLabel: string;
  sampleSize: number;
}): AwarenessInsightResult | null

// Multi-banking exposure and risk
buildMultiBankingInsight(args: {
  multiBankingPct: number;
  singleBankerPct: number;
  dualBankerPct: number;
  primaryPositionInMultiPct: number;
  avgBanksPerUser: number;
  sampleSize: number;
}): AwarenessInsightResult | null

// Full funnel health — for Usage Funnel section block
buildUsageFunnelInsight(args: {
  trialRate: number;
  retentionRate: number;
  preferenceRate: number;
  funnelHealthDiagnosis: string;
  highestFrictionStage: string;
  sampleSize: number;
}): AwarenessInsightResult | null

// Friction stage breakdown — for Drop-Off section block
buildDropoffInsight(args: {
  dropoffStages: UsageDropoffStage[];
  highestFrictionStage: string;
  funnelHealthDiagnosis: string;
  sampleSize: number;
}): AwarenessInsightResult | null

// Segment prioritization — for Funnel Health section block
buildSegmentationInsight(args: {
  nonTriersCount: number;
  lapsedUsersCount: number;
  secondaryUsersCount: number;
  primaryUsersCount: number;
  awareCount: number;
  opportunities: UsageOpportunity[];
  sampleSize: number;
}): AwarenessInsightResult | null

// Conversion chain — for Conversion Chain section block
buildConversionChainInsight(args: {
  trialRate: number;
  retentionRate: number;
  preferenceRate: number;
  opportunities: UsageOpportunity[];
  sampleSize: number;
}): AwarenessInsightResult | null
```

### Section mapping

Each builder feeds a named UI slot:

| UI slot | Builder | Detail sections |
|---------|---------|----------------|
| Banner narrative | `buildUsageModuleInsight` | FUNNEL CLASSIFICATION, STRATEGIC CONTEXT, PRIORITY ACTION |
| After row 1 | `buildTrialInsight` | TRIAL CONVERSION SIGNAL, ACQUISITION IMPLICATION, CONSUMER BARRIER SIGNAL |
| After row 2 | `buildRetentionInsight` | RETENTION SIGNAL, BENCHMARK CONTEXT, LAPSE RISK, STRATEGIC IMPLICATION |
| Usage Funnel section | `buildUsageFunnelInsight` | FUNNEL HEALTH CLASSIFICATION, HIGHEST FRICTION POINT, CONVERSION PRIORITY, RECOMMENDED ACTION |
| Conversion Chain section | `buildConversionChainInsight` | CONVERSION LEVER RANKING, ACQUISITION VS RETENTION BALANCE, STRATEGIC PRIORITY |
| Multiple Banking section | `buildMultiBankingInsight` | MULTI-BANKING EXPOSURE, COMPETITIVE SHARE RISK, PRIMARY POSITION STRENGTH, STRATEGIC IMPLICATION |
| Drop-Off section | `buildDropoffInsight` | STAGE-BY-STAGE DIAGNOSIS, HIGHEST FRICTION STAGE, LOST VOLUME ESTIMATE, RECOMMENDED FIX |
| Funnel Health section | `buildSegmentationInsight` | SEGMENT SIZE BREAKDOWN, HIGHEST-ROI TARGET, ACQUISITION VS REACTIVATION CHOICE, STRATEGIC ACTION |
| Retention card deep-dive | `buildRetentionInsight` (full) | Full drawer with definition, all 4 sections |
| BUMO card deep-dive | `buildPreferenceInsight` (full) | Full drawer with definition, all 4 sections |

---

## 5. Proposed UI Layout

**Constraint:** Layout structure does not change. No card resizing, no grid restructuring. Only intelligence layers are added.

### Layer 1 — Module Intelligence Banner (new component)

**Component:** `UsageIntelligenceBanner` (new, `src/components/analytics/UsageIntelligenceBanner.tsx`)

Structurally identical to `AwarenessIntelligenceBanner`. Props are renamed for usage context:

```typescript
interface UsageIntelligenceBannerProps {
  moduleSummary: AwarenessInsightResult | null;
  retentionRate: number | null;
  bumoPenetration: number | null;
  multiBankingPct: number | null;
  positionLabel: string;
  sampleSize: number;
}
```

- **Left column:** Pattern tag (from `funnelHealthDiagnosis` short label) + country · N=
- **Center column:** ◈ Usage Intelligence header + `moduleSummary.snapshot` narrative
- **Right column:** 3 stat boxes — Retention Rate / BUMO Penetration / Multi-Banking %

**Visual system:** Identical BrandEdge gradient, red/charcoal identity. No visual redesign.

**Placement:** Immediately above the first metric card row, inside `<TabsContent value="usage_behavior">`.

### Layer 2 — Metric-Level Insight Panels (direct reuse)

**Component:** `AwarenessInsightPanel` (no changes — reused as-is)

Placement:
- Below row 1 (5 cards): `buildTrialInsight` result — interprets trial + current usage together
- Below row 2 (4 cards): `buildRetentionInsight` result — interprets retention + churn as a pair

Both panels have the standard "View Detailed Analysis" expand toggle.

### Layer 3 — Section Analysis Blocks (direct reuse)

**Component:** `SectionAnalysisBlock` (no changes — accepts any `AwarenessInsightResult | null`)

Replace bare `SectionInsightsTrigger` in these sections with a full `SectionAnalysisBlock` positioned below the section's existing data:

| Section | Replace trigger with | Insight source |
|---------|---------------------|----------------|
| Usage Funnel | `SectionAnalysisBlock` | `buildUsageFunnelInsight` |
| Usage Conversion Chain | `SectionAnalysisBlock` | `buildConversionChainInsight` |
| Multiple Banking Analysis | `SectionAnalysisBlock` | `buildMultiBankingInsight` |
| Drop-Off Analysis | `SectionAnalysisBlock` | `buildDropoffInsight` |
| Funnel Health & Position | `SectionAnalysisBlock` | `buildSegmentationInsight` |

### Layer 4 — Deep-Dive Drawers (direct reuse)

**Component:** `MetricRowAnalysisDrawer` (no changes — accepts any `AwarenessInsightResult`)

Add "VIEW DETAILED ANALYSIS" button to the two highest-value metric cards:
- **Retention Rate card** — opens `buildRetentionInsight` full drawer with definition: "Percentage of respondents who have ever used the bank who are currently active users"
- **BUMO Penetration card** — opens `buildPreferenceInsight` full drawer with definition: "Percentage of aware respondents who name this bank as their primary/most-used bank"

Pattern identical to Awareness metric row drawers.

---

## 6. Data Risks / Formula Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| `retentionRate` denominator is `everCount`, not total sample | Low | Insight text must explicitly state "of those who ever tried" to avoid misreading |
| `preferenceRate` denominator is `currentCount`, not `awareCount` | Low | Both `preferenceRate` and `bumoPenetration` are displayed side-by-side; insight text should reference both with denominators named |
| Small `everCount`: if `everCount < 30`, `retentionRate` is statistically noisy | Medium | Apply sample caution warning in insight builder when `everCount < 30`; suppress insight panel entirely if `everCount < 15` |
| `multiBankingPct` denominator is `currentCount`: if `currentCount === 0`, division-by-zero | Low | `computeUsageDiagnostics` returns 0 safely; insight builder should return null if `currentCount === 0` |
| `positionLabel` depends on country-wide medians: may return "N/A" for sparse data | Low | Guard with explicit `positionLabel !== 'N/A'` check before rendering in banner |
| `funnelHealthDiagnosis` is a deterministic string from a fixed rule set — not null-safe if `usageDiagnostics` is null | None | Already guarded by the `usageDiagnostics !== null` conditional wrapping the entire tab |
| Reusing `AwarenessInsightResult` type for a non-awareness module | Low | The type is structurally generic (snapshot + detail). No semantic coupling to awareness. Acceptable as-is; a future refactor could rename it `InsightResult` |
| `funnelHealthDiagnosis` short forms needed for banner pattern tag | Low | Derive a short label from the diagnosis string (e.g. extract first clause before ":") in the banner component |

---

## 7. Reusable Component Risk Assessment

| Component | Reuse approach | Risk | Notes |
|-----------|---------------|------|-------|
| `AwarenessIntelligenceBanner` | **New component** (`UsageIntelligenceBanner`) | Low | Props are awareness-named (`totalAwareness`, `topOfMind`, `awarenessQuality`) — semantically wrong for usage. Create structural copy with usage-specific prop names and stat labels. Visual system identical. |
| `SectionAnalysisBlock` | **Direct reuse** | None | Accepts `title: string` and `insight: AwarenessInsightResult \| null`. Fully generic. No changes needed. |
| `MetricRowAnalysisDrawer` | **Direct reuse** | None | Accepts any `AwarenessInsightResult`. Fully generic. No changes needed. |
| `AwarenessInsightPanel` | **Direct reuse** | None | Accepts `insight: AwarenessInsightResult \| null`. Fully generic. No changes needed. |

**Summary:** Three of four components are zero-risk direct reuse. Only the banner requires a new component — with identical visual structure but different prop labels and stat slots.

---

## 8. Implementation Plan (Task by Task)

### Task 1 — Create `usageInsights.ts` with all 9 insight builders
- **File:** `src/utils/usageInsights.ts` (new)
- Implement all builders: `buildUsageModuleInsight`, `buildTrialInsight`, `buildRetentionInsight`, `buildPreferenceInsight`, `buildMultiBankingInsight`, `buildUsageFunnelInsight`, `buildDropoffInsight`, `buildSegmentationInsight`, `buildConversionChainInsight`
- Reuses `AwarenessInsightResult` type from `./awarenessInsights`
- Reuses helper pattern (`s()`, `smplSection()`) from `awarenessInsights`
- No UI changes in this task

### Task 2 — Write tests for insight builders
- **File:** `src/utils/usageInsights.test.ts` (new)
- Tests: null guard, small-sample suppression, key narrative phrases present in snapshot and detail
- Pattern matches existing `src/utils/awarenessInsights.test.ts`

### Task 3 — Create `UsageIntelligenceBanner` component
- **File:** `src/components/analytics/UsageIntelligenceBanner.tsx` (new)
- Props: `{moduleSummary, retentionRate, bumoPenetration, multiBankingPct, positionLabel, sampleSize}`
- Visually identical to `AwarenessIntelligenceBanner`: same gradient, 3-column layout, pattern tag, ◈ icon, stats column
- **File:** `src/components/analytics/UsageIntelligenceBanner.test.tsx` (new)
- Tests: renders stat labels, renders snapshot text, handles null gracefully

### Task 4 — Wire metric-level insight panels into the tab
- **File:** `src/pages/SubscriberDashboardPage.tsx`
- Add `useMemo` calls for `trialInsight` and `retentionInsight`
- Add `AwarenessInsightPanel` below row 1 cards (trial insight)
- Add `AwarenessInsightPanel` below row 2 cards (retention insight)
- Add "VIEW DETAILED ANALYSIS" button + `MetricRowAnalysisDrawer` state on Retention and BUMO cards

### Task 5 — Wire section analysis blocks + banner into the tab
- **File:** `src/pages/SubscriberDashboardPage.tsx`
- Add `useMemo` calls for all remaining insight builders
- Add `UsageIntelligenceBanner` at top of tab
- Replace or supplement existing `SectionInsightsTrigger` on 5 sections with `SectionAnalysisBlock` components
- Wire `buildUsageFunnelInsight`, `buildConversionChainInsight`, `buildMultiBankingInsight`, `buildDropoffInsight`, `buildSegmentationInsight`

### Task 6 — Final validation + screenshots
- Full vitest run + TypeScript check
- Screenshots at desktop (1440×900) and mobile (390×844)
- Confirm no layout regressions, no formula changes, no test failures introduced

---

## 9. Confirmation: No Formula or Denominator Changes

The following files will **not be modified** in this implementation:

| File | Reason untouched |
|------|-----------------|
| `src/utils/subscriberDashboard.ts` | `computeUsageDiagnostics()` and all helpers unchanged |
| `src/services/analyticsAggregateService.ts` | `buildUsageAggregateMetrics()` unchanged |
| `functions/analyticsAggregation.js` | Cloud function aggregation logic unchanged |
| All BrandEdge Score computation | Unrelated to this module |

All new code is **additive only**: new insight builders, one new banner component, and new panel/block wires into existing JSX structure in `SubscriberDashboardPage.tsx`.

---

*End of audit report. Ready to proceed to implementation plan generation on confirmation.*
