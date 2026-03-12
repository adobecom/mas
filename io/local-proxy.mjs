/**
 * Local fragment proxy for QA development.
 * Sits on port 9001 and proxies /io/fragment requests to QA AEM
 * via the Studio proxy on port 8080, then transforms the response
 * into the I/O pipeline output format the Milo autoblock expects.
 *
 * Usage:
 *   node io/local-proxy.mjs
 *
 * Then set the auth token from Studio's browser console:
 *   fetch('http://localhost:9001/set-token', { method: 'POST', body: adobeIMS.getAccessToken().token })
 *
 * Requires: Studio proxy running on port 8080 (npm run studio)
 */
import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { request as httpRequest } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AEM_PROXY = 'http://localhost:8080';
const PORT = 9001;
const HTTPS_PORT = 9002;

let authToken = process.env.AEM_TOKEN || null;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Content-Type': 'application/json',
};

const CF_REFERENCE_FIELDS = [
    'cards',
    'collections',
    'entries',
    'fragments',
    'sections',
    'rows',
    'values',
];
const REFERENCE_FIELDS = [...CF_REFERENCE_FIELDS, 'tags'];

// --- AEM author → Odin field name conversion ---
// The AEM author REST API uses camelCase field names while
// the Odin delivery API uses kebab-case. Some names also differ entirely.
const AEM_TO_ODIN_NAMES = {
    sectionTitle: 'section-title',
    rowTitle: 'row-title',
    rowValues: 'values',
    fragment: 'fragments',
    fields: 'column-fields',
};

function renameFields(fieldsArray) {
    if (!Array.isArray(fieldsArray)) return fieldsArray;
    return fieldsArray.map((field) => {
        const odinName = AEM_TO_ODIN_NAMES[field.name];
        if (!odinName) return field;
        const renamed = { ...field, name: odinName };
        // 'fragment' is single-valued in AEM but 'fragments' is multi-valued in Odin
        if (field.name === 'fragment') renamed.multiple = true;
        return renamed;
    });
}

function convertValueType(fieldsArray) {
    if (!Array.isArray(fieldsArray)) return fieldsArray;
    const vtIdx = fieldsArray.findIndex((f) => f.name === 'valueType');
    if (vtIdx === -1) return fieldsArray;
    const vt = fieldsArray[vtIdx];
    const raw = vt.values?.[0] ?? '';
    const out = fieldsArray.filter((_, i) => i !== vtIdx);
    if (raw === 'true' || raw === 'false') {
        out.push({ name: 'type', values: ['boolean'], multiple: false });
        out.push({ name: 'booleanValue', values: [raw === 'true'], multiple: false });
    } else if (/^\d+(\.\d+)?$/.test(raw)) {
        out.push({ name: 'type', values: ['number'], multiple: false });
        out.push({ name: 'numberValue', values: [parseFloat(raw)], multiple: false });
    } else {
        out.push({ name: 'type', values: ['text'], multiple: false });
        out.push({ name: 'textValue', values: [raw], multiple: false });
    }
    return out;
}

function normalizeAemFields(body) {
    if (Array.isArray(body.fields)) {
        body.fields = convertValueType(renameFields(body.fields));
    }
    if (Array.isArray(body.references)) {
        body.references.forEach((ref) => normalizeAemFields(ref));
    }
    return body;
}

// --- Schema transform (mirrors odinSchemaTransform.js) ---

function transformFields(body) {
    const { fields, references } = body;
    const pathToIdMap = {};
    if (references && Array.isArray(references)) {
        references.forEach((ref) => {
            if (ref.type === 'content-fragment') {
                pathToIdMap[ref.path] = ref.id;
            }
        });
    }
    return fields.reduce((acc, { name, multiple, values, mimeType }) => {
        if (CF_REFERENCE_FIELDS.includes(name)) {
            acc[name] = values.map((v) =>
                typeof v === 'string' ? pathToIdMap[v] || v : v,
            );
        } else if (mimeType === 'text/html') {
            acc[name] = { mimeType, value: values[0] };
        } else {
            acc[name] = multiple ? values : values[0];
        }
        return acc;
    }, {});
}

function transformReferences(body) {
    if (!body.references || !Array.isArray(body.references)) return body;

    const processReference = (refs, ref) => {
        const fields = transformFields(ref);
        if (ref.references && ref.references.length > 0) {
            ref.references.forEach((nested) => {
                if (!refs[nested.id]) {
                    processReference(refs, nested);
                }
            });
        }
        refs[ref.id] = {
            type: ref.type || 'content-fragment',
            value: {
                name: ref.name,
                title: ref.title,
                description: ref.description,
                path: ref.path,
                id: ref.id,
                model: { id: ref.model?.id },
                fields,
            },
        };
        if (ref.tags && Array.isArray(ref.tags)) {
            ref.tags.forEach((tag) => {
                if (tag?.id && !refs[tag.id]) {
                    refs[tag.id] = { type: 'tag', value: tag };
                }
            });
        }
    };

    body.references = body.references.reduce((refs, ref) => {
        processReference(refs, ref);
        return refs;
    }, {});

    body.referencesTree = buildReferenceTree(body.fields, body.references);
    return body;
}

function buildReferenceTree(fields, references) {
    const tree = [];
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
        if (REFERENCE_FIELDS.includes(fieldName) && Array.isArray(fieldValue)) {
            fieldValue.forEach((id) => {
                if (references[id]) {
                    const ref = {
                        fieldName,
                        identifier: id,
                        referencesTree: [],
                    };
                    const nested = references[id];
                    if (nested.type === 'content-fragment') {
                        ref.referencesTree = buildReferenceTree(
                            nested.value.fields,
                            references,
                        );
                    }
                    tree.push(ref);
                }
            });
        }
    }
    return tree;
}

function transformBody(body) {
    body.fields = transformFields(body);
    body = transformReferences(body);
    return body;
}

// --- Proxy fetch helper ---

function proxyFetch(url, token) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const headers = { Accept: 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const req = httpRequest(
            {
                hostname: parsed.hostname,
                port: parsed.port,
                path: parsed.pathname + parsed.search,
                method: 'GET',
                headers,
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () =>
                    resolve({ status: res.statusCode, body: data }),
                );
            },
        );
        req.on('error', reject);
        req.end();
    });
}

// --- Read POST body helper ---

function readBody(req) {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => resolve(data));
    });
}

// --- Request handler ---

async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, CORS_HEADERS);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    // Token setter endpoint
    if (url.pathname === '/set-token' && req.method === 'POST') {
        authToken = (await readBody(req)).trim();
        console.log(
            `[proxy] Token set (${authToken.substring(0, 20)}...)`,
        );
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify({ ok: true }));
        return;
    }

    // Health check
    if (url.pathname === '/health') {
        res.writeHead(200, CORS_HEADERS);
        res.end(
            JSON.stringify({
                ok: true,
                hasToken: !!authToken,
            }),
        );
        return;
    }

    if (url.pathname !== '/io/fragment') {
        res.writeHead(404, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Not found. Use /io/fragment?id=...' }));
        return;
    }

    if (!authToken) {
        res.writeHead(401, CORS_HEADERS);
        res.end(
            JSON.stringify({
                error: 'No auth token. Run in Studio console: fetch("http://localhost:9001/set-token", { method: "POST", body: adobeIMS.getAccessToken().token })',
            }),
        );
        return;
    }

    const id = url.searchParams.get('id');
    if (!id) {
        res.writeHead(400, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Missing id parameter' }));
        return;
    }

    const aemUrl = `${AEM_PROXY}/adobe/sites/cf/fragments/${id}?references=all-hydrated`;
    console.log(`[proxy] ${id} -> ${aemUrl}`);

    try {
        const aemRes = await proxyFetch(aemUrl, authToken);

        if (aemRes.status !== 200) {
            console.log(`[proxy] AEM returned ${aemRes.status}`);
            res.writeHead(aemRes.status, CORS_HEADERS);
            res.end(
                JSON.stringify({
                    error: `AEM returned ${aemRes.status}`,
                    detail: aemRes.body?.substring(0, 200),
                }),
            );
            return;
        }

        const body = JSON.parse(aemRes.body);
        normalizeAemFields(body);
        const transformed = transformBody(body);

        console.log(
            `[proxy] ${id} -> OK (${Object.keys(transformed.references || {}).length} refs)`,
        );
        res.writeHead(200, CORS_HEADERS);
        res.end(JSON.stringify(transformed));
    } catch (err) {
        console.error(`[proxy] Error:`, err.message);
        res.writeHead(502, CORS_HEADERS);
        res.end(JSON.stringify({ error: err.message }));
    }
}

const server = createServer(handler);
server.listen(PORT, () => {
    console.log(`Fragment proxy running on http://localhost:${PORT}`);
    console.log(`Proxying to QA AEM via ${AEM_PROXY}`);
    console.log('');
    console.log('Set token from Studio console:');
    console.log(
        `  fetch("https://localhost:${HTTPS_PORT}/set-token", { method: "POST", body: adobeIMS.getAccessToken().token })`,
    );
    console.log('');
    console.log(
        `Test: http://localhost:${PORT}/io/fragment?id=<fragment-id>`,
    );
});

// HTTPS server for mixed-content bypass (HTTPS pages fetching local proxy)
try {
    const sslOptions = {
        key: readFileSync(join(__dirname, 'local-proxy-key.pem')),
        cert: readFileSync(join(__dirname, 'local-proxy-cert.pem')),
    };
    const httpsServer = createHttpsServer(sslOptions, handler);
    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`HTTPS proxy running on https://localhost:${HTTPS_PORT}`);
    });
} catch {
    console.log('No SSL certs found, skipping HTTPS server. Generate with:');
    console.log('  openssl req -x509 -newkey rsa:2048 -keyout io/local-proxy-key.pem -out io/local-proxy-cert.pem -days 365 -nodes -subj /CN=localhost');
}
