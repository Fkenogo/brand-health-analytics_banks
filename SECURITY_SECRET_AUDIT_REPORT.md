# Secret Exposure & Config Audit Report

Date: 2026-03-09  
Scope: Full repository scan (source, scripts, functions, docs, logs, config, hidden files, and git history references)

## 1) Executive summary

- Confirmed exposed Google API key pattern (`AIza...`) was present in tracked source files.
- Exposure existed in:
  - frontend Firebase config
  - Firestore seed script
  - Firestore seed verification script
- No private key blocks, OpenAI keys, AWS access keys, Stripe/Twilio/SendGrid secrets, or service account JSON credentials were found in current tracked files.
- The exposed Google API key string is present across multiple historical commits and must be treated as compromised.
- Fix applied: all hardcoded Firebase config values were moved to environment variables; scripts now resolve config from env; secret scanner guardrail added.

## 2) Findings by file

| File | Issue found | Severity | Why it is a problem | Fix applied | Rotate now |
|---|---|---:|---|---|---|
| `src/lib/firebase.ts` | Hardcoded Firebase Web API key and project config | High | Key was committed and publicly discoverable; static values increase accidental reuse/leak risk | Replaced with `VITE_FIREBASE_*` env reads | Yes (API key) |
| `scripts/seed-responses-to-firestore.mjs` | Hardcoded Firebase Web API key and project config in script | High | Seed script can be copied/reused outside expected context and exposed key was committed | Replaced inline config with env-driven shared loader (`scripts/firebase-config.mjs`) | Yes (API key) |
| `scripts/verify-seed-responses.mjs` | Hardcoded Firebase Web API key and project config in script | High | Same exposure pattern as seeding script | Replaced inline config with env-driven shared loader (`scripts/firebase-config.mjs`) | Yes (API key) |
| Git history (`git rev-list --all`) | Exposed key still present in historical commits | Critical | Secret remains extractable from old commits/tags/forks even after head fix | Reported cleanup strategy; no history rewrite performed (by request) | Yes |

## 3) Public vs sensitive classification

### Public config (not secret by design, but still should be managed safely)

- Firebase web config values (`authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`) are typically client-exposed identifiers.
- Firebase Web API key is not a server secret by itself, but if it is flagged as exposed, it should still be rotated and tightly restricted in Google Cloud (API restrictions + origin restrictions + Firebase rules/App Check).

### Sensitive/secret values

- `GEMINI_API_KEY` is a backend secret (Cloud Functions secret) and must never be hardcoded in source.
- Any service account private keys, OAuth client secrets, webhook secrets, JWT signing keys, database credentials are sensitive. No tracked instances found in this audit.

## 4) Fixes applied

1. **Removed hardcoded Firebase config from app source**
   - `src/lib/firebase.ts` now requires:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - optional `VITE_FIREBASE_MEASUREMENT_ID`

2. **Removed hardcoded Firebase config from scripts**
   - Added `scripts/firebase-config.mjs` to centralize env-based Firebase config for scripts.
   - Added `scripts/load-env.mjs` to load `.env.local` / `.env` for Node CLI scripts.
   - Updated:
     - `scripts/seed-responses-to-firestore.mjs`
     - `scripts/verify-seed-responses.mjs`

3. **Environment template added**
   - Added `.env.example` with placeholders only (no real secret values).

4. **Ignore rules hardened**
   - Updated `.gitignore`:
     - `.env`
     - `.env.*`
     - allowlist `!.env.example`

5. **Future safeguard added**
   - Added `scripts/scan-secrets.mjs` (lightweight regex-based scan for known secret patterns).
   - Added npm script:
     - `npm run secrets:scan`

## 5) Environment variables now required

### Frontend (Vite)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_AI_ADVISOR_PLACEHOLDER` (existing feature flag, not secret)

### Node scripts (seed/verify)

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID` (optional)

Note: scripts also accept `VITE_FIREBASE_*` as fallback.

### Backend secret (Cloud Functions)

- `GEMINI_API_KEY` (managed via Firebase Functions secrets, not committed env files)

## 6) Git history and exposure analysis

- Exact exposed key appears in historical commits across multiple revisions.
- Confirmed by:
  - `git grep -n "AIza[0-9A-Za-z_-]\\{20,\\}" $(git rev-list --all)`
- Affected historical commits currently reachable from branch:
  - `main`: `00cdac4d0bf8f40a231405d7a2ffd9ca89b578df`, `3d0bc0680a2b76e5f7f19db61760d02d17fe47b2`, `455b03a42f2c60be67badcdde23c414d2d4f4255`, `472754ddbf43b26629e83a38e88f5bf9c34658c9`, `69b49c76e96052122163ad54cf9fe4f5f82d80ec`, `b38667d18c2c55b99aad04ac21d9398751b4994a`, `f54361230f918110f6196d7c6c4cbcabce7f8e9a`
- Tags containing leaked key commits: none found.
- `.env`, `.env.local`, `.env.example` were not previously committed (`git log --all -- .env .env.local .env.example` returned no entries).
- No matching key was found in logs/docs/screenshots during content scan.

## 7) Required rotation and immediate actions

1. Rotate the exposed Firebase Web API key immediately in Google Cloud / Firebase project.
2. Apply key restrictions:
   - API restrictions to only required Firebase APIs.
   - HTTP referrer restrictions for web origins where feasible.
3. Confirm Firebase Security Rules and App Check are enabled for abuse resistance.
4. Re-run `npm run secrets:scan` in CI for pull requests.

## 8) History cleanup recommendation (not executed)

Because the key is in commit history, choose one:

- **Preferred**: `git filter-repo` to remove the leaked key from all branches/tags.
- Alternative: BFG Repo-Cleaner.

Caution checklist before force-push:

1. Inventory protected branches/tags and downstream forks.
2. Freeze merges while rewriting history.
3. Rewrite all refs containing the key.
4. Force-push all affected branches/tags.
5. Invalidate old clones (team must reclone or hard reset to rewritten refs).
6. Rotate key regardless of rewrite (assume compromise already happened).

## 9) Validation run

- `npm run secrets:scan` -> pass
- `npm run build` -> pass
