# Editor-experience observability

**Status:** shipped (first slice).
**Goal:** understand how often editors hit errors or unexpected results (empty
searches) in the admin, so the team can get ahead of pain points instead of
waiting for someone to report them.

## What it captures

A new admin-only collection, **Editor Events** (`editor-events`), records two
kinds of events, written automatically by server-side hooks:

| Type           | When it fires                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `error`        | Any error surfaced to an authenticated editor — a failed save, an "invalid slug", a permission error. |
| `empty-search` | An admin list search/filter on an editor-facing collection that returns **zero** results.             |

Each row stores the collection, operation, message, failing field path (for
validation errors), the search query (for empty searches), the editor's email,
the admin URL they were on, user agent, and a structured `details` blob.

## How it works

- **Errors** — a root `afterError` hook (`recordEditorError` in
  `payload/src/collections/hooks/observability.ts`), registered in
  `payload.config.ts`. Scoped to requests with a logged-in user, so it captures
  the editor experience rather than anonymous public-API traffic.
- **Empty searches** — a collection `afterOperation` hook (`recordEmptySearch`)
  attached to the editor-facing content collections via `withEmptySearchLogging`
  in `payload.config.ts`. It only does work on the rare empty-result path
  (a filtered find returning `totalDocs === 0`), so normal reads are unaffected.
- **Best-effort by design** — every write runs in its own transaction (it does
  not join the originating request's) and swallows failures. Observability can
  never break or slow down the action an editor is taking.
- **No external service** — events live in the same Postgres database and are
  read through the admin the team already uses.

## How to use it

- **Dashboard** — admins see an **Editor Health · last 7 days** panel on the
  admin dashboard (`EditorHealthPanel`), showing counts of errors and empty
  searches and the most-affected areas, with a link to the full log. It renders
  only for admins.
- **Full log** — Music/System group → **Editor Events**. Filter by `type`,
  `collectionSlug`, or `userEmail`; sort by newest. Read-only.

## Access & privacy

- Read and delete: **admin only**. The collection is hidden from editors/DJs so
  it never alarms or distracts them.
- Create/update: closed to everyone — rows are written only by the server hooks
  (via `overrideAccess`), never by hand.

## Extending it (next steps)

- **Tune empty-search signal.** It currently logs any filtered find that returns
  nothing; if relationship-dropdown lookups add noise, narrow it to the admin
  list view (e.g. by inspecting the referer or the presence of a `like` search).
- **More event types.** Save conflicts, slow operations, repeated retries.
- **Alerting / retention.** A scheduled job (alongside the existing `bin/`
  scripts) could email a weekly digest and prune events older than N days.
- **Sentry.** The `SENTRY_DSN` placeholder in `.env.example` is still unwired.
  If deep stack traces and client-side JS error capture become important, add
  Sentry alongside this log — this collection stays the product/editor-experience
  view; Sentry would be the developer diagnostics view.
