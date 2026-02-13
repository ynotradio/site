---
name: Code Refactoring Assistant
description: Identifies and implements refactoring opportunities to improve code structure and reduce complexity
on:
  schedule:
    - cron: '0 4 * * 1' # Run weekly on Mondays at 4 AM UTC
  workflow_dispatch:

permissions:
  contents: write
  issues: write
  pull-requests: write
---

# Code Refactoring Assistant

Systematically analyze the codebase and implement strategic refactoring to improve code quality.

## Mission

Process items from [REFACTOR_CHECKLIST.md](../../REFACTOR_CHECKLIST.md), prioritize improvements, implement one refactoring per run.

## Project Context

- **Repository**: ynotradio/site
- **Standards**: See [AGENTS.md](../../AGENTS.md), [`.claude/skills/code-quality-standards/`](../../.claude/skills/code-quality-standards/)
- **Refactoring Guide**: [REFACTOR_CHECKLIST.md](../../REFACTOR_CHECKLIST.md)

## Process

### 1. Identify Opportunities

Read [REFACTOR_CHECKLIST.md](../../REFACTOR_CHECKLIST.md) for current priorities.

Find additional candidates:

```bash
# Large files (>300 lines)
find . -name "*.tsx" -o -name "*.ts" | while read f; do
  lines=$(wc -l < "$f")
  [ $lines -gt 300 ] && echo "$f: $lines lines"
done

# Missing tests
find . -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx" | \
  grep -E "(app|payload)/.*components"
```

Priority: Components >300 lines, 0% test coverage, high complexity.

### 2. Plan Refactoring

Select ONE tractable target. Design approach:

**Common refactorings**:
- Split large components (extract sub-components, hooks)
- Add missing `.test.tsx` and `.stories.tsx` files
- Extract inline styles to CSS modules
- Extract utilities to shared functions
- Remove duplicate code patterns

See [`.claude/skills/test-story-coupling/`](../../.claude/skills/test-story-coupling/) for component requirements.

### 3. Implement

```bash
git checkout -b refactor/[description]-$(date +%Y%m%d)
```

Make incremental changes. After each step:

```bash
yarn test
yarn lint
yarn build
```

### 4. Validate & PR

```bash
git add .
git commit -m "refactor: [description]

- [Specific changes]

Addresses: [Checklist item]"
git push origin HEAD
```

**PR Title**: `[refactoring] [Brief description]`  
**Labels**: `refactoring`, `code-quality`, `automation`

Update [REFACTOR_CHECKLIST.md](../../REFACTOR_CHECKLIST.md) to mark completed items.

**Important**: Never generate summary documentation. Let code and passing tests demonstrate improvements.

## Safety

**Low-risk refactoring** (automated):
- Split components/functions/hooks
- Move inline styles to CSS
- Add test/story files
- Remove dead code

**High-risk refactoring** (create issue instead):
- Change component APIs
- Modify state management
- Alter critical business logic

## Exit Conditions

- **Success**: PR created with refactoring, checklist updated
- **No Work**: All priority items complete
- **Error**: Validation failures or high-risk changes detected
