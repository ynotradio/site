# Import TODO List

## Current Status

### ✅ Successfully Completed Imports
- **Music**: 67/67 songs (last 3 months) - All successful
- **DJs**: 83/84 (1 skipped due to bad email) - From previous session
- **Concerts**: 308/308 - All successful, created Artists and Venues as side effect

### ❌ Failed/Incomplete Imports
- **Posts**: Status unknown - Many failures due to bad image data
- **OnDemand**: 0/3 - All failed on "Songs" field validation
- **CD of the Week**: 0/9 - All failed on "Reviewer" and "Review" field validation
- **Ads**: Not yet attempted
- **Shows**: Not yet attempted

---

## Issues to Fix

### 1. OnDemand Import - CRITICAL
**Problem**: Import script passes text string to `songs` field, which is now a relationship array.

**Root Cause**: 
- OnDemand collection schema was updated to use relationship fields: `djs`, `artists`, `songs`
- Import script (`bin/migrations/importOnDemand.ts` line 133) still passes raw text: `songs: item.songs`
- MySQL `ondemand` table has text field with song info (probably comma/newline separated)

**Solution**:
- [ ] Parse the `songs` text field from MySQL (determine delimiter)
- [ ] For each song name, find or create matching Song record in Payload
- [ ] Build array of Song IDs for relationship field
- [ ] Apply same logic for `djs` and `artists` relationships
- [ ] Update `importOnDemand.ts` lines 127-140

**Files to modify**:
- `bin/migrations/importOnDemand.ts`

---

### 2. CD of the Week Import
**Problem**: "Reviewer" and "Review" fields failing validation

**Root Cause**: Unknown - need to investigate schema vs import data

**Solution**:
- [ ] Check `payload/src/collections/CdOfTheWeek.ts` schema for Reviewer and Review fields
- [ ] Check what data type/format import script is providing
- [ ] Check `bin/migrations/importCdOfTheWeek.ts` around line 218
- [ ] Determine if fields are required, what type they expect, etc.
- [ ] Fix data transformation in import script

**Files to investigate**:
- `payload/src/collections/CdOfTheWeek.ts`
- `bin/migrations/importCdOfTheWeek.ts`

---

### 3. Posts Import - Data Quality Issues
**Problem**: ~25% of posts failing due to bad image URLs in legacy MySQL data

**Bad Data Examples**:
- `.php` files being treated as images (ondemand.php, donate.php, contests.php, etc.)
- `mailto:` email links
- Website URLs returning HTML instead of images
- 404 errors on external image links
- SSL certificate validation failures
- Wrong content-type responses (text/plain instead of image/*)

**Current Behavior**:
- Image import fails (handled gracefully with warning)
- Post creation still attempts but may fail validation
- Error rate: ~25% of 795 posts in 3-month window

**Solution Options**:
- [ ] **Option A**: Skip posts with bad images entirely (modify error handling to skip post creation)
- [ ] **Option B**: Import posts with `image: null` when image fails (may already be partially working)
- [ ] **Option C**: Add fallback field to store bad image URLs for manual review
- [ ] **Option D**: Pre-validate/sanitize image URLs before import attempt

**Files to modify**:
- `bin/migrations/importPosts.ts` (around lines 116-174)

---

### 4. Ads Import
**Status**: Not yet attempted

**Action**:
- [ ] Run `yarn tsx bin/migrations/importAds.ts --env dev --start-id 56`
- [ ] Check for validation errors
- [ ] Fix any issues found

---

### 5. Shows Import
**Status**: Not yet attempted

**Action**:
- [ ] Run `yarn tsx bin/migrations/importSchedule.ts --env dev`
- [ ] Check for validation errors
- [ ] Fix any issues found

---

## Quick Import Script Issues

### Problem with quick-import.ts
The quick-import script appears to hang after completing the music import. The subprocess doesn't properly exit, blocking the script from continuing to the next import.

**Evidence**:
- Music import completed successfully (logged summary)
- Script never proceeded to DJs import
- Process remained running but no further output

**Solution**:
- [ ] Investigate why child process doesn't exit cleanly
- [ ] Check if `runImportScript()` function properly waits for completion
- [ ] May need to explicitly call `process.exit(0)` in individual import scripts
- [ ] Or refactor to use different process spawning approach

**Files to investigate**:
- `bin/quick-import.ts` (runImportScript function)
- Individual import scripts (check if they exit properly)

---

## Notes

### Artist/Venue Creation
- Artists and Venues do NOT have legacyId fields (intentional)
- They are created fresh during imports, searched by name only
- MBID duplicate errors are handled with retry logic

### Database State
- Single initial migration applied: `payload/migrations/20260110_191747.ts`
- 52 tables created
- Relationship tables for OnDemand: `ondemand_rels`, `_ondemand_v_rels`

### Date Filtering (3-month window)
```
music       → Start from ID 5345
concerts    → Start from ID 4175
stories     → Start from ID 18
ondemand    → Start from ID 520
cdotw       → Start from ID 839
ads         → Start from ID 56
```

---

## Your Notes

[Add your notes here]

