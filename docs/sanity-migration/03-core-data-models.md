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
| 9 | OnDemand | ✅ Done | Schema exists at `studio/schemaTypes/onDemand.ts`, references Artist |
| 10 | Show | ✅ Done | Schema exists at `studio/schemaTypes/show.ts`, references DJ |
| 11 | Top11Contest | 🔲 Not Started | Weekly contest config; votes/entries → Neon |
| 12 | Top11Result | 🔲 Not Started | Published weekly results |
| — | Record | ✅ Done | Schema exists at `studio/schemaTypes/record.ts`, references Artist and Song |
| — | Post | ✅ Done | Schema exists at `studio/schemaTypes/post.ts`, unified Story + CustomText model |

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
*[_type == "song" && featureOnNewMusic] | order(releaseDate desc) {
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
Show ───────────────────────────────────┘         │
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

---

## Import Scripts Status

### Current Import Scripts

The following import scripts exist in `bin/migrations/` and can be run via npm:

| Model | Import Script | npm Command |
|-------|--------------|-------------|
| Person/DJ | `importDeejays.ts` | `npm run import:deejays` |
| Ad | `importAds.ts` | `npm run import:ads` |
| Concert | `importConcerts.ts` | `npm run import:concerts` |
| CdOfTheWeek | `importCdOfTheWeek.ts` | `npm run import:cdotw` |

### Models That Still Need Import Scripts

| Model | Schema Status | Import Status | Notes |
|-------|--------------|---------------|-------|
| Artist | ✅ Schema exists | ✅ Created on-the-fly | No standalone import needed—created by Concert, Record (CdOfTheWeek), or Song imports |
| Venue | ✅ Schema exists | ✅ Created on-the-fly | No standalone import needed—created by Concert import |
| Song (Music) | ✅ Schema exists | ❌ No import script | Needs `importMusic.ts` to migrate legacy `music` table with `featureOnNewMusic: true` |
| Record | ✅ Schema exists | ✅ Via CdOfTheWeek | CD of the Week posts ARE records—`importCdOfTheWeek.ts` creates Record documents |
| OnDemand | ❌ Schema needed | ❌ No import script | Full implementation needed |
| Show | ❌ Schema needed | ❌ No import script | Full implementation needed |

### Import Decisions (Resolved)

#### Artist Import
- **No standalone import needed.** Artists are created on-the-fly when importing Concerts, Records (CD of the Week), or Songs.
- **Minimum required data**: Artist name is sufficient to create a record. Other fields (photo, bio, website) can be empty.
- **Photos**: Use `band_pic_url` from concert data when available. Empty photos are acceptable.
- **Deduplication**: A normalization report or dry-run mode is needed to identify and handle artist name variations (e.g., "The National" vs "National").

#### Venue Import
- **No standalone import needed.** Venues are created on-the-fly when importing Concerts.
- **Normalization**: A normalization report or dry-run mode is needed to identify venue name variations (e.g., "9:30 Club" vs "930 Club").

#### Song/Music Import
- **Artist matching**: Create or find Artist by name. The artist string in the `music` table is sufficient to create an Artist record.
- **Duplicate handling**: If a song already exists with more information available, update the existing record.
- **Feature flag**: YES—all imported music records should have `featureOnNewMusic: true`.

#### Record Import
- **No separate legacy `records` table exists.** CD of the Week posts ARE the records.
- **Source**: `importCdOfTheWeek.ts` handles Record creation as part of the CD of the Week import process.

#### OnDemand Import
- **Source field values**: Many entries are OpenDrive embeds; some also have YouTube links.
- **Artist/DJ linking**: Search for existing Artist or DJ documents by name. **Do NOT create Artists or DJs on-the-fly** for OnDemand content—only link to existing records.
- **Audio file handling**: Files are located externally and will continue to be. Migrate URLs only, not actual files.

#### Show (Schedule) Import
- **DJ matching**: The Show model references DJ documents directly via `dj` field (see Show Schema below). Match by DJ name to find existing DJ documents.
- **Historical data**: Import schedule data going back to **July 2025**.
- **Time format**: Legacy `start_time` and `end_time` fields are MySQL `time` type (see `src/db/migrations/schedule.sql`). Store as HH:MM strings in Sanity.
- **Day validation**: YES—validate that the `day` field is consistent with the `date` field during import.

---

## Show Model Design

### Overview

The Show model stores individual show entries for specific dates. Together, these shows comprise the station's schedule. Content managers maintain the schedule by:

1. Editing individual shows directly when changes occur
2. Using a Studio tool to clone a date range when generating new weeks

This approach keeps the data model simple while providing a convenient workflow for schedule management.

### Show Schema

```typescript
// studio/schemaTypes/show.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'show',
  title: 'Show',
  type: 'document',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Start Time',
      type: 'string',
      description: 'Format: HH:MM (24-hour)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endTime',
      title: 'End Time',
      type: 'string',
      description: 'Format: HH:MM (24-hour)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dj',
      title: 'DJ',
      type: 'reference',
      to: [{ type: 'dj' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'string',
      description: 'Optional note (e.g., "Guest DJ", "Holiday Schedule")',
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      type: 'number',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'migratedAt',
      title: 'Migrated At',
      type: 'datetime',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      date: 'date',
      startTime: 'startTime',
      endTime: 'endTime',
      djName: 'dj.person.name',
      note: 'note',
    },
    prepare(selection) {
      const { date, startTime, endTime, djName, note } = selection;
      const formattedDate = date
        ? new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : 'No date';
      return {
        title: `${formattedDate} ${startTime}–${endTime}`,
        subtitle: note ? `${djName} (${note})` : djName,
      };
    },
  },
  orderings: [
    {
      title: 'Date & Time',
      name: 'dateTimeAsc',
      by: [
        { field: 'date', direction: 'asc' },
        { field: 'startTime', direction: 'asc' },
      ],
    },
  ],
});
```

### Query Pattern

```groq
// Fetch shows for a specific date (the day's schedule)
*[_type == "show" && date == $date] {
  _id,
  date,
  startTime,
  endTime,
  note,
  dj-> { _id, person-> { name, slug, photo } }
} | order(startTime asc)

// Fetch shows for a date range (e.g., upcoming week's schedule)
*[_type == "show" && date >= $startDate && date <= $endDate] {
  _id,
  date,
  startTime,
  endTime,
  note,
  dj-> { _id, person-> { name, slug, photo } }
} | order(date asc, startTime asc)
```

### Studio Tool: Schedule Cloner

A custom Studio tool allows content managers to quickly generate new schedule weeks by cloning an existing date range of shows.

**Location**: `studio/plugins/schedule-cloner/`

**Features**:
- Select a source date range (e.g., "last week")
- Select a target date range (e.g., "next week")
- Preview the shows to be created
- Clone all shows, adjusting dates accordingly
- Option to skip shows that already exist in the target range

**UI Workflow**:
1. Content manager opens the "Schedule Cloner" tool
2. Selects source week (e.g., Mon Dec 2 – Sun Dec 8)
3. Selects target week (e.g., Mon Dec 9 – Sun Dec 15)
4. Reviews the preview of cloned shows
5. Clicks "Clone Schedule" to create the new show entries
6. Makes individual edits as needed for DJ changes

This approach keeps the data model simple (one document type) while providing a convenient workflow for the common task of generating next week's schedule.
