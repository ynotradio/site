# Sanity CMS Migration Plan

**Last Updated:** November 28, 2025 (Revision 3)  
**Project Goal:** Replace the homemade PHP content management dashboard with Sanity CMS, then build a modern responsive site redesign.

---

> **Note:** This document has been split into chapter files for easier navigation.  
> See the [Migration Plan Index](./sanity-migration/README.md) for all chapters.

---

## Quick Links

| Chapter | Description |
|---------|-------------|
| [01 - Project Overview](./sanity-migration/01-project-overview.md) | Two-phase project goals, current state, migration strategy |
| [02 - Architecture Decisions](./sanity-migration/02-architecture-decisions.md) | Data handling, content models, base document fields |
| [03 - Core Data Models](./sanity-migration/03-core-data-models.md) | Priority-ordered list of all models with status |
| [04 - Migration Tasks](./sanity-migration/04-migration-tasks.md) | 14 self-contained tasks for cold-start agent conversations |
| [05 - Shared Utilities](./sanity-migration/05-shared-utilities.md) | File structure and upsert pattern |
| [06 - Frontend Cutover Strategy](./sanity-migration/06-frontend-cutover.md) | Feature flag testing, incremental migration, full cutover |
| [07 - Success Criteria](./sanity-migration/07-success-criteria.md) | Per-model checklist and project completion criteria |
| [08 - Quick Reference](./sanity-migration/08-quick-reference.md) | Commands, GROQ queries, migration report template |

---

## How to Use This Plan

Each chapter is designed to be **self-contained** for cold-start agent conversations. When starting a new task:

1. Read [04 - Migration Tasks](./sanity-migration/04-migration-tasks.md) to find your task
2. Review [02 - Architecture Decisions](./sanity-migration/02-architecture-decisions.md) for context
3. Check [05 - Shared Utilities](./sanity-migration/05-shared-utilities.md) for common patterns
4. Follow [07 - Success Criteria](./sanity-migration/07-success-criteria.md) to verify completion
