# GitHub Actions to Buildkite CI Migration Plan

## Executive Summary

This document outlines the plan for migrating Y-Not Radio's continuous integration (CI) from GitHub Actions to Buildkite. The migration aims to provide greater flexibility, better pipeline visualization, and potentially improved performance while maintaining all existing CI capabilities.

## Current State Analysis

### Existing GitHub Actions Workflows

The repository currently uses four GitHub Actions workflows:

1. **ci.yml** - Main CI pipeline with 5 parallel jobs:
   - Lint (ESLint)
   - Test (Vitest with coverage)
   - Storybook Build
   - Build (Next.js)
   - PHP Lint (PHP_CodeSniffer)

2. **e2e.yml** - End-to-end testing with Playwright:
   - Docker Compose setup for integration testing
   - Pre-built image pulling from GHCR
   - Full stack testing (Payload CMS + Legacy PHP)
   - Artifact upload for test results

3. **build-agent-images.yml** - Docker image building:
   - Payload development image
   - PHP-FPM legacy image
   - PostgreSQL seeded image
   - Pushes to GitHub Container Registry

4. **weekly-db-sync.yml** - Scheduled database synchronization:
   - Runs weekly (Monday 2 AM UTC)
   - Copies production database to development
   - Manual trigger capability

### Current CI Characteristics

**Strengths:**
- Parallel job execution for fast feedback
- Comprehensive caching (Node, Playwright, Composer, Next.js)
- Docker integration with pre-built images
- Artifact storage for test results
- CodeCov integration for coverage reporting

**Dependencies:**
- Node.js 22
- PHP 7.4
- Docker and Docker Compose
- Playwright browsers
- Composer dependencies
- Multiple caching strategies

## Migration Rationale

### Why Buildkite?

1. **Enhanced Pipeline Visualization**: Better UI for understanding complex pipelines
2. **Flexible Agent Management**: Control over build environments and infrastructure
3. **Cost Control**: Self-hosted agents can reduce costs for high-volume projects
4. **Advanced Pipeline Features**: Dynamic pipelines, better conditional logic
5. **Improved Artifact Management**: Better handling of large artifacts and test results
6. **Superior Debugging**: Better access to build logs and artifacts

### Considerations

- Buildkite requires self-hosted agents or use of Buildkite-hosted agents
- Initial setup and configuration effort
- Team learning curve for new platform
- Need to maintain infrastructure (if self-hosted)

## Proposed Buildkite Pipeline Structure

### Pipeline Configuration (.buildkite/pipeline.yml)

```yaml
env:
  NODE_VERSION: "22"
  PHP_VERSION: "7.4"

steps:
  # Fast feedback jobs (parallel)
  - group: "Quality Checks"
    key: "quality"
    steps:
      - label: ":eslint: Lint"
        key: "lint"
        command: |
          yarn install --frozen-lockfile
          yarn lint
        plugins:
          - docker#v5.11.0:
              image: "node:22"
              volumes:
                - ".:/app"
              workdir: "/app"
              environment:
                - "CI=true"

      - label: ":php: PHP Lint"
        key: "php-lint"
        command: |
          cd src
          composer install --no-interaction --prefer-dist
          vendor/bin/phpcs --standard=phpcs.xml --warning-severity=0
        plugins:
          - docker#v5.11.0:
              image: "php:7.4-cli"
              volumes:
                - ".:/app"
              workdir: "/app"

  # Test jobs (parallel)
  - group: "Tests"
    key: "tests"
    depends_on: "quality"
    steps:
      - label: ":vitest: Unit Tests"
        key: "test"
        command: |
          yarn install --frozen-lockfile
          yarn test:coverage
        artifact_paths:
          - "coverage/**/*"
        plugins:
          - docker#v5.11.0:
              image: "node:22"
              volumes:
                - ".:/app"
              workdir: "/app"
              environment:
                - "CI=true"

      - label: ":storybook: Storybook Build"
        key: "storybook"
        command: |
          yarn install --frozen-lockfile
          yarn build-storybook
        plugins:
          - docker#v5.11.0:
              image: "node:22"
              volumes:
                - ".:/app"
              workdir: "/app"

  # Build job
  - label: ":nextjs: Build"
    key: "build"
    depends_on: "tests"
    command: |
      yarn install --frozen-lockfile
      yarn build
    artifact_paths:
      - ".next/**/*"
    plugins:
      - docker#v5.11.0:
          image: "node:22"
          volumes:
            - ".:/app"
          workdir: "/app"
          environment:
            - "CI=true"

  # E2E Tests (after build)
  - label: ":playwright: E2E Tests"
    key: "e2e"
    depends_on: "build"
    timeout_in_minutes: 30
    command: |
      # Pull pre-built images
      docker pull ghcr.io/ynotradio/site/phpfpm-dev:latest || true
      docker pull ghcr.io/ynotradio/site/postgres-seeded:latest || true
      docker pull mysql:8.0 || true
      docker pull httpd:2.4 || true
      
      # Install dependencies
      yarn install --frozen-lockfile
      
      # Setup E2E environment
      ./bin/setup-e2e-tests.sh
      
      # Run tests
      npx playwright test
      
      # Cleanup
      docker compose -f docker-compose.yml -f docker-compose.ci.yml down -v 2>/dev/null || docker compose down -v
    artifact_paths:
      - "playwright-report/**/*"
      - "test-results/**/*"
    env:
      CI: "true"
      SKIP_DEPS_CHECK: "true"
      PAYLOAD_DEV_EMAIL: "admin@ynotradio.net"
      PAYLOAD_DEV_PASSWORD: "password"
    plugins:
      - docker-compose#v4.16.0:
          run: playwright
          config:
            - docker-compose.yml
            - docker-compose.ci.yml
          env:
            - CI
            - SKIP_DEPS_CHECK
            - PAYLOAD_DEV_EMAIL
            - PAYLOAD_DEV_PASSWORD
```

### Docker Image Building Pipeline (.buildkite/build-images.yml)

```yaml
steps:
  - group: "Build Docker Images"
    key: "build-images"
    steps:
      - label: ":docker: Build Payload Image"
        key: "build-payload"
        command: |
          echo "$$GHCR_TOKEN" | docker login ghcr.io -u $$GHCR_USERNAME --password-stdin
          docker build -f Dockerfile.payload -t ghcr.io/ynotradio/site/payload-dev:$$BUILDKITE_COMMIT -t ghcr.io/ynotradio/site/payload-dev:latest .
          docker push ghcr.io/ynotradio/site/payload-dev:$$BUILDKITE_COMMIT
          docker push ghcr.io/ynotradio/site/payload-dev:latest
        branches: "main master"
        env:
          GHCR_USERNAME: "${GHCR_USERNAME}"
          GHCR_TOKEN: "${GHCR_TOKEN}"

      - label: ":docker: Build PHP-FPM Image"
        key: "build-phpfpm"
        command: |
          echo "$$GHCR_TOKEN" | docker login ghcr.io -u $$GHCR_USERNAME --password-stdin
          docker build -f bin/docker/phpfpm/Dockerfile -t ghcr.io/ynotradio/site/phpfpm-dev:$$BUILDKITE_COMMIT -t ghcr.io/ynotradio/site/phpfpm-dev:latest .
          docker push ghcr.io/ynotradio/site/phpfpm-dev:$$BUILDKITE_COMMIT
          docker push ghcr.io/ynotradio/site/phpfpm-dev:latest
        branches: "main master"
        env:
          GHCR_USERNAME: "${GHCR_USERNAME}"
          GHCR_TOKEN: "${GHCR_TOKEN}"

      - label: ":docker: Build Postgres Image"
        key: "build-postgres"
        command: |
          echo "$$GHCR_TOKEN" | docker login ghcr.io -u $$GHCR_USERNAME --password-stdin
          docker build -f bin/docker/postgres/Dockerfile -t ghcr.io/ynotradio/site/postgres-seeded:$$BUILDKITE_COMMIT -t ghcr.io/ynotradio/site/postgres-seeded:latest .
          docker push ghcr.io/ynotradio/site/postgres-seeded:$$BUILDKITE_COMMIT
          docker push ghcr.io/ynotradio/site/postgres-seeded:latest
        branches: "main master"
        env:
          GHCR_USERNAME: "${GHCR_USERNAME}"
          GHCR_TOKEN: "${GHCR_TOKEN}"
```

### Scheduled Pipeline (.buildkite/scheduled.yml)

```yaml
# Weekly database sync
# Configure as a scheduled build in Buildkite UI
steps:
  - label: ":database: Sync Production to Development"
    key: "db-sync"
    command: |
      yarn install --frozen-lockfile
      echo "yes" | yarn neon-db:copy prod dev
    env:
      NEON_PROD_DATABASE_URL: "${NEON_PROD_DATABASE_URL}"
      NEON_DEV_DATABASE_URL: "${NEON_DEV_DATABASE_URL}"
    plugins:
      - docker#v5.11.0:
          image: "node:22"
          volumes:
            - ".:/app"
          workdir: "/app"
```

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Objective**: Set up basic Buildkite infrastructure and test with simple pipeline

**Tasks**:
1. Create Buildkite organization/team account
2. Set up initial Buildkite agents (cloud or self-hosted)
3. Create basic `.buildkite/pipeline.yml` with lint job only
4. Configure repository webhook in Buildkite
5. Test basic pipeline execution
6. Document agent setup and configuration

**Success Criteria**:
- Buildkite can trigger on PR events
- Lint job runs successfully
- Team can access Buildkite UI

### Phase 2: Core CI Migration (Week 2-3)

**Objective**: Migrate all main CI jobs to Buildkite

**Tasks**:
1. Add all quality check jobs (lint, PHP lint)
2. Add test jobs (Vitest, Storybook)
3. Add build job (Next.js)
4. Configure artifact uploading
5. Set up CodeCov integration
6. Configure secrets and environment variables
7. Optimize caching strategy

**Success Criteria**:
- All CI jobs from ci.yml working in Buildkite
- Test coverage reports uploading to CodeCov
- Build artifacts properly stored
- Pipeline completes in similar time to GitHub Actions

### Phase 3: E2E Testing Migration (Week 3-4)

**Objective**: Migrate complex E2E testing workflow

**Tasks**:
1. Set up Docker Compose in Buildkite agents
2. Configure GHCR access for pre-built images
3. Migrate E2E test job
4. Test with full Docker stack
5. Configure Playwright artifact storage
6. Verify cleanup procedures

**Success Criteria**:
- E2E tests run successfully in Buildkite
- Pre-built images pull correctly
- Test reports accessible
- No resource leaks (containers cleaned up)

### Phase 4: Docker Image Building (Week 4-5)

**Objective**: Migrate Docker image building workflow

**Tasks**:
1. Create separate image building pipeline
2. Configure GHCR push permissions
3. Set up conditional building (on main branch only)
4. Test image building and pushing
5. Verify image tagging strategy

**Success Criteria**:
- Images build successfully
- Images push to GHCR with correct tags
- Only triggers on main/master branches

### Phase 5: Scheduled Jobs (Week 5)

**Objective**: Migrate scheduled workflows

**Tasks**:
1. Configure scheduled build in Buildkite UI
2. Migrate database sync job
3. Set up weekly schedule (Monday 2 AM UTC)
4. Test manual trigger
5. Verify database sync functionality

**Success Criteria**:
- Scheduled job runs on schedule
- Manual trigger works
- Database sync completes successfully

### Phase 6: Parallel Operation (Week 6-8)

**Objective**: Run both CI systems in parallel for validation

**Tasks**:
1. Keep GitHub Actions workflows active
2. Monitor Buildkite for issues
3. Compare execution times
4. Gather team feedback
5. Document any issues or improvements
6. Fine-tune Buildkite configuration

**Success Criteria**:
- Both systems passing consistently
- Buildkite performance meets or exceeds GitHub Actions
- Team comfortable with Buildkite UI
- All edge cases handled

### Phase 7: Cutover (Week 9)

**Objective**: Make Buildkite primary CI and deprecate GitHub Actions

**Tasks**:
1. Update repository branch protection rules
2. Point required status checks to Buildkite
3. Archive GitHub Actions workflows (move to .github/workflows.archive/)
4. Update documentation (README, CONTRIBUTING)
5. Announce to team
6. Monitor for issues

**Success Criteria**:
- Buildkite is enforced for PR merges
- GitHub Actions workflows disabled
- Documentation updated
- Team using Buildkite successfully

## Required Buildkite Configuration

### Agent Requirements

**Option A: Buildkite Cloud Agents**
- Hosted by Buildkite
- Linux, macOS, or Windows
- Pre-configured environment
- Pay-per-use pricing

**Option B: Self-Hosted Agents**
- Linux servers (Ubuntu 22.04 recommended)
- Docker and Docker Compose installed
- Node.js 22 installed
- PHP 7.4 installed (for PHP linting)
- Minimum 4GB RAM, 2 CPU cores
- 50GB+ disk space for Docker images

### Agent Configuration

```yaml
# /etc/buildkite-agent/buildkite-agent.cfg
tags="queue=default,os=linux,docker=true"
priority=%n
plugins-path="/usr/local/buildkite-plugins"
hooks-path="/etc/buildkite-agent/hooks"
build-path="/var/buildkite-agent/builds"
git-clean-flags="-ffdqx"
git-clone-flags="-v"
```

### Required Secrets

Configure these in Buildkite environment or agent:

```bash
# GitHub Container Registry
GHCR_USERNAME=<github-username>
GHCR_TOKEN=<github-personal-access-token>

# Neon Database URLs
NEON_PROD_DATABASE_URL=<production-database-url>
NEON_DEV_DATABASE_URL=<development-database-url>

# Cloudinary (for E2E tests)
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>

# CodeCov
CODECOV_TOKEN=<codecov-token>
```

## Testing Strategy

### Unit Testing the Pipeline

1. **Lint Job Test**: Verify ESLint catches issues
2. **Test Job Test**: Verify tests run and coverage uploads
3. **Build Job Test**: Verify Next.js builds successfully
4. **E2E Job Test**: Verify full stack testing works
5. **Image Building Test**: Verify Docker images build and push

### Integration Testing

1. Create test PRs with intentional failures
2. Verify proper failure reporting
3. Test artifact downloads
4. Test manual retries
5. Test parallel job execution

### Performance Testing

1. Measure average pipeline execution time
2. Compare to GitHub Actions baseline
3. Identify bottlenecks
4. Optimize caching and parallelization

## Migration Checklist

### Pre-Migration
- [ ] Buildkite account created
- [ ] Agents provisioned and configured
- [ ] Repository webhook configured
- [ ] Secrets configured in Buildkite
- [ ] Team access configured

### During Migration
- [ ] `.buildkite/pipeline.yml` created
- [ ] Lint jobs migrated
- [ ] Test jobs migrated
- [ ] Build job migrated
- [ ] E2E tests migrated
- [ ] Image building migrated
- [ ] Scheduled jobs migrated
- [ ] Documentation updated

### Post-Migration
- [ ] GitHub Actions workflows archived
- [ ] Branch protection updated
- [ ] Team trained on Buildkite
- [ ] Monitoring set up
- [ ] Incident response plan updated

## Rollback Plan

If critical issues arise during migration:

1. **Immediate**: Keep GitHub Actions workflows active during parallel phase
2. **Quick Rollback**: Re-enable GitHub Actions in branch protection
3. **Issue Resolution**: Fix Buildkite issues offline
4. **Re-attempt**: Return to parallel operation phase

### Rollback Triggers

- Pipeline success rate < 95% over 1 week
- Average execution time > 2x GitHub Actions
- Critical bugs blocking development
- Team unable to effectively use Buildkite

## Cost Analysis

### GitHub Actions Current Costs
- Included minutes on public repo: Free (for public repos)
- Additional minute costs: N/A (if private: $0.008/minute Linux)

### Buildkite Costs
- **Cloud Agents**: ~$0.05/minute (varies by region/instance)
- **Self-Hosted**: Infrastructure costs only
  - EC2 t3.medium: ~$30/month
  - EC2 t3.large: ~$60/month
  - Plus storage and bandwidth

### Cost Comparison
- If using self-hosted agents: Potentially lower for high-volume
- If using cloud agents: Potentially higher per minute
- Consider total cost of ownership including maintenance

## Documentation Updates Required

### Files to Update
1. `README.md` - Replace GitHub Actions references with Buildkite
2. `CONTRIBUTING.md` - Update CI information
3. `E2E_TESTING.md` - Update CI runner information
4. New: `docs/BUILDKITE_SETUP.md` - Agent setup guide
5. New: `docs/BUILDKITE_TROUBLESHOOTING.md` - Common issues

### Badge Updates
Replace GitHub Actions status badge with Buildkite badge in README.md:

```markdown
<!-- Old -->
[![CI](https://github.com/ynotradio/site/actions/workflows/ci.yml/badge.svg)](https://github.com/ynotradio/site/actions/workflows/ci.yml)

<!-- New -->
[![Build status](https://badge.buildkite.com/your-org-id.svg)](https://buildkite.com/ynotradio/site)
```

## Success Metrics

### Technical Metrics
- Pipeline success rate: > 95%
- Average execution time: ≤ GitHub Actions baseline
- Test flakiness: < 5%
- Artifact retention: 100% for 7 days

### Team Metrics
- Developer satisfaction: Survey after 1 month
- Time to resolve CI issues: Track and compare
- False positive rate: Monitor and minimize
- Learning curve: Track support requests

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Agent infrastructure issues | High | Medium | Use Buildkite cloud agents initially |
| Longer execution times | Medium | Low | Optimize caching and parallelization |
| Team learning curve | Low | High | Comprehensive documentation and training |
| Docker compatibility | High | Low | Test thoroughly in Phase 3 |
| Secret management issues | High | Low | Careful secret configuration and testing |
| Cost overruns | Medium | Medium | Monitor usage and optimize |

## Timeline Summary

**Total Duration**: 9 weeks

- **Weeks 1**: Foundation setup
- **Weeks 2-3**: Core CI migration
- **Weeks 3-4**: E2E testing migration
- **Weeks 4-5**: Docker image building and scheduled jobs
- **Weeks 6-8**: Parallel operation and validation
- **Week 9**: Cutover and cleanup

## Conclusion

This migration plan provides a structured, phased approach to moving from GitHub Actions to Buildkite. The parallel operation phase ensures we can validate Buildkite thoroughly before fully committing, while the detailed implementation tasks provide clear guidance for execution.

The migration will require coordination across the team but offers potential benefits in pipeline flexibility, visualization, and infrastructure control. Success depends on careful planning, thorough testing, and team buy-in.

## Next Steps

1. Review this plan with the team
2. Get approval for timeline and resources
3. Set up Buildkite account and initial infrastructure
4. Begin Phase 1: Foundation setup

## References

- [Buildkite Documentation](https://buildkite.com/docs)
- [Buildkite Docker Plugin](https://github.com/buildkite-plugins/docker-buildkite-plugin)
- [Buildkite Docker Compose Plugin](https://github.com/buildkite-plugins/docker-compose-buildkite-plugin)
- [Migrating from GitHub Actions](https://buildkite.com/docs/tutorials/github-actions-migration)
