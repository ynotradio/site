# Buildkite Configuration

Pipeline configurations for Y-Not Radio CI/CD.

## Pipeline Files

- **`pipeline.yml`** - Entry-point gate: checks for code changes, uploads `pipeline-ci.yml` if found, or skips for doc-only PRs
- **`pipeline-ci.yml`** - Full CI steps: quality checks → tests → build → E2E (uploaded dynamically by `pipeline.yml`)
- **`pipeline-deploy-legacy.yml`** - Legacy PHP site deploy: manual unblock gate → rsync + composer deploy to production (uploaded alongside `pipeline-ci.yml` on master pushes)
- **`build-images.yml`** - Docker image building → GHCR (triggers on push to main)
- **`scheduled-db-sync.yml`** - Weekly prod→dev Neon branch reset (Monday 2 AM UTC, safety net)
- **`nightly-gap-report.yml`** - Nightly import + gap report + dev branch reset: imports from prod MySQL → Neon, resets dev branch from prod, posts import summary and gap report

## Required Environment Variables

Configure in Buildkite UI:

```bash
# GitHub Container Registry
GHCR_USERNAME=<github-username>
GHCR_TOKEN=<github-token-with-packages-write>

# Databases
NEON_PROD_DATABASE_URL=<production-url>
NEON_DEV_DATABASE_URL=<development-url>
NEON_API_KEY=<neon-api-key>  # for dev branch reset (neonctl)

# Cloudinary (for E2E tests)
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# CodeCov (optional)
CODECOV_TOKEN=<codecov-token>

# Nightly gap report
PROD_MYSQL_HOST=<production-mysql-hostname>
PROD_MYSQL_USER=<production-mysql-username>
PROD_MYSQL_PASSWORD=<production-mysql-password>
PROD_MYSQL_DATABASE=<production-mysql-database>  # default: ynot_site
GITHUB_PR_TOKEN=<fine-grained-pat-with-issues-write>  # also used by storybook deploy
GAP_REPORT_ISSUE_NUMBER=<github-issue-number-to-update>

# Legacy PHP deploy (pipeline-deploy-legacy.yml)
DEPLOY_SSH_KEY=<ssh-private-key-for-production-server>
DEPLOY_SSH_HOST=<production-server-hostname-or-ip>
DEPLOY_SSH_KNOWN_HOSTS=<known-hosts-entry-from-ssh-keyscan>
ENV_PHP_CONTENTS=<full-contents-of-production-env.php>
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
4. Build Schedule: `0 2 * * 1` on `master`
5. Add secret: `NEON_API_KEY`

### Nightly Import & Gap Report

1. New Pipeline: "Y-Not Radio - Nightly Sync"
2. Configuration path: `.buildkite/nightly-gap-report.yml`
3. Disable webhooks
4. Build Schedule: `0 3 * * *` (daily at 3 AM UTC) on `master`
5. Add secrets: `PROD_MYSQL_HOST`, `PROD_MYSQL_USER`, `PROD_MYSQL_PASSWORD`,
   `PROD_MYSQL_DATABASE`, `NEON_PROD_DATABASE_URL`, `NEON_API_KEY`, `GITHUB_PR_TOKEN`, `GAP_REPORT_ISSUE_NUMBER`
6. Create a GitHub issue to track migration progress (note the issue number)

### Legacy PHP Deploy Pipeline

Automatically appended to every master-push build by `check-changes.sh`. No separate pipeline registration is needed — it runs as part of the main CI build.

**How it works:**

1. Merge a PR to `master` in the GitHub app (works from mobile 📱)
2. Buildkite picks up the push, runs full CI (`pipeline-ci.yml`)
3. The deploy pipeline (`pipeline-deploy-legacy.yml`) is uploaded at the same time
4. A **block step** ("🚀 Deploy legacy site to production?") pauses the deploy until you manually unblock it from the Buildkite web UI or mobile app
5. After unblocking, the deploy step:
   - Installs `rsync` and `openssh-client` in the `composer:2` container
   - Fetches `DEPLOY_SSH_KEY`, `DEPLOY_SSH_HOST`, and `ENV_PHP_CONTENTS` from Buildkite secrets
   - Runs `composer install --no-dev` locally in `src/`
   - Creates a timestamped backup of `htdocs` on the server (keeps latest 15)
   - Rsyncs `src/` to `~/htdocs/` on the production server
   - Copies `.env.php` to `~/htdocs/.env`
   - Runs `composer install --no-dev --optimize-autoloader` on the server

**Required secrets** (add via Buildkite UI → Pipeline Settings → Secrets):

| Secret | Description |
|---|---|
| `DEPLOY_SSH_KEY` | SSH private key for the production server (`bitnami` user) |
| `DEPLOY_SSH_HOST` | Production server hostname or IP address |
| `DEPLOY_SSH_KNOWN_HOSTS` | Known-hosts entry for the server (get with `ssh-keyscan <hostname>`) |
| `ENV_PHP_CONTENTS` | Full contents of the production `.env.php` file |

> **Note:** `bin/deploy.sh` and `bin/pre-deploy.sh` continue to work unchanged for local manual deploys.

## Troubleshooting

**Docker permissions:** `sudo usermod -aG docker buildkite-agent && sudo systemctl restart buildkite-agent`

**Image pull failures:** Verify GHCR_TOKEN has `read:packages` permission

**Missing env vars:** Check Buildkite pipeline settings → Environment Variables

**E2E timeouts:** Increase `timeout_in_minutes` in pipeline.yml or check Docker resources

## References

- [Buildkite Docs](https://buildkite.com/docs)
- [Docker Plugin](https://github.com/buildkite-plugins/docker-buildkite-plugin)
- [Migration Plan](../docs/BUILDKITE_MIGRATION_PLAN.md)
