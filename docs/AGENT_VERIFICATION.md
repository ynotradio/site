# Agent Verification Guide

**For GitHub Copilot Agents working on Y-Not Radio Site**

This guide provides step-by-step instructions for Copilot agents to verify their changes work correctly with both the Payload CMS instance and the legacy PHP/MySQL site.

> **💡 New to agent verification?** Check out [AGENT_VERIFICATION_EXAMPLES.md](./AGENT_VERIFICATION_EXAMPLES.md) for practical examples and common scenarios.

---

## 🎯 Quick Start

### For Payload CMS Changes

```bash
./bin/agent-helpers/verify-payload.sh
# or
npm run verify:payload
```

### For Legacy PHP/MySQL Site Changes

```bash
./bin/agent-helpers/verify-legacy.sh
# or
npm run verify:legacy
```

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Payload CMS Verification](#payload-cms-verification)
4. [Legacy Site Verification](#legacy-site-verification)
5. [Common Verification Tasks](#common-verification-tasks)
6. [Troubleshooting](#troubleshooting)
7. [Migration Strategy Compliance](#migration-strategy-compliance)

---

## Overview

The Y-Not Radio site is undergoing a migration from a legacy PHP/MySQL site to Payload CMS with PostgreSQL. As an agent, you should:

1. **Understand the migration context**: Review [docs/payload-migration/README.md](./payload-migration/README.md)
2. **Verify your changes don't break existing functionality**
3. **Test that your changes align with the migration strategy**
4. **Document any issues or concerns you encounter**

---

## Prerequisites

### General Requirements

- **Docker**: Required for legacy site verification
- **Node.js 22+**: Required for Payload verification
- **npm/yarn**: For installing dependencies

### Environment Setup

#### For Payload CMS (`.env.local`)

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URI` or `NEON_DEV_DATABASE_URL`: PostgreSQL connection string
- `PAYLOAD_SECRET`: A secure secret key (generate with `openssl rand -hex 32`)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: For media uploads

#### For Legacy Site

The legacy site uses Docker Compose and typically works with default configuration. If needed, add environment variables to `.env.local`.

---

## Payload CMS Verification

### Automated Verification Script

The quickest way to verify Payload is working:

```bash
./bin/agent-helpers/verify-payload.sh
```

This script will:
1. ✅ Check for `.env.local` configuration
2. ✅ Install dependencies if needed
3. ✅ Run database migrations
4. ✅ Start Payload server
5. ✅ Wait for server to be ready
6. ✅ Run comprehensive health checks
7. ✅ Provide summary and access information

### Manual Verification Steps

If you need to verify manually or the automated script fails:

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Run Migrations

```bash
npm run payload:migrate
```

Check that:
- No migration errors occur
- Database schema is up to date

#### 3. Start Payload Server

```bash
npm run payload:dev
```

The server should start at http://localhost:3000

#### 4. Verify Access Points

**Admin UI:**
- URL: http://localhost:3000/admin
- Should show login screen or dashboard

**API Endpoint:**
```bash
curl http://localhost:3000/api/users
```

**GraphQL Playground:**
- URL: http://localhost:3000/api/graphql
- Should show GraphQL interface

#### 5. Test Your Changes

Depending on what you changed:

**Collection Changes:**
```bash
# Test via API
curl http://localhost:3000/api/[collection-name]

# Test via GraphQL
# Visit http://localhost:3000/api/graphql and run queries
```

**Migration Scripts:**
```bash
# Run your migration script
npx tsx bin/migrations/[your-script].ts

# Verify data was imported correctly via Admin UI or API
```

**Health Check Script:**
```bash
npx tsx bin/agent-helpers/health-check-payload.ts
```

---

## Legacy Site Verification

### Automated Verification Script

The quickest way to verify the legacy site is working:

```bash
./bin/agent-helpers/verify-legacy.sh
```

This script will:
1. ✅ Check Docker is running
2. ✅ Clean up any existing containers
3. ✅ Start Docker containers (MySQL, PHP-FPM, Apache, PHPMyAdmin)
4. ✅ Wait for services to be ready
5. ✅ Run health checks
6. ✅ Provide access information

### Manual Verification Steps

If you need to verify manually:

#### 1. Start Docker Containers

```bash
docker-compose up -d
```

#### 2. Wait for Services

```bash
# Check container status
docker-compose ps

# Check MySQL is ready
docker-compose exec mysql mysqladmin ping -h localhost -u root -proot

# Check logs if needed
docker-compose logs -f [service]
```

#### 3. Verify Access Points

**Main Site:**
- URL: http://localhost:8080
- Should display the site homepage

**PHPMyAdmin:**
- URL: http://localhost:8181
- Server: `mysql`
- Username: `ynot_sql_user`
- Password: `ynot_sql_pass`
- Database: `ynot_site`

#### 4. Test Database Access

```bash
# Connect to MySQL
docker-compose exec mysql mysql -u ynot_sql_user -pynot_sql_pass ynot_site

# Run a test query
docker-compose exec mysql mysql -u ynot_sql_user -pynot_sql_pass ynot_site -e "SHOW TABLES;"
```

#### 5. Test PHP Code

```bash
# Execute a PHP script
docker-compose exec phpfpm php /app/[your-script].php

# Check PHP logs
docker-compose logs phpfpm
```

---

## Common Verification Tasks

### Verifying Collection Changes

When you add or modify a Payload collection:

1. **Check schema is valid:**
   ```bash
   npm run payload:generate-types
   ```

2. **Run migrations:**
   ```bash
   npm run payload:migrate
   ```

3. **Verify via Admin UI:**
   - Navigate to http://localhost:3000/admin
   - Check collection appears in sidebar
   - Try creating/editing records

4. **Verify via API:**
   ```bash
   curl http://localhost:3000/api/[collection-name]
   ```

### Verifying Migration Scripts

When you create or modify a migration script:

1. **Run the script:**
   ```bash
   npx tsx bin/migrations/[script-name].ts
   ```

2. **Check for errors in output**

3. **Verify data in Payload:**
   ```bash
   # Via API
   curl http://localhost:3000/api/[collection-name]
   
   # Or via Admin UI
   # http://localhost:3000/admin
   ```

4. **Check data integrity:**
   - Verify relationships are correct
   - Check field values are properly mapped
   - Ensure no data loss occurred

### Verifying PHP/PostgreSQL Integration

When you add PHP code that queries Payload's PostgreSQL database:

1. **Verify the legacy site can connect:**
   ```bash
   # Test the connection from PHP
   docker-compose exec phpfpm php /app/test/test_postgres_concert.php
   ```

2. **Check the query results:**
   - Verify data is retrieved correctly
   - Check performance is acceptable
   - Ensure proper error handling

3. **Compare with MySQL results (if applicable):**
   - Ensure parity with existing functionality
   - Verify business logic is preserved

### Verifying Frontend Changes

When you modify Next.js or frontend code:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Check the page:**
   - Navigate to http://localhost:3000/[your-route]
   - Verify rendering is correct
   - Check browser console for errors

3. **Test functionality:**
   - User interactions work
   - API calls succeed
   - Forms submit correctly

---

## Troubleshooting

### Payload Issues

#### "DATABASE_URI is not defined"

**Solution:**
1. Copy `.env.example` to `.env.local`
2. Update `DATABASE_URI` with a valid PostgreSQL connection string
3. For local dev, you can use a Neon free tier database

#### "Migration failed"

**Solution:**
1. Check the migration logs for specific errors
2. Verify database connection is working
3. Check if schema conflicts exist
4. Try rolling back and re-running: `npm run payload:migrate`

#### "Port 3000 already in use"

**Solution:**
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change the port in .env.local
PORT=3001
```

#### Server starts but health checks fail

**Solution:**
1. Check server logs: `/tmp/payload-server.log`
2. Verify collections are properly configured
3. Check database connectivity
4. Ensure migrations have run successfully

### Legacy Site Issues

#### "Docker is not running"

**Solution:**
- Start Docker Desktop (on Mac/Windows)
- Start Docker daemon (on Linux): `sudo systemctl start docker`

#### "Port 8080 already in use"

**Solution:**
```bash
# Stop the conflicting service
docker-compose down

# Or modify docker-compose.yml to use different ports
```

#### "MySQL connection failed"

**Solution:**
1. Wait longer for MySQL to initialize (can take 30-60 seconds on first run)
2. Check MySQL logs: `docker-compose logs mysql`
3. Verify database credentials in docker-compose.yml
4. Try restarting: `docker-compose restart mysql`

#### "No tables found in database"

**Solution:**
The database might be empty. Import the schema:
```bash
./bin/import_db.sh
```

Note: You'll need `src/db/docker/ynot_db.sql` file

---

## Migration Strategy Compliance

### Key Principles

When making changes, ensure compliance with the migration strategy outlined in [docs/payload-migration/README.md](./payload-migration/README.md):

1. **Maintain both systems during transition**
   - Don't break legacy PHP site
   - Don't break Payload CMS
   - Both should be verifiable

2. **Use PostgreSQL for new content**
   - New collections go in Payload/PostgreSQL
   - Legacy data stays in MySQL until migrated
   - PHP can query both databases if needed

3. **Preserve data integrity**
   - Verify relationships are maintained
   - Ensure no data loss in migrations
   - Check foreign key constraints

4. **Follow collection patterns**
   - Use established field types
   - Follow naming conventions
   - Match existing collection structure

### Verification Checklist

Before submitting your changes, verify:

- [ ] **Payload instance starts without errors**
  ```bash
  ./bin/agent-helpers/verify-payload.sh
  ```

- [ ] **Legacy site starts without errors**
  ```bash
  ./bin/agent-helpers/verify-legacy.sh
  ```

- [ ] **All health checks pass**

- [ ] **Migrations run successfully**
  ```bash
  npm run payload:migrate
  ```

- [ ] **TypeScript types are generated**
  ```bash
  npm run payload:generate-types
  ```

- [ ] **Linting passes**
  ```bash
  npm run lint
  ```

- [ ] **Tests pass**
  ```bash
  npm test
  ```

- [ ] **Changes align with migration strategy**
  - Review relevant docs in `docs/payload-migration/`
  - Ensure backward compatibility
  - Verify data migration approach

### Migration-Specific Checks

**When adding a new Payload collection:**
1. ✅ Collection is documented in [docs/payload-migration/03-core-data-models.md](./payload-migration/03-core-data-models.md)
2. ✅ Migration script exists in `bin/migrations/`
3. ✅ Tests exist for migration script
4. ✅ Collection is registered in `payload.config.ts`
5. ✅ TypeScript types are generated

**When modifying migration scripts:**
1. ✅ Script can run multiple times safely (idempotent)
2. ✅ Script logs progress and errors clearly
3. ✅ Script has tests
4. ✅ Data integrity is verified after import
5. ✅ Script is documented

**When adding PHP/PostgreSQL integration:**
1. ✅ Connection configuration is in `.env.example`
2. ✅ Test script exists (like `test/test_postgres_concert.php`)
3. ✅ Error handling is robust
4. ✅ SQL injection protection is in place
5. ✅ Performance is acceptable

---

## 🎉 Best Practices for Agents

1. **Always run verification scripts before submitting your PR**
2. **Document any setup steps required for your changes**
3. **Include test results in your PR description**
4. **Note any warnings or failures and explain if they're expected**
5. **Update this guide if you discover new verification needs**
6. **Check relevant migration docs for context**
7. **When in doubt, start both systems and test manually**

**💡 Need practical examples?** See [AGENT_VERIFICATION_EXAMPLES.md](./AGENT_VERIFICATION_EXAMPLES.md) for step-by-step examples of common verification scenarios.

---

## 📚 Additional Resources

- **Verification Examples**: [AGENT_VERIFICATION_EXAMPLES.md](./AGENT_VERIFICATION_EXAMPLES.md) - Practical examples for common scenarios
- **Migration Overview**: [docs/payload-migration/README.md](./payload-migration/README.md)
- **Core Data Models**: [docs/payload-migration/03-core-data-models.md](./payload-migration/03-core-data-models.md)
- **Migration Tasks**: [docs/payload-migration/04-migration-tasks.md](./payload-migration/04-migration-tasks.md)
- **PHP PostgreSQL Integration**: [docs/payload-migration/03.5-php-postgresql-querying.md](./payload-migration/03.5-php-postgresql-querying.md)
- **Environment Variables**: [docs/ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- **Main README**: [README.md](../README.md)

---

## 🤝 Getting Help

If verification fails and you can't resolve it:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review error logs carefully
3. Check if your changes conflict with existing code
4. Document the issue clearly in your PR
5. Tag the repository maintainers for assistance

Remember: It's better to report a problem you can't solve than to submit broken code! 🙏
