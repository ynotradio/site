#!/bin/bash
# pre-deploy.sh
set -e

# Parse command line arguments
DRY_RUN=false
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "🔍 Running pre-deployment checks..."

# Check if rsync is installed locally
if ! command -v rsync &> /dev/null; then
    echo "❌ rsync is not installed locally. Installing..."
    brew install rsync
fi

# Check if rsync is installed on the server
echo "🔍 Checking for rsync on server..."
if ! ssh ynotradio "which rsync" > /dev/null 2>&1; then
    echo "📦 Installing rsync on server..."
    ssh ynotradio "sudo apt-get install -y rsync --no-upgrade"
fi

# Check if .env.php file exists (for deployment)
if [ ! -f ".env.php" ]; then
    echo "❌ Error: .env.php file not found in repository root"
    echo "Please create .env.php from .env.php.example before deploying"
    exit 1
fi

# Check if composer.json exists
if [ ! -f "src/composer.json" ]; then
    echo "❌ Error: src/composer.json file not found"
    exit 1
fi

# Create backup of htdocs on server
echo "📦 Creating backup of htdocs..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="htdocs_backup_${TIMESTAMP}.tar.gz"
BACKUP_DIR="~/backups/htdocs"
ssh ynotradio "mkdir -p ${BACKUP_DIR} && \
    cd /opt/bitnami/apache2 && \
    tar -czf ${BACKUP_DIR}/${BACKUP_FILE} --transform 's,^htdocs/,,' htdocs/ && \
    echo 'Backup created: ${BACKUP_DIR}/${BACKUP_FILE}' && \
    cd ${BACKUP_DIR} && \
    ls -t htdocs_backup_*.tar.gz | tail -n +16 | xargs -r rm -f && \
    echo 'Cleaned up old backups, keeping latest 15'"

# Change to the src directory
cd "$(dirname "$0")/../src"

# Run composer install using Docker PHP 7.4
echo "📦 Running composer install..."
docker run --rm -v "$(pwd):/app" -w /app composer:2 composer install --no-dev --optimize-autoloader

# If this is a dry run, exit after composer install
if [ "$DRY_RUN" = true ]; then
    echo "✅ Dry run complete - only ran composer install locally"
    exit 0
fi

# Go back to root directory
cd ..

echo "✅ Pre-deployment checks passed!" 