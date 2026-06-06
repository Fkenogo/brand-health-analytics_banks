# Dashboard Final QA Audit

**Date:** 2026-06-05  
**Scope:** All 7 subscriber-facing dashboard modules  
**Auditor role:** Independent QA / Executive UX review  
**Sources reviewed:** `SubscriberDashboardPage.tsx` (primary, all 5,300+ lines), all intelligence banner components, `KpiCardAnalysisFooter`, `ExecutiveHero`, `FunnelSteps`, `MiniBar`, `Card`, `Sparkline`, `DeltaBadge`, `SectionAnalysisBlock`  
**Code state at time of audit:** Post most recent polish passes — `474b79e`

---

## Executive Summary

**Overall readiness: Release after critical fixes**

The dashboard is architecturally strong and data-rich. The intelligence banner system, the BrandEdge Overview, and the Loyalty module are close to release quality. The insight layer is genuinely differentiated — the KpiCardAnalysisFooter expansion panels, the Scenario Sensitivity table, and the Customer Switching Radar are features a bank executive will find difficult to get elsewhere.

However there are **7 critical issues** that must be resolved before any client sees the product. Three of them — the subscriber header exposing internal infrastructure terminology, residual BUMO acronym instances, and "Proxy" language in Competitive — are the kind of things that get screenshotted in a client meeting and escalated to the account manager. None of the 7 critical issues require formula or logic changes. All are presentation-layer copy and styling fixes.

The 14 recommended improvements are genuine usability enhancements. Several of them would change how quickly an executive can orient themselves on first load and how confident they feel in the data quality.

---

## Critical Issues

*Must be resolved before any client accesses the dashboard.*

---

### C1 — Page header exposes internal engineering infrastructure to all subscribers

**Location:** `SubscriberDashboardPage.tsx` lines 2866–2884  
**Visible to:** Every subscriber on every page load

The subscriber-facing page header, beneath "Brand Health Tracking," permanently renders:

> *Data source: Live Firestore aggregate*

And, when the aggregate is active, adds a second line:

> *Aggregate is the primary source for overview metrics. Some deep-dive diagnostics remain live-response derived.*

When a fallback condition fires — which can happen silently during normal operation — the following renders in **amber warning text**:

> *Aggregate callable fallback: [internal error or reason string]*  
> — or —  
> *Fallback reason: [raw exception message]*

A bank CEO paying for a brand intelligence platform does not need to know what "Firestore" is, what an "aggregate callable fallback" is, or that "deep-dive diagnostics remain live-response derived." If a backend fallback triggers during a client demo, an internal error message prints directly on screen in amber — the colour of a warning.

This block was appropriate for development. It must be removed from the subscriber surface entirely.

**Fix:** Remove lines 2866–2884 from the subscriber view. If data freshness needs to be communicated, replace with a neutral `"Data current as of [date]"` indicator.

---

### C2 — "BUMO" appears in five subscriber-visible locations

**Locations:**
1. Line 3093 — Overview card subtitle: `"${safePercent(selectedMetricsView?.preferred)} preferred (BUMO)"`
2. Line 3682 — Usage KpiCardAnalysisFooter panel heading: `"Preferred (BUMO Penetration)"`
3. Line 3787 — Usage card subtitle: `"Your BUMO share among users with 2+ banks"`
4. Line 5128 — Demographics Age cohort table column header: `BUMO`
5. Line 5164 — Demographics Gender cohort table column header: `BUMO`

"BUMO" (Bank Used Most Often) is an internal research methodology acronym. It has no meaning to a bank executive. The Demographics table column occurrence is the most damaging — a CEO staring at a data table will try to understand every column header, and "BUMO" will read as a typo or technical error.

**Fix:** Replace every instance:
- `"preferred (BUMO)"` → `"preferred bank"`
- `"Preferred (BUMO Penetration)"` → `"Primary Bank Preference"`
- `"Your BUMO share among users with 2+ banks"` → `"Your primary bank position among customers using 2+ banks"`
- Table column `BUMO` → `Preferred` or `Primary Bank`

---

### C3 — "Proxy" language appears three times in Competitive Intelligence

**Locations:**
- Line 1260 — `winLossSectionTitle` (non-observed case): `'Proxy Competitive Balance'`
- Line 1264 — `winLossPrimaryCardTitle` (non-observed case): `'Proxy Balance'`
- Line 1265 — `winLossModeLabel` (non-observed case): `'Proxy signal'`

When no panel-tracked preference transitions exist — which will be the common case for most subscriber accounts — these three strings appear together on screen. The section header reads "Proxy Competitive Balance," the primary card reads "Proxy Balance," and a second card's value reads "Proxy signal."

The word "proxy" in a client-facing analytics context signals that the data is a stand-in for the real thing — an admission that what is being shown is not observed. For a paid brand intelligence product, this undermines confidence. The identical epistemic position is communicated without the negative connotation by "Estimated" or "Modelled."

**Fix:**
- `winLossSectionTitle` non-observed: `'Competitive Win/Loss Estimate'`
- `winLossPrimaryCardTitle` non-observed: `'Estimated Win Rate'`
- `winLossModeLabel` non-observed: `'Modelled estimate'`

---

### C4 — Raw computation formula exposed in Awareness Depth Score card subtitle

**Location:** Line 3505

The Awareness Depth Score card subtitle reads:

> *Weighted: ToM×3 + Spontaneous×2 + AidedOnly×1*

This is a raw multiplication formula rendered verbatim in a primary KPI card that every subscriber can see. A bank CEO reads this as a debugging artifact, not a data label. It is the kind of thing that makes an executive question whether the product is finished.

**Fix:** Replace with: *"Composite recall quality score — combines top-of-mind, spontaneous, and aided recall"*

---

### C5 — "Normalized period growth" in Momentum card subtitle

**Location:** Line 4340

The Awareness Growth Score card subtitle, when sufficient data exists, reads:

> *Normalized period growth · 4 periods*

"Normalized" is a data science term. It has no meaning to an executive. It appears as a subtitle on a primary KPI card in a module that executives are expected to use for strategic direction.

**Fix:** Replace with: *"Period-over-period growth rate · 4 periods"*

---

### C6 — "Evidence Mode" displayed as a named KPI card

**Location:** Line 4870

```tsx
<Card title="Evidence Mode" value={winLossModeLabel} subtitle={winLossModeSubtitle} />
```

"Evidence Mode" is an internal product classification that describes whether win/loss data is observed or modelled. It is not a business metric. Displaying it as a KPI card in the same grid as "Market Share" and "Win Rate" makes it look like a system status widget or a settings toggle. An executive will not know what to do with a card titled "Evidence Mode" with a value of "Proxy signal."

The mode distinction is already communicated clearly in `winLossSectionTitle` and `winLossSectionSubtitle` — the section heading and its sub-text. The card is entirely redundant.

**Fix:** Remove the "Evidence Mode" card entirely.

---

### C7 — Card title and subtitle contrast is insufficient on dark backgrounds

**Location:** `Card` component, lines 493 and 504

KPI card titles use `text-slate-500` (`#64748B`). Card subtitles also use `text-slate-500`. On the `executive-dark` surface-mode backgrounds — `bg-slate-800/70`, `bg-slate-900/40`, `bg-slate-800/55` — the contrast ratio of `#64748B` against a dark background is approximately 2.6:1. WCAG AA requires 4.5:1 for small text (below 18pt).

These cards are the core data layer of the entire dashboard. For an older executive, anyone using a laptop in a bright office, or anyone on a display with reduced brightness, card titles and subtitles will be near-invisible.

**Fix:**
- `variant="primary"` and `variant="secondary"` card titles → `text-slate-200` minimum
- Card subtitles on dark cards → `text-slate-400` minimum
- Audit the `variant="diagnostic"` cards for the same issue

---

## Recommended Improvements

*These would materially improve executive usability and should be resolved before a full commercial launch.*

---

### R1 — "MoM Growth" abbreviation in Awareness

**Line:** 3493  
"MoM" (Month-on-Month) is not a universally understood abbreviation outside market research. An executive unfamiliar with the term will pause.  
**Fix:** Rename card title to "Monthly Growth Rate."

---

### R2 — "Awareness Share Index" is opaque

**Line:** 3499  
The subtitle clarifies it ("Your awareness / total market awareness"), but the metric name itself adds nothing over a clearer alternative.  
**Fix:** Rename to "Share of Market Awareness."

---

### R3 — Executive Priorities panel silently disappears when all metrics are healthy

**Lines:** 3144–3186  
When `executivePriorities.length === 0`, the entire Executive Priorities section vanishes with no message. A CEO who saw this panel last week will not understand why it is gone — and the gap in the layout will look like a render error.  
**Fix:** When empty, render a positive summary card: *"No critical actions identified — all core brand health metrics are within healthy ranges."*

---

### R4 — Demographics module has no intelligence banner

**Lines:** 5060 onward (Demographics TabsContent)  
Every other module opens with an intelligence banner that provides a module-level narrative summary, pattern name, and key tile metrics. Awareness, Usage, Loyalty, Momentum, and Competitive all have banners. Demographics drops immediately from the hero into 4 small KPI cards with no contextual framing. It is the only module that feels unfinished.  
**Fix:** Add a `DemographicsBanner` component (or reuse a generic pattern) that surfaces the top segment name, a one-sentence narrative from the demographic module summary, and the sample size.

---

### R5 — Demographics hero primary score is meaningless to an executive

**Line:** 2505 — `safeNumber(demographicDiagnostics?.highValueSegments[0]?.score)`  
The Demographics hero shows an internal "high-value segment score" as the main `text-6xl` number (e.g., "71"). This number is not analogous to BrandEdge (0–100 composite), Loyalty Index (0–100 weighted), or Momentum Score (0–100 funnel). An executive sees "71" in the large red hero panel with no way to know what it means, what 100 would mean, or whether 71 is good.

When the value is null, the hero renders "--" in the large number slot — which, in a vibrant red gradient card, looks like the module failed to load.  
**Fix:** Replace the Demographics hero primary score with a more meaningful primary number: sample size (`N=X respondents`), or the top age cohort's current usage rate (e.g., "45%"). If the segment score must remain, add an explicit scale label ("Score: 71 / 100") and a one-line descriptor.

---

### R6 — "Segmentation Decision Tree" heading in Loyalty

**Line:** 4133  
"Decision Tree" is a machine-learning term. This section shows bar charts illustrating customer path splits — it contains no decision tree structure in any analytical sense. An executive will not understand the heading.  
**Fix:** Rename to "Customer Pathway Distribution" or "How Customers Are Classified."

---

### R7 — Arrow syntax `'->'` appears in subscriber-visible text

**Lines:** 4135–4136 (Loyalty MiniBar labels), 3759 (Usage funnel counts footnote)  
Several places render `'->'` as a literal string in subscriber-facing text:
- MiniBar label: `"Current users -> Committed/Favors path"`
- Funnel footnote: `"Aware {n} -> Ever {n} -> Current {n} -> Preferred {n}"`

The programming arrow renders as literal characters on screen, not as a typographic flow symbol.  
**Fix:** Replace all `'->'` with `'→'` (Unicode `→`) throughout subscriber-facing strings.

---

### R8 — 5-column KPI grid is too dense at tablet widths

**Line:** 3655 — `md:grid-cols-5`  
The first major content row in Usage places 5 cards in a single row at the `md` breakpoint (768px). Each card receives approximately 120–130px of width. Titles like "Trial Rate" will wrap; values feel cramped. This is the first thing a subscriber sees when opening the Usage module and sets a poor first impression at tablet width.  
**Fix:** Change to `md:grid-cols-3 lg:grid-cols-5`.

---

### R9 — "Cohort Comparison" heading in Demographics

**Line:** 5115  
"Cohort" is academic / analyst language. Bank executives speak about "customer groups" or "age groups."  
**Fix:** Rename to "Age Group Comparison" for the age table and "Customer Group Breakdown" for the combined section.

---

### R10 — Competitive Momentum Analysis table has 10 columns

**Lines:** 4559–4591  
The Competitive Momentum Analysis table renders: Bank, Momentum, Previous, Delta, Growth Rate, Awareness Growth, Consideration, Conversion, Retention, Adoption. Ten columns. On any viewport narrower than approximately 1,400px this requires horizontal scrolling. An executive will not scroll sideways through a data table — they will assume the data stops at the visible column.  
**Fix:** Show 5 columns by default (Bank, Momentum, Delta, Growth Rate, Position) with a "Show component breakdown" toggle that expands the remaining 5 columns. Alternatively cap at `lg:grid-cols` and use `overflow-x-auto` with explicit min-widths and a visible scroll hint.

---

### R11 — "Preferred (BUMO Penetration)" in KpiCardAnalysisFooter panel heading

**Line:** 3682  
Even after the card title was correctly renamed to "Preferred," the expandable analysis footer panel that opens below it still shows the heading `"Preferred (BUMO Penetration)"`. This is subscriber-visible when a user clicks the analysis expander.  
**Fix:** Rename the footer panel title to `"Primary Bank Preference"`.

---

### R12 — Loyalty Trend table: Previous and Delta columns are always empty for three of four metrics

**Lines:** 4255–4260  
The Loyalty Trend table shows Current / Previous / Change for: Loyalty Index, NPS, Committed, Rejectors. However, `previous` and `delta` are hardcoded as `null` for Loyalty Index, Committed, and Rejectors — only NPS receives a previous value from `trendView`. The result is a four-row trend table where three rows always show "—" in both the Previous and Change columns. It looks like incomplete data rather than intentional design.  
**Fix:** Either populate previous-period segment percentages for all four rows (requires confirming the data is available in `trendView`), or remove the rows that cannot show movement from the trend table and replace with a note: *"Segment trend data available after two completed survey waves."*

---

### R13 — "SOV vs. Share" unexplained column header in Market Structure

**Line:** 4698  
The Market Structure table has a column labelled "SOV vs. Share." "SOV" (Share of Voice) is used as an abbreviation in the same header row where "Share of Voice" is spelled out in full two columns earlier. The abbreviation creates inconsistency.  
**Fix:** Rename column to "Voice vs. Share Gap" or "Awareness vs. Market Gap."

---

### R14 — "Churn" card subtitle reads `'100 - retention'`

**Line:** 3722  
The Churn card subtitle reads: `'100 - retention'`. This is a formula, not an explanation.  
**Fix:** Replace with: `"Share of ever-used customers no longer active"` or simply `"Inverse of retention rate."`

---

## Nice-to-Have Improvements

*Optional polish — no user-facing urgency.*

---

### N1 — Awareness tab: no visual hierarchy between primary and secondary KPI rows

The Awareness tab has 8 KPI cards in two undifferentiated rows of 4. The first row (Top of Mind, Spontaneous Recall, Total Awareness, Awareness Quality) contains the primary metrics. The second row (Share of Voice, Monthly Growth, Awareness Share Index, Awareness Depth Score) contains supporting diagnostics. There is no heading, divider, or label separating them. Adding a faint "Supporting Metrics" label before the second row would help executives understand why they are seeing 8 cards instead of the 4 they see in every other module.

---

### N2 — Executive Hero `tone` prop is configured but ignored

Momentum sets `tone: 'momentum'` and Overview sets `tone: 'default'` in `heroConfig`, but the `ExecutiveHero` component neither accepts nor uses a `tone` prop. The property is dead code in the config object. If a future design differentiates modules by accent colour (e.g., indigo for Momentum), this prop exists to enable that — but as-is it creates confusion for anyone reading the config.

---

### N3 — "Pipeline strength" on the Consideration card in Momentum is vague

**Line:** 4358  
The Consideration card subtitle reads: *"Pipeline strength."* This is a sales metaphor that doesn't describe what the metric measures. The metric is the share of aware respondents with strong future intent.  
**Suggestion:** "Share of aware respondents with strong intent."

---

### N4 — "Loyalty Segmentation Analysis" is analyst language

**Line:** 4119  
"Segmentation Analysis" signals a market research deliverable, not an executive readout. "Customer Loyalty Profile" or "How Customers Are Distributed" would be more direct for a CEO audience.

---

### N5 — Momentum forecast cards repeat the same message three times when not eligible

**Lines:** 4531–4537  
When `forecastEligible` is false, all three forecast cards display the same `EMPTY_COPY.forecastUnavailable` string. Three identical grey cards in a row reads as a render failure.  
**Suggestion:** When forecast is not eligible, collapse all three into a single full-width message block instead of rendering three cards.

---

### N6 — Long module sections have no orientation aid

Awareness, Usage, and Competitive Intelligence each contain 8–12 distinct named sections. On desktop, a user who has scrolled halfway down has no indication of how far through the module they are or how much remains. A sticky mini table of contents — or even a subtle progress indicator — would dramatically improve orientation on these long modules.

---

### N7 — "Average Segment Multi-Banking" card title is verbose

**Line:** 5077 — Demographics  
"Average Segment Multi-Banking" takes three words to name what could be "Multi-Banking Rate" with a subtitle explaining it is averaged across age cohorts.

---

### N8 — Strategy Advisor button is visible to users who cannot access it

The floating "Ask Strategy Advisor" button renders for all users including free-tier accounts. For free-tier users clicking it triggers an upgrade prompt — which is acceptable — but the persistent button raises expectations the free tier cannot meet and creates visual noise on every module page.

---

### N9 — Momentum Trends mini-bar labels show "(No delta)"

**Line:** 4504  
Each period bar label in Momentum Trends renders as: `"{month} (No delta)"` when delta is null. The `(No delta)` parenthetical looks like a system message — a failure note — rather than a meaningful label.  
**Suggestion:** When delta is null, show only the month name. No parenthetical.

---

### N10 — Export generates a single-row CSV with no narrative context

`exportCurrentView()` produces a one-row CSV with field names like `brand_edge_score`, `loyalty_index`, `brand_edge_trend_6m`. For an executive, this is raw data — not a deliverable. `exportComparisonView()` exports an array of raw survey response objects, which is entirely unsuitable for an executive recipient.  
**Suggestion:** Document the export explicitly as a "data download for analysis" rather than a report. Add a visible tooltip or description on the Export buttons explaining what the download contains. A future improvement would be an HTML/PDF export with narrative context.

---

## Module-by-Module Findings

---

### Overview

**What works well:**
- BrandEdge Score with `text-6xl` display is the most effective single element on the dashboard. Every executive scans to it first.
- "What drives this score?" strip is the second-best element. One sentence of plain-English narrative that any CEO will read.
- Executive Priorities panel (Critical / Important / Watch badge taxonomy) is intuitive and actionable. The three-card grid layout is clean.
- Module Summary 2×3 card grid gives a fast map of the whole dashboard state.
- Trend sparklines on the primary KPI cards (Awareness, Current Usage, NPS) add wave-over-wave context without cluttering the card.

**Issues identified:**
- `"preferred (BUMO)"` in Current Usage card subtitle — C2.
- Executive Priorities panel disappears entirely when all metrics are healthy — R3.
- Sample size footnote reads `"N=X aggregated respondents"` (line 3134). The word "aggregated" is engineering language. Replace with `"respondents in this period"`.
- Competitive Win Estimate card in the second KPI row has no sparkline, while the adjacent Momentum and NPS cards both have sparklines. Minor visual asymmetry but noticeable.
- The `compareDelta(overviewTopMetrics.loyalty)` logic (line 3102) can produce a delta on the Loyalty Index card when a comparison bank is set. The Loyalty Index delta then shows as `+X` or `-X` without a unit suffix (not `pp`, not `%`, not `/100`). The unit should be explicit.

---

### Awareness & Consideration

**What works well:**
- `AwarenessIntelligenceBanner` is the best-designed component on the dashboard. The pattern name, tile metrics, and snapshot narrative all land at the right level of detail for an executive.
- Funnel Steps visualisation is clear and correctly labelled.
- Brand Rankings table is clean; the selected-bank row highlighting is effective.
- Future Intent section is well-structured with both a KPI grid and a distribution bar.
- Awareness Trend table (wave-over-wave) is clean and appropriately positioned at the bottom of the module.
- `KpiCardAnalysisFooter` expansion panels add depth for users who want it without cluttering the default view.

**Issues identified:**
- "Awareness Depth Score" subtitle exposes formula — C4.
- "MoM Growth" abbreviation — R1.
- "Awareness Share Index" name is unclear — R2.
- 8 KPI cards in two undifferentiated rows — N1.
- "Aided" label in the Awareness Funnel (line 3523) has no tooltip or inline explanation. An executive will not know what "Aided" means versus "Spontaneous." The `MetricInfoIcon` is available on KPI cards but is not attached to funnel step labels.
- The second KPI row uses `md:grid-cols-4`, identical to the first row. Fine structurally, but without a section heading the two rows blend into a wall of 8 indistinguishable cards.

---

### Usage & Behavior

**What works well:**
- `UsageIntelligenceBanner` with the position label system (Healthy Growth, Leaky Bucket, Acquisition Barrier, Secondary Bank) is genuinely useful. An executive can read the banner and know their strategic situation in 10 seconds.
- The 5-card primary KPI grid maps the usage funnel clearly left to right.
- Multi-Banking Analysis section provides competitive intelligence not easily available elsewhere.
- Usage Funnel section handles the empty state cleanly with a dashed border and plain message.
- `KpiCardAnalysisFooter` on the Retention card provides good analytical depth.

**Issues identified:**
- `md:grid-cols-5` too dense at tablet width — R8.
- "Preferred (BUMO Penetration)" in footer panel heading — R11.
- "Your BUMO share among users with 2+ banks" — C2 / R12.
- `'->'` arrows in funnel footnote (line 3759) — R7.
- "Churn" card subtitle reads `'100 - retention'` — R14.
- The "Usage Conversion Chain" section (lines 3769–3773) renders MiniBar items for Trial conversion, Retention, Churn, and Preference capture. These same metrics appear in the KPI row directly above and in the funnel directly to the left. Triple representation of the same metrics on one scroll position dilutes attention.
- "Multi-Bank Competition" section (lines 3835+) has a helpful sample base note but the note reads `"Base: X respondents with 2+ active banks."` The `safeCount` fallback here renders `'--'` if the base is null — so a subscriber could see `"Base: -- respondents with 2+ active banks."` The sentence should not render if the base is unknown.

---

### Loyalty & Satisfaction

**What works well:**
- 4-card primary KPI grid (Loyalty Index, NPS, Committed, Rejectors) is the clearest, most executive-friendly primary KPI layout in the entire dashboard. Four cards, four dimensions, immediately interpretable.
- NPS card subtitle `"X% promoters · X% detractors"` is excellent — gives direct context without requiring a secondary section.
- Segment Profile Cards with Avg NPS, Avg Intent, Top Age, Top Gender, Multi-Bank are genuinely differentiated intelligence.
- NPS Breakdown section has a clear explanatory paragraph that any executive can follow.
- Loyalty Trend section is clean and readable.
- Empty state ("No loyalty data in this slice") is handled gracefully.

**Issues identified:**
- "Segmentation Decision Tree" heading — R6.
- `'->'` arrows in MiniBar labels (lines 4135–4136) — R7.
- Loyalty Trend table: Previous and Delta columns are always empty for Loyalty Index, Committed, and Rejectors — R12.
- The "Loyalty Segmentation Analysis" section (lines 4120–4126) repeats all 5 segment percentages that already appeared in the primary KPI row above. On a single scroll the user sees Committed twice, Rejectors twice. This creates an impression of padding.
- "Accessibles" segment is absent from the primary 4-card KPI row but present in the secondary Segmentation Analysis section. A user familiar with the 5-segment model will notice the gap and wonder if it was intentional.
- Loyalty Trend table Change column does not render a unit (no `pp` suffix on the NPS delta) — just the signed number. Should be `+X pp` for consistency with other trend tables.

---

### Brand Momentum

**What works well:**
- `MomentumBanner` with score, velocity, rank context, and position label is well-structured.
- The velocity + volatility dual concept is well-communicated in the banner and in the Trends section.
- Scenario Sensitivity table is the most analytically valuable section in the entire dashboard — uniquely useful for a strategy conversation.
- Competitive Momentum Analysis rank and gap-to-leader are useful context.
- Trajectory Forecast section correctly handles the not-eligible empty state with a plain language message (not an error).

**Issues identified:**
- "Normalized period growth" in Awareness Growth Score card subtitle — C5.
- 6-column KPI grid at `lg:grid-cols-6` — on large desktop the 6 cards are narrow enough that "Awareness Growth Score" (3 words) wraps to two lines in its title slot.
- "Pipeline strength" subtitle on Consideration card — N3.
- Competitive Momentum Analysis table has 10 columns — R10.
- Momentum Trends MiniBar labels show `"(No delta)"` parenthetical — N9.
- The Momentum Score card subtitle (line 4320) renders `momentumDiagnostics.status` and `momentumDiagnostics.strategy` verbatim as a concatenated string. These are computed strings from the diagnostics engine. If either string contains internal classification labels or technical qualifiers, they will appear directly in the subscriber-facing card subtitle without sanitization.

---

### Competitive Intelligence

**What works well:**
- `CompetitiveBanner` is clean, well-structured, and communicates market position clearly.
- Market Structure table is informative and readable — the most executive-accessible table in the module.
- Customer Switching Radar is visually distinctive and unique to the product.
- Customer Migration Map is equally differentiated and valuable.
- Strengths & Weaknesses relative scoring table is a well-conceived analytical instrument.
- Whitespace Opportunities section (age gaps + behaviour gaps) provides genuinely actionable segmentation intelligence.

**Issues identified:**
- "Proxy Competitive Balance" section header — C3.
- "Proxy Balance" card title — C3.
- "Proxy signal" card value — C3.
- "Evidence Mode" card — C6.
- "SOV vs. Share" unexplained column header — R13.
- `competitorBankName` in the Win/Loss table (line 4886) is populated from `row.competitorBankName`. If a bank ID in the diagnostics data does not resolve to a name in the constants lookup, this field could display a UUID or an empty string. There is no fallback label — recommend `row.competitorBankName || row.competitorBankId || '—'`.
- The "Competitive Analysis" table (line 4773) has a `Tier` column showing `row.tier`. This is a computed classification string from `positioningRows`. Its client-appropriate vocabulary should be confirmed — if `tier` can contain values like `'tier_1'`, `'direct_competitor_high_overlap'`, or similar internal classifiers, they will appear verbatim.
- The "Whitespace Opportunities" table (lines 4944+) has sub-section headers "Age gaps" and "Behaviour gaps" — both good. The table renders but if no whitespace rows exist, there is no empty state message and the table simply shows an empty `tbody`.

---

### Demographics

**What works well:**
- MiniBar distribution charts for age and gender are clean and readable.
- `SampleGuardBadge` on low-n cohort rows is a thoughtful data quality indicator.
- Employment and Education breakdown tables are well-structured.
- Opportunity Gap section communicates the prioritisation clearly.
- Light-background white card treatment is consistent with the recent polish direction.
- Individual row empty states ("No age cohort data in this slice") are handled per-table.

**Issues identified:**
- No intelligence banner — every other module has one — R4.
- "BUMO" column header in Age table (line 5128) and Gender table (line 5164) — C2.
- "Cohort Comparison" heading — R9.
- Demographics hero primary score is a raw segment quality number, not a composite — R5.
- "Average Segment Multi-Banking" card title is verbose — N7.
- The "Top High-Value Segment" card (line 5067) renders its value as `"dimension: segment"` (e.g., "Age: 25-34"). When `highValueSegments[0]` is null, the card renders `"-: -"` — a graceful but unattractive null fallback.
- When `demographicDiagnostics` is entirely null (no demographic data for the selected filters), the Demographics tab renders nothing below the hero. No empty state message, no explanation, just empty space. This will look like a load failure.
- The Employment and Education tables (lines 5200–5260) show only 3 columns (Current, BUMO, NPS) — significantly less detail than the Age/Gender tables (7 columns). No explanation for the reduced detail. An executive may assume the other metrics are missing due to an error.

---

## Hero Section Review

### Component Architecture

`ExecutiveHero` (lines 568–601) renders across all 7 tabs using:
- **Left panel:** `md:col-span-2`, deep red gradient `from-[#5A0B10] via-[#8E1018] to-[#C1121F]`, `p-10`, `text-6xl font-bold` score, `text-sm` delta line, `text-sm text-red-100` summary paragraph
- **Right panel:** Single column `grid gap-6`, 2 white cards each with `rounded-2xl bg-white p-5 shadow-xl`, label `text-xs font-semibold uppercase tracking-wide text-[#667085]`, value `text-3xl font-bold`, optional `descriptor text-[11px] text-[#98A2B3]`

### Strengths

1. **Consistent brand application.** The red gradient creates a strong, unmistakable visual anchor across all 7 tabs. The transition to white right-cards is effective — the contrast pulls the eye to the right-panel values without competing with the main score.

2. **Score prominence.** `text-6xl font-bold` in white on red. Every executive scans to this first. The hierarchy is correct.

3. **Right-card descriptor pattern.** The `descriptor` field (e.g., "Of ever-used customers still active", "Unprompted first recall") adds interpretive context below the metric value without cluttering the primary display. Well-executed.

4. **Delta line directional colour.** The conditional colouring (`#A7F3D0` for positive, `#FECACA` for negative) on the delta line is subtle and appropriate. It does not compete with the score but adds a quick signal.

5. **Summary copy quality.** After the polish passes, all 7 module summaries are plain-language, appropriately brief, and business-oriented. No technical jargon found in any summary line.

6. **No comparison context renders cleanly.** When no comparison bank is selected, the right-card labels ("Top of Mind", "NPS") are clean and uncluttered. The `compareBankName` conditional logic works correctly.

### Weaknesses

1. **"No comparison available" wastes hero real estate.** When `delta` is null and no comparison bank is set, line 579 renders the literal string `'No comparison available'` in the delta line position. This is a passive message that adds no value and takes up a full line of the hero card. An executive reads this and wonders what was supposed to be there. It should be omitted when null, or replaced with a context note like *"First measurement period."*

2. **Demographics hero primary score is not comparable to any other module's score.** The hero shows `demographicDiagnostics?.highValueSegments[0]?.score` as the main `text-6xl` number — an internal quality score for a demographic segment. This number is not on the same scale as BrandEdge (0–100 composite), Loyalty Index (0–100 weighted), or Momentum Score (0–100 funnel). An executive who has just come from the Momentum module will try to interpret "71" as a momentum-equivalent score. When null, the hero renders "--" which looks like a data load failure.

3. **Awareness hero: percentage has no benchmark context in the hero itself.** The Awareness hero displays total awareness % (e.g., "64%") as the main score. Unlike the BrandEdge Score (explicitly 0–100) or Loyalty Index (explicitly 0–100), awareness percentage has no inherent scale context visible at the hero level. Is 64% strong or weak? The module answers this question, but the hero does not. A brief descriptor (e.g., *"Market position: #2 of 8 banks"*) would anchor the number.

4. **`h-full` on right-panel cards creates very tall cards for short values.** The right-panel grid uses `h-full flex-col justify-between` on each white card. With 2 cards filling the height of the large left panel (~280–320px in most viewports), each card is approximately 130–150px tall. When a value like "15%" or "--" fills the `text-3xl` slot, the card has large empty white areas above and below the number. This is particularly visible on the Awareness hero (Top of Mind + Spontaneous may both be low single-digits for smaller banks) and on Demographics (where the right card values are text labels, not numbers).

5. **Mobile: right-panel cards collapse to full-width and become disproportionately tall.** Below the `md` breakpoint, `grid gap-8 md:grid-cols-3` becomes a single column. The left panel renders first (appropriate — the score is the priority). The right-panel cards then each become full-width. Because they inherit `h-full` (set for the desktop two-column layout), they render at full viewport width with a large empty white area around a small number and descriptor. This is a mobile layout regression. The `h-full` constraint should be removed or overridden at breakpoints below `md`.

6. **No visual differentiation between module heroes.** All 7 heroes use the identical red gradient, the identical layout, and the identical typography. A user who navigates between tabs sees the same red card with different numbers. The `tone` property in `heroConfig` is set for Momentum (`'momentum'`) and Overview (`'default'`) but the `ExecutiveHero` component ignores this prop entirely. Even a small visual differentiator — a module label chip, a subtle accent border, or a different gradient stop colour — would help users orient across tab switches.

7. **Right-card `descriptor` presence is inconsistent.** Awareness, Usage, Loyalty, and Momentum heroes all populate `descriptor` on both right cards. Competitive Intelligence and Overview do not include `descriptor` on some right cards. The absence creates visual inconsistency — some right cards have three lines (label, value, descriptor) and some have two (label, value).

### Consistency Matrix

| Attribute | Consistent? | Notes |
|-----------|-------------|-------|
| Left panel gradient | ✅ Yes | All 7 use `from-[#5A0B10] via-[#8E1018] to-[#C1121F]` |
| Score font size | ✅ Yes | `text-6xl font-bold text-white` everywhere |
| Delta line | ✅ Yes | `text-sm font-medium` with conditional colour |
| Summary copy tone | ✅ Yes after polish passes | All 7 are plain-language business text |
| Right card count | ✅ Yes | Always 2 cards |
| Right card layout | ✅ Yes | `bg-white rounded-2xl p-5 shadow-xl` |
| Right card value style | ✅ Yes | `text-3xl font-bold` |
| Right card label style | ✅ Yes | `text-xs font-semibold uppercase tracking-wide text-[#667085]` |
| Descriptor presence | ⚠️ Inconsistent | Not all right-cards have a descriptor — Overview/Competitive lack them on some cards |
| Module visual differentiation | ❌ None | All 7 heroes are visually identical — `tone` prop is ignored |
| Empty state handling | ⚠️ Partial | Demographics shows `--` with no context; other modules show `--` but always have supporting copy |

### Hero-Specific Recommendations

1. Remove `h-full` from right-panel cards below the `md` breakpoint.
2. Omit the "No comparison available" delta line entirely when delta is null (or replace with "No prior period").
3. Replace the Demographics hero primary score with a metric that is interpretable without context — sample size or top-cohort usage rate.
4. Add an awareness benchmark descriptor to the Awareness hero right-panel (e.g., rank in market) to give the main % number an anchor.
5. Populate `descriptor` on all right-card entries in `heroConfig` for visual consistency.
6. If module differentiation is ever implemented, the `tone` prop in `heroConfig` is already the correct hook to wire it up.

---

## Release Recommendation

**Release after critical fixes.**

The 7 critical issues are all presentation-layer fixes. No computation logic, data architecture, or formula changes are required. A single focused copy and styling pass — estimated at **3–5 hours total** — would clear all blockers:

| Fix | Estimated time |
|-----|---------------|
| Remove header data source debug block (C1) | 20 min |
| Replace all BUMO instances across 5 locations (C2) | 30 min |
| Replace "Proxy" language in 3 Competitive strings (C3) | 15 min |
| Fix Awareness Depth Score subtitle (C4) | 5 min |
| Fix "Normalized period growth" text (C5) | 5 min |
| Remove "Evidence Mode" card (C6) | 10 min |
| Fix card title/subtitle contrast on dark surface (C7) | 60–90 min |

After those 7 fixes, the dashboard is appropriate for client-facing use. The 14 recommended improvements should be addressed before full commercial launch. The 10 nice-to-have items are polish that can be scheduled as normal sprint work.

---

## Summary Counts

| Category | Count |
|----------|-------|
| Critical — release blockers | **7** |
| Recommended — pre-launch | **14** |
| Nice-to-Have — polish | **10** |
| **Total findings** | **31** |

---

## Top 10 Improvements by Executive Impact

| Rank | ID | Finding | Module | Impact Rationale |
|------|----|---------|--------|-----------------|
| 1 | C1 | Remove header data source debug text | All | Every subscriber on every page load sees "Live Firestore aggregate." Amber fallback text can expose internal error messages. This is the single most unprofessional element in the product. |
| 2 | C2 | Remove all BUMO instances | Overview, Usage, Demographics | Appears 5 times. Demographics table column header is the worst — a CEO will stare at "BUMO" and either think it's a typo or assume the column has no label. |
| 3 | C3 | Replace "Proxy" language in Competitive | Competitive | Three "Proxy" instances in one section signal that the data is a substitute for real intelligence. "Estimated" communicates the same truth without the credibility cost. |
| 4 | C7 | Fix card contrast on dark backgrounds | All | If card titles are near-invisible at 2.6:1 contrast, the entire KPI layer of the dashboard becomes unreadable in real-world viewing conditions for a meaningful portion of the executive audience. |
| 5 | C4 | Remove formula from Awareness Depth Score subtitle | Awareness | A raw multiplication formula (`ToM×3 + Spontaneous×2 + AidedOnly×1`) printed as a card subtitle looks like unfinished development. |
| 6 | C6 | Remove "Evidence Mode" KPI card | Competitive | A card titled "Evidence Mode" with a value of "Proxy signal" has no business existing alongside "Market Share" and "Win Rate." It looks like a system status widget. |
| 7 | C5 | Fix "Normalized period growth" text | Momentum | "Normalized" is a data science term in the subtitle of a primary KPI card. Easy fix, high visibility. |
| 8 | R3 | Add healthy-state for Executive Priorities | Overview | When all metrics are healthy the panel vanishes. The absence looks like a render error. One sentence of fallback copy resolves it. |
| 9 | R4 | Add intelligence banner to Demographics | Demographics | The only module without narrative framing. Goes from hero card to raw KPI cards with no context — looks unfinished relative to every other module. |
| 10 | R8 | Fix 5-column Usage grid on tablet | Usage | The first content row a subscriber sees in the most data-dense module is 5 cramped cards at tablet width. Sets a poor first impression for the Usage module. |

---

*Audit produced 2026-06-05 by independent code inspection. No implementation performed. All line references are to `src/pages/SubscriberDashboardPage.tsx` unless otherwise noted.*
