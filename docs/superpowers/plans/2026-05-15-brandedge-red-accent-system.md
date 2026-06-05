# BrandEdge Red Accent System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all remaining blue/indigo accent colors with the BrandEdge red identity system (`#E10613` / `#C1121F` / `#B5040F`) so the dashboard reads as a premium red/charcoal intelligence platform.

**Architecture:** Four targeted edits in one file (`src/pages/SubscriberDashboardPage.tsx`) — no logic changes, no type changes. All tests continue to pass (they check text content and behaviour, not CSS classes). Changes: (1) primary accent constant + hero card gradient, (2) interactive states and CTA buttons throughout the page, (3) AI Advisor panel, (4) final validation.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3.4 JIT (`bg-[#E10613]`, `hover:border-[#E10613]/50`, `from-[#7A0008]` all work), Vitest + @testing-library/react

---

## BrandEdge Reference

- `#E10613` — BrandEdge Red (hover, accent, icon)
- `#C1121F` — CTA Red (primary buttons)
- `#B5040F` — Deep Red (hover darken)
- `#7A0008` — Dark Crimson (gradient start)
- `#1F2230` — Charcoal Black
- `#667085` — Slate (muted labels)
- `#E4E7EC` — Light Border

**Do NOT change:** ACCENT_POSITIVE (#059669 green), ACCENT_NEGATIVE (#F43F5E rose-red for negative indicators), ACCENT_NEUTRAL (#94A3B8 slate). Only blue/indigo → BrandEdge red.

---

## File Map

| File | Change |
|------|--------|
| `src/pages/SubscriberDashboardPage.tsx` | All 4 tasks — constants, hero, CTAs, AI Advisor panel |

---

## Task 1: ACCENT_PRIMARY Constant + ExecutiveHero Gradient

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx` (lines ~327, ~483, ~520–529)

Changing `ACCENT_PRIMARY` from `#4F8CFF` to `#E10613` auto-propagates to: Sparkline default stroke, MiniBar bar fill (via `ACCENT_PRIMARY` reference), FunnelSteps first stage. Also change FunnelSteps stage 2–3 support colors from blue-grey tones to BrandEdge slate greys, and replace the ExecutiveHero blue gradient with a deep executive red gradient.

- [ ] **Step 1: Run baseline tests**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Note the pass count (expected: 385 passed, 13 pre-existing failures).

- [ ] **Step 2: Change ACCENT_PRIMARY constant**

In `src/pages/SubscriberDashboardPage.tsx`, find:
```tsx
const ACCENT_PRIMARY = '#4F8CFF';
```

Replace with:
```tsx
const ACCENT_PRIMARY = '#E10613';
```

- [ ] **Step 3: Harmonize FunnelSteps support colors**

Find:
```tsx
        const stageColors = [ACCENT_PRIMARY, '#6E8DC5', '#85A3D6', ACCENT_POSITIVE];
```

Replace with:
```tsx
        const stageColors = [ACCENT_PRIMARY, '#667085', '#94A3B8', ACCENT_POSITIVE];
```

(Stages 2–3 become BrandEdge slate grey instead of blue-grey, so the funnel doesn't mix red and blue.)

- [ ] **Step 4: Replace ExecutiveHero blue gradient with BrandEdge red gradient**

Find this exact block:
```tsx
    <div className={`rounded-3xl bg-gradient-to-br p-10 text-white md:col-span-2 ${tone === 'momentum' ? 'from-blue-700 to-blue-600' : 'from-blue-600 to-blue-500'}`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">{label}</p>
      <p className="mt-4 text-6xl font-bold">{score}</p>
      <p className="mt-4 text-sm font-medium" style={{ color: delta === null ? '#DBEAFE' : delta > 0 ? '#A7F3D0' : delta < 0 ? '#FECACA' : '#DBEAFE' }}>
        {delta === null ? 'No previous period delta' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}pp vs previous period`}
      </p>
      <p className="mt-3 text-sm text-blue-100">{summary}</p>
    </div>
```

Replace with:
```tsx
    <div className="rounded-3xl bg-gradient-to-br from-[#5A0B10] via-[#8E1018] to-[#C1121F] p-10 text-white md:col-span-2">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-100">{label}</p>
      <p className="mt-4 text-6xl font-bold">{score}</p>
      <p className="mt-4 text-sm font-medium" style={{ color: delta === null ? 'rgba(255,255,255,0.65)' : delta > 0 ? '#A7F3D0' : delta < 0 ? '#FECACA' : 'rgba(255,255,255,0.65)' }}>
        {delta === null ? 'No previous period delta' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}pp vs previous period`}
      </p>
      <p className="mt-3 text-sm text-red-100">{summary}</p>
    </div>
```

Key changes: executive red gradient (`from-[#5A0B10] via-[#8E1018] to-[#C1121F]` — dark crimson → mid red → CTA red, premium consulting feel); `text-blue-100` → `text-red-100`; null delta neutral `#DBEAFE` → `rgba(255,255,255,0.65)`; tone conditional removed (both tones share the same gradient).

- [ ] **Step 5: Run tests — confirm same count**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Expected: same pass count as Step 1.

- [ ] **Step 6: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: replace ACCENT_PRIMARY with BrandEdge red, apply executive red gradient to hero card"
```

---

## Task 2: Interactive States — CTA Buttons, Filter Chips, View Report Links

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx` (lines ~280–295, ~2313–2350, ~2423, ~2445, ~2459, ~2552, ~2575–2629)

This task converts all remaining blue interactive states in the main dashboard body (header buttons, filter chips, section insights modal, export buttons, executive summary View Report links) to BrandEdge red.

- [ ] **Step 1: Run tests baseline**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```

- [ ] **Step 2: Replace SectionInsightsTrigger button hover**

Find:
```tsx
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:border-blue-500"
```

Replace with:
```tsx
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:border-[#E10613]/50"
```

- [ ] **Step 3: Replace SectionInsightsTrigger modal left-border and chevron color**

Find:
```tsx
        <div className="space-y-4 border-l-2 border-blue-400/45 pl-5 text-sm leading-relaxed">
```
Replace with:
```tsx
        <div className="space-y-4 border-l-2 border-[#E10613]/40 pl-5 text-sm leading-relaxed">
```

Find:
```tsx
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-blue-300" />
```
Replace with:
```tsx
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-[#E10613]" />
```

- [ ] **Step 4: Replace all `hover:border-blue-500` occurrences globally**

Use `replace_all: true` to replace every occurrence in the file:

Find (exact string): `hover:border-blue-500`
Replace with: `hover:border-[#E10613]/50`

This targets 9 occurrences: the header nav buttons (Surface Mode, Survey Access, Admin Modules, Log Out), the Export Summary button, the AI Advisor Download and Reset buttons, the Upgrade modal Close button. All should become the same muted red border hover.

- [ ] **Step 5: Replace Export view button from blue to red**

Find:
```tsx
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
```
Replace with:
```tsx
                  className="w-full rounded-lg bg-[#C1121F] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-[#E31B23] disabled:opacity-50"
```

- [ ] **Step 6: Replace active filter chip styling (age filters)**

Find:
```tsx
                    className={`rounded-full border px-3 py-1 text-xs ${ageGroups.includes(age) ? 'border-blue-500 bg-blue-500/20 text-blue-200' : 'border-white/10 text-slate-300'}`}
```
Replace with:
```tsx
                    className={`rounded-full border px-3 py-1 text-xs ${ageGroups.includes(age) ? 'border-[#E10613] bg-[#E10613]/15 text-red-200' : 'border-white/10 text-slate-300'}`}
```

- [ ] **Step 7: Replace active filter chip styling (gender filters)**

Find:
```tsx
                    className={`rounded-full border px-3 py-1 text-xs uppercase ${genders.includes(gender) ? 'border-blue-500 bg-blue-500/20 text-blue-200' : 'border-white/10 text-slate-300'}`}
```
Replace with:
```tsx
                    className={`rounded-full border px-3 py-1 text-xs uppercase ${genders.includes(gender) ? 'border-[#E10613] bg-[#E10613]/15 text-red-200' : 'border-white/10 text-slate-300'}`}
```

- [ ] **Step 8: Replace View Report button colors globally**

Use `replace_all: true`:

Find (exact string): `className="text-blue-300 hover:text-blue-200"`
Replace with: `className="text-[#E10613] hover:text-[#B5040F]"`

This targets 7 identical View Report button class strings in the Executive Summary table.

- [ ] **Step 9: Run tests — confirm no regressions**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Expected: same pass count.

- [ ] **Step 10: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: replace blue interactive states with BrandEdge red — buttons, chips, view report links"
```

---

## Task 3: AI Advisor Panel

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx` (lines ~4356–4520)

The AI Strategy Advisor (floating action button + slide-out sheet) is heavily blue. This task converts the FAB, sparkles icon, chat bubble styling, textarea focus, send button, and upgrade modal button to BrandEdge red.

- [ ] **Step 1: Run tests baseline**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```

- [ ] **Step 2: Replace AI Advisor floating action button (FAB)**

Find:
```tsx
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-950/60 hover:bg-blue-500"
```
Replace with:
```tsx
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#C1121F] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-[#3D0208]/50 hover:bg-[#E31B23]"
```

- [ ] **Step 3: Replace AI Advisor sparkles icon color**

Find:
```tsx
                <Sparkles className="h-4 w-4 text-blue-300" />
```
Replace with:
```tsx
                <Sparkles className="h-4 w-4 text-[#E10613]/70" />
```

- [ ] **Step 4: Replace user message bubble styling**

Find:
```tsx
                        ? 'ml-8 border border-blue-500/30 bg-blue-500/10 text-blue-100'
```
Replace with:
```tsx
                        ? 'ml-8 border border-[#E10613]/25 bg-[#E10613]/10 text-slate-100'
```

- [ ] **Step 5: Replace textarea focus border**

Find:
```tsx
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
```
Replace with:
```tsx
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#E10613]/50"
```

- [ ] **Step 6: Replace AI Advisor send button**

Find:
```tsx
                  className="rounded-2xl bg-blue-600 p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
```
Replace with:
```tsx
                  className="rounded-2xl bg-[#C1121F] p-3 text-white hover:bg-[#E31B23] disabled:cursor-not-allowed disabled:opacity-50"
```

- [ ] **Step 7: Replace Upgrade to Standard button**

Find:
```tsx
              className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-200 hover:border-blue-400"
```
Replace with:
```tsx
              className="rounded-full border border-[#E10613]/40 bg-[#E10613]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-200 hover:border-[#E10613]"
```

- [ ] **Step 8: Run tests — confirm no regressions**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx vitest run --reporter=verbose 2>&1 | tail -6
```
Expected: same pass count.

- [ ] **Step 9: TypeScript check**

```bash
export PATH="/Users/theo/.nvm/versions/node/v22.22.2/bin:$PATH"
npx tsc --noEmit 2>&1 | head -10
```
Expected: 0 errors.

- [ ] **Step 10: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: replace AI Advisor panel blue accents with BrandEdge red"
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
  await page.screenshot({ path: 'awareness-v7-desktop.png' });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: 'awareness-v7-mobile.png' });
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
"
```

- [ ] **Step 5: Kill dev server**

```bash
kill $(lsof -t -i:5175) 2>/dev/null || true
```

- [ ] **Step 6: Verify blue accent removal**

```bash
grep -n "from-blue\|to-blue\|via-blue\|bg-blue\|text-blue\|border-blue" /Users/theo/brand-health-analytics_banks/src/pages/SubscriberDashboardPage.tsx | grep -v "//\|ACCENT_PRIMARY\|'green'\|'red'\|'amber'" | head -20
```

Expected: zero or minimal results. Any remaining `text-blue` should be in type literals (`accent?: 'blue'`) or comments, not active className strings.

- [ ] **Step 7: Commit screenshots**

```bash
git add awareness-v7-desktop.png awareness-v7-mobile.png 2>/dev/null
git commit -m "chore: add v7 BrandEdge red accent screenshots" 2>/dev/null || echo "skipped"
```

- [ ] **Step 8: Report**

Provide:
1. Full test results (pass/fail counts)
2. TypeScript: 0 errors confirmed
3. Blue accent grep output (Step 6 result)
4. Screenshot paths
5. `git log --oneline -5` for commit hashes

---

## Self-Review

**Spec coverage:**
- ✅ TASK 1 — Hero card: `from-blue-600 to-blue-500` → `from-[#7A0008] via-[#B5040F] to-[#E10613]`; `text-blue-100` → `text-red-100`
- ✅ TASK 2 — CTA buttons: `bg-blue-600` → `bg-[#C1121F] hover:bg-[#E31B23]`
- ✅ TASK 2 — Active filter chips: `bg-blue-500/20 border-blue-500 text-blue-200` → `bg-[#E10613]/15 border-[#E10613] text-red-200`
- ✅ TASK 2 — View Report links: `text-blue-300 hover:text-blue-200` → `text-[#E10613] hover:text-[#B5040F]`
- ✅ TASK 3 — Active tab states: Already white/slate in CSS (`.dashboard-tab-trigger[data-state='active']` uses `background: #ffffff; color: #0f172a`) — no blue. No change needed.
- ✅ TASK 1+2 — Info icons: Already updated in V6 with `hover:bg-[#E31B23]/10 hover:text-[#E10613]`. No change needed.
- ✅ TASK 2+3 — Analysis section accents: SectionAnalysisBlock and MetricRowAnalysisDrawer already have red left-borders, ◈ icons, and expand labels from V5. No change needed.
- ✅ TASK 3 — AI Advisor FAB: `bg-blue-600` → `bg-[#C1121F] hover:bg-[#E31B23]`
- ✅ TASK 3 — Upgrade button: `bg-blue-500/15 border-blue-500/40 text-blue-200` → `bg-[#E10613]/10 border-[#E10613]/40 text-red-200`
- ✅ Secondary palette preserved: charcoal, slate, off-white, positive green, negative rose stay unchanged
- ✅ `ACCENT_PRIMARY` change auto-propagates to Sparkline, MiniBar bar fill (all `color="bg-blue-500"` props fall through to `ACCENT_PRIMARY`), FunnelSteps stage 0

**Placeholder scan:** None found.

**Type consistency:** No new types. `accent?: 'blue' | 'green' | 'red' | 'amber'` prop type string `'blue'` is still passed at call sites (line 447: `accent={delta && delta < 0 ? 'red' : 'blue'}`). This is fine — the string literal 'blue' maps to `ACCENT_PRIMARY` inside Sparkline, which now resolves to `#E10613`. No type error.
