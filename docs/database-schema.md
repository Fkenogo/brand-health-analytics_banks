# Database Schema

## Overview
The app uses Firestore with a document-per-collection pattern. Most schema enforcement is implicit in TypeScript interfaces and write paths; Firestore itself has no server-side schema validation.

Primary collections observed in code:
- `users`
- `invites`
- `responses`
- `panelists`
- `questionnaires`
- `raffleEntries`
- `raffleCampaigns`
- `audit`
- `aiStrategyUsage`
- `aiStrategyCache`
- `aiStrategyBriefs`
- `config` (`bootstrap` document)

## Schema Diagram (Mermaid)
```mermaid
erDiagram
  USERS ||--o{ INVITES : "userId"
  USERS ||--o{ AI_STRATEGY_USAGE : "userId (doc key)"
  USERS ||--o{ AI_STRATEGY_CACHE : "userId in cache payload"
  USERS ||--o{ AI_STRATEGY_BRIEFS : "userId"

  RESPONSES ||--o{ RAFFLE_ENTRIES : "responseId"
  RESPONSES ||--o{ PANELISTS : "lastResponseId"

  RAFFLE_CAMPAIGNS ||--o{ RAFFLE_ENTRIES : "eligibility filters"
  RAFFLE_CAMPAIGNS ||--o{ AUDIT : "targetId/action"

  USERS {
    string id
    string email
    string role
    string status
    string createdAt
    string[] assignedCountries
    string[] requestedCountries
    string companyName
    string contactName
    string phone
    string subscription_tier
    bool subscription_addon_ai
    number ai_usage_count
    string ai_usage_reset_date
    string authUid
  }

  INVITES {
    string id
    string token
    string userId
    string email
    string companyName
    string[] countries
    string[] requestedCountries
    string status
    string createdAt
    string expiresAt
    string usedAt
    string contactName
    string phone
  }

  RESPONSES {
    string response_id
    string device_id
    string selected_country
    string country
    string timestamp
    string _status
    string c1_top_of_mind
    string c1_recognized_bank_id
    string[] c2_recognized_bank_ids
    string[] c2_unrecognized_entries
    string[] c3_aware_banks
    string[] c4_ever_used
    string[] c5_currently_using
    string c6_main_bank
    object d2_future_intent
    object d7_nps
    string e1_employment
    string e2_education
    string e3_gender
    string gender
  }

  PANELISTS {
    string panelistId
    string deviceId
    string country
    string source
    string status
    number participationCount
    string lastParticipationAt
    string nextEligibleAt
    string lastResponseId
    string contactName
    string contactEmail
    string contactPhone
    string createdAt
    string updatedAt
  }

  QUESTIONNAIRES {
    string id
    string name
    string status
    string createdAt
    string waveTag
    string[] usedInWaves
    object[] questions
  }

  RAFFLE_ENTRIES {
    string id
    string responseId
    string deviceId
    string country
    string source
    string contactName
    string contactEmail
    string contactPhone
    timestamp createdAt
  }

  RAFFLE_CAMPAIGNS {
    string id
    string name
    string country
    string startDate
    string endDate
    number maxWinners
    string status
    object eligibility
    object[] winners
    string createdAt
    string updatedAt
  }

  AUDIT {
    string id
    string action
    string actorEmail
    string targetId
    string timestamp
    object details
  }

  AI_STRATEGY_USAGE {
    string userId
    string monthKey
    number used
    string updatedAt
    timestamp updatedAtServer
  }

  AI_STRATEGY_CACHE {
    string userId
    string response
    string createdAt
    string expiresAt
  }

  AI_STRATEGY_BRIEFS {
    string userId
    string monthKey
    string title
    string country
    string period
    string summary
    string response
    object context
    string createdAt
    timestamp createdAtServer
  }
```

## Diagram Explanation
- Entities are Firestore collections observed in active service/page code paths.
- Relationship lines represent logical references (foreign-key-like fields), not enforced database constraints.
- Several references rely on semantic IDs (for example `response_id`) rather than Firestore document IDs.
- Derived analytics are computed at read time on the client and are intentionally excluded as stored entities.

## Relationships and ID Patterns
- `users` uses mixed ID strategy:
  - admins: doc id often Firebase UID
  - subscribers: doc id often email (`createDraftSubscriber`, `createSubscriberProfile`)
- `invites.userId` points to `users.id`
- `raffleEntries.responseId` references `responses.response_id` (not Firestore doc id)
- `panelists.lastResponseId` references `responses.response_id`
- AI usage legacy path also stores per-user/per-month document key (`{userId}_{month}`)

## Nested Objects / Computed Fields
- `responses.d2_future_intent` and `responses.d7_nps` are maps keyed by bank ID.
- `raffleCampaigns.eligibility` and `raffleCampaigns.winners[]` are nested structures.
- Derived analytics are computed client-side in `src/utils/subscriberDashboard.ts` and not stored as materialized views.

## Fields Written but Rarely/Never Read
- `responses._updatedAt` (written by report edit, no downstream read found).
- `users.lastLogin` set in auth context state but not persisted to Firestore.
- `users.authUid` written in `createSubscriberProfile`, not used in auth lookup logic.
- `panelists.createdAt` is rewritten on updates, reducing usefulness as immutable creation metadata.

## Fields Read but Not Reliably Written
- `responses.gender` is read heavily by dashboard filters/diagnostics; survey mainly writes `e3_gender`.
- `responses.c6_main_bank` and `responses.d5_committed` are assumed for downstream loyalty logic, but auto-skip assignment is not implemented when single-option paths are hidden.

## Likely Missing / Recommended Fields
- immutable `createdBy`/`updatedBy` on admin-mutated collections
- `version`/`schemaVersion` on response payloads
- normalized `userUid` foreign key on all user-owned docs
- explicit `submittedAt` server timestamp for responses (currently client ISO)

## Inconsistent Naming
- `gender` vs `e3_gender`
- `country` vs `selected_country`
- `c6_main_bank` vs `c6_often_used` (both used in logic)
- timestamps mixed between ISO strings and Firestore timestamps

## Schema Risks / Integrity Issues
- Mixed user ID strategy (email vs UID) increases join/auth complexity.
- Heavy reliance on optional fields with no schema validation.
- Client-generated timestamps and IDs can be forged or malformed.
- No transaction boundaries for multi-document operations except initial admin bootstrap.
- Public write surfaces can create noisy/invalid records.

## Assumptions
- No hidden migration scripts beyond repository scripts folder.
- Existing production data may contain legacy field variants from older flows.

## Known Gaps / Unclear Areas
- No `firestore.indexes.json` present; current queries appear to rely on default indexes only.
- Some localStorage-only stores (`adminStore`, `raffleStore`) appear legacy and disconnected from Firestore truth.
- Seed/test scripts write schema variants that differ from current survey output.

## Recommended Improvements
- Standardize identity foreign keys (`uid` + stable profile id).
- Add runtime schema validation on writes (Zod or server function layer).
- Normalize demographic and country fields to one canonical key each.
- Add migration utility for historical response shape cleanup.
- Introduce server-side write API for critical collections to enforce schema and ownership.
