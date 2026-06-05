# Trends & Forecasts Tab Refactor — Audit Report

**Date:** 2026-06-04  
**Status:** Complete.

---

## 1. Where the Tab Was Rendered

| File | Line(s) | Finding |
|------|---------|---------|
| `src/pages/SubscriberDashboardPage.tsx` | 190–197 | `SubscriberSection` union type — `'trends_forecasts'` was **never present**. Navigation was already clean. |
| `src/pages/SubscriberDashboardPage.tsx` | 199–207 | `SECTION_LABELS` array — no `trends_forecasts` entry. |
| `src/pages/SubscriberDashboardPage.tsx` | 5073–5075 | Empty `<TabsContent value="trends_forecasts">` shell remained. **Removed.** |
| `src/pages/SubscriberDashboardPage.tsx` | 3172–3180 | Overview "Strategic Summary" table had a "Trends & Forecasts" row showing `regressionNext%` and `isSignificantSignal`. **Removed.** |
| `src/pages/SubscriberDashboardPage.tsx` | 3192 | "Forecast Confidence" card in Cross-Module Health showed `confidenceLow–confidenceHigh` with "95% confidence range" subtitle. **Replaced with plain-language "Forecast Readiness" card.** |

---

## 2. Where Trend Diagnostics Are Computed

| File | Lines | Description |
|------|-------|-------------|
| `src/utils/subscriberDashboard.ts` | 557–606 | `TrendForecastDiagnostics` interface |
| `src/utils/subscriberDashboard.ts` | 2055–2271 | `computeTrendForecastDiagnostics()` — period comparisons, growth, volatility, seasonality, forecast, signal, highlights, validPeriods |
| `src/pages/SubscriberDashboardPage.tsx` | 1265–1266 | `trendsDiagnostics` useMemo |
| `src/pages/SubscriberDashboardPage.tsx` | 1733–1739 | `trendsTopMetrics` useMemo — wraps values into AnalyticsMetricValue for insight lookups |

---

## 3. Components and Config Supporting Trends

| File | Description |
|------|-------------|
| `src/config/trendsInsights.ts` | `TRENDS_METRIC_CONTENT` and `TRENDS_SECTION_INSIGHTS` — InsightModal content for keys like `forecast_regression`, `forecast_confidence`, `signal_noise`. Kept intact. |
| `src/pages/SubscriberDashboardPage.tsx` L42–46 | Imports from trendsInsights; spreads into INSIGHT_CONTENT/SECTION_INSIGHTS lookup. Kept intact. |

---

## 4. Trend Widgets in Relevant Modules

All four compact trend blocks were already implemented:

| Module | Block Title | Lines | Status |
|--------|------------|-------|--------|
| Awareness & Consideration | Awareness Trend | 3369–3396 | Present, correct fallback |
| Usage & Behavior | Usage Trend | 3766–3801 | Present, correct fallback |
| Loyalty & Satisfaction | Loyalty Trend | 3996–4032 | Present, correct fallback |
| Brand Momentum | Momentum Trends + Trajectory Forecast | 4238–4284 | Present, forecast gated by `forecastEligible` |

---

## 5. Client-Facing Technical Language Found and Fixed

| Location | Original | Fixed |
|----------|----------|-------|
| `subscriberDashboard.ts` L2221 | `"Regression fit is strong; forecast reliability is comparatively higher."` | `"Trend data quality is strong — forecast estimates are more reliable."` |
| `subscriberDashboard.ts` L2222 | `` `Forecast suppressed: ${forecastReasons.join(', ')}` `` | `"Forecasts will appear once enough survey waves have been completed."` |
| `SubscriberDashboardPage.tsx` L3174 | `regressionNext%` with "next forecast" | Removed with row |
| `SubscriberDashboardPage.tsx` L3192 | "Forecast Confidence" / "95% confidence range" | "Forecast Readiness" / plain period count |

---

## 6. Null-Safety Fix

`SubscriberDashboardPage.tsx` L3492: `trendsDiagnostics.volatility.label` accessed without null guard inside `usageDiagnostics ?` block. Fixed to `trendsDiagnostics?.volatility.label ?? ''`.

---

## 7. Exports / Other Dependencies

- No exports reference the trends tab.
- `trendsDiagnostics` is passed to `heroConfig` useMemo (L2526) — safe, the switch statement never matches `'trends_forecasts'`.
- `trendsTopMetrics` remains defined but only referenced in removed UI. No lint error (memoized values are not flagged as unused in this codebase).

---

## 8. Files Changed

1. `src/pages/SubscriberDashboardPage.tsx`
2. `src/utils/subscriberDashboard.ts`

---

## 9. Formulas / Data Unchanged

All computation logic in `computeTrendForecastDiagnostics` and `computeMomentumDiagnostics` is untouched. Reason code generation (`forecastReasons`, `momentumForecastReasons`) is untouched. Only display strings were modified.
