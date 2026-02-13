# Buildkite Configuration

This directory contains the Buildkite pipeline configurations for the Y-Not Radio site CI/CD.

## Pipeline Files

### `pipeline.yml`
Main CI pipeline that runs on pull requests. Includes:
- **Quality Checks**: ESLint and PHP_CodeSniffer (parallel)
- **Tests**: Vitest unit tests, Storybook build (parallel, after quality checks)
- **Build**: Next.js build (after tests)
- **E2E Tests**: Playwright end-to-end tests (after build)

**Triggers**: Pull requests to main/master branches

### `build-images.yml`
Docker image building pipeline for pre-built development images. Builds and pushes:
- Payload development image
- PHP-FPM development image
- Seeded PostgreSQL image

**Triggers**: Manual or push to main/master branches (when relevant files change)

### `scheduled-db-sync.yml`
Scheduled database synchronization pipeline. Copies production database to development.

**Triggers**: Weekly schedule (Monday 2 AM UTC) or manual trigger

## Required Environment Variables

Configure these in your Buildkite organization or agent environment:

### GitHub Container Registry (GHCR)
```bash
GHCR_USERNAME=<github-username>
GHCR_TOKEN=<github-personal-access-token-with-packages-write>
```

### Neon Database URLs
```bash
NEON_PROD_DATABASE_URL=<production-database-connection-string>
NEON_DEV_DATABASE_URL=<development-database-connection-string>
```

### Cloudinary (for E2E tests)
```bash
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
```

### CodeCov (optional)
```bash
CODECOV_TOKEN=<your-codecov-token>
```

## Agent Requirements

Agents running these pipelines need:

### Software Requirements
- Docker and Docker Compose
- Git
- Bash shell

### Agent Tags
Agents should be tagged appropriately:
- `queue=default` - Standard build queue
- `docker=true` - For jobs requiring Docker

### Resource Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 50GB disk
- **Recommended**: 8GB RAM, 4 CPU cores, 100GB disk

## Setting Up a New Pipeline in Buildkite

### 1. Main CI Pipeline

1. Go to Buildkite → Pipelines → New Pipeline
2. Name: "Y-Not Radio - CI"
3. Repository: `https://github.com/ynotradio/site`
4. Configuration: 
   - Path: `.buildkite/pipeline.yml`
5. Branch Configuration:
   - Default Branch: `main`
6. Webhook:
   - Enable: Pull Request, Push to Branch
7. Environment Variables: Add required secrets (see above)

### 2. Docker Image Building Pipeline

1. Go to Buildkite → Pipelines → New Pipeline
2. Name: "Y-Not Radio - Build Images"
3. Repository: `https://github.com/ynotradio/site`
4. Configuration:
   - Path: `.buildkite/build-images.yml`
5. Branch Configuration:
   - Default Branch: `main`
   - Branch Filter: `main master`
6. Webhook:
   - Enable: Push to Branch
   - Branch Pattern: `main, master`
7. Environment Variables: Add GHCR credentials

### 3. Scheduled Database Sync Pipeline

1. Go to Buildkite → Pipelines → New Pipeline
2. Name: "Y-Not Radio - Weekly DB Sync"
3. Repository: `https://github.com/ynotradio/site`
4. Configuration:
   - Path: `.buildkite/scheduled-db-sync.yml`
5. Branch Configuration:
   - Default Branch: `main`
6. Webhook:
   - Disable webhooks (scheduled only)
7. Build Schedules:
   - Schedule: `0 2 * * 1` (Monday 2 AM UTC)
   - Branch: `main`
   - Enabled: Yes
8. Environment Variables: Add Neon database URLs

## Running Pipelines Locally (Testing)

You can test the pipeline configuration using the Buildkite agent locally:

```bash
# Install Buildkite agent
# See: https://buildkite.com/docs/agent/v3/installation

# Test main pipeline
buildkite-agent pipeline upload .buildkite/pipeline.yml

# Test specific step
docker run --rm -v $(pwd):/app -w /app node:22 bash -c "yarn install && yarn lint"
```

## Troubleshooting

### Docker Permission Issues
If you see Docker permission errors:
```bash
# Add buildkite-agent user to docker group
sudo usermod -aG docker buildkite-agent
sudo systemctl restart buildkite-agent
```

### Image Pull Failures
If pre-built images fail to pull:
- Verify GHCR_TOKEN has `read:packages` permission
- Check that images exist: `docker pull ghcr.io/ynotradio/site/payload-dev:latest`
- Pipeline will build from scratch if pull fails (slower but works)

### E2E Test Timeouts
If E2E tests timeout:
- Increase `timeout_in_minutes` in pipeline.yml
- Check Docker resource limits
- Verify pre-built images are pulling correctly

### Missing Environment Variables
If builds fail with missing env vars:
- Check Buildkite pipeline settings → Environment Variables
- Ensure secrets are set correctly
- Use `echo "$$VAR_NAME"` (double dollar signs) in pipeline YAML

## Migration from GitHub Actions

See [../docs/BUILDKITE_MIGRATION_PLAN.md](../docs/BUILDKITE_MIGRATION_PLAN.md) for the complete migration strategy.

## References

- [Buildkite Documentation](https://buildkite.com/docs)
- [Docker Plugin](https://github.com/buildkite-plugins/docker-buildkite-plugin)
- [Pipeline YAML Reference](https://buildkite.com/docs/pipelines/defining-steps)
