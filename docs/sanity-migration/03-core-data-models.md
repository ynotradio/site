# Chapter 3: Core Data Models

[← Back to Index](./README.md)

---

## Priority Order

| Priority | Model | Status | Notes |
|----------|-------|--------|-------|
| 1 | Person | ✅ Done | Schema exists at `studio/schemaTypes/person.ts` |
| 2 | DJ | ✅ Done | Schema exists at `studio/schemaTypes/dj.ts` |
| 3 | Artist | ✅ Done | Schema exists at `studio/schemaTypes/artist.ts`, validated and working |
| 4 | Venue | ✅ Done | Schema exists at `studio/schemaTypes/venue.ts` |
| 5 | Ad | ✅ Done | Schema exists at `studio/schemaTypes/ad.ts` |
| 6 | Concert | ✅ Done | Schema exists at `studio/schemaTypes/concert.ts` |
| 7 | Song | ✅ Done | Schema exists at `studio/schemaTypes/song.ts`. See [Music / Song Model](#music--song-model) section below |
| 8 | CdOfTheWeek | ✅ Done | Schema exists at `studio/schemaTypes/cdOfTheWeek.ts`, references Record |
| 9 | OnDemand | 🔲 Todo | Audio content, references Artist or DJ |
| 10 | Schedule | 🔲 Todo | References DJ |
| — | Record | ✅ Done | Schema exists at `studio/schemaTypes/record.ts`, references Artist and Song |
| — | Content Block | ⏸️ Later | Unified Story + CustomText model (deferred) |
| — | Top11 | ⏸️ Later | Weekly chart, references Artist (deferred) |
| — | MRM Config | ⏸️ Later | Singleton for tournament settings (deferred) |
| — | MRM Match | ⏸️ Later | Tournament brackets, references Artist (deferred) |
| — | YearEndStaffPick | ⏸️ Later | Staff picks content (deferred) |
| — | YearEndPoll | ⏸️ Later | Most complex, many related tables (deferred) |

---

## Music / Song Model

### Background

The legacy MySQL `music` table stores new song additions for the "New Music" page (`/music`), which displays songs grouped by the week they were released. Each entry has: `id`, `artist`, `song`, `url`, `date`, `deleted`.

### Sanity Approach

Instead of creating a separate `music` schema that duplicates data, the **Song** schema (`studio/schemaTypes/song.ts`) serves this purpose with a `featureOnNewMusic` toggle:

| Legacy Field | Sanity Song Field | Notes |
|--------------|-------------------|-------|
| `artist` | `artists` | Reference to Artist document(s) |
| `song` | `title` | Song title |
| `url` | `streamUrl` | Link to stream the song |
| `date` | `releaseDate` | Release date for grouping |
| *(new)* | `featureOnNewMusic` | Boolean toggle to show on New Music page |
| `id` | `legacyId` | For migration tracking |
| `deleted` | *(not migrated)* | Soft-deleted records not imported |

### Why This Approach?

1. **Avoid data duplication**: Songs may appear in multiple contexts (New Music, Top 11, Year End Poll). A single Song document with feature flags prevents duplicate entries.
2. **Better content management**: Editors toggle `featureOnNewMusic` on/off rather than creating/deleting separate "music" entries.
3. **Consistent artist references**: All song-related features reference the same Artist documents.

### GROQ Query for New Music Page

```groq
*[_type == "song" && featureOnNewMusic == true] | order(releaseDate desc) {
  title,
  streamUrl,
  releaseDate,
  "artists": artists[]->{name, slug}
}
```

To group by week in the frontend, use the `releaseDate` field.

---

## Dependencies

```
Person ──────────────────────────────────────────┐
   │                                              │
   └─→ DJ ←────────────────────────────┐         │
                                        │         │
Artist ←─┬── Concert (+ Venue)          │         │
         ├── Song (+ Record)            │         │
         ├── CdOfTheWeek (via Record)   │         │
         └── OnDemand ─────────────────┤         │
                                        │         │
Schedule ───────────────────────────────┘         │
```

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Done | Schema created and migration complete |
| 🔲 Todo | Not started |
| 🚧 In Progress | Work has begun |
| ⚠️ Blocked | Waiting on dependency |
| ⏸️ Later | Deferred to future PR |
