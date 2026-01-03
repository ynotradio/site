# Automated Agent Environment Setup Guide

This guide provides instructions for automated agents (GitHub Copilot agents, CI/CD workflows) to spin up fully functioning containerized applications that can be tested with Playwright or other automation tools.

## Overview

Automated agents need self-contained, containerized environments that:
- Run without network dependencies (all images built locally)
- Expose services on localhost for Playwright testing
- Start quickly and reliably
- Provide accessible UIs for screenshot/interaction testing

## Prerequisites for Automated Environments

- Docker installed and running
- No network restrictions for initial image pulls (or pre-built images)
- Available ports: 3000 (Payload), 8080 (Legacy site), 5432 (PostgreSQL)
- Sufficient memory (4GB+ recommended)

---

## Part 1: Containerized Payload CMS for Agents

### Step 1: Create Self-Contained Docker Compose for Payload

Create `docker-compose.payload.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: payload
      POSTGRES_PASSWORD: payload
      POSTGRES_DB: payload_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U payload"]
      interval: 5s
      timeout: 5s
      retries: 5

  payload:
    build:
      context: .
      dockerfile: Dockerfile.payload
    ports:
      - "3000:3000"
    environment:
      DATABASE_URI: postgresql://payload:payload@postgres:5432/payload_dev
      PAYLOAD_SECRET: automated-agent-secret-key
      PAYLOAD_PUBLIC_SERVER_URL: http://localhost:3000
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./payload:/app/payload
      - ./package.json:/app/package.json
      - node_modules:/app/node_modules

volumes:
  postgres_data:
  node_modules:
```

### Step 2: Create Dockerfile for Payload

Create `Dockerfile.payload`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
RUN npm install --production=false

# Copy application code
COPY . .

# Generate Payload types
RUN npm run payload:generate-types || true

# Expose port
EXPOSE 3000

# Start Payload with migrations
CMD ["sh", "-c", "npm run payload:migrate && npm run payload:dev"]
```

### Step 3: Agent Script to Start Payload

Create `bin/agent-helpers/start-payload-containerized.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting containerized Payload for automated agents"

# Start services
docker compose -f docker-compose.payload.yml up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
timeout 60 bash -c 'until docker compose -f docker-compose.payload.yml exec -T postgres pg_isready -U payload; do sleep 2; done'

# Wait for Payload
echo "⏳ Waiting for Payload..."
timeout 120 bash -c 'until curl -s http://localhost:3000/api/users > /dev/null; do sleep 3; done'

echo "✅ Payload ready at http://localhost:3000"
echo "   Admin UI: http://localhost:3000/admin"
echo "   API: http://localhost:3000/api"
```

### Step 4: Playwright Test Example

```typescript
// test/payload-e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Payload CMS', () => {
  test.beforeAll(async () => {
    // Ensure Payload is running
    const response = await fetch('http://localhost:3000/api/users');
    expect(response.status).toBeLessThan(500);
  });

  test('Admin UI loads', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await expect(page).toHaveTitle(/Payload/);
    await page.screenshot({ path: 'screenshots/payload-admin.png' });
  });

  test('API is accessible', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/users');
    expect([200, 401, 403]).toContain(response.status());
  });
});
```

---

## Part 2: Containerized Legacy Site for Agents

### Step 1: Update Docker Compose for Self-Contained Legacy Site

Create `docker-compose.legacy.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: ynot_site
      MYSQL_USER: ynot_sql_user
      MYSQL_PASSWORD: ynot_sql_pass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot"]
      interval: 5s
      timeout: 5s
      retries: 10

  phpfpm:
    build:
      context: .
      dockerfile: bin/docker/phpfpm/Dockerfile
    volumes:
      - ./src:/app
    environment:
      DB_HOST: mysql
      DB_USER: ynot_sql_user
      DB_PASSWORD: ynot_sql_pass
      DB_NAME: ynot_site
    depends_on:
      mysql:
        condition: service_healthy

  apache:
    image: httpd:2.4-alpine
    ports:
      - "8080:80"
    volumes:
      - ./src:/usr/local/apache2/htdocs/
      - ./bin/docker/apache-vhost/httpd.conf:/usr/local/apache2/conf/httpd.conf:ro
    depends_on:
      - phpfpm
      - mysql

volumes:
  mysql_data:
```

### Step 2: Create Apache Configuration

Create `bin/docker/apache-vhost/httpd.conf`:

```apache
ServerRoot "/usr/local/apache2"
Listen 80

LoadModule mpm_event_module modules/mod_mpm_event.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule dir_module modules/mod_dir.so
LoadModule mime_module modules/mod_mime.so
LoadModule log_config_module modules/mod_log_config.so
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_fcgi_module modules/mod_proxy_fcgi.so
LoadModule rewrite_module modules/mod_rewrite.so

DocumentRoot "/usr/local/apache2/htdocs"

<Directory "/usr/local/apache2/htdocs">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.php index.html
</Directory>

<FilesMatch \.php$>
    SetHandler "proxy:fcgi://phpfpm:9000"
</FilesMatch>

ErrorLog /proc/self/fd/2
LogLevel warn
```

### Step 3: Agent Script to Start Legacy Site

Create `bin/agent-helpers/start-legacy-containerized.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting containerized legacy site for automated agents"

# Build and start services
docker compose -f docker-compose.legacy.yml up -d --build

# Wait for MySQL
echo "⏳ Waiting for MySQL..."
timeout 60 bash -c 'until docker compose -f docker-compose.legacy.yml exec -T mysql mysqladmin ping -h localhost -u root -proot; do sleep 2; done'

# Wait for Apache
echo "⏳ Waiting for Apache..."
timeout 60 bash -c 'until curl -s http://localhost:8080 > /dev/null; do sleep 2; done'

echo "✅ Legacy site ready at http://localhost:8080"
```

### Step 4: Playwright Test Example

```typescript
// test/legacy-e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Legacy PHP Site', () => {
  test.beforeAll(async () => {
    // Ensure site is running
    const response = await fetch('http://localhost:8080');
    expect(response.status).toBeLessThan(500);
  });

  test('Homepage loads', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await expect(page).toHaveTitle(/Y-Not Radio/i);
    await page.screenshot({ path: 'screenshots/legacy-home.png' });
  });

  test('PHP is executing', async ({ request }) => {
    const response = await request.get('http://localhost:8080/index.php');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).not.toContain('<?php'); // PHP should be parsed
  });
});
```

---

## Part 3: Complete Automated Agent Workflow

### Step 1: Create Master Setup Script

Create `bin/agent-helpers/setup-agent-environment.sh`:

```bash
#!/bin/bash
set -e

echo "🤖 Setting up automated agent environment"
echo "=========================================="

# Parse arguments
PAYLOAD=false
LEGACY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --payload) PAYLOAD=true; shift ;;
    --legacy) LEGACY=true; shift ;;
    --all) PAYLOAD=true; LEGACY=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Default to both if none specified
if [ "$PAYLOAD" = false ] && [ "$LEGACY" = false ]; then
  PAYLOAD=true
  LEGACY=true
fi

# Start Payload if requested
if [ "$PAYLOAD" = true ]; then
  echo ""
  echo "📦 Starting Payload CMS..."
  ./bin/agent-helpers/start-payload-containerized.sh
fi

# Start Legacy if requested
if [ "$LEGACY" = true ]; then
  echo ""
  echo "🏛️  Starting Legacy Site..."
  ./bin/agent-helpers/start-legacy-containerized.sh
fi

echo ""
echo "✅ Environment ready!"
echo ""
if [ "$PAYLOAD" = true ]; then
  echo "   Payload: http://localhost:3000"
fi
if [ "$LEGACY" = true ]; then
  echo "   Legacy:  http://localhost:8080"
fi
echo ""
echo "🎭 Ready for Playwright testing"
```

### Step 2: Create Teardown Script

Create `bin/agent-helpers/teardown-agent-environment.sh`:

```bash
#!/bin/bash

echo "🧹 Tearing down agent environment..."

# Stop Payload
if docker compose -f docker-compose.payload.yml ps -q 2>/dev/null; then
  docker compose -f docker-compose.payload.yml down -v
fi

# Stop Legacy
if docker compose -f docker-compose.legacy.yml ps -q 2>/dev/null; then
  docker compose -f docker-compose.legacy.yml down -v
fi

echo "✅ Environment cleaned up"
```

### Step 3: Playwright Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  fullyParallel: false, // Run serially for agent environments
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for agent testing
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'payload',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/payload-e2e.spec.ts',
    },
    {
      name: 'legacy',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:8080' },
      testMatch: '**/legacy-e2e.spec.ts',
    },
  ],
  webServer: undefined, // We manage services with Docker Compose
});
```

### Step 4: GitHub Actions Workflow Example

Create `.github/workflows/agent-test.yml`:

```yaml
name: Agent Environment Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        
      - name: Start agent environment
        run: |
          chmod +x bin/agent-helpers/*.sh
          ./bin/agent-helpers/setup-agent-environment.sh --all
          
      - name: Wait for services
        run: sleep 10
        
      - name: Run Playwright tests
        run: npx playwright test
        
      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: screenshots/
          
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          
      - name: Teardown environment
        if: always()
        run: ./bin/agent-helpers/teardown-agent-environment.sh
```

---

## Part 4: Agent Usage Instructions

### For GitHub Copilot Agents

When working in an automated environment:

1. **Start the environment:**
   ```bash
   ./bin/agent-helpers/setup-agent-environment.sh --all
   ```

2. **Run your tests:**
   ```bash
   npx playwright test
   ```

3. **Take screenshots for proof:**
   ```typescript
   await page.goto('http://localhost:3000/admin');
   await page.screenshot({ path: 'proof-payload-works.png' });
   ```

4. **Clean up:**
   ```bash
   ./bin/agent-helpers/teardown-agent-environment.sh
   ```

### For CI/CD Pipelines

Add to your workflow:

```bash
# Setup
chmod +x bin/agent-helpers/*.sh
./bin/agent-helpers/setup-agent-environment.sh --payload

# Test
npx playwright test --project=payload

# Capture proof
docker compose -f docker-compose.payload.yml logs > payload-logs.txt

# Cleanup
./bin/agent-helpers/teardown-agent-environment.sh
```

---

## Part 5: Troubleshooting for Agents

### Port Conflicts

If ports are in use:

```bash
# Check what's using ports
lsof -ti:3000 -ti:8080 -ti:5432 | xargs kill -9

# Or modify docker-compose files to use different ports
```

### Container Build Failures

```bash
# Build individually to see errors
docker compose -f docker-compose.payload.yml build --no-cache

# Check logs
docker compose -f docker-compose.payload.yml logs
```

### Timeout Issues

Increase timeout values in scripts:

```bash
# Change from:
timeout 60 bash -c '...'

# To:
timeout 180 bash -c '...'
```

---

## Part 6: Pre-Built Images (Optional)

For faster agent startup, pre-build and cache images:

### Build Script

Create `bin/agent-helpers/build-images.sh`:

```bash
#!/bin/bash
set -e

echo "🔨 Building agent environment images..."

# Build Payload
docker compose -f docker-compose.payload.yml build

# Build Legacy
docker compose -f docker-compose.legacy.yml build --build-arg

echo "✅ Images built and ready"
```

### Cache in CI

```yaml
- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

---

## Summary

Automated agents now have:

✅ **Self-contained Docker Compose setups** for both Payload and Legacy
✅ **Automated startup scripts** with health checks
✅ **Playwright integration** for UI testing
✅ **Screenshot capabilities** for proof of functionality
✅ **GitHub Actions workflow** examples
✅ **Cleanup scripts** for environment teardown

These containerized environments allow agents to:
- Test changes with real applications
- Take screenshots for verification
- Run end-to-end tests automatically
- Prove functionality without network dependencies

All services run on localhost and are accessible to Playwright for automated testing and screenshot capture.
