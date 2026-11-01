#!/usr/bin/env bash
# Builds the static site into dist/ (type-check + Vite production build).
# Serve dist/ from any static host; routes are hash-based, so no rewrites are needed.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm ci
fi

rm -rf dist
npm run build

for f in index.html og-image.png favicon.svg site.webmanifest robots.txt sitemap.xml; do
  [ -f "dist/$f" ] || { echo "Missing dist/$f" >&2; exit 1; }
done

echo
echo "Static site ready: dist"
