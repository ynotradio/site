# Buildkite CI Migration Plan

## Overview

Migration from GitHub Actions to Buildkite for CI/CD. All pipeline configurations are in `.buildkite/` directory.

## Current GitHub Actions Workflows

- **ci.yml** - Lint, test, build (5 parallel jobs)
- **e2e.yml** - Playwright E2E tests with Docker
- **build-agent-images.yml** - Docker image building → GHCR
- **weekly-db-sync.yml** - Scheduled prod→dev DB sync

## Buildkite Pipelines

- **pipeline.yml** - Main CI (replaces ci.yml + e2e.yml)
- **build-images.yml** - Docker image building (replaces build-agent-images.yml)
- **scheduled-db-sync.yml** - Weekly DB sync (replaces weekly-db-sync.yml)

Complete feature parity maintained.

## Migration Approach

1. **Setup**: Create Buildkite account, configure agents, set environment variables
2. **Test**: Upload pipelines and validate with test PRs
3. **Parallel**: Run both CI systems simultaneously for validation
4. **Cutover**: Make Buildkite primary, archive GitHub Actions

## Required Configuration

### Environment Variables (in Buildkite)
- `GHCR_USERNAME` / `GHCR_TOKEN` - GitHub Container Registry
- `NEON_PROD_DATABASE_URL` / `NEON_DEV_DATABASE_URL` - Databases
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` - E2E tests
- `CODECOV_TOKEN` - Optional

### Agent Requirements
- Docker & Docker Compose
- Node.js 22 (or use Docker images)
- PHP 7.4 (or use Docker images)
- 4GB+ RAM, 2+ CPU cores, 50GB+ disk

### Agent Options
- **Buildkite Cloud Agents**: Managed, pay-per-use
- **Self-Hosted Agents**: More control, fixed costs

## Setup Instructions

See `.buildkite/README.md` for detailed setup steps.

## Rollback

GitHub Actions remain active during parallel phase. Can revert at any time before final cutover.
