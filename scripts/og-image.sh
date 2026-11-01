#!/usr/bin/env bash
# Regenerates the social image and PNG icons in public/ using headless Chrome:
#   public/og-image.png          1200x630, from scripts/og-image/og.html
#   public/favicon-32.png        32x32, from public/favicon.svg
#   public/apple-touch-icon.png  180x180, from scripts/og-image/icon.html
#   public/icon-192.png, icon-512.png (manifest icons), same source
# scripts/og-image/app-screenshot.png is a 1280x800 (2x) capture of the desktop week view.
# Set CHROME to override the browser binary.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
shoot() { # url width height output
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --window-size="$2,$3" --virtual-time-budget=4000 \
    --screenshot="$PWD/$4" "$1" 2>/dev/null
  echo "==> Wrote $4"
}

shoot "file://$PWD/scripts/og-image/og.html" 1200 630 public/og-image.png
shoot "file://$PWD/public/favicon.svg" 32 32 public/favicon-32.png
shoot "file://$PWD/scripts/og-image/icon.html" 180 180 public/apple-touch-icon.png
shoot "file://$PWD/scripts/og-image/icon.html" 192 192 public/icon-192.png
shoot "file://$PWD/scripts/og-image/icon.html" 512 512 public/icon-512.png
