/**
 * Validates a content fragment's reference graph by fetching every reference
 * individually from the AEM author API — no `all-hydrated`, so a broken reference
 * can't be silently swallowed by hydration, and every fragment's publication
 * status (status + previewReplicationStatus) is reported as we walk.
 *
 * For a fragment, it reads each `content-fragment` field (precise — by field type,
 * not by value shape), fetches every referenced fragment on its own, and recurses
 * into the ones that resolve. A reference that 404s (by id) or resolves to no item
 * (by path) is reported as an absent / invalid reference.
 *
 * Auth: author API needs an IMS token + api key.
 *   export MAS_IMS_TOKEN=<token>   # copy(adobeid.authorize()) from MAS Studio devtools
 *   export MAS_API_KEY=mas-studio  # optional, defaults to mas-studio
 *
 * Usage:
 *   node check-references.mjs --id e58f8f75-b882-409a-9ff8-8826b36a8368
 *   node check-references.mjs --id <id> --author-host <host>          # default author-p22655-e59433.adobeaemcloud.com
 *   node check-references.mjs --id <id> --fields cards,collections    # restrict to named fields
 *   node check-references.mjs --id <id> --max 2000                    # cap fragments visited
 *
 * Exit codes: 0 = no invalid references, 1 = bad usage / root fetch failed,
 * 2 = at least one absent/invalid reference found.
 */

import { createHeaders, parseArgs } from './common.js';

const DEFAULT_AUTHOR_HOST = 'author-p22655-e59433.adobeaemcloud.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const { getFlag } = parseArgs(process.argv);

const id = getFlag('--id');
const authorHost = getFlag('--author-host') || DEFAULT_AUTHOR_HOST;
const fieldsFilter = getFlag('--fields')
    ? new Set(
          getFlag('--fields')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
      )
    : null;
const max = Number(getFlag('--max')) || 5000;
const token = process.env.MAS_IMS_TOKEN;
const apiKey = process.env.MAS_API_KEY || 'mas-studio';

if (!id || !token) {
    console.error(
        'Usage: MAS_IMS_TOKEN=<token> node check-references.mjs --id <fragmentId> [--author-host <host>] [--fields a,b] [--max N]',
    );
    process.exit(1);
}

const baseUrl = `https://${authorHost}/adobe/sites/cf/fragments`;
const headers = createHeaders(token, apiKey);

// Resolve a reference (UUID or /content path) to { status, fragment }.
// status is the HTTP status; fragment is the resolved CF object or null when absent.
async function fetchReference(identifier) {
    if (UUID.test(identifier)) {
        const response = await fetch(`${baseUrl}/${identifier}`, { headers });
        return { status: response.status, fragment: response.ok ? await response.json() : null };
    }
    const params = new URLSearchParams({ path: identifier });
    const response = await fetch(`${baseUrl}?${params}`, { headers });
    if (!response.ok) return { status: response.status, fragment: null };
    const { items } = await response.json();
    return { status: response.status, fragment: items?.length ? items[0] : null };
}

// content-fragment field values, tagged with their field name
function extractReferences(node) {
    const refs = [];
    for (const field of node.fields ?? []) {
        if (field.type !== 'content-fragment') continue;
        if (fieldsFilter && !fieldsFilter.has(field.name)) continue;
        for (const value of field.values ?? []) refs.push({ fieldName: field.name, identifier: value });
    }
    return refs;
}

const statusLine = (f) => `[${f.status ?? 'UNKNOWN'}, preview=${f.previewReplicationStatus ?? 'UNKNOWN'}]`;

const visited = new Set();
const invalid = [];
const statusCounts = {};
let count = 0;

async function walk(node, depth) {
    for (const { fieldName, identifier } of extractReferences(node)) {
        if (identifier === node.id || identifier === node.path) continue; // self
        if (visited.has(identifier)) continue;
        visited.add(identifier);
        if (count >= max) {
            console.warn(`\n[stopped] visited cap of ${max} reached — pass --max to raise it.`);
            return;
        }
        count += 1;

        const indent = '  '.repeat(depth + 1);
        const { status, fragment } = await fetchReference(identifier);
        if (!fragment) {
            invalid.push({ from: node.path, fromField: fieldName, target: identifier, status });
            console.log(`${indent}✗ ${fieldName} → ${identifier}  (ABSENT, HTTP ${status})`);
            continue;
        }
        statusCounts[fragment.status] = (statusCounts[fragment.status] ?? 0) + 1;
        console.log(`${indent}${fieldName} → ${fragment.path}  ${statusLine(fragment)}`);
        await walk(fragment, depth + 1);
    }
}

console.log(`Author:   ${authorHost}`);
console.log(`Fragment: ${id}\n`);

const root = await fetchReference(id);
if (!root.fragment) {
    console.error(`Root fetch failed: HTTP ${root.status}`);
    process.exit(1);
}
visited.add(id);
statusCounts[root.fragment.status] = (statusCounts[root.fragment.status] ?? 0) + 1;

console.log(`Root: ${root.fragment.path}  ${statusLine(root.fragment)}`);
console.log('Walking reference graph (one fetch per reference)...\n');
await walk(root.fragment, 0);

console.log(`\nFetched ${count} reference(s) across the graph.`);
console.log(
    `Status breakdown: ${
        Object.entries(statusCounts)
            .map(([k, v]) => `${k}=${v}`)
            .join('  ') || '(none)'
    }`,
);
if (invalid.length === 0) {
    console.log('No invalid references found.');
    process.exit(0);
}

console.log(`\n${invalid.length} invalid reference(s):`);
for (const ref of invalid) {
    console.log(`  - ${ref.target}  (referenced by ${ref.from}.${ref.fromField}, HTTP ${ref.status})`);
}
process.exit(2);
