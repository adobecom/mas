import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFileSync } from 'fs';
import { URL } from 'node:url';

const corsHeaders = {
    'access-control-allow-origin': '*', // keep this in lowercase
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Expose-Headers': '*',
};

const targetOrigin = process.argv[2];
const keyPath = process.argv[3];
const certPath = process.argv[4];

if (!targetOrigin) {
    console.error('Usage: node proxy.mjs <targetOrigin> [keyPath] [certPath]');
    process.exit(1);
}

const targetUrl = new URL(targetOrigin);

// Variables to hold the server and protocol
let server;
let serverProtocol;
let serverPort;

if (keyPath && certPath) {
    // Read the SSL certificate and private key
    const httpsOptions = {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
    };

    server = createHttpsServer(httpsOptions, requestHandler);
    serverProtocol = 'https';
    serverPort = 8443; // Use 8443 for HTTPS
} else {
    server = createHttpServer(requestHandler);
    serverProtocol = 'http';
    serverPort = 8080; // Use 8080 for HTTP
}

// Common request handler
function requestHandler(req, res) {
    const { method, headers, url } = req;

    if (method === 'OPTIONS') {
        // Handle OPTIONS request directly
        res.writeHead(200, {
            ...corsHeaders,
            'Access-Control-Max-Age': 86400, // Cache preflight response for 1 day
        });
        res.end();
    } else {
        // Remove or modify headers as needed
        delete headers['host'];
        delete headers['referer'];
        headers['origin'] = 'https://www.adobe.com';

        const options = {
            protocol: targetUrl.protocol,
            hostname: targetUrl.hostname,
            port:
                targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
            path: url,
            method,
            headers: {
                ...headers,
            },
        };

        let bodyData = [];

        req.on('data', (chunk) => {
            bodyData.push(chunk);
        });

        req.on('end', () => {
            bodyData = Buffer.concat(bodyData).toString();

            // Build the CURL command
            const protocol = options.protocol.replace(':', '');
            const portPart = options.port ? `:${options.port}` : '';
            const urlString = `${protocol}://${options.hostname}${portPart}${options.path}`;
            let curlCommand = `curl -X ${options.method} '${urlString}'`;

            // Add headers
            for (const [headerName, headerValue] of Object.entries(
                options.headers,
            )) {
                // Escape single quotes in header values
                const escapedHeaderValue = headerValue.replace(/'/g, "'\\''");
                curlCommand += ` -H '${headerName}: ${escapedHeaderValue}'`;
            }

            // Add body data if present
            if (bodyData) {
                // Escape single quotes in bodyData
                const escapedBodyData = bodyData.replace(/'/g, "'\\''");
                curlCommand += ` --data '${escapedBodyData}'`;
            }

            console.info(curlCommand);

            // Now proceed to make the proxy request

            const proxyRequest = (
                targetUrl.protocol === 'https:' ? httpsRequest : httpRequest
            )(options, (proxyRes) => {
                // Add CORS headers to the response
                res.writeHead(proxyRes.statusCode, {
                    ...proxyRes.headers,
                    ...corsHeaders,
                });
                proxyRes.pipe(res, { end: true });
            });

            proxyRequest.on('error', (err) => {
                console.error(`Error: ${err.message}`);
                res.writeHead(500, corsHeaders);
                res.end(`Error: ${err.message}`);
            });

            // Write the body data to the proxy request
            if (bodyData) {
                proxyRequest.write(bodyData);
            }

            proxyRequest.end();
        });
    }
}

server.listen(serverPort, () => {
    console.log(
        `Proxy server is running on ${serverProtocol}://localhost:${serverPort}`,
    );
});
