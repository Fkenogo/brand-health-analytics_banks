import { describe, expect, it } from 'vitest';
import { computeBrandEdgeScore, describeBrandEdgeScore, summarizeBrandEdgeDrivers } from '@/utils/brandEdgeScore';

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

describe('summarizeBrandEdgeDrivers', () => {
  it('opens with a positive awareness framing when awareness >= 60%', () => {
    const text = summarizeBrandEdgeDrivers({
      awareness: 72, usage: 41, loyalty: 27, primaryShare: 34, switchingRisk: 18,
    });
    expect(text).toMatch(/well known/i);
    expect(text).toMatch(/awareness is not the primary challenge/i);
  });

  it('flags limited awareness when awareness < 40%', () => {
    const text = summarizeBrandEdgeDrivers({
      awareness: 30, usage: 55, loyalty: 55, primaryShare: 55, switchingRisk: 5,
    });
    expect(text).toMatch(/limited/i);
  });

  it('names the weakest component(s) as the main opportunity', () => {
    const text = summarizeBrandEdgeDrivers({
      awareness: 72, usage: 41, loyalty: 27, primaryShare: 34, switchingRisk: 18,
    });
    // Usage and loyalty are both below 50 and should be named
    expect(text).toMatch(/usage/i);
    expect(text).toMatch(/loyalty/i);
  });

  it('includes switching risk language when switchingRisk > 20%', () => {
    const text = summarizeBrandEdgeDrivers({
      awareness: 80, usage: 60, loyalty: 55, primaryShare: 52, switchingRisk: 30,
    });
    expect(text).toMatch(/switching/i);
    expect(text).toMatch(/30%/);
  });

  it('does not mention switching when switchingRisk <= 20%', () => {
    const text = summarizeBrandEdgeDrivers({
      awareness: 72, usage: 41, loyalty: 27, primaryShare: 34, switchingRisk: 18,
    });
    expect(text).not.toMatch(/switching/i);
  });

  it('gives a solid-platform sentence when all components are above 50%', () => {
    const text = summarizeBrandEdgeDrivers({
      awareness: 70, usage: 65, loyalty: 55, primaryShare: 52, switchingRisk: 10,
    });
    expect(text).toMatch(/solid platform/i);
  });

  it('returns a non-empty string for all-zero inputs', () => {
    const text = summarizeBrandEdgeDrivers({
      awareness: 0, usage: 0, loyalty: 0, primaryShare: 0, switchingRisk: 0,
    });
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('names only one component when exactly one falls below threshold', () => {
    // Only usage (40) is below 50; loyalty and primaryShare are above
    const text = summarizeBrandEdgeDrivers({
      awareness: 70, usage: 40, loyalty: 60, primaryShare: 55, switchingRisk: 10,
    });
    expect(text).toMatch(/improving usage/i);
  });
});
