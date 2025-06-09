#!/bin/bash

# Figma to Merch Card MCP Launch Script
# This script loads environment variables and runs the MCP

# Load .env file if it exists
if [ -f .env ]; then
    echo "📄 Loading configuration from .env file..."
    set -a  # automatically export all variables
    source .env
    set +a  # stop automatically exporting
else
    echo "⚠️  No .env file found, using manual configuration..."
    export PROJECT_ROOT="/Users/axelcurenobasurto/Web/mas"
    export OUTPUT_PATH="web-components/src"
    export STUDIO_PATH="studio/src"
    export WEB_COMPONENTS_PATH="web-components"
fi

# Check if FIGMA_ACCESS_TOKEN is set
if [ -z "$FIGMA_ACCESS_TOKEN" ]; then
    echo "🔑 Figma access token not found."
    echo ""
    echo "Solutions:"
    echo "1. Add FIGMA_ACCESS_TOKEN to your .env file"
    echo "2. Set it temporarily: FIGMA_ACCESS_TOKEN='your_token' ./run-mcp.sh"
    echo "3. Export it: export FIGMA_ACCESS_TOKEN='your_token' && ./run-mcp.sh"
    echo ""
    echo "Get a new token from: https://www.figma.com/settings"
    exit 1
fi

echo "🚀 Starting Figma to Merch Card MCP..."
echo "📁 Project Root: $PROJECT_ROOT"
echo "🎨 Figma Token: ${FIGMA_ACCESS_TOKEN:0:10}..."
echo ""

# Run validation first
echo "🔍 Validating configuration..."
node validate-config.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuration valid! Starting MCP server..."
    node figma-to-merch-card-mcp.js
else
    echo "❌ Configuration validation failed!"
    exit 1
fi 