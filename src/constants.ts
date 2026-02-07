import { Bank, Choice, Question, Localized, CountryCode } from './types';

export interface CountryTheme {
  primary: string;
  secondary: string;
  accent: string;
  name: string;
  title: Localized;
}

export const COUNTRY_THEMES: Record<CountryCode, CountryTheme> = {
  rwanda: {
    primary: '#3B82F6',
    secondary: '#FACC15',
    accent: '#22C55E',
    name: 'Rwanda',
    title: {
      en: 'Rwanda Bank Brand Health Dashboard',
      rw: 'Imiterere y\'ibigo bya banki mu Rwanda',
      fr: 'Tableau de bord de la santé des marques bancaires au Rwanda'
    }
  },
  uganda: {
    primary: '#000000',
    secondary: '#FACC15',
    accent: '#EF4444',
    name: 'Uganda',
    title: {
      en: 'Uganda Bank Brand Health Dashboard',
      rw: 'Imiterere y\'ibigo bya banki muri Uganda',
      fr: 'Tableau de bord de la santé des marques bancaires en Ouganda'
    }
  },
  burundi: {
    primary: '#EF4444',
    secondary: '#22C55E',
    accent: '#FFFFFF',
    name: 'Burundi',
    title: {
      en: 'Burundi Bank Brand Health Dashboard',
      rw: 'Imiterere y\'ibigo bya banki mu Burundi',
      fr: 'Tableau de bord de la santé des marques bancaires au Burundi'
    }
  }
};

export const ALL_BANKS: Bank[] = [
  // Rwanda (13 banks)
  { id: 'BK_RW', name: 'BK', country: 'rwanda' },
  { id: 'IM_RW', name: 'I&M', country: 'rwanda' },
  { id: 'BPR_RW', name: 'BPR', country: 'rwanda' },
  { id: 'ECO_RW', name: 'EcoBank', country: 'rwanda' },
  { id: 'COGE_RW', name: 'Cogebanque', country: 'rwanda' },
  { id: 'ACC_RW', name: 'Access', country: 'rwanda' },
  { id: 'EQU_RW', name: 'Equity', country: 'rwanda' },
  { id: 'BOA_RW', name: 'BOA', country: 'rwanda' },
  { id: 'NCBA_RW', name: 'NCBA', country: 'rwanda' },
  { id: 'GTB_RW', name: 'GTBank', country: 'rwanda' },
  { id: 'KCB_RW', name: 'KCB', country: 'rwanda' },
  { id: 'URW_RW', name: 'Urwego', country: 'rwanda' },
  { id: 'UNG_RW', name: 'Unguka', country: 'rwanda' },
  
  // Uganda (28 banks)
  { id: 'ABC_UG', name: 'ABC', country: 'uganda' },
  { id: 'ABSA_UG', name: 'Absa', country: 'uganda' },
  { id: 'ACC_UG', name: 'Access', country: 'uganda' },
  { id: 'AFR_UG', name: 'Afriland', country: 'uganda' },
  { id: 'BOA_UG', name: 'BOA', country: 'uganda' },
  { id: 'BAR_UG', name: 'Baroda', country: 'uganda' },
  { id: 'BOI_UG', name: 'Bank of India', country: 'uganda' },
  { id: 'CAI_UG', name: 'Cairo', country: 'uganda' },
  { id: 'CEN_UG', name: 'Centenary', country: 'uganda' },
  { id: 'CITI_UG', name: 'Citi', country: 'uganda' },
  { id: 'DFCU_UG', name: 'DFCU', country: 'uganda' },
  { id: 'DTB_UG', name: 'DTB', country: 'uganda' },
  { id: 'ECO_UG', name: 'Ecobank', country: 'uganda' },
  { id: 'EQU_UG', name: 'Equity', country: 'uganda' },
  { id: 'EXIM_UG', name: 'Exim', country: 'uganda' },
  { id: 'FIN_UG', name: 'Finance Trust', country: 'uganda' },
  { id: 'GTB_UG', name: 'GTB', country: 'uganda' },
  { id: 'HFB_UG', name: 'Housing Finance', country: 'uganda' },
  { id: 'IM_UG', name: 'I&M', country: 'uganda' },
  { id: 'KCB_UG', name: 'KCB', country: 'uganda' },
  { id: 'NCBA_UG', name: 'NCBA', country: 'uganda' },
  { id: 'OPP_UG', name: 'Opportunity', country: 'uganda' },
  { id: 'PEARL_UG', name: 'Pearl', country: 'uganda' },
  { id: 'SAL_UG', name: 'Salaam', country: 'uganda' },
  { id: 'STB_UG', name: 'Stanbic', country: 'uganda' },
  { id: 'STAN_UG', name: 'StanChart', country: 'uganda' },
  { id: 'TROP_UG', name: 'Tropical', country: 'uganda' },
  { id: 'UBA_UG', name: 'UBA', country: 'uganda' },
  
  // Burundi (14 banks)
  { id: 'KCB_BI', name: 'KCB', country: 'burundi' },
  { id: 'FIN_BI', name: 'FinBank', country: 'burundi' },
  { id: 'ECO_BI', name: 'EcoBank', country: 'burundi' },
  { id: 'CRDB_BI', name: 'CRDB', country: 'burundi' },
  { id: 'IBB_BI', name: 'Interbank (IBB)', country: 'burundi' },
  { id: 'BCB_BI', name: 'BCB', country: 'burundi' },
  { id: 'BAN_BI', name: 'BANCOBU', country: 'burundi' },
  { id: 'BCAB_BI', name: 'BCAB', country: 'burundi' },
  { id: 'BGF_BI', name: 'BGF', country: 'burundi' },
  { id: 'BBCI_BI', name: 'BBCI', country: 'burundi' },
  { id: 'DTB_BI', name: 'DTB', country: 'burundi' },
  { id: 'BHB_BI', name: 'BHB', country: 'burundi' },
  { id: 'BIJE_BI', name: 'BIJE', country: 'burundi' },
  { id: 'OTH_BI', name: 'Others', country: 'burundi' }
];

export const getBankChoicesByCountry = (country?: CountryCode): Choice[] => {
  if (!country) return [];
  return ALL_BANKS
    .filter(b => b.country === country)
    .map(b => ({ label: { en: b.name, rw: b.name, fr: b.name }, value: b.id }));
};

export const getBankChoicesWithNone = (country?: CountryCode): Choice[] => {
  const banks = getBankChoicesByCountry(country);
  return [
    ...banks,
    { label: { en: 'None', rw: 'Ntayo', fr: 'Aucune' }, value: 'none' }
  ];
};

export const getBankChoicesWithExtras = (country?: CountryCode): Choice[] => {
  const banks = getBankChoicesByCountry(country);
  return [
    ...banks,
    { label: { en: 'None', rw: 'Ntayo', fr: 'Aucune' }, value: 'none' },
    { label: { en: "Don't Know", rw: 'Simbizi', fr: 'Je ne sais pas' }, value: 'dont_know' }
  ];
};

export const getAwareBanksChoices = (data: any): Choice[] => {
  if (!data.selected_country || !data.c3_aware_banks) return [];
  const allBanks = getBankChoicesByCountry(data.selected_country);
  const aware = new Set<string>(data.c3_aware_banks || []);
  return allBanks.filter(b => aware.has(b.value));
};

export const getAwareBanksWithNone = (data: any): Choice[] => {
  const banks = getAwareBanksChoices(data);
  return [
    ...banks,
    { label: { en: 'None', rw: 'Ntayo', fr: 'Aucune' }, value: 'none' }
  ];
};

export const getAwareBanksWithExtras = (data: any): Choice[] => {
  const banks = getAwareBanksChoices(data);
  return [
    ...banks,
    { label: { en: 'None', rw: 'Ntayo', fr: 'Aucune' }, value: 'none' },
    { label: { en: "Don't Know", rw: 'Simbizi', fr: 'Je ne sais pas' }, value: 'dont_know' }
  ];
};

export const getEverUsedBanksChoices = (data: any): Choice[] => {
  if (!data.selected_country || !data.c4_ever_used) return [];
  const allBanks = getBankChoicesByCountry(data.selected_country);
  const everUsed = new Set<string>(data.c4_ever_used || []);
  return allBanks.filter(b => everUsed.has(b.value));
};

export const getCurrentlyUsingBanksChoices = (data: any): Choice[] => {
  if (!data.selected_country || !data.c5_currently_using) return [];
  const allBanks = getBankChoicesByCountry(data.selected_country);
  const currentlyUsing = new Set<string>(data.c5_currently_using || []);
  return allBanks.filter(b => currentlyUsing.has(b.value));
};

export const COUNTRY_CHOICES: Choice[] = [
  { label: { en: 'Rwanda', rw: 'u Rwanda', fr: 'Rwanda' }, value: 'rwanda' },
  { label: { en: 'Uganda', rw: 'u Bugande', fr: 'Ouganda' }, value: 'uganda' },
  { label: { en: 'Burundi', rw: 'u Burundi', fr: 'Burundi' }, value: 'burundi' }
];

export const UI_STRINGS = {
  adminPortal: { en: 'Admin Portal', rw: "Ibiro by'Ubuyobozi", fr: 'Portail Admin' },
  back: { en: 'Back', rw: 'Subira inyuma', fr: 'Retour' },
  continue: { en: 'Continue', rw: 'Komeza', fr: 'Continuer' },
  complete: { en: 'Complete Survey', rw: 'Rangiza Ubushakashatsi', fr: 'Terminer' },
  murakoze: { en: 'Thank you!', rw: 'Murakoze!', fr: 'Merci !' },
  selectOption: { en: 'Select an option...', rw: 'Hitamo rimwe...', fr: 'Sélectionnez...' },
  typeAnswer: { en: 'Type your answer here...', rw: 'Andika igisubizo hano...', fr: 'Tapez votre réponse...' },
  successMessage: { 
    en: 'Thank you for participating! Your feedback helps improve banking services.', 
    rw: 'Murakoze cyane! Ibitekerezo byanyu ni ingenzi mu gushyigikira serivisi za banki.',
    fr: 'Merci de votre participation ! Vos commentaires aident à améliorer les services.'
  },
  admin: {
    dashboardTitle: { en: 'Brand Health Tracker', rw: 'Isesengura ry\'Ibirango', fr: 'Suivi de Santé de Marque' },
    industry: { en: 'Banking Industry', rw: 'Isesengura rya Banki', fr: 'Secteur Bancaire' },
    filters: { en: 'Filters', rw: 'Muyunguruzi', fr: 'Filtres' },
    exportReport: { en: 'Export Report', rw: 'Raporo ya CSV', fr: 'Exporter le Rapport' },
    updatedLabel: { en: 'Updated', rw: 'Iheruka', fr: 'Mis à jour' },
    scope: { en: 'Market Data Scope', rw: 'Igipimo cy\'isoko', fr: 'Périmètre des données' },
    liveIntelligence: { en: 'Live Dashboard', rw: 'Amakuru y\'ako kanya', fr: 'Tableau de bord' },
    csvReport: { en: 'Export CSV', rw: 'Kuramo CSV', fr: 'Exporter CSV' },
    authTitle: { en: 'Admin Access', rw: 'Kwinjira', fr: 'Accès Admin' },
    authDesc: { en: 'Enter administrator password', rw: 'Andika ijambo ry\'ibanga', fr: 'Entrez le mot de passe' },
    authBtn: { en: 'Authenticate', rw: 'Kwinjira', fr: 'S\'authentifier' },
    vsPrev: { en: 'vs Prev Quarter', rw: 'ugereranyije na mbere', fr: 'vs Trimestre Précédent' },
    loyaltyDist: { en: 'Loyalty Distribution', rw: 'Isesengura ry\'ubudahemuka', fr: 'Distribution de la Fidélité' },
    audienceProf: { en: 'Audience Profile', rw: 'Imyirondoro y\'abajijwe', fr: 'Profil de l\'Audience' },
    leadersBench: { en: 'Market Leaders Benchmarking', rw: 'Igereranya ry\'ibigo bikomeye', fr: 'Analyse Comparative' },
    priorityMatrix: { en: 'Priority Matrix', rw: 'Icyapa mbonerabitekerezo', fr: 'Matrice de Priorité' },
    impVsPerf: { en: 'Importance vs Performance', rw: 'Ingufu n\'Umusaruro', fr: 'Importance vs Performance' },
    quadrants: {
      maintain: { en: 'Maintain Strength', rw: 'Gukomera', fr: 'Maintenir' },
      opportunity: { en: 'Key Opportunities', rw: 'Amahirwe', fr: 'Opportunités' },
      low: { en: 'Low Priority', rw: 'Ibyo gutekereza', fr: 'Priorité Basse' },
      critical: { en: 'Critical Risk', rw: 'Ibyo kwitonderwa', fr: 'Risque Critique' }
    },
    tabs: {
      overview: { en: 'Overview', rw: 'Incamake', fr: 'Vue d\'ensemble' },
      awareness: { en: 'Awareness', rw: 'Kumenyekana', fr: 'Notoriété' },
      usage: { en: 'Usage', rw: 'Ikoreshwa', fr: 'Usage' },
      momentum: { en: 'Momentum', rw: 'Ingufu', fr: 'Momentum' },
      loyalty: { en: 'Loyalty', rw: 'Ubudahemuka', fr: 'Fidélité' },
      snapshot: { en: 'Snapshot', rw: 'Ishusho', fr: 'Instantané' },
      competitive: { en: 'Competitive', rw: 'Ihangana', fr: 'Compétition' },
      nps: { en: 'NPS Drivers', rw: 'Ibintu bitera NPS', fr: 'Facteurs NPS' }
    },
    kpis: {
      tom: { en: 'Top-of-Mind Recall', rw: 'Iya mbere m\'intekerezo', fr: 'Notoriété Top-of-Mind' },
      nps: { en: 'Net Promoter Score', rw: 'Igipimo cya NPS', fr: 'Net Promoter Score' },
      momentum: { en: 'Brand Momentum', rw: 'Ingufu z\'ikirango', fr: 'Momentum de Marque' },
      consideration: { en: 'Future Consideration', rw: 'Icyifuzo cy\'ahazaza', fr: 'Considération Future' }
    }
  }
};

export const RATING_DESCRIPTORS: Record<number, Localized> = {
  0: { en: 'Not at all likely', rw: 'Ntibishoboka', fr: 'Pas du tout probable' },
  1: { en: 'Very unlikely', rw: 'Ntibishoboka cyane', fr: 'Très improbable' },
  2: { en: 'Unlikely', rw: 'Ntibishoboka', fr: 'Improbable' },
  3: { en: 'Somewhat unlikely', rw: 'Bishoboka gake', fr: 'Peu probable' },
  4: { en: 'Slightly unlikely', rw: 'Bishoboka gake cyane', fr: 'Légèrement improbable' },
  5: { en: 'Neutral', rw: 'Hagati na hagati', fr: 'Neutre' },
  6: { en: 'Slightly likely', rw: 'Bishoboka gake', fr: 'Légèrement probable' },
  7: { en: 'Somewhat likely', rw: 'Bishoboka neza', fr: 'Assez probable' },
  8: { en: 'Likely', rw: 'Birashoboka', fr: 'Probable' },
  9: { en: 'Very likely', rw: 'Birashoboka cyane', fr: 'Très probable' },
  10: { en: 'Extremely likely', rw: 'Birashoboka cyane', fr: 'Extrêmement probable' }
};

export const RECENCY_CHOICES: Choice[] = [
  { label: { en: 'This week', rw: 'Icyi cyumweru', fr: 'Cette semaine' }, value: 'this_week' },
  { label: { en: 'This Month', rw: 'Uku kwezi', fr: 'Ce mois-ci' }, value: 'this_month' },
  { label: { en: 'In the Last 3 Months', rw: 'Mu mezi 3 ashize', fr: 'Au cours des 3 derniers mois' }, value: 'last_3_months' },
  { label: { en: 'Longer than 3 months', rw: 'Harenze amezi 3', fr: 'Plus de 3 mois' }, value: 'longer_than_3_months' },
  { label: { en: 'Never', rw: 'Ntabwo nigeze', fr: 'Jamais' }, value: 'never' }
];

export const AGE_SCREENING_CHOICES: Choice[] = [
  { label: { en: 'Below 18', rw: 'Munsi ya 18', fr: 'Moins de 18 ans' }, value: 'below_18' },
  { label: { en: '18-24', rw: '18-24', fr: '18-24' }, value: '18-24' },
  { label: { en: '25-34', rw: '25-34', fr: '25-34' }, value: '25-34' },
  { label: { en: '35-44', rw: '35-44', fr: '35-44' }, value: '35-44' },
  { label: { en: '45-54', rw: '45-54', fr: '45-54' }, value: '45-54' },
  { label: { en: '55+', rw: '55+', fr: '55+' }, value: '55+' }
];

export const GENDER_CHOICES: Choice[] = [
  { label: { en: 'Male', rw: 'Gabo', fr: 'Homme' }, value: 'male' },
  { label: { en: 'Female', rw: 'Gore', fr: 'Femme' }, value: 'female' }
];

export const EMPLOYMENT_CHOICES: Choice[] = [
  { label: { en: 'Employed full-time', rw: 'Umukozi wuzuye', fr: 'Employé à temps plein' }, value: 'full_time' },
  { label: { en: 'Employed part-time', rw: 'Umukozi w\'igihe gito', fr: 'Employé à temps partiel' }, value: 'part_time' },
  { label: { en: 'Self-employed', rw: 'Wikorera', fr: 'Travailleur indépendant' }, value: 'self_employed' },
  { label: { en: 'Student', rw: 'Umunyeshuri', fr: 'Étudiant' }, value: 'student' },
  { label: { en: 'Unemployed', rw: 'Nta kazi', fr: 'Sans emploi' }, value: 'unemployed' },
  { label: { en: 'Retired', rw: 'Wasubitse', fr: 'Retraité' }, value: 'retired' }
];

export const EDUCATION_CHOICES: Choice[] = [
  { label: { en: 'No formal education', rw: 'Nta mashuri', fr: 'Pas d\'éducation formelle' }, value: 'none' },
  { label: { en: 'Primary', rw: 'Amashuri abanza', fr: 'Primaire' }, value: 'primary' },
  { label: { en: 'Secondary', rw: 'Amashuri yisumbuye', fr: 'Secondaire' }, value: 'secondary' },
  { label: { en: 'University degree', rw: 'Impamyabumenyi ya kaminuza', fr: 'Diplôme universitaire' }, value: 'university' },
  { label: { en: 'Post-graduate', rw: 'Nyuma ya kaminuza', fr: 'Post-universitaire' }, value: 'postgraduate' }
];

// Helper to check if user passed screening
const passedScreening = (d: any) => 
  d.consent === 'yes' && 
  (d.b1_recency === 'this_week' || d.b1_recency === 'this_month' || d.b1_recency === 'last_3_months') && 
  d.b2_age && d.b2_age !== 'below_18';

export const SURVEY_QUESTIONS: Question[] = [
  // ========== SECTION A: Screening & Consent ==========
  {
    id: 'intro',
    type: 'note',
    section: 'A',
    label: { en: 'Welcome to Banking Insights', rw: 'Ikaze mu bushakashatsi bwa Banki', fr: 'Bienvenue aux Perspectives Bancaires' },
    description: { 
      en: 'We invite you to take part in this important survey about banking services. By sharing your honest views, you help improve services for everyone. Your responses will remain completely confidential.',
      rw: 'Turagutumira kugira uruhare muri ubu bushakashatsi ku serivisi za banki. Ibitekerezo byanyu bizafasha kunoza serivisi. Ibisubizo byanyu bizaguma ari ibanga.',
      fr: 'Nous vous invitons à participer à cette enquête importante sur les services bancaires. En partageant vos opinions honnêtes, vous aidez à améliorer les services pour tous. Vos réponses resteront entièrement confidentielles.'
    }
  },
  {
    id: 'selected_country',
    type: 'radio',
    section: 'A',
    label: { en: 'Which country are you responding from?', rw: 'Ni mu buhe gihugu muri gusubiriza?', fr: 'De quel pays répondez-vous ?' },
    required: true,
    choices: COUNTRY_CHOICES
  },
  {
    id: 'consent',
    type: 'radio',
    section: 'A',
    label: { en: 'Would you like to participate?', rw: 'Wifuza kugira uruhare?', fr: 'Souhaitez-vous participer ?' },
    required: true,
    choices: [
      { label: { en: 'Yes', rw: 'Yego', fr: 'Oui' }, value: 'yes' }, 
      { label: { en: 'No', rw: 'Oya', fr: 'Non' } , value: 'no' }
    ]
  },
  {
    id: 'termination_consent',
    type: 'note',
    section: 'A',
    label: { en: 'Thank you for your time', rw: 'Murakoze ku gihe cyanyu', fr: 'Merci pour votre temps' },
    description: { 
      en: 'Thank you for your time.',
      rw: 'Murakoze ku gihe cyanyu.',
      fr: 'Merci pour votre temps.'
    },
    logic: (d) => d.consent === 'no',
    isTerminationPoint: true
  },

  // ========== SECTION B: Profile & Eligibility ==========
  {
    id: 'b1_recency',
    type: 'radio',
    section: 'B',
    label: { 
      en: 'When was the last time you used a commercial bank (e.g. branch visit, ATM, bank app, bank transfer)?', 
      rw: 'Ni ryari mwaherukaga gukoresha banki y\'ubucuruzi (urugero: gusura ishami, ATM, application ya banki, kohereza amafaranga)?', 
      fr: 'Quand avez-vous utilisé une banque commerciale pour la dernière fois (par ex. visite en agence, guichet automatique, application bancaire, virement bancaire) ?' 
    },
    required: true,
    logic: (d) => d.consent === 'yes',
    choices: RECENCY_CHOICES
  },
  {
    id: 'termination_recency',
    type: 'note',
    section: 'B',
    label: { en: 'Thank you for your time', rw: 'Murakoze ku gihe cyanyu', fr: 'Merci pour votre temps' },
    description: { 
      en: 'Thank you for your interest. We are targeting recent banking users for this survey.',
      rw: 'Murakoze ku mushishikariye. Tureba abakoresha banki vuba muri ubu bushakashatsi.',
      fr: 'Merci de votre intérêt. Nous ciblons les utilisateurs bancaires récents pour cette enquête.'
    },
    logic: (d) => d.b1_recency === 'longer_than_3_months' || d.b1_recency === 'never',
    isTerminationPoint: true
  },
  {
    id: 'b2_age',
    type: 'radio',
    section: 'B',
    label: { en: 'Which of the following age categories do you fall in?', rw: 'Ni mu kihe cyiciro cy\'imyaka muri?', fr: 'Dans quelle catégorie d\'âge vous situez-vous ?' },
    required: true,
    logic: (d) => d.consent === 'yes' && (d.b1_recency === 'this_week' || d.b1_recency === 'this_month' || d.b1_recency === 'last_3_months'),
    choices: AGE_SCREENING_CHOICES
  },
  {
    id: 'termination_age',
    type: 'note',
    section: 'B',
    label: { en: 'Thank you for your time', rw: 'Murakoze ku gihe cyanyu', fr: 'Merci pour votre temps' },
    description: { 
      en: 'Thank you for your interest. This survey is for respondents 18 years and older.',
      rw: 'Murakoze ku bashishikariye. Ubushakashatsi ni ubw\'abafite imyaka 18 cyangwa irenga.',
      fr: 'Merci de votre intérêt. Cette enquête est destinée aux personnes de 18 ans et plus.'
    },
    logic: (d) => d.b2_age === 'below_18',
    isTerminationPoint: true
  },

  // ========== SECTION C: Brand Awareness ==========
  {
    id: 'c1_top_of_mind',
    type: 'text',
    section: 'C',
    label: { en: 'Which bank from your country comes to your mind FIRST?', rw: 'Ni iyihe banki y\'igihugu cyanyu ihita ikuza mu mutwe bwa mbere?', fr: 'Quelle banque de votre pays vous vient à l\'esprit EN PREMIER ?' },
    description: { en: 'Only one mention.', rw: 'Imwe gusa.', fr: 'Une seule mention.' },
    required: true,
    logic: passedScreening
  },
  {
    id: 'c2_spontaneous',
    type: 'text',
    section: 'C',
    label: { en: 'Which other banks from your country come to your mind?', rw: 'Ni izihe banki z\'igihugu cyanyu zindi zikuza mu mutwe?', fr: 'Quelles autres banques de votre pays vous viennent à l\'esprit ?' },
    description: { en: 'List all that come to mind, separated by commas.', rw: 'Andika izikuza mu mutwe zose, uzitandukanyije na koma.', fr: 'Listez toutes celles qui vous viennent à l\'esprit, séparées par des virgules.' },
    logic: (d) => passedScreening(d) && d.c1_top_of_mind
  },
  {
    id: 'c3_aware_banks',
    type: 'checkbox',
    section: 'C',
    label: { en: 'Tick all banks that you are aware of:', rw: 'Hitamo banki zose uzi:', fr: 'Cochez toutes les banques que vous connaissez :' },
    required: true,
    filterChoices: (d) => getBankChoicesByCountry(d.selected_country),
    logic: (d) => passedScreening(d) && d.c1_top_of_mind
  },

  // ========== SECTION C: Brand Usage ==========
  {
    id: 'c_usage_intro',
    type: 'note',
    section: 'C',
    label: { en: 'Brand Usage', rw: 'Ikoreshwa rya Banki', fr: 'Utilisation des Banques' },
    description: { 
      en: 'The next questions are about how you see different banks, even if you don\'t currently use them.',
      rw: 'Ibibazo bikurikira ni ibijyanye n\'uko ubona banki zitandukanye, nubwo utazikoresha ubu.',
      fr: 'Les questions suivantes portent sur la façon dont vous percevez les différentes banques, même si vous ne les utilisez pas actuellement.'
    },
    logic: (d) => d.c3_aware_banks && d.c3_aware_banks.length > 0
  },
  {
    id: 'c4_ever_used',
    type: 'checkbox',
    section: 'C',
    label: { en: 'Which of these banks you are aware of have you ever banked with or used?', rw: 'Ni izihe muri izi banki uzi warigeze gukoresha cyangwa ukayifatamo konti?', fr: 'Parmi ces banques que vous connaissez, lesquelles avez-vous déjà utilisées ?' },
    required: true,
    filterChoices: getAwareBanksChoices,
    logic: (d) => d.c3_aware_banks && d.c3_aware_banks.length > 0
  },
  {
    id: 'c5_currently_using',
    type: 'checkbox',
    section: 'C',
    label: { en: 'Which banks are you currently using (active accounts)?', rw: 'Ni izihe banki ukoresha ubu (konti zikora)?', fr: 'Quelles banques utilisez-vous actuellement (comptes actifs) ?' },
    required: true,
    filterChoices: getEverUsedBanksChoices,
    logic: (d) => d.c4_ever_used && d.c4_ever_used.length > 0
  },
  {
    id: 'c6_main_bank',
    type: 'radio',
    section: 'C',
    label: { en: 'Which ONE bank do you use most often?', rw: 'Ni iyihe banki IMWE ukoresha cyane?', fr: 'Quelle banque unique utilisez-vous le plus souvent ?' },
    required: true,
    filterChoices: getCurrentlyUsingBanksChoices,
    // Auto-skip if only one bank in current usage - the logic handles visibility
    // If only one bank selected in c5, this question is skipped and that bank becomes main bank
    logic: (d) => d.c5_currently_using && d.c5_currently_using.length > 1
  },

  // ========== SECTION D: Brand Imagery & Intentions ==========
  {
    id: 'd1_future_intent_note',
    type: 'note',
    section: 'D',
    label: { en: 'Future Intent', rw: 'Ibyifuzo by\'ahazaza', fr: 'Intention Future' },
    description: { 
      en: 'Please rate how likely you are to use each of the banks you are aware of in the future including the ones you are currently using. It doesn\'t matter if you have ever banked with the bank before or not.',
      rw: 'Nyamuneka tangaza uko ushobora gukoresha buri muri izi banki uzi mu gihe kizaza harimo n\'izo ukoresha ubu. Ntibisobanura niba warigeze gukoresha iyo banki mbere cyangwa ntabwo.',
      fr: 'Veuillez évaluer la probabilité que vous utilisiez chacune des banques que vous connaissez à l\'avenir, y compris celles que vous utilisez actuellement. Peu importe si vous avez déjà utilisé la banque auparavant ou non.'
    },
    logic: (d) => d.c5_currently_using && d.c5_currently_using.length > 0
  },
  {
    id: 'd2_future_intent',
    type: 'rating-matrix',
    section: 'D',
    label: { en: 'How likely are you to bank with each of the following banks in the future?', rw: 'Ushobora gute gukoresha buri banki muri izi zikurikira mu gihe kizaza?', fr: 'Quelle est la probabilité que vous utilisiez chacune des banques suivantes à l\'avenir ?' },
    description: { en: 'Rate each bank from 0 (Not at all likely) to 10 (Extremely likely).', rw: 'Tangaza buri banki kuva 0 (Ntibishoboka) kugeza 10 (Birashoboka cyane).', fr: 'Évaluez chaque banque de 0 (Pas du tout probable) à 10 (Extrêmement probable).' },
    required: true,
    filterChoices: getAwareBanksChoices,
    logic: (d) => d.c5_currently_using && d.c5_currently_using.length > 0 && d.c3_aware_banks && d.c3_aware_banks.length > 0
  },
  {
    id: 'd3_relevance',
    type: 'checkbox',
    section: 'D',
    label: { en: 'Which bank(s) do you feel is most suitable for people like you (based on your needs, lifestyle, income level)?', rw: 'Ni iyihe/izihe banki wumva ko ari nziza cyane ku bantu bameze nkawe (hashingiwe ku bikenewe byawe, imibereho, urwego rw\'umutungo)?', fr: 'Quelle(s) banque(s) estimez-vous la/les plus adaptée(s) pour des personnes comme vous (selon vos besoins, votre style de vie, votre niveau de revenus) ?' },
    required: true,
    filterChoices: getAwareBanksWithNone,
    logic: (d) => d.d2_future_intent && Object.keys(d.d2_future_intent).length > 0
  },
  {
    id: 'd4_popularity',
    type: 'radio',
    section: 'D',
    label: { en: 'Which ONE bank do you think most people in your country know or talk about the most?', rw: 'Ni iyihe banki IMWE utekereza ko abantu benshi mu gihugu cyawe bazi cyangwa bavugaho cyane?', fr: 'Quelle banque unique pensez-vous que la plupart des gens de votre pays connaissent ou dont ils parlent le plus ?' },
    required: true,
    filterChoices: getAwareBanksWithExtras,
    logic: (d) => d.d3_relevance
  },
  {
    id: 'd5_committed',
    type: 'radio',
    section: 'D',
    label: { en: 'If you were forced to keep only ONE bank, which one would it be?', rw: 'Ubaye ugomba gusigara n\'ibanki IMWE gusa, ni iyihe waba warasigaye?', fr: 'Si vous étiez obligé de ne garder qu\'une seule banque, laquelle serait-ce ?' },
    required: true,
    filterChoices: getCurrentlyUsingBanksChoices,
    // Auto-skip if only one bank in currently using
    logic: (d) => d.d4_popularity && d.c5_currently_using && d.c5_currently_using.length > 1
  },
  {
    id: 'd6_nps_note',
    type: 'note',
    section: 'D',
    label: { en: 'Net Promoter Score', rw: 'Igipimo cya NPS', fr: 'Net Promoter Score' },
    description: { 
      en: 'Please rate how likely you are to recommend the banks you have ever used to a friend or colleague.',
      rw: 'Nyamuneka tangaza uko ushobora gushishikariza banki warigeze gukoresha inshuti cyangwa mukorana.',
      fr: 'Veuillez évaluer la probabilité que vous recommandiez les banques que vous avez déjà utilisées à un ami ou un collègue.'
    },
    logic: (d) => (d.d5_committed || (d.c5_currently_using && d.c5_currently_using.length === 1))
  },
  {
    id: 'd7_nps',
    type: 'rating-matrix',
    section: 'D',
    label: { en: 'How likely are you to recommend each bank you have ever used to a friend or colleague?', rw: 'Ushobora gute gushishikariza buri banki warigeze gukoresha inshuti cyangwa mukorana?', fr: 'Quelle est la probabilité que vous recommandiez chaque banque que vous avez utilisée à un ami ou un collègue ?' },
    description: { en: 'Rate each bank from 0 (Not at all likely) to 10 (Extremely likely).', rw: 'Tangaza buri banki kuva 0 (Ntibishoboka) kugeza 10 (Birashoboka cyane).', fr: 'Évaluez chaque banque de 0 (Pas du tout probable) à 10 (Extrêmement probable).' },
    required: true,
    filterChoices: getEverUsedBanksChoices,
    logic: (d) => (d.d5_committed || (d.c5_currently_using && d.c5_currently_using.length === 1)) && d.c4_ever_used && d.c4_ever_used.length > 0
  },

  // ========== SECTION E: Detailed Demographics ==========
  {
    id: 'e1_employment',
    type: 'radio',
    section: 'E',
    label: { en: 'Work/Employment Status', rw: 'Imirimo/Imiterere y\'akazi', fr: 'Statut professionnel' },
    required: true,
    logic: (d) => d.d7_nps && Object.keys(d.d7_nps).length > 0,
    choices: EMPLOYMENT_CHOICES
  },
  {
    id: 'e2_education',
    type: 'radio',
    section: 'E',
    label: { en: 'Level of Education', rw: 'Urwego rw\'amashuri', fr: 'Niveau d\'éducation' },
    required: true,
    logic: (d) => d.e1_employment,
    choices: EDUCATION_CHOICES
  },
  {
    id: 'e3_gender',
    type: 'radio',
    section: 'E',
    label: { en: 'Gender', rw: 'Igitsina', fr: 'Genre' },
    required: true,
    logic: (d) => d.e2_education,
    choices: GENDER_CHOICES
  },

  // ========== SECTION F: Conclusion ==========
  {
    id: 'thank_you',
    type: 'note',
    section: 'F',
    label: { en: 'Complete', rw: 'Murakoze', fr: 'Terminé' },
    description: { en: 'Thank you for participating in this survey!', rw: 'Murakoze kugira uruhare muri ubu bushakashatsi!', fr: 'Merci d\'avoir participé à cette enquête !' },
    logic: (d) => d.e3_gender
  }
];

export const BANKS = ALL_BANKS;
export const AGE_CHOICES = [
  { label: { en: '18-24', rw: '18-24', fr: '18-24' }, value: '18-24' },
  { label: { en: '25-34', rw: '25-34', fr: '25-34' }, value: '25-34' },
  { label: { en: '35-44', rw: '35-44', fr: '35-44' }, value: '35-44' },
  { label: { en: '45-54', rw: '45-54', fr: '45-54' }, value: '45-54' },
  { label: { en: '55+', rw: '55+', fr: '55+' }, value: '55+' }
];
