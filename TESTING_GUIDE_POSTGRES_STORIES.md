# Testing Guide: PostgreSQL Front Page Implementation

## Quick Summary

This PR adds a PostgreSQL read implementation for the front page (Stories/Posts), following the same pattern as PR #135 for Concerts.

## What Was Changed

1. **New File**: `src/models/implementations/PostgresStory.php`
   - Reads from Payload CMS `posts` table
   - Converts Lexical JSON to HTML
   - Read-only with proper security (XSS prevention, URL validation)

2. **Modified**: `src/models/StoryFactory.php`
   - Added feature flag support to switch between MySQL and PostgreSQL

3. **Modified**: `src/config/features.php`
   - Added `use_postgres_stories` feature flag (default: false)

4. **New File**: `docs/POSTGRES_STORY_MODEL.md`
   - Comprehensive documentation

## How to Test in Development Environment

### Option 1: URL Parameter (Temporary)
Visit the front page with the feature flag:
```
http://localhost:8080/index.php?ff=use_postgres_stories
```

### Option 2: Cookie (Session)
Set a cookie named `FF` with value `use_postgres_stories` in your browser.

### Option 3: Config File (Persistent)
Edit `src/config/features.php`:
```php
'use_postgres_stories' => true
```

## What to Verify

1. **Front page loads** - No errors
2. **Stories display** - Headlines, content, and images show correctly
3. **Two-column layout** - Stories alternate between left and right columns
4. **Dates** - Formatted correctly (e.g., "Jan 4, 2026")
5. **Content** - Properly formatted with paragraphs, links, bold/italic text
6. **Fallback** - If PostgreSQL isn't configured, falls back to MySQL gracefully

## Expected Behavior

- ✅ Same visual appearance as MySQL version
- ✅ No JavaScript errors in console
- ✅ No PHP errors in logs
- ✅ Content properly formatted (no JSON visible)
- ✅ Links work and open correctly
- ✅ Images display (if configured)

## Security Features Tested

All security features have been unit tested:
- ✅ XSS protection via htmlspecialchars()
- ✅ URL validation (blocks javascript:, data:, etc.)
- ✅ Safe HTML generation from Lexical JSON
- ✅ Proper escaping of user content

## Unit Test Results

```
Testing PostgresStory Lexical to HTML conversion
================================================

✓ PASS: Simple paragraph
✓ PASS: Bold text
✓ PASS: Mixed formatting
✓ PASS: Link
✓ PASS: Already HTML
✓ PASS: XSS protection
✓ PASS: Dangerous URL blocked

Results: 7 passed, 0 failed
```

## Prerequisites for Full Testing

You'll need:
1. PostgreSQL database with Payload schema
2. Posts migrated from MySQL to PostgreSQL
3. Environment variables configured:
   - POSTGRES_HOST
   - POSTGRES_PORT
   - POSTGRES_DATABASE
   - POSTGRES_USER
   - POSTGRES_PASSWORD
   - POSTGRES_SSL_MODE

See `.env.example` for full configuration.

## Troubleshooting

### No stories appear
- Check PostgreSQL connection in PHP error log
- Verify posts exist with status = 'published'
- Check date ranges (startDate <= today, endDate >= today)

### JSON visible instead of HTML
- Check error logs for Lexical conversion issues
- Verify content field format in database

### Fallback to MySQL
- Check error_log for PostgreSQL connection errors
- Verify environment variables are set correctly
- Check network access to PostgreSQL server

## Related Documentation

- [POSTGRES_STORY_MODEL.md](./docs/POSTGRES_STORY_MODEL.md) - Full implementation documentation
- [POSTGRES_CONCERT_MODEL.md](./docs/POSTGRES_CONCERT_MODEL.md) - Similar pattern for Concerts
- [AGENT_TESTING_CHECKLIST.md](./docs/AGENT_TESTING_CHECKLIST.md) - General testing guidelines

## Questions?

If you encounter any issues or have questions about this implementation, please refer to the documentation or ask for clarification in the PR comments.
