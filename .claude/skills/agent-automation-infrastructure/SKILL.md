---
name: agent-automation-infrastructure
description: Current state of CI/CD automation infrastructure, pre-built Docker images, and performance optimization strategies. Use when dealing with slow builds, container timeouts, yarn install issues, or when you need to understand available pre-built images and automation tooling.
---

# Agent Automation Infrastructure

## Bootstrap: Run This First (Every Session)

```bash
source bin/agent-helpers/bootstrap.sh
```

**Why**: The coding-agent sandbox clones the repo but does NOT run `yarn install`. Without `node_modules`, commands like `yarn lint`, `yarn test`, and `yarn test:e2e` fail with "command not found". The script also checks the Node.js version and activates `nvm` if the version is wrong — **use `source`, not `bash`**, so the Node.js switch takes effect in your current shell session.

**If the script emits a `❌ BLOCKER` message**, stop immediately and report the blocker. Do not continue investigating.

**Timing** (measured on GitHub-hosted runner, March 2026):

| Cache state | Time |
|-------------|------|
| Warm (runner reused / cache populated) | **~12 seconds** |
| Cold (brand-new runner, no cache) | ~2–3 minutes |

The runner's Yarn cache (`~/.cache/yarn`, ~4 GB) persists across jobs on the same runner instance, so most sessions get the fast path.

## Available Tools After Bootstrap

| Command | Tool | Notes |
|---------|------|-------|
| `yarn lint` | ESLint | Project config in `.eslintrc.json`, max-warnings=0 |
| `yarn test` | Vitest | Unit + integration tests |
| `yarn test:e2e` | Playwright | Requires services (see below) |
| `yarn build` | Next.js | Needs DATABASE_URI |
| `node_modules/.bin/tsc --noEmit` | TypeScript | Type-check only |

## Screenshot Requirements by Agent Type

| Agent | Environment | Screenshot required? |
|-------|-------------|---------------------|
| Interactive Copilot agent (issue/PR response) | GitHub-hosted runner, Docker + Playwright available | **Yes** — always for UI/API changes |
| code-simplifier workflow | `node:lts-alpine`, no Docker | **No** — code-only, mark as N/A |
| test-coverage-improver workflow | `node:lts-alpine`, no Docker | **No** — test-only, mark as N/A |
| code-refactoring workflow | `node:lts-alpine`, no Docker | **No** — code-only, mark as N/A |

For interactive agents: `docker compose up -d` (legacy PHP) uses local builds and **always works** without GHCR auth. Use it to get `http://localhost:8080` for screenshots. Payload screenshots require either the GHCR seeded image or the public-image fallback below.

## Pre-built Docker Images

Four pre-built images are available at GHCR for running services:

| Image | Purpose | ~Size |
|-------|---------|-------|
| `ghcr.io/ynotradio/site/payload-dev:latest` | Next.js + Payload CMS | ~800 MB |
| `ghcr.io/ynotradio/site/phpfpm-dev:latest` | PHP-FPM + extensions | ~450 MB |
| `ghcr.io/ynotradio/site/postgres-seeded:latest` | PostgreSQL 16 + seed data | ~400 MB |
| `ghcr.io/ynotradio/site/playwright:latest` | Playwright + browsers | ~1.2 GB |

These are for **running services** (E2E tests, local dev), not for bootstrapping node_modules — `yarn install` from cache is just as fast and avoids authentication complexity.

### Accessing GHCR from the Agent Sandbox

The packages are **private**. The agent has a `GITHUB_TOKEN` in the environment, but it must be used to log in before pulling:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "x-access-token" --password-stdin
docker pull ghcr.io/ynotradio/site/postgres-seeded:latest
```

This works when the running workflow's `GITHUB_TOKEN` has `packages: read` permission. As of March 2026, all three automated agent workflows (`.github/workflows/*.lock.yml`) include `packages: read` in the `agent` job. **The interactive Copilot coding agent** (responding to issues/PRs) runs under a different token that may not have this permission — if `docker pull` still fails with "denied" after login, fall back to the manual workaround below.

> **Key distinction**: `docker compose up -d` (legacy PHP stack) builds from **local Dockerfiles** — no GHCR auth needed, always works. GHCR auth is only required for the pre-built Payload/Playwright images.

### Fallback When GHCR Is Inaccessible

If `docker pull ghcr.io/…` returns "denied", use public images and seed manually:

```bash
# Start a plain Postgres (public image — no auth needed)
docker run -d --name pg-dev \
  -e POSTGRES_DB=ynot_payload_dev \
  -e POSTGRES_USER=ynot_postgres_user \
  -e POSTGRES_PASSWORD=dev_postgres_password_not_secret \
  -p 5432:5432 postgres:16-alpine

# Create a minimal .env.local
cat > .env.local << 'EOF'
PAYLOAD_SECRET=dev-secret-not-for-production
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
PORT=3000
PAYLOAD_DEV_EMAIL=admin@ynotradio.net
PAYLOAD_DEV_PASSWORD=password
DATABASE_URI=postgres://ynot_postgres_user:dev_postgres_password_not_secret@localhost:5432/ynot_payload_dev
DATABASE_SSL=disable
PAYLOAD_CORS=http://localhost:3000
PAYLOAD_CSRF=http://localhost:3000
EOF

# Run migrations + seed
yarn payload:migrate
yarn seed:payload

# Start Payload dev server
yarn payload:dev
```

## Do We Need a Container Just for Lint/Test?

**Short answer: No.**

The question was whether to add a dedicated container that agents can use to run lint/test without needing local node_modules. The answer is no, because:

1. `yarn install --frozen-lockfile` takes 12s from cache — as fast as pulling a container
2. Docker IS available in the agent sandbox (Docker 28.0.4)
3. A hypothetical "agent-tools" container would require auth setup and introduce complexity
4. The bootstrap script (`bin/agent-helpers/bootstrap.sh`) solves the problem directly

## MCP Services Assessment

### Services in `.vscode/mcp.json` (VS Code only)

These MCP servers are configured for **VS Code users**, not for GitHub Copilot coding agents. The coding agent runs its own separate MCP setup via the `copilot-developer-action` machinery and does not read `.vscode/mcp.json`.

| Server | Package | Verdict |
|--------|---------|---------|
| `mcp_server_mysql` | `@benborla29/mcp-server-mysql` | ✅ Useful for VS Code users querying legacy MySQL interactively. No impact on coding agents. |
| `chrome-devtools` | `@modelcontextprotocol/server-chrome-devtools` | ⚠️ Redundant for VS Code users who already have Playwright. Has no impact on coding agents. Consider removing to reduce clutter. |

### Tools Available TO the Coding Agent

These are the MCP tools wired into the coding-agent session itself:

| Tool category | Usefulness | Notes |
|--------------|-----------|-------|
| `playwright-browser_*` | ✅ High | Navigate, screenshot, interact with running pages. Essential for UI verification. |
| `github-mcp-server-*` | ✅ High | GitHub API — list runs, read logs, search code, inspect PRs. Replaces many `gh` CLI needs. |
| `bash` / `read_bash` / `write_bash` | ✅ Essential | Run any command. Primary workhorse. |
| `web_search` / `web_fetch` | ✅ Useful | Documentation lookup, package research. |
| `code_review` | ✅ Useful | Automated review before finalising a PR. |
| `codeql_checker` | ✅ Useful | Security scan after code changes. |
| `search_code_subagent` / `task` | ✅ Useful | Semantic code exploration without grep-thrashing. |
| `sequential-thinking` | 🟡 Marginal | Helpful for complex multi-step reasoning; rarely needed. |
| `store_memory` | ✅ Useful | Persist facts across sessions. |

**Nothing is missing** from the coding-agent toolset. The only previous gap was the missing `node_modules` bootstrap, now fixed.

## CI/CD: Buildkite Pipeline

All lint/test/E2E steps run inside Docker containers in Buildkite. They always do `corepack enable && yarn install --immutable` themselves — the bootstrap issue only affects interactive coding-agent sandbox sessions, not CI.

```yaml
# Every Buildkite step that needs Node.js:
command: "corepack enable && yarn install --immutable && yarn lint"
plugins:
  - docker#v5.11.0:
      image: "node:22-slim"
```

## Performance Reference

| Operation | Time | Context |
|-----------|------|---------|
| `yarn install` warm cache | **12s** | GitHub-hosted runner, cache populated |
| `yarn install` cold | ~2–3 min | Fresh runner, downloading packages |
| `yarn lint` | ~6s | After install |
| `yarn test` | ~30s | After install |
| Postgres startup (seeded image) | ~10s | With pre-built image |
| Payload dev server startup | ~2–4 min | First compile (Next.js) |

Stop and report if:
- `yarn install` takes more than 5 minutes
- Container startup exceeds 3 minutes

## Usage

### Standard Agent Workflow

```bash
# 1. Bootstrap (once at session start — use source, not bash)
source bin/agent-helpers/bootstrap.sh

# 2. Make code changes

# 3. Validate before pushing
yarn lint    # must exit 0
yarn test    # must exit 0

# 4. E2E (only if you changed UI/API — requires services running)
docker compose -f docker-compose.e2e.yml up -d
yarn test:e2e
```

### Running E2E Tests Locally

```bash
docker compose up -d          # mysql + postgres + phpfpm + apache
yarn payload:dev &             # payload on :3000
yarn seed:payload
yarn seed:legacy
yarn test:e2e
```

