#!/usr/bin/env bash
set -euo pipefail

#
# Setup E2E Test Environment
# This script encapsulates environment configuration logic from .github/workflows/e2e.yml
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔧 Setting up E2E test environment files..."

# Cloudinary credentials should come from environment (e.g., GitHub secrets)
# For local dev, set these in your shell or leave empty if not needed
CLOUDINARY_CLOUD_NAME="${CLOUDINARY_CLOUD_NAME:-}"
CLOUDINARY_API_KEY="${CLOUDINARY_API_KEY:-}"
CLOUDINARY_API_SECRET="${CLOUDINARY_API_SECRET:-}"

# Create .env.local with Payload CMS and PostgreSQL configuration
# Note: Using unquoted EOF to allow variable expansion for Cloudinary vars
cat > "$PROJECT_ROOT/.env.local" << EOF
# Payload Core
PAYLOAD_SECRET=dev-only-secret
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
PORT=3000

# Configure for Payload CMS with local Docker Postgres
DATABASE_URI=postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev
DATABASE_SSL=disable

# Security
PAYLOAD_CORS=http://localhost:3000,http://localhost:5173
PAYLOAD_CSRF=http://localhost:3000
PAYLOAD_RATE_LIMIT=300

# Media Storage (injected from environment variables)
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}

# Configure PostgreSQL connection for PHP site (must match docker-compose service name)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DATABASE=ynot_payload_dev
POSTGRES_USER=ynot_postgres_user
POSTGRES_PASSWORD=ynot_postgres_pass
POSTGRES_SSL_MODE=disable

# Enable Postgres mode for legacy PHP site
USE_POSTGRES_CONCERTS=true
USE_POSTGRES_ONDEMAND=true
USE_POSTGRES_DEEJAYS=true
USE_POSTGRES_MUSIC=true
USE_POSTGRES_STORIES=true
USE_POSTGRES_CDOFTHEWEEK=true
USE_POSTGRES_SCHEDULE=true
USE_POSTGRES_CUSTOMTEXT=true

# Configure for legacy PHP site with MySQL (inside Docker network)
DB_HOST=mysql
DB_PORT=3306
DB_NAME=ynot_site
DB_USER=root
DB_PASSWORD=root

# Auth0 configuration (for E2E tests)
AUTH0_DOMAIN=test.auth0.com
AUTH0_CLIENT_ID=test_client_id
AUTH0_CLIENT_SECRET=test_client_secret

# Development auto-login
PAYLOAD_DEV_EMAIL=admin@ynotradio.net
PAYLOAD_DEV_PASSWORD=password
EOF

echo "✅ Created .env.local"
echo "✅ E2E environment setup complete!"

