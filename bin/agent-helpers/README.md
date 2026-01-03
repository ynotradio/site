# Agent Helper Scripts

This directory contains scripts to help GitHub Copilot agents spin up working development environments for the Y-Not Radio site.

## For Human Developers (Local Workstation)

### `verify-payload.sh`
Spins up a working Payload CMS development environment.

**Usage:**
```bash
./bin/agent-helpers/verify-payload.sh
```

**What it does:**
- Checks for `.env.local` configuration
- Installs dependencies if needed
- Runs database migrations
- Starts Payload server
- Offers to seed the database with sample data
- Provides URLs and login instructions

**Use this to:**
- Get Payload running quickly
- Test your Payload changes
- Use the Admin UI like an end user
- Verify collections and API endpoints

### `verify-legacy.sh`
Spins up the legacy PHP/MySQL site with Docker.

**Usage:**
```bash
./bin/agent-helpers/verify-legacy.sh
```

**What it does:**
- Checks Docker is running
- Starts Docker containers (MySQL, PHP-FPM, Apache, PHPMyAdmin)
- Waits for services to be ready
- Provides URLs and database credentials

**Use this to:**
- Get the legacy site running quickly
- Test PHP code changes
- Browse the site like an end user
- Access the database via PHPMyAdmin

## For Automated Agents (CI/CD, Containerized)

### `setup-agent-environment.sh`
**NEW:** Sets up fully containerized environments for automated testing with Playwright.

**Usage:**
```bash
./bin/agent-helpers/setup-agent-environment.sh [--payload] [--legacy] [--all]
```

**What it does:**
- Starts Payload and/or Legacy in fully containerized environments
- Includes PostgreSQL and MySQL in containers
- Waits for all services to be ready
- Provides accessible URLs for Playwright testing

**Use this for:**
- GitHub Copilot agents needing to test with real apps
- CI/CD pipelines requiring functional environments
- Taking screenshots with Playwright
- Automated end-to-end testing

### `teardown-agent-environment.sh`
Stops and cleans up all containerized services.

**Usage:**
```bash
./bin/agent-helpers/teardown-agent-environment.sh
```

### `start-payload-containerized.sh`
Starts only Payload in a containerized environment.

### `start-legacy-containerized.sh`
Starts only Legacy site in a containerized environment.

See [docs/AUTOMATED_AGENT_SETUP.md](../../docs/AUTOMATED_AGENT_SETUP.md) for complete automated agent setup instructions.

## NPM Scripts

For convenience:

```bash
# Start Payload CMS
npm run verify:payload

# Start Legacy Site
npm run verify:legacy

# Start both (runs sequentially)
npm run verify:all
```

## Documentation

See [docs/AGENT_VERIFICATION.md](../../docs/AGENT_VERIFICATION.md) for:
- Environment setup instructions
- Manual verification steps
- Troubleshooting guide
- Migration strategy compliance

## Requirements

**For Payload:**
- Node.js 22+
- `.env.local` with DATABASE_URI and PAYLOAD_SECRET
- PostgreSQL database (Neon recommended)

**For Legacy site:**
- Docker Desktop or Docker Engine
- docker-compose

## Troubleshooting

If scripts fail:

1. **Environment**: Check `.env.local` exists and is configured
2. **Dependencies**: Run `npm install`
3. **Docker**: Ensure Docker is running
4. **Ports**: Ensure ports 3000 (Payload) and 8080/8181 (Legacy) are available
5. **Logs**: Check `.agent-tmp/payload-server.log` for errors
