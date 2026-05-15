# Buildkite CI Migration Plan

## Overview

Migration from GitHub Actions to Buildkite for CI/CD. All pipeline configurations are in `.buildkite/` directory.

**Current status:** Non-E2E steps (ESLint, Vitest, Storybook, PHP Lint) run on Buildkite. E2E tests remain in GitHub Actions due to Docker-in-Docker networking limitations (see `docs/archive/ci-setup/buildkite-e2e-investigation.md`).

## Pipelines

| Buildkite Pipeline | Replaces GitHub Actions | Status |
|---|---|---|
| `pipeline.yml` | ci.yml + e2e.yml | ✅ CI steps active, E2E deferred |
| `build-images.yml` | build-agent-images.yml | ✅ Active |
| `scheduled-db-sync.yml` | weekly-db-sync.yml | ✅ Active |
| `nightly-gap-report.yml` | *(new)* | ✅ Active |

## Required Configuration

### Environment Variables (in Buildkite)
- `GHCR_USERNAME` / `GHCR_TOKEN` - GitHub Container Registry
- `PRODUCTION_DATABASE_URL` / `PREVIEW_DATABASE_URL` - Databases
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` - E2E tests
- `CODECOV_TOKEN` - Optional

### Agent Requirements
- Docker & Docker Compose
- Node.js 22 (or use Docker images)
- PHP 7.4 (or use Docker images)
- 4GB+ RAM, 2+ CPU cores, 50GB+ disk

## Setup

1. Sign up at [buildkite.com](https://buildkite.com) (cloud agents or self-hosted)
2. Add environment variables in Buildkite UI: Pipeline → Settings → Environment Variables
3. Create pipeline: name "Y-Not Radio - CI", config path `.buildkite/pipeline.yml`
4. Enable webhooks for pull requests
5. Trigger a manual build or test PR to verify

See `.buildkite/README.md` and `docs/NETLIFY_DATABASE_CUTOVER.md` for detailed pipeline configuration.
