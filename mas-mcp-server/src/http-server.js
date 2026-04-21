/**
 * HTTP Server for MAS MCP Server
 *
 * Exposes MCP tools as REST API endpoints for Studio frontend integration.
 * This runs alongside the stdio MCP server for Claude Code/Cursor integration.
 */

import express from 'express';
import cors from 'cors';
import { MASMCPServer } from './index.js';

const PORT = process.env.HTTP_PORT || 3001;

async function startHttpServer() {
    const app = express();

    app.use(cors());
    app.use(express.json());

    const config = {
        auth: {
            accessToken: process.env.MAS_ACCESS_TOKEN || process.env.IMS_ACCESS_TOKEN,
            clientId: process.env.IMS_CLIENT_ID,
            clientSecret: process.env.IMS_CLIENT_SECRET,
        },
        aem: {
            baseUrl: process.env.AEM_BASE_URL || 'https://author-p133911-e1313554.adobeaemcloud.com',
        },
        aos: {
            baseUrl: process.env.AOS_BASE_URL || 'https://aos.adobe.io',
            apiKey: process.env.AOS_API_KEY || 'wcms-commerce-ims-user-prod',
            landscape: process.env.AOS_LANDSCAPE || 'PUBLISHED',
            environment: process.env.AOS_ENVIRONMENT || 'PRODUCTION',
        },
        wcs: {
            baseUrl: process.env.WCS_BASE_URL || 'https://www.adobe.com/web_commerce_artifact',
            apiKey: process.env.WCS_API_KEY || 'wcms-commerce-ims-ro-user-milo',
            landscape: process.env.WCS_LANDSCAPE || 'PUBLISHED',
        },
        studio: {
            baseUrl: process.env.STUDIO_BASE_URL || 'https://mas.adobe.com/studio.html',
        },
        products: {
            endpoint: process.env.PRODUCTS_ENDPOINT,
        },
    };

    const mcpServer = new MASMCPServer(config);

    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.get('/tools', async (req, res) => {
        try {
            const tools = mcpServer.getToolDefinitions();
            res.json({ tools });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/v1/products', async (req, res) => {
        const authHeader = req.headers.authorization;
        try {
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
            }
            mcpServer.authManager.setAccessToken(authHeader.slice(7));

            const params = {};
            if (req.query.search) params.searchText = req.query.search;
            if (req.query.customerSegment) params.customerSegment = req.query.customerSegment;
            if (req.query.marketSegment) params.marketSegment = req.query.marketSegment;

            const result = await mcpServer.listProductsWithMCS(params);
            res.set('Cache-Control', 'public, max-age=3600');
            res.json(result);
        } catch (error) {
            console.error('Products list error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/v1/products/:arrangementCode', async (req, res) => {
        const authHeader = req.headers.authorization;
        try {
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
            }
            mcpServer.authManager.setAccessToken(authHeader.slice(7));

            const result = await mcpServer.getProductDetail({
                arrangementCode: req.params.arrangementCode,
            });
            res.set('Cache-Control', 'private, max-age=300');
            res.json(result);
        } catch (error) {
            console.error('Product detail error:', error);
            const status = error.message.includes('No product found') ? 404 : 500;
            res.status(status).json({ error: error.message });
        }
    });

    app.post('/tools/:toolName', async (req, res) => {
        const { toolName } = req.params;
        const { _aemBaseUrl, ...params } = req.body;
        const authHeader = req.headers.authorization;

        try {
            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'Authorization header with Bearer token is required' });
            }

            const token = authHeader.slice(7);
            mcpServer.authManager.setAccessToken(token);

            if (_aemBaseUrl) {
                mcpServer.aemClient.baseUrl = _aemBaseUrl.replace(/\/$/, '');
                mcpServer.aemClient.cfFragmentsUrl = `${mcpServer.aemClient.baseUrl}/adobe/sites/cf/fragments`;
                mcpServer.aemClient.cfSearchUrl = `${mcpServer.aemClient.cfFragmentsUrl}/search`;
                mcpServer.aemClient.cfPublishUrl = `${mcpServer.aemClient.cfFragmentsUrl}/publish`;
                mcpServer.aemClient.wcmcommandUrl = `${mcpServer.aemClient.baseUrl}/bin/wcmcommand`;
                mcpServer.aemClient.csrfTokenUrl = `${mcpServer.aemClient.baseUrl}/libs/granite/csrf/token.json`;
            }

            const result = await mcpServer.handleToolCall(toolName, params);
            res.json(result);
        } catch (error) {
            console.error(`Tool execution error (${toolName}):`, error);
            res.status(500).json({
                error: error.message,
                tool: toolName,
            });
        }
    });

    app.listen(PORT, () => {
        console.log(`MAS MCP HTTP Server listening on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`Tools list: http://localhost:${PORT}/tools`);
    });
}

startHttpServer().catch((error) => {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
});
