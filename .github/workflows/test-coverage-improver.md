---
name: Test Coverage Improver
description: Systematically analyzes test coverage and adds meaningful tests to improve coverage in under-tested areas
on:
  schedule:
    - cron: '0 3 * * 1'
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

timeout-minutes: 35

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

# Test Coverage Improver Agent

Add tests to one under-tested area per run. Create a draft PR.

## Phase selection

```bash
# Check if a phase 1 discussion exists
gh api graphql -f query='{ repository(owner:"ynotradio",name:"site") { discussions(first:5,orderBy:{field:CREATED_AT,direction:DESC}) { nodes { title } } } }' \
  | grep -i "test coverage improver"

# Check if config action exists
[ -f .github/actions/test-coverage-improver/coverage-steps/action.yml ] && echo "phase3" || echo "check-discussion"
```

- Config action exists → Phase 3
- Discussion exists, no config → Phase 2
- Neither → Phase 1

## Phase 1: Research

```bash
corepack enable && yarn install --immutable --silent 2>&1 | tail -3
yarn test:coverage --silent 2>&1 | tail -30

# Components missing tests or stories (scope: app/ and payload/ only)
find app payload -name "*.tsx" \
  -not -name "*.test.tsx" \
  -not -name "*.stories.tsx" \
  | grep -E "components" | head -20
```

Create GitHub Discussion titled "Test Coverage Improver - Research and Plan" with:

- Coverage stats (statements/branches/functions/lines %)
- Top 5 files with lowest coverage
- Components missing tests/stories
- Proposed next target

Exit — wait for human review.

## Phase 2: Configuration

Check for open config PR first:

```bash
gh pr list --label "automation" --search "Coverage Configuration" --state open
```

Exit if found. Otherwise create `.github/actions/test-coverage-improver/coverage-steps/action.yml`:

```yaml
runs:
  using: composite
  steps:
    - name: Install dependencies
      run: yarn install --frozen-lockfile | tee -a coverage-steps.log
      shell: bash
    - name: Run coverage
      run: yarn test:coverage | tee -a coverage-steps.log
      shell: bash
    - name: Upload coverage
      uses: actions/upload-artifact@v6
      with:
        name: coverage
        path: coverage/
```

Create PR: "Test Coverage Improver - Coverage Configuration". Exit.

## Phase 3: Implementation

```bash
# Find the lowest-coverage files in app/ or payload/
yarn test:coverage --reporter=json --silent > /tmp/gh-aw/agent/coverage.json 2>/dev/null
node -e "
  const d = JSON.parse(require('fs').readFileSync('/tmp/gh-aw/agent/coverage.json','utf8'));
  const files = Object.entries(d.coverageMap || {})
    .filter(([f]) => /\/(app|payload)\//.test(f) && !/\.(test|stories)\./.test(f))
    .map(([f,v]) => [f, v.s ? Object.values(v.s).filter(Boolean).length / Object.values(v.s).length : 0])
    .sort((a,b) => a[1]-b[1]);
  files.slice(0,5).forEach(([f,c]) => console.log(c.toFixed(2), f));
" 2>/dev/null || \
  find app payload -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx" | grep "components" | head -5
```

Check for open PRs to avoid duplicates:

```bash
gh pr list --label "testing" --state open | head -10
```

Pick ONE file. Read it carefully before writing any tests.

**Standards (do not read external files):**

- Test file: `ComponentName.test.tsx` (exact name match, same directory)
- Story file: `ComponentName.stories.tsx` if component is user-facing
- Use `@testing-library/react` + Vitest for components
- Use `describe`/`it`/`expect` — match actual source behaviour
- Mock external dependencies; do not mock the module under test
- Minimum: happy path + one edge case

```bash
git checkout -b test/coverage-<component>-$(date +%Y%m%d)
# write tests
yarn lint 2>&1 | tail -20 && yarn test --silent 2>&1 | tail -10   # must both exit 0 before pushing
git add . && git commit -m "test: add coverage for <component>"
git push origin HEAD
```

Create draft PR:

- Title: `[test-coverage-improver] Add tests for <component>`
- Labels: `automation`, `testing`
- Body:

```markdown
## Changes

- [Specific tests added, what is covered]

## Verification

- [x] `yarn lint` exits 0
- [x] `yarn test` exits 0
- [x] Screenshot attached below — N/A (test-only change)
```

Comment progress on the Phase 1 discussion.

## Exit conditions

- **Phase 1**: Discussion created
- **Phase 2**: Config PR created
- **Phase 3**: Draft PR created
- **No work**: Coverage already meets targets (80% all metrics)
