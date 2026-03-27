# MAS MCP Server - Adobe I/O Runtime Actions

Adobe I/O Runtime actions for MAS Studio MCP operations. These serverless functions provide AEM Content Fragment operations for Studio's AI chat.

## Architecture

This is the production deployment of the MAS MCP Server using Adobe I/O Runtime. It replaces the local Express HTTP server with serverless functions that auto-deploy on git push.

### Actions

- **publish-card**: Publish a card to production
- **unpublish-card**: Unpublish a card from production
- **get-card**: Get card details by ID
- **search-cards**: Search for cards with filters
- **delete-card**: Delete a card
- **copy-card**: Copy/duplicate a card
- **update-card**: Update card fields

## Local Development

### Prerequisites

- Node.js 22+
- Adobe I/O CLI: `npm install -g @adobe/aio-cli`
- Adobe I/O Runtime credentials

### Setup

1. Install dependencies:
   ```bash
   cd io/mcp-server
   npm install
   ```

2. Configure Adobe I/O CLI:
   ```bash
   aio config:set runtime.namespace <your-namespace>
   aio config:set runtime.auth <your-auth-token>
   ```

3. Copy shared libraries (or symlink):
   ```bash
   cp ../../mas-mcp-server/src/services/auth-manager.js src/lib/
   cp ../../mas-mcp-server/src/services/aem-client.js src/lib/
   cp ../../mas-mcp-server/src/utils/studio-url-builder.js src/lib/
   cp ../../mas-mcp-server/src/tools/studio-operations.js src/lib/
   ```

### Deploy

Deploy all actions:
```bash
aio app deploy --all
```

Deploy specific action:
```bash
aio app deploy -a publish-card
```

### Test

List deployed actions:
```bash
aio runtime action list
```

Invoke action directly:
```bash
aio runtime action invoke publish-card --param id <card-id> --result
```

## Auto-Deployment

The GitHub Actions workflow [`.github/workflows/deploy-mcp-runtime.yml`](../../.github/workflows/deploy-mcp-runtime.yml) automatically deploys actions when changes are pushed to `main` branch.

### Required Secrets

Configure these in GitHub repository settings:

- `AIO_RUNTIME_NAMESPACE`: Adobe I/O Runtime namespace
- `AIO_RUNTIME_AUTH`: Adobe I/O Runtime auth token
- `AEM_BASE_URL`: AEM author URL (e.g., `https://author-p133911-e1313554.adobeaemcloud.com`)
- `STUDIO_BASE_URL`: Studio base URL (e.g., `https://mas.adobe.com/studio.html`)

## Runtime URLs

After deployment, actions are available at:
```
https://adobeioruntime.net/api/v1/web/<namespace>/MerchAtScaleMCP/<action-name>
```

Example:
```
https://adobeioruntime.net/api/v1/web/prod-namespace/MerchAtScaleMCP/publish-card
```

## Migration from Express Server

The local Express server (`mas-mcp-server/src/http-server.js`) is used for development. Production uses these Runtime actions instead.

### Key Differences

| Aspect | Express (Dev) | Runtime (Prod) |
|--------|---------------|----------------|
| **Port** | 3001 | N/A (HTTP) |
| **Auth** | Bearer token in header | Adobe IMS auth required |
| **State** | In-memory | Stateless |
| **Deployment** | Manual (`npm run http`) | Auto via GitHub Actions |
| **Scaling** | Single instance | Auto-scales |

## Troubleshooting

### View action logs
```bash
aio runtime activation list
aio runtime activation logs <activation-id>
```

### Test authentication
```bash
curl -H "Authorization: Bearer <token>" \
  https://adobeioruntime.net/api/v1/web/<namespace>/MerchAtScaleMCP/get-card?id=<card-id>
```

### Undeploy actions
```bash
aio app undeploy
```

## Related Documentation

- [MAS MCP Server (Express)](../../mas-mcp-server/README.md)
- [Adobe I/O Runtime Documentation](https://developer.adobe.com/runtime/docs/)
- [Studio MCP Integration](../../MCP_INTEGRATION.md)
