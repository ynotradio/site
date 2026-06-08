---
name: Code Refactoring Assistant
description: Identifies and implements refactoring opportunities to improve code structure and reduce complexity
on:
  schedule:
    - cron: '0 4 * * 1'
  workflow_dispatch:

engine:
  id: copilot
  model: ${{ github.event_name == 'workflow_dispatch' && (vars.GH_AW_MODEL_AGENT_COPILOT_DISPATCH || 'claude-sonnet-4.6') || vars.GH_AW_MODEL_AGENT_COPILOT || 'gpt-5 mini' }}
max-runs: 120
max-effective-tokens: 3500000

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
  create-issue: null
---

# Code Refactoring Assistant

Implement one targeted refactoring per run. Create a PR if successful, or a GitHub Issue if the change is high-risk.

## 1. Find a target

```bash
# Components over 300 lines
find app payload -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx" | \
  xargs wc -l 2>/dev/null | sort -rn | awk '$1 > 300 {print $2, $1}' | head -5

# Components missing test or story files
find app payload -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx" | \
  grep -E "components" | head -10
```

Pick ONE target. Prefer: over-300-line components > missing tests > missing stories.

## 2. Plan

Low-risk (implement as PR):

- Split large components into sub-components or hooks
- Add missing `.test.tsx` / `.stories.tsx` files
- Extract inline styles to CSS files
- Remove duplicate code

High-risk (create GitHub Issue instead, do not implement):

- Changing component APIs
- Modifying state management
- Altering business logic

## 3. Implement

```bash
corepack enable && yarn install --immutable --silent 2>&1 | tail -3
git checkout -b refactor/<description>-$(date +%Y%m%d)
```

**Standards (do not read external files):**

- Arrow function components with TypeScript interfaces, no `any`
- Max 300 lines per file — split if over
- `use` prefix on hooks, complete `useEffect` dependency arrays
- CSS files not inline styles
- Test files: `ComponentName.test.tsx` (exact name match)
- Story files: `ComponentName.stories.tsx` (exact name match)
- Use `@testing-library/react` for component tests
- Coverage targets: 80% statements/branches/functions/lines

After each change:

```bash
yarn lint 2>&1 | tail -20   # fix if fails, do not push if unfixable
yarn test --silent 2>&1 | tail -10   # revert if fails
```

## 4. PR

```bash
git add .
git commit -m "refactor: <description>"
git push origin HEAD
```

- Title: `[refactoring] <description>`
- Labels: `refactoring`, `code-quality`, `automation`
- Body:

```markdown
## Changes

- [Specific improvements with file names]

## Verification

- [x] `yarn lint` exits 0
- [x] `yarn test` exits 0
- [x] Screenshot attached below — N/A (code-only refactoring)
```

## Exit conditions

- **Success**: PR or Issue created
- **No work**: No viable targets found
- **Error**: Validation failures that cannot be resolved
