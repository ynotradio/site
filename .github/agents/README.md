# GitHub Agentic Workflows

This directory contains **agentic workflow definitions** for the Y-Not Radio site. These workflows leverage AI coding agents to automate repository maintenance tasks like code refactoring, simplification, and test coverage improvement.

## What Are Agentic Workflows?

Agentic Workflows are AI-powered automation that:
- **Describe tasks in natural language** using Markdown files
- **Execute autonomously** through GitHub Actions
- **Create pull requests** for human review and approval
- **Operate safely** with controlled permissions and sandboxed execution
- **Learn from feedback** by reviewing merged/rejected PRs

Think of them as **continuous AI assistance** for code quality, running automatically in the background.

## Available Workflows

### 🧹 Code Simplifier
**File**: `code-simplifier.md`  
**Schedule**: Daily at 2 AM UTC  
**Purpose**: Analyzes recently modified code and creates PRs with simplifications that improve clarity and maintainability

**What it does**:
- Finds code changed in the last 24 hours
- Identifies opportunities to simplify without changing functionality
- Applies project-specific coding standards
- Removes dead code and unnecessary complexity
- Extracts inline styles to CSS files
- Creates PRs for review

**Use when**: You want continuous code quality improvements as development happens

---

### 🧪 Test Coverage Improver
**File**: `test-coverage-improver.md`  
**Schedule**: Daily at 3 AM UTC  
**Purpose**: Systematically adds meaningful tests to improve coverage in under-tested areas

**What it does**:
- Analyzes test coverage reports
- Identifies files with low or no test coverage
- Creates comprehensive test suites
- Adds story files for components
- Tracks progress toward 80% coverage goal
- Works in 3 phases: research, configuration, implementation

**Use when**: You want to incrementally improve test coverage toward the 80% target

---

### 🔧 Code Refactoring Assistant
**File**: `code-refactoring.md`  
**Schedule**: Weekly on Mondays at 4 AM UTC  
**Purpose**: Identifies and implements strategic refactoring to reduce technical debt

**What it does**:
- Reviews REFACTOR_CHECKLIST.md for priorities
- Finds components over 300 lines
- Splits large components into smaller ones
- Extracts hooks and utilities
- Adds missing test/story files
- Updates refactoring checklist

**Use when**: You have a backlog of refactoring tasks and want systematic progress

---

## How They Work

### Execution Flow

```
1. GitHub Actions triggers workflow on schedule
2. Workflow reads the agentic Markdown file
3. AI agent executes the instructions
4. Agent uses GitHub API and repository tools
5. Agent creates a branch with changes
6. Agent opens a pull request
7. Humans review and approve/reject
8. Workflow runs again next cycle
```

### Safety Features

- **Read-only by default**: Workflows can only read repository content
- **Controlled write access**: Can only create branches/PRs, not push to main
- **Human approval required**: All changes go through PR review
- **Sandboxed execution**: Runs in isolated containers
- **Expiring PRs**: Auto-close if not merged within timeframe
- **Audit trail**: All actions logged in PR descriptions

## Getting Started

### Prerequisites

1. **GitHub Actions enabled** in repository settings
2. **Appropriate permissions** configured (see below)
3. **Base workflows** in `.github/workflows/` (see Setup section)

### Setup

These workflows are **documentation/definition files only**. To actually run them, you need:

1. **Install GitHub CLI with Agentic Workflows extension**:
   ```bash
   gh extension install github/gh-aw
   ```

2. **Add workflows to your repository**:
   ```bash
   # Add Code Simplifier
   gh aw add .github/agents/code-simplifier.md
   
   # Add Test Coverage Improver
   gh aw add .github/agents/test-coverage-improver.md
   
   # Add Code Refactoring Assistant
   gh aw add .github/agents/code-refactoring.md
   ```

3. **Compile workflows**:
   ```bash
   gh aw compile
   ```
   
   This generates actual GitHub Actions workflow files in `.github/workflows/`.

4. **Commit and push**:
   ```bash
   git add .github/workflows/
   git commit -m "chore: add agentic workflows"
   git push
   ```

### Configuration

Each workflow can be customized by editing its Markdown file:

```bash
# Edit a workflow
vi .github/agents/code-simplifier.md

# Recompile after changes
gh aw compile

# Commit updated workflows
git add .github/workflows/
git commit -m "chore: update workflow configuration"
git push
```

### Permissions

Workflows require these permissions in their YAML front matter:

```yaml
permissions:
  contents: write       # Create branches
  issues: write         # Create/update issues (if needed)
  pull-requests: write  # Create PRs
  discussions: write    # Create discussions (Test Coverage only)
```

## Usage

### Automatic Execution

Workflows run automatically on their defined schedules:
- **Code Simplifier**: Daily at 2 AM UTC
- **Test Coverage Improver**: Daily at 3 AM UTC
- **Code Refactoring**: Weekly on Mondays at 4 AM UTC

### Manual Triggering

You can trigger workflows manually:

```bash
# Run a specific workflow
gh workflow run code-simplifier.yml

# Run with specific inputs (if defined)
gh workflow run test-coverage-improver.yml
```

Or via GitHub UI:
1. Go to **Actions** tab
2. Select workflow from sidebar
3. Click **Run workflow**
4. Confirm execution

### Monitoring

Check workflow status:

```bash
# List recent runs
gh run list --workflow=code-simplifier.yml

# View details of a run
gh run view <run-id>

# View logs
gh run view <run-id> --log
```

Or via GitHub UI:
1. Go to **Actions** tab
2. Select workflow
3. View run history and logs

### Controlling Workflows

#### Enable/Disable

```bash
# Disable a workflow
gh workflow disable code-simplifier.yml

# Enable a workflow
gh workflow enable code-simplifier.yml
```

Or via GitHub UI:
1. Go to **Actions** tab
2. Select workflow
3. Click **•••** menu → **Disable workflow**

#### Responding to PRs

When a workflow creates a PR:

1. **Review the changes** - Check code quality and correctness
2. **Run CI checks** - Ensure all tests pass
3. **Approve and merge** - If changes are good
4. **Request changes** - If improvements needed
5. **Close PR** - If not appropriate

The workflow learns from your decisions and improves over time.

## Workflow Details

### Code Simplifier

**Triggers**:
- Daily schedule (cron: `0 2 * * *`)
- Manual trigger via workflow_dispatch

**Process**:
1. Find code merged in last 24 hours
2. Analyze for simplification opportunities
3. Apply improvements:
   - Reduce complexity
   - Improve naming
   - Remove dead code
   - Extract inline styles
4. Validate (lint, test, build)
5. Create PR with improvements

**PR Naming**: `[code-simplifier] Simplify code for improved clarity`

**PR Labels**: `refactoring`, `code-quality`, `automation`

**Expiration**: 7 days

---

### Test Coverage Improver

**Triggers**:
- Daily schedule (cron: `0 3 * * *`)
- Manual trigger via workflow_dispatch

**Process** (3 phases):

**Phase 1 - Research** (first run):
1. Analyze current test coverage
2. Identify gaps and opportunities
3. Create discussion with plan
4. Exit and wait for human review

**Phase 2 - Configuration** (second run):
1. Create coverage steps action
2. Test coverage generation
3. Create configuration PR
4. Exit and wait for merge

**Phase 3 - Implementation** (subsequent runs):
1. Run coverage analysis
2. Select one under-tested area
3. Write comprehensive tests
4. Create story files if needed
5. Create PR with tests
6. Document progress in discussion

**PR Naming**: `[test-coverage-improver] Add tests for [component]`

**PR Labels**: `automation`, `testing`, `coverage-improvement`

**Draft**: true (for initial review)

---

### Code Refactoring Assistant

**Triggers**:
- Weekly schedule (cron: `0 4 * * 1`)
- Manual trigger via workflow_dispatch

**Process**:
1. Review REFACTOR_CHECKLIST.md
2. Identify refactoring priorities
3. Select one tractable target
4. Plan refactoring approach
5. Implement changes incrementally
6. Validate thoroughly
7. Create PR with refactoring
8. Update checklist

**PR Naming**: `[refactoring] [Description of refactoring]`

**PR Labels**: `refactoring`, `code-quality`, `automation`

**Expiration**: None (manual review required)

## Best Practices

### For Workflow Authors

1. **Be Specific** - Clear, detailed instructions work best
2. **Include Examples** - Show expected patterns and outputs
3. **Define Success** - Explicit validation criteria
4. **Safety First** - Always validate before creating PRs
5. **Fail Gracefully** - Handle edge cases and errors
6. **Document Decisions** - Explain reasoning in PRs

### For Maintainers

1. **Review Promptly** - PRs may expire if not reviewed
2. **Provide Feedback** - Comment on PRs to guide future runs
3. **Merge Good Work** - Don't let perfect be enemy of good
4. **Close Bad PRs** - Helps the workflow learn
5. **Monitor Progress** - Check workflow runs regularly
6. **Adjust as Needed** - Edit workflow files to improve behavior

### For Team Members

1. **Trust the Process** - Workflows improve with feedback
2. **Report Issues** - File issues for workflow problems
3. **Suggest Improvements** - Propose new workflow features
4. **Understand Limitations** - Workflows are assistants, not replacements

## Troubleshooting

### Workflow Not Running

**Check**:
- Is workflow enabled? (`gh workflow list`)
- Are permissions correct?
- Is schedule valid cron syntax?
- Are there recent errors? (`gh run list`)

**Fix**:
```bash
# Re-enable workflow
gh workflow enable <workflow-name>.yml

# Manually trigger to test
gh workflow run <workflow-name>.yml
```

### PRs Not Created

**Check**:
- Does workflow have `pull-requests: write` permission?
- Are there validation errors in logs?
- Is there an existing open PR from this workflow?

**Fix**:
- Review workflow logs for errors
- Check permissions in workflow file
- Close existing PRs if blocking new ones

### Tests Failing

**Check**:
- Are changes breaking existing tests?
- Are new tests written correctly?
- Is coverage configuration correct?

**Fix**:
- Review test failures in PR checks
- Comment on PR requesting fixes
- Manually fix and push to PR branch if needed

### Workflow Stuck

**Check**:
- Is workflow waiting for human input (discussion, PR merge)?
- Are there timeout issues?
- Is there a deadlock condition?

**Fix**:
- Complete required human actions (review discussion, merge PR)
- Increase timeout in workflow file if needed
- Manually trigger next phase if appropriate

## Customization

### Adjusting Schedules

Edit the `on:` section in workflow files:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:      # Allow manual trigger
```

Cron syntax: `minute hour day-of-month month day-of-week`

Examples:
- `0 2 * * *` - Daily at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 2 * * 1` - Weekly on Monday at 2 AM
- `0 2 1 * *` - Monthly on 1st at 2 AM

### Changing PR Labels

Edit the workflow instructions:

```markdown
**Labels**: `refactoring`, `code-quality`, `automation`, `high-priority`
```

### Adding Validation Steps

Add more checks before creating PRs:

```bash
# Additional validation
yarn test:e2e
yarn build-storybook
```

### Customizing Instructions

Modify the agent instructions in Markdown files:
- Add project-specific patterns
- Include examples from your codebase
- Reference internal documentation
- Add custom validation rules

## Integration with CI/CD

Workflows integrate with existing CI/CD:

1. **Workflows create PRs** with changes
2. **CI runs on PRs** (lint, test, build)
3. **CI must pass** before merge
4. **CodeQL scans** check for security issues
5. **Manual review** approves changes
6. **Auto-merge** optional for trusted changes

Configure in `.github/workflows/ci.yml` to run on PR creation.

## FAQ

### Q: Will workflows break my code?

**A**: No. Workflows only create PRs that require human review. Your CI/CD will catch any issues before merge.

### Q: How much does this cost?

**A**: Workflows use GitHub Actions minutes. Free tier includes 2000 minutes/month. Most workflows use <10 minutes per run.

### Q: Can I customize workflows?

**A**: Yes! Edit the Markdown files in `.github/agents/` and recompile with `gh aw compile`.

### Q: What if a workflow creates a bad PR?

**A**: Close the PR with feedback. The workflow learns from closed PRs and improves.

### Q: How do I disable a workflow?

**A**: Run `gh workflow disable <workflow-name>.yml` or disable via GitHub UI.

### Q: Can workflows work together?

**A**: Yes! They're designed to complement each other. Code Simplifier cleans up code daily, Test Coverage adds tests, and Refactoring tackles bigger structural improvements.

### Q: What if I don't have GitHub Copilot?

**A**: These workflows use GitHub Actions and can work with any AI coding agent (Copilot, Claude, OpenAI, etc.) through the GitHub Agentic Workflows framework.

## Resources

- **GitHub Agentic Workflows**: https://github.github.com/gh-aw/
- **Example Workflows**: https://github.com/githubnext/agentics
- **GitHub Actions Docs**: https://docs.github.com/actions
- **Y-Not Radio AGENTS.md**: `../AGENTS.md`
- **Refactoring Checklist**: `../REFACTOR_CHECKLIST.md`

## Contributing

To add a new workflow:

1. Create a Markdown file in `.github/agents/`
2. Follow the structure of existing workflows
3. Include clear instructions and examples
4. Add front matter with schedule and permissions
5. Test with `gh aw add` and `gh aw compile`
6. Document in this README
7. Create PR for review

## Support

For issues with:
- **Workflows themselves**: File issue in ynotradio/site
- **GitHub Agentic Workflows framework**: File issue in github/gh-aw
- **Example workflows**: File issue in githubnext/agentics

## License

These workflow definitions are part of the Y-Not Radio site project and inherit its license.

---

**Remember**: Agentic workflows are assistants, not replacements. They handle repetitive code quality tasks so you can focus on building features. Review their work, provide feedback, and let them continuously improve your codebase.
