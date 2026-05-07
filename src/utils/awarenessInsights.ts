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
  const { metrics, sampleSize } = payload;
  const { topOfMind, totalAwareness, awarenessQuality } = metrics;

  if (totalAwareness === null || sampleSize === 0) return null;

  const parts: string[] = [];

  const hasStrongToM = topOfMind !== null && topOfMind >= 20;
  const hasWeakQuality = awarenessQuality !== null && awarenessQuality < 20;
  const hasLowAwareness = totalAwareness < 50;

  if (hasLowAwareness && hasStrongToM) {
    parts.push('A high top-of-mind rate relative to low total awareness signals a "hidden gem" — strong salience among a smaller aware segment. Scaling reach could unlock disproportionate returns.');
  } else if (hasStrongToM && awarenessQuality !== null && awarenessQuality >= 25) {
    parts.push('Strong top-of-mind and solid awareness quality position this brand as a salience leader.');
  } else if (!hasLowAwareness && hasWeakQuality) {
    parts.push('High total awareness with low quality suggests the brand is recognized but not salient — a "recognized-but-forgotten" pattern. Investing in distinctive brand cues should convert passive recognition into active recall.');
  } else if (hasLowAwareness && hasWeakQuality) {
    parts.push('Low total awareness and weak quality indicate fundamental brand building is required before salience work will have impact.');
  }

  if (sampleSize < 50) {
    parts.push('Note: small sample — treat all figures directionally.');
  }

  return parts.length > 0 ? parts.join(' ') : null;
}
