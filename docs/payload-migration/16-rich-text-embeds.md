# Chapter 16: Rich-Text Embeds (Custom Text — Phase 1)

[← Back to Index](./README.md)

**Status:** In progress · **Last Updated:** July 2026

This chapter details **Phase 1** of the custom-text strategy in
[Chapter 15](./15-custom-text-strategy.md): giving editors a real embed
experience for rich-text pages (archetypes **D** — multimedia retrospectives —
and **E** — landing pages) so they paste a URL instead of hand-pasting raw
`<iframe>` markup. These pages are the ones that stay as freeform rich text in
the dedicated **`Pages`** collection (Chapter 15), so the embed block attaches to
the `Pages` rich-text field. This is the prerequisite for flipping
`use_postgres_customtext` for those pages.

---

## Why this is the first thing to fix

The legacy custom-text content is dominated by media embeds. Across the 35 active
pages there are **314 Mixcloud** player iframes, plus **YouTube** and
**OpenDrive** players in the retrospectives — all currently pasted as raw
`<iframe>` blocks into a `longtext` HTML field. When that HTML is imported to
Payload's Lexical rich text, the embeds are the exact thing that breaks (the
HTML→Lexical converter dropped embeds nested in tables/paragraphs — see the
fixes in PR #780). Until embeds are a first-class, provider-aware block, moving
these pages to Payload trades a working page for a broken one.

## Requirements

1. Editors add an embed by pasting a URL (YouTube, Vimeo, **Mixcloud**,
   **OpenDrive**, Spotify, SoundCloud, or any iframe URL) plus an optional
   caption.
2. The embed renders correctly in **both** render paths:
   - Payload admin preview + any Next.js/React frontend.
   - The **legacy PHP frontend** (`pages.php`), which converts Payload Lexical
     JSON to HTML on read.
3. Video embeds are responsive (16:9); audio players use a fixed height.
4. Only `http(s)` URLs are embedded (no `javascript:`/`data:`).

---

## Chosen approach (implemented in PR #800)

**A single generic `embed` block + runtime URL normalization, mirrored in both
stacks.**

- One Lexical block (`EmbedFeature`) with `url` + `caption` fields. It attaches
  to the `Pages` rich-text field (Chapter 15); today it is exercised through
  `PostgresCustomText`, the read model the `use_postgres_customtext` flag toggles.
- **URL → embed** normalization lives in two mirrored places:
  - TS: `payload/src/features/embed/utils.ts` (`detectEmbedType`).
  - PHP: `src/models/Concerns/RendersLexicalEmbeds.php` (`normalizeEmbedUrl`).
- The PHP helper is a trait shared by **both** PHP converters — the
  `ConvertsLexicalToHtml` trait (stories, DJs, on-demand, …) and
  `PostgresCustomText`'s own converter — so a `block` node renders the same
  everywhere. Previously the shared trait dropped block nodes entirely and
  `PostgresCustomText` handled Mixcloud-or-broken-generic only.
- Provider rules: YouTube `watch`/`youtu.be` → `/embed/<id>`; Mixcloud public
  show URL → `player-widget…?feed=<encoded path>` (widget URLs pass through);
  OpenDrive `/player/<id>` as-is; Vimeo/Spotify/SoundCloud → their embed URLs;
  everything else → generic iframe.
- The `embed` block has a `hideCoverImage` checkbox (default on, only shown in
  the admin UI for Mixcloud URLs) controlling the widget's `hide_cover` param —
  editors can opt back into showing the cover art per embed.

**Trade-off:** the provider logic is duplicated across TypeScript and PHP. Kept
honest by mirrored unit tests and "keep in sync" comments, but it is genuine
drift risk (see Option C).

---

## Remaining Phase 1 work (after PR #800)

1. **The `Pages` collection.** These D/E pages need their home — the dedicated
   `Pages` collection (Chapter 15) with the embed-enabled rich-text field — to
   exist before content can be migrated off `custom_texts`.
2. **Legacy embed CSS.** The PHP helper emits `embed`, `embed--video`,
   `embed--<provider>` classes and a 16:9 wrapper; the legacy theme needs
   matching CSS so audio vs video sizing is correct on `pages.php`.
3. **Content migration for archetypes D & E (~20 pages).** Convert existing raw
   `<iframe>`/media HTML into embed blocks. Either:
   - extend the importer's HTML→Lexical pass to emit embed blocks from legacy
     iframes, or
   - re-author the handful of D/E pages by hand.
4. **UTF-8 / mojibake cleanup.** Separate, data-side concern (the legacy
   `custom_texts` table is `latin1`; 10 of 12 year-end pages show mojibake).
   Options: re-import reading MySQL as latin1 → UTF-8, or an in-place fix of the
   migrated Postgres text. Needs a decision; tracked here so it isn't lost.
5. **Flag granularity.** `use_postgres_customtext` is currently all-or-nothing
   across every custom-text page. Flipping D/E first wants either per-permalink
   routing or retiring the flag per archetype (see Chapter 15 open questions).
6. **Verification.** Render D/E pages from Postgres and compare against the
   MySQL originals before flipping the flag.

---

## Alternatives considered

### Option A — Generic embed block + runtime detection _(chosen, shipped)_

One block, paste any URL, detect provider at render time.

- **Pros:** one block to learn; handles arbitrary iframe URLs; matches the
  existing `EmbedFeature`; smallest change to ship Phase 1.
- **Cons:** provider logic duplicated in TS + PHP; no author-time validation
  (a bad URL only shows as a broken embed at render).

### Option B — Provider-specific typed blocks

Separate `MixcloudBlock`, `YouTubeBlock`, `OpenDriveBlock`, … each storing just
the ID/slug (not a full URL).

- **Pros:** clean, validated data; no URL parsing at render; the editor picks a
  provider and gets provider-specific fields (e.g. Mixcloud "mini" toggle);
  aligns with the **SpecialtyShow/episode** model in Chapter 15 Phase 2, where a
  Mixcloud episode is already a stored reference.
- **Cons:** more blocks to maintain; awkward for one-off/unknown iframe sources;
  still needs per-provider render code in both stacks.
- **When it wins:** once the SpecialtyShow model lands, a first-class
  `MixcloudBlock` is a natural fit and could replace generic Mixcloud embeds.

### Option C — Single source of truth for provider rules

Define the provider rules once (a small declarative table: match pattern →
embed-URL template → layout) and consume from both TS and PHP (shared JSON +
thin adapters, or codegen).

- **Pros:** eliminates the TS/PHP drift that Option A accepts; new providers are
  a one-line data change.
- **Cons:** build/tooling complexity for a rules set that changes rarely; a
  JSON-driven regex table is less expressive than code for edge cases (e.g.
  Mixcloud hub-vs-feed detection).
- **Recommendation:** worth adopting as a fast-follow once a third or fourth
  provider forces the issue; not blocking for Phase 1.

### Option D — Single render path (retire PHP Lexical→HTML for these pages)

Render embeds (and eventually all rich text) only via a Next/React frontend, or
server-render Lexical→HTML in Node and have PHP consume that, instead of
maintaining a PHP converter.

- **Pros:** kills the dual-stack duplication at the root; uses Payload's own
  Lexical renderer; aligns with the framework migration in
  [Chapter 14](./14-frontend-framework-evaluation.md).
- **Cons:** a much larger architectural move than Phase 1; premature while the
  front end is still PHP.
- **Recommendation:** fold into the Chapter 14 framework decision, not Phase 1.

---

## Recommendation

Ship **Option A** now (done, PR #800) to unblock D/E, then:

- adopt **Option C** as a fast-follow if/when provider drift bites, and
- reach for **Option B** for Mixcloud specifically when the Chapter 15 Phase 2
  **SpecialtyShow** model lands, and
- treat **Option D** as part of the Chapter 14 framework migration.

---

## Related Documentation

- [Chapter 15: Custom Text Strategy](./15-custom-text-strategy.md) — the phased plan this detail sits under
- [Chapter 14: Frontend Framework Evaluation](./14-frontend-framework-evaluation.md) — context for Option D
- PR #800 — embed block implementation (Option A)
- PR #786 — feature flag + restored CP screens (Phase 0, merged)
