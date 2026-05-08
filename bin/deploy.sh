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

# Copy the .env file from root .env.php to server .env, preserving
# production's USE_POSTGRES_* feature flag values. Content managers
# control these flags directly on the server; without this merge, every
# deploy would clobber them with whatever the developer happens to have
# locally (the regression that prompted this script change).
echo "🔑 Merging .env (preserving production USE_POSTGRES_* flags)..."
mkdir -p tmp
MERGED_ENV="tmp/.env.deploy.$$"
REMOTE_FLAGS_FILE="tmp/.env.remote-flags.$$"
trap 'rm -f "$MERGED_ENV" "$REMOTE_FLAGS_FILE"' EXIT

ssh ynotradio 'sudo grep "^USE_POSTGRES_" /opt/bitnami/apache/htdocs/.env 2>/dev/null' > "$REMOTE_FLAGS_FILE" || true

if [ ! -s "$REMOTE_FLAGS_FILE" ]; then
    echo "  ⚠️  No remote .env found (or no USE_POSTGRES_* flags in it). Pushing local .env.php as-is."
    cp .env.php "$MERGED_ENV"
else
    echo "  Preserving the following production flag values:"
    sed 's/^/    /' "$REMOTE_FLAGS_FILE"
    awk '
        NR == FNR {
            idx = index($0, "=")
            if (idx > 0) remote[substr($0, 1, idx-1)] = substr($0, idx+1)
            next
        }
        {
            idx = index($0, "=")
            if (idx > 0) {
                k = substr($0, 1, idx-1)
                if (k in remote) {
                    print k "=" remote[k]
                    delete remote[k]
                    next
                }
            }
            print
        }
        END {
            # Any production flags that no longer exist in local .env.php are
            # dropped intentionally (e.g., when a feature flag is retired).
            for (k in remote) {
                print "  ℹ️  dropping " k " (no longer defined in .env.php)" > "/dev/stderr"
            }
        }
    ' "$REMOTE_FLAGS_FILE" .env.php > "$MERGED_ENV"
fi

# Back up the current production .env before overwriting, so a botched
# deploy can be reverted with a one-line ssh command.
ssh ynotradio 'sudo cp /opt/bitnami/apache/htdocs/.env /opt/bitnami/apache/htdocs/.env.predeploy 2>/dev/null || true'

rsync -avz \
    --chmod=F644 \
    --rsync-path="sudo rsync" \
    "$MERGED_ENV" ynotradio:~/htdocs/.env

# Run composer install on the server with correct permissions
echo "📦 Running composer install on server..."
ssh ynotradio "sudo chown -R bitnami:daemon ~/htdocs/vendor && cd ~/htdocs && composer install --no-dev --optimize-autoloader --no-interaction"

echo "✅ Deployment complete!"