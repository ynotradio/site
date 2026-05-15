# Netlify Database Cutover

## Target Topology

- **Production runtime DB:** `DATABASE_URI` in Netlify production, pointing at the production database.
- **Deploy preview DB:** `DATABASE_URI` in Netlify deploy previews, pointing at the preview database.
- **Local dev DB:** `DATABASE_URI` in `.env.local`, normally local Postgres.
- **Read-only automation targets:** `PRODUCTION_DATABASE_URL` and `PREVIEW_DATABASE_URL` for imports, gap reports, and refresh jobs.

## Provider-Neutral Environment Contract

- `DATABASE_URI` is the primary runtime variable.
- `LOCAL_DATABASE_URL` is an optional explicit local override.
- `PRODUCTION_DATABASE_URL` is the explicit automation target for the production database.
- `PREVIEW_DATABASE_URL` is the explicit automation target for the preview database.
- `NEON_PROD_DATABASE_URL` and `NEON_DEV_DATABASE_URL` remain temporary compatibility aliases only.

## Preview Refresh Strategy

Preview refresh no longer assumes database branches.

The refresh workflow is:

1. Import prod MySQL updates into `PRODUCTION_DATABASE_URL`
2. Refresh `PREVIEW_DATABASE_URL` from production using `pg_dump | psql`
3. Run gap reports and integrity checks against `PREVIEW_DATABASE_URL`

This works with Neon today and Netlify Databases later without changing script targets again.

## Migration Path

1. Provision Netlify production and preview databases
2. Run Payload migrations against the new preview database
3. Import data into the preview database and validate parity
4. Repoint `PRODUCTION_DATABASE_URL` and preview `DATABASE_URI` when rehearsal succeeds
5. Cut production over only after preview validation and rollback prep are complete

## Preview Rehearsal Checklist

- Run Payload migrations against preview
- Run incremental import with `--to preview-db`
- Run gap reports and integrity checks against preview
- Smoke-test Payload admin and public read paths against preview
- Verify Buildkite jobs use generic env vars only

## Production Cutover Checklist

- Take a final backup/export from the current production database
- Freeze writes or define a short maintenance window
- Run the final import into the new production database
- Switch Netlify production env vars to the new provider
- Smoke-test admin, imports, scheduled jobs, and public reads

## Rollback

- Keep the previous production connection strings available until soak is complete
- Roll back by restoring the prior `DATABASE_URI` / `PRODUCTION_DATABASE_URL` values
- Keep preview refresh and integrity jobs pointed at the old provider until the new one is stable

## Cleanup After Soak

- Remove `NEON_*` compatibility vars
- Remove any remaining `prod-neon` / `dev-neon` naming from scripts and docs
- Retire provider-specific branch-reset logic and billing references
