# Dashboard Layout Refactor Plan

**Date:** 2026-06-06  
**Type:** Visual layout refactor — NO analytics, formula, or data-model changes  
**Scope:** `SubscriberDashboardPage.tsx` + `index.css`

---

## Current Architecture

### Root wrapper
`<div className="executive-dashboard min-h-screen text-white" data-surface-mode={surfaceMode}>`  
Dark executive background (`#1e293b`), surface-mode toggle between dark and soft-neutral.

### Header (current)
`<header className="border-b border-slate-600/40 bg-slate-800/80 px-6 py-4 backdrop-blur-sm">`  
Contains: brand title, data source note, surface-mode toggle button, admin controls, Log Out.

### Filter shell (current)
`<div className="dashboard-filter-shell">` — separate block below header.  
Contains: 4 dropdowns (country, brand, compare, time period) + 2 export buttons + age/gender chip filters.

### Tab navigation (current)
`<TabsList className="dashboard-tablist flex gap-2 overflow-x-auto flex-nowrap md:flex-wrap">`  
7 tabs: Overview, Awareness & Consideration, Usage & Behavior, Loyalty & Satisfaction, Brand Momentum, Competitive Intelligence, Demographics.  
Tabs drive the `section` state.

### Hero (current)
`ExecutiveHero` component — `grid gap-8 md:grid-cols-3` with left panel `md:col-span-2` (2/3) and right panel grid gap-6 with 2 metric tiles.

### Content sections (current)
`<TabsContent value="overview">` × 7 — all analytics content lives inside Radix Tabs.

### Modals / overlays (current)
- Floating AI Strategy Advisor button (fixed bottom-right)
- `<Sheet>` — AI advisor side panel
- `<Dialog>` — Upgrade modal

---

## Proposed Architecture

### Root wrapper
`<div className="platform-shell flex h-screen overflow-hidden bg-[#F8FAFC]">`  
Light executive background, no dark mode, no surface-mode toggle.

### Left sidebar (NEW)
`<PlatformSidebar>` — persistent 280px left sidebar on desktop, collapsible to 72px, drawer on mobile.  
Contains: BrandEdge logo mark, section navigation with icons, active-section indicator.  
Drives `section` state via `requestSection()` — same function the tabs currently use.

### Header (redesigned)
`<header className="platform-header flex h-[72px] items-center ...">` — 72px, white background.  
Contains: brand title block (left), filter dropdowns inline (centre), export buttons + settings/profile (right).

### Age/Gender filter bar (compact secondary, below header)
`<div className="platform-filter-chips">` — slim bar with chip filters.  
Content unchanged.

### Main content area
`<main className="flex-1 overflow-y-auto bg-[#F8FAFC]">`  
Padding: `px-8 py-6`.

### Hero (redesigned layout)
Same `ExecutiveHero` component, changed container grid: `grid-cols-[70fr_30fr]`.  
Left panel: drops `md:col-span-2` (no longer needed with custom grid).  
Right panel: same 2 metric tiles.

### Tab content (unchanged)
`<Tabs value={section}>` kept with all TabsContent children exactly as-is.  
`<TabsList>` changed to `className="sr-only"` — sidebar drives navigation.

### Modals / overlays (unchanged)
All Sheet, Dialog, floating button content completely unchanged.

---

## Design System Changes

| Token | Before | After |
|-------|--------|-------|
| Background | `#1e293b` dark | `#F8FAFC` light |
| Cards | dark slate with `!important` white override | White `bg-white` with `border border-[#E2E8F0]` |
| Primary accent | `#E10613` BrandEdge red | `#E10613` red retained for hero + alerts; `#3B82F6` for nav highlights |
| Body text | `text-white` / `text-slate-300` | `text-[#0F172A]` / `text-[#475569]` |
| Font | System default | `Hanken Grotesk` (Google Fonts) |
| Card radius | `rounded-2xl` (16px) | `rounded-lg` (8px) for analysis panels; `rounded-2xl` retained for KPI cards |
| Section heading | `text-slate-300` 0.75rem uppercase | `text-[#0F172A]` 0.6875rem uppercase |

---

## Files Changed

| File | Type of change |
|------|----------------|
| `src/pages/SubscriberDashboardPage.tsx` | Layout: outer shell, header, sidebar, Tabs list, hero grid |
| `src/index.css` | Design system: font import, sidebar classes, new card/background tokens |

---

## Zero-Risk Areas (untouched)

- All `useMemo` hooks and computed values
- All `useEffect` hooks for data loading
- `computeBankMetrics`, `computeUsageDiagnostics`, all `compute*` functions
- All insight builders (`buildAwarenessModuleSummary`, etc.)
- All `analyticsAggregateService` and `responseService` calls
- Firestore queries and aggregate loading
- Export functions (`exportCurrentView`, `exportComparisonView`)
- AI advisor message handling
- Upgrade modal logic
- Subscriber permission guards
- All `TabsContent` children — their internal layouts are preserved

---

## Rollback Strategy

```bash
git diff src/pages/SubscriberDashboardPage.tsx src/index.css
git checkout -- src/pages/SubscriberDashboardPage.tsx src/index.css
```

A single `git checkout` restores both files to their pre-refactor state.

---

## Implementation Sequence

1. Add Google Fonts import (Hanken Grotesk) and sidebar CSS to `index.css`
2. Add new lucide icon imports to `SubscriberDashboardPage.tsx`
3. Define `PlatformSidebar` inline component
4. Replace outer layout shell (root div → header → filter → sidebar)
5. Update `ExecutiveHero` grid from `md:grid-cols-3` to `grid-cols-[70fr_30fr]`
6. Hide `TabsList` with `sr-only`
7. Validate: `npx tsc --noEmit && npm run build`
8. Generate verification document
