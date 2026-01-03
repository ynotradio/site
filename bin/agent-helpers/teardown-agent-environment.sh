#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "🧹 Tearing down agent environment..."

# Stop Payload
if docker compose -f docker-compose.payload.yml ps -q 2>/dev/null | grep -q .; then
  echo "   Stopping Payload..."
  docker compose -f docker-compose.payload.yml down -v
fi

# Stop Legacy
if docker compose -f docker-compose.legacy.yml ps -q 2>/dev/null | grep -q .; then
  echo "   Stopping Legacy..."
  docker compose -f docker-compose.legacy.yml down -v
fi

echo "✅ Environment cleaned up"
