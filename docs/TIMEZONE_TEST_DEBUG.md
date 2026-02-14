# Timezone Boundary Test Debugging Log

## Problem Statement
E2E test for timezone boundary (PR #208 regression) is failing in CI despite multiple attempts to fix it.

## Test Objective
Verify that the `on_air()` function in PHP uses `date()` consistently (not a mix of `gmdate()`/`date()`), preventing timezone mismatches at UTC boundaries.

## What PR #208 Fixed
- **Bug**: Code mixed `gmdate('Y-m-d')` and `date('H:i:s')`, causing date mismatches at timezone boundaries
- **Fix**: Use `date('Y-m-d')` and `date('H:i:s')` consistently (both use America/New_York timezone)
- **Impact**: At 7 PM EST (midnight UTC), gmdate would look for Jan 30 schedule while date would look for Jan 29 schedule

## Current Test Approach (Commit 06cb1c7)

### Test Strategy
1. Insert show for Jan 29, 2026, 18:00-21:00 EST directly into Postgres
2. Use libfaketime to set PHP server time to Jan 29 19:00 EST (midnight UTC on Jan 30)
3. Verify on-air DJ appears on homepage (proves `date()` is used consistently)

### Code Analysis

**PHP Timezone Setup** (`src/functions/main_fns.php:2`):
```php
date_default_timezone_set('America/New_York');
```

**on_air() Function** (`src/functions/main_fns.php:160-188`):
```php
$todaySchedule = $scheduleModel->getByDate(date('Y-m-d'));  // Line 171
$currentTime = date('H:i:s');  // Line 174
```
✅ Both use `date()` - this is correct (PR #208 fix)

**Database Connection** (`src/functions/main_fns.php:21-40`):
- Connects to MySQL for legacy data
- Environment variables: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

## Attempts Made (17 commits)

### Attempt 1-2: Initial Test Creation
- Created basic test structure
- Fixed linting errors

### Attempt 3-4: Docker Time Manipulation
- Used `docker compose exec phpfpm date -s` to set container time
- **Issue**: Requires CAP_SYS_TIME capability

### Attempt 5-6: libfaketime Introduction
- Added faketime package to PHP Dockerfile
- Added LD_PRELOAD/FAKETIME env vars to docker-compose.yml
- **Issue**: Environment variables not applied to existing container

### Attempt 7: Container Recreation
- Added `docker compose rm -f phpfpm` before `docker compose up -d`
- **Issue**: Still not working

### Attempt 8: Environment Variable Passing
- Changed from `--env-file` to execSync `env` option
- **Issue**: Still failing

### Attempt 9: Simplified Test (Abandoned)
- Removed timezone test logic entirely
- User feedback: Unacceptable, must deliver the test

### Attempt 10: Restored libfaketime
- Re-added full libfaketime approach with container removal
- **Issue**: Still failing

### Attempt 11: Direct SQL Insert
- Replaced Payload UI interactions with direct Postgres SQL INSERT
- **Rationale**: UI was timing out looking for date picker options
- **Issue**: Test still failing in CI

## Potential Root Causes

### Hypothesis 1: libfaketime Not Working in PHP Container
**Evidence Needed:**
- Verify libfaketime is installed: `docker compose exec phpfpm ls -la /usr/lib/x86_64-linux-gnu/faketime/`
- Verify LD_PRELOAD is set in container: `docker compose exec phpfpm env | grep LD_PRELOAD`
- Test PHP sees mocked time: `docker compose exec phpfpm php -r "echo date('Y-m-d H:i:s');"`

**Test**: Add debug output to see what time PHP actually sees

### Hypothesis 2: Database Connection Issue
**Evidence Needed:**
- Verify show was inserted: `docker compose exec postgres psql -U ynot ynot_payload_dev -c "SELECT * FROM shows WHERE date = '2026-01-29';"`
- Verify PHP can read from Postgres: Check if `ScheduleFactory` connects to Postgres or MySQL

**Critical Question**: Does the PHP site read from Postgres or MySQL?
- `open_db()` function uses mysqli (MySQL)
- Test inserts into Postgres
- **POTENTIAL MISMATCH**: PHP might be reading from MySQL, not Postgres!

### Hypothesis 3: Schedule Model Implementation
**Evidence Needed:**
- Check `src/models/ScheduleFactory.php` - which database does it query?
- Check if it expects MySQL or Postgres schema
- Verify table structure matches INSERT statement

### Hypothesis 4: GitHub Actions Environment
**Evidence Needed:**
- Timezone in CI environment
- Docker networking in CI
- Container recreation behavior

## Next Steps

### Immediate Debugging Actions

1. **Verify Database Connection**
   ```php
   // Add to src/functions/main_fns.php temporarily
   error_log("on_air() database: " . print_r($db, true));
   error_log("on_air() query date: " . date('Y-m-d'));
   error_log("on_air() schedule count: " . count($todaySchedule));
   ```

2. **Verify libfaketime**
   ```typescript
   // In test, after setting fake time
   const envCheck = execSync(
     'docker compose exec -T phpfpm env | grep -E "(LD_PRELOAD|FAKETIME)"',
     { cwd: process.cwd(), encoding: 'utf-8' }
   );
   console.log('Container environment:', envCheck);
   ```

3. **Verify Show Data**
   ```typescript
   // Check both databases
   const pgShow = execSync(
     'docker compose exec -T postgres psql -U ynot ynot_payload_dev -c "SELECT * FROM shows WHERE date = \'2026-01-29\';"',
     { cwd: process.cwd(), encoding: 'utf-8' }
   );
   console.log('Postgres show:', pgShow);
   
   const mysqlShow = execSync(
     'docker compose exec -T mysql mysql -u ynot -pynot ynot -e "SELECT * FROM schedule WHERE date = \'2026-01-29\';"',
     { cwd: process.cwd(), encoding: 'utf-8' }
   );
   console.log('MySQL show:', mysqlShow);
   ```

4. **Add Data Attributes to HTML**
   ```php
   // In header.php or wherever #on-air is rendered
   <div id="on-air" 
        data-debug-date="<?php echo date('Y-m-d'); ?>"
        data-debug-time="<?php echo date('H:i:s'); ?>"
        data-debug-schedule-count="<?php echo count($todaySchedule ?? []); ?>">
   ```

### Critical Questions to Answer

1. ✅ **SOLVED**: Does PHP connect to Postgres or MySQL for schedule data?
   - **Answer**: MySQL! The `use_postgres_schedule` feature flag is `false` in `src/config/features.php`
   - **Root Cause Found**: Test inserts into Postgres, but PHP reads from MySQL
   - **Fix**: Either enable the feature flag OR insert into MySQL instead

2. ❓ Is libfaketime actually loaded in the PHP container?
3. ❓ What time does PHP see when libfaketime is active?
4. ❓ Does the show data exist in the database PHP queries?
5. ✅ **EXPLAINED**: What does `ScheduleFactory` actually do?
   - Checks `use_postgres_schedule` feature flag
   - If true: Uses PostgresSchedule (Payload CMS data from shows table)
   - If false: Uses SqlSchedule (MySQL legacy data from schedule table)

## Test Results Tracking

### Local Environment
- Status: Not fully tested locally yet
- Reason: Long setup time, focused on CI iterations

### CI Environment  
- Status: ❌ Failing
- Error: (Need to check latest CI logs)

## ROOT CAUSE IDENTIFIED! 🎯

**Problem**: Test inserts show data into **Postgres** (`shows` table), but PHP reads from **MySQL** (`schedule` table).

**Evidence**:
- `src/config/features.php` line 12: `'use_postgres_schedule' => false`
- `ScheduleFactory::create()` checks this flag and returns `SqlSchedule` (MySQL) when false
- `SqlSchedule::getByDate()` queries MySQL: `SELECT * FROM schedule WHERE date = '$date'`
- Test INSERT goes to Postgres: `docker compose exec postgres psql ... -c "INSERT INTO shows ..."`

**Solutions**:

### Option 1: Insert into MySQL (Simplest)
Change test to insert into MySQL `schedule` table instead of Postgres `shows` table.

### Option 2: Enable Postgres Feature Flag (More Complex)
Enable `use_postgres_schedule` in test environment, but requires understanding all implications.

### Option 3: Hybrid Approach
Insert into both databases to cover migration scenarios.

## Next Action

Implement **Option 1** - Insert show data into MySQL `schedule` table to match what PHP queries.

## Update (Commit 19): Linting Fixes + Test Environment Setup

**Problems Found:**
1. **Linting errors** (3 errors):
   - Line 248: Trailing spaces
   - Line 333: Double quotes instead of single quotes in SQL command
   - Line 353: Trailing spaces

2. **Test environment not configured**:
   - Missing `.env.local` file
   - Missing `src/.env` file

**Fixes Applied:**
- Removed trailing spaces on lines 248 and 353
- Changed double quotes to single quotes on line 333 (escaped inner single quotes with backslash)
- Created `.env.local` from `.env.example`
- Created `src/.env` from `.env.php.example`
- ✅ Linting now passes: `yarn lint` exits with code 0

**E2E Test Observation:**
- Docker services start correctly
- Playwright's Next.js dev server startup is slow (60+ seconds)
- This slowness may contribute to CI timeouts
- Further investigation needed once test can actually run

**Status**: Linting fixed, environment configured. Ready for test run.
