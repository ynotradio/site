# GitHub Agentic Workflows - Activation Checklist

Use this checklist to activate and verify the agentic workflows in your repository.

## ✅ Pre-Activation Checklist

### Prerequisites
- [ ] GitHub repository with Actions enabled
- [ ] Appropriate permissions (admin or write access)
- [ ] GitHub CLI installed and authenticated (`gh auth status`)
- [ ] Node.js and Yarn installed (for local testing)

### Verification
- [ ] Workflow definition files exist in `.github/agents/`
- [ ] Documentation reviewed and understood
- [ ] Team aware of incoming automated PRs
- [ ] Decision made on which workflows to enable first

## 🚀 Activation Steps

### Step 1: Install GitHub CLI Extension
```bash
# Install the gh-aw extension
gh extension install github/gh-aw

# Verify installation
gh aw --version
```
- [ ] Extension installed successfully
- [ ] Version displayed (should be latest)

### Step 2: Add Workflows
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
- [ ] Code Simplifier added
- [ ] Test Coverage Improver added
- [ ] Code Refactoring added
- [ ] No errors during addition

### Step 3: Compile Workflows
```bash
# Compile all workflows
gh aw compile
```
- [ ] Compilation succeeded
- [ ] New files created in `.github/workflows/`
- [ ] Files: `code-simplifier.yml`, `test-coverage-improver.yml`, `code-refactoring.yml`

### Step 4: Review Generated Workflows
```bash
# Review generated workflow files
ls -la .github/workflows/

# Check one workflow
cat .github/workflows/code-simplifier.yml
```
- [ ] Workflow files are valid YAML
- [ ] Permissions look correct
- [ ] Schedules configured as expected
- [ ] Job steps make sense

### Step 5: Commit and Push
```bash
# Stage workflow files
git add .github/workflows/

# Commit
git commit -m "chore: activate GitHub agentic workflows"

# Push to repository
git push origin main
```
- [ ] Files committed
- [ ] Push succeeded
- [ ] No conflicts

### Step 6: Verify Activation
```bash
# List workflows in repository
gh workflow list
```
- [ ] `code-simplifier` appears in list
- [ ] `test-coverage-improver` appears in list
- [ ] `code-refactoring` appears in list
- [ ] All workflows show as "active" or "enabled"

## 🧪 Testing Phase

### Test 1: Manual Trigger (Optional)
```bash
# Trigger Code Simplifier manually
gh workflow run code-simplifier.yml

# Wait a moment, then check status
gh run list --workflow=code-simplifier.yml
```
- [ ] Workflow triggered successfully
- [ ] Run appears in list
- [ ] Run status is "in_progress" or "completed"

### Test 2: View Workflow Run
```bash
# Get the run ID from previous command
RUN_ID=$(gh run list --workflow=code-simplifier.yml --limit 1 --json databaseId --jq '.[0].databaseId')

# View run details
gh run view $RUN_ID

# View logs
gh run view $RUN_ID --log
```
- [ ] Run details displayed
- [ ] Logs accessible
- [ ] No critical errors
- [ ] Workflow completed or progressing

### Test 3: Check for PR (if applicable)
```bash
# List recent PRs
gh pr list --label "automation"
```
- [ ] If changes detected, PR created
- [ ] If no changes, graceful exit message in logs
- [ ] PR title follows convention
- [ ] PR has correct labels

## 📊 First Week Monitoring

### Daily Checks (Days 1-7)
- [ ] Day 1: Check Actions tab for workflow runs
- [ ] Day 2: Review any PRs created by workflows
- [ ] Day 3: Verify CI passes on workflow PRs
- [ ] Day 4: Provide feedback on first PR
- [ ] Day 5: Merge or close first PR
- [ ] Day 6: Check workflow learned from feedback
- [ ] Day 7: Review workflow run history

### PR Review Checklist
For each PR created by workflows:
- [ ] Read PR description thoroughly
- [ ] Review code changes
- [ ] Check CI status (all green)
- [ ] Verify tests pass
- [ ] Confirm linting passes
- [ ] Ensure no breaking changes
- [ ] Add comments if improvements needed
- [ ] Approve and merge OR close with feedback

## 🔧 Configuration & Customization

### Workflow Schedules (Optional)
If you want to adjust when workflows run:

1. Edit workflow definition in `.github/agents/`
   ```yaml
   on:
     schedule:
       - cron: '0 2 * * *'  # Change this
   ```
   
2. Recompile workflows
   ```bash
   gh aw compile
   ```
   
3. Commit and push changes
   ```bash
   git add .github/
   git commit -m "chore: adjust workflow schedules"
   git push
   ```

- [ ] Schedules adjusted if needed
- [ ] Recompiled successfully
- [ ] Changes committed and pushed

### Workflow Behavior (Optional)
To customize what workflows do:

1. Edit workflow Markdown file in `.github/agents/`
2. Modify agent instructions, patterns, or validation
3. Recompile: `gh aw compile`
4. Commit and push changes

- [ ] Customizations made if desired
- [ ] Workflows recompiled
- [ ] Changes tested

## 🎯 Success Criteria

### Week 1 Goals
- [ ] All three workflows running on schedule
- [ ] At least one PR created and reviewed
- [ ] Team understands PR review process
- [ ] No critical issues or blockers

### Month 1 Goals
- [ ] Code Simplifier creating regular PRs
- [ ] Test Coverage Improver completed research phase
- [ ] First refactoring PR reviewed
- [ ] Team comfortable with workflow process
- [ ] 5-10 workflow PRs merged

### Quarter 1 Goals
- [ ] Test coverage increased 5-10%
- [ ] Code quality metrics improving
- [ ] Technical debt items from checklist completed
- [ ] Workflows customized to team preferences
- [ ] 20-30+ workflow PRs merged

## ⚠️ Troubleshooting

### Issue: Workflows Not Running
**Symptoms**: No runs appear in Actions tab

**Check**:
```bash
gh workflow list
gh run list
```

**Fixes**:
- [ ] Verify workflows are enabled
- [ ] Check schedule is valid cron syntax
- [ ] Ensure repository has Actions enabled
- [ ] Manually trigger to test: `gh workflow run <workflow>.yml`

### Issue: PRs Not Created
**Symptoms**: Workflows run but no PRs appear

**Check**:
```bash
gh run view <run-id> --log
```

**Possible causes**:
- [ ] No changes detected (expected behavior)
- [ ] Validation failed (tests/lint errors)
- [ ] Existing open PR from same workflow
- [ ] Permission issues

**Fixes**:
- Review logs for specific errors
- Fix validation failures if present
- Close existing PRs to allow new ones
- Verify permissions in workflow file

### Issue: CI Failures on Workflow PRs
**Symptoms**: PRs created but CI checks fail

**Check**: View PR in GitHub, click on failed check

**Fixes**:
- [ ] Review error logs
- [ ] Request changes on PR
- [ ] Workflow will attempt fixes on next run
- [ ] Or manually fix and push to PR branch

## 📈 Metrics to Track

### Code Quality
- [ ] Lines of code trend (should decrease or stabilize)
- [ ] Cyclomatic complexity (should decrease)
- [ ] ESLint warnings (should decrease)
- [ ] Dead code instances (should decrease)

### Test Coverage
- [ ] Statement coverage % (track weekly)
- [ ] Branch coverage % (track weekly)
- [ ] Files with tests (count monthly)
- [ ] Files with stories (count monthly)

### Technical Debt
- [ ] Components over 300 lines (should decrease)
- [ ] Refactoring checklist % complete (should increase)
- [ ] TODO/FIXME comments (track monthly)
- [ ] Duplicate code patterns (should decrease)

### Workflow Performance
- [ ] PRs created per week
- [ ] PRs merged vs closed
- [ ] Average time to review PRs
- [ ] Workflow run success rate

## 🎓 Team Training

### For Developers
- [ ] Reviewed quick start guide
- [ ] Understand PR review process
- [ ] Know how to provide feedback
- [ ] Can disable workflows if needed

### For Reviewers
- [ ] Understand what each workflow does
- [ ] Know what to look for in PRs
- [ ] Comfortable approving/rejecting PRs
- [ ] Can provide constructive feedback

### For Admins
- [ ] Can enable/disable workflows
- [ ] Know how to customize workflows
- [ ] Understand monitoring and logs
- [ ] Can troubleshoot common issues

## 📚 Documentation Review

### Required Reading
- [ ] Quick Start: `docs/AGENTIC_WORKFLOWS.md`
- [ ] Implementation Summary: `docs/AGENTIC_WORKFLOWS_SUMMARY.md`
- [ ] Detailed Guide: `.github/agents/README.md`

### Reference Materials
- [ ] PR Summary: `docs/PR_SUMMARY.md`
- [ ] Agent Guidelines: `AGENTS.md`
- [ ] Workflow Definitions: `.github/agents/*.md`

## ✅ Final Verification

### All Systems Go
- [ ] Workflows installed and activated
- [ ] First test run successful
- [ ] Documentation reviewed
- [ ] Team trained and ready
- [ ] Monitoring plan in place
- [ ] Success metrics defined
- [ ] Troubleshooting guide accessible

### Launch Checklist
- [ ] Merge activation PR
- [ ] Announce to team
- [ ] Share documentation links
- [ ] Schedule first review meeting (1 week)
- [ ] Set up metrics tracking
- [ ] Begin monitoring workflow runs

## 🎉 Congratulations!

If all items are checked, your GitHub Agentic Workflows are successfully activated!

**What's Next:**
1. Monitor the Actions tab for first runs
2. Review first PRs when they arrive
3. Provide feedback to improve workflows
4. Watch code quality improve automatically
5. Enjoy less manual code quality work!

**Remember:**
- Workflows learn from your feedback
- Quality improves over time
- All changes require your approval
- You're in full control

---

**Questions?** See documentation or file an issue in the repository.

**Having issues?** Check the troubleshooting section above or review workflow logs.

**Want to customize?** Edit workflow files in `.github/agents/` and recompile.
