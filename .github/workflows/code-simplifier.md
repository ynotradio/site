---
name: Code Simplifier
description: Analyzes recently modified code and creates pull requests with simplifications that improve clarity and maintainability while preserving functionality
on:
  schedule:
    - cron: '0 2 * * 1-5'
  workflow_dispatch:

engine:
  id: copilot
  model: ${{ github.event_name == 'workflow_dispatch' && (vars.GH_AW_MODEL_AGENT_COPILOT_DISPATCH || 'claude-sonnet-4.6') || vars.GH_AW_MODEL_AGENT_COPILOT || 'gpt-5 mini' }}
max-runs: 100
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
---

# Code Simplifier Agent

Simplify recently modified code without changing behaviour. One PR per run.

## 1. Find changed files

```bash
git log --since="24 hours ago" --no-merges --pretty=format:"%H" | \
  xargs -I{} git diff-tree --no-commit-id -r --name-only {} | \
  grep -E '^(app|payload)/.*\.(ts|tsx|js|jsx)$' | \
  grep -vE '\.(test|stories)\.(ts|tsx)$' | \
  grep -vE '(\.lock|generated|importMap)' | \
  sort -u | head -10
```

If no files, exit.

## 2. Simplify

Read each file. Apply only if clearly better:

- Remove dead code and unused imports
- Flatten nested conditionals
- Improve naming clarity
- Extract inline styles to CSS files
- Replace nested ternaries with if/else

**Standards (do not read external files):**

- Arrow function components with TypeScript interfaces, no `any`
- `const` everywhere, no barrel/index re-exports
- Max 300 lines per component — split if over
- `use` prefix on hooks, complete `useEffect` dependency arrays
- CSS files not inline styles
- `yarn lint` is authoritative — if it exits 0, code is compliant

**Never change behaviour. Never break tests.**

## 3. Validate

```bash
corepack enable && yarn install --immutable --silent 2>&1 | tail -3
yarn lint 2>&1 | tail -20   # fix if fails, do not push if unfixable
yarn test --silent 2>&1 | tail -10   # revert if fails
```

## 4. Create PR

```bash
git checkout -b refactor/code-simplifier-$(date +%Y%m%d)-<slug>
git add .
git commit -m "refactor: <specific description>"
git push origin HEAD
```

- Title: `[code-simplifier] <specific description>` — describe the actual change, not "simplify code"
- Labels: `refactoring`, `code-quality`, `automation`
- Expiration: 7 days
- PR body (brief):

```markdown
## Changes

- [2-3 bullets with file names]

## Verification

- [x] `yarn lint` exits 0
- [x] `yarn test` exits 0
- [x] Screenshot attached below — N/A (code-only change)
```

## Exit conditions

- **Success**: PR created
- **No changes**: Nothing modified in last 24h or already clean
- **Error**: Lint/test failures that cannot be resolved
