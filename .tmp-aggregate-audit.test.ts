import { describe, it, expect } from 'vitest';
import admin from './functions/node_modules/firebase-admin/lib/index.js';
import { computeBankMetrics, computeCompetitiveRows } from './src/utils/subscriberDashboard';
import { BANKS } from './src/constants';
import { computeBrandEdgeScore } from './src/utils/brandEdgeScore';
import { mergeAggregateDocs, buildOverviewSnapshot } from './functions/analyticsAggregation.js';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'brand-health-analytics' });
}
const db = admin.firestore();

describe('aggregate audit', () => {
  it('prints live raw vs aggregate metrics', async () => {
    const country = 'rwanda';
    const bankId = 'BK_RW';

    const [responsesSelectedSnap, responsesLegacySnap, aggregateSnap, statusSnap] = await Promise.all([
      db.collection('responses').where('selected_country', '==', country).get(),
      db.collection('responses').where('country', '==', country).get(),
      db.collection('responseAnalyticsDaily').where(admin.firestore.FieldPath.documentId(), '>=', `${country}__0000-00-00`).where(admin.firestore.FieldPath.documentId(), '<=', `${country}__9999-99-99`).get(),
      db.collection('responseAnalyticsStatus').doc(country).get(),
    ]);

    const seen = new Set<string>();
    const responses = [...responsesSelectedSnap.docs, ...responsesLegacySnap.docs]
      .filter((doc) => {
        if (seen.has(doc.id)) return false;
        seen.add(doc.id);
        return true;
      })
      .map((doc) => doc.data() as any);

    const countryBanks = BANKS.filter((bank) => bank.country === country);
    const rawMetrics = computeBankMetrics(responses as any, bankId, 0);
    const rawRows = computeCompetitiveRows(responses as any, country as any, countryBanks.map((bank) => bank.id));
    const rawSelectedRow = rawRows.find((row) => row.bankId === bankId) || null;
    const rawBrandEdge = computeBrandEdgeScore({
      awareness: rawMetrics.aware,
      usage: rawMetrics.currentUsing,
      loyalty: rawMetrics.loyaltyIndex,
      primaryShare: rawSelectedRow?.marketShare || 0,
      switchingRisk: 100 - rawMetrics.retentionRate,
    });
    const rawAwarenessDepth = Math.round((rawMetrics.topOfMind * 3 + rawMetrics.spontaneous * 2 + Math.max(rawMetrics.aided - rawMetrics.spontaneous, 0)) / 3);

    const aggregateDocs = aggregateSnap.docs.map((doc) => doc.data());
    const merged = mergeAggregateDocs(aggregateDocs as any);
    const aggregateOverview = buildOverviewSnapshot({
      aggregate: merged as any,
      bankIds: countryBanks.map((bank) => bank.id),
      bankNames: Object.fromEntries(countryBanks.map((bank) => [bank.id, bank.name])),
      selectedBankId: bankId,
    });
    const aggregateSelected = aggregateOverview.selectedMetrics;
    const aggregateSelectedRow = aggregateOverview.marketRows.find((row) => row.bankId === bankId) || null;
    const aggregateAwarenessDepth = Math.round((((aggregateSelected?.topOfMind || 0) * 3) + ((aggregateSelected?.spontaneous || 0) * 2) + Math.max((aggregateSelected?.aided || 0) - (aggregateSelected?.spontaneous || 0), 0)) / 3);

    const output = {
      country,
      bankId,
      responseCount: responses.length,
      aggregateDocCount: aggregateDocs.length,
      status: statusSnap.exists ? statusSnap.data() : null,
      metrics: {
        brandEdgeScore: { raw: rawBrandEdge, aggregate: aggregateSelected?.brandEdgeScore ?? null, diff: (aggregateSelected?.brandEdgeScore ?? 0) - rawBrandEdge },
        awareness: { raw: rawMetrics.aware, aggregate: aggregateSelected?.aware ?? null, diff: (aggregateSelected?.aware ?? 0) - rawMetrics.aware },
        currentUsage: { raw: rawMetrics.currentUsing, aggregate: aggregateSelected?.currentUsing ?? null, diff: (aggregateSelected?.currentUsing ?? 0) - rawMetrics.currentUsing },
        loyaltyIndex: { raw: rawMetrics.loyaltyIndex, aggregate: aggregateSelected?.loyaltyIndex ?? null, diff: (aggregateSelected?.loyaltyIndex ?? 0) - rawMetrics.loyaltyIndex },
        nps: { raw: rawMetrics.nps, aggregate: aggregateSelected?.nps ?? null, diff: (aggregateSelected?.nps ?? 0) - rawMetrics.nps },
        topOfMind: { raw: rawMetrics.topOfMind, aggregate: aggregateSelected?.topOfMind ?? null, diff: (aggregateSelected?.topOfMind ?? 0) - rawMetrics.topOfMind },
        spontaneousRecall: { raw: rawMetrics.spontaneous, aggregate: aggregateSelected?.spontaneous ?? null, diff: (aggregateSelected?.spontaneous ?? 0) - rawMetrics.spontaneous },
        totalAwareness: { raw: rawMetrics.aware, aggregate: aggregateSelected?.aware ?? null, diff: (aggregateSelected?.aware ?? 0) - rawMetrics.aware },
        awarenessQuality: { raw: rawMetrics.awarenessQuality, aggregate: aggregateSelected?.awarenessQuality ?? null, diff: (aggregateSelected?.awarenessQuality ?? 0) - rawMetrics.awarenessQuality },
        shareOfVoice: { raw: rawSelectedRow?.shareOfVoice ?? null, aggregate: aggregateSelectedRow?.shareOfVoice ?? null, diff: (aggregateSelectedRow?.shareOfVoice ?? 0) - (rawSelectedRow?.shareOfVoice ?? 0) },
        awarenessDepthScore: { raw: rawAwarenessDepth, aggregate: aggregateAwarenessDepth, diff: aggregateAwarenessDepth - rawAwarenessDepth },
      },
    };

    console.log('AGGREGATE_AUDIT_OUTPUT=' + JSON.stringify(output));
    expect(responses.length).toBeGreaterThan(0);
  }, 30000);
});
