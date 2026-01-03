# Data Import Scripts

This directory contains scripts for importing data from the legacy MySQL database into the new Payload CMS PostgreSQL database.

## Overview

The import scripts migrate data from MySQL tables to Payload collections while:
- Preserving legacy IDs for tracking and idempotent imports
- Creating relationships between collections (e.g., artists, venues, DJs)
- Normalizing data formats (e.g., HTML to Lexical rich text)
- Enriching data with external services (e.g., MusicBrainz IDs for artists)
- Supporting incremental imports with `--start-id` option

## Prerequisites

1. **Environment Setup**: Create a `.env.local` file with database credentials:

```env
# Development PostgreSQL database
DATABASE_URI=postgres://user:pass@localhost:5432/ynot_payload_dev
NEON_DEV_DATABASE_URL=postgres://user:pass@ep-dev.neon.tech/neondb

# Production PostgreSQL database
NEON_PROD_DATABASE_URL=postgres://user:pass@ep-prod.neon.tech/neondb

# Legacy MySQL database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ynot_site
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Database Access**: Ensure you have access to both the legacy MySQL database and target PostgreSQL (Neon) database.

## Import Order

Import scripts should be run in this order to satisfy dependencies:

### 1. Foundation Collections (No Dependencies)
```bash
# People - base collection for individuals
tsx bin/migrations/importPeople.ts --env dev

# Artists - musicians and bands (includes MusicBrainz enrichment)
tsx bin/migrations/importArtists.ts --env dev

# Venues - concert locations
tsx bin/migrations/importVenues.ts --env dev

# Ads - sponsor advertisements
tsx bin/migrations/importAds.ts --env dev

# Posts - content blocks (stories and custom text)
tsx bin/migrations/importPosts.ts --env dev
```

### 2. Dependent Collections (Level 1)
```bash
# DJs - depends on People
tsx bin/migrations/importDJs.ts --env dev

# Songs - depends on Artists
tsx bin/migrations/importSongs.ts --env dev

# Records - depends on Artists
tsx bin/migrations/importRecords.ts --env dev

# OnDemand - depends on Artists
tsx bin/migrations/importOnDemand.ts --env dev

# Concerts - depends on Artists and Venues (already exists)
tsx bin/migrations/importConcerts.ts --env dev
```

### 3. Dependent Collections (Level 2)
```bash
# Shows - depends on DJs
tsx bin/migrations/importShows.ts --env dev

# CdOfTheWeek - depends on Records
tsx bin/migrations/importCdOfTheWeek.ts --env dev
```

## Script Documentation

### importPeople.ts
Imports individuals (musicians, DJs, etc.) to the People collection.

**Source**: MySQL `people` table  
**Target**: Payload `people` collection  
**Fields**: name, slug, bio, photo, legacyId, migratedAt

```bash
tsx bin/migrations/importPeople.ts --env dev
tsx bin/migrations/importPeople.ts --env prod --start-id 100
```

### importDJs.ts
Imports DJ records and links them to their Person records.

**Source**: MySQL `deejays` table  
**Target**: Payload `djs` collection  
**Dependencies**: People collection  
**Fields**: person (relationship), showName, email, externalConnectText, externalConnectUrl, onAir, sortOrder

```bash
tsx bin/migrations/importDJs.ts --env dev
```

### importArtists.ts
Imports artists with MusicBrainz enrichment for additional metadata.

**Source**: MySQL `artists` table  
**Target**: Payload `artists` collection  
**Fields**: name, slug, bio, website, musicbrainzId, legacyId, migratedAt  
**Features**: Automatic MusicBrainz ID lookup

```bash
tsx bin/migrations/importArtists.ts --env dev
```

### importVenues.ts
Imports concert venue information.

**Source**: MySQL `venues` table  
**Target**: Payload `venues` collection  
**Fields**: name, slug, address, city, website, legacyId, migratedAt

```bash
tsx bin/migrations/importVenues.ts --env dev
```

### importSongs.ts
Imports song catalog with artist relationships.

**Source**: MySQL `songs` table  
**Target**: Payload `songs` collection  
**Dependencies**: Artists collection  
**Fields**: title, slug, artist (relationship), streamUrl, releaseDate, featureOnNewMusic

```bash
tsx bin/migrations/importSongs.ts --env dev
```

### importRecords.ts
Imports album/record information.

**Source**: MySQL `records` table  
**Target**: Payload `records` collection  
**Dependencies**: Artists collection  
**Fields**: title, slug, artist (relationship), label, releaseDate, coverImage

```bash
tsx bin/migrations/importRecords.ts --env dev
```

### importAds.ts
Imports sponsor advertisements.

**Source**: MySQL `ads` table  
**Target**: Payload `ads` collection  
**Fields**: name, startDate, endDate, imageUrl, webUrl, priority

```bash
tsx bin/migrations/importAds.ts --env dev
```

### importPosts.ts
Imports content blocks (unified Story + CustomText).

**Source**: MySQL `posts` table  
**Target**: Payload `posts` collection  
**Fields**: headline, startDate, endDate, content (Lexical), imageUrl, priority  
**Features**: HTML to Lexical conversion

```bash
tsx bin/migrations/importPosts.ts --env dev
```

### importShows.ts
Imports show schedule entries.

**Source**: MySQL `shows` table  
**Target**: Payload `shows` collection  
**Dependencies**: DJs collection  
**Fields**: date, day, startTime, endTime, host (relationship), note

```bash
tsx bin/migrations/importShows.ts --env dev
```

### importOnDemand.ts
Imports on-demand audio content.

**Source**: MySQL `ondemand` table  
**Target**: Payload `ondemand` collection  
**Dependencies**: Artists collection  
**Fields**: title, artist (relationship), streamUrl

```bash
tsx bin/migrations/importOnDemand.ts --env dev
```

### importCdOfTheWeek.ts
Imports album review entries.

**Source**: MySQL `cdoftheweek` table  
**Target**: Payload `cdoftheweek` collection  
**Dependencies**: Records collection  
**Fields**: record (relationship), review (Lexical), reviewer, date  
**Features**: HTML to Lexical conversion

```bash
tsx bin/migrations/importCdOfTheWeek.ts --env dev
```

### importConcerts.ts (Existing)
Imports concert listings with artist and venue relationships.

**Source**: MySQL `concerts` table  
**Target**: Payload `concerts` collection  
**Dependencies**: Artists, Venues collections  
**Features**: Artist name parsing, MusicBrainz enrichment

See [CONCERTS_IMPORT_README.md](./CONCERTS_IMPORT_README.md) for details.

```bash
tsx bin/migrations/importConcerts.ts --env dev
```

## Common Options

All import scripts support the following command-line options:

- `--env <dev|prod>` - Target environment (default: dev)
- `--start-id <number>` - Start importing from specific MySQL ID (for incremental imports)
- `--help` or `-h` - Show help message

## Idempotent Imports

All scripts use `legacyId` tracking to make imports idempotent. You can safely re-run any script multiple times:

1. Script checks if record with `legacyId` already exists
2. If exists, skips import (logged as "skipped")
3. If not exists, imports record

This allows for safe incremental imports and recovery from failures.

## Error Handling

- **Individual Errors**: If a single record fails, the error is logged but import continues
- **Fatal Errors**: Database connection failures or other critical errors stop the import
- **Summary Statistics**: Each script reports total, success, skipped, and error counts

## Shared Utilities

### database.ts
Provides MySQL connection and query functions for all tables.

**Key Functions**:
- `connectToDatabase()` - Establish MySQL connection
- `getActivePeople()` - Fetch active people records
- `getActiveDeejays()` - Fetch active DJ records
- `getActiveArtists()` - Fetch active artist records
- `getActiveVenues()` - Fetch active venue records
- `getActiveSongs()` - Fetch active songs with artist info
- `getActiveRecords()` - Fetch active records with artist info
- `getActiveAds()` - Fetch active ads
- `getActivePosts()` - Fetch active posts
- `getActiveShows()` - Fetch active shows with DJ info
- `getActiveOnDemand()` - Fetch active on-demand items
- `getActiveCdOfTheWeek()` - Fetch active CD of the Week entries
- `getActiveConcerts()` - Fetch active concerts

### shared/payloadClient.ts
Provides Payload connection and helper functions.

**Key Functions**:
- `getPayloadClient(env)` - Get Payload instance for dev/prod
- `findOrCreateArtist(payload, name, legacyId)` - Upsert artist with MusicBrainz
- `findOrCreateVenue(payload, name, legacyId)` - Upsert venue
- `findOrCreatePerson(payload, name, legacyId)` - Upsert person
- `findDJByLegacyId(payload, legacyId)` - Find DJ by legacy ID
- `findOrCreateRecord(payload, title, artistId, legacyId)` - Upsert record

### shared/logger.ts
Provides consistent logging across all import scripts.

**Key Functions**:
- `createLogger(name)` - Create named logger
- `logProgress(current, total, message)` - Log progress indicator
- `logSummary(stats)` - Log final statistics

### shared/artistCleaner.ts
Parses and normalizes artist strings (used by Concerts import).

### shared/musicbrainz.ts
Fetches MusicBrainz IDs for artist enrichment.

### shared/validation.ts
Common validation utilities.

## Troubleshooting

### "Database URI not found"
Ensure `.env.local` has the correct database URLs for your environment.

### "MySQL connection failed"
Check that MySQL server is running and credentials are correct in `.env.local`.

### "Legacy ID already exists"
This is normal - the record was already imported. The script skips it automatically.

### "Artist/DJ/Record not found"
Run dependent imports first. See [Import Order](#import-order) above.

### Duplicate entries
If you see duplicates, likely due to name variations (spaces, punctuation). Run a cleanup script or manually merge duplicates in Payload Admin.

## Testing

Run tests for import scripts:

```bash
npm test -- bin/migrations
```

## Performance

- **Sequential Processing**: Scripts process records one at a time for data consistency
- **Incremental Imports**: Use `--start-id` to import in chunks
- **Progress Logging**: Shows progress every 10 records
- **Error Isolation**: Individual record errors don't stop the import

For large datasets (1000+ records), consider:
1. Running during off-peak hours
2. Using `--start-id` to break into smaller batches
3. Monitoring memory usage

## Production Deployment

1. **Test in Dev**: Always test imports in dev environment first
2. **Backup**: Create database backup before production import
3. **Monitor**: Watch logs for errors during production import
4. **Verify**: Check record counts and sample data after import
5. **Rollback Plan**: Keep MySQL backup for rollback if needed

```bash
# Production import example
tsx bin/migrations/importPeople.ts --env prod
tsx bin/migrations/importArtists.ts --env prod
# ... etc
```

## Migration Status

| Collection | Script | Status | Dependencies |
|------------|--------|--------|--------------|
| People | importPeople.ts | ✅ Ready | None |
| DJs | importDJs.ts | ✅ Ready | People |
| Artists | importArtists.ts | ✅ Ready | None |
| Venues | importVenues.ts | ✅ Ready | None |
| Songs | importSongs.ts | ✅ Ready | Artists |
| Records | importRecords.ts | ✅ Ready | Artists |
| Ads | importAds.ts | ✅ Ready | None |
| Posts | importPosts.ts | ✅ Ready | None |
| Shows | importShows.ts | ✅ Ready | DJs |
| OnDemand | importOnDemand.ts | ✅ Ready | Artists |
| CdOfTheWeek | importCdOfTheWeek.ts | ✅ Ready | Records |
| Concerts | importConcerts.ts | ✅ Ready | Artists, Venues |

## Related Documentation

- [CONCERTS_IMPORT_README.md](./CONCERTS_IMPORT_README.md) - Detailed concerts import documentation
- [ARTIST_CLEANUP_SPEC.md](./ARTIST_CLEANUP_SPEC.md) - Artist name normalization
- [MUSICBRAINZ_INTEGRATION.md](./MUSICBRAINZ_INTEGRATION.md) - MusicBrainz enrichment
- [../docs/READONLY_COLLECTIONS.md](../docs/READONLY_COLLECTIONS.md) - Collection schemas
- [../docs/payload-migration/04-migration-tasks.md](../docs/payload-migration/04-migration-tasks.md) - Migration plan
