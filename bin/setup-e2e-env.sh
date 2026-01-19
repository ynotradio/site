#!/usr/bin/env bash
set -euo pipefail

#
# Setup E2E Test Environment
# This script encapsulates environment configuration logic from .github/workflows/e2e.yml
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔧 Setting up E2E test environment files..."

# Create .env.local with Payload CMS and PostgreSQL configuration
cat > "$PROJECT_ROOT/.env.local" << 'EOF'
# Configure for Payload CMS with Postgres
DATABASE_URI=postgresql://ynot_postgres_user:ynot_postgres_pass@localhost:5432/ynot_payload_dev

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

# Auth0 configuration (dummy values for E2E tests)
AUTH0_DOMAIN=test.auth0.com
AUTH0_CLIENT_ID=test_client_id
AUTH0_CLIENT_SECRET=test_client_secret
EOF

echo "✅ Created .env.local"

# Create PHP .env file for Postgres mode
mkdir -p "$PROJECT_ROOT/src/partials"
cat > "$PROJECT_ROOT/src/partials/.env" << 'EOF'
AUTH0_CLIENT_ID=test_client_id
AUTH0_DOMAIN=test.auth0.com
AUTH0_CLIENT_SECRET=test_client_secret

# MySQL Database Connection (Legacy)
DB_NAME=ynot_site
DB_USER=root
DB_PASSWORD=root
DB_HOST=mysql
DB_PORT=3306

# PostgreSQL Connection (Local Docker for E2E tests)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DATABASE=ynot_payload_dev
POSTGRES_USER=ynot_postgres_user
POSTGRES_PASSWORD=ynot_postgres_pass
POSTGRES_SSL_MODE=disable

USE_POSTGRES_CONCERTS=true
USE_POSTGRES_ONDEMAND=true
USE_POSTGRES_DEEJAYS=true
USE_POSTGRES_MUSIC=true
USE_POSTGRES_STORIES=true
USE_POSTGRES_CDOFTHEWEEK=true
USE_POSTGRES_SCHEDULE=true
USE_POSTGRES_CUSTOMTEXT=true
EOF

echo "✅ Created src/partials/.env"
echo "✅ E2E environment setup complete!"
