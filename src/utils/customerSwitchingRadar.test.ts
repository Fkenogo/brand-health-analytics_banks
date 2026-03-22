import { describe, expect, it } from 'vitest';
import { computeCustomerSwitchingRadar, computeSwitchingPressureScore } from '@/utils/customerSwitchingRadar';

type Row = {
  response_id: string;
  bank_count: number;
  c5_currently_using: string[];
  preferred_bank: string;
};

const sampleRows: Row[] = [
  { response_id: '1', bank_count: 2, c5_currently_using: ['a', 'b'], preferred_bank: 'b' },
  { response_id: '2', bank_count: 2, c5_currently_using: ['a', 'c'], preferred_bank: 'c' },
  { response_id: '3', bank_count: 2, c5_currently_using: ['a', 'c'], preferred_bank: 'c' },
  { response_id: '4', bank_count: 2, c5_currently_using: ['a', 'b'], preferred_bank: 'a' },
  { response_id: '5', bank_count: 2, c5_currently_using: ['b', 'c'], preferred_bank: 'c' },
  { response_id: '6', bank_count: 1, c5_currently_using: ['a'], preferred_bank: 'a' },
];

describe('computeSwitchingPressureScore', () => {
  it('uses the weighted formula and rounds to integer', () => {
    expect(computeSwitchingPressureScore(67, 50)).toBe(60);
    expect(computeSwitchingPressureScore(33, 50)).toBe(40);
  });
});

describe('computeCustomerSwitchingRadar', () => {
  it('groups competitors with correct second-choice and overlap shares', () => {
    const result = computeCustomerSwitchingRadar(sampleRows, 'a');

    expect(result.multiBankUsingSelectedBase).toBe(4);
    expect(result.secondChoiceBase).toBe(3);

    expect(result.competitors[0]).toMatchObject({
      competitor: 'c',
      secondChoiceCount: 2,
      secondChoiceShare: 67,
      overlapCount: 2,
      overlapShare: 50,
      switchingPressureScore: 60,
    });

    expect(result.competitors[1]).toMatchObject({
      competitor: 'b',
      secondChoiceCount: 1,
      secondChoiceShare: 33,
      overlapCount: 2,
      overlapShare: 50,
      switchingPressureScore: 40,
    });
  });

  it('returns empty output when selected-bank denominator is zero', () => {
    const result = computeCustomerSwitchingRadar(sampleRows, 'z');

    expect(result.hasData).toBe(false);
    expect(result.emptyReason).toBe('NO_SELECTED_MULTI_BANK_USERS');
    expect(result.multiBankUsingSelectedBase).toBe(0);
    expect(result.secondChoiceBase).toBe(0);
    expect(result.competitors).toHaveLength(0);
  });

  it('filters by selected bank correctly', () => {
    const forA = computeCustomerSwitchingRadar(sampleRows, 'a');
    const forB = computeCustomerSwitchingRadar(sampleRows, 'b');

    expect(forA.multiBankUsingSelectedBase).toBe(4);
    expect(forB.multiBankUsingSelectedBase).toBe(3);
    expect(forA.competitors.map((row) => row.competitor)).toEqual(['c', 'b']);
    expect(forB.competitors.map((row) => row.competitor)).toEqual(['a', 'c']);
  });

  it('keeps ranking deterministic when scores tie', () => {
    const tieRows: Row[] = [
      { response_id: 't1', bank_count: 2, c5_currently_using: ['a', 'x'], preferred_bank: 'a' },
      { response_id: 't2', bank_count: 2, c5_currently_using: ['a', 'y'], preferred_bank: 'a' },
    ];

    const result = computeCustomerSwitchingRadar(tieRows, 'a');

    expect(result.competitors).toHaveLength(2);
    expect(result.competitors[0].switchingPressureScore).toBe(result.competitors[1].switchingPressureScore);
    expect(result.competitors.map((row) => row.competitor)).toEqual(['x', 'y']);
  });
});
