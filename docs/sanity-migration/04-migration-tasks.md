# Chapter 4: Migration Tasks

[← Back to Index](./README.md)

---

Each task below is designed to be **self-contained** for cold-start agent conversations. Tasks include all necessary context and can be completed independently.

---

## Task 1: Create Artist Schema

**Status:** 🚧 Schema Complete (Testing Required)  
**Depends On:** None  
**Estimated Effort:** Small

**Context:**
The `artist` type replaces "band" as the generic content type for musicians. It will be referenced by Concert, Music, CdOfTheWeek, Top11, and Modern Rock Madness features.

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
- [x] Schema compiles without errors
- [ ] Can create/edit Artist in Sanity Studio (requires manual testing)
- [ ] Can link Person references to Artist (requires manual testing)
- [ ] Photo upload works with hotspot (requires manual testing)

---

## Task 2: Create Shared Migration Utilities

**Status:** ✅ Complete  
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
- [x] All utilities compile without TypeScript errors
- [x] Image uploader handles external URLs (e.g., Imgur)
- [x] Rich text converter produces valid Portable Text
- [x] Upsert finds existing records by `_legacyId`

---

## Task 3: Create Ad Schema and Migration

**Status:** ✅ Complete  
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
- [x] Schema works in Sanity Studio
- [x] Migration script runs without errors
- [x] Images migrated to Sanity assets
- [x] Soft-deleted records (deleted='y') not migrated
- [x] Migration report generated

---

## Task 4: Create Venue Schema

**Status:** ✅ Complete  
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
- [x] Schema compiles without errors
- [ ] Can create/edit Venue in Sanity Studio (requires manual testing)
- [ ] Can be selected in dropdown from Concert form (requires Concert schema)

---

## Task 5: Create Concert Schema and Migration

**Status:** ✅ Complete  
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
- [x] Schema works in Sanity Studio
- [x] Artist reference is required (no fallback string)
- [x] Venue reference is required (create on the fly if needed)
- [x] Migration creates missing Artist/Venue records or fails with report
- [x] Validation errors reported for manual review

---

## Task 6: Create Music Schema and Migration

**Status:** ✅ Schema Complete (via Song schema)  
**Depends On:** Task 1 (Artist Schema), Task 2 (Shared Utilities)  
**Estimated Effort:** Small

**Context:**
Music entries are new song additions with artist and streaming URL. Instead of creating a separate `music` schema, the existing **Song** schema (`studio/schemaTypes/song.ts`) handles this use case with a `featureOnNewMusic` toggle. See [03-core-data-models.md](./03-core-data-models.md#music--song-model) for details.

**MySQL Schema:**
```
music: id, artist, song, url, date, deleted
```

**Requirements:**
1. ✅ Song schema already exists at `studio/schemaTypes/song.ts` with:
   - `artists` (array of references to `artist`, required)
   - `title` (string, required) — maps to legacy `song`
   - `streamUrl` (url) — maps to legacy `url`
   - `releaseDate` (date) — maps to legacy `date`
   - `featureOnNewMusic` (boolean) — toggle to show on New Music page
   - `legacyId`, `migratedAt` — for migration tracking
2. Create `bin/migrations/importMusic.ts` to migrate legacy `music` table into Song documents
3. Migration must:
   - Set `featureOnNewMusic: true` for all imported records
   - Create Artist record if not found (or fail with report)

**Acceptance Criteria:**
- [x] Song schema works in Sanity Studio
- [x] `featureOnNewMusic` toggle added to Song schema
- [ ] Migration script `importMusic.ts` created
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

---

## Task 12: Create Top 11 Contest Schemas

**Status:** ✅ Done  
**Depends On:** Task 1 (Artist Schema), Song Schema  
**Estimated Effort:** Medium

**Context:**
The Top 11 is a weekly countdown contest where users vote for their favorite songs. This uses a hybrid architecture: Sanity stores contest configuration (songs, dates, rules) while Neon PostgreSQL stores high-volume voting data.

**Sanity Schemas:**
1. Created `studio/schemaTypes/top11Contest.ts`:
   - `title`, `slug`, `date` (contest date)
   - `votingOpensAt`, `votingClosesAt` (datetime)
   - `songs` (array of references to Song documents)
   - `summary` (portable text array for text, links, and Mixcloud embeds)
   - `status` ('draft' | 'open' | 'closed' | 'archived')
   - Document ID format: `top11-{year}-{month}-{date}` (e.g., `top11-2025-11-20`)
   - Max selections: Always 11 (hard-coded in application logic)
   - Write-ins: Always allowed (no schema field needed)

2. Created `studio/schemaTypes/top11Result.ts`:
   - `contest` (reference to top11Contest)
   - `placements` (array of objects with rank, song reference, artist reference, note)
   - `publishedAt` (datetime)

**Files Modified:**
- `studio/schemaTypes/top11Contest.ts` (created)
- `studio/schemaTypes/top11Result.ts` (created)
- `studio/schemaTypes/index.ts` (updated)
- `src/db/neon/schema.sql` (updated)
- `src/types/database.ts` (updated)
- `docs/sanity-migration/09-neon-integration-top11.md` (created)

**Acceptance Criteria:**
- [x] Schemas compile without errors
- [x] Can create/edit contests in Sanity Studio
- [x] Song references work correctly
- [x] Published results display correctly

---

## Task 13: Create Year End Poll Schemas

**Status:** ✅ Done  
**Depends On:** Task 1 (Artist Schema), Song Schema, Record Schema  
**Estimated Effort:** Medium

**Context:**
The Year End Poll is an annual multi-category poll where users vote for their favorite songs, albums, and artists of the year. This uses a hybrid architecture: Sanity stores poll configuration (categories, options) while Neon PostgreSQL stores high-volume voting data.

**Sanity Schemas:**
1. Created `studio/schemaTypes/yearEndPoll.ts`:
   - `title`, `year`
   - `votingOpensAt`, `votingClosesAt` (datetime)
   - `contestPrize` (prize description)
   - `status` ('draft' | 'open' | 'closed' | 'archived')
   - Document ID format: `yep-{year}` (e.g., `yep-2025`)

2. Created `studio/schemaTypes/yearEndPollCategory.ts`:
   - `poll` (reference to yearEndPoll)
   - `name`, `slug`, `categoryType` ('song' | 'album' | 'artist' | 'band')
   - `displayOrder`, `maxSelections`, `allowWriteIns`
   - `songOptions` / `albumOptions` / `artistOptions` (arrays based on type)
   - Document ID format: `yep-{year}-{categorySlug}` (e.g., `yep-2025-song-of-the-year`)

**Files Modified:**
- `studio/schemaTypes/yearEndPoll.ts` (created)
- `studio/schemaTypes/yearEndPollCategory.ts` (created)
- `studio/schemaTypes/index.ts` (updated)
- `src/db/neon/schema.sql` (updated)
- `src/types/database.ts` (updated)
- `docs/sanity-migration/10-neon-integration-yep.md` (created)

**Acceptance Criteria:**
- [x] Schemas compile without errors
- [x] Can create/edit polls and categories in Sanity Studio
- [x] Multiple category types supported
- [x] Options references work correctly based on category type

---

## Task 14: Create Modern Rock Madness Schemas

**Status:** ✅ Done  
**Depends On:** Task 1 (Artist Schema)  
**Estimated Effort:** Medium

**Context:**
Modern Rock Madness is an annual bracket-style tournament where users vote in head-to-head matchups between bands. This uses a hybrid architecture: Sanity stores tournament configuration (bands, brackets, matches) while Neon PostgreSQL stores high-volume voting data.

**Sanity Schemas:**
1. Created `studio/schemaTypes/modernRockMadnessTournament.ts`:
   - `title`, `year`
   - `status` ('draft' | 'active' | 'complete' | 'archived')
   - `rounds` (array with roundNumber, name, startsAt, endsAt)
   - Document ID format: `mrm-{year}` (e.g., `mrm-2025`)

2. Created `studio/schemaTypes/modernRockMadnessGroup.ts`:
   - `tournament` (reference to mrmTournament)
   - `artist` (reference to Artist)
   - `seed`, `region`, `placement`, `sponsor`, `abbreviation`

3. Created `studio/schemaTypes/modernRockMadnessMatch.ts`:
   - `tournament` (reference to mrmTournament)
   - `matchNumber`, `round`, `region`
   - `band1`, `band2` (references to mrmBand)
   - `winner` (reference to mrmBand, set after voting closes)
   - `startsAt`, `endsAt` (datetime for voting window)
   - `showScore`, `sponsor`, `sponsorMessage`
   - Document ID format: `mrm-{year}-match-{matchNumber}` (e.g., `mrm-2025-match-1`)

**Files Modified:**
- `studio/schemaTypes/modernRockMadnessTournament.ts` (created)
- `studio/schemaTypes/modernRockMadnessGroup.ts` (created)
- `studio/schemaTypes/modernRockMadnessMatch.ts` (created)
- `studio/schemaTypes/index.ts` (updated)
- `src/db/neon/schema.sql` (updated)
- `src/types/database.ts` (updated)
- `docs/sanity-migration/11-neon-integration-mrm.md` (created)

**Acceptance Criteria:**
- [x] Schemas compile without errors
- [x] Can create/edit tournaments, bands, and matches in Sanity Studio
- [x] References between tournament, bands, and matches work correctly
- [x] Match voting window and winner tracking supported

---

