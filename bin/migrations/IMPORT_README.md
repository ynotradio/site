# Data Import Scripts

This directory contains scripts for importing data from the legacy MySQL database into the new Payload CMS PostgreSQL database.

## Overview

The import scripts migrate data from MySQL tables to Payload collections while:
- **Normalizing denormalized data**: Extracting artist/venue names from strings into separate collections
- **Preserving legacy IDs**: For tracking and idempotent imports
- **Creating relationships**: Between collections (e.g., artists, venues, DJs)
- **Enriching data**: With external services (e.g., MusicBrainz IDs for artists)
- **Supporting incremental imports**: With `--start-id` option for large datasets

## Key Architecture Note

The MySQL database has a **denormalized schema** where artist names, venue names, etc. are stored as text fields. The Payload CMS has a **normalized relational schema** where these are separate collections with relationships.

**Migration strategy**: Import scripts dynamically create artist/venue/people records as they encounter new names during import, avoiding duplicates through deduplication logic.

## Prerequisites

1. **Environment Setup**: Create a `.env` file in `bin/migrations/` with database credentials:

```env
# Legacy MySQL database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ynot_site

# Development PostgreSQL database (if using local)
DATABASE_URI=postgres://user:pass@localhost:5432/ynot_payload_dev

# Neon PostgreSQL databases
NEON_DEV_DATABASE_URL=postgres://user:pass@ep-dev.neon.tech/neondb
NEON_PROD_DATABASE_URL=postgres://user:pass@ep-prod.neon.tech/neondb
```

2. **Install Dependencies**:
```bash
yarn install
```

3. **Database Access**: Ensure you have access to both the legacy MySQL database and target PostgreSQL (Neon) database.

## MySQL Database Schema

The actual MySQL tables available for import:

| MySQL Table | Active Records | Description |
|-------------|---------------|-------------|
| `deejays` | 84 | Radio host information |
| `concerts` | 4,386 | Concert listings with artist/venue names |
| `cdotw` | 845 | CD of the Week album reviews |
| `music` | 5,369 | New music tracks |
| `ondemand` | 516 | On-demand audio content |
| `ads` | - | Sponsor advertisements |
| `stories` | - | Featured stories |
| `custom_texts` | - | Custom content blocks |

**Tables that do NOT exist**: `people`, `artists`, `venues`, `records`, `songs`, `shows`
These are created dynamically during import as destination Payload collections.

## Import Order

Import scripts should be run in this order to satisfy dependencies:

### Phase 1: Foundation Collections (No Dependencies)

```bash
# Ads - sponsor advertisements
npx tsx bin/migrations/importAds.ts --env dev

# Posts - content blocks (stories and custom text)
npx tsx bin/migrations/importPosts.ts --env dev

# OnDemand - audio content
npx tsx bin/migrations/importOnDemand.ts --env dev
```

### Phase 2: Core Data with Dynamic Creation

```bash
# DJs - creates People + DJs collections from deejays table
npx tsx bin/migrations/importDJs.ts --env dev

# Concerts - creates Concerts + Artists + Venues collections from concerts table
npx tsx bin/migrations/importConcerts.ts --env dev

# CD of the Week - creates CdOfTheWeek + Records + Artists collections from cdotw table
npx tsx bin/migrations/importCdOfTheWeek.ts --env dev
```

### Phase 3: New Music

```bash
# Music - creates Songs + Artists collections from music table
npx tsx bin/migrations/importMusic.ts --env dev

```

## Available Import Scripts

### ✅ importAds.ts
Imports sponsor advertisements.

**Source**: MySQL `ads` table  
**Target**: Payload `ads` collection  
**Fields**: name, startDate, endDate, imageUrl, webUrl, priority

```bash
npx tsx bin/migrations/importAds.ts --env dev
npx tsx bin/migrations/importAds.ts --env prod --start-id 100
```

### ✅ importPosts.ts
Imports content blocks (unified Story + CustomText).

**Source**: MySQL `stories` and `custom_texts` tables  
**Target**: Payload `posts` collection  
**Fields**: headline, startDate, endDate, content (Lexical), imageUrl, priority  
**Features**: HTML to Lexical conversion

```bash
npx tsx bin/migrations/importPosts.ts --env dev
```

### ✅ importDJs.ts
Imports DJ records and dynamically creates linked Person records.

**Source**: MySQL `deejays` table  
**Target**: Payload `djs` + `people` collections  
**Creates**: Person record for each DJ (from `deejays.name`)  
**Fields**: person (relationship), description (richText), email, externalConnectText, externalConnectUrl, onAir, sortOrder

```bash
npx tsx bin/migrations/importDJs.ts --env dev
```

### ✅ importConcerts.ts
Imports concert listings with dynamic artist and venue creation.

**Source**: MySQL `concerts` table  
**Target**: Payload `concerts` + `artists` + `venues` collections  
**Creates**: 
- Artist records from `concerts.artist` field (deduplicated)
- Venue records from `concerts.venue` field (deduplicated)
- Concert records linking to artists and venues

**Features**: Artist name parsing, MusicBrainz enrichment

```bash
npx tsx bin/migrations/importConcerts.ts --env dev
```

See [CONCERTS_IMPORT_README.md](./CONCERTS_IMPORT_README.md) for detailed documentation.

### ✅ importCdOfTheWeek.ts
Imports album review entries with dynamic record and artist creation.

**Source**: MySQL `cdotw` table  
**Target**: Payload `cd_of_the_week` + `records` + `artists` collections  
**Creates**: 
- Artist records from `cdotw.artist` field (deduplicated)
- Record (album) records from `cdotw.title` field (deduplicated)
- CD of the Week records linking to records and artists

**Fields**: record (relationship), review (Lexical), reviewer, date  
**Features**: HTML to Lexical conversion

```bash
npx tsx bin/migrations/importCdOfTheWeek.ts --env dev
```

### ✅ importOnDemand.ts
Imports on-demand audio content.

**Source**: MySQL `ondemand` table  
**Target**: Payload `ondemand` collection  
**Fields**: headline, note, songs, audioUrl, imageUrl, date

```bash
npx tsx bin/migrations/importOnDemand.ts --env dev
```

### ✅ importMusic.ts
Imports music tracks with dynamic artist creation.

**Source**: MySQL `music` table (5,369 active records)  
**Target**: Payload `songs` + `artists` collections  
**Creates**: 
- Artist records from `music.artist` field (deduplicated)
- Song records from `music.song` field

**Fields**: title, slug, artist (relationship), streamUrl, releaseDate, featureOnNewMusic

```bash
npx tsx bin/migrations/importMusic.ts --env dev
npx tsx bin/migrations/importMusic.ts --env prod --start-id 1000
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
Provides MySQL connection and query functions.

**Key Functions**:
- `connectToDatabase()` - Establish MySQL connection
- `getActiveDeejays()` - Fetch active DJ records from `deejays` table
- `getActiveConcerts()` - Fetch active concerts from `concerts` table
- `getActiveCdOfTheWeek()` - Fetch active CD of the Week entries from `cdotw` table
- `getActiveOnDemand()` - Fetch active on-demand items from `ondemand` table
- `getActiveAds()` - Fetch active ads from `ads` table
- `getActivePosts()` - Fetch active posts from `stories`/`custom_texts` tables

### shared/payloadClient.ts
Provides Payload connection and helper functions.

**Key Functions**:
- `getPayloadClient(env)` - Get Payload instance for dev/prod
- `findOrCreateArtist(payload, name, legacyId)` - Upsert artist with MusicBrainz enrichment
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
Ensure `.env` file exists in `bin/migrations/` directory with correct database URLs.

### "MySQL connection failed"
Check that MySQL server is running and credentials are correct in `.env` file.

### "Table 'ynot_site.X' doesn't exist"
The script is trying to query a non-existent MySQL table. Refer to this README for actual available tables.

### "Legacy ID already exists"
This is normal - the record was already imported. The script skips it automatically.

### "Artist/DJ/Record not found"
Run dependent imports first. See [Import Order](#import-order) above.

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
npx tsx bin/migrations/importAds.ts --env prod
npx tsx bin/migrations/importDJs.ts --env prod
npx tsx bin/migrations/importConcerts.ts --env prod
npx tsx bin/migrations/importCdOfTheWeek.ts --env prod
# ... etc
```

## Migration Status

| Script | Status | Source Table | Destination Collection(s) |
|--------|--------|--------------|---------------------------|
| importAds.ts | ✅ Ready + Tested | `ads` | `ads` |
| importPosts.ts | ✅ Ready + Tested | `stories`, `custom_texts` | `posts` |
| importDJs.ts | ✅ Ready + Tested | `deejays` | `djs`, `people` |
| importConcerts.ts | ✅ Ready + Tested | `concerts` | `concerts`, `artists`, `venues` |
| importCdOfTheWeek.ts | ✅ Ready + Tested | `cdotw` | `cd_of_the_week`, `records`, `artists` |
| importOnDemand.ts | ✅ Ready + Tested | `ondemand` | `ondemand` |
| importMusic.ts | ✅ Ready + Tested | `music` | `songs`, `artists` |

## Related Documentation

- [CONCERTS_IMPORT_README.md](./CONCERTS_IMPORT_README.md) - Detailed concerts import documentation
- [ARTIST_CLEANUP_SPEC.md](./ARTIST_CLEANUP_SPEC.md) - Artist name normalization
- [MUSICBRAINZ_INTEGRATION.md](./MUSICBRAINZ_INTEGRATION.md) - MusicBrainz enrichment
- [../../docs/payload-migration/03-core-data-models.md](../../docs/payload-migration/03-core-data-models.md) - Payload collection schemas
