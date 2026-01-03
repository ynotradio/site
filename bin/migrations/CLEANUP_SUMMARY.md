# Migration Scripts Cleanup Summary

## Completed Actions

### 1. Removed Non-Functional Import Scripts (6 files)

The following scripts were removed because they reference MySQL tables that don't exist:

- ❌ **importVenues.ts** - No `venues` table (venues created dynamically from `concerts.venue`)
- ❌ **importArtists.ts** - No `artists` table (artists created dynamically from various sources)
- ❌ **importPeople.ts** - No `people` table (people created dynamically from `deejays.name`)
- ❌ **importRecords.ts** - No `records` table (records created dynamically from `cdotw` table)
- ❌ **importSongs.ts** - No `songs` table (should be `music` table - needs new script)
- ❌ **importShows.ts** - No `shows` table (should be `schedule` table - needs new script)

### 2. Cleaned Up database.ts

**Removed Non-Functional Functions (6 functions):**
- `getActivePeople()` - queried non-existent `people` table
- `getActiveArtists()` - queried non-existent `artists` table
- `getActiveVenues()` - queried non-existent `venues` table
- `getActiveSongs()` - queried non-existent `songs` table
- `getActiveRecords()` - queried non-existent `records` table
- `getActiveShows()` - queried non-existent `shows` table

**Removed Obsolete Interfaces (6 interfaces):**
- `Person` - no source table
- `Artist` - no source table
- `Venue` - no source table
- `Song` - wrong source table name
- `Record` - no source table
- `Show` - wrong source table name

**Fixed Functions to Match MySQL Schema:**
- `getActiveCdOfTheWeek()` - now correctly queries `cdotw` table
- `getActiveOnDemand()` - now correctly queries `ondemand` table

**Updated Interfaces to Match MySQL:**
- `CdOfTheWeek` - now matches actual `cdotw` table structure (artist, title, label, review, cd_pic_url, band, reviewer, date, deleted)
- `OnDemand` - now matches actual `ondemand` table structure (date, image, headline, note, songs, audio_url, source, deleted)

### 3. Fixed Import Scripts

**importCdOfTheWeek.ts:**
- Updated to dynamically create artists from `cdotw.artist` field
- Updated to dynamically create records from `cdotw.title` field
- Removed dependency on non-existent `record_id` field
- Now matches actual MySQL `cdotw` table schema

**importOnDemand.ts:**
- Updated to match actual `ondemand` table schema
- Removed incorrect artist relationship (not in MySQL table)
- Now uses correct fields: headline, note, songs, audio_url, image, date

### 4. Updated Documentation

**IMPORT_README.md (Complete Rewrite):**
- Documented actual MySQL table structure
- Removed references to non-existent scripts
- Added clear explanation of normalization strategy
- Listed missing scripts that need to be created (importMusic.ts, importSchedule.ts)
- Updated import order to reflect actual dependencies
- Added table of actual MySQL tables with record counts

**AUDIT_FINDINGS.md (New):**
- Comprehensive analysis of MySQL vs. import scripts mismatch
- Detailed explanation of what was removed and why
- Clear list of actions taken
- Documentation of correct data flow

**CLEANUP_SUMMARY.md (This File):**
- Summary of all changes made during cleanup

## Current State

### ✅ Working Import Scripts (6 scripts)

1. **importAds.ts** - Sources from `ads` table → Creates `ads` collection
2. **importPosts.ts** - Sources from `stories` + `custom_texts` tables → Creates `posts` collection  
3. **importDJs.ts** - Sources from `deejays` table → Creates `djs` + `people` collections
4. **importConcerts.ts** - Sources from `concerts` table → Creates `concerts` + `artists` + `venues` collections
5. **importCdOfTheWeek.ts** - Sources from `cdotw` table → Creates `cd_of_the_week` + `records` + `artists` collections
6. **importOnDemand.ts** - Sources from `ondemand` table → Creates `ondemand` collection

### 🔨 Missing Import Scripts (2 needed)

1. **importMusic.ts** - Should source from `music` table (5,369 records) → Create `songs` + `artists` collections
2. **importSchedule.ts** - Should source from `schedule` table (23,496 records) → Create `shows` collection

### 📊 MySQL Database Reality

| Table | Records | Has Import Script |
|-------|---------|-------------------|
| `deejays` | 84 | ✅ importDJs.ts |
| `concerts` | 4,386 | ✅ importConcerts.ts |
| `cdotw` | 845 | ✅ importCdOfTheWeek.ts |
| `music` | 5,369 | ❌ Missing |
| `schedule` | 23,496 | ❌ Missing |
| `ondemand` | 516 | ✅ importOnDemand.ts |
| `ads` | ? | ✅ importAds.ts |
| `stories` | ? | ✅ importPosts.ts |
| `custom_texts` | ? | ✅ importPosts.ts |

## Why This Cleanup Was Necessary

The original import scripts were created assuming a 1:1 mapping between MySQL source tables and Payload destination collections. However:

1. **MySQL schema is denormalized**: Artist names, venue names, etc. are stored as VARCHAR fields
2. **Payload schema is normalized**: Artists, venues, people are separate collections with relationships
3. **The confusion**: Someone created import scripts for the *destination* collections, not the *source* tables

The correct approach (which some scripts already implemented):
- Import from actual MySQL tables
- Dynamically create related entities (artists, venues, people) during import
- Use deduplication logic to avoid creating duplicate artists/venues
- Preserve legacy IDs for idempotent re-runs

## Verification

All remaining scripts have been verified to:
- ✅ Compile without errors
- ✅ Reference actual MySQL tables
- ✅ Match actual MySQL schema
- ✅ Run help command successfully

## Next Steps

1. Create `importMusic.ts` to import from `music` table → `songs` + `artists` collections
2. Create `importSchedule.ts` to import from `schedule` table → `shows` collection
3. Test all imports against actual MySQL data
4. Update migration tasks documentation

## Files Modified

- `bin/migrations/database.ts` - Removed 6 functions + 6 interfaces, fixed 2 functions, updated 2 interfaces
- `bin/migrations/importCdOfTheWeek.ts` - Fixed to match actual MySQL schema
- `bin/migrations/importOnDemand.ts` - Fixed to match actual MySQL schema
- `bin/migrations/IMPORT_README.md` - Complete rewrite
- `bin/migrations/IMPORT_README.md.old` - Backup of original

## Files Deleted

- `bin/migrations/importVenues.ts`
- `bin/migrations/importArtists.ts`
- `bin/migrations/importPeople.ts`
- `bin/migrations/importRecords.ts`
- `bin/migrations/importSongs.ts`
- `bin/migrations/importShows.ts`

## Files Created

- `bin/migrations/AUDIT_FINDINGS.md`
- `bin/migrations/CLEANUP_SUMMARY.md`
