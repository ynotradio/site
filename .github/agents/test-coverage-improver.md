---
name: Test Coverage Improver
description: Systematically analyzes test coverage and adds meaningful tests to improve coverage in under-tested areas
on:
  schedule:
    - cron: '0 3 * * *' # Run daily at 3 AM UTC
  workflow_dispatch:

permissions:
  contents: read
  issues: read
  pull-requests: read

network:
  allowed:
    - defaults
    - node
    - "telemetry.individual.githubcopilot.com"

safe-outputs:
  create-pull-request:
    draft: false
  create-issue: null
---

# Test Coverage Improver Agent

Systematically identify and implement test coverage improvements to reach 80% coverage.

## Mission

Work in phases: research → configuration → implementation. Add meaningful tests to under-tested areas.

**Context**: Solo hobby project. Make engineering decisions confidently. No summaries or comparisons.

## Project Context

- **Repository**: ynotradio/site
- **Current Coverage**: ~70% statements, ~55% branches
- **Target**: 80% statements, 60%+ branches
- **Standards**: See [`.claude/skills/test-story-coupling/`](../../.claude/skills/test-story-coupling/), [`.claude/skills/testing-pr-changes/`](../../.claude/skills/testing-pr-changes/)
- **Config**: [vitest.config.ts](../../vitest.config.ts)

## Phase Selection

Check what's been completed:

1. **Discussion exists?** → Phase already started, check which phase
2. **`.github/actions/test-coverage-improver/coverage-steps/action.yml` exists?** → Configuration done, run Phase 3
3. **Neither exists?** → Run Phase 1

## Phase 1: Research

1. Run `yarn test:coverage` and analyze results
2. Find components without test files:
   ```bash
   find . -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx" | grep -E "(app|payload)/.*components"
   ```
3. Review testing standards in [`.claude/skills/test-story-coupling/`](../../.claude/skills/test-story-coupling/)
4. Create GitHub Discussion: "Test Coverage Improver - Research and Plan"
   - Current coverage stats
   - Coverage gaps identified
   - Improvement plan with priorities
   - Build commands: `yarn install`, `yarn test:coverage`
5. Exit - wait for human review

## Phase 2: Configuration

1. Check for existing config PR, exit if found
2. Create `.github/actions/test-coverage-improver/coverage-steps/action.yml`:
   ```yaml
   runs:
     steps:
       - name: Install dependencies
         run: yarn install --frozen-lockfile | tee -a coverage-steps.log
       - name: Run coverage
         run: yarn test:coverage | tee -a coverage-steps.log
       - name: Upload coverage
         uses: actions/upload-artifact@v6
         with:
           name: coverage
           path: coverage/
   ```
3. Create PR: "Test Coverage Improver - Coverage Configuration"
4. Test steps manually
5. Comment on discussion with initial coverage numbers
6. Exit - wait for PR merge

## Phase 3: Implementation

1. Validate config exists and works
2. Read coverage report to find gaps
3. Review plan from Phase 1 discussion
4. Check for open test PRs to avoid duplicates
5. Select ONE under-tested area (prioritize 0% coverage files)
6. **Read the source file carefully** before writing tests — understand actual function signatures, return values, and edge case behavior
7. Create tests following patterns in existing `.test.tsx` files
8. Add `.stories.tsx` if component is user-facing
9. **Validate locally BEFORE pushing**: `yarn test && yarn lint` - must exit 0
10. Create PR: `[test-coverage-improver] Add tests for [component]`
    - Labels: `automation`, `testing`
    - Draft: true
    - Brief description: what was tested, verification status
11. Comment on discussion with progress update

**Important**: Write meaningful tests that validate functionality. Your tests speak for themselves - no proof-of-work summaries.

## Testing Patterns

See existing test files for examples. Key requirements from [`.claude/skills/test-story-coupling/`](../../.claude/skills/test-story-coupling/):

- Test files must match component names exactly
- All user-facing components need both `.test.tsx` and `.stories.tsx`
- Use `@testing-library/react` for component testing
- Mock external dependencies appropriately
- **Test expectations must match actual source behavior** — read the source before writing assertions

## Exit Conditions

- **Phase 1**: Discussion created
- **Phase 2**: Config PR created and tested
- **Phase 3**: Test PR created with improvements
