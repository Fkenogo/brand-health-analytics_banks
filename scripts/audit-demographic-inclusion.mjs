import fs from 'node:fs/promises';
import path from 'node:path';
import { deriveSurveyAnalyticsInclusion } from '../functions/respondentInclusion.js';

const sourcePath = path.resolve(process.argv[2] || 'testing/sample-responses.seed.json');
const sourceRows = JSON.parse(await fs.readFile(sourcePath, 'utf8'));

const unknownRate = (rows, field) => {
  if (rows.length === 0) return { count: 0, pct: 0 };
  const count = rows.filter((row) => !String(row[field] || '').trim()).length;
  return { count, pct: Number(((count / rows.length) * 100).toFixed(1)) };
};

const summarizeCountry = (rows, country) => {
  const scoped = rows.filter((row) => (row.country || row.selected_country) === country);
  const included = scoped.filter((row) => deriveSurveyAnalyticsInclusion(row).includedInAnalytics);
  const screenedOut = scoped.filter((row) => !deriveSurveyAnalyticsInclusion(row).includedInAnalytics);
  return {
    country,
    total: scoped.length,
    included: included.length,
    screenedOut: screenedOut.length,
    under18: screenedOut.filter((row) => deriveSurveyAnalyticsInclusion(row).screeningOutcome === 'under_18').length,
    before: {
      age: unknownRate(scoped, 'b2_age'),
      gender: unknownRate(scoped, 'gender'),
      employment: unknownRate(scoped, 'e1_employment'),
      education: unknownRate(scoped, 'e2_education'),
    },
    after: {
      age: unknownRate(included, 'b2_age'),
      gender: unknownRate(included, 'gender'),
      employment: unknownRate(included, 'e1_employment'),
      education: unknownRate(included, 'e2_education'),
    },
  };
};

const syntheticBurundiRows = [
  ...sourceRows.filter((row) => (row.country || row.selected_country) === 'burundi'),
  ...Array.from({ length: 3 }, (_, index) => ({
    response_id: `synthetic_bi_under18_${index + 1}`,
    device_id: `synthetic_bi_under18_${index + 1}`,
    country: 'burundi',
    selected_country: 'burundi',
    timestamp: `2026-03-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
    duration_seconds: 25,
    question_timings: { b1_recency: 3, b2_age: 2 },
    language_at_submission: 'fr',
    _status: 'terminated',
    consent: 'yes',
    b1_recency: 'this_week',
    b2_age: 'below_18',
  })),
];

const localBurundi = summarizeCountry(sourceRows, 'burundi');
const reproducedBurundi = summarizeCountry(syntheticBurundiRows, 'burundi');

console.log(JSON.stringify({
  sourcePath,
  localBurundi,
  reproducedBurundi,
}, null, 2));
