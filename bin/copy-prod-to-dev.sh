#!/bin/bash
# Copy production database to development
# This script copies all data from the Neon production database to development.
# This is useful for testing with production data or for weekly backups.
#
# Usage: ./bin/copy-prod-to-dev.sh

set -e

echo "🚀 Y-Not Radio Database Copy: Production → Development"
echo ""

# Run the TypeScript script
tsx bin/copy-neon-db.ts prod dev
