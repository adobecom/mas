/**
 * Discovery helper for bulk-publish.mjs.
 *
 * Walks MAS surfaces on an Odin author host, queries /adobe/sites/cf/fragments/search
 * by path + modelId, writes the resulting fragment paths to a file, and prints a
 * per-locale summary so operators can review before invoking bulk-publish.mjs.
 *
 * Scope for this session:
 *   - EXPRESS: all locales from getSurfaceLocales('express') — cards + collections + placeholders.
 *   - ACOM:    all locales from getSurfaceLocales('acom') EXCLUDING en_US — cards with variant='catalog'
 *              + all collections + all placeholders (no en_US, guarded at multiple layers).
 *
 * "Placeholders" in this org = dictionary entries + dictionary indexes (model ids taken from
 * studio/src/constants.js: DICTIONARY_ENTRY_MODEL_ID and DICTIONARY_INDEX_MODEL_ID).
 *
 * Usage:
 *   export MAS_IMS_TOKEN="your-ims-token"
 *   export MAS_API_KEY="mas-studio"
 *   node bulk-publish-discover.mjs \
 *       --author-host <aem-author-host> \
 *       --out /tmp/bulk-publish-paths.txt \
 *       [--surfaces express,acom] \
 *       [--dry-run]
 */

import { writeFile } from 'node:fs/promises';
import {
    CARD_MODEL_ID,
    COLLECTION_MODEL_ID,
    DICTIONARY_ENTRY_MODEL_ID,
    DICTIONARY_INDEX_MODEL_ID,
    createHeaders,
    parseArgs,
} from './common.js';
import { getSurfaceLocales, getLocaleCode } from '../../io/www/src/fragment/locales.js';

const DICTIONARY_MODEL_IDS = new Set([DICTIONARY_ENTRY_MODEL_ID, DICTIONARY_INDEX_MODEL_ID]);
const ACOM_EXCLUDE_LOCALE = 'en_US';
const ACOM_EN_US_SEGMENT = '/acom/en_US/';
const ALLOWED_SURFACE_PREFIXES = ['/content/dam/mas/express/', '/content/dam/mas/acom/'];

const { getFlag, hasFlag } = parseArgs(process.argv);

const authorHost = getFlag('--author-host');
const outFile = getFlag('--out') || '/tmp/bulk-publish-paths.txt';
const surfacesArg = getFlag('--surfaces') || 'express,acom';
const dryRun = hasFlag('--dry-run');
const token = process.env.MAS_IMS_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!authorHost || !token || !apiKey) {
    console.error(
        'Usage: MAS_IMS_TOKEN=<t> MAS_API_KEY=<k> node bulk-publish-discover.mjs --author-host <host> [--out <file>] [--surfaces express,acom] [--dry-run]',
    );
    process.exit(1);
}

const baseUrl = `https://${authorHost}`;
const headers = createHeaders(token, apiKey);
const surfaces = surfacesArg
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

async function* searchByPathAndModels(folderPath, modelIds) {
    const query = JSON.stringify({
        filter: { path: folderPath, modelIds },
        sort: [{ on: 'created', order: 'ASC' }],
    });
    let cursor = null;
    do {
        const params = new URLSearchParams({ query });
        if (cursor) params.set('cursor', cursor);
        const response = await fetch(`${baseUrl}/adobe/sites/cf/fragments/search?${params}`, { headers });
        if (response.status === 404) return;
        if (!response.ok) {
            throw new Error(`Search failed at ${folderPath}: ${response.status} ${response.statusText}`);
        }
        const { items = [], cursor: nextCursor } = await response.json();
        yield items;
        cursor = nextCursor ?? null;
    } while (cursor);
}

function hasCatalogVariant(fragment) {
    const variantField = fragment?.fields?.find((f) => f.name === 'variant');
    return Array.isArray(variantField?.values) && variantField.values.includes('catalog');
}

function enforceAcomEnUsGuard(paths) {
    const offenders = paths.filter((p) => p.includes(ACOM_EN_US_SEGMENT));
    if (offenders.length > 0) {
        console.error(`FATAL: ${offenders.length} acom/en_US paths leaked into the result set:`);
        offenders.slice(0, 5).forEach((p) => console.error(`  ${p}`));
        throw new Error('acom/en_US exclusion violated');
    }
}

function enforceAllowedPrefixes(paths) {
    const offenders = paths.filter((p) => !ALLOWED_SURFACE_PREFIXES.some((prefix) => p.startsWith(prefix)));
    if (offenders.length > 0) {
        console.error(`FATAL: ${offenders.length} paths outside allowed surfaces:`);
        offenders.slice(0, 5).forEach((p) => console.error(`  ${p}`));
        throw new Error('path outside allowed surfaces');
    }
}

async function discoverSurface(surface, modelIds, variantFilter) {
    const allLocales = getSurfaceLocales(surface).map(getLocaleCode);
    const locales = surface === 'acom' ? allLocales.filter((l) => l !== ACOM_EXCLUDE_LOCALE) : allLocales;

    const entries = await Promise.all(
        locales.map(async (locale) => {
            const folder = `/content/dam/mas/${surface}/${locale}`;
            const hits = [];
            for await (const batch of searchByPathAndModels(folder, modelIds)) {
                for (const fragment of batch) {
                    if (!fragment?.path) continue;
                    if (variantFilter && fragment.model?.id === CARD_MODEL_ID && !variantFilter(fragment)) continue;
                    hits.push({ path: fragment.path, modelId: fragment.model?.id });
                }
            }
            console.log(`  ${surface}/${locale.padEnd(6)}  ${String(hits.length).padStart(5)} fragments`);
            return [locale, hits];
        }),
    );
    return new Map(entries);
}

function countsByModel(hits) {
    const counts = { card: 0, collection: 0, placeholder: 0 };
    for (const h of hits) {
        if (h.modelId === CARD_MODEL_ID) counts.card += 1;
        else if (h.modelId === COLLECTION_MODEL_ID) counts.collection += 1;
        else if (DICTIONARY_MODEL_IDS.has(h.modelId)) counts.placeholder += 1;
    }
    return counts;
}

async function main() {
    console.log(`Odin:     ${baseUrl}`);
    console.log(`Surfaces: ${surfaces.join(', ')}`);
    console.log(`Output:   ${outFile}${dryRun ? ' (dry-run — file not written)' : ''}`);
    console.log('Placeholder model ids: dictionary entry + dictionary index (hardcoded)');
    console.log('');

    const modelIds = [CARD_MODEL_ID, COLLECTION_MODEL_ID, DICTIONARY_ENTRY_MODEL_ID, DICTIONARY_INDEX_MODEL_ID];

    const sections = [];
    const allPaths = [];

    for (const surface of surfaces) {
        const variantFilter = surface === 'acom' ? hasCatalogVariant : null;
        console.log(
            `Discovering ${surface} (${surface === 'acom' ? 'cards filtered to variant=catalog, en_US excluded' : 'all locales, all cards'}):`,
        );
        const byLocale = await discoverSurface(surface, modelIds, variantFilter);
        for (const [locale, hits] of byLocale) {
            const counts = countsByModel(hits);
            sections.push({
                header: `# ${surface}/${locale}  cards=${counts.card}  collections=${counts.collection}  placeholders=${counts.placeholder}`,
                paths: hits.map((h) => h.path).sort(),
            });
            allPaths.push(...hits.map((h) => h.path));
        }
        console.log('');
    }

    enforceAcomEnUsGuard(allPaths);
    enforceAllowedPrefixes(allPaths);

    const output = sections.map(({ header, paths }) => [header, ...paths].join('\n')).join('\n\n');

    console.log(`Total paths: ${allPaths.length}`);
    console.log(`Chunks that bulk-publish will issue (≤50 per locale): ~${sections.filter((s) => s.paths.length > 0).length}+`);

    if (dryRun) {
        console.log('\n[dry-run] Not writing file. First 20 paths:');
        allPaths.slice(0, 20).forEach((p) => console.log(`  ${p}`));
        return;
    }

    await writeFile(outFile, `${output}\n`, 'utf8');
    console.log(`\nWrote ${allPaths.length} paths to ${outFile}`);
    console.log('Review the file, then run:');
    console.log(
        `  MAS_IMS_TOKEN=<token> node scripts/content/bulk-publish.mjs --paths-file ${outFile} --namespace <ns> --odin-endpoint ${baseUrl} --dry-run`,
    );
}

main().catch((err) => {
    console.error(`\nDiscovery failed: ${err.message}`);
    process.exit(1);
});
