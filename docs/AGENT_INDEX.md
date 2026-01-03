# 🤖 GitHub Copilot Agent Resources - Complete Index

**Welcome, GitHub Copilot Agents!** This index provides quick access to all resources you need to successfully work on the Y-Not Radio site.

---

## 🚀 Quick Start (Start Here!)

**New to this project?** Follow this path:

1. **[Local Setup Guide](LOCAL_SETUP_GUIDE.md)** 🏠 - Set up on your workstation
2. **[Agent Quick Start Guide](AGENT_QUICK_START.md)** ⭐ - Checklist for every task
3. **[Agent Verification Guide](AGENT_VERIFICATION.md)** - Detailed verification procedures
4. **[Verification Examples](AGENT_VERIFICATION_EXAMPLES.md)** - Practical scenarios and solutions

---

## 📚 Core Documentation

### Agent-Specific Guides

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [Local Setup Guide](LOCAL_SETUP_GUIDE.md) | Step-by-step local workstation setup | First time setting up or having issues |
| [Agent Quick Start](AGENT_QUICK_START.md) | Checklist-based guide | Every time you start work |
| [Agent Verification Guide](AGENT_VERIFICATION.md) | Complete verification procedures | When you need detailed instructions |
| [Verification Examples](AGENT_VERIFICATION_EXAMPLES.md) | Real-world scenarios | When you need practical examples |

### Helper Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| [verify-payload.sh](../bin/agent-helpers/verify-payload.sh) | Verify Payload CMS | `npm run verify:payload` |
| [verify-legacy.sh](../bin/agent-helpers/verify-legacy.sh) | Verify legacy PHP/MySQL | `npm run verify:legacy` |
| [health-check-payload.ts](../bin/agent-helpers/health-check-payload.ts) | API health checks | `npx tsx bin/agent-helpers/health-check-payload.ts` |

See [bin/agent-helpers/README.md](../bin/agent-helpers/README.md) for details.

---

## 🏗️ Project Context

### Migration Documentation

The site is migrating from PHP/MySQL to Payload CMS with PostgreSQL. Understanding this context is crucial:

| Document | Description |
|----------|-------------|
| [Migration Overview](payload-migration/README.md) | Project goals, strategy, and chapter index |
| [Project Overview](payload-migration/01-project-overview.md) | Two-phase migration plan |
| [Architecture Decisions](payload-migration/02-architecture-decisions.md) | Technical decisions and patterns |
| [Core Data Models](payload-migration/03-core-data-models.md) | All collections with status |
| [PHP PostgreSQL Integration](payload-migration/03.5-php-postgresql-querying.md) | Querying Payload from PHP |
| [Migration Tasks](payload-migration/04-migration-tasks.md) | Self-contained task list |

### Repository Guides

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Main project documentation |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |
| [Environment Variables](ENVIRONMENT_VARIABLES.md) | Configuration reference |
| [Code Quality](CODE_QUALITY.md) | Standards and practices |

---

## 🎯 Common Tasks

### Adding a New Payload Collection

1. Read: [Migration Tasks - Collection Template](payload-migration/04-migration-tasks.md)
2. Create collection file in `payload/src/collections/`
3. Register in `payload.config.ts`
4. Run: `npm run payload:generate-types`
5. Run: `npm run payload:migrate`
6. Verify: `npm run verify:payload`
7. See: [Example - Adding a Collection](AGENT_VERIFICATION_EXAMPLES.md#example-1-adding-a-new-payload-collection)

### Creating a Migration Script

1. Read: [Shared Utilities](payload-migration/05-shared-utilities.md)
2. Create script in `bin/migrations/`
3. Write tests in `bin/migrations/*.test.ts`
4. Verify both systems: `npm run verify:all`
5. See: [Example - Migration Script](AGENT_VERIFICATION_EXAMPLES.md#example-2-creating-a-migration-script)

### Adding PHP/PostgreSQL Integration

1. Read: [PHP PostgreSQL Querying](payload-migration/03.5-php-postgresql-querying.md)
2. Add connection config to `.env.example`
3. Create test script in `test/`
4. Verify: `npm run verify:legacy`
5. See: [Example - PHP Integration](AGENT_VERIFICATION_EXAMPLES.md#example-3-adding-phppostgresql-integration)

### Fixing a Bug

1. Understand the issue
2. Make minimal changes
3. Verify: `npm run verify:payload` or `npm run verify:legacy`
4. Test: `npm test && npm run lint`
5. See: [Example - Bug Fix](AGENT_VERIFICATION_EXAMPLES.md#example-5-fixing-a-bug)

---

## ⚡ Quick Commands Reference

```bash
# Verification
npm run verify:payload     # Start and verify Payload CMS
npm run verify:legacy      # Start and verify legacy PHP/MySQL site
npm run verify:all         # Verify both systems

# Development
npm run payload:dev        # Start Payload development server
npm run dev                # Start Next.js development server
docker-compose up -d       # Start legacy site containers

# Testing & Quality
npm test                   # Run test suite
npm run lint               # Run linter
npm run payload:migrate    # Run database migrations
npm run payload:generate-types  # Generate TypeScript types

# Troubleshooting
tail -f .agent-tmp/payload-server.log           # View Payload logs
docker-compose logs -f [service]          # View Docker logs
docker-compose ps                         # Check container status
```

---

## 🆘 Troubleshooting

### Quick Troubleshooting Steps

1. **Check error message** - Read it carefully
2. **Review troubleshooting guide** - [Verification Guide - Troubleshooting](AGENT_VERIFICATION.md#troubleshooting)
3. **Check logs**:
   - Payload: `.agent-tmp/payload-server.log`
   - Docker: `docker-compose logs [service]`
4. **Try examples** - [Verification Examples](AGENT_VERIFICATION_EXAMPLES.md)
5. **Document issue** - In your PR if unresolved

### Common Issues

| Issue | Solution |
|-------|----------|
| "DATABASE_URI not defined" | Copy `.env.example` to `.env.local` and configure |
| "Port already in use" | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| "Docker not running" | Start Docker Desktop or daemon |
| "Migration failed" | Check logs, verify DB connection, try rollback |
| "MySQL connection failed" | Wait longer (30-60s), check `docker-compose logs mysql` |

See [detailed troubleshooting](AGENT_VERIFICATION.md#troubleshooting) for more.

---

## ✅ Pre-Submission Checklist

Before opening a PR, verify:

- [ ] **Documentation reviewed**: Read relevant docs
- [ ] **Environment set up**: `.env.local` configured
- [ ] **Changes tested locally**:
  - [ ] `npm run verify:payload` (if applicable)
  - [ ] `npm run verify:legacy` (if applicable)
  - [ ] `npm test` passes
  - [ ] `npm run lint` passes
- [ ] **Types generated**: `npm run payload:generate-types` (if schema changed)
- [ ] **Migrations run**: `npm run payload:migrate` (if schema changed)
- [ ] **Screenshots taken**: For UI changes
- [ ] **Documentation updated**: If needed
- [ ] **PR description complete**: Includes verification results

See [Quick Start Checklist](AGENT_QUICK_START.md) for complete list.

---

## 🎓 Learning Resources

### Understanding the Stack

- **Payload CMS**: Code-first headless CMS - [Official Docs](https://payloadcms.com/docs)
- **PostgreSQL**: Relational database (via Neon)
- **Next.js**: React framework for frontend
- **Legacy Stack**: PHP/MySQL with Apache

### Project-Specific Knowledge

- **Migration strategy**: [Project Overview](payload-migration/01-project-overview.md)
- **Collection patterns**: [Architecture Decisions](payload-migration/02-architecture-decisions.md)
- **Data models**: [Core Data Models](payload-migration/03-core-data-models.md)
- **Shared utilities**: [Shared Utilities](payload-migration/05-shared-utilities.md)

---

## 🔗 External Links

- **Repository**: [github.com/ynotradio/site](https://github.com/ynotradio/site)
- **Issues**: [github.com/ynotradio/site/issues](https://github.com/ynotradio/site/issues)
- **Pull Requests**: [github.com/ynotradio/site/pulls](https://github.com/ynotradio/site/pulls)

---

## 📝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Branch naming conventions
- Commit message guidelines
- PR submission process
- Code standards

---

## 🎉 Best Practices

1. ✅ **Always verify before submitting** - Use verification scripts
2. ✅ **Make minimal changes** - Surgical precision
3. ✅ **Include verification results** - In PR description
4. ✅ **Take screenshots** - For UI changes
5. ✅ **Document decisions** - Explain complex changes
6. ✅ **Test edge cases** - Not just happy path
7. ✅ **Update docs** - If needed
8. ✅ **Ask for help** - When stuck

---

## 📞 Getting Help

If you're stuck:

1. **Check this index** - Find the right documentation
2. **Review examples** - [Verification Examples](AGENT_VERIFICATION_EXAMPLES.md)
3. **Search issues** - Someone may have faced similar issues
4. **Document clearly** - In your PR or issue
5. **Be specific** - Include error messages, logs, and steps
6. **Tag maintainers** - If you need human assistance

---

**Remember:** Quality over speed. Take the time to verify your changes properly! 🚀

---

*Last updated: 2026-01-03*
