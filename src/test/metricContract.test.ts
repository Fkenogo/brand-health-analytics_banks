import { describe, expect, it } from 'vitest';
import { ANALYTICS_BASE_TYPES } from '@/constants';
import { createCompareMetric, createMetric, validateCompareCompatibility } from '@/utils/subscriberDashboard';

describe('metric contract helpers', () => {
  it('creates compatible compare metrics when base and scope align', () => {
    const primary = createMetric({
      value: 50,
      base_n: 40,
      base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      source: 'aggregate',
      metric_family: 'overview',
      scope_signature: 'rwanda|all',
    });
    const compare = createMetric({
      value: 45,
      base_n: 40,
      base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      source: 'raw',
      metric_family: 'overview',
      scope_signature: 'rwanda|all',
    });
    const result = createCompareMetric(primary, compare, { bankId: 'KCB_RW', bankName: 'KCB' });
    expect(result?.valid).toBe(true);
    expect(result?.delta).toBe(5);
  });

  it('rejects compare deltas when base types differ', () => {
    const primary = createMetric({
      value: 50,
      base_n: 22,
      base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS,
      source: 'raw',
      metric_family: 'awareness',
      scope_signature: 'rwanda|all',
    });
    const compare = createMetric({
      value: 40,
      base_n: 34,
      base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      source: 'raw',
      metric_family: 'awareness',
      scope_signature: 'rwanda|all',
    });
    const compatibility = validateCompareCompatibility(primary, compare);
    expect(compatibility.valid).toBe(false);
    expect(compatibility.reasons).toContain('base_type_mismatch');
    const result = createCompareMetric(primary, compare, { bankId: 'EQ_RW', bankName: 'Equity' });
    expect(result?.valid).toBe(false);
    expect(result?.delta).toBeNull();
  });

  it('rejects compare deltas when scope signatures differ', () => {
    const primary = createMetric({
      value: 12,
      base_n: 10,
      base_type: ANALYTICS_BASE_TYPES.CURRENT_USERS,
      source: 'raw',
      metric_family: 'usage_topline',
      scope_signature: 'rwanda|30d',
    });
    const compare = createMetric({
      value: 8,
      base_n: 8,
      base_type: ANALYTICS_BASE_TYPES.CURRENT_USERS,
      source: 'raw',
      metric_family: 'usage_topline',
      scope_signature: 'rwanda|all',
    });
    expect(validateCompareCompatibility(primary, compare).reasons).toContain('scope_mismatch');
  });
});
