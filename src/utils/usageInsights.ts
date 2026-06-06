import type { AwarenessInsightResult } from '@/utils/awarenessInsights';
import type { UsageDropoffStage, UsageOpportunity, UsageOverlapRow, MultiBankShareMetrics, SecondChoiceShareRow } from '@/utils/subscriberDashboard';

// ─── Local helpers (rewritten — do not import from awarenessInsights) ────────

const LOW_SAMPLE = 30;
const LOW_SAMPLE_EVER = 15;
const LOW_SAMPLE_CURRENT = 10;

function s(...parts: string[]): string {
  return parts.filter((p) => p && p.length > 0).join('\n\n');
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

function fmtPct(v: number | null | undefined, fallback = '--'): string {
  if (!isFiniteNumber(v)) return fallback;
  return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}%`;
}

function fmt(v: number | null | undefined, d = 1, fallback = '--'): string {
  if (!isFiniteNumber(v)) return fallback;
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(d);
}

function smplSection(sampleSize: number | undefined): string {
  if (sampleSize === undefined || sampleSize >= LOW_SAMPLE) return '';
  return `\n\nSAMPLE CAUTION: With ${sampleSize} respondents in this slice, percentages carry wide confidence intervals — individual metric swings of 5-10pp fall within the margin of error. Use these figures as directional signals, not precise targets, until sample reaches 30+.`;
}

// Derive a short pattern name from the deterministic funnelHealthDiagnosis string
function classifyFunnelPattern(diagnosis: string): 'Acquisition Barrier' | 'Leaky Bucket' | 'Secondary Bank Syndrome' | 'Healthy Funnel' | 'Mixed Performance' {
  if (diagnosis.includes("Awareness doesn't convert")) return 'Acquisition Barrier';
  if (diagnosis.includes('Leaky bucket')) return 'Leaky Bucket';
  if (diagnosis.includes('Secondary bank syndrome')) return 'Secondary Bank Syndrome';
  if (diagnosis.includes('Healthy usage funnel')) return 'Healthy Funnel';
  return 'Mixed Performance';
}

// ─── 1. Module-level usage insight ────────────────────────────────────────────

export function buildUsageModuleInsight(args: {
  trialRate: number;
  retentionRate: number;
  preferenceRate: number;
  funnelHealthDiagnosis: string;
  positionLabel: string;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { trialRate, retentionRate, preferenceRate, funnelHealthDiagnosis, positionLabel, sampleSize } = args;
  if (sampleSize === 0) return null;

  const pattern = classifyFunnelPattern(funnelHealthDiagnosis);
  const positionRef = positionLabel !== 'N/A' ? ` The brand sits in a ${positionLabel} position on the usage-retention matrix.` : '';

  let snapshot = '';
  let classification = '';
  let context = '';
  let action = '';

  if (pattern === 'Acquisition Barrier') {
    snapshot = `Acquisition Barrier pattern: only ${fmtPct(trialRate)} of aware consumers ever try this bank — awareness is reaching consumers but is not translating into trial behaviour.`;
    classification = `FUNNEL CLASSIFICATION: The bank exhibits an Acquisition Barrier profile — total awareness is being generated but conversion to first-time use is failing at ${fmtPct(trialRate)}. This is the most upstream funnel failure in banking: the marketing engine is putting consumers into the consideration set but something between knowing and using is blocking them. Every aware consumer who never trials represents paid awareness investment producing zero downstream revenue.${positionRef}`;
    context = `STRATEGIC CONTEXT: A low trial rate indicates the barrier is not awareness — it is one of trust, accessibility, perceived fit, or competitive switching cost. Spending additional budget on broader reach without diagnosing this barrier compounds the inefficiency: the bank ends up paying to make more consumers aware of a brand they still won't try. With retention at ${fmtPct(retentionRate)} and preference at ${fmtPct(preferenceRate)}, the downstream funnel cannot be evaluated until trial conversion is unblocked.`;
    action = `PRIORITY ACTION: The single highest-priority intervention is trial-barrier diagnosis. Commission qualitative work among aware non-triers to isolate the specific objection — onboarding friction, branch access, fee perception, product fit, or active loyalty to incumbent. Until this barrier is identified and addressed, additional awareness investment will produce diminishing returns. No retention or preference initiative will scale until trial conversion is fixed.`;
  } else if (pattern === 'Leaky Bucket') {
    snapshot = `Leaky Bucket pattern: trial conversion is working at ${fmtPct(trialRate)} but retention is only ${fmtPct(retentionRate)} — for every cohort the bank acquires, the majority is lost before they become active.`;
    classification = `FUNNEL CLASSIFICATION: The bank shows a Leaky Bucket usage profile — acquisition is converting at ${fmtPct(trialRate)} trial but retention is failing to hold the users it wins, with only ${fmtPct(retentionRate)} remaining active. This pattern is the most commercially costly in banking: customer acquisition costs are paid in full, but lifetime value is never recovered because users churn before developing habits. Each lapsed user is a sunk acquisition cost with zero return.${positionRef}`;
    context = `STRATEGIC CONTEXT: A leaky bucket pattern means the growth engine is running but the tank has a hole — every new trial user acquired is competing against an outflow of lapsed users from prior periods. The bank is spending marketing budget to fill a pipeline that drains faster than it fills. Without fixing retention, scaling acquisition will accelerate losses, not compound them — and preference capture at ${fmtPct(preferenceRate)} cannot recover because users churn before reaching the preference stage.`;
    action = `PRIORITY ACTION: The single highest-priority intervention is retention economics. Identify the specific moments in the customer journey where lapse occurs — onboarding completion, first transaction, day-30 activation, or product feature adoption — and address them before increasing acquisition investment. Root-cause diagnosis (product friction, service failure, competitive switching, or unmet expectation) must precede any spending decision on new acquisition.`;
  } else if (pattern === 'Secondary Bank Syndrome') {
    snapshot = `Secondary Bank Syndrome: retention is healthy at ${fmtPct(retentionRate)} but only ${fmtPct(preferenceRate)} of active users see this as their primary bank — the bank holds wallets but not loyalty.`;
    classification = `FUNNEL CLASSIFICATION: The bank exhibits Secondary Bank Syndrome — users keep their accounts open and active (${fmtPct(retentionRate)} retention) but only ${fmtPct(preferenceRate)} have made this their primary banking relationship. The remainder use the bank for specific transactions while routing salary, savings, and the majority of share-of-wallet to a competitor. The account is active but commercially under-monetised.${positionRef}`;
    context = `STRATEGIC CONTEXT: Secondary Bank Syndrome is the single most under-diagnosed revenue leak in East African banking. A user with an active account but no primary preference contributes a fraction of the revenue of a true primary user — lower deposit balances, fewer cross-sold products, lower transaction volume, and minimal lending activity. With trial converting at ${fmtPct(trialRate)} and retention holding, the upstream funnel is feeding active users into a relationship structure that fails to capture their economic value.`;
    action = `PRIORITY ACTION: The single highest-priority intervention is preference capture — moving the existing active base from secondary to primary status. This requires a structural shift in customer experience: salary deposit incentives, primary-account benefits, and product depth that creates switching cost. Adding new trial users without solving preference capture compounds the secondary-bank problem rather than resolving it.`;
  } else if (pattern === 'Healthy Funnel') {
    snapshot = `Healthy Funnel: trial at ${fmtPct(trialRate)}, retention at ${fmtPct(retentionRate)}, and preference at ${fmtPct(preferenceRate)} are balanced — the conversion cascade is working at every stage.`;
    classification = `FUNNEL CLASSIFICATION: The bank exhibits a Healthy Funnel profile — trial conversion (${fmtPct(trialRate)}), retention (${fmtPct(retentionRate)}), and preference capture (${fmtPct(preferenceRate)}) are all functioning above critical thresholds. This is the most commercially advantaged usage pattern: every stage of the cascade produces meaningful conversion, meaning incremental acquisition investment flows through to incremental primary-bank revenue rather than being lost to mid-funnel leakage.${positionRef}`;
    context = `STRATEGIC CONTEXT: A balanced funnel is rare in competitive banking markets. It indicates the bank has solved the harder problems — building trust to drive trial, delivering experience to drive retention, and creating relationship depth to win primary preference. The growth constraint is no longer mid-funnel friction; it is upstream awareness expansion and downstream preference deepening among the existing base.`;
    action = `PRIORITY ACTION: The highest-leverage investment is now reach expansion — growing the aware base to feed a funnel that is proven to convert. The secondary priority is deepening primary-bank relationships among existing preference holders through product cross-sell and share-of-wallet capture, which monetises the retained base further without depending on new acquisition.`;
  } else {
    snapshot = `Mixed Performance: trial at ${fmtPct(trialRate)}, retention at ${fmtPct(retentionRate)}, and preference at ${fmtPct(preferenceRate)} — the funnel is functioning but no single stage is operating at category-leader levels.`;
    classification = `FUNNEL CLASSIFICATION: The bank shows a Mixed Performance profile — none of trial (${fmtPct(trialRate)}), retention (${fmtPct(retentionRate)}), or preference (${fmtPct(preferenceRate)}) sits clearly in the failing tier, but none operates at category-leader strength either. The funnel produces results but compounding underperformance across stages reduces the throughput from aware consumer to primary-bank user.${positionRef}`;
    context = `STRATEGIC CONTEXT: Mixed-performance funnels are deceptive: each individual stage looks acceptable in isolation, but the multiplicative effect means total throughput is materially lower than peer banks with one strong stage and one acceptable stage. Marketing budgets get spread thinly across multiple competing fixes, and resource dilution prevents any single stage from reaching the threshold needed to compound.`;
    action = `PRIORITY ACTION: Identify the single weakest conversion stage and concentrate intervention there for one full planning cycle before addressing others. Sequential, focused stage improvement produces better total funnel throughput than parallel low-intensity fixes across all stages. ${funnelHealthDiagnosis}`;
  }

  return { snapshot, detail: s(classification, context, action) + smplSection(sampleSize) };
}

// ─── 2. Trial insight ────────────────────────────────────────────────────────

export function buildTrialInsight(args: {
  trialRate: number;
  awareCount: number;
  everCount: number;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { trialRate, awareCount, everCount, sampleSize } = args;
  if (awareCount === 0 || sampleSize === 0) return null;
  if (everCount < LOW_SAMPLE_EVER) return null;

  const tier = trialRate < 25 ? 'severe' : trialRate < 40 ? 'moderate' : trialRate < 60 ? 'strong' : 'excellent';

  let snapshot = '';
  let signal = '';
  let acquisition = '';
  let barrier = '';
  let priority = '';

  if (tier === 'severe') {
    snapshot = `Severe trial conversion barrier: only ${fmtPct(trialRate)} of aware consumers have ever used this bank — the awareness-to-trial bridge is fundamentally broken.`;
    signal = `TRIAL CONVERSION SIGNAL: At ${fmtPct(trialRate)} trial among ${awareCount} aware consumers, this bank is failing to convert awareness into first-time use. In banking markets, where trial is the gateway to all downstream revenue, a sub-25% rate signals a serious conversion barrier — fewer than 1 in 4 consumers who know the brand have ever held a relationship with it. The other 3 in 4 have made a deliberate or default decision to bank elsewhere despite being aware.`;
    acquisition = `ACQUISITION IMPLICATION: Every dollar spent on awareness produces only ${fmt(trialRate)} cents of trial conversion value at this rate. The acquisition pipeline is structurally inefficient: the bank is paying to make consumers aware of a brand they then choose not to try, which means each new awareness impression has a lower expected return than peers with healthier trial rates. Scaling awareness investment at this conversion rate compounds the inefficiency rather than overcoming it.`;
    barrier = `CONSUMER BARRIER SIGNAL: When aware consumers do not trial, the barrier is rarely awareness itself — it is trust, accessibility, perceived fit, or active loyalty to an incumbent. The behavioural signal here is that aware non-triers are making an informed decision to bank elsewhere. Until the specific objection is identified, broader-reach campaigns will continue to add aware non-triers without changing the conversion ratio.`;
    priority = `STRATEGIC PRIORITY: Diagnose the trial barrier before increasing marketing investment. Commission qualitative research among the ${awareCount - everCount} aware non-triers to isolate the dominant objection — onboarding friction, account opening complexity, fee perception, branch coverage, or relationship loyalty to a competitor. Each requires a different intervention, and a generic acquisition campaign will not move this rate. Competitors are winning every aware non-trier decision today; closing that gap is the highest-leverage usage investment available.`;
  } else if (tier === 'moderate') {
    snapshot = `Meaningful trial conversion gap: ${fmtPct(trialRate)} of aware consumers have used this bank — the funnel is open but converting at sub-category levels.`;
    signal = `TRIAL CONVERSION SIGNAL: A ${fmtPct(trialRate)} trial rate among ${awareCount} aware consumers indicates moderate but sub-optimal awareness-to-trial conversion. Roughly 1 in 3 aware consumers has tried the bank — meaningful, but trailing category leaders that convert closer to 50%. The remaining two-thirds know the brand but have chosen to bank elsewhere, representing a sizeable pool of latent conversion potential.`;
    acquisition = `ACQUISITION IMPLICATION: At this conversion rate, the awareness pipeline is producing modest trial volume but operating well below efficient ROI. For every 100 aware consumers added through media investment, approximately 60-65 will not convert to trial — meaning marketing budget is partly funding brand familiarity for competitor banks. Improving trial conversion is more cost-efficient than adding new aware consumers at this stage.`;
    barrier = `CONSUMER BARRIER SIGNAL: A moderate trial rate suggests the barrier is not absolute rejection — consumers are aware and partially open — but rather a soft objection: marginal preference for an incumbent, perceived parity (no clear reason to switch), or onboarding friction that defeats marginal intent. These are the most addressable consumer barriers: they do not require fundamentally re-positioning the brand, only sharpening the trial offer.`;
    priority = `STRATEGIC PRIORITY: Build a targeted trial-activation campaign aimed at the high-intent aware non-trier segment. This typically requires a converting offer (account-opening incentive, fee waiver, or product-led trial), distribution through direct channels rather than broad media, and removal of any onboarding friction. Closing the gap from ${fmtPct(trialRate)} to 45-50% is the most efficient path to growth — every percentage point of trial gained at constant awareness compounds through retention and preference.`;
  } else if (tier === 'strong') {
    snapshot = `Healthy trial conversion: ${fmtPct(trialRate)} of aware consumers have used this bank — the awareness-to-trial bridge is functioning at or above category norms.`;
    signal = `TRIAL CONVERSION SIGNAL: A ${fmtPct(trialRate)} trial rate among ${awareCount} aware consumers indicates the awareness-to-trial conversion engine is working. Roughly half of consumers who know this bank have held a relationship with it — a strong signal that the brand's positioning, accessibility, and trust signals are converting awareness into action. This is the conversion tier where awareness investment compounds efficiently through to revenue.`;
    acquisition = `ACQUISITION IMPLICATION: At this conversion rate, additional awareness investment has a strong probability of producing proportional trial gains. The acquisition pipeline is efficient: the bank is not wasting media spend on awareness that fails to convert. The marginal ROI on new awareness reach is high relative to peers operating at sub-40% trial rates.`;
    barrier = `CONSUMER BARRIER SIGNAL: With strong trial, the remaining aware non-trier population represents harder-to-convert consumers — typically those with strong incumbent loyalty or structural product fit issues. The behavioural barrier shifts from "the bank hasn't given me a reason to try" to "I have an established relationship elsewhere." This is a different problem requiring switching incentives rather than first-impression marketing.`;
    priority = `STRATEGIC PRIORITY: Sustain trial conversion through consistency in the elements driving it — accessible onboarding, distinctive positioning, and clear product value. Shift incremental investment toward downstream stages (retention and preference) where the multiplicative effect on revenue is now larger than further trial improvement. Monitor trial rate quarterly: a decline of 3+pp warrants investigation as it would signal an emerging accessibility or trust issue.`;
  } else {
    snapshot = `Exceptional trial penetration: ${fmtPct(trialRate)} of aware consumers have used this bank — the awareness-to-trial conversion is best-in-class.`;
    signal = `TRIAL CONVERSION SIGNAL: A ${fmtPct(trialRate)} trial rate among ${awareCount} aware consumers is exceptional — the majority of the aware market has held a relationship with this bank. This conversion strength indicates the brand has solved the upstream funnel: trust, accessibility, and value perception are translating directly into trial behaviour with minimal leakage.`;
    acquisition = `ACQUISITION IMPLICATION: At this conversion rate, awareness reach is the binding growth constraint. Every percentage point of awareness gained converts through to trial at near-maximum efficiency. Marketing investment in reach expansion has the highest expected ROI in the category — the conversion infrastructure is in place and is bottlenecked only by the size of the aware pool.`;
    barrier = `CONSUMER BARRIER SIGNAL: The small residual aware non-trier population at this conversion level is structurally hardest to win — long-standing incumbent loyalty, product mismatch, or geographic friction. Diminishing returns apply to further trial conversion gains; the next 5pp is significantly more expensive to win than the last 5pp.`;
    priority = `STRATEGIC PRIORITY: Reorient growth investment from trial conversion to awareness reach and downstream depth. The bank should now focus on growing the aware base (every new aware consumer trials at ~${fmtPct(trialRate)}) and on deepening relationships among the large existing trial base through retention and preference capture initiatives. Trial-rate is no longer the limiting metric.`;
  }

  return { snapshot, detail: s(signal, acquisition, barrier, priority) + smplSection(sampleSize) };
}

// ─── 3. Retention insight ────────────────────────────────────────────────────

export function buildRetentionInsight(args: {
  retentionRate: number;
  churnRate: number;
  lapseRate: number;
  everCount: number;
  currentCount: number;
  retentionMedian: number;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { retentionRate, churnRate, lapseRate, everCount, currentCount, retentionMedian, sampleSize } = args;
  if (everCount < LOW_SAMPLE_EVER || sampleSize === 0) return null;

  const tier = retentionRate < 40 ? 'critical' : retentionRate < 55 ? 'weak' : retentionRate < 70 ? 'moderate' : retentionRate <= 82 ? 'strong' : 'excellent';

  const lapsedCount = everCount - currentCount;

  let snapshot = '';
  let signal = '';
  let lapse = '';
  let implication = '';

  if (tier === 'critical') {
    snapshot = `Critical retention failure: only ${fmtPct(retentionRate)} of ever-users remain active — the majority of acquired customers have stopped using this bank.`;
    signal = `RETENTION SIGNAL: Among the ${everCount} consumers who have ever used this bank, only ${currentCount} (${fmtPct(retentionRate)}) remain active. The remaining ${lapsedCount} have lapsed — they tried the bank and chose to stop. Retention is computed against ever-users, not the total aware market, so this rate isolates the bank's ability to hold acquired customers, independent of upstream acquisition performance.`;
    lapse = `LAPSE RISK: A ${fmtPct(lapseRate)} lapse rate (${fmtPct(churnRate)} churn) in volume terms means ${lapsedCount} consumers have stopped using the bank after having tried it. Each lapsed user carries the full cost of original acquisition plus the opportunity cost of the lifetime value never realised. This is the most expensive customer-economics signal in the funnel — retention failure destroys more enterprise value than weak acquisition because the acquisition cost has already been paid.`;
    implication = `BUSINESS IMPLICATION: Retention economics dictate that recovering a lapsed user costs significantly less than acquiring a net-new aware consumer who has never tried the bank. The lapsed cohort already knows the product, has been through onboarding, and has a basis for forming an informed decision to return. A structured reactivation programme targeting recent lapsers — with diagnosed reasons-for-lapse — has the highest expected ROI of any usage-stage investment. Scaling acquisition before fixing retention compounds losses, not gains.`;
  } else if (tier === 'weak') {
    snapshot = `Below-average retention: ${fmtPct(retentionRate)} of ever-users remain active — material lapse risk is reducing the lifetime value of acquired customers.`;
    signal = `RETENTION SIGNAL: Among ${everCount} consumers who have ever used the bank, ${currentCount} (${fmtPct(retentionRate)}) remain active and ${lapsedCount} have lapsed. Retention is denominated against the ever-tried base, not total awareness, so this isolates customer-relationship strength from upstream acquisition volume. A rate below 55% means the bank is losing nearly half of every cohort it acquires.`;
    lapse = `LAPSE RISK: A ${fmtPct(lapseRate)} lapse rate translates into ${lapsedCount} customers lost after acquisition. In customer-economics terms, this is a material drag on lifetime value — the acquisition investment is partially recovered before the customer departs. Churn at ${fmtPct(churnRate)} means roughly 1 in 2 acquired users is not present to be cross-sold, retained, or moved into primary preference.`;
    implication = `BUSINESS IMPLICATION: Retention is asymmetric — it is materially cheaper to retain a customer who has already onboarded than to re-acquire a net-new one. Identifying the dominant lapse driver (first-30-day onboarding completion, transaction-pattern abandonment, product friction, or competitive switching) and addressing it produces compounding gains: each retained customer continues to generate revenue while reducing the acquisition burden on the upstream funnel.`;
  } else if (tier === 'moderate') {
    snapshot = `Moderate retention with material lapse: ${fmtPct(retentionRate)} of ever-users remain active — competent but trailing best-in-class banks.`;
    signal = `RETENTION SIGNAL: Among ${everCount} ever-users, ${currentCount} (${fmtPct(retentionRate)}) remain active and ${lapsedCount} have lapsed. Retention is computed against the ever-tried base, isolating relationship strength from acquisition volume. At this tier the bank is holding the majority of its cohort but losing a meaningful share — competent execution, not best-in-class.`;
    lapse = `LAPSE RISK: A ${fmtPct(lapseRate)} lapse rate (${fmtPct(churnRate)} churn) represents ${lapsedCount} customers who acquired, used, and departed. While not at crisis levels, this lapse volume is significant in customer-economics terms — every lapsed user is an investment that did not fully amortise, and the cumulative effect across periods reduces the size of the active base disproportionately.`;
    implication = `BUSINESS IMPLICATION: Closing the gap to top-tier retention (75%+) is more cost-efficient than increasing acquisition. Retention asymmetry means the marginal investment in keeping a customer is materially lower than the marginal investment in acquiring a replacement. Diagnose the 2-3 most common lapse moments and run a structured intervention — onboarding completion, first-transaction activation, or product feature adoption — before scaling acquisition spend.`;
  } else if (tier === 'strong') {
    snapshot = `Strong retention: ${fmtPct(retentionRate)} of ever-users remain active — the bank is holding the customers it acquires at category-leader levels.`;
    signal = `RETENTION SIGNAL: Among ${everCount} ever-users, ${currentCount} (${fmtPct(retentionRate)}) remain active. Retention is denominated against the ever-tried base, isolating the bank's ability to hold acquired customers. At this tier, the bank is retaining the substantial majority of every acquired cohort — a structural competitive advantage in customer economics.`;
    lapse = `LAPSE RISK: A ${fmtPct(lapseRate)} lapse rate (${fmtPct(churnRate)} churn) represents ${lapsedCount} departed customers — a normal level of attrition for a mature banking relationship. The volume is manageable through standard reactivation outreach and does not signal systemic retention failure.`;
    implication = `BUSINESS IMPLICATION: Strong retention compounds: customer lifetime value is recovered with high probability, acquisition investment amortises efficiently, and the active base grows with each successful cohort. The strategic focus should shift from retention defence to deepening primary-bank preference within the retained base — converting current users from secondary to primary status produces more revenue uplift per existing customer than reducing the remaining lapse volume further.`;
  } else {
    snapshot = `Best-in-class retention: ${fmtPct(retentionRate)} of ever-users remain active — customer relationship strength is exceptional and durable.`;
    signal = `RETENTION SIGNAL: Among ${everCount} ever-users, ${currentCount} (${fmtPct(retentionRate)}) remain active. Retention at this level is exceptional and indicates the bank has solved the customer-relationship problem at structural depth — onboarding, experience, and product-fit are all functioning at category-leading standards. The lapse volume of ${lapsedCount} is below the threshold where intervention produces meaningful incremental gain.`;
    lapse = `LAPSE RISK: A ${fmtPct(lapseRate)} lapse rate (${fmtPct(churnRate)} churn) is below the threshold where retention intervention produces material ROI. The remaining lapse population is structurally hard to retain — life-stage moves, product mismatch, or full primary-bank consolidation with a competitor — and further reduction has diminishing returns.`;
    implication = `BUSINESS IMPLICATION: With retention solved, the binding growth constraint shifts upstream (acquiring more aware consumers and converting them to trial) and downstream (deepening primary-bank share-of-wallet within the retained base). Continued retention investment beyond current levels has lower marginal return than reach investment or preference-capture investment.`;
  }

  const benchmark = (() => {
    if (retentionMedian > 0) {
      const diff = retentionRate - retentionMedian;
      const absD = fmt(Math.abs(diff));
      if (Math.abs(diff) < 1) {
        return `BENCHMARK CONTEXT: Retention sits at the median of tracked banks (${fmtPct(retentionMedian)}), placing the bank in the middle of the competitive field. Competitive parity on retention means neither winning nor losing customer-economics advantage — the strategic differentiation must come from other stages of the funnel.`;
      } else if (diff > 0) {
        return `BENCHMARK CONTEXT: Retention is ${absD}pp ahead of the tracked-bank median (${fmtPct(retentionMedian)}), a competitive customer-economics advantage. Retaining customers better than peers means the bank's lifetime value per acquired user is structurally higher — a compounding edge that becomes increasingly difficult for competitors to reverse without significant product and experience investment.`;
      } else {
        return `BENCHMARK CONTEXT: Retention is ${absD}pp behind the tracked-bank median (${fmtPct(retentionMedian)}), a competitive disadvantage in customer economics. Peer banks are amortising acquisition investment more efficiently, which gives them either more marketing budget capacity for the same growth or more margin headroom at the same scale. Closing this gap is a direct competitive priority.`;
      }
    }
    return '';
  })();

  const sections = benchmark
    ? s(signal, benchmark, lapse, implication)
    : s(signal, lapse, implication);

  return { snapshot, detail: sections + smplSection(sampleSize) };
}

// ─── 4. Preference insight ───────────────────────────────────────────────────

export function buildPreferenceInsight(args: {
  preferenceRate: number;
  bumoPenetration: number;
  preferredCount: number;
  currentCount: number;
  positionLabel: string;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { preferenceRate, bumoPenetration, preferredCount, currentCount, positionLabel, sampleSize } = args;
  if (currentCount < LOW_SAMPLE_CURRENT || sampleSize === 0) return null;

  const tier = preferenceRate < 20 ? 'shallow' : preferenceRate < 35 ? 'moderate' : preferenceRate <= 55 ? 'strong' : 'dominant';
  const positionRef = positionLabel !== 'N/A' ? ` This is consistent with the bank's ${positionLabel} position on the usage-retention matrix.` : '';

  let snapshot = '';
  let capture = '';
  let depth = '';
  let bumo = '';
  let commercial = '';

  if (tier === 'shallow') {
    snapshot = `Shallow preference capture: only ${fmtPct(preferenceRate)} of active users see this as their primary bank — the majority are treating the relationship as secondary.`;
    capture = `PREFERENCE CAPTURE SIGNAL: Among ${currentCount} active users, only ${preferredCount} (${fmtPct(preferenceRate)}) name this as their primary bank. The remaining ${currentCount - preferredCount} hold active accounts but route their primary banking relationship — salary, savings, and the majority of share-of-wallet — to a competitor. The bank is being used, but it is not being chosen.${positionRef}`;
    depth = `CUSTOMER RELATIONSHIP STRENGTH: A shallow preference rate signals that account activity here is shallow by design: users may keep this account for a specific purpose — secondary salary, dedicated savings, mobile money interface, or geographic convenience — while their full financial relationship lives elsewhere. The economic value of these accounts is a fraction of a true primary relationship, typically 20-40% of primary-user revenue.`;
    bumo = `PRIMARY BANK PENETRATION CONTEXT: Primary bank penetration of ${fmtPct(bumoPenetration)} — preferred users as a share of the aware market — confirms the structural preference gap. The bank is not winning the primary-bank decision in the broader market either, only holding accounts within active users.`;
    commercial = `BUSINESS IMPACT: This is the highest-leverage commercial gap in the funnel. Converting the secondary-user majority to primary status produces a 2-3× revenue lift per converted customer without requiring any acquisition or retention investment — these customers are already onboarded, active, and accessible. Primary conversion requires structural incentives (salary deposit benefits, primary-account product depth, fee waivers tied to share-of-wallet) rather than marketing campaigns.`;
  } else if (tier === 'moderate') {
    snapshot = `Mixed preference capture: ${fmtPct(preferenceRate)} of active users see this as their primary bank — a real base of loyalists alongside a large secondary-user majority.`;
    capture = `PREFERENCE CAPTURE SIGNAL: Among ${currentCount} active users, ${preferredCount} (${fmtPct(preferenceRate)}) name this as their primary bank. The remaining ${currentCount - preferredCount} are active but treat the bank as secondary, routing their primary relationship elsewhere. The bank has won genuine loyalty from roughly a third of its active base, while two-thirds maintain it as a complementary account.${positionRef}`;
    depth = `CUSTOMER RELATIONSHIP STRENGTH: At this preference tier, the bank has a real primary-bank franchise — meaningful in scale but limited in share. The split signals that the bank is competitive on dimensions that earn primary status for some customer segments (likely those for whom the bank's specific strengths matter most) but is being out-positioned by competitors on broader primary-bank dimensions for the majority.`;
    bumo = `PRIMARY BANK PENETRATION CONTEXT: Primary bank penetration of ${fmtPct(bumoPenetration)} — preferred users as a share of the aware market — indicates the bank holds primary status for a meaningful but minority slice of the addressable market. Growth in primary bank penetration is one of the most direct predictors of category share gain.`;
    commercial = `BUSINESS IMPACT: The 65-80% secondary-user population is the largest upgrade opportunity in the funnel — these customers are already active and the cost of moving them to primary is lower than acquisition of net-new customers. Identify the specific dimensions on which the existing primary base chose this bank, and extend those same propositions to the secondary base. This is product-and-experience work, not marketing campaign work.`;
  } else if (tier === 'strong') {
    snapshot = `Strong primary-bank position: ${fmtPct(preferenceRate)} of active users see this as their primary bank — the relationship base is built on genuine preference, not just account activity.`;
    capture = `PREFERENCE CAPTURE SIGNAL: Among ${currentCount} active users, ${preferredCount} (${fmtPct(preferenceRate)}) name this as their primary bank. A majority — or close to a majority — of the active base treats this as their primary financial relationship, routing salary, savings, and most transactions through the bank. This is a strong relationship-economics position with high revenue per customer relative to peers operating below 35% preference.${positionRef}`;
    depth = `CUSTOMER RELATIONSHIP STRENGTH: At this tier the bank holds true primary status for the majority of its active base. These customers contribute the full economic value of a primary banking relationship — deposit balances, transaction volume, cross-sold products, and lending activity — rather than the partial value of a secondary account. Customer lifetime value within the preferred base is materially higher than the funnel average.`;
    bumo = `PRIMARY BANK PENETRATION CONTEXT: Primary bank penetration of ${fmtPct(bumoPenetration)} — preferred users as a share of the aware market — confirms that the bank holds genuine primary-bank share at the market level, not just within its existing relationships. This is the most commercially valuable form of brand position in banking.`;
    commercial = `BUSINESS IMPACT: With strong preference capture, the strategic priority shifts from upgrading secondary users to deepening primary-user value (cross-sell, share-of-wallet, retention defence) and to acquiring more customers into the funnel. The conversion mechanics are working; growing the input volume produces proportional primary-bank base growth.`;
  } else {
    snapshot = `Dominant primary-bank position: ${fmtPct(preferenceRate)} of active users see this as their primary bank — the relationship economics are best-in-class.`;
    capture = `PREFERENCE CAPTURE SIGNAL: Among ${currentCount} active users, ${preferredCount} (${fmtPct(preferenceRate)}) name this as their primary bank. A strong majority of the active base holds this as their primary financial relationship — an exceptional position in competitive banking markets where multi-banking is structural and secondary-bank syndrome is the norm.${positionRef}`;
    depth = `CUSTOMER RELATIONSHIP STRENGTH: At dominant preference, the bank is the financial anchor for most of its active customers. This translates into maximum share-of-wallet capture, the strongest cross-sell economics, and the most defensible customer-relationship moat in the category. Customer lifetime value is at the top of the category distribution.`;
    bumo = `PRIMARY BANK PENETRATION CONTEXT: Primary bank penetration of ${fmtPct(bumoPenetration)} — preferred users as a share of the aware market — shows the bank captures primary-bank status at a structurally advantaged rate across the whole addressable market, not just within its existing relationships.`;
    commercial = `BUSINESS IMPACT: Dominant preference is the most defensible commercial position in banking. The strategic priority is now scale — feeding more aware consumers through trial and retention into a relationship base that converts to primary at exceptional rates. Investment should reorient upstream (acquisition) and protect the experience drivers that produced this preference position from any disruption.`;
  }

  return { snapshot, detail: s(capture, depth, bumo, commercial) + smplSection(sampleSize) };
}

// ─── 5. Multi-banking insight ────────────────────────────────────────────────

export function buildMultiBankingInsight(args: {
  multiBankingPct: number;
  singleBankerPct: number;
  dualBankerPct: number;
  primaryPositionInMultiPct: number;
  avgBanksPerUser: number;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { multiBankingPct, singleBankerPct, dualBankerPct, primaryPositionInMultiPct, avgBanksPerUser, sampleSize } = args;
  if (sampleSize === 0) return null;

  const isHighMulti = multiBankingPct > 50;
  const isLowMulti = multiBankingPct < 30;
  const isStrongPrimary = primaryPositionInMultiPct > 60;
  const isWeakPrimary = primaryPositionInMultiPct < 30;

  let snapshot = '';
  let exposure = '';
  let risk = '';
  let primary = '';
  let implication = '';

  if (isHighMulti && isWeakPrimary) {
    snapshot = `Maximum competitive vulnerability: ${fmtPct(multiBankingPct)} of users hold multiple banks and only ${fmtPct(primaryPositionInMultiPct)} of them treat this bank as primary — the wallet is shared and this bank is losing the share battle.`;
    exposure = `MULTI-BANKING EXPOSURE: ${fmtPct(multiBankingPct)} of users hold more than one banking relationship — a structurally high exposure level. The average user maintains ${fmt(avgBanksPerUser)} bank accounts, indicating the addressable wallet is fragmented across competitors by default. Multi-banking is normal and growing in East African markets; the strategic question is not whether to prevent it but whether this bank wins the primary share within multi-bank wallets.`;
    risk = `COMPETITIVE SHARE RISK: With ${fmt(100 - primaryPositionInMultiPct)}% of multi-bank users treating this as a secondary relationship, the bank is structurally exposed to competitor displacement. Secondary-bank accounts generate a fraction of primary-bank revenue — typically 20-40% — and are the easiest to close or de-prioritise when consumers consolidate their banking. Every secondary position represents enterprise-value risk.`;
    primary = `PRIMARY POSITION STRENGTH: Only ${fmtPct(primaryPositionInMultiPct)} of multi-banking users hold this bank as their primary — a structurally weak position. In multi-bank wallets, the primary holder captures the dominant share of deposit balances, transaction volume, and cross-sell revenue. The other banks in the wallet — including this one — share the remainder thinly.`;
    implication = `BUSINESS IMPLICATION: The combination of high multi-banking and weak primary position is the highest-risk usage profile in banking. The bank is present in many wallets but commercially valuable in few. Single-banker share of ${fmtPct(singleBankerPct)} means the loyal-base is small. Priority intervention: identify the dimensions on which competitors are winning primary within shared wallets (typically salary routing, primary-account benefits, or product depth) and close the gap before consolidation pressure compounds the secondary-bank revenue gap.`;
  } else if (isHighMulti && isStrongPrimary) {
    snapshot = `Managed multi-bank exposure: ${fmtPct(multiBankingPct)} of users hold multiple banks but ${fmtPct(primaryPositionInMultiPct)} of them treat this as primary — the bank is winning primary share even in shared wallets.`;
    exposure = `MULTI-BANKING EXPOSURE: ${fmtPct(multiBankingPct)} of users hold multiple banks, with an average of ${fmt(avgBanksPerUser)} accounts per user. Multi-banking exposure is high, reflecting the structural reality of East African banking markets where consumers maintain multiple accounts for different purposes. This level of multi-banking is not avoidable — but it is winnable.`;
    risk = `COMPETITIVE SHARE RISK: With strong primary capture inside multi-bank wallets (${fmtPct(primaryPositionInMultiPct)}), the share-of-wallet risk is materially lower than the multi-banking volume would suggest. The bank is competing successfully for the dominant share of fragmented wallets rather than being relegated to secondary status.`;
    primary = `PRIMARY POSITION STRENGTH: ${fmtPct(primaryPositionInMultiPct)} of multi-bank users treat this as their primary — a strong position that captures the majority of deposit balances, transaction volume, and cross-sell potential within those wallets. The bank is acting as the financial anchor in wallets that contain competitor accounts only for specific use cases.`;
    implication = `BUSINESS IMPLICATION: This is a managed multi-bank profile — high exposure but strong commercial capture. Single-banker share of ${fmtPct(singleBankerPct)} is small, but the multi-bank base is being monetised effectively. The strategic priority is defending primary status in the existing wallet base and extending primary capture into the remaining secondary-status segment.`;
  } else if (isLowMulti) {
    snapshot = `Concentrated, loyal base: ${fmtPct(singleBankerPct)} of users bank only with this institution — a strong single-banker franchise, with implications for both loyalty and growth headroom.`;
    exposure = `MULTI-BANKING EXPOSURE: Only ${fmtPct(multiBankingPct)} of users hold multiple banking relationships, with an average of ${fmt(avgBanksPerUser)} accounts per user. This is low multi-bank exposure relative to East African market norms, where multi-banking is structurally growing. The implication can be read two ways: either the bank has exceptionally loyal customers who do not feel the need to diversify, or the customer base is in a market segment that has not yet adopted multi-banking behaviour.`;
    risk = `COMPETITIVE SHARE RISK: Low multi-banking means the active base is captive in share-of-wallet terms — each customer's banking activity is concentrated here. This is commercially advantaged in the short term: maximum share-of-wallet capture per customer. But it carries forward risk: as multi-banking grows in the broader market (driven by mobile money interoperability, salary advance products, and digital-only banks), this base will face external pull toward fragmentation.`;
    primary = `PRIMARY POSITION STRENGTH: Among the ${fmtPct(multiBankingPct)} of users who do multi-bank, ${fmtPct(primaryPositionInMultiPct)} treat this as their primary. The small multi-bank segment is showing ${isStrongPrimary ? 'strong primary capture' : isWeakPrimary ? 'weak primary capture, an early warning of competitive vulnerability' : 'mixed primary capture'}.`;
    implication = `BUSINESS IMPLICATION: A concentrated base is strong today but requires forward-looking defence. Monitor multi-banking growth in the customer base quarterly; a 5+pp rise over 2 periods signals competitive entry into the wallet. Begin pre-emptive primary-bank reinforcement (salary deposit incentives, primary-account benefits, share-of-wallet tracking) before the share dilution begins. Loyalty in a non-multi-banking segment is fragile if the segment shifts.`;
  } else {
    snapshot = `Mixed multi-banking exposure: ${fmtPct(multiBankingPct)} of users hold multiple banks, with ${fmtPct(primaryPositionInMultiPct)} primary capture among them — neither the share is locked in nor structurally lost.`;
    exposure = `MULTI-BANKING EXPOSURE: ${fmtPct(multiBankingPct)} of users hold multiple banks (${fmt(avgBanksPerUser)} accounts on average), and ${fmtPct(singleBankerPct)} bank only with this institution. The exposure profile is moderate — neither the concentrated single-banker franchise of a niche bank nor the maximum-exposure profile of a fragmented-market participant.`;
    risk = `COMPETITIVE SHARE RISK: The combination of moderate multi-banking and ${fmtPct(primaryPositionInMultiPct)} primary capture means share-of-wallet is at risk for the dual- and multi-banker segments. ${fmtPct(dualBankerPct)} of users hold exactly two banks — the segment most vulnerable to consolidation pressure, where the bank could either consolidate its primary status or lose share entirely.`;
    primary = `PRIMARY POSITION STRENGTH: ${fmtPct(primaryPositionInMultiPct)} of multi-bank users hold this as primary — meaningful but not dominant. The bank is winning the primary share for some shared wallets but losing it for others, suggesting the primary-status drivers are segment-specific rather than universally applied.`;
    implication = `BUSINESS IMPLICATION: Focus on the dual-banker segment first — they are the most contestable, with the highest immediate ROI on primary-capture intervention. Identify the specific dimensions on which the existing primary multi-bank users chose this bank and extend those propositions to the secondary multi-bank base.`;
  }

  return { snapshot, detail: s(exposure, risk, primary, implication) + smplSection(sampleSize) };
}

// ─── 6. Usage funnel insight (section-level) ─────────────────────────────────

export function buildUsageFunnelInsight(args: {
  trialRate: number;
  retentionRate: number;
  preferenceRate: number;
  funnelHealthDiagnosis: string;
  highestFrictionStage: string;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { trialRate, retentionRate, preferenceRate, funnelHealthDiagnosis, highestFrictionStage, sampleSize } = args;
  if (sampleSize === 0) return null;

  const pattern = classifyFunnelPattern(funnelHealthDiagnosis);

  // Determine the shape of the funnel
  const rates = [
    { name: 'trial', value: trialRate },
    { name: 'retention', value: retentionRate },
    { name: 'preference', value: preferenceRate },
  ];
  const weakest = rates.reduce((a, b) => (a.value < b.value ? a : b));
  const strongest = rates.reduce((a, b) => (a.value > b.value ? a : b));

  let shapeLabel = '';
  if (trialRate < retentionRate && trialRate < preferenceRate) {
    shapeLabel = 'front-loaded drop-off — trial is the primary bottleneck';
  } else if (retentionRate < trialRate && retentionRate < preferenceRate) {
    shapeLabel = 'mid-funnel leakage — retention is the primary bottleneck';
  } else if (preferenceRate < trialRate && preferenceRate < retentionRate) {
    shapeLabel = 'preference gap — the relationship is active but not primary';
  } else {
    shapeLabel = 'flat cascade — no single stage dominates the friction';
  }

  const snapshot = `Funnel shape: ${shapeLabel}. Trial ${fmtPct(trialRate)} → retention ${fmtPct(retentionRate)} → preference ${fmtPct(preferenceRate)}.`;

  const classification = `FUNNEL ASSESSMENT: The conversion cascade reads ${fmtPct(trialRate)} trial → ${fmtPct(retentionRate)} retention → ${fmtPct(preferenceRate)} preference, classified as ${pattern}. The diagnostic signal is "${funnelHealthDiagnosis.replace(/\.$/, '')}" — meaning the overall health pattern is identifiable from the conversion rates alone. Funnel-level interpretation matters more than any single rate because each downstream stage compounds the prior stage's leakage.`;

  const friction = `HIGHEST FRICTION POINT: The highest-friction stage is "${highestFrictionStage}". This is where conversion volume is being lost at the greatest cost, based on commercial impact weighting. The downstream effect of friction at this stage compounds through every subsequent stage — closing it has the largest multiplicative impact on total funnel throughput. The weakest individual rate is ${weakest.name} at ${fmtPct(weakest.value)}, materially below the strongest stage (${strongest.name} at ${fmtPct(strongest.value)}).`;

  const priority = `CONVERSION PRIORITY: A cumulative funnel throughput of approximately ${fmt((trialRate / 100) * (retentionRate / 100) * (preferenceRate / 100) * 100)}% — the share of aware consumers who become primary-bank users — captures the multiplicative reality of the cascade. Improving the weakest stage produces the largest absolute throughput gain because it addresses the primary bottleneck that downstream stages multiply against. Parallel investment across all three stages dilutes intensity and produces less aggregate gain than concentrated stage-specific improvement.`;

  const action = `RECOMMENDED NEXT STEPS: Concentrate intervention at "${highestFrictionStage}" for one full planning cycle before addressing other stages. Set a stage-specific improvement target (e.g., +5pp on the weakest rate) and measure monthly. Avoid spreading marketing investment across all three stages simultaneously — sequential, focused stage improvement compounds; parallel low-intensity fixes do not.`;

  return { snapshot, detail: s(classification, friction, priority, action) + smplSection(sampleSize) };
}

// ─── 7. Drop-off insight ─────────────────────────────────────────────────────

export function buildDropoffInsight(args: {
  dropoffStages: UsageDropoffStage[];
  highestFrictionStage: string;
  funnelHealthDiagnosis: string;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { dropoffStages, highestFrictionStage, funnelHealthDiagnosis, sampleSize } = args;
  if (dropoffStages.length === 0 || sampleSize === 0) return null;

  const peakStage = [...dropoffStages].sort((a, b) => b.frictionScore - a.frictionScore)[0];

  const snapshot = `Highest-friction stage: ${peakStage.stage} — ${peakStage.lostCount} consumers are lost at this transition, the largest weighted leak in the funnel.`;

  const stageLines = dropoffStages
    .map((stage) => `• ${stage.stage}: ${fmtPct(stage.dropoffPct)} drop-off (${stage.lostCount} lost, friction score ${fmt(stage.frictionScore, 2)}) — ${stage.diagnosis}`)
    .join('\n');

  const stageDiagnosis = `STAGE-BY-STAGE DIAGNOSIS: The three funnel transitions show distinct drop-off profiles:\n${stageLines}\n\nFriction score weights raw drop-off by the commercial impact of the transition: Aware -> Ever Used carries weight 1.0, Ever Used -> Currently Using carries weight 2.0 (the highest, because lost retention destroys already-paid acquisition cost), and Currently Using -> Preferred Bank carries weight 1.5 (lost preference forfeits primary-bank revenue uplift).`;

  const highestStage = `HIGHEST FRICTION STAGE: "${highestFrictionStage}" has the highest friction score (${fmt(peakStage.frictionScore, 2)}) with ${peakStage.lostCount} lost consumers at a ${fmtPct(peakStage.dropoffPct)} drop-off rate. ${peakStage.diagnosis} The overall funnel diagnosis — "${funnelHealthDiagnosis.replace(/\.$/, '')}" — is driven primarily by leakage at this stage.`;

  const lostVolume = `LOST VOLUME ESTIMATE: ${peakStage.lostCount} consumers are not reaching the next stage of the funnel at the highest-friction transition. In commercial terms this represents the largest single pool of recoverable funnel value — these consumers have already crossed the prior funnel boundary, so the marginal cost of converting them at this stage is materially lower than acquiring net-new consumers further upstream.`;

  const fix = (() => {
    if (peakStage.stage === 'Aware -> Ever Used') {
      return `RECOMMENDED FIX: Trial conversion is the primary bottleneck. Diagnose the specific reason aware consumers are not trying the bank — trust, accessibility, onboarding friction, or active loyalty to a competitor — and address it with a targeted activation initiative. Broad-reach awareness investment will not move this rate.`;
    } else if (peakStage.stage === 'Ever Used -> Currently Using') {
      return `RECOMMENDED FIX: Retention is the primary bottleneck and carries the highest commercial cost — every lapsed user is sunk acquisition investment. Map the lapse moment (first 30 days, transaction-pattern abandonment, product friction, or competitive switch) and run a structured intervention before any acquisition expansion. Reactivation of recent lapsers is the highest-ROI activity in the funnel.`;
    } else {
      return `RECOMMENDED FIX: Preference capture is the primary bottleneck. Active users are not selecting the bank as primary, indicating structural propositions for primary status (salary deposit benefits, product depth, share-of-wallet incentives) need to be developed. Marketing alone will not move this rate — it requires product and customer-experience intervention.`;
    }
  })();

  return { snapshot, detail: s(stageDiagnosis, highestStage, lostVolume, fix) + smplSection(sampleSize) };
}

// ─── 8. Segmentation insight ─────────────────────────────────────────────────

export function buildSegmentationInsight(args: {
  nonTriersCount: number;
  lapsedUsersCount: number;
  secondaryUsersCount: number;
  primaryUsersCount: number;
  awareCount: number;
  opportunities: UsageOpportunity[];
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { nonTriersCount, lapsedUsersCount, secondaryUsersCount, primaryUsersCount, awareCount, opportunities, sampleSize } = args;
  if (awareCount === 0 || sampleSize === 0) return null;

  const top = opportunities[0];

  const nonTrierPct = (nonTriersCount / awareCount) * 100;
  const lapsedPct = (lapsedUsersCount / awareCount) * 100;
  const secondaryPct = (secondaryUsersCount / awareCount) * 100;
  const primaryPct = (primaryUsersCount / awareCount) * 100;

  const snapshot = top
    ? `Highest-ROI target: ${top.name} (${top.size} consumers, ${fmtPct(top.pct)} of the relevant base) — the largest addressable opportunity in the usage funnel.`
    : `Segment breakdown: ${nonTriersCount} non-triers, ${lapsedUsersCount} lapsed, ${secondaryUsersCount} secondary users, ${primaryUsersCount} primary users.`;

  const breakdown = `SEGMENT SIZE BREAKDOWN: The aware market of ${awareCount} consumers divides into four states: ${nonTriersCount} non-triers (${fmtPct(nonTrierPct)} — aware but never used, acquisition target), ${lapsedUsersCount} lapsed users (${fmtPct(lapsedPct)} — used to use, stopped, reactivation target), ${secondaryUsersCount} secondary users (${fmtPct(secondaryPct)} — active but treat the bank as secondary, upgrade target), and ${primaryUsersCount} primary users (${fmtPct(primaryPct)} — active and treat the bank as primary, retention priority). Each segment requires a distinct intervention, and the relative sizes determine where the largest commercial gain is available.`;

  const target = top
    ? `HIGHEST-ROI TARGET: ${top.name} — ${top.size} consumers (${fmtPct(top.pct)} of the relevant base). ${top.note} This segment is the largest addressable opportunity in the funnel because of its scale and because the marginal cost of conversion is lower than for adjacent segments. Concentrating initial investment here produces the largest absolute commercial gain.`
    : `HIGHEST-ROI TARGET: No clear opportunity segment dominates the funnel — all four states are present at materially balanced scale.`;

  const choice = `ACQUISITION VS REACTIVATION CHOICE: The strategic choice between acquiring non-triers, reactivating lapsed users, and upgrading secondary users is fundamentally an economics question. Acquiring non-triers (${nonTriersCount} consumers) requires the full awareness → trial journey, including overcoming whatever objection caused them not to try the bank initially — the most expensive path per converted customer. Reactivating lapsed users (${lapsedUsersCount} consumers) starts from a position of product familiarity and prior onboarding — lower cost per converted customer, but requires diagnosing the lapse reason. Upgrading secondary users (${secondaryUsersCount} consumers) requires no acquisition spend at all — these customers are already active — but requires structural preference-shift work (product, experience, salary routing) rather than marketing campaigns. In most funnels the secondary-user upgrade produces the highest ROI per dollar invested because the customer is already accessible.`;

  const action = top
    ? `STRATEGIC ACTION: Prioritise ${top.name} as the lead intervention for the next planning cycle. Define a quarterly target for converting this segment (e.g., 10-15% reduction in its size) and design the channel mix to match its specific behavioural profile. Run parallel monitoring of the other three segments but do not dilute intervention budget across all of them — concentrated focus on the largest segment produces materially better results than diffuse investment.`
    : `STRATEGIC ACTION: With no dominant opportunity segment, the strategic priority is the segment with the lowest cost per converted customer — typically the secondary-user upgrade segment. Begin there and reassess once the four-segment distribution shifts.`;

  return { snapshot, detail: s(breakdown, target, choice, action) + smplSection(sampleSize) };
}

// ─── 9. Conversion chain insight ─────────────────────────────────────────────

export function buildConversionChainInsight(args: {
  trialRate: number;
  retentionRate: number;
  preferenceRate: number;
  opportunities: UsageOpportunity[];
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { trialRate, retentionRate, preferenceRate, opportunities, sampleSize } = args;
  if (sampleSize === 0) return null;

  const churnRate = Math.max(0, 100 - retentionRate);
  const cumulative = (trialRate / 100) * (retentionRate / 100) * (preferenceRate / 100) * 100;

  // Identify the weakest link with friction weighting
  // Friction weighting reflects commercial impact: retention failure (weight 2.0) is more costly
  // than trial or preference failure (1.0/1.5) at the same absolute rate.
  const weightedRates = [
    { name: 'trial', value: trialRate, weight: 1.0, deficitWeighted: (100 - trialRate) * 1.0 },
    { name: 'retention', value: retentionRate, weight: 2.0, deficitWeighted: (100 - retentionRate) * 2.0 },
    { name: 'preference', value: preferenceRate, weight: 1.5, deficitWeighted: (100 - preferenceRate) * 1.5 },
  ];
  const weakestLink = weightedRates.reduce((a, b) => (a.deficitWeighted > b.deficitWeighted ? a : b));
  const top = opportunities[0];

  const snapshot = `Cumulative conversion: ${fmtPct(cumulative)} of aware consumers become primary-bank users — the multiplicative effect of trial × retention × preference compresses headline rates into a small absolute outcome.`;

  const ranking = `KEY CONVERSION DRIVERS: The chain multiplies: ${fmtPct(trialRate)} trial × ${fmtPct(retentionRate)} retention × ${fmtPct(preferenceRate)} preference = ${fmtPct(cumulative)} of aware consumers reaching primary-bank status. Weighted by commercial impact (retention carries 2× weight because each lapsed user is sunk acquisition cost; preference carries 1.5× weight because primary-bank revenue is 2-3× secondary-bank revenue), the weakest link is ${weakestLink.name} at ${fmtPct(weakestLink.value)}. Improving this stage produces the largest downstream multiplier effect — a 5pp gain at the weakest stage flows through every downstream stage at full magnitude, while a 5pp gain at a secondary stage is partially offset by existing leakage upstream.`;

  const balance = `ACQUISITION VS RETENTION BALANCE: Trial conversion (${fmtPct(trialRate)}) measures upstream acquisition efficiency — how well awareness investment translates into first-time use. Retention (${fmtPct(retentionRate)}) and churn (${fmtPct(churnRate)}) measure mid-funnel customer-economics — how well acquired customers are held. Preference (${fmtPct(preferenceRate)}) measures downstream relationship depth — how many active users treat the bank as primary. The balance between these levers indicates strategic emphasis: a high trial / low retention profile is acquisition-heavy and economically inefficient, while a moderate trial / high retention / high preference profile is retention-heavy and commercially compounding. Current rates indicate the dominant lever to fix is ${weakestLink.name}.`;

  const priority = top
    ? `STRATEGIC PRIORITY: Concentrate intervention at the ${weakestLink.name} stage for one full planning cycle. The largest opportunity surfaced by the segment analysis is "${top.name}" (${top.size} consumers), which aligns with the weakest-link diagnostic. Avoid simultaneous investment across all three levers — the multiplicative nature of the chain means fixing the primary bottleneck first produces compounding gains downstream, while parallel low-intensity work across all stages produces less total throughput improvement.`
    : `STRATEGIC PRIORITY: Concentrate intervention at the ${weakestLink.name} stage for one full planning cycle. The multiplicative nature of the conversion chain means fixing the primary bottleneck first produces compounding gains downstream — parallel low-intensity work across all stages produces less total throughput improvement than sequenced, focused effort on the weakest link.`;

  return { snapshot, detail: s(ranking, balance, priority) + smplSection(sampleSize) };
}

// ─── 10. Competitive overlap insight ─────────────────────────────────────────

export function buildCompetitiveOverlapInsight(args: {
  overlapRows: UsageOverlapRow[];
  currentCount: number;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { overlapRows, currentCount, sampleSize } = args;
  if (sampleSize === 0 || overlapRows.length === 0 || currentCount === 0) return null;

  const sorted = [...overlapRows].sort((a, b) => b.overlapPct - a.overlapPct);
  const top = sorted[0];
  const highOverlapCount = sorted.filter((r) => r.overlapPct >= 40).length;
  const avgOverlap = sorted.reduce((sum, r) => sum + r.overlapPct, 0) / sorted.length;

  // Classify the competitive pressure profile
  type OverlapProfile = 'Fragmented Risk' | 'Concentrated Rivalry' | 'Broad Competitive Exposure' | 'Contained Competition';
  const profile: OverlapProfile =
    highOverlapCount >= 3 ? 'Fragmented Risk'
    : highOverlapCount >= 1 && top.overlapPct >= 50 ? 'Concentrated Rivalry'
    : avgOverlap >= 30 ? 'Broad Competitive Exposure'
    : 'Contained Competition';

  const snapshotMap: Record<OverlapProfile, string> = {
    'Fragmented Risk': `Fragmented Risk: ${highOverlapCount} competitors each hold 40%+ overlap with this bank's current user base — no single rival dominates, but the total multi-banking surface is large, creating broad retention vulnerability across the competitive set.`,
    'Concentrated Rivalry': `Concentrated Rivalry: ${top.bankName} accounts for the dominant overlap position at ${top.overlapPct}% of current users — the majority of competitive switching risk is concentrated in a single rival relationship, making it the primary retention battleground.`,
    'Broad Competitive Exposure': `Broad Competitive Exposure: average overlap of ${fmtPct(avgOverlap)} across ${sorted.length} competitors indicates that a significant share of current users are active across multiple banks — the competitive landscape is uniformly contested rather than concentrated.`,
    'Contained Competition': `Contained Competition: average overlap of ${fmtPct(avgOverlap)} across tracked competitors is relatively low — most current users do not appear to hold active accounts at rival banks, suggesting the user base has comparatively lower multi-banking exposure.`,
  };

  const snapshot = `${profile}: ${snapshotMap[profile]}`;

  const topBlock = `TOP COMPETITOR: ${top.bankName} represents the highest-overlap rival, shared by ${top.overlapCount} current users (${top.overlapPct}% of the active base). This user segment simultaneously holds accounts at both institutions — they are not churned customers but active multi-bankers, meaning competitive displacement risk is concentrated here. Users in this overlap segment are comparing service quality, fees, and product depth on a daily basis.`;

  const landscapeRows = sorted.slice(0, 5).map((r) => `${r.bankName}: ${r.overlapPct}% (${r.overlapCount} users)`).join(' · ');
  const landscape = `COMPETITIVE LANDSCAPE: Overlap by competitor — ${landscapeRows}. Overlap percentage reflects the share of this bank's current users who also hold an active account at each competitor. A figure above 40% flags a primary retention threat; 20-40% flags a secondary threat worth monitoring; below 20% is ambient noise in a multi-bank market.`;

  const implication = `BUSINESS IMPLICATION: High overlap with a specific rival does not automatically signal imminent churn — it signals competitive attention is contested in that relationship. The relevant intervention question is: what is the primary-bank designation rate within each overlap segment? If users who overlap with ${top.bankName} show lower preference-capture rates, that rival is actively winning share-of-wallet. If preference capture is maintained, the overlap represents switching optionality held by loyal customers, which is a lower-urgency risk requiring brand reinforcement rather than defensive pricing.`;

  return {
    snapshot: snapshotMap[profile],
    detail: s(topBlock, landscape, implication) + smplSection(sampleSize),
  };
}

// ─── 11. Multi-bank competition insight ──────────────────────────────────────

export function buildMultiBankCompetitionInsight(args: {
  selected: MultiBankShareMetrics;
  compare: MultiBankShareMetrics | null;
  secondChoiceRows: SecondChoiceShareRow[];
  multiBankBase: number;
  secondChoiceBase: number;
  bankName: string;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { selected, compare, secondChoiceRows, multiBankBase, secondChoiceBase, bankName, sampleSize } = args;
  if (multiBankBase === 0 || sampleSize === 0) return null;

  const shareGap = selected.multiBankUsageShare - selected.multiBankPreferredShare;
  const conversionGap = selected.multiBankPreferredShare - selected.multiBankCommittedShare;
  const topSecondChoice = secondChoiceRows[0];
  const isPrimaryLeader = shareGap <= 15;

  const snapshot = isPrimaryLeader
    ? `Among the ${multiBankBase} respondents holding two or more active bank accounts, ${bankName} holds ${selected.multiBankUsageShare}% usage share and ${selected.multiBankPreferredShare}% preferred share — a narrow gap indicating the bank holds primary status for a meaningful share of multi-bank customers.`
    : `Among the ${multiBankBase} respondents holding two or more active bank accounts, ${bankName} holds ${selected.multiBankUsageShare}% usage share but only ${selected.multiBankPreferredShare}% preferred share — a ${fmt(shareGap, 0)}-point gap indicating the bank is functioning primarily as a secondary relationship in shared-wallet households.`;

  const shareContext = `WHAT THESE SHARES MEASURE: Usage share (${selected.multiBankUsageShare}%) is the proportion of multi-bank respondents who hold an active ${bankName} account — a competitive presence measure. Preferred share (${selected.multiBankPreferredShare}%) is the proportion who name ${bankName} as their primary bank — a wallet leadership measure. Committed share (${selected.multiBankCommittedShare}%) identifies current users who also score NPS 9–10 — the deepest loyalty tier. A narrow usage-to-preferred gap indicates the bank is winning primary designation. The current ${fmt(shareGap, 0)}-point gap between usage and preferred share means ${shareGap <= 10 ? 'most users who include the bank in their portfolio also designate it as primary.' : shareGap <= 20 ? 'a significant minority hold the account but route primary transactions elsewhere.' : 'the majority of account holders treat this bank as a secondary relationship.'}`;

  const position = isPrimaryLeader
    ? `PRIMARY VS SECONDARY POSITION: ${bankName} holds a competitive primary-bank position among multi-bankers — the gap between usage share (${selected.multiBankUsageShare}%) and preferred share (${selected.multiBankPreferredShare}%) is ${fmt(shareGap, 0)} percentage points, indicating most customers who include this bank in their portfolio designate it as their primary institution. The remaining conversion gap — from preferred (${selected.multiBankPreferredShare}%) to committed (${selected.multiBankCommittedShare}%), a ${fmt(conversionGap, 0)}-point difference — represents customers who are primary but not yet fully committed.${compare ? ` ${compare.bankName} shows ${compare.multiBankUsageShare}% usage and ${compare.multiBankPreferredShare}% preferred share for context.` : ''}`
    : `PRIMARY VS SECONDARY POSITION: ${bankName} is functioning primarily as a secondary bank in multi-bank households. The ${fmt(shareGap, 0)}-point gap between usage share (${selected.multiBankUsageShare}%) and preferred share (${selected.multiBankPreferredShare}%) indicates that most customers who hold a ${bankName} account route their salary, primary savings, and main transactions to a competitor. Secondary-bank relationships generate a fraction of primary-bank revenue — lower deposit balances, fewer cross-sold products, and limited lending activity.${compare ? ` ${compare.bankName} shows ${compare.multiBankUsageShare}% usage and ${compare.multiBankPreferredShare}% preferred share for comparison.` : ''}`;

  const secondChoice = topSecondChoice
    ? `SECOND-CHOICE PRESSURE: Among the ${secondChoiceBase} respondents who use ${bankName} but prefer another bank, ${topSecondChoice.bankName} captures ${topSecondChoice.share}% of the preferred-competitor slot — making it the single biggest competitor for primary-bank displacement. This is the institution most actively winning primary status from ${bankName}'s own customer base. A high concentration in one rival indicates focused competitive pressure that can be addressed with targeted retention programmes. Fragmented second-choice shares indicate diffuse pressure with no single competitor dominating.`
    : `SECOND-CHOICE PRESSURE: No second-choice competitor data is available in this slice — the sample of non-primary users is too small for reliable ranking. Interpret the primary versus secondary position data directionally.`;

  const priority = shareGap > 20
    ? `PRIORITY ACTION: The primary commercial priority is converting secondary-bank users to primary status. This requires product and pricing interventions — salary account incentives, relationship pricing, and transaction-based rewards — not marketing spend. The customers are already in the system; the goal is to capture more of their wallet. Primary-bank conversion among existing account holders is cheaper per customer and faster to revenue than new acquisition.`
    : `PRIORITY ACTION: The primary-bank conversion rate is competitive. The priority is defending preferred status and closing the ${fmt(conversionGap, 0)}-point gap between preferred share (${selected.multiBankPreferredShare}%) and committed share (${selected.multiBankCommittedShare}%). Moving preferred multi-bankers to committed status — through service quality, product depth, and loyalty programmes — produces the highest lifetime value uplift per customer.`;

  return { snapshot, detail: s(shareContext, position, secondChoice, priority) + smplSection(sampleSize) };
}

// ─── 12. Usage-based segmentation insight ────────────────────────────────────

export function buildUsageSegmentationInsight(args: {
  nonTriersCount: number;
  lapsedUsersCount: number;
  secondaryUsersCount: number;
  primaryUsersCount: number;
  awareCount: number;
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { nonTriersCount, lapsedUsersCount, secondaryUsersCount, primaryUsersCount, awareCount, sampleSize } = args;
  if (awareCount === 0 || sampleSize === 0) return null;

  const nonTrierPct = (nonTriersCount / awareCount) * 100;
  const lapsedPct = (lapsedUsersCount / awareCount) * 100;
  const secondaryPct = (secondaryUsersCount / awareCount) * 100;
  const primaryPct = (primaryUsersCount / awareCount) * 100;

  const opportunities = [
    { name: 'Secondary Users', count: secondaryUsersCount, type: 'primary-bank conversion' as const },
    { name: 'Non-Triers', count: nonTriersCount, type: 'acquisition' as const },
    { name: 'Lapsed Users', count: lapsedUsersCount, type: 'recovery' as const },
  ];
  const top = [...opportunities].sort((a, b) => b.count - a.count)[0];

  const snapshot = `The aware base of ${awareCount} customers divides into four commercial groups: ${primaryUsersCount} primary users to protect (${fmtPct(primaryPct)}), ${secondaryUsersCount} secondary users ready for primary-bank conversion (${fmtPct(secondaryPct)}), ${lapsedUsersCount} lapsed users to recover (${fmtPct(lapsedPct)}), and ${nonTriersCount} non-triers to acquire (${fmtPct(nonTrierPct)}). The largest near-term opportunity is ${top.name} — a ${top.type} target.`;

  const overview = `SEGMENT OVERVIEW: Each group requires a distinct commercial approach. Non-triers (${nonTriersCount}, ${fmtPct(nonTrierPct)} of aware) are customers who know the bank but have never opened an account — the most expensive path to convert because they require overcoming a trust or product barrier from a standing start. Lapsed users (${lapsedUsersCount}, ${fmtPct(lapsedPct)} of aware) held an account and left — they have prior product familiarity and completed onboarding, making recovery cheaper than new acquisition, but the lapse reason must be diagnosed before investing. Secondary users (${secondaryUsersCount}, ${fmtPct(secondaryPct)} of aware) are active account holders who designate a competitor as their primary bank — the highest-ROI segment because they are already in the system. Primary users (${primaryUsersCount}, ${fmtPct(primaryPct)} of aware) are the commercial core — active, committed, and generating the majority of current revenue.`;

  const acquisitionAndRecovery = `ACQUISITION AND RECOVERY TARGETS: Non-triers represent untested demand — the barrier to entry is typically one of trust, product fit, branch or digital accessibility, or fee perception. Increasing awareness spend without diagnosing this barrier compounds the inefficiency of a non-converting audience. Lapsed users are a recovery target: they previously chose the bank and completed onboarding, so the marginal cost of conversion is lower than for non-triers. The critical diagnostic question is whether lapse was driven by service failure (addressable with experience improvement), competitive switching (addressable with product or pricing comparison), or a life event (addressable with re-engagement timing). The correct answer shapes the intervention entirely.`;

  const conversion = `PRIMARY BANK CONVERSION: Secondary users are the most commercially attractive near-term segment. They are already active account holders — acquisition cost is zero — and the lifetime value uplift from converting them to primary status is 2–3× their current contribution. Secondary users tend to hold lower deposit balances and conduct fewer transactions than primary users simply because their salary and primary savings sit elsewhere. The conversion lever is not marketing; it is relationship value: salary account incentives, transaction-based rewards, and product depth that creates a specific reason to route primary banking here.`;

  const priorityActionMap = {
    'primary-bank conversion': `PRIORITY ACTION: Prioritise primary-bank conversion among the ${secondaryUsersCount} secondary users — they are already in the system and require no acquisition spend. Design a structured programme with a clear conversion goal (e.g., routing salary accounts), track it for one planning cycle, and measure preferred-share improvement as the primary success metric.`,
    'recovery': `PRIORITY ACTION: Prioritise lapsed-user recovery. Before designing a programme, run a diagnostic on the lapse reason — service failure, competitive switching, and life-event lapse each require a different response. A single campaign sent to all lapsed users without this segmentation will underperform relative to targeted, reason-specific recovery outreach.`,
    'acquisition': `PRIORITY ACTION: Prioritise non-trier acquisition. Commission a qualitative diagnostic to isolate the specific barrier to trial before scaling acquisition spend — trust, product fit, accessibility, or fee perception each require a different solution. Until this barrier is identified, additional awareness investment will produce diminishing returns in trial conversion.`,
  };

  return { snapshot, detail: s(overview, acquisitionAndRecovery, conversion, priorityActionMap[top.type]) + smplSection(sampleSize) };
}

// ─── 13. Competitive usage position insight ───────────────────────────────────

export function buildCompetitiveUsageInsight(args: {
  positionLabel: string;
  usageMedian: number;
  retentionMedian: number;
  opportunities: UsageOpportunity[];
  sampleSize: number;
}): AwarenessInsightResult | null {
  const { positionLabel, usageMedian, retentionMedian, opportunities, sampleSize } = args;
  if (sampleSize === 0) return null;

  const top = opportunities[0];
  const hasPosition = positionLabel && positionLabel !== 'N/A';
  const isHighUsage = positionLabel.includes('High Usage');
  const isHighRetention = positionLabel.includes('High Retention');

  const snapshot = hasPosition
    ? `${positionLabel}: usage sits ${isHighUsage ? 'above' : 'below'} the category median of ${fmtPct(usageMedian)} and retention sits ${isHighRetention ? 'above' : 'below'} the median of ${fmtPct(retentionMedian)} — the highest-priority commercial lever is ${top?.name ?? 'customer acquisition'}.`
    : `Usage and retention data are insufficient in this slice to assign a matrix position — interpret the opportunity table directionally.`;

  const matrix = `POSITION MATRIX: The matrix plots usage rate against retention rate relative to category medians (usage median: ${fmtPct(usageMedian)}, retention median: ${fmtPct(retentionMedian)}). Four positions result: Market Leader (high usage, high retention) — the bank acquires and keeps customers above category norms; Growth Potential (high usage, low retention) — strong acquisition but customers are not staying; Retention Strength (low usage, high retention) — the bank holds its base but struggles to grow it; Niche Player (low usage, low retention) — limited scale and below-average customer retention. Each position indicates a different commercial priority. Current position: ${hasPosition ? positionLabel : 'undetermined in this slice'}.`;

  const positionRead = !hasPosition ? null
    : isHighUsage && isHighRetention
    ? `WHAT THIS POSITION MEANS: Market Leader status indicates the bank has solved both acquisition and retention simultaneously. Usage above the ${fmtPct(usageMedian)} median means the bank is winning customers from the market; retention above the ${fmtPct(retentionMedian)} median means those customers stay active long enough to generate commercial value. The growth constraint is no longer about fixing a broken funnel stage — it shifts to scaling a working one. The priority is reach expansion and share-of-wallet deepening among the existing base.`
    : !isHighUsage && isHighRetention
    ? `WHAT THIS POSITION MEANS: Retention Strength indicates the bank keeps its customers well (above ${fmtPct(retentionMedian)} median) but grows its customer base slowly (below ${fmtPct(usageMedian)} usage median). The commercial opportunity is not in protecting the existing base — it already stays. The gap is in bringing new customers through the front door. Trial incentives, acquisition-channel expansion, and onboarding simplification will produce the highest marginal return at this position.`
    : isHighUsage && !isHighRetention
    ? `WHAT THIS POSITION MEANS: Growth Potential indicates strong acquisition (above ${fmtPct(usageMedian)} usage median) but below-average retention (below ${fmtPct(retentionMedian)} median). The bank is successfully attracting new customers but losing them before they generate durable commercial value. Each acquired customer who lapses represents full acquisition cost with zero lifetime value recovery. Retention investment at this stage produces a higher return on capital than continued acquisition scaling — every lapsed customer saved is equivalent to acquiring a new one at zero cost.`
    : `WHAT THIS POSITION MEANS: Niche Player positioning indicates both usage (below ${fmtPct(usageMedian)} median) and retention (below ${fmtPct(retentionMedian)} median) are below category norms. The priority is building a stable retained core before scaling acquisition — growing a leaky base compounds losses rather than creating commercial value. A single focused retention programme run to maturity will shift the position more than any acquisition spend.`;

  const opportunitySection = top
    ? `GROWTH OPPORTUNITY: The largest addressable opportunity is "${top.name}" — ${top.size} customers representing ${fmtPct(top.pct)} of the relevant base. ${top.note} This segment is ranked first because it combines the highest volume of accessible customers with the most direct commercial intervention available at the current funnel position.${opportunities.length > 1 ? ` The full opportunity table shows ${opportunities.length} addressable segments — concentrated investment in the largest one produces faster returns than parallel effort spread across all.` : ''}`
    : `GROWTH OPPORTUNITY: No clearly sized opportunity has been identified in this slice. The sample may be too small, or the filter combination has reduced the base below reliable threshold. Expand the slice or remove demographic filters to surface opportunity sizing.`;

  const priorityAction = isHighUsage && isHighRetention
    ? `PRIORITY ACTION: Invest in reach expansion and share-of-wallet deepening. The conversion funnel is working — growth now comes from feeding it more customers upstream and capturing more revenue per existing customer through product cross-sell and primary-bank designation.`
    : !isHighUsage && isHighRetention
    ? `PRIORITY ACTION: Concentrate on acquisition-channel expansion. Retention is not the problem — growth is. Run a trial-barrier diagnostic among non-triers and increase investment in first-time account opening incentives targeted at aware but unconverted customers.`
    : isHighUsage && !isHighRetention
    ? `PRIORITY ACTION: Pause acquisition scaling and invest in retention first. Identify the specific drop-off point in the customer journey — first 30 days, first 90 days, or product activation — and address it. Once retention crosses the ${fmtPct(retentionMedian)} median, acquisition investment will compound rather than drain.`
    : `PRIORITY ACTION: Build a stable retained core before scaling acquisition. Define a minimum viable active user target and concentrate all commercial investment on moving existing account holders to active status and keeping them there for at least 90 days.`;

  const sections: string[] = [matrix];
  if (positionRead) sections.push(positionRead);
  sections.push(opportunitySection, priorityAction);

  return { snapshot, detail: s(...sections) + smplSection(sampleSize) };
}
