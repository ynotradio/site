# Buildkite Migration Overview

## Files Created

- **`.buildkite/pipeline.yml`** - Main CI (replaces ci.yml + e2e.yml)
- **`.buildkite/build-images.yml`** - Docker image building (replaces build-agent-images.yml)
- **`.buildkite/scheduled-db-sync.yml`** - Weekly DB sync (replaces weekly-db-sync.yml)
- **`.buildkite/README.md`** - Setup instructions and configuration
- **`docs/BUILDKITE_MIGRATION_PLAN.md`** - Migration strategy and implementation details
- **`docs/BUILDKITE_GETTING_STARTED.md`** - Step-by-step setup guide

## What's NOT Changed

No existing GitHub Actions workflows modified. This is planning/configuration only.

## Agent Requirements

- Docker and Docker Compose
- Node.js 22 (or use Docker images)
- PHP 7.4 (or use Docker images)
- Minimum 4GB RAM, 2 CPU cores, 50GB disk

## Required Secrets

Configure in Buildkite:
- `GHCR_USERNAME` / `GHCR_TOKEN` - GitHub Container Registry
- `NEON_PROD_DATABASE_URL` / `NEON_DEV_DATABASE_URL` - Databases
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` - E2E tests
- `CODECOV_TOKEN` - Optional, for coverage

## Pipeline Structure

**Main Pipeline**: Quality checks (parallel) → Tests (parallel) → Build → E2E Tests

**Image Building**: Builds Payload, PHP-FPM, PostgreSQL images on push to main

**Scheduled**: Weekly prod→dev DB sync (Monday 2 AM UTC)
