# Action Items for Repository Maintainers

> **📍 For comprehensive project status, see:** [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)

---

## 🎯 High Priority Tasks

### 1. DJ Photo Import with Cloudinary

**Status**: Ready to implement  
**Estimated Effort**: Medium

**Context**: 
- All 32 active DJs have photos that need to be migrated
- Photo sources: imgur.com URLs, app.box.com URLs, and local `images/` paths
- Multi-person DJ handling is complete ✅

**Next Steps**:
1. Update `importDJs.ts` to download photos from legacy URLs
2. Upload photos to Cloudinary via Payload Media collection
3. Link Media records to DJ.photo field
4. Test with sample DJs before full production import

**Reference**: 
- [Cloudinary Integration Guide](docs/payload-migration/12-cloudinary-integration.md)
- [Project Status](docs/PROJECT_STATUS.md)

---

### 2. Production Data Migration

**Status**: Infrastructure ready, awaiting execution  
**Estimated Effort**: Large

**Context**:
- All Payload collections are created and tested
- Migration scripts exist with comprehensive test coverage
- Need to run against production MySQL database

**Next Steps**:
1. Backup production MySQL database
2. Run each migration script: DJs, Concerts, Music, etc.
3. Validate imported data integrity
4. Document any data quality issues discovered

**Reference**:
- [Migration Tasks](docs/payload-migration/04-migration-tasks.md)
- Import scripts in `bin/migrations/`

---

## 📋 Medium Priority Tasks

### 3. Top 11 Collections

**Status**: Not started  
**Estimated Effort**: Large

Create Payload collections for the weekly Top 11 contests:
- Top11Contests (configuration)
- Top11Results (published results)
- Top11Votes (user voting data)

**Reference**: [Core Data Models](docs/payload-migration/03-core-data-models.md)

---

### 4. Feature Flag Testing

**Status**: Ready for testing  
**Estimated Effort**: Small

Test the PostgreSQL concert read model in production using feature flags to ensure smooth gradual rollout.

**Reference**: [PostgreSQL Concert Model](docs/POSTGRES_CONCERT_MODEL.md)

---

## ⏰ Future Tasks

### ESLint 9 Migration

**Status**: Blocked by upstream dependencies  
**When**: When eslint-config-airbnb-typescript supports ESLint 9

Currently staying on ESLint 8 for compatibility. See [docs/archive/dependabot-pr-investigation.md](docs/archive/dependabot-pr-investigation.md) for details.

---

### Modern Rock Madness & Year End Polls

**Status**: Planned  
**Estimated Effort**: Large per feature

Create collections and migration scripts for:
- Modern Rock Madness tournament system
- Year End Poll system

**Reference**: [Migration Tasks](docs/payload-migration/04-migration-tasks.md)

---

## 📚 Documentation

- **Project Status**: [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)
- **Migration Overview**: [docs/payload-migration/README.md](docs/payload-migration/README.md)
- **Agent Testing Checklist**: [docs/AGENT_TESTING_CHECKLIST.md](docs/AGENT_TESTING_CHECKLIST.md)
- **Completed Work**: [docs/archive/completed-implementations/](docs/archive/completed-implementations/)

---

## Questions?

- Open an issue: [GitHub Issues](https://github.com/ynotradio/site/issues)
- Review: [CONTRIBUTING.md](CONTRIBUTING.md)
