#!/bin/bash
# Copies demo pages to dist/ with production script references
set -e

DIST_DIR="$(dirname "$0")/../dist"

# Copy demo pages
cp "$(dirname "$0")/../demo/index.html" "$DIST_DIR/index.html"
cp "$(dirname "$0")/../demo/partner-do512.html" "$DIST_DIR/partner-do512.html"
cp "$(dirname "$0")/../demo/partner-embed-test.html" "$DIST_DIR/partner-embed-test.html"
cp "$(dirname "$0")/../demo/checkout.html" "$DIST_DIR/checkout.html"
cp "$(dirname "$0")/../demo/showcase.html" "$DIST_DIR/showcase.html"
cp "$(dirname "$0")/../demo/rewards-demo.html" "$DIST_DIR/rewards-demo.html"
cp "$(dirname "$0")/../demo/myfevo.html" "$DIST_DIR/myfevo.html"
cp "$(dirname "$0")/../demo/collections.html" "$DIST_DIR/collections.html"

# Fix all paths in HTML files for production
API_URL="${VITE_API_URL:-https://fevo-event-feed-api.onrender.com/api/v1/event-feed}"
for f in "$DIST_DIR"/*.html; do
  sed -i.bak 's|src="/src/index.ts" type="module"|src="/event-feed-widget.js"|g' "$f"
  sed -i.bak 's|/demo/checkout.html|/checkout.html|g' "$f"
  sed -i.bak "s|data-api-url=\"/api/v1/event-feed\"|data-api-url=\"${API_URL}\"|g" "$f"
  sed -i.bak 's|href="/demo/|href="/|g' "$f"
done

# Clean up sed backup files
rm -f "$DIST_DIR"/*.bak

echo "Demo pages copied to dist/"
