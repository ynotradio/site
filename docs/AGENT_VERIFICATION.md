# Agent Verification Guide

**For GitHub Copilot Agents working on Y-Not Radio Site**

This guide helps you spin up working development environments to test your changes like an end user.

> **💡 New to this?** Check out [AGENT_VERIFICATION_EXAMPLES.md](./AGENT_VERIFICATION_EXAMPLES.md) for practical examples.

---

## 🎯 Quick Start

### Spin up Payload CMS

```bash
npm run verify:payload
```

This will:
- Start Payload CMS at http://localhost:3000
- Run migrations
- Optionally seed sample data
- Give you login instructions

### Spin up Legacy PHP/MySQL Site

```bash
npm run verify:legacy
```

This will:
- Start the legacy site at http://localhost:8080
- Start PHPMyAdmin at http://localhost:8181
- Give you database credentials

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Using Payload CMS](#using-payload-cms)
4. [Using the Legacy Site](#using-the-legacy-site)
5. [Testing Your Changes](#testing-your-changes)
6. [Troubleshooting](#troubleshooting)
7. [Migration Strategy Compliance](#migration-strategy-compliance)

---

## Overview

The Y-Not Radio site is migrating from PHP/MySQL to Payload CMS with PostgreSQL. As an agent:

1. **Spin up working environments** - Use the scripts to get things running
2. **Test like an end user** - Log in, browse, create/edit content
3. **Verify your changes** - Make sure everything works as expected
4. **Document issues** - Note any problems you encounter

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
npm run verify:payload
```

This script will:
1. ✅ Check for `.env.local` configuration
2. ✅ Install dependencies if needed
3. ✅ Run database migrations
4. ✅ Start Payload server
5. ✅ Offer to seed sample data
6. ✅ Provide URLs and login instructions

Then open http://localhost:3000/admin in your browser to:
- Create your admin user account
- Log in and explore collections
- Test your changes like an end user

### Manual Steps (if needed)

If the automated script doesn't work:

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Run Migrations

```bash
npm run payload:migrate
```

#### 3. Start Payload Server

```bash
npm run payload:dev
```

Server starts at http://localhost:3000

#### 4. Use the Application

**Admin UI:** http://localhost:3000/admin
- Create an admin account
- Log in and browse collections
- Create/edit content
- Test your changes

**API Endpoint:** http://localhost:3000/api
**GraphQL Playground:** http://localhost:3000/api/graphql

#### 5. Seed Sample Data (optional)

```bash
npm run payload:seed
```
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

## Using the Legacy Site

### Automated Setup

```bash
npm run verify:legacy
```

This script will:
1. ✅ Check Docker is running
2. ✅ Start Docker containers (MySQL, PHP-FPM, Apache, PHPMyAdmin)
3. ✅ Wait for services to be ready
4. ✅ Provide URLs and credentials

Then open http://localhost:8080 in your browser to:
- Browse the legacy PHP site
- Test functionality like an end user
- Verify your PHP changes work

Use PHPMyAdmin at http://localhost:8181 to:
- View and edit database records
- Run SQL queries
- Import/export data

### Manual Steps (if needed)

#### 1. Start Docker Containers

```bash
docker-compose up -d
```

#### 2. Use the Application

**Main Site:** http://localhost:8080
- Browse pages
- Test functionality
- Verify your changes

**PHPMyAdmin:** http://localhost:8181
- Server: `mysql`
- Username: `ynot_sql_user`
- Password: `ynot_sql_pass`
- Database: `ynot_site`

#### 3. Import Database (if needed)

```bash
./bin/import_db.sh
```

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
1. Check server logs: `.agent-tmp/payload-server.log`
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
