const CANONICAL_BANKS_BY_COUNTRY = {
  rwanda: [
    { id: 'BK_RW', name: 'BK' },
    { id: 'IM_RW', name: 'I&M' },
    { id: 'BPR_RW', name: 'BPR' },
    { id: 'ECO_RW', name: 'EcoBank' },
    { id: 'COGE_RW', name: 'Cogebanque' },
    { id: 'ACC_RW', name: 'Access' },
    { id: 'EQU_RW', name: 'Equity' },
    { id: 'BOA_RW', name: 'BOA' },
    { id: 'NCBA_RW', name: 'NCBA' },
    { id: 'GTB_RW', name: 'GTBank' },
    { id: 'KCB_RW', name: 'KCB' },
    { id: 'URW_RW', name: 'Urwego' },
    { id: 'UNG_RW', name: 'Unguka' },
  ],
  uganda: [
    { id: 'ABC_UG', name: 'ABC' },
    { id: 'ABSA_UG', name: 'Absa' },
    { id: 'ACC_UG', name: 'Access' },
    { id: 'AFR_UG', name: 'Afriland' },
    { id: 'BOA_UG', name: 'BOA' },
    { id: 'BAR_UG', name: 'Baroda' },
    { id: 'BOI_UG', name: 'Bank of India' },
    { id: 'CAI_UG', name: 'Cairo' },
    { id: 'CEN_UG', name: 'Centenary' },
    { id: 'CITI_UG', name: 'Citi' },
    { id: 'DFCU_UG', name: 'DFCU' },
    { id: 'DTB_UG', name: 'DTB' },
    { id: 'ECO_UG', name: 'Ecobank' },
    { id: 'EQU_UG', name: 'Equity' },
    { id: 'EXIM_UG', name: 'Exim' },
    { id: 'FIN_UG', name: 'Finance Trust' },
    { id: 'GTB_UG', name: 'GTB' },
    { id: 'HFB_UG', name: 'Housing Finance' },
    { id: 'IM_UG', name: 'I&M' },
    { id: 'KCB_UG', name: 'KCB' },
    { id: 'NCBA_UG', name: 'NCBA' },
    { id: 'OPP_UG', name: 'Opportunity' },
    { id: 'PEARL_UG', name: 'Pearl' },
    { id: 'SAL_UG', name: 'Salaam' },
    { id: 'STB_UG', name: 'Stanbic' },
    { id: 'STAN_UG', name: 'StanChart' },
    { id: 'TROP_UG', name: 'Tropical' },
    { id: 'UBA_UG', name: 'UBA' },
  ],
  burundi: [
    { id: 'KCB_BI', name: 'KCB' },
    { id: 'FIN_BI', name: 'FinBank' },
    { id: 'ECO_BI', name: 'EcoBank' },
    { id: 'CRDB_BI', name: 'CRDB' },
    { id: 'IBB_BI', name: 'Interbank (IBB)' },
    { id: 'BCB_BI', name: 'BCB' },
    { id: 'BAN_BI', name: 'BANCOBU' },
    { id: 'BCAB_BI', name: 'BCAB' },
    { id: 'BGF_BI', name: 'BGF' },
    { id: 'BBCI_BI', name: 'BBCI' },
    { id: 'DTB_BI', name: 'DTB' },
    { id: 'BHB_BI', name: 'BHB' },
    { id: 'BIJE_BI', name: 'BIJE' },
    { id: 'OTH_BI', name: 'Others' },
  ],
};

const normalizeBankDefinitions = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((bank) => ({
      id: String(bank?.id || '').trim(),
      name: String(bank?.name || bank?.label || bank?.id || '').trim(),
    }))
    .filter((bank) => bank.id && bank.name);
};

const mergeBankDefinitions = (...groups) => {
  const merged = new Map();
  groups.flat().forEach((bank) => {
    const id = String(bank?.id || '').trim();
    if (!id) return;
    const existing = merged.get(id);
    const name = String(bank?.name || bank?.label || id).trim() || id;
    if (!existing) {
      merged.set(id, { id, name });
      return;
    }

    if (!existing.name || existing.name === existing.id) {
      merged.set(id, { id, name });
    }
  });
  return Array.from(merged.values());
};

module.exports = {
  CANONICAL_BANKS_BY_COUNTRY,
  normalizeBankDefinitions,
  mergeBankDefinitions,
};
