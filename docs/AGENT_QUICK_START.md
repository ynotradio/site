# Agent Quick Start Checklist

Use this checklist when working on Y-Not Radio site to ensure your changes are properly verified.

## ✅ Before Starting Work

- [ ] Read the issue/task description carefully
- [ ] Review [docs/AGENT_VERIFICATION.md](./AGENT_VERIFICATION.md) for verification procedures
- [ ] Check [docs/payload-migration/README.md](./payload-migration/README.md) for migration context
- [ ] Understand which systems your changes affect (Payload, Legacy, or both)

## ✅ Environment Setup

### For Payload Work
- [ ] Copy `.env.example` to `.env.local`
- [ ] Configure `DATABASE_URI` with PostgreSQL connection
- [ ] Set `PAYLOAD_SECRET` (generate with `openssl rand -hex 32`)
- [ ] Configure Cloudinary credentials if working with media
- [ ] Run `npm install`

### For Legacy Site Work
- [ ] Ensure Docker is installed and running
- [ ] Run `docker-compose up -d` to start containers
- [ ] Verify MySQL is accessible: `docker-compose exec mysql mysqladmin ping -h localhost -u root -proot`

## ✅ During Development

- [ ] Make minimal, focused changes
- [ ] Write tests for new functionality
- [ ] Keep verification in mind as you code
- [ ] Document any complex logic or decisions

## ✅ Before Committing

### Payload Changes
- [ ] Run `npm run payload:generate-types`
- [ ] Run `npm run payload:migrate` (if schema changed)
- [ ] Run `npm run verify:payload`
- [ ] Check Admin UI: http://localhost:3000/admin
- [ ] Test API endpoints with `curl` or Admin UI
- [ ] Run `npx tsx bin/agent-helpers/health-check-payload.ts`

### Legacy Site Changes
- [ ] Run `npm run verify:legacy`
- [ ] Check main site: http://localhost:8080
- [ ] Check PHPMyAdmin: http://localhost:8181
- [ ] Test PHP code execution
- [ ] Verify database queries work

### All Changes
- [ ] Run `npm run lint`
- [ ] Run `npm test`
- [ ] Check for TypeScript errors
- [ ] Review git diff for unintended changes

## ✅ Screenshots & Documentation

- [ ] Take screenshots of any UI changes
- [ ] Document new features or significant changes
- [ ] Note any configuration changes needed
- [ ] Update relevant docs if needed

## ✅ PR Submission

- [ ] Write clear PR title and description
- [ ] Include verification results:
  - [ ] "✅ `npm run verify:payload` passed" (if applicable)
  - [ ] "✅ `npm run verify:legacy` passed" (if applicable)
  - [ ] "✅ Tests pass: `npm test`"
  - [ ] "✅ Linting passes: `npm run lint`"
- [ ] Include screenshots of UI changes
- [ ] Link related issues or documentation
- [ ] Note any warnings or limitations
- [ ] Request review if uncertain about anything

## ✅ After PR Review

- [ ] Address reviewer feedback
- [ ] Re-run verification after making changes
- [ ] Update PR with new verification results
- [ ] Ensure CI checks pass

## 🆘 Troubleshooting

If something goes wrong:

1. **Check the error message** - read it carefully
2. **Review troubleshooting guide** - [docs/AGENT_VERIFICATION.md#troubleshooting](./AGENT_VERIFICATION.md#troubleshooting)
3. **Check logs**:
   - Payload: `/tmp/payload-server.log`
   - Docker: `docker-compose logs [service]`
4. **Try the examples** - [docs/AGENT_VERIFICATION_EXAMPLES.md](./AGENT_VERIFICATION_EXAMPLES.md)
5. **Document the issue** in your PR if you can't resolve it
6. **Ask for help** - tag maintainers if stuck

## 📚 Quick Reference Links

- **Agent Verification Guide**: [docs/AGENT_VERIFICATION.md](./AGENT_VERIFICATION.md)
- **Verification Examples**: [docs/AGENT_VERIFICATION_EXAMPLES.md](./AGENT_VERIFICATION_EXAMPLES.md)
- **Migration Overview**: [docs/payload-migration/README.md](./payload-migration/README.md)
- **Helper Scripts README**: [bin/agent-helpers/README.md](../bin/agent-helpers/README.md)

## 🚀 Quick Commands

```bash
# Verify everything
npm run verify:all

# Verify Payload only
npm run verify:payload

# Verify Legacy only  
npm run verify:legacy

# Run all tests
npm test

# Run linting
npm run lint

# Generate Payload types
npm run payload:generate-types

# Run Payload migrations
npm run payload:migrate

# Start Payload dev server
npm run payload:dev

# Start legacy site
docker-compose up -d

# Stop legacy site
docker-compose down
```

---

**Remember:** It's better to report a problem you can't solve than to submit broken code! 🙏
