/**
 * Enumerates every ACOM locale folder, finds every card fragment living under a `/pzn/` folder,
 * and records their current `pznTags` plus the
 * metadata the later phases need (etag, status, last editor). Grouped variations exist per-locale
 * and the runtime serves the *localized* copy, so every locale is walked — not just `en_US` — and
 * the report says whether a parent's locale copies currently agree (`TAG_DRIFT`).
 *
 * Also checks which of the required country tags already exist,
 * and whether any target country is missing from `SUPPORTED_COUNTRIES`.
 *
 * Output goes to this folder's own `tmp/` directory, which is gitignored.
 *
 * Auth:
 *   export MAS_IMS_TOKEN=<token>   # copy(adobeid.authorize()) from MAS Studio devtools
 *   export MAS_API_KEY=mas-studio
 *
 * Usage:
 *   node pzn-tag-inventory.mjs --author-host <host>
 *   node pzn-tag-inventory.mjs --author-host <host> --out /tmp/pzn-inventory.json
 *   node pzn-tag-inventory.mjs --author-host <host> --locales en_US,en_GB   # restrict the walk
 *   node pzn-tag-inventory.mjs --author-host <host> --skip-taxonomy
 *
 * Exit codes: 0 = inventory written, 1 = bad usage / fatal error.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    CARD_MODEL_ID,
    ROOT_PATH,
    createHeaders,
    fetchIndexFragment,
    getValidLocaleCodes,
    listLocaleFolders,
    parseArgs,
    wait,
} from '../content/common.js';
import { LOCALE_TAG_ROOT, COUNTRY_TAG_ROOT, SURFACE, requiredCountryTags } from './pzn-tag-mapping.mjs';
import { SUPPORTED_COUNTRIES } from '../../web-components/src/constants.js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const OUTPUT_DIR = resolve(SCRIPT_DIR, 'tmp');
const PZN_PATH =
    /^\/content\/dam\/mas\/(?<surface>[^/]+)\/(?<locale>[^/]+)\/(?<productArrangementCode>[^/]+)\/pzn\/(?<name>.+)$/;
const THROTTLE_MS = 250;

const { getFlag, hasFlag } = parseArgs(process.argv);

const authorHost = getFlag('--author-host');
const surface = getFlag('--surface') || SURFACE;
const outFile = resolve(getFlag('--out') || `${OUTPUT_DIR}/mas-pzn-tag-inventory-${surface}.json`);
const localeFilter = getFlag('--locales')
    ? new Set(
          getFlag('--locales')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
      )
    : null;
const skipTaxonomy = hasFlag('--skip-taxonomy');
const token = process.env.MAS_IMS_TOKEN;
const apiKey = process.env.MAS_API_KEY || 'mas-studio';

if (!authorHost || !token) {
    console.error(
        'Usage: MAS_IMS_TOKEN=<token> MAS_API_KEY=<key> node pzn-tag-inventory.mjs --author-host <host> [--out <file>] [--surface acom] [--locales a,b] [--skip-taxonomy]',
    );
    process.exit(1);
}

const insideRepo = outFile === REPO_ROOT || outFile.startsWith(REPO_ROOT + sep);
const insideOutputDir = outFile === OUTPUT_DIR || outFile.startsWith(OUTPUT_DIR + sep);
if (insideRepo && !insideOutputDir) {
    console.error(`Refusing to write the inventory inside the repository: ${outFile}`);
    console.error(
        `Point --out at ${OUTPUT_DIR} or an external scratch directory — this report carries live content paths and etags.`,
    );
    process.exit(1);
}

const baseUrl = `https://${authorHost}`;
const headers = createHeaders(token, apiKey);

const fieldValues = (fragment, name) => fragment?.fields?.find((field) => field.name === name)?.values ?? [];

async function getJson(url) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`GET ${url} failed: ${response.status} ${response.statusText}`);
    }
    return { body: await response.json(), etag: response.headers.get('Etag') };
}

async function* searchPznCards(folderPath) {
    const query = JSON.stringify({
        filter: { path: folderPath, modelIds: [CARD_MODEL_ID] },
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
        if (cursor) await wait(1000);
    } while (cursor);
}

// Parent card fragment path — one per (surface, locale, productArrangementCode); id is fetched once
// and cached, since every /pzn/ variation under it shares the same parent.
const parentFragmentIds = new Map();

async function getParentFragmentId(surface, locale, productArrangementCode) {
    const parentPath = `${ROOT_PATH}/${surface}/${locale}/${productArrangementCode}`;
    if (parentFragmentIds.has(parentPath)) return parentFragmentIds.get(parentPath);
    const parent = await fetchIndexFragment(baseUrl, headers, parentPath);
    await wait(THROTTLE_MS);
    const parentId = parent?.id ?? null;
    parentFragmentIds.set(parentPath, parentId);
    return parentId;
}

async function collectLocale(locale) {
    const records = [];
    for await (const batch of searchPznCards(`${ROOT_PATH}/${surface}/${locale}`)) {
        for (const item of batch) {
            const match = PZN_PATH.exec(item?.path ?? '');
            if (!match) continue;
            // Search hits carry no Etag header; the applier needs one per fragment, so refetch.
            const { body, etag } = await getJson(`${baseUrl}/adobe/sites/cf/fragments/${item.id}`);
            await wait(THROTTLE_MS);
            const parentFragmentId = await getParentFragmentId(
                match.groups.surface,
                match.groups.locale,
                match.groups.productArrangementCode,
            );
            records.push({
                surface: match.groups.surface,
                locale: match.groups.locale,
                productArrangementCode: match.groups.productArrangementCode,
                name: match.groups.name,
                path: body.path,
                id: body.id,
                parentFragmentId,
                title: body.title ?? null,
                etag,
                status: body.status ?? null,
                modifiedBy: body.modified?.by ?? null,
                pznTags: fieldValues(body, 'pznTags'),
            });
        }
    }
    return records;
}

const groupKey = (record) => `${record.surface}|${record.productArrangementCode}|${record.name}`;
const tagsKey = (tags) => [...tags].sort().join(' + ') || '(none)';

function groupByParent(records) {
    const groups = new Map();
    for (const record of records) {
        const key = groupKey(record);
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                surface: record.surface,
                productArrangementCode: record.productArrangementCode,
                name: record.name,
                locales: [],
                tagDrift: 'identical',
            });
        }
        groups.get(key).locales.push({
            locale: record.locale,
            id: record.id,
            parentFragmentId: record.parentFragmentId,
            pznTags: record.pznTags,
        });
    }
    for (const group of groups.values()) {
        const distinct = new Set(group.locales.map((entry) => tagsKey(entry.pznTags)));
        group.tagDrift = distinct.size > 1 ? 'drifted' : 'identical';
        group.distinctTagSets = [...distinct];
    }
    return [...groups.values()];
}

function tagFrequency(records) {
    const counts = new Map();
    for (const record of records) {
        const key = tagsKey(record.pznTags);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([tags, count]) => ({ tags, count }))
        .sort((a, b) => b.count - a.count || a.tags.localeCompare(b.tags));
}

async function listTagPaths(root) {
    const { body } = await getJson(
        `${baseUrl}/bin/querybuilder.json?path=${root}&type=cq:Tag&orderby=@jcr:path&p.limit=-1&p.hits=selective&p.properties=jcr:path`,
    );
    return (body.hits ?? []).map((hit) => hit['jcr:path'] ?? hit.path).filter(Boolean);
}

async function checkTaxonomy() {
    const existingCountryPaths = await listTagPaths(COUNTRY_TAG_ROOT);
    const existingLocalePaths = await listTagPaths(LOCALE_TAG_ROOT);
    const existingCountries = new Set(existingCountryPaths.map((path) => path.split('/').pop().toUpperCase()));
    const required = requiredCountryTags();
    const supported = new Set(SUPPORTED_COUNTRIES);
    const missing = required.filter((tag) => !existingCountries.has(tag.split('/').pop().toUpperCase()));
    const unpriceable = required.map((tag) => tag.split('/').pop().toUpperCase()).filter((country) => !supported.has(country));
    return {
        countryTagRoot: COUNTRY_TAG_ROOT,
        localeTagRoot: LOCALE_TAG_ROOT,
        existingCountryTagCount: existingCountryPaths.length,
        existingLocaleTagCount: existingLocalePaths.length,
        existingCountries: [...existingCountries].sort(),
        requiredCountryTags: required,
        missingCountryTags: missing,
        notInSupportedCountries: unpriceable,
    };
}

async function main() {
    console.log(`Author:   ${baseUrl}`);
    console.log(`Surface:  ${surface}`);
    console.log(`Output:   ${outFile}\n`);

    const validLocales = getValidLocaleCodes(surface);
    const folders = await listLocaleFolders(baseUrl, headers, surface);
    const locales = folders
        .map(({ name }) => name)
        .filter((name) => validLocales.has(name))
        .filter((name) => !localeFilter || localeFilter.has(name))
        .sort();
    console.log(`Walking ${locales.length} locale folder(s)...`);

    const records = [];
    for (const locale of locales) {
        const localeRecords = await collectLocale(locale);
        if (localeRecords.length) {
            console.log(`  ${locale.padEnd(7)} ${String(localeRecords.length).padStart(4)} in-scope grouped variation(s)`);
        }
        records.push(...localeRecords);
    }

    const parents = groupByParent(records);
    const frequency = tagFrequency(records);
    const taxonomy = skipTaxonomy ? null : await checkTaxonomy();

    const inventory = {
        generatedAt: new Date().toISOString(),
        authorHost,
        surface,
        locales,
        records,
        parents,
        tagFrequency: frequency,
        taxonomy,
    };

    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');

    console.log(`\n${records.length} grouped variation(s) across ${parents.length} parent group(s).`);
    console.log(`Tag drift: ${parents.filter((p) => p.tagDrift === 'drifted').length} drifted / ${parents.length} groups.`);
    console.log('\nMost common pznTags sets:');
    frequency.slice(0, 15).forEach(({ tags, count }) => console.log(`  ${String(count).padStart(4)}  ${tags}`));
    if (taxonomy) {
        console.log(
            `\nTaxonomy: ${taxonomy.missingCountryTags.length} of ${taxonomy.requiredCountryTags.length} country tags missing.`,
        );
        if (taxonomy.missingCountryTags.length) {
            console.log(`  missing: ${taxonomy.missingCountryTags.join(', ')}`);
            console.log('  Creating these is a gated production write — owned by the taxonomy owner, not this script.');
        }
        if (taxonomy.notInSupportedCountries.length) {
            console.log(`  NOT in SUPPORTED_COUNTRIES (WCS cannot price): ${taxonomy.notInSupportedCountries.join(', ')}`);
        }
    }
    console.log(`\nWrote ${outFile}`);
}

main().catch((error) => {
    console.error(`\nInventory failed: ${error.message}`);
    process.exit(1);
});
