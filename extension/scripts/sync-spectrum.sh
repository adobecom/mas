#!/usr/bin/env bash
# Re-vendor Spectrum CSS into vendor/spectrum/.
# Runs npm install in a temp dir, copies the needed CSS files, then cleans up.
# Run from repo root.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR_DIR="$REPO_ROOT/vendor/spectrum"
TMP_DIR="$(mktemp -d)"
trap "rm -rf $TMP_DIR" EXIT

# Versions pinned here. Bump and re-run to update.
TOKENS_VER=16.0.2
EXPRESSVARS_VER=3.0.9
BUTTON_VER=14.2.0
TEXTFIELD_VER=8.2.0
SWITCH_VER=6.2.0
TAG_VER=10.2.0
ACTIONBUTTON_VER=7.2.0
DIVIDER_VER=5.2.0
ICON_VER=9.2.0
STATUSLIGHT_VER=9.2.0
PROGRESSCIRCLE_VER=5.2.0
LINK_VER=7.2.0
TYPOGRAPHY_VER=8.2.0
WORKFLOW_ICONS_VER=5.0.0

cd "$TMP_DIR"
npm init -y > /dev/null
npm install --no-save --silent \
  "@spectrum-css/tokens@$TOKENS_VER" \
  "@spectrum-css/expressvars@$EXPRESSVARS_VER" \
  "@spectrum-css/button@$BUTTON_VER" \
  "@spectrum-css/textfield@$TEXTFIELD_VER" \
  "@spectrum-css/switch@$SWITCH_VER" \
  "@spectrum-css/tag@$TAG_VER" \
  "@spectrum-css/actionbutton@$ACTIONBUTTON_VER" \
  "@spectrum-css/divider@$DIVIDER_VER" \
  "@spectrum-css/icon@$ICON_VER" \
  "@spectrum-css/statuslight@$STATUSLIGHT_VER" \
  "@spectrum-css/progresscircle@$PROGRESSCIRCLE_VER" \
  "@spectrum-css/link@$LINK_VER" \
  "@spectrum-css/typography@$TYPOGRAPHY_VER" \
  "@adobe/spectrum-css-workflow-icons@$WORKFLOW_ICONS_VER"

mkdir -p "$VENDOR_DIR/tokens" "$VENDOR_DIR/components"

# Tokens (Spectrum 2 base)
cp node_modules/@spectrum-css/tokens/dist/css/global-vars.css "$VENDOR_DIR/tokens/global-vars.css"
cp node_modules/@spectrum-css/tokens/dist/css/medium-vars.css "$VENDOR_DIR/tokens/medium-vars.css"
cp node_modules/@spectrum-css/tokens/dist/css/light-vars.css  "$VENDOR_DIR/tokens/light-vars.css"
cp node_modules/@spectrum-css/tokens/dist/css/dark-vars.css   "$VENDOR_DIR/tokens/dark-vars.css"

# Express overrides
cp node_modules/@spectrum-css/expressvars/dist/spectrum-global.css "$VENDOR_DIR/tokens/express-global.css"
cp node_modules/@spectrum-css/expressvars/dist/spectrum-medium.css "$VENDOR_DIR/tokens/express-medium.css"
cp node_modules/@spectrum-css/expressvars/dist/spectrum-light.css  "$VENDOR_DIR/tokens/express-light.css"
cp node_modules/@spectrum-css/expressvars/dist/spectrum-dark.css   "$VENDOR_DIR/tokens/express-dark.css"

# Components (just the per-component index.css)
for pkg in button textfield switch tag actionbutton divider icon statuslight progresscircle link typography; do
  cp "node_modules/@spectrum-css/$pkg/dist/index.css" "$VENDOR_DIR/components/$pkg.css"
done

# Workflow icon SVGs go into a scratch location for Task 2 to harvest
mkdir -p "$VENDOR_DIR/_workflow-icons-raw"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_Edit_20_N.svg          "$VENDOR_DIR/_workflow-icons-raw/Edit.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_Copy_20_N.svg          "$VENDOR_DIR/_workflow-icons-raw/Copy.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_Refresh_20_N.svg       "$VENDOR_DIR/_workflow-icons-raw/Refresh.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_Export_20_N.svg        "$VENDOR_DIR/_workflow-icons-raw/Export.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_Close_20_N.svg         "$VENDOR_DIR/_workflow-icons-raw/Close.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_ChevronRight_20_N.svg  "$VENDOR_DIR/_workflow-icons-raw/ChevronRight.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_FileText_20_N.svg      "$VENDOR_DIR/_workflow-icons-raw/FileText.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_Layers_20_N.svg        "$VENDOR_DIR/_workflow-icons-raw/Layers.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_ShoppingCart_20_N.svg  "$VENDOR_DIR/_workflow-icons-raw/ShoppingCart.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_Home_20_N.svg          "$VENDOR_DIR/_workflow-icons-raw/Home.svg"
cp node_modules/@adobe/spectrum-css-workflow-icons/dist/assets/svg/S2_Icon_Asset_20_N.svg         "$VENDOR_DIR/_workflow-icons-raw/Asset.svg"

echo "Vendored Spectrum CSS into $VENDOR_DIR"
echo "Workflow icon SVGs are in $VENDOR_DIR/_workflow-icons-raw/ — Task 2 inlines these into utils/icons.js then this dir can be deleted."
