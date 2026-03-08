# User Flow Map

## Overview
This document maps implemented user journeys across public respondents, subscribers, and admins, including data writes and guard behavior.

## Flow Diagram (Mermaid)
```mermaid
flowchart TD
  A[Landing /] --> B[Survey /survey/:country]
  A --> C[Login /login]
  A --> D[Admin Login /admin/login]
  A --> E[Invite Link /invite/:token]

  B --> B1[Survey Questions]
  B1 -->|Complete/Terminate| B2[Save response local + Firestore]
  B2 --> B3[Optional panel join / raffle entry]

  C --> C1[Firebase signIn]
  C1 --> C2[Lookup users by email]
  C2 -->|subscriber active| S1[/dashboard]
  C2 -->|subscriber pending/rejected/suspended| S0[/dashboard/pending]
  C2 -->|admin| AD1[/admin]

  D --> D1[Check config/bootstrap]
  D1 -->|no bootstrap| D2[Create first admin]
  D1 -->|bootstrap exists| D3[Admin sign in]

  E --> E1[Read invite by token]
  E1 --> E2[Create Firebase auth user]
  E2 --> E3[Create subscriber profile (pending)]
  E3 --> E4[Mark invite used]

  AD1 --> AD2[Manage subscribers/users/questionnaires/panels/reports/raffles]
  AD2 --> AD3[Firestore writes + audit entries]

  S1 --> S2[Dashboard filters + analytics]
  S2 --> S3[Optional AI Strategy Advisor]
  S3 --> S4[Callable function + cache/usage writes]
```

## Diagram Explanation
- The map starts from public entry routes and then branches by role/status.
- Guarded transitions (`RequireAuth`, `RequireRole`, survey gates) determine legal path progression.
- Database update nodes indicate where user actions produce Firestore writes.
- AI flow is modeled as an optional branch from dashboard usage, not a prerequisite for dashboard completion.

## Role-Based Access Map
- Public:
  - `PublicLandingPage`, `SurveyPage`, `SubscriberInvitePage`
- Subscriber (guarded):
  - `SubscriberDashboardPage`, `SubscriberReportsPage`, `SubscriberPendingPage`
- Admin (guarded):
  - `Admin*` pages and admin-mode subscriber dashboard viewer

Route enforcement is client-side through:
- `RequireAuth`
- `RequireRole`
- `PublicSurveyGate`
- `AdminSurveyGate`

## Detailed Flows

### 1) Authentication Flow
Entry points:
- `/login` for subscriber/admin sign-in
- `/admin/login` for admin-only sign-in/bootstrap

Actions:
1. Firebase Auth sign-in.
2. Fetch profile from Firestore by `email`.
3. Apply role/status guards.

Backend/database updates:
- `AuthContext.login` sets `lastLogin` in in-memory/local storage user object, not persisted to Firestore.

Completion state:
- Successful redirect to role home path.

Failure points:
- Auth succeeds but no matching Firestore profile -> forced logout/error.
- Role mismatch (`/admin/login` with non-admin) -> logout.

### 2) Subscriber Onboarding via Invite
Entry point:
- `/invite/:token`

Actions:
1. Fetch invite by token.
2. Collect contact + requested countries + password.
3. Create Firebase Auth user.
4. Write `users` subscriber profile (`pending`).
5. Update invite status to `used`.

Database updates:
- `users`, `invites`

Completion state:
- Request submitted; subscriber awaits admin approval.

Failure points:
- Expired/invalid invite.
- Auth creation error.
- Partial failure between user profile write and invite update.

### 3) Survey Flow (Respondent)
Entry point:
- `/survey/:country` (or admin survey variants)

Actions:
1. Country/language selection.
2. Dynamic question rendering via logic predicates.
3. Completion or termination write.
4. Optional post-survey contact capture:
   - panel opt-in (`panelists`)
   - raffle entry (`raffleEntries`)

Database updates:
- `responses` (plus local storage mirror)
- `panelists`
- `raffleEntries`

Completion state:
- Survey finished + optional contact submission.

Failure points:
- Validation edge case for required numeric `0` responses.
- Contact submission permission failures handled in UI.

### 4) Admin Subscriber Approval Flow
Entry point:
- `/admin/subscribers`

Actions:
1. Create draft subscriber profile.
2. Configure invite countries + validity.
3. Generate invite link.
4. Review pending submissions.
5. Approve/reject/suspend and set subscription tier/add-ons.

Database updates:
- `users`, `invites`, `audit`

Completion state:
- Subscriber transitions to `active` and can access dashboard.

Failure points:
- Status/tier updates rely on client-side authority and permissive rules.

### 5) Dashboard + Reporting Flow
Entry points:
- `/dashboard`, `/dashboard/:country`, `/admin` (admin-mode dashboard)

Actions:
1. Load all responses from Firestore (fallback local).
2. Apply country/demographic/time filters.
3. Compute metrics client-side.
4. Export CSV views.

Database updates:
- Mostly read-only for dashboard; exports are client-side.

Completion state:
- Interactive analytics and optional export.

Failure points:
- Large datasets may degrade browser performance due full-data reads and client compute.
- Subscriber reports route is scaffold-only.

### 6) AI Strategy Advisor Flow
Entry point:
- Dashboard floating CTA

Actions:
1. Build context payload from computed metrics.
2. Call callable function.
3. Cache response and increment usage.
4. Optional executive brief archive/write.

Database updates:
- `aiStrategyCache`, `aiStrategyUsage` and/or `users.ai_usage_count`, `aiStrategyBriefs`

Completion state:
- AI response appended in advisor panel.

Failure points:
- Feature may be blocked by placeholder mode (`VITE_AI_ADVISOR_PLACEHOLDER`).
- Usage/subscription checks are mostly client-side.

## Edge Cases / Broken Paths
- `/dashboard/reports` shows scaffold text only.
- `Signup` page is invite-only message; no full signup backend flow.
- Forgot/reset password functions are mock implementations.
- Legacy localStorage admin store and legacy admin tabs are disconnected from active runtime.

## Assumptions
- No external orchestration service beyond Firebase Function.
- No payment flow implemented in this repository.

## Known Gaps / Unclear Areas
- Some intended autoskip survey behavior is documented in question comments but not fully enforced in submit logic.
- AI advisor entitlement may be intended to be server-side but currently appears primarily client-gated.
- No explicit idempotency or compensating transaction around multi-step onboarding writes.

## Recommended Improvements
- Add backend-enforced workflow endpoints for onboarding and approvals.
- Introduce explicit state machine for subscriber lifecycle transitions.
- Add E2E tests for invite -> pending -> approve -> dashboard path.
- Add flow telemetry (success/failure counters by route and action).
