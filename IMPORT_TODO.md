# Import TODO List

## Current Status

### ✅ Successfully Completed Imports
- **Music**: 67/67 songs (last 3 months) - All successful
- **DJs**: 83/84 (1 skipped due to bad email) - From previous session
- **Concerts**: 308/308 - All successful, created Artists and Venues as side effect
- **OnDemand**: 3/3 - Fixed validation issues
- **CD of the Week**: 9/9 - Fixed validation issues
- **Ads**: 2/2 - All successful
- **Shows**: 291/291 (last 30 days) - All successful, DJ matching fixed
- **Posts**: 797/681 (117%) - Import COMPLETE! Includes 761 stories and 35 custom_texts

### 🔲 Remaining Import Tasks
1. ✅ **DJ Photos** - 82/83 DJs have photos (98.8%) - One corrupt image for DJ 75 (manual fix needed)
2. **Custom Text Images** - Import images from custom_texts posts to media collection  
3. **Legacy Images** - Full migration of all images to Cloudinary (concert pics, post images, etc.)
4. **Historical Data** - Optionally import full historical data (currently filtered to last 3 months)

---

## Issues Fixed

### 1. ✅ OnDemand Import - FIXED
**Problem**: Import script passes text string to `songs` field, which is now a relationship array.

**Solution Applied**:
- Added `findDJByDisplayName()` helper to search DJs by displayName
- Added `parseOnDemandHeadline()` to extract DJ/artist names from headlines
- Updated `importOnDemand.ts` to populate `djs` and `artists` relationship arrays
- Songs field left empty (would require parsing free-form text)

**Files modified**:
- `bin/migrations/shared/payloadClient.ts`
- `bin/migrations/importOnDemand.ts`

---

### 2. ✅ CD of the Week Import - FIXED
**Problem**: "Reviewer" and "Review" fields failing validation

**Solution Applied**:
- Added `findOrCreatePerson()` helper call to find/create Person for reviewer name
- Handle empty reviews with placeholder richText content (required field)

**Files modified**:
- `bin/migrations/importCdOfTheWeek.ts`

---

### 3. ✅ Posts Import - COMPLETED (January 11, 2026)
**Status**: 797/681 posts imported (117% of active posts target)

**Journey**:
- Started at 28% success rate due to link validation failures
- Fixed Lexical link node structure to use `fields.linkType`, `fields.url`, `fields.newTab`
- Fixed target attribute extraction bug
- Final result: 761 stories + 35 custom_texts (100% of active posts, plus 129 deleted posts)

**Files Fixed**:
- `bin/migrations/shared/importUtils.ts` - Link structure + target attribute fix
- `bin/migrations/shared/enhancedHtmlToLexical.ts` - Same fixes + embed block UUIDs
- `bin/migrations/shared/enhancedHtmlToLexical.test.ts` - Updated tests

**Documentation**:
- See `IMPORT_STATUS.md` for comprehensive summary
- See `LINK_VALIDATION_FIX.md` for technical details of the link fix

---

### 4. ✅ Ads Import - COMPLETED
**Status**: 2/2 successful

---

### 5. ✅ Shows Import - DJ Matching Fixed
**Problem**: Shows were not linking to DJ records because the host field contains formatted strings like `<i>Transmission</i> w/ Rob Huff`

**Solution Applied**:
- Added `parseHostString()` function to extract show name and DJ name from host field
- Parse "w/" and "with" patterns to extract DJ names
- Use `findDJByDisplayName()` to match DJs by display name
- Set both `name` (show name) and `host` (DJ relationship) fields correctly

**Files modified**:
- `bin/migrations/importSchedule.ts`
- `bin/migrations/importSchedule.test.ts`

---

### 6. ✅ Quick Import Script Hanging - FIXED
**Problem**: Import scripts didn't exit after completion, causing quick-import.ts to hang

**Solution Applied**:
- Added `.then(() => process.exit(0))` to all import scripts
- Scripts now exit cleanly after successful completion

**Files modified**:
- `bin/migrations/importAds.ts`
- `bin/migrations/importCdOfTheWeek.ts`
- `bin/migrations/importConcerts.ts`
- `bin/migrations/importMusic.ts`
- `bin/migrations/importOnDemand.ts`
- `bin/migrations/importPosts.ts`
- `bin/migrations/importSchedule.ts`

---

### 7. ✅ Quick Import Reporting - COMPLETED
**Feature**: Added comprehensive pre/post-import reporting to quick-import.ts

**Functionality Added**:
- Pre-import report showing expected record counts from MySQL
  - Displays total records and date-filtered counts for each collection
  - Handles both 'n'/'y' and 'no'/'yes' deleted column values
  - Shows 3-month window for most collections, 30 days for Shows
- Post-import summary showing results table
  - Expected vs actual counts comparison
  - Success/skip/error counts per collection
  - Status indicators (✅/❌) for each import
  - Error details section showing first 5 errors per collection
- Capture and parse import script output for detailed reporting
  - Extracts "Migration Summary" statistics
  - Captures error messages from stdout/stderr

**Files modified**:
- `bin/quick-import.ts`

**SQL Reference**:
- `bin/migrations/count_expected_imports.sql` - Manual query for expected counts

---

## Notes

### Artist/Venue Creation
- Artists and Venues do NOT have legacyId fields (intentional)
- They are created fresh during imports, searched by name only
- MBID duplicate errors are handled with retry logic

### Database State
- Single initial migration applied: `payload/migrations/20260110_191747.ts`
- 52 tables created
- Relationship tables for OnDemand: `ondemand_rels`, `_ondemand_v_rels`

### Date Filtering (3-month window)
```
music       → Start from ID 5345
concerts    → Start from ID 4175
stories     → Start from ID 18
ondemand    → Start from ID 520
cdotw       → Start from ID 839
ads         → Start from ID 56
```

---

## Your Notes

[Add your notes here]

