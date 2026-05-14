---
name: Code Simplifier
description: Analyzes recently modified code and creates pull requests with simplifications that improve clarity and maintainability while preserving functionality
on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read

network:
  allowed:
    - defaults
    - node
    - 'telemetry.individual.githubcopilot.com'

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

Read [`.claude/skills/code-quality-standards/`](../../.claude/skills/code-quality-standards/) BEFORE making any changes — it contains project-specific patterns.

**Preserve**:

- Exact functionality - never change what code does
- All tests passing
- Build success

### 3. Validate

**CRITICAL - You MUST actually run and verify all checks BEFORE creating a branch or pushing. Do not skip this step or assume checks pass.**

```bash
corepack enable && yarn install --immutable
yarn lint    # Must exit 0 — if it fails, fix the code or revert and do not push
yarn test    # Must exit 0 — if it fails, fix the code or revert and do not push
```

If `yarn lint` fails:

1. Read the exact error messages
2. Fix the code to satisfy the linting rules
3. Re-run `yarn lint` until it exits 0
4. Only then proceed to create the PR

**Never push code that fails lint or tests. No exceptions.**

Common ESLint pitfalls to avoid:

- `no-confusing-arrow`: Arrow functions with ternary bodies need explicit braces. Use `(x) => { if (...) return ...; return ...; }` instead of `(x) => condition ? a : b`
- `implicit-arrow-linebreak`: Arrow function body must start on the same line as `=>`
- `function-paren-newline`: Function call parens must be consistent (avoid trailing newlines before `)`)

### 4. Create PR

```bash
git checkout -b refactor/code-simplifier-$(date +%Y%m%d)-<brief-slug>
git add .
git commit -m "refactor: <concise description of specific changes>

- [List specific improvements]

All checks pass (lint + tests)"
git push origin HEAD
```

**PR Title**: `[code-simplifier] <concise description of specific changes>`  
The title must describe what was actually simplified — not a generic message. Summarize the key change in a few words.

- Good: `[code-simplifier] Use Record type and filter-join for bracket classes`
- Good: `[code-simplifier] Extract repeated fetch logic into shared helper`
- Bad: `[code-simplifier] Simplify code for improved clarity`

**Labels**: `refactoring`, `code-quality`, `automation`  
**Expiration**: 7 days

**PR Description** (brief):

```markdown
## Changes

- [List 2-3 specific improvements with file names]

## Verification

- [x] `yarn lint` exits 0
- [x] `yarn test` exits 0
- [x] Screenshot attached below — N/A (code-only change, no UI affected)
```

**Important**: Your code speaks for itself. No summaries, action plans, or documentation as proof of work.

## Exit Conditions

- **Success**: PR created, validated, ready for review
- **No Changes**: No code modified in last 24h or already meets standards
- **Error**: Validation failures that cannot be resolved
