# E2E Tests with Playwright

This directory contains end-to-end integration tests for the Y-Not Radio site using Playwright.

## Overview

These tests demonstrate CRUD operations in Payload CMS affecting the legacy PHP site, using containerized and seeded PostgreSQL and MySQL databases.

## Architecture

The E2E tests spin up:

- **Payload CMS** (Node.js/TypeScript) on port 3000
- **Legacy PHP site** (Apache/PHP-FPM) on port 8080
- **PostgreSQL** (for Payload) on port 5432
- **MySQL** (for legacy site) on port 3306

## Running Tests

### Prerequisites

1. Docker and Docker Compose installed
2. Node.js 22+ and Yarn installed
3. `.env.local` file configured (see `.env.example`)

### Local Testing

```bash
# Run all E2E tests (headless)
yarn test:e2e

# Run tests with UI mode (interactive)
yarn test:e2e:ui

# Run tests in headed mode (see browser)
yarn test:e2e:headed

# Run tests with debugging
PWDEBUG=1 yarn test:e2e
```

### Using Docker Container (Faster)

For faster test execution without installing Playwright/Chromium locally:

```bash
# One-time: Build the Playwright container
yarn test:e2e:docker:build

# Run tests in container
yarn test:e2e:docker

# OR using docker-compose profiles
docker-compose --profile test up playwright
```

**Benefits:**

- No local Playwright/Chromium installation needed (~300MB saved)
- Consistent test environment across machines
- Pre-installed browsers (Chromium, Firefox, WebKit)
- Faster CI/CD builds - no browser download step
- Isolated test environment

**Note:** The container uses `--network host` to access services on localhost (ports 3000, 8080, 5432, 3306).

### What Gets Tested

The POC test demonstrates:

1. **Service verification**: Payload CMS admin is accessible
2. **Database connectivity**: Connects to Postgres (local Docker or remote Neon in CI)
3. **Content verification**: Verifies Payload admin interface loads
4. **CRUD operations**: (TODO) Create, read, update, delete operations

**Note:** In CI mode, the test only verifies Payload CMS functionality using a remote Neon database. The legacy PHP site tests are skipped as they require Docker containers which are not available inside the Playwright container.

Locally, if Docker is available, the tests will also verify the legacy site at `http://localhost:8080`.

## Test Structure

- `playwright.config.ts` - Playwright configuration
- `e2e/global-setup.ts` - Starts Docker services (local only) and seeds databases
- `e2e/global-teardown.ts` - Stops Docker services (local only)
- `e2e/crud-integration.spec.ts` - Main integration test suite
- `e2e/screenshots/` - Test screenshots (gitignored)

## CI/CD Integration

The E2E tests run in GitHub Actions on every PR using the official Playwright Docker container.

### CI Environment

- **Container**: `mcr.microsoft.com/playwright:v1.57.0-noble`
- **Database**: Remote Neon Postgres (configured via GitHub Secrets)
- **Testing scope**: Payload CMS only (legacy PHP site requires Docker-in-Docker)
- **No Docker setup**: Docker commands are skipped in CI

### GitHub Actions Workflow

See `.github/workflows/e2e.yml` for the full workflow configuration.

**What the workflow does:**

1. Checks out code and sets up Node.js 22
2. Installs dependencies with Yarn
3. Configures `.env.local` with database credentials from GitHub Secrets
4. Builds Next.js in production mode (for faster startup)
5. Runs Playwright tests (which start the Next.js server)
6. Uploads test results and screenshots as artifacts

**Key features:**

- Uses official Playwright Docker container (pre-installed browsers)
- Skips browser installation step (~2-3 min saved per run)
- Connects to remote Neon Postgres database (configured via secrets)
- No Docker Compose needed (runs entirely in Playwright container)
- Tests only Payload CMS functionality in CI

### Required GitHub Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions):

- `DATABASE_URI` - Neon Postgres connection string (e.g., `postgresql://user:pass@host.neon.tech/dbname`)

The workflow sets additional environment variables automatically.

These allow the CI environment to connect to the same Neon database as production/development.

### Workflow Steps

1. Checkout code
2. Setup Node.js in Playwright container
3. Install dependencies
4. Configure environment with Postgres feature flags
5. Start Docker services (MySQL only)
6. Wait for services to be healthy
7. Seed MySQL database
8. Run Playwright tests (connects to Neon Postgres)
9. Upload HTML report and artifacts

**Time savings:** ~2-3 minutes per run by skipping browser installation

## Troubleshooting

### Services not starting

Check Docker is running:

```bash
docker info
```

Check service logs:

```bash
docker compose logs postgres
docker compose logs mysql
docker compose logs apache
```

### Payload server not responding

The Payload server is started by the test itself. Check the test output for startup logs.

If it times out, increase the timeout in `crud-integration.spec.ts`:

```typescript
timeout = setTimeout(() => {
  reject(new Error('Payload server failed to start in time'));
}, 180000); // Increase from 120000 to 180000
```

### Database not seeded

Manually seed databases:

```bash
yarn seed:legacy
yarn seed:payload  # Requires Payload server to be running
```

### Port conflicts

If ports 3000, 8080, 5432, or 3306 are in use, stop conflicting services:

```bash
# Check what's using a port
lsof -ti:3000
lsof -ti:8080

# Kill the process
kill -9 <PID>
```

## Future Enhancements

The POC test provides basic infrastructure. Future tests should:

1. **Login automation**: Authenticate to Payload admin
2. **CRUD operations**:
   - Create a new concert/show/post in Payload
   - Verify it appears in the database
   - Check if it syncs to the legacy site
   - Update the record and verify changes
   - Delete the record and verify removal
3. **API testing**: Test Payload REST/GraphQL APIs directly
4. **Database verification**: Query databases directly to verify CRUD operations
5. **Visual regression**: Compare screenshots over time
6. **Performance testing**: Measure page load times and API response times
7. **Cross-browser testing**: Test in Firefox and Safari (currently Chromium only)

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Main README](../README.md) - General project documentation
