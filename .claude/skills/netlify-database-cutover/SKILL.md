---
name: netlify-database-cutover
description: Use when replacing Neon with Netlify Databases, updating database env vars, or changing preview refresh/import automation during the provider cutover.
---

# Netlify Database Cutover

Use this skill for database-provider cutover work in the Y-Not Radio site.

## Checklist

1. **Keep `DATABASE_URI` as the runtime source of truth**
   - Production runtime uses `DATABASE_URI`
   - Preview runtime uses `DATABASE_URI`
   - Local development uses `DATABASE_URI` (or `LOCAL_DATABASE_URL` if explicitly needed)

2. **Use provider-neutral automation targets**
   - `PRODUCTION_DATABASE_URL` for imports and production-targeted automation
   - `PREVIEW_DATABASE_URL` for preview refresh, gap reports, and integrity checks
   - `NEON_*` vars are temporary compatibility fallbacks only

3. **Do not assume database branches exist**
   - Preview refresh must work without Neon branch reset APIs
   - Prefer dump/restore or rebuild flows that work on any PostgreSQL provider

4. **Update all coupled CI touchpoints together**
   - `.buildkite/nightly-gap-report.yml`
   - `.buildkite/scheduled-db-sync.yml`
   - `.buildkite/hooks/pre-command`
   - `.buildkite/scripts/run-single-integrity-check.sh`
   - `.buildkite/scripts/run-integrity-checks.sh`

5. **Keep rollback cheap**
   - Preserve previous production connection strings until soak is complete
   - Do not remove `NEON_*` fallbacks until the new provider is proven stable

## Preview Refresh Strategy

The repo-standard preview refresh flow is:

1. Import prod MySQL updates into `PRODUCTION_DATABASE_URL`
2. Refresh `PREVIEW_DATABASE_URL` from production with `pg_dump | psql`
3. Run gap reports and integrity checks against `PREVIEW_DATABASE_URL`

This avoids provider-specific branch reset logic and works for Neon and Netlify Databases.

## Files to Check

- `/home/runner/work/site/site/config/databases.ts`
- `/home/runner/work/site/site/payload.config.ts`
- `/home/runner/work/site/site/bin/migrations/shared/payloadClient.ts`
- `/home/runner/work/site/site/.env.example`
- `/home/runner/work/site/site/.env.preview.example`
- `/home/runner/work/site/site/.env.production.example`
- `/home/runner/work/site/site/docs/NETLIFY_DATABASE_CUTOVER.md`

## Validation

- `yarn lint`
- `yarn test`
- `yarn build`
