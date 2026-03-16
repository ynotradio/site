# Migration Scripts Audit Findings

## Executive Summary

After auditing the MySQL database structure against the import scripts, **6 out of 13 import scripts** do not map to actual MySQL tables and should be removed. The data they were meant to import is created as a side-effect of other import processes.

## MySQL Database Reality

### Actual Tables (that exist)
- `deejays` (84 active records)
- `cdotw` (845 active records) 
- `music` (5,369 active records)
- `schedule` (23,496 active records)
- `concerts` (4,386 active records)
- `ondemand` (516 active records)
- `stories` (with deleted column)
- `custom_texts` (without deleted column)
- `ads` (with deleted column)

### Missing Tables (referenced by scripts but don't exist)
- `venues` - venue names are embedded in `concerts.venue` field
- `artists` - artist names are embedded in multiple tables (`concerts.artist`, `cdotw.artist`, `music.artist`)
- `people` - no separate table, names in `deejays.name`
- `records` - album info embedded in `cdotw` table
- `songs` - should use `music` table instead
- `shows` - should use `schedule` table instead

## Import Scripts Analysis

### ❌ Scripts to REMOVE (no source data)

1. **importVenues.ts**
   - References: `venues` table (doesn't exist)
   - Reality: Venues created by `importConcerts.ts` from `concerts.venue` field
   - Action: DELETE

2. **importArtists.ts**
   - References: `artists` table (doesn't exist)
   - Reality: Artists created dynamically by:
     - `importConcerts.ts` from `concerts.artist`
     - `importCdOfTheWeek.ts` from `cdotw.artist`
     - New music import from `music.artist`
   - Action: DELETE

3. **importPeople.ts**
   - References: `people` table (doesn't exist)
   - Reality: People created by `importDJs.ts` from `deejays.name`
   - Action: DELETE

4. **importRecords.ts**
   - References: `records` table (doesn't exist)
   - Reality: Records created by `importCdOfTheWeek.ts` from `cdotw` table
   - Action: DELETE

5. **importSongs.ts**
   - References: `songs` table (doesn't exist)
   - Reality: Should use `music` table instead
   - Has `getActiveSongs()` function that queries wrong table
   - Action: DELETE (will be replaced by importMusic.ts)

6. **importShows.ts**
   - References: `shows` table (doesn't exist)  
   - Reality: Should use `schedule` table instead
   - Has `getActiveShows()` function that queries wrong table
   - Action: DELETE (will be replaced by importSchedule.ts)

### ✅ Scripts to KEEP (have source data)

1. **importConcerts.ts** ✓
   - Source: `concerts` table
   - Creates: concerts, artists (dynamic), venues (dynamic)
   - Status: Working

2. **importCdOfTheWeek.ts** ✓
   - Source: `cdotw` table
   - Creates: cd_of_the_week, records (dynamic), artists (dynamic)
   - Status: Needs verification

3. **importDJs.ts** ✓
   - Source: `deejays` table
   - Creates: djs, people (dynamic)
   - Status: Needs table name verification

4. **importOnDemand.ts** ✓
   - Source: `ondemand` table
   - Creates: on_demand
   - Status: Needs verification

5. **importAds.ts** ✓
   - Source: `ads` table
   - Creates: ads
   - Status: Needs verification

6. **importPosts.ts** ✓
   - Source: `stories` and `custom_texts` tables
   - Creates: posts (unified content blocks)
   - Status: Needs verification

### 🔨 Scripts MISSING (need to be created)

1. **importMusic.ts** (NEW)
   - Source: `music` table
   - Creates: songs, artists (dynamic)
   - Replaces: importSongs.ts

2. **importSchedule.ts** (NEW)
   - Source: `schedule` table
   - Creates: shows
   - Replaces: importShows.ts

## Database.ts Functions Audit

### ❌ Functions to REMOVE
- `getActivePeople()` - queries non-existent `people` table
- `getActiveArtists()` - queries non-existent `artists` table
- `getActiveVenues()` - queries non-existent `venues` table
- `getActiveRecords()` - queries non-existent `records` table
- `getActiveSongs()` - queries non-existent `songs` table (should be `music`)
- `getActiveShows()` - queries non-existent `shows` table (should be `schedule`)

### ✅ Functions to KEEP
- `getActiveDeejays()` - queries `deejays` table ✓
- `getActiveConcerts()` - queries `concerts` table ✓
- `getActiveCdOfTheWeek()` - queries `cdotw` table ✓
- `getActiveOnDemand()` - queries `ondemand` table ✓
- `getActiveAds()` - queries `ads` table ✓
- `getActivePosts()` - queries `stories`/`custom_texts` tables ✓

### 🔨 Functions to ADD
- `getActiveMusic()` - query `music` table
- `getActiveSchedule()` - query `schedule` table

## Correct Import Flow

Based on the documentation and actual database structure:

### Phase 1: Foundation (no dependencies)
1. `importAds.ts` - from `ads` table
2. `importPosts.ts` - from `stories` + `custom_texts` tables
3. `importOnDemand.ts` - from `ondemand` table

### Phase 2: Core Data with Dynamic Creation
4. `importDJs.ts` - from `deejays` → creates `people` + `djs`
5. `importConcerts.ts` - from `concerts` → creates `concerts` + `artists` + `venues`
6. `importCdOfTheWeek.ts` - from `cdotw` → creates `cd_of_the_week` + `records` + `artists`
7. `importMusic.ts` (NEW) - from `music` → creates `songs` + `artists`

### Phase 3: Schedule (depends on DJs)
8. `importSchedule.ts` (NEW) - from `schedule` → creates `shows` (references djs)

## Recommended Actions

1. **Delete 6 non-functional import scripts**
2. **Delete 6 database.ts functions** that query non-existent tables
3. **Create 2 new import scripts**: importMusic.ts, importSchedule.ts
4. **Update IMPORT_README.md** to reflect actual structure
5. **Update database.ts interfaces** to match actual MySQL schema
6. **Test remaining scripts** against actual MySQL database

## Data Model Clarification

The confusion arose from treating the destination Payload collections as if they mapped 1:1 to source MySQL tables. In reality:

- **MySQL schema**: Denormalized, artist/venue names stored as strings
- **Payload schema**: Normalized, artists/venues are separate collections
- **Migration approach**: Extract and deduplicate artist/venue names during import

This is correct design - the import scripts normalize the data during migration.
