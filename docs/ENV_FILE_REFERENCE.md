# Environment File Reference

Quick reference for which `.env*` file is used where, and the footguns that
have actually bitten people (including agents) in this repo. For the history
of *how* we got to this file layout, see
[ENVIRONMENT_FILE_CHANGES.md](./ENVIRONMENT_FILE_CHANGES.md).

## Which file is which

| File                       | Used by                                  | Committed? |
| -------------------------- | ----------------------------------------- | ---------- |
| `.env`                     | Production Postgres/Neon vars, read by `payload.config.ts` **only when `NODE_ENV=production`** | No (gitignored) |
| `.env.local`               | Local development — `yarn dev`, `yarn payload:dev`, most `bin/*.ts` scripts | No (gitignored) |
| `.env.preview`             | Netlify preview deploys (Next.js/Payload) | No (gitignored) |
| `.env.production`          | Netlify production deploys (Next.js/Payload) | No (gitignored) |
| `.env.php`                 | Deployed to the production PHP server as `~/htdocs/.env` (legacy site) | No (gitignored) |
| `.env.production.mysql`    | Import scripts only (legacy MySQL access) | No (gitignored) |
| `.env.example` (+ variants)| Templates showing required keys, no real values | Yes |

**Rule of thumb:** if you're running something with `yarn dev`, `yarn tsx ...`,
or any `bin/*.ts` script from your own terminal, you're reading `.env.local`.
`.env` is the odd one out — see below.

## The `.env` footgun: it only loads under `NODE_ENV=production`

`payload.config.ts` does:

```ts
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
```

This loads **exactly one** of `.env` / `.env.local` — never both. Since
`NEON_DEV_DATABASE_URL` and `NEON_PROD_DATABASE_URL` live only in `.env`, any
script run the normal way (`NODE_ENV` unset or `development`) will **not** see
them, even though `.env` exists right next to `.env.local` in the repo root.

This has caused real confusion:

- `bin/migrations/shared/payloadClient.ts`'s `getPayloadClient(target)` calls
  its own `dotenv.config({ path: '.env.local', override: true })` — so scripts
  using it (`importCustomTexts.ts`, etc.) need `NEON_DEV_DATABASE_URL` /
  `NEON_PROD_DATABASE_URL` explicitly exported into the shell first, e.g.:

  ```bash
  export NEON_DEV_DATABASE_URL=$(grep '^NEON_DEV_DATABASE_URL' .env | cut -d= -f2-)
  yarn tsx --import ./bin/preload-nextenv-fix.mjs bin/migrations/importCustomTexts.ts --env dev
  ```

- Pointing local dev at Neon (instead of local Postgres) means editing
  `.env.local`'s `DATABASE_URI` directly — copying the connection string out
  of `.env` (or `NEON_DEV_DATABASE_URL`) into `.env.local`'s `DATABASE_URI`
  key. `.env.local` needs `sslmode=require` in the connection string; Neon
  rejects unencrypted connections, unlike local Docker Postgres.

## Prod-write safety

Scripts that go through `getPayloadClient()` (`bin/migrations/shared/payloadClient.ts`)
refuse to connect to `prod-neon`/`prod` targets unless `YES_I_MEAN_PROD=true`
is set — see `assertProdWriteAllowed`. Scripts that connect directly via
`getPayloadHMR`/`getPayload` (e.g. `bin/seed-top11.ts`, `bin/seed-mrm.ts`) use
`assertNotConnectedToProd()`, which compares the active `DATABASE_URI` against
`NEON_PROD_DATABASE_URL` and refuses the same way. **Don't bypass this by
setting `YES_I_MEAN_PROD=true` unless you actually mean to write to
production** — it exists because an earlier agent session accidentally seeded
demo data directly onto prod when `DATABASE_URI` silently resolved there.

## Dev-mode schema push vs. `migrate`

Booting Payload outside of `NODE_ENV=production` (i.e. almost any local
script or `yarn dev`) triggers the Postgres adapter's dev-mode schema
**push** — it diffs the live database against what your collection configs
declare and offers to reconcile differences, including dropping columns it
doesn't recognize. This is separate from running actual migrations
(`yarn payload:migrate`).

Set `PAYLOAD_MIGRATING=true` to suppress the auto-push for one-shot scripts
that only need to read/write data, not sync schema (see
`@payloadcms/db-postgres`'s `connect.js`: push is skipped when
`NODE_ENV === 'production' || PAYLOAD_MIGRATING === 'true' || this.push === false`).

This does **not** suppress the separate confirmation prompt inside
`payload migrate` itself ("It looks like you've run Payload in dev mode...
data loss will occur, proceed?") — that prompt fires whenever a `'dev'` batch
marker exists in `payload_migrations` (left behind by any prior push) and is
interactive with no non-interactive bypass flag. If you hit it on a database
you can safely reset (e.g. a disposable dev branch), the fastest fix is
dropping and recreating the schema, then running `migrate` clean, rather than
trying to script an answer to the prompt.

## If you're an agent working in this repo

- Before assuming a script "isn't picking up the right database," check
  whether it needs `NEON_DEV_DATABASE_URL`/`NEON_PROD_DATABASE_URL` exported
  manually — most scripts only read `.env.local`.
- Before running any seed/import script, confirm which `DATABASE_URI` is
  actually active. `getDatabaseUri()` in `payloadClient.ts` documents the
  resolution order per target; when in doubt, print
  `process.env.DATABASE_URI` (redacted) before connecting.
- Treat `.env` and `.env.production*` files as containing real production
  credentials — never echo their contents unredacted into terminal output
  or commit messages.
