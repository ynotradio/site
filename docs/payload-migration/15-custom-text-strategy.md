# Chapter 15: Custom Text Strategy

[← Back to Index](./README.md)

**Status:** Proposed (Plan 3 adopted; custom text targets a dedicated `Pages`
collection) · **Last Updated:** July 2026

---

## Context

PR #780 cut stories and custom text over to Postgres/Payload unconditionally and
deleted the legacy CP edit screens. The Postgres/Payload front-end output for
**custom text** is not yet acceptable, so PR #786 reintroduced a
`use_postgres_customtext` feature flag (default MySQL) and restored the legacy CP
edit screens as a safety net. See `src/models/CustomTextFactory.php` and
`src/config/features.php`.

This chapter records the assessment of what the ~35 active custom-text pages
actually contain and the strategy for giving editors a content-management
experience that fits — rather than re-hosting the same opaque HTML blob in a new
database.

> This is **not** a MySQL-vs-Postgres question. Both backends store the same
> single `longtext` HTML blob. Porting that blob to a Lexical rich-text field
> preserves the bad model and is the direct source of the HTML→Lexical
> embed-dropping and whitespace bugs fixed in #780. The real question is how the
> content should be *modelled*.

---

## Findings

There are **35 active rows** in `custom_texts`. Every one is a single freeform
HTML blob in one `longtext` column, authored as raw HTML in a `<textarea>`. They
fall into five archetypes — only one of which is genuinely "a rich-text article."

| # | Archetype | Count | Representative pages | What it really is |
|---|-----------|-------|----------------------|-------------------|
| **A** | Specialty-show episode archive | 2 | `rodney-anonymous` (143 embeds), `quarantine-takeovers` (35) | A flat list of hand-pasted Mixcloud `<iframe>`s separated by `<br><br>` |
| **B** | Show directory / hub | 1 | `shows` | A 4-column HTML `<table>` of program tiles (thumbnail + link) → Mixcloud or sibling pages |
| **C** | Year-end ranked lists & poll results | 12 | `top220of2020`…`top225of2025`, `yearendpoll2020`…`2025` | Ranked **data** (rank / artist / title; album lists) hand-typed as 220–230-row `<table>`s |
| **D** | Multimedia retrospective | 4 | `y100:-20-years-gone`, `future-friday`, `words-with-nerds`, `y100-rocks` | Genuine rich articles: prose + dozens of mixed embeds (Mixcloud / YouTube / OpenDrive) |
| **E** | Landing / marketing / stub | 16 | `donate`, `t-shirts`, `contests`, `ynotsessions20XX`×6, `remembering-starla`, `player-test` | Simple pages; a few carry PayPal **forms** / **scripts** |

### Concrete problems observed in the stored content

- **Repetitive manual embed-pasting.** `rodney-anonymous` is 143 copies of the
  same `<iframe>` with only the feed slug changed, ordered by hand with
  `<br><br>`. Adding or reordering an episode means editing raw iframe markup.
- **Hand-built layout tables for what is really structured data.** The Top-225
  lists are 230-row tables with **manual alternating-row `bgcolor` striping** and
  fixed pixel widths (`width="685"`). The data can't be sorted, reused, or
  queried, and is brittle to edit.
- **Encoding corruption is baked in.** `custom_texts` is `DEFAULT CHARSET=latin1`,
  producing mojibake (`Â `, smart-quote garble) visible in 10 of 12 year-end
  pages. This is a storage-layer defect, not a rendering one.
- **Presentation welded to content.** 17 pages still use `<font>`; many embed
  `<style>` blocks and fixed widths — not responsive, not themeable.
- **External hosting dependencies.** Images on imgur, audio on Mixcloud /
  OpenDrive; nothing is in the asset pipeline → link-rot risk.
- **Editors fight the schema.** Several `title` values are literally `<img …>` or
  `<center>…` because the 64-char `title` column can't do what's needed.
- **Duplicated hand-maintained navigation.** Each year's trio re-types the same
  sibling-nav table.

---

## Decision: Plan 3 (phased, archetype-driven)

Stabilize now, then replace the blob model one archetype at a time — highest
pain first — keeping the feature flag as the safety net throughout. This reaches
the correct end state without a big-bang migration.

### Target home: a dedicated `Pages` collection (per Josh)

Custom texts get their **own `Pages` collection, separate and distinct from
`Posts`** — they are not stories, and the two content types should not share a
table:

| | `Posts` (Stories) | `Pages` (Custom Text) |
|---|---|---|
| Addressing | Front-page rotation, date-windowed (`startDate`/`endDate`, `priority`, `showOnFrontPage`) | Evergreen, addressed by a stable `permalink`/slug |
| Lifecycle | Time-bound news items that age off the front page | Long-lived reference / marketing pages |
| Identity | A headline + dated body | A titled page at a fixed URL |

`Pages` is the baseline home for the 35 custom texts and preserves the permalinks
the front end already routes on — `pages.php?page=…`, plus `donate.php`,
`shows.php`, `y100rocks.php`, and `rodney.php`, which all resolve custom text by
permalink via `CustomTextFactory`. Minimum fields: `title`, `slug`/`permalink`
(unique, matching the legacy values), `content` (richText + embed blocks),
`status`, `legacyId`. `PostgresCustomText` — the read model the
`use_postgres_customtext` flag toggles — repoints from `custom_texts` to the
`pages` table once content is migrated, so no front-end call sites change.

The archetype work below refines this baseline: pages that are really *structured
data* (A/B specialty shows, C year-end lists) graduate **out of** freeform
`Pages` into purpose-built collections; the genuine rich-text pages (D/E) stay in
`Pages` with rich text + embed blocks. (Whether every custom text must live in
`Pages` or the structured archetypes graduate out is tracked in Open Questions.)

### Phase 0 — Stabilize (done, PR #786 — merged)

- `use_postgres_customtext` flag (default MySQL) toggles the front-end read path.
- Legacy CP add/update/delete/view screens restored; `/cp` always resolves to
  MySQL (FeatureManager suppresses `use_postgres_*` there), so editors keep a
  working editor while the model is rebuilt.

### Phase 1 — Stop the bleeding for rich-text pages (archetypes D, E)

- **Fix the charset.** Migrate custom-text content to UTF-8 on import so mojibake
  stops being introduced.
- **Add Lexical embed blocks** for Mixcloud, YouTube, and OpenDrive, so editors
  insert an embed by pasting a URL/slug instead of raw `<iframe>` markup. This is
  what makes archetypes D and E acceptable on Payload and removes the converter's
  main failure mode. The embed capability itself is in flight — the generic
  `embed` block + shared `RendersLexicalEmbeds` rendering (TS + PHP) is **PR #800**,
  with the plan and alternatives weighed in **Chapter 16 / PR #801**. It is
  currently exercised through `PostgresCustomText`; it attaches to the `Pages`
  rich-text field when that collection lands.
- Once D/E render acceptably from Postgres, flip `use_postgres_customtext` for
  those pages (the flag is page-agnostic today; see Open Questions for
  per-page/per-archetype gating).

### Phase 2 — Model the repeatable shapes (archetypes A, B, C)

Sequenced by pain:

1. **A + B — Specialty Shows (highest pain, genuinely unbuilt).**
   The existing `Shows` collection is the *airing schedule* (date / host /
   start–end time), **not** a directory of programs — so neither A nor B is
   served today. Introduce a program/episode model that powers both:
   - `SpecialtyShow` (program): `name`, `slug`, `thumbnail` (Media),
     `externalUrl` (Mixcloud genre/playlist), `description` (richText),
     `featured`/`order`.
   - Episodes: either an `episodes` array on the program or a separate
     `Episodes` collection related to it — each episode is just a Mixcloud
     (or other) embed reference + title/date.
   - The hub page (B) renders all programs as tiles; each program page (A)
     renders its episode list. This replaces the 143-iframe `rodney-anonymous`
     blob and the hand-built `shows` table in one model.

2. **C — Year-end lists & polls (already planned — reuse, do not re-plan).**
   - Recap/display pages (`top22Xof20XX`, `yearendpoll20XX`) are covered by the
     existing **`YearEndPollResults`** collection — see
     [Chapter 13](./13-year-end-poll-results.md) and merged PR #154. It already
     models ranked songs/records/staff-picks blocks with relationships to
     `Songs`/`Records`/`DJs`, eliminating the hand-typed tables and mojibake.
   - The interactive **voting** side is **open PR #518**
     (`YearEndPolls` / `YearEndPollCategories` / `YearEndPollVotes`, modelled on
     the shipped Modern Rock Madness collections).
   - Action here is limited to: land/finish those efforts and point the legacy
     `pages.php?page=top22X…` / `yearendpoll…` URLs at the Payload-rendered
     output. No new modelling in this chapter.

3. **D — Multimedia retrospectives.** Migrate to `Pages` rich text using the
   Phase 1 embed blocks. These are true articles; the only requirement is clean
   embeds.

4. **E — Landing pages.** Migrate to `Pages` rich text. Handle the few
   form/script pages (`donate`, raffle, MRM bracket) as a small set of reusable
   front-end components rather than pasted HTML/JS.

### Rollout & rollback

- Each archetype migrates behind `use_postgres_customtext` (today) and is only
  cut over once it renders acceptably; the legacy MySQL blob + CP screens remain
  the instant rollback for the duration.
- The flag is removed per archetype once its replacement is the sole source of
  truth, mirroring the per-collection cutover pattern used elsewhere.

---

## Archetype → target model summary

Baseline home for all custom text is the new **`Pages`** collection; the
structured archetypes graduate out of it into purpose-built collections.

| Archetype | Target | Status |
|-----------|--------|--------|
| A — episode archives | `SpecialtyShow` (+ episodes) | **New work** (biggest gap) |
| B — show hub | `SpecialtyShow` directory view | **New work** (with A) |
| C — year-end lists | `YearEndPollResults` (Ch. 13 / #154) | **Exists** — reuse |
| C — voting | `YearEndPolls*` (PR #518) | **Open PR** — land |
| D — retrospectives | `Pages` + embed blocks | Needs `Pages` + Phase 1 blocks |
| E — landing/forms | `Pages` + form components | Needs `Pages` + Phase 1 blocks |

---

## Open questions

1. **Scope of `Pages`.** Does every custom text live in `Pages` (simplest, one
   model), or do the structured archetypes graduate to purpose-built collections
   (A/B → `SpecialtyShow`, C → `YearEndPollResults`) with `Pages` holding only
   the D/E rich-text pages? This doc assumes the latter; Josh to confirm.
2. **`Pages` vs `Posts` field overlap.** `Pages` needs `title` + `slug` +
   `content`; it deliberately omits the date-window/front-page fields that define
   `Posts`. Confirm no shared base is wanted (keeping them fully separate is the
   point of the split).
3. **Flag granularity.** `use_postgres_customtext` is currently all-or-nothing
   across every custom-text page. Phasing by archetype likely wants either
   per-permalink routing (serve some permalinks from Postgres, others from MySQL)
   or retiring the flag per archetype as each is cut over. Decide before Phase 2.
4. **Episode source of truth.** Should specialty-show episodes be entered in
   Payload, or pulled from the Mixcloud API by playlist/genre? An API pull would
   make `rodney-anonymous`-style archives self-maintaining.
5. **Asset hosting.** Whether to backfill imgur/Mixcloud-thumbnail images into
   Cloudinary/Media as part of each archetype migration.

---

## Related Documentation

- [Chapter 13: Year End Poll Results](./13-year-end-poll-results.md) — archetype C
- Chapter 16 / PR #801 — Rich-Text Embeds (Custom Text — Phase 1) plan
- [Core Data Models](./03-core-data-models.md)
- [Frontend Cutover](./06-frontend-cutover.md)
- PR #786 — feature flag + restored CP screens (Phase 0, merged)
- PR #800 — embed block + shared `RendersLexicalEmbeds` rendering (Phase 1 code)
- PR #518 — Year End Poll voting collections (archetype C, voting)
