# Operations Monitoring

This document defines the practical monitoring layer for BrandEdge backend operations.

## Scope

The application now emits structured backend events for:
- admin claim repair/bootstrap/sync
- subscriber entitlement commands
- subscription plan management
- invite acceptance
- public survey rejections
- suspicious public survey submissions
- legacy identity migration conflicts

These events are emitted from Cloud Functions through `firebase-functions/logger` and are intended to support:
- log-based metrics
- alert policies
- failure diagnosis in Google Cloud Logs Explorer

## Source Of Truth

Monitoring specs live in:
- [monitoring/brandedge-observability-spec.json](/Users/theo/brand-health-analytics_banks/monitoring/brandedge-observability-spec.json)

Provisioning helper:
- [scripts/monitoring-plan.mjs](/Users/theo/brand-health-analytics_banks/scripts/monitoring-plan.mjs)

## Structured Events

Important failure events:
- `admin_claim_repair_failed`
- `admin_claim_bootstrap_failed`
- `user_claim_sync_failed`
- `subscriber_entitlement_command_failed`
- `subscription_plan_list_failed`
- `subscription_plan_initialize_failed`
- `subscription_plan_save_failed`
- `subscription_plan_delete_failed`
- `invite_accept_failed`
- `public_survey_submission_rejected`
- `legacy_user_migration_conflict`

Important warning / suspicious-signal events:
- `public_survey_submission_flagged`
- `invite_accept_claims_sync_deferred`

Important success events:
- `admin_claim_repair_succeeded`
- `admin_claim_bootstrap_succeeded`
- `user_claim_sync_succeeded`
- `subscriber_entitlement_command_succeeded`
- `subscription_plan_initialize_succeeded`
- `subscription_plan_save_succeeded`
- `subscription_plan_delete_succeeded`
- `invite_accept_succeeded`
- `public_survey_submission_accepted`
- `legacy_user_migration_succeeded`

## Recommended Metrics

The current checked-in spec defines these log-based metrics:
- `brandedge_admin_claim_failures`
- `brandedge_subscription_plan_failures`
- `brandedge_entitlement_command_failures`
- `brandedge_invite_accept_failures`
- `brandedge_survey_submission_rejections`
- `brandedge_survey_submission_flags`
- `brandedge_identity_migration_conflicts`

## Recommended Alerts

The current checked-in spec defines these alert policies:
- `BrandEdge admin claim failures`
- `BrandEdge subscription plan failures`
- `BrandEdge entitlement command failures`
- `BrandEdge invite acceptance failures`
- `BrandEdge survey rejection spike`
- `BrandEdge suspicious survey submission spike`
- `BrandEdge legacy identity migration conflicts`

These are intentionally lightweight. They are designed to catch:
- repeated backend failures
- backend deployment gaps
- claims/auth drift
- survey abuse spikes
- migration conflicts that require manual review

## Provisioning

Dry-run command generation:

```bash
node scripts/monitoring-plan.mjs
```

Write alert JSON files locally:

```bash
node scripts/monitoring-plan.mjs --write
```

Then create metrics and policies with `gcloud`:

```bash
node scripts/monitoring-plan.mjs --write
gcloud logging metrics create ...
gcloud alpha monitoring policies create --policy-from-file=monitoring/generated/<policy>.json
```

The script prints the exact `gcloud` commands based on the checked-in spec.

## Operational Use

Use Logs Explorer with filters like:

```text
jsonPayload.event="subscriber_entitlement_command_failed"
```

```text
jsonPayload.event="public_survey_submission_rejected"
```

```text
jsonPayload.event="subscription_plan_initialize_failed"
```

Useful fields currently logged:
- `event`
- `category`
- `actorUid`
- `targetUid`
- `planId`
- `inviteId`
- `responseId`
- `selectedCountry`
- failure `error.code`
- failure `error.message`

The logs intentionally avoid full payload dumps and respondent-sensitive content.

## Pilot Survey Monitoring

For pilot launch, the primary Firestore monitoring collections are:
- `responses`
- `raffleEntries`
- `panelists`

Use these fields as the first-pass filter set on survey data:
- `country`
- `language_at_submission`
- `_status`
- `_source`
- `submission_mode`
- `admin_test_submission`
- `response_id`
- `submitted_at_iso`
- `request_country`
- `country_mismatch_flag`

### Response Separation

Survey responses and follow-up records now carry an explicit backend-written mode tag:
- `submission_mode = "public_pilot"` for normal anonymous pilot traffic
- `submission_mode = "admin_test"` for trusted admin survey testing

Equivalent boolean helper:
- `admin_test_submission = true|false`

Recommended pilot filtering rule:
- include only `submission_mode = "public_pilot"` in pilot reads, exports, and monitoring summaries
- exclude `submission_mode = "admin_test"` from pilot toplines unless explicitly reviewing test traffic

### Completion And Termination

Use `_status` on `responses`:
- `_status = "completed"` means the respondent reached normal submission
- `_status = "terminated"` means the respondent hit a terminal/disqualification exit

Useful pilot checks:
- daily completed count by country
- daily terminated count by country
- termination share by country

### Country Integrity

Canonical country is `country`.
Compatibility field `selected_country` may still exist on legacy responses, but pilot monitoring should read `country` first.

Useful integrity checks:
- compare `country` vs `request_country`
- monitor `country_mismatch_flag = true`
- spot-check that linked `raffleEntries.country` and `panelists.country` match the originating response country

### Follow-Up Linkage

Use these link fields:
- `raffleEntries.responseId -> responses.response_id`
- `panelists.lastResponseId -> responses.response_id`

Follow-up monitoring fields:
- `raffleOptIn`
- `panelOptIn`
- `language_at_submission`
- `submission_mode`
- `_source = "public_follow_up_callable"`

### Daily Pilot Checklist

Run these checks each pilot day:
1. Count `responses` by `country`, `submission_mode`, and `_status`.
2. Review any `country_mismatch_flag = true` responses.
3. Review flagged responses where any of these are true:
   - `completion_speed_flag`
   - `duplicate_payload_flag`
   - `metadata_missing_flag`
4. Spot-check that recent `raffleEntries` and `panelists` records have:
   - matching `country`
   - matching `language_at_submission`
   - a valid `responseId` or `lastResponseId`
   - `submission_mode = "public_pilot"` unless intentionally testing as admin
5. Confirm at least one completed response per active pilot country where expected.

## Console Configuration Still Required

This repository now contains alert-ready specs, but Google Cloud setup is still external:
1. create log-based metrics
2. create alert policies
3. attach notification channels
4. tune thresholds after observing live traffic

## Maintenance Guidance

When adding new backend-critical events:
1. emit a structured `logger.info` / `logger.warn` / `logger.error` event
2. decide whether it belongs in the monitoring spec
3. update `monitoring/brandedge-observability-spec.json`
4. regenerate alert policy JSON with:

```bash
node scripts/monitoring-plan.mjs --write
```
