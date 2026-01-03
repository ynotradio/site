#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "🚀 Starting containerized Payload for automated agents"
echo "======================================================"

# Start services
echo "📦 Building and starting containers..."
docker compose -f docker-compose.payload.yml up -d --build

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker compose -f docker-compose.payload.yml exec -T postgres pg_isready -U payload > /dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
        echo "❌ PostgreSQL failed to start after $MAX_ATTEMPTS attempts"
        docker compose -f docker-compose.payload.yml logs postgres
        exit 1
    fi
    sleep 2
    echo -n "."
done
echo ""
echo "✅ PostgreSQL ready"

# Wait for Payload
echo "⏳ Waiting for Payload..."
ATTEMPTS=0
MAX_ATTEMPTS=60
until curl -s http://localhost:3000/api/users > /dev/null 2>&1; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
        echo "❌ Payload failed to start after $MAX_ATTEMPTS attempts"
        docker compose -f docker-compose.payload.yml logs payload
        exit 1
    fi
    sleep 3
    echo -n "."
done
echo ""
echo "✅ Payload ready"

echo ""
echo "🎉 Payload CMS is running!"
echo "   Admin UI: http://localhost:3000/admin"
echo "   API: http://localhost:3000/api"
echo "   GraphQL: http://localhost:3000/api/graphql"
echo ""
echo "📝 Logs: docker compose -f docker-compose.payload.yml logs -f"
echo "🛑 Stop: docker compose -f docker-compose.payload.yml down"
