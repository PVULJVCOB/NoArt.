#!/usr/bin/env bash
# Helper to run Netlify dev for local function testing
set -euo pipefail

if ! command -v netlify >/dev/null 2>&1; then
  echo "netlify CLI not found. Install with: npm i -g netlify-cli"
  exit 1
fi

echo "Starting netlify dev (serves functions from netlify/functions)"
netlify dev
