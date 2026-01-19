# E2E Testing - Local & CI

This repository uses **unified scripts** for both local development and CI, following DRY principles.

## Quick Start (Local)

```bash
# One command - handles everything
yarn test:e2e

# Or with UI mode
yarn test:e2e:ui

# Or with headed browser
yarn test:e2e:headed

# Or debug mode
yarn test:e2e:debug
```

## What Happens

The same setup script (`bin/setup-e2e-tests.sh`) runs in both environments:

1. ✅ Creates `.env.local` and PHP env files
2. ✅ Installs dependencies (Node + PHP)
3. ✅ Starts Docker services (Postgres, MySQL, Apache)
4. ✅ Waits for services to be ready
5. ✅ Initializes MySQL schema
6. ✅ Seeds legacy MySQL database
7. ✅ Playwright global-setup seeds Payload database

## Architecture

```
Local Development          CI (GitHub Actions)
─────────────────          ───────────────────
yarn test:e2e              workflow: e2e.yml
    ↓                           ↓
pretest:e2e                Setup E2E environment
    ↓                           ↓
┌─────────────────────────────────────────────┐
│   bin/setup-e2e-tests.sh (SHARED)          │
│   ├─ bin/setup-e2e-env.sh                  │
│   ├─ bin/wait-for-docker-services.sh       │
│   ├─ bin/init-mysql-db.sh                  │
│   └─ yarn seed:legacy                      │
└─────────────────────────────────────────────┘
    ↓                           ↓
playwright test            playwright test
    ↓                           ↓
e2e/global-setup.ts        e2e/global-setup.ts
    ↓                           ↓
Run tests                  Run tests
```

## DRY Benefits

- **Single source of truth**: Setup logic in one place
- **Consistent behavior**: Same steps locally and in CI
- **Easy updates**: Change once, applies everywhere
- **Faster debugging**: Test CI logic locally

## Manual Control

If you need finer control:

```bash
# Just setup (no tests)
yarn setup:e2e

# Then run tests manually
npx playwright test

# Or specific test
npx playwright test payload-integration

# Cleanup
docker compose down -v
```

## Shared Scripts

All these are used by both local and CI:

- `bin/setup-e2e-tests.sh` - Main orchestrator
- `bin/setup-e2e-env.sh` - Environment files
- `bin/wait-for-docker-services.sh` - Service readiness
- `bin/init-mysql-db.sh` - MySQL initialization
- `e2e/global-setup.ts` - Playwright setup (Payload seeding)

## Environment Variables

Both environments use the same credentials:

```bash
PAYLOAD_DEV_EMAIL=admin@ynotradio.net
PAYLOAD_DEV_PASSWORD=password
```

Set in:
- Local: Handled by setup script
- CI: Set in e2e.yml workflow
