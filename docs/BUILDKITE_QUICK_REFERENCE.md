# GitHub Actions to Buildkite: Quick Reference

This document provides a side-by-side comparison of GitHub Actions and Buildkite configurations for common CI/CD patterns in the Y-Not Radio site.

## Basic Job Structure

### GitHub Actions
```yaml
jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '22'
      - run: yarn install
      - run: yarn lint
```

### Buildkite
```yaml
steps:
  - label: ":eslint: Lint"
    key: "lint"
    command: |
      yarn install
      yarn lint
    plugins:
      - docker#v5.11.0:
          image: "node:22"
    agents:
      queue: "default"
```

## Parallel Jobs

### GitHub Actions
```yaml
jobs:
  lint:
    # Job 1
  test:
    # Job 2 (runs in parallel with lint by default)
```

### Buildkite
```yaml
steps:
  - group: "Quality Checks"
    steps:
      - label: "Lint"    # Job 1
      - label: "Test"    # Job 2 (parallel)
```

## Job Dependencies

### GitHub Actions
```yaml
jobs:
  test:
    # Runs first
  build:
    needs: test  # Waits for test to complete
```

### Buildkite
```yaml
steps:
  - label: "Test"
    key: "test"
  - label: "Build"
    depends_on: "test"  # Waits for test to complete
```

## Docker Usage

### GitHub Actions
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: node:22
    steps:
      - run: yarn test
```

### Buildkite
```yaml
steps:
  - label: "Test"
    command: yarn test
    plugins:
      - docker#v5.11.0:
          image: "node:22"
```

## Environment Variables

### GitHub Actions
```yaml
jobs:
  test:
    env:
      NODE_ENV: test
      API_KEY: ${{ secrets.API_KEY }}
    steps:
      - run: yarn test
```

### Buildkite
```yaml
steps:
  - label: "Test"
    command: yarn test
    env:
      NODE_ENV: "test"
      API_KEY: "${API_KEY}"  # Set in Buildkite UI
```

## Caching

### GitHub Actions
```yaml
- uses: actions/cache@v5
  with:
    path: ~/.cache
    key: ${{ runner.os }}-cache-${{ hashFiles('**/lockfile') }}
```

### Buildkite
```yaml
# Caching handled by agents or plugins
plugins:
  - cache#v2.4.10:
      paths:
        - ~/.cache
      key: "v1-cache-{{ checksum 'lockfile' }}"
```

## Artifacts

### GitHub Actions
```yaml
- uses: actions/upload-artifact@v6
  with:
    name: test-results
    path: ./results/
```

### Buildkite
```yaml
steps:
  - label: "Test"
    command: yarn test
    artifact_paths:
      - "results/**/*"
```

## Conditional Execution

### GitHub Actions
```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    steps:
      - run: ./deploy.sh
```

### Buildkite
```yaml
steps:
  - label: "Deploy"
    command: ./deploy.sh
    branches: "main"
    # or
    if: build.branch == "main"
```

## Timeouts

### GitHub Actions
```yaml
jobs:
  test:
    timeout-minutes: 30
```

### Buildkite
```yaml
steps:
  - label: "Test"
    timeout_in_minutes: 30
```

## Scheduled Jobs

### GitHub Actions
```yaml
on:
  schedule:
    - cron: '0 2 * * 1'  # Monday 2 AM
```

### Buildkite
```yaml
# Configure in Buildkite UI:
# Pipeline → Settings → Build Schedules
# Cron: 0 2 * * 1
# Branch: main
```

## Matrix Builds

### GitHub Actions
```yaml
strategy:
  matrix:
    node: [18, 20, 22]
steps:
  - uses: actions/setup-node@v6
    with:
      node-version: ${{ matrix.node }}
```

### Buildkite
```yaml
steps:
  - label: "Test Node {{matrix}}"
    command: yarn test
    matrix:
      - "18"
      - "20"
      - "22"
    plugins:
      - docker#v5.11.0:
          image: "node:{{matrix}}"
```

## Service Containers

### GitHub Actions
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
```

### Buildkite
```yaml
# Use docker-compose plugin
plugins:
  - docker-compose#v4.16.0:
      run: app
      config: docker-compose.yml
```

## Complete Workflow Comparison

### GitHub Actions: ci.yml
```yaml
name: CI
on:
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '22'
      - run: yarn install
      - run: yarn lint
  
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '22'
      - run: yarn install
      - run: yarn test
  
  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '22'
      - run: yarn install
      - run: yarn build
```

### Buildkite: pipeline.yml
```yaml
steps:
  - group: "Quality"
    key: "quality"
    steps:
      - label: "Lint"
        key: "lint"
        command: |
          yarn install
          yarn lint
        plugins:
          - docker#v5.11.0:
              image: "node:22"
      
      - label: "Test"
        key: "test"
        command: |
          yarn install
          yarn test
        plugins:
          - docker#v5.11.0:
              image: "node:22"
  
  - label: "Build"
    depends_on: "quality"
    command: |
      yarn install
      yarn build
    plugins:
      - docker#v5.11.0:
          image: "node:22"
```

## Key Differences

| Feature | GitHub Actions | Buildkite |
|---------|----------------|-----------|
| **Checkout** | Explicit `actions/checkout@v6` | Automatic by agent |
| **Environment Setup** | `actions/setup-*` actions | Docker images or agent pre-installed |
| **Parallel Jobs** | Separate `jobs:` entries | `group:` with multiple steps |
| **Dependencies** | `needs:` keyword | `depends_on:` keyword |
| **Secrets** | `${{ secrets.NAME }}` | `${NAME}` (configured in UI) |
| **Conditionals** | `if:` with expressions | `if:` or `branches:` |
| **Artifacts** | `actions/upload-artifact` | `artifact_paths:` |
| **Caching** | `actions/cache` | Plugins or agent-level |
| **Matrix** | `strategy.matrix` | `matrix:` on step |

## Common Gotchas

### 1. No Automatic Checkout
**GitHub Actions**: Repository is checked out automatically with `actions/checkout`
**Buildkite**: Agent checks out automatically, no action needed

### 2. Environment Variable Syntax
**GitHub Actions**: `${{ secrets.NAME }}`
**Buildkite**: `${NAME}` or `$$NAME` (double $ in YAML)

### 3. Parallel by Default
**GitHub Actions**: Jobs run in parallel unless `needs:` is specified
**Buildkite**: Steps run sequentially unless in a `group:` or explicitly parallel

### 4. Docker Volumes
**GitHub Actions**: Working directory automatically available
**Buildkite**: Must explicitly mount volumes in docker plugin:
```yaml
plugins:
  - docker#v5.11.0:
      volumes:
        - ".:/app"
      workdir: "/app"
```

### 5. Branch Filters
**GitHub Actions**: Configured in `on:` trigger
**Buildkite**: Use `branches:` on individual steps

## Migration Checklist

When converting a GitHub Actions workflow to Buildkite:

- [ ] Remove `actions/checkout` steps (automatic in Buildkite)
- [ ] Convert `actions/setup-*` to Docker images
- [ ] Change `runs-on:` to `agents:` with appropriate tags
- [ ] Replace `needs:` with `depends_on:` and add `key:` to steps
- [ ] Update secret syntax from `${{ secrets.X }}` to `${X}`
- [ ] Convert `actions/upload-artifact` to `artifact_paths:`
- [ ] Move caching to plugins or rely on agent caching
- [ ] Configure scheduled jobs in Buildkite UI (not in YAML)
- [ ] Add explicit Docker volumes if using docker plugin
- [ ] Test that environment variables are properly passed

## Additional Resources

- [Buildkite Migration Guide](https://buildkite.com/docs/tutorials/github-actions-migration)
- [Buildkite Pipeline YAML Reference](https://buildkite.com/docs/pipelines/defining-steps)
- [Buildkite Docker Plugin](https://github.com/buildkite-plugins/docker-buildkite-plugin)
- [Y-Not Radio Migration Plan](./BUILDKITE_MIGRATION_PLAN.md)
