#!/bin/bash
# Deployment script for Modern Rock Madness 2025 changes

REMOTE_HOST="ynotradio"
REMOTE_BASE_PATH="/opt/bitnami/apache/htdocs"

# Create directories if they don't exist
echo "Creating necessary directories on remote server..."
ssh $REMOTE_HOST "mkdir -p $REMOTE_BASE_PATH/partials"
ssh $REMOTE_HOST "mkdir -p $REMOTE_BASE_PATH/db/migrations"

# Copying updated files
echo "Copying updated files to remote server..."

# Core MRM files
echo "Deploying core MRM files..."
scp -p /Users/tj_nicolaides/Sites/ynotradio/site/src/madness.php $REMOTE_HOST:$REMOTE_BASE_PATH/
scp -p /Users/tj_nicolaides/Sites/ynotradio/site/src/madness_view.php $REMOTE_HOST:$REMOTE_BASE_PATH/
scp -p /Users/tj_nicolaides/Sites/ynotradio/site/src/functions/mrm_fns.php $REMOTE_HOST:$REMOTE_BASE_PATH/functions/

# MRM configuration files
echo "Deploying MRM configuration files..."
scp -p /Users/tj_nicolaides/Sites/ynotradio/site/src/partials/_mrm_config.php $REMOTE_HOST:$REMOTE_BASE_PATH/partials/
scp -p /Users/tj_nicolaides/Sites/ynotradio/site/src/partials/.env.example $REMOTE_HOST:$REMOTE_BASE_PATH/partials/
scp -p /Users/tj_nicolaides/Sites/ynotradio/site/src/partials/__env_loader.php $REMOTE_HOST:$REMOTE_BASE_PATH/partials/

# Database function updates
echo "Deploying database function updates..."
scp -p /Users/tj_nicolaides/Sites/ynotradio/site/src/functions/main_fns.php $REMOTE_HOST:$REMOTE_BASE_PATH/functions/
scp -p /Users/tj_nicolaides/Sites/ynotradio/site/src/db/migrations/mrm_matches_reset.csv $REMOTE_HOST:$REMOTE_BASE_PATH/db/migrations/

# Creating .env file on the remote server if it doesn't exist
echo "Setting up environment variables..."
ssh $REMOTE_HOST "if [ ! -f $REMOTE_BASE_PATH/partials/.env ]; then cp $REMOTE_BASE_PATH/partials/.env.example $REMOTE_BASE_PATH/partials/.env; fi"

# Checking for errors
if [ $? -eq 0 ]; then
    echo "========================================"
    echo "Deployment completed successfully!"
    echo "========================================"
    echo "Next steps:"
    echo "1. SSH into the server and verify the deployment"
    echo "2. Check that the MRM site is working correctly"
    echo "3. If needed, update the database settings in $REMOTE_BASE_PATH/partials/.env"
else
    echo "========================================"
    echo "Deployment encountered errors. Please check the output above."
    echo "========================================"
fi