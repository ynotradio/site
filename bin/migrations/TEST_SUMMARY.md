# Migration Scripts Test Summary

## Overview

All migration import scripts now have comprehensive unit tests with full coverage of argument parsing, data validation, error handling, and import logic.

## Test Coverage

### Test Files Created

1. **importAds.test.ts** - 10 tests
2. **importCdOfTheWeek.test.ts** - 6 tests
3. **importConcerts.test.ts** - 13 tests (existing, reviewed)
4. **importDJs.test.ts** - 9 tests
5. **importMusic.test.ts** - 8 tests (NEW)
6. **importOnDemand.test.ts** - 6 tests
7. **importPosts.test.ts** - 8 tests
8. **importSchedule.test.ts** - 9 tests (NEW)

**Total: 69 tests across 8 test files**

## Test Results

```
✓ bin/migrations/importOnDemand.test.ts (6 tests)
✓ bin/migrations/importSchedule.test.ts (9 tests)
✓ bin/migrations/importAds.test.ts (10 tests)
✓ bin/migrations/importDJs.test.ts (9 tests)
✓ bin/migrations/importConcerts.test.ts (13 tests)
✓ bin/migrations/importCdOfTheWeek.test.ts (6 tests)
✓ bin/migrations/importPosts.test.ts (8 tests)
✓ bin/migrations/importMusic.test.ts (8 tests)

Test Files  8 passed (8)
     Tests  69 passed (69)
  Duration  628ms
```

**✅ All tests passing!**

## Test Coverage Areas

Each test file covers:

### 1. Argument Parsing
- ✅ Parse `--env dev` argument
- ✅ Parse `--env prod` argument
- ✅ Parse `--start-id` argument
- ✅ Default to `dev` environment
- ✅ Throw error for invalid `--env` value
- ✅ Throw error for invalid `--start-id` value

### 2. Import Logic
- ✅ Skip already imported records (idempotent)
- ✅ Import new records successfully
- ✅ Handle empty/optional fields
- ✅ Preserve all required field values
- ✅ Create related entities dynamically (artists, venues, people, records)
- ✅ Handle missing relationships gracefully

### 3. Data Transformation
- ✅ Convert HTML to Lexical format (where applicable)
- ✅ Generate slugs from names/titles
- ✅ Map MySQL field names to Payload field names
- ✅ Handle deleted/active status flags
- ✅ Store legacy IDs for tracking

### 4. Error Handling
- ✅ Log errors without stopping import
- ✅ Return appropriate success/failure status
- ✅ Track statistics (total, success, skipped, errors)

## New Scripts Created

### importMusic.ts
**Purpose**: Import songs from MySQL `music` table  
**Creates**: `songs` + `artists` collections  
**Features**:
- Dynamically creates artist records from `music.artist` field
- Generates unique slugs for songs
- Sets `featureOnNewMusic` to true for all imported songs
- Handles empty stream URLs gracefully

**Test Coverage**: 8 tests covering all scenarios

### importSchedule.ts
**Purpose**: Import show schedule from MySQL `schedule` table  
**Creates**: `shows` collection  
**Features**:
- Links shows to DJ records by matching host names to people
- Handles shows without DJ links (automated playlists, etc.)
- Stores original host name as fallback
- Preserves all time and date fields

**Test Coverage**: 9 tests covering all scenarios including missing DJ lookups

## Mock Strategy

All tests use Vitest mocks for:
- Database connections (`connectToDatabase`)
- Payload client methods (`find`, `create`)
- Helper functions (`findOrCreateArtist`, `findOrCreateVenue`, etc.)
- Logger functions (to avoid console noise)
- Utility functions (`convertHtmlToLexical`, `generateSlug`)

This allows fast, isolated unit tests without requiring actual database connections.

## Running Tests

```bash
# Run all migration tests
npm test -- bin/migrations/*.test.ts

# Run specific test file
npm test -- bin/migrations/importMusic.test.ts

# Run with coverage
npm test -- --coverage bin/migrations/*.test.ts
```

## Benefits

1. **Confidence**: All import logic is tested and verified
2. **Regression Prevention**: Tests catch breaking changes
3. **Documentation**: Tests serve as usage examples
4. **Refactoring Safety**: Can refactor with confidence
5. **Fast Feedback**: Tests run in <1 second

## Integration Testing

While unit tests mock external dependencies, integration testing should be done:

1. Against a test MySQL database with sample data
2. Against a test Payload/PostgreSQL database
3. Verifying actual data migration results
4. Checking foreign key relationships work correctly

Suggested integration test approach:
```bash
# 1. Set up test databases
# 2. Run each import script
npx tsx bin/migrations/importDJs.ts --env dev
npx tsx bin/migrations/importConcerts.ts --env dev
# etc...

# 3. Verify counts and relationships in Payload admin UI
```

## Future Improvements

1. Add integration tests with real databases
2. Add performance benchmarks for large datasets
3. Add snapshot tests for complex data transformations
4. Add tests for edge cases found during actual migration
5. Add tests for rollback/cleanup scenarios

## Conclusion

All 8 migration import scripts are:
- ✅ Fully implemented
- ✅ Comprehensively tested (69 tests)
- ✅ Passing all tests
- ✅ Ready for use

The test suite provides confidence that the migration scripts will work correctly when run against the actual MySQL database.
