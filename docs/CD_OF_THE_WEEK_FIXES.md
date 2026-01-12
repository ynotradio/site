# CD of the Week Import - Additional Fixes

**Date:** 2026-01-11  
**Status:** ✅ Complete

## Issues Addressed

### 1. MusicBrainz Cover Art Fallback

**Question:** "Are we querying MusicBrainz for CD art when the original download fails?"

**Answer:** ✅ YES - Already implemented and now improved!

**How it works:**
1. First tries legacy `cd_pic_url` from MySQL database
2. If that fails OR is empty, tries MusicBrainz Cover Art Archive
3. Uses `getAlbumCoverArt(title, artist)` to fetch from MusicBrainz
4. Logs success with "✓ Cover art imported from MusicBrainz"

**What changed:**
- **Before:** Only queried MusicBrainz if legacy image failed AND had `releaseMbid`
- **After:** Queries MusicBrainz whenever no cover image exists (even if no legacy URL)
- **Benefit:** More CDs will get cover art from MusicBrainz

### 2. Lexical Review Validation Errors

**Error:** 
```
ValidationError: The following field is invalid: Review
```

**Root Cause:** 
Some CD reviews in the database may have:
- NULL or empty content
- Malformed HTML
- Invalid characters
- Structure that doesn't convert properly to Lexical format

**Solutions Implemented:**

#### Enhanced Error Handling
```typescript
// Multiple fallbacks for review conversion
try {
  if (item.review && item.review.trim() !== '') {
    review = convertHtmlToLexical(item.review);
  } else {
    review = convertHtmlToLexical('<p>No review provided.</p>');
  }
} catch (error) {
  // Catch any conversion errors
  review = convertHtmlToLexical('<p>No review provided.</p>');
}
```

#### Structure Validation
```typescript
// Validate review has proper Lexical structure
if (!review || !review.root || !review.root.children || review.root.children.length === 0) {
  review = convertHtmlToLexical('<p>Review content unavailable.</p>');
}

// Validate children have proper paragraph structure
if (review.root.children[0]?.children?.length === 0) {
  review = convertHtmlToLexical('<p>Review content unavailable.</p>');
}
```

#### Detailed Error Logging
Now logs:
- Review content length
- First 200 characters of problematic reviews
- Full Lexical structure when validation fails
- Specific validation error details from Payload

**Example logs:**
```
[DEBUG] Converted review for CD 366 (length: 1234)
[ERROR] Failed to convert review for CD 366: Invalid HTML structure
[DEBUG] Review content preview: <p>This is the review...
[ERROR] Validation errors: [{"path": "review", "message": "..."}]
```

## Files Modified

1. **`bin/migrations/importCdOfTheWeek.ts`**
   - Enhanced MusicBrainz fallback logic (removed `releaseMbid` requirement)
   - Added comprehensive review validation
   - Added detailed error logging for debugging
   - Added multiple fallback strategies for review content

## Testing

### Unit Tests
```bash
✓ bin/migrations/importCdOfTheWeek.test.ts (6 tests)
  All tests passing ✅
```

### Linting
```bash
✨ Clean - No errors, no warnings
```

## Expected Results

### Cover Art Import
**Before:**
- Only tried MusicBrainz if legacy image failed AND had release MBID
- Many CDs with no legacy image got no cover art

**After:**
- Tries MusicBrainz for ANY CD without cover art
- More comprehensive fallback strategy
- Better logging to track MusicBrainz usage

### Review Validation
**Before:**
- ValidationError crashes entire import
- No visibility into what caused the error
- CD with invalid review blocks all subsequent CDs

**After:**
- Graceful fallback to default review text
- Detailed error logging for debugging
- Import continues for other CDs
- Can identify specific problematic reviews in logs

## How to Use

### Run Import
```bash
# Import all CDs
tsx bin/migrations/importCdOfTheWeek.ts --env dev

# Or use quick import for all collections
tsx bin/quick-import.ts --env dev --all
```

### Monitor Logs
Watch for:
- `"✓ Cover art imported from MusicBrainz"` - Successfully fetched from MB
- `"No cover art found in MusicBrainz"` - MB has no cover for this album
- `"Using default review for CD X"` - Empty review in database
- `"Failed to convert review for CD X"` - Malformed HTML
- `"Invalid review structure for CD X"` - Lexical validation failed

### Debug Specific CD
If a CD still fails, check the logs for:
1. Review content preview (first 200 chars)
2. Lexical structure JSON
3. Payload validation error details

## Next Steps (If Issues Persist)

### If Review Validation Still Fails:
1. Check logs for specific CD IDs that fail
2. Query MySQL to see actual review content:
   ```sql
   SELECT id, artist, title, review FROM cdotw WHERE id = 366;
   ```
3. Test conversion manually:
   ```bash
   npx tsx -e "
   import { convertHtmlToLexical } from './bin/migrations/shared/importUtils.ts';
   const review = convertHtmlToLexical('<your-html-here>');
   console.log(JSON.stringify(review, null, 2));
   "
   ```

### If Cover Art Still Missing:
1. Verify MusicBrainz has the album
2. Check if artist/title names match exactly
3. Consider manual cleanup of artist names (e.g., "The Beatles" vs "Beatles")

## Success Metrics

- ✅ More CDs get cover art from MusicBrainz
- ✅ No import crashes due to review validation
- ✅ All CDs imported (with default review if needed)
- ✅ Detailed logs for debugging
- ✅ Graceful degradation instead of failure
