# Chapter 17: PHP Deletion

[← Back to Index](./README.md)

**Status:** Planned · **Last Updated:** July 2026

---

## Precondition

This chapter starts **after** Top 11 and Year End Poll (including Staff Picks)
have been fully developed in Payload and cut over to production. Custom text
(Chapter 15 `Pages` collection) must also be live. Do not start here until all
three are done — there will be MySQL data that still needs Payload homes until
then.

---

## Phase 1 — Verify All Data Has Moved

Before deleting anything, confirm every MySQL table has a Payload equivalent
and has been migrated:

| MySQL table(s) | Payload collection | Notes |
|---|---|---|
| `top11`, `top11songs`, `top11contest`, `top11message`, `top11_user_votes` | Top 11 collection(s) | Done per precondition |
| `year_end_*`, `write_in`, `ip_address` | Year End Poll / Staff Picks collections | Done per precondition |
| `custom_texts` | `Pages` collection | Done per precondition (Chapter 15) |
| All other tables | Already in Payload | Completed in earlier chapters |

Run a final MySQL row-count check against production before proceeding.

---

## Phase 2 — Update / Delete E2E Tests

All E2E tests that hit `http://localhost:8080` (the legacy Apache/PHP site) must
be either deleted (if nothing replaces them) or rewritten against the Payload
admin or a future Next.js public site.

**Delete entirely** (no Payload equivalent yet):

- `e2e/top11.spec.ts`
- `e2e/year-end-poll.spec.ts`
- `e2e/postgres-pages.spec.ts`
- `e2e/crud-integration.spec.ts`
- `e2e/front-page-headlines.spec.ts`
- `e2e/new-music-dates.spec.ts`
- `e2e/payload-integration.spec.ts` (last step checks legacy site)

**Delete** — MRM PHP rendering tests (MRM admin now lives entirely in Payload):

- `e2e/modern-rock-madness.spec.ts`
- `e2e/mrm-bracket-data.spec.ts`
- `e2e/mrm-integration.spec.ts`
- `e2e/mrm-postgres-extended.spec.ts`
- `e2e/mrm-postgres-fresh.spec.ts`

**Update** `e2e/utils/payload-helpers.ts`:

- Remove the `LEGACY_BASE_URL` constant and the `navigateToLegacySiteWithPostgres` function.

**Update** `e2e/utils/test-helpers.ts`:

- Remove the `checkForPhpErrors` function (no PHP pages left to check).

**Update** `e2e/README.md` and `e2e/utils/README.md` to remove all legacy PHP
references.

**Update** `playwright.config.ts` — remove `PLAYWRIGHT_LEGACY_URL` if present.

---

## Phase 3 — Delete `src/`

Before deleting, optionally archive the legacy MySQL schema for reference:

```bash
cp -r src/db/migrations docs/legacy-db/
```

Then delete the entire `src/` directory. This includes:

- All public PHP pages (`index.php`, `concerts.php`, `music.php`, etc.)
- All partials (`src/partials/`)
- All models and implementations (`src/models/`)
- All controllers (`src/controllers/`)
- All functions (`src/functions/`)
- The legacy control panel (`src/cp/`, `src/cp.php`)
- Auth pages (`auth_login.php`, `auth_logout.php`, `callback.php`, `logoff.php`, `loggedoff.php`)
- Library code (`src/lib/`)
- Config (`src/config/`)
- PHP tooling (`src/PHP_CodeSniffer/`, `src/phpcs.xml`, `src/phpunit.xml`)
- PHP tests (`src/tests/`)
- Composer files (`src/composer.json`, `src/composer.lock`)
- Legacy DB schema and SQL (`src/db/`)
- Static assets only used by PHP pages (`src/icons/`, `src/images/`, `src/imgs/`, `src/js/`, `src/style/`)
- `src/__env_loader.php`, `src/.htaccess`

---

## Phase 4 — Remove Docker PHP Infrastructure

**Delete:**

- `Dockerfile.phpfpm`
- `bin/docker/phpfpm/` (entire directory)
- `bin/docker/mysql/` (entire directory)
- `bin/docker/apache-vhost/` (entire directory)

**Update `docker-compose.yml`** — remove the `mysql`, `phpmyadmin`, `phpfpm`,
and `apache` services, and the `mysqldb_data` named volume.

**Update `docker-compose.ci.yml`** — remove the `mysql` and `phpfpm` service
overrides.

**Update `docker-compose.e2e.yml`** — remove the `mysql`, `phpfpm`, and `apache`
services; remove the `mysql` healthcheck wait from the startup sequence; update
the `playwright` service `depends_on` to only reference `payload`.

---

## Phase 5 — Strip PHP from CI Pipeline

**Delete:**

- `.buildkite/pipeline-deploy-legacy.yml`
- `.buildkite/pipeline-deploy-pr.yml`
- `.buildkite/scripts/deploy-legacy.sh`

**Update `.buildkite/pipeline-ci.yml`:**

- Remove the `PHP_VERSION` and `SKIP_PHP` env vars.
- Remove the `php-lint` step.
- Remove the `php-test` step.
- Remove `php-lint` and `php-test` from the `e2e` step's `depends_on` list.

**Update `.buildkite/scripts/check-changes.sh`:**

- Remove the `HAS_PHP` detection logic and `SKIP_PHP` metadata.
- Remove the `buildkite-agent pipeline upload .buildkite/pipeline-deploy-legacy.yml`
  line from the non-PR build path.
- Remove the `SKIP_PHP` sed substitution.

**Update `.buildkite/scripts/run-e2e.sh`:**

- Remove phpfpm/apache image pull and local build fallback.
- Remove `docker compose ... up -d mysql` and its healthcheck wait loop.
- Remove `docker compose ... up -d phpfpm apache` and the Apache healthcheck wait.

**Update `.buildkite/scripts/run-integrity-checks.sh`:**

- Remove `--from prod-mysql` from the publish-status check call. All data is
  now in Postgres; compare against Payload's own database.

**Update `.buildkite/scripts/run-single-integrity-check.sh`:**

- In the `ondemand-source` case: remove `--from prod-mysql` (OnDemand source
  data is now entirely in Payload/Postgres).
- In the `publish-status` case: remove the comment about MySQL as source of
  truth and drop `--from prod-mysql`.

---

## Phase 6 — Remove PHP-Related Bin Scripts and Config

**Delete:**

- `bin/seed-legacy.sh`
- `bin/init-mysql-db.sh`
- `bin/pull_db.sh` (pulls MySQL dump from production; no longer needed)
- `bin/rollback.sh` (rolls back the Bitnami Apache htdocs; no longer needed)

**Update `package.json`:**

- Remove the `"seed:legacy"` script.
- Change `"seed"` from `"yarn seed:payload && yarn seed:legacy"` to just
  `"yarn seed:payload"`.

**Delete:**

- `.env.php.example`
- `.env.production.mysql.example`

**Update `.env.example`:**

- Remove the "Legacy MySQL Configuration" section (all `DB_*` and
  `IMPORT_DB_*` variables).
- Remove `USE_POSTGRES_TOP11` and `USE_POSTGRES_CUSTOMTEXT` feature flags.
- Remove `POSTGRES_HOST/PORT/DATABASE/USER/PASSWORD/SSL_MODE` — these were
  only needed by PHP's direct Postgres connection, not by Payload's
  `DATABASE_URI`.

---

## Phase 7 — Update Documentation

**`docs/PROJECT_STATUS.md`:**

- Remove the MySQL rows from the "Production Content Sources" table (Top 11,
  Year End Poll / Staff Picks).
- Update "Remaining Work" — all content is now in Payload; remaining work is
  the public-site redesign.

**`docs/payload-migration/README.md`:**

- Remove "Legacy MySQL/admin still owns" section.
- Add a link to this chapter.

**`AGENTS.md`:**

- Remove the "Legacy PHP development" workflow section.
- Remove `docker compose up -d`, `yarn seed:legacy`, and
  `http://localhost:8080` references.
- Remove the "Legacy PHP Site" section from the "Key URLs" table.
- Remove the "Both Systems Together" workflow block.
- Remove the "Modifying Legacy PHP" pattern block.

**`README.md`:**

- Remove Option 1 (GitHub Codespaces with `docker-compose up`) and Option 2
  (local Docker instructions) that describe the PHP stack.
- Remove the "Test legacy site" block from the agent quick-commands section.

**`e2e/README.md`** — rewrite to describe Payload-only E2E testing (see Phase 2).

---

## Phase 8 — Decommission Production PHP Hosting

This is an ops step, not a code change:

1. Ensure `www.ynotradio.net` is pointing at the new public site (Netlify
   Next.js) or that a holding page / redirect is in place.
2. Take a final snapshot/backup of the MySQL production database.
3. Tear down the Bitnami Apache/PHP-FPM server.
4. Close the production MySQL database.
5. Remove Buildkite pipeline secrets: `DEPLOY_HOST`, `DEPLOY_USER`,
   `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS`, `ENV_PHP_CONTENTS`.
6. Remove the `y-not-radio-deploy-pr` Buildkite pipeline (used by
   `pipeline-deploy-pr.yml`).

---

## What Is NOT Deleted

- `payload/` — Payload CMS (the replacement)
- `app/` — Next.js app (the replacement frontend)
- `e2e/collections/` and all Payload-targeted E2E tests — keep and expand
- `bin/migrations/` — historical one-time import scripts; safe to keep as
  reference material
- `docs/legacy-db/` — archived MySQL schema (if you chose to copy it in Phase 3)
