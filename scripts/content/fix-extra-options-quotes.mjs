import { CARD_MODEL_ID, createHeaders, parseArgs, wait } from './common.js';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const FIELDS = ['ctas', 'cta', 'description', 'shortDescription'];

const DATA_EXTRA_OPTIONS_REGEX = /data-extra-options="(\{[^}]*\})"/g;

export function fixExtraOptionsQuotes(value) {
    return value.replace(DATA_EXTRA_OPTIONS_REGEX, (match, json) => {
        const fixed = json.replace(/\\"/g, '&quot;').replace(/"/g, '&quot;');
        return `data-extra-options="${fixed}"`;
    });
}

export function repairFragment(fragment) {
    const changed = [];
    for (const field of fragment.fields ?? []) {
        if (!FIELDS.includes(field.name)) continue;
        let fieldChanged = false;
        field.values = (field.values ?? []).map((value) => {
            if (typeof value !== 'string') return value;
            const fixed = fixExtraOptionsQuotes(value);
            if (fixed !== value) fieldChanged = true;
            return fixed;
        });
        if (fieldChanged) changed.push(field.name);
    }
    return changed;
}

export function studioLink(id) {
    return `https://mas.adobe.com/studio.html#query=${id}`;
}

export function buildReport(hits) {
    return hits.map((hit) => studioLink(hit.id)).join('\n');
}

export async function runPool(items, concurrency, worker) {
    const queue = items.slice();
    const size = Math.max(1, Math.min(concurrency, queue.length));
    const workers = Array.from({ length: size }, async () => {
        while (queue.length) {
            await worker(queue.shift());
        }
    });
    await Promise.all(workers);
}

export function backupFile(folder, id) {
    const surface = folder.split('/').filter(Boolean).at(-1);
    return `fragments/${surface}/${id}.json`;
}

function defaultWriteBackup(folder, fragment) {
    const file = backupFile(folder, fragment.id);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(fragment, null, 2));
}

async function putFragment(baseUrl, headers, fragment) {
    const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/${fragment.id}`, {
        method: 'PUT',
        headers: { ...headers, 'If-Match': fragment.etag },
        body: JSON.stringify({ title: fragment.title, description: fragment.description, fields: fragment.fields }),
    });
    if (!response.ok) {
        console.error(`PUT failed for ${fragment.id}: ${response.status} ${response.statusText}`);
        return false;
    }
    return true;
}

export async function run({
    authorHost,
    folder,
    limit = 0,
    dryRun = false,
    concurrency = 10,
    token,
    apiKey,
    writeBackup = defaultWriteBackup,
}) {
    const baseUrl = `https://${authorHost}`;
    const headers = createHeaders(token, apiKey);
    const query = JSON.stringify({
        filter: {
            path: folder,
            modelIds: [CARD_MODEL_ID],
            fullText: { text: 'data-extra-options', queryMode: 'EXACT_WORDS' },
        },
        sort: [{ on: 'created', order: 'ASC' }],
    });

    let cursor = null;
    let scanned = 0;
    let done = false;
    const broken = [];

    do {
        const params = new URLSearchParams({ query });
        if (cursor) params.set('cursor', cursor);
        const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/search?${params}`, { headers });
        if (!response.ok) throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const items = data.items ?? [];
        scanned += items.length;

        for (const fragment of items) {
            const original = dryRun ? null : structuredClone(fragment);
            const fields = repairFragment(fragment);
            if (!fields.length) continue;
            broken.push({ fragment, fields, original });
            if (limit && broken.length >= limit) {
                done = true;
                break;
            }
        }

        cursor = done ? null : (data.cursor ?? null);
        if (cursor) await wait(1000);
    } while (cursor);

    const failed = new Set();
    if (!dryRun) {
        await runPool(broken, concurrency, async ({ fragment, original }) => {
            writeBackup(folder, original);
            if (!(await putFragment(baseUrl, headers, fragment))) failed.add(fragment.id);
        });
    }

    const hits = broken
        .filter(({ fragment }) => !failed.has(fragment.id))
        .map(({ fragment, fields }) => ({ id: fragment.id, path: fragment.path, fields }));
    return { scanned, hits };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { getFlag, hasFlag } = parseArgs(process.argv);
    const authorHost = getFlag('--author-host');
    const folder = getFlag('--folder');
    const limit = Number(getFlag('--limit') ?? 0);
    const concurrency = Number(getFlag('--concurrency') ?? 10);
    const dryRun = hasFlag('--dry-run');
    const token = process.env.MAS_IMS_TOKEN;
    const apiKey = process.env.MAS_API_KEY;

    if (!authorHost || !folder || !token || !apiKey) {
        console.error(
            'Usage: MAS_IMS_TOKEN=<t> MAS_API_KEY=<k> node fix-extra-options-quotes.mjs --author-host <host> --folder <path> [--limit <n>] [--concurrency <n>] [--dry-run]',
        );
        process.exit(1);
    }

    const { scanned, hits } = await run({ authorHost, folder, limit, dryRun, concurrency, token, apiKey });
    console.log(`Scanned ${scanned} fragments, ${hits.length} ${dryRun ? 'would be repaired' : 'repaired'}.`);
    if (hits.length) {
        const segments = folder.split('/');
        const name = `fix-extra-options-${segments.at(-2)}-${segments.at(-1)}-${Date.now()}.txt`;
        writeFileSync(name, `${buildReport(hits)}\n`);
        console.log(`Report written to ${name}`);
    }
}
