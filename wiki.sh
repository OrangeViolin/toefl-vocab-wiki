#!/bin/bash
# TOEFL Vocabulary Wiki — local preview server
MEMEX_ROOT="$HOME/memex"
PORT="${1:-2012}"
PUBLIC_DIR="$(cd "$(dirname "$0")" && pwd)/docs/wiki/public"

echo "TOEFL词汇 Wiki → http://localhost:${PORT}"
echo "Press Ctrl+C to stop."
node "$MEMEX_ROOT/wiki/server/serve.js" "$PUBLIC_DIR" "$PORT"
