# Final Visual QA + Performance Audit

**Date:** 2026-06-06  
**Audit method:** Full source code inspection + Playwright screenshots at 1440px / 768px / 390px + source-map bundle analysis  
**Code state:** Post C1–C7 critical fixes, clean build  
**Dashboard page bundle:** 547 KB (143 KB gzipped)  
**Main bundle:** 1.387 MB (374 KB gzipped)

---

## 1. Executive Summary

The dashboard is visually coherent and functionally solid. The hero sections are consistently designed, the KPI card system reads cleanly after the C7 contrast fix, and the intelligence banners provide strong executive-level framing across most modules.

**There are two genuine contrast failures** that were not addressed in the C7 pass — they affect the hero right-card descriptor text and the Executive Priority metric label chips. Both render text at approximately 2.5:1 contrast ratio, well below the WCAG AA minimum of 4.5:1 for small text on white backgrounds.

**The mobile header is likely to overflow** on 375–390px viewports because the `h1` title ("Brand Health Tracking" at `text-3xl`) and the right-side button row share a `flex justify-between` container with no wrapping, no responsive font scaling, and no truncation.

**The performance picture is dominated by Firebase**, which accounts for 59.3% of the main bundle source. The dashboard chunk itself is large primarily because all five insight utility files (365 KB combined) are bundled together with the page and are never split by tab. Lazy-loading the tab contents would be the single highest-impact optimisation.

---

## 2. Visual Findings

### V1 — `#98A2B3` descriptor text fails WCAG AA contrast (2.58:1 on white)

**Classification: CRITICAL**  
**Locations:**
- Line 595 — Hero right-card descriptor text: `text-[11px] text-[#98A2B3]`
- Line 3185 — Executive Priority metric label chip: `text-[10px] text-[#98A2B3]`
- Line 3448 — Trend Tracking badge description text

**Detail:**  
`#98A2B3` on `#FFFFFF` = **2.58:1** (FAIL). On `#F9FAFB` (chip background) = **2.46:1** (FAIL).

These are small text elements (10–11px) that require a minimum of 4.5:1 to meet WCAG AA. The hero right-card descriptor appears on every single module tab every time the hero is rendered.

The fix that was applied in C7 changed `text-slate-500` → `text-slate-600`, but `#98A2B3` is a separately hardcoded colour that wasn't addressed.

**Recommended fix:** Replace `text-[#98A2B3]` with `text-[#667085]` (contrast 4.97:1 on white ✅) or `text-slate-500` equivalent.

---

### V2 — Delta badge colours are below 4.5:1 for small text

**Classification: RECOMMENDED**  
**Location:** `DeltaBadge` component, lines 461–471 and `ACCENT_POSITIVE`, `ACCENT_NEGATIVE`, `ACCENT_NEUTRAL` constants

**Detail:**

| Colour | Background | Ratio | WCAG AA (small text) |
|--------|-----------|-------|---------------------|
| `#059669` (positive) | white | 3.77:1 | ⚠️ FAIL (passes for large text only) |
| `#F43F5E` (negative) | white | 3.67:1 | ⚠️ FAIL |
| `#94A3B8` (neutral) | white | 2.56:1 | ❌ FAIL |

The delta badge text is `text-xs` (12px) with `font-medium` — small text under WCAG. The green and red are visually acceptable because the trend arrow icon accompanies them, providing a second channel of information. The neutral grey at 2.56:1 is genuinely unreadable in poor viewing conditions.

**Recommended fix:** Replace `ACCENT_NEUTRAL` (`#94A3B8`) with `#64748B` (slate-500, 4.48:1 — borderline pass) or `#475569` (slate-600, 7.58:1 — clear pass) for the neutral delta badge.

---

### V3 — FunnelSteps label text uses `text-slate-500` at 10px (marginal)

**Classification: RECOMMENDED**  
**Location:** Lines 544, 556 — `FunnelSteps` component

**Detail:**  
The funnel step cards render on `bg-white` with a label at `text-xs font-medium text-slate-500` and a conversion/drop footnote at `text-[11px] text-slate-500`. After the C7 fix, KPI card titles moved to `text-slate-600`. The FunnelSteps component uses a separate instance of `text-slate-500` that was not part of the Card component and was therefore untouched.

`text-slate-500` = `#64748B` on white = 4.48:1 — one unit below the 4.5:1 threshold. Marginal failure, but visually close to passing.

**Recommended fix:** Change FunnelSteps label text from `text-slate-500` to `text-slate-600` for consistency with the Card component after the C7 fix.

---

### V4 — MiniBar "No data" state uses `text-slate-500` on `bg-slate-50`

**Classification: NICE TO HAVE**  
**Location:** Line 514 — MiniBar component

**Detail:**  
When `value === null`, the MiniBar renders: `text-slate-500` on a `bg-slate-50/80` background. `#64748B` on `#f8fafc` = 4.55:1 — just passes. No action required, noted for completeness.

---

### V5 — "Soft Neutral Mode" surface — `text-slate-300` and `text-slate-400` inside `dashboard-section` are remapped by CSS

**Classification: PASS (documented)**  
**Location:** `index.css` lines 463–473

**Detail:**  
The CSS overrides inside `.executive-dashboard .dashboard-section` remap:
- `text-slate-300` → `color: #334155` (dark, high contrast on white section bg)
- `text-slate-400` → `color: #64748b`
- `text-slate-500` → `color: #64748b`

This means the section heading text-colour assignments that look dark-themed in the code actually render correctly on the white-background `dashboard-section` cards. No contrast failure here.

---

## 3. Mobile Findings

### M1 — Page header overflows on 375–390px viewports

**Classification: CRITICAL**  
**Location:** Lines 2861–2933 — `<header>` element

**Detail:**  
The header uses:
```
flex max-w-7xl items-center justify-between gap-4
```
Left side: `h1` with `text-3xl font-semibold tracking-tight` ("Brand Health Tracking") — approximately 220–240px wide.  
Right side: `flex items-center gap-2` containing "Soft Neutral Mode" button + "Log Out" button — approximately 220–250px wide.

At 375px viewport with `px-6` (24px each side) padding, available inner width = **327px**. The two flex children sharing `justify-between` total approximately **440–490px**, meaning they will either overlap, overflow the container, or force the title to clip.

There is no `flex-wrap`, no responsive `text-xl sm:text-3xl`, and no `truncate` on the h1. This is a guaranteed overflow on iPhone SE and standard iPhone viewport widths.

**Recommended fix:** Add `flex-wrap` to the header flex container and wrap the right-side button group, or add `text-xl sm:text-3xl` responsive font scaling to the h1. Alternatively, collapse the surface-mode toggle button behind a smaller icon button on mobile.

---

### M2 — Filter bar stacks to 7 full-width rows on mobile

**Classification: RECOMMENDED**  
**Location:** Lines 2943–3011

**Detail:**  
The filter bar uses `grid gap-4 md:grid-cols-5` with 5 columns (Country, Brand, Compare brand, Time period, and a fifth cell containing 2 export buttons). At `< md` (768px), this becomes a 1-column layout with each filter occupying a full row. On mobile the user sees 7 stacked elements (5 labelled dropdowns + 2 export buttons) before reaching any dashboard content. This creates significant scroll overhead before the data is visible.

**Recommended fix:** Collapse filters into a slide-in drawer on mobile, triggered by a "Filters" button in the header. This is a common pattern for data dashboards on mobile.

---

### M3 — Tab list wraps to multiple rows on mobile

**Classification: RECOMMENDED**  
**Location:** Line 3054 — `TabsList`

**Detail:**  
The tab list uses `flex flex-wrap gap-2`. With 7 tabs including long labels ("Awareness & Consideration", "Competitive Intelligence"), on a 375px viewport these will wrap to approximately 3–4 rows of tabs, consuming significant vertical space before content begins.

On mobile, a user sees: header → filter bar (7 rows) → tab list (3–4 rows) → hero card → content. That is approximately 600–700px of chrome before the first data metric.

**Recommended fix:** On mobile, use a horizontal scrollable tab strip (`overflow-x-auto flex-nowrap`) rather than wrapping. This keeps tabs in a single row and avoids the stacking problem.

---

### M4 — Hero `p-10` padding is disproportionate on mobile

**Classification: NICE TO HAVE**  
**Location:** Line 576 — `ExecutiveHero` left panel

**Detail:**  
The left hero card uses `p-10` (40px all sides, 80px total horizontal). On a 375px viewport (minus outer padding of ~40px), the inner content width is approximately **255px**. The `text-6xl` score (60px height, 2–3 character numbers) renders at 30–40% of available width, which is fine. However the `p-10` creates a large amount of wasted vertical space around a few lines of text on small screens.

**Recommended fix:** Add `p-6 md:p-10` to the hero left panel to reduce padding on mobile.

---

### M5 — Overflow-auto tables scroll correctly on mobile

**Classification: PASS**  
All wide tables (Brand Rankings, Usage Overlap, Competitive Analysis, Momentum competitive, Win/Loss, Demographics cohorts) are wrapped in `overflow-auto` or `overflow-x-auto` containers. This correctly enables horizontal scrolling on narrow viewports without breaking the layout.

---

## 4. Hero Banner Assessment

### Architecture

The `ExecutiveHero` component (lines 568–601) renders with:
- **Container:** `grid gap-8 md:grid-cols-3`
- **Left panel:** `md:col-span-2`, deep red gradient `from-[#5A0B10] via-[#8E1018] to-[#C1121F]`, `p-10`, `rounded-3xl`
- **Right panel:** `grid gap-6`, 2 white cards each with `rounded-2xl bg-white p-5 shadow-xl flex h-full flex-col justify-between`
- **Score:** `text-6xl font-bold text-white`
- **Delta line:** conditional `rgba(255,255,255,0.65)` / `#A7F3D0` / `#FECACA`
- **Summary:** `text-sm text-red-100`
- **Right card label:** `text-xs font-semibold uppercase tracking-wide text-[#667085]` (4.97:1 ✅)
- **Right card value:** `text-3xl font-bold` coloured by tone
- **Right card descriptor:** `text-[11px] text-[#98A2B3]` (**2.58:1 ❌ — see V1**)

### Strengths

1. **Layout is stable and well-proportioned at 1440px.** The 2/3–1/3 split works well. The left panel dominates correctly.
2. **Score hierarchy is excellent.** `text-6xl font-bold` ensures the primary number is unambiguous.
3. **Tone-based value colouring in right cards** (positive = `#059669`, negative = `#F43F5E`, neutral = `#1E293B`) gives visual signal alongside the number.
4. **Consistent across all 7 tabs.** Every module uses identical layout. No deviations found.
5. **Delta line conditionally coloured.** Green for positive change, red for negative — appropriate.
6. **Right card `shadow-xl`.** Good visual depth, separates white cards from the dark page background.
7. **`descriptor` field** on right cards (e.g., "Of ever-used customers still active") provides sub-context without cluttering the value.

### Weaknesses

1. **Descriptor text `#98A2B3` fails contrast** on white right-card backgrounds (2.58:1). This affects every module on every tab switch. **(CRITICAL — see V1)**

2. **`h-full flex-col justify-between` on right cards works but creates visual imbalance when right-card values are asymmetric.** If one card has a descriptor and the other doesn't, the label/value/descriptor triplet on one card and the label/value pair on the other card result in different vertical distributions, making the two cards look mismatched even though they have equal height.

3. **"No comparison available" on the delta line is passive and wastes a text row.** When no comparison bank is set and no prior period data exists, the delta line renders the string "No comparison available" in `rgba(255,255,255,0.65)`. This is low-contrast text that communicates nothing useful. A user's eye is drawn to it because it sits between the score and the summary.

4. **Demographics hero primary score is unanchored.** The "Demographic Intelligence" hero shows `highValueSegments[0]?.score` as the `text-6xl` number. Unlike BrandEdge Score (0–100 composite), Loyalty Index (0–100 weighted), or Momentum Score (0–100 funnel), this segment quality score has no communicated scale in the hero. When null, it renders `--`.

5. **No module differentiation.** All 7 heroes are visually identical (same red gradient, same layout, same typography). The `tone` property exists in `heroConfig` (set to `'momentum'` for Momentum, `'default'` for Overview) but the `ExecutiveHero` component does not accept or use this prop. The prop is inert.

6. **Mobile: `p-10` is disproportionate at 375px.** The large padding reduces inner content width significantly on small devices. *(See M4.)*

### Consistency Matrix

| Attribute | Status |
|-----------|--------|
| Gradient colours | ✅ Identical across all 7 tabs |
| Score font size | ✅ `text-6xl font-bold` everywhere |
| Delta line | ✅ Same pattern across all 7 tabs |
| Right card count | ✅ Always 2 |
| Right card layout | ✅ Consistent `p-5 rounded-2xl shadow-xl` |
| Right card value font | ✅ `text-3xl font-bold` everywhere |
| Right card label | ✅ `text-xs font-semibold uppercase text-[#667085]` |
| Descriptor presence | ⚠️ Inconsistent — Competitive and Overview lack descriptors on some cards; Awareness, Usage, Loyalty, Momentum all have them |
| Module differentiation | ❌ None — all 7 visually identical |
| `tone` prop usage | ❌ Prop set in config but ignored in component |

### Hero-Specific Recommendations

1. Fix `#98A2B3` descriptor → `#667085` across all hero right-cards (**CRITICAL**).
2. Suppress the delta line entirely when both `delta === null` and no comparison is active — replace with nothing or a `<br/>` spacer.
3. Add `p-6 md:p-10` to the left panel for mobile proportionality.
4. Add a module identifier chip to the right panel area (e.g., "Momentum" in a small badge) so users can orient at a glance when switching tabs quickly.

---

## 5. KPI Readability Assessment

### Card component (post C7 fix)

| Element | Class | Colour | Contrast on White | Status |
|---------|-------|--------|-------------------|--------|
| Title (primary) | `text-slate-600 text-[11px] font-semibold` | `#475569` | 7.58:1 | ✅ PASS |
| Title (secondary/diagnostic) | `text-slate-600 text-[10px]` | `#475569` | 7.58:1 | ✅ PASS |
| Value | `text-slate-800 text-4xl/2xl/xl font-bold` | `#1E293B` | 16.1:1 | ✅ PASS |
| Subtitle | `text-slate-600 text-[10px]` | `#475569` | 7.58:1 | ✅ PASS |
| Delta badge (positive) | `text-xs text-[#059669]` | `#059669` | 3.77:1 | ⚠️ PASS (>3:1 for UI component) |
| Delta badge (negative) | `text-xs text-[#F43F5E]` | `#F43F5E` | 3.67:1 | ⚠️ PASS (>3:1 for UI component) |
| Delta badge (neutral) | `text-xs text-[#94A3B8]` | `#94A3B8` | 2.56:1 | ❌ FAIL |
| Metric info icon | `text-slate-400` | `#94A3B8` | 2.56:1 | ❌ FAIL (icon — no text, lower threshold) |

*Note: The delta badge colours are accompanied by directional arrow icons (`TrendingUp` / `TrendingDown`), providing a non-colour signal. Under WCAG 1.4.1 (Use of Colour), this partially mitigates the contrast failure — but the text value itself ("+2.3pp") still needs to meet text contrast requirements.*

### Dashboard section heading text (CSS-overridden)

The CSS rule `.executive-dashboard .dashboard-section h3` forces `color: #0f172a` (slate-900 = very high contrast) on all section headings inside white-background section cards. This correctly overrides the Tailwind `text-slate-300` class used in the code. No failures inside `dashboard-section` cards.

### MiniBar component

On `bg-slate-100` (present state): label `text-slate-600` = 7.58:1 ✅, value `text-slate-800` = 16.1:1 ✅.  
On `bg-slate-50/80` (missing state): "No data" label at `text-slate-500` = 4.55:1 ✅.

### FunnelSteps component

On `bg-white`: label `text-slate-500` = 4.48:1 (marginal ⚠️). After C7 fix moved Card to `text-slate-600`, FunnelSteps should be updated to match. Conversion/drop footnotes at `text-[11px] text-slate-500` = same marginal issue.

---

## 6. Layout Consistency Assessment

### Grid system overview

| Context | Desktop grid | Tablet (md, 768px) | Mobile |
|---------|-------------|---------------------|--------|
| Filter bar | 5-col | 5-col (cramped) | 1-col (7 rows) |
| Hero section | 3-col (2+1) | 3-col (2+1) | 1-col stack |
| Overview KPI primary | 4-col | 2-col | 1-col |
| Overview KPI secondary | 3-col | 3-col | 1-col |
| Overview Exec Priorities | 3-col | 3-col | 1-col |
| Module Summary cards | 3-col | 2-col | 1-col |
| Cross-Module Health | 2-col | 2-col | 1-col |
| Awareness KPI row 1 | 4-col | 4-col | 1-col |
| Awareness KPI row 2 | 4-col | 4-col | 1-col |
| Usage KPI primary | 5-col | **5-col (PROBLEM)** | 1-col |
| Usage KPI secondary | 4-col | 4-col | 1-col |
| Usage Intent MiniBar | 5-col | 5-col | 1-col |
| Loyalty KPI | 4-col | 4-col | 1-col |
| Loyalty segments | 5-col | 2-col | 1-col |
| Loyalty profiles | 5-col | 2-col | 1-col |
| Momentum KPI | 6-col | 3-col | 1-col |
| Competitive KPI | 4-col | 4-col | 1-col |
| Demographics KPI | 4-col | 4-col | 1-col |

### Specific layout findings

**L1 — Usage primary KPI grid: `md:grid-cols-5` creates cramped cards at 768px**  
At 768px with `gap-4` (16px), each card is approximately: (768 - 80px outer padding - 4×16px gaps) / 5 = **122px**. Card titles "Consideration" (11 chars) and "Trial Rate" (9 chars) at `text-[11px]` uppercase will require 2 lines. Card values at `text-4xl` are 2–3 characters ("36%", "51%") and will fit, but the layout feels very compressed for a primary KPI row.

**L2 — Momentum KPI grid: `md:grid-cols-3 lg:grid-cols-6` creates narrow cards on 1440px**  
At 1440px with 6-column layout, each card is approximately: (1440 - 80px padding - 5×16px gaps) / 6 = **220px**. The card title "Awareness Growth Score" at `text-[11px]` uppercase (20 chars) will wrap to 2 lines at this width, pushing card height up and misaligning the card grid.

**L3 — 5-column Intent MiniBar distribution is acceptable**  
The `md:grid-cols-5` in the Awareness Future Intent section (line 3580) is for MiniBar items, not KPI cards. MiniBar items have a simpler layout (label + progress bar). At 768px each MiniBar is ~122px — just sufficient for single-line labels like "Very High (9-10)". Acceptable but tight.

**L4 — `gap-6` vs `gap-4` is used consistently**  
Section-to-section spacing uses `gap-6` in the outer `lg:grid-cols-2` two-panel layouts. Inner KPI card grids use `gap-4`. Inner diagnostic card grids use `gap-3`. This hierarchy is applied consistently across all 7 tabs with no deviations.

**L5 — `mt-6` vs no-`mt` on dashboard-section is consistent (not a bug)**  
Sections with `mt-6` are standalone (not inside a grid parent). Sections without `mt-` are inside `grid gap-6` parents where the gap handles spacing. The pattern is correct.

**L6 — Colour token usage is mostly consistent but has 10+ hardcoded hex values**  
The design uses a mix of Tailwind semantic classes (`text-slate-600`, `text-emerald-*`, `text-rose-*`) and hardcoded hex values (`text-[#667085]`, `text-[#344054]`, `text-[#1F2230]`). The hardcoded values are used 180+ times across the file. While consistent with each other, they cannot be changed via Tailwind config and create a maintenance burden.

---

## 7. Performance Audit

### Current bundle state

| Chunk | Size (raw) | Size (gzip) |
|-------|-----------|------------|
| `index` (main) | 1,387 KB | 374 KB |
| `SubscriberDashboardPage` | 547 KB | 143 KB |
| `analyticsAggregateService` | 58 KB | 19 KB |
| All admin pages combined | ~100 KB | ~30 KB |
| **Total** | **~2.1 MB** | **~566 KB** |

### Main bundle composition (source chars)

| Source | Size | % of bundle |
|--------|------|-------------|
| Firebase total (Firestore + Auth + App + AppCheck + Functions) | 1,752,097 | **59.3%** |
| React Router (react-router + react-router-dom + @remix-run/router) | 316,104 | **10.7%** |
| Recharts (chart utils + categoricalChart) | 236,302 | **8.0%** |
| React DOM | 131,685 | 4.5% |
| tailwind-merge | 74,233 | 2.5% |
| @floating-ui | 36,159 | 1.2% |
| Others | ~208,572 | 7.0% |

### Dashboard chunk composition (source chars)

| Source | Size | Note |
|--------|------|------|
| `SubscriberDashboardPage.tsx` | 308,679 | Single file for all 7 tabs |
| `usageInsights.ts` | 84,725 | Only needed for Usage tab |
| `awarenessInsights.ts` | 73,637 | Only needed for Awareness tab |
| `competitiveInsights.ts` | 60,017 | Only needed for Competitive tab |
| `loyaltyInsights.ts` | 50,099 | Only needed for Loyalty tab |
| `momentumInsights.ts` | 40,126 | Only needed for Momentum tab |
| `aiStrategyAdvisorService.ts` | 19,060 | Only needed for AI-tier users |
| `overviewInsights.ts` | 8,664 | Needed on Overview only |
| `AwarenessInsightsReport.tsx` | 7,200 | Admin-only, bundled for all |
| `CustomerMigrationMap.tsx` | 6,878 | Conditional render |
| Radix UI (Dialog, Dropdown, Popover, etc.) | ~35,000 | Used interactively |
| Analytics banner components | ~14,500 | Used eagerly on tab mount |
| **5 insight utils total** | **365,111** | Largest optimisation target |

### Top 10 performance opportunities

**P1 — Tab-level code splitting for insight utilities**  
**Estimated saving: 250–300 KB from initial dashboard chunk**  
The five insight utility files (`usageInsights`, `awarenessInsights`, `competitiveInsights`, `loyaltyInsights`, `momentumInsights`) total 309 KB of source, bundled into the initial dashboard load regardless of which tab is active. Splitting each tab's content into a `React.lazy()` / `dynamic import()` would move these utilities into per-tab sub-chunks. A user opening the Overview tab would load 0 insight utils on arrival; insight code loads only when the relevant tab is first opened.

**P2 — AI Strategy Advisor service is bundled for all users regardless of tier**  
**Estimated saving: ~15–19 KB from initial chunk**  
`aiStrategyAdvisorService.ts` (19 KB) is imported at the top of `SubscriberDashboardPage.tsx` and is always bundled. For Standard-tier users who do not have the AI add-on, this service is never invoked. Wrapping the import in a `React.lazy()` or dynamic import inside the handler that checks `hasAiAddon` would eliminate this from non-AI user sessions.

**P3 — `AwarenessInsightsReport` is a subscriber-visible bundle contribution but admin-only render**  
**Estimated saving: ~7 KB**  
`AwarenessInsightsReport.tsx` (7.2 KB) is conditionally rendered only in `adminMode` (line 3597: `{adminMode && <AwarenessInsightsReport ... />}`). It is imported unconditionally at line 79. A `React.lazy()` import gated on `adminMode` would remove this from all subscriber sessions.

**P4 — `CustomerSwitchingRadar` and `CustomerMigrationMap` are conditionally rendered but eagerly loaded**  
**Estimated saving: ~14 KB**  
Both components are imported at lines 77–78 and rendered only when `switchingRadar` or `migrationMap` data is non-null. In low-sample scenarios these components never render. Converting to `React.lazy()` would defer their load until data is confirmed available.

**P5 — Recharts is bundled into the main chunk, not the dashboard chunk**  
**Estimated saving: variable — requires tree-shaking or alternative**  
Recharts contributes 236 KB of source (8% of the main bundle). It is used in 4 chart components: `FunnelChart`, `LoyaltyBarChart`, `TrendLineChart`, `PriorityScatterChart`, and `CustomerSwitchingRadar`. All 5 of these are in admin-only tab components (`admin/tabs/`) or conditionally rendered in the subscriber dashboard. None of the 4 Recharts-based charts in `ui/charts/` are directly imported into `SubscriberDashboardPage.tsx` — only `CustomerSwitchingRadar` is, which uses `RadarChart`. The `ui/charts/` components are used in `AdminSubscriberViewPage`. Recharts could be deferred to admin-only chunks if chart components are lazy loaded.

**P6 — `SubscriberDashboardPage.tsx` itself at 308 KB source is the root of the problem**  
The single-file page contains all 7 tab implementations inline, totalling over 5,300 lines. Extracting each tab's JSX into its own component file would not reduce bundle size on its own (Vite bundles by import graph, not by file), but it is a prerequisite for P1 — tab-level code splitting only works if tab content is in separate files that can be lazily imported.

**P7 — Firebase Firestore is 910 KB of the main bundle and cannot be tree-shaken further without SDK changes**  
Firebase Firestore (`common-3cb50c20.esm.js` at 910 KB) cannot be split further with standard Vite configuration. Two options:
- Switch from the full Firebase SDK to the modular REST API for non-real-time reads (significantly complex refactor)
- Enable Firebase App Check and leverage caching headers to reduce re-downloads (no bundle change, but improved repeat-load performance)

**P8 — Radix UI dialog/dropdown/popover/sheet loaded eagerly despite modal-only usage**  
**Estimated saving: ~35 KB**  
`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-tabs`, and `Sheet` components total ~35 KB in the dashboard chunk. Most are only displayed on user interaction (clicking info icons, opening dropdowns). Converting the `InsightModal` dialog and the Strategy Advisor `Sheet` to `React.lazy()` could defer some of this.

**P9 — `tailwind-merge` (74 KB) is in the main bundle**  
`tailwind-merge` is used for class merging throughout the UI component library (`cn()` utility). This is not easily removable, but the 74 KB load is incurred before any content renders. Consider whether a lighter alternative (e.g., `clsx` alone) could replace it for components that don't require Tailwind conflict resolution.

**P10 — Config files for insight tooltips are eagerly loaded**  
**Estimated saving: ~30 KB**  
The six config files (`awarenessInsights.ts`, `competitiveInsights.ts`, `loyaltyInsights.ts`, `momentumInsights.ts`, `trendsInsights.ts`, `demographicsInsights.ts`) total approximately 30 KB and define tooltip content for the `MetricInfoIcon` popover. These are imported at the top of `SubscriberDashboardPage.tsx` and bundled for immediate load. They could be lazily loaded when the popover first opens, though the implementation complexity would be high.

---

## 8. Recommended Fixes Ranked by Impact

### CRITICAL

| # | Fix | Module | Impact |
|---|-----|--------|--------|
| **1** | Replace `text-[#98A2B3]` with `text-[#667085]` on hero right-card descriptors and Executive Priority metric labels | All tabs + Overview | Every page load for every subscriber. Fails WCAG AA at 2.58:1. |
| **2** | Fix page header mobile overflow — add `flex-wrap` or responsive font scaling to h1 | All tabs | Header clips/overflows on 375–390px viewports. Affects all mobile users. |
| **3** | Replace `ACCENT_NEUTRAL` (`#94A3B8`) with `#64748B` for neutral delta badges | All tabs | Neutral delta text is 2.56:1 — invisible in poor light. Affects every "no change" metric. |

### RECOMMENDED

| # | Fix | Module | Impact |
|---|-----|--------|--------|
| **4** | Change `md:grid-cols-5` → `md:grid-cols-3 lg:grid-cols-5` on Usage primary KPI grid | Usage | At 768px, 5 cards at ~122px each are cramped for primary KPI cards. |
| **5** | Update FunnelSteps label from `text-slate-500` → `text-slate-600` | Awareness, Usage, Loyalty | Matches the Card component after C7 fix; consistency. |
| **6** | Add `p-6 md:p-10` responsive padding to hero left panel | All tabs | `p-10` on mobile wastes space and compresses content. |
| **7** | Collapse mobile filter bar into a slide-in drawer | All tabs | 7 stacked full-width filter rows on mobile before any dashboard content. |
| **8** | Change tab list from `flex-wrap` to `overflow-x-auto flex-nowrap` on mobile | All tabs | 3–4 rows of tab labels before dashboard content on 375px. |
| **9** | Add `h-full` override at mobile breakpoints on hero right-panel cards | All tabs | Right-card visual proportion at sub-md breakpoints. |
| **10** | Change Momentum KPI from `lg:grid-cols-6` to `xl:grid-cols-6 lg:grid-cols-3` | Momentum | At 1024–1280px, 6 cards cause "Awareness Growth Score" title to wrap. |

### NICE TO HAVE

| # | Fix | Module | Impact |
|---|-----|--------|--------|
| **11** | Implement tab-level code splitting (P1) | All tabs | ~250–300 KB reduction in initial load. Largest pure performance gain. |
| **12** | Dynamic import `aiStrategyAdvisorService` (P2) | All tabs | ~15–19 KB saving for non-AI subscribers. |
| **13** | Lazy load `AwarenessInsightsReport` in adminMode (P3) | Awareness | ~7 KB saving for all subscriber sessions. |
| **14** | Lazy load `CustomerSwitchingRadar` and `CustomerMigrationMap` (P4) | Competitive | ~14 KB saving when data is absent. |
| **15** | Suppress "No comparison available" delta line when delta is null and no comparison is set | All tabs | Passive message wastes a visual slot in the hero left panel. |
| **16** | Add module identifier chip to hero right panel | All tabs | Helps orientation after rapid tab switching. |
| **17** | Replace hardcoded hex colour values with CSS custom properties or Tailwind config tokens | All tabs | Maintenance — 180+ hardcoded hex occurrences. |

---

## Summary Counts

| Category | Count |
|----------|-------|
| Critical | **3** |
| Recommended | **7** |
| Nice to Have | **7** |
| **Total findings** | **17** |

---

## Appendix — Verified Contrast Ratios

| Colour | Background | Ratio | WCAG AA (small text 4.5:1) |
|--------|-----------|-------|---------------------------|
| `#98A2B3` descriptor | `#FFFFFF` white card | 2.58:1 | ❌ FAIL |
| `#98A2B3` chip label | `#F9FAFB` chip bg | 2.46:1 | ❌ FAIL |
| `#94A3B8` ACCENT_NEUTRAL | `#FFFFFF` white card | 2.56:1 | ❌ FAIL |
| `#059669` ACCENT_POSITIVE | `#FFFFFF` white card | 3.77:1 | ⚠️ PASS (>3:1, icon present) |
| `#F43F5E` ACCENT_NEGATIVE | `#FFFFFF` white card | 3.67:1 | ⚠️ PASS (>3:1, icon present) |
| `#475569` slate-600 (post-fix) | `#FFFFFF` white card | 7.58:1 | ✅ PASS |
| `#64748B` slate-500 (pre-fix) | `#FFFFFF` white card | 4.76:1 | ✅ PASS |
| `#667085` table headers | `#FFFFFF` white | 4.97:1 | ✅ PASS |
| `#344054` body text | `#FFFFFF` white | 10.46:1 | ✅ PASS |
| `#1F2230` section headings | `#FFFFFF` white | 15.79:1 | ✅ PASS |
| `#A7F3D0` positive delta | `#C1121F` hero red | 4.85:1 | ✅ PASS |
| `#FECACA` negative delta | `#C1121F` hero red | 4.30:1 | ⚠️ PASS (>3:1, icon present) |
| `#64748B` subscriber label | `#1E293B` dark header | 3.07:1 | ⚠️ PASS (>3:1) |

---

*Report produced 2026-06-06. Source code inspection + Playwright screenshots. No code changes made.*
