#!/bin/bash
# Initialize Postgres with Payload schema and seed data
# This runs automatically on first container start via docker-entrypoint-initdb.d

set -e

echo "🔧 Initializing Payload database schema and seed data..."

# Wait for Postgres to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready"

# Change to app directory
cd /app

# Install dependencies (using cache if available)
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile --production=false

# Create .env.local for Payload config
cat > .env.local << EOF
PAYLOAD_SECRET=agent-testing-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
PORT=3000
DATABASE_URI=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}
DATABASE_SSL=disable
PAYLOAD_CORS=*
PAYLOAD_CSRF=
PAYLOAD_RATE_LIMIT=300
EOF

# Run Payload migrations to create schema
echo "🔄 Running Payload migrations..."
yarn payload migrate

# Seed the database with sample data
echo "🌱 Seeding database with sample data..."
yarn tsx bin/seed-payload.ts

echo "✅ Database initialization complete!"
echo "📊 Database is ready with schema and sample data"

# Clean up to reduce image size
rm -rf node_modules/.cache
rm -rf .next

echo "🎉 Seeded Postgres image ready for agent testing"
