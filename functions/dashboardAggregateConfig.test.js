import { describe, expect, it } from 'vitest';
import {
  CANONICAL_BANKS_BY_COUNTRY,
  normalizeBankDefinitions,
  mergeBankDefinitions,
} from './dashboardAggregateConfig';

describe('dashboard aggregate config helpers', () => {
  it('includes canonical bank ids needed by the dashboard aggregate path', () => {
    expect(CANONICAL_BANKS_BY_COUNTRY.rwanda.some((bank) => bank.id === 'BK_RW')).toBe(true);
    expect(CANONICAL_BANKS_BY_COUNTRY.rwanda.some((bank) => bank.id === 'KCB_RW')).toBe(true);
    expect(CANONICAL_BANKS_BY_COUNTRY.uganda.some((bank) => bank.id === 'STB_UG')).toBe(true);
  });

  it('normalizes bank definitions from mixed bank config shapes', () => {
    expect(normalizeBankDefinitions([
      { id: ' BK_RW ', label: 'Bank of Kigali' },
      { id: 'KCB_RW', name: 'KCB Rwanda' },
      { id: '', name: 'Invalid' },
    ])).toEqual([
      { id: 'BK_RW', name: 'Bank of Kigali' },
      { id: 'KCB_RW', name: 'KCB Rwanda' },
    ]);
  });

  it('merges questionnaire, config, and canonical banks without dropping valid ids', () => {
    const merged = mergeBankDefinitions(
      [{ id: 'BK_RW', name: 'Bank of Kigali' }],
      [{ id: 'KCB_RW', name: 'KCB Rwanda' }],
      CANONICAL_BANKS_BY_COUNTRY.rwanda,
    );

    expect(merged.find((bank) => bank.id === 'BK_RW')?.name).toBe('Bank of Kigali');
    expect(merged.find((bank) => bank.id === 'KCB_RW')?.name).toBe('KCB Rwanda');
    expect(merged.some((bank) => bank.id === 'IM_RW')).toBe(true);
  });
});
