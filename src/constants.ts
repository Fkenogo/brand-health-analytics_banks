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
  { id: 'BK_RW', name: 'Bank of Kigali (BK)', country: 'rwanda' },
  { id: 'IM_RW', name: 'I&M Bank', country: 'rwanda' },
  { id: 'BPR_RW', name: 'BPR Bank', country: 'rwanda' },
  { id: 'ECO_RW', name: 'EcoBank', country: 'rwanda' },
  { id: 'COGE_RW', name: 'Cogebanque', country: 'rwanda' },
  { id: 'ACC_RW', name: 'Access Bank', country: 'rwanda' },
  { id: 'EQU_RW', name: 'Equity Bank', country: 'rwanda' },
  { id: 'BOA_RW', name: 'Bank of Africa', country: 'rwanda' },
  { id: 'NCBA_RW', name: 'NCBA Bank', country: 'rwanda' },
  { id: 'GTB_RW', name: 'Guaranty Trust Bank (GTBank)', country: 'rwanda' },
  { id: 'KCB_RW', name: 'KCB Bank', country: 'rwanda' },
  { id: 'URW_RW', name: 'Urwego Opportunity Bank', country: 'rwanda' },
  { id: 'UNG_RW', name: 'Unguka Bank', country: 'rwanda' },
  
  // Uganda (28 banks)
  { id: 'ABC_UG', name: 'ABC Capital Bank', country: 'uganda' },
  { id: 'ABSA_UG', name: 'Absa Bank', country: 'uganda' },
  { id: 'ACC_UG', name: 'Access Bank', country: 'uganda' },
  { id: 'AFR_UG', name: 'Afriland First Bank', country: 'uganda' },
  { id: 'BOA_UG', name: 'Bank of Africa', country: 'uganda' },
  { id: 'BAR_UG', name: 'Bank of Baroda', country: 'uganda' },
  { id: 'BOI_UG', name: 'Bank of India', country: 'uganda' },
  { id: 'CAI_UG', name: 'Cairo International Bank', country: 'uganda' },
  { id: 'CEN_UG', name: 'Centenary Bank', country: 'uganda' },
  { id: 'CITI_UG', name: 'Citibank', country: 'uganda' },
  { id: 'DFCU_UG', name: 'DFCU Bank', country: 'uganda' },
  { id: 'DTB_UG', name: 'Diamond Trust Bank', country: 'uganda' },
  { id: 'ECO_UG', name: 'Ecobank', country: 'uganda' },
  { id: 'EQU_UG', name: 'Equity Bank', country: 'uganda' },
  { id: 'EXIM_UG', name: 'Exim Bank', country: 'uganda' },
  { id: 'FIN_UG', name: 'Finance Trust Bank', country: 'uganda' },
  { id: 'GTB_UG', name: 'GT Bank', country: 'uganda' },
  { id: 'HFB_UG', name: 'Housing Finance Bank', country: 'uganda' },
  { id: 'IM_UG', name: 'I&M Bank', country: 'uganda' },
  { id: 'KCB_UG', name: 'KCB Bank', country: 'uganda' },
  { id: 'NCBA_UG', name: 'NCBA Bank', country: 'uganda' },
  { id: 'OPP_UG', name: 'Opportunity Bank', country: 'uganda' },
  { id: 'PEARL_UG', name: 'Pearl Bank', country: 'uganda' },
  { id: 'SAL_UG', name: 'Salaam Bank', country: 'uganda' },
  { id: 'STB_UG', name: 'Stanbic Bank', country: 'uganda' },
  { id: 'STAN_UG', name: 'Standard Chartered', country: 'uganda' },
  { id: 'TROP_UG', name: 'Tropical Bank', country: 'uganda' },
  { id: 'UBA_UG', name: 'UBA Bank', country: 'uganda' },
  
  // Burundi (14 banks)
  { id: 'KCB_BI', name: 'KCB Bank', country: 'burundi' },
  { id: 'FIN_BI', name: 'FinBank', country: 'burundi' },
  { id: 'ECO_BI', name: 'EcoBank', country: 'burundi' },
  { id: 'CRDB_BI', name: 'CRDB Bank', country: 'burundi' },
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

export const GENDER_CHOICES: Choice[] = [
  { label: { en: 'Male', rw: 'Gabo', fr: 'Homme' }, value: 'male' },
  { label: { en: 'Female', rw: 'Gore', fr: 'Femme' }, value: 'female' }
];

export const SURVEY_QUESTIONS: Question[] = [
  {
    id: 'intro',
    type: 'note',
    section: 'A',
    label: { en: 'Welcome to Regional Banking Insights 2026', rw: 'Ikaze mu bushakashatsi 2026', fr: 'Bienvenue aux Perspectives Bancaires 2026' },
    description: { 
      en: 'Share your views to help improve banking services. Confidentiality is guaranteed.',
      rw: 'Tanga ibitekerezo byanyu ufashe kunoza serivisi. Ibitekerezo byanyu bizaguma ari ibanga.',
      fr: 'Partagez vos opinions pour améliorer les services bancaires. La confidentialité est garantie.'
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
    label: { en: 'Survey Ended', rw: 'Ubushakashatsi bwarangiye', fr: 'Enquête terminée' },
    description: { 
      en: 'Thank you for your time. Unfortunately, you do not qualify for this survey.',
      rw: 'Murakoze ku gihe cyanyu. Ikibabaje, ntimujyanye n\'ubushakashatsi.',
      fr: 'Merci pour votre temps. Malheureusement, vous ne correspondez pas aux critères.'
    },
    logic: (d) => d.consent === 'no',
    isTerminationPoint: true
  },
  {
    id: 'b1_last_used',
    type: 'radio',
    section: 'B',
    label: { en: 'Last time you used banking services?', rw: 'Ni ryari mwaherukaga gukoresha serivisi za banki?', fr: 'Dernière utilisation des services bancaires ?' },
    required: true,
    logic: (d) => d.consent === 'yes',
    choices: [
      { label: { en: 'Within the past 7 days', rw: 'Mu minsi 7 ishize', fr: 'Dans les 7 derniers jours' }, value: 'past_7_days' },
      { label: { en: 'Within the past month', rw: 'Mu kwezi gushize', fr: 'Dans le mois dernier' }, value: 'past_month' },
      { label: { en: 'More than a month ago', rw: 'Harenze ukwezi', fr: 'Il y a plus d\'un mois' }, value: 'more_than_month' },
      { label: { en: 'Never', rw: 'Ntabwo nigeze', fr: 'Jamais' }, value: 'never' }
    ]
  },
  {
    id: 'b2_age',
    type: 'radio',
    section: 'B',
    label: { en: 'What is your age category?', rw: 'Imyaka yanyu ni iyihe?', fr: 'Quelle est votre tranche d\'âge ?' },
    required: true,
    logic: (d) => d.consent === 'yes' && d.b1_last_used !== 'never',
    choices: [
      { label: { en: 'Under 18', rw: 'Munsi ya 18', fr: 'Moins de 18 ans' }, value: 'under_18' },
      { label: { en: '18-24', rw: '18-24', fr: '18-24' }, value: '18-24' },
      { label: { en: '25-34', rw: '25-34', fr: '25-34' }, value: '25-34' },
      { label: { en: '35-44', rw: '35-44', fr: '35-44' }, value: '35-44' },
      { label: { en: '45-54', rw: '45-54', fr: '45-54' }, value: '45-54' },
      { label: { en: '55+', rw: '55+', fr: '55+' }, value: '55+' }
    ]
  },
  {
    id: 'termination_age',
    type: 'note',
    section: 'B',
    label: { en: 'Survey Ended', rw: 'Ubushakashatsi bwarangiye', fr: 'Enquête terminée' },
    description: { 
      en: 'Thank you for your interest. This survey is for respondents 18 years and older.',
      rw: 'Murakoze ku bashishikariye. Ubushakashatsi ni ubw\'abafite imyaka 18 cyangwa irenga.',
      fr: 'Merci de votre intérêt. Cette enquête est destinée aux personnes de 18 ans et plus.'
    },
    logic: (d) => d.b2_age === 'under_18',
    isTerminationPoint: true
  },
  {
    id: 'gender',
    type: 'radio',
    section: 'B',
    label: { en: 'What is your gender?', rw: 'Igitsina cyanyu ni ikihe?', fr: 'Quel est votre genre ?' },
    required: true,
    logic: (d) => d.consent === 'yes' && d.b2_age && d.b2_age !== 'under_18' && d.b1_last_used !== 'never',
    choices: GENDER_CHOICES
  },
  {
    id: 'c1_first_bank',
    type: 'text',
    section: 'C',
    label: { en: 'Which bank comes to your mind FIRST when you think of banks?', rw: 'Ni iyihe banki ihita ikuza mu mutwe ubanje gutekereza ku mabanki?', fr: 'Quelle banque vous vient à l\'esprit en PREMIER lorsque vous pensez aux banques ?' },
    required: true,
    logic: (d) => d.consent === 'yes' && d.gender && d.b2_age !== 'under_18' && d.b1_last_used !== 'never'
  },
  {
    id: 'c3_aware_banks',
    type: 'checkbox',
    section: 'C',
    label: { en: 'Tick all banks you are aware of:', rw: 'Hitamo banki zose uzi:', fr: 'Cochez toutes les banques que vous connaissez :' },
    required: true,
    filterChoices: (d) => getBankChoicesByCountry(d.selected_country),
    logic: (d) => !!d.c1_first_bank
  },
  {
    id: 'c4_ever_used',
    type: 'checkbox',
    section: 'C',
    label: { en: 'Which banks have you ever used?', rw: 'Ni izihe banki warigeze gukoresha?', fr: 'Quelles banques avez-vous déjà utilisées ?' },
    required: true,
    filterChoices: (d) => getBankChoicesByCountry(d.selected_country),
    logic: (d) => d.c3_aware_banks && d.c3_aware_banks.length > 0
  },
  {
    id: 'c5_currently_using',
    type: 'checkbox',
    section: 'C',
    label: { en: 'Which banks are you currently using?', rw: 'Ni izihe banki ukoresha ubu?', fr: 'Quelles banques utilisez-vous actuellement ?' },
    required: true,
    filterChoices: (d) => getBankChoicesByCountry(d.selected_country),
    logic: (d) => d.c4_ever_used && d.c4_ever_used.length > 0
  },
  {
    id: 'c6_often_used',
    type: 'radio',
    section: 'C',
    label: { en: 'Which bank do you use most often?', rw: 'Ni iyihe banki ukoresha cyane?', fr: 'Quelle banque utilisez-vous le plus souvent ?' },
    required: true,
    filterChoices: (d) => getBankChoicesByCountry(d.selected_country),
    logic: (d) => d.c5_currently_using && d.c5_currently_using.length > 0
  },
  {
    id: 'c10_nps',
    type: 'rating-0-10-nr',
    section: 'C',
    label: { en: 'How likely are you to recommend your main bank to friends or family?', rw: 'Ushobora gute gususubiriza inshuti cyangwa umuryango banki yawe y\'ingenzi?', fr: 'Quelle est la probabilité que vous recommandiez votre banque principale à vos amis ou à votre famille ?' },
    required: true,
    logic: (d) => d.c6_often_used
  },
  {
    id: 'd2_employment',
    type: 'radio',
    section: 'D',
    label: { en: 'What is your employment status?', rw: 'Imirimo yawe?', fr: 'Quel est votre statut professionnel ?' },
    required: true,
    logic: (d) => typeof d.c10_nps === 'number',
    choices: [
      { label: { en: 'Full-time employed', rw: 'Umukozi wuzuye', fr: 'Employé à temps plein' }, value: 'full_time' },
      { label: { en: 'Part-time employed', rw: 'Umukozi w\'igihe gito', fr: 'Employé à temps partiel' }, value: 'part_time' },
      { label: { en: 'Self-employed', rw: 'Wikorera', fr: 'Travailleur indépendant' }, value: 'self_employed' },
      { label: { en: 'Student', rw: 'Umunyeshuri', fr: 'Étudiant' }, value: 'student' },
      { label: { en: 'Unemployed', rw: 'Nta kazi', fr: 'Sans emploi' }, value: 'unemployed' },
      { label: { en: 'Retired', rw: 'Wasubitse', fr: 'Retraité' }, value: 'retired' }
    ]
  },
  {
    id: 'd3_education',
    type: 'radio',
    section: 'D',
    label: { en: 'What is your highest level of education?', rw: 'Urwego rw\'amashuri yawe ni uruhe?', fr: 'Quel est votre niveau d\'éducation le plus élevé ?' },
    required: true,
    logic: (d) => d.d2_employment,
    choices: [
      { label: { en: 'Primary school', rw: 'Amashuri abanza', fr: 'École primaire' }, value: 'primary' },
      { label: { en: 'Secondary school', rw: 'Amashuri yisumbuye', fr: 'École secondaire' }, value: 'secondary' },
      { label: { en: 'Vocational/Technical', rw: 'Imyuga/Tekiniki', fr: 'Formation professionnelle' }, value: 'vocational' },
      { label: { en: 'University/College', rw: 'Kaminuza', fr: 'Université' }, value: 'university' },
      { label: { en: 'Postgraduate', rw: 'Nyuma ya kaminuza', fr: 'Postuniversitaire' }, value: 'postgraduate' }
    ]
  },
  {
    id: 'thank_you',
    type: 'note',
    section: 'F',
    label: { en: 'Complete', rw: 'Murakoze', fr: 'Terminé' },
    description: { en: 'Thank you for your participation!', rw: 'Murakoze cyane ku kugira uruhare!', fr: 'Merci de votre participation !' },
    logic: (d) => d.d3_education
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
