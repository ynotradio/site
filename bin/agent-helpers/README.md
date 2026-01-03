# Agent Helper Scripts

This directory contains verification scripts for GitHub Copilot agents working on the Y-Not Radio site.

## Scripts

### `verify-payload.sh`
Automated script to verify Payload CMS instance is working correctly.

**Usage:**
```bash
./bin/agent-helpers/verify-payload.sh
```

**What it does:**
- Checks for `.env.local` configuration
- Installs dependencies if needed
- Runs database migrations
- Starts Payload server
- Waits for server to be ready
- Runs comprehensive health checks
- Provides access information and logs

### `verify-legacy.sh`
Automated script to verify the legacy PHP/MySQL site is working correctly.

**Usage:**
```bash
./bin/agent-helpers/verify-legacy.sh
```

**What it does:**
- Checks Docker is running
- Cleans up any existing containers
- Starts Docker containers (MySQL, PHP-FPM, Apache, PHPMyAdmin)
- Waits for services to be ready
- Runs health checks on all services
- Provides access information

### `health-check-payload.ts`
TypeScript health check script for Payload CMS API.

**Usage:**
```bash
npx tsx bin/agent-helpers/health-check-payload.ts
```

**What it checks:**
- API endpoint accessibility
- GraphQL endpoint functionality
- Admin UI accessibility
- Collection endpoints (users, media, people, djs, artists, venues, concerts, shows, posts)

## NPM Scripts

For convenience, these scripts are available as npm commands:

```bash
# Verify Payload CMS
npm run verify:payload

# Verify Legacy Site
npm run verify:legacy

# Verify both (runs sequentially)
npm run verify:all
```

## Documentation

See [docs/AGENT_VERIFICATION.md](../../docs/AGENT_VERIFICATION.md) for comprehensive agent verification guide including:
- Setup instructions
- Manual verification steps
- Troubleshooting
- Migration strategy compliance
- Best practices

## Requirements

**For Payload verification:**
- Node.js 22+
- `.env.local` configured with DATABASE_URI and PAYLOAD_SECRET
- PostgreSQL database (local or Neon)

**For Legacy site verification:**
- Docker Desktop or Docker Engine
- docker-compose

## Troubleshooting

If scripts fail, check:

1. **Environment setup**: `.env.local` exists and is properly configured
2. **Dependencies**: Run `npm install` to ensure all dependencies are installed
3. **Docker**: Ensure Docker is running for legacy site verification
4. **Ports**: Ensure ports 3000 (Payload) and 8080/8181 (Legacy) are available
5. **Logs**: Check `.agent-tmp/payload-server.log` for Payload errors

## Contributing

If you improve these scripts or add new verification helpers:
1. Update this README
2. Update [docs/AGENT_VERIFICATION.md](../../docs/AGENT_VERIFICATION.md)
3. Test thoroughly before committing
4. Document any new requirements or dependencies
