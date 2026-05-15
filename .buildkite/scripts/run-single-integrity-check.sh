#!/usr/bin/env bash
# .buildkite/scripts/run-single-integrity-check.sh
# Runs a single integrity check and uploads the report as an artifact.
# Usage: run-single-integrity-check.sh <check-name>
#
# Supported checks:
#   display-names, slugs, musicbrainz, record-metadata, ondemand-source, publish-status, djs

set -euo pipefail

CHECK_NAME="${1:?Usage: run-single-integrity-check.sh <check-name>}"

echo "--- :yarn: Installing dependencies"
corepack enable && yarn install --immutable

export DATABASE_URI="$NEON_DEV_DATABASE_URL"

PRELOAD="--import ./bin/preload-nextenv-fix.mjs --import tsx"
# Write to workspace (not /tmp) so artifacts persist after Docker container exits.
OUTPUT="integrity-${CHECK_NAME}.md"

case "$CHECK_NAME" in
  display-names)
    echo "--- :bust_in_silhouette: Checking display names"
    node $PRELOAD bin/integrity-check-display-names.ts \
      --since 25h --output "$OUTPUT" --verbose
    ;;
  slugs)
    echo "--- :link: Checking slugs"
    node $PRELOAD bin/integrity-check-slugs.ts \
      --since 25h --output "$OUTPUT" --verbose
    ;;
  musicbrainz)
    echo "--- :musical_note: Checking MusicBrainz associations"
    node $PRELOAD bin/integrity-check-musicbrainz.ts \
      --skip-type-check --since 25h --output "$OUTPUT" --verbose
    ;;
  record-metadata)
    echo "--- :cd: Checking record metadata"
    node $PRELOAD bin/integrity-check-record-metadata.ts \
      --since 25h --output "$OUTPUT" --verbose
    ;;
  ondemand-source)
    echo "--- :radio: Checking OnDemand source fields"
    node $PRELOAD bin/integrity-check-ondemand-source.ts \
      --from prod-mysql --since 25h --output "$OUTPUT" --verbose
    ;;
  publish-status)
    echo "--- :white_check_mark: Checking publish status"
    # Stories/custom_texts still originate in legacy MySQL, so publish-status
    # continues comparing posts in Payload against the MySQL source of truth.
    node $PRELOAD bin/integrity-check-publish-status.ts \
      --from prod-mysql --collection posts --since 25h --output "$OUTPUT" --verbose
    ;;
  djs)
    echo "--- :microphone: Checking DJ data quality"
    node $PRELOAD bin/integrity-check-djs.ts \
      --since 25h --output "$OUTPUT" --verbose
    ;;
  *)
    echo "❌ Unknown check: $CHECK_NAME"
    exit 1
    ;;
esac

echo "✅ Check '$CHECK_NAME' complete. Report at $OUTPUT"
