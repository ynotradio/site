# Legacy Processes

This directory contains documentation of workflows and administrative processes from the legacy PHP/MySQL system.

---

## Purpose

These documents describe how things **used to work** before the Sanity CMS migration. They are preserved for:

- Historical reference
- Understanding the legacy system's workflows
- Comparing old vs. new processes
- Onboarding developers who need to work with legacy code

---

## Documents

### `MRM_ANNUAL_UPDATE.md`

**What it describes:** The manual process for updating Modern Rock Madness tournament each year using the legacy PHP admin interface.

**Status:** Legacy process (will be replaced by Sanity Studio workflows)

**Key Steps:**
1. Update configuration in `_mrm_config.php`
2. Generate reset SQL in PHP admin
3. Manually upload band images
4. Add bands through PHP admin interface

**Sanity Replacement:** With Sanity Studio, this process will be:
- More intuitive with visual editors
- Automated schema validation
- Easier image management through Sanity's asset pipeline
- Documented in the Sanity migration docs

---

## Transitioning from Legacy to Sanity

When the Sanity CMS migration is complete (Phase 1), these legacy processes will be obsolete. New processes will be documented in:

- **Sanity Studio Guide** (to be created)
- **Content Manager Training** (to be created)
- **Sanity Migration Docs:** [`/docs/sanity-migration/`](../../sanity-migration/)

---

## For Developers

If you need to work with the legacy PHP admin system:

1. Review these legacy process docs
2. Check the PHP admin pages in `/src/cp/`
3. See the MVC models in `/src/models/`
4. Understand that this system is being phased out

If you're implementing new features, **prefer building them in Sanity Studio** rather than the legacy PHP admin.

---

## See Also

- **Sanity Migration Status:** [`/docs/SANITY_MIGRATION_STATUS.md`](../../SANITY_MIGRATION_STATUS.md)
- **Modern Rock Madness Sanity Schema:** [`/studio/schemaTypes/modernRockMadness*.ts`](../../../studio/schemaTypes/)
