# Setting up MAS MCP Server in Claude Desktop

## Step 1: Find Your Claude Desktop Config File

**macOS:**
```bash
open ~/Library/Application\ Support/Claude/
```

**Windows:**
```
%APPDATA%\Claude\
```

You need to edit the file: `claude_desktop_config.json`

## Step 2: Get Your Access Token

You need an Adobe IMS access token. You can get this from:

1. **Browser Method** (Easiest):
   - Open https://mas.adobe.com/studio.html in your browser
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Go to Console tab
   - Type: `sessionStorage.masAccessToken`
   - Copy the token value (without quotes)

2. **Alternative**: Use your IMS access token if you have one

## Step 3: Get Your AOS API Key

Contact your team lead or check your internal documentation for the AOS API key.

## Step 4: Update Claude Desktop Config

Edit `claude_desktop_config.json` and add this configuration:

```json
{
  "mcpServers": {
    "mas": {
      "command": "node",
      "args": [
        "/Users/axelcurenobasurto/Web/mas/mas-mcp-server/dist/index.js"
      ],
      "env": {
        "MAS_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN_HERE",
        "AOS_API_KEY": "YOUR_AOS_API_KEY_HERE",
        "AEM_BASE_URL": "https://author-p133911-e1313554.adobeaemcloud.com",
        "AOS_BASE_URL": "https://aos.adobe.io",
        "AOS_LANDSCAPE": "PUBLISHED",
        "AOS_ENVIRONMENT": "PRODUCTION",
        "STUDIO_BASE_URL": "https://mas.adobe.com/studio.html"
      }
    }
  }
}
```

**Important**: Replace:
- `YOUR_ACCESS_TOKEN_HERE` with your actual access token
- `YOUR_AOS_API_KEY_HERE` with your actual AOS API key
- The path `/Users/axelcurenobasurto/Web/mas/mas-mcp-server/dist/index.js` if you cloned the repo to a different location

## Step 5: Restart Claude Desktop

1. Quit Claude Desktop completely (Cmd+Q on Mac, or close from system tray on Windows)
2. Reopen Claude Desktop

## Step 6: Test It!

In a new conversation, try:

```
List all products
```

You should see a list of Adobe products returned from the MCP server!

## More Examples to Try

Once working, try these commands:

```
Create a merch card for Photoshop Individual plan in /content/dam/mas/photoshop
```

```
Search for all ABM offers for Photoshop
```

```
Give me the details of offer ID: 65304B6FCE2E6CB9475B2EDE3BDFBBBE
```

Every response will include clickable links to open Merch at Scale Studio with the relevant filters applied!

## Troubleshooting

### "MCP server not found" or "Connection failed"

1. **Check the path**: Make sure the path to `index.js` is correct
2. **Check Node version**: Run `node --version` - you need Node 18 or higher
3. **Check the build**: Make sure `dist/index.js` exists by running:
   ```bash
   ls /Users/axelcurenobasurto/Web/mas/mas-mcp-server/dist/index.js
   ```

### "Authentication failed" errors

1. **Token expired**: Access tokens expire. Get a fresh one from the browser console
2. **Wrong token**: Make sure you copied the entire token without extra quotes or spaces

### "AOS search failed"

1. **Check API key**: Make sure your AOS_API_KEY is correct
2. **Check network**: Make sure you can access https://aos.adobe.io

## Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MAS_ACCESS_TOKEN` | Yes | Adobe IMS access token | - |
| `AOS_API_KEY` | Yes | AOS API key | - |
| `AEM_BASE_URL` | No | AEM author URL | `https://author-p133911-e1313554.adobeaemcloud.com` |
| `AOS_BASE_URL` | No | AOS API base URL | `https://aos.adobe.io` |
| `AOS_LANDSCAPE` | No | PUBLISHED or DRAFT | `PUBLISHED` |
| `AOS_ENVIRONMENT` | No | PRODUCTION or STAGE | `PRODUCTION` |
| `STUDIO_BASE_URL` | No | Studio URL | `https://mas.adobe.com/studio.html` |

## Getting Help

If you're still having issues:

1. Check the Claude Desktop logs
2. Make sure the MCP server built correctly (`npm run build` in the project directory)
3. Contact the Merch at Scale team for support
