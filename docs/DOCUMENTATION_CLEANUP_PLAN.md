# Documentation Cleanup and Consolidation Plan

**Date:** December 7, 2025

This document outlines proposed changes to consolidate and improve the Sanity migration documentation.

---

## Current State Analysis

### Documentation Files

```
docs/
├── SANITY_MIGRATION_PLAN.md          ← Top-level index (duplicates README)
├── SANITY_MIGRATION_STATUS.md        ← New status report (this review)
├── DEEJAY_MIGRATION_REPORT.md        ← About PHP MVC, not Sanity
├── MRM_MIGRATION_REPORT.md           ← About PHP MVC, not Sanity
├── MRM_ANNUAL_UPDATE.md              ← Legacy PHP admin process
├── CODE_QUALITY.md                   ← General project doc
├── sanity-migration/
│   ├── README.md                     ← Main index (good structure)
│   ├── 01-project-overview.md
│   ├── 02-architecture-decisions.md
│   ├── 03-core-data-models.md
│   ├── 04-migration-tasks.md
│   ├── 05-shared-utilities.md
│   ├── 06-frontend-cutover.md
│   ├── 07-success-criteria.md
│   ├── 08-quick-reference.md
│   ├── 09-neon-integration-top11.md
│   ├── 10-neon-integration-year-end-poll.md
│   └── 11-neon-integration-modern-rock-madness.md
└── migrations/
    └── phases/                       ← Phase definition YAMLs
```

---

## Issues Identified

### 1. Redundant Top-Level Plan File

**Issue:** `docs/SANITY_MIGRATION_PLAN.md` is a simplified version of `docs/sanity-migration/README.md`

**Impact:** 
- Causes confusion about which file is the source of truth
- Requires maintaining two similar documents
- Navigation shows only 8 chapters vs 11 in the full README

**Recommendation:** Remove `docs/SANITY_MIGRATION_PLAN.md` and update references to point to `docs/sanity-migration/README.md`

### 2. Misplaced Migration Reports

**Issue:** `DEEJAY_MIGRATION_REPORT.md` and `MRM_MIGRATION_REPORT.md` are about PHP MVC refactoring (moving from procedural functions to Model-View-Controller pattern), NOT about Sanity CMS migration

**Impact:**
- Creates confusion about what "migration" refers to
- Makes it harder to find Sanity-specific documentation
- These reports are historical and no longer actively referenced

**Recommendation:** Move to `docs/archive/php-mvc-migration/` to preserve history but reduce clutter

### 3. Outdated Legacy Process Documentation

**Issue:** `MRM_ANNUAL_UPDATE.md` documents the legacy PHP admin process for Modern Rock Madness, which will be replaced by Sanity

**Impact:**
- Will become obsolete after Sanity cutover
- May confuse users about current vs future processes
- Should be preserved but marked as legacy

**Recommendation:** Move to `docs/archive/legacy-processes/` and add a note about Sanity replacement

### 4. Missing Migration Reports Directory

**Issue:** Chapter 7 (Success Criteria) mentions reports should go in `docs/migrations/reports/` but this directory doesn't exist

**Impact:**
- No standardized location for migration reports
- Harder to track which migrations have been completed
- No template for future migration reports

**Recommendation:** Create the directory structure and add a README explaining the purpose

### 5. Incomplete Migration Documentation

**Issue:** Import scripts exist for Ads, Concerts, CdOfTheWeek, OnDemand, and Posts, but no migration reports were generated

**Impact:**
- Hard to know if migrations were successful
- No record of issues encountered
- No validation that record counts match

**Recommendation:** Generate migration reports for all completed imports

---

## Proposed Changes

### Phase 1: Cleanup and Consolidation

1. **Remove redundant top-level plan**
   ```bash
   rm docs/SANITY_MIGRATION_PLAN.md
   ```

2. **Create archive directory and move legacy docs**
   ```bash
   mkdir -p docs/archive/php-mvc-migration
   mkdir -p docs/archive/legacy-processes
   
   mv docs/DEEJAY_MIGRATION_REPORT.md docs/archive/php-mvc-migration/
   mv docs/MRM_MIGRATION_REPORT.md docs/archive/php-mvc-migration/
   mv docs/MRM_ANNUAL_UPDATE.md docs/archive/legacy-processes/
   ```

3. **Create migration reports directory**
   ```bash
   mkdir -p docs/migrations/reports
   ```

4. **Add README files to archive directories**
   - Explain what these documents are
   - Note that they're preserved for historical reference
   - Link to current/active documentation

### Phase 2: Update References

5. **Update README.md** to point to new documentation structure

6. **Add archive section** to main documentation explaining historical docs

7. **Create migration reports** for completed imports:
   - Ads Migration Report
   - Concerts Migration Report
   - CD of the Week Migration Report
   - OnDemand Migration Report
   - Posts Migration Report

### Phase 3: Enhance Documentation

8. **Update Chapter 3** (Core Data Models) with current status from this review

9. **Create quick start guide** for running remaining imports

10. **Document feature flag implementation** plan in Chapter 6

---

## File Structure (After Cleanup)

```
docs/
├── SANITY_MIGRATION_STATUS.md        ← Current status (new)
├── CODE_QUALITY.md                   ← General project doc
├── sanity-migration/                 ← Main migration docs (kept as-is)
│   ├── README.md                     ← PRIMARY INDEX
│   └── [11 chapter files]
├── migrations/
│   ├── phases/                       ← Phase definitions
│   └── reports/                      ← Migration reports (new)
│       ├── README.md                 ← Template and guidelines
│       ├── ads-migration-report.md
│       ├── concerts-migration-report.md
│       ├── cdotw-migration-report.md
│       ├── ondemand-migration-report.md
│       └── posts-migration-report.md
└── archive/                          ← Historical documents (new)
    ├── README.md                     ← Explains archive purpose
    ├── php-mvc-migration/            ← PHP refactoring reports
    │   ├── DEEJAY_MIGRATION_REPORT.md
    │   └── MRM_MIGRATION_REPORT.md
    └── legacy-processes/             ← Old workflows
        └── MRM_ANNUAL_UPDATE.md
```

---

## Benefits of Proposed Changes

1. **Clearer Structure** - One clear path for Sanity migration docs
2. **Reduced Confusion** - Archive separates historical from current docs
3. **Better Tracking** - Dedicated reports directory for migration validation
4. **Easier Navigation** - Primary index clearly identified
5. **Preserved History** - Nothing deleted, just better organized
6. **Future-Proof** - Structure supports ongoing migration work

---

## Implementation Priority

### High Priority (Do Now)
- ✅ Create status report (done)
- 🔲 Remove `SANITY_MIGRATION_PLAN.md`
- 🔲 Create archive directories
- 🔲 Move legacy docs to archive
- 🔲 Update main README with new structure

### Medium Priority (Do Soon)
- 🔲 Create migration reports directory
- 🔲 Add archive README files
- 🔲 Update Chapter 3 with current status

### Low Priority (Can Wait)
- 🔲 Generate migration reports for completed imports
- 🔲 Create quick start guide
- 🔲 Document feature flag implementation

---

## Questions for Review

1. **Is it acceptable to move the MVC migration reports to archive?** They document important refactoring work but aren't related to Sanity migration.

2. **Should we generate migration reports retroactively?** The imports were successful, but formal reports don't exist.

3. **What's the priority for the remaining import scripts?** Should we complete `importMusic.ts` and `importShows.ts` before or after cleanup?

4. **Should legacy process docs be updated with Sanity replacements?** Or just marked as deprecated with links to new Sanity-based processes?

---

## Next Actions

See the PR description for the step-by-step implementation of this cleanup plan.
