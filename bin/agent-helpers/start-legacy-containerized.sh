#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 Starting containerized legacy site for automated agents"
echo "=========================================================="

# Start services
echo "📦 Building and starting containers..."
docker compose -f docker-compose.legacy.yml up -d --build

# Wait for MySQL
echo "⏳ Waiting for MySQL..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker compose -f docker-compose.legacy.yml exec -T mysql mysqladmin ping -h localhost -u root -proot > /dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
        echo "❌ MySQL failed to start after $MAX_ATTEMPTS attempts"
        docker compose -f docker-compose.legacy.yml logs mysql
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo ""
echo "✅ MySQL ready"

# Wait for Apache
echo "⏳ Waiting for Apache..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until curl -s http://localhost:8080 > /dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
        echo "❌ Apache failed to start after $MAX_ATTEMPTS attempts"
        docker compose -f docker-compose.legacy.yml logs apache
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo ""
echo "✅ Apache ready"

echo ""
echo "🎉 Legacy site is running!"
echo "   Main site: http://localhost:8080"
echo "   MySQL: localhost:3306"
echo "   - User: ynot_sql_user"
echo "   - Pass: ynot_sql_pass"
echo "   - DB: ynot_site"
echo ""
echo "📝 Logs: docker compose -f docker-compose.legacy.yml logs -f"
echo "🛑 Stop: docker compose -f docker-compose.legacy.yml down"
