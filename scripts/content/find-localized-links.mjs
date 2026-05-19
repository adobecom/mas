/**
 * Finds cards with hardcoded locales in links, fixes them and publishes
 *
 * Usage:
 *   MAS_IMS_TOKEN=<token> MAS_API_KEY=mas-studio \
 *   node scripts/content/find-localized-links.mjs \
 *       --author-host <aem-author-host> \
 *       --folder /content/dam/mas/sandbox/fr_FR \
 *       --locale fr \
 *       --dry-run
 */

import { CARD_MODEL_ID, createHeaders, parseArgs } from './common.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function publishFragment(fragment) {
    const payload = {
        paths: [fragment.path],
        filterReferencesByStatus: [],
    };

    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/publish`, {
        method: 'POST',
        headers: {
            ...headers,
            'If-Match': fragment.etag,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to publish fragment: ${response.status} ${response.statusText}`);
    }
    await wait(5000);
}

const { getFlag, hasFlag } = parseArgs(process.argv);

const authorHost = getFlag('--author-host');
const folder = getFlag('--folder');
const locale = getFlag('--locale');
const dryRun = hasFlag('--dry-run');
const token = process.env.MAS_IMS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!authorHost || !folder || !token || !apiKey || !locale) {
    console.error(
        'Usage: MAS_IMS_TOKEN=<t> MAS_API_KEY=<k> node find-localized-links.mjs --author-host <host> --folder <path> --locale <locale> --dry-run',
    );
    process.exit(1);
}

const modelIds = [CARD_MODEL_ID];
const baseUrl = `https://${authorHost}`;
const headers = createHeaders(token, apiKey);
const query = JSON.stringify({
    filter: { path: folder, modelIds },
    sort: [{ on: 'created', order: 'ASC' }],
});

console.log(`Folder:     ${folder}`);
console.log('');

let cursor = null;
let page = 0;
let total = 0;
const pageSizes = [];
const hits = [];

while (true) {
    const params = new URLSearchParams({ query });
    if (cursor) params.set('cursor', cursor);
    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/search?${params}`, { headers });
    if (!response.ok) {
        console.error(`Page ${page + 1}: HTTP ${response.status} ${response.statusText}`);
        process.exit(1);
    }
    const data = await response.json();
    const items = data.items || [];
    page += 1;
    total += items.length;
    pageSizes.push(items.length);
    console.log(
        `Page ${String(page).padStart(3)}  items=${String(items.length).padStart(4)}  total=${String(total).padStart(5)}  nextCursor=${data.cursor ? 'yes' : 'no'}`,
    );

    items.forEach((p) => {
        const fieldsToUpdate = [];
        let toUpdate = false;
        p.fields.forEach((f) => {
            if (
                f.values.length &&
                (typeof f.values[0] === 'string' || f.values[0] instanceof String) &&
                f.values[0].includes(`www.adobe.com/${locale}/`)
            ) {
                fieldsToUpdate.push(f.name);
                toUpdate = true;
                f.values[0] = f.values[0].replaceAll(`www.adobe.com/${locale}/`, 'www.adobe.com/');
            }
        });
        if (toUpdate) {
            hits.push({
                fields: fieldsToUpdate,
                item: p,
            });
        }
    });

    cursor = data.cursor ?? null;
    if (!cursor) break;
    if (page >= 50) {
        console.log('Stopped at 50 pages to avoid runaway.');
        break;
    }
}

console.log('Number of cards to update : ', Object.entries(hits).length);
console.log('');

if (dryRun) {
    console.log('\n[dry-run] Not saving any changes');
} else {
    hits.forEach(async (fragment) => {
        console.log('SAVE ', fragment.item.id, ' updated fields ', fragment.fields);
        const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/${fragment.item.id}`, {
            method: 'PUT',
            headers: { ...headers, 'If-Match': fragment.item.etag },
            body: JSON.stringify({
                title: fragment.item.title,
                description: fragment.item.description,
                fields: fragment.item.fields,
            }),
        });

        if (response.ok && fragment.item.status === 'PUBLISHED') {
            console.log('PUBLISH ', fragment.item.id);
            await publishFragment(fragment.item);
        }
    });
}
