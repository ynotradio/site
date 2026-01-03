#!/bin/bash

# Script for Copilot agents to verify legacy PHP/MySQL site
# This script starts Docker containers and runs health checks
# Usage: ./bin/agent-helpers/verify-legacy.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Legacy PHP/MySQL Site Verification Script for Copilot Agents"
echo "================================================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker Desktop or Docker daemon"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    exit 1
fi

echo "✅ Found docker-compose.yml"
echo ""

# Check for .env.local for Docker environment variables
if [ ! -f "$PROJECT_ROOT/.env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "   Docker will use default values from docker-compose.yml"
    echo ""
fi

# Stop any existing containers
echo "🧹 Cleaning up any existing containers..."
cd "$PROJECT_ROOT"
echo "⚠️  Note: This will remove volumes and delete any data in the containers"
echo "   If you have persistent data, use 'docker-compose down' instead"
sleep 2
docker-compose down -v > /dev/null 2>&1 || true
echo "✅ Cleanup complete"
echo ""

# Start Docker containers
echo "🚀 Starting Docker containers..."
echo "   This may take a minute on first run (downloading images)..."
echo ""

docker-compose up -d

echo ""
echo "✅ Containers started"
echo ""

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if docker-compose exec -T mysql mysqladmin ping -h localhost -u root -proot > /dev/null 2>&1; then
        echo "✅ MySQL is ready!"
        echo ""
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
    echo -n "."
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo "❌ MySQL failed to start after 60 seconds"
    echo "   Check logs: docker-compose logs mysql"
    exit 1
fi

# Wait for Apache/PHP to be ready
echo "⏳ Waiting for Apache/PHP to be ready..."
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✅ Apache/PHP is ready!"
        echo ""
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
    echo -n "."
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo ""
    echo "❌ Apache/PHP failed to start after 60 seconds"
    echo "   Check logs: docker-compose logs apache"
    exit 1
fi

# Run health checks
echo "🏥 Running health checks..."
echo ""

# Check main site
echo "1. Checking main site (http://localhost:8080)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Main site responding (HTTP $HTTP_STATUS)"
else
    echo "   ⚠️  Main site returned HTTP $HTTP_STATUS"
fi

# Check PHPMyAdmin
echo "2. Checking PHPMyAdmin (http://localhost:8181)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8181)
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo "   ✅ PHPMyAdmin accessible (HTTP $HTTP_STATUS)"
else
    echo "   ⚠️  PHPMyAdmin returned HTTP $HTTP_STATUS"
fi

# Check MySQL connection
echo "3. Checking MySQL connection..."
if docker-compose exec -T mysql mysql -u ynot_sql_user -pynot_sql_pass ynot_site -e "SELECT 1" > /dev/null 2>&1; then
    echo "   ✅ MySQL connection successful"
else
    echo "   ⚠️  MySQL connection failed"
fi

# Check database tables
echo "4. Checking database tables..."
TABLE_COUNT=$(docker-compose exec -T mysql mysql -u ynot_sql_user -pynot_sql_pass ynot_site -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'ynot_site'" 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "   ✅ Found $TABLE_COUNT tables in database"
else
    echo "   ⚠️  No tables found in database (may need to import schema)"
    echo "   💡 Run: ./bin/import_db.sh (if you have ynot_db.sql)"
fi

# Check PHP version
echo "5. Checking PHP version..."
PHP_VERSION=$(docker-compose exec -T phpfpm php -v 2>/dev/null | head -n 1 || echo "Unknown")
echo "   ℹ️  $PHP_VERSION"

echo ""
echo "🎉 Verification Complete!"
echo ""
echo "📊 Summary:"
echo "   - Main site: http://localhost:8080"
echo "   - PHPMyAdmin: http://localhost:8181"
echo "     - Server: mysql"
echo "     - Username: ynot_sql_user"
echo "     - Password: ynot_sql_pass"
echo "     - Database: ynot_site"
echo ""
echo "🐳 Docker Containers:"
docker-compose ps
echo ""
echo "📋 Useful Commands:"
echo "   - View logs: docker-compose logs -f [service]"
echo "   - Stop containers: docker-compose down"
echo "   - Restart containers: docker-compose restart"
echo "   - Execute MySQL: docker-compose exec mysql mysql -u root -proot ynot_site"
echo "   - Import database: ./bin/import_db.sh"
echo ""
echo "📝 Note: Containers will keep running in the background"
echo "   To stop them: docker-compose down"
echo ""
