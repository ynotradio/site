# Sanity Migration Plan Review

**Date:** November 27, 2025  
**Reviewer:** GitHub Copilot

---

## Overview

After reviewing the migration plan documentation in `docs/migrations/phases/`, I have compiled the following questions and suggestions organized by area.

---

## Questions

### Phase Sequencing & Dependencies

1. **Deejay/Person Schema Already Migrated?**  
   The `person` and `dj` schemas in `/studio/schemaTypes/` suggest Phase 1's Deejay migration is partially complete. What is the current status of the other Phase 1 models (Ad, CdOfTheWeek, Concert, Music, OnDemand, Schedule, YearEndStaffPick)?

2. **Cross-Phase Dependencies**  
   Phase 5 (Year End Poll) references `YearEndStaffPick` from Phase 1. Should these be migrated together to maintain referential integrity, or is there a data relationship strategy?

3. **Parallel Migration Capability**  
   The plan says phases should be sequential, but could some models within a phase be migrated in parallel? For example, could `Ad`, `Concert`, and `Music` in Phase 1 be migrated independently?

### Data Integrity & Validation

4. **Soft Delete Strategy**  
   Most MySQL tables have a `deleted` field. How will soft-deleted records be handled in Sanity? Options include:
   - Not migrating deleted records at all
   - Migrating them with an `isDeleted` boolean field
   - Using Sanity's draft/published state

5. **Foreign Key Relationships**  
   Phase 4 (MRM) has foreign keys between `mrm_matches` and `mrm_bands`. How will these relationships be modeled in Sanity? Will they use Sanity references, and if so, what happens if bands are deleted?

6. **Data Validation Pre-Migration**  
   Is there a plan to validate and clean the MySQL data before migration? For example, checking for:
   - Orphaned records
   - Invalid URLs
   - Duplicate entries
   - Encoding issues in text fields

### Content Migration

7. **Rich Text/HTML Content**  
   Phase 2 mentions HTML content in `CustomText` and `Story` tables. Will this be:
   - Converted to Sanity's Portable Text format?
   - Stored as raw HTML in a text field?
   - Sanitized for security (XSS prevention)?

8. **Image Migration Strategy**  
   The current `importDeejays.ts` uploads images as Sanity assets. For models with `pic_url` fields pointing to external URLs (e.g., Imgur), should these be:
   - Migrated to Sanity's asset pipeline?
   - Left as external URL references?
   - A hybrid approach based on domain?

### Historical & Time-Sensitive Data

9. **Tournament History (Phase 4)**  
   Should historical MRM tournament data be migrated, or only the current/upcoming tournament structure? Historical data could be valuable for archives but adds complexity.

10. **Year End Poll Historical Data (Phase 5)**  
    The Year End Poll spans multiple years. Should each year be modeled separately, or should there be a year-scoped structure in Sanity?

### Technical Implementation

11. **Migration Rollback Strategy**  
    Is there a rollback plan if a migration phase fails or corrupts data? This could involve:
    - Sanity dataset snapshots before each phase
    - MySQL backup verification
    - Dry-run capability in migration scripts

12. **Incremental vs. Full Migration**  
    Will migrations be one-time full imports, or do you need support for incremental/delta migrations for ongoing updates during the transition period?

13. **Environment Strategy**  
    What's the plan for staging/testing migrations? Will there be:
    - A separate Sanity dataset for testing (e.g., `staging` vs `production`)?
    - Test migrations against a copy of production data?

---

## Suggestions

### Documentation Improvements

1. **Add Migration Status Tracking**  
   Consider adding a `status` field to each phase in `index.yml`:
   ```yaml
   - phase: 1
     name: "Basic Models"
     status: "in_progress"  # not_started | in_progress | completed | blocked
     models:
       - name: Deejay
         status: completed
       - name: Ad
         status: not_started
   ```

2. **Create a Migration Checklist**  
   For each model, document:
   - [ ] Schema designed in Sanity
   - [ ] Migration script created
   - [ ] Test migration completed
   - [ ] Data validated
   - [ ] Production migration completed
   - [ ] PHP code updated to use Sanity

### Technical Suggestions

3. **Shared Migration Utilities**  
   Create a `bin/migrations/shared/` folder with:
   - `imageUploader.ts` - Reusable image asset upload logic
   - `richTextConverter.ts` - HTML to Portable Text conversion
   - `validation.ts` - Data validation utilities
   - `logger.ts` - Consistent logging across all migrations

4. **Dry Run Mode**  
   Add a `--dry-run` flag to migration scripts that:
   - Validates source data
   - Shows what would be migrated
   - Doesn't write to Sanity
   - Generates a preview report

5. **Migration Reports**  
   Generate post-migration reports similar to `DEEJAY_MIGRATION_REPORT.md` for each model, documenting:
   - Records processed
   - Records skipped (with reasons)
   - Validation errors encountered
   - Image assets uploaded

6. **Consider a Phased Frontend Approach**  
   Instead of a big-bang frontend migration, consider:
   - Phase A: Read from Sanity, fall back to MySQL
   - Phase B: Write to both Sanity and MySQL (dual-write)
   - Phase C: Read/write only Sanity, MySQL becomes archive

### Schema Design Suggestions

7. **Add Base Document Fields**  
   Consider adding consistent metadata fields across all document types:
   ```typescript
   {
     name: '_legacyId',
     title: 'Legacy ID',
     type: 'number',
     description: 'Original MySQL ID for reference',
     readOnly: true,
   },
   {
     name: '_migratedAt',
     title: 'Migrated At',
     type: 'datetime',
     description: 'When the record was migrated',
     readOnly: true,
   }
   ```

8. **Use Document References Consistently**  
   For Phase 4 & 5, complex relationships could benefit from Sanity's reference system:
   ```typescript
   // MRM Match document
   {
     band1: { type: 'reference', to: [{ type: 'band' }] },
     band2: { type: 'reference', to: [{ type: 'band' }] },
     winner: { type: 'reference', to: [{ type: 'band' }] },
   }
   ```

9. **Consider Singleton Documents**  
   For configuration data like `_mrm_config.php`, use Sanity singleton documents:
   ```typescript
   {
     name: 'mrmConfig',
     type: 'document',
     __experimental_singleton: true,
     fields: [
       { name: 'startDate', type: 'date' },
       { name: 'bracketPdfUrl', type: 'url' },
       // ...
     ]
   }
   ```

### Risk Mitigation

10. **Identify Critical Path**  
    Consider which features are most important to migrate first based on:
    - User traffic/engagement
    - Content update frequency
    - Admin pain points
    
    This might reorder priorities within phases.

11. **Plan for Dual-System Period**  
    During migration, you'll likely need to support both MySQL and Sanity. Document:
    - How long this period will last per phase
    - Which system is the source of truth
    - How conflicts will be resolved

12. **Define Success Criteria**  
    For each phase, define clear acceptance criteria:
    - All X records migrated successfully
    - No data loss (verified by record count comparison)
    - All images accessible
    - Frontend renders correctly from Sanity data
    - Admin can create/edit content in Sanity Studio

---

## Recommended Next Steps

1. **Complete Phase 1 Status Assessment**  
   Determine which Phase 1 models are already migrated and update documentation.

2. **Create a Migration Timeline**  
   Add estimated dates for each phase completion.

3. **Set Up Staging Environment**  
   Create a `staging` dataset in Sanity for safe testing.

4. **Build Shared Migration Infrastructure**  
   Before tackling more models, invest in reusable utilities.

5. **Prioritize Based on Business Value**  
   Consider if any Phase 2-5 features should be moved earlier based on business needs.

---

## Summary

The migration plan is well-structured with clear phases and good documentation of database schemas. The phased approach with increasing complexity is appropriate. The main areas to clarify are:

- **Status tracking** for in-progress work
- **Data handling strategies** for soft deletes, rich text, and external images  
- **Rollback and testing procedures**
- **Timeline and success criteria**

Would be happy to help implement any of these suggestions or dive deeper into specific questions!
