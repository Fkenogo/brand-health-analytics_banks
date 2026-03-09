# INCIDENT_REMEDIATION_PLAN

## Executive summary

Google flagged a publicly exposed Firebase Web API key.  
Current code has already been improved to read Firebase config from environment variables instead of hardcoded source values:

- Frontend: `src/lib/firebase.ts` -> `VITE_FIREBASE_*`
- Scripts: `scripts/firebase-config.mjs` -> `FIREBASE_*` (with `VITE_FIREBASE_*` fallback)

Residual risk remains because:

1. The leaked key exists in git history on `main`.
2. App Check is not implemented/enforced.
3. Anonymous survey writes are intentionally allowed (validated, but still abuseable at scale).

This plan covers safe key rotation, environment updates, Firebase hardening, and controlled history cleanup (without executing rewrite now).

---

## Immediate actions (first 24 hours)

1. Rotate the leaked Firebase Web API key in Google Cloud Console.
2. Replace local and deployment env values with the new key before next production build.
3. Restrict the new API key by:
   - Application restrictions (HTTP referrers)
   - API restrictions (minimum required Firebase APIs)
4. Enable monitoring for anomalous Auth/Firestore/Functions traffic.
5. Schedule git history rewrite window (freeze merges while rewriting).

---

## Key rotation steps (Firebase Web API key)

### 1) Create replacement key

In Google Cloud Console for project `brand-health-analytics`:

1. Create new API key.
2. Label it clearly (example: `web-prod-brandedge-2026-03`).
3. Add application restrictions:
   - Production web domain(s)
   - Staging domain(s) if used
   - localhost dev hosts as needed (for local development only)
4. Add API restrictions to only APIs needed by this app (validate in staging):
   - Identity Toolkit API (Firebase Auth)
   - Firebase Installations API
   - Cloud Firestore API
   - Cloud Functions API (if callable access requires it in your environment)

### 2) Roll out key safely

1. Update local env.
2. Update deployment/build environment secrets.
3. Build and smoke-test login, dashboard reads, survey submit, invite callables.
4. Deploy.
5. Disable/delete old leaked key after successful rollout verification.

### 3) Post-rotation verification

1. Confirm new key in app runtime (network requests succeed).
2. Confirm old key no longer accepted.
3. Check Google/Firebase alert dashboard for residual misuse attempts.

---

## Deployment/env update steps

### Local development files to update

- `.env.local` (already gitignored)

Update:

- `VITE_FIREBASE_API_KEY=<new_key>`
- `FIREBASE_API_KEY=<new_key>` (for script tooling)

Other Firebase env values can remain unchanged unless project/app changes:

- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

### Deployment/build environments to update

This repo has no checked-in `.github/workflows` pipeline file, so update the environment in whichever system builds/deploys `dist`:

- hosting provider env settings (if using external CI/CD)
- local machine/env used for `npm run build` before `firebase deploy`

If Cloud Functions secret rotation is needed later:

- `GEMINI_API_KEY` is managed via Firebase Functions secrets (not from frontend env files).

---

## Firebase hardening review

### A) App Check status

Current status: **missing**.

Evidence:

- No `initializeAppCheck` / `ReCaptchaV3Provider` usage in client code.
- Callable functions in `functions/index.js` do not set `enforceAppCheck: true`.

Recommendation:

1. Implement App Check in web app initialization.
2. Enable App Check enforcement for Firestore/Auth/Functions as supported.
3. Add `enforceAppCheck: true` on callable functions where practical.
4. Roll out with staged monitor mode if needed to avoid sudden client breakage.

### B) Firestore Security Rules posture

Current status: **strong but not abuse-proof**.

Strengths in current `firestore.rules`:

- Least-privilege defaults and deny-by-default fallback.
- Role/claim checks for admin/subscriber access.
- Anonymous writes limited to `responses` with strict key/type validation.
- Non-core collections locked down (`panelists`, `raffle*`, `aiStrategy*`).

Residual risk:

- Public anonymous `responses` create path can still be spammed at scale using valid shape payloads.

Recommendation:

1. Keep strict rules as-is.
2. Add App Check.
3. Add anti-abuse controls:
   - rate limiting (backend-mediated path or edge controls)
   - bot mitigation (CAPTCHA/App Check tokens)
   - anomaly detection alerts for write bursts.

### C) Firebase usage and key restriction implications

Observed client usage:

- `getAuth(app)`
- `getFirestore(app)`
- `getFunctions(app)` (callable usage in `src/services/aiStrategyAdvisorService.ts` and invite flows)

Because these SDK paths are used, API key restrictions must be tested against:

- Auth sign-in / token refresh
- Firestore reads/writes needed by app
- Callable functions invocation

Apply the narrowest restrictions that still pass these flows.

---

## Git history cleanup plan (do not execute yet)

### Scope confirmation

- Affected branch containing leaked key commits: `main`
- Remote branches observed: `origin/main`
- Tags affected: none detected

### Why cleanup is still needed

Even after head fix + key rotation, leaked value remains extractable from historical commits unless rewritten.

### Planned cleanup commands (filter-repo)

1. Mirror clone:

```bash
git clone --mirror https://github.com/Fkenogo/brand-health-analytics_banks.git brand-health-analytics_banks.mirror.git
cd brand-health-analytics_banks.mirror.git
```

2. Install/verify tool:

```bash
git filter-repo --version
```

3. Create replacement map (`replacements.txt`):

```text
<LEAKED_KEY_EXACT_VALUE>==>REDACTED_GOOGLE_API_KEY
```

4. Rewrite:

```bash
git filter-repo --replace-text replacements.txt --force
```

5. Verify:

```bash
git grep -n "AIza[0-9A-Za-z_-]\{20,\}" $(git rev-list --all) || true
```

6. Force-push rewritten refs:

```bash
git push --force --all origin
git push --force --tags origin
```

### Force-push implications

- All commit SHAs change.
- Open PRs must be rebased/recreated.
- Collaborators must reclone or hard-reset to rewritten history.
- Any downstream forks need sync coordination.

### Teammate/local clone recovery

Recommended:

1. Backup local unpushed work.
2. Fresh clone repository.
3. Re-apply local changes on top of new history.

Alternative (advanced):

```bash
git fetch --all --prune
git checkout main
git reset --hard origin/main
git gc --prune=now --aggressive
```

---

## Rollback / precaution notes

1. Do not disable old key until new key is deployed and validated across critical flows.
2. Keep a temporary overlap window where both keys exist (short duration) if needed for zero downtime.
3. If key restrictions break production auth/data flows:
   - relax only the minimum failing restriction
   - retest and re-tighten incrementally
4. If unexpected auth/firestore failures occur after rotation:
   - verify env propagation in build environment
   - verify deployed frontend was rebuilt with new env.

---

## Required confirmations requested

### Confirm: does exact exposed key string still exist in latest working tree?

- **Tracked source tree:** No.
- **Local working tree:** Yes, currently present in `.env.local` (expected local config file, gitignored).

### Confirm: do other Firebase config values/tokens still appear in git history?

- **Yes.** Historical commits on `main` still contain prior Firebase config literals (`authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`) from old `src/lib/firebase.ts` and seed scripts.
- These are generally public Firebase web config identifiers, but they remain historical artifacts until history rewrite.
