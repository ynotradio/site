# Project Status - Y-Not Radio Site

**Last Updated:** June 2026

## Current State

The legacy PHP public site remains in production. Most editorial content now lives in Payload CMS backed by PostgreSQL/Neon. The PHP site reads migrated content directly from PostgreSQL where available and still uses legacy MySQL only for areas that have not moved yet.

## Production Content Sources

| Area                        | Source             | Notes                       |
| --------------------------- | ------------------ | --------------------------- |
| Ads                         | Payload/Postgres   | Managed in Payload          |
| CD of the Week              | Payload/Postgres   | Managed in Payload          |
| Concerts                    | Payload/Postgres   | Managed in Payload          |
| DJs                         | Payload/Postgres   | Managed in Payload          |
| Music records/songs         | Payload/Postgres   | Managed in Payload          |
| On Demand                   | Payload/Postgres   | Managed in Payload          |
| Schedule                    | Payload/Postgres   | Managed in Payload          |
| Stories / custom text       | Payload/Postgres   | Managed as Posts in Payload |
| Modern Rock Madness         | Payload/Postgres   | Admin tools live in Payload |
| Top 11                      | Legacy MySQL/admin | Not ready for Payload       |
| Year End Poll / Staff Picks | Legacy MySQL/admin | Not ready for Payload       |

## Completed

- Payload CMS is deployed on Netlify with PostgreSQL/Neon and Cloudinary media storage.
- Core editorial collections are implemented and populated.
- Legacy PHP read models are cut over to Payload/Postgres for migrated content.
- Modern Rock Madness collections, voting, live match admin, and bracket tooling are in production.
- Historical import and integrity scripts completed the one-time migration/cleanup work.
- Nightly content imports and integrity checks are retired; the Buildkite pipeline remains as a no-op placeholder.

## Remaining Work

1. Define and migrate Top 11 data/admin workflows.
2. Define and migrate Year End Poll and Staff Picks workflows.
3. Continue simplifying legacy PHP once remaining admin workflows move to Payload.
4. Build the future public-site redesign when ready.

## Current Admin URLs

- Payload admin production app: `https://ynotradio-admin.netlify.app/admin`
- Legacy control panel: `https://www.ynotradio.net/cp/`

## Current Validation

Before pushing code, run:

```bash
source bin/agent-helpers/bootstrap.sh
yarn lint
yarn test
yarn build
```

Run `yarn test:e2e` for UI/API/e2e changes.
