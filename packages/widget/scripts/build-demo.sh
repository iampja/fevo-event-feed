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

# Fix script src: /src/index.ts (dev) -> /event-feed-widget.js (prod)
sed -i.bak 's|src="/src/index.ts" type="module"|src="/event-feed-widget.js"|g' "$DIST_DIR/index.html"
sed -i.bak 's|src="/src/index.ts" type="module"|src="/event-feed-widget.js"|g' "$DIST_DIR/showcase.html"
sed -i.bak 's|src="/src/index.ts" type="module"|src="/event-feed-widget.js"|g' "$DIST_DIR/rewards-demo.html"
sed -i.bak 's|src="/src/index.ts" type="module"|src="/event-feed-widget.js"|g' "$DIST_DIR/myfevo.html"
sed -i.bak 's|src="/src/index.ts" type="module"|src="/event-feed-widget.js"|g' "$DIST_DIR/collections.html"

# Fix checkout path: /demo/checkout.html -> /checkout.html
sed -i.bak 's|/demo/checkout.html|/checkout.html|g' "$DIST_DIR/index.html"
sed -i.bak 's|/demo/checkout.html|/checkout.html|g' "$DIST_DIR/showcase.html"
sed -i.bak 's|/demo/checkout.html|/checkout.html|g' "$DIST_DIR/rewards-demo.html"
sed -i.bak 's|/demo/checkout.html|/checkout.html|g' "$DIST_DIR/myfevo.html"
sed -i.bak 's|/demo/checkout.html|/checkout.html|g' "$DIST_DIR/collections.html"

# Clean up sed backup files
rm -f "$DIST_DIR"/*.bak

echo "Demo pages copied to dist/"
