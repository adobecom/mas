#!/usr/bin/env bash
# Rebuild the web-components bundle + docs and fail on drift: the demo pages
# load the checked-in dist/mas.js, and CI rejects out-of-sync build output.
set -euo pipefail
cd "$(dirname "$0")/../.."

snapshot() {
    find web-components/dist web-components/docs -type f -print0 |
        sort -z | xargs -0 shasum -a 256 | shasum -a 256
}

before=$(snapshot)
(cd web-components && npm run build:bundle && npm run build:docs)
after=$(snapshot)

if [ "$before" != "$after" ]; then
    echo "FAIL: web-components dist/ or docs/ out of sync with src/." >&2
    echo "Run 'cd web-components && npm run build:bundle && npm run build:docs' and commit." >&2
    exit 1
fi
echo "OK: build artifacts in sync"
