# Awareness Tab — V3 Premium Analytics Redesign

**Date:** 2026-05-08  
**Tests:** 53 passing. 0 regressions. 0 TypeScript errors.

---

## 1. What Changed (V2 → V3)

### Before (V2)

Every metric card had an `AwarenessInsightPanel` stacked directly underneath it. Each panel expanded independently. This caused:

- Text blocks visually overlapping white cards (dark slate theme vs. white card background)
- Dashboard looking like an executive summary with shallow restatements ("at 12%, this is moderate")
- Card grid destroyed whenever a panel expanded — no layout coherence
- 8 separate independently-expanding panels breaking visual rhythm

### After (V3)

Each metric card now has a **compact snapshot strip** (1 interpretive sentence, not a metric restatement) with a "VIEW ANALYSIS ▼" button. Clicking opens a single **full-width row-level drawer** that slides below the entire 4-card grid row — the card grid stays intact.

The drawer renders **consulting-grade analysis** in a 3-column section card grid covering:
- MARKET INTERPRETATION
- COMPETITIVE MEANING
- CONSUMER SIGNAL
- RISK & OPPORTUNITY
- STRATEGIC IMPLICATION
- RECOMMENDED ACTION
- COMPETITOR CONTEXT (when compare bank is active)
- SAMPLE CAUTION (when n < 30)

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────┐
│  ROW 1 — 4 METRIC CARDS (white background)  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  │ TOP OF   │ │SPONTANEOUS│ │  TOTAL   │ │AWARENESS │
│  │  MIND    │ │  RECALL  │ │AWARENESS │ │ QUALITY  │
│  │   12%    │ │   38%    │ │   72%    │ │   17%    │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤
│  │ snapshot │ │ snapshot │ │ snapshot │ │ snapshot │ ← 1 sentence
│  │[VIEW ▼]  │ │[VIEW ▼]  │ │[VIEW ▼]  │ │[VIEW ▼]  │ ← sky-600 CTA
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │ METRIC ROW ANALYSIS DRAWER (white, full │ │  ← opens below ROW 1
│  │ width, shadow-lg, only when active)     │ │
│  │                                         │ │
│  │ "Detailed Analysis — Top of Mind"    [✕]│ │
│  │ What this measures: ...                 │ │
│  │ ┌──────────────┐ ┌──────────┐ ┌──────┐ │ │
│  │ │ MARKET       │ │COMPETITIVE│ │CONSUM│ │ │  ← 3-column grid
│  │ │ INTERPRETATION│ │ MEANING  │ │ SIGN │ │ │
│  │ │ ...text...   │ │ ...text...│ │ ...  │ │ │
│  │ └──────────────┘ └──────────┘ └──────┘ │ │
│  │ ┌──────────────┐ ┌──────────┐ ┌──────┐ │ │
│  │ │ RISK &       │ │STRATEGIC │ │RECOMM│ │ │
│  │ │ OPPORTUNITY  │ │IMPLICATON│ │ENDED │ │ │
│  │ └──────────────┘ └──────────┘ └──────┘ │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ROW 2 — 4 METRIC CARDS (same pattern)     │
│                                             │
│  AWARENESS INTELLIGENCE SUMMARY (section)  │
│                                             │
│  AWARENESS FUNNEL  │  BRAND RANKINGS        │
│  AwarenessInsightPanel (light, scrollable) │
│                                             │
│  FUTURE INTENT & CONSIDERATION             │
│  AwarenessInsightPanel                     │
│                                             │
│  [EXPERIMENTAL AI NARRATIVE ▼]  (admin only, collapsed)
└─────────────────────────────────────────────┘
```

---

## 3. Interaction Behaviour

**Collapsed state (default):**
- Each metric card shows its normal KPI value, sparkline, delta badge
- Below each card: 1-sentence snapshot in muted slate-500 + "VIEW ANALYSIS ▼" button in sky-600
- Drawer is absent — layout is tight and uncluttered

**Click "VIEW ANALYSIS ▼":**
- `activeAwarenessMetric` state updates to the clicked metric key
- If the key is in Row 1 (`topOfMind`, `spontaneous`, `totalAwareness`, `awarenessQuality`): the drawer renders between Row 1 and Row 2
- If the key is in Row 2 (`shareOfVoice`, `momGrowth`, `awarenessShareIndex`, `awarenessDepthScore`): the drawer renders after Row 2
- Button label changes to "CLOSE ANALYSIS ▲" on the active card
- Other cards remain unchanged — only one drawer is open at a time

**Click another card's "VIEW ANALYSIS ▼":**
- `activeAwarenessMetric` switches to the new key
- The drawer smoothly replaces its content (or repositions between rows if crossing row boundary)
- Both rows can independently be the host of the active drawer

**Click "CLOSE ANALYSIS ▲" or the ✕ in the drawer header:**
- `activeAwarenessMetric` resets to `null`
- Drawer disappears
- Card grid collapses back to clean state

---

## 4. Example: Snapshot Text — Burundi KCB (Top of Mind = 12%)

**Snapshot strip (always visible, 1 sentence):**
> Moderate top-of-mind — the brand enters unaided consideration sets but does not yet dominate the first-recall moments that drive organic choice.

---

## 5. Example: Full Expanded Analysis — Top of Mind (12%)

When the user clicks "VIEW ANALYSIS ▼" on the Top of Mind card, the drawer opens below the Row 1 grid:

---

**MARKET INTERPRETATION:** At 12.0%, the brand occupies the competitive middle band — present in the awareness landscape but not anchoring category decisions. In most banking markets, the top two brands capture the majority of first-recall moments. At current levels, the brand is a valid option but not the instinctive default.

**COMPETITIVE MEANING:** A 12.0% position means the brand wins approximately 1 in 8 first-mention moments. Competitors holding 20%+ have a structural recall advantage — consumers default to them without deliberation. Breaking into that group requires disrupting established mental structures, not simply increasing media reach.

**CONSUMER SIGNAL:** For every consumer who recalls this brand first, 7-8 others recall a competitor — and those consumers default to their top-of-mind brand. This represents a cohort of latent sympathisers: aware, potentially interested, but not yet holding this brand as their primary category anchor. They are winnable at relatively low cost with the right distinctiveness investment.

**RISK & OPPORTUNITY:** Risk — a sustained competitor campaign over 2-3 months can absorb the marginal first-recall consumers currently split between brands at this tier. Opportunity — moving to 20%+ is achievable within 12-18 months with focused distinctiveness investment; above that threshold organic compounding begins.

**STRATEGIC IMPLICATION:** The brand faces a middle-tier trap — awareness investment generates reach without building durable salience. Continued broad reach investment without improving brand distinctiveness will grow aided recognition while leaving top-of-mind largely unchanged. The next planning cycle must make distinctiveness, not reach, the primary investment thesis.

**RECOMMENDED ACTION:** Audit which memory triggers — visual identity, sonic cues, character, tagline — most reliably generate first-recall in this category. Concentrate creative investment on those triggers for 2-3 consecutive campaign cycles. Prioritise depth and frequency of impression over breadth of reach.

---

## 6. Files Changed

| File | Change | Type |
|------|--------|------|
| `src/utils/awarenessInsights.ts` | Rewritten — new `AwarenessInsightResult { snapshot, detail }` interface; `snapshot` = 1 interpretive sentence (no metric restatement); `detail` = consulting-grade 6-section text separated by `\n\n`; `COMPETITOR CONTEXT` and `SAMPLE CAUTION` appended to `detail` (not `snapshot`); all 5 builder functions updated | Core logic |
| `src/components/analytics/MetricRowAnalysisDrawer.tsx` | New — full-width light-themed drawer below the 4-card grid row; props: `{ insight, title, definition?, onClose }`; renders sections in 2-3 column grid; ALLCAPS heading detection with `/^[A-Z][A-Z\s&/]+$/` regex | New component |
| `src/components/analytics/AwarenessInsightPanel.tsx` | Rewritten — light-themed (`bg-white`, `border-slate-200`), uses `insight.snapshot` as takeaway, "FULL ANALYSIS ▼" toggle, section card grid for detail; used only for section-level panels (Funnel, Rankings, Intent, Module Summary) | Component update |
| `src/pages/SubscriberDashboardPage.tsx` | Added `MetricRowAnalysisDrawer` import + `AwarenessInsightResult` type import; added `activeAwarenessMetric` + `showAdminAI` state; replaced stacked `AwarenessInsightPanel` under each card with snapshot strip + VIEW ANALYSIS button; added row-level drawer renders after Row 1 and Row 2; admin AI section collapsed by default, labeled "Experimental AI Narrative" | Dashboard redesign |
| `src/utils/awarenessInsights.test.ts` | Updated: `preview` → `snapshot` throughout; compare/caution tests now check `detail` (not `snapshot`); MoM growth test uses `/grow/i`; MoM decline uses `/declin/i`; ranking caution uses `/low sample/i`; module summary uses `/recogni[sz]ed.{0,5}but.{0,5}forgotten/i` | Tests |
| `src/components/analytics/AwarenessInsightPanel.test.tsx` | Rewritten for new interface — mock uses `{ snapshot, detail }`, button label changed from "VIEW DETAILED ANALYSIS" to "FULL ANALYSIS" | Tests |

---

## 7. Light Theme — Why It Matters

All metric cards use `.kpi-card-primary` / `.kpi-card-secondary` CSS classes with:
```css
.kpi-card-primary { background: #ffffff !important; }
.kpi-card-secondary { background: #ffffff !important; }
```

V2 used dark slate theme (`bg-slate-900/60`, `text-slate-300`) which clashed. V3 uses exclusively:
- Snapshot strip: `bg-white border-slate-200 text-slate-500`
- `MetricRowAnalysisDrawer`: `bg-white border-slate-200 shadow-lg` with `text-slate-600` body
- `AwarenessInsightPanel` (section panels): `bg-white border-slate-200 text-slate-700`
- Section cards within: `bg-slate-50 border-slate-100 text-slate-600`

---

## 8. Do Insights Auto-Update?

Yes. All builder functions (`buildAwarenessMetricInsight`, etc.) are pure functions called inside `useMemo` in `SubscriberDashboardPage.tsx`. They recompute on every filter change:

- Country / bank / time filter change → snapshot + detail text recomputes in same render cycle
- Month-over-month data refresh → `awarenessMoMGrowthPct` updates → MoM growth insight updates
- New survey responses → Firestore data updates → all insights update

There is no cache, API call, or admin action needed.

The **Experimental AI Narrative** section (admin-only, collapsed by default) is the only part requiring a manual click to expand — and is deliberately separated to avoid implying real insights live there.

---

## 9. Build & Test Output

```
src/utils/awarenessInsights.test.ts           46/46 pass
src/components/analytics/AwarenessInsightPanel.test.tsx    7/7 pass

Test Files  2 passed (2)
     Tests  53 passed (53)
  Duration  1.42s

TypeScript: 0 errors (npx tsc --noEmit)
```
