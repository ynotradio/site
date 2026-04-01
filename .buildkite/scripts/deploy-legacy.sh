#!/usr/bin/env bash
# .buildkite/scripts/deploy-legacy.sh
# Deploys the legacy PHP site to production.
# Mirrors bin/deploy.sh + bin/pre-deploy.sh, adapted for Buildkite CI environment.
# Called by pipeline-deploy-legacy.yml — extracted from inline YAML for maintainability.

set -euo pipefail

echo "--- :package: Installing rsync and openssh-client"
apk add --no-cache rsync openssh-client

echo "--- :key: Configuring SSH"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
buildkite-agent secret get DEPLOY_SSH_KEY > ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key
buildkite-agent secret get DEPLOY_SSH_KNOWN_HOSTS >> ~/.ssh/known_hosts
chmod 644 ~/.ssh/known_hosts
DEPLOY_HOST="$(buildkite-agent secret get DEPLOY_SSH_HOST)"

echo "--- :key: Writing .env.php from secret"
buildkite-agent secret get ENV_PHP_CONTENTS > .env.php

echo "--- :composer: Running composer install (no-dev)"
cd src
composer install --no-dev --optimize-autoloader --no-interaction
cd ..

echo "--- :package: Creating backup on server"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
ssh -i ~/.ssh/deploy_key "bitnami@${DEPLOY_HOST}" \
  "mkdir -p ~/backups/htdocs && \
  cd /opt/bitnami/apache2 && \
  tar -czf ~/backups/htdocs/htdocs_backup_${TIMESTAMP}.tar.gz --transform 's,^htdocs/,,' htdocs/ && \
  echo 'Backup created: ~/backups/htdocs/htdocs_backup_${TIMESTAMP}.tar.gz' && \
  cd ~/backups/htdocs && \
  ls -t htdocs_backup_*.tar.gz | tail -n +16 | xargs -r rm -f && \
  echo 'Cleaned up old backups, keeping latest 15'"

echo "--- :outbox_tray: Syncing files to server"
rsync -avz --delete \
  --exclude 'vendor' \
  --exclude '.git' \
  --exclude '.env*' \
  --exclude 'images' \
  --exclude 'imgs' \
  --chmod=D755,F644 \
  --rsync-path="sudo rsync" \
  -e "ssh -i ~/.ssh/deploy_key" \
  src/ "bitnami@${DEPLOY_HOST}:~/htdocs/"

echo "--- :key: Copying .env file"
rsync -avz \
  --chmod=F644 \
  --rsync-path="sudo rsync" \
  -e "ssh -i ~/.ssh/deploy_key" \
  .env.php "bitnami@${DEPLOY_HOST}:~/htdocs/.env"

echo "--- :composer: Running composer install on server"
ssh -i ~/.ssh/deploy_key "bitnami@${DEPLOY_HOST}" \
  "sudo chown -R bitnami:daemon ~/htdocs/vendor && \
  cd ~/htdocs && composer install --no-dev --optimize-autoloader --no-interaction"

echo "--- :white_check_mark: Deploy complete!"
