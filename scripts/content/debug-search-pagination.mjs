/**
 * Probe /adobe/sites/cf/fragments/search pagination for one folder/model combo.
 * Follows cursor until exhaustion and reports per-page sizes + total.
 *
 * Usage:
 *   MAS_IMS_TOKEN=<token> MAS_API_KEY=mas-studio \
 *   node scripts/content/debug-search-pagination.mjs \
 *       --author-host <aem-author-host> \
 *       --folder /content/dam/mas/acom/lt_LT \
 *       [--model-ids L2NvbmYvbWFzL...,L2NvbmYvbWFzL...]   # comma-separated, default: card + collection + dict-entry + dict-index
 */

import { createHeaders } from './common.js';

const CARD_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ';
const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';
const DICTIONARY_ENTRY_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25uYXJ5';
const DICTIONARY_INDEX_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25hcnk';

const args = process.argv.slice(2);
const getFlag = (name) => {
    const idx = args.indexOf(name);
    return idx >= 0 && idx < args.length - 1 ? args[idx + 1] : null;
};

const authorHost = getFlag('--author-host');
const folder = getFlag('--folder');
const modelIdsArg = getFlag('--model-ids');
const token = process.env.MAS_IMS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!authorHost || !folder || !token || !apiKey) {
    console.error(
        'Usage: MAS_IMS_TOKEN=<t> MAS_API_KEY=<k> node debug-search-pagination.mjs --author-host <host> --folder <path> [--model-ids a,b,c]',
    );
    process.exit(1);
}

const modelIds = modelIdsArg
    ? modelIdsArg
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
    : [CARD_MODEL_ID, COLLECTION_MODEL_ID, DICTIONARY_ENTRY_MODEL_ID, DICTIONARY_INDEX_MODEL_ID];

const baseUrl = `https://${authorHost}`;
const headers = createHeaders(token, apiKey);
const query = JSON.stringify({
    filter: { path: folder, modelIds },
    sort: [{ on: 'created', order: 'ASC' }],
});

console.log(`Folder:     ${folder}`);
console.log(`Model IDs:  ${modelIds.length} (${modelIds.map((m) => m.slice(-12)).join(', ')})`);
console.log('');

let cursor = null;
let page = 0;
let total = 0;
const pageSizes = [];

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
    cursor = data.cursor ?? null;
    if (!cursor) break;
    if (page >= 50) {
        console.log('Stopped at 50 pages to avoid runaway.');
        break;
    }
}

console.log('');
console.log(`Pages: ${page}   Total items: ${total}`);
console.log(`Page sizes: [${pageSizes.join(', ')}]`);
if (pageSizes.length > 1 && pageSizes.every((s, i, arr) => i === arr.length - 1 || s === arr[0])) {
    console.log(`Uniform page size of ${pageSizes[0]} across all paginated pages — likely the server's page-size limit.`);
}
