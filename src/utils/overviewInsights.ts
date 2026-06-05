/**
 * Overview executive priorities — display-only prioritisation logic.
 *
 * No metric formulas are computed here.  All inputs are pre-computed values
 * passed in from existing dashboard diagnostics.
 */

export type PriorityLevel = 'Critical' | 'Important' | 'Watch';

export interface ExecutivePriorityInput {
  /** Total awareness as a percentage (0–100). */
  awareness: number | null;
  /** Percentage of aware respondents currently using the bank (0–100). */
  currentUsage: number | null;
  /** Percentage of ever-used customers still active (0–100). */
  retentionRate: number | null;
  /** Loyalty index score (0–100). */
  loyaltyIndex: number | null;
  /** Percentage of aware respondents who are rejectors (0–100). */
  rejectorShare: number | null;
  /** Estimated churn / competitive switching risk percentage (0–100). */
  switchingRisk: number;
  /** Composite momentum score (0–100). */
  momentumScore: number | null;
  /** Overall win/loss rate as a percentage (0–100). null when unavailable. */
  winLossRate: number | null;
}

export interface ExecutivePriority {
  level: PriorityLevel;
  /** Short action-oriented headline. */
  headline: string;
  /** One plain-language sentence explaining commercial relevance. */
  whyItMatters: string;
  /** Display label for the supporting metric. */
  metricLabel: string;
  /** Pre-formatted metric value, e.g. "24%" or "30". */
  metricValue: string;
}

// ─── Module-card priority badge ────────────────────────────────────────────────

export type ModulePriorityBadge = 'Highest Priority' | 'Priority' | 'Monitor';

/**
 * Map a (statusTone, severity) pair to a badge label.
 *
 * @param tone       Card status tone from existing diagnostics.
 * @param highSeverity  True when the negative condition is especially severe
 *                      (e.g. critical pattern label vs. mildly below threshold).
 */
export function moduleCardBadge(
  tone: 'positive' | 'neutral' | 'negative',
  highSeverity = false,
): ModulePriorityBadge {
  if (tone === 'negative') return highSeverity ? 'Highest Priority' : 'Priority';
  if (tone === 'neutral') return 'Monitor';
  return 'Monitor';
}

// ─── Executive priority builder ────────────────────────────────────────────────

interface Candidate {
  score: number;   // higher = more urgent; 0 = inactive
  priority: ExecutivePriority;
}

function val(v: number | null, fallback = 0): number {
  return v ?? fallback;
}

/**
 * Build up to three executive priorities from pre-computed diagnostic values.
 *
 * Ranking algorithm:
 *   Each issue is given a severity score (0–100) based on how far the metric
 *   falls from a healthy reference point.  The top three issues by score are
 *   returned.  Priority level is then assigned:
 *     score >= 60  → Critical
 *     score >= 30  → Important
 *     score >  0   → Watch
 *
 * No new calculations are performed — only existing values are read.
 */
export function buildExecutivePriorities(
  inputs: ExecutivePriorityInput,
): ExecutivePriority[] {
  const candidates: Candidate[] = [];

  // ── 1. Awareness-to-usage conversion gap ──────────────────────────────────
  // Healthy reference: current usage >= 35% of aware respondents.
  const usageGap = 35 - val(inputs.currentUsage);
  if (usageGap > 0) {
    candidates.push({
      score: Math.min(100, usageGap * 3),
      priority: {
        level: 'Critical',
        headline: 'Convert awareness into active customers',
        whyItMatters:
          'Many people who know the brand are not using it. Converting this pool is the highest-impact path to growth.',
        metricLabel: 'Current Usage',
        metricValue: inputs.currentUsage !== null ? `${inputs.currentUsage}%` : '--',
      },
    });
  }

  // ── 2. Retention / leakage ─────────────────────────────────────────────────
  // Healthy reference: retention >= 55%.
  const retentionGap = 55 - val(inputs.retentionRate);
  if (retentionGap > 0) {
    candidates.push({
      score: Math.min(100, retentionGap * 2),
      priority: {
        level: 'Critical',
        headline: 'Reduce customer leakage',
        whyItMatters:
          'A large portion of people who have tried the bank are no longer active. Improving retention has immediate revenue impact.',
        metricLabel: 'Retention Rate',
        metricValue: inputs.retentionRate !== null ? `${inputs.retentionRate}%` : '--',
      },
    });
  }

  // ── 3. Competitive switching risk ─────────────────────────────────────────
  // Activates when switching risk exceeds 20%.
  const switchingExcess = val(inputs.switchingRisk) - 20;
  if (switchingExcess > 0) {
    candidates.push({
      score: Math.min(100, switchingExcess * 2.5),
      priority: {
        level: 'Critical',
        headline: 'Defend against competitor switching',
        whyItMatters:
          'A meaningful share of current customers are at risk of moving to a competitor, which directly reduces the score.',
        metricLabel: 'Switching Risk',
        metricValue: `${inputs.switchingRisk}%`,
      },
    });
  }

  // ── 4. Loyalty weakness ────────────────────────────────────────────────────
  // Healthy reference: loyalty index >= 50.
  const loyaltyGap = 50 - val(inputs.loyaltyIndex);
  if (loyaltyGap > 0) {
    candidates.push({
      score: Math.min(100, loyaltyGap * 1.5),
      priority: {
        level: 'Important',
        headline: 'Strengthen customer loyalty',
        whyItMatters:
          'The loyalty base is below average, with few customers firmly committed to the brand over alternatives.',
        metricLabel: 'Loyalty Index',
        metricValue: inputs.loyaltyIndex !== null ? String(inputs.loyaltyIndex) : '--',
      },
    });
  }

  // ── 5. High rejector share ─────────────────────────────────────────────────
  // Activates when rejector share exceeds 15%.
  const rejectorExcess = val(inputs.rejectorShare) - 15;
  if (rejectorExcess > 0) {
    candidates.push({
      score: Math.min(100, rejectorExcess * 2.5),
      priority: {
        level: 'Important',
        headline: 'Reduce the detractor share',
        whyItMatters:
          'A high share of aware respondents actively reject the brand, dragging down NPS and the loyalty index.',
        metricLabel: 'Rejectors',
        metricValue: inputs.rejectorShare !== null ? `${inputs.rejectorShare}%` : '--',
      },
    });
  }

  // ── 6. Low awareness ────────────────────────────────────────────────────────
  // Activates only when awareness is below 45% — a genuine reach deficit.
  const awarenessGap = 45 - val(inputs.awareness);
  if (awarenessGap > 0) {
    candidates.push({
      score: Math.min(100, awarenessGap * 2),
      priority: {
        level: 'Important',
        headline: 'Build brand presence',
        whyItMatters:
          'The brand reaches fewer than half the market, limiting the pool of potential customers for all downstream metrics.',
        metricLabel: 'Awareness',
        metricValue: inputs.awareness !== null ? `${inputs.awareness}%` : '--',
      },
    });
  }

  // ── 7. Momentum weakness ───────────────────────────────────────────────────
  // Healthy reference: momentum score >= 45.
  const momentumGap = 45 - val(inputs.momentumScore);
  if (momentumGap > 0) {
    candidates.push({
      score: Math.min(100, momentumGap * 1.5),
      priority: {
        level: 'Watch',
        headline: 'Restore brand momentum',
        whyItMatters:
          'The brand momentum score is below the level expected for sustained growth — improvement across multiple components is needed.',
        metricLabel: 'Momentum Score',
        metricValue: inputs.momentumScore !== null ? String(inputs.momentumScore) : '--',
      },
    });
  }

  // ── 8. Win/loss pressure ───────────────────────────────────────────────────
  // Activates when the brand wins fewer than 50% of competitive encounters.
  const winLossGap = 50 - val(inputs.winLossRate);
  if (winLossGap > 0 && inputs.winLossRate !== null) {
    candidates.push({
      score: Math.min(100, winLossGap * 1.5),
      priority: {
        level: 'Watch',
        headline: 'Address competitive pressure',
        whyItMatters:
          'The brand is losing more competitive encounters than it wins, which may accelerate market share loss over time.',
        metricLabel: 'Win Rate',
        metricValue: `${inputs.winLossRate}%`,
      },
    });
  }

  // Sort by urgency, take the top three, assign final level from score.
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => ({
      ...c.priority,
      level: c.score >= 60 ? 'Critical' : c.score >= 30 ? 'Important' : 'Watch',
    }));
}
