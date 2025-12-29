# Payload CMS Migration Plan

**Last Updated:** December 28, 2025 (Initial Version)  
**Project Goal:** Migrate from homemade PHP/MySQL to Payload CMS with PostgreSQL on Netlify + Neon, then build a modern responsive site redesign.

---

## Overview

This migration plan provides an alternative to the Sanity CMS approach, leveraging **Payload CMS** (a code-first headless CMS) with **PostgreSQL** on **Neon** (serverless Postgres), deployed to **Netlify**. This stack offers:

- **Relational database continuity**: MySQL → PostgreSQL migration is simpler than MySQL → NoSQL
- **Direct database access**: PHP can query PostgreSQL directly without learning GraphQL or GROQ
- **Code-first configuration**: Collections defined in TypeScript with full type safety
- **Built-in REST + GraphQL APIs**: No need to learn GROQ query language
- **Self-hosted flexibility**: Full control over CMS and deployment
- **Rich text editing**: TipTap-based editor with extensible blocks
- **Authentication & roles**: Built-in user management and access control

---

## Chapters

| Chapter | Description |
|---------|-------------|
| [01 - Project Overview](./01-project-overview.md) | Two-phase project goals, current state, migration strategy with Payload/PostgreSQL |
| [02 - Architecture Decisions](./02-architecture-decisions.md) | Data handling, content models, collection patterns for Payload |
| [03 - Core Data Models](./03-core-data-models.md) | Priority-ordered list of all collections with status |
| [03.5 - PHP PostgreSQL Querying](./03.5-php-postgresql-querying.md) | Direct PostgreSQL access from PHP without GraphQL/GROQ |
| [04 - Migration Tasks](./04-migration-tasks.md) | Step-by-step self-contained tasks for migration |
| [05 - Shared Utilities](./05-shared-utilities.md) | File structure and migration patterns |
| [06 - Frontend Cutover Strategy](./06-frontend-cutover.md) | Feature flag testing, Netlify deployment, full cutover |
| [07 - Success Criteria](./07-success-criteria.md) | Per-collection checklist and project completion criteria |
| [08 - Quick Reference](./08-quick-reference.md) | Commands, REST/GraphQL queries, migration report template |
| [09 - Relational Advantages](./09-relational-advantages.md) | Benefits of MySQL→PostgreSQL vs MySQL→NoSQL migration |
| [10 - CMS Comparison](./10-cms-switching-considerations.md) | Sanity vs Payload comparison for MySQL migration |
| [11 - Capacity Planning](./11-capacity-planning.md) | PostgreSQL limits, Neon pricing, content inventory |
| [12 - Cloudinary Integration](./12-cloudinary-integration.md) | Detailed guide for media storage with Cloudinary |

---

## How to Use This Plan

Each chapter is designed to be **self-contained** for cold-start agent conversations. When starting a new task:

1. Read [04 - Migration Tasks](./04-migration-tasks.md) to find your task
2. Review [02 - Architecture Decisions](./02-architecture-decisions.md) for context
3. Check [05 - Shared Utilities](./05-shared-utilities.md) for common patterns
4. Follow [07 - Success Criteria](./07-success-criteria.md) to verify completion
5. For media/images, see [12 - Cloudinary Integration](./12-cloudinary-integration.md)

---

## Key Differences from Sanity Migration

| Aspect | Sanity Approach | Payload Approach |
|--------|----------------|------------------|
| **CMS Type** | Hosted SaaS, Studio UI | Self-hosted, Admin UI |
| **Database** | Proprietary NoSQL | PostgreSQL (Neon) |
| **Schema Definition** | JavaScript/TypeScript schemas | TypeScript collections with full type safety |
| **Queries** | GROQ (custom query language) | REST API + GraphQL + Direct SQL |
| **PHP Integration** | Requires GraphQL/GROQ learning | Direct PostgreSQL queries with PDO |
| **Deployment** | Sanity Studio hosted | Netlify Functions + Admin UI |
| **Assets** | Sanity CDN | Custom storage (e.g., Cloudinary, S3) |
| **Rich Text** | Portable Text (proprietary) | TipTap / Lexical (open standards) |
| **Migration Complexity** | NoSQL document store | Relational (simpler from MySQL) |

---

## Quick Links

- **Start a new collection task:** [Migration Tasks](./04-migration-tasks.md)
- **Check collection status:** [Core Data Models](./03-core-data-models.md)
- **PHP to PostgreSQL integration:** [PHP PostgreSQL Querying](./03.5-php-postgresql-querying.md)
- **Set up media storage:** [Cloudinary Integration](./12-cloudinary-integration.md)
- **Understand relational benefits:** [Relational Advantages](./09-relational-advantages.md)
- **Review switching complexity:** [CMS Switching Considerations](./10-cms-switching-considerations.md)
- **Understand the strategy:** [Project Overview](./01-project-overview.md)
