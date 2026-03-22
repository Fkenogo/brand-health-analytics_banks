import { describe, expect, it } from 'vitest';
import { publicDemoModel, getSelectedBankSwitchingRadar } from '@/data/publicDemoModel';

describe('publicDemoModel', () => {
  it('derives public preview metrics from one coherent demo source', () => {
    expect(publicDemoModel.country).toBe('Rwanda');
    expect(publicDemoModel.brandEdgeScore).toBe(41);
    expect(publicDemoModel.brandEdgeLabel).toBe('Competitive pressure');
    expect(publicDemoModel.executiveSnapshot).toMatchObject({
      multiBankShare: 61,
      avgBanksPerCustomer: 2.3,
      primaryBankLeader: 'BK',
      primaryBankLeaderShare: 34,
      topSecondChoiceCompetitor: 'KCB',
      topSecondChoiceShare: 33,
      secondChoicePressureLabel: 'Moderate',
    });
    expect(publicDemoModel.brandEdgePreview).toMatchObject({
      awareness: 72,
      currentUsage: 41,
      loyaltyIndex: 27,
      multiBankShare: 61,
      secondChoicePressureLabel: 'Moderate',
      momentumTrend: 4.2,
    });
    expect(publicDemoModel.scoreTrend).toEqual([
      { quarter: 'Q1', score: 37 },
      { quarter: 'Q2', score: 39 },
      { quarter: 'Q3', score: 41 },
    ]);
  });

  it('keeps selector-driven switching radar on the same demo response sample', () => {
    const forBK = getSelectedBankSwitchingRadar('BK');
    const forKCB = getSelectedBankSwitchingRadar('KCB');
    const forNCBA = getSelectedBankSwitchingRadar('NCBA');

    expect(forBK).toMatchObject({
      selectedBankId: 'BK',
      multiBankUsingSelectedBase: 15,
      secondChoiceBase: 11,
      lowSample: false,
    });
    expect(forBK.competitors[0]).toMatchObject({ competitor: 'KCB', switchingPressureScore: 46 });

    expect(forKCB.selectedBankId).toBe('KCB');
    expect(forKCB.hasData).toBe(true);
    expect(forKCB.multiBankUsingSelectedBase).toBeLessThan(forBK.multiBankUsingSelectedBase);
    expect(forKCB.competitors[0]).toBeDefined();

    expect(forNCBA).toMatchObject({
      selectedBankId: 'NCBA',
      multiBankUsingSelectedBase: 3,
      lowSample: true,
      hasData: true,
    });
    expect(forNCBA.competitors[0]).toBeDefined();
  });
});
