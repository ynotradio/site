# Incremental Import System

## Overview

The incremental import system tracks the last imported MySQL ID for the collections that still need nightly sync and only imports **new** records on subsequent runs.

## Files

- **`bin/incremental-import.ts`** - Main incremental import script
- **`.last-import-ids.json`** - Tracking file (git-ignored) that stores last imported IDs
- **`config/databases.ts`** - Centralized database configuration

## Usage

### First Time Setup

On first run, the script will start from ID 0 for Stories, Custom Texts, and Schedule:

```bash
# Import from local Docker MySQL to production Neon (default)
yarn import:incremental

# Or explicitly specify source and target
yarn import:incremental --from local-mysql --to prod-neon
```

This creates `.last-import-ids.json` with the highest imported IDs.

### Subsequent Imports

Run the same command to import only **new** records added since the last import:

```bash
yarn import:incremental
```

The script will:

1. Check MySQL for records with IDs higher than what's in `.last-import-ids.json`
2. Import only those new records
3. Update `.last-import-ids.json` with the new highest IDs

### Import from Production MySQL

To import from production MySQL to production Neon:

```bash
yarn import:incremental --from prod-mysql --to prod-neon
```

**Note**: Requires `.env.production.mysql` with production MySQL credentials.

### Reset and Re-import Everything

To start over and import all records:

```bash
yarn import:incremental --from local-mysql --to prod-neon --reset
```

## Command Line Options

| Option | Description |
| ------ | ----------- |
| `--from SOURCE` | MySQL source: `local-mysql` (default) or `prod-mysql` |
| `--to TARGET` | Neon target: `prod-neon` (default) or `local-postgres` |
| `--reset` | Reset tracking and import all data |
| `--verbose` | Show detailed output including skip reasons |

## How It Works

### Tracking

The script maintains a JSON file with last imported IDs:

```json
{
  "stories": 647,
  "customTexts": 251,
  "schedule": 1842,
  "lastUpdated": "2026-01-11T05:00:00.000Z"
}
```

### Duplicate Prevention

The individual import scripts already skip records where `legacyId` exists in Payload. The incremental import adds an additional optimization layer by only checking MySQL records with higher IDs.

### No Updates

**Important**: This system does NOT update existing records. If a record with a given `legacyId` already exists in Payload, it will be skipped. This is by design.

## Comparison with quick-import

| Feature            | `yarn import:quick`        | `yarn import:incremental`   |
| ------------------ | -------------------------- | --------------------------- |
| Filters by         | Event date (last N months) | MySQL ID (new records only) |
| Re-checks existing | Yes (slow)                 | No (fast)                   |
| Tracking           | None                       | `.last-import-ids.json`     |
| Best for           | Initial bulk import        | Daily/regular updates       |
| Speed              | Slow on repeat runs        | Fast on repeat runs         |

## Recommended Workflow

1. **Initial import**: Use the full import scripts when bringing a collection over
2. **Daily updates**: Use `yarn import:incremental` to catch new Stories, Custom Texts, and Schedule records
3. **After manual DB changes**: Use `--reset` if tracking gets out of sync

## Output

The script provides clear output showing:

- MySQL source and Neon target
- Last imported IDs from tracking file
- New records available in MySQL
- Import progress for Stories, Custom Texts, and Schedule
- Final summary with updated tracking

Example output:

```
🚀 Incremental Import Script
   MySQL Source: local-mysql
   Neon Target:  prod-neon
   Tracking file: .last-import-ids.json

📋 Loaded last import IDs from 2026-01-11T05:00:00.000Z

📊 New records available:
   Stories:      12
   Custom Texts: 1
   Schedule:     4
   TOTAL:      17

✅ Import Summary
   Posts: 13 imported, 0 skipped
   Schedule: 4 imported, 0 skipped
   ...
```

## Troubleshooting

### No new records found but you know there are new ones

Check if `.last-import-ids.json` has incorrect IDs. You can:

1. Manually edit the file to lower IDs
2. Delete the file and let it start from 0
3. Use `--reset` to start fresh

### Imports running but 0 records imported

This means the records already exist in Payload (same `legacyId`). The incremental import correctly identified new MySQL records, but they were already imported previously.

### Tracking file missing

The script will create a new one starting from ID 0, which will check all records.

### Production MySQL connection fails

Ensure you have `.env.production.mysql` with the correct credentials:

```bash
PROD_MYSQL_HOST=your-production-mysql-hostname.amazonaws.com
PROD_MYSQL_PORT=3306
PROD_MYSQL_DATABASE=ynot_site
PROD_MYSQL_USER=readonly_user
PROD_MYSQL_PASSWORD=your-secure-password
```
