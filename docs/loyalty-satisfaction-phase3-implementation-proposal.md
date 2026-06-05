# Loyalty & Satisfaction Module — Revised Implementation Proposal

**Date:** 2026-05-24
**Module:** Phase 3 — Loyalty & Satisfaction tab (`loyalty_satisfaction`)
**Version:** 2 — refined writing architecture and builder structure
**Status:** Proposal — awaiting approval before implementation

---

## What Changed from v1

| Area | v1 | v2 |
|---|---|---|
| Builders | 10 | 8 (2 dropped) |
| Section analysis panels | 5 | 3 |
| NPS Breakdown section | Full panel + dedicated builder | 3 stat cards only; analysis in NPS KPI modal |
| Decision Tree panel | SectionAnalysisBlock | Static methodology note |
| Modal section headings | AI-system tone | Corporate strategy tone |
| Snapshot tone | Interpretive / descriptive | Commercially-led |

---

## 1. Audit Findings

### What exists today

- 4 KPI cards (Loyalty Index, NPS, Committed%, Rejectors%) — numbers only, no analytical context
- 5 segment cards (Committed through Rejectors) — percentages and counts only
- A 2-column grid: Segmentation Decision Tree (MiniBar rows) + Segment Movement Tracker (table)
- Segment Profile Cards (5 demographic breakdowns)
- Conversion Funnel (Aware → Potential → Favors → Committed, with 3 rate cards)

### What is missing

- No module-level summary banner
- No per-KPI analytical footers
- No section-level analysis panels
- No NPS decomposition (promoters / passives / detractors)
- No dynamic builders — the only insight text today is static single-sentence threshold strings from `LOYALTY_SECTION_INSIGHTS` config

### Comparison verdict

The Loyalty tab is two analytical generations behind Awareness and Usage. Both modules now have a summary banner, per-KPI footers, and section panels driven by dynamic builders. Loyalty has none of these. The proposed work brings it to parity.

---

## 2. Current Module Map

```
TabsContent value="loyalty_satisfaction"
├── Grid 4 — KPI cards
│   ├── Loyalty Index       ← loyaltyDiagnosticsView.loyaltyIndex
│   ├── NPS                 ← loyaltyDiagnosticsView.nps
│   ├── Committed%          ← segmentPcts.Committed
│   └── Rejectors%          ← segmentPcts.Rejectors
│
├── Section: Loyalty Segmentation Analysis
│   └── Grid 5 — one card per LoyaltyBucket
│
├── Grid 2 cols
│   ├── Segmentation Decision Tree (4 MiniBar rows)
│   └── Segment Movement Tracker (table of movementRows)
│
├── Section: Segment Profile Cards
│   └── 5 LoyaltySegmentProfile cards (demographics)
│
└── Section: Conversion Funnel to Loyalty
    ├── Grid 4 (Aware / Potential / Favors / Committed counts)
    └── Grid 3 (awareToPotential / potentialToFavors / favorsToCommitted rate cards)
```

### Data sources in scope

| Source | Content |
|---|---|
| `loyaltyDiagnosticsView` | Blended aggregate + raw. Aggregate-backed for: counts, pcts, loyaltyIndex, nps, movementRows. Raw for: profileCards |
| `selectedMetricsView.nps`, `.promoters`, `.passives`, `.detractors` | Raw BankMetrics — NPS decomposition |
| `usageDiagnostics?.everCount` | NPS base population |

---

## 3. Revised Analytical Structure

Eight analytical surfaces total. Clean and scannable.

```
LoyaltyBanner
  (snapshot text + 3 stat boxes: Loyalty Index / NPS / Committed%)

Grid 4 — KPI cards, each with KpiCardAnalysisFooter
  ├── Loyalty Index   → buildLoyaltyIndexInsight()
  ├── NPS             → buildNpsInsight()       ← includes decomposition context
  ├── Committed%      → buildCommittedInsight()
  └── Rejectors%      → buildRejectorsInsight()

Section: Segment Mix [SectionAnalysisBlock]
  → buildSegmentDistributionInsight()
  └── Grid 5 segment cards (layout unchanged)

Grid 2 cols
  ├── Segmentation Decision Tree
  │     + static methodology note (no analysis panel — rules are fixed)
  └── Segment Shifts [SectionAnalysisBlock]
        → buildSegmentMovementInsight()

Section: Segment Profile Cards (unchanged — no panel)

Section: NPS Breakdown  ← new, lightweight
  └── Grid 3: Promoters% / Passives% / Detractors% stat cards
      (no analysis panel — interpretation lives in the NPS KPI modal)

Section: Conversion Funnel [SectionAnalysisBlock]
  → buildLoyaltyFunnelInsight()
  └── Grid 4 + Grid 3 (layout unchanged)
```

**Analytical surfaces by type:**

| Type | Count | Components |
|---|---|---|
| Summary banner | 1 | `LoyaltyBanner` |
| KPI footers | 4 | `KpiCardAnalysisFooter` × 4 |
| Section panels | 3 | `SectionAnalysisBlock` × 3 |
| **Total** | **8** | |

---

## 4. Revised Builder Architecture

**8 builders** (down from 10). Hosted in `src/utils/loyaltyInsights.ts`.

All return `AwarenessInsightResult`. All use deterministic threshold logic — no AI calls.

### Dropped builders and rationale

| Dropped | Reason |
|---|---|
| `buildSegmentationRulesInsight` | The segmentation decision tree explains fixed classification rules, not market conditions. A static methodology note is more honest and less noisy than a dynamic builder producing the same text every run. |
| `buildNpsDecompositionInsight` | The promoter/passive/detractor breakdown belongs inside the NPS KPI modal (`buildNpsInsight`). A separate builder and section panel for this was duplicative and crowded the tab. |

### Function signatures

```typescript
// Banner summary
buildLoyaltyModuleSummary(
  diagnostics: LoyaltyDiagnostics,
  bankName: string
): AwarenessInsightResult

// KPI footers
buildLoyaltyIndexInsight(
  loyaltyIndex: number,
  segmentPcts: Record<LoyaltyBucket, number>,
  bankName: string
): AwarenessInsightResult

buildNpsInsight(
  nps: number,
  promoterPct: number,
  passivePct: number,
  detractorPct: number,
  everCount: number,
  bankName: string
): AwarenessInsightResult

buildCommittedInsight(
  committedPct: number,
  committedCount: number,
  awareCount: number,
  bankName: string
): AwarenessInsightResult

buildRejectorsInsight(
  rejectorsPct: number,
  rejectorsCount: number,
  awareCount: number,
  segmentPcts: Record<LoyaltyBucket, number>,
  bankName: string
): AwarenessInsightResult

// Section panels
buildSegmentDistributionInsight(
  diagnostics: LoyaltyDiagnostics,
  bankName: string
): AwarenessInsightResult

buildSegmentMovementInsight(
  movementRows: LoyaltyMovementRow[],
  bankName: string
): AwarenessInsightResult

buildLoyaltyFunnelInsight(
  awareToPotential: number,
  potentialToFavors: number,
  favorsToCommitted: number,
  awareCount: number,
  bankName: string
): AwarenessInsightResult
```

---

## 5. Modal Content Architecture

Each modal answers three questions in sequence: **what is the position**, **why it matters commercially**, **what management should do**. Max 4 sections. Max 3 sentences per section.

Section headings must pass the `parseSection` regex (`/^[A-Z][A-Z\s&/]+$/`) — all uppercase, letters and spaces only.

---

### 5a. Loyalty Index modal

**Purpose:** Composite health score. Answers: how healthy is the overall base, and what is dragging or lifting the number?

**Definition strip:** "Composite score weighted by segment — Committed (×1.0), Favors (×0.7), Potential (×0.4), Accessibles (×0.2), Rejectors (×0.0) — scaled to 100 across all aware respondents."

**Snapshot:** One sentence stating the index level and its market position (e.g., "Equity Bank's Loyalty Index of 68 sits in the developing range, driven primarily by a strong Favors segment offsetting a below-average Committed base.").

**Sections:**

| Heading | Content |
|---|---|
| `SCORE CONTEXT` | Where this number sits relative to the scale (below 40 = weak, 40–59 = developing, 60–74 = solid, 75+ = strong). What the level implies about commercial durability. |
| `SCORE COMPOSITION` | Which segment buckets are pulling the score up and which are dragging it. Focus on the two biggest contributors by weighted volume. |
| `BUSINESS IMPLICATIONS` | What this level of loyalty means for revenue retention, churn risk, or growth headroom. One commercial consequence. |
| `PRIORITY ACTION` | The single highest-leverage lever to move the index — typically the largest recoverable segment. |

---

### 5b. NPS modal

**Purpose:** Customer advocacy read. Answers: how many customers actively recommend vs. actively warn others away? This is a different question from the Loyalty Index — it measures voice, not segmentation.

**NPS base note:** NPS is calculated on ever-used and current customers only (`N = {everCount}`). The modal must display this base.

**Definition strip:** "Net Promoter Score among ever-used and current customers. Promoters (scores 9–10) minus detractors (scores 0–6), expressed as a percentage-point score."

**Snapshot:** One sentence stating the NPS level, promoter-to-detractor ratio, and whether the score represents an asset or a risk (e.g., "At +12, NPS reflects a modest advocacy surplus — but detractors at 28% represent a meaningful word-of-mouth drag that is not yet offset by promoter volume.").

**Sections:**

| Heading | Content |
|---|---|
| `NPS POSITION` | Where +/− X sits (strong: >+40, adequate: +20 to +40, marginal: 0 to +20, negative: <0). Commercial read on the overall score. |
| `PROMOTER BASE` | Promoter percentage, what volume this represents, and what this means for organic acquisition. |
| `DETRACTOR PROFILE` | Detractor percentage, passive buffer, whether the score is structurally weak or close to recovery. Not "customers are unhappy" — about the word-of-mouth drag and recovery cost. |
| `PRIORITY ACTION` | Whether the primary lever is growing promoters (if detractors are low) or reducing detractors (if they are high). Specific and commercial. |

---

### 5c. Committed modal

**Purpose:** Revenue concentration. Answers: how large is the bank's most commercially valuable customer segment, and what is the retention risk?

**Definition strip:** "Share of aware respondents classified as fully committed: current primary customers who name this bank as preferred and rate NPS 9–10."

**Snapshot:** One sentence stating the committed base size and its commercial significance (e.g., "At 18%, KCB's committed base is modest relative to its overall awareness, indicating a sizeable pool of active customers who have not yet reached full brand commitment.").

**Sections:**

| Heading | Content |
|---|---|
| `COMMITTED BASE SIZE` | Absolute read of the percentage and count. Whether this is a strong, average, or thin core relative to the aware base. |
| `STABILITY OUTLOOK` | What would move committed customers out of this segment — competitor offers, service quality, or pricing. The retention risk is the commercial question here, not satisfaction. |
| `BUSINESS IMPLICATIONS` | Revenue concentration risk if the base is small; growth headroom if it is large. |
| `PRIORITY ACTION` | Whether to defend (if base is stable but thin) or deepen (if base is growing). One specific program lever. |

---

### 5d. Rejectors modal

**Purpose:** Competitive exposure. Answers: what has the bank permanently lost among aware customers, and is any of it recoverable?

**Definition strip:** "Share of aware respondents classified as rejectors: those who have used the bank but show low return intent (score ≤3) and negative NPS (score ≤6)."

**Snapshot:** One sentence stating the rejector share and the competitive exposure it represents (e.g., "Rejectors at 22% of the aware base represent a material competitive exposure — most are active users of alternative banks, and the majority show no signal of return intent.").

**Sections:**

| Heading | Content |
|---|---|
| `REJECTION PROFILE` | Scale of the rejector segment and what proportion of the aware base this represents. Whether this is growing or stable based on movement data (if available). |
| `REACTIVATION POTENTIAL` | How many rejectors are plausibly recoverable (intent and NPS borderline) versus structurally lost. This is a commercial sizing question, not an emotional one. |
| `COMPETITIVE EXPOSURE` | Whether this group likely benefits a named competitor or is simply inactive. Market share implication. |
| `PRIORITY ACTION` | Whether reactivation economics justify a targeted program, or whether investment is better directed at Potential and Accessibles segments. |

---

### 5e. Segment Mix modal (section panel)

**Purpose:** Portfolio read. Answers: what is the shape of the loyalty base, and what does the distribution imply about brand health?

**Snapshot:** One sentence characterising the overall segment distribution shape (e.g., "The segment mix is front-heavy in Accessibles and Potential, with a small committed core — a classic developing-market loyalty profile that reflects broad awareness but limited depth of relationship.").

**Sections:**

| Heading | Content |
|---|---|
| `SEGMENT MIX` | How the 5 buckets distribute as percentages. Whether the shape is top-heavy (strong core), bottom-heavy (broad but shallow), or polarised (large Committed and large Rejectors). |
| `PORTFOLIO QUALITY` | What the mix implies about long-run revenue stability and share-of-wallet concentration. Not "customers are satisfied" — about the structural quality of the customer base. |
| `COMMERCIAL PRIORITY` | Which segment represents the highest near-term value opportunity, and why. One specific focus. |
| `PRIORITY ACTION` | The segment movement most worth investing in. |

---

### 5f. Segment Shifts modal (section panel)

**Purpose:** Momentum read. Answers: which way is the loyalty base moving month on month, and what does the net direction mean?

**Snapshot:** One sentence stating the most significant month-on-month movement and whether it is favourable or unfavourable (e.g., "The Committed segment gained 2.1 percentage points over the prior month while Rejectors fell by 1.4 points — a modest but positive net direction.").

**Sections:**

| Heading | Content |
|---|---|
| `MONTH ON MONTH SHIFTS` | The largest positive and negative segment movements in percentage-point terms. Focus on the two most significant shifts. |
| `NET DIRECTION` | Whether the portfolio is accumulating loyalty (committed/favors growing) or losing it (rejectors/accessibles growing). One directional read. |
| `BUSINESS IMPLICATIONS` | What sustained movement in this direction means commercially over a 3–6 month horizon. |
| `PRIORITY ACTION` | The segment to reinforce or arrest. Specific. |

---

### 5g. Conversion Funnel modal (section panel)

**Purpose:** Conversion efficiency. Answers: where is the bank losing aware customers as they move toward commitment, and which stage is the primary constraint?

**Snapshot:** One sentence stating where the funnel drops most sharply (e.g., "The sharpest drop is from Potential to Favors at 38%, indicating that aware and intending customers are not being converted to active preference — most likely due to insufficient trial or direct acquisition pressure.").

**Sections:**

| Heading | Content |
|---|---|
| `CONVERSION RATES` | The three stage-to-stage conversion rates (aware→potential, potential→favors, favors→committed). Which is the weakest. |
| `WHERE CONVERSION DROPS` | The specific stage losing the most people and what category of barrier this typically reflects (awareness gap, trial barrier, or relationship gap). |
| `BUSINESS IMPLICATIONS` | Commercial cost of the drop-off: what recovering 10 percentage points at this stage would mean for the committed base. |
| `PRIORITY ACTION` | The single most addressable intervention at the weakest stage. |

---

### 5h. Banner summary (`buildLoyaltyModuleSummary`)

**Used for:** `LoyaltyBanner` center text (snapshot only). The `detail` sections are built but the banner does not currently render a full modal.

**Snapshot:** 1–2 sentences. Lead with the index level, NPS read, and one forward-looking commercial observation.

**Sections (for potential future modal use):**

| Heading | Content |
|---|---|
| `LOYALTY POSITION` | Index level and tier |
| `SEGMENT MIX` | Short portfolio shape read |
| `NPS READING` | Advocacy position |
| `PRIORITY ACTION` | Top commercial lever |

---

## 6. Pattern Tag Labels (Banner Chip)

The `positionLabel` chip in the banner left zone. Determined by `buildLoyaltyModuleSummary` based on index and rejector share.

| Condition | Label |
|---|---|
| loyaltyIndex ≥ 75 | `STRONG BASE` |
| loyaltyIndex 60–74 | `SOLID BASE` |
| loyaltyIndex 40–59 | `DEVELOPING BASE` |
| loyaltyIndex < 40 | `WEAK BASE` |
| Override: rejectors% > 25% regardless of index | `HIGH REJECTOR SHARE` |

---

## 7. UI Components

### Reuse as-is

| Component | Usage |
|---|---|
| `KpiCardAnalysisFooter` | Attach to all 4 KPI cards — already generic |
| `SectionAnalysisBlock` | Attach to 3 sections — already generic |
| `InsightModal` | No changes |

### New component: `LoyaltyBanner`

Mirrors `UsageIntelligenceBanner` layout exactly. Named `LoyaltyBanner` rather than `LoyaltyIntelligenceBanner` — cleaner, consistent with the non-AI-sounding naming direction.

```typescript
interface LoyaltyBannerProps {
  moduleSummary: AwarenessInsightResult | null;
  loyaltyIndex: number | null;
  nps: number | null;
  committedPct: number | null;
  positionLabel: string;
  sampleSize: number;
}
```

**Zones:** Left (positionLabel chip + N= label) / Center (◈ "Loyalty Overview" + snapshot) / Right (Loyalty Index / NPS / Committed% stat boxes).

### New test files

- `src/components/analytics/LoyaltyBanner.test.tsx` — renders, stats visible, null guard
- `src/utils/loyaltyInsights.test.ts` — all 8 builders: snapshot non-empty, all expected headings present

---

## 8. Data & Formula Risks

### Risk 1 — Admin tab uses a different loyalty score formula

`src/components/admin/tabs/LoyaltyTab.tsx` computes `loyaltyScore = (committed×5 + favors×3 + potential×1 − rejectors×2) / 7`. This is not the Loyalty Index. The two are intentionally separate. Builders must receive values from `loyaltyDiagnosticsView`, never from the admin-side computation.

### Risk 2 — NPS base is `everCount`, not `awareCount`

NPS covers ever-used and current respondents with valid NPS data, not the full aware base. `buildNpsInsight` takes `everCount` as an explicit parameter. The modal definition strip and snapshot must reference this base, not `awareCount`.

### Risk 3 — NPS promoter/passive/detractor source

These come from `selectedMetricsView.promoters`, `.passives`, `.detractors` — raw BankMetrics, not from `loyaltyDiagnostics`. The NPS Breakdown section (3 stat cards) and the NPS modal must guard for null before rendering. Show "Insufficient data" if null.

### Risk 4 — Profile cards are intentionally raw

`loyaltyDiagnosticsView.profileCards` is sourced from raw diagnostics by design. Builders do not use `profileCards` and are not affected.

### Risk 5 — Zero-denominator in funnel builder

If `awareCount === 0`, all funnel rates are undefined. `buildLoyaltyFunnelInsight` must return a safe "Insufficient sample" result rather than NaN.

---

## 9. Implementation Plan

### Phase A — Builders

1. Create `src/utils/loyaltyInsights.ts` — all 8 builders, threshold-based logic
2. Create `src/utils/loyaltyInsights.test.ts` — unit tests per builder
3. Run `npm test -- loyaltyInsights` — green before proceeding

### Phase B — Banner component

4. Create `src/components/analytics/LoyaltyBanner.tsx`
5. Create `src/components/analytics/LoyaltyBanner.test.tsx`
6. Run tests — green

### Phase C — Wire into SubscriberDashboardPage (loyalty tab only)

7. Add `loyaltyModuleSummary` useMemo → `buildLoyaltyModuleSummary`
8. Add `loyaltyKpiInsights` useMemo → 4 KPI builders
9. Add `loyaltySectionInsights` useMemo → 3 section builders
10. Insert `LoyaltyBanner` at top of tab
11. Attach `KpiCardAnalysisFooter` to each KPI card (with `definition` prop per section 5)
12. Add `SectionAnalysisBlock` to: Segment Mix, Segment Shifts, Conversion Funnel
13. Add NPS Breakdown section — Grid 3 stat cards (Promoters / Passives / Detractors); no analysis panel
14. Add static methodology note below Decision Tree heading (replaces removed analysis panel)
15. Run full test suite — fix regressions

### Phase D — Gate and verify

16. Wrap all new analytical components under `adminMode` guard
17. Visual verify in dev server — loyalty tab in both adminMode and non-admin

### Files affected

| File | Action |
|---|---|
| `src/utils/loyaltyInsights.ts` | Create |
| `src/utils/loyaltyInsights.test.ts` | Create |
| `src/components/analytics/LoyaltyBanner.tsx` | Create |
| `src/components/analytics/LoyaltyBanner.test.tsx` | Create |
| `src/pages/SubscriberDashboardPage.tsx` | Modify — loyalty tab section only |

No other files change.

---

## 10. Formula & Denominator Confirmation

**No formulas or denominators will change.**

| Metric | Formula | Base | Status |
|---|---|---|---|
| Loyalty Index | `(C×100 + F×70 + P×40 + A×20 + R×0) / awareCount` | awareCount | UNCHANGED |
| NPS | `promoterPct − detractorPct` | everCount | UNCHANGED |
| Committed% | `segmentCounts.Committed / awareCount` | awareCount | UNCHANGED |
| Rejectors% | `segmentCounts.Rejectors / awareCount` | awareCount | UNCHANGED |
| `loyaltySegment()` decision tree | existing logic | — | UNCHANGED |
| Funnel conversion rates | existing computations in `computeLoyaltyDiagnostics` | — | UNCHANGED |
| NPS decomposition | raw `promoters / passives / detractors` from `selectedMetricsView` | everCount | UNCHANGED |

All computation logic in `src/utils/subscriberDashboard.ts` is read-only for this implementation.

---

*Ready to proceed to implementation on approval.*
