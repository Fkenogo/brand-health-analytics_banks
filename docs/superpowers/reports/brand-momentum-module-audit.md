# Brand Momentum Module — Pre-Implementation Audit

**Date**: 2026-06-01  
**Status**: Audit complete. Implementation not yet started.  
**Audited by**: Codebase read — no code changed.

---

## 1. Executive Summary

The Brand Momentum tab is about 60% of the way to feature parity with the Awareness & Consideration, Usage & Behavior, and Loyalty & Satisfaction modules. The data model is fully built. Six metric cards render correctly with tooltips. Five analysis sections with tables and trend visualisations are in place. But the tab reads like a brief executive scorecard rather than a full analytical module — because it's missing the intelligence layer that the other three modules now have.

**What's built:** metrics, tables, configuration, computational logic  
**What's missing:** insight builder functions, the module banner, per-metric analysis footers, and SectionAnalysisBlocks wired to narrative content

The gap is in interpretation, not in data.

---

## 2. Current Tab Structure

**File**: `src/pages/SubscriberDashboardPage.tsx`  
**TabsContent location**: Lines 3617–3847 (`value="brand_momentum"`)  
**Total JSX**: approximately 230 lines

### 2.1 Top-of-tab summary

There is **no banner or executive summary** at the top of the Brand Momentum tab. The tab opens directly with the six metric cards. All other upgraded modules open with a banner component that provides an executive read, position label, and key metrics at a glance.

### 2.2 KPI Cards — Row 1 (lines 3620–3672)

Grid: `grid gap-4 md:grid-cols-3 lg:grid-cols-6`

| # | Title | metricKey | Notable props |
|---|-------|-----------|---------------|
| 1 | Momentum Score | `momentum_score` | `delta={velocity}`, `sparklineValues={trends[].score}` |
| 2 | Awareness Growth Score | `awareness_growth_score` | conditional subtitle (low-sample warning vs normal) |
| 3 | Consideration | `consideration_rate_momentum` | subtitle: "Pipeline strength" |
| 4 | Conversion | `conversion_rate_momentum` | subtitle: "Aware → Ever used" |
| 5 | Retention | `retention_rate_momentum` | subtitle: "Ever used → Current" |
| 6 | Adoption | `adoption_rate_momentum` | subtitle: "Current → Preferred" |

All six cards use `variant="primary"` (bold styling) and pass `metricKey` (which renders `MetricInfoIcon` tooltips). None have a `KpiCardAnalysisFooter` — clicking the `?` icon gives the metric definition only, with no deeper interpretation.

### 2.3 Sections — Below the metric row

**Section 1 — Momentum Drivers Analysis** (lines 3676–3705)

- Heading: "Momentum Drivers Analysis"
- Has `SectionInsightsTrigger ctaLabel="View Insights"` — opens the section-level modal
- Table columns: Component | Weight | Score | Contribution | % of Total
- Data: `momentumDiagnostics.contributions` (`MomentumContributionRow[]`)
- No `SectionAnalysisBlock` inline beneath it

**Section 2 — Scenario Sensitivity** (lines 3707–3742)

- Heading: "Scenario Sensitivity"
- Has `SectionInsightsTrigger ctaLabel="View Insights"`
- Table columns: Component | +10 Gain | Gap to 90 | Priority | Difficulty
- Data: joins `momentumDiagnostics.priorities` + `momentumDiagnostics.sensitivity`
- No `SectionAnalysisBlock`

**Section 3 — Momentum Trends** (lines 3746–3772)

- Heading: "Momentum Trends"
- Has `SectionInsightsTrigger ctaLabel="View Insights"`
- Renders `MiniBar` per month and three inline Cards: Velocity, Volatility, Trajectory (3M)
- No `SectionAnalysisBlock`

**Section 4 — Momentum Trajectory Forecast** (lines 3775–3788)

- Heading inside a `<details open>` collapsible element
- Renders a 3-card grid showing projected score per month
- **Has zero insight hooks of any kind** — no SectionInsightsTrigger, no SectionAnalysisBlock, no footer
- This is the weakest section in the entire tab

**Section 5 — Competitive Momentum Analysis** (lines 3791–3839)

- Heading: "Competitive Momentum Analysis"
- Has `SectionInsightsTrigger ctaLabel="View Insights"`
- Three summary cards: Relative Rank, Current Score, Growth Rate
- Full competitive table: Bank | Momentum | Previous | Delta | Growth Rate | Awareness Growth | Consideration | Conversion | Retention | Adoption
- Data: `momentumDiagnostics.competitiveRows` (`CompetitiveMomentumRow[]`)
- No `SectionAnalysisBlock`

### 2.4 Ask Strategy Advisor button

Positioned `fixed bottom-6 right-6 z-40` — it floats over all content on all tabs including Brand Momentum. No specific content-blocking issues have been identified inside the Brand Momentum tab, but the Scenario Sensitivity and Competitive tables are long and the fixed button may overlap the last visible rows on smaller screens.

---

## 3. Data Sources and Formula Map

### 3.1 Primary computation

**Function**: `computeMomentumDiagnostics()`  
**File**: `src/utils/subscriberDashboard.ts` (lines 1515–1697)  
**Signature**: `(responses, trendResponses, country, bankId, months=6) => MomentumDiagnostics`

This function is the single source of truth for all momentum values. It must not be changed.

### 3.2 Core formula

**File**: `src/utils/subscriberDashboard.ts`, function `momentumFromComponents()` (lines 751–765)

```
Momentum Score =
  (awarenessGrowthScore × 0.15)
  + (considerationRate × 0.25)
  + (conversionRate × 0.25)
  + (retentionRate × 0.20)
  + (adoptionRate × 0.15)
```

Weights are defined in `MOMENTUM_WEIGHTS` at lines 15–21. These must not change.

### 3.3 Component formulas

| Metric | Formula / source | Lines |
|--------|-----------------|-------|
| Awareness Growth Score | `growthToScore(growth)`: ≥+10pp → 100; ≤-10pp → 0; else 50+(growth×5) | 767–770 |
| Consideration Rate | `currentMetrics.consideration` (% of aware respondents who considered) | 1500 |
| Conversion Rate | `currentMetrics.conversion` (aware → ever-used rate) | 1501 |
| Retention Rate | `currentMetrics.retention` (ever-used → current rate) | 1502 |
| Adoption Rate | `currentMetrics.adoption` (current → preferred rate) | 1503 |
| Velocity | Recent 3-month avg − earlier 3-month avg (of monthly scores) | 1615–1617 |
| Volatility CV | (std dev / mean) × 100 across the trend window | 1620–1625 |
| Trajectory Forecast | Linear regression slope × 1/2/3 step projection | 1627–1641 |
| Momentum Score status | ≥80 Excellent, ≥60 Good, ≥40 Moderate, ≥20 Weak, <20 Crisis | 1482–1488 |
| Priority Score | (gap × weight) / difficulty | 1568–1581 |
| Contributions | weight × score per component | 1537–1552 |

### 3.4 Aggregate-backed version

**Function**: `buildAggregateBackedMomentumSummary()`  
**File**: `src/services/analyticsAggregateService.ts` (lines 1110–1138)  
**Purpose**: Used when overview aggregate data is available. Returns simplified score, status, strategy, and component scores. Used in the Overview tab comparison panel. Does not feed the Brand Momentum tab directly.

### 3.5 Component weights constant

```typescript
// src/utils/subscriberDashboard.ts, lines 15-21
const MOMENTUM_WEIGHTS = {
  awarenessGrowth: 0.15,
  consideration:   0.25,
  conversion:      0.25,
  retention:       0.20,
  adoption:        0.15,
};
```

**Do not touch these.** They are the contractual formula.

---

## 4. Configuration Inventory

**File**: `src/config/momentumInsights.ts`

### 4.1 Metric keys (MomentumMetricKey)

| Key | Title | Formula note |
|-----|-------|-------------|
| `momentum_score` | Brand Momentum Score | Weighted composite |
| `awareness_growth_score` | Awareness Growth Score | growthToScore() transform |
| `consideration_rate_momentum` | Consideration Rate | % aware who considered |
| `conversion_rate_momentum` | Conversion Rate | Aware → Ever used |
| `retention_rate_momentum` | Retention Rate | Ever used → Current |
| `adoption_rate_momentum` | Adoption Rate | Current → Preferred |
| `momentum_velocity` | Momentum Velocity | 3M avg delta |
| `trajectory_forecast` | Momentum Trajectory Forecast | Linear regression |
| `volatility_score` | Momentum Volatility | CV (std dev / mean × 100) |
| `relative_momentum` | Relative Momentum | Rank vs competitors |

### 4.2 Section keys (MomentumSectionInsightKey)

| Key | Title |
|-----|-------|
| `momentum_drivers` | "Momentum Drivers: How to Interpret" |
| `momentum_trends` | "Momentum Trends & Stability" |
| `competitive_momentum` | "Competitive Momentum Analysis" |

Note: The Scenario Sensitivity and Trajectory Forecast sections do not yet have section keys registered in the config. They will need entries added when insight builders are written.

---

## 5. Insight Builder Status

| Module | Utility file | Builder functions | Status |
|--------|-------------|------------------|--------|
| Awareness | `src/utils/awarenessInsights.ts` | 8+ builders | ✅ Complete |
| Usage | `src/utils/usageInsights.ts` | 8+ builders | ✅ Complete |
| Loyalty | `src/utils/loyaltyInsights.ts` | 8 builders | ✅ Complete |
| **Momentum** | `src/utils/momentumInsights.ts` | — | ❌ **Does not exist** |

The full intelligence layer for Brand Momentum needs to be written from scratch.

---

## 6. Shared Component Usage Audit

| Component | Used in Momentum tab? | Notes |
|-----------|----------------------|-------|
| `InsightModal` | ❌ No | Used by KpiCardAnalysisFooter — needs wiring |
| `KpiCardAnalysisFooter` | ❌ No | Fully built, used in Awareness/Usage/Loyalty cards |
| `SectionAnalysisBlock` | ❌ No | Imported in SubscriberDashboardPage but not wired in Momentum |
| `SectionInsightsTrigger` | ✅ Yes | 4 uses (Drivers, Sensitivity, Trends, Competitive) |
| `MetricInfoIcon` | ✅ Yes | Via Card component on all 6 metric cards |
| `LoyaltyBanner` | ❌ No | Momentum needs its own banner component |
| `AwarenessIntelligenceBanner` | ❌ No | Same — Momentum needs its own |
| BrandEdge red (`#E10613`) | ✅ Yes | Used in SectionInsightsTrigger, MiniBar accent |

---

## 7. UX Gaps

### 7.1 No executive summary banner

Every upgraded module opens with a banner: a position label chip, an executive narrative, and 2–3 key metrics at a glance. Brand Momentum has none. The user lands directly on a 6-card grid with no framing, no "where does this bank stand?" context, and no takeaway sentence.

### 7.2 Metric cards with no interpretation

All six top-row cards have `?` tooltips with metric definitions. But when you click the `?`, you see a formula — not an interpretation. You learn what Momentum Score measures, but not whether 45/100 is worrying, normal, or good for this market. The KpiCardAnalysisFooter pattern (used in every Loyalty and Usage card) gives you that interpretation inline below the card. None of the six Momentum cards have it.

### 7.3 Trajectory Forecast section is analytically empty

The Momentum Trajectory Forecast section (lines 3775–3788) shows three projected scores in a grid. That's it. No note on what drove the projection. No interpretation of whether the trajectory is improving or declining. No action signal. This is the most forward-looking section in the entire module and it has the least content.

### 7.4 SectionAnalysisBlock is imported but not used

`SectionAnalysisBlock` is already imported in `SubscriberDashboardPage.tsx` and used extensively in the Loyalty and Usage tabs. In Brand Momentum, it is never called. Every section ends with a table or a chart — but no narrative paragraph summarising what that section means for the bank.

### 7.5 Scenario Sensitivity reads as a data table, not as a recommendation

The Scenario Sensitivity table shows what would happen if each component improved by 10 points. This is the most actionable section in the module — but there is no narrative explaining which lever to pull first, why, or what the realistic path looks like. It needs a `SectionAnalysisBlock` driven by a `buildScenarioSensitivityInsight()` function.

### 7.6 Velocity and Volatility have no plain-language explanation

The Trends section shows Velocity (+X.X) and Volatility (X.X%) as raw numbers. A user who is not a quant will not know what these mean in plain terms. "Velocity of +4.2 means the bank is gaining ground" is more useful than the number alone. These need inline micro-labels or a SectionAnalysisBlock explaining the current state in a sentence.

### 7.7 Competitive Momentum table has no summary

The competitive table is rich — it shows 9 columns of data per bank. But there is no opening sentence like "Bank X leads the market with a score of 72. Your bank ranks 3rd out of 6." The SectionInsightsTrigger modal exists, but a `SectionAnalysisBlock` with a deterministic summary would give the user the key read without requiring them to open a modal.

### 7.8 The `<details open>` pattern for Trajectory Forecast is inconsistent

All other sections use `dashboard-section` divs. The Trajectory Forecast uses an HTML `<details>` element (lines 3775–3788). While functional, this is visually inconsistent with the rest of the tab and will be harder to style consistently. Consider migrating to the standard section pattern.

### 7.9 Styling

No blue colours were found in the Brand Momentum tab. All accent colours correctly use `#E10613` (BrandEdge red) or its alpha variants. No visual language corrections needed on colour.

---

## 8. Formula Safety Notes

The following must not be changed at any point during implementation:

- `momentumFromComponents()` in `subscriberDashboard.ts` — the core weighted formula
- `MOMENTUM_WEIGHTS` constant — the 5 component weights
- `growthToScore()` — the awareness growth normalisation transform
- `scoreStatus()` and `scoreStrategy()` — the classification thresholds
- `computeMomentumDiagnostics()` — the main diagnostic function
- All denominators in contribution and conversion calculations

Insight builders consume computed values from `MomentumDiagnostics` — they never recompute. They read `diagnostics.score`, `diagnostics.velocity`, etc. and produce narrative. This is the safe pattern used by all other insight builder files.

---

## 9. Proposed Implementation Plan

### Phase 1 — Insight builder utility (new file)

Create `src/utils/momentumInsights.ts`. This file does not touch any formula. It reads from `MomentumDiagnostics` and produces `AwarenessInsightResult` objects for use in footers and banners.

Builders to write:

| Function | Purpose | Consumes |
|----------|---------|----------|
| `buildMomentumModuleSummary()` | Banner executive narrative | score, velocity, status, strategy |
| `buildMomentumScoreInsight()` | Momentum Score KPI footer | score, status, tier breakdown |
| `buildVelocityInsight()` | Velocity + Volatility KPI footer | velocity, volatilityCv, trend direction |
| `buildComponentInsight()` | Per-component card footer (reused for each of the 5) | componentScore, weight, contribution |
| `buildDriversInsight()` | Momentum Drivers section analysis | contributions, priorities |
| `buildScenarioSensitivityInsight()` | Scenario Sensitivity section analysis | sensitivity, priorities, top lever |
| `buildTrendInsight()` | Momentum Trends section analysis | trends, velocity, volatilityCv, forecast |
| `buildTrajectoryInsight()` | Trajectory Forecast section analysis | forecast, velocity, current score |
| `buildCompetitiveMomentumInsight()` | Competitive section analysis | competitiveRows, selectedRank, score |

### Phase 2 — Module banner component

Create `src/components/analytics/MomentumBanner.tsx`. Pattern matches `LoyaltyBanner.tsx`. Displays:

- Position label chip (e.g. "STRONG MOMENTUM", "BUILDING", "DECLINING")
- Executive narrative from `buildMomentumModuleSummary()`
- Three compact metric tiles: Momentum Score, Velocity, Relative Rank

Wire into `SubscriberDashboardPage.tsx` at the top of the `brand_momentum` TabsContent, above the KPI card row.

### Phase 3 — KPI card analysis footers

Wire `KpiCardAnalysisFooter` beneath each of the six metric cards using the insight builders from Phase 1. Pattern is identical to Loyalty and Usage tabs. Each footer triggers an `InsightModal` with the full narrative.

### Phase 4 — Section analysis blocks

Wire `SectionAnalysisBlock` beneath each of the five content sections. Use `buildDriversInsight()`, `buildScenarioSensitivityInsight()`, `buildTrendInsight()`, `buildTrajectoryInsight()`, and `buildCompetitiveMomentumInsight()` as the `insight` prop.

### Phase 5 — Config additions

Add two new section keys to `src/config/momentumInsights.ts`:
- `scenario_sensitivity` — "Scenario Sensitivity: How to Interpret"
- `trajectory_forecast` — "Momentum Trajectory Forecast"

Add metric key if not already present:
- Confirm `momentum_velocity` and `volatility_score` entries have full `interpretationThresholds`

### Phase 6 — Trajectory Forecast layout cleanup

Migrate the Trajectory Forecast from the `<details open>` HTML pattern to the standard `dashboard-section` div pattern, consistent with all other sections.

### Phase 7 — Tests

Write `src/utils/momentumInsights.test.ts` covering:
- `buildMomentumModuleSummary()` — returns null when no data; snapshot includes bank name; covers all tier branches
- `buildMomentumScoreInsight()` — covers Excellent, Good, Moderate, Weak, Crisis tiers
- `buildVelocityInsight()` — positive/negative/stable velocity branches
- `buildDriversInsight()` — identifies top driver and top drag correctly
- `buildScenarioSensitivityInsight()` — identifies highest-leverage component
- `buildTrendInsight()` — handles single-month, multi-month, and no-trend cases
- `buildTrajectoryInsight()` — handles improving, flat, declining trajectory
- `buildCompetitiveMomentumInsight()` — rank 1, rank middle, rank last branches

---

## 10. Files Likely to Change

| File | Change type | Risk level |
|------|------------|------------|
| `src/utils/momentumInsights.ts` | **Create new** | Low — pure read |
| `src/utils/momentumInsights.test.ts` | **Create new** | Low |
| `src/components/analytics/MomentumBanner.tsx` | **Create new** | Low |
| `src/config/momentumInsights.ts` | **Add 2 section keys** | Very low |
| `src/pages/SubscriberDashboardPage.tsx` | **Wire banners, footers, blocks** | Medium — large file, surgical edits only |
| `src/utils/subscriberDashboard.ts` | **Do not touch** | — |
| `src/services/analyticsAggregateService.ts` | **Do not touch** | — |

---

## 11. Risks and Safeguards

**Risk 1 — Large file edits**  
`SubscriberDashboardPage.tsx` is the largest file in the project (~4700 lines). Edits must be surgical. Only the `brand_momentum` TabsContent block should change. No other tab content should be touched.

**Safeguard**: Edit only within the `value="brand_momentum"` TabsContent boundary (lines 3617–3847). Confirm line ranges before each edit.

**Risk 2 — Formula drift**  
Insight builders that accidentally recompute metrics (instead of reading them from `MomentumDiagnostics`) could diverge from the actual computed values shown in the cards.

**Safeguard**: Insight builders must only consume values from the `diagnostics` or `topMetrics` objects passed as arguments. Never import or call `momentumFromComponents()`, `growthToScore()`, or any computation function from within `momentumInsights.ts`.

**Risk 3 — Tone regression**  
Previous modules have established a clear writing standard: senior banking strategy analyst, not AI-generated text. New insight builders must follow this tone — plain language, no em dash overuse, no phrases like "structural commercial headwind" or "portfolio exposure."

**Safeguard**: Review all insight text before wiring. Use the same language patterns as `loyaltyInsights.ts` as the reference.

**Risk 4 — Test coverage gap**  
The insight builders will have many branching conditions (score tiers, velocity directions, competitive rank positions). Untested branches will ship with unknown behaviour.

**Safeguard**: Write tests before wiring builders into the UI. Each branch should have at least one test case.

---

## 12. Quick Reference — What Each Section Needs

| Section | Currently has | Needs |
|---------|-------------|-------|
| Top of tab | Nothing | MomentumBanner with executive read |
| Momentum Score card | MetricInfoIcon tooltip | KpiCardAnalysisFooter → InsightModal |
| Awareness Growth card | MetricInfoIcon tooltip | KpiCardAnalysisFooter → InsightModal |
| Consideration card | MetricInfoIcon tooltip | KpiCardAnalysisFooter → InsightModal |
| Conversion card | MetricInfoIcon tooltip | KpiCardAnalysisFooter → InsightModal |
| Retention card | MetricInfoIcon tooltip | KpiCardAnalysisFooter → InsightModal |
| Adoption card | MetricInfoIcon tooltip | KpiCardAnalysisFooter → InsightModal |
| Momentum Drivers | SectionInsightsTrigger | SectionAnalysisBlock below table |
| Scenario Sensitivity | SectionInsightsTrigger | SectionAnalysisBlock below table |
| Momentum Trends | SectionInsightsTrigger | SectionAnalysisBlock below Velocity/Volatility tiles |
| Trajectory Forecast | Nothing | SectionAnalysisBlock + layout normalisation |
| Competitive Momentum | SectionInsightsTrigger | SectionAnalysisBlock below competitive table |
