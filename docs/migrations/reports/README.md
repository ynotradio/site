# Migration Reports

Detailed reports from completed Sanity CMS data migrations.

## Report Template

```markdown
# [Model] Migration Report

**Date:** YYYY-MM-DD  
**Script:** bin/migrations/import[Model].ts  
**Status:** Complete | Partial | Failed

## Summary
- Records in MySQL: X (excluding deleted)
- Records migrated: Y
- Records skipped: Z
- Validation errors: N

## Skipped Records
| Legacy ID | Reason |
|-----------|--------|
| 123 | Invalid URL |

## Verification
```sql
SELECT COUNT(*) FROM table_name WHERE deleted != 'y';
```
```

## Completed Migrations

Scripts run successfully (formal reports pending):
- Deejays (`yarn import:deejays`)
- Ads (`yarn import:ads`)
- Concerts (`yarn import:concerts`)
- CD of the Week (`yarn import:cdotw`)
- OnDemand (`yarn import:ondemand`)
- Posts (`yarn import:posts`)

## Pending

Import scripts still needed:
- Music/Songs (`importMusic.ts`)
- Shows/Schedule (`importShows.ts`)
