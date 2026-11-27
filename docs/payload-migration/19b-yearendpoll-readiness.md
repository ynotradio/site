# Chapter 19b: Year End Poll — Cutover Readiness

[← Back to Index](./README.md) · [← Chapter 19: Top 11 & Year End Poll Overview](./19-top11-yep-readiness.md)

**Status:** `yearendpoll.php` reads Payload · **Last Updated:** November 2026 · Tracking: #929

Voting opens **Nov 30, 2026**.

## Done

| Item                         | Where                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Vote tally (`voteCount`)     | #833, `yearEndPollVoteHooks.ts`                                                         |
| Vote-to-nominee validation   | `rejectUnknownNominee` in `yearEndPollVoteHooks.ts`; PHP adapter checks the same        |
| Write-ins, prize entries     | `YearEndPollWriteIns`, `YearEndPollContestants` collections                             |
| Page copy and window in data | `introHtml`, `closedHtml`, `votingOpensAt/ClosesAt` on `YearEndPolls`                   |
| Prize-entry rule in data     | `requiredForContest` on `YearEndPollCategories`                                         |
| Bulk nominee entry           | `bulkNominees` paste box on `YearEndPollCategories` (one per line, dupes skipped)       |
| PHP adapter                  | `src/models/implementations/PostgresYearEndPoll.php`, used by `yearendpoll.php`         |
| Staff picks                  | `YearEndStaffPicks` collection, `PostgresYearEndStaffPick.php`, `yearendstaffpicks.php` |
| Staff picks importer         | `yarn import:staff-picks --year 2025` (parses legacy HTML; re-runnable)                 |

No flag: the poll wasn't live, so `yearendpoll.php` switched outright. Voters
log in with Auth0 (same as Top 11), and `user_id` replaces legacy IP dedup.
`/cp` YEP screens pass a MySQL connection and keep reading past polls from
MySQL until #933 removes them.

## Remaining before Nov 30

- [ ] Run migrations `20261113_000000_year_end_poll_cutover_schema` and `20261113_010000_year_end_staff_picks` in prod (Netlify build)
- [ ] `yarn import:staff-picks --year 2025 --from prod-mysql --to prod-neon` (27 picks; 2 commented-out picks skipped)
- [ ] Add `https://www.ynotradio.net/yearendpoll.php` to Auth0 Allowed Callback URLs
- [ ] Josh creates the 2026 poll + categories in Payload, pastes nominees
- [ ] QA on prod with a test vote, then delete it in Payload
- [ ] Sorted results view for tabulating (nominee `voteCount` is visible per category today)

## Decisions

| Question         | Decision                                                                         |
| ---------------- | -------------------------------------------------------------------------------- |
| Voter identity   | Auth0 login, matching Top 11 and the `YearEndPollVotes.userId` design            |
| Tally            | Denormalized `voteCount`, incremented in the same transaction as the vote insert |
| Historical scope | 2026 only. Past years stay as custom pages (`yearendpoll2025`, etc.)             |
