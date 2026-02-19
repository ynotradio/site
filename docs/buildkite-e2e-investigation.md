# Buildkite E2E Testing Investigation

**Status:** Blocked  
**Date:** 2026-02-19  
**Builds:** 50-105  
**Branch:** `copilot/migrate-ci-to-buildkite`

## Summary

After 55+ builds attempting to get Playwright E2E tests running in Buildkite, we've hit a fundamental networking limitation with Docker-in-Docker (DinD) environments. Chromium browser cannot reach Docker container IPs from within the Buildkite managed agents.

## Root Cause

Buildkite managed agents with `docker: "true"` tag run in a Docker-in-Docker environment:

- The build runs inside a container
- Docker commands create "inner" containers on a nested Docker daemon
- Port mappings (e.g., `3000:3000`) only work on the inner daemon's host
- **Chromium has additional network isolation** that prevents reaching container IPs

This differs from GitHub Actions where:

- Playwright runs directly on the VM host
- Docker services expose ports to the VM's localhost
- Playwright accesses services via `localhost:3000`

## Approaches Tried

### 1. Basic Docker Compose (Builds 50-70)

```yaml
plugins:
  - docker-compose#v5.7.0:
      run: playwright
      dependencies: true
```

**Result:** `ERR_NAME_NOT_RESOLVED` - Chromium couldn't resolve Docker DNS names

### 2. DNS Resolution via Container IP (Builds 71-85)

```bash
PAYLOAD_IP=$(getent hosts payload | awk '{print $1}')
PLAYWRIGHT_BASE_URL=http://$PAYLOAD_IP:3000
```

**Result:** `ERR_ADDRESS_UNREACHABLE` - IP resolved but Chromium couldn't connect

### 3. Chromium Network Flags (Builds 86-95)

```typescript
// playwright.config.ts
args: [
  '--no-sandbox',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process',
];
```

**Result:** Still `ERR_ADDRESS_UNREACHABLE` - flags didn't help

### 4. Host Network Mode (Builds 96-100)

```yaml
# docker-compose.e2e.yml
services:
  payload:
    network_mode: host
```

**Result:** Conflicts with other containers, broke service discovery

### 5. Service Ports Plugin Option (Build 101)

```yaml
plugins:
  - docker-compose#v5.7.0:
      service-ports: true
```

**Result:** Ports still not accessible from Chromium in container

### 6. Running Playwright on Host (Builds 104-105)

```yaml
commands:
  - docker compose up -d --wait
  - npm install --legacy-peer-deps
  - npx playwright install chromium --with-deps
  - npx playwright test
```

**Result:** `ERR_CONNECTION_REFUSED` - localhost doesn't reach inner Docker containers

### 7. Database Seeding Fixes (Builds 98-103)

- Added `DATABASE_URI` override for Docker networking
- Fixed seed step in Payload container startup
- Added `SKIP_PAYLOAD_SEED=true` for Playwright global-setup

**Result:** Seeding worked, but networking still blocked

## What Works

| Component                 | Status |
| ------------------------- | ------ |
| Docker services start     | ✅     |
| Health checks pass        | ✅     |
| curl from containers      | ✅     |
| Database seeding          | ✅     |
| Payload CMS responds      | ✅     |
| Chromium reaches services | ❌     |

## Diagnostic Evidence

### curl Works (from container)

```
curl http://172.18.0.3:3000/admin
# Returns HTML successfully
```

### Chromium Fails (same IP)

```
Error: page.goto: net::ERR_ADDRESS_UNREACHABLE at http://172.18.0.3:3000/admin
```

## Potential Solutions (Not Yet Tried)

### 1. Non-DinD Agents

Use Buildkite agents without Docker-in-Docker:

- Self-hosted agents with Docker installed natively
- AWS/GCP VMs running Buildkite agent directly

### 2. Buildkite Test Engine

Use Buildkite's test analytics with external test runner:

- Run tests in GitHub Actions
- Report results to Buildkite

### 3. SSH Tunnel / Port Forwarding

Create SSH tunnel from build container to inner Docker network:

```bash
ssh -L 3000:payload:3000 localhost
```

### 4. Different Service Architecture

- Run Payload outside Docker (Node.js on host)
- Use hosted database (not Docker)

### 5. Playwright in Same Network Namespace

```yaml
services:
  playwright:
    network_mode: 'service:payload'
```

Run Playwright in same network namespace as Payload.

## Files Modified

- `.buildkite/pipeline.yml` - Pipeline configuration
- `.buildkite/hooks/pre-command` - GHCR login
- `docker-compose.e2e.yml` - E2E service definitions
- `playwright.config.ts` - Browser configuration
- `e2e/utils/payload-auth.ts` - Login helper

## Recommendation

1. **Land the passing CI steps** (ESLint, Vitest, PHPUnit, Storybook) in main Buildkite pipeline
2. **Keep E2E in GitHub Actions** until DinD networking is solved
3. **Investigate self-hosted agents** if Buildkite E2E is required

## References

- [Buildkite Docker Compose Plugin](https://github.com/buildkite-plugins/docker-compose-buildkite-plugin)
- [Docker-in-Docker Networking Limitations](https://devops.stackexchange.com/a/14892)
- [Playwright Docker Troubleshooting](https://playwright.dev/docs/docker)
