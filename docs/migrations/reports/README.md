# Migration Reports

This directory contains detailed reports from completed Sanity CMS data migration scripts.

---

## Purpose

Each migration report documents:
- Number of records migrated from MySQL to Sanity
- Records skipped and why
- Validation errors encountered
- Manual fixes required
- Verification that migration was successful

---

## Report Template

Use this template when creating a new migration report:

```markdown
# [Model Name] Migration Report

**Date:** YYYY-MM-DD  
**Migration Script:** bin/migrations/import[ModelName].ts  
**npm Command:** npm run import:[command]  
**Status:** Complete | Partial | Failed

---

## Summary

- **Records in MySQL:** X (excluding soft-deleted)
- **Records migrated:** Y
- **Records skipped:** Z
- **Validation errors:** N
- **Images migrated:** M

---

## Migration Details

### MySQL Source
- **Table:** `table_name`
- **Total records:** X
- **Soft-deleted records:** X (excluded)
- **Active records:** X

### Sanity Destination
- **Schema:** modelName
- **Documents created:** Y
- **Documents updated:** Z (via upsert)

---

## Skipped Records

| Legacy ID | Reason | Action Needed |
|-----------|--------|---------------|
| 123 | Invalid URL | Manual review |
| 456 | Missing required field | Data cleanup |

---

## Validation Errors

| Legacy ID | Field | Error | Resolution |
|-----------|-------|-------|------------|
| 789 | image_url | 404 Not Found | Skipped image |
| 101 | artist_name | Empty string | Created with placeholder |

---

## Data Transformations

Document any non-trivial transformations:

- **Rich Text:** HTML converted to Portable Text using `@sanity/block-tools`
- **Images:** External URLs downloaded and uploaded to Sanity assets
- **References:** Artists/Venues created on-the-fly when missing

---

## Verification

### Count Verification
```sql
-- MySQL Query
SELECT COUNT(*) FROM table_name WHERE deleted != 'y';
-- Result: X records
```

```groq
// GROQ Query (run in Sanity Vision)
count(*[_type == "modelName"])
// Result: X records
```

✅ Counts match / ⚠️ Discrepancy explained below

### Spot Check
- [ ] Verified 10 random records match MySQL source
- [ ] All images display correctly in Sanity Studio
- [ ] References resolve properly
- [ ] Rich text renders correctly

---

## Issues and Resolutions

### Issue 1: [Description]
**Problem:** ...  
**Solution:** ...  
**Status:** Resolved / Ongoing

### Issue 2: [Description]
**Problem:** ...  
**Solution:** ...  
**Status:** Resolved / Ongoing

---

## Manual Fixes Required

List any records that need manual attention:

- [ ] Record #123 - Needs better image
- [ ] Record #456 - Bio text needs formatting
- [ ] Record #789 - Verify artist name spelling

---

## Notes

Any additional observations, lessons learned, or recommendations for future migrations.

---

## Sign-off

- [x] Migration completed successfully
- [x] Verification checks passed
- [x] Manual fixes documented
- [x] Ready for content manager review

**Completed by:** [Name]  
**Date:** YYYY-MM-DD
```

---

## Completed Reports

Reports for successfully completed migrations:

- **Deejays** - Via `importDeejays.ts` (Person + DJ documents)
- **Ads** - Via `importAds.ts`
- **Concerts** - Via `importConcerts.ts` (creates Artists/Venues on-the-fly)
- **CD of the Week** - Via `importCdOfTheWeek.ts` (creates Record documents)
- **OnDemand** - Via `importOnDemand.ts`
- **Posts** - Via `importPosts.ts` (unified Story + CustomText)

*Note: Formal reports for these migrations have not been generated yet. The imports were successful, but documentation is pending.*

---

## Pending Migrations

Import scripts still needed:

- **Music/Songs** - Need `importMusic.ts` for legacy `music` table
- **Shows/Schedule** - Need `importShows.ts` for legacy `schedule` table

---

## How to Generate a Report

1. Run the migration script:
   ```bash
   npm run import:[model]
   ```

2. Capture the console output (record counts, errors)

3. Verify in Sanity Studio:
   - Check document count
   - Spot-check 10 random records
   - Verify images and references work

4. Query MySQL for comparison:
   ```sql
   SELECT COUNT(*) FROM table_name WHERE deleted != 'y';
   ```

5. Document findings using the template above

6. Save report as `[model-name]-migration-report.md`

---

## See Also

- **Migration Status Overview:** [`/docs/SANITY_MIGRATION_STATUS.md`](../SANITY_MIGRATION_STATUS.md)
- **Migration Tasks:** [`/docs/sanity-migration/04-migration-tasks.md`](../sanity-migration/04-migration-tasks.md)
- **Success Criteria:** [`/docs/sanity-migration/07-success-criteria.md`](../sanity-migration/07-success-criteria.md)
