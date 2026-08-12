#!/usr/bin/env node
/**
 * Cleanup script — deletes test fragments created by seed-test-data.mjs.
 *
 * Usage:
 *   AEM_BASE_URL=https://author-p22655-e59471.adobeaemcloud.com \
 *   IMS_TOKEN=<your_token> \
 *   node scripts/cleanup-test-data.mjs <UID>
 *
 * The UID is the short 4-char code printed when seed-test-data.mjs runs (e.g. "A3KX").
 * The script will list all matching fragments and ask for confirmation before deleting.
 */

import { createInterface } from 'readline';

const AEM_BASE_URL = process.env.AEM_BASE_URL ?? 'https://author-p22655-e59433.adobeaemcloud.com';
const IMS_TOKEN = process.env.IMS_TOKEN;
const UID = process.argv[2];

if (!IMS_TOKEN) {
    console.error('❌  IMS_TOKEN env var is required');
    process.exit(1);
}
if (!UID) {
    console.error('❌  UID argument is required (e.g. node cleanup-test-data.mjs A3KX)');
    process.exit(1);
}

const CF_URL = `${AEM_BASE_URL}/adobe/sites/cf/fragments`;
const CF_SEARCH_URL = `${CF_URL}/search`;
const SEARCH_PATH = '/content/dam/mas/sandbox';
const TITLE_MARKER = `[${UID.toUpperCase()}]`;

const headers = {
    Authorization: `Bearer ${IMS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Adobe-Accept-Experimental': '1',
};

// ─── helpers ────────────────────────────────────────────────────────────────

async function searchFragments() {
    // Search by UID (without brackets — special chars confuse fullText index).
    // Then filter client-side to only keep fragments whose title contains "[UID]".
    const query = JSON.stringify({
        filter: {
            path: SEARCH_PATH,
            fullText: {
                text: UID.toUpperCase(),
                queryMode: 'EDGES',
            },
        },
    });

    const allItems = [];
    let cursor;

    do {
        const params = new URLSearchParams({ query });
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`${CF_SEARCH_URL}?${params}`, { headers });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`search failed: ${res.status} ${text}`);
        }
        const data = await res.json();
        allItems.push(...(data.items ?? []));
        cursor = data.cursor;
    } while (cursor);

    // Client-side filter: title must contain "[UID]" to avoid false positives
    return allItems.filter((f) => f.title?.includes(TITLE_MARKER));
}

async function deleteFragment(fragment) {
    // Fetch current ETag — required by the CF API for DELETE
    const getRes = await fetch(`${CF_URL}/${fragment.id}`, { headers });
    if (getRes.status === 404) {
        console.log(`  - already gone  ${fragment.path}`);
        return;
    }
    if (!getRes.ok) {
        const text = await getRes.text().catch(() => '');
        throw new Error(`GET ${fragment.path}: ${getRes.status} ${text}`);
    }
    const etag = getRes.headers.get('ETag');

    const res = await fetch(`${CF_URL}/${fragment.id}`, {
        method: 'DELETE',
        headers: { ...headers, 'If-Match': etag },
    });
    if (!res.ok && res.status !== 404) {
        const text = await res.text().catch(() => '');
        throw new Error(`DELETE ${fragment.path}: ${res.status} ${text}`);
    }
    console.log(`  ✓ deleted  ${fragment.path}`);
}

function prompt(question) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase());
        });
    });
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`\nAEM:    ${AEM_BASE_URL}`);
    console.log(`UID:    ${UID.toUpperCase()}`);
    console.log(`Search: ${SEARCH_PATH} (title contains "${TITLE_MARKER}")\n`);

    console.log('Searching for fragments...');
    const fragments = await searchFragments();

    if (fragments.length === 0) {
        console.log(`\n✅  No fragments found matching UID "${UID.toUpperCase()}". Nothing to delete.`);
        return;
    }

    console.log(`\nFound ${fragments.length} fragment(s):\n`);
    for (const f of fragments) {
        console.log(`  [${f.status ?? '?'}]  ${f.path}`);
    }

    console.log('');
    const answer = await prompt(`Delete all ${fragments.length} fragment(s)? Type "yes" to confirm: `);

    if (answer !== 'yes') {
        console.log('\n⛔  Aborted. No fragments were deleted.');
        return;
    }

    console.log('\nDeleting...');
    let remaining = [...fragments];
    let deleted = 0;
    const MAX_PASSES = 5;

    for (let pass = 1; pass <= MAX_PASSES && remaining.length > 0; pass++) {
        if (pass > 1) console.log(`\n  (pass ${pass} — retrying ${remaining.length} with unresolved references...)`);
        const failed = [];
        for (const f of remaining) {
            try {
                await deleteFragment(f);
                deleted++;
            } catch (err) {
                if (err.message.includes('409')) {
                    failed.push(f); // retry next pass once referencing fragments are gone
                } else {
                    console.error(`  ✗ ${err.message}`);
                }
            }
        }
        remaining = failed;
    }

    if (remaining.length > 0) {
        console.log(`\n⚠️  Could not delete ${remaining.length} fragment(s) (still referenced by something outside this set):`);
        for (const f of remaining) console.log(`    ${f.path}`);
    }

    console.log(`\n✅  Done — deleted: ${deleted}, unresolvable: ${remaining.length}`);
}

main().catch((err) => {
    console.error('\n❌', err.message);
    process.exit(1);
});
