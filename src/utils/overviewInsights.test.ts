import { describe, expect, it } from 'vitest';
import {
  buildExecutivePriorities,
  moduleCardBadge,
  type ExecutivePriorityInput,
} from './overviewInsights';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const healthyInputs: ExecutivePriorityInput = {
  awareness: 70,
  currentUsage: 50,
  retentionRate: 65,
  loyaltyIndex: 60,
  rejectorShare: 10,
  switchingRisk: 15,
  momentumScore: 55,
  winLossRate: 55,
};

const criticalInputs: ExecutivePriorityInput = {
  awareness: 30,
  currentUsage: 15,
  retentionRate: 30,
  loyaltyIndex: 20,
  rejectorShare: 30,
  switchingRisk: 45,
  momentumScore: 20,
  winLossRate: 30,
};

// ─── buildExecutivePriorities ─────────────────────────────────────────────────

describe('buildExecutivePriorities', () => {
  it('returns at most three priorities', () => {
    const result = buildExecutivePriorities(criticalInputs);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('returns an empty array when all metrics are healthy', () => {
    const result = buildExecutivePriorities(healthyInputs);
    expect(result).toHaveLength(0);
  });

  it('marks usage gap as Critical when currentUsage is well below 35%', () => {
    const result = buildExecutivePriorities({ ...healthyInputs, currentUsage: 10 });
    const usagePriority = result.find((p) => p.headline.toLowerCase().includes('convert'));
    expect(usagePriority?.level).toBe('Critical');
  });

  it('marks retention as Critical when retentionRate is well below 55%', () => {
    const result = buildExecutivePriorities({ ...healthyInputs, retentionRate: 20 });
    const retentionPriority = result.find((p) => p.headline.toLowerCase().includes('leakage'));
    expect(retentionPriority?.level).toBe('Critical');
  });

  it('marks switching risk as Critical when switchingRisk is well above 20%', () => {
    const result = buildExecutivePriorities({ ...healthyInputs, switchingRisk: 60 });
    const switchingPriority = result.find((p) => p.headline.toLowerCase().includes('competitor'));
    expect(switchingPriority?.level).toBe('Critical');
  });

  it('marks loyalty as Important when loyaltyIndex is well below 50', () => {
    // gap = 50 - 30 = 20 → score = 20 * 1.5 = 30 → Important
    const result = buildExecutivePriorities({ ...healthyInputs, loyaltyIndex: 30 });
    const loyaltyPriority = result.find((p) => p.headline.toLowerCase().includes('loyalty'));
    expect(loyaltyPriority?.level).toBe('Important');
  });

  it('marks low awareness as Important when awareness is below 45%', () => {
    const result = buildExecutivePriorities({ ...healthyInputs, awareness: 30 });
    const awarePriority = result.find((p) => p.headline.toLowerCase().includes('brand presence'));
    expect(awarePriority).toBeDefined();
  });

  it('does not include awareness priority when awareness is above 45%', () => {
    const result = buildExecutivePriorities({ ...healthyInputs, awareness: 60 });
    const awarePriority = result.find((p) => p.headline.toLowerCase().includes('brand presence'));
    expect(awarePriority).toBeUndefined();
  });

  it('does not include win/loss pressure when winLossRate is null', () => {
    const result = buildExecutivePriorities({ ...criticalInputs, winLossRate: null });
    const winLossPriority = result.find((p) => p.headline.toLowerCase().includes('competitive pressure'));
    expect(winLossPriority).toBeUndefined();
  });

  it('includes a supporting metric value for each returned priority', () => {
    const result = buildExecutivePriorities(criticalInputs);
    result.forEach((p) => {
      expect(p.metricLabel.length).toBeGreaterThan(0);
      expect(p.metricValue.length).toBeGreaterThan(0);
    });
  });

  it('orders by severity — highest score first', () => {
    // Usage gap (15pp below 35 → score = 60) should beat loyalty gap (10pp below 50 → score = 15)
    const result = buildExecutivePriorities({
      ...healthyInputs,
      currentUsage: 20,   // 15pp gap
      loyaltyIndex: 40,   // 10pp gap
    });
    const usageIdx = result.findIndex((p) => p.headline.toLowerCase().includes('convert'));
    const loyaltyIdx = result.findIndex((p) => p.headline.toLowerCase().includes('loyalty'));
    if (usageIdx !== -1 && loyaltyIdx !== -1) {
      expect(usageIdx).toBeLessThan(loyaltyIdx);
    }
  });

  it('handles all-null inputs without crashing', () => {
    const result = buildExecutivePriorities({
      awareness: null,
      currentUsage: null,
      retentionRate: null,
      loyaltyIndex: null,
      rejectorShare: null,
      switchingRisk: 0,
      momentumScore: null,
      winLossRate: null,
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it('assigns Watch for mild issues', () => {
    // momentumScore = 40 → gap = 5 → score = 7.5 → Watch
    const result = buildExecutivePriorities({ ...healthyInputs, momentumScore: 40 });
    const momentumPriority = result.find((p) => p.headline.toLowerCase().includes('momentum'));
    if (momentumPriority) {
      expect(momentumPriority.level).toBe('Watch');
    }
  });
});

// ─── moduleCardBadge ──────────────────────────────────────────────────────────

describe('moduleCardBadge', () => {
  it('returns Highest Priority for negative with high severity', () => {
    expect(moduleCardBadge('negative', true)).toBe('Highest Priority');
  });

  it('returns Priority for negative without high severity', () => {
    expect(moduleCardBadge('negative', false)).toBe('Priority');
  });

  it('returns Monitor for neutral tone', () => {
    expect(moduleCardBadge('neutral')).toBe('Monitor');
  });

  it('returns Monitor for positive tone', () => {
    expect(moduleCardBadge('positive')).toBe('Monitor');
  });
});
