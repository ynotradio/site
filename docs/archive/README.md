# Archive: Historical Documentation

This directory contains historical documentation that is preserved for reference but is no longer actively maintained.

---

## Purpose

Documents in this archive:
- Describe processes or migrations that have been completed
- May refer to legacy systems that are being replaced
- Are kept for historical context and learning
- Should NOT be used as current operational guidance

---

## Directory Structure

### `/php-mvc-migration/`
Reports from the PHP codebase refactoring project that converted procedural code to Model-View-Controller (MVC) architecture. This was a separate initiative from the Sanity CMS migration.

**Files:**
- `DEEJAY_MIGRATION_REPORT.md` - Deejay model refactoring (completed June 2025)
- `MRM_MIGRATION_REPORT.md` - Modern Rock Madness MVC migration (completed)

### `/legacy-processes/`
Documentation of workflows and processes from the legacy PHP/MySQL system that are being replaced by Sanity CMS.

**Files:**
- `MRM_ANNUAL_UPDATE.md` - Legacy PHP admin process for Modern Rock Madness annual updates

---

## Current Documentation

For active migration work and current processes, see:

- **Sanity CMS Migration:** [`/docs/sanity-migration/`](../sanity-migration/)
- **Migration Status:** [`/docs/SANITY_MIGRATION_STATUS.md`](../SANITY_MIGRATION_STATUS.md)
- **Migration Reports:** [`/docs/migrations/reports/`](../migrations/reports/)
- **Main README:** [`/README.md`](../../README.md)

---

## Note on Terminology

The word "migration" appears in multiple contexts in this codebase:

1. **Sanity CMS Migration** - Moving from PHP/MySQL to Sanity CMS (current, ongoing)
2. **PHP MVC Migration** - Refactoring PHP code to use MVC pattern (completed, archived here)
3. **Database Migrations** - Schema changes to the MySQL database (standard practice)

When in doubt, assume "migration" refers to the Sanity CMS migration unless otherwise specified.
