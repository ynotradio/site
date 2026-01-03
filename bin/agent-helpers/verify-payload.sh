#!/bin/bash

# Script for Copilot agents to verify Payload CMS instance
# This script starts Payload, waits for it to be ready, and runs health checks
# Usage: ./bin/agent-helpers/verify-payload.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Payload CMS Verification Script for Copilot Agents"
echo "======================================================"
echo ""

# Check if .env.local exists
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    echo "❌ Error: .env.local not found!"
    echo ""
    echo "📝 To set up your environment:"
    echo "   1. Copy .env.example to .env.local:"
    echo "      cp .env.example .env.local"
    echo "   2. Update DATABASE_URI with your PostgreSQL connection string"
    echo "   3. Update PAYLOAD_SECRET with a secure secret"
    echo "   4. Update Cloudinary credentials if testing media uploads"
    echo ""
    exit 1
fi

echo "✅ Found .env.local"
echo ""

# Check if node_modules exists
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd "$PROJECT_ROOT"
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Check if DATABASE_URI is set
source "$PROJECT_ROOT/.env.local"
if [ -z "$DATABASE_URI" ] && [ -z "$NEON_DEV_DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URI or NEON_DEV_DATABASE_URL not set in .env.local"
    echo "   Update your .env.local with a valid PostgreSQL connection string"
    exit 1
fi

echo "✅ Database connection configured"
echo ""

# Run database migrations
echo "🔄 Running Payload migrations..."
cd "$PROJECT_ROOT"
TMP_DIR="$PROJECT_ROOT/.agent-tmp"
mkdir -p "$TMP_DIR"
npm run payload:migrate 2>&1 | tee "$TMP_DIR/payload-migrate.log" || {
    echo "❌ Migration failed. Check the output above."
    exit 1
}
echo "✅ Migrations complete"
echo ""

# Start Payload in background
echo "🚀 Starting Payload server..."
cd "$PROJECT_ROOT"
TMP_DIR="$PROJECT_ROOT/.agent-tmp"
mkdir -p "$TMP_DIR"
npm run payload:dev > "$TMP_DIR/payload-server.log" 2>&1 &
PAYLOAD_PID=$!

# Save PID to file for cleanup
echo $PAYLOAD_PID > "$TMP_DIR/payload-server.pid"

echo "   PID: $PAYLOAD_PID"
echo "   Logs: $TMP_DIR/payload-server.log"
echo ""

# Function to cleanup
cleanup() {
    if [ -f "$TMP_DIR/payload-server.pid" ]; then
        SAVED_PID=$(cat "$TMP_DIR/payload-server.pid")
        if kill -0 $SAVED_PID 2>/dev/null; then
            echo ""
            echo "🧹 Stopping Payload server (PID: $SAVED_PID)..."
            kill $SAVED_PID 2>/dev/null || true
            sleep 2
            kill -9 $SAVED_PID 2>/dev/null || true
        fi
        rm "$TMP_DIR/payload-server.pid"
    fi
}

trap cleanup EXIT

# Wait for Payload to start
echo "⏳ Waiting for Payload to start (checking every 2 seconds)..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3000/api/users > /dev/null 2>&1; then
        echo "✅ Payload is ready!"
        echo ""
        break
    fi
    
    # Check if process is still running
    if ! kill -0 $PAYLOAD_PID 2>/dev/null; then
        echo "❌ Payload process died. Check logs at $TMP_DIR/payload-server.log"
        tail -n 50 "$TMP_DIR/payload-server.log"
        exit 1
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
    echo -n "."
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo "❌ Payload failed to start after 60 seconds"
    echo "   Check logs at: $TMP_DIR/payload-server.log"
    tail -n 50 "$TMP_DIR/payload-server.log"
    exit 1
fi

# Run health checks
echo "🏥 Running health checks..."
echo ""

# Check API endpoint
echo "1. Checking API endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/users)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ API endpoint responding (HTTP $HTTP_STATUS)"
else
    echo "   ⚠️  API endpoint returned HTTP $HTTP_STATUS"
fi

# Check Admin UI
echo "2. Checking Admin UI..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin)
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo "   ✅ Admin UI accessible (HTTP $HTTP_STATUS)"
else
    echo "   ⚠️  Admin UI returned HTTP $HTTP_STATUS"
fi

# Run TypeScript health check if available
echo "3. Running comprehensive health check..."
if [ -f "$SCRIPT_DIR/health-check-payload.ts" ]; then
    npx tsx "$SCRIPT_DIR/health-check-payload.ts" || echo "   ⚠️  Some health checks failed"
else
    echo "   ⚠️  health-check-payload.ts not found, skipping"
fi

echo ""
echo "🎉 Verification Complete!"
echo ""
echo "📊 Summary:"
echo "   - Payload server running at: http://localhost:3000"
echo "   - Admin UI: http://localhost:3000/admin"
echo "   - API endpoint: http://localhost:3000/api"
echo "   - GraphQL playground: http://localhost:3000/api/graphql"
echo "   - Server PID: $PAYLOAD_PID"
echo "   - Logs: $TMP_DIR/payload-server.log"
echo ""
echo "🔧 To stop the server:"
echo "   kill $PAYLOAD_PID"
echo "   or press Ctrl+C to exit this script"
echo ""
echo "📝 To keep server running:"
echo "   Press Ctrl+C now (server will stop)"
echo "   Or use: npm run payload:dev (in another terminal)"
echo ""

# Ask if user wants to keep server running
read -p "Keep Payload server running? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Server will continue running (PID: $PAYLOAD_PID)"
    echo "   To stop later: kill $PAYLOAD_PID"
    # Don't cleanup on exit
    trap - EXIT
    echo ""
    echo "Press Ctrl+C to exit this script (server will keep running)"
    # Wait indefinitely
    tail -f "$TMP_DIR/payload-server.log"
else
    echo "🛑 Stopping server..."
    # cleanup will run via trap
fi
