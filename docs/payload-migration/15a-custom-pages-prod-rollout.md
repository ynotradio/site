# Custom pages: production rollout

Companion to [15-custom-text-strategy.md](./15-custom-text-strategy.md). Moves the 35 active `custom_texts` from MySQL to Payload `pages` without changing what visitors see. Production keeps reading MySQL until the last step.

## State checked 2026-10-22 (read-only)

| Check                                                        | Result                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Prod Neon host                                               | `ep-winter-lab-ah4kk1tw` (prod). Queried with `default_transaction_read_only=on` |
| `pages` rows                                                 | 0 (nothing to overwrite)                                                         |
| New columns (`content_type`, `content_html`, `center_title`) | absent; migration `20260919_000000_add_pages_content_type` pending               |
| `payload_migrations`                                         | 29 applied through `20260925_010000`, plus the `dev` marker row                  |
| `media` rows                                                 | 1,410                                                                            |
| Live PHP box `USE_POSTGRES_CUSTOMTEXT`                       | `false`; `CLOUDINARY_CLOUD_NAME` set                                             |
| Active `custom_texts`                                        | 35                                                                               |

Local parity: all 35 pages plus `/donate`, `/shows`, `/rodney`, `/y100rocks` render identically from MySQL and Postgres (content region, ignoring the `alt` attribute added to banner images).

## Order matters

1. **Merge #894.** `netlify.toml` runs `yes | yarn payload:migrate` on every build, so this migrates prod Neon. The migration only adds nullable columns and an enum. The old PHP code ignores them.
2. **Deploy the PHP change to the legacy box after the migration.** The new query selects `pages.center_title` and joins `media`; it fails on prod Neon if the columns do not exist yet. With the flag off it does not run.
3. **Rehearse the import on a Neon branch from prod** (below). Do not run it on prod first.
4. **Import into prod Neon.** Nothing changes for visitors; the flag is still off.
5. **Cut over one permalink at a time**, then flip the global flag last.

## Rehearsal on a Neon branch

1. Create the branch from prod. Do not trust `neonctl connection-string`: confirm the endpoint's `branch_id` with `GET /projects/{id}/endpoints` before any write, then do one trivial write and confirm it is absent on prod.
2. Run the migration, then the import. Header images upload to the real Cloudinary account (about 7 distinct images):

   ```sh
   NEON_DEV_DATABASE_URL=<verified branch url> \
   IMPORT_DB_HOST=127.0.0.1 IMPORT_DB_PORT=<mysql port with a fresh prod custom_texts dump> \
   yarn tsx --import ./bin/preload-nextenv-fix.mjs bin/migrations/importCustomTexts.ts --env dev --raw-html
   ```

3. Point a local PHP at the branch with `USE_POSTGRES_CUSTOMTEXT=true`, capture every permalink with MySQL and with Postgres, and diff the content region.
4. Review the generated titles (`Top 225 of 2025`, `Year End Poll 2025`, ...) and the banner images in the admin.

## Import into prod

`YES_I_MEAN_PROD=true` is required. The import is idempotent by `legacy_id` (reruns update in place).

```sh
YES_I_MEAN_PROD=true yarn tsx --import ./bin/preload-nextenv-fix.mjs bin/migrations/importCustomTexts.ts --env prod --raw-html
```

Expect 35 imported, 0 failed, and `pages` count 35 with `content_type = html`.

## Per-page cutover

Set `USE_POSTGRES_CUSTOMTEXT_PERMALINKS` in the PHP box's `.env` (comma-separated). After each batch, diff the live page against the MySQL render.

1. `t-shirts`
2. `donate` (4 forms), `shows`, `rodney-anonymous`, `y100-rocks`
3. Embed-heavy pages: `words-with-nerds`, `quarantine-takeovers`, `y100:-20-years-gone`
4. Banner archives: `top220of2020`..`top225of2025`, `yearendpoll2020`..`yearendpoll2025`, `future-friday`, `modern-rock-madness`
5. The rest, then set `USE_POSTGRES_CUSTOMTEXT=true` and clear the allowlist.

## Rollback

- Per page or batch: remove the permalinks from the env var. Takes effect on the next request; MySQL `custom_texts` is untouched.
- Schema: `payload:migrate:down` for `20260919_000000_add_pages_content_type` drops the new columns. Only do this with no `pages` rows depending on them.

## Editors

The legacy control panel edits MySQL only. Once a page is served from Postgres, its edits happen in Payload; anything saved in the control panel afterwards is ignored. Freeze control panel edits during the cutover and tell editors where to edit.

## Not covered

- Year End Poll and Staff Picks content that is not a custom page (`yearendstaffpicks.php` and the year-end tables).
- Deleting the MySQL `custom_texts` table and the control panel screens. Keep both until the global flag has been on for a week.
