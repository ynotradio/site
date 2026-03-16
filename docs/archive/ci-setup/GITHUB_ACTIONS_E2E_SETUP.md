# GitHub Actions E2E Tests - Setup Checklist

## ✅ Completed

- [x] Updated `.github/workflows/e2e.yml` to use Playwright container
- [x] Added `Dockerfile.playwright` for local Docker testing
- [x] Updated `docker-compose.yml` with playwright service
- [x] Added npm scripts: `test:e2e:docker` and `test:e2e:docker:build`
- [x] Updated `e2e/README.md` with Docker and CI/CD documentation
- [x] Configured Postgres feature flags in workflow
- [x] Updated test to attach screenshots to report

## 🔧 Required Actions

### 1. Add GitHub Repository Secrets

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

Add these 5 secrets (use values from `.env.local`):

```
DATABASE_URI
POSTGRES_HOST
POSTGRES_DATABASE
POSTGRES_USER
POSTGRES_PASSWORD
```

**Where to find values:**

- Check your `.env.local` file
- Look for the Neon Postgres connection details
- Current values are in `.env.local` lines 8, 34-38

### 2. Test Locally (Optional)

Verify the Docker setup works locally:

```bash
# Build the container
yarn test:e2e:docker:build

# Run tests in container
yarn test:e2e:docker
```

### 3. Trigger Workflow

Once secrets are added:

1. Create a new branch
2. Make a small change (e.g., update a comment)
3. Push and create a PR
4. Watch GitHub Actions run the E2E tests

## 📊 Expected Results

**Workflow should:**

- ✅ Complete in ~5-8 minutes (vs ~8-11 min before)
- ✅ Skip "Install Playwright browsers" step
- ✅ Connect to Neon Postgres successfully
- ✅ Run all tests and attach screenshots to report
- ✅ Upload `playwright-report` artifact

**If tests fail:**

- Check that GitHub secrets are set correctly
- Verify Neon database is accessible
- Check workflow logs for connection errors

## 🎯 Benefits Unlocked

- ⚡ **2-3 minutes faster** per CI run
- 🎨 **Consistent browsers** across all environments
- 📸 **Screenshots** automatically attached to reports
- 🗄️ **Remote database** (no local Postgres in CI)
- 🐳 **Same environment** locally and in CI

## 📚 Documentation

- Local testing: `e2e/README.md`
- Workflow config: `.github/workflows/e2e.yml`
- Docker setup: `Dockerfile.playwright`
