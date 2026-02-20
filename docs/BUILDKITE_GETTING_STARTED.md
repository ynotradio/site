# Buildkite Setup Guide

## 1. Create Buildkite Account

Sign up at [buildkite.com](https://buildkite.com) and choose cloud agents or self-hosted.

## 2. Configure Environment Variables

In Buildkite UI: Pipeline → Settings → Environment Variables

Required:
- `GHCR_USERNAME` / `GHCR_TOKEN` - For pulling/pushing Docker images
- `NEON_PROD_DATABASE_URL` / `NEON_DEV_DATABASE_URL` - Database connections
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` - E2E tests
- `CODECOV_TOKEN` - Optional

## 3. Create Pipeline

1. Buildkite UI: Pipelines → New Pipeline
2. Name: "Y-Not Radio - CI"
3. Repository: `https://github.com/ynotradio/site`
4. Configuration path: `.buildkite/pipeline.yml`
5. Enable webhooks for pull requests

## 4. Test

Trigger a manual build or create a test PR to verify the pipeline works.

## Self-Hosted Agents (Optional)

If using self-hosted agents instead of cloud:

```bash
# Ubuntu/Debian
sudo sh -c 'echo deb https://apt.buildkite.com/buildkite-agent stable main > /etc/apt/sources.list.d/buildkite-agent.list'
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 32A37959C2FA5C3C99EFBC32A79206696452D198
sudo apt-get update && sudo apt-get install -y buildkite-agent

# Configure with your agent token
sudo sed -i "s/xxx/YOUR_AGENT_TOKEN/g" /etc/buildkite-agent/buildkite-agent.cfg

# Add tags
sudo sed -i 's/^# tags=""/tags="queue=default,docker=true"/' /etc/buildkite-agent/buildkite-agent.cfg

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker buildkite-agent

# Start
sudo systemctl enable buildkite-agent
sudo systemctl start buildkite-agent
```

See `.buildkite/README.md` for more details.
