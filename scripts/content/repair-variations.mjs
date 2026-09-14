/**
 * Copies a source content fragment's `variations` field onto its localized live
 * copies. A localized `variations` value can go stale (still inherited, but the
 * source changed after the last rollout) — this re-syncs it: for each target it
 * suspends the live copy, PUTs the source's current value, then resumes it.
 *
 * Live copies are listed with cursor pagination and processed through a
 * concurrency pool. DRY-RUN BY DEFAULT — pass --apply to write.
 *
 * Auth: author API needs an access token + api key, from the env or a .env file:
 *   MAS_ACCESS_TOKEN=<token>   # copy(adobeid.authorize()) from MAS Studio devtools
 *   MAS_API_KEY=mas-studio
 *
 * Usage:
 *   node repair-variations.mjs --source <en_US-fragment-id> [--bucket author-p22655-e59433] [--locale bg_BG] \
 *        [--field variations] [--concurrency 4] [--apply]
 *
 * VERIFIED against sibling scripts / OpenAPI specs:
 *   GET  {cf}/{id}            read a fragment (fields, etag)
 *   GET  {cf}?path={path}     resolve a fragment by path -> items[0]
 *   PUT  {cf}/{id}            full-body update {title,description,fields} + If-Match
 *   GET  {lc}?filterByResourceId={sourceId}[&cursor&limit]   list live copies of a source
 *   POST {lc}/{liveCopyId}/suspend | .../resume              halt/restore inheritance (204)
 *
 * NOTE: AEM refuses a write to a still-inherited field ("locked by live
 *   relationship") — suspend the live copy first, then resume after the write.
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHeaders, parseArgs, wait } from './common.js';

// Load a .env (cwd, then repo root) — mirrors the REST Client {{$dotenv}} setup.
if (typeof process.loadEnvFile === 'function') {
    const here = dirname(fileURLToPath(import.meta.url));
    for (const envPath of [resolve(process.cwd(), '.env'), resolve(here, '../../.env')]) {
        if (existsSync(envPath)) {
            process.loadEnvFile(envPath);
            break;
        }
    }
}

const { getFlag, hasFlag } = parseArgs(process.argv);

const bucket = getFlag('--bucket') || 'author-p22655-e59433';
const sourceId = getFlag('--source');
const field = getFlag('--field') || 'variations';
const localeFilter = getFlag('--locale'); // e.g. bg_BG — scope to one locale
const concurrency = Number(getFlag('--concurrency')) || 4;
const apply = hasFlag('--apply'); // dry-run unless --apply

const accessToken = process.env.MAS_ACCESS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!sourceId || !accessToken || !apiKey) {
    console.error(
        'Usage: node repair-variations.mjs --source <en_US-fragment-id> [--bucket author-p22655-e59433] [--locale <code>] [--field variations] [--concurrency 4] [--apply]',
    );
    console.error('Set MAS_ACCESS_TOKEN and MAS_API_KEY (e.g. in .env).');
    process.exit(1);
}

const baseUrl = `https://${bucket}.adobeaemcloud.com`;
const cf = `${baseUrl}/adobe/sites/cf/fragments`;
const lc = `${baseUrl}/adobe/liveCopies`;
const headers = createHeaders(accessToken, apiKey);
// bodyless POSTs (suspend/resume) 415 if a Content-Type is present
const bodylessHeaders = { Authorization: headers.Authorization, 'x-api-key': headers['x-api-key'] };

const fieldValues = (fragment) => fragment.fields?.find((f) => f.name === field)?.values ?? [];
const sameValues = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const liveCopyState = (isSuspended) => `live copy isSuspended=${isSuspended}`;

async function getFragmentById(id) {
    const response = await fetch(`${cf}/${id}`, { headers });
    if (!response.ok) throw new Error(`GET ${id} -> ${response.status} ${response.statusText}`);
    const fragment = await response.json();
    fragment.etag = response.headers.get('Etag') ?? fragment.etag;
    return fragment;
}

async function getFragmentByPath(path) {
    const params = new URLSearchParams({ path });
    const response = await fetch(`${cf}?${params}`, { headers });
    if (!response.ok) throw new Error(`GET path ${path} -> ${response.status} ${response.statusText}`);
    const { items } = await response.json();
    return items?.length ? items[0] : null;
}

// Full-body field update (mirrors repair-dictionary-entry.mjs#addMissingEntries).
async function writeFieldValues(fragment, values) {
    const fields = fragment.fields.map((f) => (f.name === field ? { ...f, values } : f));
    const response = await fetch(`${cf}/${fragment.id}`, {
        method: 'PUT',
        headers: { ...headers, 'If-Match': fragment.etag },
        body: JSON.stringify({ title: fragment.title, description: fragment.description, fields }),
    });
    if (!response.ok) throw new Error(`PUT ${fragment.id} -> ${response.status} ${await response.text().catch(() => '')}`);
    await wait(1000);
}

async function suspendLiveCopy(liveCopyId) {
    const response = await fetch(`${lc}/${liveCopyId}/suspend`, { method: 'POST', headers: bodylessHeaders });
    if (!response.ok) throw new Error(`suspend -> ${response.status} ${await response.text().catch(() => '')}`);
}

async function resumeLiveCopy(liveCopyId) {
    const response = await fetch(`${lc}/${liveCopyId}/resume`, { method: 'POST', headers: bodylessHeaders });
    if (!response.ok) throw new Error(`resume -> ${response.status} ${await response.text().catch(() => '')}`);
}

async function findLiveCopy(liveCopyId) {
    for await (const item of listLiveCopies()) {
        if (item.liveCopyId === liveCopyId) return item;
    }
    return null;
}

async function* listLiveCopies() {
    let cursor = '';
    do {
        const params = new URLSearchParams({ filterByResourceId: sourceId, limit: '50' });
        if (cursor) params.set('cursor', cursor);
        const response = await fetch(`${lc}?${params}`, { headers });
        if (!response.ok) throw new Error(`list live copies -> ${response.status} ${response.statusText}`);
        const page = await response.json();
        for (const item of page.items ?? []) yield item;
        cursor = page.cursor ?? '';
        if (cursor) await wait(1000);
    } while (cursor);
}

async function processTarget(liveCopy, sourceValues) {
    const rootPath = liveCopy.rootPath;
    const tag = rootPath.replace('/content/dam/mas/acom-dc/', '');

    const target = await getFragmentByPath(rootPath);
    if (!target) {
        console.log(
            `[${tag}] SKIP: no fragment at rootPath (tree-level live copy?) liveCopyId=${liveCopy.liveCopyId}; ${liveCopyState(liveCopy.isSuspended)}`,
        );
        return;
    }
    const label = `[${tag} ${target.id}]`;

    if (sameValues(fieldValues(target), sourceValues)) {
        console.log(`${label} ${field} already equals source — skipping; ${liveCopyState(liveCopy.isSuspended)}`);
        return;
    }

    if (!apply) {
        console.log(
            `${label} dry-run: would suspend -> set ${field}=${JSON.stringify(sourceValues)} -> resume; ${liveCopyState(liveCopy.isSuspended)}`,
        );
        return;
    }
    await suspendLiveCopy(liveCopy.liveCopyId);
    try {
        const unlocked = await getFragmentById(target.id); // fresh etag while suspended
        await writeFieldValues(unlocked, sourceValues); // copy source value
    } finally {
        await resumeLiveCopy(liveCopy.liveCopyId); // always restore inheritance
    }

    const current = await findLiveCopy(liveCopy.liveCopyId);
    console.log(`${label} ${liveCopyState(current?.isSuspended)}`);

    const after = fieldValues(await getFragmentById(target.id));
    if (sameValues(after, sourceValues)) console.log(`${label} OK  ${field} == source`);
    else throw new Error(`${label} MISMATCH after write: ${JSON.stringify(after)} != ${JSON.stringify(sourceValues)}`);
}

async function pool(items, size, worker) {
    const queue = items.slice();
    const errors = [];
    const run = async () => {
        let item;
        while ((item = queue.shift()) !== undefined) {
            try {
                await worker(item);
            } catch (error) {
                errors.push(error);
                console.error(`  - ${error.message}`);
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(size, items.length) || 1 }, run));
    return errors;
}

async function run() {
    const source = await getFragmentById(sourceId);
    const sourceValues = fieldValues(source);
    console.log(`Source ${source.path}`);
    console.log(`Source ${field} = ${JSON.stringify(sourceValues)}`);
    console.log(apply ? '--apply (writes enabled)' : 'DRY-RUN (no writes; pass --apply to write)');

    const targets = [];
    for await (const liveCopy of listLiveCopies()) {
        if (localeFilter && !liveCopy.rootPath.includes(`/${localeFilter}/`)) continue;
        targets.push(liveCopy);
    }
    console.log(`Live copies to process: ${targets.length}${localeFilter ? ` (locale ${localeFilter})` : ''}\n`);

    const errors = await pool(targets, concurrency, (liveCopy) => processTarget(liveCopy, sourceValues));
    console.log('\nDone.');
    if (errors.length) process.exit(1);
}

run().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
});
