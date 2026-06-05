# Awareness Tab — V2 Rich Analytical Dashboard

**Date:** 2026-05-07  
**Tests:** 53 new/updated tests, all passing. 0 regressions in touched files.

---

## 1. What Changed (Before → After)

### Before (V1)

Each metric card had a small collapsed `▸ Analysis` toggle. Clicking it revealed a single short sentence. Section-level panels (Funnel, Rankings, Intent) worked the same way. The default view showed numbers with no interpretation — users had to discover and click every toggle to find any analysis.

```
[ Top of Mind: 12% ]
▸ Analysis          ← tiny, easy to miss, requires click
```

### After (V2)

Every metric card now shows:
1. **Definition line** — "What this measures: …" in muted text above the card panel
2. **Visible insight preview** — 2–3 interpretive sentences rendered immediately, no click
3. **VIEW DETAILED ANALYSIS ▼** button — prominent sky-blue CTA for expanded content

Expanded content renders structured sections split on paragraph breaks:
- **HEADING:** label + body text for each section
- Sections: WHAT IT MEASURES · FORMULA & BASE · CURRENT PERFORMANCE · WHY IT MATTERS · STRATEGIC IMPLICATION · RECOMMENDED ACTION · COMPARE BRAND (if compare active) · SAMPLE NOTE (if n<30)

A new **Awareness Intelligence Summary** panel sits between the two metric rows and the Funnel/Rankings grid — cross-metric synthesis identifying the brand's overall positioning pattern.

Section-level panels (Funnel, Rankings, Future Intent) also show visible previews + the same CTA.

---

## 2. Example: Visible Insight Text — Burundi KCB (Top of Mind)

> Values used: KCB Burundi top-of-mind 12%, vs Equity Bank 28%, sample n=85

**Always-visible preview (no click required):**

> Top-of-mind at 12.0% sits in the moderate tier — a minority recall this brand first — there is room to strengthen brand cues. 16.0pp behind Equity Bank (28.0%).

**Definition line (shown above preview):**

> What this measures: Percentage of people who mention your brand first when asked about banks.

---

## 3. Example: Full Expanded Detail — Top of Mind Metric

Clicking **VIEW DETAILED ANALYSIS ▼** renders the following structured content:

---

**WHAT IT MEASURES:** The share of respondents who name this brand first when asked to recall banks without any prompting. Top-of-mind is the most predictive single measure of brand choice at the moment of decision.

**FORMULA & BASE:** First-mention responses ÷ Total sample × 100. Base includes all respondents regardless of current usage.

**CURRENT PERFORMANCE:** At 12.0%, a minority recall this brand first — there is room to strengthen brand cues. The brand surfaces in some unaided sets but is not dominant. Improvements translate directly into organic conversion.

**WHY IT MATTERS:** Research across categories shows the first-recalled brand captures 3-5× the consideration of brands recalled second or later. Top-of-mind is also a leading indicator — it typically shifts 2-3 quarters before usage or market share moves, making it the earliest measurable warning of competitive pressure.

**STRATEGIC IMPLICATION:** Moderate salience means the brand enters some consideration sets but rarely wins the first-recall slot that drives organic preference.

**RECOMMENDED ACTION:** Invest in brand distinctiveness: develop and consistently apply memorable assets that embed the brand in relevant memory cues.

**COMPARE BRAND:** 16.0pp behind Equity Bank (28.0%). A gap of 16.0pp is a meaningful strategic difference.

---

## 4. Files Changed

| File | Change | Lines |
|------|--------|-------|
| `src/utils/awarenessInsights.ts` | Full rewrite — new `AwarenessInsightResult` interface; all 5 builder functions now return `{ preview, detail } \| null`; rich multi-paragraph detail content for all 8 metric cases and 4 section builders | 348 lines |
| `src/components/analytics/AwarenessInsightPanel.tsx` | Full rewrite — new props `{ insight: AwarenessInsightResult \| null, definition?: string }`; always-visible preview; `useState` toggle for expanded detail; ALLCAPS heading detection in detail renderer | 52 lines |
| `src/pages/SubscriberDashboardPage.tsx` | Added `buildAwarenessModuleSummary` import; added `awarenessModuleSummary` useMemo; added `definition` prop to all 8 metric card panels; added Awareness Intelligence Summary panel between metric rows and section grid; removed deprecated `label` prop from section panels | +18 lines |
| `src/utils/awarenessInsights.test.ts` | Updated all `expect(result).toMatch(...)` → `expect(result?.preview).toMatch(...)`; added 3 new tests for `preview`/`detail` structure | 247 lines |
| `src/components/analytics/AwarenessInsightPanel.test.tsx` | Full rewrite for new interface — 7 tests covering null guard, always-visible preview, CTA button, expand/collapse toggle, definition line | 52 lines |

---

## 5. Build & Test Output

```
src/utils/awarenessInsights.test.ts           46/46 pass
src/components/analytics/AwarenessInsightPanel.test.tsx   7/7 pass

Test Files  2 passed (2)
     Tests  53 passed (53)
  Duration  1.32s
```

TypeScript diagnostics: 0 errors in modified files. The two pre-existing `replaceAll` TS errors at line 3906/3909 of `SubscriberDashboardPage.tsx` are unrelated (present before this change, no change in count).

---

## 6. Do Deterministic Insights Auto-Update?

**Yes — immediately and automatically, with no admin action required.**

All insight builders (`buildAwarenessMetricInsight`, `buildAwarenessFunnelInsight`, etc.) are pure functions. They run inside `useMemo` hooks in `SubscriberDashboardPage.tsx` and are re-computed whenever their input metric values change.

The data flow is:
```
Survey responses → Firestore → awarenessTopMetrics (derived) → useMemo(buildAwarenessMetricInsight) → panel renders
```

When a subscriber changes:
- **Country / bank / time filter** → input metrics change → all insight previews and detail text recompute in the same render cycle
- **Month-over-month data** → `awarenessMoMGrowthPct` updates → MoM Growth insight updates
- **New survey responses uploaded** → Firestore data updates → all downstream memos update

There is no caching layer, API call, or admin refresh needed for the deterministic insight text. The text is computed client-side from the same metric values displayed in the cards.

The **AI Analysis (Admin)** section — the `<AwarenessInsightsReport>` at the bottom — is the only part that requires a manual "Refresh" click and is now hidden behind `adminMode`. Subscribers never see it.

---

## 7. Awareness Intelligence Summary — Pattern Logic

The cross-metric summary panel (new, sits between the metric rows and the Funnel section) identifies one of five patterns:

| Pattern | Condition |
|---------|-----------|
| **Salience leader** | ToM ≥ 20% AND quality ≥ 25% |
| **Hidden gem** | Total awareness < 50% AND ToM ≥ 20% |
| **Recognized-but-forgotten** | Total awareness ≥ 50% AND quality < 20% |
| **Fundamental rebuild required** | Total awareness < 50% AND quality < 20% |
| **Developing** | None of the above |

The summary renders only when `awarenessPayload` is non-null and `sampleSize > 0`.
