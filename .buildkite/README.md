# Buildkite Configuration

Pipeline configurations for Y-Not Radio CI/CD.

## Pipeline Files

- **`pipeline.yml`** - Main CI: quality checks → tests → build → E2E (triggers on PRs)
- **`build-images.yml`** - Docker image building → GHCR (triggers on push to main)
- **`scheduled-db-sync.yml`** - Weekly prod→dev DB sync (Monday 2 AM UTC)

## Required Environment Variables

Configure in Buildkite UI:

```bash
# GitHub Container Registry
GHCR_USERNAME=<github-username>
GHCR_TOKEN=<github-token-with-packages-write>

# GitHub PR Comments (Storybook preview links)
# Fine-grained PAT scoped to ynotradio/site with pull_requests:write
GITHUB_PR_TOKEN=<github-pat-with-pr-write>

# Databases
NEON_PROD_DATABASE_URL=<production-url>
NEON_DEV_DATABASE_URL=<development-url>

# Cloudinary (for E2E tests)
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# CodeCov (optional)
CODECOV_TOKEN=<codecov-token>
```

## Agent Requirements

- Docker & Docker Compose, Git, Bash
- Agent tags: `queue=default`, `docker=true`
- Minimum: 4GB RAM, 2 CPU, 50GB disk

## Setting Up Pipelines

### Main CI Pipeline
1. Buildkite → Pipelines → New Pipeline
2. Name: "Y-Not Radio - CI"
3. Repository: `https://github.com/ynotradio/site`
4. Configuration path: `.buildkite/pipeline.yml`
5. Enable webhooks: Pull Request, Push to Branch
6. Add environment variables

### Image Building Pipeline
1. New Pipeline: "Y-Not Radio - Build Images"
2. Configuration path: `.buildkite/build-images.yml`
3. Branch filter: `main master`
4. Enable webhook: Push to Branch
5. Add GHCR credentials

### Scheduled DB Sync
1. New Pipeline: "Y-Not Radio - Weekly DB Sync"
2. Configuration path: `.buildkite/scheduled-db-sync.yml`
3. Disable webhooks
4. Build Schedule: `0 2 * * 1` on `main`
5. Add database URLs

## Troubleshooting

**Docker permissions:** `sudo usermod -aG docker buildkite-agent && sudo systemctl restart buildkite-agent`

**Image pull failures:** Verify GHCR_TOKEN has `read:packages` permission

**Missing env vars:** Check Buildkite pipeline settings → Environment Variables

**E2E timeouts:** Increase `timeout_in_minutes` in pipeline.yml or check Docker resources

## References

- [Buildkite Docs](https://buildkite.com/docs)
- [Docker Plugin](https://github.com/buildkite-plugins/docker-buildkite-plugin)
- [Migration Plan](../docs/BUILDKITE_MIGRATION_PLAN.md)
