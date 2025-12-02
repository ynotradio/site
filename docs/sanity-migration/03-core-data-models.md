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
| 7 | Music | 🔲 Todo | References Artist |
| 8 | CdOfTheWeek | 🔲 Todo | References Artist, has review text |
| 9 | OnDemand | 🔲 Todo | Audio content, references Artist or DJ |
| 10 | Schedule | 🔲 Todo | References DJ |
| — | Content Block | ⏸️ Later | Unified Story + CustomText model (deferred) |
| — | Top11 | ⏸️ Later | Weekly chart, references Artist (deferred) |
| — | MRM Config | ⏸️ Later | Singleton for tournament settings (deferred) |
| — | MRM Match | ⏸️ Later | Tournament brackets, references Artist (deferred) |
| — | YearEndStaffPick | ⏸️ Later | Staff picks content (deferred) |
| — | YearEndPoll | ⏸️ Later | Most complex, many related tables (deferred) |

---

## Dependencies

```
Person ──────────────────────────────────────────┐
   │                                              │
   └─→ DJ ←────────────────────────────┐         │
                                        │         │
Artist ←─┬── Concert (+ Venue)          │         │
         ├── Music                      │         │
         ├── CdOfTheWeek               │         │
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

---

## Schedule Model Design

### Overview

The Schedule model stores individual schedule entries for specific dates. Content managers maintain the schedule by:

1. Editing individual entries directly when changes occur
2. Using a Studio tool to clone a date range when generating new weeks

This approach keeps the data model simple while providing a convenient workflow for schedule management.

### Schedule Schema

```typescript
// studio/schemaTypes/schedule.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'schedule',
  title: 'Schedule',
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
// Fetch schedule for a specific date
*[_type == "schedule" && date == $date] {
  _id,
  date,
  startTime,
  endTime,
  note,
  dj-> { _id, person-> { name, slug, photo } }
} | order(startTime asc)

// Fetch schedule for a date range (e.g., upcoming week)
*[_type == "schedule" && date >= $startDate && date <= $endDate] {
  _id,
  date,
  startTime,
  endTime,
  note,
  dj-> { _id, person-> { name, slug, photo } }
} | order(date asc, startTime asc)
```

### Studio Tool: Schedule Cloner

A custom Studio tool allows content managers to quickly generate new schedule weeks by cloning an existing date range.

**Location**: `studio/plugins/schedule-cloner/`

**Features**:
- Select a source date range (e.g., "last week")
- Select a target date range (e.g., "next week")
- Preview the entries to be created
- Clone all entries, adjusting dates accordingly
- Option to skip entries that already exist in the target range

**UI Workflow**:
1. Content manager opens the "Schedule Cloner" tool
2. Selects source week (e.g., Mon Dec 2 – Sun Dec 8)
3. Selects target week (e.g., Mon Dec 9 – Sun Dec 15)
4. Reviews the preview of cloned entries
5. Clicks "Clone Schedule" to create the new entries
6. Makes individual edits as needed for DJ changes

This approach keeps the data model simple (one document type) while providing a convenient workflow for the common task of generating next week's schedule.
