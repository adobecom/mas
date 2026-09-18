/**
 * Walks every locale folder of a surface's `/pzn/` grouped-variation card fragments and records,
 * for each fragment that carries at least one old-name tag from `PREFIX_RENAMES`, the source it
 * came from — fragment metadata `tags`, or the CF `pznTags` / `tags` field — matching exactly the
 * sources `getFragmentNonCountryPznTagIds` (studio/src/common/utils/personalization-utils.js)
 * reads to detect personalization. One row is written per (fragment, source) pair.
 *
 * Also checks which of `requiredTargetTags()` (the two added tags plus the seven renamed targets
 * plus the three preserved names) already exist under the live `/content/cq:tags/mas/pzn`
 * taxonomy, so a run cannot silently retag onto a tag node that does not exist yet. Creating those
 * nodes is a gated production content operation owned by the taxonomy owner — this script only
 * reports what is missing, it never creates anything.
 *
 * Output goes to this folder's own `tmp/` directory, which is gitignored.
 *
 * Auth:
 *   export MAS_IMS_TOKEN=<token>   # copy(adobeid.authorize()) from MAS Studio devtools
 *   export MAS_API_KEY=mas-studio
 *
 * Usage:
 *   node pzn-prefix-inventory.mjs --author-host <host>
 *   node pzn-prefix-inventory.mjs --author-host <host> --out /tmp/pzn-prefix-inventory.json
 *   node pzn-prefix-inventory.mjs --author-host <host> --surface acom-dc
 *   node pzn-prefix-inventory.mjs --author-host <host> --locales en_US,en_GB   # restrict the walk
 *   node pzn-prefix-inventory.mjs --author-host <host> --skip-taxonomy
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
import { tagRefToTagId } from '../../studio/src/common/utils/personalization-utils.js';
import { ALLOWED_AUTHOR_HOSTS, PREFIX_RENAMES, TAG_ROOT, pathToTagId, requiredTargetTags } from './pzn-prefix-mapping.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const OUTPUT_DIR = resolve(SCRIPT_DIR, 'tmp');
const SURFACE = 'acom';
const PZN_PATH =
    /^\/content\/dam\/mas\/(?<surface>[^/]+)\/(?<locale>[^/]+)\/(?<productArrangementCode>[^/]+)\/pzn\/(?<name>.+)$/;
const THROTTLE_MS = 250;

/** CF field names whose values carry personalization tag ids — mirrors PERSONALIZATION_FIELD_NAMES. */
const SOURCE_FIELDS = ['pznTags', 'tags'];
const METADATA_SOURCE = 'metadataTags';

const OLD_TAG_IDS = new Set(Object.keys(PREFIX_RENAMES));
const tagsKey = (tags) => [...tags].sort().join(' + ') || '(none)';
const groupKey = (record) => `${record.surface}|${record.productArrangementCode}|${record.name}|${record.sourceField}`;

function fieldTagIds(fragment, fieldName) {
    const field = (fragment.fields || []).find((f) => f?.name === fieldName);
    const values = Array.isArray(field?.values) ? field.values : [];
    return values.map(tagRefToTagId).filter(Boolean);
}

function metadataTagIds(fragment) {
    return (fragment.tags || []).map(tagRefToTagId).filter(Boolean);
}

/** One (fragment, source) candidate per personalization tag source, whether or not it carries an old tag. */
function fragmentSources(fragment) {
    return [
        { sourceField: METADATA_SOURCE, tags: metadataTagIds(fragment) },
        ...SOURCE_FIELDS.map((fieldName) => ({ sourceField: fieldName, tags: fieldTagIds(fragment, fieldName) })),
    ];
}

export function groupByParent(records) {
    const groups = new Map();
    for (const record of records) {
        const key = groupKey(record);
        if (!groups.has(key)) {
            groups.set(key, {
                key,
                surface: record.surface,
                productArrangementCode: record.productArrangementCode,
                name: record.name,
                sourceField: record.sourceField,
                locales: [],
                tagDrift: 'identical',
            });
        }
        groups.get(key).locales.push({ locale: record.locale, id: record.id, tags: record.tags });
    }
    for (const group of groups.values()) {
        const distinct = new Set(group.locales.map((entry) => tagsKey(entry.tags)));
        group.tagDrift = distinct.size > 1 ? 'drifted' : 'identical';
        group.distinctTagSets = [...distinct];
    }
    return [...groups.values()];
}

/**
 * Runs the inventory walk against a live author environment. All I/O and mutable state live in
 * this function's own scope — nothing is shared at module level — so importing this module for
 * its pure helper (`groupByParent`) above never triggers a network call or `process.exit`.
 */
export async function run({ authorHost, surface, outFile, localesArg, skipTaxonomy, token, apiKey }) {
    const baseUrl = `https://${authorHost}`;
    const headers = createHeaders(token, apiKey);
    const localeFilter = localesArg
        ? new Set(
              localesArg
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
          )
        : null;

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

    const parentFragmentIds = new Map();

    async function getParentFragmentId(recordSurface, locale, productArrangementCode) {
        const parentPath = `${ROOT_PATH}/${recordSurface}/${locale}/${productArrangementCode}`;
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
                for (const { sourceField, tags } of fragmentSources(body)) {
                    if (!tags.some((tag) => OLD_TAG_IDS.has(tag))) continue;
                    records.push({
                        surface: match.groups.surface,
                        locale: match.groups.locale,
                        productArrangementCode: match.groups.productArrangementCode,
                        name: match.groups.name,
                        sourceField,
                        path: body.path,
                        id: body.id,
                        parentFragmentId,
                        etag,
                        status: body.status ?? null,
                        modifiedBy: body.modified?.by ?? null,
                        tags,
                    });
                }
            }
        }
        return records;
    }

    async function listTagPaths(root) {
        const { body } = await getJson(
            `${baseUrl}/bin/querybuilder.json?path=${root}&type=cq:Tag&orderby=@jcr:path&p.limit=-1&p.hits=selective&p.properties=jcr:path`,
        );
        return (body.hits ?? []).map((hit) => hit['jcr:path'] ?? hit.path).filter(Boolean);
    }

    async function checkTaxonomy() {
        const existingPaths = await listTagPaths(TAG_ROOT);
        const existingIds = new Set(existingPaths.map(pathToTagId).filter(Boolean));
        const required = requiredTargetTags();
        const missing = required.filter((tagId) => !existingIds.has(tagId));
        return {
            tagRoot: TAG_ROOT,
            existingTagCount: existingPaths.length,
            existingTagIds: [...existingIds].sort(),
            requiredTargetTags: required,
            missingTargetTags: missing,
        };
    }

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
            console.log(`  ${locale.padEnd(7)} ${String(localeRecords.length).padStart(4)} tagged source(s)`);
        }
        records.push(...localeRecords);
    }

    const parents = groupByParent(records);
    const taxonomy = skipTaxonomy ? null : await checkTaxonomy();

    const inventory = {
        generatedAt: new Date().toISOString(),
        authorHost,
        surface,
        locales,
        records,
        parents,
        taxonomy,
    };

    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');

    console.log(`\n${records.length} tagged source(s) across ${parents.length} parent group(s).`);
    console.log(`Tag drift: ${parents.filter((p) => p.tagDrift === 'drifted').length} drifted / ${parents.length} groups.`);
    if (taxonomy) {
        console.log(
            `\nTaxonomy: ${taxonomy.missingTargetTags.length} of ${taxonomy.requiredTargetTags.length} target tags missing.`,
        );
        if (taxonomy.missingTargetTags.length) {
            console.log(`  missing: ${taxonomy.missingTargetTags.join(', ')}`);
            console.log('  Creating these is a gated production write — owned by the taxonomy owner, not this script.');
        }
    }
    console.log(`\nWrote ${outFile}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { getFlag, hasFlag } = parseArgs(process.argv);

    const authorHost = getFlag('--author-host');
    const surface = getFlag('--surface') || SURFACE;
    const outFile = resolve(getFlag('--out') || `${OUTPUT_DIR}/mas-pzn-prefix-inventory-${surface}.json`);
    const token = process.env.MAS_IMS_TOKEN;

    if (!authorHost || !token) {
        console.error(
            'Usage: MAS_IMS_TOKEN=<token> MAS_API_KEY=<key> node pzn-prefix-inventory.mjs --author-host <host> [--out <file>] [--surface acom] [--locales a,b] [--skip-taxonomy]',
        );
        process.exit(1);
    }
    if (!ALLOWED_AUTHOR_HOSTS.includes(authorHost)) {
        console.error(`--author-host ${authorHost} is not in the allowlist: ${ALLOWED_AUTHOR_HOSTS.join(', ')}`);
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

    run({
        authorHost,
        surface,
        outFile,
        localesArg: getFlag('--locales'),
        skipTaxonomy: hasFlag('--skip-taxonomy'),
        token,
        apiKey: process.env.MAS_API_KEY || 'mas-studio',
    }).catch((error) => {
        console.error(`\nInventory failed: ${error.message}`);
        process.exit(1);
    });
}
