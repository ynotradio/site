# Manual Testing Guide for Database Copy Scripts

This guide walks through testing the database copy scripts in a safe way.

## Prerequisites

1. Set up your `.env.local` file with both dev and prod database URLs:
```bash
cp .env.example .env.local
# Edit .env.local and add:
NEON_DEV_DATABASE_URL=postgres://user:pass@ep-dev.neon.tech/neondb
NEON_PROD_DATABASE_URL=postgres://user:pass@ep-prod.neon.tech/neondb
```

2. Ensure you have data in at least one database (preferably dev for testing)

## Testing Steps

### 1. Verify Script Help Output

Test that the script shows usage when called incorrectly:

```bash
# Should show usage message
tsx bin/copy-neon-db.ts

# Should show error about same source/target
tsx bin/copy-neon-db.ts dev dev
```

Expected output: Clear error messages and usage instructions.

### 2. Test Database Connection and Analysis (Dry Run)

Test the script up to the confirmation prompt (don't confirm):

```bash
# For dev → prod
tsx bin/copy-neon-db.ts dev prod
# When prompted, type 'no' to cancel

# For prod → dev
tsx bin/copy-neon-db.ts prod dev
# When prompted, type 'no' to cancel
```

Expected output:
- ✅ Successfully connects to both databases
- ✅ Shows table counts for source and target
- ✅ Lists source tables
- ✅ Shows warning messages
- ✅ Asks for confirmation
- ✅ Exits cleanly when you say 'no'

### 3. Test Copy Operation (Safe Test: Dev → Dev Copy via Temp Database)

For the first real test, you might want to:

**Option A: Use a temporary test database**
1. Create a temporary database in Neon (free tier)
2. Set it as NEON_DEV_DATABASE_URL temporarily
3. Run the copy from your real dev to this temp database
4. Verify the results
5. Delete the temp database

**Option B: Backup and test with dev → prod**

⚠️ **WARNING: Only do this if you're okay with replacing prod data**

```bash
# Make sure you understand what will happen
yarn db:copy-dev-to-prod

# When prompted:
# - Read the warnings carefully
# - Type 'yes' to proceed
# - Watch the progress output
```

Expected output:
1. Shows table analysis
2. Creates dump (you'll see pg_dump output)
3. Clears target database
4. Restores dump (you'll see psql output)
5. Verifies table count
6. Shows success message

### 4. Verify Results

After a successful copy, verify the target database:

```bash
# Check what's in the target database
tsx bin/verify-schema.ts

# Or connect directly
psql "<target-database-url>"
# Then run:
# \dt   -- List tables
# SELECT COUNT(*) FROM <table_name>;  -- Check data
```

### 5. Test Wrapper Scripts

Test the convenience wrapper scripts:

```bash
# Test dev to prod wrapper (cancel at prompt)
./bin/copy-dev-to-prod.sh
# Type 'no' to cancel

# Test prod to dev wrapper (cancel at prompt)
./bin/copy-prod-to-dev.sh
# Type 'no' to cancel

# Test via yarn/npm
yarn db:copy-dev-to-prod
# Type 'no' to cancel
```

### 6. Test Error Handling

Test that errors are handled gracefully:

```bash
# Test with invalid environment variable (temporarily rename .env.local)
mv .env.local .env.local.backup
tsx bin/copy-neon-db.ts dev prod
# Should show clear error about missing database URL
mv .env.local.backup .env.local

# Test with invalid database credentials
# Temporarily edit .env.local with wrong password, run script
# Should show connection error
```

## Test Checklist

Use this checklist when testing:

- [ ] Script shows usage when called incorrectly
- [ ] Script prevents copying database to itself
- [ ] Script connects to both databases successfully
- [ ] Script shows accurate table counts
- [ ] Script lists source tables
- [ ] Warning messages are clear and prominent
- [ ] Confirmation prompt works correctly
- [ ] Script exits cleanly when user says 'no'
- [ ] Copy operation creates dump successfully
- [ ] Copy operation clears target database
- [ ] Copy operation restores dump successfully
- [ ] Script verifies table count after copy
- [ ] Script cleans up temporary files
- [ ] Wrapper scripts work correctly
- [ ] Yarn/npm scripts work correctly
- [ ] Error handling is graceful

## Common Issues and Solutions

### Issue: "Cannot find module 'pg'"

**Solution:** Install dependencies
```bash
yarn install
```

### Issue: "pg_dump: command not found"

**Solution:** Install PostgreSQL client tools
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### Issue: "FATAL: password authentication failed"

**Solution:** Verify your database credentials in `.env.local`

### Issue: "SSL connection required"

**Solution:** Neon requires SSL. The script handles this automatically. If you see this error, check that your connection string is correct and Neon is accessible.

## Production Deployment Testing

Before using in production:

1. ✅ Test the script thoroughly in development
2. ✅ Verify all error cases are handled
3. ✅ Create a backup of production data (use Neon's backup features)
4. ✅ Test the script during a maintenance window
5. ✅ Have a rollback plan (Neon restore from backup)
6. ✅ Monitor the operation closely
7. ✅ Verify data integrity after copy

## Automated Testing (GitHub Actions)

The weekly workflow can be tested by:

1. Triggering it manually via GitHub UI:
   - Go to Actions tab
   - Select "Weekly DB Sync (Prod → Dev)"
   - Click "Run workflow"
   - Monitor the logs

2. Verifying the schedule is correct:
   - Check `.github/workflows/weekly-db-sync.yml`
   - Cron: `0 2 * * 1` = Monday at 2 AM UTC

3. Ensuring secrets are set:
   - Go to repository Settings → Secrets and variables → Actions
   - Verify `NEON_PROD_DATABASE_URL` and `NEON_DEV_DATABASE_URL` are set

## Success Criteria

A successful test shows:
- ✅ Clear, informative output at each step
- ✅ No errors during execution
- ✅ Target database has same number of tables as source
- ✅ Spot-check: Sample data in target matches source
- ✅ Temporary files are cleaned up
- ✅ Script exits with code 0

## Troubleshooting Failed Tests

If a test fails:

1. **Check the error message** - The script provides detailed error messages
2. **Verify database connectivity** - Use `psql` to test connection directly
3. **Check permissions** - Ensure you have write access to target database
4. **Review logs** - Look for any warnings or errors in the output
5. **Check disk space** - Ensure `/tmp` has enough space for the dump file
6. **Try with smaller database** - Test with a smaller dataset first

## Reporting Issues

If you encounter issues:

1. Include the full error output (redact passwords!)
2. Note the source and target databases
3. Mention the size of the source database
4. Include Node.js and PostgreSQL client versions
5. Describe what you expected vs. what happened
