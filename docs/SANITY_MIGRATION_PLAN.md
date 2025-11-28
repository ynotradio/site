# Sanity CMS Migration Plan

**Last Updated:** November 28, 2025  
**Project Goal:** Replace the homemade PHP content management dashboard with Sanity CMS, then build a modern responsive site redesign.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Core Data Models](#core-data-models)
4. [Migration Tasks](#migration-tasks)
5. [Shared Utilities](#shared-utilities)
6. [Frontend Cutover Strategy](#frontend-cutover-strategy)
7. [Success Criteria](#success-criteria)

---

## Project Overview

### Two-Phase Project

1. **Phase 1 (Current):** Replace PHP admin dashboard with Sanity CMS
2. **Phase 2 (Future):** Build responsive site redesign with modern web platform technology

### Current State

- Legacy PHP/MySQL site with custom admin dashboard
- Sanity Studio set up at `/sanity` path
- `person` and `dj` schemas already created and migrated
- Migration script exists: `bin/migrations/importDeejays.ts`

### Migration Strategy

- **Upsert migrations:** If record exists, update it; otherwise create new
- **Incremental approach:** Run migrations repeatedly until full parity
- **Feature flag cutover:** Read from Sanity behind feature flag, then cut over when ready
- **No dual-write:** Keep MySQL as source of truth until full cutover

---

## Architecture Decisions

### Data Handling

| Decision | Details |
|----------|---------|
| **Soft Deletes** | Use Sanity's draft/published state instead of `deleted` field |
| **Data Validation** | Fail on issues, generate report for manual review—no auto-cleaning |
| **Rich Text** | Convert HTML to Sanity Portable Text format |
| **Images** | Migrate to Sanity asset pipeline whenever possible |
| **Historical Data** | Keep going forward; don't migrate old tournament data |

### Content Model: Artist

The `artist` type is the generic content type for bands/musicians. Key features:

```
Artist
├── name: string
├── slug: slug
├── photo: image
├── bio: portableText
├── website: url
├── members: reference[] → Person (many-to-many)
└── _legacyId: number (read-only)
```

**Rules:**
- Artists cannot be deleted/unpublished once associated with published content (posts, music, top 11, MRM matches)
- Multiple artists can be "teamed up" for MRM (e.g., Jack White/White Stripes)
- People can be members of multiple artists (e.g., Damon Albarn → solo, Gorillaz, Blur)

### Content Model: Person

Extends the existing `person` schema:

```
Person
├── name: string
├── slug: slug
├── photo: image
├── bio: portableText
├── djRecord: reference → DJ (if they've been a guest DJ)
└── _legacyId: number (read-only)
```

### Base Document Fields

All migrated documents should include:

```typescript
{
  name: '_legacyId',
  title: 'Legacy ID',
  type: 'number',
  description: 'Original MySQL ID for reference',
  readOnly: true,
},
{
  name: '_migratedAt',
  title: 'Migrated At',
  type: 'datetime',
  description: 'When the record was migrated',
  readOnly: true,
}
```

---

## Core Data Models

### Priority Order

| Priority | Model | Status | Notes |
|----------|-------|--------|-------|
| 1 | Person | ✅ Done | Schema exists at `studio/schemaTypes/person.ts` |
| 2 | DJ | ✅ Done | Schema exists at `studio/schemaTypes/dj.ts` |
| 3 | Artist | 🔲 Todo | New generic content type for bands |
| 4 | Ad | 🔲 Todo | Simple model |
| 5 | Concert | 🔲 Todo | References Artist |
| 6 | Music | 🔲 Todo | References Artist |
| 7 | CdOfTheWeek | 🔲 Todo | References Artist, has review text |
| 8 | OnDemand | 🔲 Todo | Audio content |
| 9 | Schedule | 🔲 Todo | References DJ |
| 10 | Content Block | 🔲 Todo | Unified Story + CustomText model |
| 11 | Top11 | 🔲 Todo | Weekly chart, references Artist |
| 12 | MRM Config | 🔲 Todo | Singleton for tournament settings |
| 13 | MRM Match | 🔲 Todo | Tournament brackets, references Artist |
| 14 | YearEndStaffPick | 🔲 Todo | Staff picks content |
| 15 | YearEndPoll | 🔲 Todo | Most complex, many related tables |

---

## Migration Tasks

Each task below is designed to be **self-contained** for cold-start agent conversations. Tasks include all necessary context and can be completed independently.

---

### Task 1: Create Artist Schema

**Status:** 🔲 Not Started  
**Depends On:** None  
**Estimated Effort:** Small

**Context:**
The `artist` type replaces "band" as the generic content type for musicians. It will be referenced by Concert, Music, CdOfTheWeek, Top11, and MRM features.

**Requirements:**
1. Create `studio/schemaTypes/artist.ts` with fields:
   - `name` (string, required)
   - `slug` (slug from name, required)
   - `photo` (image with hotspot)
   - `bio` (array of blocks - Portable Text)
   - `website` (url)
   - `members` (array of references to `person`)
   - `_legacyId` (number, readOnly)
   - `_migratedAt` (datetime, readOnly)
2. Add to `studio/schemaTypes/index.ts`
3. Test in Sanity Studio

**Files to Modify:**
- `studio/schemaTypes/artist.ts` (create)
- `studio/schemaTypes/index.ts` (update)

**Acceptance Criteria:**
- [ ] Schema compiles without errors
- [ ] Can create/edit Artist in Sanity Studio
- [ ] Can link Person references to Artist
- [ ] Photo upload works with hotspot

---

### Task 2: Create Shared Migration Utilities

**Status:** 🔲 Not Started  
**Depends On:** None  
**Estimated Effort:** Medium

**Context:**
All migration scripts need common functionality for image uploads, HTML conversion, validation, and logging. Creating shared utilities prevents code duplication and ensures consistency.

**Requirements:**
1. Create `bin/migrations/shared/` folder with:
   - `imageUploader.ts` - Upload images to Sanity, return asset reference
   - `richTextConverter.ts` - Convert HTML to Portable Text
   - `validation.ts` - Validate records, return errors
   - `logger.ts` - Consistent logging with timestamps
   - `upsert.ts` - Upsert logic using `_legacyId` for matching
2. Use existing `bin/migrations/sanity.ts` patterns as reference

**Files to Create:**
- `bin/migrations/shared/imageUploader.ts`
- `bin/migrations/shared/richTextConverter.ts`
- `bin/migrations/shared/validation.ts`
- `bin/migrations/shared/logger.ts`
- `bin/migrations/shared/upsert.ts`
- `bin/migrations/shared/index.ts` (barrel export)

**Acceptance Criteria:**
- [ ] All utilities compile without TypeScript errors
- [ ] Image uploader handles external URLs (e.g., Imgur)
- [ ] Rich text converter produces valid Portable Text
- [ ] Upsert finds existing records by `_legacyId`

---

### Task 3: Create Ad Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 2 (Shared Utilities)  
**Estimated Effort:** Small

**Context:**
The `ads` table stores sponsor/advertisement data with images and date ranges. Simple model, good for establishing migration patterns.

**MySQL Schema:**
```
ads: id, name, start_date, end_date, pic_url, web_url, priority, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/ad.ts`:
   - `name` (string, required)
   - `startDate` (date)
   - `endDate` (date)
   - `image` (image)
   - `url` (url)
   - `priority` (number)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importAds.ts`
3. Add npm script `import:ads`
4. Generate migration report

**Files to Modify:**
- `studio/schemaTypes/ad.ts` (create)
- `studio/schemaTypes/index.ts` (update)
- `bin/migrations/importAds.ts` (create)
- `package.json` (add script)

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Migration script runs without errors
- [ ] Images migrated to Sanity assets
- [ ] Soft-deleted records (deleted='y') not migrated
- [ ] Migration report generated

---

### Task 4: Create Concert Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist Schema), Task 2 (Shared Utilities)  
**Estimated Effort:** Medium

**Context:**
Concerts reference artists and include venue/ticket information.

**MySQL Schema:**
```
concerts: id, date, artist, band_pic_url, band_url, venue, ticketinfo, ticketurl, featured, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/concert.ts`:
   - `date` (date, required)
   - `artist` (reference to `artist`)
   - `artistName` (string - for display if no artist ref)
   - `image` (image)
   - `artistUrl` (url)
   - `venue` (string)
   - `ticketInfo` (string)
   - `ticketUrl` (url)
   - `featured` (boolean)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importConcerts.ts`
3. Migration should attempt to match artist by name

**Files to Modify:**
- `studio/schemaTypes/concert.ts` (create)
- `studio/schemaTypes/index.ts` (update)
- `bin/migrations/importConcerts.ts` (create)
- `package.json` (add script)

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Migration links to existing Artist when name matches
- [ ] Falls back to artistName string when no match
- [ ] Validation errors reported for manual review

---

### Task 5: Create Music Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist Schema), Task 2 (Shared Utilities)  
**Estimated Effort:** Small

**Context:**
Music entries are new song additions with artist and streaming URL.

**MySQL Schema:**
```
music: id, artist, song, url, date, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/music.ts`:
   - `artist` (reference to `artist`)
   - `artistName` (string - fallback)
   - `song` (string, required)
   - `url` (url)
   - `date` (date)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importMusic.ts`

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Migration links to Artist when possible
- [ ] Validation errors reported

---

### Task 6: Create Content Block Schema (Unified Story + CustomText)

**Status:** 🔲 Not Started  
**Depends On:** Task 2 (Shared Utilities)  
**Estimated Effort:** Medium

**Context:**
`Story` and `CustomText` tables serve similar purposes: rich content blocks with optional images and dates. Combining them into a unified `contentBlock` model simplifies the content model.

**MySQL Schemas:**
```
stories: id, start_date, end_date, headline, story, pic, pic_url, priority, deleted
custom_texts: id, name, content, deleted
```

**Requirements:**
1. Analyze both tables to understand usage patterns
2. Create `studio/schemaTypes/contentBlock.ts`:
   - `title` (string, required)
   - `slug` (slug)
   - `content` (Portable Text)
   - `image` (image)
   - `startDate` (date)
   - `endDate` (date)
   - `priority` (number)
   - `blockType` (string: 'story' | 'custom')
   - `_legacyId`, `_migratedAt`, `_legacyTable`
3. Create `bin/migrations/importContentBlocks.ts` that handles both tables

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] HTML content converted to Portable Text
- [ ] Both Story and CustomText records migrated
- [ ] `_legacyTable` tracks source table

---

### Task 7: Create Schedule Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 2 (Shared Utilities)  
**Estimated Effort:** Small

**Context:**
Schedule entries link to DJs and define show times.

**MySQL Schema:**
```
schedule: id, date, day, start_time, end_time, host, note, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/schedule.ts`:
   - `date` (date)
   - `day` (string)
   - `startTime` (string - time format)
   - `endTime` (string - time format)
   - `host` (reference to `dj`)
   - `hostName` (string - fallback)
   - `note` (text)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importSchedule.ts`
3. Match host to DJ by name

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] DJ references linked when name matches
- [ ] Validation errors reported

---

### Task 8: Create CdOfTheWeek Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist), Task 2 (Utilities)  
**Estimated Effort:** Medium

**Context:**
Album reviews with rich text content.

**MySQL Schema:**
```
cdotw: id, artist, title, label, review, cd_pic_url, band, reviewer, date, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/cdOfTheWeek.ts`:
   - `artist` (reference to `artist`)
   - `artistName` (string - fallback)
   - `title` (string, required)
   - `label` (string)
   - `review` (Portable Text)
   - `coverImage` (image)
   - `reviewer` (string)
   - `date` (date)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importCdOfTheWeek.ts`
3. Convert HTML review to Portable Text

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Review HTML converted to Portable Text
- [ ] Cover images migrated to Sanity assets

---

### Task 9: Create OnDemand Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 2 (Shared Utilities)  
**Estimated Effort:** Small

**Context:**
On-demand audio content entries.

**MySQL Schema:**
```
ondemand: id, date, image, headline, note, songs, audio_url, source, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/onDemand.ts`:
   - `date` (date)
   - `image` (image)
   - `headline` (string, required)
   - `note` (text)
   - `songs` (text)
   - `audioUrl` (url)
   - `source` (string)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importOnDemand.ts`

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Images migrated to Sanity assets
- [ ] Validation errors reported

---

### Task 10: Create MRM Configuration Singleton

**Status:** 🔲 Not Started  
**Depends On:** None  
**Estimated Effort:** Small

**Context:**
Modern Rock Madness needs a configuration singleton for tournament settings (currently in `_mrm_config.php`).

**Requirements:**
1. Create `studio/schemaTypes/mrmConfig.ts`:
   - `startDate` (date)
   - `bracketPdfUrl` (url)
   - `bannerImageUrl` (url)
   - `isActive` (boolean)
2. Update `studio/deskStructure.ts` to show as singleton
3. Filter from default document list

**Files to Modify:**
- `studio/schemaTypes/mrmConfig.ts` (create)
- `studio/schemaTypes/index.ts` (update)
- `studio/deskStructure.ts` (update)

**Acceptance Criteria:**
- [ ] Config appears as singleton in Sanity Studio sidebar
- [ ] Only one config document can exist
- [ ] All fields editable

---

### Task 11: Create Top11 Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist), Task 2 (Utilities)  
**Estimated Effort:** Medium

**Context:**
Weekly top 11 chart with ranked songs.

**MySQL Schema:**
```
top11: placement, artist, song, note
top11songs, top11contest, top11message (related)
```

**Requirements:**
1. Create `studio/schemaTypes/top11.ts`:
   - `weekOf` (date, required)
   - `songs` (array of objects):
     - `placement` (number)
     - `artist` (reference to `artist`)
     - `artistName` (string - fallback)
     - `song` (string)
     - `note` (string)
2. Create `bin/migrations/importTop11.ts`

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Songs array maintains order
- [ ] Artist references linked when possible

---

### Task 12: Create MRM Match Schema

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist), Task 10 (MRM Config)  
**Estimated Effort:** High

**Context:**
Tournament bracket system with matches between artists. Don't migrate historical tournament data—only set up for future tournaments.

**Requirements:**
1. Create `studio/schemaTypes/mrmMatch.ts`:
   - `round` (number)
   - `region` (number)
   - `artist1` (reference to `artist`)
   - `artist1Votes` (number)
   - `artist2` (reference to `artist`)
   - `artist2Votes` (number)
   - `winner` (reference to `artist`)
   - `startTime` (datetime)
   - `endTime` (datetime)
   - `sponsor` (string)
   - `sponsorMessage` (text)
2. No migration script needed (fresh start each year)

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Can create tournament brackets
- [ ] Artist references work correctly

---

### Task 13: Add Feature Flag for Sanity Reading

**Status:** 🔲 Not Started  
**Depends On:** Multiple schemas completed  
**Estimated Effort:** Medium

**Context:**
Before cutting over, the PHP site needs to read from Sanity behind a feature flag for testing.

**Requirements:**
1. Create PHP utility to check feature flag
2. Create Sanity client wrapper for PHP
3. Update one page (e.g., deejays.php) to read from Sanity when flag enabled
4. Document how to enable/disable flag

**Acceptance Criteria:**
- [ ] Feature flag can be toggled via config
- [ ] Page renders correctly from both sources
- [ ] No visual difference between MySQL and Sanity data

---

## Shared Utilities

### File Structure

```
bin/migrations/
├── shared/
│   ├── index.ts           # Barrel exports
│   ├── imageUploader.ts   # Upload images to Sanity
│   ├── richTextConverter.ts # HTML → Portable Text
│   ├── validation.ts      # Record validation
│   ├── logger.ts          # Consistent logging
│   └── upsert.ts          # Upsert by _legacyId
├── config.ts              # Environment config (existing)
├── database.ts            # MySQL connection (existing)
├── sanity.ts              # Sanity client (existing)
├── importDeejays.ts       # DJ migration (existing)
├── importAds.ts           # Ad migration
├── importConcerts.ts      # Concert migration
└── ...
```

### Upsert Pattern

```typescript
// bin/migrations/shared/upsert.ts
import type { SanityClient } from '@sanity/client';

export async function upsertDocument(
  client: SanityClient,
  documentType: string,
  legacyId: number,
  data: Record<string, unknown>
): Promise<{ created: boolean; updated: boolean; id: string }> {
  // 1. Query for existing document by _legacyId
  const existing = await client.fetch(
    `*[_type == $documentType && _legacyId == $legacyId][0]`,
    { documentType, legacyId }
  );

  if (existing) {
    // 2. Update existing document
    const result = await client.patch(existing._id).set(data).commit();
    return { created: false, updated: true, id: result._id };
  } else {
    // 3. Create new document
    const result = await client.create({
      _type: documentType,
      _legacyId: legacyId,
      _migratedAt: new Date().toISOString(),
      ...data,
    });
    return { created: true, updated: false, id: result._id };
  }
}
```

---

## Frontend Cutover Strategy

### Phase A: Feature Flag Testing

1. Implement feature flag in PHP config
2. Update pages to check flag and read from Sanity
3. Test thoroughly with flag enabled
4. Fix any rendering issues

### Phase B: Incremental Migration

1. Run upsert migrations regularly
2. Monitor for validation errors
3. Manually fix any issues
4. Verify record counts match

### Phase C: Full Cutover

1. Run final migration
2. Verify all data in Sanity
3. Enable feature flag for all users
4. Train site owners on Sanity Studio
5. Archive MySQL (keep read-only backup)

---

## Success Criteria

### Per-Model Checklist

For each model migration, verify:

- [ ] Sanity schema created and working
- [ ] Migration script runs without errors
- [ ] Record counts match (excluding soft-deleted)
- [ ] All images accessible in Sanity
- [ ] Rich text displays correctly
- [ ] References resolve properly
- [ ] Can create/edit in Sanity Studio

### Project Completion Criteria

- [ ] All schemas created and functional
- [ ] All migrations complete with reports
- [ ] Feature flag tested thoroughly
- [ ] Site owners trained on Sanity Studio
- [ ] PHP site reading from Sanity in production
- [ ] MySQL archived as backup

---

## Migration Reports

Generate a report for each migration in `docs/migrations/reports/`:

```markdown
# [Model] Migration Report

**Date:** YYYY-MM-DD
**Status:** Complete | Partial | Failed

## Summary
- Records in MySQL: X
- Records migrated: Y
- Records skipped: Z
- Validation errors: N

## Skipped Records
| Legacy ID | Reason |
|-----------|--------|
| 123 | Invalid URL |

## Validation Errors
| Legacy ID | Field | Error |
|-----------|-------|-------|
| 456 | pic_url | 404 Not Found |

## Notes
Any additional observations or manual fixes needed.
```

---

## Quick Reference

### Run Migrations

```bash
# Install dependencies
npm install

# Run specific migration
npm run import:deejays
npm run import:ads
npm run import:concerts
# etc.
```

### Sanity Studio

```bash
# Start dev server
npm run sanity:dev

# Build for production
npm run sanity:build

# Deploy
npm run sanity:deploy
```

### Useful GROQ Queries

```groq
// Count documents by type
*[_type == "artist"] | length

// Find documents missing _legacyId
*[_type == "artist" && !defined(_legacyId)]

// Find documents by legacy ID (hardcoded example)
*[_type == "artist" && _legacyId == 123][0]

// Parameterized version (for use in code)
// client.fetch('*[_type == $docType && _legacyId == $id][0]', { docType: 'artist', id: 123 })
```
