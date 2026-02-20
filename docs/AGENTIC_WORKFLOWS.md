# GitHub Agentic Workflows - Setup Guide

Automates code refactoring, simplification, and test coverage improvements.

## Workflows

Located in `.github/agents/`:

- **code-simplifier.md** - Daily analysis of merged code
- **test-coverage-improver.md** - Systematic test additions toward 80% coverage
- **code-refactoring.md** - Weekly processing of REFACTOR_CHECKLIST.md

## Activation

```bash
gh extension install github/gh-aw
cp .github/agents/*.md .github/workflows/
gh aw compile code-simplifier.md code-refactoring.md test-coverage-improver.md
rm .github/workflows/*.md
git add .github/workflows/*.lock.yml && git commit -m "chore: activate agentic workflows" && git push
```

## How It Works

1. GitHub Actions runs workflows on schedule
2. AI agent reads markdown instructions, analyzes repo
3. Agent makes improvements (validated with tests/lint/build)
4. Agent creates PR for human review
5. Merge or close with feedback - workflow learns

## Safety

- All changes require human review (no auto-merge)
- Sandboxed execution, read-only access
- PRs expire if not merged (7d for code-simplifier)

## Schedules

| Workflow        | Frequency     | Scope                       |
| --------------- | ------------- | --------------------------- |
| Code Simplifier | Daily 2AM UTC | Files changed in last 24h   |
| Test Coverage   | Daily 3AM UTC | Lowest coverage areas       |
| Refactoring     | Mon 4AM UTC   | REFACTOR_CHECKLIST.md items |

## Configuration

Edit `.github/agents/*.md` files to customize, then:

```bash
gh aw compile
git add .github/ && git commit -m "chore: update workflows" && git push
```

## Monitoring

```bash
gh run list                                     # View all runs
gh run list --workflow=code-simplifier.yml      # Specific workflow
gh run view <run-id> --log                      # View logs
```

## Control

```bash
gh workflow disable code-simplifier.yml  # Disable
gh workflow enable code-simplifier.yml   # Re-enable
```

See [`.github/agents/README.md`](.github/agents/README.md) for detailed reference.
