# Awareness Tab V4 — Full Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Awareness & Consideration tab into a premium analytical dashboard — intelligence banner at top, flush card footers, two-zone analysis drawer, and richer section analysis blocks — without touching any formula, aggregate, or BrandEdge logic.

**Architecture:** Six sequential tasks: new components (TDD), drawer redesign, CSS flush footer, content upgrades (TDD), dashboard wiring, final validation. Desktop (1440px) and mobile (375px) layout checkpoints are embedded in Tasks 3, 4, and 6. All changes are confined to the awareness tab JSX and its direct dependencies; no other tab is touched.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite, Vitest + Testing Library

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/analytics/AwarenessIntelligenceBanner.tsx` | **Create** | Primary framing banner — pattern label, takeaway, 3 key metrics |
| `src/components/analytics/AwarenessIntelligenceBanner.test.tsx` | **Create** | Tests for banner |
| `src/components/analytics/SectionAnalysisBlock.tsx` | **Create** | Expandable analysis block for Funnel, Rankings, Intent sections |
| `src/components/analytics/SectionAnalysisBlock.test.tsx` | **Create** | Tests for analysis block |
| `src/components/analytics/MetricRowAnalysisDrawer.tsx` | **Modify** | Two-zone layout (snapshot left, section grid right), dark theme |
| `src/utils/awarenessInsights.ts` | **Modify** | Funnel builder: rename sections + add COMPETITIVE POSITION; Rankings/Intent: rename STRATEGIC IMPLICATION → STRATEGIC PRIORITY, merge action in |
| `src/utils/awarenessInsights.test.ts` | **Modify** | Add 4 new funnel section-heading tests |
| `src/pages/SubscriberDashboardPage.tsx` | **Modify** | Wire banner, flush footers, SectionAnalysisBlock ×3, remove old module summary panel |
| `src/index.css` | **Modify** | Add `.kpi-card-footer` and `.kpi-card-has-footer` CSS classes |

**Not touched:** `AwarenessInsightPanel.tsx`, `subscriberDashboard.ts`, `analyticsAggregateService.ts`, `brandEdgeScore.ts`, any tab other than `awareness_consideration`.

---

## Task 1: AwarenessIntelligenceBanner component

**Files:**
- Create: `src/components/analytics/AwarenessIntelligenceBanner.test.tsx`
- Create: `src/components/analytics/AwarenessIntelligenceBanner.tsx`

---

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/AwarenessIntelligenceBanner.test.tsx`:

```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AwarenessIntelligenceBanner } from './AwarenessIntelligenceBanner';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockSummary: AwarenessInsightResult = {
  snapshot: 'Awareness pattern: Salience Leader. Strong top-of-mind and high awareness quality position this brand as a salience leader.',
  detail: 'AWARENESS PATTERN — SALIENCE LEADER: Strong top-of-mind...\n\nSTRATEGIC FOCUS: Defend the position.',
};

describe('AwarenessIntelligenceBanner', () => {
  it('extracts and renders the pattern name from snapshot', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText(/Salience Leader/i)).toBeInTheDocument();
  });

  it('renders takeaway text (snapshot without the pattern prefix)', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText(/Strong top-of-mind and high awareness quality/i)).toBeInTheDocument();
  });

  it('renders totalAwareness value', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('renders topOfMind value', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('renders em dash for null metric values', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={null}
        topOfMind={null}
        awarenessQuality={null}
        country="burundi"
        sampleSize={147}
      />
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('renders country and sampleSize', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText(/burundi/i)).toBeInTheDocument();
    expect(screen.getByText(/147/)).toBeInTheDocument();
  });

  it('renders metric cards even when moduleSummary is null', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={null}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.queryByText(/Salience Leader/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/components/analytics/AwarenessIntelligenceBanner.test.tsx 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './AwarenessIntelligenceBanner'`

- [ ] **Step 3: Implement the component**

Create `src/components/analytics/AwarenessIntelligenceBanner.tsx`:

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
    <div className="rounded-2xl border border-white/10 bg-slate-800/60 px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-indigo-400" aria-hidden="true">◈</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Awareness Intelligence
          </span>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">
          {country} · N={sampleSize}
        </span>
      </div>

      {pattern && (
        <div className="mb-3 inline-block rounded-md border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-300">
            {pattern}
          </span>
        </div>
      )}

      {takeaway && (
        <p className="mb-5 max-w-3xl text-sm leading-relaxed text-slate-300">
          {takeaway}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {label}
            </p>
            <p className="text-2xl font-black text-slate-100">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run to confirm all pass**

```bash
npx vitest run src/components/analytics/AwarenessIntelligenceBanner.test.tsx 2>&1 | tail -10
```

Expected: 7/7 pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/AwarenessIntelligenceBanner.tsx src/components/analytics/AwarenessIntelligenceBanner.test.tsx
git commit -m "$(cat <<'EOF'
feat: add AwarenessIntelligenceBanner component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: SectionAnalysisBlock component

**Files:**
- Create: `src/components/analytics/SectionAnalysisBlock.test.tsx`
- Create: `src/components/analytics/SectionAnalysisBlock.tsx`

---

- [ ] **Step 1: Write the failing tests**

Create `src/components/analytics/SectionAnalysisBlock.test.tsx`:

```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionAnalysisBlock } from './SectionAnalysisBlock';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockInsight: AwarenessInsightResult = {
  snapshot: 'The funnel reveals a conversion gap between awareness and salience.',
  detail: [
    'FUNNEL PROFILE: The aware base converts at 50% to spontaneous recall.',
    'MARKET CONTEXT: The brand reaches consumers but lacks active recall.',
    'COMPETITIVE POSITION: Category leaders convert 50-60% spontaneously.',
    'CONSUMER SIGNAL: Most consumers recognise but do not recall first.',
    'OPPORTUNITY/RISK: Risk — passive awareness decays faster.',
    'STRATEGIC PRIORITY: Shift investment from reach to distinctiveness.',
  ].join('\n\n'),
};

describe('SectionAnalysisBlock', () => {
  it('renders nothing when insight is null', () => {
    const { container } = render(
      <SectionAnalysisBlock title="Funnel Analysis" insight={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the title', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    expect(screen.getByText(/Funnel Analysis/i)).toBeInTheDocument();
  });

  it('renders snapshot text in collapsed state', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    expect(screen.getByText(mockInsight.snapshot)).toBeInTheDocument();
  });

  it('shows VIEW DETAILED ANALYSIS button in collapsed state', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    expect(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i })).toBeInTheDocument();
  });

  it('does not show section headings before expanding', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    expect(screen.queryByText('FUNNEL PROFILE')).toBeNull();
  });

  it('shows section headings after clicking expand', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByText('FUNNEL PROFILE')).toBeInTheDocument();
    expect(screen.getByText('MARKET CONTEXT')).toBeInTheDocument();
    expect(screen.getByText('COMPETITIVE POSITION')).toBeInTheDocument();
  });

  it('shows COLLAPSE ANALYSIS button when expanded', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByRole('button', { name: /COLLAPSE ANALYSIS/i })).toBeInTheDocument();
  });

  it('collapses section grid when COLLAPSE ANALYSIS is clicked', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    fireEvent.click(screen.getByRole('button', { name: /COLLAPSE ANALYSIS/i }));
    expect(screen.queryByText('FUNNEL PROFILE')).toBeNull();
  });

  it('renders OPPORTUNITY/RISK heading correctly (slash in name)', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByText('OPPORTUNITY/RISK')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/components/analytics/SectionAnalysisBlock.test.tsx 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './SectionAnalysisBlock'`

- [ ] **Step 3: Implement the component**

Create `src/components/analytics/SectionAnalysisBlock.tsx`:

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
    <div className="rounded-xl border border-white/10 bg-slate-800/40">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span className="text-indigo-400" aria-hidden="true">◈</span>
              {title}
            </p>
            <p className="text-sm leading-relaxed text-slate-300">{insight.snapshot}</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {expanded ? 'COLLAPSE ANALYSIS ▲' : 'VIEW DETAILED ANALYSIS ▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run to confirm all pass**

```bash
npx vitest run src/components/analytics/SectionAnalysisBlock.test.tsx 2>&1 | tail -10
```

Expected: 9/9 pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/SectionAnalysisBlock.tsx src/components/analytics/SectionAnalysisBlock.test.tsx
git commit -m "$(cat <<'EOF'
feat: add SectionAnalysisBlock expandable intelligence component

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: MetricRowAnalysisDrawer — two-zone redesign

**Files:**
- Modify: `src/components/analytics/MetricRowAnalysisDrawer.tsx`

The entire component is replaced. The interface (`MetricRowAnalysisDrawerProps`) is unchanged — the consuming code in `SubscriberDashboardPage.tsx` does not need import changes for this task.

---

- [ ] **Step 1: Replace the component implementation**

Overwrite `src/components/analytics/MetricRowAnalysisDrawer.tsx` in full:

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
    <div className="rounded-xl border border-white/10 bg-slate-800/60 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Detailed Analysis
          </p>
          <h4 className="text-sm font-bold text-slate-200">{title}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors text-sm"
          aria-label="Close analysis"
        >
          ✕
        </button>
      </div>

      {/* Metric definition strip */}
      {definition && (
        <div className="border-b border-white/10 px-6 py-2.5">
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-slate-600">
              What this measures:{' '}
            </span>
            {definition}
          </p>
        </div>
      )}

      {/* Two-zone body — stacks vertically on mobile, side-by-side on lg+ */}
      <div className="flex flex-col gap-5 p-6 lg:flex-row">
        {/* Left zone: executive snapshot */}
        <div className="flex-shrink-0 lg:w-72 xl:w-80">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-5 py-4 h-full">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
              Executive Takeaway
            </p>
            <p className="text-sm font-medium leading-relaxed text-slate-200">
              {insight.snapshot}
            </p>
          </div>
        </div>

        {/* Right zone: section grid */}
        <div className="flex-1 grid gap-3 sm:grid-cols-2 content-start">
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
  );
};
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Run existing smoke test to confirm no regressions**

```bash
npx vitest run src/test/subscriberDashboardPage.smoke.test.tsx 2>&1 | tail -15
```

Expected: all pass.

- [ ] **Step 4: Desktop + mobile layout checkpoint**

Start the dev server:
```bash
npm run dev
```

Open `http://localhost:5173`, sign in as admin, navigate to any bank's Awareness & Consideration tab. Click "VIEW ANALYSIS ▼" on any metric card.

**Desktop (≥1024px) — verify:**
- [ ] Executive Takeaway box appears on the LEFT (~280px wide), indigo-tinted background
- [ ] Section cards appear on the RIGHT in a 2-column grid
- [ ] Sections are readable, dark-themed (slate-800 background, not white)
- [ ] Definition strip appears below header if present

**Mobile (375px) — resize browser or use DevTools:**
- [ ] Executive Takeaway box renders ABOVE the section grid (stacked)
- [ ] Section grid is 1-column on 375px, 2-column on ≥640px
- [ ] No horizontal overflow

Stop dev server (Ctrl+C) once verified.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/MetricRowAnalysisDrawer.tsx
git commit -m "$(cat <<'EOF'
feat: redesign MetricRowAnalysisDrawer with two-zone dark layout

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Flush footer CSS + card wrapper update

**Files:**
- Modify: `src/index.css`
- Modify: `src/pages/SubscriberDashboardPage.tsx` (awareness tab card wrappers only)

---

- [ ] **Step 1: Add CSS classes to index.css**

In `src/index.css`, after the `.kpi-card-diagnostic` block (around line 256), add:

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

  .kpi-card-has-footer .kpi-card-primary,
  .kpi-card-has-footer .kpi-card-secondary {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }
```

- [ ] **Step 2: Update all 8 card wrappers in SubscriberDashboardPage.tsx**

In `src/pages/SubscriberDashboardPage.tsx`, within the `awareness_consideration` TabsContent (around lines 2665–2755), update each of the 8 card wrapper `<div>` elements.

The pattern to find (appears 8 times, one per metric card):

**Row 1 — Top of Mind (find this exact block):**
```tsx
                <div>
                  <Card title="Top of Mind" metricKey="top_of_mind" variant="primary" value={safePercent(awarenessTopMetrics.topOfMind.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.topOfMind, (value) => safePercent(value)), deltaText(awarenessDeltasView.topOfMind))} delta={compareDelta(awarenessTopMetrics.topOfMind) ?? awarenessDeltasView.topOfMind} sparklineValues={trendView.map((point) => point.topOfMind ?? null)} />
                  {awarenessMetricInsights.topOfMind && (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3.5 pb-2.5 pt-2 shadow-sm">
                      <p className="text-[11px] leading-snug text-slate-500">{awarenessMetricInsights.topOfMind.snapshot}</p>
                      <button type="button" onClick={() => setActiveAwarenessMetric((p) => p === 'topOfMind' ? null : 'topOfMind')} className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-sky-600 hover:text-sky-800 transition-colors">{activeAwarenessMetric === 'topOfMind' ? 'CLOSE ANALYSIS ▲' : 'VIEW ANALYSIS ▼'}</button>
                    </div>
                  )}
                </div>
```

**Replace with:**
```tsx
                <div className={awarenessMetricInsights.topOfMind ? 'kpi-card-has-footer' : undefined}>
                  <Card title="Top of Mind" metricKey="top_of_mind" variant="primary" value={safePercent(awarenessTopMetrics.topOfMind.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.topOfMind, (value) => safePercent(value)), deltaText(awarenessDeltasView.topOfMind))} delta={compareDelta(awarenessTopMetrics.topOfMind) ?? awarenessDeltasView.topOfMind} sparklineValues={trendView.map((point) => point.topOfMind ?? null)} />
                  {awarenessMetricInsights.topOfMind && (
                    <div className="kpi-card-footer">
                      <p className="text-[11px] leading-snug text-slate-500">{awarenessMetricInsights.topOfMind.snapshot}</p>
                      <button type="button" onClick={() => setActiveAwarenessMetric((p) => p === 'topOfMind' ? null : 'topOfMind')} className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">{activeAwarenessMetric === 'topOfMind' ? 'CLOSE ANALYSIS ▲' : 'VIEW DETAILED ANALYSIS ▼'}</button>
                    </div>
                  )}
                </div>
```

Apply the same two changes to the remaining 7 cards (Spontaneous Recall, Total Awareness, Awareness Quality, Share of Voice, MoM Growth, Awareness Share Index, Awareness Depth Score). The substitution rules are identical for each:
1. Outer `<div>` → `<div className={awarenessMetricInsights.KEYNAME ? 'kpi-card-has-footer' : undefined}>`
2. Footer div: `className="mt-2 rounded-lg border border-slate-200 bg-white px-3.5 pb-2.5 pt-2 shadow-sm"` → `className="kpi-card-footer"`
3. Button color: `text-sky-600 hover:text-sky-800` → `text-indigo-600 hover:text-indigo-800`
4. Button label when inactive: `'VIEW ANALYSIS ▼'` → `'VIEW DETAILED ANALYSIS ▼'`

The KEYNAME values for the other 7 cards:
- Spontaneous Recall → `awarenessMetricInsights.spontaneous`
- Total Awareness → `awarenessMetricInsights.totalAwareness`
- Awareness Quality → `awarenessMetricInsights.awarenessQuality`
- Share of Voice → `awarenessMetricInsights.shareOfVoice`
- MoM Growth → `awarenessMetricInsights.momGrowth`
- Awareness Share Index → `awarenessMetricInsights.awarenessShareIndex`
- Awareness Depth Score → `awarenessMetricInsights.awarenessDepthScore`

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 4: Desktop + mobile layout checkpoint**

Start `npm run dev`. Navigate to Awareness & Consideration tab.

**Desktop (≥1024px) — verify:**
- [ ] Each KPI card bottom-left and bottom-right corners are square (not rounded)
- [ ] Footer panel appears flush below each card — no visible gap, no shadow artifact at the junction
- [ ] Footer shows the snapshot sentence in `text-slate-500` and an `indigo-600` "VIEW DETAILED ANALYSIS ▼" CTA
- [ ] Clicking the CTA changes to "CLOSE ANALYSIS ▲" and opens the MetricRowAnalysisDrawer below the row
- [ ] Cards in other rows are unaffected

**Mobile (375px) — verify:**
- [ ] Cards stack to 1 column
- [ ] Each card + footer still appears as a single unified block (no visible gap)
- [ ] Footer text wraps cleanly, no horizontal overflow
- [ ] CTA button text fully visible

Stop dev server.

- [ ] **Step 5: Run smoke test**

```bash
npx vitest run src/test/subscriberDashboardPage.smoke.test.tsx 2>&1 | tail -15
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/pages/SubscriberDashboardPage.tsx
git commit -m "$(cat <<'EOF'
feat: add kpi-card-footer CSS and wire flush footers on awareness cards

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Funnel / Rankings / Intent content upgrades

**Files:**
- Modify: `src/utils/awarenessInsights.ts` (3 builder functions)
- Modify: `src/utils/awarenessInsights.test.ts` (add 4 new tests)

---

- [ ] **Step 1: Write the failing tests first**

At the bottom of the `describe('buildAwarenessFunnelInsight', ...)` block in `src/utils/awarenessInsights.test.ts` (after line 166, before the closing `}`), add:

```typescript
  it('detail uses FUNNEL PROFILE heading (not FUNNEL SHAPE)', () => {
    const result = buildAwarenessFunnelInsight({ aware: 70, spontaneous: 35, topOfMind: 20, aided: 60 });
    expect(result?.detail).toMatch(/FUNNEL PROFILE/);
    expect(result?.detail).not.toMatch(/FUNNEL SHAPE/);
  });

  it('detail includes COMPETITIVE POSITION section', () => {
    const result = buildAwarenessFunnelInsight({ aware: 70, spontaneous: 35, topOfMind: 20, aided: 60 });
    expect(result?.detail).toMatch(/COMPETITIVE POSITION/);
  });

  it('COMPETITIVE POSITION mentions category leader benchmark', () => {
    const result = buildAwarenessFunnelInsight({ aware: 70, spontaneous: 35, topOfMind: 20, aided: 60 });
    expect(result?.detail).toMatch(/category leader/i);
  });

  it('detail uses MARKET CONTEXT heading (not MARKET INTERPRETATION)', () => {
    const result = buildAwarenessFunnelInsight({ aware: 70, spontaneous: 35, topOfMind: 20, aided: 60 });
    expect(result?.detail).toMatch(/MARKET CONTEXT/);
    expect(result?.detail).not.toMatch(/MARKET INTERPRETATION/);
  });
```

- [ ] **Step 2: Run to confirm the 4 new tests fail**

```bash
npx vitest run src/utils/awarenessInsights.test.ts 2>&1 | tail -20
```

Expected: 4 failures on the new tests, all existing tests still pass.

- [ ] **Step 3: Update buildAwarenessFunnelInsight in awarenessInsights.ts**

Find the `buildAwarenessFunnelInsight` function (starts around line 313). Replace the entire function body from the opening `{` to the closing `}` with:

```typescript
export function buildAwarenessFunnelInsight(args: FunnelInsightArgs): AwarenessInsightResult | null {
  const { aware, spontaneous, topOfMind, aided } = args;
  if (aware === null || !isFinite(aware) || aware === 0) return null;

  const spontRate = spontaneous !== null && isFinite(spontaneous) ? spontaneous / aware : null;
  const tomRate = topOfMind !== null && isFinite(topOfMind) ? topOfMind / aware : null;

  const isStrongSpont = spontRate !== null && spontRate >= 0.6;
  const isWeakSpont = spontRate !== null && spontRate < 0.35;
  const isWeakToM = tomRate !== null && tomRate < 0.1;
  const isStrongToM = tomRate !== null && tomRate >= 0.3;

  const spontPct = spontaneous !== null ? ((spontaneous / aware) * 100).toFixed(0) : '--';
  const tomPct = topOfMind !== null ? ((topOfMind / aware) * 100).toFixed(0) : '--';

  const snapshot =
    isStrongSpont && isStrongToM
    ? 'The awareness funnel shows strong conversion from recognition to active recall — a high proportion of the aware base recalls the brand spontaneously and as their first choice.'
    : isWeakSpont && isWeakToM
    ? 'The awareness funnel reveals a significant salience gap — most aware consumers recognise the brand but few recall it actively, signalling passive-only awareness that limits commercial conversion.'
    : isWeakSpont
    ? 'The funnel shows low spontaneous conversion — most brand awareness is passive recognition that doesn\'t activate in unaided decision contexts.'
    : isWeakToM
    ? 'The funnel shows reasonable spontaneous recall but weak top-of-mind conversion — the brand is known but rarely the first consumers name.'
    : 'The awareness funnel shows healthy but improvable conversion from recognition to active recall, with specific opportunities in top-of-mind depth.';

  const funnelProfile = `FUNNEL PROFILE: ${
    isStrongSpont && isStrongToM
    ? 'Strong active recall conversion — '
    : isWeakSpont
    ? 'Passive recognition-heavy profile — '
    : 'Moderate funnel conversion — '
  }the aware base (${aware.toFixed(0)}% of total sample) converts at ${spontPct}% to spontaneous recall${topOfMind !== null ? ` and ${tomPct}% to top-of-mind` : ''}. ${aided !== null && spontaneous !== null ? `Aided-only recognition accounts for ${(aided - spontaneous).toFixed(0)}pp of the total sample.` : ''}`;

  const marketContext = `MARKET CONTEXT: ${isStrongSpont ? 'The funnel converts efficiently — a large share of the aware base has moved from recognition to active recall. This indicates brand investment is producing genuine salience, not just surface recognition. The brand enters unaided decision contexts at a rate that most competitors cannot easily match.' : isWeakSpont ? 'The funnel reveals a conversion gap between awareness and salience. The brand is reaching consumers — they recognise it — but it hasn\'t built the memory structures needed for unaided activation. This is the hallmark of reach-heavy investment without corresponding distinctiveness work.' : 'The funnel shows moderate conversion from recognition to spontaneous recall. Performance at the aware-to-spontaneous stage is acceptable, but top-of-mind conversion presents a specific, high-return opportunity.'}`;

  const competitivePosition = `COMPETITIVE POSITION: Banking category leaders typically convert 50–60% of their aware base to spontaneous recall and 25–35% to top-of-mind. At ${spontPct}% spontaneous conversion, this brand ${
    spontRate === null ? 'has insufficient data to benchmark against category norms.'
    : spontRate >= 0.5 ? 'meets or exceeds category leader benchmarks — a genuinely strong funnel that provides competitive insulation in unaided purchase situations.'
    : spontRate >= 0.35 ? 'sits in the competitive middle band — credible but not yet at category leader conversion rates. Sustained distinctiveness investment over 2-3 campaign cycles can close this gap.'
    : 'trails category leader benchmarks materially, a competitive disadvantage in every unaided purchase situation. Competitors achieving 50%+ spontaneous conversion win a disproportionate share of routine banking decisions without paid media support.'
  }${topOfMind !== null ? ` Top-of-mind conversion at ${tomPct}% ${tomRate !== null && tomRate >= 0.25 ? 'meets category leader norms.' : 'trails category leader norms — the brand is present in consideration but rarely the instinctive first choice.'}` : ''}`;

  const consumerSignal = `CONSUMER SIGNAL: ${isWeakToM ? 'The brand is known but rarely the first recalled — consumers are processing it as a secondary option rather than a category anchor. In markets where choice is made quickly and instinctively, this "known but not first" position translates directly into lost conversion opportunities.' : isStrongToM ? 'The brand benefits from strong instinctive recall — a significant share of aware consumers name it first. This indicates the brand has moved beyond recognition into habitual salience, the highest form of consumer brand relationship.' : 'The aware base is split between active and passive recall. Active-recall consumers behave like brand advocates; passive-recall consumers behave like market browsers evaluating multiple options — a meaningful distinction for conversion rate expectations.'}`;

  const opportunityRisk = `OPPORTUNITY/RISK: ${isWeakSpont ? 'Risk — passive-heavy awareness is fragile: it generates no word-of-mouth, provides no competitive protection, and decays faster during media-dark periods. Opportunity — investing in distinctiveness (not more reach) can shift this conversion ratio significantly within 2-3 campaign cycles, at lower cost than building new awareness.' : 'Risk — if funnel conversion is not actively managed, total awareness can grow while spontaneous and top-of-mind ratios decline — a "hollow awareness" pattern that reduces commercial return on brand investment. Opportunity — the existing aware base is the most cost-efficient pool for salience conversion.'}`;

  const strategicPriority = `STRATEGIC PRIORITY: ${isWeakSpont || isWeakToM ? `The brand needs a salience conversion strategy, not a reach strategy. Investment should shift from building more awareness to deepening the quality of existing awareness — specifically targeting the ${isWeakSpont ? 'spontaneous recall' : 'top-of-mind'} conversion rate. Run a distinctiveness audit to identify which brand cues most strongly generate spontaneous recall. Redirect investment from broad reach to high-frequency distinctiveness-led creative for 2-3 consecutive months. Measure spontaneous/aware conversion monthly.` : 'With a healthy funnel shape, the brand is well-positioned to focus on downstream metrics — preference, intent, and loyalty. Monitor funnel conversion rates monthly. Set conversion floor targets: spontaneous/aware ≥ 40%, top-of-mind/aware ≥ 20%. If either ratio declines for 2 consecutive months, investigate creative distinctiveness and media mix.'}`;

  return { snapshot, detail: s(funnelProfile, marketContext, competitivePosition, consumerSignal, opportunityRisk, strategicPriority) };
}
```

- [ ] **Step 4: Update buildAwarenessRankingInsight — merge STRATEGIC IMPLICATION + RECOMMENDED ACTION into STRATEGIC PRIORITY**

In `buildAwarenessRankingInsight` (around line 356), find the two variables:

```typescript
  const strategic = `STRATEGIC IMPLICATION: ${rank === 1 ? 'Market awareness leadership is the most defensible position...' : rank === 2 ? `As the closest challenger...` : 'Focus on moving up one rank position...'}`;

  const action = `RECOMMENDED ACTION: ${rank === 1 ? 'Track the awareness gap to #2 quarterly...' : `Set a specific rank improvement target...`}${sampleSize < LOW_SAMPLE ? ' Note: Ranking comparisons at this sample size are directional only.' : ''}`;

  const smpl = smplSection(sampleSize);

  return { snapshot, detail: s(position, landscape, gap, movement2, strategic, action) + smpl };
```

Replace those two variables and the return with:

```typescript
  const strategicPriority = `STRATEGIC PRIORITY: ${rank === 1 ? 'Market awareness leadership is the most defensible position in the competitive set. Extend the lead on quality metrics — particularly top-of-mind and depth score — which predict usage and advocacy better than raw total awareness. Track the awareness gap to #2 quarterly — a sustained narrowing of 2pp+ over 2 periods warrants a defensive investment response. Monitor top-of-mind and depth score to ensure awareness leadership translates into quality leadership.' : rank === 2 ? `As the closest challenger to ${leader.bankName}, a focused campaign targeting the ${(leader.awareness - awareness).toFixed(0)}pp gap could shift the market balance. Identify which specific consumer segment the leader is weakest in and concentrate efforts there. Set a specific rank improvement target and identify which channel or segment drove the competitor currently ahead to their position.` : 'Focus on moving up one rank position at a time. Identify the bank immediately above and target their weakest demographic segment with tailored messaging and media investment. Set a specific rank improvement target (reach rank #' + (rank - 1) + ' within 12 months).'}${sampleSize < LOW_SAMPLE ? ' Note: Ranking comparisons at this sample size are directional only.' : ''}`;

  const smpl = smplSection(sampleSize);

  return { snapshot, detail: s(position, landscape, gap, movement2, strategicPriority) + smpl };
```

- [ ] **Step 5: Update buildIntentInsight — merge STRATEGIC IMPLICATION + RECOMMENDED ACTION into STRATEGIC PRIORITY**

In `buildIntentInsight` (around line 409), find:

```typescript
  const strategic = `STRATEGIC IMPLICATION: ${hasStrongPipeline ? 'With a strong acquisition pipeline...' : hasChurnRisk ? 'The retention risk...' : hasSubduedIntent ? 'Subdued overall intent suggests...' : 'Intent is healthy...'}`;

  const action = `RECOMMENDED ACTION: ${hasStrongPipeline ? 'Run targeted activation campaigns...' : hasModeratePipeline ? 'Nurture the mid-intent pipeline...' : 'Investigate intent barriers...'}${hasChurnRisk ? ' For at-risk current users...' : ''}`;

  return { snapshot, detail: s(profile, pipeline, churn, consumer, strategic, action) };
```

Replace with:

```typescript
  const strategicPriority = `STRATEGIC PRIORITY: ${hasStrongPipeline ? 'With a strong acquisition pipeline among high-intent non-users, the highest-return investment is targeted conversion activity — offers, trials, or direct activation campaigns aimed at this specific cohort. Run targeted activation campaigns to the high-intent non-user cohort. Use direct response channels (digital, SMS, direct mail) with a specific converting offer. Measure conversion from this segment separately from broad awareness campaign results.' : hasChurnRisk ? 'The retention risk from low-intent current users should be treated as the highest-priority commercial intervention. Churn is expensive to reverse — a current user who defects requires significant acquisition investment to replace. Deploy proactive retention: personalised outreach, service quality signals, and loyalty mechanics. Do not wait for usage to drop before intervening.' : hasSubduedIntent ? 'Subdued overall intent suggests a consideration barrier that reach investment alone cannot solve. Investigate intent barriers with qualitative research. Identify the specific beliefs, concerns, or competitor associations preventing aware non-users from forming high intent. This insight should directly inform the next messaging strategy.' : 'Intent is healthy — the focus should be on activating the high-intent pipeline into conversion, and monitoring the churn risk segment for early movement. Set a 3-month nurture sequence for mid-intent non-users and measure pipeline conversion monthly.'}${hasChurnRisk ? ' For at-risk current users, deploy proactive retention: personalised outreach, service quality signals, and loyalty mechanics. Do not wait for usage decline before responding.' : ''}`;

  return { snapshot, detail: s(profile, pipeline, churn, consumer, strategicPriority) };
```

- [ ] **Step 6: Run all awarenessInsights tests**

```bash
npx vitest run src/utils/awarenessInsights.test.ts 2>&1 | tail -20
```

Expected: all tests pass (previously passing tests + 4 new tests = full pass). Verify specifically:
- `detail uses FUNNEL PROFILE heading` → PASS
- `detail includes COMPETITIVE POSITION section` → PASS
- `COMPETITIVE POSITION mentions category leader benchmark` → PASS
- `detail uses MARKET CONTEXT heading` → PASS
- `detail contains funnel shape analysis` (existing, checks `/funnel/i`) → still PASS

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/utils/awarenessInsights.ts src/utils/awarenessInsights.test.ts
git commit -m "$(cat <<'EOF'
feat: upgrade funnel/rankings/intent insight sections with competitive benchmarks

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: SubscriberDashboardPage — banner + section block wiring

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx`

---

- [ ] **Step 1: Add the two new imports**

Near the top of `src/pages/SubscriberDashboardPage.tsx`, in the analytics imports block (around lines 79–89 where `AwarenessInsightPanel` and `MetricRowAnalysisDrawer` are imported), add:

```typescript
import { AwarenessIntelligenceBanner } from '@/components/analytics/AwarenessIntelligenceBanner';
import { SectionAnalysisBlock } from '@/components/analytics/SectionAnalysisBlock';
```

- [ ] **Step 2: Wire the banner at the top of the awareness tab**

Find the awareness tab content start (search for: `<TabsContent value="awareness_consideration"`). It currently begins immediately with a grid:

```tsx
            <TabsContent value="awareness_consideration" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              <div className="grid gap-4 md:grid-cols-4">
```

Replace with:

```tsx
            <TabsContent value="awareness_consideration" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              <AwarenessIntelligenceBanner
                moduleSummary={awarenessModuleSummary}
                totalAwareness={awarenessTopMetrics.awareness.value}
                topOfMind={awarenessTopMetrics.topOfMind.value}
                awarenessQuality={awarenessTopMetrics.quality.value}
                country={activeCountry || ''}
                sampleSize={sampleSize}
              />
              <div className="grid gap-4 md:grid-cols-4">
```

- [ ] **Step 3: Remove the old module summary panel**

Find and delete this block (around line 2768 in the pre-banner version, now shifted down by ~6 lines):

```tsx
              {awarenessModuleSummary && (
                <div className="mt-6">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Awareness Intelligence Summary</p>
                  <AwarenessInsightPanel insight={awarenessModuleSummary} />
                </div>
              )}
```

Delete those 5 lines entirely. The banner at the top now serves this purpose.

- [ ] **Step 4: Replace Funnel AwarenessInsightPanel with SectionAnalysisBlock**

Find (inside the Awareness Funnel dashboard-section):

```tsx
                  <AwarenessInsightPanel insight={awarenessFunnelInsight} />
```

Replace with:

```tsx
                  <SectionAnalysisBlock title="Awareness Funnel Analysis" insight={awarenessFunnelInsight} />
```

- [ ] **Step 5: Replace Rankings AwarenessInsightPanel with SectionAnalysisBlock**

Find (inside the Brand Rankings dashboard-section):

```tsx
                  <AwarenessInsightPanel insight={awarenessRankingInsight} />
```

Replace with:

```tsx
                  <SectionAnalysisBlock title="Brand Rankings Analysis" insight={awarenessRankingInsight} />
```

- [ ] **Step 6: Replace Intent AwarenessInsightPanel with SectionAnalysisBlock**

Find (in the Future Intent & Consideration section):

```tsx
                <AwarenessInsightPanel insight={awarenessIntentInsight} />
```

Replace with:

```tsx
                <SectionAnalysisBlock title="Future Intent & Consideration" insight={awarenessIntentInsight} />
```

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 8: Desktop + mobile layout checkpoint**

Start `npm run dev`. Navigate to Awareness & Consideration tab.

**Full tab — collapsed state — desktop (≥1280px):**
- [ ] Intelligence banner appears at the very top of the tab, before any metric cards
- [ ] Banner shows: pattern badge (e.g. "RECOGNISED BUT FORGOTTEN"), takeaway sentence, three metric mini-cards (Total Awareness, Top of Mind, Quality Ratio)
- [ ] Two rows of 4 metric cards each appear below the banner
- [ ] Each card has a flush white footer with the snapshot sentence and "VIEW DETAILED ANALYSIS ▼" in indigo
- [ ] Card bottom corners are square (not rounded) where footer attaches
- [ ] Three section blocks appear below the two card rows: Awareness Funnel Analysis, Brand Rankings Analysis, Future Intent & Consideration
- [ ] Each section block shows the snapshot + "VIEW DETAILED ANALYSIS ▼"
- [ ] Old "Awareness Intelligence Summary" panel is GONE (no duplicate below the card rows)

**Full tab — collapsed state — mobile (375px):**
- [ ] Banner stacks cleanly: pattern badge → takeaway → 3 metric cards in a row (3-col grid holds on 375px, check it looks readable at small font)
- [ ] Each metric card + footer stacks full-width
- [ ] Section blocks appear full-width, snapshot text wraps correctly

**Expanded drawer — desktop:**
- [ ] Click "VIEW DETAILED ANALYSIS ▼" on Top of Mind card
- [ ] MetricRowAnalysisDrawer appears below Row 1 — dark background, indigo Executive Takeaway on left, 2-col section grid on right
- [ ] No white boxes, no light-themed elements in the drawer
- [ ] ✕ button closes drawer and card returns to "VIEW DETAILED ANALYSIS ▼"

**Expanded drawer — mobile (375px):**
- [ ] Drawer stacks: Executive Takeaway box on top, section cards below in 1-2 column grid
- [ ] No horizontal overflow

**Expanded section block:**
- [ ] Click "VIEW DETAILED ANALYSIS ▼" on Awareness Funnel Analysis
- [ ] 6 section cards appear in grid: FUNNEL PROFILE, MARKET CONTEXT, COMPETITIVE POSITION, CONSUMER SIGNAL, OPPORTUNITY/RISK, STRATEGIC PRIORITY
- [ ] Dark-themed cards (slate-900 background)
- [ ] On mobile: grid is 1-column then 2-column at ≥640px

Stop dev server.

- [ ] **Step 9: Run smoke tests**

```bash
npx vitest run src/test/subscriberDashboardPage.smoke.test.tsx src/test/demographicGuardUI.test.tsx 2>&1 | tail -20
```

Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "$(cat <<'EOF'
feat: wire intelligence banner and section analysis blocks into awareness tab

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Final validation — full suite + screenshots

**Files:** None modified. This is read-only verification.

---

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run 2>&1 | tail -30
```

Expected: 0 failures. Note the total test count (should be ≥ the pre-V4 count + 4 funnel tests + 7 banner tests + 9 section block tests = +20 minimum).

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: empty output (0 errors).

- [ ] **Step 3: Take screenshots — collapsed state**

Start `npm run dev`. Open browser at `http://localhost:5173`. Sign in, navigate to Awareness & Consideration tab. Do not click any analysis button.

Take a screenshot of the full tab in collapsed state at:
- 1440×900 (desktop)
- 375×812 (mobile — use DevTools)

Save as: `awareness-v4-collapsed-desktop.png`, `awareness-v4-collapsed-mobile.png`

- [ ] **Step 4: Take screenshots — drawer expanded state**

Click "VIEW DETAILED ANALYSIS ▼" on the Top of Mind card (or any Row 1 card).

Take a screenshot showing:
- The MetricRowAnalysisDrawer below Row 1 with two-zone layout visible
- Executive Takeaway on the left, section grid on the right

Save as: `awareness-v4-drawer-expanded-desktop.png`

- [ ] **Step 5: Take screenshots — section block expanded state**

Click "VIEW DETAILED ANALYSIS ▼" on the Awareness Funnel Analysis block.

Take a screenshot showing:
- The 6-section grid expanded below the snapshot (FUNNEL PROFILE, MARKET CONTEXT, COMPETITIVE POSITION, CONSUMER SIGNAL, OPPORTUNITY/RISK, STRATEGIC PRIORITY)

Save as: `awareness-v4-section-expanded-desktop.png`

- [ ] **Step 6: Report results**

Provide:
- All test suite output (total test count, 0 failures)
- TypeScript result (0 errors)
- All screenshot files listed
- Summary of files changed:
  - Created: `AwarenessIntelligenceBanner.tsx`, `AwarenessIntelligenceBanner.test.tsx`, `SectionAnalysisBlock.tsx`, `SectionAnalysisBlock.test.tsx`
  - Modified: `MetricRowAnalysisDrawer.tsx`, `awarenessInsights.ts`, `awarenessInsights.test.ts`, `SubscriberDashboardPage.tsx`, `index.css`

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| Intelligence banner at top of tab | Task 6 Step 2 |
| Metric cards cleaner with flush footers | Task 4 |
| SectionAnalysisBlock with 5 structured subsections | Task 2 + Task 6 Steps 4–6 |
| Funnel content upgrade (COMPETITIVE POSITION + renamed sections) | Task 5 Steps 3–4 |
| Rankings heading alignment (STRATEGIC PRIORITY) | Task 5 Step 4 |
| Intent heading alignment (STRATEGIC PRIORITY) | Task 5 Step 5 |
| MetricRowAnalysisDrawer two-zone dark layout | Task 3 |
| Remove old module summary panel from bottom | Task 6 Step 3 |
| Desktop + mobile layout checkpoints | Tasks 3, 4, 6 |
| Admin AI section unchanged | Not touched — verified in smoke tests |
| No formula/aggregate/BrandEdge changes | Confirmed — file map excludes those files |

**Placeholder scan:** None found. All code blocks contain complete implementations.

**Type consistency:**
- `AwarenessInsightResult` used identically across all components: `{ snapshot: string; detail: string }`
- `AwarenessIntelligenceBannerProps.moduleSummary` is `AwarenessInsightResult | null` — matches `awarenessModuleSummary` computed in dashboard
- `SectionAnalysisBlockProps.insight` is `AwarenessInsightResult | null` — matches all three section insight computations
- `MetricRowAnalysisDrawerProps` interface is unchanged — consumer code in `SubscriberDashboardPage` requires no updates for Task 3
- `parseSection` in `SectionAnalysisBlock` uses identical regex to `MetricRowAnalysisDrawer`: `/^[A-Z][A-Z\s&/]+$/` — `OPPORTUNITY/RISK` heading passes this regex (slash is in character class)
- `fmt()` in banner handles `null` and non-integer floats correctly
- `buildAwarenessFunnelInsight` still returns `AwarenessInsightResult | null` — return type unchanged, tests updated to check new headings
