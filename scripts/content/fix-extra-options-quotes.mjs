import { CARD_MODEL_ID, createHeaders, parseArgs, wait } from './common.js';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

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
    return `https://main--mas--adobecom.aem.live/studio.html#page=fragment-editor&fragmentId=${id}`;
}

export function buildReport(hits) {
    return hits.map((hit) => studioLink(hit.id)).join('\n');
}

export async function run({ authorHost, folder, limit = 0, dryRun = false, token, apiKey }) {
    const baseUrl = `https://${authorHost}`;
    const headers = createHeaders(token, apiKey);
    const query = JSON.stringify({ filter: { path: folder, modelIds: [CARD_MODEL_ID] }, sort: [{ on: 'created', order: 'ASC' }] });

    let cursor = null;
    let scanned = 0;
    const hits = [];

    do {
        const params = new URLSearchParams({ query });
        if (cursor) params.set('cursor', cursor);
        const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/search?${params}`, { headers });
        if (!response.ok) throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const items = data.items ?? [];
        scanned += items.length;

        for (const fragment of items) {
            const changed = repairFragment(fragment);
            if (!changed.length) continue;
            hits.push({ id: fragment.id, path: fragment.path, fields: changed });
            if (!dryRun) {
                const put = await fetch(`${baseUrl}/adobe/sites/cf/fragments/${fragment.id}`, {
                    method: 'PUT',
                    headers: { ...headers, 'If-Match': fragment.etag },
                    body: JSON.stringify({ title: fragment.title, description: fragment.description, fields: fragment.fields }),
                });
                if (!put.ok) {
                    console.error(`PUT failed for ${fragment.id}: ${put.status} ${put.statusText}`);
                    hits.pop();
                    continue;
                }
            }
            if (limit && hits.length >= limit) return { scanned, hits };
        }

        cursor = data.cursor ?? null;
        if (cursor) await wait(1000);
    } while (cursor);

    return { scanned, hits };
}
