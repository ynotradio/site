# Chapter 13: Year End Poll Results

[← Back to Index](./README.md)

---

## Overview

This chapter describes the Payload-friendly approach for handling Year End Poll specialty pages that serve as recaps of the annual poll. These pages have historically required extensive HTML editing by content managers.

## Problem Statement

The Year End Poll specialty pages include:
- **Top 225 Songs** (`/pages.php?page=top225of2025`) - A countdown of the year's best songs
- **Year End Poll Results** (`/pages.php?page=yearendpoll2025`) - Category-based poll results
- **Staff Picks** (`/yearendstaffpicks.php`) - DJ-curated favorite songs and albums

Currently, these pages:
- Require manual HTML editing for content managers
- Duplicate data that already exists (songs, records, DJs, on-demand content)
- Follow a similar structure year after year but require recreation each year

## Solution: YearEndPollResults Collection

The `YearEndPollResults` collection uses Payload's **blocks** field type to allow flexible composition of different ranked list sections. Content managers can build pages by:

1. **Selecting items from dropdowns** - No more typing artist names or song titles
2. **Adding ranks and notes** - Simple number fields and optional text
3. **Composing sections** - Mix and match different block types
4. **Using existing data** - References to Songs, Records, DJs, and OnDemand collections

### Collection Structure

```typescript
YearEndPollResults
├── title: text (e.g., "Top 225 Songs of 2025")
├── year: number (e.g., 2025)
├── slug: text (e.g., "top225of2025")
├── pageType: select (countdown | poll-results | staff-picks)
├── publishedAt: date
├── featuredImage: upload (Media)
├── introduction: richText
└── sections: blocks[]
    ├── RankedSongsBlock
    │   ├── categoryName: text
    │   └── items: array[]
    │       ├── rank: number
    │       ├── song: relationship (Songs)
    │       └── note: text
    ├── RankedRecordsBlock
    │   ├── categoryName: text
    │   └── items: array[]
    │       ├── rank: number
    │       ├── record: relationship (Records)
    │       └── note: text
    ├── RankedDJsBlock
    │   ├── categoryName: text
    │   └── items: array[]
    │       ├── rank: number
    │       ├── dj: relationship (DJs)
    │       └── note: text
    ├── RankedOnDemandBlock
    │   ├── categoryName: text
    │   └── items: array[]
    │       ├── rank: number
    │       ├── onDemand: relationship (OnDemand)
    │       └── note: text
    ├── StaffPicksBlock
    │   ├── dj: relationship (DJs)
    │   ├── introduction: richText
    │   ├── songPicks: array[]
    │   │   ├── song: relationship (Songs)
    │   │   └── comment: text
    │   └── recordPicks: array[]
    │       ├── record: relationship (Records)
    │       └── comment: text
    └── TextContentBlock
        ├── heading: text
        └── content: richText
```

---

## Page Type Examples

### Countdown Pages (Top 225 Songs)

For pages like "Top 225 Songs of 2025":

1. Set `pageType` to "Countdown"
2. Add a `RankedSongsBlock` section
3. Enter items with rank 1-225, selecting each song from the dropdown
4. Optionally add notes for notable entries

**Example structure:**
```
Title: "Top 225 Songs of 2025"
Year: 2025
Slug: "top225of2025"
Page Type: Countdown
Sections:
  - RankedSongsBlock:
      Category: "The Complete Countdown"
      Items:
        1. Song: "Example Song" by Artist Name
        2. Song: "Another Hit" by Another Artist
        ... (225 items)
```

### Poll Results Pages

For pages with multiple category results:

1. Set `pageType` to "Poll Results"
2. Add multiple blocks for different categories:
   - `RankedSongsBlock` for "Best Song"
   - `RankedRecordsBlock` for "Best Album"
   - `RankedDJsBlock` for "DJ of the Year"
   - `RankedOnDemandBlock` for "Best Interview"

**Example structure:**
```
Title: "Year End Poll 2025 Results"
Year: 2025
Slug: "yearendpoll2025"
Page Type: Poll Results
Sections:
  - TextContentBlock:
      Heading: "The Results Are In!"
      Content: "Thank you to everyone who voted..."
  - RankedSongsBlock:
      Category: "Best Song"
      Items: [1st, 2nd, 3rd...]
  - RankedRecordsBlock:
      Category: "Best Album"
      Items: [1st, 2nd, 3rd...]
  - RankedDJsBlock:
      Category: "DJ of the Year"
      Items: [1st, 2nd, 3rd...]
```

### Staff Picks Pages

For DJ-curated picks pages:

1. Set `pageType` to "Staff Picks"
2. Add multiple `StaffPicksBlock` sections, one per DJ
3. Each DJ can have their own song picks, record picks, and comments

**Example structure:**
```
Title: "Year End Staff Picks 2025"
Year: 2025
Slug: "yearendstaffpicks2025"
Page Type: Staff Picks
Sections:
  - TextContentBlock:
      Content: "Our DJs share their favorites..."
  - StaffPicksBlock:
      DJ: DJ Name
      Introduction: "2025 was an incredible year..."
      Song Picks: [Song 1, Song 2, Song 3...]
      Record Picks: [Album 1, Album 2...]
  - StaffPicksBlock:
      DJ: Another DJ
      Song Picks: [...]
```

---

## Benefits Over HTML Editing

| Before (HTML) | After (Payload) |
|---------------|-----------------|
| Copy/paste HTML templates | Click "Add Section" button |
| Type artist/song names manually | Select from searchable dropdown |
| Risk of typos and broken formatting | Consistent, validated data |
| Duplicate data | References existing collections |
| Difficult to update | Click and edit |
| No preview | Live preview in admin |
| No version history | Built-in drafts and revisions |

---

## Frontend Rendering

When rendering these pages on the frontend, you can:

1. **Query by slug**: `GET /api/year-end-poll-results?where[slug][equals]=top225of2025`
2. **Include relationships**: `?depth=2` to include related song/artist data
3. **Iterate over sections**: Each block type has a predictable structure

### Example API Response

```json
{
  "docs": [{
    "id": 1,
    "title": "Top 225 Songs of 2025",
    "year": 2025,
    "slug": "top225of2025",
    "pageType": "countdown",
    "sections": [
      {
        "blockType": "rankedSongs",
        "categoryName": "The Complete Countdown",
        "items": [
          {
            "rank": 1,
            "song": {
              "id": 123,
              "title": "Best Song Ever",
              "artist": {
                "id": 45,
                "name": "Great Artist"
              }
            },
            "note": "A landslide winner!"
          },
          // ... more items
        ]
      }
    ]
  }]
}
```

---

## Migration Notes

For existing Year End Poll pages:
- No automatic migration script is planned (per the original request)
- Content managers can recreate pages using the new collection
- Historical pages can remain as legacy HTML if needed
- New pages should use the `YearEndPollResults` collection

---

## PostgreSQL Schema

Payload will auto-generate tables for this collection:

```sql
-- Main results table
CREATE TABLE year_end_poll_results (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  page_type VARCHAR(50) NOT NULL,
  published_at TIMESTAMP,
  featured_image_id INTEGER REFERENCES media(id),
  introduction JSONB,
  legacy_id INTEGER UNIQUE,
  migrated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sections stored as JSONB (Payload handles block serialization)
-- The sections field is stored as JSONB containing the blocks array
```

---

## Admin UI Group

The `YearEndPollResults` collection is placed in the "Polls & Contests" admin group alongside future voting-related collections:
- Top11Contests
- Top11Results
- YearEndPolls
- YearEndPollResults ← (this collection)
- ModernRockMadness

---

## Next Steps

1. ✅ Collection created and registered
2. Test by creating a sample Year End Poll Results page
3. Verify relationships work correctly
4. Build frontend components to render the blocks
5. Train content managers on the new workflow

---

## Related Documentation

- [Core Data Models](./03-core-data-models.md) - All collections overview
- [Migration Tasks](./04-migration-tasks.md) - Implementation steps
- [Architecture Decisions](./02-architecture-decisions.md) - Design patterns
