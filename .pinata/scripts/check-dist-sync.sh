#!/usr/bin/env bash
# Rebuild the web-components bundle + docs. The demo pages load the checked-in
# dist/mas.js, so the visual gate needs it fresh. Drift is not a failure: CI
# commits the built output on the PR. A failing build still fails the gate.
set -euo pipefail
cd "$(dirname "$0")/../.."

(cd web-components && npm run build:bundle && npm run build:docs)
echo "OK: build artifacts rebuilt"
