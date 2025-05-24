#!/bin/bash

# Script to pull down MySQL database from Lightsail instance
# Usage: ./pull_db.sh

set -e  # Exit on error
set -x  # Enable debug output

# Source the .env file for database credentials
ENV_FILE="src/partials/.env"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
else
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Configuration
REMOTE_HOST="ynotradio"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
DB_PASSWORD="$DB_PASSWORD"
LOCAL_PATH="src/db/docker/ynot_db.sql"
REMOTE_SQL_PATH="/tmp/ynot_db.sql"

# Ensure the target directory exists
mkdir -p "$(dirname "$LOCAL_PATH")"

echo "🔍 Exporting database on remote server..."
echo "Running: ssh -v $REMOTE_HOST 'mysqldump -u $DB_USER -p'$DB_PASSWORD' $DB_NAME > $REMOTE_SQL_PATH'"

ssh -v $REMOTE_HOST "mysqldump -u $DB_USER -p'$DB_PASSWORD' $DB_NAME > $REMOTE_SQL_PATH"

if ssh $REMOTE_HOST "test -s $REMOTE_SQL_PATH"; then
    echo "📥 Copying database dump to local machine..."
    echo "Running: scp $REMOTE_HOST:$REMOTE_SQL_PATH $LOCAL_PATH"
    scp $REMOTE_HOST:$REMOTE_SQL_PATH "$LOCAL_PATH"
    ssh $REMOTE_HOST "rm $REMOTE_SQL_PATH"
    echo "✅ Database successfully exported to $LOCAL_PATH"
else
    echo "❌ Remote dump failed or file is empty."
    exit 1
fi 