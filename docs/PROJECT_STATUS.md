# Project Status - Y-Not Radio Site Migration

**Last Updated:** March 7, 2026  
**Current Phase:** Payload CMS Migration - MRM Admin Interfaces Complete

---

## Overview

The Y-Not Radio site is undergoing a migration from legacy PHP/MySQL to a modern stack using Payload CMS with PostgreSQL. This document tracks the current state of the migration.

---

## Migration Status

### ✅ Completed

#### Infrastructure Setup (2025)

- [x] Payload CMS installed and configured
- [x] PostgreSQL (Neon) connection established
- [x] Netlify deployment configured
- [x] Cloudinary media storage integrated
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

#### Modern Rock Madness Collections (March 2026)

- [x] MadnessTournaments (`madness-tournaments`) — annual tournament config
- [x] MadnessBands (`madness-bands`) — tournament participants (name/seed/placement/sponsor)
- [x] MadnessMatches (`madness-matches`) — bracket matchups with `nextMatch` progression field
- [x] MadnessVotes (`madness-votes`) — individual vote records
- [x] MadnessMatchEvents (`madness-match-events`) — audit log (overtime, admin_vote, match_closed, rematch)

#### MRM Admin Interfaces (March 2026)

- [x] Live Match Dashboard (`/admin/mrm-live`) — auto-polling vote display, Manual Vote/Close/Extend actions, bracket progression on close, audit logging
- [x] Bracket Overview (`/admin/mrm-bracket`) — full bracket grouped by round, click-to-edit cards

---

### 🚧 In Progress

#### Data Migration

- [ ] Run DJ import against production MySQL data
- [ ] Run concert import against production data
- [ ] Import DJ photos from legacy URLs to Cloudinary
- [ ] Import artist photos and media
- [ ] Validate data integrity after imports

#### Frontend Integration

- [ ] Update PHP pages to read from Payload API (feature-flagged)
- [ ] Test concert page with PostgreSQL read model
- [ ] Gradual rollout of Payload-powered pages

---

### 📋 Planned

#### Additional Collections

- [ ] Top11Contests (weekly contest configuration)
- [ ] Top11Results (published weekly results)
- [ ] Top11Votes (user voting data)
- [ ] YearEndPolls (annual poll configuration)
- [ ] YearEndPollCategories (poll categories)
- [ ] YearEndPollVotes (user votes)
- [ ] ModernRockMadnessGroups → implemented as `madness-bands` ✅ (complete, see above)

#### Migration Scripts

- [ ] Import Top 11 historical data
- [ ] Import Year End Poll historical data
- [ ] Import Modern Rock Madness historical data

#### Frontend Cutover

- [ ] Feature flag all legacy PHP pages
- [ ] Build Next.js frontend components
- [ ] Responsive redesign of public site
- [ ] Full production cutover

---

## Recent Achievements

### March 2026

- **MRM Admin Interfaces**: Replaced legacy `mrm_manage_matches.php` with Live Match Dashboard (`/admin/mrm-live`) featuring auto-polling vote counts, Manual Vote/Close/Extend Overtime actions, and automatic bracket progression (winner advances to the next-round slot on close). Added Bracket Overview (`/admin/mrm-bracket`) showing all rounds in one scrollable view.
- **MRM Collections**: Created all 5 Modern Rock Madness Payload collections (Tournaments, Bands, Matches, Votes, MatchEvents). Audit trail records every admin action with event type and snapshot.

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

1. **Data Population**: Run all migration scripts against production MySQL to populate Payload collections
2. **Photo Migration**: Import all legacy DJ and artist photos to Cloudinary
3. **Data Validation**: Verify integrity of imported data (relationships, media links, etc.)
4. **Frontend Testing**: Test feature-flagged pages reading from Payload API

---

## Known Issues & Blockers

None currently. Database schema is finalized and ready for fresh initialization.

**⚠️ Database Reset Required:**
After recent schema changes (removed legacy fields, updated relationships), we recommend dropping all Payload tables in Neon and starting fresh. Use the SQL DROP statements provided, then restart the app to auto-create clean tables.

---

## Next Agent Tasks

### High Priority

1. **Database Reset**: Drop all Payload tables in Neon and restart app for clean schema
2. **DJ Photo Import**: Update `importDJs.ts` to download photos from legacy URLs (imgur, box.com, local paths) and upload to Cloudinary
3. **Production Data Import**: Execute all import scripts against production MySQL database
4. **Data Validation Script**: Create utility to compare MySQL vs PostgreSQL record counts and verify relationships

### Medium Priority

4. **Top 11 Collections**: Create collections and migration scripts for Top 11 contests
5. **Feature Flag Testing**: Test PostgreSQL concert read model in production with feature flag
6. **API Documentation**: Document Payload REST/GraphQL endpoints for frontend consumption

### Low Priority

7. **Modern Rock Madness Collections**: Create collections for tournament system
8. **Year End Poll Collections**: Create collections for annual polls
9. **Frontend Components**: Begin building Next.js components for new site design

---

## Documentation Links

- [Migration Overview](./payload-migration/README.md)
- [Core Data Models](./payload-migration/03-core-data-models.md)
- [Migration Tasks](./payload-migration/04-migration-tasks.md)
- [Testing PR Changes Skill](../.claude/skills/testing-pr-changes/SKILL.md)
- [Completed Implementations](./archive/completed-implementations/)

---

## Questions or Issues?

- Open an issue on [GitHub](https://github.com/ynotradio/site/issues)
- Review [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines
