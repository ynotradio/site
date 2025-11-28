# Year End Poll Annual Checklist

Use this checklist each year when setting up the Year End Poll.

## Pre-Migration Checklist

### Database Review
- [ ] Review database schema in `src/db/docker/ynot_db.sql`
- [ ] Check if any `year_end_*` tables were added/removed this year
- [ ] Verify column structures match previous year
- [ ] Note any schema changes that need to be reflected in script

### Poll Categories Review
- [ ] Confirm which poll categories are active this year
- [ ] Check if any categories were added/removed
- [ ] Verify Google Sheet has all expected tabs/sheets
- [ ] Confirm column headers in Google Sheet match expected format

### Script Preparation
- [ ] Update year in `TABLE_MAPPINGS` (all 12 CSV filenames)
- [ ] Add mappings for any new poll categories
- [ ] Remove mappings for discontinued categories
- [ ] Update `tables_to_reset` list if needed
- [ ] Update `LAST MODIFIED` date in script header

## Export Checklist

- [ ] Export Songs CSV from Google Sheet
- [ ] Export Albums CSV from Google Sheet
- [ ] Export Artists CSV from Google Sheet
- [ ] Export New Artist CSV from Google Sheet
- [ ] Export Concerts CSV from Google Sheet
- [ ] Export Philly Artists CSV from Google Sheet
- [ ] Export Most Anticipated CSV from Google Sheet
- [ ] Export TV Dramas CSV from Google Sheet
- [ ] Export TV Comedies CSV from Google Sheet
- [ ] Export Best Movies CSV from Google Sheet
- [ ] Export Worst Movies CSV from Google Sheet
- [ ] Export Unnecessary Sequels CSV from Google Sheet
- [ ] Verify all CSV files have header rows
- [ ] Verify all CSV files are UTF-8 encoded
- [ ] Place all CSV files in `src/db/migrations/` directory

## Script Execution Checklist

- [ ] Run `python3 year_end_poll_reset_import.py`
- [ ] Verify script finds all expected CSV files
- [ ] Check for any warning messages
- [ ] Review generated SQL file for correctness
- [ ] Verify INSERT statement counts look reasonable
- [ ] Check for proper SQL escaping (especially apostrophes)

## Database Import Checklist

### Pre-Import
- [ ] **BACKUP DATABASE** (this will delete existing data!)
- [ ] Verify you're importing to correct database (dev/prod)
- [ ] Check database connection credentials
- [ ] Confirm you have necessary database permissions

### Import
- [ ] Import SQL file: `mysql -u USER -p DB < year_end_poll_YYYY_import.sql`
- [ ] Check for any SQL errors during import
- [ ] Verify import completed successfully

### Post-Import Verification
- [ ] Verify data was imported to all tables
- [ ] Spot-check a few entries for accuracy
- [ ] Confirm vote counts are all 0
- [ ] Test poll interface on website
- [ ] Verify all poll categories display correctly
- [ ] Check that voting mechanism works

## Testing Checklist

- [ ] Navigate to year-end poll page on website
- [ ] Verify all categories are visible
- [ ] Test voting for each category
- [ ] Verify votes are being recorded
- [ ] Check for any JavaScript errors in console
- [ ] Test on mobile device
- [ ] Verify IP tracking is working (prevent duplicate votes)
- [ ] Check results/admin page (if applicable)

## Post-Launch Monitoring

- [ ] Monitor vote counts for unusual activity
- [ ] Check server logs for errors
- [ ] Verify database performance
- [ ] Monitor for any SQL injection attempts
- [ ] Check for any user-reported issues

## Documentation Updates

- [ ] Update this checklist if process changed
- [ ] Document any issues encountered
- [ ] Note any improvements for next year
- [ ] Update version history in README
- [ ] Commit changes to git repository

---

## Notes Section

**Year**: _____

**Date Completed**: _____

**Database Imported To**: [ ] Dev [ ] Staging [ ] Production

**Any Issues Encountered**:
```
(Write notes here)
```

**Changes Made This Year**:
```
(Document any new categories, removed categories, or process changes)
```

**Improvements for Next Year**:
```
(Ideas to make this process better)
```

---

## Emergency Rollback

If something goes wrong and you need to restore previous data:

1. **Stop the website** (prevent users from voting on corrupted data)
2. **Restore from backup**:
   ```bash
   mysql -u username -p database_name < backup_YYYY-MM-DD.sql
   ```
3. **Verify data** is correct
4. **Re-enable website**
5. **Document what went wrong** in notes section above

## Support Contacts

- Database Schema: `src/db/docker/ynot_db.sql`
- Backend Code: `src/yearendpoll.php` (or similar)
- Script Documentation: `YEAR_END_POLL_README.md`
- Quick Reference: `YEAR_END_POLL_QUICKSTART.md`
