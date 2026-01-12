# Neon Database Copy Scripts

This directory contains scripts to completely copy one Neon PostgreSQL database to another. This is useful for:

1. **Copying development data to production** - When you've imported and validated data in development and want to push it to production
2. **Copying production data to development** - For testing with real data or creating weekly backups

## Quick Start

### Copy Development → Production

```bash
# Using npm/yarn script (recommended)
yarn db:copy-dev-to-prod

# Or directly
./bin/copy-dev-to-prod.sh
```

### Copy Production → Development

```bash
# Using npm/yarn script (recommended)
yarn db:copy-prod-to-dev

# Or directly
./bin/copy-prod-to-dev.sh
```

## Requirements

### Environment Variables

You must set these in your `.env.local` file:

```bash
# Development database
NEON_DEV_DATABASE_URL=postgres://user:pass@ep-dev-xxxxx.neon.tech/neondb
# OR
DATABASE_URI=postgres://user:pass@ep-dev-xxxxx.neon.tech/neondb

# Production database
NEON_PROD_DATABASE_URL=postgres://user:pass@ep-prod-xxxxx.neon.tech/neondb
```

### System Requirements

- PostgreSQL client tools (`pg_dump`, `psql`) - These are pre-installed in the development environment
- Node.js with `tsx` for running TypeScript scripts

## Usage

### Using the Main Script

The main script allows flexible source and target selection:

```bash
# General syntax
tsx bin/copy-neon-db.ts <source> <target>

# Examples
tsx bin/copy-neon-db.ts dev prod    # Copy dev → prod
tsx bin/copy-neon-db.ts prod dev    # Copy prod → dev
```

### Using npm/yarn Scripts

```bash
# Copy development to production
yarn db:copy-dev-to-prod

# Copy production to development  
yarn db:copy-prod-to-dev

# Direct usage with custom arguments
yarn db:copy dev prod
```

## How It Works

The script performs the following steps:

1. **Validation**: Checks that source and target databases are configured and accessible
2. **Analysis**: Counts tables in both databases and displays information
3. **Confirmation**: Asks for explicit confirmation before proceeding (displays warning)
4. **Dump Creation**: Uses `pg_dump` to create a complete SQL dump of the source database
5. **Target Clearing**: Drops all tables in the target database (drops and recreates the public schema)
6. **Restoration**: Uses `psql` to restore the dump to the target database
7. **Verification**: Counts tables in the target to verify the operation
8. **Cleanup**: Removes temporary dump files

## Safety Features

- ✅ **Confirmation prompt** - Requires explicit "yes" confirmation before proceeding
- ✅ **Clear warnings** - Shows multiple warnings about data loss
- ✅ **Table counting** - Validates source has data and verifies restoration
- ✅ **Error handling** - Graceful error messages if something goes wrong
- ✅ **Cleanup** - Removes temporary files even if errors occur
- ✅ **Same database prevention** - Won't allow copying a database to itself

## Weekly Production → Development Sync

For a weekly job that copies production data down to development, you can set up a cron job or GitHub Actions workflow:

### Cron Job Example

```bash
# Run every Monday at 2 AM
0 2 * * 1 cd /path/to/site && yarn db:copy-prod-to-dev
```

### GitHub Actions Example

Create `.github/workflows/weekly-db-sync.yml`:

```yaml
name: Weekly DB Sync (Prod → Dev)

on:
  schedule:
    # Run every Monday at 2:00 AM UTC
    - cron: '0 2 * * 1'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync-database:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          
      - name: Install dependencies
        run: yarn install
        
      - name: Copy Production to Development
        env:
          NEON_PROD_DATABASE_URL: ${{ secrets.NEON_PROD_DATABASE_URL }}
          NEON_DEV_DATABASE_URL: ${{ secrets.NEON_DEV_DATABASE_URL }}
        run: |
          # Auto-confirm by piping 'yes' to the script
          echo "yes" | yarn db:copy-prod-to-dev
```

## Technical Details

### PostgreSQL Tools Used

- **pg_dump**: Creates a SQL dump of the source database
  - `--no-owner`: Skips ownership commands (compatible with Neon)
  - `--no-acl`: Skips access privileges (compatible with Neon)
  - `--clean`: Adds DROP statements before CREATE
  - `--if-exists`: Uses IF EXISTS with DROP statements

- **psql**: Restores the SQL dump to the target database
  - `--quiet`: Suppresses non-error output
  - `--no-psqlrc`: Doesn't read startup file

### Neon Compatibility

The scripts are designed to work with Neon PostgreSQL databases specifically:

- Uses SSL connections (`ssl: { rejectUnauthorized: true }`)
- Handles Neon-specific permissions (`neondb_owner`)
- Uses standard PostgreSQL tools (not Neon CLI) for maximum reliability
- Compatible with Neon's connection pooling

### Why Not Use Neon Branching?

While Neon has a branching feature, we use `pg_dump`/`psql` because:

1. **Universal compatibility** - Works with any PostgreSQL database, not just Neon
2. **No API dependencies** - Doesn't require Neon API credentials
3. **More control** - Fine-grained control over what's copied
4. **Better for production** - Industry-standard approach that's well-understood
5. **Flexibility** - Can easily extend to copy specific tables or filter data

## Troubleshooting

### "Database URL not found"

Ensure your `.env.local` file has the correct environment variables:
- `NEON_DEV_DATABASE_URL` or `DATABASE_URI` for development
- `NEON_PROD_DATABASE_URL` for production

### "Failed to create dump"

- Check that the source database is accessible
- Verify your database credentials are correct
- Ensure `pg_dump` is installed: `which pg_dump`

### "Failed to restore dump"

- Check that the target database is accessible
- Verify you have write permissions on the target database
- Check disk space on the system

### "Table count mismatch"

This warning appears if the target has a different number of tables than the source after restoration. This might be normal if:
- The source has views or sequences that weren't counted
- There were tables that couldn't be restored due to permissions

Check the output carefully to see if any errors occurred during restoration.

## Related Documentation

- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL psql Documentation](https://www.postgresql.org/docs/current/app-psql.html)
- [Project Environment Variables](../docs/ENVIRONMENT_VARIABLES.md)
