export interface BrandEdgeScoreInputs {
  awareness: number;
  usage: number;
  loyalty: number;
  primaryShare: number;
  switchingRisk: number;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const round = (value: number): number => Math.round(value);

export const computeBrandEdgeScore = (metrics: BrandEdgeScoreInputs): number => {
  const score =
    metrics.awareness * 0.3 +
    metrics.usage * 0.3 +
    metrics.loyalty * 0.2 +
    metrics.primaryShare * 0.1 -
    metrics.switchingRisk * 0.1;

  return clamp(round(score), 0, 100);
};

export const describeBrandEdgeScore = (score: number): string => {
  if (score >= 80) return 'Dominant brand position';
  if (score >= 60) return 'Strong but contested';
  if (score >= 40) return 'Competitive pressure';
  if (score >= 20) return 'Weak market position';
  return 'Critical risk';
};

export const summarizeBrandEdgeDrivers = (metrics: BrandEdgeScoreInputs): string => {
  // ── Sentence 1: awareness context ──────────────────────────────────────────
  // Awareness is the most visible metric. If it is strong, say so clearly so
  // the reader knows reach is not the issue.  If it is weak, flag it early.
  const awarenessSentence =
    metrics.awareness >= 60
      ? 'The brand is well known in the market and awareness is not the primary challenge.'
      : metrics.awareness >= 40
      ? 'The brand has moderate market reach, though there is room to grow the awareness base.'
      : `Brand awareness is limited, which constrains all downstream metrics.`;

  // ── Sentence 2: main opportunity ────────────────────────────────────────────
  // Identify which positive components fall below 50 (a reasonable threshold
  // for "below healthy").  Name the most commercially significant ones.
  const belowThreshold = (
    [
      { label: 'usage', value: metrics.usage },
      { label: 'loyalty', value: metrics.loyalty },
      { label: 'primary bank share', value: metrics.primaryShare },
    ] as const
  ).filter((c) => c.value < 50);

  let opportunitySentence: string;
  if (belowThreshold.length === 0) {
    opportunitySentence =
      'All core components are performing above average, giving the brand a solid platform.';
  } else if (belowThreshold.length === 1) {
    const weak = belowThreshold[0];
    opportunitySentence = `The largest opportunity is improving ${weak.label} to push the score higher.`;
  } else {
    const named = belowThreshold
      .slice(0, 2)
      .map((c) => c.label)
      .join(' and ');
    opportunitySentence = `The largest opportunity lies in improving ${named}, both of which are below the level needed for a higher score.`;
  }

  // ── Sentence 3 (optional): switching risk ──────────────────────────────────
  const riskSentence =
    metrics.switchingRisk > 20
      ? ` Competitive switching pressure at ${metrics.switchingRisk}% is also adding downward weight to the score.`
      : '';

  return `${awarenessSentence} ${opportunitySentence}${riskSentence}`.trim();
};
