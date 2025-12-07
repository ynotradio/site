# Sanity CMS Migration Plan

**Last Updated:** November 28, 2025 (Revision 3)  
**Project Goal:** Replace the homemade PHP content management dashboard with Sanity CMS, then build a modern responsive site redesign.

---

## Chapters

| Chapter | Description |
|---------|-------------|
| [01 - Project Overview](./01-project-overview.md) | Two-phase project goals, current state, migration strategy |
| [02 - Architecture Decisions](./02-architecture-decisions.md) | Data handling, content models, base document fields |
| [03 - Core Data Models](./03-core-data-models.md) | Priority-ordered list of all models with status |
| [04 - Migration Tasks](./04-migration-tasks.md) | 11 self-contained tasks for cold-start agent conversations |
| [05 - Shared Utilities](./05-shared-utilities.md) | File structure and upsert pattern |
| [06 - Frontend Cutover Strategy](./06-frontend-cutover.md) | Feature flag testing, incremental migration, full cutover |
| [07 - Success Criteria](./07-success-criteria.md) | Per-model checklist and project completion criteria |
| [08 - Quick Reference](./08-quick-reference.md) | Commands, GROQ queries, migration report template |
| [09 - Neon Integration (Top 11)](./09-neon-integration-top11.md) | Hybrid Sanity + Neon architecture for Top 11 contest |
| [10 - Neon Integration (Year End Poll)](./10-neon-integration-yep.md) | Hybrid Sanity + Neon architecture for Year End Poll |
| [11 - Neon Integration (Modern Rock Madness)](./11-neon-integration-modern-rock-madness.md) | Hybrid Sanity + Neon architecture for Modern Rock Madness |

---

## How to Use This Plan

Each chapter is designed to be **self-contained** for cold-start agent conversations. When starting a new task:

1. Read [04 - Migration Tasks](./04-migration-tasks.md) to find your task
2. Review [02 - Architecture Decisions](./02-architecture-decisions.md) for context
3. Check [05 - Shared Utilities](./05-shared-utilities.md) for common patterns
4. Follow [07 - Success Criteria](./07-success-criteria.md) to verify completion

---

## Quick Links

- **Start a new schema task:** [Migration Tasks](./04-migration-tasks.md)
- **Check model status:** [Core Data Models](./03-core-data-models.md)
- **Run migrations:** [Quick Reference](./08-quick-reference.md)
- **Understand the strategy:** [Project Overview](./01-project-overview.md)
