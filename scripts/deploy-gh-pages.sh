#!/usr/bin/env sh
set -eu

# Deploy the contents of dist/ to the gh-pages branch on the configured remote (default: origin)
# Usage: ./scripts/deploy-gh-pages.sh [remote]

REMOTE=${1:-origin}
BRANCH=gh-pages
BUILD_DIR=dist

if [ ! -d "$BUILD_DIR" ]; then
  echo "Build directory '$BUILD_DIR' not found. Run 'npm run build' first." >&2
  exit 1
fi


# Determine remote URL from the original repo so we can push from the temp repo
REMOTE_URL=$(git remote get-url "$REMOTE" 2>/dev/null || true)

TMP_DIR=$(mktemp -d)
echo "Using temporary dir: $TMP_DIR"

# Copy built files
cp -a "$BUILD_DIR/". "$TMP_DIR"

# If a CNAME exists at repo root, copy it as well so GH Pages picks up the custom domain
if [ -f CNAME ]; then
  cp CNAME "$TMP_DIR/"
fi

cd "$TMP_DIR"

git init >/dev/null
git checkout -b "$BRANCH" || git checkout --orphan "$BRANCH"
git add --all
git commit -m "Deploy site to GitHub Pages" >/dev/null

if [ -n "$REMOTE_URL" ]; then
  echo "Adding remote '$REMOTE' -> $REMOTE_URL"
  git remote add "$REMOTE" "$REMOTE_URL"
fi

echo "Pushing to ${REMOTE}${REMOTE_URL:+ ($REMOTE_URL)}/$BRANCH..."
git push --force "${REMOTE}" "$BRANCH"

echo "Cleaning up"
cd - >/dev/null
rm -rf "$TMP_DIR"

echo "Deployed to $REMOTE/$BRANCH"
