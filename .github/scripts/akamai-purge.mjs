// Invalidates changed Studio files in mas.adobe.com's Akamai cache once aem.live serves them, so authors
// get new Studio code right after a merge instead of after the 2h edge TTL (MWPW-204762).
// Run by .github/workflows/studio-akamai-purge.yaml on pushes to main.
//
// Usage:
//   BEFORE_SHA=<sha> AFTER_SHA=<sha> AKAMAI_HOST=... AKAMAI_CLIENT_TOKEN=... AKAMAI_CLIENT_SECRET=... \
//   AKAMAI_ACCESS_TOKEN=... node .github/scripts/akamai-purge.mjs

import { execFileSync } from 'node:child_process';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://main--mas--adobecom.aem.live';
const EDGE = 'https://mas.adobe.com';
const PURGE_PATH = '/ccu/v3/invalidate/url/production';
// File types the mas.adobe.com property caches; HTML, JSON and the rest are no-store.
const CACHED_EXTENSIONS = /\.(js|css|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot)$/i;
const POLL_INTERVAL_MS = 10_000;
const ORIGIN_TIMEOUT_MS = 5 * 60_000;
const EDGE_TIMEOUT_MS = 60_000;
const URLS_PER_PURGE = 500;

export function formatTimestamp(date) {
    return date
        .toISOString()
        .replace(/-/g, '')
        .replace(/\.\d{3}Z$/, '+0000');
}

// Akamai EdgeGrid v1 signature: https://techdocs.akamai.com/developer/docs/authenticate-with-edgegrid
export function signRequest({ method, path, body = '', credentials, timestamp, nonce }) {
    const authPrefix = `EG1-HMAC-SHA256 client_token=${credentials.clientToken};access_token=${credentials.accessToken};timestamp=${timestamp};nonce=${nonce};`;
    const contentHash = method === 'POST' && body ? createHash('sha256').update(body).digest('base64') : '';
    const signingKey = createHmac('sha256', credentials.clientSecret).update(timestamp).digest('base64');
    const dataToSign = [method, 'https', credentials.host, path, '', contentHash, authPrefix].join('\t');
    const signature = createHmac('sha256', signingKey).update(dataToSign).digest('base64');
    return `${authPrefix}signature=${signature}`;
}

export function selectPurgePaths(diffOutput) {
    return diffOutput.split('\n').filter((path) => CACHED_EXTENSIONS.test(path));
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function git(...args) {
    return execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
}

async function isServed(url, content) {
    try {
        const response = await fetch(url);
        return response.ok && Buffer.from(await response.arrayBuffer()).equals(content);
    } catch {
        return false;
    }
}

// Sequential on purpose: aem.live throttles bursts from automation.
async function findStale(base, files) {
    const stale = [];
    for (const file of files) {
        if (!(await isServed(`${base}/${file.path}`, file.content))) stale.push(file);
    }
    return stale;
}

async function waitUntilServed(base, files, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    let stale = await findStale(base, files);
    while (stale.length && Date.now() < deadline) {
        await sleep(POLL_INTERVAL_MS);
        stale = await findStale(base, stale);
    }
    return stale;
}

async function purge(credentials, urls) {
    let estimatedSeconds = 0;
    for (let start = 0; start < urls.length; start += URLS_PER_PURGE) {
        const objects = urls.slice(start, start + URLS_PER_PURGE);
        const body = JSON.stringify({ objects });
        const authorization = signRequest({
            method: 'POST',
            path: PURGE_PATH,
            body,
            credentials,
            timestamp: formatTimestamp(new Date()),
            nonce: randomUUID(),
        });
        const response = await fetch(`https://${credentials.host}${PURGE_PATH}`, {
            method: 'POST',
            headers: { Authorization: authorization, 'Content-Type': 'application/json' },
            body,
        });
        const result = await response.json().catch(() => ({}));
        if (response.status !== 201) {
            throw new Error(`Akamai purge failed with ${response.status}: ${result.title ?? ''} ${result.detail ?? ''}`);
        }
        console.log(`Invalidated ${objects.length} URLs on mas.adobe.com (purge ${result.purgeId})`);
        estimatedSeconds = Math.max(estimatedSeconds, result.estimatedSeconds ?? 0);
    }
    return estimatedSeconds;
}

async function main() {
    const { BEFORE_SHA, AFTER_SHA = 'HEAD' } = process.env;
    const credentials = {
        host: process.env.AKAMAI_HOST,
        clientToken: process.env.AKAMAI_CLIENT_TOKEN,
        clientSecret: process.env.AKAMAI_CLIENT_SECRET,
        accessToken: process.env.AKAMAI_ACCESS_TOKEN,
    };
    if (!BEFORE_SHA || Object.values(credentials).some((value) => !value)) {
        throw new Error('Set BEFORE_SHA, AKAMAI_HOST, AKAMAI_CLIENT_TOKEN, AKAMAI_CLIENT_SECRET and AKAMAI_ACCESS_TOKEN.');
    }

    const diff = git('diff', '--name-only', '--diff-filter=d', BEFORE_SHA, AFTER_SHA, '--', 'studio', 'web-components/dist');
    const paths = selectPurgePaths(diff.toString());
    if (!paths.length) {
        console.log('No cached Studio files changed.');
        return;
    }
    const files = paths.map((path) => ({ path, content: git('show', `${AFTER_SHA}:${path}`) }));

    console.log(`Waiting for aem.live to serve ${files.length} changed files`);
    const stale = await waitUntilServed(ORIGIN, files, ORIGIN_TIMEOUT_MS);
    if (stale.length) {
        const sample = stale
            .slice(0, 5)
            .map(({ path }) => path)
            .join(', ');
        console.log(`::warning::aem.live still serves older versions of ${stale.length} files (${sample}); purging anyway`);
    }

    const estimatedSeconds = await purge(
        credentials,
        files.map(({ path }) => `${EDGE}/${path}`),
    );

    const probe = files.find((file) => !stale.includes(file));
    if (!probe) return;
    await sleep(estimatedSeconds * 1000);
    if ((await waitUntilServed(EDGE, [probe], EDGE_TIMEOUT_MS)).length) {
        throw new Error(`mas.adobe.com still serves an old ${probe.path} after the purge`);
    }
    console.log(`mas.adobe.com serves the new ${probe.path}`);
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url));
if (isDirectRun) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
