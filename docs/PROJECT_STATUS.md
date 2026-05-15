# Project Status - Y-Not Radio Site Migration

**Last Updated:** March 2026  
**Current Phase:** Pre-Cutover Validation — Ready for incremental flag enablement

---

## Overview

The Y-Not Radio site is undergoing a migration from legacy PHP/MySQL to a modern stack using Payload CMS with PostgreSQL. This document tracks the current state of the migration.

---

## Migration Status

### ✅ Completed

#### Infrastructure Setup (2025)

- [x] Payload CMS installed and configured
- [x] PostgreSQL (Neon) connection established (prod + dev databases)
- [x] Netlify deployment configured
- [x] Cloudinary media storage integrated (credentials confirmed in prod)
- [x] GitHub Actions CI/CD pipeline

#### Payload Collections Created (2025)

- [x] Users (authentication)
- [x] Media (image uploads with Cloudinary)
- [x] People (individuals - DJs, musicians)
- [x] DJs (Y-Not Radio hosts)
- [x] Artists (bands/musicians)
- [x] Venues (concert locations)
- [x] Concerts (event listings)
- [x] Songs (music catalog)
- [x] Records (albums for CD of the Week)
- [x] CdOfTheWeek (album reviews)
- [x] Shows (schedule entries)
- [x] Posts (content blocks)
- [x] OnDemand (audio content)
- [x] Ads (sponsor advertisements)

#### Migration Scripts Created (2025)

- [x] `importDJs.ts` - DJ data import with MusicBrainz integration
- [x] `importConcerts.ts` - Concert data import
- [x] `importMusic.ts` - Songs and Records import
- [x] `importCdOfTheWeek.ts` - CD of the Week reviews
- [x] `importSchedule.ts` - Show schedule import
- [x] `importPosts.ts` - Content blocks import
- [x] `importOnDemand.ts` - Audio content import
- [x] `importAds.ts` - Advertisement import
- [x] `mediaImporter.ts` - Shared utility for image migration

#### Custom Features Implemented (2025)

- [x] MusicBrainz custom field components (Artist, Release, Recording search)
- [x] PostgreSQL Concert read model with feature flag support
- [x] Multi-person DJ support (e.g., "M.J. & Patria")
- [x] Hierarchical navigation system for Payload

#### Testing Infrastructure (2025)

- [x] Vitest test suite configured
- [x] ESLint + TypeScript linting
- [x] Storybook for UI component development
- [x] Test coverage reporting
- [x] Comprehensive test files for migration scripts

#### Modern Rock Madness — Complete (March 2026)

All 5 collections, admin interfaces, bracket view, voting, and live match dashboard are built and tested on production. MRM is running on Postgres in prod.

- [x] MadnessTournaments (`madness-tournaments`) — annual tournament config
- [x] MadnessBands (`madness-bands`) — tournament participants (name/seed/placement/sponsor)
- [x] MadnessMatches (`madness-matches`) — bracket matchups with `nextMatch` progression field
- [x] MadnessVotes (`madness-votes`) — individual vote records
- [x] MadnessMatchEvents (`madness-match-events`) — audit log (overtime, admin_vote, match_closed, rematch)
- [x] Live Match Dashboard (`/admin/mrm-live`) — auto-polling vote display, Manual Vote/Close/Extend actions, bracket progression on close, audit logging
- [x] Match Controls tab — per-match edit tab with vote monitoring, admin actions (manual vote, close, extend, toggle scores, schedule rematch)
- [x] Tournament Bracket tab — per-tournament edit tab showing full bracket tree with click-through to match controls

#### Production Data Import — Complete (March 2026)

All collections imported to prod Neon. Over 6,370 records validated via integrity checks.

- [x] Run all import scripts against production MySQL
- [x] Import DJ photos and artist media to Cloudinary
- [x] Validate data integrity after imports (6 integrity check scripts)

#### Data Integrity — Validated and Cleaned (March 2026)

Six integrity check scripts (`bin/integrity-check-*.ts`) run with `--fix` against prod:

| Check           | Fixed | Failures                             |
| --------------- | ----- | ------------------------------------ |
| display-names   | 599   | 0                                    |
| ondemand-source | 520   | 0                                    |
| publish-status  | 543   | 0                                    |
| record-metadata | 813   | 11 (coverImage — acceptable)         |
| slugs           | 7,138 | 34 (uniqueness conflicts — resolved) |
| musicbrainz     | 331   | 6 (niche local artists — acceptable) |

#### Artist Data Cleanup — Complete (March 2026)

- [x] 20 "Y-Not Radio Presents:" duplicate artists consolidated
- [x] 6 artist names corrected (renamed)
- [x] 12 mojibake artist names fixed (encoding issues)
- [x] 37 duplicate artist pairs merged (exact dupes, "The X"/"X", "&"/"and" standardization)
- [x] `bin/migrations/shared/artistCleaner.ts` — reusable cleanup utility with unit tests

#### Nightly Sync — Running (March 2026)

- [x] `nightly-gap-report.yml` Buildkite pipeline runs daily at 3 AM UTC
- [x] Nightly sync limited to Schedule, Stories, and Custom Texts
- [x] Publish-status integrity check runs after each sync for migrated posts

#### Weekly Dev DB Sync — Running (March 2026)

- [x] `scheduled-db-sync.yml` copies prod Neon → dev Neon every Monday at 2 AM UTC

#### Feature Flags Infrastructure — Dissolved (post-cutover)

The `USE_POSTGRES_*` feature flag system has been removed. Every factory now hardcodes
its data source:

- **Postgres-backed (via Payload):** Concerts, OnDemand, Deejays, Music, CdOfTheWeek, Ads, Modern Rock Madness
- **MySQL-backed (legacy admin):** Stories, Schedule, CustomText

`src/config/features.php` is empty and `FeatureManager` is retained only for any future
non-data-source flags.

#### PHP Postgres Models — Complete (March 2026)

Readonly Postgres implementations with Cloudinary image support for all migrated content
collections live in `src/models/implementations/Postgres*.php`.

---

### 📋 Planned

#### Additional Collections (Needs Requirements)

- [ ] Top11Contests (weekly contest configuration)
- [ ] Top11Results (published weekly results)
- [ ] Top11Votes (user voting data)
- [ ] YearEndPolls (annual poll configuration)
- [ ] YearEndPollCategories (poll categories)
- [ ] YearEndPollVotes (user votes)

#### Migration Scripts

- [ ] Import Top 11 historical data
- [ ] Import Year End Poll historical data

#### Frontend Cutover (Future)

- [ ] Build Next.js frontend components
- [ ] Responsive redesign of public site
- [ ] Full production cutover (retire PHP)

---

## Recent Achievements

### March 2026

- **Production Data Import**: All collections imported to prod Neon (6,370+ records). Six integrity check scripts validate data correctness on every nightly sync.
- **Nightly Sync Pipeline**: `nightly-gap-report.yml` runs daily at 3 AM UTC — incremental MySQL→Neon import followed by integrity checks. Dev database synced weekly from prod.
- **Data Integrity Cleanup**: All six integrity checks run with `--fix`: display names, slugs, musicbrainz, record metadata, ondemand source, and publish status. Tens of thousands of records fixed automatically.
- **Artist Deduplication**: Consolidated 20 "Y-Not Radio Presents:" duplicates, fixed 12 mojibake names, merged 37 duplicate pairs using exact match, "The X"/"X", and "&"/"and" standardization.
- **Feature Flags**: Built `FeatureManager.php` with env var, cookie, and URL param overrides. 11 flags defined in `features.php` covering all collections. All flags default to `false` (MySQL remains active).
- **PHP Postgres Models**: 8 factory classes with Postgres implementations — ConcertFactory, DeejayFactory, MusicFactory, OnDemandFactory, ScheduleFactory, CdOfTheWeekFactory, CustomTextFactory, StoryFactory. All readonly with Cloudinary image support.
- **MRM on Production**: All 5 MRM collections, admin interfaces, bracket view, voting, and live match dashboard fully built and tested on production Postgres.
- **MRM Admin Interfaces**: Replaced legacy `mrm_manage_matches.php` with Live Match Dashboard (`/admin/mrm-live`) featuring auto-polling vote counts, Manual Vote/Close/Extend Overtime actions, and automatic bracket progression.

### December 2025 - January 2026

- **MusicBrainz Integration**: Implemented custom Payload field components for searching and selecting MusicBrainz entities (artists, releases, recordings) directly from the admin UI
- **PostgreSQL Read Model**: Created PostgreSQL-backed concert model that reads from Payload's database while maintaining MySQL compatibility via feature flags
- **Multi-Person DJ Support**: Enhanced DJ collection and import script to handle DJs like "M.J. & Patria" by creating multiple Person records
- **Migration Script Testing**: Added comprehensive test coverage for all data import scripts

### November 2025

- **Collection Schema Design**: Finalized all core Payload collection schemas with proper relationships
- **Cloudinary Setup**: Integrated Cloudinary for scalable media storage
- **Import Utilities**: Built shared utilities for idempotent data imports with MusicBrainz lookup

---

## Current Priorities

1. **Incremental Flag Enablement**: Enable Postgres feature flags one collection at a time, starting with lowest-risk (concerts). Validate each via URL param (`?ff=use_postgres_concerts`) before enabling by default.
2. **Top 11 Collections**: Define requirements, create collections and migration scripts for Top 11 contests.
3. **Year End Poll Collections**: Define requirements, create collections for annual polls.

---

## Known Issues & Blockers

None. All systems operational:

- Production data import complete and validated
- Nightly sync running successfully
- All integrity checks passing (minor acceptable failures: 11 coverImage, 6 niche MusicBrainz artists)

---

## Documentation Links

- [Migration Overview](./payload-migration/README.md)
- [Core Data Models](./payload-migration/03-core-data-models.md)
- [Migration Tasks](./payload-migration/04-migration-tasks.md)
- [Frontend Cutover Strategy](./payload-migration/06-frontend-cutover.md)
- [Testing PR Changes Skill](../.claude/skills/testing-pr-changes/SKILL.md)
- [Completed Implementations](./archive/completed-implementations/)

---

## Questions or Issues?

- Open an issue on [GitHub](https://github.com/ynotradio/site/issues)
- Review [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
