#!/bin/bash

echo "=========================================="
echo "MAS MCP Server - Token Helper"
echo "=========================================="
echo ""
echo "To get your access token:"
echo ""
echo "1. Open https://mas.adobe.com/studio.html in your browser"
echo "2. Open Developer Tools (F12 or Cmd+Option+I)"
echo "3. Go to the Console tab"
echo "4. Type: sessionStorage.masAccessToken"
echo "5. Copy the token value (without the quotes)"
echo ""
echo "Opening Studio in your browser..."
echo ""

# Try to open the browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "https://mas.adobe.com/studio.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "https://mas.adobe.com/studio.html"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start "https://mas.adobe.com/studio.html"
fi

echo "=========================================="
echo "Once you have your token, update your config:"
echo ""
echo "Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json"
echo "Cursor: .cursor/mcp.json in your workspace"
echo "=========================================="
