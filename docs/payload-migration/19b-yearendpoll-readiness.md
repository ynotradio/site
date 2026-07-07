# Chapter 19b: Year End Poll — Cutover Readiness

[← Back to Index](./README.md) · [← Chapter 19: Top 11 & Year End Poll Overview](./19-top11-yep-readiness.md)

**Status:** Not started — can proceed unsupervised · **Last Updated:** July 2026

---

Year End Poll can proceed mostly unsupervised since voting stays closed until
December. See [Chapter 19a](./19a-top11-readiness.md) for Top 11, which has
landed its equivalent four-PR sequence and is the reference shape for this
one.

## Backend maturity

Backend is thinner than Top 11's — no lifecycle endpoints, no tally
mechanism, no feature flag scaffolding at all — but the safety margin is
real: nobody can vote today regardless of what ships, so this can move at its
own pace without a live audience.

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

## PR sequence

YEP's PR shape mirrors Top 11's landed four-PR sequence (see [Chapter
19a](./19a-top11-readiness.md#backend-maturity)) once its own
nominee-validation and tally gaps are closed:

1. **PR 1** — vote-tally mechanism (item 1). Nothing downstream can show
   correct numbers until this exists.
2. **PR 2** — vote-to-nominee validation (item 2). Small, isolated, low
   urgency but should land before December.
3. **PR 3** — `PostgresYearEndPoll.php` adapter (item 3), with the same
   manual-QA-on-a-Neon-dev-branch gate Top 11 used.
4. **PR 4** — flag wiring (item 5) + unhide results nav (item 6). Flag stays
   `false` in prod after merge — flip is a separate, later, deliberate
   action.

Item 4 (the legacy-to-Payload importer) can land in parallel with PR 1–2,
since it doesn't depend on the tally or validation work.

Run at a slower, unsupervised pace than Top 11 since voting stays closed
until December — but "no time pressure" is also why this is the easiest
feature to let slip past a safe window. Treat the December voting-open date
as the real deadline for PR 1–4, not a suggestion.

## Decisions locked

| Question         | Decision                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PR shape         | Mirrors Top 11's landed four-PR sequence exactly — same adapter pattern, same flag-stays-false-after-merge discipline, same Neon-dev-branch manual QA gate.                                            |
| Tally mechanism  | Compute-on-read via a `/stats`-style endpoint (matching Top11's pattern) is preferred over a denormalized `voteCount` counter, to avoid delete-drift — final choice deferred to PR 1's implementation. |
| Historical scope | Current year only mirrors Top11's current-week-only precedent; full backfill of past polls/categories/results is a separate decision, not blocking PR 1–4.                                             |
| Urgency          | Lower than Top 11's — voting stays closed until December — but PR 1–4 should land well before that date, not during crunch.                                                                            |

---

Compiled from PR #799, #811, #818, #819, commit 7e1e8d1c, and direct reads of
YearEndPoll* collections, PHP factories, and e2e specs · see [Chapter
19a](./19a-top11-readiness.md) for Top 11, the sibling feature on the same
cutover pattern.
