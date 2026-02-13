# GitHub Agentic Workflows - Quick Start Guide

This guide helps you get started with automated code quality improvements using GitHub Agentic Workflows.

## What You Get

Three automated workflows that continuously improve your codebase:

1. **Code Simplifier** - Cleans up code daily after changes are merged
2. **Test Coverage Improver** - Systematically adds tests to reach 80% coverage
3. **Code Refactoring Assistant** - Tackles bigger structural improvements weekly

All workflows create PRs for human review. No code changes without your approval.

## Prerequisites

Before setting up workflows, ensure you have:

- [ ] GitHub repository with Actions enabled
- [ ] Appropriate permissions (see below)
- [ ] GitHub CLI installed: `gh --version`
- [ ] Agentic Workflows extension (see Installation)

## Installation

### 1. Install GitHub CLI Agentic Workflows Extension

```bash
# Install the gh-aw extension
gh extension install github/gh-aw

# Verify installation
gh aw --version
```

### 2. Add Workflows to Repository

The workflow definitions already exist in `.github/agents/`. To activate them:

```bash
# Navigate to repository
cd /path/to/ynotradio/site

# Add Code Simplifier
gh aw add .github/agents/code-simplifier.md

# Add Test Coverage Improver
gh aw add .github/agents/test-coverage-improver.md

# Add Code Refactoring Assistant
gh aw add .github/agents/code-refactoring.md
```

### 3. Compile Workflows

This generates actual GitHub Actions workflow files:

```bash
gh aw compile
```

This creates files in `.github/workflows/`:
- `code-simplifier.yml`
- `test-coverage-improver.yml`
- `code-refactoring.yml`

### 4. Commit and Push

```bash
git add .github/workflows/
git commit -m "chore: add agentic workflows for automated code quality"
git push origin main
```

### 5. Verify Workflows

Check that workflows are enabled:

```bash
gh workflow list
```

You should see the three new workflows listed.

## Usage

### Automatic Execution

Workflows run automatically on schedule:

| Workflow | Schedule | What It Does |
|----------|----------|--------------|
| Code Simplifier | Daily, 2 AM UTC | Simplifies code merged in last 24h |
| Test Coverage Improver | Daily, 3 AM UTC | Adds tests to under-tested areas |
| Code Refactoring | Weekly, Mon 4 AM | Refactors items from checklist |

**No action required** - they run automatically!

### Manual Triggering

To run a workflow immediately:

```bash
# Run Code Simplifier now
gh workflow run code-simplifier.yml

# Run Test Coverage Improver now
gh workflow run test-coverage-improver.yml

# Run Code Refactoring now
gh workflow run code-refactoring.yml
```

Or use GitHub UI:
1. Go to **Actions** tab
2. Select workflow from left sidebar
3. Click **Run workflow** button
4. Click **Run workflow** to confirm

### Monitoring Workflow Runs

Check recent workflow runs:

```bash
# List all recent runs
gh run list

# List runs for specific workflow
gh run list --workflow=code-simplifier.yml

# View details of specific run
gh run view <run-id>

# View logs of specific run
gh run view <run-id> --log
```

Or use GitHub UI:
1. Go to **Actions** tab
2. View run history and status
3. Click on a run to see details and logs

## Working with Workflow PRs

When a workflow creates a PR:

### 1. Review the PR

- **Read the description** - Understand what changed and why
- **Review the code** - Check quality and correctness
- **Check CI status** - Ensure all tests/lints pass

### 2. Take Action

**Option A: Approve and Merge**
```bash
gh pr review <pr-number> --approve
gh pr merge <pr-number> --squash
```

**Option B: Request Changes**
```bash
gh pr review <pr-number> --request-changes --body "Please fix X"
```

The workflow will see your feedback and learn from it.

**Option C: Close Without Merging**
```bash
gh pr close <pr-number> --comment "Not appropriate because..."
```

Closing PRs teaches the workflow what to avoid.

### 3. Provide Feedback

Good feedback helps workflows improve:

- ✅ **Specific**: "Variable naming is confusing"
- ✅ **Actionable**: "Please add edge case tests"
- ✅ **Constructive**: "Consider using a helper function here"
- ❌ **Vague**: "This is wrong"
- ❌ **Unhelpful**: "I don't like this"

## Customization

### Adjust Schedules

Edit workflow files to change when they run:

```bash
# Edit Code Simplifier schedule
vi .github/agents/code-simplifier.md

# Find this section:
on:
  schedule:
    - cron: '0 2 * * *'  # Change this

# Recompile after editing
gh aw compile
git add .github/workflows/
git commit -m "chore: adjust workflow schedule"
git push
```

Common cron patterns:
- `0 2 * * *` - Daily at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 2 * * 1` - Weekly on Monday
- `0 2 1 * *` - Monthly on 1st

### Modify Workflow Behavior

Edit the workflow Markdown files in `.github/agents/`:

```bash
# Edit workflow instructions
vi .github/agents/code-simplifier.md

# Make your changes to the agent instructions

# Recompile
gh aw compile

# Commit
git add .github/
git commit -m "chore: customize code simplifier behavior"
git push
```

Examples of customizations:
- Add project-specific patterns
- Change PR expiration times
- Adjust validation requirements
- Include additional checks

## Controlling Workflows

### Enable/Disable

```bash
# Disable a workflow temporarily
gh workflow disable code-simplifier.yml

# Re-enable when ready
gh workflow enable code-simplifier.yml
```

Or use GitHub UI:
1. Go to **Actions** tab
2. Select workflow
3. Click **•••** → **Disable workflow**

### Pause All Workflows

To stop all agentic workflows:

```bash
gh workflow disable code-simplifier.yml
gh workflow disable test-coverage-improver.yml
gh workflow disable code-refactoring.yml
```

### Remove Workflows

To completely remove workflows:

```bash
# Delete workflow files
rm .github/workflows/code-simplifier.yml
rm .github/workflows/test-coverage-improver.yml
rm .github/workflows/code-refactoring.yml

# Commit
git add .github/workflows/
git commit -m "chore: remove agentic workflows"
git push
```

## Troubleshooting

### Workflow Not Running

**Problem**: Workflow scheduled but not executing

**Check**:
```bash
# Is workflow enabled?
gh workflow list

# Check recent runs
gh run list --workflow=code-simplifier.yml
```

**Solution**:
```bash
# Re-enable workflow
gh workflow enable code-simplifier.yml

# Manually trigger to test
gh workflow run code-simplifier.yml
```

---

### No PRs Created

**Problem**: Workflow runs but doesn't create PRs

**Check workflow logs**:
```bash
gh run view <run-id> --log
```

**Common causes**:
- No changes detected (expected behavior)
- Validation failures (tests/lints failed)
- Existing open PR from workflow
- Insufficient permissions

**Solution**:
- Review logs for errors
- Fix validation issues
- Close existing PRs if blocking
- Check permissions in workflow file

---

### Tests Failing on PRs

**Problem**: Workflow PR fails CI checks

**Check**:
1. View PR in GitHub UI
2. Click on failed check
3. Review error logs

**Solution**:
- Request changes on PR
- Workflow will try to fix on next run
- Or manually fix and push to PR branch

---

### Workflow Creating Bad PRs

**Problem**: PRs don't meet quality standards

**Solution**:
1. Close PR with detailed feedback
2. Edit workflow instructions (`.github/agents/*.md`)
3. Recompile: `gh aw compile`
4. Next run will incorporate feedback

## Best Practices

### For Team

1. **Review PRs Promptly**
   - PRs may expire if not reviewed
   - Code Simplifier PRs expire in 7 days
   - Test Coverage PRs stay open longer

2. **Provide Clear Feedback**
   - Specific comments help workflows improve
   - Explain why you approved or rejected
   - Suggest improvements in comments

3. **Trust the Process**
   - Workflows learn from your decisions
   - Quality improves over time
   - Give them a few iterations to stabilize

4. **Monitor Progress**
   - Check Actions tab regularly
   - Review workflow run history
   - Address issues promptly

5. **Adjust as Needed**
   - Customize workflows for your needs
   - Disable temporarily if needed
   - Re-enable when ready

### For Workflows

1. **Start Conservative**
   - Workflows begin with safe, obvious improvements
   - They learn what you accept/reject
   - Become more sophisticated over time

2. **Fail Safely**
   - If validation fails, no PR created
   - Errors logged for investigation
   - Workflow tries again next run

3. **Document Changes**
   - All PRs have detailed descriptions
   - Commit messages explain changes
   - Progress tracked in discussions/issues

## Advanced Usage

### Running Workflows in Sequence

To process a batch of improvements:

```bash
# Run all workflows manually
gh workflow run code-simplifier.yml
sleep 300  # Wait 5 minutes
gh workflow run test-coverage-improver.yml
sleep 300
gh workflow run code-refactoring.yml

# Check progress
gh run list
```

### Integration with CI/CD

Workflows integrate with existing CI:

1. Workflow creates PR
2. CI runs on PR (lint, test, build)
3. CI must pass before merge
4. Human reviews and approves
5. PR merged or closed
6. Workflow learns from decision

### Custom Validation

Add project-specific checks to workflows:

```markdown
### Additional Validation

Run project-specific checks:

\`\`\`bash
# Check bundle size
yarn build
ls -lh .next/static/

# Check accessibility
yarn test:a11y

# Check performance
yarn lighthouse
\`\`\`
```

## Success Metrics

Track workflow impact:

### Code Simplifier
- Lines of code reduced
- Complexity metrics improved
- Dead code removed
- Inline styles extracted

### Test Coverage Improver
- Coverage percentage increased
- New test files created
- Components with tests/stories
- Progress toward 80% goal

### Code Refactoring
- Components under 300 lines
- Technical debt items resolved
- Checklist items completed
- Code maintainability improved

## Getting Help

### Documentation

- **This Guide**: Quick start and common tasks
- **Main README**: `.github/agents/README.md` - Comprehensive documentation
- **AGENTS.md**: Agent development guidelines
- **Workflow Files**: `.github/agents/*.md` - Detailed instructions

### Support

- **Repository Issues**: File issue in ynotradio/site
- **Framework Issues**: https://github.com/github/gh-aw
- **Examples**: https://github.com/githubnext/agentics

### Community

- **GitHub Discussions**: Ask questions in repo discussions
- **GitHub Next Discord**: `#continuous-ai` channel
- **Stack Overflow**: Tag `github-actions`, `github-agentic-workflows`

## Next Steps

1. ✅ **Installed workflows** - You're ready to go!
2. 🔄 **Wait for first run** - Workflows run on schedule
3. 👀 **Review first PR** - Check quality and provide feedback
4. 📊 **Monitor progress** - Watch Actions tab for runs
5. 🎯 **Customize** - Adjust workflows for your needs
6. 🚀 **Enjoy** - Let automation handle code quality!

## FAQ

**Q: Will workflows break my code?**  
A: No. All changes require PR review and CI must pass.

**Q: Can I modify workflows?**  
A: Yes! Edit `.github/agents/*.md` and recompile.

**Q: What if I don't want a workflow?**  
A: Disable it: `gh workflow disable <workflow-name>.yml`

**Q: How much does this cost?**  
A: Uses GitHub Actions minutes. ~10 min/run, free tier has 2000 min/month.

**Q: Can workflows work offline?**  
A: No. They require GitHub Actions and API access.

**Q: Do I need GitHub Copilot?**  
A: No. Workflows use GitHub Agentic Workflows framework which supports various AI providers.

---

**Remember**: Workflows are assistants, not replacements. They handle repetitive tasks so you focus on features. Review their work, provide feedback, and watch code quality improve!
