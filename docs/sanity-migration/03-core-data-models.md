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
| 10 | ScheduleSlot | 🔲 Todo | Default weekly template slot, references DJ |
| 11 | ScheduleOverride | 🔲 Todo | One-off schedule changes, references DJ |
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
ScheduleSlot ───────────────────────────┘         │
ScheduleOverride ───────────────────────┘         │
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

The Schedule system uses a **template + override** pattern to handle recurring weekly schedules with occasional changes:

1. **ScheduleSlot** - Defines the default weekly template (Monday–Sunday time slots)
2. **ScheduleOverride** - One-off changes for specific dates (DJ substitutions, guest appearances, etc.)

This approach allows content managers to:
- Set up a recurring default schedule once
- Override specific slots on specific dates when needed
- Keep historical records of past schedule changes

### ScheduleSlot (Default Weekly Template)

```typescript
// studio/schemaTypes/scheduleSlot.ts
{
  name: 'scheduleSlot',
  title: 'Schedule Slot',
  type: 'document',
  fields: [
    {
      name: 'dayOfWeek',
      title: 'Day of Week',
      type: 'string',
      options: {
        list: [
          { title: 'Monday', value: 'monday' },
          { title: 'Tuesday', value: 'tuesday' },
          { title: 'Wednesday', value: 'wednesday' },
          { title: 'Thursday', value: 'thursday' },
          { title: 'Friday', value: 'friday' },
          { title: 'Saturday', value: 'saturday' },
          { title: 'Sunday', value: 'sunday' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'startTime',
      title: 'Start Time',
      type: 'string',
      description: 'Format: HH:MM (24-hour)',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    },
    {
      name: 'endTime',
      title: 'End Time',
      type: 'string',
      description: 'Format: HH:MM (24-hour)',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    },
    {
      name: 'dj',
      title: 'DJ',
      type: 'reference',
      to: [{ type: 'dj' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'showName',
      title: 'Show Name',
      type: 'string',
      description: 'Optional name for the show (e.g., "Morning Drive")',
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      description: 'Whether this slot is currently active in the schedule',
      initialValue: true,
    },
  ],
}
```

### ScheduleOverride (One-off Changes)

```typescript
// studio/schemaTypes/scheduleOverride.ts
{
  name: 'scheduleOverride',
  title: 'Schedule Override',
  type: 'document',
  fields: [
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      description: 'The specific date this override applies to',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'startTime',
      title: 'Start Time',
      type: 'string',
      description: 'Format: HH:MM (24-hour)',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    },
    {
      name: 'endTime',
      title: 'End Time',
      type: 'string',
      description: 'Format: HH:MM (24-hour)',
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    },
    {
      name: 'replacesSlot',
      title: 'Replaces Slot',
      type: 'reference',
      to: [{ type: 'scheduleSlot' }],
      description: 'The default slot this override replaces (optional)',
    },
    {
      name: 'dj',
      title: 'DJ',
      type: 'reference',
      to: [{ type: 'dj' }],
      description: 'The DJ for this override (leave empty if slot is cancelled)',
    },
    {
      name: 'note',
      title: 'Note',
      type: 'string',
      description: 'Reason for the change (e.g., "Guest DJ: John Smith", "Holiday Schedule")',
    },
    {
      name: 'overrideType',
      title: 'Override Type',
      type: 'string',
      options: {
        list: [
          { title: 'Substitute DJ', value: 'substitute' },
          { title: 'Guest DJ', value: 'guest' },
          { title: 'Cancelled', value: 'cancelled' },
          { title: 'Special Event', value: 'special' },
        ],
      },
      initialValue: 'substitute',
    },
  ],
}
```

### Query Pattern

To get the schedule for a specific date:

```groq
// 1. Get the day of week from the date
// 2. Fetch default slots for that day
// 3. Check for overrides on that specific date
// 4. Merge results (overrides take precedence)

// Fetch default slots for a specific day
*[_type == "scheduleSlot" && dayOfWeek == $dayOfWeek && isActive == true] {
  _id,
  startTime,
  endTime,
  showName,
  dj-> { _id, person-> { name, slug, photo } }
} | order(startTime asc)

// Fetch overrides for a specific date
*[_type == "scheduleOverride" && date == $date] {
  _id,
  startTime,
  endTime,
  note,
  overrideType,
  replacesSlot-> { _id },
  dj-> { _id, person-> { name, slug, photo } }
} | order(startTime asc)
```

### Content Manager Workflow

1. **Initial Setup**: Create `scheduleSlot` documents for each regular time slot (e.g., 7 slots per day × 7 days = 49 slots for a full week)

2. **Handling Changes**:
   - When a DJ is out sick: Create a `scheduleOverride` with `overrideType: 'substitute'` and reference the replacement DJ
   - For guest appearances: Create a `scheduleOverride` with `overrideType: 'guest'` and add a note
   - To cancel a slot: Create a `scheduleOverride` with `overrideType: 'cancelled'` and leave DJ empty

3. **Viewing the Schedule**: The frontend queries both documents and merges them, with overrides taking precedence over defaults for matching time slots

### Alternative Approach: Single Document with Date Range

For simpler needs, an alternative is to use a single `scheduleEntry` document type with optional date fields:

```typescript
{
  name: 'scheduleEntry',
  fields: [
    { name: 'dj', type: 'reference', to: [{ type: 'dj' }] },
    { name: 'startTime', type: 'string' },
    { name: 'endTime', type: 'string' },
    { name: 'dayOfWeek', type: 'string' },  // For recurring
    { name: 'specificDate', type: 'date' }, // For one-off
    { name: 'isRecurring', type: 'boolean' },
    { name: 'note', type: 'string' },
  ],
}
```

However, the two-document approach (ScheduleSlot + ScheduleOverride) is recommended because:
- Clearer separation of concerns
- Easier to audit/review schedule changes
- Better support for the "what's different this week?" use case
- Prevents accidental modification of the master schedule
