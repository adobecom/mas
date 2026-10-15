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
// Fast Purge rejects request bodies over 50,000 bytes.
const MAX_PURGE_BYTES = 50_000;
// File types the mas.adobe.com property caches; HTML, JSON and the rest are no-store.
const CACHED_EXTENSIONS = /\.(js|css|svg|png|jpe?g|gif|webp|ico|woff2?|ttf|otf|eot)$/i;
const TIMING = { pollIntervalMs: 10_000, originTimeoutMs: 5 * 60_000, edgeTimeoutMs: 60_000, requestTimeoutMs: 30_000 };

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
export function selectPurgePaths(diffOutput) {
    return diffOutput.split('\0').filter((path) => CACHED_EXTENSIONS.test(path));
}

export function chunkUrls(urls, maxBytes = MAX_PURGE_BYTES) {
    const chunks = [];
    let chunk = [];
    for (const url of urls) {
        if (chunk.length && Buffer.byteLength(JSON.stringify({ objects: [...chunk, url] })) > maxBytes) {
            chunks.push(chunk);
            chunk = [];
        }
        chunk.push(url);
    }
    if (chunk.length) chunks.push(chunk);
    return chunks;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function git(...args) {
    return execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

function readPrevious(sha, path) {
    try {
        return git('show', `${sha}:${path}`);
    } catch {
        return null;
    }
}

function toUrl(base, path) {
    return `${base}/${encodeURI(path)}`;
}

// A file is served once the host no longer returns the version from before the push. Comparing against "not the
// previous version" rather than "this push's version" lets a later merge that changed the same file count as served.
async function isServed(url, previous, timeoutMs) {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
        if (!response.ok) return false;
        const content = Buffer.from(await response.arrayBuffer());
        return !previous || !content.equals(previous);
    } catch {
        return false;
    }
}

// Sequential on purpose: aem.live throttles bursts from automation.
async function findStale(base, files, deadline, timing) {
    const stale = [];
    for (const file of files) {
        const remainingMs = deadline - Date.now();
        const served =
            remainingMs > 0 &&
            (await isServed(toUrl(base, file.path), file.previous, Math.min(timing.requestTimeoutMs, remainingMs)));
        if (!served) stale.push(file);
    }
    return stale;
}

async function waitUntilServed(base, files, timeoutMs, timing) {
    const deadline = Date.now() + timeoutMs;
    let stale = await findStale(base, files, deadline, timing);
    while (stale.length && Date.now() < deadline) {
        await sleep(timing.pollIntervalMs);
        stale = await findStale(base, stale, deadline, timing);
    }
    return stale;
}

async function purge(credentials, urls, timing) {
    let estimatedSeconds = 0;
    for (const objects of chunkUrls(urls)) {
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
            signal: AbortSignal.timeout(timing.requestTimeoutMs),
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

function listPaths(files) {
    return files
        .slice(0, 5)
        .map(({ path }) => path)
        .join(', ');
}

// Purges the files aem.live already serves; fails if any stayed stale so the job goes red and can be re-run.
export async function run({ files, credentials, timing = TIMING }) {
    console.log(`Waiting for aem.live to serve ${files.length} changed files`);
    const stale = await waitUntilServed(ORIGIN, files, timing.originTimeoutMs, timing);
    const ready = files.filter((file) => !stale.includes(file));
    const estimatedSeconds = ready.length
        ? await purge(
              credentials,
              ready.map(({ path }) => toUrl(EDGE, path)),
              timing,
          )
        : 0;
    if (stale.length) {
        throw new Error(
            `aem.live still serves the previous version of ${stale.length} files (${listPaths(stale)}); re-run once code sync catches up`,
        );
    }

    const [probe] = ready;
    await sleep(estimatedSeconds * 1000);
    if ((await waitUntilServed(EDGE, [probe], timing.edgeTimeoutMs, timing)).length) {
        throw new Error(`mas.adobe.com still serves the previous ${probe.path} after the purge`);
    }
    console.log(`mas.adobe.com serves the new ${probe.path}`);
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

    // Deleted files stay cached on purpose: tabs still running the old Studio may lazy-load them.
    const diff = git(
        'diff',
        '-z',
        '--name-only',
        '--diff-filter=d',
        BEFORE_SHA,
        AFTER_SHA,
        '--',
        'studio',
        'web-components/dist',
    );
    const paths = selectPurgePaths(diff.toString());
    if (!paths.length) {
        console.log('No cached Studio files changed.');
        return;
    }
    await run({ files: paths.map((path) => ({ path, previous: readPrevious(BEFORE_SHA, path) })), credentials });
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url));
if (isDirectRun) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
