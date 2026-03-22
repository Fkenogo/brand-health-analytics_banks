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

const strengthLabel = (value: number): string => {
  if (value >= 70) return 'strong';
  if (value >= 50) return 'moderate';
  return 'weak';
};

export const summarizeBrandEdgeDrivers = (metrics: BrandEdgeScoreInputs): string => {
  return `Awareness is ${strengthLabel(metrics.awareness)} at ${metrics.awareness}%, loyalty is ${strengthLabel(metrics.loyalty)} at ${metrics.loyalty}%, and switching pressure is ${metrics.switchingRisk}% risk.`;
};
