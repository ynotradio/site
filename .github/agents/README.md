# GitHub Agentic Workflows - Reference

AI-powered automation for code quality maintenance.

## Available Workflows

### Code Simplifier (`code-simplifier.md`)

- **Schedule**: Weekdays at 2 AM UTC
- **Scope**: Code merged in last 24 hours
- **Actions**: Reduces complexity, removes dead code, extracts inline styles, applies project conventions
- **PR Label**: `code-quality`, `automation`
- **Expiration**: 7 days

### Test Coverage Improver (`test-coverage-improver.md`)

- **Schedule**: Mondays at 3 AM UTC
- **Phases**: Research → Configuration → Implementation
- **Target**: 80% test coverage
- **Actions**: Adds tests to under-tested areas, creates story files
- **PR Label**: `testing`, `automation`

### Code Refactoring Assistant (`code-refactoring.md`)

- **Schedule**: Weekly on Mondays at 4 AM UTC
- **Source**: REFACTOR_CHECKLIST.md priorities
- **Actions**: Splits large components, extracts hooks/utilities, adds missing test/story files
- **PR Label**: `refactoring`, `automation`

## Execution Flow

```
Schedule trigger → Read workflow .md → Analyze repo → Make changes →
Validate (test/lint/build) → Create PR → Human review → Merge/close → Learn
```

## Configuration

Workflows use these project resources:

- **Coding Standards**: [AGENTS.md](../../AGENTS.md), [`.claude/skills/code-quality-standards/`](../../.claude/skills/code-quality-standards/)
- **Testing Requirements**: [`.claude/skills/test-story-coupling/`](../../.claude/skills/test-story-coupling/), [`.claude/skills/testing-pr-changes/`](../../.claude/skills/testing-pr-changes/)
- **Refactoring Priorities**: [REFACTOR_CHECKLIST.md](../../REFACTOR_CHECKLIST.md)
- **Coverage Config**: [vitest.config.ts](../../vitest.config.ts)

## Safety Model

- **Permissions**: Read repo, write PRs only (no direct commits)
- **Validation**: All changes must pass tests, linting, and builds
- **Sandboxing**: Runs in isolated containers
- **Audit**: Full history in PR descriptions

## Customization

Edit workflow Markdown files to change behavior:

```bash
vi .github/workflows/code-simplifier.md
gh aw compile
git add .github/ && git commit -m "chore: update workflow" && git push
```

> **Note**: Source `.md` files live in `.github/workflows/` (not `.github/agents/`)
> so that `gh aw compile` finds them by default and the compiled `.lock.yml`
> files stay in sync.

Common customizations:

- Adjust schedules (change cron in YAML front matter)
- Set default model with repository/org variable `GH_AW_MODEL_AGENT_COPILOT`
- Use `workflow_dispatch` `model` input for one-off stronger-model runs
- Tune `max-runs` and `max-effective-tokens` to control per-run token spend
- Add/remove validation steps
- Change PR expiration times
- Modify agent instructions

## Troubleshooting

**Workflow not running**: Check `gh workflow list`, verify schedule, manually trigger with `gh workflow run <workflow>.yml`

**No PRs created**: Review logs with `gh run view <run-id> --log`, check for validation failures or existing open PRs

**CI failures on PRs**: Review PR checks, request changes or manually fix on PR branch

See [GitHub Actions docs](https://docs.github.com/actions) for more details.
