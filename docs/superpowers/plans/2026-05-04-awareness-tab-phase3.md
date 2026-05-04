# Awareness & Consideration Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layer metric education (already wired) and an AI-generated awareness report onto the existing Awareness & Consideration tab without restructuring it.

**Architecture:** Two workstreams. Workstream A (metric education) is already implemented — the `Card` component in `SubscriberDashboardPage.tsx` already renders `MetricInfoIcon` popovers for all 8 awareness cards via `METRIC_CONTENT` (which merges `AWARENESS_METRIC_CONTENT`). No Card changes are needed. Workstream B adds `AwarenessReportPayload` types and `buildAwarenessReportPayload` / `generateAwarenessReport` to `aiStrategyAdvisorService.ts`, extends the `aiStrategyAdvisor` callable with a server-side awareness branch (access control, Firestore cache, Gemini call), creates the `AwarenessInsightsReport` component, and wires it into the dashboard page.

**Tech Stack:** TypeScript, React, Vitest, Firebase Functions v2, Firestore, Gemini API (via existing `callGeminiWithText` pattern), Tailwind CSS, `@testing-library/react`.

**Spec:** `docs/superpowers/specs/2026-05-04-awareness-tab-phase3-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/services/aiStrategyAdvisorService.ts` | Modify | Add `AwarenessReportPayload`, `AwarenessReportError`, `AWARENESS_REPORT_METHODOLOGY_VERSION`, `buildAwarenessReportPayload`, `generateAwarenessReport` |
| `src/test/awarenessReportService.test.ts` | Create | Unit tests for payload builder and generate function |
| `src/components/analytics/AwarenessInsightsReport.tsx` | Create | Stateful component: 5 render states, markdown parser, stale detection |
| `src/components/analytics/AwarenessInsightsReport.test.tsx` | Create | Component tests for all 5 states |
| `src/pages/SubscriberDashboardPage.tsx` | Modify | Import component, add `awarenessPayload` useMemo, wire `<AwarenessInsightsReport>` |
| `functions/index.js` | Modify | Add awareness Gemini helper, prompt builders, cache handler, callable branch |

---

## Task 1: Pre-check — confirm metric education is already wired

**Files:**
- Read: `src/pages/SubscriberDashboardPage.tsx:404-437` (local `Card` + `MetricInfoIcon`)
- Read: `src/config/awarenessInsights.ts` (confirms `AWARENESS_METRIC_CONTENT` keys)

- [ ] **Step 1: Run existing tests**

```bash
cd /Users/theo/brand-health-analytics_banks
npx vitest run --reporter=verbose 2>&1 | tail -20
```

Expected: pre-existing test suite passes (1 pre-existing failure in `multiBank.test.ts` is unrelated and acceptable).

- [ ] **Step 2: Confirm all 8 awareness card metricKey values exist in AWARENESS_METRIC_CONTENT**

Open `src/config/awarenessInsights.ts`. Verify these 8 keys are present as top-level keys in `AWARENESS_METRIC_CONTENT`:
`top_of_mind`, `spontaneous_recall`, `total_awareness`, `awareness_quality`, `share_of_voice`, `mom_growth`, `awareness_share_index`, `awareness_depth_score`.

- [ ] **Step 3: Confirm MetricInfoIcon renders for awareness cards**

Open `src/pages/SubscriberDashboardPage.tsx`, lines 2519–2528. Verify each `<Card>` has `metricKey=...` with one of the 8 keys above.

No code change in this task. If anything is missing, add the `metricKey` prop before continuing.

---

## Task 2: Define payload types + `buildAwarenessReportPayload`

This is a pure function — no Firebase calls, no side effects. Write tests first.

**Files:**
- Create: `src/test/awarenessReportService.test.ts`
- Modify: `src/services/aiStrategyAdvisorService.ts`

- [ ] **Step 1: Write failing tests**

Create `src/test/awarenessReportService.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildAwarenessReportPayload,
  AWARENESS_REPORT_METHODOLOGY_VERSION,
} from '@/services/aiStrategyAdvisorService';

const BASE_ARGS = {
  country: 'rwanda',
  period: 'All data',
  bankId: 'BK_RW',
  bankName: 'Bank of Kigali',
  filters: { time_window: 'all' } as Record<string, unknown>,
  sampleSize: 50,
  topOfMind: 35,
  spontaneous: 45,
  totalAwareness: 80,
  awarenessQuality: 43.75,
  shareOfVoice: 28,
  awarenessDepthScore: 55,
  awarenessShareIndex: 32,
  momGrowthPct: 2.5,
  funnelAware: 80,
  funnelSpontaneous: 45,
  funnelTopOfMind: 35,
  funnelAided: 20,
  intent: {
    averageIntent: 6.8,
    highIntentPct: 0.62,
    highIntentNonUserPct: 0.45,
    lowIntentCurrentUserCount: 8,
    responseBase: 42,
  },
  rankings: [
    { bankName: 'Bank of Kigali', awareness: 80, topOfMind: 35, rank: 1 },
    { bankName: 'Equity Bank', awareness: 70, topOfMind: 22, rank: 2 },
  ],
};

describe('buildAwarenessReportPayload', () => {
  it('sets reportType to awareness_consideration', () => {
    expect(buildAwarenessReportPayload(BASE_ARGS).reportType).toBe('awareness_consideration');
  });

  it('includes AWARENESS_REPORT_METHODOLOGY_VERSION', () => {
    expect(buildAwarenessReportPayload(BASE_ARGS).methodologyVersion).toBe(AWARENESS_REPORT_METHODOLOGY_VERSION);
  });

  it('is deterministic — same inputs produce same output', () => {
    const a = buildAwarenessReportPayload(BASE_ARGS);
    const b = buildAwarenessReportPayload(BASE_ARGS);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('passes null metric values through as null', () => {
    const payload = buildAwarenessReportPayload({ ...BASE_ARGS, topOfMind: null, shareOfVoice: null });
    expect(payload.metrics.topOfMind).toBeNull();
    expect(payload.metrics.shareOfVoice).toBeNull();
  });

  it('sets compareMetrics to null when no compareBankId', () => {
    const payload = buildAwarenessReportPayload(BASE_ARGS);
    expect(payload.compareMetrics).toBeNull();
    expect(payload.compareBankId).toBeNull();
  });

  it('includes compareMetrics when compareBankId is provided', () => {
    const payload = buildAwarenessReportPayload({
      ...BASE_ARGS,
      compareBankId: 'EQ_RW',
      compareBankName: 'Equity Bank',
      compareTopOfMind: 22,
      compareAwareness: 70,
    });
    expect(payload.compareBankId).toBe('EQ_RW');
    expect(payload.compareMetrics).not.toBeNull();
    expect(payload.compareMetrics?.topOfMind).toBe(22);
  });

  it('passes null intent through as null', () => {
    const payload = buildAwarenessReportPayload({ ...BASE_ARGS, intent: null });
    expect(payload.intent).toBeNull();
  });

  it('copies rankings array', () => {
    const payload = buildAwarenessReportPayload(BASE_ARGS);
    expect(payload.rankings).toHaveLength(2);
    expect(payload.rankings[0].rank).toBe(1);
  });
});
```

- [ ] **Step 2: Run to confirm they all fail**

```bash
npx vitest run src/test/awarenessReportService.test.ts 2>&1 | tail -15
```

Expected: all 8 tests fail with "buildAwarenessReportPayload is not a function" or similar.

- [ ] **Step 3: Add types and `buildAwarenessReportPayload` to `aiStrategyAdvisorService.ts`**

Add after the existing `StrategyBriefArchiveEntry` interface (around line 57) and before `const monthKey`:

```ts
export const AWARENESS_REPORT_METHODOLOGY_VERSION = '1.0';

export type AwarenessReportError = 'rate-limited' | 'insufficient-data' | 'generation-failed';

export interface AwarenessReportPayload {
  reportType: 'awareness_consideration';
  methodologyVersion: string;
  country: string;
  period: string;
  bankId: string;
  bankName: string;
  compareBankId: string | null;
  compareBankName: string | null;
  filters: Record<string, unknown>;
  sampleSize: number;
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
  compareMetrics: { topOfMind: number | null; awareness: number | null } | null;
}

interface AwarenessPayloadArgs {
  country: string;
  period: string;
  bankId: string;
  bankName: string;
  compareBankId?: string | null;
  compareBankName?: string | null;
  filters: Record<string, unknown>;
  sampleSize: number;
  topOfMind: number | null;
  spontaneous: number | null;
  totalAwareness: number | null;
  awarenessQuality: number | null;
  shareOfVoice: number | null;
  awarenessDepthScore: number;
  awarenessShareIndex: number;
  momGrowthPct: number | null;
  funnelAware: number | null;
  funnelSpontaneous: number | null;
  funnelTopOfMind: number | null;
  funnelAided: number | null;
  intent: AwarenessReportPayload['intent'];
  rankings: AwarenessReportPayload['rankings'];
  compareTopOfMind?: number | null;
  compareAwareness?: number | null;
}

const toNullable = (v: number | null | undefined): number | null =>
  v === null || v === undefined || !Number.isFinite(v as number) ? null : (v as number);

export function buildAwarenessReportPayload(args: AwarenessPayloadArgs): AwarenessReportPayload {
  return {
    reportType: 'awareness_consideration',
    methodologyVersion: AWARENESS_REPORT_METHODOLOGY_VERSION,
    country: args.country,
    period: args.period,
    bankId: args.bankId,
    bankName: args.bankName,
    compareBankId: args.compareBankId ?? null,
    compareBankName: args.compareBankName ?? null,
    filters: args.filters,
    sampleSize: args.sampleSize,
    metrics: {
      topOfMind: toNullable(args.topOfMind),
      spontaneous: toNullable(args.spontaneous),
      totalAwareness: toNullable(args.totalAwareness),
      awarenessQuality: toNullable(args.awarenessQuality),
      shareOfVoice: toNullable(args.shareOfVoice),
      awarenessDepthScore: args.awarenessDepthScore,
      awarenessShareIndex: args.awarenessShareIndex,
      momGrowthPct: toNullable(args.momGrowthPct),
    },
    funnel: {
      aware: toNullable(args.funnelAware),
      spontaneous: toNullable(args.funnelSpontaneous),
      topOfMind: toNullable(args.funnelTopOfMind),
      aided: toNullable(args.funnelAided),
    },
    intent: args.intent ?? null,
    rankings: args.rankings,
    compareMetrics: args.compareBankId
      ? { topOfMind: toNullable(args.compareTopOfMind), awareness: toNullable(args.compareAwareness) }
      : null,
  };
}
```

- [ ] **Step 4: Run tests — expect all 8 to pass**

```bash
npx vitest run src/test/awarenessReportService.test.ts 2>&1 | tail -15
```

Expected: `8 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/services/aiStrategyAdvisorService.ts src/test/awarenessReportService.test.ts
git commit -m "feat: add AwarenessReportPayload types and buildAwarenessReportPayload"
```

---

## Task 3: Add `generateAwarenessReport` to service

Calls the `aiStrategyAdvisor` callable with `reportType: 'awareness_consideration'` and returns `{ response, generatedAt, fromCache }`. The callable handles cache server-side (Task 4). This task is frontend-only.

**Files:**
- Modify: `src/services/aiStrategyAdvisorService.ts`
- Modify: `src/test/awarenessReportService.test.ts`

- [ ] **Step 1: Write failing tests for `generateAwarenessReport`**

Add to `src/test/awarenessReportService.test.ts` (after the existing describe block):

```ts
import { vi, beforeEach } from 'vitest';
import { httpsCallable } from 'firebase/functions';
import { generateAwarenessReport } from '@/services/aiStrategyAdvisorService';

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
  getFunctions: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  functions: {},
  db: {},
}));

const MOCK_PAYLOAD = buildAwarenessReportPayload(BASE_ARGS);

describe('generateAwarenessReport', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns response from callable on cache miss', async () => {
    const mockFn = vi.fn().mockResolvedValue({
      data: { response: '## Market Awareness Position\n- Strong', generatedAt: '2026-05-04T10:00:00Z', fromCache: false },
    });
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

    const result = await generateAwarenessReport(MOCK_PAYLOAD, 'user123');
    expect(result.response).toContain('Market Awareness Position');
    expect(result.fromCache).toBe(false);
  });

  it('returns fromCache: true when callable returns cached result', async () => {
    const mockFn = vi.fn().mockResolvedValue({
      data: { response: '## Market Awareness Position\n- Cached', generatedAt: '2026-05-04T09:00:00Z', fromCache: true },
    });
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

    const result = await generateAwarenessReport(MOCK_PAYLOAD, 'user123');
    expect(result.fromCache).toBe(true);
  });

  it('throws insufficient-data when sampleSize is 0', async () => {
    const zeroPaylod = buildAwarenessReportPayload({ ...BASE_ARGS, sampleSize: 0 });
    await expect(generateAwarenessReport(zeroPaylod, 'user123')).rejects.toMatchObject({ code: 'insufficient-data' });
  });

  it('throws insufficient-data when all metric values are null', async () => {
    const nullPayload = buildAwarenessReportPayload({
      ...BASE_ARGS,
      topOfMind: null, spontaneous: null, totalAwareness: null,
      awarenessQuality: null, shareOfVoice: null, awarenessDepthScore: 0,
      awarenessShareIndex: 0, momGrowthPct: null,
    });
    // sampleSize > 0 but all nullable metrics are null
    await expect(generateAwarenessReport({ ...nullPayload, sampleSize: 10 }, 'user123')).rejects.toMatchObject({ code: 'insufficient-data' });
  });

  it('throws rate-limited on resource-exhausted error', async () => {
    const mockFn = vi.fn().mockRejectedValue(Object.assign(new Error('RESOURCE_EXHAUSTED'), { code: 'functions/resource-exhausted' }));
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

    await expect(generateAwarenessReport(MOCK_PAYLOAD, 'user123')).rejects.toMatchObject({ code: 'rate-limited' });
  });

  it('throws generation-failed on generic error', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('network error'));
    vi.mocked(httpsCallable).mockReturnValue(mockFn as any);

    await expect(generateAwarenessReport(MOCK_PAYLOAD, 'user123')).rejects.toMatchObject({ code: 'generation-failed' });
  });
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
npx vitest run src/test/awarenessReportService.test.ts 2>&1 | tail -15
```

Expected: new tests fail; original 8 still pass.

- [ ] **Step 3: Implement `generateAwarenessReport`**

Add after `buildAwarenessReportPayload` in `src/services/aiStrategyAdvisorService.ts`:

```ts
const makeTypedError = (code: AwarenessReportError, message: string): Error & { code: AwarenessReportError } => {
  const err = new Error(message) as Error & { code: AwarenessReportError };
  err.code = code;
  return err;
};

export async function generateAwarenessReport(
  payload: AwarenessReportPayload,
  userId: string,
): Promise<{ response: string; generatedAt: string; fromCache: boolean }> {
  const allMetricsNull = Object.values(payload.metrics).every((v) => v === null || v === 0);
  if (payload.sampleSize === 0 || (payload.sampleSize > 0 && allMetricsNull)) {
    throw makeTypedError('insufficient-data', 'No data available for this filter combination.');
  }

  const callable = httpsCallable<
    { payload: AwarenessReportPayload; userId: string },
    { response: string; generatedAt: string; fromCache: boolean }
  >(functions, 'aiStrategyAdvisor');

  try {
    const result = await callable({ payload, userId });
    const data = result.data;
    if (!data?.response) throw new Error('Empty response from AI.');
    return { response: data.response, generatedAt: data.generatedAt, fromCache: Boolean(data.fromCache) };
  } catch (error: unknown) {
    const code = getErrorCode(error);
    const message = getErrorMessage(error);
    if (code.includes('resource-exhausted') || message.includes('RESOURCE_EXHAUSTED') || message.includes('(429)')) {
      throw makeTypedError('rate-limited', 'Monthly limit reached.');
    }
    if (code.includes('permission-denied') || code.includes('unauthenticated')) {
      throw makeTypedError('generation-failed', 'Access denied.');
    }
    throw makeTypedError('generation-failed', message || 'Generation failed.');
  }
}
```

- [ ] **Step 4: Run all service tests**

```bash
npx vitest run src/test/awarenessReportService.test.ts 2>&1 | tail -15
```

Expected: all tests pass (8 + 6 = 14 total).

- [ ] **Step 5: Commit**

```bash
git add src/services/aiStrategyAdvisorService.ts src/test/awarenessReportService.test.ts
git commit -m "feat: add generateAwarenessReport with typed error codes"
```

---

## Task 4: Extend `aiStrategyAdvisor` callable with awareness branch

All server-side: access control check (country entitlement), server-side hash, Firestore cache read/write, Gemini call with awareness prompt.

**File:** `functions/index.js`

`crypto` is already imported as `require('node:crypto')` at line 6. `admin`, `HttpsError`, `GEMINI_API_KEY`, `DEFAULT_GEMINI_MODELS`, `normalizeWhitespace`, `toWordLimitedText`, `parseGeminiText` are all available.

- [ ] **Step 1: Add awareness helper functions before `exports.aiStrategyAdvisor`**

Add the following block immediately before the line `exports.aiStrategyAdvisor = onCall(` (currently at line 2720):

```js
// ---------------------------------------------------------------------------
// Awareness Insight Report helpers
// ---------------------------------------------------------------------------

const AWARENESS_REQUIRED_SECTIONS = [
  'Market Awareness Position',
  'Awareness Funnel',
  'Competitive Landscape',
  'Future Consideration',
  'Strategic Implications',
];

const buildAwarenessSystemPrompt = () =>
  'You are a brand analytics advisor for a bank executive. ' +
  'Analyze only the awareness metrics provided below. ' +
  'Do not introduce data not listed in this snapshot. ' +
  'If a metric value is null or listed as unavailable, say so explicitly — do not substitute estimates. ' +
  'Use ## headings for each of the 5 required sections. Use bullet points. Maximum 600 words.';

const buildAwarenessUserPrompt = (payload) => {
  const m = payload.metrics || {};
  const f = payload.funnel || {};
  const lines = [
    `Country: ${payload.country}`,
    `Period: ${payload.period}`,
    `Bank: ${payload.bankName} (${payload.bankId})`,
    payload.compareBankName ? `Compare bank: ${payload.compareBankName}` : null,
    `Sample size: n=${payload.sampleSize}`,
    payload.sampleSize > 0 && payload.sampleSize < 30
      ? `NOTE: Limited sample (n=${payload.sampleSize}). Treat all findings as indicative only.`
      : null,
    '',
    '## Awareness Metrics',
    `Top of Mind: ${m.topOfMind !== null && m.topOfMind !== undefined ? m.topOfMind + '%' : 'unavailable'}`,
    `Spontaneous Recall: ${m.spontaneous !== null && m.spontaneous !== undefined ? m.spontaneous + '%' : 'unavailable'}`,
    `Total Awareness: ${m.totalAwareness !== null && m.totalAwareness !== undefined ? m.totalAwareness + '%' : 'unavailable'}`,
    `Awareness Quality: ${m.awarenessQuality !== null && m.awarenessQuality !== undefined ? m.awarenessQuality + '%' : 'unavailable'}`,
    `Share of Voice: ${m.shareOfVoice !== null && m.shareOfVoice !== undefined ? m.shareOfVoice + '%' : 'unavailable'}`,
    `Awareness Depth Score: ${m.awarenessDepthScore !== null && m.awarenessDepthScore !== undefined ? m.awarenessDepthScore + '/100' : 'unavailable'}`,
    `Awareness Share Index: ${m.awarenessShareIndex !== null && m.awarenessShareIndex !== undefined ? m.awarenessShareIndex + '%' : 'unavailable'}`,
    `MoM Growth: ${m.momGrowthPct !== null && m.momGrowthPct !== undefined ? m.momGrowthPct + '%' : 'unavailable'}`,
    '',
    '## Awareness Funnel',
    `Aware: ${f.aware !== null && f.aware !== undefined ? f.aware + '%' : 'unavailable'}`,
    `Spontaneous: ${f.spontaneous !== null && f.spontaneous !== undefined ? f.spontaneous + '%' : 'unavailable'}`,
    `Top of Mind: ${f.topOfMind !== null && f.topOfMind !== undefined ? f.topOfMind + '%' : 'unavailable'}`,
    `Aided: ${f.aided !== null && f.aided !== undefined ? f.aided + '%' : 'unavailable'}`,
  ].filter((l) => l !== null);

  if (payload.intent) {
    const i = payload.intent;
    lines.push('', '## Future Intent');
    lines.push(`Average Intent: ${i.averageIntent !== null ? i.averageIntent.toFixed(1) + '/10' : 'unavailable'}`);
    lines.push(`High Intent (7-10): ${i.highIntentPct !== null ? Math.round(i.highIntentPct * 100) + '%' : 'unavailable'}`);
    lines.push(`High Intent Non-Users: ${i.highIntentNonUserPct !== null ? Math.round(i.highIntentNonUserPct * 100) + '%' : 'unavailable'}`);
    lines.push(`At-Risk Current Users: ${i.lowIntentCurrentUserCount !== null ? i.lowIntentCurrentUserCount : 'unavailable'}`);
    lines.push(`Response base: ${i.responseBase}`);
  }

  if (Array.isArray(payload.rankings) && payload.rankings.length > 0) {
    lines.push('', '## Brand Rankings');
    payload.rankings.forEach((row) => {
      lines.push(`Rank ${row.rank}: ${row.bankName} — Awareness ${row.awareness}%, Top-of-Mind ${row.topOfMind}%`);
    });
  }

  if (payload.compareMetrics) {
    lines.push('', '## Compare Bank Metrics');
    const cm = payload.compareMetrics;
    lines.push(`Top of Mind: ${cm.topOfMind !== null ? cm.topOfMind + '%' : 'unavailable'}`);
    lines.push(`Total Awareness: ${cm.awareness !== null ? cm.awareness + '%' : 'unavailable'}`);
  }

  lines.push(
    '',
    'Respond with only the 5 required sections in this order:',
    '1. ## Market Awareness Position',
    '2. ## Awareness Funnel',
    '3. ## Competitive Landscape',
    '4. ## Future Consideration',
    '5. ## Strategic Implications',
    '',
    'Use ## headings and bullet points. Do not invent or estimate data not provided above.',
  );

  return lines.join('\n');
};

const ensureAwarenessSections = (raw) => {
  const normalized = normalizeWhitespace(raw);
  const lower = normalized.toLowerCase();
  const hasAll = AWARENESS_REQUIRED_SECTIONS.every((s) => lower.includes(s.toLowerCase()));
  if (hasAll) return toWordLimitedText(normalized, 600);
  return AWARENESS_REQUIRED_SECTIONS.map((s) =>
    `## ${s}\nNot enough signal in this snapshot to provide a confident analysis.`
  ).join('\n\n');
};

const computeAwarenessCacheHash = (fields) =>
  crypto.createHash('sha256').update(JSON.stringify(fields)).digest('hex').slice(0, 32);

const callGeminiWithText = async ({ apiKey, model, promptText, systemPrompt }) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const response = await fetch(`${url}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1800 },
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Gemini request failed (${response.status}): ${body || 'Unknown error'}`);
    error.statusCode = response.status;
    throw error;
  }
  const result = await response.json();
  const text = parseGeminiText(result);
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
};

const handleAwarenessInsightReport = async (payload, request) => {
  const uid = request.auth.uid;
  const role = request.auth.token?.role;

  // Access control: subscribers must have country entitlement
  if (role !== 'admin') {
    const userSnap = await admin.firestore().doc(`users/${uid}`).get();
    const userData = userSnap.data() || {};
    const assignedCountries = Array.isArray(userData.assignedCountries) ? userData.assignedCountries : [];
    if (!assignedCountries.includes(String(payload.country || '').toLowerCase())) {
      throw new HttpsError('permission-denied', 'You do not have access to this country context.');
    }
  }

  // Validate minimal required fields
  const country = String(payload.country || '').toLowerCase();
  const bankId = String(payload.bankId || '');
  if (!country || !bankId) {
    throw new HttpsError('invalid-argument', 'country and bankId are required.');
  }
  if (typeof payload.sampleSize !== 'number' || payload.sampleSize === 0) {
    throw new HttpsError('invalid-argument', 'insufficient-data: sampleSize must be > 0.');
  }

  // Compute server-side cache key
  const methodologyVersion = String(payload.methodologyVersion || '1.0');
  const compareBankId = String(payload.compareBankId || '');
  const filtersHash = crypto.createHash('sha256')
    .update(JSON.stringify(payload.filters || {}))
    .digest('hex')
    .slice(0, 16);
  const cacheKeyHash = computeAwarenessCacheHash({
    reportType: 'awareness_consideration',
    userId: uid,
    country,
    bankId,
    compareBankId,
    methodologyVersion,
    filtersHash,
  });

  // Check Firestore cache
  const cacheRef = admin.firestore().doc(`aiInsightReports/${cacheKeyHash}`);
  const cacheSnap = await cacheRef.get();
  if (cacheSnap.exists()) {
    const cached = cacheSnap.data();
    if (cached.expiresAt && cached.expiresAt.toMillis() > Date.now()) {
      return {
        response: cached.response,
        generatedAt: cached.generatedAt.toDate().toISOString(),
        fromCache: true,
      };
    }
  }

  // Generate
  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) throw new HttpsError('failed-precondition', 'GEMINI_API_KEY secret is not configured.');

  const systemPrompt = buildAwarenessSystemPrompt();
  const promptText = buildAwarenessUserPrompt(payload);

  let rawText = '';
  let lastError = null;
  for (const model of DEFAULT_GEMINI_MODELS) {
    try {
      rawText = await callGeminiWithText({ apiKey, model, promptText, systemPrompt });
      break;
    } catch (err) {
      const msg = String(err?.message || err);
      if (msg.includes('(404)') || msg.includes('NOT_FOUND') || msg.includes('not supported')) {
        lastError = err;
        continue;
      }
      if (msg.includes('(429)') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new HttpsError('resource-exhausted', msg);
      }
      throw new HttpsError('internal', msg);
    }
  }
  if (!rawText) throw new HttpsError('internal', String(lastError?.message || 'No Gemini model available.'));

  const finalResponse = ensureAwarenessSections(rawText);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32);

  await cacheRef.set({
    reportType: 'awareness_consideration',
    userId: uid,
    country,
    bankId,
    compareBankId: compareBankId || null,
    methodologyVersion,
    filtersHash,
    payloadHash,
    generatedAt: admin.firestore.Timestamp.fromDate(now),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    response: finalResponse,
  });

  return { response: finalResponse, generatedAt: now.toISOString(), fromCache: false };
};
```

- [ ] **Step 2: Add awareness branch at the top of the `aiStrategyAdvisor` callable body**

In `functions/index.js`, inside `exports.aiStrategyAdvisor = onCall({...}, async (request) => {`, after the `!request.auth` check and the `payload` extraction (around line 2733), add before the `const requiredKeys` line:

```js
  // Awareness Insight Report branch — handled separately from strategy advisor
  if (payload.reportType === 'awareness_consideration') {
    return handleAwarenessInsightReport(payload, request);
  }
```

- [ ] **Step 3: Verify `functions/index.js` syntax**

```bash
node --check functions/index.js 2>&1
```

Expected: no output (syntax OK). If there are errors, fix them before continuing.

- [ ] **Step 4: Commit**

```bash
git add functions/index.js
git commit -m "feat: add awareness insight report branch to aiStrategyAdvisor callable"
```

---

## Task 5: Create `AwarenessInsightsReport` — idle, loading, generated states

**Files:**
- Create: `src/components/analytics/AwarenessInsightsReport.tsx`
- Create: `src/components/analytics/AwarenessInsightsReport.test.tsx`

- [ ] **Step 1: Write failing tests for idle, loading, and generated states**

Create `src/components/analytics/AwarenessInsightsReport.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/auth/context', () => ({
  useAuth: () => ({ state: { user: { uid: 'user123' } } }),
}));

vi.mock('@/services/aiStrategyAdvisorService', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/services/aiStrategyAdvisorService')>();
  return {
    ...mod,
    generateAwarenessReport: vi.fn(),
  };
});

import { generateAwarenessReport } from '@/services/aiStrategyAdvisorService';
import { AwarenessInsightsReport } from './AwarenessInsightsReport';
import type { AwarenessReportPayload } from '@/services/aiStrategyAdvisorService';

const MOCK_PAYLOAD: AwarenessReportPayload = {
  reportType: 'awareness_consideration',
  methodologyVersion: '1.0',
  country: 'rwanda',
  period: 'All data',
  bankId: 'BK_RW',
  bankName: 'Bank of Kigali',
  compareBankId: null,
  compareBankName: null,
  filters: {},
  sampleSize: 50,
  metrics: {
    topOfMind: 35, spontaneous: 45, totalAwareness: 80, awarenessQuality: 43,
    shareOfVoice: 28, awarenessDepthScore: 55, awarenessShareIndex: 32, momGrowthPct: 2.5,
  },
  funnel: { aware: 80, spontaneous: 45, topOfMind: 35, aided: 20 },
  intent: null,
  rankings: [{ bankName: 'Bank of Kigali', awareness: 80, topOfMind: 35, rank: 1 }],
  compareMetrics: null,
};

const MOCK_RESPONSE = '## Market Awareness Position\n- Strong ToM\n## Awareness Funnel\n- Wide\n## Competitive Landscape\n- Leader\n## Future Consideration\n- High intent\n## Strategic Implications\n- Defend position';

describe('AwarenessInsightsReport — idle state', () => {
  it('shows Generate Insights button and no report body', () => {
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    expect(screen.getByRole('button', { name: /generate insights/i })).toBeInTheDocument();
    expect(screen.queryByText(/market awareness position/i)).not.toBeInTheDocument();
  });
});

describe('AwarenessInsightsReport — loading state', () => {
  it('disables button and shows generating text while loading', async () => {
    vi.mocked(generateAwarenessReport).mockImplementation(() => new Promise(() => {}));
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });
});

describe('AwarenessInsightsReport — generated state', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows all 5 required section headings after generation', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE,
      generatedAt: '2026-05-04T10:00:00Z',
      fromCache: false,
    });
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText('Market Awareness Position')).toBeInTheDocument());
    expect(screen.getByText('Awareness Funnel')).toBeInTheDocument();
    expect(screen.getByText('Competitive Landscape')).toBeInTheDocument();
    expect(screen.getByText('Future Consideration')).toBeInTheDocument();
    expect(screen.getByText('Strategic Implications')).toBeInTheDocument();
  });

  it('shows Refresh Insights button after generation', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE, generatedAt: '2026-05-04T10:00:00Z', fromCache: false,
    });
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /refresh insights/i })).toBeInTheDocument());
  });

  it('shows generated timestamp and bank name', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE, generatedAt: '2026-05-04T10:00:00Z', fromCache: false,
    });
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/bank of kigali/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run to confirm failures**

```bash
npx vitest run src/components/analytics/AwarenessInsightsReport.test.tsx 2>&1 | tail -15
```

Expected: all tests fail with "Cannot find module './AwarenessInsightsReport'".

- [ ] **Step 3: Create the component**

Create `src/components/analytics/AwarenessInsightsReport.tsx`:

```tsx
import React, { useCallback, useState } from 'react';
import { useAuth } from '@/auth/context';
import {
  generateAwarenessReport,
  type AwarenessReportError,
  type AwarenessReportPayload,
} from '@/services/aiStrategyAdvisorService';

type ReportState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'generated'; response: string; generatedAt: string; fromCache: boolean; contextHash: string }
  | { status: 'error'; code: AwarenessReportError };

function computeContextHash(payload: AwarenessReportPayload): string {
  const fields = {
    country: payload.country,
    bankId: payload.bankId,
    compareBankId: payload.compareBankId ?? null,
    period: payload.period,
    filtersKey: JSON.stringify(payload.filters),
    methodologyVersion: payload.methodologyVersion,
  };
  const sorted = JSON.stringify(Object.fromEntries(Object.entries(fields).sort(([a], [b]) => a.localeCompare(b))));
  let h = 5381;
  for (let i = 0; i < sorted.length; i++) { h = (h * 33) ^ sorted.charCodeAt(i); }
  return Math.abs(h >>> 0).toString(36);
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let currentList: string[] = [];
  let idx = 0;

  const flushList = () => {
    if (currentList.length === 0) return;
    nodes.push(
      <ul key={`ul-${idx++}`} className="mt-1 list-disc space-y-1 pl-4">
        {currentList.map((item, i) => <li key={i} className="text-xs text-slate-400">{item}</li>)}
      </ul>,
    );
    currentList = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }
    if (trimmed.startsWith('## ')) {
      flushList();
      nodes.push(<h3 key={`h3-${idx++}`} className="mt-4 text-sm font-semibold text-slate-200 first:mt-0">{trimmed.slice(3)}</h3>);
    } else if (trimmed.startsWith('- ')) {
      currentList.push(trimmed.slice(2));
    } else {
      flushList();
      nodes.push(<p key={`p-${idx++}`} className="mt-1 text-xs text-slate-400">{trimmed}</p>);
    }
  }
  flushList();
  return nodes;
}

interface AwarenessInsightsReportProps {
  awarenessPayload: AwarenessReportPayload;
}

export function AwarenessInsightsReport({ awarenessPayload }: AwarenessInsightsReportProps) {
  const { state: authState } = useAuth();
  const userId = (authState as { user?: { uid?: string } }).user?.uid ?? '';
  const [reportState, setReportState] = useState<ReportState>({ status: 'idle' });
  const [isExpanded, setIsExpanded] = useState(false);

  const currentHash = computeContextHash(awarenessPayload);
  const isStale = reportState.status === 'generated' && reportState.contextHash !== currentHash;
  const isLoading = reportState.status === 'loading';

  const generate = useCallback(async () => {
    setReportState({ status: 'loading' });
    try {
      const result = await generateAwarenessReport(awarenessPayload, userId);
      setReportState({ status: 'generated', response: result.response, generatedAt: result.generatedAt, fromCache: result.fromCache, contextHash: currentHash });
      setIsExpanded(true);
    } catch (err: unknown) {
      const code = ((err as { code?: string }).code ?? 'generation-failed') as AwarenessReportError;
      setReportState({ status: 'error', code });
      setIsExpanded(true);
    }
  }, [awarenessPayload, userId, currentHash]);

  const buttonLabel = isLoading ? 'Generating…' : reportState.status === 'idle' ? 'Generate Insights' : 'Refresh Insights';

  return (
    <div className="mt-6 dashboard-section">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Awareness Insights Report</h3>
        <button
          type="button"
          disabled={isLoading}
          onClick={generate}
          className="rounded px-3 py-1 text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      </div>

      {isExpanded && reportState.status !== 'idle' && (
        <div className="mt-4">
          {isStale && (
            <div className="mb-3 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              Context changed — refresh for updated analysis.
            </div>
          )}

          {reportState.status === 'loading' && (
            <div className="flex items-center gap-2 text-xs text-slate-400" aria-live="polite">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              Generating analysis…
            </div>
          )}

          {reportState.status === 'generated' && (
            <>
              <div className="mb-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
                <span>Generated: {new Date(reportState.generatedAt).toLocaleString()}</span>
                <span>·</span>
                <span>{awarenessPayload.country}</span>
                <span>·</span>
                <span>{awarenessPayload.bankName}</span>
                {awarenessPayload.compareBankName && <><span>·</span><span>vs {awarenessPayload.compareBankName}</span></>}
                <span>·</span>
                <span>{awarenessPayload.period}</span>
                {reportState.fromCache && <span>(cached)</span>}
              </div>
              <p className="mb-3 text-[10px] text-slate-600">
                Based on survey response data. Treat as directional for small samples.
              </p>
              <div>{parseMarkdown(reportState.response)}</div>
            </>
          )}

          {reportState.status === 'error' && (
            <div className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              {reportState.code === 'rate-limited'
                ? 'Monthly insight limit reached. Please try again after your allowance resets.'
                : reportState.code === 'insufficient-data'
                  ? 'Not enough data to generate a report for this filter combination.'
                  : 'Report generation failed.'}
              {(reportState.code === 'generation-failed') && (
                <button type="button" onClick={generate} className="ml-2 underline hover:no-underline">
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/components/analytics/AwarenessInsightsReport.test.tsx 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/AwarenessInsightsReport.tsx src/components/analytics/AwarenessInsightsReport.test.tsx
git commit -m "feat: add AwarenessInsightsReport component with idle/loading/generated states"
```

---

## Task 6: Add stale + error states tests and verify coverage

**Files:**
- Modify: `src/components/analytics/AwarenessInsightsReport.test.tsx`

- [ ] **Step 1: Write stale and error state tests**

Add to `src/components/analytics/AwarenessInsightsReport.test.tsx`:

```tsx
describe('AwarenessInsightsReport — stale state', () => {
  it('shows stale banner when payload context changes after generation', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE, generatedAt: '2026-05-04T10:00:00Z', fromCache: false,
    });
    const { rerender } = render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText('Market Awareness Position')).toBeInTheDocument());

    // Change context (different bankId)
    const changedPayload = { ...MOCK_PAYLOAD, bankId: 'EQ_RW', bankName: 'Equity Bank' };
    rerender(<AwarenessInsightsReport awarenessPayload={changedPayload} />);
    expect(screen.getByText(/context changed/i)).toBeInTheDocument();
  });
});

describe('AwarenessInsightsReport — error states', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows rate-limited message with no retry button', async () => {
    vi.mocked(generateAwarenessReport).mockRejectedValue(
      Object.assign(new Error('limit'), { code: 'rate-limited' }),
    );
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/monthly insight limit/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows insufficient-data message with no retry button', async () => {
    vi.mocked(generateAwarenessReport).mockRejectedValue(
      Object.assign(new Error('no data'), { code: 'insufficient-data' }),
    );
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/not enough data/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows generation-failed message with retry button', async () => {
    vi.mocked(generateAwarenessReport).mockRejectedValue(
      Object.assign(new Error('fail'), { code: 'generation-failed' }),
    );
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/report generation failed/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run all component tests**

```bash
npx vitest run src/components/analytics/AwarenessInsightsReport.test.tsx 2>&1 | tail -20
```

Expected: all tests pass (Task 5 tests + new stale/error tests).

- [ ] **Step 3: Commit**

```bash
git add src/components/analytics/AwarenessInsightsReport.test.tsx
git commit -m "test: add stale and error state coverage for AwarenessInsightsReport"
```

---

## Task 7: Wire `AwarenessInsightsReport` into `SubscriberDashboardPage.tsx`

**File:** `src/pages/SubscriberDashboardPage.tsx`

The component goes after the MiniBar distribution section inside `<TabsContent value="awareness_consideration">`, after the closing `</div>` of the Future Intent section (around line 2598).

- [ ] **Step 1: Add imports**

Near the top of `SubscriberDashboardPage.tsx` where other analytics components are imported (search for `CustomerSwitchingRadar` as a reference point), add:

```ts
import { AwarenessInsightsReport } from '@/components/analytics/AwarenessInsightsReport';
import { buildAwarenessReportPayload } from '@/services/aiStrategyAdvisorService';
```

- [ ] **Step 2: Add `awarenessPayload` useMemo**

After the `awarenessDepthScore` / `compareAwarenessDepthScore` memos (around line 1477), add:

```ts
  const awarenessPayload = useMemo(() => buildAwarenessReportPayload({
    country: activeCountry ?? '',
    period: periodLabel,
    bankId: selectedBankId,
    bankName: selectedBankName,
    compareBankId: compareBankId || null,
    compareBankName: compareBankName || null,
    filters: {
      selected_brand: selectedBankId,
      compare_brand: compareBankId || null,
      time_window: timeWindow,
    } as Record<string, unknown>,
    sampleSize,
    topOfMind: awarenessTopMetrics.topOfMind.value,
    spontaneous: awarenessTopMetrics.spontaneous.value,
    totalAwareness: awarenessTopMetrics.awareness.value,
    awarenessQuality: awarenessTopMetrics.quality.value,
    shareOfVoice: selectedAwarenessRow?.shareOfVoice ?? null,
    awarenessDepthScore,
    awarenessShareIndex,
    momGrowthPct: awarenessMoMGrowthPct,
    funnelAware: selectedMetricsView?.aware ?? null,
    funnelSpontaneous: selectedMetricsView?.spontaneous ?? null,
    funnelTopOfMind: selectedMetricsView?.topOfMind ?? null,
    funnelAided: selectedMetricsView?.aided ?? null,
    intent: intentSummary,
    rankings: awarenessRankRows.map((r) => ({
      bankName: r.bankName,
      awareness: r.awareness,
      topOfMind: r.topOfMind,
      rank: r.rank,
    })),
    compareTopOfMind: compareAwarenessRow?.topOfMind ?? null,
    compareAwareness: compareAwarenessRow?.awareness ?? null,
  }), [
    activeCountry, periodLabel, selectedBankId, selectedBankName, compareBankId, compareBankName,
    timeWindow, sampleSize, awarenessTopMetrics, selectedAwarenessRow, awarenessDepthScore,
    awarenessShareIndex, awarenessMoMGrowthPct, selectedMetricsView, intentSummary,
    awarenessRankRows, compareAwarenessRow,
  ]);
```

- [ ] **Step 3: Add `<AwarenessInsightsReport>` to JSX**

In the `<TabsContent value="awareness_consideration">` block, after the closing `</div>` of the `Future Intent & Consideration` section (after the MiniBar distribution row, around line 2598), add:

```tsx
              <AwarenessInsightsReport awarenessPayload={awarenessPayload} />
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors. Fix any type errors before continuing.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass (pre-existing multiBank failure is acceptable).

- [ ] **Step 6: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: wire AwarenessInsightsReport into Awareness & Consideration tab"
```

---

## Self-Review Checklist

Run after all tasks complete:

- [ ] `npx vitest run 2>&1 | tail -5` — confirm test suite passes
- [ ] `npx tsc --noEmit 2>&1` — confirm no type errors
- [ ] `node --check functions/index.js` — confirm callable syntax clean
- [ ] Verify awareness cards still show MetricInfoIcon popovers (Task 1 check)
- [ ] Verify `AwarenessInsightsReport` renders in idle state on Awareness tab
- [ ] Verify Generate Insights button triggers loading state
- [ ] Verify report expands and shows 5 section headings after generation
- [ ] Verify Refresh Insights button appears after generation
