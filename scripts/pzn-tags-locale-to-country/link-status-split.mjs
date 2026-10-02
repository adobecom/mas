/**
 * Splits a `.txt` list of MAS Studio links (as written by `variation-links.mjs`) into separate
 * files by each fragment's *live* status on an author environment: draft, modified, published.
 * Anything else — an unexpected status, a deleted fragment, a request that kept failing — lands
 * in a fourth `-other.txt` with the status appended, so no input link is ever silently dropped.
 *
 * Read-only: it never writes to AEM. Output files are written next to the input file.
 *
 * Auth:
 *   export MAS_IMS_TOKEN=<token>   # copy(adobeid.authorize()) from MAS Studio devtools
 *   export MAS_API_KEY=mas-studio
 *
 * Usage:
 *   node link-status-split.mjs tmp/ACOM-31-08.txt --author-host <host>
 *   node link-status-split.mjs tmp/ACOM-31-08.txt --author-host <host> --concurrency 8
 *
 * Exit codes: 0 = files written, 1 = bad usage / fatal error.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHeaders, parseArgs, wait } from '../content/common.js';
import { ALLOWED_AUTHOR_HOSTS } from './pzn-tag-mapping.mjs';

export const STATUS_BUCKETS = { DRAFT: 'draft', MODIFIED: 'modified', PUBLISHED: 'published' };
export const OTHER_BUCKET = 'other';
export const BUCKETS = [...Object.values(STATUS_BUCKETS), OTHER_BUCKET];
export const MISSING_STATUS = 'MISSING';
const THROTTLE_MS = 250;
const DEFAULT_CONCURRENCY = 4;

export function parseStudioLink(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;
    const hash = trimmed.slice(trimmed.indexOf('#') + 1);
    const params = new URLSearchParams(hash);
    const id = params.get('query');
    if (!id) return null;
    return { link: trimmed, surface: params.get('path') ?? '', id };
}

export function parseLinks(text) {
    const seen = new Set();
    const entries = [];
    for (const line of text.split('\n')) {
        const entry = parseStudioLink(line);
        if (!entry || seen.has(entry.id)) continue;
        seen.add(entry.id);
        entries.push(entry);
    }
    return entries;
}

export function bucketFor(status) {
    return STATUS_BUCKETS[String(status ?? '').toUpperCase()] ?? OTHER_BUCKET;
}

export function outputPathFor(inputFile, bucket) {
    return join(dirname(inputFile), `${basename(inputFile, extname(inputFile))}-${bucket}.txt`);
}

export function linesFor(entries, bucket) {
    return entries
        .filter((entry) => bucketFor(entry.status) === bucket)
        .map((entry) => (bucket === OTHER_BUCKET ? `${entry.link}\t${entry.status}` : entry.link));
}

export async function fetchStatus(baseUrl, id, headers, fetchImpl) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const response = await fetchImpl(`${baseUrl}/adobe/sites/cf/fragments/${id}`, { headers });
            if (response.status === 404) return MISSING_STATUS;
            if (response.ok) {
                const body = await response.json();
                return body?.status ?? 'UNKNOWN';
            }
            if (response.status < 500) return `ERROR ${response.status}`;
            if (attempt === 0) await wait(THROTTLE_MS * 4);
            else return `ERROR ${response.status}`;
        } catch (error) {
            if (attempt === 1) return `ERROR ${error.message}`;
            await wait(THROTTLE_MS * 4);
        }
    }
    return 'UNKNOWN';
}

export async function run({ inputFile, authorHost, token, apiKey, concurrency = DEFAULT_CONCURRENCY, fetchImpl = fetch }) {
    const baseUrl = `https://${authorHost}`;
    const headers = createHeaders(token, apiKey);
    const entries = parseLinks(await readFile(inputFile, 'utf8'));
    if (!entries.length) throw new Error(`No Studio links found in ${inputFile}`);

    let next = 0;
    let done = 0;
    const worker = async () => {
        while (next < entries.length) {
            const entry = entries[next++];
            entry.status = await fetchStatus(baseUrl, entry.id, headers, fetchImpl);
            done += 1;
            if (done % 50 === 0) console.log(`  ${done}/${entries.length} resolved`);
            await wait(THROTTLE_MS);
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, entries.length) }, worker));

    const written = [];
    for (const bucket of BUCKETS) {
        const lines = linesFor(entries, bucket);
        if (!lines.length) continue;
        const outFile = outputPathFor(inputFile, bucket);
        await writeFile(outFile, `${lines.join('\n')}\n`, 'utf8');
        written.push({ bucket, outFile, count: lines.length });
    }

    console.log(`\n${entries.length} unique fragment(s) from ${basename(inputFile)}:`);
    for (const { bucket, outFile, count } of written) {
        console.log(`  ${String(count).padStart(5)}  ${bucket.padEnd(9)}  ${basename(outFile)}`);
    }
    const missing = BUCKETS.filter((bucket) => !written.some((entry) => entry.bucket === bucket));
    if (missing.length) console.log(`  (no links for: ${missing.join(', ')})`);
    return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { getFlag } = parseArgs(process.argv);
    const positional = process.argv.slice(2).find((arg) => !arg.startsWith('-') && /\.txt$/i.test(arg));
    const authorHost = getFlag('--author-host');
    const token = process.env.MAS_IMS_TOKEN;

    if (!positional || !authorHost || !token) {
        console.error(
            'Usage: MAS_IMS_TOKEN=<token> MAS_API_KEY=<key> node link-status-split.mjs <links.txt> --author-host <host> [--concurrency 4]',
        );
        process.exit(1);
    }
    if (!ALLOWED_AUTHOR_HOSTS.includes(authorHost)) {
        console.error(`--author-host ${authorHost} is not in the allowlist: ${ALLOWED_AUTHOR_HOSTS.join(', ')}`);
        process.exit(1);
    }

    run({
        inputFile: resolve(positional),
        authorHost,
        token,
        apiKey: process.env.MAS_API_KEY || 'mas-studio',
        concurrency: Number(getFlag('--concurrency')) || DEFAULT_CONCURRENCY,
    }).catch((error) => {
        console.error(`\nSplit failed: ${error.message}`);
        process.exit(1);
    });
}
