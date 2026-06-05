# BrandEdge Metric Mismatch Report

Generated: 2026-05-01

Scope: platform-wide analytics methodology audit across all countries and survey markets. Burundi pilot data exposed the failure mode, but the recommended fixes below are global.

## Severity Scale

| Severity | Meaning |
|---|---|
| Critical | Can produce impossible values, wrong rankings, or contradictory sample sizes. Must be fixed before trusting affected dashboards. |
| High | Can mislead users through inconsistent denominator contracts, mixed sources, or mislabeled metrics. |
| Medium | Methodologically valid in isolation but unclear, fragile, or not safely comparable. |
| Low | Presentation or documentation issue with limited numeric risk. |

## Mismatch Table

| Module | Metric | Current Logic | Correct Logic | Severity | Recommended Fix |
|---|---|---|---|---|---|
| Platform aggregate | Universal qualified base | Aggregate merge sums `analyticsIncludedCount`; missing fields become 0 while bank counts can remain non-zero. | Universal base must equal qualified respondents for the same filter scope and date buckets. Aggregate docs missing denominator fields are invalid. | Critical | Add aggregate integrity validation and rebuild all affected country/date buckets, not only Burundi. |
| Platform aggregate | Aggregate readiness | Status can be `ready` even when bucket counts and denominators are inconsistent. | Ready status requires count/base invariants for every bucket and metric family. | Critical | Extend rebuild status with invariant checks and block aggregate use when validation fails. |
| Platform aggregate | Raw vs aggregate parity | Dashboard can mix aggregate overview/rankings with raw demographics/diagnostics in one filter context. | Same metric ID and filter scope must resolve to one canonical source or carry explicit source and base metadata. | Critical | Introduce source arbitration: aggregate only when it supports every active filter and passes integrity checks; otherwise raw fallback. |
| Overview | Sample size | Overview sample may come from aggregate while demographics sample comes from raw. Burundi showed 43 vs 62 for the same visible context. | Every universal-base card in the same filter context must use the same qualified respondent count. | Critical | Centralize qualified base calculation and expose it to every module. |
| Overview | Awareness penetration | Formula is aware / sample, but aggregate sample can be stale or too small. | Aware / Universal Qualified Base, with `aware <= base` enforced. | Critical | Reject aggregate output when any universal numerator exceeds universal denominator. |
| Overview | Current usage penetration | Raw path uses current users / total filtered respondents; aggregate path also intends total base but inherits aggregate denominator risk. | Current users / Universal Qualified Base. | Critical | Repair aggregate base and add invariant tests across countries. |
| Overview | Preferred / market share | Preferred / sample can inflate when aggregate denominator is too small. | Preferred / Universal Qualified Base. | Critical | Rebuild aggregates and assert preferred count <= base. |
| BrandEdge | BrandEdge score inputs | Composite mixes universal penetration, conditional loyalty, and switching-risk diagnostics. Denominator metadata is not explicit enough. | Topline score inputs that represent penetration must use Universal Qualified Base; diagnostic inputs must remain conditional and be declared. | High | Version BrandEdge component contract and publish each component base. |
| Awareness | Total awareness | Uses union of top-of-mind, spontaneous, and checked awareness in raw and aggregate logic. | Same union logic, respondent-bank deduplicated, over Universal Qualified Base. | Medium | Keep formula but add tests for deduplication across all awareness fields. |
| Awareness | Prompted / checked awareness | Current label and configs often call `c3_aware_banks` "aided awareness." | Prompted / checked awareness = checked field / Universal Qualified Base. Aided-only = checked-aware respondents not spontaneous-aware / Universal Qualified Base. | High | Rename current metric or create separate aided-only metric with explicit incremental formula. |
| Awareness | Awareness funnel | Displays aware, spontaneous, top-of-mind, aided as a funnel even though checked awareness is not a downstream conversion stage. | Use a salience ladder or rename to awareness composition; funnel conversion should use conditional bases. | Medium | Relabel component and avoid implying monotonic funnel conversion. |
| Awareness | Awareness quality | Top-of-mind / awareness. | Top-of-mind / awareness, Conditional Base. | Low | Keep as diagnostic but never use as topline penetration. |
| Awareness | Share of voice | Implementations derive SOV from top-of-mind percentages in some aggregate rows. | Bank top-of-mind count / total top-of-mind counts. | Medium | Compute from raw counts to avoid rounding and denominator artifacts. |
| Awareness | Awareness share index | Bank awareness selections / all bank awareness selections, but may be read as respondent share. | Keep as share of awareness mentions, or replace with total awareness penetration for respondent share. | Medium | Rename to "share of awareness mentions" and publish multi-select denominator. |
| Awareness | Consideration | Current dashboard/config often presents consideration rate as considerers among aware. | Topline consideration = considerers / Universal Qualified Base; diagnostic consideration among aware remains conditional. | High | Split metric IDs: `consideration_penetration` and `consideration_among_aware`. |
| Usage | Ever used | Code top cards use total respondents, while usage config states aware denominator. | Ever used penetration = ever used / Universal Qualified Base. Trial conversion = ever used / aware. | High | Split and relabel; update config to match code or desired contract. |
| Usage | Current usage | Code has both current / total respondents and current / aware depending on module. | Current usage penetration = current / Universal Qualified Base; current usage among aware = current / aware. | High | Introduce separate metric IDs and labels. |
| Usage | BUMO / preferred | Overview uses preferred / total; usage diagnostics also uses preferred / aware and preferred / current. | Preferred share = preferred / Universal Qualified Base; BUMO among aware and preference capture are conditional diagnostics. | High | Remove ambiguous BUMO label unless its base is shown. |
| Usage | Retention | Current users / ever-used respondents. | Same, Conditional Base. | Low | Keep but publish base and minimum `n`. |
| Usage | Churn / lapsed | Ever-used non-current / ever-used. | Same, Conditional Base. | Low | Keep but enforce ever/current consistency. |
| Usage | Multi-banking | Denominator varies between selected current users and all active current users. | Both are valid conditional metrics, but labels must state selected-brand or category active-user base. | Medium | Split `multi_banking_among_active_users` and `multi_banking_among_selected_users`. |
| Loyalty | Loyalty segment distribution | Often uses aware respondents as base. | Conditional loyalty base must be defined globally: aware, users, or relationship-eligible respondents. | High | Choose one eligibility rule and apply across raw and aggregate paths. |
| Loyalty | NPS | Aggregate metrics use NPS base tied to bank usage; cohort diagnostics may use any cohort respondent with NPS. | NPS among users = user respondents with valid NPS; cohort NPS = users within cohort with valid NPS. | High | Align all NPS calculations to user-valid base and publish `n`. |
| Loyalty | Loyalty index | Weighted conditional segment score can appear near topline metrics. | Keep conditional and label as relationship-quality metric, not penetration. | Medium | Add base metadata and tooltip. |
| Momentum | Momentum score | Current formula uses awareness growth, consideration among aware, trial, retention, and preference capture. | Topline momentum inputs must use universal-base penetration metrics; conversion components remain diagnostics. | High | Create v2 momentum contract: market momentum and conversion momentum separated. |
| Momentum | Momentum top metric base metadata | Dashboard top metrics can report `TIME_SERIES_WINDOW`, obscuring respondent denominators of the components. | Each component must publish respondent base or time-series base. | High | Add component-level base metadata to score payload. |
| Momentum | Adoption input | Current code uses preference capture or preferred/current in places. | Adoption topline = current usage or preferred share penetration; preference capture = conditional diagnostic. | High | Rename adoption components by denominator. |
| Competitive | Market share ranking | Uses preferred / sample; can exceed true share when aggregate denominator is wrong. | Preferred / Universal Qualified Base with aggregate invariant checks. | Critical | Same aggregate repair and fail-closed ranking validation. |
| Competitive | Current usage ranking | Multi-bank current usage shares can sum above 100%, which is valid, but may be read as exclusive market share. | Current usage penetration / Universal Qualified Base, labeled as non-exclusive current usage. | Medium | Clarify label and keep market share reserved for preferred share. |
| Competitive | Relative strength | Mixes awareness penetration, trial, retention, NPS, and momentum without base separation. | Publish each component base; universal comparative inputs should be separated from conditional diagnostics. | Medium | Version composite and add component audit output. |
| Competitive | Wallet share estimate | Uses inverse active bank count proxy. | Keep as conditional proxy among selected current users. | Medium | Label as estimated wallet proxy and avoid comparing to preferred market share. |
| Competitive | Win/loss | Observed and proxy transitions can be mixed. | Observed win/loss and proxy win/loss require separate metric IDs. | Medium | Separate observed vs inferred source. |
| Demographics | Demographic sample | Raw demographic sample can differ from aggregate overview sample. | Demographic qualified sample must reconcile to universal base when no segment filter is active. | Critical | Use raw fallback for all modules when demographic filters are active or aggregate lacks segment support. |
| Demographics | Cohort penetration | Cohort awareness/current/preferred generally use segment base. | Segment respondents aware/current/preferred / Segment Base. | Low | Keep, add minimum sample and unknown-bucket policy. |
| Demographics | Cohort NPS | May not align with user-based NPS elsewhere. | Cohort users with valid NPS / cohort users with valid NPS. | Medium | Publish both cohort size and NPS valid-user base. |
| Demographics | High-value segment score | Composite may mix preferred share, NPS, and multi-banking with different bases. | Publish component bases and treat as diagnostic segment composite. | Medium | Add component table and minimum `n` guard. |
| Trends | Monthly trend buckets | Aggregate monthly windows can include empty or stale buckets. | Monthly metric = monthly numerator / monthly Universal Qualified Base, excluding invalid buckets. | High | Validate period buckets and exclude zero-source historical placeholders. |
| Trends | Raw vs aggregate boundaries | Raw uses timestamp windows; aggregate uses date buckets. | Time filters should resolve to shared inclusive/exclusive boundaries before raw or aggregate execution. | Medium | Centralize time-window normalization. |
| Trends | Forecast confidence | Confidence is model uncertainty, not respondent denominator confidence. | Keep forecast confidence as time-series diagnostic with model inputs documented. | Low | Rename tooltips where needed. |
| All modules | Missing/null handling | Null demographic and survey fields are sometimes handled locally per module. | Normalize nulls once into canonical unknown/empty values before metric computation. | Medium | Add shared normalization contract and fixture tests. |
| All modules | Multi-select counting | Awareness/current usage fields can create sums above 100% across brands, which is valid, but per-brand respondent counts must be deduped. | Use respondent-bank union for per-brand numerator; allow across-brand sums > 100% only for non-exclusive metrics. | High | Add invariant tests for per-brand <= base and document non-exclusive totals. |
| All modules | Metric IDs and labels | Same label can refer to different denominators across cards, tables, and exports. | One metric ID = one formula = one numerator = one denominator = one base type. | Critical | Introduce metric dictionary backed by typed contracts and update UI/export references. |

## Cross-Platform Findings

1. The largest architecture gap is not a single formula; it is the absence of a typed metric contract that travels with every value.
2. Aggregate documents need denominator integrity checks before they are allowed to power cards, rankings, trend lines, or exports.
3. Several existing metrics are mathematically valid but mislabeled because they hide conditional denominators.
4. Multi-select survey fields are being used correctly in some paths as respondent-bank unions, but the platform needs explicit rules for when across-brand totals may exceed 100%.
5. BrandEdge and Momentum composites are the highest-risk executive metrics because they mix base types and can make conditional conversion look like market penetration.
6. Demographics and raw diagnostics are currently useful as validation anchors because they use raw respondent rows, but they expose aggregate/raw mismatches in the visible dashboard.

