# Prod migration test plan

Moves legacy PHP (ynotradio.net) from the Bitnami Lightsail box (PHP 7.4.7, EOL) to a new instance on PHP 8.3.36+. Context: AWS bulletin 2026-143-AWS, PR #921.

Old box = `52.3.68.231`. New box = whatever Lightsail assigns before the static IP moves. Every check runs against both and compares.

## Principle

Old prod is the oracle. Capture its behavior once, replay against the new box by IP (Host header override), and diff. Nothing is judged from memory.

## Phase 0: baseline (old prod, read-only)

| Capture                                                               | How                                                                                                                             | Automated                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Route list                                                            | Every `src/*.php` route plus `.htaccess` rewrites plus the sitemap/nav links                                                    | `bin/verify-migration.sh capture`   |
| Status, redirect target, content-type, normalized body hash per route | curl against `https://www.ynotradio.net`                                                                                        | same                                |
| Redirect matrix                                                       | http→https, apex→www, `/Schedule`→`/schedule`, `/schedule/`→`/schedule`, `/schedule`→`schedule.php`, `/.well-known/` stays http | same                                |
| DB row counts per table, plus checksum of key tables                  | `mysql` on old box                                                                                                              | `bin/verify-migration.sh db-counts` |
| File inventory                                                        | `find images imgs -type f` with sizes and sha256                                                                                | same                                |
| php.ini effective diff                                                | `php -i` on old vs new, filtered                                                                                                | same                                |
| Cron, cert SAN and expiry, `.env` key names (never values)            | ssh                                                                                                                             | manual checklist                    |

Normalizing bodies: strip the now-playing widget, dates, CSRF/nonce tokens and any per-request markup before hashing. Pages that are live data (now playing, recently played) are compared structurally, not byte for byte.

## Phase 1: pre-merge (CI, no prod)

Already green on #921: composer install from lock, phpunit (304), phpcs, `php -l`, boot on 8.3.36 with 200s.

Add:

- `php -l` and a deprecation scan under `error_reporting=E_ALL` on 8.3 as a CI step. Fail on any new deprecation in routes the e2e suite hits.
- Existing Playwright e2e (`yarn test:e2e`) against the 8.3 image. Must pass in CI.
- Prod compose/Caddy config lint (`caddy validate`, `docker compose config`) once those land.

## Phase 2: new box, before cutover (by IP)

All automated by `bin/verify-migration.sh verify --target <new-ip>`, which sends `Host: www.ynotradio.net` and `--resolve` so TLS and vhost rules are exercised.

| Check           | Pass criteria                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route sweep     | Every baselined route returns the same status and redirect target as old prod; body hash matches or structural diff is empty                             |
| Redirect matrix | Identical to baseline                                                                                                                                    |
| PHP log         | After the sweep, php-fpm log has zero fatals, warnings or deprecations                                                                                   |
| TLS             | Cert chain valid, SAN has `ynotradio.net` and `www.ynotradio.net`, expiry beyond 30 days, HTTP-01 path `/.well-known/acme-challenge/` reachable over :80 |
| DB              | Row counts equal old prod's at the dump timestamp; checksums match on key tables; app user can SELECT and INSERT but not DROP                            |
| Files           | `images/` and `imgs/` inventory identical (count, size, sha256)                                                                                          |
| Env             | Same `.env` key set; `USE_POSTGRES_*` flag values equal old prod's                                                                                       |
| External deps   | Auth0 login round trip, Neon reads (schedule, concerts, deejays), Cloudinary images render, now-playing feed loads                                       |
| Write paths     | Contact form posts to a test inbox (small payload, under 8 KB); Top 11 vote and write-in on a throwaway account; MRM vote form                           |
| php.ini         | Intentional old settings carried over (`diff` of filtered `php -i`)                                                                                      |
| Security        | `session.upload_progress` and `file_uploads` off, `post_max_size` bounded, `php -v` is 8.3.36+, no PHP 7.x binary on the box                             |
| Reboot          | Reboot the box, rerun the sweep. php-fpm, web server and MySQL come back with no manual step (the Sept stale-socket incident)                            |
| Cron            | Cert renewal dry run (`lego renew --dry-run` or `caddy` equivalent), MySQL health job present and exit 0                                                 |
| Backups         | A dump restores into a scratch DB and row counts match                                                                                                   |

## Phase 3: cutover (static IP swap)

1. Announce a short window. Stop writers on old box (Top 11 voting etc. read-only if possible); take final `mysqldump`; restore on new box; rerun DB and files checks.
2. Detach static IP from old, attach to new.
3. Immediately run `bin/verify-migration.sh verify --target https://www.ynotradio.net` (no overrides) and the redirect matrix.
4. Watch for 15 minutes: php-fpm error log, web access log 5xx rate, MySQL connections.
5. Manual: load home, schedule, top11, concerts, on demand, deejays in a browser; log in via Auth0; submit the contact form to yourself.

Abort and move the IP back if: any 5xx on a baselined route, Auth0 or DB failure, or TLS error.

## Phase 4: after cutover

| When      | Check                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------ |
| +1 hour   | Error log clean, no 5xx, cron fired                                                                                      |
| +24 hours | Cert renewal job ran without error (check log), DB size grew as expected, backups ran                                    |
| +7 days   | Old box stopped but kept. Delete after a clean week and one confirmed backup restore                                     |
| Ongoing   | Scheduled `verify` run from CI or GitHub Actions against prod (route sweep plus TLS expiry and PHP version header check) |

## Automation

One script, `bin/verify-migration.sh`, plus a small Playwright spec for the browser-only paths.

- `capture` writes `tmp/baseline/` (routes, statuses, redirects, normalized hashes, DB counts, file inventory) from old prod.
- `verify --target <ip|url>` replays the baseline and exits non-zero on any diff.
- `db-counts`, `files`, `phpini` subcommands run on the box over ssh.
- `e2e/migration-smoke.spec.ts` covers Auth0 login, a Top 11 vote, and contact form against the target (`BASE_URL`).
- Scheduled GitHub Action runs `verify --target https://www.ynotradio.net` daily after migration.

## Manual only

- Browser visual check of home, schedule, top11 (compare to prod screenshots)
- Auth0 login with a real account
- Contact form email arrives
- Lightsail console: static IP attached, firewall allows 80/443/22 only, snapshots enabled
- Rollback rehearsal: move the IP back once before cutover day and confirm old prod serves
