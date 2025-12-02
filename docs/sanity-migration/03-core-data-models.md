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
| 10 | Show | 🔲 Todo | References DJ, forms the schedule |
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
