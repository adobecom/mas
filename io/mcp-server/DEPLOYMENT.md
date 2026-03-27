# MCP Runtime Deployment Guide

## Post-Deployment: Update Studio Frontend

After deploying the Runtime actions, update the Studio frontend to use the Runtime URLs.

### 1. Get Runtime Action URLs

After deployment, get your action URLs:

```bash
aio runtime action get publish-card --url
```

The URL will look like:
```
https://adobeioruntime.net/api/v1/web/<namespace>/MerchAtScaleMCP/publish-card
```

### 2. Update Studio Constants

Edit [`studio/src/constants.js`](../../studio/src/constants.js) line 150:

**Before:**
```javascript
export const MCP_SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://mas-mcp.adobe.com';
```

**After:**
```javascript
export const MCP_SERVER_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://adobeioruntime.net/api/v1/web/<your-namespace>/MerchAtScaleMCP';
```

### 3. Update MCP Client

The Studio MCP client ([`studio/src/services/mcp-client.js`](../../studio/src/services/mcp-client.js)) will need to use the Runtime action names instead of the `/tools/:toolName` pattern:

**Current:**
```javascript
const response = await fetch(`${MCP_SERVER_URL}/tools/${toolName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
});
```

**Update to:**
```javascript
const response = await fetch(`${MCP_SERVER_URL}/${toolName.replace('studio_', '')}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
});
```

This maps:
- `studio_publish_card` → `publish-card`
- `studio_search_cards` → `search-cards`
- etc.

### 4. Test the Integration

1. Deploy the Runtime actions
2. Update Studio constants with the Runtime URL
3. Test each operation in Studio AI chat:
   - "publish this card"
   - "search for fries cards"
   - "copy this card"
   - etc.

### 5. Environment-Specific URLs

For different environments:

**Development (localhost):**
```javascript
MCP_SERVER_URL = 'http://localhost:3001'
```

**Staging:**
```javascript
MCP_SERVER_URL = 'https://adobeioruntime.net/api/v1/web/stage-namespace/MerchAtScaleMCP'
```

**Production:**
```javascript
MCP_SERVER_URL = 'https://adobeioruntime.net/api/v1/web/prod-namespace/MerchAtScaleMCP'
```

## Rollback Plan

If Runtime actions have issues, rollback to the Express server:

1. Start the Express MCP server:
   ```bash
   cd mas-mcp-server
   npm run http
   ```

2. Revert Studio constants to point to `https://mas-mcp.adobe.com`

3. Investigate Runtime issues using action logs:
   ```bash
   aio runtime activation list
   aio runtime activation logs <activation-id>
   ```

## Monitoring

### Check Action Status
```bash
aio runtime action list
```

### View Recent Activations
```bash
aio runtime activation list --limit 10
```

### Get Action Logs
```bash
aio runtime activation logs <activation-id>
```

### Action Metrics
View in Adobe I/O Console → Runtime → Actions → Select action → Metrics

## Security

Runtime actions use Adobe IMS authentication via the `require-adobe-auth: true` annotation. Users must be authenticated with Adobe IMS to call these actions.

The Studio frontend passes the IMS access token in the `Authorization` header, which the Runtime action extracts from `__ow_headers.authorization`.
