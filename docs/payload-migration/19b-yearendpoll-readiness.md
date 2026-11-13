# Chapter 19b: Year End Poll — Cutover Readiness

[← Back to Index](./README.md) · [← Chapter 19: Top 11 & Year End Poll Overview](./19-top11-yep-readiness.md)

**Status:** Adapter built, flag off · **Last Updated:** November 2026 · Tracking: #929

Voting opens **Nov 30, 2026**.

## Done

| Item                         | Where                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Vote tally (`voteCount`)     | #833, `yearEndPollVoteHooks.ts`                                                                 |
| Vote-to-nominee validation   | `rejectUnknownNominee` in `yearEndPollVoteHooks.ts`; PHP adapter checks the same                |
| Write-ins, prize entries     | `YearEndPollWriteIns`, `YearEndPollContestants` collections                                     |
| Page copy and window in data | `introHtml`, `closedHtml`, `votingOpensAt/ClosesAt` on `YearEndPolls`                           |
| Prize-entry rule in data     | `requiredForContest` on `YearEndPollCategories`                                                 |
| Bulk nominee entry           | `bulkNominees` paste box on `YearEndPollCategories` (one per line, dupes skipped)               |
| PHP adapter                  | `src/models/implementations/PostgresYearEndPoll.php`, page in `_year_end_poll_payload_page.php` |
| Flag                         | `use_postgres_yearendpoll` in `src/config/features.php`, default `false`                        |

Voters log in with Auth0 (same as Top 11); `user_id` replaces legacy IP dedup.
`/cp` YEP screens stay on MySQL (FeatureManager forces it) until #933 removes them.

## Remaining before Nov 30

- [ ] Run migration `20261113_000000_year_end_poll_cutover_schema` in prod (Netlify build)
- [ ] Add `https://www.ynotradio.net/yearendpoll.php` to Auth0 Allowed Callback URLs
- [ ] Josh creates the 2026 poll + categories in Payload, pastes nominees
- [ ] QA on prod with an `FF=use_postgres_yearendpoll` cookie, then flip the flag
- [ ] `yearendstaffpicks.php` → `YearEndPollResults` staff-picks block (still MySQL)
- [ ] Sorted results view for tabulating (nominee `voteCount` is visible per category today)

## Decisions

| Question         | Decision                                                                         |
| ---------------- | -------------------------------------------------------------------------------- |
| Voter identity   | Auth0 login, matching Top 11 and the `YearEndPollVotes.userId` design            |
| Tally            | Denormalized `voteCount`, incremented in the same transaction as the vote insert |
| Historical scope | 2026 only. Past years stay as custom pages (`yearendpoll2025`, etc.)             |
