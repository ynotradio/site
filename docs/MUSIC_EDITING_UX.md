# Music editing UX: slugs, associations, and free-form alternatives

**Status:** slug hardening shipped; association improvements proposed for discussion.
**Audience:** maintainers deciding how far to simplify the music-entry workflow.
**Origin:** editor feedback — repeated "invalid slug" errors when adding new music,
and a broader concern that "this interface is too complicated for what we do."

---

## 1. The problem, precisely

Every music item (Songs, Records) has a **slug** — an internal URL identifier
such as `pet-shop-boys--west-end-girls`. Editors never type it; it is
auto-generated from **artist + title**. Two things went wrong for the editor:

1. **The slug could fail to generate and block the save.** For Songs and
   Records the slug is `artist-name--title`, and the artist name has to be
   looked up in the database (the form only holds the artist's numeric ID).
   That lookup is asynchronous, and Payload's slug field does **not** await it —
   so the slug could reach validation as an unresolved value (or empty, for a
   title made only of symbols). The required, format-validated field then
   rejected the save with a generic **"invalid slug."** See the fragile
   workaround that used to live in `payload/src/collections/hooks/slugUtils.ts`
   and the UX history in issues #591 / #622.

2. **The slug field is visible to editors.** In `Records.ts` / `Songs.ts` the
   `slugField(...)` is rendered without an admin condition, so the editor sees a
   technical field — plus its lock/unlock button and the cryptic error — that
   they should never have to think about. (Contrast `displayName`, which _is_
   hidden behind `adminOnlyCondition`.)

The net effect: an internal field failed to generate itself and then blamed the
editor, with no way for them to understand or fix it.

---

## 2. What shipped (slug hardening — everywhere slugs are generated)

Goal: **generating a slug can never block a save, in any collection.**

- **New shared helper `payload/src/collections/shared/slugField.ts`.** It wraps
  Payload's `slugField()` and composes whatever `slugify` a collection supplies
  with `makeSafeSlugify`, which **guarantees a valid, non-empty slug returned
  synchronously**. Resolution order: the collection's own result → the value
  Payload would otherwise slugify (title/name/typed slug) → a safe `item`
  constant. A thrown error or a returned Promise is treated as "no result" and
  falls through, so a Promise can never again reach the field.
- **Applied at every call site.** All nine slug-using collections now import
  `slugField` from the shared helper instead of from `'payload'`: Artists,
  CdOfTheWeek, Pages, People, Posts, Records, Songs, Top11Contests, Venues.
- **`musicSlugify` is now fully synchronous** — it never performs an async DB
  lookup and never returns a Promise. When the artist name is not available
  synchronously it returns a valid title-only slug; the full `artist--title`
  slug is still filled in by `generateMusicSlugBeforeChangeHook` (a collection
  `beforeChange` hook) before the row is persisted. So the value reaching
  validation is always valid, and the stored value is still the nice
  `artist--title` form.

Uniqueness behavior is intentionally unchanged: a genuine duplicate still
surfaces the database's clear **"must be unique"** message rather than the
opaque slug error. (Auto-suffixing duplicates is a proposed follow-up — §3.4.)

Covered by unit tests in `shared/slugField.test.ts` and the updated
`hooks/slugUtils.test.ts` (686 collection tests green).

> **Recommended immediate follow-up (small, not yet shipped):** hide the slug
> field from editors by giving the shared helper an `adminOnly` option that
> stamps `admin.condition = adminOnlyCondition` on the generated slug field.
> This removes the confusing field and its lock/unlock button from the
> editor's view entirely. It was left out of the first pass only because it
> touches the field structure Payload's helper returns and warrants a manual
> admin-UI check before shipping.

---

## 3. Making creation & association smoother (proposed)

The remaining friction is the **required artist relationship**: an editor
cannot save a Song or Record until the artist already exists as an Artist
record and is linked. Ordered from lowest to highest effort.

### 3.1 Make inline artist creation obvious (low effort)

Payload relationship fields already allow creating the related document inline
("Add new" in the dropdown). The gap is discoverability, not capability.
Concretely:

- Confirm `admin.allowCreate` is on for the `artist` field (it defaults on).
- Improve the field `description` to say plainly: _"Start typing — if the
  artist isn't listed, choose 'Add new' to create them without leaving this
  form."_
- Make sure the inline create form is minimal (name only is required; bio,
  photo, MusicBrainz can come later).

### 3.2 A "New Music" quick-add screen (medium effort)

The dashboard already links **New Music** straight to the Songs collection, and
the codebase already has precedent for custom admin tools — the **CD of the
Week Wizard** (`/admin/cd-of-the-week-wizard`) and **Show Cloner**
(`/admin/show-cloner`). A parallel **New Music** wizard would let the editor:

1. Type an artist name → typeahead matches existing Artists, or offers _"Create
   'Pet Shop Boys'"_ in one click.
2. Type the song/album title, optionally paste a stream URL and release date.
3. Tick "Feature on New Music."
4. Save — the wizard creates the Artist if needed, then the Song/Record, then
   links them, in one transaction.

This collapses the three-step "create artist → create song → link" flow into a
single form without removing the underlying relational structure.

### 3.3 Duplicate-artist prevention via name match (medium effort)

The most valuable _uniqueness check_ here is not on the slug — it's on the
**artist name**. Free typing invites `Pet Shop Boys` / `pet shop boys` / `PSB`
as separate artists, which silently fragments artist pages. Add a
`beforeValidate` check on Artists that, on create, looks for an existing artist
with a matching normalized name and either reuses it or warns. Pair this with
the typeahead in §3.2 so the editor is nudged toward the existing record.

### 3.4 Auto-suffix slug collisions (small, optional)

If we ever make the music slug `unique`, add a `beforeValidate` hook that
appends `-2`, `-3`, … on collision (the pattern already used by
`YearEndPollResults`' `beforeDuplicate`). This keeps a same-title re-recording
from throwing any error at the editor.

---

## 4. Alternatives: optional or backfilled associations

The editor asked whether we should **relax the artist/song/album associations
and allow more free-form content.** Three options, with trade-offs.

### Option A — Keep relationships required (status quo, now smoother)

Do §3.1–§3.3 and stop. The editor keeps a guided flow; the site keeps its
relational integrity.

- **Pros:** Artist pages, cross-linking, the New Music page
  (`featureOnNewMusic`), CD of the Week's derived slug, and MusicBrainz
  metadata all keep working. No data cleanup later.
- **Cons:** The editor still has to create the artist (even if inline) before
  saving. For a brand-new artist that's one extra step.

### Option B — Optional artist + free-text fallback, resolved nightly (recommended middle path)

Let the editor save a Song/Record with **either** a linked Artist **or** a
free-text `artistName`. A nightly job reconciles the free text into real
Artist relationships.

Data model:

- `artist` relationship becomes **not required**.
- Add `artistName` (text) and an `artistLinkStatus` select
  (`linked` / `pending` / `ambiguous`), shown read-only to editors.
- A `beforeValidate` hook: if `artist` is set → `linked`; else if `artistName`
  is present → `pending`; else block (still need _some_ artist).

Nightly reconciliation job (`bin/` script on the existing scheduler, alongside
`backfill-search-text-fields.ts`; the integrity-check scripts under `bin/` are
the model to copy):

1. Find Songs/Records with `artistLinkStatus = pending`.
2. Normalize `artistName` and match against existing Artists.
   - **Exact/normalized match** → link it, set `linked`, clear `artistName`.
   - **No match** → create the Artist (name only), link, set `linked`.
   - **Multiple plausible matches** → set `ambiguous`, leave for a human; the
     job emits a report (same pattern as the existing integrity checks).
3. Optionally enrich newly created Artists from MusicBrainz on a later pass —
   the `integrity-check-musicbrainz` tooling already exists.

- **Pros:** The editor can capture new music the instant they hear it, typing an
  artist name freely; the structure is restored automatically overnight, so
  artist pages and the New Music page stay coherent. Ambiguity is surfaced, not
  silently guessed.
- **Cons:** A short window where an item's artist is a string, not a link (so it
  won't appear on that artist's page until reconciled). Requires the nightly job
  plus a small "needs review" surface for `ambiguous` rows. `displayName` and
  the music slug must fall back to `artistName` while `pending`.

### Option C — Fully free-form music entries (not recommended)

Replace the relationships with plain text fields (artist/title/album as
strings), or a single free-form "New Music" post.

- **Pros:** Simplest possible data entry.
- **Cons:** Permanently loses artist pages, reliable cross-linking, and clean
  New Music / CD of the Week behavior; fragments artists into non-matching
  strings that are expensive to re-consolidate later. This trades a small,
  fixable entry annoyance for a large, hard-to-reverse structural loss.

---

## 5. Recommendation

1. **Shipped:** slug hardening — the direct cause of the "invalid slug" errors.
2. **Do next (small):** hide the slug field from editors (§2 follow-up), and
   make inline artist creation obvious (§3.1). Together these likely resolve
   most of the day-to-day frustration on their own.
3. **Then decide A vs B.** If the editor's real need is _"let me add music the
   moment I have it without stopping to set up the artist,"_ implement
   **Option B** — optional artist + free-text fallback + nightly reconciliation.
   It gives the free-form feel where it matters while keeping the relational
   model that makes the music section work.
4. **Avoid Option C.** Full free-form is the version we'd regret.
