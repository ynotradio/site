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
   Most MySQL tables have a `deleted` field. **Decision:** Use Sanity's draft/published state to handle soft-deleted records.

5. **Foreign Key Relationships**  
   Phase 4 (MRM) has foreign keys between `mrm_matches` and `mrm_bands`. **Decision:** Use Sanity references for relationships. Artists (bands) should not be deleted or unpublished once they're associated with published entities such as posts, music entries, top 11 polls, or MRM matches.
   
   **Artist Data Model:**
   - Use "artist" as the generic content type (replacing "band")
   - In Modern Rock Madness, multiple artists can be "teamed up" (e.g., Jack White/White Stripes, Blur/Gorillaz)
   - Artists have a many-to-many "people" relationship (e.g., Damon Albarn could be associated with his solo career, Gorillaz, and Blur)
   - People can also have Deejay records (e.g., if Damon Albarn does a guest DJ spot)

6. **Data Validation Pre-Migration**  
   **Decision:** Fail migration on validation issues and generate a report for manual import. No automatic data cleaning—issues should be reviewed and fixed manually. Validation should check for:
   - Orphaned records
   - Invalid URLs
   - Duplicate entries
   - Encoding issues in text fields

### Content Migration

7. **Rich Text/HTML Content**  
   Phase 2 mentions HTML content in `CustomText` and `Story` tables. **Decision:** Use Sanity's Portable Text format. Consider combining `CustomText` and `Story` into a unified content model since they serve similar purposes (rich content with optional images and dates).

8. **Image Migration Strategy**  
   **Decision:** Migrate images to Sanity's asset pipeline whenever possible. For models with `pic_url` fields pointing to external URLs (e.g., Imgur), migrate them to Sanity assets rather than keeping external references.

### Historical & Time-Sensitive Data

9. **Tournament History (Phase 4)**  
   **Decision:** Keep historical tournament data going forward in Sanity, but old/past tournament data from MySQL does not need to be migrated. The tournament runs once a year, so only current/future tournament structure needs migration.

10. **Year End Poll Historical Data (Phase 5)**  
    The Year End Poll spans multiple years. Should each year be modeled separately, or should there be a year-scoped structure in Sanity?

### Technical Implementation

11. **Incremental/Upsert Migration**  
    **Decision:** Use "upsert" style migrations where:
    - If a record has already been migrated, check if it needs updating
    - Otherwise, add a new record
    - Run migrations incrementally until full parity is achieved, then cut over to Sanity

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

4. **Migration Reports**  
   Generate post-migration reports similar to `DEEJAY_MIGRATION_REPORT.md` for each model, documenting:
   - Records processed
   - Records skipped (with reasons)
   - Validation errors encountered
   - Image assets uploaded

5. **Phased Frontend Cutover**  
   Instead of a big-bang frontend migration:
   - Phase A: Read from Sanity behind a feature flag (for testing)
   - Phase B: Keep running incremental migrations until full parity
   - Phase C: Cut over to Sanity once parity is achieved; MySQL becomes archive

### Schema Design Suggestions

6. **Add Base Document Fields**  
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

7. **Use Document References Consistently**  
   For Phase 4 & 5, complex relationships could benefit from Sanity's reference system:
   ```typescript
   // MRM Match document
   {
     name: 'artist1',
     title: 'Artist 1',
     type: 'reference',
     to: [{ type: 'artist' }],
   },
   {
     name: 'artist2',
     title: 'Artist 2',
     type: 'reference',
     to: [{ type: 'artist' }],
   },
   {
     name: 'winner',
     title: 'Winner',
     type: 'reference',
     to: [{ type: 'artist' }],
   }
   ```

8. **Singleton Documents via Structure Builder**  
   For configuration data like `_mrm_config.php`, use Sanity singleton documents implemented via the Structure Builder (customize `studio/deskStructure.ts`):
   ```typescript
   {
     name: 'mrmConfig',
     title: 'MRM Configuration',
     type: 'document',
     fields: [
       { 
         name: 'startDate', 
         title: 'Start Date',
         type: 'date' 
       },
       { 
         name: 'bracketPdfUrl', 
         title: 'Bracket PDF URL',
         type: 'url' 
       },
       // ...
     ]
   }
   ```

### Risk Mitigation

9. **Define Success Criteria**  
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

The migration plan is well-structured with clear phases and good documentation of database schemas. The phased approach with increasing complexity is appropriate.

### Key Decisions Made

- **Soft deletes**: Use Sanity's draft/published state
- **Artists**: Use as generic content type with many-to-many people relationships; prevent deletion when associated with published content
- **Data validation**: Fail on issues and generate reports for manual review
- **Rich text**: Use Sanity's Portable Text format
- **Images**: Migrate to Sanity assets whenever possible
- **Historical data**: Keep going forward, don't migrate old tournament data
- **Migration strategy**: Upsert-style incremental migrations until parity, then cut over
- **Frontend approach**: Read from Sanity behind feature flag, then cut over once ready

Would be happy to help implement any of these suggestions or dive deeper into specific questions!
