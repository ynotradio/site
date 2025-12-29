# Chapter 1: Project Overview

[← Back to Index](./README.md)

---

## Two-Phase Project

1. **Phase 1:** Replace PHP admin with Payload CMS + PostgreSQL
2. **Phase 2:** Build responsive site redesign

---

## Current State

- Legacy PHP/MySQL site with custom admin
- Established MySQL schema and relationships
- Evaluating modern CMS options

---

## Why Payload + PostgreSQL?

**Payload CMS:**
- TypeScript-native collections
- Self-hosted, open source
- Git-based configuration

**Neon PostgreSQL:**
- Serverless, scales to zero
- Database branching (dev/staging/prod)
- Free tier: 0.5 GB, 191 compute hours/month

**Netlify Hosting:**
- Edge Functions for Payload API
- Auto-deploy CI/CD
- Preview deploys

---

## Migration Strategy

| Strategy | Details |
|----------|---------|
| **Relational continuity** | MySQL → PostgreSQL (simpler than NoSQL) |
| **Upsert migrations** | Update if exists, create if new |
| **Feature flags** | Gradual cutover from MySQL to Payload |
| **No dual-write** | MySQL stays source of truth until cutover |

---

## Stack Comparison

| Component | Current | Proposed |
|-----------|---------|----------|
| **Frontend** | PHP (SSR) | PHP → Payload API |
| **Database** | MySQL | PostgreSQL (Neon) |
| **CMS** | Custom PHP admin | Payload Admin |
| **API** | Direct MySQL | REST + GraphQL |
| **Hosting** | AWS Lightsail | Netlify Functions |
| **Assets** | Local filesystem | Cloudinary/S3 |

---

## Migration Phases

1. **Database:** Export MySQL → Convert → Import to PostgreSQL
2. **Collections:** Define in TypeScript, test CRUD
3. **APIs:** Build REST/GraphQL endpoints
4. **Frontend:** Add feature flags, gradual cutover
5. **Decommission:** Archive MySQL, remove PHP admin

---

## Key Advantages Over Sanity

### MySQL → PostgreSQL
- Tables stay tables (not documents)
- Foreign keys enforced at DB level
- Standard SQL (not GROQ)
- ACID transactions

### Unified Database
- Votes + content in one PostgreSQL DB
- No hybrid architecture needed
- Simpler backups and queries

### Cost & Control
- $0-38/month vs Sanity $99/month
- No vendor lock-in
- Full infrastructure control

---
3. Test with production data clones
4. Monitor performance and errors

### Phase 4: Frontend Cutover
1. Update PHP to read from Payload API
2. Enable feature flags incrementally (per-page)
3. Monitor analytics and error rates
4. Full cutover when stable

### Phase 5: Decommission Legacy
1. Archive MySQL database
2. Remove PHP admin dashboard
3. Document new workflows
4. Train content editors on Payload Admin

---

## Next Steps

- [Architecture Decisions](./02-architecture-decisions.md) - Data handling patterns
- [Core Data Models](./03-core-data-models.md) - Collection priorities
- [Relational Advantages](./09-relational-advantages.md) - MySQL→PostgreSQL benefits
- [CMS Comparison](./10-cms-switching-considerations.md) - Sanity vs Payload
- [Migration Tasks](./04-migration-tasks.md) - Implementation steps
