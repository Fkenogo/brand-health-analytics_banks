export type DemoBrandEdgeData = {
  country: string;
  awareness: number;
  usage: number;
  loyalty: number;
  multiBankShare: number;
  avgBanksPerCustomer: number;
  primaryBankShare: Record<string, number>;
  switchingRisk: number;
  momentumTrend: number;
  switchingRadarResponses: Array<{
    response_id: string;
    bank_count: number;
    c5_currently_using: string[];
    preferred_bank: string;
  }>;
};

export const demoBrandEdgeData: DemoBrandEdgeData = {
  country: 'Rwanda',
  awareness: 72,
  usage: 41,
  loyalty: 27,
  multiBankShare: 61,
  avgBanksPerCustomer: 2.3,
  primaryBankShare: {
    BK: 34,
    Equity: 22,
    KCB: 19,
    'I&M': 11,
  },
  switchingRisk: 18,
  momentumTrend: 4.2,
  switchingRadarResponses: [
    { response_id: 'r1', bank_count: 2, c5_currently_using: ['BK', 'KCB'], preferred_bank: 'KCB' },
    { response_id: 'r2', bank_count: 2, c5_currently_using: ['BK', 'KCB'], preferred_bank: 'KCB' },
    { response_id: 'r3', bank_count: 2, c5_currently_using: ['BK', 'KCB'], preferred_bank: 'BK' },
    { response_id: 'r4', bank_count: 2, c5_currently_using: ['BK', 'Equity'], preferred_bank: 'Equity' },
    { response_id: 'r5', bank_count: 2, c5_currently_using: ['BK', 'Equity'], preferred_bank: 'Equity' },
    { response_id: 'r6', bank_count: 2, c5_currently_using: ['BK', 'Equity'], preferred_bank: 'BK' },
    { response_id: 'r7', bank_count: 2, c5_currently_using: ['BK', 'I&M'], preferred_bank: 'I&M' },
    { response_id: 'r8', bank_count: 2, c5_currently_using: ['BK', 'I&M'], preferred_bank: 'BK' },
    { response_id: 'r9', bank_count: 3, c5_currently_using: ['BK', 'KCB', 'Equity'], preferred_bank: 'KCB' },
    { response_id: 'r10', bank_count: 3, c5_currently_using: ['BK', 'KCB', 'I&M'], preferred_bank: 'KCB' },
    { response_id: 'r11', bank_count: 3, c5_currently_using: ['BK', 'Equity', 'I&M'], preferred_bank: 'Equity' },
    { response_id: 'r12', bank_count: 3, c5_currently_using: ['BK', 'KCB', 'NCBA'], preferred_bank: 'NCBA' },
    { response_id: 'r13', bank_count: 2, c5_currently_using: ['Equity', 'KCB'], preferred_bank: 'Equity' },
    { response_id: 'r14', bank_count: 2, c5_currently_using: ['Equity', 'I&M'], preferred_bank: 'I&M' },
    { response_id: 'r15', bank_count: 2, c5_currently_using: ['KCB', 'I&M'], preferred_bank: 'KCB' },
    { response_id: 'r16', bank_count: 1, c5_currently_using: ['BK'], preferred_bank: 'BK' },
    { response_id: 'r17', bank_count: 1, c5_currently_using: ['KCB'], preferred_bank: 'KCB' },
    { response_id: 'r18', bank_count: 2, c5_currently_using: ['BK', 'NCBA'], preferred_bank: 'BK' },
    { response_id: 'r19', bank_count: 2, c5_currently_using: ['BK', 'NCBA'], preferred_bank: 'NCBA' },
    { response_id: 'r20', bank_count: 2, c5_currently_using: ['BK', 'KCB'], preferred_bank: 'KCB' },
  ],
};
