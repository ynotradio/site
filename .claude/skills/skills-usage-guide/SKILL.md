---
name: skills-usage-guide
description: Guidelines on when and how to use available skills. Use this skill when starting any new task to understand what specialized knowledge is available.
---

# Skills Usage Guide

**CRITICAL**: Before starting any task, check what skills are available and use them.

## Why Skills Matter

Skills contain:
- Project-specific conventions and patterns
- Specialized knowledge about tools and frameworks
- Lessons learned from previous work
- Context that prevents common mistakes

**Not using skills when relevant leads to**:
- Wasted time repeating known patterns
- Code that doesn't match project standards
- Missed requirements and conventions
- CI failures that could have been avoided

## Required Workflow

### Step 1: List Available Skills

At the start of every task:
1. Look in `.claude/skills/` directory
2. Review the skills table in `AGENTS.md`
3. Read skill descriptions to understand their purpose

### Step 2: Identify Relevant Skills

Ask yourself:
- Does this task involve components? → `test-story-coupling`
- Am I about to add dependencies? → `dependency-best-practices`
- Will I write TypeScript/React code? → `code-quality-standards`
- Does this involve Payload CMS? → `payload-migration-workflow`
- Am I creating a PR? → `testing-pr-changes` (ALWAYS use this one)
- Having build/Docker issues? → `agent-automation-infrastructure`
- Creating Storybook stories? → `storybook-best-practices`
- Need environment detection? → `detecting-agent-environment`

### Step 3: Invoke Skills

Use the skill tool to invoke relevant skills:
```
skill: "test-story-coupling"
```

**Invoke multiple skills if needed** - they're designed to work together.

### Step 4: Apply Guidance

- Read the skill content carefully
- Follow the patterns and conventions it describes
- Reference specific requirements when making decisions
- Return to skills if you get stuck

## Available Skills Reference

| Skill | Primary Use Case | Key Content |
|-------|------------------|-------------|
| **testing-pr-changes** | Before every PR submission | CI requirements, Playwright verification, proof requirements |
| **payload-migration-workflow** | Working with Payload CMS | Data models, collections, migration strategy |
| **code-quality-standards** | Writing TypeScript/React | Airbnb style guide, React 19 patterns, Next.js 15 conventions |
| **test-story-coupling** | Creating components | Test file naming, story file requirements, component patterns |
| **dependency-best-practices** | Adding packages | Approved libraries, security practices, bundle optimization |
| **agent-automation-infrastructure** | Build/Docker issues | Pre-built images, performance baselines, optimization strategies |
| **detecting-agent-environment** | Environment-aware scripts | CI detection, network checks, port availability |
| **storybook-best-practices** | Creating stories | Payload UI mocking, provider setup, story patterns |

## Common Mistakes

### ❌ DON'T: Skip checking skills
```
"I'll just start coding, I know what to do."
```
Result: Code doesn't match conventions, CI fails, needs rework.

### ✅ DO: Check skills first
```
"Let me check available skills... I see 'code-quality-standards' 
and 'test-story-coupling' are relevant. Let me invoke those."
```
Result: Code follows conventions, tests match requirements, CI passes.

### ❌ DON'T: Invoke skills but ignore their content
```
[Invokes skill] "Okay, now I'll do it my way."
```
Result: Skills are useless if you don't apply them.

### ✅ DO: Follow skill guidance
```
[Invokes skill] "The skill says test files must match component 
names exactly. I'll ensure MyComponent.tsx has MyComponent.test.tsx"
```
Result: Code matches project standards.

### ❌ DON'T: Assume you don't need the testing skill
```
"This is a simple change, I don't need to read testing-pr-changes."
```
Result: Forgot to verify CI locally, pushed failing code.

### ✅ DO: Always use testing-pr-changes before PRs
```
"Before submitting this PR, let me check testing-pr-changes 
to ensure I've met all requirements."
```
Result: Complete verification, CI passes, includes screenshots.

## Integration with Workflows

Skills are referenced in:
- **AGENTS.md**: Main instructions point to skills
- **Workflow agents**: All three agents reference relevant skills
- **Custom instructions**: Skills are your primary source of truth

**Hierarchy**:
1. Skills (most specific, project conventions)
2. AGENTS.md (general workflow and context)
3. Workflow agent files (specialized automation)

When in conflict, skills take precedence for their specific domain.

## Skills for Different Task Types

### Feature Development
1. `code-quality-standards` - Before writing code
2. `test-story-coupling` - When creating components
3. `testing-pr-changes` - Before submitting PR

### Payload CMS Work
1. `payload-migration-workflow` - Understand data models
2. `code-quality-standards` - Write collection code
3. `testing-pr-changes` - Verify and submit

### Adding Dependencies
1. `dependency-best-practices` - Check approved libraries
2. `code-quality-standards` - Integrate properly
3. `testing-pr-changes` - Verify no issues

### Debugging/Performance
1. `agent-automation-infrastructure` - Check for known solutions
2. `detecting-agent-environment` - Environment-specific issues
3. `testing-pr-changes` - Verify fix works

### Component Creation
1. `test-story-coupling` - Naming and structure requirements
2. `code-quality-standards` - Code patterns
3. `storybook-best-practices` - Create story file
4. `testing-pr-changes` - Complete verification

## Remember

**Skills exist to help you succeed on the first try.**

Using them is not optional - it's part of the workflow that ensures:
- Code quality
- Project consistency
- CI success
- Minimal rework

**Check skills → Invoke relevant ones → Apply guidance → Succeed**
