# Awareness Dashboard Brand Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Awareness & Consideration dashboard from a functional prototype into a premium analytics platform by applying BrandEdge brand colours, compacting KPI cards, switching analysis panels to light/readable surfaces, and refining the intelligence banner to a 3-column layout.

**Architecture:** Pure visual/CSS change — no logic, no type changes. Five files change: `index.css` (tokens + density), three analytics components (AwarenessIntelligenceBanner, SectionAnalysisBlock, MetricRowAnalysisDrawer), and SubscriberDashboardPage (CTA colour). All existing tests check text content and behaviour only — they pass unchanged after each task.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3.4 (JIT — arbitrary values `text-[#E10613]` work), Vitest + @testing-library/react

---

## Brand System Reference

| Token | Value | Use |
|-------|-------|-----|
| BrandEdge Red | `#E10613` | Intelligence tags, active CTAs, accent borders |
| Charcoal Black | `#1F2230` | Banner background, dark headings |
| Off White | `#F7F8FA` | Light surface cards, definition strips |
| Slate | `#667085` | Body text, supporting labels, muted info |
| Light Border | `#E4E7EC` | Card borders, dividers on light surfaces |
| Dark Surface | `#101828` | Stat mini-cards inside banner |

---

## File Map

| File | Change |
|------|--------|
| `src/index.css` | Add BrandEdge CSS vars; compact `kpi-card-primary`/`secondary` padding; tighten grid gap; compact `kpi-card-footer` padding |
| `src/components/analytics/AwarenessIntelligenceBanner.tsx` | 3-column layout (tag \| narrative \| stats); charcoal surface; red tag accent |
| `src/components/analytics/SectionAnalysisBlock.tsx` | Light surfaces; left red accent border; 2-column expanded grid; BrandEdge typography |
| `src/components/analytics/MetricRowAnalysisDrawer.tsx` | Light surfaces; full-width exec takeaway zone; 2-column section grid |
| `src/pages/SubscriberDashboardPage.tsx` | 8× CTA button: indigo → BrandEdge red; 8× snapshot text: slate-500 → slate-600 |

---

## Task 1: BrandEdge CSS Tokens + KPI Card Density

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Run baseline tests**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Expected: all tests pass (note the count for comparison after changes).

- [ ] **Step 2: Add BrandEdge vars to `:root`**

In `src/index.css`, inside the `:root` block, add the following lines immediately after `--accent-neutral: #7A8CA5;` (line ~92) and before the closing `}`:

```css
    /* BrandEdge brand system */
    --be-red: #E10613;
    --be-charcoal: #1F2230;
    --be-off-white: #F7F8FA;
    --be-slate: #667085;
    --be-border: #E4E7EC;
    --be-surface-dark: #101828;
```

- [ ] **Step 3: Compact `.kpi-card-primary` padding**

Find this block in `src/index.css`:
```css
  .kpi-card-primary {
    border-radius: var(--radius-lg);
    padding: 1.25rem;
    box-shadow: var(--shadow-2);
    background: #ffffff !important;
  }
```

Replace with:
```css
  .kpi-card-primary {
    border-radius: var(--radius-lg);
    padding: 0.875rem 1rem;
    box-shadow: var(--shadow-2);
    background: #ffffff !important;
  }
```

- [ ] **Step 4: Compact `.kpi-card-secondary` padding**

Find:
```css
  .kpi-card-secondary {
    border-radius: var(--radius-md);
    padding: 1.25rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: var(--shadow-1);
    background: #ffffff !important;
  }
```

Replace with:
```css
  .kpi-card-secondary {
    border-radius: var(--radius-md);
    padding: 0.875rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: var(--shadow-1);
    background: #ffffff !important;
  }
```

- [ ] **Step 5: Compact `.kpi-card-footer` padding + sharpen border**

Find:
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
```

Replace with:
```css
  .kpi-card-footer {
    background: #ffffff;
    border-left: 1px solid #E4E7EC;
    border-right: 1px solid #E4E7EC;
    border-bottom: 1px solid #E4E7EC;
    border-top: 1px solid #f1f5f9;
    border-bottom-left-radius: var(--radius-lg);
    border-bottom-right-radius: var(--radius-lg);
    padding: 0.625rem 1rem 0.75rem;
  }
```

- [ ] **Step 6: Tighten awareness grid gap**

Find:
```css
  .dashboard-tab-panel > .grid {
    gap: 1.25rem !important;
    align-items: stretch;
  }
```

Replace with:
```css
  .dashboard-tab-panel > .grid {
    gap: 1rem !important;
    align-items: stretch;
  }
```

- [ ] **Step 7: Verify tests still pass**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Expected: same pass count as Step 1. No TypeScript errors — CSS changes don't affect TS.

- [ ] **Step 8: Commit**

```bash
git add src/index.css
git commit -m "feat: add BrandEdge CSS tokens and compact KPI card density"
```

---

## Task 2: AwarenessIntelligenceBanner — 3-Column Premium Layout

**Files:**
- Modify: `src/components/analytics/AwarenessIntelligenceBanner.tsx`

The test file (`AwarenessIntelligenceBanner.test.tsx`) checks text content only — it passes unchanged after this layout change.

- [ ] **Step 1: Confirm existing tests pass**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/components/analytics/AwarenessIntelligenceBanner.test.tsx --reporter=verbose 2>&1
```
Expected: 7/7 pass.

- [ ] **Step 2: Replace component**

Overwrite `src/components/analytics/AwarenessIntelligenceBanner.tsx` with:

```tsx
import React from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface AwarenessIntelligenceBannerProps {
  moduleSummary: AwarenessInsightResult | null;
  totalAwareness: number | null;
  topOfMind: number | null;
  awarenessQuality: number | null;
  country: string;
  sampleSize: number;
}

function extractPattern(snapshot: string | undefined): string | null {
  if (!snapshot) return null;
  const match = snapshot.match(/^Awareness pattern:\s*([^.]+)/i);
  return match ? match[1].trim() : null;
}

function extractTakeaway(snapshot: string | undefined): string {
  if (!snapshot) return '';
  return snapshot.replace(/^Awareness pattern:\s*[^.]+\.\s*/i, '').trim();
}

function fmt(v: number | null): string {
  if (v === null || !isFinite(v)) return '—';
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

export const AwarenessIntelligenceBanner: React.FC<AwarenessIntelligenceBannerProps> = ({
  moduleSummary,
  totalAwareness,
  topOfMind,
  awarenessQuality,
  country,
  sampleSize,
}) => {
  const pattern = extractPattern(moduleSummary?.snapshot);
  const takeaway = extractTakeaway(moduleSummary?.snapshot);

  const metrics = [
    { label: 'Total Awareness', value: fmt(totalAwareness) },
    { label: 'Top of Mind', value: fmt(topOfMind) },
    { label: 'Quality Ratio', value: fmt(awarenessQuality) },
  ];

  return (
    <div className="rounded-2xl bg-[#1F2230] px-6 py-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* LEFT — strategic classification tag */}
        <div className="flex-shrink-0 lg:w-48">
          {pattern ? (
            <div className="mb-3 inline-block rounded border border-[#E10613]/30 bg-[#E10613]/10 px-2.5 py-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#E10613]">{pattern}</span>
            </div>
          ) : (
            <div className="mb-3 inline-block rounded border border-white/10 bg-white/5 px-2.5 py-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#667085]">INTELLIGENCE</span>
            </div>
          )}
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#667085]">
            {country} · N={sampleSize}
          </p>
        </div>

        {/* CENTER — executive narrative */}
        <div className="min-w-0 flex-1">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#667085]">
            <span className="text-[#E10613]" aria-hidden="true">◈</span>
            Awareness Intelligence
          </p>
          {takeaway ? (
            <p className="text-sm leading-relaxed text-[#F7F8FA]">{takeaway}</p>
          ) : (
            <p className="text-sm text-[#667085]">No intelligence data available.</p>
          )}
        </div>

        {/* RIGHT — compact stats column */}
        <div className="flex-shrink-0 lg:w-52">
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-2">
            {metrics.map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-[#101828] px-3 py-2.5">
                <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-widest text-[#667085]">{label}</p>
                <p className="text-xl font-black text-[#F7F8FA]">{value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
```

- [ ] **Step 3: Run tests — confirm still 7/7**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/components/analytics/AwarenessIntelligenceBanner.test.tsx --reporter=verbose 2>&1
```
Expected: 7/7 pass. All tests check text content (pattern, takeaway, metric values, country, sampleSize) which is unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/AwarenessIntelligenceBanner.tsx
git commit -m "feat: redesign AwarenessIntelligenceBanner to 3-column BrandEdge layout"
```

---

## Task 3: SectionAnalysisBlock — Light Surface + Red Accent Redesign

**Files:**
- Modify: `src/components/analytics/SectionAnalysisBlock.tsx`

The test file (`SectionAnalysisBlock.test.tsx`) checks button labels, heading text, and snapshot text — all unchanged. Tests pass without modification.

- [ ] **Step 1: Confirm existing tests pass**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/components/analytics/SectionAnalysisBlock.test.tsx --reporter=verbose 2>&1
```
Expected: 9/9 pass.

- [ ] **Step 2: Replace component**

Overwrite `src/components/analytics/SectionAnalysisBlock.tsx` with:

```tsx
import React, { useState } from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface SectionAnalysisBlockProps {
  title: string;
  insight: AwarenessInsightResult | null;
}

function parseSection(para: string): { heading: string | null; body: string } {
  const colonIdx = para.indexOf(':');
  if (colonIdx > 0) {
    const maybeHeading = para.slice(0, colonIdx);
    if (/^[A-Z][A-Z\s&/]+$/.test(maybeHeading)) {
      return { heading: maybeHeading, body: para.slice(colonIdx + 1).trim() };
    }
  }
  return { heading: null, body: para };
}

export const SectionAnalysisBlock: React.FC<SectionAnalysisBlockProps> = ({
  title,
  insight,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!insight) return null;

  const sections = insight.detail.split('\n\n').filter(Boolean).map(parseSection);

  return (
    <div
      className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm"
      style={{ border: '1px solid #E4E7EC', borderLeft: '3px solid #E10613' }}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#1F2230]">
              <span className="text-[#E10613]" aria-hidden="true">◈</span>
              {title}
            </p>
            <p className="text-sm leading-relaxed text-[#667085]">{insight.snapshot}</p>
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[#E10613] transition-colors hover:text-[#B5040F]"
          >
            {expanded ? 'COLLAPSE ANALYSIS ▲' : 'VIEW DETAILED ANALYSIS ▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5" style={{ borderTop: '1px solid #E4E7EC' }}>
          <div className="grid gap-3 sm:grid-cols-2 items-start">
            {sections.map((sec, idx) => (
              <div
                key={sec.heading ?? idx}
                className="rounded-lg bg-[#F7F8FA] p-4 self-start"
                style={{ border: '1px solid #E4E7EC' }}
              >
                {sec.heading && (
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#1F2230]">
                    {sec.heading}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-[#667085] max-w-prose">{sec.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Run tests — confirm still 9/9**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/components/analytics/SectionAnalysisBlock.test.tsx --reporter=verbose 2>&1
```
Expected: 9/9 pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/SectionAnalysisBlock.tsx
git commit -m "feat: redesign SectionAnalysisBlock with light surfaces and red accent border"
```

---

## Task 4: MetricRowAnalysisDrawer — Light Surface + Full-Width Exec Takeaway

**Files:**
- Modify: `src/components/analytics/MetricRowAnalysisDrawer.tsx`

No test file exists for this component. Validate via full test suite + TypeScript check.

- [ ] **Step 1: Run full test suite baseline**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -8
```
Expected: all tests pass.

- [ ] **Step 2: Replace component**

Overwrite `src/components/analytics/MetricRowAnalysisDrawer.tsx` with:

```tsx
import React from 'react';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

interface MetricRowAnalysisDrawerProps {
  insight: AwarenessInsightResult;
  title: string;
  definition?: string;
  onClose: () => void;
}

function parseSection(para: string): { heading: string | null; body: string } {
  const colonIdx = para.indexOf(':');
  if (colonIdx > 0) {
    const maybeHeading = para.slice(0, colonIdx);
    if (/^[A-Z][A-Z\s&/]+$/.test(maybeHeading)) {
      return { heading: maybeHeading, body: para.slice(colonIdx + 1).trim() };
    }
  }
  return { heading: null, body: para };
}

export const MetricRowAnalysisDrawer: React.FC<MetricRowAnalysisDrawerProps> = ({
  insight,
  title,
  definition,
  onClose,
}) => {
  const sections = insight.detail.split('\n\n').filter(Boolean).map(parseSection);

  return (
    <div className="rounded-xl bg-white shadow-lg" style={{ border: '1px solid #E4E7EC' }}>

      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4" style={{ borderBottom: '1px solid #E4E7EC' }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">
            Detailed Analysis
          </p>
          <h4 className="text-sm font-bold text-[#1F2230]">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-[#667085] transition-colors hover:bg-[#F7F8FA] hover:text-[#1F2230]"
          aria-label="Close analysis"
        >
          ✕
        </button>
      </div>

      {/* Metric definition strip */}
      {definition && (
        <div className="bg-[#F7F8FA] px-6 py-2.5" style={{ borderBottom: '1px solid #E4E7EC' }}>
          <p className="text-[11px] text-[#667085]">
            <span className="font-semibold uppercase tracking-wider text-[#1F2230]">
              What this measures:{' '}
            </span>
            {definition}
          </p>
        </div>
      )}

      {/* Executive Takeaway — full width */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #E4E7EC' }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#667085]">
          Executive Takeaway
        </p>
        <p className="max-w-2xl text-sm font-medium leading-relaxed text-[#1F2230]">{insight.snapshot}</p>
      </div>

      {/* 2-column section grid — items-start prevents equal-height stretching */}
      <div className="p-6">
        <div className="grid gap-3 sm:grid-cols-2 items-start">
          {sections.map((sec, idx) => (
            <div
              key={sec.heading ?? idx}
              className="rounded-lg bg-[#F7F8FA] p-4 self-start"
              style={{ border: '1px solid #E4E7EC' }}
            >
              {sec.heading && (
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#1F2230]">
                  {sec.heading}
                </p>
              )}
              <p className="text-xs leading-relaxed text-[#667085] max-w-prose">{sec.body}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
```

- [ ] **Step 3: TypeScript check**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --noEmit 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Step 4: Run full test suite**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -8
```
Expected: same pass count as Step 1.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/MetricRowAnalysisDrawer.tsx
git commit -m "feat: redesign MetricRowAnalysisDrawer with light surface and full-width exec takeaway"
```

---

## Task 5: SubscriberDashboardPage — BrandEdge Red CTAs + Snapshot Contrast

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx`

Eight `kpi-card-footer` blocks exist (topOfMind, spontaneous, totalAwareness, awarenessQuality, shareOfVoice, momGrowth, awarenessShareIndex, awarenessDepthScore). Each has a snapshot `<p>` and a CTA `<button>`. Two targeted replacements cover all eight instances.

- [ ] **Step 1: Run tests baseline**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Note pass count.

- [ ] **Step 2: Update all 8 snapshot paragraph classes**

In `src/pages/SubscriberDashboardPage.tsx`, use replace-all to change:

Find (exact string):
```
"text-[11px] leading-snug text-slate-500"
```

Replace with:
```
"text-[11px] leading-snug text-slate-600"
```

This is used in the 8 `kpi-card-footer` snapshot paragraphs. Confirm no other context uses this exact class string before applying.

- [ ] **Step 3: Update all 8 CTA button classes (active state)**

In `src/pages/SubscriberDashboardPage.tsx`, replace-all:

Find (exact string):
```
text-indigo-600 hover:text-indigo-800 transition-colors
```

Replace with:
```
text-[#E10613] hover:text-[#B5040F] transition-colors
```

This matches all 8 CTA buttons in the awareness footer blocks.

- [ ] **Step 4: Run tests**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Expected: same pass count as Step 1. No failures — class changes don't affect behaviour tests.

- [ ] **Step 5: TypeScript check**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --noEmit 2>&1 | head -10
```
Expected: 0 errors (string literal class changes are safe).

- [ ] **Step 6: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: apply BrandEdge red to awareness CTA buttons and improve snapshot contrast"
```

---

## Task 6: Final Validation + Screenshots

**Files:** No code changes — validation only.

- [ ] **Step 1: Full test suite**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1
```
Expected: all tests that were passing before still pass. 0 regressions.

- [ ] **Step 2: TypeScript check**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --noEmit 2>&1
```
Expected: 0 errors.

- [ ] **Step 3: Start dev server**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vite --port 5174 &
sleep 4
```

- [ ] **Step 4: Take desktop screenshot — awareness tab collapsed**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: 'awareness-v5-collapsed-desktop.png', fullPage: false });
  await browser.close();
})();
"
```

- [ ] **Step 5: Take mobile screenshot**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle0', timeout: 30000 });
  await page.screenshot({ path: 'awareness-v5-mobile.png', fullPage: false });
  await browser.close();
})();
"
```

- [ ] **Step 6: Kill dev server**

```bash
kill $(lsof -t -i:5174) 2>/dev/null || true
```

- [ ] **Step 7: Commit screenshots**

```bash
git add awareness-v5-collapsed-desktop.png awareness-v5-mobile.png
git commit -m "chore: add v5 brand visual redesign screenshots"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Brand tokens: `--be-red`, `--be-charcoal` etc. added to `:root` (Task 1)
- ✅ KPI card density: padding reduced from 1.25rem to 0.875rem/1rem (Task 1)
- ✅ Grid gap: 1.25rem → 1rem (Task 1)
- ✅ Intelligence banner: 3-column charcoal layout, red tag (Task 2)
- ✅ Analysis panels light surface: SectionAnalysisBlock → white bg, #E4E7EC border (Task 3)
- ✅ Left accent border on section blocks (Task 3)
- ✅ 2-column grid in section analysis (Task 3, step 2 — `sm:grid-cols-2`)
- ✅ MetricRowAnalysisDrawer light surface + full-width exec takeaway (Task 4)
- ✅ Typography contrast: headings `text-[#1F2230]`, body `text-[#667085]` (Tasks 2–4)
- ✅ CTA buttons: BrandEdge red (Task 5)
- ✅ Snapshot text: slate-500 → slate-600 (Task 5)
- ✅ Mobile: banner stacks to column on mobile, grids collapse to 1 col below `sm:` (responsive grid)
- ✅ No logic/formula/test-behaviour changes anywhere
- ✅ Experimental AI section untouched

**Placeholder scan:** None found. All steps contain actual code.

**Type consistency:** Props interfaces unchanged. `AwarenessInsightResult` import unchanged in all 3 components.
