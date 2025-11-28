# Year End Poll Quick Start Guide

## 🚀 Quick Start (For Future You / AI Agents)

### Step 1: Update the Year
```python
# Edit: year_end_poll_reset_import.py
# Find TABLE_MAPPINGS and change all:
'2025 Year End Poll - Songs.csv' → '2026 Year End Poll - Songs.csv'
# (Do this for all 12 CSV file entries)
```

### Step 2: Export CSVs from Google Sheets
Place these 12 CSV files in `src/db/migrations/`:
- `YYYY Year End Poll - Songs.csv`
- `YYYY Year End Poll - Albums.csv`
- `YYYY Year End Poll - Artists.csv`
- `YYYY Year End Poll - New Artist.csv`
- `YYYY Year End Poll - Concerts.csv`
- `YYYY Year End Poll - Philly Artists.csv`
- `YYYY Year End Poll - Most Anticipated.csv`
- `YYYY Year End Poll - TV Dramas.csv`
- `YYYY Year End Poll - TV Comedies.csv`
- `YYYY Year End Poll - Best Movies.csv`
- `YYYY Year End Poll - Worst Movies.csv`
- `YYYY Year End Poll - Unnecessary Sequels.csv`

### Step 3: Run Script
```bash
cd src/db/migrations
python3 year_end_poll_reset_import.py
```

### Step 4: Import SQL
```bash
mysql -u username -p database_name < year_end_poll_YYYY_import.sql
```

---

## 📚 Full Documentation
See **[YEAR_END_POLL_README.md](./YEAR_END_POLL_README.md)** for:
- Complete workflow details
- Database schema reference
- How to add/remove poll categories
- Troubleshooting guide
- Examples and version history

## 🔍 What This Does
1. ⚠️  **TRUNCATES (deletes) all year-end poll data**
2. ✅ Imports fresh data from CSV files
3. ✅ Initializes all vote counts to 0
4. ✅ Handles SQL escaping automatically

## ⚙️ For AI Agents
Before running, check for:
- [ ] Database schema changes in `src/db/docker/ynot_db.sql`
- [ ] New/removed poll categories
- [ ] CSV column format changes
- [ ] Year updated in TABLE_MAPPINGS

**Read the full README first!** → `YEAR_END_POLL_README.md`
