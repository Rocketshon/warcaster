#!/bin/bash
npm run build 2>&1 | tail -5
echo ""
echo "=== Bundle Analysis ==="
echo "Total dist size:"
du -sh dist/
echo ""
echo "Largest files:"
find dist/ -type f -name "*.js" -o -name "*.css" | xargs ls -lhS | head -10
echo ""
MAX_JS_KB=1500
ACTUAL_KB=$(find dist/ -name "*.js" -exec cat {} + | wc -c)
ACTUAL_KB=$((ACTUAL_KB / 1024))
echo "Total JS: ${ACTUAL_KB}KB (budget: ${MAX_JS_KB}KB)"
if [ "$ACTUAL_KB" -gt "$MAX_JS_KB" ]; then
  echo "WARNING: JS bundle exceeds budget!"
fi
