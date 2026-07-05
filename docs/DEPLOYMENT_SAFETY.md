# Production Deployment Safety

## Before Deploying

```bash
source bin/agent-helpers/bootstrap.sh
yarn lint
yarn test
yarn build
```

Run `yarn test:e2e` for UI/API/e2e changes.

## Production Checks

After deploy:

```bash
curl -I https://www.ynotradio.net/
curl -I https://www.ynotradio.net/cp/
curl -I https://ynotradio-admin.netlify.app/admin
```

Spot-check pages touched by the change and watch PHP/hosting logs for errors.

## Environment Safety

- Do not deploy `.env.local`.
- Keep PHP secrets in the production host environment.
- Keep Payload secrets in Netlify.
- Do not reintroduce `USE_POSTGRES_*` rollout flags; migrated content is already on Payload/Postgres.

## Rollback

Use the existing production rollback path for the affected surface:

- Legacy PHP site: redeploy/reset to the previous known-good Git revision.
- Payload admin app: roll back the Netlify deploy.
- Environment issue: restore the previous environment values from the host/provider dashboard.

## Current Data Sources

- Payload/Postgres: Ads, CD of the Week, Concerts, DJs, Music, On Demand, Schedule, Posts, Modern Rock Madness.
- Legacy MySQL/admin: Top 11, Year End Poll voting/admin, Staff Picks.
