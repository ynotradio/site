# Migration Tasks

[Back to Index](./README.md)

## Status

The original core Payload migration tasks are complete and the detailed task plan is retired.

## Completed

- Payload app configured with PostgreSQL/Neon.
- Cloudinary media uploads configured.
- Core collections implemented.
- One-time import scripts created and used.
- Production data imported and cleaned.
- PHP read models cut over to Payload/Postgres for migrated content.
- Modern Rock Madness migrated to Payload/Postgres.
- Nightly imports and integrity checks retired.

## Remaining Work

- Top 11 collections/admin workflow.
- Year End Poll voting/admin workflow.
- Staff Picks workflow.
- Future public-site redesign.

## Manual Repair Scripts

Import and integrity scripts may still be used manually for repair work. Confirm source and target databases before running anything under `bin/migrations/`, `bin/quick-import.ts`, `bin/incremental-import.ts`, or `bin/integrity-check-*.ts`.
