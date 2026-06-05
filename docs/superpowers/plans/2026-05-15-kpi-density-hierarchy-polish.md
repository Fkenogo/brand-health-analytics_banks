# KPI Density, Hierarchy & Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce KPI card height by 25–35%, fix footer clipping, strengthen the info icon affordance, unify card visual language with the analysis sections, and add a BrandEdge gradient to the intelligence banner.

**Architecture:** Four targeted CSS/JSX edits — no logic changes, no type changes. All tests continue to pass (they check text content and behaviour, not CSS classes). Visual changes only: card proportions, typography scale, border colours, icon sizing, and banner gradient.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3.4 (JIT — `text-[#E10613]` works), Vitest + @testing-library/react

---

## File Map

| File | Change |
|------|--------|
| `src/index.css` | Reduce card padding; fix border colour; add flex layout for footer wrapper to prevent clipping |
| `src/pages/SubscriberDashboardPage.tsx` | Shrink metric font sizes; tighten internal spacing; improve card title contrast; upgrade MetricInfoIcon |
| `src/components/analytics/AwarenessIntelligenceBanner.tsx` | Swap flat charcoal bg for BrandEdge red/charcoal gradient; tighten padding |

---

## BrandEdge Reference

- `#E10613` — BrandEdge Red (hover on icons, CTA)
- `#1F2230` — Charcoal Black
- `#667085` — Slate (muted labels)
- `#E4E7EC` — Light Border

---

## Task 1: CSS Card Density + Footer Clipping Fix

**Files:**
- Modify: `src/index.css`

Root cause of footer clipping: `.dashboard-tab-panel > .grid .dashboard-kpi-card { height: 100%; }` makes the Card div fill 100% of its wrapper (`kpi-card-has-footer`). The footer then overflows outside the stretched wrapper height. Fix: make `kpi-card-has-footer` a flex column so the Card grows and the footer stays pinned to the bottom.

- [ ] **Step 1: Run baseline tests**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Note the pass count.

- [ ] **Step 2: Compact `.kpi-card-primary` padding + sharpen border**

Find in `src/index.css`:
```css
  .kpi-card-primary {
    border-radius: var(--radius-lg);
    padding: 0.875rem 1rem;
    box-shadow: var(--shadow-2);
    background: #ffffff !important;
  }
```

Replace with:
```css
  .kpi-card-primary {
    border-radius: var(--radius-lg);
    padding: 0.625rem 1rem;
    box-shadow: var(--shadow-1);
    background: #ffffff !important;
    border-color: #E4E7EC !important;
  }
```

- [ ] **Step 3: Compact `.kpi-card-secondary` + replace near-invisible border**

Find:
```css
  .kpi-card-secondary {
    border-radius: var(--radius-md);
    padding: 0.875rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: var(--shadow-1);
    background: #ffffff !important;
  }
```

Replace with:
```css
  .kpi-card-secondary {
    border-radius: var(--radius-md);
    padding: 0.625rem 0.875rem;
    border: 1px solid #E4E7EC;
    box-shadow: var(--shadow-1);
    background: #ffffff !important;
  }
```

- [ ] **Step 4: Add flex layout to fix footer clipping**

Find this block in `src/index.css`:
```css
  .kpi-card-has-footer .kpi-card-primary,
  .kpi-card-has-footer .kpi-card-secondary {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }
```

Replace with:
```css
  .kpi-card-has-footer .kpi-card-primary,
  .kpi-card-has-footer .kpi-card-secondary {
    border-bottom-left-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }

  .kpi-card-has-footer {
    display: flex;
    flex-direction: column;
  }

  .kpi-card-has-footer .dashboard-kpi-card {
    flex: 1;
    height: auto;
  }
```

- [ ] **Step 5: Run tests — confirm same count**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Expected: same pass count as Step 1.

- [ ] **Step 6: Commit**

```bash
git add src/index.css
git commit -m "fix: compact KPI card padding, sharpen borders, fix footer flex layout to prevent clipping"
```

---

## Task 2: Card Component Typography + MetricInfoIcon Upgrade

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx` (two separate inline components)

Changes to the `Card` component (lines ~426–451): reduce metric font sizes, tighten internal spacing, improve title contrast, update subtitle text.

Changes to `MetricInfoIcon` (lines ~220–228): circular hover target, red hover accent.

- [ ] **Step 1: Run tests baseline**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```

- [ ] **Step 2: Update MetricInfoIcon button**

In `src/pages/SubscriberDashboardPage.tsx`, find this exact block:
```tsx
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="text-slate-500 hover:text-slate-200"
          aria-label={`About ${content.title}`}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
```

Replace with:
```tsx
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-[#E10613]/10 hover:text-[#E10613]"
          aria-label={`About ${content.title}`}
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </PopoverTrigger>
```

- [ ] **Step 3: Update Card component**

In `src/pages/SubscriberDashboardPage.tsx`, find this exact block (the Card component body):
```tsx
  <div
    className={`dashboard-kpi-card border transition-all duration-200 ease-out ${
      variant === 'primary'
        ? 'kpi-card-primary bg-slate-800/70 hover:-translate-y-0.5'
        : variant === 'diagnostic'
          ? 'kpi-card-diagnostic bg-slate-900/40'
          : 'kpi-card-secondary bg-slate-800/55'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <p className={`text-slate-400 uppercase tracking-wide ${variant === 'primary' ? 'text-xs font-semibold' : 'text-xs'}`}>{title}</p>
        {metricKey ? <MetricInfoIcon metricKey={metricKey} /> : null}
      </div>
      <DeltaBadge delta={delta} />
    </div>
    <div className="mt-2 flex items-end justify-between gap-2">
      <p className={`${variant === 'primary' ? 'text-5xl' : variant === 'diagnostic' ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800 transition-all duration-200 motion-safe:animate-[fadeIn_160ms_ease-out]`}>
        {value}
      </p>
      <Sparkline values={sparklineValues} accent={delta && delta < 0 ? 'red' : 'blue'} />
    </div>
    {subtitle ? <p className="mt-1 text-xs text-slate-500 leading-relaxed">{subtitle}</p> : null}
  </div>
```

Replace with:
```tsx
  <div
    className={`dashboard-kpi-card border transition-all duration-200 ease-out ${
      variant === 'primary'
        ? 'kpi-card-primary bg-slate-800/70 hover:-translate-y-0.5'
        : variant === 'diagnostic'
          ? 'kpi-card-diagnostic bg-slate-900/40'
          : 'kpi-card-secondary bg-slate-800/55'
    }`}
  >
    <div className="flex items-center justify-between gap-1.5">
      <div className="flex items-center gap-1">
        <p className={`uppercase tracking-wide text-slate-500 ${variant === 'primary' ? 'text-[11px] font-semibold' : 'text-[10px]'}`}>{title}</p>
        {metricKey ? <MetricInfoIcon metricKey={metricKey} /> : null}
      </div>
      <DeltaBadge delta={delta} />
    </div>
    <div className="mt-1 flex items-end justify-between gap-2">
      <p className={`${variant === 'primary' ? 'text-4xl' : variant === 'diagnostic' ? 'text-xl' : 'text-2xl'} font-bold text-slate-800 transition-all duration-200 motion-safe:animate-[fadeIn_160ms_ease-out]`}>
        {value}
      </p>
      <Sparkline values={sparklineValues} accent={delta && delta < 0 ? 'red' : 'blue'} />
    </div>
    {subtitle ? <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{subtitle}</p> : null}
  </div>
```

Key changes:
- Title row gap: `gap-2` → `gap-1.5`
- Title colour: `text-slate-400` → `text-slate-500` (better contrast on white)
- Primary title: `text-xs` → `text-[11px]`; secondary: `text-xs` → `text-[10px]`
- Value row gap: `mt-2` → `mt-1`
- Primary metric value: `text-5xl` (48px) → `text-4xl` (36px) — ~25% reduction
- Secondary metric value: `text-3xl` (30px) → `text-2xl` (24px) — ~20% reduction
- Diagnostic metric value: `text-2xl` → `text-xl`
- Subtitle: `mt-1 text-xs leading-relaxed` → `mt-0.5 text-[10px] leading-snug`

- [ ] **Step 4: Run tests — confirm no regressions**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Expected: same pass count.

- [ ] **Step 5: TypeScript check**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --noEmit 2>&1 | head -10
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: compact KPI card typography and upgrade MetricInfoIcon with red hover accent"
```

---

## Task 3: AwarenessIntelligenceBanner — BrandEdge Gradient

**Files:**
- Modify: `src/components/analytics/AwarenessIntelligenceBanner.tsx`

Existing tests (7/7) check text content only — they pass unchanged after this styling change.

- [ ] **Step 1: Confirm tests pass**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/components/analytics/AwarenessIntelligenceBanner.test.tsx --reporter=verbose 2>&1
```
Expected: 7/7 pass.

- [ ] **Step 2: Replace outer wrapper styling**

In `src/components/analytics/AwarenessIntelligenceBanner.tsx`, find:
```tsx
    <div className="rounded-2xl bg-[#1F2230] px-6 py-5">
```

Replace with:
```tsx
    <div
      className="rounded-2xl px-5 py-4"
      style={{ background: 'linear-gradient(135deg, #1F2230 0%, #200406 55%, #1F2230 100%)' }}
    >
```

This switches from flat charcoal to a subtle BrandEdge dark-red centre gradient. The dark red (#200406 ≈ very dark crimson) is barely perceptible but adds warmth and brand identity without being garish. Padding is slightly tightened (`px-6 py-5` → `px-5 py-4`).

- [ ] **Step 3: Run tests — confirm still 7/7**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run src/components/analytics/AwarenessIntelligenceBanner.test.tsx --reporter=verbose 2>&1
```
Expected: 7/7 pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/analytics/AwarenessIntelligenceBanner.tsx
git commit -m "feat: add BrandEdge red/charcoal gradient to intelligence banner"
```

---

## Task 4: Final Validation + Screenshots

**Files:** No code changes.

- [ ] **Step 1: Full test suite**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -12
```
Expected: same pass count as before all tasks. 0 new failures.

- [ ] **Step 2: TypeScript**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --noEmit 2>&1 | head -5
```
Expected: 0 errors.

- [ ] **Step 3: Start dev server**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vite --port 5175 &
sleep 5
```

- [ ] **Step 4: Screenshots — desktop + mobile**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  try { await page.goto('http://localhost:5175', { waitUntil: 'networkidle0', timeout: 12000 }); }
  catch(e) { await page.goto('http://localhost:5175', { waitUntil: 'domcontentloaded', timeout: 12000 }); }
  await page.screenshot({ path: 'awareness-v6-desktop.png' });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: 'awareness-v6-mobile.png' });
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
"
```

- [ ] **Step 5: Kill dev server + commit screenshots**

```bash
kill $(lsof -t -i:5175) 2>/dev/null || true
git add awareness-v6-desktop.png awareness-v6-mobile.png 2>/dev/null
git commit -m "chore: add v6 density and hierarchy polish screenshots" 2>/dev/null || echo "skipped"
```

- [ ] **Step 6: Report**

Provide:
1. Full test results (pass/fail counts)
2. TypeScript: 0 errors confirmed
3. Screenshot paths
4. `git log --oneline -5` for commit hashes

---

## Self-Review

**Spec coverage:**
- ✅ KPI cards too tall: primary `text-5xl`→`text-4xl`, secondary `text-3xl`→`text-2xl`; padding `0.875rem`→`0.625rem` — ~30% height reduction
- ✅ Footer clipping: `kpi-card-has-footer` flex-column + `flex: 1; height: auto` on inner card fixes root cause
- ✅ Hero gradient: BrandEdge dark-red charcoal gradient replaces flat `#1F2230`
- ✅ Info icon: circular 18px target, `hover:bg-[#E10613]/10`, icon `h-3.5`→`h-4`
- ✅ Card system consistency: `text-slate-400`→`text-slate-500` title, `#E4E7EC` borders match analysis sections
- ✅ No equal-height analysis cards (preserved `items-start` + `self-start` from prior pass)
- ✅ No redesign of analytics sections
- ✅ No logic/formula/test-behaviour changes

**Placeholder scan:** None found.

**Type consistency:** No new types introduced.
