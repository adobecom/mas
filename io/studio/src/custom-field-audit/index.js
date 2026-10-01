'use strict';

const { Core } = require('@adobe/aio-sdk');
const { fetchFragmentByPath, fetchOdin, patchToOdin, processBatchWithConcurrency, getValues } = require('../common');
const { DEFAULT_LOCALES } = require('../locales.js');

const logger = Core.Logger('custom-field-audit', { level: 'info' });

const PROMOTIONS_SEGMENT = '/promotions/';
const MAX_PAGES = 500;

/**
 * Every physical locale folder for a surface: each default-locale entry plus its region
 * variants (e.g. de_DE and de_AT/de_CH/de_LU), since promo variations live under whichever
 * locale folder their source fragment lives in, not just the surface's "default" locales.
 * @param {string} surface
 * @returns {string[]}
 */
function getAllLocalesForSurface(surface) {
    const entries = DEFAULT_LOCALES[surface] || [];
    const locales = [];
    for (const { lang, country, regions = [] } of entries) {
        locales.push(`${lang}_${country}`);
        for (const region of regions) {
            locales.push(`${lang}_${region}`);
        }
    }
    return locales;
}

/**
 * Lists all fragment paths under a locale folder (default fragments and their promo
 * variations alike, since promotions/ nests under the same locale folder).
 * @param {string} odinEndpoint
 * @param {string} surface
 * @param {string} locale
 * @param {string} authToken
 * @returns {Promise<string[]>}
 */
async function listFragmentPaths(odinEndpoint, surface, locale, authToken) {
    const folderPath = `/content/dam/mas/${surface}/${locale}`;
    const paths = [];
    let cursor = null;
    let pages = 0;

    do {
        const query = JSON.stringify({ filter: { path: folderPath }, sort: [{ on: 'created', order: 'ASC' }] });
        const qs = cursor
            ? `query=${encodeURIComponent(query)}&cursor=${encodeURIComponent(cursor)}`
            : `query=${encodeURIComponent(query)}`;

        const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments/search?${qs}`, authToken, {
            ignoreErrors: [400, 404, 429],
        });
        if (!response.ok) break;
        const data = await response.json();
        for (const item of data.items ?? []) {
            if (item.path) paths.push(item.path);
        }
        const nextCursor = data.cursor ?? null;
        if (nextCursor && nextCursor === cursor) {
            logger.warn(`listFragmentPaths ${surface}/${locale}: cursor did not advance, stopping`);
            break;
        }
        cursor = nextCursor;
        pages++;
        if (pages >= MAX_PAGES) {
            logger.warn(`listFragmentPaths ${surface}/${locale}: reached page cap (${MAX_PAGES}), stopping`);
            break;
        }
    } while (cursor);

    return paths;
}

/**
 * First promotions/ folder segment in a promo-variation path, e.g. 'black-friday' in
 * '/content/dam/mas/acom/en_US/promotions/black-friday/my-card'.
 * @param {string} fragmentPath
 * @returns {string|null}
 */
function getPromoNameFromPath(fragmentPath) {
    const match = /\/promotions\/([^/]+)\//.exec(fragmentPath);
    return match ? match[1] : null;
}

/**
 * Resolves a promo-variation path back to the default fragment path it was copied from,
 * stripping the 'promotions/{promoName}/' segment and any numeric '-N' collision suffix.
 * Mirrors studio/src/promotions/promotion-model.js resolveDefaultPathFromPromoVariation's
 * single-candidate (non-tag) fallback, re-implemented here since io/studio actions run in a
 * separate CommonJS deployment unit from the browser-side ESM modules.
 * @param {string} promoPath
 * @returns {string|null}
 */
function resolveDefaultPathFromPromoPath(promoPath) {
    const promoName = getPromoNameFromPath(promoPath);
    if (!promoName) return null;
    const marker = `${PROMOTIONS_SEGMENT}${promoName}/`;
    const idx = promoPath.indexOf(marker);
    if (idx === -1) return null;
    const prefix = promoPath.slice(0, idx);
    const relative = promoPath.slice(idx + marker.length).replace(/-\d+$/, '');
    return relative ? `${prefix}/${relative}` : null;
}

/**
 * Reads a fragment's custom-field entries ({ name, value }), pairing customFields values
 * with customFieldLabels names by position.
 * @param {Object} fragment
 * @returns {Array<{ name: string, value: string }>}
 */
function readCustomFieldEntries(fragment) {
    const values = getValues(fragment, 'customFields')?.values || [];
    const labels = getValues(fragment, 'customFieldLabels')?.values || [];
    const count = Math.max(values.length, labels.length);
    return Array.from({ length: count }, (_, i) => ({ name: (labels[i] || '').trim(), value: values[i] || '' }));
}

/**
 * Diffs a default fragment's custom fields against a promo variation's. Mirrors
 * studio/src/promotions/custom-field-sync.js diffCustomFields: a rename is only inferred
 * when the default and promo entries share a position and neither name exists on the other
 * side; every other default-only name is reported as missing rather than guessed to be a rename.
 * @param {Array<{ name: string, value: string }>} defaultEntries
 * @param {Array<{ name: string, value: string }>} promoEntries
 * @returns {{ missing: string[], renames: Array<{ from: string, to: string }> }}
 */
function diffCustomFields(defaultEntries, promoEntries) {
    const defaultList = defaultEntries.map((entry, index) => ({ ...entry, index })).filter((entry) => entry.name);
    const promoList = promoEntries.map((entry, index) => ({ ...entry, index })).filter((entry) => entry.name);
    const defaultNames = new Set(defaultList.map((entry) => entry.name));
    const promoNames = new Set(promoList.map((entry) => entry.name));
    const promoNameByIndex = new Map(promoList.map((entry) => [entry.index, entry.name]));

    const renames = [];
    const renamedDefaultNames = new Set();
    const renamedPromoNames = new Set();
    for (const { name: defaultName, index } of defaultList) {
        if (promoNames.has(defaultName)) continue;
        const promoName = promoNameByIndex.get(index);
        if (!promoName || promoName === defaultName || defaultNames.has(promoName)) continue;
        renames.push({ from: promoName, to: defaultName });
        renamedDefaultNames.add(defaultName);
        renamedPromoNames.add(promoName);
    }

    const missing = defaultList
        .map((entry) => entry.name)
        .filter((name) => !promoNames.has(name) && !renamedDefaultNames.has(name));
    return { missing, renames };
}

/**
 * Builds the corrected promo-variation entry list: renamed entries keep their value but take
 * the default's name, and missing names are appended using the default entry's value.
 * @param {Array<{ name: string, value: string }>} promoEntries
 * @param {Array<{ name: string, value: string }>} defaultEntries
 * @param {string[]} missing
 * @param {Array<{ from: string, to: string }>} renames
 * @returns {Array<{ name: string, value: string }>}
 */
function buildCorrectedEntries(promoEntries, defaultEntries, missing, renames) {
    const renameMap = new Map(renames.map(({ from, to }) => [from, to]));
    const entries = promoEntries.map((entry) => {
        const newName = renameMap.get(entry.name);
        return newName ? { ...entry, name: newName } : entry;
    });
    for (const name of missing) {
        const source = defaultEntries.find((entry) => entry.name === name);
        entries.push({ name, value: source?.value || '' });
    }
    return entries;
}

/**
 * Audits and (unless dryRun) fixes one promo variation against its default fragment's
 * custom fields. Returns null when there is nothing to report.
 * @param {string} odinEndpoint
 * @param {string} authToken
 * @param {string} defaultPath
 * @param {Array<{ name: string, value: string }>} defaultEntries
 * @param {string} promoPath
 * @param {boolean} dryRun
 * @returns {Promise<Object|null>}
 */
async function processPromoVariation(odinEndpoint, authToken, defaultPath, defaultEntries, promoPath, dryRun) {
    const { fragment: promoFragment, status, etag } = await fetchFragmentByPath(odinEndpoint, promoPath, authToken);
    if (status !== 200 || !promoFragment) {
        logger.warn(`Promo variation not found at ${promoPath}: ${status}`);
        return null;
    }

    const promoEntries = readCustomFieldEntries(promoFragment);
    const { missing, renames } = diffCustomFields(defaultEntries, promoEntries);
    if (!missing.length && !renames.length) return null;

    const valuesField = getValues(promoFragment, 'customFields');
    const labelsField = getValues(promoFragment, 'customFieldLabels');
    if (!valuesField?.path || !labelsField?.path) {
        logger.warn(`Promo variation ${promoPath} has no customFields/customFieldLabels field to patch`);
        return null;
    }

    const result = {
        defaultPath,
        promoPath,
        missing,
        renames: renames.map(({ from, to }) => `${from} -> ${to}`),
        dryRun,
    };

    logger.info(
        `${dryRun ? '[dry-run] ' : ''}Promo variation ${promoPath}: ${missing.length} missing, ${renames.length} rename(s)`,
    );

    if (!dryRun) {
        const correctedEntries = buildCorrectedEntries(promoEntries, defaultEntries, missing, renames);
        const ops = [
            { op: 'replace', path: `${valuesField.path}/values`, value: correctedEntries.map((entry) => entry.value) },
            { op: 'replace', path: `${labelsField.path}/values`, value: correctedEntries.map((entry) => entry.name) },
        ];
        const patchResult = await patchToOdin(odinEndpoint, promoFragment.id, authToken, ops, etag);
        if (!patchResult.success) {
            throw new Error(patchResult.error || `PATCH failed for promo variation ${promoPath}`);
        }
    }

    return result;
}

/**
 * Audits (and unless dryRun, fixes) every promo variation of one default fragment.
 * @param {string} odinEndpoint
 * @param {string} authToken
 * @param {string} defaultPath
 * @param {string[]} promoPaths
 * @param {boolean} dryRun
 * @returns {Promise<Object[]>}
 */
async function processDefaultFragmentPair(odinEndpoint, authToken, defaultPath, promoPaths, dryRun) {
    const { fragment: defaultFragment, status } = await fetchFragmentByPath(odinEndpoint, defaultPath, authToken);
    if (status !== 200 || !defaultFragment) return [];

    const defaultEntries = readCustomFieldEntries(defaultFragment);
    if (!defaultEntries.some((entry) => entry.name)) return [];

    const results = [];
    for (const promoPath of promoPaths) {
        const result = await processPromoVariation(odinEndpoint, authToken, defaultPath, defaultEntries, promoPath, dryRun);
        if (result) results.push(result);
    }
    return results;
}

/**
 * Main action entry point (MWPW-205018): audits existing milo content for default fragments
 * whose custom fields have drifted from their promo variations (missing fields, or a promo-side
 * field renamed away from the default's naming), and auto-applies the fix unless dryRun is set.
 *
 * POST body (all optional — omit to process everything):
 *   surface: string   — limit to one surface (e.g. 'acom')
 *   locale:  string   — limit to one locale  (e.g. 'de_DE')
 *   dryRun:  boolean  — default true; set false to apply changes
 */
async function main(params) {
    const authToken = params.__ow_headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!authToken) {
        return { statusCode: 401, body: { error: 'Missing Authorization header' } };
    }

    const odinEndpoint = params.odinEndpoint;
    if (!odinEndpoint) {
        return { statusCode: 500, body: { error: 'Missing odinEndpoint configuration' } };
    }

    const { surface: targetSurface, locale: targetLocale, dryRun = true } = params;

    if (targetSurface && !DEFAULT_LOCALES[targetSurface]) {
        return { statusCode: 400, body: { error: `Unknown surface: ${targetSurface}` } };
    }

    const surfaces = targetSurface ? [targetSurface] : Object.keys(DEFAULT_LOCALES);
    const summary = { processed: 0, corrected: 0, errors: [], dryRun, details: [] };

    for (const surface of surfaces) {
        const allLocales = getAllLocalesForSurface(surface);
        const locales = targetLocale ? [targetLocale] : allLocales;

        for (const locale of locales) {
            if (!allLocales.includes(locale)) {
                logger.warn(`Locale '${locale}' is not a known locale for surface '${surface}', skipping`);
                continue;
            }

            logger.info(`Listing fragments for ${surface}/${locale}`);
            let allPaths;
            try {
                allPaths = await listFragmentPaths(odinEndpoint, surface, locale, authToken);
            } catch (err) {
                logger.error(`Failed to list fragments for ${surface}/${locale}: ${err.message}`);
                summary.errors.push({ surface, locale, error: err.message });
                continue;
            }

            const defaultToPromoPaths = new Map();
            for (const path of allPaths) {
                if (!path.includes(PROMOTIONS_SEGMENT)) continue;
                const defaultPath = resolveDefaultPathFromPromoPath(path);
                if (!defaultPath) continue;
                if (!defaultToPromoPaths.has(defaultPath)) defaultToPromoPaths.set(defaultPath, []);
                defaultToPromoPaths.get(defaultPath).push(path);
            }

            const defaultPaths = [...defaultToPromoPaths.keys()];
            logger.info(`${surface}/${locale}: ${defaultPaths.length} default fragment(s) with promo variation(s)`);

            const results = await processBatchWithConcurrency(defaultPaths, 3, async (defaultPath) => {
                try {
                    return await processDefaultFragmentPair(
                        odinEndpoint,
                        authToken,
                        defaultPath,
                        defaultToPromoPaths.get(defaultPath),
                        dryRun,
                    );
                } catch (err) {
                    logger.error(`Error processing ${defaultPath}: ${err.message}`);
                    summary.errors.push({ defaultPath, error: err.message });
                    return [];
                }
            });

            for (const resultList of results) {
                for (const result of resultList) {
                    summary.processed++;
                    summary.corrected++;
                    summary.details.push(result);
                }
            }
        }
    }

    return { statusCode: 200, body: summary };
}

module.exports = { main, diffCustomFields, resolveDefaultPathFromPromoPath, buildCorrectedEntries };
