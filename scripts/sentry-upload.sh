#!/usr/bin/env bash
set -euo pipefail

# Usage: SENTRY_AUTH_TOKEN=... SENTRY_ORG=... SENTRY_PROJECT=... ./scripts/sentry-upload.sh <release>
RELEASE=${1:-$(git rev-parse --short HEAD)}

if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  echo "SENTRY_AUTH_TOKEN not set. Export it and try again." >&2
  exit 1
fi

echo "Creating release: $RELEASE"
curl -sL https://sentry.io/get-cli/ | bash
chmod +x ./sentry-cli
./sentry-cli releases new -p "$SENTRY_PROJECT" "$RELEASE"
if [ -d dist ]; then
  ./sentry-cli releases files "$RELEASE" upload-sourcemaps dist --rewrite
else
  echo "No dist/ directory found, skipping sourcemap upload"
fi
./sentry-cli releases finalize "$RELEASE"
echo "Done."
