import { describe, expect, it } from 'vitest';
import { computeBrandEdgeScore, describeBrandEdgeScore } from '@/utils/brandEdgeScore';

describe('computeBrandEdgeScore', () => {
  it('computes weighted score with clamp and round', () => {
    const score = computeBrandEdgeScore({
      awareness: 72,
      usage: 41,
      loyalty: 27,
      primaryShare: 34,
      switchingRisk: 18,
    });
    expect(score).toBe(41);
  });

  it('clamps below zero', () => {
    const score = computeBrandEdgeScore({
      awareness: 0,
      usage: 0,
      loyalty: 0,
      primaryShare: 0,
      switchingRisk: 100,
    });
    expect(score).toBe(0);
  });

  it('clamps above one hundred', () => {
    const score = computeBrandEdgeScore({
      awareness: 100,
      usage: 100,
      loyalty: 100,
      primaryShare: 100,
      switchingRisk: 0,
    });
    expect(score).toBe(90);
  });
});

describe('describeBrandEdgeScore', () => {
  it('returns interpretation label bands', () => {
    expect(describeBrandEdgeScore(85)).toBe('Dominant brand position');
    expect(describeBrandEdgeScore(65)).toBe('Strong but contested');
    expect(describeBrandEdgeScore(50)).toBe('Competitive pressure');
    expect(describeBrandEdgeScore(25)).toBe('Weak market position');
    expect(describeBrandEdgeScore(10)).toBe('Critical risk');
  });
});
