# Buildkite Migration: Getting Started Guide

**Ready to begin the migration?** Follow these steps to get started with Phase 1.

## Prerequisites

Before starting, ensure you have:
- [ ] Read and understood the [Migration Plan](./BUILDKITE_MIGRATION_PLAN.md)
- [ ] Team buy-in and approval for timeline
- [ ] Budget approval (if using cloud agents)
- [ ] Access to create Buildkite organization/account
- [ ] GitHub admin access to configure webhooks
- [ ] Access to required secrets (GHCR, Cloudinary, Neon DB)

## Phase 1: Foundation Setup (Week 1)

### Step 1: Create Buildkite Account

1. Go to [buildkite.com](https://buildkite.com)
2. Sign up for an account or organization
3. Choose your plan:
   - **Free Trial**: Test with limited builds
   - **Cloud Agents**: Fully managed, pay per use
   - **Self-Hosted**: Bring your own infrastructure

### Step 2: Set Up Agents

#### Option A: Buildkite Cloud Agents (Easiest)

1. In Buildkite UI: Organization → Agents → Cloud
2. Enable cloud agents
3. Configure regions (us-east-1, eu-west-1, etc.)
4. Set auto-scaling limits
5. Done! Agents are ready.

#### Option B: Self-Hosted Agents (More Control)

**On Ubuntu/Debian:**
```bash
# Add Buildkite repository
sudo sh -c 'echo deb https://apt.buildkite.com/buildkite-agent stable main > /etc/apt/sources.list.d/buildkite-agent.list'
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 32A37959C2FA5C3C99EFBC32A79206696452D198

# Install
sudo apt-get update && sudo apt-get install -y buildkite-agent

# Configure
sudo sed -i "s/xxx/YOUR_AGENT_TOKEN/g" /etc/buildkite-agent/buildkite-agent.cfg

# Add tags
sudo sed -i 's/^# tags=""/tags="queue=default,docker=true"/' /etc/buildkite-agent/buildkite-agent.cfg

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker buildkite-agent

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
npm install -g yarn

# Start agent
sudo systemctl enable buildkite-agent
sudo systemctl start buildkite-agent
```

**On macOS:**
```bash
brew install buildkite/buildkite/buildkite-agent
brew services start buildkite-agent
```

**Verify agents:**
```bash
# Check agent status
sudo systemctl status buildkite-agent

# View agent logs
sudo journalctl -u buildkite-agent -f

# Or in Buildkite UI: Organization → Agents
```

### Step 3: Configure Environment Variables

In Buildkite UI: Pipeline → Settings → Environment Variables

Add these secrets:

```bash
# GitHub Container Registry
GHCR_USERNAME=<your-github-username>
GHCR_TOKEN=<create-at-github.com/settings/tokens>

# Neon Database URLs
NEON_PROD_DATABASE_URL=postgresql://user:pass@host/db
NEON_DEV_DATABASE_URL=postgresql://user:pass@host/db

# Cloudinary (for E2E tests)
CLOUDINARY_CLOUD_NAME=<from-cloudinary-dashboard>
CLOUDINARY_API_KEY=<from-cloudinary-dashboard>
CLOUDINARY_API_SECRET=<from-cloudinary-dashboard>

# CodeCov (optional)
CODECOV_TOKEN=<from-codecov.io>
```

**Creating GitHub Token for GHCR:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `read:packages`, `write:packages`, `delete:packages`
4. Copy token (you won't see it again!)
5. Add to Buildkite as `GHCR_TOKEN`

### Step 4: Create First Pipeline (Lint Only)

Start simple to verify setup works.

1. In Buildkite: Pipelines → New Pipeline
2. **Name**: `Y-Not Radio - CI (Test)`
3. **Repository**: `https://github.com/ynotradio/site`
4. **Steps**:
   ```yaml
   steps:
     - label: ":eslint: Lint Test"
       command: |
         yarn install --frozen-lockfile
         yarn lint
       plugins:
         - docker#v5.11.0:
             image: "node:22"
             volumes:
               - ".:/app"
             workdir: "/app"
   ```
5. **Save Pipeline**

### Step 5: Test the Pipeline

1. Trigger a build manually:
   - Go to pipeline → New Build
   - Branch: `main`
   - Commit: `HEAD`
   - Message: "Test Buildkite setup"
   - Click "Create Build"

2. Watch the build:
   - Click on the running build
   - Monitor logs in real-time
   - Verify lint job completes successfully

3. **Expected Result**: ✅ Green build

### Step 6: Upload Full Pipeline Configuration

Once the test works, upload the full pipeline:

1. Update pipeline settings:
   - Configuration: Pipeline Upload
   - File: `.buildkite/pipeline.yml`
   - Save

2. Test with a real PR:
   - Create a test branch
   - Make a small change
   - Open a pull request
   - Verify pipeline triggers

### Step 7: Configure Webhooks

Enable automatic triggering on GitHub events:

1. In Buildkite: Pipeline → Settings → GitHub
2. **Connect Repository**: Authorize GitHub access
3. **Branch Configuration**:
   - Default branch: `main`
   - Branch pattern: `*` (all branches)
4. **Trigger Options**:
   - ✅ Pull requests
   - ✅ Pushes to branches
   - ✅ Pushes to tags
5. Save

### Step 8: Verify Webhook Integration

1. Create a test PR on GitHub
2. Check that Buildkite pipeline triggers automatically
3. Verify PR shows Buildkite status check
4. Confirm logs and results are accessible

## Phase 1 Checklist

- [ ] Buildkite account created
- [ ] Agents provisioned (cloud or self-hosted)
- [ ] Agents showing as "Connected" in Buildkite UI
- [ ] Environment variables configured
- [ ] Test pipeline created and runs successfully
- [ ] Full pipeline uploaded from `.buildkite/pipeline.yml`
- [ ] Webhooks configured
- [ ] Automatic triggering on PRs verified
- [ ] Team can access Buildkite UI
- [ ] Documentation reviewed by team

## Troubleshooting Phase 1

### Agent Won't Connect
```bash
# Check agent token
sudo cat /etc/buildkite-agent/buildkite-agent.cfg | grep token

# Check agent logs
sudo journalctl -u buildkite-agent -f

# Test connectivity
curl https://agent.buildkite.com/v3
```

### Docker Permission Denied
```bash
# Add agent to docker group
sudo usermod -aG docker buildkite-agent

# Restart agent
sudo systemctl restart buildkite-agent

# Verify
sudo -u buildkite-agent docker ps
```

### Pipeline Upload Fails
```bash
# Validate YAML syntax locally
yamllint .buildkite/pipeline.yml

# Test pipeline commands locally
docker run --rm -v $(pwd):/app -w /app node:22 bash -c "yarn install && yarn lint"
```

### Webhook Not Triggering
- Verify webhook is installed: GitHub repo → Settings → Webhooks
- Check recent deliveries for errors
- Ensure Buildkite GitHub app is authorized
- Verify branch patterns match

## Moving to Phase 2

Once Phase 1 is complete and verified:

1. **Document any issues encountered** and solutions
2. **Measure baseline performance**:
   - Average build time
   - Success rate
   - Time to first feedback
3. **Get team feedback** on Buildkite UI and experience
4. **Proceed to Phase 2**: [Migration Plan - Phase 2](./BUILDKITE_MIGRATION_PLAN.md#phase-2-core-ci-migration-week-2-3)

## Quick Reference Commands

```bash
# Check agent status
sudo systemctl status buildkite-agent

# Restart agent
sudo systemctl restart buildkite-agent

# View agent logs
sudo journalctl -u buildkite-agent -f

# Test agent can run Docker
sudo -u buildkite-agent docker run hello-world

# Test agent can clone repo
sudo -u buildkite-agent git clone https://github.com/ynotradio/site.git /tmp/test-clone

# Check disk space (agents need 50GB+)
df -h

# Check Docker images
docker images
```

## Need Help?

- **Buildkite Docs**: https://buildkite.com/docs
- **Agent Installation**: https://buildkite.com/docs/agent/v3/installation
- **Migration Guide**: https://buildkite.com/docs/tutorials/github-actions-migration
- **Support**: support@buildkite.com
- **Internal**: Check `docs/BUILDKITE_MIGRATION_PLAN.md` for detailed plan

## Success Criteria for Phase 1

✅ You're ready for Phase 2 when:
- Agents are connected and healthy
- Test pipeline runs successfully
- Full pipeline uploads without errors
- Webhooks trigger automatically on PRs
- Team can access and understand Buildkite UI
- Environment variables are configured
- Documentation is reviewed

---

**Next Steps**: Once Phase 1 is complete, proceed to Phase 2 in the [Migration Plan](./BUILDKITE_MIGRATION_PLAN.md).
