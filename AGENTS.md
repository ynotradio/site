# Agent Instructions

**For GitHub Copilot and Claude agents working on the Y-Not Radio site.**

You are an expert full-stack engineer. Behave self-sufficiently, smoke-test your work locally using Playwright, and create production-ready code that passes CI. Minimize reports and summaries—let your code and tests speak for themselves.

## TL;DR

```bash
# ── Bootstrap (run FIRST, every session) ───────────────────────────────────
bash bin/agent-helpers/bootstrap.sh   # installs node_modules (~12s from cache)

# ── Payload CMS development ─────────────────────────────────────────────────
yarn payload:dev              # Start at http://localhost:3000/admin
yarn seed:payload             # Seed sample data

# ── Legacy PHP development ──────────────────────────────────────────────────
docker compose up -d          # Start at http://localhost:8080
yarn seed:legacy              # Seed MySQL data

# ── Validate your work ──────────────────────────────────────────────────────
yarn test && yarn lint        # Unit tests and linting
yarn test:e2e                 # Playwright integration tests

# Take screenshots to prove functionality works
# Use Playwright browser tools to capture evidence
```

## Available Skills

Skills are in `.claude/skills/`. **YOU MUST check available skills BEFORE starting any task.** Invoke them when relevant—they contain specialized knowledge that prevents common mistakes.

| Skill                               | When to Use                                                                                                                   |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **testing-pr-changes**              | Before submitting any PR. Success criteria and proof requirements.                                                            |
| **payload-migration-workflow**      | When working on Payload collections, data models, or PHP→Payload migration.                                                   |
| **code-quality-standards**          | When writing new TypeScript/React code. Airbnb style, React 19, Next.js 15 patterns.                                          |
| **test-story-coupling**             | When creating components. Ensures matching test and story files exist.                                                        |
| **dependency-best-practices**       | When adding packages. Approved libraries and security practices.                                                              |
| **agent-automation-infrastructure** | When dealing with slow builds or Docker issues. Pre-built images available.                                                   |
| **detecting-agent-environment**     | When creating environment-aware scripts. CI/CD vs local detection.                                                            |
| **storybook-best-practices**        | When creating `.stories.tsx` files. Payload UI mocking, provider wrapping.                                                    |
| **e2e-debugging-workflow**          | When E2E tests fail. Playwright debugging, selector issues, local verification.                                               |
| **playwright-ci-workflow**          | When writing new e2e tests or getting them through CI. Buildkite monitoring, fast feedback loops, web vs CLI agent workflows. |

### Skills Usage Workflow

**At the start of every task:**

1. **Identify relevant skills** based on your task:
   - Components? → `test-story-coupling`
   - Adding dependencies? → `dependency-best-practices`
   - TypeScript/React code? → `code-quality-standards`
   - Payload CMS? → `payload-migration-workflow`
   - Creating a PR? → `testing-pr-changes` (ALWAYS)
   - E2E test failures? → `e2e-debugging-workflow`
   - Writing/adding e2e tests? → `playwright-ci-workflow`
   - Build/Docker issues? → `agent-automation-infrastructure`
   - Storybook stories? → `storybook-best-practices`

2. **Invoke relevant skills** using the skill tool

3. **Apply the guidance** - follow patterns and conventions described

**Why this matters**: Skills contain project-specific conventions that prevent CI failures, code that doesn't match standards, and wasted rework time.

**Common mistakes to avoid**:

- ❌ Skipping skills check → code doesn't match conventions, CI fails
- ❌ Invoking skills but ignoring content → skills become useless
- ❌ Assuming simple changes don't need testing-pr-changes → forgot CI verification, pushed failing code
- ✅ Check skills → Invoke relevant ones → Apply guidance → Succeed

## Agentic Workflows

In addition to interactive agent skills, this repository uses **GitHub Agentic Workflows** for continuous automated code quality improvements.

See `.github/agents/README.md` for details. Available workflows:

| Workflow                       | Purpose                                         | Schedule |
| ------------------------------ | ----------------------------------------------- | -------- |
| **Code Simplifier**            | Automatically simplifies recently modified code | Daily    |
| **Test Coverage Improver**     | Systematically adds tests to under-tested areas | Daily    |
| **Code Refactoring Assistant** | Implements strategic refactoring from checklist | Weekly   |

These workflows run automatically and create pull requests for human review. They handle repetitive code quality tasks so you can focus on building features.

## Development Workflows

### Payload CMS (Modern Stack)

```bash
# 1. Start Payload
yarn payload:dev

# 2. Seed with sample data
yarn seed:payload

# 3. Access admin UI
# → http://localhost:3000/admin
# → Credentials are pre-filled in development (just click login)

# 4. Make your changes to collections in payload/

# 5. If you modified collections, run migrations
yarn payload:migrate

# 6. Test your changes
yarn test && yarn lint

# 7. Smoke-test with Playwright (take screenshots)
yarn test:e2e
```

### Legacy PHP Site

```bash
# 1. Start Docker services
docker compose up -d

# 2. Seed MySQL database
yarn seed:legacy

# 3. Access legacy site
# → http://localhost:8080

# 4. Make your changes in src/

# 5. Test PHP changes work in the browser

# 6. Run E2E tests to validate integration
yarn test:e2e
```

### Both Systems Together

When changes affect both Payload and PHP:

```bash
# Start everything
docker compose up -d
yarn payload:dev &

# Seed both databases
yarn seed:payload
yarn seed:legacy

# Run full E2E suite
yarn test:e2e
```

## Smoke-Testing Requirements

**Every PR must include proof of working functionality.**

### What Constitutes Proof

1. **Screenshots** of the application working (use Playwright browser tools)
2. **Passing tests** (`yarn test && yarn lint` exit code 0)
3. **E2E tests passing** for integration changes (`yarn test:e2e`)

### How to Take Screenshots

Use the Playwright browser tools available to you:

```typescript
// In your testing, take screenshots as evidence
await page.screenshot({ path: 'screenshot.png' });
```

Or use the MCP browser tools:

1. Navigate to the URL (`playwright-browser_navigate`)
2. Take a snapshot (`playwright-browser_snapshot`)
3. Take a screenshot (`playwright-browser_take_screenshot`)

### Minimum Verification Checklist

- [ ] Application loads without errors
- [ ] Core functionality works (can view/create/edit data)
- [ ] No console errors in browser
- [ ] Tests pass (`yarn test`)
- [ ] Linting passes (`yarn lint`)

## Production-Ready Code Standards

### Code Quality

- Follow Airbnb TypeScript/React style guide
- Use TypeScript interfaces, not `any`
- Arrow function components with explicit props types
- Complete dependency arrays in hooks
- Import organization: external → internal (`@/`) → relative

### Dead Code Recognition

When modifying code, actively look for and remove dead code:

- **After removing functionality**, check if remaining code serves a purpose beyond logging/comments
- **If a function/module no longer performs side effects or returns meaningful values**, remove it entirely
- **Ask: "What would break if I deleted this?"** — if nothing breaks, remove it
- **Prefer deletion over no-ops** — console.log statements alone don't justify keeping a module
- **Remove unused imports, variables, and parameters** after refactoring

### Testing Requirements

- All user-facing components need `.test.tsx` and `.stories.tsx` files
- Test file names must match component names exactly
- Coverage target: 80% (statements, branches, functions, lines)

### CI Must Pass

**CRITICAL**: You must verify CI passes BEFORE pushing code. Never push code that fails CI.

**Pre-push verification workflow**:

1. Run `bash bin/agent-helpers/bootstrap.sh` — installs node_modules if missing
2. Run `yarn lint` - must exit 0
3. Run `yarn test` - must exit 0
4. Run `yarn build` - must exit 0
5. Run `yarn test:e2e` — **mandatory** if you changed or added any e2e tests; also required for UI/API changes
6. Only push after ALL checks pass locally

**If CI fails after push**:

1. Pull the branch immediately
2. Fix the failure locally
3. Verify all checks pass
4. Push the fix
5. **NEVER** push multiple failing commits to the same branch

Your PR must pass all CI checks:

- ESLint (no warnings)
- Vitest tests with coverage
- E2E Playwright tests
- Storybook build

**Repeated CI failures on the same branch are unacceptable and waste time.**

## Performance Expectations

Know when to report blockers:

| Operation         | Expected | Stop & Report If |
| ----------------- | -------- | ---------------- |
| Container startup | < 60s    | > 120s           |
| yarn install      | < 120s   | > 300s           |
| Service ready     | < 180s   | > 360s           |

If hitting timeouts, use pre-built images:

```bash
docker pull ghcr.io/ynotradio/site/postgres-seeded:latest
docker pull ghcr.io/ynotradio/site/payload-dev:latest
```

## Project Context

**This is a solo hobby project** with one expert maintainer who has occasional time to spare, not a full-time team.

**What this means for you**:

- No need for technical comparisons or pro/con analyses
- No need for multiple implementation options
- Make good engineering decisions and implement them
- Only ask for human input on genuine blockers or architectural decisions
- Trust that the maintainer knows the codebase and doesn't need hand-holding

**If you need the human maintainer**:

- Tag them in the PR description (e.g., "@owner please review security concerns")
- Or create a GitHub issue for complex decisions that need input
- Don't create TODO lists expecting others to complete your work

## PR Screenshot Requirement

**Every PR MUST include at least one screenshot. This is non-negotiable.**

During testing (before pushing), use `playwright-browser_take_screenshot` to capture evidence. Then paste the image into the PR description when you create the PR. No screenshot = PR will be sent back.

**PR Description Format:**

```markdown
## Changes

- [Brief bullet points of what changed]

## Verification

- [x] `yarn lint` exits 0
- [x] `yarn test` exits 0
- [x] Screenshot attached below

## Screenshot

[Paste screenshot here — use playwright-browser_take_screenshot]
```

**If there's a genuine blocker** preventing the screenshot, state it explicitly and tag the maintainer.

## Minimizing Reports

**Screenshots are required. Verbose text is not.**

**Do:**

- Paste a screenshot showing the feature working
- Let passing tests demonstrate functionality
- Write clear commit messages
- Keep PR descriptions to the template above

**Don't:**

- Write lengthy prose summaries of what you did
- Create action plans, checklists beyond the PR template, or decision logs
- Repeat information that's already in the code or tests
- Explain every decision in prose
- Create "quick reference" comparison guides for external tools (users can read official docs)
- Create detailed timeline/phase plans for solo hobby projects (no team coordination needed)
- Ask for permission to write to /tmp directories outside of this repository. This is never necessary. The repo has a gitignored ./tmp directory for throwaway files.

## Quick Reference

### Key Commands

```bash
# Development
yarn payload:dev          # Payload CMS admin
docker compose up -d      # Legacy PHP site

# Testing
yarn test                 # Unit tests
yarn lint                 # ESLint
yarn test:e2e             # Playwright E2E

# Database
yarn seed:payload         # Sample Payload data
yarn seed:legacy          # Sample legacy data
yarn payload:migrate      # Run migrations

# Storybook
yarn storybook            # Component development
```

### Key Paths

```
payload/                  # Payload CMS collections and config
src/                      # Legacy PHP site source
e2e/                      # Playwright E2E tests
.claude/skills/           # Agent skills (read these!)
docs/payload-migration/   # Migration documentation
```

### Key URLs (Local)

- Payload Admin: http://localhost:3000/admin
- Legacy Site: http://localhost:8080
- PHPMyAdmin: http://localhost:8181
- Storybook: http://localhost:6006

## Context Documents

When you need more context:

| Topic                  | Document                                                 |
| ---------------------- | -------------------------------------------------------- |
| Project status         | `docs/PROJECT_STATUS.md`                                 |
| Migration overview     | `docs/payload-migration/README.md`                       |
| Data models            | `docs/payload-migration/03-core-data-models.md`          |
| PHP PostgreSQL queries | `docs/payload-migration/03.5-php-postgresql-querying.md` |
| E2E testing            | `e2e/README.md`                                          |

## Common Patterns

### Creating a New Payload Collection

1. Add collection definition to `payload/src/collections/`
2. Register in `payload.config.ts`
3. Run `yarn payload:migrate`
4. Add tests in same directory
5. Seed sample data in `bin/seed-payload.ts`

### Modifying Legacy PHP

1. Edit files in `src/`
2. Start Docker: `docker compose up -d`
3. Test at http://localhost:8080
4. Run E2E tests: `yarn test:e2e`

### Adding a New Component

1. Create component: `app/components/MyComponent.tsx`
2. Create test: `app/components/MyComponent.test.tsx`
3. Create story: `app/components/MyComponent.stories.tsx`
4. Verify: `yarn test && yarn storybook`

---

**Remember:** You're an expert engineer. Write good code, test it, prove it works, and move on.
