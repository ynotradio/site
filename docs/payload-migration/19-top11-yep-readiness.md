# Chapter 19: Top 11 & Year End Poll — Cutover Readiness

[← Back to Index](./README.md)

**Status:** In progress · **Last Updated:** July 2026

---

Companion to [Chapter 18](./18-pages-readiness.md). Top 11 is the pressing
feature — a working vote flow is needed for Josh to react to and give feedback
on. Year End Poll can proceed mostly unsupervised since voting stays closed
until December.

## The one thing both features are missing

Neither has a **PHP read/write adapter connecting the legacy visitor-facing
page to Payload's Postgres tables.** All Payload work so far is collections,
admin UI, and (for Top 11) an importer — the live vote flow for both features
is still 100% legacy PHP/MySQL, same `top11.php`/`yearendpoll.php` pages as
always. The remaining work is exactly the shape of Pages' `CustomTextFactory.php`
→ `PostgresCustomText.php` swap, not a new frontend — there is no Next.js
guest-facing page anywhere in this repo to build; `app/` exists only to serve
the Payload admin panel and its REST API.

Confirmed by reading `src/top11.php` and `src/partials/_top11_save.php`
directly: the page and its form handler only ever call `$top11Model->` methods
(`getMessage`, `getAll`, `getStatus`, `getAllSongs`, `hasUserVotedThisWeek`,
`recordUserVote`, `addContestant`, `addVote`, `addWriteIn`) — no raw SQL, no
MySQL-specific assumptions. **This is a clean interface swap** — the PHP
adapter work below can scope to the adapter class alone, no page edits needed.

## Schema gap found in review, not yet in the codebase

**There is no field anywhere that models this week's nominee pool** — the
~57-song checklist voters pick 3 from. `Top11Contests.entries`
(`payload/src/collections/Top11Contests.ts:640`) is a different list: last
week's ranked results, capped at 11 rows with rank/movement metadata.
`importTop11.ts` reads the legacy nominee table (`top11songs`) and imports each
row as a canonical `Songs` doc — but discards pool membership once import
finishes; nothing records "these N Songs are votable this week." Checked all
three other in-flight Top11 branches (`preview/top11-operations`,
`tj-nicolaides--top11-review`, `tj-nicolaides--top11-votes-voterkey-field`) —
none add this field.

## At a glance

| Aspect                     | Top 11                                        | Year End Poll                                                      |
| -------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| Collections                | 5                                             | 4                                                                  |
| Lifecycle endpoints        | 7                                             | 0                                                                  |
| Nominee pool field         | Missing entirely                              | Exists (per-category `nominees`)                                   |
| Vote-to-nominee validation | Missing (blocked on field above)              | Partial (nominees validated on write, not checked at vote time)    |
| Vote tally                 | Live via `/stats`                             | Nothing computes it (`voteCount` exists but nothing increments it) |
| Postgres PHP adapter       | None (factory always returns `SqlTop11`)      | None (factory has no flag check at all)                            |
| Importer                   | Real, current-week only                       | None exists                                                        |
| Unit tests                 | Partial (Votes/WriteIns/WinnerDraws untested) | Fuller (all 4 collections + hooks)                                 |
| E2E                        | Legacy PHP only                               | Legacy PHP only                                                    |

## Top 11 — the pressing one

Backend is the most mature of anything in this migration — full lifecycle,
admin controls tab, winner-draw audit trail, a real (if narrow) legacy
importer. The gap is entirely "the PHP page has no way to read or write
Payload's Postgres tables yet."

1. **Add the nominee-pool field to `Top11Contests`.** Nothing today models
   "these ~57 songs are votable this week" — `entries` is a different, smaller
   field (last week's ranked chart, max 11 rows).
   - Add a `nominees` array field to `Top11Contests.ts`, alongside `entries`:
     `relationTo: 'songs'`, `hasMany: true`, no row cap (legacy pool runs ~57).
   - Write a migration adding the column, backfilling the current contest by
     **re-running `importTop11.ts`'s pool-import logic against legacy MySQL**
     — not derived from `Top11Votes`, which would only recover songs that
     received at least one vote, undercounting the true pool.
   - Update `importTop11.ts`: after `importSongPool` resolves
     `songIdByLegacyId`, write that full set onto the new contest's `nominees`
     field instead of discarding it.
   - Add a `Top11Contests.test.ts` case asserting `nominees` persists and
     round-trips through the importer.
   - This blocks both the vote-validation fix below and the PHP adapter —
     there's no query today that answers "what's on the ballot this week."

2. **Validate `Top11Votes.song` against the contest's `nominees`.**
   - Add a `beforeChange` hook rejecting a vote if `song` isn't in
     `contest.nominees` (mirrors `YearEndPollCategories.validateNominees` for
     consistency across features).
   - Add a **DB-level constraint** (trigger or FK-style check on
     `top11_votes.song_id` against the contest's nominee set) as the actual
     source of truth. Both the Payload hook and any PHP-side pre-check become
     fast, friendly rejections in front of it — if they ever drift apart, the
     failure mode is a worse error message, not bad data.
   - Add unit tests: valid nominee vote passes, non-nominee vote rejected,
     vote against a closed/archived contest still rejected.
   - Without this, a vote for a song not on this week's list is silently
     accepted today.

3. **Build `PostgresTop11.php`, the read/write adapter `top11.php` actually
   needs.**
   - Add `src/models/implementations/PostgresTop11.php`, implementing the same
     interface `SqlTop11.php` does today (confirmed complete list: `getMessage`,
     `getAll`, `getStatus`, `getAllSongs`, `hasUserVotedThisWeek`,
     `recordUserVote`, `addContestant`, `addVote`, `addWriteIn`).
   - Reads (`getMessage`, `getAll`, `getAllSongs`, `getStatus`) go
     direct-to-Postgres, same style as `PostgresCustomText.php`/
     `PostgresModernRockMadness.php`.
   - **Writes (`recordUserVote`, `addContestant`, `addVote`, `addWriteIn`) call
     Payload's REST API** rather than raw PDO inserts. This deliberately
     departs from `PostgresModernRockMadness.php`'s precedent — MRM's
     `recordVote()` writes directly via PDO and reimplements its own
     `hasVoted()` dedup check in PHP — because Top11's validation surface
     (nominee-pool check, `voterKey` dedup) is more involved, and centralizing
     it in Payload's hooks avoids a second, drift-prone copy of that logic.
   - Add `src/tests/Models/PostgresTop11Test.php`, mirroring
     `PostgresCustomTextTest.php`.
   - Manual QA gate before this PR merges: cast a real vote, submit a
     write-in, and enter as a contestant against a Netlify preview backed by a
     **fresh Neon dev branch cut from current master** — not the #799 preview
     branch, since #811's `voterKey` fix and #818's importer/migration changes
     landed after that branch was cut.
   - This is the actual unblocking step for Josh — no new frontend needed, and
     no `top11.php` edits needed either, since the page already only talks to
     the model interface.

4. **Wire `Top11Factory.php` to actually use the flag.** Today it checks
   `use_postgres_top11`, logs a warning, and unconditionally returns
   `SqlTop11` anyway — flipping the flag currently does nothing.
   - Once `PostgresTop11.php` exists, make the factory branch on the flag for
     real, same shape as `CustomTextFactory.php`.
   - Leave the flag `false` in prod until the nominee field, validation, and
     adapter are all verified against a Neon dev branch — same rollout
     discipline as the Pages cutover.

5. **Unit-test `Top11Votes`, `Top11WriteIns`, `Top11WinnerDraws`.** Only
   Contests and Contestants have dedicated tests today.
   - `Top11Votes.test.ts`: dedup via `voterKey`, rejection on closed contest,
     the new nominee-validation hook.
   - `Top11WriteIns.test.ts`: moderation-flag default, normalization used by
     the stats grouping.
   - `Top11WinnerDraws.test.ts`: prior-winner lookback exclusion at boundary
     values (0, N, more entries than history).
   - Vote dedup and winner-draw are the two places a silent bug becomes a
     fairness problem in front of Josh.

6. **Decide the historical-backfill question.** `importTop11.ts` only imports
   the single current week, idempotently, and hasn't been confirmed run
   against real prod data. If Josh only needs to see the live contest working,
   this can wait; if past-weeks history needs to show anywhere, it can't.

7. **Extend the e2e coverage for both adapters.** `e2e/top11.spec.ts` only
   exercises legacy `top11.php` and predates the Payload collections entirely.
   - Extend the existing spec (still targeting `top11.php` — the page itself
     doesn't change) to run once against `use_postgres_top11=false` and once
     against `=true`, asserting identical behavior: load contest, submit a
     valid vote, attempt an invalid (non-nominee) vote and assert rejection,
     submit a write-in.
   - Once the flag flips permanently and `SqlTop11` is retired, drop the
     flag-parameterized run and keep the single Postgres-path spec.

### This week's PR sequence

1. **PR 1** — `nominees` field + migration + importer wiring. Everything
   downstream reads this field — nothing else can start review until it
   merges.
2. **PR 2** — vote-to-nominee validation (Payload hook + DB constraint).
   Small, isolated, easy to review on its own — depends only on PR 1.
3. **PR 3** — `PostgresTop11.php` adapter, with the manual QA gate on a fresh
   Neon dev branch. The actual "Josh can see it working" milestone —
   reviewable independently of the flag wiring.
4. **PR 4** — flag wiring + e2e parity test. Flag stays `false` in prod after
   merge — flip is a separate, later, deliberate action, keeping "ship the
   code" and "cut prod traffic over" as two distinct, separately-approved
   steps.

Unit tests for `Top11WriteIns`/`Top11WinnerDraws` and the
historical-backfill-beyond-current-contest decision can land as fast-follow
PRs after PR 4 — neither blocks Josh seeing a working vote flow.

## Year End Poll — can proceed mostly unsupervised

Backend is thinner than Top 11's — no lifecycle endpoints, no tally mechanism,
no feature flag scaffolding at all — but the safety margin is real: nobody can
vote today regardless of what ships, so this can move at its own pace.

1. **Build the vote-tally mechanism.** `voteCount` exists on each nominee row
   but nothing increments it, and no endpoint counts `YearEndPollVotes` rows
   per nominee.
   - Add an `afterChange` hook on `YearEndPollVotes` that increments the
     matching nominee's `voteCount` on the parent `YearEndPollCategories` row
     — or compute on read via a `/stats`-style endpoint (matching Top11's
     pattern), which avoids drift if a vote is later deleted.
   - If keeping `voteCount`: add an `afterDelete` hook too, so retracted votes
     decrement correctly.
   - Add unit tests asserting the count is correct after create/delete
     sequences.
   - This blocks any results page, including the already-designed
     `YearEndPollResults` collection, currently hidden from admin nav for
     exactly this reason.

2. **Close the vote-to-nominee validation gap.** `rejectDuplicateVote`/
   `enforceMaxPicks` check dedup and pick caps but never confirm `nomineeId`
   is actually in the category's `nominees` array.
   - Add a check in the existing hook chain (`yearEndPollVoteHooks.ts`): fetch
     the category, verify `nomineeId` matches one of its `nominees` rows.
   - Extend `yearEndPollVoteHooks.test.ts` with an invalid-nominee-id case.
   - Lower urgency than Top 11's equivalent gap since voting is closed, but
     should land before December, not during it.

3. **Build `PostgresYearEndPoll.php`, the read/write adapter for
   `yearendpoll.php` and `yearendstaffpicks.php`.** Same pattern as Top 11's
   adapter — no new frontend, the legacy PHP pages stay and swap their data
   layer.
   - Implement against the same interface `SqlYearEndPoll.php` uses today:
     fetch the open `YearEndPolls` record, its `YearEndPollCategories` with
     `nominees`/`maxPicks`/voting windows, and write votes respecting the
     vote-to-nominee check from item 2.
   - Wire `yearendstaffpicks.php` against `YearEndPollResults`'s
     `StaffPicksBlock` — no Payload path exists today despite the collection
     being designed for it (Chapter 13).
   - Results display reads from `YearEndPollResults` blocks once populated
     (depends on item 1's tally being trustworthy first).
   - No time pressure until the poll opens later in the year — but "no time
     pressure" is also why this is the easiest item to let slip past a safe
     window.

4. **Write the legacy-to-Payload importer.** None exists. The
   `YEAR_END_POLL_*.md` docs under `src/db/migrations/` describe the old
   annual MySQL-refresh runbook (Google Sheets → CSV → MySQL), not a path into
   Payload.
   - Model it on `importTop11.ts`'s structure (same prod-write guardrails via
     `shared/payloadClient.ts`).
   - Decide scope: current year only (mirrors Top11's current-week-only
     precedent) vs. full historical backfill of past polls/categories/results.

5. **Wire a feature flag.** `YearEndPollFactory.php` has no `FeatureManager`
   check at all — further from cutover scaffolding than Top 11.
   - Add `use_postgres_yearendpoll` to `features.php`, hardcoded false
     initially, same pattern as `use_postgres_top11`.
   - Once `PostgresYearEndPoll.php` exists, make the factory branch on it for
     real.

6. **Unhide `YearEndPollResults` from admin nav** once the tally mechanism
   (item 1) lands. Currently hidden deliberately because there's nothing
   correct to show yet.

YEP's PR shape mirrors Top 11's four-PR sequence once its own
nominee-validation and tally gaps are closed — treat it as the same sequence,
run at a slower, unsupervised pace since voting stays closed until December.

## Decisions locked

| Question                  | Decision                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nominee-pool scope        | `nominees` added to the `Top11Contests` schema itself — every contest carries the field going forward. Backfilled by re-running `importTop11.ts` (or a variant) against legacy MySQL.                                                                                                |
| Write path in PHP adapter | Reads go direct-to-Postgres; writes call Payload's REST API. Confirmed departure from `PostgresModernRockMadness.php`'s precedent (direct PDO writes, dedup reimplemented in PHP) — chosen because Top11's validation surface is more involved than MRM's single `hasVoted()` check. |
| Validation drift          | A DB-level constraint is the real source of truth. Payload's hook and any PHP pre-check are fast, friendly rejections in front of it — drift becomes a UX papercut, not a data-integrity bug.                                                                                        |
| Branch strategy           | Separate PRs per step, not one stacked branch — this touches real vote data, so each step should be independently revertible.                                                                                                                                                        |
| Flag flip timing          | `use_postgres_top11` stays `false` in prod this week. Goal is code verified against a Neon dev branch / preview deploy for Josh to react to — the prod flip happens later, deployed separately from the code.                                                                        |
| Manual QA gate            | Before the adapter PR merges: cast a real vote, submit a write-in, and enter as a contestant against a Netlify preview backed by a fresh Neon dev branch cut from current master.                                                                                                    |

---

Compiled from PR #799, #811, #818, #819, commit 7e1e8d1c, and direct reads of
Top11\*/YearEndPoll\* collections, PHP factories, and e2e specs.
