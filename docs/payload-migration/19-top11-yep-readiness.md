# Chapter 19: Top 11 & Year End Poll — Cutover Overview

[← Back to Index](./README.md)

**Status:** Top 11 landed, Year End Poll not started · **Last Updated:** July 2026

---

Companion to [Chapter 18](./18-pages-readiness.md). Both features share the
same cutover shape as Pages: the legacy PHP page stays exactly as it is, and
its `*Factory.php` swaps a MySQL implementation for a new `Postgres*`
implementation behind a feature flag. Neither feature has (or needs) a new
Next.js frontend — `app/` in this repo exists only to serve the Payload admin
panel and its REST API; the guest-facing site is PHP throughout.

Detail lives in two dedicated chapters:

- **[Chapter 19a: Top 11](./19a-top11-readiness.md)** — the pressing one.
  Josh needs a working vote flow to react to. **PRs 1–4 are merged**;
  `PostgresTop11.php` exists and is flag-gated (`use_postgres_top11`, still
  `false` in prod). Current focus is weekly real-data re-imports for
  confidence-building, an image+link Lexical block gap, and cleaning up seed
  data from a Neon branch-targeting incident during QA.
- **[Chapter 19b: Year End Poll](./19b-yearendpoll-readiness.md)** — can
  proceed unsupervised since voting stays closed until December. Backend is
  thinner than Top 11's (no tally mechanism, no flag scaffolding at all) but
  the four-PR sequence Top 11 already proved is the template to follow.

## Why Top 11 went first

Top 11's flag/factory scaffolding was further along (wrong today, but
present) than YEP's (absent) — but Top 11's schema had a harder blocker
underneath that: no nominee-pool field, so there was nothing yet for a
Postgres adapter or a validation hook to point at. That had to land first;
the adapter, factory wiring, and tests sequenced after it. Once Top 11's
sequence was proven end-to-end (schema → validation → adapter → flag), Year
End Poll's four-PR shape mirrors it directly — see Chapter 19b's PR sequence.

## Shared decisions across both features

| Question            | Decision                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cutover shape       | Legacy page unchanged; `*Factory.php` branches on a feature flag between the `Sql*` and new `Postgres*` implementation of the same interface. No new frontend for either feature.                                                                |
| Write path          | PHP adapter reads go direct-to-Postgres; writes call Payload's REST API rather than raw PDO, so Payload's validation hooks (nominee checks, dedup) are the single source of truth instead of a second, drift-prone PHP copy.                     |
| Validation drift    | A DB-level constraint (trigger or FK-style check) is the real source of truth in every case. Payload's hook and any PHP pre-check are fast, friendly rejections in front of it.                                                                  |
| Branch strategy     | Separate PRs per step, not one stacked branch — both features touch real vote/contest data, so each step should be independently revertible.                                                                                                     |
| Flag flip timing    | Flags stay `false` in prod after their PR sequence merges. Code verified against a Neon dev branch; the prod traffic cutover is a separate, later, deliberately-approved action — never bundled with the code merge.                             |
| Manual QA gate      | Before an adapter PR merges: exercise the real write paths (vote, write-in/entry, contestant) against a Netlify preview backed by a fresh Neon dev branch cut from current master.                                                               |
| Neon branch hygiene | `neonctl connection-string` has returned the wrong branch's endpoint at least once (see Chapter 19a's postmortem) — always cross-check the returned host's `branch_id` via Neon's REST API before writing to a branch believed to be disposable. |

---

Compiled from PR #799, #811, #818, #819, #824–#827, commit 7e1e8d1c, and
direct reads of Top11*/YearEndPoll* collections, PHP factories, and e2e specs
· companion to the [Pages Migration Content Readiness Plan](./18-pages-readiness.md).
