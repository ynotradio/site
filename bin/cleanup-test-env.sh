#!/bin/bash
# Cleanup test environment
# Run this if you're having issues with E2E tests

set -e

echo "🧹 Cleaning up test environment..."

# Stop and remove all containers, networks, and volumes
echo "   Stopping containers..."
docker compose down -v 2>/dev/null || true

# Remove any dangling images or build cache
echo "   Pruning Docker system..."
docker system prune -f

# Clear any stuck ports
echo "   Checking for processes on test ports..."
lsof -ti:3000,5432 | xargs kill -9 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. docker compose up -d"
echo "  2. yarn seed:payload"
echo "  3. yarn test:e2e"
