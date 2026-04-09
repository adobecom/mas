/**
 * List or delete Content Fragments under /content/dam/mas/{surface}/{LOCALE_FOLDER}.
 */

const { join } = require('node:path');
const { fetchOdin, processBatchWithConcurrency, getFragmentWithEtag, deleteFragmentById } = require(
    join(__dirname, '../../io/studio/src/common.js'),
);

const ODIN_ENDPOINT = process.env.AEM_BASE_URL?.replace(/\/$/, '');
const AUTH_TOKEN = process.env.AEM_TOKEN;
const DRY_RUN = process.env.DRY_RUN !== 'false';
const LOCALE_FOLDER = (process.env.LOCALE_FOLDER || '').trim();
const CONCURRENCY = Math.max(1, parseInt(process.env.CONCURRENCY || '5', 10));
const SURFACES = (process.env.SURFACES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const ROOT = '/content/dam/mas';

const defaultSearchQuery = {
    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
};

if (!ODIN_ENDPOINT || !AUTH_TOKEN) {
    console.error('Set AEM_BASE_URL and AEM_TOKEN');
    process.exit(1);
}

if (!LOCALE_FOLDER) {
    console.error('Set LOCALE_FOLDER');
    process.exit(1);
}

if (!SURFACES.length) {
    console.error('Set SURFACES');
    process.exit(1);
}

async function searchUnderFolder(folderPath) {
    const all = [];
    let cursor;
    for (;;) {
        const queryObj = { ...defaultSearchQuery, filter: { path: folderPath } };
        const params = new URLSearchParams({ query: JSON.stringify(queryObj) });
        if (cursor) params.set('cursor', cursor);
        const URI = `/adobe/sites/cf/fragments/search?${params.toString()}`;
        const response = await fetchOdin(ODIN_ENDPOINT, URI, AUTH_TOKEN, { method: 'GET' });
        const data = await response.json();
        all.push(...(data.items || []));
        cursor = data.cursor || null;
        if (!cursor) break;
    }
    return all;
}

async function main() {
    console.log('Delete locale folder fragments\n');
    console.log(`  Dry-run: ${DRY_RUN ? 'yes' : 'no'}`);
    console.log(`  Locale folder: ${LOCALE_FOLDER}`);
    console.log(`  Surfaces: ${SURFACES.join(', ')}`);
    console.log(`  Endpoint: ${ODIN_ENDPOINT}/adobe/sites/cf/fragments\n`);

    let totalFound = 0;
    let deleted = 0;
    let failed = 0;

    for (const surface of SURFACES) {
        const folderPath = `${ROOT}/${surface}/${LOCALE_FOLDER}`;
        console.log(`Path: ${folderPath}`);

        let fragments;
        try {
            fragments = await searchUnderFolder(folderPath);
        } catch (e) {
            console.error(`  Error: ${e.message}`);
            continue;
        }

        if (fragments.length === 0) {
            console.log(`  Count: 0\n`);
            continue;
        }

        totalFound += fragments.length;
        console.log(`  Count: ${fragments.length}`);
        for (const frag of fragments) {
            console.log(`  ${frag.path} [${frag.id}] ${frag.title ?? ''}`);
        }

        if (DRY_RUN) {
            console.log('  Dry run, skipping deletes.');
            continue;
        }

        const batchResults = await processBatchWithConcurrency(fragments, CONCURRENCY, async (frag) => {
            try {
                const data = await getFragmentWithEtag(ODIN_ENDPOINT, frag.id, AUTH_TOKEN);
                if (!data?.etag) throw new Error(`No etag for ${frag.id}`);
                await deleteFragmentById(ODIN_ENDPOINT, frag.id, AUTH_TOKEN, data.etag);
                return { ok: true };
            } catch (err) {
                console.error(`  FAIL ${frag.path}: ${err.message}`);
                return { ok: false };
            }
        });

        for (const r of batchResults) {
            if (r.ok) deleted += 1;
            else failed += 1;
        }
        console.log('');
    }

    console.log('---');
    if (DRY_RUN) {
        console.log(`Total found: ${totalFound} | deleted: 0 (dry-run)`);
    } else {
        console.log(`Total found: ${totalFound} | deleted: ${deleted} | failed: ${failed}`);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
