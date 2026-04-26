# DJ Data Quality Issues - Repair Guide

This document guides the process of finding and fixing DJ data quality issues as described in GitHub issues #597 and #598.

## Issues Overview

- **#597**: DJ #84 is unknown/orphaned and needs to be removed
- **#598**: Duplicate Josh DJ records exist; only one appears on the public deejays page

## Scripts

### 1. Find DJ Issues (`bin/find-dj-issues.ts`)

Identify which DJs have issues without making any changes.

```bash
# Against local database (via DATABASE_URI env var)
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/find-dj-issues.ts

# Against dev Neon
DATABASE_URI="$NEON_DEV_DATABASE_URL" \
  node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/find-dj-issues.ts

# Against production Neon
DATABASE_URI="$NEON_PROD_DATABASE_URL" \
  node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/find-dj-issues.ts
```

Output will show:

- DJ #84 status
- All Josh DJs and which ones exist
- All orphaned DJs (no person linked)

### 2. Repair DJ Issues (`bin/repair-dj-issues.ts`)

Automatically delete problematic DJs.

```bash
# DRY RUN (show what will be deleted, make no changes)
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/repair-dj-issues.ts

# ACTUAL DELETE (requires --confirm)
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/repair-dj-issues.ts --confirm
```

This script will:

- Automatically delete DJ #84 if it exists
- List all Josh DJs (requires manual review to identify which to keep)
- List all orphaned DJs

### 3. DJ Data Quality Integrity Check (`bin/integrity-check-djs.ts`)

Regularly check for and report DJ data quality issues.

```bash
# Dry run (report issues)
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-djs.ts

# Fix orphaned DJs automatically
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-djs.ts --fix

# Check only recent changes
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-djs.ts --since 24h

# Output report to file
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-djs.ts --output report.md
```

## Fix DJ #598 (Duplicate Josh) Manually

The duplicate Josh issue requires manual review because we need to know which Josh DJ actually appears on the public deejays page.

Steps:

1. Run `bin/find-dj-issues.ts` to get the Josh DJ IDs
2. Visit the Payload admin and the public deejays page to identify which Josh DJ should be kept
3. Edit `bin/repair-dj-issues.ts` to add the `--delete-josh-id` parameter, or manually delete in Payload admin
4. Confirm the issue is resolved on the public site

## Automated Prevention

These checks are now integrated into the **nightly gap report** pipeline (`.buildkite/nightly-gap-report.yml`):

- A new step `:microphone: Check DJ data quality` runs as part of the integrity checks
- Orphaned DJs are detected and reported
- Duplicate display names are flagged
- Reports are combined and posted as GitHub issue comments

This ensures these issues will be caught automatically in the future.

## Related Documentation

- [Nightly Gap Report Pipeline](.buildkite/nightly-gap-report.yml)
- [Integrity Check Script](.buildkite/scripts/run-single-integrity-check.sh)
- [GitHub Issue #597](https://github.com/ynotradio/site/issues/597)
- [GitHub Issue #598](https://github.com/ynotradio/site/issues/598)
