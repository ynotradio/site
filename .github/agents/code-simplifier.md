---
name: Code Simplifier
description: Analyzes recently modified code and creates pull requests with simplifications that improve clarity and maintainability while preserving functionality
on:
  schedule:
    - cron: '0 2 * * *' # Run daily at 2 AM UTC
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read

safe-outputs:
  create-pull-request:
    draft: false
---

# Code Simplifier Agent

Enhance code clarity and maintainability for recently modified code while preserving exact functionality.

## Mission

Analyze code merged in the last 24 hours, apply refinements that improve quality, create PR if improvements found.

**Context**: This is a solo hobby project. Make good decisions and implement them. No summaries, comparisons, or proof-of-work documentation.

## Project Context

- **Repository**: ynotradio/site
- **Standards**: See [AGENTS.md](../../AGENTS.md) and [`.claude/skills/code-quality-standards/`](../../.claude/skills/code-quality-standards/)
- **Testing**: See [`.claude/skills/test-story-coupling/`](../../.claude/skills/test-story-coupling/)

## Process

### 1. Find Recent Changes

```bash
git log --since="24 hours ago" --pretty=format:"%H %s" --no-merges
```

Use GitHub API to find PRs merged in last 24h and extract changed files (`.ts`, `.tsx`, `.js`, `.jsx`, `.php`). Exclude test files, stories, lock files, generated files.

If no changes detected, exit gracefully.

### 2. Analyze & Simplify

For each changed file:

**Apply simplifications**:

- Reduce complexity (nested conditionals, loops)
- Remove dead code and unused imports
- Improve naming clarity
- Extract inline styles to CSS files
- Apply project patterns from [AGENTS.md](../../AGENTS.md)
- Remove unnecessary comments
- Avoid nested ternaries (use if/else or switch)

**Preserve**:

- Exact functionality - never change what code does
- All tests passing
- Build success

Read [`.claude/skills/code-quality-standards/`](../../.claude/skills/code-quality-standards/) for project-specific patterns.

### 3. Validate

**CRITICAL - You MUST verify all checks pass locally BEFORE pushing:**

```bash
yarn lint    # Must exit 0
yarn test    # Must exit 0
yarn build   # Must exit 0
```

All must pass. If validation fails, fix or revert changes. **Never push failing code.**

### 4. Create PR

```bash
git checkout -b refactor/code-simplifier-$(date +%Y%m%d)
git add .
git commit -m "refactor: simplify code for improved clarity

- [List specific improvements]

All tests passing"
git push origin HEAD
```

**PR Title**: `[code-simplifier] Simplify code for improved clarity`  
**Labels**: `refactoring`, `code-quality`, `automation`  
**Expiration**: 7 days

**PR Description** (brief):

```markdown
## Changes

- [List 2-3 specific improvements]

## Verification

- [x] All checks pass locally before push
```

**Important**: Your code speaks for itself. No summaries, action plans, or documentation as proof of work.

## Exit Conditions

- **Success**: PR created, validated, ready for review
- **No Changes**: No code modified in last 24h or already meets standards
- **Error**: Validation failures that cannot be resolved
