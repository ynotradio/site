# Chapter 7: Success Criteria

[← Back to Index](./README.md)

---

## Per-Model Checklist

For each model migration, verify:

- [ ] Sanity schema created and working
- [ ] Migration script runs without errors
- [ ] Record counts match (excluding soft-deleted)
- [ ] All images accessible in Sanity
- [ ] Rich text displays correctly
- [ ] References resolve properly
- [ ] Can create/edit in Sanity Studio

---

## Project Completion Criteria

- [ ] All schemas created and functional
- [ ] All migrations complete with reports
- [ ] Feature flag tested thoroughly
- [ ] Site owners trained on Sanity Studio
- [ ] PHP site reading from Sanity in production
- [ ] MySQL archived as backup

---

## Migration Report Template

Generate a report for each migration in `docs/migrations/reports/`:

```markdown
# [Model] Migration Report

**Date:** YYYY-MM-DD
**Status:** Complete | Partial | Failed

## Summary
- Records in MySQL: X
- Records migrated: Y
- Records skipped: Z
- Validation errors: N

## Skipped Records
| Legacy ID | Reason |
|-----------|--------|
| 123 | Invalid URL |

## Validation Errors
| Legacy ID | Field | Error |
|-----------|-------|-------|
| 456 | pic_url | 404 Not Found |

## Notes
Any additional observations or manual fixes needed.
```

---

## Validation Checklist

Before marking a migration complete:

1. **Count Check**
   ```sql
   SELECT COUNT(*) FROM table_name WHERE deleted != 'y';
   ```
   Compare with Sanity document count.

2. **Image Check**
   - Spot check 5-10 random records
   - Verify images load in Sanity Studio

3. **Reference Check**
   - Verify all references resolve
   - Check for orphaned records

4. **Content Check**
   - Verify rich text renders correctly
   - Check for encoding issues
