# E2E Testing Scripts

This directory contains bash scripts that encapsulate complex setup and configuration logic from `.github/workflows/e2e.yml`, making the workflow more maintainable and reusable.

## Available Scripts

### `setup-e2e-env.sh`

Sets up environment configuration files for E2E tests.

**What it does:**
- Creates `.env.local` with Payload CMS and PostgreSQL configuration
- Creates `src/partials/.env` with PHP environment variables
- Configures database connections for both Payload and legacy PHP site
- Sets up Auth0 test credentials

**Usage:**
```bash
./bin/setup-e2e-env.sh
```

**Replaces:**
- "Setup environment file" step in e2e.yml (lines 77-107)
- "Setup PHP .env file for Postgres mode" step in e2e.yml (lines 109-140)

### `wait-for-docker-services.sh`

Waits for Docker Compose services to be fully ready before running tests.

**What it does:**
- Polls PostgreSQL until it accepts connections (up to 60 seconds)
- Polls MySQL until it accepts connections (up to 60 seconds)
- Polls Apache until it responds to HTTP requests (up to 60 seconds)
- Exits with error code 1 if any service fails to start

**Usage:**
```bash
./bin/wait-for-docker-services.sh
```

**Replaces:**
- "Wait for PostgreSQL" step in e2e.yml (lines 152-161)
- "Wait for MySQL" step in e2e.yml (lines 163-172)
- "Wait for Apache" step in e2e.yml (lines 196-206)

### `init-mysql-db.sh`

Initializes the MySQL database schema for the legacy PHP site.

**What it does:**
- Waits an additional 5 seconds for MySQL to be fully ready
- Creates `ynot_site` database if it doesn't exist
- Imports schema from `src/db/docker/ynot_db.sql` if available
- Provides clear success/failure messages

**Usage:**
```bash
./bin/init-mysql-db.sh
```

**Replaces:**
- "Initialize MySQL database schema" step in e2e.yml (lines 174-194)

## Benefits

### 1. Maintainability
- Changes to setup logic only need to be made in one place
- Scripts can be version controlled and tested independently
- Easier to understand and review compared to YAML embedded bash

### 2. Reusability
- Scripts can be run locally for manual testing
- Can be used in other CI/CD pipelines or automation tasks
- Developers can use them to set up their local environment

### 3. Testability
- Scripts can be tested independently of the CI workflow
- Easier to debug issues by running scripts locally
- Can add shellcheck or other linting tools

### 4. Clarity
- Workflow file becomes more concise and declarative
- Complex logic is abstracted into well-named scripts
- Easier to see the high-level test flow

## Example: Before and After

**Before** (in `.github/workflows/e2e.yml`):
```yaml
- name: Setup environment file
  run: |
    cp .env.example .env.local
    echo "DATABASE_URI=postgresql://..." >> .env.local
    echo "POSTGRES_HOST=postgres" >> .env.local
    # ... 30 more lines of echo statements ...
```

**After**:
```yaml
- name: Setup environment files
  run: ./bin/setup-e2e-env.sh
```

## Running Locally

All scripts are designed to work both in CI and locally:

```bash
# Start Docker services
docker compose up -d postgres mysql phpfpm apache

# Setup environment files
./bin/setup-e2e-env.sh

# Wait for services to be ready
./bin/wait-for-docker-services.sh

# Initialize MySQL database
./bin/init-mysql-db.sh

# Seed databases
yarn seed:legacy
yarn seed:payload

# Run tests
npx playwright test
```

## Script Guidelines

When creating new scripts:

1. **Use strict mode**: Always start with `set -euo pipefail`
2. **Use absolute paths**: Calculate `PROJECT_ROOT` relative to script location
3. **Provide clear output**: Use emoji and clear messages (✅ ❌ ⏳)
4. **Exit codes**: Exit with 1 on failure, 0 on success
5. **Timeouts**: Include reasonable timeouts for polling operations
6. **Error messages**: Explain what went wrong and how to fix it
7. **Documentation**: Add comments explaining complex logic

## References

- [Bash Best Practices](https://bertvv.github.io/cheat-sheets/Bash.html)
- [Shellcheck - Shell Script Linter](https://www.shellcheck.net/)
- [Docker Compose CLI Reference](https://docs.docker.com/compose/reference/)
