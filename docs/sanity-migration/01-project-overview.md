# Chapter 1: Project Overview

[← Back to Index](./README.md)

---

## Two-Phase Project

1. **Phase 1 (Current):** Replace PHP admin dashboard with Sanity CMS
2. **Phase 2 (Future):** Build responsive site redesign with modern web platform technology

---

## Current State

- Legacy PHP/MySQL site with custom admin dashboard
- Sanity Studio set up at `/sanity` path
- `person` and `dj` schemas already created and migrated
- Migration script exists: `bin/migrations/importDeejays.ts`

---

## Migration Strategy

| Strategy | Details |
|----------|---------|
| **Upsert migrations** | If record exists, update it; otherwise create new |
| **Incremental approach** | Run migrations repeatedly until full parity |
| **Feature flag cutover** | Read from Sanity behind feature flag, then cut over when ready |
| **No dual-write** | Keep MySQL as source of truth until full cutover |

---

## Next Steps

- Review [Architecture Decisions](./02-architecture-decisions.md) for data handling rules
- Check [Core Data Models](./03-core-data-models.md) for model priorities
- Start with [Migration Tasks](./04-migration-tasks.md)
