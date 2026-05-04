# Phase 3: Awareness & Consideration Module Refinement — Design Spec

**Date:** 2026-05-04
**Status:** Approved, ready for implementation planning

---

## 1. Objective

Transform the Awareness & Consideration dashboard tab from a metric display into a deeper analytical surface by layering metric education and AI-generated insight reporting onto the existing dashboard structure — without restructuring it.

---

## 2. Design Principles

- **Dashboard-first:** Cards, funnel, rankings, and intent sections remain primary. Education and insights are layered support.
- **Awareness-scoped:** AI report draws only on awareness metrics (Top of Mind, Spontaneous, Aided, Awareness Quality, Share of Voice, funnel, intent, rankings). Usage, loyalty, NPS, and BrandEdge score are excluded unless noted as out of scope.
- **No invented data:** AI prompt explicitly instructs the model to use only supplied values, state null metrics as unavailable, and avoid estimates.
- **Backward compatible:** Card extension adds no visual change unless `infoContent` is passed.
- **Generic pattern:** `infoContent` prop shape is module-agnostic; future tabs (Usage, Loyalty, NPS) can adopt the same pattern.

---

## 3. Scope

### In scope
- `infoContent` prop on existing `Card` component
- Wiring 8 awareness metric cards with `AWARENESS_METRIC_CONTENT` lookups
- `AwarenessInsightsReport` component (new)
- `generateAwarenessReport` function and `buildAwarenessReportPayload` builder in `aiStrategyAdvisorService.ts`
- Firebase callable extension: new `awareness_consideration` branch
- Firestore flat cache collection: `aiInsightReports/{cacheKeyHash}`

### Out of scope
- Restructuring the Awareness tab layout
- Metric glossary panel (deferred)
- Expandable per-card panels (deferred)
- Guard overlays on awareness cards (not applicable)
- Non-awareness modules

---

## 4. Architecture

### 4.1 Workstream A — Metric Education

**File modified:** `src/components/ui/Card.tsx`

New optional prop:
```ts
interface MetricInfoContent {
  definition: string;
  formula?: string;
  interpretation: string;
  caution?: string;
}

// Added to CardProps:
infoContent?: MetricInfoContent;
```

Rendering rules:
- When `infoContent` is present: render a small `i` icon (`text-slate-400 hover:text-slate-200 cursor-default`) inline after the title text.
- Use Radix `Tooltip` / `TooltipTrigger` / `TooltipContent` directly — **no local `TooltipProvider`** (global provider already in `App.tsx` at line 382).
- `TooltipContent` renders: definition → formula (if present) → interpretation → caution (if present), each on its own short line.
- When `infoContent` is absent: zero DOM change, renders exactly as before.
- Mobile: Radix Tooltip supports pointer-type detection. Icon responds to tap/click on touch devices.

**Call-site pattern (SubscriberDashboardPage.tsx — 8 awareness cards):**
```tsx
import { AWARENESS_METRIC_CONTENT } from '@/config/awarenessInsights';

<Card
  title="Top of Mind"
  metricKey="top_of_mind"
  infoContent={AWARENESS_METRIC_CONTENT['top_of_mind']}
  ...
/>
```

`AWARENESS_METRIC_CONTENT` values already have `definition`, `formula`, `interpretation`, and `caution` fields. No transformation needed.

### 4.2 Workstream B — AI Awareness Report

#### 4.2.1 New component: `AwarenessInsightsReport`

**File:** `src/components/analytics/AwarenessInsightsReport.tsx`

```ts
interface AwarenessInsightsReportProps {
  country: string;
  bankId: string;
  bankName: string;
  compareBankId?: string;
  compareBankName?: string;
  period: string;
  filters: ActiveFilters;
  methodologyVersion: string;
  awarenessPayload: AwarenessReportPayload;
}
```

**Render states (5):**

| State | Trigger | UI |
|---|---|---|
| Idle/collapsed | No report generated | Section header + "Generate Insights" button |
| Loading | Generation in progress | Spinner + "Generating…", button disabled |
| Generated | Response received | Full report body, "Refresh Insights" button |
| Stale | `contextHash` changed since last generation | Amber banner + report body still visible |
| Error | Typed error returned | Friendly message + Retry button (see error table) |

**Stale detection:**
- `contextHash = stableHash({ country, bankId, compareBankId, period, filters, methodologyVersion })`
- Computed on every render; compared against `lastGeneratedContextHash` stored in component state.
- If they differ: stale banner renders. No server round-trip required.
- User must click "Refresh Insights" to regenerate.

**Report body rendering:**
- AI returns structured markdown.
- Conservative parser: `## Heading` → `<h3>`, `- bullet` → `<li>`, plain lines → `<p>`.
- All content rendered via React elements only — no raw HTML injection.
- Parse error fallback: render raw text as sanitized plain text; log warning; no crash.

**Collapse/expand:** local `isExpanded` state. Auto-expands to `true` on successful generation.

**Context display (when Generated/Stale):**
- Generated timestamp
- Filter context badge row: country, brand, compare brand (if active), period
- Methodology note: small text line below context badges

#### 4.2.2 Payload type

```ts
interface AwarenessReportPayload {
  reportType: 'awareness_consideration';
  country: string;
  period: string;
  bankId: string;
  bankName: string;
  compareBankId?: string;
  compareBankName?: string;
  filters: Record<string, unknown>;
  methodologyVersion: string;
  metrics: {
    topOfMind: number | null;
    spontaneous: number | null;
    totalAwareness: number | null;
    awarenessQuality: number | null;
    shareOfVoice: number | null;
    awarenessDepthScore: number | null;
    awarenessShareIndex: number | null;
    momGrowthPct: number | null;
  };
  funnel: {
    aware: number | null;
    spontaneous: number | null;
    topOfMind: number | null;
    aided: number | null;
  };
  intent: {
    averageIntent: number | null;
    highIntentPct: number | null;
    highIntentNonUserPct: number | null;
    lowIntentCurrentUserCount: number | null;
    responseBase: number;
  } | null;
  rankings: Array<{ bankName: string; awareness: number; topOfMind: number; rank: number }>;
  compareMetrics?: Record<string, number | null>;
  sampleSize: number;
}
```

Payload contains only aggregate metric values. No raw survey responses, no PII.

#### 4.2.3 `aiStrategyAdvisorService.ts` extension

**New exported function:**
```ts
export async function generateAwarenessReport(
  payload: AwarenessReportPayload,
  userId: string,
): Promise<{ response: string; generatedAt: string; fromCache: boolean }>
```

**Pure payload builder:**
```ts
export function buildAwarenessReportPayload(
  // receives computed dashboard values as arguments
): AwarenessReportPayload
```
Called in `SubscriberDashboardPage.tsx`, result passed as `awarenessPayload` prop.

**Prompt template (enforced constraints):**
- Opens with: country, brand, period, sample size, compare brand if active.
- Lists each metric value with its label; null values listed as "unavailable".
- If `sampleSize < 30`: instructs model to open with a note that the sample is limited (n=N) and findings are indicative only.
- Closes with: "Respond in structured markdown. Use ## headings for each section. Use bullet points. Do not introduce data not listed above. If a metric is listed as null or unavailable, say so explicitly — do not substitute a figure."

**Required AI report sections:**
1. `## Market Awareness Position`
2. `## Awareness Funnel`
3. `## Competitive Landscape`
4. `## Future Consideration`
5. `## Strategic Implications`

#### 4.2.4 Firebase callable extension

New branch inside the existing callable function:
```js
if (payload.reportType === 'awareness_consideration') {
  return handleAwarenessInsightReport(payload, context);
}
```

Internal helper: `handleAwarenessInsightReport(payload, context)`
- Computes canonical `cacheKeyHash` server-side from `{ reportType, userId, country, bankId, compareBankId, methodologyVersion, filtersHash }`.
- Frontend-supplied hash (if any) is ignored for cache writes.
- Reads `aiInsightReports/{cacheKeyHash}`.
- If document exists and `expiresAt > now`: returns cached response.
- Else: calls AI model with awareness prompt, writes cache document, returns response.

**Cache document schema (`aiInsightReports/{cacheKeyHash}`):**
```
reportType: string
userId: string
country: string
bankId: string
compareBankId: string | null
methodologyVersion: string
filtersHash: string
payloadHash: string
generatedAt: Timestamp
expiresAt: Timestamp  // now + 24h
response: string
```

---

## 5. Error Handling

| Error type | Condition | UI message |
|---|---|---|
| `rate-limited` | Monthly limit reached | "Monthly insight limit reached. Please try again after your allowance resets." No retry button. |
| `insufficient-data` | `sampleSize === 0` OR all awareness metric values are null | "Not enough data to generate a report for this filter combination." Retry only after filters change. |
| `generation-failed` | Callable throws or network error | "Report generation failed. Try again." + Retry button. |
| `parse-error` | AI returns unrecognizable structure | Fallback to sanitized plain text. Log warning. No crash. |

Low sample (`sampleSize > 0, < 30`): does **not** block generation. Forces cautious wording in prompt only.

---

## 6. Modified and New Files

| File | Change type |
|---|---|
| `src/components/ui/Card.tsx` | Modified — add `infoContent?: MetricInfoContent` prop |
| `src/services/aiStrategyAdvisorService.ts` | Modified — add `AwarenessReportPayload`, `generateAwarenessReport`, `buildAwarenessReportPayload` |
| `src/pages/SubscriberDashboardPage.tsx` | Modified — wire `infoContent` on 8 awareness cards, add `<AwarenessInsightsReport />` below intent section |
| `src/components/analytics/AwarenessInsightsReport.tsx` | New |
| `functions/index.js` | Modified — add `awareness_consideration` branch in callable |

---

## 7. Testing

**Card component:**
- Renders without `infoContent`: no info icon in DOM, no layout change.
- Renders with `infoContent`: icon present, tooltip content includes definition, formula, interpretation, caution.
- `formula` and `caution` absent: only definition and interpretation render.

**`AwarenessInsightsReport`:**
- Idle state: "Generate Insights" button visible, report body absent.
- Loading state: spinner visible, button disabled.
- Generated state: all 5 section headings present in DOM.
- Stale state: amber banner present when context hash changes.
- Error state (generation-failed): error message + Retry button visible.
- Error state (insufficient-data): error message present, no Retry button.
- `sampleSize = 0`: routes to insufficient-data error, not generation-failed.
- `sampleSize = 15` (low but > 0): generates report; no error thrown.

**`buildAwarenessReportPayload`:**
- Pure function: same inputs produce same output.
- All null metrics produce payload with nulls, not zeros.

**`generateAwarenessReport`:**
- Returns cached response on cache hit (mock Firestore).
- Calls callable on cache miss.
- Returns `fromCache: true` on hit, `false` on miss.

---

## 8. Deferred

- Metric glossary panel (single "Methodology" button listing all 13 metrics)
- Expandable per-card insight panels below each card
- Guard overlays on awareness cards
- Education layer for Usage, Loyalty, NPS, Momentum tabs (same Card pattern, different content)
