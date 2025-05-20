#!/bin/bash
# deploy.sh
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

echo "🚀 Starting deployment process..."

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

# Check if rsync is installed on the server and install if needed
echo "🔍 Checking for rsync on server..."
if ! ssh ynotradio "which rsync" > /dev/null 2>&1; then
    echo "📦 Installing rsync on server..."
    ssh ynotradio "sudo apt-get install -y rsync --no-upgrade"
fi

# Go back to root directory
cd ..

# Rsync the src directory to the server
echo "📤 Syncing files to server..."
rsync -avz --delete \
    --exclude 'vendor' \
    --exclude '.git' \
    --exclude '.env' \
    src/ ynotradio:~/htdocs/

# Copy the .env file
echo "🔑 Copying .env file..."
rsync -avz src/partials/.env ynotradio:~/htdocs/partials/.env

# Run composer install on the server
echo "📦 Running composer install on server..."
ssh ynotradio "cd ~/htdocs && composer install --no-dev --optimize-autoloader --no-interaction"

echo "✅ Deployment complete!"