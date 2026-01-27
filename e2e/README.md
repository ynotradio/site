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

The E2E tests verify:

1. ✅ Legacy PHP site loads successfully (HTTP 200)
2. ✅ No PHP errors on page load
3. ✅ Database connectivity (MySQL connection works)
4. ✅ Seeded data is accessible
5. ✅ No critical JavaScript console errors
6. ✅ **Payload CMS integration** - Create concert via Payload admin UI and verify it appears on legacy site
7. ✅ **CRUD operations** - Test data flow from Payload CMS to legacy PHP site
8. ✅ **Content Model Tests** - Individual test files for each collection (see `collections/` directory)

**Future enhancements**:
- Full authentication flows
- Next.js public site testing
- Visual regression testing

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

### Core Tests

- `crud-integration.spec.ts` - Tests for legacy PHP site load and database connectivity
- `payload-integration.spec.ts` - Payload CMS integration test that creates a concert and verifies it appears on the legacy site
- `global-setup.ts` - Global test setup (runs Payload migrations and seeds database)
- `playwright.config.ts` - Playwright configuration (browser settings, reporters, etc.)

### Collection-Specific Tests (`collections/`)

Each Payload collection has its own test file for easier maintenance and focused testing:

| Test File | Collection | PHP Page | What It Tests |
|-----------|------------|----------|---------------|
| `venues.spec.ts` | Venues | - | Create venue → verify in Payload list |
| `artists.spec.ts` | Artists | - | Create artist → verify in Payload list |
| `shows.spec.ts` | Shows | schedule.php | Create show → verify on schedule page |
| `djs.spec.ts` | DJs | deejays.php | Create DJ with Person → verify on DJs page |
| `posts.spec.ts` | Posts | index.php, pages.php | Create post → verify on homepage and standalone page |
| `ads.spec.ts` | Ads | - | Create ad → verify in Payload list |
| `songs.spec.ts` | Songs | music.php | Create song with artist → verify on New Music page |
| `cdoftheweek.spec.ts` | CD of the Week | cdoftheweek.php | Create review with record/artist → verify on CD of the Week page |
| `ondemand.spec.ts` | On Demand | ondemand.php | Create recording with associations → verify on On Demand page |

### Helper Utilities (`utils/`)

- `payload-auth.ts` - Authentication helper for Payload CMS admin interface
- `payload-helpers.ts` - Payload CMS form interaction helpers (text fields, relationship fields, checkboxes, time fields, rich text, etc.)
- `test-helpers.ts` - General test utilities (screenshots, date helpers, unique ID generation, PHP error checking)

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
