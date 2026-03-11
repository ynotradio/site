---
name: detecting-agent-environment
description: Utilities and patterns for detecting execution environment (CI/CD vs local, network access, available ports, timeouts). Use when you need to adapt scripts or workflows based on where the agent is running, when creating helper scripts that need environment-aware behavior, when writing Buildkite pipeline steps, or when debugging CI vs local behavior differences. Also use when setting timeouts for Docker, yarn install, or service health checks.
---

# Agent Environment Detection

Shell utilities in `bin/agent-helpers/detect-environment.sh` for adapting agent scripts to different execution environments. This project uses **Buildkite** for CI/CD.

## Quick Start

```bash
source bin/agent-helpers/detect-environment.sh
print_environment
# Output:
# 🔍 Environment Detection:
#    📍 Environment: Local Development
#    🌐 Network: Available
#    🐳 Docker: Available
```

## API Reference

Source the script first: `source bin/agent-helpers/detect-environment.sh`

### `detect_ci`

Returns 0 (true) if running in any CI/CD environment. Checks `$CI`, `$BUILDKITE`, `$GITHUB_ACTIONS`, `$GITLAB_CI`, `$CIRCLECI`.

```bash
if detect_ci; then
  echo "In CI — use stricter timeouts and pre-built images"
else
  echo "Local dev — more lenient timeouts"
fi
```

### `detect_ci_provider`

Prints the name of the active CI provider. Returns empty string if running locally.

| Environment Variable | Output |
|---------------------|--------|
| `$BUILDKITE` | `buildkite` |
| `$GITHUB_ACTIONS` | `github-actions` |
| `$GITLAB_CI` | `gitlab` |
| `$CIRCLECI` | `circleci` |
| `$CI` (only) | `unknown-ci` |
| None | `` (empty) |

```bash
provider=$(detect_ci_provider)
if [ "$provider" = "buildkite" ]; then
  # Use Buildkite-specific features like annotations
  buildkite-agent annotate "Deploy starting" --style info
fi
```

### `detect_network`

Returns 0 (true) if `registry.npmjs.org` is reachable (5s timeout). Use to guard package installs or external API calls.

```bash
if ! detect_network; then
  echo "No network — use cached dependencies or pre-built images"
  exit 1
fi
```

### `detect_port_available <port>`

Returns 0 (true) if the given port is free. Uses `lsof`.

```bash
if detect_port_available 3000; then
  yarn payload:dev
else
  echo "Port 3000 in use — Payload may already be running"
fi
```

### `detect_docker`

Returns 0 (true) if Docker is installed AND the daemon is running.

```bash
if ! detect_docker; then
  echo "Docker unavailable — cannot run legacy PHP site or seeded databases"
  exit 1
fi
```

### `get_timeout <operation>`

Prints a recommended timeout in seconds. CI gets stricter values; local gets lenient ones.

| Operation | CI Timeout | Local Timeout |
|-----------|-----------|---------------|
| `container_start` | 120s | 180s |
| `npm_install` | 180s | 300s |
| `service_ready` | 240s | 360s |
| (anything else) | 60s | 120s |

```bash
TIMEOUT=$(get_timeout "service_ready")
timeout "$TIMEOUT" bash -c 'until curl -sf http://localhost:3000/admin; do sleep 5; done'
```

### `print_environment`

Prints a human-readable summary of the current environment (CI provider, network, Docker status).

## Creating New Helper Scripts

When adding scripts to `bin/agent-helpers/`:

```bash
#!/bin/bash
# 1. Source environment detection from the same directory
source "$(dirname "$0")/detect-environment.sh"
print_environment

# 2. Guard on requirements
detect_docker || { echo "❌ Docker required"; exit 1; }

# 3. Use environment-aware timeouts
TIMEOUT=$(get_timeout "container_start")
timeout "$TIMEOUT" docker compose up -d

# 4. Use clear status output
echo "✅ Services started"

# 5. Log verbose output to tmp/ (gitignored)
mkdir -p tmp
docker compose logs 2>&1 > tmp/docker-startup.log
```

## Performance Baselines

Scripts should respect these thresholds. Report in the PR if you exceed "Warning":

| Operation | Expected | Warning | Failure |
|-----------|----------|---------|---------|
| Container start | < 60s | 60–120s | > 120s |
| yarn install | < 120s | 120–300s | > 300s |
| Service ready | < 180s | 180–360s | > 360s |

When hitting failures, consider pre-built images:
```bash
docker pull ghcr.io/ynotradio/site/postgres-seeded:latest
docker pull ghcr.io/ynotradio/site/payload-dev:latest
```

## Related Skills

- `agent-automation-infrastructure` — Pre-built images and CI pipeline details
- `testing-pr-changes` — Success criteria and proof-of-functionality requirements
