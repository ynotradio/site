#!/bin/bash
# Setup Payload database with schema and seed data
# Run this after `docker-compose up postgres` starts

set -e

echo "🔧 Setting up Payload database..."

# Check if postgres is running
if ! nc -z localhost 5432 2>/dev/null; then
  echo "❌ PostgreSQL is not running on localhost:5432"
  echo "   Start it with: docker-compose up -d postgres"
  exit 1
fi

echo "✅ PostgreSQL is running"

# Set DATABASE_URI for this session
export DATABASE_URI="postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev"
export DATABASE_SSL="disable"

# Run Payload migrations
echo "🔄 Running Payload migrations..."
yarn payload migrate

# Seed the database
echo "🌱 Seeding database with sample data..."
yarn seed:payload

echo ""
echo "✅ Database setup complete!"
echo "📊 Postgres ready at: postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev"
echo ""
echo "Next steps:"
echo "  yarn dev    # Start Payload application"
