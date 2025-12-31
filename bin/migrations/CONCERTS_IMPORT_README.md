# Concerts Import Script

This script imports concert data from the legacy MySQL database into the Payload CMS PostgreSQL database.

## Features

- **Artist Name Normalization**: Uses the `artistCleaner` utility to intelligently parse and normalize artist names
- **Upsert Logic**: Automatically creates artists and venues if they don't exist, or reuses existing ones
- **Legacy ID Tracking**: Prevents duplicate imports by tracking legacy MySQL IDs
- **Incremental Imports**: Can start from a specific concert ID for efficient re-runs
- **Database Environment Selection**: Choose between dev and prod PostgreSQL databases
- **Progress Logging**: Shows detailed progress during import

## Prerequisites

1. Set up your `.env.local` file with the required database connection strings:
   ```
   # Development database
   DATABASE_URI=postgres://user:pass@localhost:5432/ynot_payload_dev
   NEON_DEV_DATABASE_URL=postgres://user:pass@ep-dev.neon.tech/neondb
   
   # Production database
   NEON_PROD_DATABASE_URL=postgres://user:pass@ep-prod.neon.tech/neondb
   
   # Legacy MySQL database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=ynot_site
   ```

2. Ensure you have access to the legacy MySQL database with concert data

## Usage

### Basic Import (Development)

Import all concerts to the development database:

```bash
tsx bin/migrations/importConcerts.ts --env dev
```

### Production Import

Import to production database:

```bash
tsx bin/migrations/importConcerts.ts --env prod
```

### Incremental Import

Start importing from a specific concert ID (useful for re-runs):

```bash
tsx bin/migrations/importConcerts.ts --env dev --start-id 1000
```

This will import all concerts with ID >= 1000.

### Help

Display usage information:

```bash
tsx bin/migrations/importConcerts.ts --help
```

## How It Works

1. **Connect to Databases**: Connects to both MySQL (source) and PostgreSQL (destination)

2. **Fetch Concerts**: Retrieves active (non-deleted) concerts from MySQL, optionally filtered by start ID

3. **Process Each Concert**:
   - Check if concert already imported (by legacy ID)
   - Parse artist string using `artistCleaner` to extract normalized artist names
   - Find or create the primary artist in PostgreSQL
   - Find or create the venue in PostgreSQL
   - Create the concert record with relationships to artist and venue
   - Store legacy ID and migration timestamp

4. **Log Progress**: Shows progress every 10 records and a final summary

## Artist Name Processing

The script uses the `artistCleaner` utility which handles:

- HTML tag removal
- HTML entity decoding  
- Multiple artists separated by commas, "and", "&", etc.
- Special formats like "Artist ft. Guest Artist"
- Event names like "Festival ft. Artist1, Artist2"
- Custom titles like "Artist (Album Release Show)"

For concerts with multiple artists, the script uses the first artist as the primary artist (since the Concerts collection has a single artist relationship).

## Data Mapping

MySQL → PostgreSQL field mapping:

- `id` → `legacyId`
- `date` → `date`
- `artist` (string) → `artist` (relationship to Artists collection)
- `venue` (string) → `venue` (relationship to Venues collection)
- `ticketinfo` → `ticketInfo`
- `ticketurl` → `ticketUrl`
- `featured` ("Yes"/"No") → `featured` (boolean)
- Current timestamp → `migratedAt`

## Error Handling

- Skips concerts already imported (by legacy ID)
- Skips concerts with no valid artist names
- Logs errors for individual failed imports but continues processing
- Shows final statistics: total, success, skipped, errors

## Testing

Run the test suite:

```bash
npm test -- bin/migrations/importConcerts.test.ts bin/migrations/shared/payloadClient.test.ts
```

Tests cover:
- Command line argument parsing
- Artist and venue find-or-create logic
- Concert import with various data scenarios
- Error handling

## Performance

The script processes concerts sequentially to ensure data consistency. For large datasets:

1. Use `--start-id` to break imports into chunks
2. Monitor progress logs to estimate completion time
3. Consider running during off-peak hours for production imports

## Troubleshooting

### "Database URI not found"
Ensure your `.env.local` file has the correct database connection strings for the environment you selected.

### "Connected to database successfully" but no concerts imported
Check the MySQL database connection settings in `.env.local` and verify the MySQL server is accessible.

### Duplicate artist/venue entries
The script searches by name to find existing records. If names have slight variations (spaces, punctuation), duplicates may be created. Consider running a cleanup script afterwards.

## Related Files

- `bin/migrations/importConcerts.ts` - Main import script
- `bin/migrations/shared/payloadClient.ts` - Payload connection and upsert utilities
- `bin/migrations/shared/artistCleaner.ts` - Artist name normalization
- `bin/migrations/database.ts` - MySQL connection utilities
- `payload/src/collections/Concerts.ts` - Concert collection schema
- `payload/src/collections/Artists.ts` - Artist collection schema
- `payload/src/collections/Venues.ts` - Venue collection schema
