# Payload CMS Documentation

**Last Updated:** June 2026

Payload CMS is the production admin for migrated Y-Not Radio content. It runs as a Netlify app backed by PostgreSQL/Neon and Cloudinary.

## Current Production Admin

- Production: `https://ynotradio-admin.netlify.app/admin`
- Local: `http://localhost:3000/admin`

## Current Content Ownership

Payload manages:

- Ads
- CD of the Week
- Concerts
- DJs / People
- Music records and songs
- On Demand
- Schedule
- Stories as Posts
- Modern Rock Madness
- Year End Poll Results display data

Legacy MySQL/admin still owns:

- Top 11
- Year End Poll voting/admin
- Staff Picks
- Custom text (served from MySQL behind `use_postgres_customtext`; targeting a
  dedicated `Pages` collection, distinct from Posts — see Chapter 15)

## Active References

1. [Project Overview](01-project-overview.md)
2. [Architecture Decisions](02-architecture-decisions.md)
3. [Core Data Models](03-core-data-models.md)
4. [PHP PostgreSQL Querying](03.5-php-postgresql-querying.md)
5. [Shared Utilities](05-shared-utilities.md)
6. [Frontend Cutover](06-frontend-cutover.md)
7. [Success Criteria](07-success-criteria.md)
8. [Quick Reference](08-quick-reference.md)
9. [Cloudinary Integration](12-cloudinary-integration.md)
10. [Year End Poll Results](13-year-end-poll-results.md)
11. [Custom Text Strategy](15-custom-text-strategy.md)
12. [Rich-Text Embeds (Custom Text Phase 1)](16-rich-text-embeds.md)
13. [PHP Deletion](17-php-deletion.md)
14. [Pages Readiness](18-pages-readiness.md)
15. [Top 11 & Year End Poll — Cutover Overview](19-top11-yep-readiness.md)
    - [Top 11 Readiness](19a-top11-readiness.md)
    - [Year End Poll Readiness](19b-yearendpoll-readiness.md)

## Historical / Planning References

- [Migration Tasks](04-migration-tasks.md)
- [Relational Advantages](09-relational-advantages.md)
- [CMS Switching Considerations](10-cms-switching-considerations.md)
- [Capacity Planning](11-capacity-planning.md)
- [Frontend Framework Evaluation](14-frontend-framework-evaluation.md)
- [Cutover Complete](CUTOVER_COMPLETE.md)

## Retired Workflows

- One-time import scripts remain in `bin/migrations/` for reference and manual repair only.
- Nightly incremental imports are disabled.
- Nightly integrity checks are disabled.
- The Buildkite nightly gap report pipeline remains as a no-op placeholder.
