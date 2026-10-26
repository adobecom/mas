// Invalidates mas.adobe.com's Akamai cache (CP code 1776643) once aem.live serves the pushed Studio files, so authors
// get new Studio code right after a merge instead of after the 1-day edge TTL (MWPW-204762). Same as "Submit Purge" in
// Akamai Control Center: CP code 1776643, Production, Invalidate.
// Run by .github/workflows/studio-akamai-purge.yaml on pushes to main, or manually to purge right away.
//
// Usage:
//   [BEFORE_SHA=<sha> AFTER_SHA=<sha>] AKAMAI_HOST=... AKAMAI_CLIENT_TOKEN=... AKAMAI_CLIENT_SECRET=... \
//   AKAMAI_ACCESS_TOKEN=... node .github/scripts/akamai-purge.mjs

import { execFileSync } from 'node:child_process';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://main--mas--adobecom.aem.live';
// mas.adobe.com; mas.adobe.com/io is on its own CP code (1798716) and stays cached.
const CP_CODE = 1776643;
const PURGE_PATH = '/ccu/v3/invalidate/cpcode/production';
// File types the mas.adobe.com property caches; HTML, JSON and the rest are no-store.
const CACHED_EXTENSIONS = /\.(js|css|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot)$/i;
const TIMING = { pollIntervalMs: 10_000, originTimeoutMs: 5 * 60_000, requestTimeoutMs: 30_000 };

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

// Expects `git diff -z` output, which keeps non-ASCII paths unquoted.
export function selectCachedPaths(diffOutput) {
    return diffOutput.split('\0').filter((path) => CACHED_EXTENSIONS.test(path));
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function git(...args) {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

// A new branch or a force push leaves no usable pushed-from commit; compare against the pushed commit's parent instead.
export function previousCommit(beforeSha, afterSha) {
    try {
        git('cat-file', '-e', `${beforeSha}^{commit}`);
        return beforeSha;
    } catch {
        return git('rev-parse', `${afterSha}^`).trim();
    }
}

// Git blob id of the content, to match a served file against the pushed version.
export function blobId(content) {
    return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
}

// Only the exact pushed version counts. A later merge's version doesn't: that merge's run cancels this one and purges
// everything anyway.
async function isServed({ path, blob }, timeoutMs) {
    try {
        const response = await fetch(`${ORIGIN}/${encodeURI(path)}`, { signal: AbortSignal.timeout(timeoutMs) });
        if (!response.ok) return false;
        return blobId(Buffer.from(await response.arrayBuffer())) === blob;
    } catch {
        return false;
    }
}

// Sequential on purpose: aem.live throttles bursts from automation.
async function findStale(files, deadline, timing) {
    const stale = [];
    for (const file of files) {
        const remainingMs = deadline - Date.now();
        const served = remainingMs > 0 && (await isServed(file, Math.min(timing.requestTimeoutMs, remainingMs)));
        if (!served) stale.push(file);
    }
    return stale;
}

async function waitUntilServed(files, timing) {
    const deadline = Date.now() + timing.originTimeoutMs;
    let stale = await findStale(files, deadline, timing);
    while (stale.length && Date.now() < deadline) {
        await sleep(timing.pollIntervalMs);
        stale = await findStale(stale, deadline, timing);
    }
    return stale;
}

async function purge(credentials, timing) {
    const body = JSON.stringify({ objects: [CP_CODE] });
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
        signal: AbortSignal.timeout(timing.requestTimeoutMs),
    });
    const result = await response.json().catch(() => ({}));
    if (response.status !== 201) {
        throw new Error(`Akamai purge failed with ${response.status}: ${result.title ?? ''} ${result.detail ?? ''}`);
    }
    console.log(`Invalidated CP code ${CP_CODE} on mas.adobe.com (purge ${result.purgeId}, ~${result.estimatedSeconds}s)`);
}

function listPaths(files) {
    return files
        .slice(0, 5)
        .map(({ path }) => path)
        .join(', ');
}

// Purging before code sync finishes would refill the edge with the old files, so a stale file fails the run instead.
export async function run({ files, credentials, timing = TIMING }) {
    const stale = await waitUntilServed(files, timing);
    if (stale.length) {
        throw new Error(
            `aem.live does not serve the pushed version of ${stale.length} files (${listPaths(stale)}); re-run once code sync catches up`,
        );
    }
    await purge(credentials, timing);
}

async function main() {
    const { BEFORE_SHA, AFTER_SHA = 'HEAD' } = process.env;
    const credentials = {
        host: process.env.AKAMAI_HOST,
        clientToken: process.env.AKAMAI_CLIENT_TOKEN,
        clientSecret: process.env.AKAMAI_CLIENT_SECRET,
        accessToken: process.env.AKAMAI_ACCESS_TOKEN,
    };
    if (Object.values(credentials).some((value) => !value)) {
        throw new Error('Set AKAMAI_HOST, AKAMAI_CLIENT_TOKEN, AKAMAI_CLIENT_SECRET and AKAMAI_ACCESS_TOKEN.');
    }
    if (!BEFORE_SHA) {
        await run({ files: [], credentials });
        return;
    }

    const previous = previousCommit(BEFORE_SHA, AFTER_SHA);
    // Deleted files have no pushed version to wait for. Studio also loads io/www/src (through
    // studio/libs/fragment-client.js) and some web-components/src modules unbundled.
    const diff = git(
        'diff',
        '-z',
        '--name-only',
        '--no-renames',
        '--diff-filter=d',
        previous,
        AFTER_SHA,
        '--',
        'studio',
        'web-components/dist',
        'web-components/src',
        'io/www/src',
    );
    // Purges even when no cached file changed: this run may have cancelled an older one that still had files to purge.
    const files = selectCachedPaths(diff).map((path) => ({ path, blob: git('rev-parse', `${AFTER_SHA}:${path}`).trim() }));
    console.log(`Waiting for aem.live to serve ${files.length} changed files`);
    await run({ files, credentials });
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url));
if (isDirectRun) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
