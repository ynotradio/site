# DJ Data Quality Repair

This document covers manual DJ cleanup scripts originally created for GitHub issues #597 and #598.

## Scripts

### Find DJ Issues

```bash
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/find-dj-issues.ts
```

With an explicit database:

```bash
DATABASE_URI="$NEON_DEV_DATABASE_URL" \
  node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/find-dj-issues.ts
```

### Repair DJ Issues

Dry run:

```bash
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/repair-dj-issues.ts
```

Confirmed delete:

```bash
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/repair-dj-issues.ts --confirm
```

### DJ Integrity Check

```bash
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-djs.ts
node --import ./bin/preload-nextenv-fix.mjs --import tsx bin/integrity-check-djs.ts --fix
```

## Current Policy

These scripts are manual repair tools only. They are not part of a nightly integrity-check pipeline.

## Manual Duplicate Review

For duplicate DJ names:

1. Run `bin/find-dj-issues.ts`.
2. Compare Payload admin with the public deejays page.
3. Keep the record used by the public site.
4. Delete confirmed duplicates in Payload admin or with the repair script.
5. Re-run the check.
