# Awareness Tab Analytical Enhancement

**Branch:** main  
**Commits:** `de437ce` → `cbb0215` (5 commits)  
**Date:** 2026-05-07  
**Test coverage added:** 49 new tests (43 unit + 6 component), all passing

---

## Overview

The Awareness & Consideration tab was refactored from an executive summary format into a rich analytical module. The core problem: all insight was either hidden in hover popovers or buried behind an AI "Generate Insights" button at the bottom. Users had to click to find analysis; the dashboard defaulted to numbers with no interpretation.

**After this change:** every metric card and every section shows a collapsible "Analysis" panel populated with deterministic, immediately-available insight text — no button click, no AI round-trip, no loading state.

---

## What Changed

### 1. Deterministic Insight Builder Functions

**New file:** `src/utils/awarenessInsights.ts` (270 lines)  
**Test file:** `src/utils/awarenessInsights.test.ts` (326 lines, 43 tests)

Five pure functions that take metric values and return human-readable analysis strings. All functions return `null` when data is unavailable (no panel renders for missing data).

#### `buildAwarenessMetricInsight(args)`

Interprets a single awareness metric against research-backed thresholds. Supports 8 metric keys:

| Key | Thresholds |
|-----|-----------|
| `top_of_mind` | ≥30% leader, ≥20% strong, ≥10% moderate, ≥5% weak, <5% minimal |
| `spontaneous_recall` | ≥60% excellent, ≥40% good, ≥20% moderate, ≥10% weak, <10% minimal |
| `total_awareness` | ≥90% dominant, ≥70% strong, ≥50% moderate, ≥30% emerging, <30% weak |
| `awareness_quality` | ≥40% excellent, ≥25% good, ≥15% moderate, ≥10% weak, <10% poor |
| `share_of_voice` | ≥30% commanding, ≥20% strong, ≥10% moderate, <10% small |
| `mom_growth` | Positive / flat / negative trajectory copy |
| `awareness_share_index` | ≥30% strong, ≥15% competitive, <15% small |
| `awareness_depth_score` | ≥60 excellent, ≥40 good, ≥20 moderate, <20 weak |

Optional args:
- `compareValue` + `compareBankName` → appends "Xpp ahead/behind [Bank]" line
- `sampleSize < 30` → appends "Low sample size — interpret with caution."
- `awareness_quality < 15` → appends "Priority action: improve distinctive brand cues…"

Returns `null` for other metric keys (e.g. `aided_awareness`) so no panel renders.

#### `buildAwarenessFunnelInsight(args)`

Interprets the awareness funnel conversion ratios:
- `spontaneous / aware ≥ 0.6` → strong recall conversion
- `spontaneous / aware 0.35–0.60` → healthy but improvable
- `spontaneous / aware < 0.35` → passive awareness, strengthen cues
- `topOfMind / aware < 0.10` → known but rarely first recalled
- `topOfMind / aware ≥ 0.30` → strong top-of-mind within aware base

Returns `null` when `aware` is null or zero.

#### `buildAwarenessRankingInsight(args)`

Interprets the competitive ranking table:
- States selected bank's rank, awareness %, and top-of-mind %
- Describes movement: "improved by N positions", "dropped by N", "stable"
- For non-#1 banks: states leader name and the awareness gap in pp

Returns `null` when rows is empty or the selected bank is not found.

#### `buildIntentInsight(args)`

Interprets the future intent & consideration data:
- Average intent level: very high (≥8), high (≥6.5), moderate (≥5), low
- High intent non-users > 25% → "strong acquisition pipeline"
- High intent non-users 10–25% → "moderate acquisition opportunity"
- At-risk current users > 10 → flags churn risk
- Overall intent < 25% → subdued intent note

Returns `null` when `responseBase` is 0.

#### `buildAwarenessModuleSummary(payload)`

Cross-metric synthesis identifying one of four brand positioning patterns:

| Pattern | Condition |
|---------|-----------|
| **Salience leader** | ToM ≥ 20% AND quality ≥ 25% |
| **Recognized-but-forgotten** | Awareness ≥ 50% AND quality < 20% |
| **Hidden gem** | Awareness < 50% AND ToM ≥ 20% |
| **Fundamental rebuild needed** | Awareness < 50% AND quality < 20% |

Adds "small sample" note when `sampleSize < 50`.

---

### 2. AwarenessInsightPanel Component

**New file:** `src/components/analytics/AwarenessInsightPanel.tsx` (24 lines)  
**Test file:** `src/components/analytics/AwarenessInsightPanel.test.tsx` (38 lines, 6 tests)

A minimal collapsible panel using native `<details>/<summary>`. Props:

```tsx
<AwarenessInsightPanel
  insight={string | null}   // null → renders nothing
  label="Analysis"          // optional, defaults to "Analysis"
/>
```

- Returns `null` (no DOM node) when `insight` is null or empty
- Chevron indicator: `▸` when collapsed, `▾` when expanded (CSS `group-open:` toggle)
- Styled with `bg-slate-900/50`, `border-white/5`, `text-slate-300` — matches existing dashboard aesthetics
- No state, no effects, no JS event handlers

---

### 3. Metric-Level Panels Wired into Card Rows

**Modified:** `src/pages/SubscriberDashboardPage.tsx` (+89 lines)

An `awarenessMetricInsights` useMemo computes all 8 metric insights once per render cycle. Each of the 8 awareness cards is wrapped in a `<div>` with its panel below:

```
Row 1 (primary cards)          Row 2 (secondary cards)
─────────────────────          ──────────────────────
Top of Mind                    Share of Voice
  ▸ Analysis                     ▸ Analysis
Spontaneous Recall             MoM Growth
  ▸ Analysis                     ▸ Analysis
Total Awareness                Awareness Share Index
  ▸ Analysis                     ▸ Analysis
Awareness Quality              Awareness Depth Score
  ▸ Analysis                     ▸ Analysis
```

useMemo deps: `awarenessTopMetrics`, `compareAwarenessRow`, `compareBankName`, `sampleSize`, `selectedAwarenessRow`, `awarenessMoMGrowthPct`, `awarenessShareIndex`, `awarenessDepthScore`, `compareAwarenessDepthScore`

---

### 4. Section-Level Panels Wired into Three Sections

**Modified:** `src/pages/SubscriberDashboardPage.tsx` (+37 lines)

Three additional useMemos compute section-level insights, each wired into its section:

| Section | Panel label | Insight function | Placement |
|---------|-------------|-----------------|-----------|
| Awareness Funnel | "Funnel Analysis" | `buildAwarenessFunnelInsight` | After `<FunnelSteps>` |
| Brand Rankings | "Rankings Analysis" | `buildAwarenessRankingInsight` | After rankings `<table>` |
| Future Intent & Consideration | "Intent Analysis" | `buildIntentInsight` | After MiniBar grid |

---

### 5. AI Report Demoted to Admin-Only

**Modified:** `src/pages/SubscriberDashboardPage.tsx` (+6 lines)

The `<AwarenessInsightsReport>` (AI-generated, requires button click) is now gated behind `adminMode` and visually separated:

```tsx
{adminMode && (
  <div className="mt-6 border-t border-white/5 pt-6">
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
      AI Analysis (Admin)
    </p>
    <AwarenessInsightsReport awarenessPayload={awarenessPayload} />
  </div>
)}
```

This means subscribers see a complete analytical dashboard with no loading states. Admins see everything subscribers see, plus the AI report section below.

---

## Implementation Note: Payload Structure Correction

During implementation, a discrepancy was discovered between the plan and the actual codebase. The plan assumed `AwarenessReportPayload` used flat top-level fields (`payload.topOfMind`, `payload.funnelAware`, etc.). The actual interface nests them:

```typescript
payload.metrics.topOfMind     // not payload.topOfMind
payload.funnel.aware          // not payload.funnelAware
```

This affected only `buildAwarenessModuleSummary` (the one function that takes a full payload). The function and its tests were written to match the real interface. All other insight builders take individual numeric values, not the payload, so they were unaffected.

---

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `src/utils/awarenessInsights.ts` | Created | 270 |
| `src/utils/awarenessInsights.test.ts` | Created | 326 |
| `src/components/analytics/AwarenessInsightPanel.tsx` | Created | 24 |
| `src/components/analytics/AwarenessInsightPanel.test.tsx` | Created | 38 |
| `src/pages/SubscriberDashboardPage.tsx` | Modified | +132 |

**Total new lines:** 658 (new files) + 132 (modifications) = 790

---

## Test Results

```
src/utils/awarenessInsights.test.ts             43/43 pass
src/components/analytics/AwarenessInsightPanel.test.tsx  6/6 pass
src/test/subscriberDashboardPage.smoke.test.tsx  3/3 pass
src/test/demographicGuardUI.test.tsx            13/13 pass
```

49 new tests, 0 regressions in modified test files.

---

## Commits

| SHA | Message |
|-----|---------|
| `de437ce` | feat: add deterministic awareness insight builder functions |
| `2404dd8` | feat: add AwarenessInsightPanel expandable component |
| `054c13f` | feat: wire metric-level insight panels into awareness card rows |
| `350b9db` | feat: wire section-level insight panels into funnel, rankings, and intent |
| `cbb0215` | feat: gate AI awareness report to adminMode as secondary feature |
