# Setting up MAS MCP Server in Cursor

## Step 1: Open Cursor Settings

1. Open Cursor
2. Press `Cmd+Shift+J` (Mac) or `Ctrl+Shift+J` (Windows/Linux) to open Cursor Settings
3. Navigate to the "Features" tab
4. Look for "Model Context Protocol" section

**Alternative**:
- Go to Settings (Cmd+,)
- Search for "MCP"
- Or create/edit the MCP config file manually (see Step 3)

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

## Step 4: Configure MCP in Cursor

### Option A: Using Cursor UI (Recommended)

1. In Cursor Settings → Features → Model Context Protocol
2. Click "Add MCP Server"
3. Fill in:
   - **Name**: `mas`
   - **Command**: `node`
   - **Args**: `/Users/axelcurenobasurto/Web/mas/mas-mcp-server/dist/index.js`
   - **Environment Variables**:
     ```
     MAS_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE
     AOS_API_KEY=YOUR_AOS_API_KEY_HERE
     AEM_BASE_URL=https://author-p133911-e1313554.adobeaemcloud.com
     AOS_BASE_URL=https://aos.adobe.io
     AOS_LANDSCAPE=PUBLISHED
     AOS_ENVIRONMENT=PRODUCTION
     STUDIO_BASE_URL=https://mas.adobe.com/studio.html
     ```

### Option B: Manual Config File

Create or edit `.cursor/mcp.json` in your workspace root:

```bash
mkdir -p .cursor
touch .cursor/mcp.json
```

Add this configuration:

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
- The path if you cloned the repo to a different location

## Step 5: Reload Cursor

1. **Option 1**: Restart Cursor completely
2. **Option 2**: Run "Reload Window" from the Command Palette (Cmd+Shift+P)

## Step 6: Test It!

In the Cursor AI chat, try:

```
@mas List all products
```

Or in Composer mode:
```
Using the MAS MCP server, create a merch card for Photoshop Individual plan
```

You should see a list of Adobe products or the card creation result!

## Using the MCP in Cursor

### Method 1: @ Mention (Recommended)

Use `@mas` to invoke the MCP tools:

```
@mas Search for all ABM offers for Photoshop
```

```
@mas Create a merch card for Illustrator in /content/dam/mas/illustrator
```

### Method 2: Natural Language

Just describe what you want:

```
Using the MAS MCP, find all trial offers for Creative Cloud
```

```
Create a Photoshop card and link it to the ABM offer
```

Cursor will automatically use the MCP tools when appropriate.

## More Examples to Try

Once working, try these commands:

```
@mas List all products for Individual customers
```

```
@mas Give me the details of offer ID: 65304B6FCE2E6CB9475B2EDE3BDFBBBE
```

```
@mas Search for cards tagged with mas:plan_type/abm
```

```
@mas Create cards for all Photoshop Individual plan types (ABM, PUF, M2M)
```

Every response will include clickable links to open Merch at Scale Studio!

## Troubleshooting

### "MCP server not found" or "Connection failed"

1. **Check the path**: Make sure the path to `index.js` is correct
   ```bash
   ls /Users/axelcurenobasurto/Web/mas/mas-mcp-server/dist/index.js
   ```
2. **Check Node version**: Run `node --version` - you need Node 18 or higher
3. **Check the config**: Look at Cursor's output panel for MCP errors
4. **Reload Window**: Try reloading Cursor (Cmd+Shift+P → "Reload Window")

### "@mas not found" or MCP not showing up

1. **Check MCP is enabled**: Settings → Features → Model Context Protocol should be ON
2. **Check config location**: Make sure `.cursor/mcp.json` is in your workspace root
3. **Check JSON syntax**: Make sure your JSON is valid (no trailing commas, etc.)
4. **Restart Cursor**: Completely quit and reopen Cursor

### "Authentication failed" errors

1. **Token expired**: Access tokens expire. Get a fresh one from the browser console
2. **Wrong token**: Make sure you copied the entire token without extra quotes or spaces
3. **Check env vars**: Make sure environment variables are set correctly in the config

### "AOS search failed"

1. **Check API key**: Make sure your `AOS_API_KEY` is correct
2. **Check network**: Make sure you can access https://aos.adobe.io
3. **Check permissions**: Make sure your token has permissions for AOS

## Workspace-Specific vs Global Config

### Workspace Config (Recommended)
- File: `.cursor/mcp.json` in your project root
- Only available in that workspace
- Can be committed to git (but DON'T commit tokens!)

### Global Config
- File: `~/.cursor/mcp.json`
- Available in all workspaces
- Useful if you work on multiple MAS projects

**Security Tip**: For workspace configs, use a `.env` file for secrets and load them, or use placeholders and set actual tokens in global config.

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

1. Check Cursor's output panel for MCP-specific errors
2. Make sure the MCP server built correctly:
   ```bash
   cd /Users/axelcurenobasurto/Web/mas/mas-mcp-server
   npm run build
   ```
3. Try running the MCP server manually to see errors:
   ```bash
   MAS_ACCESS_TOKEN="your_token" AOS_API_KEY="your_key" node dist/index.js
   ```
4. Contact the Merch at Scale team for support

## Advanced: Using in Multiple Workspaces

If you work on multiple MAS-related projects, you can set up the MCP globally:

1. Create `~/.cursor/mcp.json`:
   ```json
   {
     "mcpServers": {
       "mas": {
         "command": "node",
         "args": ["/Users/axelcurenobasurto/Web/mas/mas-mcp-server/dist/index.js"],
         "env": {
           "MAS_ACCESS_TOKEN": "YOUR_TOKEN",
           "AOS_API_KEY": "YOUR_KEY"
         }
       }
     }
   }
   ```

2. The MCP will be available in all your Cursor workspaces!

3. Remember to refresh the token periodically.
