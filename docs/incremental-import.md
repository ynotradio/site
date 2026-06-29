# Incremental Import System

**Status:** Retired, June 2026

Nightly incremental MySQL-to-Payload imports are no longer needed. Migrated content is now managed directly in Payload/Postgres.

## Current Policy

- Do not schedule incremental imports.
- Do not run integrity checks nightly.
- Keep the import scripts only for one-off repair or historical reference.
- Keep the Buildkite nightly pipeline as a no-op placeholder.

## Legacy Scripts

These scripts may still exist for manual recovery work:

- `bin/incremental-import.ts`
- `bin/quick-import.ts`
- `bin/migrations/*`
- `bin/integrity-check-*.ts`

Run them only with an explicit reason and after confirming the source/target databases.
