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

# Verify server is responding
echo "✅ Payload server is ready!"
echo ""

# Optional: Ask if user wants to seed the database
read -p "Would you like to seed the database with sample data? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run payload:seed || echo "   ⚠️  Seeding failed or no seed configuration found"
    echo ""
fi

echo "🎉 Setup Complete!"
echo ""
echo "📊 Access Information:"
echo "   🌐 Admin UI: http://localhost:3000/admin"
echo "      (Create your first admin user here)"
echo ""
echo "   🔌 API endpoint: http://localhost:3000/api"
echo "   📊 GraphQL playground: http://localhost:3000/api/graphql"
echo ""
echo "   📝 Server logs: $TMP_DIR/payload-server.log"
echo "   🔧 Server PID: $PAYLOAD_PID"
echo ""
echo "💡 Next Steps:"
echo "   1. Open http://localhost:3000/admin in your browser"
echo "   2. Create an admin user account"
echo "   3. Log in and explore the collections"
echo "   4. Test your changes by using the app"
echo ""
echo "🛑 To stop the server:"
echo "   kill $PAYLOAD_PID"
echo "   or press Ctrl+C to exit this script"
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
