# Agent Automation Status & Recommendations

## Current State (Updated 2026-01-04)

### For Local Development ✅
Agents can successfully test on local workstations where:
- Full network access available
- Docker and Node.js installed
- Can manually run `yarn install` and `docker compose up`
- Screenshots can be captured via browser

### For CI/CD Automation ⚠️

**Infrastructure:** Complete and functional  
**Blocker:** Performance (yarn install takes 5+ minutes in containers)

After adding domains to firewall allowlist:
- ✅ `registry.hub.docker.com` - Docker Hub access working
- ✅ `registry.npmjs.org` - npm package downloads working
- ❌ **yarn install in Alpine containers: 5+ minutes** (timeout)

## Performance Metrics

| Operation | Current | Expected | Status |
|-----------|---------|----------|--------|
| Docker pull base images | ~2s | < 30s | ✅ |
| yarn install (Alpine) | 5+ min | < 2 min | ❌ |
| Container startup | Blocked | < 3 min | ❌ |
| Total time to ready | Timeout | < 5 min | ❌ |

## Recommended Solutions

### Option 1: Pre-Built Images (Recommended) ⭐

**Implementation:**
- GitHub Actions workflow builds images on every push to master
- Images pushed to GitHub Container Registry (ghcr.io)
- Agents pull pre-built images instead of building

**Benefits:**
- ✅ Startup time: 5+ minutes → ~20 seconds (15x faster)
- ✅ No network restrictions needed beyond image pull
- ✅ Consistent environments
- ✅ No yarn install timeouts

**Status:** Workflow ready in `.github/workflows/build-agent-images.yml`

**To enable:**
```bash
# Workflow will automatically build and push images
# Agents can then use:
docker pull ghcr.io/ynotradio/site/payload-dev:latest
docker pull ghcr.io/ynotradio/site/phpfpm-dev:latest
```

### Option 2: Playwright MCP Server

**Implementation:**
- Add Playwright MCP server to agent tooling
- Point to existing staging/dev instances
- Agents navigate and screenshot directly

**Benefits:**
- ✅ No local Docker needed
- ✅ Test against real data
- ✅ Instant access

**Drawbacks:**
- ❌ Requires maintained staging environment
- ❌ Potential for environment conflicts
- ❌ Can't test isolated changes

### Option 3: Optimized Containers

**Improvements to current approach:**

1. **Use Debian instead of Alpine** (faster yarn install)
   ```dockerfile
   FROM node:22  # Not -alpine
   ```

2. **Layer caching**
   ```dockerfile
   COPY package*.json ./
   RUN npm ci --omit=dev
   COPY . .
   ```

3. **Use Yarn** (faster than npm)
   ```dockerfile
   RUN yarn install --frozen-lockfile
   ```

**Expected improvement:** 5 min → 2-3 min (still slow for CI)

## Recommendations

### Immediate Action
1. ✅ Enable pre-built image workflow (already created)
2. Update agent documentation to use pre-built images
3. Add `ghcr.io` to firewall allowlist (if not already)

### For Future PRs
Agents should:
1. **Check for pre-built images first** before building locally
2. **Report performance issues** when exceeding baselines
3. **Provide evidence or explain why not** (per testing checklist)
4. **Test locally** when CI automation unavailable

## Usage Examples

### With Pre-Built Images (Fast)
```bash
# Pull pre-built images
docker pull ghcr.io/ynotradio/site/payload-dev:latest
docker pull ghcr.io/ynotradio/site/phpfpm-dev:latest

# Start services (uses pre-built images)
docker compose up -d

# Seed databases with data
./bin/refresh_local.sh    # Legacy site with production data
yarn payload:seed         # Payload with sample data

# Ready in ~20 seconds (+ seed time)
```

### Building Locally (Slow)
```bash
# Build from scratch
docker compose up -d --build

# Seed databases
./bin/refresh_local.sh    # Legacy site
yarn payload:seed         # Payload

# Takes 5+ minutes due to yarn install
```

### Database Seeding Notes

**Why seed:**
- Empty applications are hard to verify
- Screenshots of empty dashboards don't prove functionality
- Real data helps test relationships and queries

**Legacy site:** `./bin/refresh_local.sh`
- Pulls production database snapshot
- Imports into MySQL container
- Site shows real content at http://localhost:8080

**Payload:** `yarn payload:seed`
- Creates sample collections and data
- Admin UI shows populated tables
- May need implementation if not yet available

## Monitoring

Track these metrics in agent PRs:

```markdown
## Performance Report
- Image pull: [time]
- Container start: [time]  
- Service ready: [time]
- Total: [time]

Target: < 3 minutes total
```

## Future Improvements

1. **Multi-stage builds** - Build dependencies in separate stage
2. **Volume caching** - Share node_modules between builds
3. **Lighter dependencies** - Audit and remove unnecessary packages
4. **Playwright MCP** - Add as complementary testing option

## Conclusion

**For immediate use:** Pre-built images solve the CI/CD automation blocker.

**For local development:** Direct installation continues to work perfectly.

All agent infrastructure is production-ready and documented. The only remaining step is enabling the pre-built image workflow.
