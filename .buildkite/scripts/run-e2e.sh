#!/usr/bin/env bash
# .buildkite/scripts/run-e2e.sh
# Runs Playwright E2E tests against Payload CMS + Legacy PHP in Docker Compose.
# Called by pipeline-ci.yml — extracted from inline YAML for testability.

set -euo pipefail

# --- GHCR login
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

# --- Pull pre-built images in parallel; build Payload locally (esbuild DinD mismatch)
echo "📦 Building and pulling images..."
docker pull ghcr.io/ynotradio/site/phpfpm-dev:latest &
docker pull ghcr.io/ynotradio/site/playwright:latest &
docker build --load -t ghcr.io/ynotradio/site/payload-dev:latest -f Dockerfile.payload .
wait

# --- Start databases
echo "🗄️ Starting databases..."
docker compose -f docker-compose.e2e.yml up -d postgres mysql

echo "⏳ Waiting for databases..."
for i in $(seq 1 10); do
  sleep 3
  PG=$(docker compose -f docker-compose.e2e.yml ps postgres --format json | jq -r '.Health // "starting"')
  MY=$(docker compose -f docker-compose.e2e.yml ps mysql --format json | jq -r '.Health // "starting"')
  echo "DB check $i/10: postgres=$PG mysql=$MY"
  [ "$PG" = "healthy" ] && [ "$MY" = "healthy" ] && break
done

# --- Start Payload and PHP/Apache (they don't depend on each other)
echo "🚀 Starting Payload CMS and PHP/Apache..."
docker compose -f docker-compose.e2e.yml up -d payload phpfpm apache

# --- Wait for Payload
echo "⏳ Waiting for Payload to be healthy..."
for i in $(seq 1 60); do
  sleep 5
  HEALTH=$(docker compose -f docker-compose.e2e.yml ps payload --format json 2>/dev/null | jq -r '.Health // "unknown"' || echo "unknown")
  STATE=$(docker compose -f docker-compose.e2e.yml ps payload --format json 2>/dev/null | jq -r '.State // "unknown"' || echo "unknown")

  [ "$HEALTH" = "healthy" ] && echo "✅ Payload is healthy! (check $i)" && break

  if [ "$HEALTH" = "unhealthy" ] || [ "$STATE" = "exited" ]; then
    echo "❌ Payload container failed! state=$STATE health=$HEALTH"
    docker compose -f docker-compose.e2e.yml logs payload --tail=200
    exit 1
  fi

  if [ -z "$STATE" ] || [ "$STATE" = "unknown" ]; then
    RUNNING=$(docker compose -f docker-compose.e2e.yml ps payload --format json 2>/dev/null | jq -r 'length // 0' || echo "0")
    if [ "$RUNNING" = "0" ] || [ -z "$RUNNING" ]; then
      echo "⚠️ Payload container not found (check $i), checking logs..."
      docker compose -f docker-compose.e2e.yml logs payload --tail=50
    fi
  fi

  # Log every 6th check (~30s)
  if [ $((i % 6)) -eq 0 ]; then
    echo "Payload check $i: state=$STATE health=$HEALTH"
    docker compose -f docker-compose.e2e.yml logs payload --tail=5
  fi
done

# Fail fast if Payload never became healthy
PAYLOAD_FINAL=$(docker compose -f docker-compose.e2e.yml ps payload --format json 2>/dev/null | jq -r '.Health // "unknown"' || echo "unknown")
if [ "$PAYLOAD_FINAL" != "healthy" ]; then
  echo "❌ Payload failed to become healthy after 300s (health=$PAYLOAD_FINAL)"
  docker compose -f docker-compose.e2e.yml logs payload --tail=100
  docker compose -f docker-compose.e2e.yml down -v
  exit 1
fi

# --- Wait for Apache
echo "⏳ Checking Apache..."
for i in $(seq 1 12); do
  APACHE_HEALTH=$(docker compose -f docker-compose.e2e.yml ps apache --format json 2>/dev/null | jq -r '.Health // "unknown"' || echo "unknown")
  [ "$APACHE_HEALTH" = "healthy" ] && echo "✅ Apache is healthy! (check $i)" && break
  [ $((i % 3)) -eq 0 ] && echo "Apache check $i: health=$APACHE_HEALTH"
  sleep 5
done

APACHE_FINAL=$(docker compose -f docker-compose.e2e.yml ps apache --format json 2>/dev/null | jq -r '.Health // "unknown"' || echo "unknown")
if [ "$APACHE_FINAL" != "healthy" ]; then
  echo "❌ Apache failed to become healthy after 60s (health=$APACHE_FINAL)"
  docker compose -f docker-compose.e2e.yml logs apache --tail=50
  docker compose -f docker-compose.e2e.yml down -v
  exit 1
fi

# --- Pre-create writable artifact dirs so the playwright container (running
# as root in the bind mount) can write to them and host can read them back.
mkdir -p test-results playwright-report
chmod -R 0777 test-results playwright-report

# --- Run tests
echo "🎭 Running Playwright E2E tests..."
docker compose -f docker-compose.e2e.yml run --rm playwright
TEST_EXIT=$?

echo "📊 Test results: exit code $TEST_EXIT"
docker compose -f docker-compose.e2e.yml down -v
exit $TEST_EXIT
