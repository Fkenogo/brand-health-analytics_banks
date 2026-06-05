# Recognition Monitoring

Use this after deploying the awareness recognition fixes to review new alias candidates without changing survey UX.

## Primary review surfaces

- `/admin/unrecognized`
  - Review unmatched top-of-mind entries.
  - Review unmatched spontaneous-awareness entries.
  - Review low-confidence top-of-mind matches for possible alias expansion.
- `/admin/aliases`
  - Add approved aliases to the canonical bank list.
  - Use the suggestions section to map frequently repeated raw entries.

## What to review

1. Unmatched top-of-mind entries
   - Look for repeated raw strings with the same intended bank.
   - Add only safe aliases that clearly map to one bank.
2. Unmatched spontaneous entries
   - Watch for repeated comma-separated token variants.
   - Ignore malformed junk and obvious spam.
3. Low-confidence top-of-mind matches
   - These are already matched, but the confidence is below the review threshold.
   - Use these rows to spot near-misses that deserve an explicit alias.

## Safe alias-review rules

- Prefer country-specific aliases.
- Do not add generic aliases like `bank`, `finance`, `credit`, `trust`.
- Do not loosen matcher thresholds globally for one-country misses.
- If an entry could refer to more than one bank, leave it for manual review instead of aliasing it.

## Pilot monitoring cadence

- Review `/admin/unrecognized` daily during the first pilot week.
- Add aliases only after at least 2 repeated mentions or when the intended bank is unambiguous.
- Recheck Uganda entries first, then Rwanda and Burundi.

## Data safety

- The review queue uses response fields already stored for awareness processing.
- It does not add new respondent-facing capture or require personal data.
