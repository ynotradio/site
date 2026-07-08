# Chapter 19a: Top 11 — Cutover Readiness

[← Back to Index](./README.md) · [← Chapter 19: Top 11 & Year End Poll Overview](./19-top11-yep-readiness.md)

**Status:** PR 1–4 landed · **Last Updated:** July 2026

---

## Status update: PRs 1–4 landed

PRs #824–#827 (the four-PR sequence below) are merged. `nominees` field,
vote-to-nominee validation, `PostgresTop11.php`, and the real
`Top11Factory.php` flag wiring all exist and are tested. `use_postgres_top11`
stays `false` in prod, as planned — code is verified, the traffic cutover is
still a separate, later action.

A side-by-side parity pass against `ynotradio.net/top11` (real prod data,
imported via `importTop11.ts --from prod-mysql`, rendered through the
Postgres adapter on a Neon dev branch) surfaced and fixed eight real bugs
along the way, all covered by new tests:

- Vote form's `action` attribute dropped the `?ff=` query string, so a vote
  cast from a Postgres-rendered page silently fell back to writing MySQL.
- `PostgresTop11::addWriteIn()` never recorded `voter_email`.
- The HTML→Lexical converter dropped an `<iframe>` embed, an artist photo,
  and body text/link/paragraph structure whenever they sat inside legacy
  markup's malformed or unclosed tags (`<center>` without a closing tag is
  common in `top11message`'s real content).
- The ranked-chart heading inserted a weekday legacy MySQL never had
  (`"Thursday, July 2, 2026"` vs. `"July 2, 2026"`).
- An image floated via the wrapping `<a style="float: right">` (not the
  `<img>` itself) lost its position, then a legacy CSS rule
  (`.top11-message img`) outranked the new alignment class by specificity
  and forced it left regardless.
- Legacy `<img width/height>` attributes were captured during conversion but
  never carried through to the rendered tag, so images lost their intended
  size.

**What's next**, roughly in the order below:

1. A **Lexical block that combines an image upload with a hyperlink** in one
   unit — the artist-photo-linked-to-tour-page pattern shows up constantly in
   `top11message`, and today it only survives as a plain image (the link is
   dropped) because Payload's built-in upload node has no link-wrapper field.
2. Keep **re-running `importTop11.ts --from prod-mysql` against the current
   contest** on a Neon dev/preview branch each week, rather than flipping the
   flag, until the adapter's output is trusted enough to cut over for real.
3. **Clean up the seed/test Top 11 data that landed on production** — see
   [Postmortem: seed data landed on prod](#postmortem-seed-data-landed-on-prod)
   below.
4. Prototype **cloning this week's contest into next week's** — a real
   content-ops need (Josh currently re-enters everything by hand every
   Thursday) that also doubles as a clean test of the adapter's write path
   before the flag ever flips.

### Postmortem: seed data landed on prod

While cutting a disposable Neon branch for QA (import + screenshot parity
work), `neonctl connection-string --branch-id <disposable-branch-id>`
returned **production's real endpoint**, not the disposable branch's actual
endpoint — confirmed after the fact via Neon's REST API
(`GET /projects/{id}/endpoints`), which showed the disposable branch had its
own distinct, genuinely-isolated endpoint all along. The CLI simply resolved
and returned the wrong host, with no error or warning. Every write made
believing it targeted the disposable branch — QA vote/write-in test rows, a
prod-MySQL import of the current contest (a real week, 125 real votes), and
a real Cloudinary photo upload — landed on production instead.

The data itself turned out to be legitimate (a real current contest week,
imported from real prod MySQL) and was left in place rather than reverted.
The cleanup item above is about the leftover **synthetic QA rows**
(`qa-test%`-style emails, demo vote/write-in fixtures) mixed in alongside it,
not the real contest data.

**Fix going forward:** never trust `neonctl connection-string` alone before a
write. Cross-check the returned host's `branch_id` via the REST API, or make
one trivial write and confirm it does _not_ appear on the branch you believe
is untouched, before running real import/seed work.

---

## The one thing this feature was missing

Neither Top 11 nor Year End Poll had a **PHP read/write adapter connecting
the legacy visitor-facing page to Payload's Postgres tables.** All Payload
work so far was collections, admin UI, and (for Top 11) an importer — the
live vote flow was still 100% legacy PHP/MySQL, same `top11.php` page as
always. The work below is exactly the shape of Pages' `CustomTextFactory.php`
→ `PostgresCustomText.php` swap, not a new frontend — there is no Next.js
guest-facing page anywhere in this repo to build; `app/` exists only to serve
the Payload admin panel and its REST API.

Confirmed by reading `src/top11.php` and `src/partials/_top11_save.php`
directly: the page and its form handler only ever call `$top11Model->` methods
(`getMessage`, `getAll`, `getStatus`, `getAllSongs`, `hasUserVotedThisWeek`,
`recordUserVote`, `addContestant`, `addVote`, `addWriteIn`) — no raw SQL, no
MySQL-specific assumptions. **This was a clean interface swap.**

## Schema gap found in review, now closed

**There was no field anywhere that modeled this week's nominee pool** — the
~57-song checklist voters pick 3 from. `Top11Contests.entries`
(`payload/src/collections/Top11Contests.ts:640`) is a different list: last
week's ranked results, capped at 11 rows with rank/movement metadata.
`importTop11.ts` reads the legacy nominee table (`top11songs`) and imports each
row as a canonical `Songs` doc — but was discarding pool membership once
import finished; nothing recorded "these N Songs are votable this week."
This shipped as PR 1 below (`nominees` field on `Top11Contests`).

## Backend maturity

Backend is the most mature of anything in this migration — full lifecycle,
admin controls tab, winner-draw audit trail, a real (if narrow) legacy
importer, and (as of PRs #824–#827) a working Postgres read/write adapter.

1. **`nominees` field on `Top11Contests`.** `relationTo: 'songs'`, `hasMany:
true`, no row cap (legacy pool runs ~57). Backfilled by re-running
   `importTop11.ts`'s pool-import logic against legacy MySQL — not derived
   from `Top11Votes`, which would only recover songs that received at least
   one vote, undercounting the true pool. — **Shipped in #824.**

2. **Vote-to-nominee validation.** A `beforeChange` hook on `Top11Votes`
   rejects a vote if `song` isn't in `contest.nominees` (mirrors
   `YearEndPollCategories.validateNominees` for consistency across
   features), backed by a **DB-level constraint** (trigger on
   `top11_votes.song_id` against the contest's nominee set) as the actual
   source of truth. The Payload hook and any PHP-side pre-check are fast,
   friendly rejections in front of it — if they ever drift apart, the
   failure mode is a worse error message, not bad data. — **Shipped in
   #825.**

3. **`PostgresTop11.php`, the read/write adapter `top11.php` needed.**
   Implements the same interface `SqlTop11.php` does (`getMessage`,
   `getAll`, `getStatus`, `getAllSongs`, `hasUserVotedThisWeek`,
   `recordUserVote`, `addContestant`, `addVote`, `addWriteIn`). Reads go
   direct-to-Postgres, same style as `PostgresCustomText.php`/
   `PostgresModernRockMadness.php`. **Writes call Payload's REST API**
   rather than raw PDO inserts — a deliberate departure from
   `PostgresModernRockMadness.php`'s precedent (MRM's `recordVote()` writes
   directly via PDO and reimplements its own `hasVoted()` dedup check in
   PHP), because Top11's validation surface (nominee-pool check, `voterKey`
   dedup) is more involved, and centralizing it in Payload's hooks avoids a
   second, drift-prone copy of that logic. Manual QA gate (cast a real vote,
   submit a write-in, enter as a contestant against a Neon dev branch) ran
   before merge. — **Shipped in #826**, plus the eight parity-testing fixes
   listed in the status update above.

4. **`Top11Factory.php` wired to the flag for real.** Previously checked
   `use_postgres_top11`, logged a warning, and unconditionally returned
   `SqlTop11` anyway — flipping the flag did nothing. Now branches for real,
   same shape as `CustomTextFactory.php`. Flag stays `false` in prod until
   the "re-import weekly" step in "What's next" above builds enough
   confidence to flip it. — **Shipped in #827**, alongside the
   `(contest, voter, song)` vote-dedup scoping fix.

## Open fast-follow items

5. **Unit-test `Top11WriteIns`, `Top11WinnerDraws`.** Only Contests,
   Contestants, and Votes have dedicated tests today.
   - `Top11WriteIns.test.ts`: moderation-flag default, normalization used by
     the stats grouping.
   - `Top11WinnerDraws.test.ts`: prior-winner lookback exclusion at boundary
     values (0, N, more entries than history).
   - Vote dedup and winner-draw are the two places a silent bug becomes a
     fairness problem in front of Josh.

6. **Decide the historical-backfill question.** `importTop11.ts` only imports
   the single current week, idempotently. If Josh only needs to see the live
   contest working, this can wait; if past-weeks history needs to show
   anywhere, it can't.

7. **Extend the e2e coverage for both adapters.** `e2e/top11.spec.ts` only
   exercises legacy `top11.php` and predates the Payload collections
   entirely.
   - Extend the existing spec (still targeting `top11.php` — the page itself
     doesn't change) to run once against `use_postgres_top11=false` and once
     against `=true`, asserting identical behavior: load contest, submit a
     valid vote, attempt an invalid (non-nominee) vote and assert rejection,
     submit a write-in.
   - Once the flag flips permanently and `SqlTop11` is retired, drop the
     flag-parameterized run and keep the single Postgres-path spec.

8. **The image+link Lexical block** and **weekly re-import cadence** from
   "What's next" above are both open, ongoing items — not one-time PRs.

9. **Contest Controls tab's `/stats` scoreboard only shows this week's chart
   `entries` (≤11 songs), not the full `nominees` pool (~56 songs).**
   Verified during preview-branch parity testing: `/stats`
   (`Top11Contests.ts`'s handler) correctly aggregates `voteCounts` across
   _every_ nominee's votes, but `rankedSongs` — what the tab actually
   renders — is built by mapping over `contest.entries` only, so any
   nominee not already on last week's frozen top-11 chart has its vote
   count computed but never displayed anywhere in the admin UI. A song like
   this week's current leader can be sitting at zero visibility if it
   wasn't in last week's top 11. The underlying vote data is correct — this
   is a display gap, not a data-integrity bug — but it means nobody
   (including Josh) can see this week's actual leaderboard while voting is
   open, only after it becomes next week's `entries` snapshot. Fix: build
   `rankedSongs` from `contest.nominees` instead of (or in addition to)
   `contest.entries`.

## Decisions locked

| Question                  | Decision                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nominee-pool scope        | `nominees` added to the `Top11Contests` schema itself — every contest carries the field going forward. Backfilled by re-running `importTop11.ts` (or a variant) against legacy MySQL.                                                                                                |
| Write path in PHP adapter | Reads go direct-to-Postgres; writes call Payload's REST API. Confirmed departure from `PostgresModernRockMadness.php`'s precedent (direct PDO writes, dedup reimplemented in PHP) — chosen because Top11's validation surface is more involved than MRM's single `hasVoted()` check. |
| Validation drift          | A DB-level constraint is the real source of truth. Payload's hook and any PHP pre-check are fast, friendly rejections in front of it — drift becomes a UX papercut, not a data-integrity bug.                                                                                        |
| Branch strategy           | Separate PRs per step, not one stacked branch — this touches real vote data, so each step should be independently revertible.                                                                                                                                                        |
| Flag flip timing          | `use_postgres_top11` stays `false` in prod. Weekly re-imports against real prod MySQL (see "What's next" above) are the current substitute for flipping the flag — code verified, traffic cutover still a separate, later action.                                                    |
| Manual QA gate            | Before the adapter PR merges: cast a real vote, submit a write-in, and enter as a contestant against a Netlify preview backed by a fresh Neon dev branch cut from current master.                                                                                                    |
| Neon branch verification  | After the prod-data incident above: never trust `neonctl connection-string` alone. Cross-check the returned host's `branch_id` via the REST API before any write.                                                                                                                    |

---

Compiled from PR #799, #811, #818, #819, #824–#827, commit 7e1e8d1c, and
direct reads of Top11* collections, PHP factories, and e2e specs · see
[Chapter 19b](./19b-yearendpoll-readiness.md) for Year End Poll, the sibling
feature on the same cutover pattern.
