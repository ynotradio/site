# Year End Poll Data Migration Guide

## Overview

This directory contains the script and documentation for resetting and importing Year End Poll data annually. The process converts CSV files exported from Google Sheets into SQL import statements with proper reset logic.

## Files

- **`year_end_poll_reset_import.py`** - Main Python script that converts CSV files to SQL
- **`YEAR_END_POLL_README.md`** - This documentation file
- **`year_end_poll_YYYY_import.sql`** - Generated SQL file (created when script runs)

## Annual Workflow

### 1. Prepare CSV Files

Export the following sheets from your Year End Poll Google Sheet:

| CSV File Name | Database Table | Columns |
|--------------|----------------|---------|
| `YYYY Year End Poll - Songs.csv` | `year_end_songs` | artist, title |
| `YYYY Year End Poll - Albums.csv` | `year_end_albums` | artist, title |
| `YYYY Year End Poll - Artists.csv` | `year_end_artists` | artist |
| `YYYY Year End Poll - New Artist.csv` | `year_end_new_artists` | artist |
| `YYYY Year End Poll - Concerts.csv` | `year_end_concerts` | concert |
| `YYYY Year End Poll - Philly Artists.csv` | `year_end_philly_artists` | artist |
| `YYYY Year End Poll - Most Anticipated.csv` | `year_end_most_anticipated_albums` | artist |
| `YYYY Year End Poll - TV Dramas.csv` | `year_end_tv_dramas` | title |
| `YYYY Year End Poll - TV Comedies.csv` | `year_end_tv_comedies` | title |
| `YYYY Year End Poll - Best Movies.csv` | `year_end_best_movies` | title |
| `YYYY Year End Poll - Worst Movies.csv` | `year_end_worst_movies` | title |
| `YYYY Year End Poll - Unnecessary Sequels.csv` | `year_end_unnecessary_sequels` | title |

**Important Notes:**
- Replace `YYYY` with the current year (e.g., `2025 Year End Poll - Songs.csv`)
- CSV files must include a header row with column names
- The `votes` column (if present) will be ignored - all votes initialize to 0
- Place all CSV files in the same directory as `year_end_poll_reset_import.py`

### 2. Update the Script for New Year

Before running the script, update the year in the CSV filenames:

```python
# In year_end_poll_reset_import.py, find TABLE_MAPPINGS and update:
TABLE_MAPPINGS = {
    '2026 Year End Poll - Songs.csv': {  # Change 2025 -> 2026
        'table': 'year_end_songs',
        # ... rest of config
    },
    # ... update year for all entries
}
```

### 3. Run the Script

```bash
cd src/db/migrations
python3 year_end_poll_reset_import.py
```

The script will:
1. ✓ Check which CSV files are present
2. ✓ Generate SQL with reset logic (TRUNCATE statements)
3. ✓ Create INSERT statements for all data
4. ✓ Save to `year_end_poll_YYYY_import.sql`

### 4. Review and Import SQL

```bash
# Review the generated SQL file first
less year_end_poll_2025_import.sql

# Import into database
mysql -u username -p database_name < year_end_poll_2025_import.sql

# Or using the pull_db script if importing to local Docker
# (adjust path as needed)
```

## Database Schema Reference

All year-end poll tables follow this general pattern:

```sql
CREATE TABLE `year_end_CATEGORY` (
  `id` int NOT NULL AUTO_INCREMENT,
  -- Category-specific columns (artist, title, concert, etc.)
  `votes` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

### Tables Reset by Script

The script resets (truncates) the following tables:
- `year_end_albums`
- `year_end_artists`
- `year_end_best_movies`
- `year_end_biggest_comebacks` *(not currently used)*
- `year_end_celebrity_deaths` *(not currently used)*
- `year_end_concerts`
- `year_end_contestants`
- `year_end_ips`
- `year_end_late_night_tv` *(not currently used)*
- `year_end_most_anticipated_albums`
- `year_end_music_videos` *(not currently used)*
- `year_end_new_artists`
- `year_end_philly_artists`
- `year_end_song_votes`
- `year_end_songs`
- `year_end_staff_picks`
- `year_end_tv_comedies`
- `year_end_tv_dramas`
- `year_end_unnecessary_sequels`
- `year_end_worst_movies`
- `year_end_write_ins`

## Modifying for Future Changes

### Adding a New Poll Category

1. **Create the database table** (in `src/db/docker/ynot_db.sql`):
```sql
CREATE TABLE `year_end_new_category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `votes` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
```

2. **Add to TABLE_MAPPINGS** in `year_end_poll_reset_import.py`:
```python
'2025 Year End Poll - New Category.csv': {
    'table': 'year_end_new_category',
    'columns': ['name', 'votes'],
    'csv_columns': ['name']
}
```

3. **Add to tables_to_reset** list:
```python
tables_to_reset = [
    # ... existing tables ...
    'year_end_new_category',
]
```

### Removing a Poll Category

1. Remove the entry from `TABLE_MAPPINGS`
2. Optionally keep it in `tables_to_reset` to clean up old data
3. Consider dropping the table if no longer needed

### Changing Column Structure

If a table's schema changes (e.g., adding a `description` column):

1. **Update the database schema**
2. **Update the mapping**:
```python
'2025 Year End Poll - Category.csv': {
    'table': 'year_end_category',
    'columns': ['name', 'description', 'votes'],  # Added description
    'csv_columns': ['name', 'description']         # Added description
}
```
3. **Update the CSV export** to include the new column

## Troubleshooting

### Missing CSV Files

If you see warnings about missing CSV files, make sure:
- All CSV files are in the same directory as the script
- Filenames exactly match the TABLE_MAPPINGS entries
- Year in filename matches the updated year in the script

### SQL Import Errors

Common issues:
- **Foreign key constraint fails**: Make sure `FOREIGN_KEY_CHECKS = 0` is in the SQL file
- **Duplicate entry**: The script should truncate tables first; verify TRUNCATE statements are present
- **Column doesn't match**: Database schema may have changed; update TABLE_MAPPINGS

### Character Encoding Issues

If you see strange characters (e.g., apostrophes displaying incorrectly):
- Ensure CSV files are saved with UTF-8 encoding
- Check database table charset (should be `utf8mb4` or `latin1`)
- The script handles escaping of quotes and special characters

## For AI Agents / Future Reference

When updating this script for a new year, an AI agent should:

1. **Read this README fully** to understand the context
2. **Check the database schema** in `src/db/docker/ynot_db.sql` for:
   - Current year_end_* table structures
   - Any new tables added
   - Any schema changes
3. **Update TABLE_MAPPINGS** with the new year
4. **Verify CSV format** matches expected columns
5. **Test the script** before importing to production database

### Key Questions to Ask:

- Are there new poll categories this year?
- Have any categories been removed?
- Have database schemas changed?
- Are the CSV column names the same?
- Should any unused tables be removed from reset logic?

## Examples

### Example CSV Format

**Songs.csv:**
```csv
id,artist,title,votes
,Alex G,Afterlife,
,Bartees Strange,Backseat Banton,
,Beach Bunny,Tunnel Vision,
```

**Note**: The `id` and `votes` columns can be empty; they're auto-generated/initialized.

### Example Generated SQL

```sql
-- Reset logic
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `year_end_songs`;
SET FOREIGN_KEY_CHECKS = 1;

-- Data import
INSERT INTO `year_end_songs` (`artist`, `title`, `votes`) VALUES
('Alex G', 'Afterlife', 0),
('Bartees Strange', 'Backseat Banton', 0),
('Beach Bunny', 'Tunnel Vision', 0);
```

## Version History

- **2024-11-28**: Initial documentation created for 2025 Year End Poll
  - Script supports 12 poll categories
  - Resets 21 year_end_* tables
  - Handles proper SQL escaping and batching

## Related Files

- `src/db/docker/ynot_db.sql` - Full database schema
- `src/yearendpoll.php` - Frontend poll interface
- `src/models/implementations/SqlYearEndPoll.php` - Data model (if exists)

---

**Last Updated**: 2024-11-28
**For Questions**: Review this document or check the inline documentation in `year_end_poll_reset_import.py`
