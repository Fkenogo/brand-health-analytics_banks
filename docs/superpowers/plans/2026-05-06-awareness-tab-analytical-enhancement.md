# Awareness Tab Analytical Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Awareness & Consideration tab from an executive summary into a rich analytical module with deterministic (non-AI) insights that display immediately — no button click required — on every metric card and section.

**Architecture:** Pure deterministic functions in `src/utils/awarenessInsights.ts` compute human-readable analysis strings from metric values. A lightweight `AwarenessInsightPanel` component renders each string in a collapsible `<details>` block below its parent metric card or section. Eight metric panels and three section panels are wired into `SubscriberDashboardPage.tsx` via one `useMemo` each. The existing AI report is demoted to an admin-only secondary feature.

**Tech Stack:** React, TypeScript, Vitest + Testing Library, Tailwind CSS

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/utils/awarenessInsights.ts` | Deterministic insight builder functions |
| Create | `src/utils/awarenessInsights.test.ts` | Unit tests for insight builders |
| Create | `src/components/analytics/AwarenessInsightPanel.tsx` | Expandable insight panel component |
| Create | `src/components/analytics/AwarenessInsightPanel.test.tsx` | Component tests |
| Modify | `src/pages/SubscriberDashboardPage.tsx` | Wire panels into awareness tab (Tasks 3, 4, 5) |

---

## Task 1: Deterministic insight builder functions

**Files:**
- Create: `src/utils/awarenessInsights.ts`
- Create: `src/utils/awarenessInsights.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/awarenessInsights.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  buildAwarenessMetricInsight,
  buildAwarenessFunnelInsight,
  buildAwarenessRankingInsight,
  buildIntentInsight,
  buildAwarenessModuleSummary,
} from './awarenessInsights';
import type { AwarenessReportPayload } from '@/services/aiStrategyAdvisorService';

// ---- buildAwarenessMetricInsight ----------------------------------------

describe('buildAwarenessMetricInsight', () => {
  it('returns null when value is null', () => {
    expect(buildAwarenessMetricInsight({ key: 'top_of_mind', value: null })).toBeNull();
  });

  it('returns null when value is NaN', () => {
    expect(buildAwarenessMetricInsight({ key: 'mom_growth', value: NaN })).toBeNull();
  });

  it('returns null for metrics with no implemented case (e.g. aided_awareness)', () => {
    // aided_awareness has no dedicated branch — returns null
    expect(buildAwarenessMetricInsight({ key: 'aided_awareness', value: 50 })).toBeNull();
  });

  // top_of_mind thresholds
  it('identifies top-of-mind leader tier (>=30)', () => {
    const result = buildAwarenessMetricInsight({ key: 'top_of_mind', value: 35 });
    expect(result).toMatch(/leader/i);
  });

  it('identifies weak top-of-mind (5-9)', () => {
    const result = buildAwarenessMetricInsight({ key: 'top_of_mind', value: 7 });
    expect(result).toMatch(/weak/i);
  });

  // awareness_quality
  it('identifies poor awareness quality (below 10)', () => {
    // High awareness / low top-of-mind → quality < 10
    const result = buildAwarenessMetricInsight({ key: 'awareness_quality', value: 6 });
    expect(result).toMatch(/poor/i);
  });

  it('includes priority action copy for weak quality (10-14)', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_quality', value: 12 });
    expect(result).toMatch(/priority action/i);
  });

  it('identifies excellent awareness quality (>=40)', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_quality', value: 45 });
    expect(result).toMatch(/excellent/i);
  });

  // compare bank
  it('mentions compare bank name when compareValue is provided', () => {
    const result = buildAwarenessMetricInsight({
      key: 'top_of_mind',
      value: 25,
      compareValue: 30,
      compareBankName: 'Equity Bank',
    });
    expect(result).toContain('Equity Bank');
  });

  it('says "ahead" when value > compareValue', () => {
    const result = buildAwarenessMetricInsight({
      key: 'total_awareness',
      value: 75,
      compareValue: 60,
      compareBankName: 'Equity',
    });
    expect(result).toMatch(/ahead/i);
  });

  it('says "behind" when value < compareValue', () => {
    const result = buildAwarenessMetricInsight({
      key: 'total_awareness',
      value: 55,
      compareValue: 70,
      compareBankName: 'Equity',
    });
    expect(result).toMatch(/behind/i);
  });

  it('does not add compare text when compareValue is null', () => {
    const result = buildAwarenessMetricInsight({
      key: 'top_of_mind',
      value: 25,
      compareValue: null,
      compareBankName: 'Equity',
    });
    expect(result).not.toMatch(/ahead|behind|tracking/i);
  });

  // low sample caution
  it('adds caution note when sampleSize < 30', () => {
    const result = buildAwarenessMetricInsight({ key: 'top_of_mind', value: 45, sampleSize: 15 });
    expect(result).toMatch(/caution/i);
  });

  it('does not add caution when sampleSize >= 30', () => {
    const result = buildAwarenessMetricInsight({ key: 'top_of_mind', value: 45, sampleSize: 50 });
    expect(result).not.toMatch(/caution/i);
  });

  // mom_growth (no prior period = null value)
  it('returns null for mom_growth when value is null (no prior period)', () => {
    expect(buildAwarenessMetricInsight({ key: 'mom_growth', value: null })).toBeNull();
  });

  it('describes positive MoM growth', () => {
    const result = buildAwarenessMetricInsight({ key: 'mom_growth', value: 5 });
    expect(result).toMatch(/grew/i);
  });

  it('describes negative MoM growth', () => {
    const result = buildAwarenessMetricInsight({ key: 'mom_growth', value: -3 });
    expect(result).toMatch(/fell/i);
  });

  it('describes awareness_depth_score using thresholds', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_depth_score', value: 65 });
    expect(result).toMatch(/excellent/i);
  });

  it('describes weak awareness_depth_score', () => {
    const result = buildAwarenessMetricInsight({ key: 'awareness_depth_score', value: 10 });
    expect(result).toMatch(/weak/i);
  });
});

// ---- buildAwarenessFunnelInsight ----------------------------------------

describe('buildAwarenessFunnelInsight', () => {
  it('returns null when aware is null', () => {
    expect(buildAwarenessFunnelInsight({ aware: null, spontaneous: 40, topOfMind: 20, aided: 60 })).toBeNull();
  });

  it('returns null when aware is zero', () => {
    expect(buildAwarenessFunnelInsight({ aware: 0, spontaneous: 0, topOfMind: 0, aided: 0 })).toBeNull();
  });

  it('describes strong spontaneous conversion when spontaneous/aware >= 0.6', () => {
    // 52/80 = 0.65
    const result = buildAwarenessFunnelInsight({ aware: 80, spontaneous: 52, topOfMind: 30, aided: 70 });
    expect(result).toMatch(/high/i);
  });

  it('flags low top-of-mind within aware base when topOfMind/aware < 0.1', () => {
    // 6/80 = 0.075
    const result = buildAwarenessFunnelInsight({ aware: 80, spontaneous: 40, topOfMind: 6, aided: 70 });
    expect(result).toMatch(/rarely the first recalled/i);
  });

  it('returns non-null string for valid inputs', () => {
    const result = buildAwarenessFunnelInsight({ aware: 70, spontaneous: 35, topOfMind: 20, aided: 60 });
    expect(typeof result).toBe('string');
    expect(result!.length).toBeGreaterThan(0);
  });
});

// ---- buildAwarenessRankingInsight ----------------------------------------

const rankRows = [
  { bankId: 'EQ_RW', bankName: 'Equity', awareness: 82, topOfMind: 38, rank: 1, movement: 1 },
  { bankId: 'BK_RW', bankName: 'BK',     awareness: 70, topOfMind: 25, rank: 2, movement: -1 },
  { bankId: 'KCB_RW', bankName: 'KCB',   awareness: 55, topOfMind: 15, rank: 3, movement: 0 },
];

describe('buildAwarenessRankingInsight', () => {
  it('returns null when rows is empty', () => {
    expect(buildAwarenessRankingInsight({ rows: [], selectedBankId: 'BK_RW', sampleSize: 100 })).toBeNull();
  });

  it('returns null when selected bank is not in rows', () => {
    expect(buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'UNKNOWN', sampleSize: 100 })).toBeNull();
  });

  it('includes rank number and bank name in output', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'BK_RW', sampleSize: 100 });
    expect(result).toContain('BK');
    expect(result).toMatch(/#2/);
  });

  it('describes rank drop when movement is negative', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'BK_RW', sampleSize: 100 });
    expect(result).toMatch(/dropped/i);
  });

  it('describes rank improvement when movement is positive', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'EQ_RW', sampleSize: 100 });
    expect(result).toMatch(/improved/i);
  });

  it('mentions market leader name when selected bank is not #1', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'BK_RW', sampleSize: 100 });
    expect(result).toContain('Equity');
  });

  it('does not mention leader gap when selected bank is already #1', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'EQ_RW', sampleSize: 100 });
    // Leader should not see "gap to close" text referencing itself
    expect(result).not.toMatch(/gap to close/i);
  });

  it('adds low sample caution when sampleSize < 30', () => {
    const result = buildAwarenessRankingInsight({ rows: rankRows, selectedBankId: 'BK_RW', sampleSize: 20 });
    expect(result).toMatch(/caution/i);
  });
});

// ---- buildIntentInsight --------------------------------------------------

describe('buildIntentInsight', () => {
  it('returns null when responseBase is 0', () => {
    expect(buildIntentInsight({
      averageIntent: 0, highIntentPct: 0, highIntentNonUserPct: 0,
      lowIntentCurrentUserCount: 0, responseBase: 0,
    })).toBeNull();
  });

  it('identifies very high average intent (>= 8)', () => {
    const result = buildIntentInsight({
      averageIntent: 8.5, highIntentPct: 0.70, highIntentNonUserPct: 0.30,
      lowIntentCurrentUserCount: 2, responseBase: 50,
    });
    expect(result).toMatch(/very high/i);
  });

  it('identifies strong acquisition pipeline when highIntentNonUserPct > 0.25', () => {
    const result = buildIntentInsight({
      averageIntent: 7.5, highIntentPct: 0.65, highIntentNonUserPct: 0.45,
      lowIntentCurrentUserCount: 5, responseBase: 80,
    });
    expect(result).toMatch(/acquisition/i);
  });

  it('flags churn risk when lowIntentCurrentUserCount > 10', () => {
    const result = buildIntentInsight({
      averageIntent: 5.2, highIntentPct: 0.40, highIntentNonUserPct: 0.20,
      lowIntentCurrentUserCount: 25, responseBase: 80,
    });
    expect(result).toMatch(/churn/i);
  });

  it('includes moderate acquisition text when highIntentNonUserPct is 0.10-0.25', () => {
    const result = buildIntentInsight({
      averageIntent: 6.0, highIntentPct: 0.45, highIntentNonUserPct: 0.18,
      lowIntentCurrentUserCount: 3, responseBase: 60,
    });
    expect(result).toMatch(/moderate acquisition/i);
  });
});

// ---- buildAwarenessModuleSummary -----------------------------------------

const basePayload: AwarenessReportPayload = {
  reportType: 'awareness_consideration',
  methodologyVersion: '1.0',
  country: 'rwanda',
  period: 'All data',
  bankId: 'BK_RW',
  bankName: 'BK',
  compareBankId: null,
  compareBankName: null,
  filters: {},
  sampleSize: 100,
  topOfMind: 30,
  spontaneous: 55,
  totalAwareness: 80,
  awarenessQuality: 35,
  shareOfVoice: 25,
  awarenessDepthScore: 55,
  awarenessShareIndex: 20,
  momGrowthPct: 2,
  funnelAware: 80,
  funnelSpontaneous: 55,
  funnelTopOfMind: 30,
  funnelAided: 72,
  intent: null,
  rankings: [],
  compareMetrics: null,
};

describe('buildAwarenessModuleSummary', () => {
  it('returns null when totalAwareness is null', () => {
    expect(buildAwarenessModuleSummary({ ...basePayload, totalAwareness: null })).toBeNull();
  });

  it('returns null when sampleSize is 0', () => {
    expect(buildAwarenessModuleSummary({ ...basePayload, sampleSize: 0 })).toBeNull();
  });

  it('identifies salience leader when ToM >= 20 and quality >= 25', () => {
    const result = buildAwarenessModuleSummary({ ...basePayload, topOfMind: 30, awarenessQuality: 35 });
    expect(result).toMatch(/salience leader/i);
  });

  it('identifies recognized-but-forgotten pattern (high awareness, low ToM, weak quality)', () => {
    const result = buildAwarenessModuleSummary({
      ...basePayload, totalAwareness: 80, topOfMind: 8, awarenessQuality: 10,
    });
    expect(result).toMatch(/recognized.{0,5}but.{0,5}forgotten/i);
  });

  it('identifies hidden gem (low awareness, strong top-of-mind)', () => {
    const result = buildAwarenessModuleSummary({
      ...basePayload, totalAwareness: 30, topOfMind: 22, awarenessQuality: 45,
    });
    expect(result).toMatch(/hidden gem/i);
  });

  it('adds small sample note when sampleSize < 50', () => {
    const result = buildAwarenessModuleSummary({
      ...basePayload, sampleSize: 30, topOfMind: 30, awarenessQuality: 35,
    });
    expect(result).toMatch(/small sample/i);
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
npx vitest run src/utils/awarenessInsights.test.ts 2>&1 | tail -20
```

Expected: FAIL with "Cannot find module './awarenessInsights'"

- [ ] **Step 3: Implement insight builders**

Create `src/utils/awarenessInsights.ts`:

```typescript
import type { AwarenessMetricKey } from '@/config/awarenessInsights';
import type { AwarenessReportPayload } from '@/services/aiStrategyAdvisorService';

export interface AwarenessMetricInsightArgs {
  key: AwarenessMetricKey;
  value: number | null;
  compareValue?: number | null;
  compareBankName?: string | null;
  sampleSize?: number;
}

export interface FunnelInsightArgs {
  aware: number | null;
  spontaneous: number | null;
  topOfMind: number | null;
  aided: number | null;
}

export interface RankRow {
  bankId: string;
  bankName: string;
  awareness: number;
  topOfMind: number;
  rank: number;
  movement?: number | null;
}

export interface RankingInsightArgs {
  rows: RankRow[];
  selectedBankId: string;
  sampleSize: number;
}

export interface IntentInsightArgs {
  averageIntent: number;
  highIntentPct: number;
  highIntentNonUserPct: number;
  lowIntentCurrentUserCount: number;
  responseBase: number;
}

const LOW_SAMPLE_THRESHOLD = 30;
const CAUTION = 'Low sample size — interpret with caution.';

function compareLine(value: number, compareName: string, compareVal: number): string {
  const diff = value - compareVal;
  if (Math.abs(diff) < 1) return `Tracking level with ${compareName} (${compareVal.toFixed(1)}%).`;
  return diff > 0
    ? `${diff.toFixed(1)}pp ahead of ${compareName} (${compareVal.toFixed(1)}%).`
    : `${Math.abs(diff).toFixed(1)}pp behind ${compareName} (${compareVal.toFixed(1)}%).`;
}

export function buildAwarenessMetricInsight(args: AwarenessMetricInsightArgs): string | null {
  const { key, value, compareValue, compareBankName, sampleSize } = args;
  if (value === null || !isFinite(value)) return null;

  const parts: string[] = [];

  switch (key) {
    case 'top_of_mind': {
      const desc = value >= 30
        ? 'market leader tier — brands here are 3-5× more likely to be chosen'
        : value >= 20
          ? 'strong salience — roughly 1 in 4 respondents recall this brand first'
          : value >= 10
            ? 'moderate salience — a minority recall this brand first; room to strengthen cues'
            : value >= 5
              ? 'weak salience — the brand rarely leads recall; competitors hold the moment'
              : 'minimal salience — largely absent from unaided consideration sets';
      parts.push(`Top-of-mind at ${value.toFixed(1)}% sits in the ${desc}.`);
      break;
    }
    case 'spontaneous_recall': {
      const desc = value >= 60 ? 'excellent unprompted recall'
        : value >= 40 ? 'good unprompted recall'
        : value >= 20 ? 'moderate unprompted recall'
        : value >= 10 ? 'weak unprompted recall'
        : 'minimal unprompted recall';
      parts.push(`Spontaneous recall at ${value.toFixed(1)}% is ${desc}.`);
      break;
    }
    case 'total_awareness': {
      const desc = value >= 90 ? 'near-universal awareness (dominant)'
        : value >= 70 ? 'a strong awareness footprint'
        : value >= 50 ? 'moderate awareness'
        : value >= 30 ? 'an emerging presence'
        : 'a weak awareness position';
      parts.push(`Total awareness of ${value.toFixed(1)}% indicates ${desc}.`);
      break;
    }
    case 'awareness_quality': {
      const tier = value >= 40 ? 'excellent quality — strong salience depth'
        : value >= 25 ? 'good quality — healthy mind-share'
        : value >= 15 ? 'moderate quality — awareness is present but not deeply anchored'
        : value >= 10 ? 'weak quality — most awareness is passive, not salient'
        : 'poor quality — awareness is shallow; brand is recognized but rarely recalled first';
      parts.push(`Awareness quality at ${value.toFixed(1)}% indicates ${tier}.`);
      if (value < 15) {
        parts.push('Priority action: improve distinctive brand cues to convert recognized awareness into top-of-mind recall.');
      }
      break;
    }
    case 'share_of_voice': {
      const desc = value >= 30 ? 'commanding share of voice — dominant in top-of-mind mentions'
        : value >= 20 ? 'strong share of voice'
        : value >= 10 ? 'moderate share of voice — competitive but not leading'
        : 'a small share of voice — the brand trails in spontaneous market mentions';
      parts.push(`Share of voice at ${value.toFixed(1)}% represents ${desc}.`);
      break;
    }
    case 'mom_growth': {
      if (value > 0) {
        parts.push(`Awareness grew ${value.toFixed(1)}% month-over-month — a positive trajectory.`);
      } else if (value < 0) {
        parts.push(`Awareness fell ${Math.abs(value).toFixed(1)}% month-over-month. Investigate whether this reflects campaign timing or a sustained decline.`);
      } else {
        parts.push('Awareness was flat month-over-month.');
      }
      break;
    }
    case 'awareness_share_index': {
      const desc = value >= 30 ? 'strong relative presence'
        : value >= 15 ? 'competitive presence'
        : 'a relatively small slice of the total market awareness pool';
      parts.push(`Awareness share index of ${value.toFixed(1)}% reflects ${desc}.`);
      break;
    }
    case 'awareness_depth_score': {
      const tier = value >= 60 ? 'excellent depth — awareness is active and choice-relevant'
        : value >= 40 ? 'good depth — awareness carries meaningful salience'
        : value >= 20 ? 'moderate depth — a mix of active and passive recognition'
        : 'weak depth — awareness is largely passive or aided-only';
      parts.push(`Awareness depth score of ${value.toFixed(0)}/100 indicates ${tier}.`);
      break;
    }
    default:
      return null;
  }

  if (compareBankName && compareValue !== null && compareValue !== undefined && isFinite(compareValue)) {
    parts.push(compareLine(value, compareBankName, compareValue));
  }
  if (sampleSize !== undefined && sampleSize < LOW_SAMPLE_THRESHOLD) {
    parts.push(CAUTION);
  }

  return parts.join(' ');
}

export function buildAwarenessFunnelInsight(args: FunnelInsightArgs): string | null {
  const { aware, spontaneous, topOfMind } = args;
  if (aware === null || !isFinite(aware) || aware === 0) return null;

  const parts: string[] = [];

  if (spontaneous !== null && isFinite(spontaneous)) {
    const rate = spontaneous / aware;
    if (rate >= 0.6) {
      parts.push('Spontaneous recall is high relative to total awareness — a strong conversion from recognition to active recall.');
    } else if (rate >= 0.35) {
      parts.push('About one-third of aware respondents recall the brand spontaneously — a healthy but improvable conversion.');
    } else {
      parts.push('Spontaneous recall is low relative to total awareness. Most brand recognition is passive; strengthening distinctive cues could improve salience.');
    }
  }

  if (topOfMind !== null && isFinite(topOfMind)) {
    const tomRate = topOfMind / aware;
    if (tomRate >= 0.3) {
      parts.push('Top-of-mind share is strong within the aware base.');
    } else if (tomRate < 0.1) {
      parts.push('Top-of-mind within aware respondents is low — the brand is known but rarely the first recalled.');
    }
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

export function buildAwarenessRankingInsight(args: RankingInsightArgs): string | null {
  const { rows, selectedBankId, sampleSize } = args;
  if (!rows.length) return null;

  const bankRow = rows.find((r) => r.bankId === selectedBankId);
  if (!bankRow) return null;

  const { rank, bankName, awareness, topOfMind, movement } = bankRow;
  const parts: string[] = [];

  parts.push(`${bankName} ranks #${rank} of ${rows.length} banks by awareness (${awareness}% aware, ${topOfMind}% top-of-mind).`);

  if (movement !== null && movement !== undefined) {
    if (movement > 0) {
      parts.push(`Rank improved by ${movement} position(s) since last period — positive trajectory.`);
    } else if (movement < 0) {
      parts.push(`Rank dropped by ${Math.abs(movement)} position(s) — monitor for continued decline.`);
    } else {
      parts.push('Rank was stable since last period.');
    }
  }

  const leader = rows[0];
  if (leader && leader.bankId !== selectedBankId) {
    const gap = (leader.awareness - awareness).toFixed(0);
    parts.push(`The market leader (${leader.bankName}) holds ${leader.awareness}% awareness — ${gap}pp gap to close.`);
  }

  if (sampleSize < LOW_SAMPLE_THRESHOLD) parts.push(CAUTION);

  return parts.join(' ');
}

export function buildIntentInsight(args: IntentInsightArgs): string | null {
  const { averageIntent, highIntentPct, highIntentNonUserPct, lowIntentCurrentUserCount, responseBase } = args;
  if (responseBase === 0) return null;

  const parts: string[] = [];

  const intentDesc = averageIntent >= 8 ? 'very high'
    : averageIntent >= 6.5 ? 'high'
    : averageIntent >= 5 ? 'moderate'
    : 'low';
  parts.push(`Average intent of ${averageIntent.toFixed(1)}/10 among ${responseBase} aware respondents is ${intentDesc}.`);

  if (highIntentNonUserPct > 0.25) {
    parts.push(`${Math.round(highIntentNonUserPct * 100)}% of non-users show high intent — a strong acquisition pipeline.`);
  } else if (highIntentNonUserPct > 0.10) {
    parts.push(`${Math.round(highIntentNonUserPct * 100)}% of non-users show high intent — a moderate acquisition opportunity worth nurturing.`);
  }

  if (lowIntentCurrentUserCount > 10) {
    parts.push(`${lowIntentCurrentUserCount} current users have low-to-medium intent (≤6), signaling churn risk that warrants retention focus.`);
  } else if (lowIntentCurrentUserCount > 0) {
    parts.push(`${lowIntentCurrentUserCount} current users show low-to-medium intent — a small but real churn risk.`);
  }

  if (highIntentPct < 0.25) {
    parts.push('Overall intent is subdued; consider strategies to elevate consideration among aware non-users.');
  }

  return parts.join(' ');
}

export function buildAwarenessModuleSummary(payload: AwarenessReportPayload): string | null {
  const { topOfMind, totalAwareness, awarenessQuality, sampleSize } = payload;
  if (totalAwareness === null || sampleSize === 0) return null;

  const parts: string[] = [];

  const hasStrongToM = topOfMind !== null && topOfMind >= 20;
  const hasWeakQuality = awarenessQuality !== null && awarenessQuality < 20;
  const hasLowAwareness = totalAwareness < 50;

  if (hasStrongToM && awarenessQuality !== null && awarenessQuality >= 25) {
    parts.push('Strong top-of-mind and solid awareness quality position this brand as a salience leader.');
  } else if (!hasLowAwareness && hasWeakQuality) {
    parts.push('High total awareness with low quality suggests the brand is recognized but not salient — a "recognized-but-forgotten" pattern. Investing in distinctive brand cues should convert passive recognition into active recall.');
  } else if (hasLowAwareness && hasStrongToM) {
    parts.push('A high top-of-mind rate relative to low total awareness signals a "hidden gem" — strong salience among a smaller aware segment. Scaling reach could unlock disproportionate returns.');
  } else if (hasLowAwareness && hasWeakQuality) {
    parts.push('Low total awareness and weak quality indicate fundamental brand building is required before salience work will have impact.');
  }

  if (sampleSize < 50) {
    parts.push('Note: small sample — treat all figures directionally.');
  }

  return parts.length > 0 ? parts.join(' ') : null;
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run src/utils/awarenessInsights.test.ts 2>&1 | tail -20
```

Expected: all tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/utils/awarenessInsights.ts src/utils/awarenessInsights.test.ts
git commit -m "feat: add deterministic awareness insight builder functions"
```

---

## Task 2: AwarenessInsightPanel component

**Files:**
- Create: `src/components/analytics/AwarenessInsightPanel.tsx`
- Create: `src/components/analytics/AwarenessInsightPanel.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/analytics/AwarenessInsightPanel.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AwarenessInsightPanel } from './AwarenessInsightPanel';

describe('AwarenessInsightPanel', () => {
  it('renders nothing when insight is null', () => {
    const { container } = render(<AwarenessInsightPanel insight={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when insight is empty string', () => {
    const { container } = render(<AwarenessInsightPanel insight="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a details element with the insight text', () => {
    render(<AwarenessInsightPanel insight="Market leader tier." />);
    expect(screen.getByText(/Market leader tier/)).toBeInTheDocument();
    expect(document.querySelector('details')).toBeInTheDocument();
  });

  it('uses default label "Analysis"', () => {
    render(<AwarenessInsightPanel insight="Some insight." />);
    // Both the open/closed spans render the label
    const matches = screen.getAllByText('Analysis');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('uses a custom label when provided', () => {
    render(<AwarenessInsightPanel insight="Intent analysis text." label="Intent Analysis" />);
    const matches = screen.getAllByText('Intent Analysis');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renders inside a summary element', () => {
    render(<AwarenessInsightPanel insight="Test." />);
    expect(document.querySelector('summary')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run failing tests**

```bash
npx vitest run src/components/analytics/AwarenessInsightPanel.test.tsx 2>&1 | tail -15
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement the component**

Create `src/components/analytics/AwarenessInsightPanel.tsx`:

```tsx
import React from 'react';

interface AwarenessInsightPanelProps {
  insight: string | null;
  label?: string;
}

export const AwarenessInsightPanel: React.FC<AwarenessInsightPanelProps> = ({
  insight,
  label = 'Analysis',
}) => {
  if (!insight) return null;
  return (
    <details className="group mt-2">
      <summary className="cursor-pointer list-none select-none text-[11px] font-semibold text-slate-400 hover:text-slate-200">
        <span className="group-open:hidden">▸ {label}</span>
        <span className="hidden group-open:inline">▾ {label}</span>
      </summary>
      <div className="mt-2 rounded-lg border border-white/5 bg-slate-900/50 px-3 py-2 text-xs leading-relaxed text-slate-300">
        {insight}
      </div>
    </details>
  );
};
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
npx vitest run src/components/analytics/AwarenessInsightPanel.test.tsx 2>&1 | tail -15
```

Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/AwarenessInsightPanel.tsx src/components/analytics/AwarenessInsightPanel.test.tsx
git commit -m "feat: add AwarenessInsightPanel expandable component"
```

---

## Task 3: Wire metric-level insight panels into awareness card rows

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx`

The awareness tab has two card rows (4 cards each, lines ~2567–2578). Wrap each `<Card>` in a `<div>` with an `<AwarenessInsightPanel>` below it. Compute all 8 metric insights in one `useMemo` before the JSX return.

- [ ] **Step 1: Add imports**

Near the top of `src/pages/SubscriberDashboardPage.tsx`, in the existing analytics imports block, add:

```typescript
import { AwarenessInsightPanel } from '@/components/analytics/AwarenessInsightPanel';
import { buildAwarenessMetricInsight } from '@/utils/awarenessInsights';
```

- [ ] **Step 2: Add awarenessMetricInsights useMemo**

Place this directly after the `awarenessPayload` useMemo (around line 1719), before `heroConfig`:

```typescript
const awarenessMetricInsights = useMemo(() => ({
  topOfMind: buildAwarenessMetricInsight({
    key: 'top_of_mind',
    value: awarenessTopMetrics.topOfMind.value,
    compareValue: compareAwarenessRow?.topOfMind ?? null,
    compareBankName: compareBankName || null,
    sampleSize,
  }),
  spontaneous: buildAwarenessMetricInsight({
    key: 'spontaneous_recall',
    value: awarenessTopMetrics.spontaneous.value,
    sampleSize,
  }),
  totalAwareness: buildAwarenessMetricInsight({
    key: 'total_awareness',
    value: awarenessTopMetrics.awareness.value,
    compareValue: compareAwarenessRow?.awareness ?? null,
    compareBankName: compareBankName || null,
    sampleSize,
  }),
  awarenessQuality: buildAwarenessMetricInsight({
    key: 'awareness_quality',
    value: awarenessTopMetrics.quality.value,
    sampleSize,
  }),
  shareOfVoice: buildAwarenessMetricInsight({
    key: 'share_of_voice',
    value: selectedAwarenessRow?.shareOfVoice ?? null,
    compareValue: compareAwarenessRow?.shareOfVoice ?? null,
    compareBankName: compareBankName || null,
    sampleSize,
  }),
  momGrowth: buildAwarenessMetricInsight({
    key: 'mom_growth',
    value: awarenessMoMGrowthPct,
    sampleSize,
  }),
  awarenessShareIndex: buildAwarenessMetricInsight({
    key: 'awareness_share_index',
    value: awarenessShareIndex,
    sampleSize,
  }),
  awarenessDepthScore: buildAwarenessMetricInsight({
    key: 'awareness_depth_score',
    value: awarenessDepthScore,
    compareValue: compareAwarenessDepthScore,
    compareBankName: compareBankName || null,
    sampleSize,
  }),
}), [
  awarenessTopMetrics, compareAwarenessRow, compareBankName, sampleSize,
  selectedAwarenessRow, awarenessMoMGrowthPct, awarenessShareIndex,
  awarenessDepthScore, compareAwarenessDepthScore,
]);
```

- [ ] **Step 3: Replace the two card-row grids in the awareness tab JSX**

Find the current row 1 grid (around line 2567):
```tsx
              <div className="grid gap-4 md:grid-cols-4">
                <Card title="Top of Mind" metricKey="top_of_mind" variant="primary" value={safePercent(awarenessTopMetrics.topOfMind.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.topOfMind, (value) => safePercent(value)), deltaText(awarenessDeltasView.topOfMind))} delta={compareDelta(awarenessTopMetrics.topOfMind) ?? awarenessDeltasView.topOfMind} sparklineValues={trendView.map((point) => point.topOfMind ?? null)} />
                <Card title="Spontaneous Recall" metricKey="spontaneous_recall" variant="primary" value={safePercent(awarenessTopMetrics.spontaneous.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.spontaneous, (value) => safePercent(value)), deltaText(awarenessDeltasView.spontaneous))} delta={compareDelta(awarenessTopMetrics.spontaneous) ?? awarenessDeltasView.spontaneous} sparklineValues={trendView.map((point) => point.spontaneous ?? null)} />
                <Card title="Total Awareness" metricKey="total_awareness" variant="primary" value={safePercent(awarenessTopMetrics.awareness.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.awareness, (value) => safePercent(value)), deltaText(awarenessDeltasView.awareness))} delta={compareDelta(awarenessTopMetrics.awareness) ?? awarenessDeltasView.awareness} sparklineValues={trendView.map((point) => point.awareness)} />
                <Card title="Awareness Quality" metricKey="awareness_quality" variant="primary" value={safePercent(awarenessTopMetrics.quality.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.quality, (value) => safePercent(value)), `Top-of-Mind / aware · ${deltaText(awarenessDeltasView.quality)}`)} delta={compareDelta(awarenessTopMetrics.quality) ?? awarenessDeltasView.quality} />
              </div>
```

Replace with:
```tsx
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Card title="Top of Mind" metricKey="top_of_mind" variant="primary" value={safePercent(awarenessTopMetrics.topOfMind.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.topOfMind, (value) => safePercent(value)), deltaText(awarenessDeltasView.topOfMind))} delta={compareDelta(awarenessTopMetrics.topOfMind) ?? awarenessDeltasView.topOfMind} sparklineValues={trendView.map((point) => point.topOfMind ?? null)} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.topOfMind} />
                </div>
                <div>
                  <Card title="Spontaneous Recall" metricKey="spontaneous_recall" variant="primary" value={safePercent(awarenessTopMetrics.spontaneous.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.spontaneous, (value) => safePercent(value)), deltaText(awarenessDeltasView.spontaneous))} delta={compareDelta(awarenessTopMetrics.spontaneous) ?? awarenessDeltasView.spontaneous} sparklineValues={trendView.map((point) => point.spontaneous ?? null)} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.spontaneous} />
                </div>
                <div>
                  <Card title="Total Awareness" metricKey="total_awareness" variant="primary" value={safePercent(awarenessTopMetrics.awareness.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.awareness, (value) => safePercent(value)), deltaText(awarenessDeltasView.awareness))} delta={compareDelta(awarenessTopMetrics.awareness) ?? awarenessDeltasView.awareness} sparklineValues={trendView.map((point) => point.awareness)} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.totalAwareness} />
                </div>
                <div>
                  <Card title="Awareness Quality" metricKey="awareness_quality" variant="primary" value={safePercent(awarenessTopMetrics.quality.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.quality, (value) => safePercent(value)), `Top-of-Mind / aware · ${deltaText(awarenessDeltasView.quality)}`)} delta={compareDelta(awarenessTopMetrics.quality) ?? awarenessDeltasView.quality} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.awarenessQuality} />
                </div>
              </div>
```

Find the current row 2 grid (around line 2573):
```tsx
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <Card title="Share of Voice" metricKey="share_of_voice" value={safePercent(selectedAwarenessRow?.shareOfVoice)} subtitle={compareSubtitle(compareBankName, compareAwarenessRow ? safePercent(compareAwarenessRow.shareOfVoice) : null, 'Top-of-Mind share in market')} delta={compareAwarenessRow && isFiniteMetricValue(selectedAwarenessRow?.shareOfVoice) ? selectedAwarenessRow.shareOfVoice - compareAwarenessRow.shareOfVoice : null} />
                <Card title="MoM Growth" metricKey="mom_growth" value={pctGrowthValue(awarenessMoMGrowthPct)} subtitle={pctGrowthText(awarenessMoMGrowthPct)} />
                <Card title="Awareness Share Index" metricKey="awareness_share_index" value={`${awarenessShareIndex}%`} subtitle="Your awareness / total market awareness" />
                <Card title="Awareness Depth Score" metricKey="awareness_depth_score" value={`${awarenessDepthScore}/100`} subtitle={compareSubtitle(compareBankName, compareAwarenessDepthScore === null ? null : `${compareAwarenessDepthScore}/100`, 'Weighted: ToM×3 + Spontaneous×2 + AidedOnly×1')} delta={compareAwarenessDepthScore === null ? null : awarenessDepthScore - compareAwarenessDepthScore} />
              </div>
```

Replace with:
```tsx
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div>
                  <Card title="Share of Voice" metricKey="share_of_voice" value={safePercent(selectedAwarenessRow?.shareOfVoice)} subtitle={compareSubtitle(compareBankName, compareAwarenessRow ? safePercent(compareAwarenessRow.shareOfVoice) : null, 'Top-of-Mind share in market')} delta={compareAwarenessRow && isFiniteMetricValue(selectedAwarenessRow?.shareOfVoice) ? selectedAwarenessRow.shareOfVoice - compareAwarenessRow.shareOfVoice : null} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.shareOfVoice} />
                </div>
                <div>
                  <Card title="MoM Growth" metricKey="mom_growth" value={pctGrowthValue(awarenessMoMGrowthPct)} subtitle={pctGrowthText(awarenessMoMGrowthPct)} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.momGrowth} />
                </div>
                <div>
                  <Card title="Awareness Share Index" metricKey="awareness_share_index" value={`${awarenessShareIndex}%`} subtitle="Your awareness / total market awareness" />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.awarenessShareIndex} />
                </div>
                <div>
                  <Card title="Awareness Depth Score" metricKey="awareness_depth_score" value={`${awarenessDepthScore}/100`} subtitle={compareSubtitle(compareBankName, compareAwarenessDepthScore === null ? null : `${compareAwarenessDepthScore}/100`, 'Weighted: ToM×3 + Spontaneous×2 + AidedOnly×1')} delta={compareAwarenessDepthScore === null ? null : awarenessDepthScore - compareAwarenessDepthScore} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.awarenessDepthScore} />
                </div>
              </div>
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 5: Run smoke test to verify no regressions**

```bash
npx vitest run src/test/subscriberDashboardPage.smoke.test.tsx 2>&1 | tail -15
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: wire metric-level insight panels into awareness card rows"
```

---

## Task 4: Wire section-level insight panels

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx`

Three sections get inline insight panels: Awareness Funnel, Brand Rankings, and Future Intent & Consideration.

- [ ] **Step 1: Add imports to SubscriberDashboardPage.tsx**

Extend the `buildAwarenessMetricInsight` import line added in Task 3 to include the section builders:

```typescript
import {
  buildAwarenessMetricInsight,
  buildAwarenessFunnelInsight,
  buildAwarenessRankingInsight,
  buildIntentInsight,
} from '@/utils/awarenessInsights';
```

- [ ] **Step 2: Add section insight useMemos**

Add after `awarenessMetricInsights` useMemo (around line 1720):

```typescript
const awarenessFunnelInsight = useMemo(() => buildAwarenessFunnelInsight({
  aware: selectedMetricsView?.aware ?? null,
  spontaneous: selectedMetricsView?.spontaneous ?? null,
  topOfMind: selectedMetricsView?.topOfMind ?? null,
  aided: selectedMetricsView?.aided ?? null,
}), [selectedMetricsView]);

const awarenessRankingInsight = useMemo(() => buildAwarenessRankingInsight({
  rows: awarenessRankRows.map((r) => ({
    bankId: r.bankId,
    bankName: r.bankName,
    awareness: r.awareness,
    topOfMind: r.topOfMind,
    rank: r.rank,
    movement: r.movement ?? null,
  })),
  selectedBankId,
  sampleSize,
}), [awarenessRankRows, selectedBankId, sampleSize]);

const awarenessIntentInsight = useMemo(() => intentSummary ? buildIntentInsight({
  averageIntent: intentSummary.averageIntent,
  highIntentPct: intentSummary.highIntentPct,
  highIntentNonUserPct: intentSummary.highIntentNonUserPct,
  lowIntentCurrentUserCount: intentSummary.lowIntentCurrentUserCount,
  responseBase: intentSummary.responseBase,
}) : null, [intentSummary]);
```

- [ ] **Step 3: Add panel to Awareness Funnel section**

Find the funnel section (around line 2580). After the closing `</div>` of `<FunnelSteps ... />`:
```tsx
                  <div className="mt-4">
                    <FunnelSteps ... />
                  </div>
```

Add `<AwarenessInsightPanel>` after the FunnelSteps div, before the closing `</div>` of `dashboard-section`:

```tsx
                  <div className="mt-4">
                    <FunnelSteps
                      steps={[
                        { label: 'Aware', value: selectedMetricsView?.aware || 0, color: ACCENT_PRIMARY },
                        { label: 'Spontaneous', value: selectedMetricsView?.spontaneous || 0, color: '#6A78A8' },
                        { label: 'Top of Mind', value: selectedMetricsView?.topOfMind || 0, color: '#4B8A93' },
                        { label: 'Aided', value: selectedMetricsView?.aided || 0, color: '#4B8A93' },
                      ]}
                    />
                  </div>
                  <AwarenessInsightPanel insight={awarenessFunnelInsight} label="Funnel Analysis" />
```

- [ ] **Step 4: Add panel to Brand Rankings section**

Find the rankings section (around line 2596). After the closing `</div>` of `overflow-auto`:
```tsx
                  <div className="mt-4 overflow-auto">
                    <table ...>...</table>
                  </div>
```

Add `<AwarenessInsightPanel>` after it, before the closing `</div>` of `dashboard-section`:

```tsx
                  <div className="mt-4 overflow-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      ...
                    </table>
                  </div>
                  <AwarenessInsightPanel insight={awarenessRankingInsight} label="Rankings Analysis" />
```

- [ ] **Step 5: Add panel to Future Intent & Consideration section**

Find the Future Intent section (around line 2629). After the MiniBar grid closing `</div>`:
```tsx
                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  <MiniBar ... />
                  ...
                </div>
```

Add `<AwarenessInsightPanel>` after it, before `<AwarenessInsightsReport`:

```tsx
                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  <MiniBar label="Very High (9-10)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.veryHighPct : null} color="bg-emerald-500" />
                  <MiniBar label="High (7-8)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.highPct : null} color="bg-blue-500" />
                  <MiniBar label="Medium (5-6)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.mediumPct : null} color="bg-amber-500" />
                  <MiniBar label="Low (3-4)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.lowPct : null} color="bg-orange-500" />
                  <MiniBar label="Very Low (0-2)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.veryLowPct : null} color="bg-rose-500" />
                </div>
                <AwarenessInsightPanel insight={awarenessIntentInsight} label="Intent Analysis" />
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 7: Run smoke tests**

```bash
npx vitest run src/test/subscriberDashboardPage.smoke.test.tsx src/test/demographicGuardUI.test.tsx 2>&1 | tail -20
```

Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: wire section-level insight panels into funnel, rankings, and intent"
```

---

## Task 5: Reposition AI report as admin-only secondary feature

**Files:**
- Modify: `src/pages/SubscriberDashboardPage.tsx`
- Modify: `src/components/analytics/AwarenessInsightsReport.tsx`

The `<AwarenessInsightsReport>` is currently always rendered at the bottom of the awareness tab. Restrict it to `adminMode` only and visually demote it.

- [ ] **Step 1: Gate AwarenessInsightsReport to adminMode**

In `src/pages/SubscriberDashboardPage.tsx`, find (around line 2648):
```tsx
              <AwarenessInsightsReport awarenessPayload={awarenessPayload} />
```

Replace with:
```tsx
              {adminMode && (
                <div className="mt-6 border-t border-white/5 pt-6">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">AI Analysis (Admin)</p>
                  <AwarenessInsightsReport awarenessPayload={awarenessPayload} />
                </div>
              )}
```

- [ ] **Step 2: Verify demographicGuardUI and smoke tests still pass**

```bash
npx vitest run src/test/subscriberDashboardPage.smoke.test.tsx src/test/demographicGuardUI.test.tsx 2>&1 | tail -20
```

Expected: all pass (the smoke tests use `adminMode`, so the AI report section renders — that's fine).

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run 2>&1 | tail -30
```

Expected: 0 failures. Note down the total count.

- [ ] **Step 4: Commit**

```bash
git add src/pages/SubscriberDashboardPage.tsx
git commit -m "feat: gate AI awareness report to adminMode as secondary feature"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Deterministic insight functions (Task 1): all 5 functions implemented
- ✅ Expandable metric panels on all 8 awareness cards (Task 3)
- ✅ Section-level panels for Funnel, Rankings, Intent (Task 4)
- ✅ AI report demoted to admin-only secondary (Task 5)
- ✅ No formula, aggregate, or BrandEdge score changes (no modifications to existing computation logic)
- ✅ Tests cover: high awareness/low ToM (quality 6%), compare brand, weak quality priority action, null MoM, low sample caution, rankings rank/movement/leader-gap, intent acquisition/churn

**Placeholder scan:** None found.

**Type consistency:**
- `RankRow` defined in Task 1 and used in Task 4's useMemo
- `AwarenessMetricInsightArgs`, `FunnelInsightArgs`, `IntentInsightArgs` all used consistently
- `AwarenessReportPayload` imported from existing `aiStrategyAdvisorService` — already in scope

**Notes for implementer:**
- `awarenessRankRows` items have `.movement` as `number | null` — the useMemo in Task 4 uses `r.movement ?? null` for safety
- `compareAwarenessRow?.shareOfVoice` — `compareAwarenessRow` is typed as the bank's row object; `.shareOfVoice` is a numeric field on it
- The `aided_awareness`, `future_consideration_rate`, `avg_intent`, `high_intent_non_users`, `at_risk_current_users` keys are not given dedicated insight branches — they return `null` which means no panel renders for those cards (only the 8 displayed cards get panels)
