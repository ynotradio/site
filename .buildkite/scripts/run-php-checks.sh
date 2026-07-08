#!/usr/bin/env bash
# .buildkite/scripts/run-php-checks.sh
# Runs PHP lint (phpcs) and/or unit tests (phpunit) inside the pinned PHP_VERSION
# image (php:7.4-fpm, same base prod runs — see bin/docker/phpfpm/Dockerfile).
#
# The docker#v5.11.0 plugin has no registry-login step, so pulling the private
# ghcr.io/ynotradio/site/phpfpm-dev image needs a manual `docker login` first;
# this mirrors the pull-with-local-build-fallback pattern in run-e2e.sh so PR
# builds without GHCR creds (e.g. from forks) still work.
#
# Usage: run-php-checks.sh <lint|test>

set -euo pipefail

CHECK="${1:?Usage: run-php-checks.sh <lint|test>}"
IMAGE="ghcr.io/ynotradio/site/phpfpm-dev:latest"

PULL_OK=false
if [ -n "${GHCR_TOKEN:-}" ] && [ -n "${GHCR_USERNAME:-}" ]; then
  if echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin; then
    docker pull "$IMAGE" && PULL_OK=true || echo "⚠️ Failed to pull phpfpm image from GHCR, falling back to local build"
  else
    echo "⚠️ GHCR login failed, falling back to local build for phpfpm"
  fi
else
  echo "⚠️ GHCR credentials not set, falling back to local build for phpfpm"
fi

[ "$PULL_OK" = true ] || docker build --load -t "$IMAGE" -f ./bin/docker/phpfpm/Dockerfile .

case "$CHECK" in
  lint)
    docker run --rm -v "$PWD":/app -w /app/src "$IMAGE" \
      sh -c "composer install --no-interaction --prefer-dist && vendor/bin/phpcs --standard=phpcs.xml --warning-severity=0"
    ;;
  test)
    docker run --rm -v "$PWD":/app -w /app/src "$IMAGE" \
      sh -c "composer install --no-interaction --prefer-dist && vendor/bin/phpunit --testdox"
    ;;
  *)
    echo "Unknown check: $CHECK (expected 'lint' or 'test')" >&2
    exit 1
    ;;
esac
