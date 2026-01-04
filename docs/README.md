# Documentation Index

**Last Updated:** January 4, 2026

Welcome to the Y-Not Radio site documentation. This index helps you find the information you need quickly.

---

## 🎯 Start Here

### For Developers
- **[Project Status](PROJECT_STATUS.md)** - Current migration state, priorities, and next tasks
- **[README.md](../README.md)** - Development setup and quick start guide
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines and workflow

### For GitHub Copilot Agents
- **[Testing PR Changes Skill](../.claude/skills/testing-pr-changes/SKILL.md)** - Testing workflow and verification checklist
- **[Agent Automation Infrastructure](../.claude/skills/agent-automation-infrastructure/SKILL.md)** - CI/CD optimization and pre-built images
- **[Payload Migration Workflow](../.claude/skills/payload-migration-workflow/SKILL.md)** - Migration context and tasks

---

## 📚 Core Documentation

### Migration & Architecture
- **[Payload Migration Overview](payload-migration/README.md)** - Complete migration plan and chapter index
- **[Core Data Models](payload-migration/03-core-data-models.md)** - Collection schemas and status (14/24 complete)
- **[Migration Tasks](payload-migration/04-migration-tasks.md)** - Step-by-step task breakdown
- **[Architecture Decisions](payload-migration/02-architecture-decisions.md)** - Technical design choices

### Technical Reference
- **[PostgreSQL Concert Model](POSTGRES_CONCERT_MODEL.md)** - Feature-flagged read model implementation
- **[Read-Only Collections](READONLY_COLLECTIONS.md)** - Schema reference for all implemented collections
- **[Environment Variables](ENVIRONMENT_VARIABLES.md)** - Configuration reference
- **[Dependency Management](dependency-management.md)** - Package update strategy and ESLint constraints
- **[Code Quality](CODE_QUALITY.md)** - Coding standards and best practices

### Integration Guides
- **[Cloudinary Integration](payload-migration/12-cloudinary-integration.md)** - Media storage setup and image migration
- **[PHP PostgreSQL Querying](payload-migration/03.5-php-postgresql-querying.md)** - Direct database access from PHP
- **[Hierarchical Navigation](payload-hierarchical-navigation.md)** - Navigation system for Payload

---

## 📦 Migration Documentation

### Planning & Strategy
1. [Project Overview](payload-migration/01-project-overview.md)
2. [Architecture Decisions](payload-migration/02-architecture-decisions.md)
3. [Core Data Models](payload-migration/03-core-data-models.md)
4. [Migration Tasks](payload-migration/04-migration-tasks.md)
5. [Shared Utilities](payload-migration/05-shared-utilities.md)
6. [Frontend Cutover Strategy](payload-migration/06-frontend-cutover.md)
7. [Success Criteria](payload-migration/07-success-criteria.md)
8. [Quick Reference](payload-migration/08-quick-reference.md)

### Technical Deep Dives
- [Relational Advantages](payload-migration/09-relational-advantages.md)
- [CMS Comparison](payload-migration/10-cms-switching-considerations.md)
- [Capacity Planning](payload-migration/11-capacity-planning.md)
- [Cloudinary Integration](payload-migration/12-cloudinary-integration.md)

---

## 📖 Historical Documentation

Archive of completed implementations and historical context:

- **[Archive Index](archive/README.md)** - Overview of archived documentation
- **[Completed Implementations](archive/completed-implementations/)** - Detailed summaries of finished features
  - PostgreSQL Concert Model (Dec 2025)
  - MusicBrainz Custom Fields (Dec 2025)
- **[PHP MVC Migration Reports](archive/php-mvc-migration/)** - Legacy PHP refactoring
- **[Legacy Processes](archive/legacy-processes/)** - Old admin workflows being replaced
- **[Dependabot Investigation](archive/dependabot-pr-investigation.md)** - ESLint 8 compatibility constraints

---

## 🔍 Quick Links by Topic

### Database & Data
- [Core Data Models](payload-migration/03-core-data-models.md)
- [PostgreSQL Concert Model](POSTGRES_CONCERT_MODEL.md)
- [Read-Only Collections](READONLY_COLLECTIONS.md)
- [PHP PostgreSQL Querying](payload-migration/03.5-php-postgresql-querying.md)

### Media & Assets
- [Cloudinary Integration](payload-migration/12-cloudinary-integration.md)
- Media collection in [Core Data Models](payload-migration/03-core-data-models.md)

### Development Setup
- [README.md](../README.md) - Local development setup
- [Environment Variables](ENVIRONMENT_VARIABLES.md)
- [Dependency Management](dependency-management.md)

### Migration Scripts
- [Shared Utilities](payload-migration/05-shared-utilities.md)
- [Migration Tasks](payload-migration/04-migration-tasks.md)
- Migration scripts in `/bin/migrations/`

### Testing & Quality
- [Testing PR Changes Skill](../.claude/skills/testing-pr-changes/SKILL.md)
- [Code Quality](CODE_QUALITY.md)
- Test files in `/payload/`, `/bin/migrations/`, `/test/`

---

## 🆘 Need Help?

1. **Check [Project Status](PROJECT_STATUS.md)** for current priorities and known issues
2. **Search [Migration Tasks](payload-migration/04-migration-tasks.md)** for task-specific guidance
3. **Review [Quick Reference](payload-migration/08-quick-reference.md)** for common commands
4. **Open an issue** on [GitHub](https://github.com/ynotradio/site/issues)

---

## 📝 Contributing to Documentation

When updating documentation:

1. **Keep it current** - Update dates and status as things change
2. **Link appropriately** - Use relative links for internal documentation
3. **Archive completed work** - Move implementation summaries to `/docs/archive/completed-implementations/`
4. **Update indexes** - Keep this file and [Project Status](PROJECT_STATUS.md) in sync
5. **Test links** - Verify all internal links work after reorganization

---

**Last Updated:** January 4, 2026  
**Questions?** Open an issue: https://github.com/ynotradio/site/issues
