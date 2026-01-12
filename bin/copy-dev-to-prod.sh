#!/bin/bash
# Copy development database to production
# This script copies all data from the Neon development database to production.
#
# WARNING: This will completely replace the production database!
# Use with caution.
#
# Usage: ./bin/copy-dev-to-prod.sh

set -e

echo "🚀 Y-Not Radio Database Copy: Development → Production"
echo ""

# Run the TypeScript script
tsx bin/copy-neon-db.ts dev prod
