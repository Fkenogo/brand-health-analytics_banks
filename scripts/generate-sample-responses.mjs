import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'testing');
const OUT_FILE = path.join(OUT_DIR, 'sample-responses.seed.json');

const BANKS_BY_COUNTRY = {
  rwanda: ['BK_RW', 'IM_RW', 'BPR_RW', 'ECO_RW', 'KCB_RW'],
  uganda: ['STB_UG', 'ABSA_UG', 'DFCU_UG', 'CEN_UG', 'EQU_UG'],
  burundi: ['KCB_BI', 'CRDB_BI', 'ECO_BI', 'BBCI_BI', 'DTB_BI'],
};

const AGES = ['18-24', '25-34', '35-44', '45-54', '55+'];
const GENDERS = ['male', 'female'];
const EMPLOYMENT = ['full_time', 'part_time', 'self_employed', 'student', 'unemployed'];
const EDUCATION = ['secondary', 'university', 'postgraduate', 'primary'];

const pick = (list, idx) => list[idx % list.length];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const makeNps = (index) => {
  const seq = [10, 9, 8, 7, 6, 5, 4, 8, 9, 7, 6, 10];
  return seq[index % seq.length];
};

const makeResponse = (country, index) => {
  const banks = BANKS_BY_COUNTRY[country];
  const primary = pick(banks, index);
  const secondary = pick(banks, index + 1);
  const tertiary = pick(banks, index + 2);
  const aware = [primary, secondary, tertiary];
  const everUsed = [primary, secondary];
  const currentlyUsing = index % 3 === 0 ? [primary] : [primary, secondary];
  const npsPrimary = makeNps(index);
  const npsSecondary = clamp(npsPrimary - 1, 0, 10);
  const intentPrimary = clamp(7 + (index % 4), 0, 10);
  const intentSecondary = clamp(5 + (index % 5), 0, 10);

  const date = new Date();
  date.setDate(date.getDate() - index * 3);

  return {
    response_id: `sample_${country}_${String(index + 1).padStart(3, '0')}`,
    device_id: `sim_device_${country}_${index + 1}`,
    country,
    selected_country: country,
    timestamp: date.toISOString(),
    duration_seconds: 120 + (index % 8) * 15,
    question_timings: {
      c1_top_of_mind: 12,
      c2_spontaneous: 20,
      c3_aware_banks: 15,
      c4_ever_used: 18,
      c5_currently_using: 18,
      c6_main_bank: 10,
      c10_nps: 10,
    },
    language_at_submission: 'en',
    _status: 'sample_seed_v1',
    consent: 'yes',
    b1_recency: 'this_month',
    b2_age: pick(AGES, index),
    gender: pick(GENDERS, index),
    c1_recognized_bank_id: primary,
    c2_recognized_bank_ids: [secondary, tertiary],
    c3_aware_banks: aware,
    c4_ever_used: everUsed,
    c5_currently_using: currentlyUsing,
    c6_main_bank: primary,
    c6_often_used: primary,
    c9_would_consider: [primary, secondary],
    c9_favourites: [primary],
    c9_never_consider: [pick(banks, index + 3)],
    c10_nps: npsPrimary,
    d2_future_intent: {
      [primary]: intentPrimary,
      [secondary]: intentSecondary,
    },
    d3_relevance: [primary, secondary],
    d4_popularity: primary,
    d5_committed: index % 4 === 0 ? primary : secondary,
    d7_nps: {
      [primary]: npsPrimary,
      [secondary]: npsSecondary,
    },
    e1_employment: pick(EMPLOYMENT, index),
    e2_education: pick(EDUCATION, index),
    e3_gender: pick(GENDERS, index),
  };
};

const payload = [
  ...Array.from({ length: 30 }, (_, i) => makeResponse('rwanda', i)),
  ...Array.from({ length: 30 }, (_, i) => makeResponse('uganda', i)),
  ...Array.from({ length: 30 }, (_, i) => makeResponse('burundi', i)),
];

await fs.mkdir(OUT_DIR, { recursive: true });
await fs.writeFile(OUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
console.log(`Generated ${payload.length} sample responses at ${OUT_FILE}`);
