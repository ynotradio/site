#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

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
    *) echo "Unknown option: $1"; echo "Usage: $0 [--payload] [--legacy] [--all]"; exit 1 ;;
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
  "$SCRIPT_DIR/start-payload-containerized.sh"
fi

# Start Legacy if requested
if [ "$LEGACY" = true ]; then
  echo ""
  echo "🏛️  Starting Legacy Site..."
  "$SCRIPT_DIR/start-legacy-containerized.sh"
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
echo "🎭 Ready for Playwright testing and screenshots"
echo ""
echo "📸 Take screenshots with:"
echo "   npx playwright test"
echo ""
echo "🛑 To stop all services:"
echo "   $SCRIPT_DIR/teardown-agent-environment.sh"
