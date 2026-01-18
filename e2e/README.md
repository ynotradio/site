# E2E Tests with Playwright

This directory contains simplified end-to-end integration tests for the Y-Not Radio legacy PHP site using Playwright.

## Overview

These tests verify that the legacy PHP site can load successfully with seeded MySQL data. This is a proof-of-concept for the E2E testing infrastructure.

## Architecture

The E2E tests use:

- **Legacy PHP site** (Apache/PHP-FPM) on port 8080
- **MySQL** (legacy database with seeded test data) on port 3306
- **PostgreSQL** (for future Payload CMS testing) on port 5432

All services run in Docker containers managed by Docker Compose.

## Test Scope

The simplified E2E tests verify:

1. ✅ Legacy PHP site loads successfully (HTTP 200)
2. ✅ No PHP errors on page load
3. ✅ Database connectivity (MySQL connection works)
4. ✅ Seeded data is accessible
5. ✅ No critical JavaScript console errors

**Future enhancements** (not in this POC):
- Payload CMS integration testing
- CRUD operations testing
- Verification of data migration from MySQL to Postgres
- Full authentication flows
- Next.js public site testing

## Running Tests

### Prerequisites

1. Docker and Docker Compose installed
2. Node.js 22+ and Yarn installed
3. `.env.local` file configured (see `.env.example`)

### Local Testing

```bash
# Start Docker services first
docker compose up -d postgres mysql phpfpm apache

# Wait for services to be ready
sleep 10

# Seed the legacy MySQL database
yarn seed:legacy

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

### CI Testing

The E2E tests run automatically in GitHub Actions on pull requests. The CI workflow:

1. Sets up Docker Compose
2. Starts PostgreSQL, MySQL, PHP-FPM, and Apache containers
3. Seeds the MySQL database with test data (using `yarn seed:legacy`)
4. Runs Playwright tests against http://localhost:8080
5. Uploads test results and screenshots as artifacts

See `.github/workflows/e2e.yml` for the complete CI configuration.

## Test Files

- `crud-integration.spec.ts` - Main test file with simplified legacy PHP site tests
- `global-setup.ts` - Global test setup (minimal configuration)
- `global-teardown.ts` - Global test teardown (cleanup)
- `playwright.config.ts` - Playwright configuration (browser settings, reporters, etc.)

## Troubleshooting

### Port Already in Use

If you see "address already in use" errors:

```bash
# Kill processes on specific ports
lsof -ti:8080 | xargs kill -9  # Apache
lsof -ti:3306 | xargs kill -9  # MySQL
lsof -ti:5432 | xargs kill -9  # Postgres
```

### Services Not Starting

Check Docker Compose logs:

```bash
docker compose logs postgres
docker compose logs apache
docker compose logs phpfpm
docker compose logs mysql
```

### Test Failures

1. Check that all Docker services are running: `docker compose ps`
2. Verify database connectivity: `docker compose exec postgres psql -U ynot_postgres_user -d ynot_payload_dev -c "SELECT version();"`
3. Check Apache is serving: `curl -I http://localhost:8080`
4. Review test artifacts in `test-results/` directory
5. Check screenshots in `e2e/screenshots/` directory

### Debugging Tests

Use Playwright's debug mode to step through tests:

```bash
PWDEBUG=1 yarn test:e2e
```

Or use the Playwright Inspector:

```bash
yarn test:e2e:ui
```

## Environment Variables

The tests use the following environment variables:

```bash
# Postgres (used by legacy PHP site in this test)
DATABASE_URI=postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ynot_payload_dev
DB_USER=ynot_postgres_user
DB_PASSWORD=ynot_postgres_pass

# CI mode (set by GitHub Actions)
CI=true
```

## Future Enhancements

To expand these tests to full CRUD integration:

1. **Add Payload Server Startup**: Include beforeAll/afterAll hooks to start Next.js/Payload server
2. **Add Authentication**: Implement Payload admin login flow
3. **Add CRUD Operations**: Create/update/delete records in Payload collections
4. **Verify Data Sync**: Check that changes in Payload appear on the legacy PHP site
5. **Database Assertions**: Query databases directly to verify data consistency
6. **Performance Testing**: Measure response times and page load speeds
7. **Visual Regression**: Take baseline screenshots and compare changes

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
