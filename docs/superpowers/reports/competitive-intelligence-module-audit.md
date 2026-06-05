# Competitive Intelligence Module — Pre-Implementation Audit

**Date**: 2026-06-02  
**Status**: Audit complete. Implementation not yet started.  
**Audited by**: Codebase read — no code changed.

---

## 1. Executive Summary

The Competitive Intelligence tab is the most data-rich module in the dashboard — 10 sections, 8 `SectionInsightsTrigger` modals, two full visualization components, and complex proxy/heuristic logic. But it is also the least upgraded: no module banner, no `KpiCardAnalysisFooter` on any of the four top KPI cards, no `SectionAnalysisBlock` on any section, and no insight builder utility file at all.

The gap is the same as Brand Momentum was before its upgrade — the data layer is complete, the intelligence layer is entirely missing.

There are also two additional issues not present in previous modules:
1. **Color consistency**: The `CustomerSwitchingRadar` and `CustomerMigrationMap` components use cyan (`#22d3ee`) throughout — chart fills, progress bars, border accents, table text. These need to switch to BrandEdge red (`#E10613`) and its variants.
2. **Proxy/heuristic sections need clearer framing**: Several sections use estimated or heuristic data. The current inline disclaimers are present but brief. Each proxy section needs a proper narrative that explains what the signal means, what its limitations are, and what to do with it.

---

## 2. Current Tab Structure

**File**: `src/pages/SubscriberDashboardPage.tsx`  
**TabsContent location**: Lines 4083–4466  
**Total JSX**: ~383 lines

### 2.1 Top-of-tab summary

**None.** The tab opens directly with the 4-card KPI grid. No banner, no executive summary, no framing sentence.

### 2.2 KPI Cards (lines 4086–4111)

Grid: `grid gap-4 md:grid-cols-4`

| # | Title | metricKey | Value | Notes |
|---|-------|-----------|-------|-------|
| 1 | Market Share | `market_share` | `safePercent(competitiveTopMetrics?.marketShare.value)` | No footer |
| 2 | Market Concentration (HHI) | `market_concentration` | `safeNumber(competitiveTopMetrics?.hhi.value)` | No footer |
| 3 | Average Banks per Customer | `avg_banks_per_customer_ci` | `safeNumber(competitiveTopMetrics?.avgBanksPerCustomer.value)` | No footer |
| 4 | Multi-Banking Rate | `multi_banking_rate_ci` | `safePercent(competitiveTopMetrics?.multiBankingRate.value)` | No footer |

All four have `MetricInfoIcon` tooltips via the Card component. None have `KpiCardAnalysisFooter`.

### 2.3 Sections — full inventory

**Section 1 — Market Structure Analysis** (lines 4113–4144)  
Full-width. `SectionInsightsTrigger sectionKey="market_structure_ci"`.  
Table: Bank | Preferred Count | Market Share | Market Share Trend | Share of Voice | SOV vs. Share  
Data: `competitiveDiagnostics.marketStructure.marketRows`  
No `SectionAnalysisBlock`.

**Section 2 — Customer Behavior** (lines 4147–4181, left of 2-col grid)  
`SectionInsightsTrigger sectionKey="customer_behavior_ci"`.  
Sub-grid: 3 Portfolio Composition cards (Exclusive / Bank+1 / Bank+2+).  
Table: Competitor | Users | Overlap %  
Data: `competitiveDiagnostics.customerBehavior.{portfolioComposition, overlapRows}`  
No `SectionAnalysisBlock`.

**Section 3 — Competitive Analysis** (lines 4183–4216, right of 2-col grid)  
`SectionInsightsTrigger sectionKey="competitive_analysis_ci"`.  
Table: Bank | Overlap | Type | Position | Tier  
Data: `competitiveDiagnostics.competitiveAnalysis.positioningRows`  
No `SectionAnalysisBlock`.

**Section 4 — Multi-Bank Competitive Pressure / CustomerSwitchingRadar** (lines 4218–4227)  
Conditional: `{switchingRadar && (...)}`. Full-width.  
Component: `<CustomerSwitchingRadar metrics={switchingRadar} .../>`. No `SectionInsightsTrigger`, no `SectionAnalysisBlock`.  
Internal disclaimer: "This demo view is a directional pressure signal..."  
Cyan colors throughout.

**Section 5 — Preference Drift / CustomerMigrationMap** (lines 4229–4236)  
Conditional: `{migrationMap && (...)}`. Full-width.  
Component: `<CustomerMigrationMap metrics={migrationMap} .../>`. No `SectionInsightsTrigger`, no `SectionAnalysisBlock`.  
Cyan colors throughout.

**Section 6 — Share of Wallet Analysis** (lines 4238–4271, left of 2-col grid)  
**Admin-only**: `{adminMode ? (...) : null}`. `SectionInsightsTrigger sectionKey="share_wallet_ci"`.  
Disclaimer: "Internal-only proxy view. Wallet share is estimated from current-bank overlap..."  
2 Cards: Estimated Wallet Share, Top Wallet Competitor.  
Table: Competitor | Estimated Wallet Share  
Data: `competitiveDiagnostics.shareOfWallet.{estimatedWalletShare, byCompetitor}`  
No `SectionAnalysisBlock`.

**Section 7 — Win/Loss Analysis** (lines 4273–4308, right of 2-col grid)  
Dynamic title: `winLossSectionTitle` — "Observed Preference Transitions" or "Proxy Competitive Balance".  
`SectionInsightsTrigger sectionKey="win_loss_ci"`.  
2 Cards: Win Rate (or Proxy Balance), Evidence Mode.  
Table: Competitor | Gains | Losses | Net | Win Rate (headers change dynamically based on `hasObservedWinLoss`).  
Data: `competitiveDiagnostics.winLoss.{rows, overallWinRate, hasPanelTransitions}`  
No `SectionAnalysisBlock`.

**Section 8 — Strengths & Weaknesses** (lines 4311–4344, left of 2-col grid)  
`SectionInsightsTrigger sectionKey="strengths_weaknesses_ci"`.  
2 Cards: Relative Strength Index, Largest Gap.  
Table: Metric | You | Market Average | Relative | Type  
Data: `competitiveDiagnostics.strengthsWeaknesses.{relativeRows, relativeStrengthIndex}`  
No `SectionAnalysisBlock`.

**Section 9 — Whitespace Opportunities** (lines 4346–4400, right of 2-col grid)  
`SectionInsightsTrigger sectionKey="white_space_ci"`.  
Two tables side-by-side (md:grid-cols-2): Age gaps | Gender gaps  
Data: `competitiveDiagnostics.whiteSpace.{ageRows, genderRows}`  
No `SectionAnalysisBlock`.

**Section 10 — Competitive Risk Signals** (lines 4402–4458)  
Full-width. `SectionInsightsTrigger sectionKey="threat_assessment_ci"`.  
Disclaimer: "Heuristic risk signals built from overlap, share movement, and visibility pressure..."  
Two tables (md:grid-cols-2): Threat table | Risk Indicators table  
Data: `competitiveDiagnostics.threats.{rows, indicators}`  
No `SectionAnalysisBlock`.

---

## 3. Data Sources and Formula Map

### 3.1 Primary computation

**Function**: `computeCompetitiveIntelligenceDiagnostics()`  
**File**: `src/utils/subscriberDashboard.ts` (lines 1718–2028)  
**Signature**: `(responses, trendResponses, country, bankId) => CompetitiveIntelligenceDiagnostics`

### 3.2 Supporting computations

| Function | File | Purpose |
|----------|------|---------|
| `computeCustomerSwitchingRadar()` | `src/utils/customerSwitchingRadar.ts` | Switching pressure heuristic (0.6 × secondChoice + 0.4 × overlap) |
| `computeCustomerMigrationMap()` | `src/utils/customerMigrationMap.ts` | Preference drift among current users |
| `classifyTier()` | `subscriberDashboard.ts` | Bank tier from market share, awareness, NPS |
| `positioningFromShareNps()` | `subscriberDashboard.ts` | Competitive position label |

### 3.3 CompetitiveIntelligenceDiagnostics — full type map

```typescript
interface CompetitiveIntelligenceDiagnostics {
  marketStructure: {
    marketRows: MarketShareRow[];   // bankId, bankName, preferredCount, marketShare, marketShareDelta, shareOfVoice, sovVsShareGap
    hhi: number;                    // Herfindahl-Hirschman Index
    concentrationLabel: string;     // 'Highly concentrated' | 'Moderately concentrated' | 'Fragmented'
  };
  customerBehavior: {
    averageBanksPerCustomer: number;
    multiBankingRate: number;
    overlapRows: OverlapRow[];      // bankName, overlapCount, overlapPct
    portfolioComposition: PortfolioCompositionRow[];  // label, count, pct
  };
  competitiveAnalysis: {
    directCompetitors: string[];
    positioningRows: PositioningRow[];  // bankId, bankName, overlapPct, competitorType, position, tier
  };
  shareOfWallet: {
    estimatedWalletShare: number;
    byCompetitor: WalletShareRow[];  // bankName, estimatedWalletShare
  };
  winLoss: {
    rows: WinLossRow[];           // competitorBankName, gainedFrom, lostTo, net, winRate
    overallWinRate: number;
    hasPanelTransitions: boolean;  // true = observed data, false = proxy signal
  };
  strengthsWeaknesses: {
    relativeRows: RelativeStrengthRow[];  // metric, yourValue, marketAvg, relativeStrength, strengthType
    relativeStrengthIndex: number;
  };
  whiteSpace: {
    ageRows: WhiteSpaceRow[];     // segment, gap, opportunity
    genderRows: WhiteSpaceRow[];
  };
  threats: {
    rows: ThreatRow[];            // competitor, likelihood, impact, riskLevel
    indicators: RiskIndicatorRow[]; // indicator, status, alert
  };
}
```

### 3.4 Formula safety inventory

The following must not change during implementation:

| Function | File | What it computes |
|----------|------|-----------------|
| `computeCompetitiveIntelligenceDiagnostics()` | subscriberDashboard.ts | All competitive diagnostics |
| `computeCustomerSwitchingRadar()` | customerSwitchingRadar.ts | Switching pressure score |
| `computeCustomerMigrationMap()` | customerMigrationMap.ts | Preference drift metrics |
| `classifyTier()` | subscriberDashboard.ts | Bank tier classification |
| HHI formula | subscriberDashboard.ts | Sum of squared market shares |
| Wallet share estimation (1/bankCount allocation) | subscriberDashboard.ts | Wallet depth proxy |
| Threat heuristic: `overlap + max(growth,0) × 10` | subscriberDashboard.ts | Risk signal score |
| Switching pressure: `0.6 × secondChoice + 0.4 × overlap` | customerSwitchingRadar.ts | Radar score per competitor |

Insight builders must only read values from `CompetitiveIntelligenceDiagnostics`, `CustomerSwitchingRadarResult`, and `CustomerMigrationMapResult` — never recompute.

---

## 4. Configuration Inventory

**File**: `src/config/competitiveInsights.ts`

### 4.1 Metric keys (CompetitiveMetricKey) — 9 total

| Key | Title | Formula note |
|-----|-------|-------------|
| `market_share` | "Market Share" | Preferred / Total sample × 100 |
| `market_concentration` | "Market Concentration (HHI)" | Sum of squared market shares |
| `sov_vs_market_share` | "Share of Voice vs Market Share" | SOV − Market Share |
| `avg_banks_per_customer_ci` | "Average Banks per Customer" | Total bank selections / Active customers |
| `multi_banking_rate_ci` | "Multi-Banking Rate" | Customers with 2+ banks / Active × 100 |
| `wallet_share_estimation` | "Wallet Share Estimation" | Inverse bank-count allocation (1/n) |
| `win_rate_ci` | "Competitive Balance" | Gains / (Gains + Losses) × 100 |
| `relative_strength_index` | "Relative Strength Index" | Avg (Your value − Market avg) / Market avg × 100 |
| `threat_indicator` | "Risk Indicator" | Overlap + growth pressure heuristic |

### 4.2 Section keys (CompetitiveSectionInsightKey) — 8 total

| Key | Title |
|-----|-------|
| `market_structure_ci` | "Market Structure Analysis" |
| `customer_behavior_ci` | "Customer Behaviour" |
| `competitive_analysis_ci` | "Competitive Analysis" |
| `share_wallet_ci` | "Share of Wallet" |
| `win_loss_ci` | "Competitive Balance Signals" |
| `strengths_weaknesses_ci` | "Competitive Strengths & Weaknesses" |
| `white_space_ci` | "Whitespace Opportunities" |
| `threat_assessment_ci` | "Competitive Risk Signals" |

Note: CustomerSwitchingRadar and CustomerMigrationMap sections have no section keys registered yet.

---

## 5. Insight Builder Status

| Module | Utility file | Status |
|--------|-------------|--------|
| Awareness | `src/utils/awarenessInsights.ts` | ✅ Complete |
| Usage | `src/utils/usageInsights.ts` | ✅ Complete |
| Loyalty | `src/utils/loyaltyInsights.ts` | ✅ Complete |
| Brand Momentum | `src/utils/momentumInsights.ts` | ✅ Complete |
| **Competitive Intelligence** | `src/utils/competitiveInsights.ts` | ❌ **Does not exist** |

No competitive test files exist either.

---

## 6. Shared Component Usage Audit

| Component | Used in Competitive tab? | Notes |
|-----------|-------------------------|-------|
| `InsightModal` | Indirectly via SectionInsightsTrigger | Not directly called |
| `KpiCardAnalysisFooter` | ❌ Not used | Needed on all 4 KPI cards |
| `SectionAnalysisBlock` | ❌ Not used | Needed on all 10 sections |
| `SectionInsightsTrigger` | ✅ 8 uses | Missing on Radar and Migration sections |
| `MetricInfoIcon` (via Card) | ✅ On all 4 KPI cards | |
| Any banner component | ❌ Not used | Tab needs opening banner |

---

## 7. UX Gaps

### 7.1 No module banner

The tab opens on a 4-card grid with no framing. There is no "where does this bank stand competitively?" narrative. Users looking at Market Share of 12% with an HHI of 1,850 have no context for whether that is strong, normal, or concerning for this market.

### 7.2 All four KPI cards lack interpretation footers

Market Share, HHI, Average Banks per Customer, and Multi-Banking Rate are the tab's headline numbers. All four show values with `?` tooltips but no `KpiCardAnalysisFooter`. A user looking at a multi-banking rate of 74% has no way to know whether this is high, typical for the market, or a signal they should be worried about — without opening the section modals.

### 7.3 All 10 sections end with a table, with no narrative follow-through

`SectionInsightsTrigger` modals exist (on 8 of 10 sections), but there are no `SectionAnalysisBlock` panels showing an inline summary beneath each section. Users must click into a modal to get any interpretation at all. The pattern from Loyalty, Usage, and Momentum is to show an inline takeaway — one clear sentence — beneath the table, with the modal available for deeper analysis.

### 7.4 CustomerSwitchingRadar and CustomerMigrationMap sections have no insight access

These are two of the most analytically interesting sections in the tab — they show competitive pressure and preference drift. Neither has a `SectionInsightsTrigger` or a `SectionAnalysisBlock`. They have inline disclaimer text, but no structured interpretation path.

### 7.5 Cyan colors throughout two major components

`CustomerSwitchingRadar.tsx` and `CustomerMigrationMap.tsx` use cyan (`#22d3ee`) as their accent colour — the radar chart fill, progress bars, border highlights, and table text. This is visually inconsistent with every other part of the dashboard, which uses BrandEdge red (`#E10613`). Both components need a colour pass to align with the dashboard's visual language.

### 7.6 Proxy and heuristic sections need richer framing

Three sections use estimated or heuristic data (Share of Wallet, Win/Loss in proxy mode, Competitive Risk Signals) and two visualization components include proxy disclaimers. The current disclaimers are single-line notes. Each proxy section deserves a short narrative explaining: what the data represents, why it is an estimate, what to read into it, and what not to. This is not a design issue — it is an analytical trust issue.

### 7.7 Share of Wallet is admin-only and has no subscriber equivalent

The Share of Wallet section renders only when `adminMode` is true. Subscribers cannot see it. This may be intentional, but it means the competitive module is missing one of its most commercially relevant sections for subscribers. This is not a bug to fix in the implementation — it is a business decision to flag.

### 7.8 The Competitive Risk Signals section has colour-coded alert text but no explanation of the scale

The Risk Indicators table uses red, yellow, and green text for alert statuses. These colours provide signal but there is no legend or explanation of the thresholds — what triggers red versus yellow. This should be explained in the `SectionAnalysisBlock` narrative.

---

## 8. Proposed Implementation Plan

### Phase 1 — Insight builder utility (new file)

Create `src/utils/competitiveInsights.ts`. Reads from `CompetitiveIntelligenceDiagnostics` and returns `AwarenessInsightResult` objects. No formula recomputation.

Builders to write:

| Function | Consumes | Purpose |
|----------|---------|---------|
| `buildCompetitiveModuleSummary()` | diagnostics, bankName | Banner executive narrative |
| `buildMarketShareInsight()` | marketRows, hhi, concentrationLabel, bankName | Market share KPI footer |
| `buildMultiBankingInsight()` | averageBanksPerCustomer, multiBankingRate, bankName | Multi-banking KPI footer |
| `buildMarketStructureInsight()` | marketRows, hhi, concentrationLabel, bankName | Market Structure section block |
| `buildCustomerBehaviorInsight()` | overlapRows, portfolioComposition, multiBankingRate, bankName | Customer Behavior section block |
| `buildCompetitivePositioningInsight()` | positioningRows, directCompetitors, bankName | Competitive Analysis section block |
| `buildSwitchingRadarInsight()` | switchingRadar (CustomerSwitchingRadarResult), bankName | Switching Radar section block |
| `buildMigrationMapInsight()` | migrationMap (CustomerMigrationMapResult), bankName | Migration Map section block |
| `buildWinLossInsight()` | winLoss, hasObservedWinLoss, bankName | Win/Loss section block — branches on observed vs proxy |
| `buildStrengthsWeaknessesInsight()` | relativeRows, relativeStrengthIndex, bankName | Strengths/Weaknesses section block |
| `buildWhitespaceInsight()` | ageRows, genderRows, bankName | Whitespace section block |
| `buildRiskSignalsInsight()` | threats (rows + indicators), bankName | Risk Signals section block — explains heuristic basis |

### Phase 2 — Module banner component

Create `src/components/analytics/CompetitiveBanner.tsx`. Pattern matches `MomentumBanner`/`LoyaltyBanner`. Display:
- Position label chip: e.g. "MARKET LEADER", "CHALLENGER", "UNDER PRESSURE"
- Executive narrative from `buildCompetitiveModuleSummary()`
- Three stat tiles: Market Share, Multi-Banking Rate, Relative Rank

Position label logic:
- Market rank 1 → "MARKET LEADER"
- rank 2–3 and gap < 5pp → "CLOSE CHALLENGER"
- rank 2–3 and gap ≥ 5pp → "CHALLENGER"
- High rejector share or high threat count → "UNDER PRESSURE"
- Otherwise → "DEVELOPING POSITION"

### Phase 3 — KPI card analysis footers

Wire `KpiCardAnalysisFooter` beneath all four KPI cards using `buildMarketShareInsight()` and `buildMultiBankingInsight()`. HHI and average banks per customer can share a footer — they both describe market structure, so a combined market structure insight applies.

### Phase 4 — Section analysis blocks

Wire `SectionAnalysisBlock` beneath all 10 sections using the builders from Phase 1. This is the single biggest visual change — every section currently ends with a table; each will now end with an inline narrative panel.

### Phase 5 — Add insight triggers to Radar and Migration sections

Add `SectionInsightsTrigger` to the CustomerSwitchingRadar section (new section key: `switching_radar_ci`) and CustomerMigrationMap section (new section key: `migration_map_ci`). Add entries to `src/config/competitiveInsights.ts`.

### Phase 6 — Colour pass on visualization components

Update `CustomerSwitchingRadar.tsx` and `CustomerMigrationMap.tsx`:
- Replace radar chart fill colour `#22d3ee` with `#E10613`
- Replace `bg-cyan-400` progress bars with `bg-[#E10613]`
- Replace `border-cyan-400/20 bg-cyan-500/5` highlight cards with `border-[#E10613]/20 bg-[#E10613]/5`
- Replace `text-cyan-300` table text with `text-[#E10613]`
- Replace amber drift indicator with `text-amber-400` (keep amber for warning signals — this is appropriate)

### Phase 7 — Tests

Create `src/utils/competitiveInsights.test.ts` covering:
- All builders: null cases, bankName in snapshot, section headings present
- `buildWinLossInsight()`: observed vs proxy branches, positive/negative balance
- `buildRiskSignalsInsight()`: no threats, low threats, high threats, critical indicator
- `buildCompetitiveModuleSummary()`: all position tiers
- `buildSwitchingRadarInsight()`: no data case, low pressure, high pressure
- `buildMigrationMapInsight()`: no drift, significant drift

---

## 9. Files Likely to Change

| File | Change type | Risk |
|------|------------|------|
| `src/utils/competitiveInsights.ts` | **Create new** | Low |
| `src/utils/competitiveInsights.test.ts` | **Create new** | Low |
| `src/components/analytics/CompetitiveBanner.tsx` | **Create new** | Low |
| `src/config/competitiveInsights.ts` | **Add 2 section keys** | Very low |
| `src/components/analytics/CustomerSwitchingRadar.tsx` | **Colour pass only** | Low |
| `src/components/analytics/CustomerMigrationMap.tsx` | **Colour pass only** | Low |
| `src/pages/SubscriberDashboardPage.tsx` | **Wire banner, footers, blocks** | Medium |
| `src/utils/subscriberDashboard.ts` | **Do not touch** | — |
| `src/utils/customerSwitchingRadar.ts` | **Do not touch** | — |
| `src/utils/customerMigrationMap.ts` | **Do not touch** | — |

---

## 10. Risks and Safeguards

**Risk 1 — Proxy/heuristic trust**  
Several sections use estimated data. Insight builder text must always acknowledge the proxy nature of these signals, never present estimates as direct observations, and point readers toward what evidence does and does not support. This is particularly important for `buildWinLossInsight()` and `buildRiskSignalsInsight()`.

**Safeguard**: Builder functions receive `hasObservedWinLoss` as a parameter and branch on it. Proxy language (e.g. "based on modelled signal") is required in all non-observed branches. The existing config `keyInsight` text for `win_loss_ci` sets the right tone: "Treat this view as observed only when transition evidence exists."

**Risk 2 — Admin-only content**  
The Share of Wallet section is gated behind `adminMode`. `buildWalletShareInsight()` can still be written and tested but the wiring in the dashboard must preserve the `adminMode` condition. The insight should not be surfaced to subscribers.

**Safeguard**: Keep the existing `{adminMode ? (...) : null}` wrapper untouched. The insight block goes inside it.

**Risk 3 — Colour changes in shared visualization components**  
`CustomerSwitchingRadar.tsx` and `CustomerMigrationMap.tsx` are used in the competitive tab. Changing colours there changes the visual everywhere these components appear. Confirm these components are only used in the competitive tab before applying the colour change.

**Safeguard**: `grep -rn "CustomerSwitchingRadar\|CustomerMigrationMap"` before editing. If used elsewhere, apply colour change via prop instead of hardcoding.

**Risk 4 — Tone on competitive sections**  
Competitive insight language can easily become adversarial or alarmist (e.g. "Bank X is threatening your position"). The tone must remain analytical — describe what the data shows, what the strategic implication is, and what action is available. No hyperbole.

**Risk 5 — SubscriberDashboardPage.tsx file size**  
The file is ~4700 lines. The competitive tab block is lines 4083–4466. All edits must remain within that boundary. Test after each edit batch to catch any indent/JSX close-tag mismatches.

---

## 11. What Each Section Currently Has vs What It Needs

| Section | Currently has | Needs |
|---------|-------------|-------|
| Top of tab | Nothing | CompetitiveBanner |
| Market Share card | MetricInfoIcon tooltip | KpiCardAnalysisFooter |
| HHI card | MetricInfoIcon tooltip | KpiCardAnalysisFooter (shared with Market Share insight) |
| Avg Banks/Customer card | MetricInfoIcon tooltip | KpiCardAnalysisFooter |
| Multi-Banking Rate card | MetricInfoIcon tooltip | KpiCardAnalysisFooter |
| Market Structure section | SectionInsightsTrigger | + SectionAnalysisBlock |
| Customer Behavior section | SectionInsightsTrigger | + SectionAnalysisBlock |
| Competitive Analysis section | SectionInsightsTrigger | + SectionAnalysisBlock |
| Switching Radar section | Nothing | SectionInsightsTrigger + SectionAnalysisBlock + red colour pass |
| Migration Map section | Nothing | SectionInsightsTrigger + SectionAnalysisBlock + red colour pass |
| Share of Wallet section | SectionInsightsTrigger | + SectionAnalysisBlock (admin only) |
| Win/Loss section | SectionInsightsTrigger | + SectionAnalysisBlock (proxy-aware language) |
| Strengths & Weaknesses | SectionInsightsTrigger | + SectionAnalysisBlock |
| Whitespace Opportunities | SectionInsightsTrigger | + SectionAnalysisBlock |
| Risk Signals section | SectionInsightsTrigger | + SectionAnalysisBlock (explain alert thresholds) |
