# Awareness Tab V4 — Full Visual Redesign + Richer Section Panels

**Date:** 2026-05-14
**Status:** Approved — ready for implementation planning

---

## 1. Goal

Rebuild the Awareness & Consideration tab into a premium analytical intelligence dashboard. The current V3 implementation has the right data and content foundations but poor visual hierarchy, cluttered layout, and inconsistent section analysis quality. V4 fixes all three without touching any metric formulas, aggregate logic, or BrandEdge score.

---

## 2. Constraints

- No changes to: metric formulas, denominators, aggregate logic, `brandEdgeScore.ts`, `analyticsAggregateService.ts`, `subscriberDashboard.ts`
- No changes to the shared `Card` component (it is a local component inside `SubscriberDashboardPage.tsx` — it may receive one additive prop addition only if strictly necessary)
- `AwarenessInsightPanel` component is kept (not deleted) but is no longer used in the awareness tab
- All builder functions (`buildAwarenessMetricInsight` etc.) retain their logic — only `buildAwarenessFunnelInsight` section headings and one new section are changed
- AI report (`AwarenessInsightsReport`) remains admin-only, collapsed by default, visually de-emphasized

---

## 3. Tab Structure Change

### Before (V3)

```
[4-card Row 1 + mt-2 snapshot strips (white bg, separate div)]
[MetricRowAnalysisDrawer Row 1 — equal-height grid of mini boxes]
[4-card Row 2 + mt-2 snapshot strips]
[MetricRowAnalysisDrawer Row 2]
[Module Summary — AwarenessInsightPanel at bottom]
[Awareness Funnel + AwarenessInsightPanel]
[Brand Rankings + AwarenessInsightPanel]
[Future Intent + AwarenessInsightPanel]
[Admin AI section]
```

### After (V4)

```
[AwarenessIntelligenceBanner]              ← NEW — primary framing element
[4-card Row 1 + flush footers]             ← snapshot strips redesigned
[MetricRowAnalysisDrawer Row 1 — two-zone] ← upgraded layout
[4-card Row 2 + flush footers]
[MetricRowAnalysisDrawer Row 2 — two-zone]
[Awareness Funnel + SectionAnalysisBlock]  ← NEW component replaces panel
[Brand Rankings + SectionAnalysisBlock]
[Future Intent + SectionAnalysisBlock]
[Admin AI section — unchanged]
```

---

## 4. Component Designs

### 4.1 AwarenessIntelligenceBanner (NEW)

**File:** `src/components/analytics/AwarenessIntelligenceBanner.tsx`

**Purpose:** Primary framing element at the top of the awareness tab. Communicates the strategic pattern and key metrics before the user looks at any individual card. Replaces the `AwarenessInsightPanel` used for `awarenessModuleSummary` (which was at the bottom — wrong position, wrong component).

**Props:**
```typescript
interface AwarenessIntelligenceBannerProps {
  moduleSummary: AwarenessInsightResult | null;
  totalAwareness: number | null;
  topOfMind: number | null;
  awarenessQuality: number | null;
  country: string;
  sampleSize: number;
}
```

**Layout (ASCII):**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  ◈  AWARENESS INTELLIGENCE                         [Country]  N=[size]  │
│                                                                          │
│  ┌────────────────────────────┐                                          │
│  │  PATTERN NAME              │   ← pattern extracted from snapshot      │
│  └────────────────────────────┘                                          │
│                                                                          │
│  [Executive takeaway — 2-3 sentences from moduleSummary.snapshot,       │
│   excluding the "Awareness pattern: PATTERN." prefix]                    │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │  TOTAL AWARENESS │  │  TOP OF MIND     │  │  QUALITY RATIO   │       │
│  │     72%          │  │     12%          │  │     16.7%        │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────────────────────────────┘
```

**Pattern extraction:** The `moduleSummary.snapshot` always begins with `"Awareness pattern: PATTERN NAME."`. Extract PATTERN NAME via regex: `/^Awareness pattern:\s*([^.]+)/i`. Known patterns: `Salience Leader`, `Hidden Gem`, `Recognised but Forgotten`, `Fundamental Rebuild Required`, `Developing`.

**Visual style:**
- Background: `bg-slate-800/60 border border-white/10 rounded-2xl` (dark card, matches dashboard)
- Pattern badge: `bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-widest`
- Takeaway text: `text-sm text-slate-300 leading-relaxed`
- Metric mini-cards: `bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3` with label `text-[10px] uppercase tracking-widest text-slate-500` and value `text-2xl font-black text-slate-100`
- Country/sample: `text-[10px] text-slate-500 uppercase tracking-widest`
- Falls back gracefully: if `moduleSummary` is null, renders a minimal banner with just the three metric mini-cards

**Tests:** `src/components/analytics/AwarenessIntelligenceBanner.test.tsx`
- Renders pattern badge when snapshot contains "Awareness pattern: X"
- Renders metric values (handles null gracefully — shows "—")
- Renders country and sample size
- Renders nothing special when moduleSummary is null (only metric mini-cards)

---

### 4.2 SectionAnalysisBlock (NEW)

**File:** `src/components/analytics/SectionAnalysisBlock.tsx`

**Purpose:** Premium expandable analysis block for the three section panels (Funnel, Rankings, Intent). Replaces `AwarenessInsightPanel` in the awareness tab. Takes the same `AwarenessInsightResult` input but renders as a structured intelligence block.

**Props:**
```typescript
interface SectionAnalysisBlockProps {
  title: string;
  insight: AwarenessInsightResult | null;
}
```

**Collapsed state:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  ◈  AWARENESS FUNNEL ANALYSIS                                            │
│  The funnel reveals a conversion gap between awareness and salience.     │
│  Most aware consumers recognise the brand name but few retrieve it       │
│  without prompting.                          [VIEW DETAILED ANALYSIS ▼] │
└──────────────────────────────────────────────────────────────────────────┘
```

**Expanded state:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│  ◈  AWARENESS FUNNEL ANALYSIS                  [COLLAPSE ANALYSIS ▲]    │
│  The funnel reveals a conversion gap between awareness and salience.     │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ MARKET CONTEXT   │  │ COMPETITIVE      │  │ CONSUMER SIGNAL  │       │
│  │ [text]           │  │ POSITION         │  │ [text]           │       │
│  │                  │  │ [text]           │  │                  │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
│  ┌──────────────────┐  ┌──────────────────┐                             │
│  │ OPPORTUNITY/RISK │  │ STRATEGIC        │                             │
│  │ [text]           │  │ PRIORITY         │                             │
│  └──────────────────┘  └──────────────────┘                             │
└──────────────────────────────────────────────────────────────────────────┘
```

**Visual style (light card — these sit on dark background):**
- Outer container: `rounded-xl border border-white/10 bg-slate-800/40`
- Header row: `px-5 py-4 flex items-start justify-between gap-4`
- Title: `text-xs font-bold uppercase tracking-widest text-slate-400` with `◈` prefix in `text-indigo-400`
- Snapshot text: `text-sm text-slate-300 leading-relaxed mt-1`
- CTA button: `text-[10px] font-semibold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 whitespace-nowrap`
- Expanded divider: `border-t border-white/10`
- Section grid: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3 p-5`
- Section cards: `rounded-lg border border-white/8 bg-slate-900/50 p-3.5`
- Section heading: `text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5`
- Section body: `text-xs leading-relaxed text-slate-400`

**Section parsing:** Same `parseSection` function used in `MetricRowAnalysisDrawer` (extract ALLCAPS heading before `:`, remaining text as body). Sections with no detectable heading render as body-only cards.

**Tests:** `src/components/analytics/SectionAnalysisBlock.test.tsx`
- Renders nothing when insight is null
- Shows snapshot text in collapsed state
- Shows "VIEW DETAILED ANALYSIS" button in collapsed state
- Clicking button expands section grid
- Clicking again (COLLAPSE ANALYSIS) collapses
- Renders section heading when detail contains ALLCAPS heading
- Title prop appears in rendered output

---

### 4.3 MetricRowAnalysisDrawer (MODIFY)

**File:** `src/components/analytics/MetricRowAnalysisDrawer.tsx`

**Current:** Equal-height 2-3 column grid of small text boxes. All sections have equal visual weight.

**After:** Two-zone layout. Left zone = executive snapshot in large readable type. Right zone = 2×3 grid of section cards. Left zone takes approximately 1/3 width on `lg:` breakpoints, stacks to full width on mobile.

**New layout structure:**
```tsx
<div className="mt-4 rounded-xl border border-white/10 bg-slate-800/60 shadow-xl">
  {/* Header */}
  <div className="flex items-start justify-between border-b border-white/10 px-6 py-4">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Detailed Analysis</p>
      <h4 className="text-sm font-bold text-slate-200">{title}</h4>
    </div>
    <button onClick={onClose}>✕</button>
  </div>

  {/* Definition strip */}
  {definition && (
    <div className="border-b border-white/10 px-6 py-2.5">
      <p className="text-[11px] text-slate-500">
        <span className="font-semibold uppercase tracking-wider text-slate-600">What this measures: </span>
        {definition}
      </p>
    </div>
  )}

  {/* Two-zone body — stacks vertically on mobile, side-by-side on lg+ */}
  <div className="flex flex-col gap-5 p-6 lg:flex-row">
    {/* Left: snapshot */}
    <div className="flex-shrink-0 lg:w-72 xl:w-80">
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-2">Executive Takeaway</p>
        <p className="text-sm font-medium leading-relaxed text-slate-200">{insight.snapshot}</p>
      </div>
    </div>

    {/* Right: section grid */}
    <div className="flex-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {sections.map((sec, idx) => (
        <div key={idx} className="rounded-lg border border-white/8 bg-slate-900/50 p-3.5">
          {sec.heading && (
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
              {sec.heading}
            </p>
          )}
          <p className="text-xs leading-relaxed text-slate-400">{sec.body}</p>
        </div>
      ))}
    </div>
  </div>
</div>
```

**Visual theme change:** V3 drawer used `bg-white border-slate-200 text-slate-600` (light). V4 uses `bg-slate-800/60 border-white/10 text-slate-400` (dark, matches dashboard). This eliminates the light/dark theme mismatch that made the drawer look out of place.

---

### 4.4 Flush Card Footer (PATTERN — no new component)

No new component. The existing inline JSX pattern in `SubscriberDashboardPage.tsx` is updated. Each metric card wrapper changes from:

```tsx
// BEFORE (V3)
<div>
  <Card ... />
  {insight && (
    <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3.5 pb-2.5 pt-2 shadow-sm">
      <p className="text-[11px] leading-snug text-slate-500">{insight.snapshot}</p>
      <button className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-sky-600 ...">
        VIEW ANALYSIS ▼
      </button>
    </div>
  )}
</div>
```

To:

```tsx
// AFTER (V4)
<div>
  <Card ... />
  {insight && (
    <div className="kpi-card-footer">
      <p className="text-[11px] leading-snug text-slate-500">{insight.snapshot}</p>
      <button className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
        {activeAwarenessMetric === key ? 'CLOSE ANALYSIS ▲' : 'VIEW DETAILED ANALYSIS ▼'}
      </button>
    </div>
  )}
</div>
```

**New CSS classes in `src/index.css`:**
```css
.kpi-card-footer {
  background: #ffffff;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  border-top: 1px solid #f1f5f9;
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  padding: 0.75rem 1.25rem 1rem;
}

/* When a card has a footer, flatten its bottom corners so the footer attaches flush */
.kpi-card-has-footer .kpi-card-primary,
.kpi-card-has-footer .kpi-card-secondary {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
```

The wrapper div gets class `kpi-card-has-footer` when an insight exists. The CSS selector targets the card inside the wrapper and flattens its bottom corners. No changes to the Card component are required — the override works from the parent. The footer picks up `border-bottom-left-radius: var(--radius-lg)` to complete the rounded bottom.

This makes the footer visually attach to the bottom of the white KPI card. The `border-top: slate-100` divides the card metric zone from the insight/CTA zone within the same visual element.

---

## 5. Content Change: buildAwarenessFunnelInsight

**File:** `src/utils/awarenessInsights.ts`

**Change type:** Section heading renames + new COMPETITIVE POSITION section. Logic and tier thresholds unchanged.

**Before (V3 sections):**
1. `FUNNEL SHAPE:` — mechanical numbers description
2. `MARKET INTERPRETATION:` — market context
3. `CONSUMER SIGNAL:` — consumer behavior meaning
4. `RISK & OPPORTUNITY:` — risks and opportunities
5. `STRATEGIC IMPLICATION:` — what it means strategically
6. `RECOMMENDED ACTION:` — what to do

**After (V4 sections):**
1. `FUNNEL PROFILE:` — renamed from FUNNEL SHAPE. Same numeric data but framed interpretively: lead with the pattern diagnosis ("Strong/weak conversion from recognition to active recall"), then surface the key ratios. No plain mechanical counting.
2. `MARKET CONTEXT:` — renamed from MARKET INTERPRETATION (consistent with SectionAnalysisBlock vocabulary)
3. `COMPETITIVE POSITION:` — NEW section. Content: compare this funnel conversion rate to category norms. "Banking category leaders typically convert 50–60% of their aware base to spontaneous recall. At [X]%, this brand sits [above/below] that threshold — [implication]." Tier thresholds: strong ≥50%, moderate 35–49%, weak <35% spontaneous/aware conversion.
4. `CONSUMER SIGNAL:` — unchanged
5. `OPPORTUNITY/RISK:` — renamed from RISK & OPPORTUNITY (matches SectionAnalysisBlock label order)
6. `STRATEGIC PRIORITY:` — merged STRATEGIC IMPLICATION + RECOMMENDED ACTION into one action-oriented section. Starts with the strategic principle, ends with a concrete recommended action.

**Rankings and Intent builders:** Section headings already close enough. Only cosmetic alignment:
- `buildAwarenessRankingInsight`: rename `RECOMMENDED ACTION` → `STRATEGIC PRIORITY`
- `buildIntentInsight`: rename `STRATEGIC IMPLICATION` → `STRATEGIC PRIORITY`, merge action into it

**Test additions:** `src/utils/awarenessInsights.test.ts`
- Add test: funnel detail contains `COMPETITIVE POSITION`
- Add test: funnel snapshot does not change (existing tests still pass)

---

## 6. SubscriberDashboardPage.tsx Changes

**Lines affected:** Awareness tab JSX only (~lines 2665–2870). No other tab touched.

**Change 1: Banner at top**
- Add `AwarenessIntelligenceBanner` import
- Wire at the top of `TabsContent value="awareness_consideration"` before the first card grid
- Props wired from: `awarenessModuleSummary` (already computed), `awarenessTopMetrics`, country, sampleSize

**Change 2: Flush footers**
- Replace all 8 `mt-2 rounded-lg border border-slate-200 bg-white` snapshot divs with `kpi-card-footer` class
- Change button text: `VIEW ANALYSIS ▼` → `VIEW DETAILED ANALYSIS ▼`
- Change active state text: `CLOSE ANALYSIS ▲` (unchanged)
- Change button color: `text-sky-600` → `text-indigo-600`

**Change 3: Remove module summary panel**
- Remove the `{awarenessModuleSummary && <div className="mt-6">...<AwarenessInsightPanel insight={awarenessModuleSummary} /></div>}` block (now covered by banner)

**Change 4: Replace section panels**
- Remove 3× `<AwarenessInsightPanel insight={...} />` uses
- Add `SectionAnalysisBlock import`
- Wire:
  - Funnel: `<SectionAnalysisBlock title="Awareness Funnel Analysis" insight={awarenessFunnelInsight} />`
  - Rankings: `<SectionAnalysisBlock title="Brand Rankings Analysis" insight={awarenessRankingInsight} />`
  - Intent: `<SectionAnalysisBlock title="Future Intent & Consideration" insight={awarenessIntentInsight} />`

---

## 7. Files Changed

| File | Action | Notes |
|------|--------|-------|
| `src/components/analytics/AwarenessIntelligenceBanner.tsx` | Create | New |
| `src/components/analytics/AwarenessIntelligenceBanner.test.tsx` | Create | New |
| `src/components/analytics/SectionAnalysisBlock.tsx` | Create | New |
| `src/components/analytics/SectionAnalysisBlock.test.tsx` | Create | New |
| `src/components/analytics/MetricRowAnalysisDrawer.tsx` | Modify | Two-zone layout, dark theme |
| `src/utils/awarenessInsights.ts` | Modify | Funnel section headings + COMPETITIVE POSITION; Rankings/Intent heading alignment |
| `src/utils/awarenessInsights.test.ts` | Modify | Add competitive position test |
| `src/pages/SubscriberDashboardPage.tsx` | Modify | Banner, flush footers, SectionAnalysisBlock wiring |
| `src/index.css` | Modify | Add `.kpi-card-footer` class |

**Not changed:**
- `src/components/analytics/AwarenessInsightPanel.tsx` — kept, not deleted
- `src/components/analytics/AwarenessInsightPanel.test.tsx` — kept
- `src/utils/subscriberDashboard.ts`
- `src/services/analyticsAggregateService.ts`
- `src/utils/brandEdgeScore.ts`
- Any other tab's JSX

---

## 8. Deliverables

After implementation:
- Screenshots: collapsed state, expanded drawer state, expanded SectionAnalysisBlock state
- `npx vitest run` output showing 0 failures
- `npx tsc --noEmit` output showing 0 errors

---

## 9. Success Criteria

- Intelligence banner appears at top of awareness tab with correct pattern name and metrics
- Flush footers visually attach to KPI card bottom with no gap
- MetricRowAnalysisDrawer shows two-zone layout (snapshot left, sections right)
- All three section panels render as `SectionAnalysisBlock` with expandable section grid
- `buildAwarenessFunnelInsight` detail includes `COMPETITIVE POSITION` section
- Admin AI section remains admin-only and collapsed
- All existing tests pass; new component tests added
- TypeScript: 0 errors
