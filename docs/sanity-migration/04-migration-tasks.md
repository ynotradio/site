# Chapter 4: Migration Tasks

[← Back to Index](./README.md)

---

Each task below is designed to be **self-contained** for cold-start agent conversations. Tasks include all necessary context and can be completed independently.

---

## Task 1: Create Artist Schema

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

## Task 2: Create Shared Migration Utilities

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

## Task 3: Create Ad Schema and Migration

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

## Task 4: Create Venue Schema

**Status:** 🔲 Not Started  
**Depends On:** None  
**Estimated Effort:** Small

**Context:**
Venues are locations where concerts take place. Editors can select from a dropdown or create a new venue on the fly.

**Requirements:**
1. Create `studio/schemaTypes/venue.ts` with fields:
   - `name` (string, required)
   - `slug` (slug from name, required)
   - `address` (string)
   - `city` (string)
   - `website` (url)
   - `_legacyId` (number, readOnly)
   - `_migratedAt` (datetime, readOnly)
2. Add to `studio/schemaTypes/index.ts`
3. Test in Sanity Studio

**Files to Modify:**
- `studio/schemaTypes/venue.ts` (create)
- `studio/schemaTypes/index.ts` (update)

**Acceptance Criteria:**
- [ ] Schema compiles without errors
- [ ] Can create/edit Venue in Sanity Studio
- [ ] Can be selected in dropdown from Concert form

---

## Task 5: Create Concert Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist Schema), Task 2 (Shared Utilities), Task 4 (Venue Schema)  
**Estimated Effort:** Medium

**Context:**
Concerts reference artists and venues. Artist image and website come from the Artist record—no duplicate fields needed.

**MySQL Schema:**
```
concerts: id, date, artist, band_pic_url, band_url, venue, ticketinfo, ticketurl, featured, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/concert.ts`:
   - `date` (date, required)
   - `artist` (reference to `artist`, required) - image/url come from artist
   - `venue` (reference to `venue`, required)
   - `ticketInfo` (string)
   - `ticketUrl` (url)
   - `featured` (boolean)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importConcerts.ts`
3. Migration must create Artist record if not found (or fail with report)
4. Migration must create Venue record if not found

**Files to Modify:**
- `studio/schemaTypes/concert.ts` (create)
- `studio/schemaTypes/index.ts` (update)
- `bin/migrations/importConcerts.ts` (create)
- `package.json` (add script)

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Artist reference is required (no fallback string)
- [ ] Venue reference is required (create on the fly if needed)
- [ ] Migration creates missing Artist/Venue records or fails with report
- [ ] Validation errors reported for manual review

---

## Task 6: Create Music Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist Schema), Task 2 (Shared Utilities)  
**Estimated Effort:** Small

**Context:**
Music entries are new song additions with artist and streaming URL. Artist is always required—create one if it doesn't exist.

**MySQL Schema:**
```
music: id, artist, song, url, date, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/music.ts`:
   - `artist` (reference to `artist`, required)
   - `song` (string, required)
   - `url` (url)
   - `date` (date)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importMusic.ts`
3. Migration must create Artist record if not found (or fail with report)

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Artist reference is required (no fallback string)
- [ ] Migration creates missing Artist records or fails with report
- [ ] Validation errors reported

---

## Task 7: Create Content Block Schema (Unified Story + CustomText)

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

## Task 8: Create Schedule Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 2 (Shared Utilities)  
**Estimated Effort:** Small

**Context:**
Schedule entries link to DJs and define show times. The `day` field is redundant since it can be derived from the `date` field.

**MySQL Schema:**
```
schedule: id, date, day, start_time, end_time, host, note, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/schedule.ts`:
   - `date` (date, required) - day of week derived from this
   - `startTime` (string - time format)
   - `endTime` (string - time format)
   - `host` (reference to `dj`, required)
   - `note` (text)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importSchedule.ts`
3. Migration must match host to DJ by name (or fail with report)

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] DJ reference is required (no fallback string)
- [ ] Migration matches DJ by name or fails with report
- [ ] Validation errors reported

---

## Task 9: Create CdOfTheWeek Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist), Task 2 (Utilities)  
**Estimated Effort:** Medium

**Context:**
Album reviews with rich text content. Artist is always required—create one if it doesn't exist.

**MySQL Schema:**
```
cdotw: id, artist, title, label, review, cd_pic_url, band, reviewer, date, deleted
```

**Requirements:**
1. Create `studio/schemaTypes/cdOfTheWeek.ts`:
   - `artist` (reference to `artist`, required)
   - `title` (string, required)
   - `label` (string)
   - `review` (Portable Text)
   - `coverImage` (image)
   - `reviewer` (string)
   - `date` (date)
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importCdOfTheWeek.ts`
3. Migration must create Artist record if not found (or fail with report)
4. Convert HTML review to Portable Text

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Artist reference is required (no fallback string)
- [ ] Review HTML converted to Portable Text
- [ ] Cover images migrated to Sanity assets

---

## Task 10: Create OnDemand Schema and Migration

**Status:** 🔲 Not Started  
**Depends On:** Task 1 (Artist Schema), Task 2 (Shared Utilities)  
**Estimated Effort:** Small

**Context:**
On-demand audio content entries. Can reference artists or DJs depending on the content type.

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
   - `artist` (reference to `artist`) - optional, for artist-related content
   - `dj` (reference to `dj`) - optional, for DJ-related content
   - `_legacyId`, `_migratedAt`
2. Create `bin/migrations/importOnDemand.ts`
3. Migration should attempt to match artist/dj by name if possible

**Acceptance Criteria:**
- [ ] Schema works in Sanity Studio
- [ ] Images migrated to Sanity assets
- [ ] Can link to Artist or DJ as appropriate
- [ ] Validation errors reported

---

## Task 11: Add Feature Flag for Sanity Reading

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
