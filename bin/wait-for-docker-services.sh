#!/usr/bin/env bash
set -euo pipefail

#
# Wait for Docker Services to be Ready
# This script encapsulates Docker service readiness checks from .github/workflows/e2e.yml
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U ynot_postgres_user -d ynot_payload_dev > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ PostgreSQL failed to start after 60 seconds"
    exit 1
  fi
  echo "   Waiting for PostgreSQL... ($i/30)"
  sleep 2
done

# Wait for MySQL
echo "⏳ Waiting for MySQL to be ready..."
for i in {1..30}; do
  if docker compose exec -T -e MYSQL_PWD=root mysql mysqladmin ping -h localhost -u root > /dev/null 2>&1; then
    echo "✅ MySQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ MySQL failed to start after 60 seconds"
    exit 1
  fi
  echo "   Waiting for MySQL... ($i/30)"
  sleep 2
done

# Wait for Apache
echo "⏳ Waiting for Apache to be ready..."
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|301\|302"; then
    echo "✅ Apache is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Apache failed to start after 60 seconds"
    exit 1
  fi
  echo "   Waiting for Apache... ($i/30)"
  sleep 2
done

echo "✅ All Docker services are ready!"
