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

All services run in Docker containers with health checks and automatic seeding.

## Running Tests

### Prerequisites

1. Docker and Docker Compose installed
2. Node.js 22+ and Yarn installed
3. `.env.local` file configured (see `.env.example`)

### Local Testing

```bash
# Start Docker services first
docker compose up -d

# Run all E2E tests (headless)
yarn test:e2e

# Run tests with UI mode (interactive)
yarn test:e2e:ui

# Run tests in headed mode (see browser)
yarn test:e2e:headed

# Run tests with debugging
PWDEBUG=1 yarn test:e2e

# Stop services when done
docker compose down
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

1. **Service verification**: Both Payload CMS and legacy PHP site are accessible
2. **Database connectivity**: Connects to PostgreSQL (Payload) and MySQL (legacy site)
3. **Content verification**: Verifies seeded data appears on both sites
4. **CRUD operations**: (TODO) Create, read, update, delete operations

Tests run the full stack in both CI and local environments using Docker Compose.

## Test Structure

- `playwright.config.ts` - Playwright configuration
- `e2e/global-setup.ts` - Pre-test setup (verifies environment)
- `e2e/global-teardown.ts` - Cleanup after tests
- `e2e/crud-integration.spec.ts` - Main integration test suite
- `e2e/screenshots/` - Test screenshots (gitignored)

## CI/CD Integration

The E2E tests run in GitHub Actions on every PR using Docker Compose with the full stack.

### CI Environment

- **Runner**: `ubuntu-latest` with Docker Compose
- **Services**: Full Docker Compose stack
  - PostgreSQL (for Payload CMS)
  - MySQL (for legacy site)
  - Apache + PHP-FPM (for legacy site)
- **Testing scope**: Full integration testing (Payload CMS + legacy PHP site)
- **Browser caching**: Playwright browsers cached between runs
- **Build cache**: Next.js build cache for faster CI runs

### GitHub Actions Workflow

See `.github/workflows/e2e.yml` for the full workflow configuration.

**What the workflow does:**

1. Sets up Docker Compose using `docker/setup-compose-action`
2. Checks out code and sets up Node.js 22
3. Installs dependencies with Yarn
4. Caches and installs Playwright browsers (Chromium)
5. Sets up Next.js build cache
6. Configures `.env.local` for Docker services
7. Starts Docker Compose services (PostgreSQL, MySQL, Apache, PHP-FPM)
8. Waits for all services to be ready
9. Seeds both databases
10. Runs Playwright tests
11. Uploads test results and screenshots as artifacts
12. Cleans up Docker containers

**Key features:**

- **Playwright browser caching** - Browsers cached by version, avoiding ~300MB download on each run
- **Next.js build caching** - Faster subsequent builds
- **Full stack testing** - Tests both Payload CMS and legacy PHP site
- **Seeded databases** - Consistent test data for every run
- **No external dependencies** - Everything runs in containerized environments

### No GitHub Secrets Required

The workflow uses Docker Compose with default credentials defined in `docker-compose.yml`. No external database configuration needed. 9. Upload HTML report and artifacts

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
