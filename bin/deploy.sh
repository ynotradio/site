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

# Run pre-deployment checks and local setup
"$(dirname "$0")/pre-deploy.sh" "$@"

# Rsync the src directory to the server
echo "📤 Syncing files to server..."
rsync -avz --delete \
    --exclude 'vendor' \
    --exclude '.git' \
    --exclude '.env*' \
    --exclude 'images' \
    --exclude 'imgs' \
    --chmod=D755,F644 \
    --rsync-path="sudo rsync" \
    src/ ynotradio:~/htdocs/

# Copy the .env file
echo "🔑 Copying .env file..."
rsync -avz \
    --chmod=F644 \
    --rsync-path="sudo rsync" \
    src/partials/.env ynotradio:~/htdocs/partials/.env

# Run composer install on the server with correct permissions
echo "📦 Running composer install on server..."
ssh ynotradio "sudo chown -R bitnami:daemon ~/htdocs/vendor && cd ~/htdocs && composer install --no-dev --optimize-autoloader --no-interaction"

echo "✅ Deployment complete!"