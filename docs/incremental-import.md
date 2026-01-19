# Incremental Import System

## Overview

The incremental import system tracks the last imported MySQL ID for each collection and only imports **new** records on subsequent runs. This is much faster than re-checking all records from the last 3 months.

## Files

- **`bin/incremental-import.ts`** - Main incremental import script
- **`.last-import-ids.json`** - Tracking file (git-ignored) that stores last imported IDs

## Usage

### First Time Setup

On first run, the script will start from ID 0 for all collections:

```bash
yarn import:incremental --env dev
```

This creates `.last-import-ids.json` with the highest imported IDs.

### Subsequent Imports

Run the same command to import only **new** records added since the last import:

```bash
yarn import:incremental --env dev
```

The script will:

1. Check MySQL for records with IDs higher than what's in `.last-import-ids.json`
2. Import only those new records
3. Update `.last-import-ids.json` with the new highest IDs

### Production Imports

To import to production Neon database:

```bash
yarn import:incremental --env prod
```

### Reset and Re-import Everything

To start over and import all records:

```bash
yarn import:incremental --env dev --reset
```

## How It Works

### Tracking

The script maintains a JSON file with last imported IDs:

```json
{
  "music": 5421,
  "concerts": 4486,
  "posts": 647,
  "ondemand": 519,
  "cdotw": 839,
  "ads": 55,
  "djs": 78,
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

1. **Initial import**: Use `yarn import:quick --all` to import everything
2. **Daily updates**: Use `yarn import:incremental` to catch new records
3. **After manual DB changes**: Use `--reset` if tracking gets out of sync

## Output

The script provides clear output showing:

- Last imported IDs from tracking file
- New records available in MySQL
- Import progress for each collection
- Final summary with updated tracking

Example output:

```
📋 Loaded last import IDs from 2026-01-11T05:00:00.000Z

📊 New records available:
   Music:      1
   Concerts:   9
   Posts:      105
   DJs:        6
   TOTAL:      122

✅ Import Summary
   Music: 1 imported, 0 skipped
   Concerts: 9 imported, 0 skipped
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
