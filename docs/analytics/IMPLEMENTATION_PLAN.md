# BrandEdge Analytics Methodology Implementation Plan

Generated: 2026-05-01

Scope: global refactor plan for BrandEdge analytics methodology across all countries and survey markets. This plan intentionally does not include formula/code changes yet.

## Objective

Standardize BrandEdge analytics around a denominator framework that works for every current and future country:

1. Universal Qualified Base for topline penetration, rankings, comparative share, BrandEdge topline inputs, and Momentum topline inputs.
2. Conditional Base for funnel conversion, loyalty, satisfaction, switching, and other diagnostics.
3. Segment Base for demographic and cohort penetration.

## Non-Goals

1. No Burundi-only remediation.
2. No country-specific metric branching.
3. No silent dashboard relabeling without contract changes.
4. No migration that makes historical trends look continuous when the methodology changed.

## Ordered Rollout Plan

### Phase 0: Baseline and Freeze

Capture the current output for every module and country before changing formulas:

| Task | Output |
|---|---|
| Export current metric payloads for each country and module | Baseline snapshots for regression comparison |
| Record current aggregate coverage and rebuild status | Aggregate inventory |
| Preserve Burundi audit as validation evidence | Known failure fixture |
| Identify all public exports and dashboard labels using metric names | Compatibility checklist |

### Phase 1: Canonical Metric Contract

Create a typed metric contract used by raw computation, aggregate computation, dashboard cards, tables, exports, and tests.

Required fields:

| Field | Purpose |
|---|---|
| `metric_id` | Stable global identifier, for example `awareness.total_penetration`. |
| `display_name` | Human-readable label. |
| `module` | Dashboard module owner. |
| `numerator_field` | Count or value source. |
| `denominator_field` | Count or value source. |
| `base_type` | Universal Qualified Base, Conditional Base, or Segment Base. |
| `base_label` | User-facing denominator label, for example "qualified respondents" or "aware respondents". |
| `filter_signature` | Country, market, time, age, gender, and other active filters. |
| `source_type` | Raw, aggregate, hybrid, or forecast. |
| `methodology_version` | Versioned formula contract. |
| `valid_n` | Denominator actually used. |
| `warnings` | Low sample, aggregate invalid, unsupported filter, stale source, or mixed source flags. |

### Phase 2: Base Resolution Layer

Build one shared base resolver for raw and aggregate paths.

| Base | Resolver Requirement |
|---|---|
| Universal Qualified Base | Count qualified respondents after all active supported filters. |
| Conditional Base | Count named eligible respondents after the same global filters and the condition. |
| Segment Base | Count qualified respondents inside segment after global filters. |

This layer should be country-agnostic. Country differences should enter only through normalized survey field mappings and bank catalogs.

### Phase 3: Aggregate Integrity Gate

Before any aggregate value powers the dashboard, validate:

1. Required denominator fields exist.
2. Universal numerators are <= Universal Qualified Base.
3. Conditional numerators are <= their conditional base.
4. Preferred counts reconcile with single-choice preference rules.
5. Bucket `responseCount`, `analyticsIncludedCount`, and screened-out counts are internally consistent.
6. Aggregate supports every active filter in the request.
7. Aggregate methodology version matches the dashboard metric contract.

If any check fails, the module should use raw computation for the whole visible filter context or show an explicit unavailable state. It should not mix invalid aggregate cards with raw diagnostics.

### Phase 4: Metric ID Split and Relabeling

Split ambiguous metrics into denominator-specific IDs.

| Existing Ambiguous Label | New Metric ID | Base |
|---|---|---|
| Awareness | `awareness.total_penetration` | Universal Qualified Base |
| Aided awareness | `awareness.prompted_checked_penetration` | Universal Qualified Base |
| Aided-only awareness | `awareness.aided_incremental_penetration` | Universal Qualified Base |
| Consideration | `awareness.consideration_penetration` | Universal Qualified Base |
| Consideration rate | `awareness.consideration_among_aware` | Conditional Base |
| Ever used | `usage.ever_used_penetration` | Universal Qualified Base |
| Trial rate | `usage.trial_among_aware` | Conditional Base |
| Current usage | `usage.current_usage_penetration` | Universal Qualified Base |
| Current usage among aware | `usage.current_usage_among_aware` | Conditional Base |
| BUMO | `usage.preferred_share` or `usage.bumo_among_aware` | Depends on label |
| Preference rate | `usage.preference_capture_among_current_users` | Conditional Base |
| Market share | `competitive.market_share_preferred` | Universal Qualified Base |
| Multi-banking | `usage.multi_banking_among_active_users` or `usage.multi_banking_among_selected_users` | Conditional Base |

### Phase 5: Module Refactor Order

| Order | Module | Why First | Key Work |
|---:|---|---|---|
| 1 | Aggregate service and backend aggregation | Prevents impossible values globally. | Integrity gate, methodology version, denominator field requirements, raw fallback trigger. |
| 2 | Overview and Rankings | Highest visibility and feeds executive decisions. | Universal base resolver, count/base invariants, source consistency. |
| 3 | Awareness and Consideration | Contains the exposed >100% issue and aided/checked naming ambiguity. | Split total, prompted, aided-only, consideration penetration, and consideration among aware. |
| 4 | Usage and Behavior | Current config/code denominator mismatch is high risk. | Split penetration vs conversion metrics and update labels. |
| 5 | BrandEdge Score | Executive composite depends on corrected inputs. | Version component weights and publish component bases. |
| 6 | Momentum | Current topline mixes conditional conversion with penetration. | Create market momentum and conversion momentum components. |
| 7 | Loyalty and Satisfaction | Mostly conditional, but NPS base must be consistent. | Define loyalty eligibility and NPS user base. |
| 8 | Competitive Intelligence | Depends on corrected market share and usage contracts. | Separate share, overlap, wallet proxy, win/loss, and strength composite bases. |
| 9 | Demographics and Cohorts | Raw path is largely correct but needs reconciliation and guardrails. | Segment base contracts, minimum `n`, cohort NPS base. |
| 10 | Trends and Forecasts | Depends on stable historical metric contracts. | Rebuild historical aggregates and mark methodology breaks. |

### Phase 6: Tests and Validation

Add methodology tests before formula changes are released:

| Test Category | Required Coverage |
|---|---|
| Universal base invariants | Every universal numerator <= qualified base for every country fixture. |
| Conditional base invariants | Every conditional numerator <= declared conditional base. |
| Segment base invariants | Cohort numerators <= cohort base and cohort bases sum to qualified base where dimensions are exhaustive. |
| Raw/aggregate parity | Same metric ID, country, filters, and date window produce matching numerator and denominator. |
| Filter propagation | Country, date, age, gender, employment, education, and market filters produce consistent bases. |
| Multi-select dedupe | Per respondent-bank awareness/current usage counted once even if present in multiple fields. |
| Unsupported filters | Aggregate path is rejected when it does not support an active filter. |
| Historical trends | Empty buckets excluded; methodology version changes marked. |
| Cross-country fixtures | Include Burundi plus at least two other country fixtures to prevent local patching. |

### Phase 7: Historical Aggregate Rebuild

After the contract is implemented:

1. Rebuild aggregates for all countries and survey markets.
2. Store `methodology_version` on aggregate documents.
3. Store raw count numerators and denominators for every published metric.
4. Run invariant checks after rebuild.
5. Compare raw vs aggregate parity for sampled windows.
6. Mark dashboards and exports with methodology version.

### Phase 8: Dashboard and Export Compatibility

Backward compatibility concerns:

| Area | Concern | Plan |
|---|---|---|
| Saved exports | Column names like "Aided Awareness" and "BUMO" may change. | Keep deprecated aliases for one release and add new explicit columns. |
| Historical trends | Methodology changes can create visible breaks. | Add methodology break markers and avoid blending v1/v2 points silently. |
| Subscriber dashboards | Users may see changed values after denominator correction. | Add release notes and metric info text explaining base changes. |
| Cached aggregate responses | Old cached values can survive code deploy. | Include methodology version in cache keys and invalidate old aggregate caches. |
| API consumers | External clients may depend on existing metric keys. | Provide alias map and deprecation timeline. |
| Low-sample markets | Segment metrics may become unavailable with minimum `n`. | Show low-sample warning instead of unstable percentages. |

## Dependencies and Risks

| Dependency / Risk | Impact | Mitigation |
|---|---|---|
| Survey field normalization differs by country | Can break global formulas if country-specific fields are not normalized first. | Maintain country-specific mapping only in normalization, not in metric formulas. |
| Aggregate rebuild cost | Rebuilding all countries can be slow or costly. | Batch by country/date and validate each batch before promotion. |
| Existing tests encode legacy expectations | Tests may fail after correct methodology changes. | Update fixtures to assert numerator, denominator, and base type, not only formatted percentages. |
| Executive score continuity | BrandEdge and Momentum scores may move after contract correction. | Version scores and preserve old score as deprecated `v1` during transition. |
| Unsupported aggregate filters | Age/gender filters can produce mismatched aggregate cards. | Force raw path until aggregate supports segment dimensions. |
| Multi-bank behavior | Current usage across banks can sum above 100%. | Document non-exclusive fields and reserve "market share" for preferred/primary share. |
| Missing denominator fields | Can recreate >100% values. | Treat missing denominator as invalid, never as zero. |

## Recommended Fix Order

1. Implement aggregate integrity gate and raw fallback globally.
2. Introduce canonical metric contracts with numerator, denominator, base type, source, and methodology version.
3. Centralize Universal Qualified Base, Conditional Base, and Segment Base resolution.
4. Split ambiguous metric IDs and labels for consideration, usage, BUMO/preferred, aided/checked awareness, and multi-banking.
5. Standardize BrandEdge and Momentum component contracts.
6. Align NPS and loyalty eligibility definitions across overview, loyalty, and demographics.
7. Add cross-country raw/aggregate parity and denominator invariant tests.
8. Rebuild all country aggregates under the new methodology version.
9. Update dashboard labels, exports, and methodology notes.
10. Monitor production for invariant warnings, fallback rate, and country-level parity drift.

## Acceptance Criteria

The refactor is complete when:

1. No universal-base metric can exceed 100% for any country, market, date window, or supported filter.
2. Demographic sample size reconciles with overview sample for the same filter context.
3. Every dashboard value carries a metric ID, numerator, denominator, base type, source, and methodology version.
4. Raw and aggregate outputs match for the same metric contract and filter scope.
5. Conditional metrics are labeled with their conditional base.
6. Segment metrics carry segment `n` and minimum-sample warnings.
7. BrandEdge and Momentum scores publish component bases and methodology version.
8. Historical trend charts do not silently mix methodology versions.

