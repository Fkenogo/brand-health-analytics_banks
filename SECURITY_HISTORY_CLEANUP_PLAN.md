# Git History Cleanup Plan (Leaked Key)

This runbook removes leaked key material from Git history without executing anything automatically.

## Current repo shape

- Active branch: `main`
- Remote: `origin` -> `https://github.com/Fkenogo/brand-health-analytics_banks.git`
- Remote branches observed: `origin/main`
- Tags: none

## Preconditions

1. Rotate the leaked key first (already required).
2. Freeze merges to `main` during rewrite window.
3. Ensure all collaborators are notified that history will be force-pushed.

## 1) Create a backup mirror

```bash
cd ..
git clone --mirror https://github.com/Fkenogo/brand-health-analytics_banks.git brand-health-analytics_banks.mirror.git
cd brand-health-analytics_banks.mirror.git
```

## 2) Install `git-filter-repo`

macOS (homebrew):

```bash
brew install git-filter-repo
```

or Python/pip:

```bash
python3 -m pip install git-filter-repo
```

Verify:

```bash
git filter-repo --version
```

## 3) Build a replacement mapping file

Create `replacements.txt` with exact leaked key(s):

```text
<LEAKED_KEY_STRING>==>REDACTED_GOOGLE_API_KEY
```

If multiple keys leaked, add one line per key.

## 4) Rewrite all refs

```bash
git filter-repo --replace-text replacements.txt --force
```

## 5) Verify rewrite locally

```bash
git grep -n "AIza[0-9A-Za-z_-]\{20,\}" $(git rev-list --all) || true
git log --all --oneline --decorate | head -n 20
```

Expected: no leaked key value occurrences in rewritten history.

## 6) Force-push rewritten history

```bash
git push --force --all origin
git push --force --tags origin
```

## 7) Post-push actions

1. Invalidate local clones:
   - recommended: reclone.
   - alternative: hard reset to new `origin/main` and prune.
2. Ask collaborators to remove stale refs/reflogs that still contain old objects.
3. Re-run repository scans:
   - `npm run secrets:scan`
   - `git grep -n "AIza[0-9A-Za-z_-]\{20,\}" $(git rev-list --all)`
4. Check GitHub secret scanning alert status after rewrite + key rotation.

## Safer alternative if rewrite is not immediately possible

- Keep rotated key only.
- Enforce strict key restrictions (API + referrer).
- Proceed with release, but schedule history cleanup as a security debt item.

## Notes

- This process rewrites commit SHAs and requires coordination.
- Since no tags were detected, blast radius is limited mainly to `main` and any forks/clones.
