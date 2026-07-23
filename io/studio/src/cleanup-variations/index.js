'use strict';

const { Core } = require('@adobe/aio-sdk');
const {
    fetchFragmentByPath,
    fetchOdin,
    putToOdin,
    processBatchWithConcurrency,
    getValues,
    localeFromPath,
} = require('../common');
const { DEFAULT_LOCALES } = require('../locales.js');

const logger = Core.Logger('cleanup-variations', { level: 'info' });

/**
 * Returns the set of valid variation locale codes for a given fragment locale on a surface.
 * A variation is valid if its locale matches the fragment's default locale entry (including its regions).
 *
 * Examples (acom):
 *   getValidVariationsLocales('acom', 'de_DE') → ['de_DE', 'de_AT', 'de_CH', 'de_LU']
 *   getValidVariationsLocales('acom', 'en_GB') → ['en_GB', 'en_AU', 'en_IN']  (NOT en_US)
 *   getValidVariationsLocales('acom', 'en_US') → ['en_US', 'en_AE', ...]
 *
 * @param {string} surface e.g. 'acom'
 * @param {string} localeCode e.g. 'de_DE'
 * @returns {string[]}
 */
function getValidVariationsLocales(surface, localeCode) {
    const [lang, country] = localeCode.split('_');
    const locales = DEFAULT_LOCALES[surface];
    if (!locales) return [localeCode];

    const entry = locales.find((l) => l.lang === lang && l.country === country);
    if (!entry) return [localeCode];

    const valid = [`${lang}_${entry.country}`];
    for (const region of entry.regions ?? []) {
        valid.push(`${lang}_${region}`);
    }
    return valid;
}

/**
 * Processes a single fragment path: fetches it, finds invalid variation paths, removes them via PUT.
 * Uses PUT (not PATCH) because the variations field is locked by live relationships.
 * @param {string} odinEndpoint
 * @param {string} fragmentPath e.g. /content/dam/mas/acom/de_DE/some-card
 * @param {string} surface e.g. 'acom'
 * @param {string} authToken
 * @param {boolean} dryRun
 * @returns {Promise<{ path: string, removed: string[] }|null>} null if no changes needed
 */
async function processFragmentPath(odinEndpoint, fragmentPath, surface, authToken, dryRun) {
    const { fragment, status, etag } = await fetchFragmentByPath(odinEndpoint, fragmentPath, authToken);
    if (status !== 200 || !fragment) {
        logger.warn(`Fragment not found at ${fragmentPath}: ${status}`);
        return null;
    }

    const variationsField = getValues(fragment, 'variations');
    if (!variationsField?.values?.length) return null;

    const locale = localeFromPath(fragmentPath);
    if (!locale) {
        logger.warn(`Could not parse locale from path ${fragmentPath}`);
        return null;
    }

    const validLocales = getValidVariationsLocales(surface, locale);
    const allVariationPaths = variationsField.values;
    const validPaths = allVariationPaths.filter((validPath) => {
        const validLocale = localeFromPath(validPath);
        if (!validLocale) {
            logger.warn(`Cannot parse locale from variation path ${validPath}, keeping`);
            return true;
        }
        return validLocales.includes(validLocale);
    });
    const removedPaths = allVariationPaths.filter((vPath) => {
        const vLocale = localeFromPath(vPath);
        return vLocale && !validLocales.includes(vLocale);
    });

    if (!removedPaths.length) return null;

    logger.info(
        `${dryRun ? '[dry-run] ' : ''}Fragment ${fragmentPath}: removing ${removedPaths.length} variation(s): ${removedPaths.join(', ')}`,
    );

    if (!dryRun) {
        // Variations field is locked by live relationships — must use PUT with full fragment
        const updatedFields = fragment.fields.map((field) =>
            field.name === 'variations' ? { ...field, values: validPaths } : field,
        );
        await putToOdin(odinEndpoint, fragment.id, authToken, {
            title: fragment.title,
            description: fragment.description || '',
            fields: updatedFields,
            etag,
        });
    }

    return { path: fragmentPath, removed: removedPaths };
}

/**
 * Lists all fragments under a locale folder using cursor-based pagination.
 * Uses the same ?path= param as the rest of the codebase, pointed at the folder.
 * @param {string} odinEndpoint
 * @param {string} surface e.g. 'acom'
 * @param {string} locale e.g. 'de_DE'
 * @param {string} authToken
 * @returns {Promise<string[]>} array of fragment paths
 */
const MAX_PAGES = 500;

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

    logger.info(`listFragmentPaths ${surface}/${locale}: ${paths.length} total fragment(s)`);
    return paths;
}

/**
 * Main action entry point.
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
    const summary = { processed: 0, removed: 0, errors: [], dryRun, details: [] };

    for (const surface of surfaces) {
        const allLocales = DEFAULT_LOCALES[surface]
            .filter(({ lang, country }) => !(lang === 'en' && country === 'US'))
            .map(({ lang, country }) => `${lang}_${country}`);
        const locales = targetLocale ? [targetLocale] : allLocales;

        logger.info(`Surface '${surface}': processing ${locales.length} locale(s)`);

        for (const locale of locales) {
            if (!allLocales.includes(locale)) {
                logger.warn(`Locale '${locale}' is not a known locale for surface '${surface}', skipping`);
                continue;
            }
            logger.info(`Listing fragments for ${surface}/${locale}`);
            let fragmentPaths;
            try {
                fragmentPaths = await listFragmentPaths(odinEndpoint, surface, locale, authToken);
            } catch (err) {
                logger.error(`Failed to list fragments for ${surface}/${locale}: ${err.message}`);
                summary.errors.push({ surface, locale, error: err.message });
                continue;
            }

            logger.info(`Found ${fragmentPaths.length} fragment(s) in ${surface}/${locale}`);

            const results = await processBatchWithConcurrency(fragmentPaths, 3, async (fragmentPath) => {
                try {
                    return await processFragmentPath(odinEndpoint, fragmentPath, surface, authToken, dryRun);
                } catch (err) {
                    logger.error(`Error processing ${fragmentPath}: ${err.message}`);
                    summary.errors.push({ fragmentPath, error: err.message });
                    return null;
                }
            });

            for (const result of results) {
                summary.processed++;
                if (result) {
                    summary.removed += result.removed.length;
                    summary.details.push(result);
                }
            }
        }
    }

    return { statusCode: 200, body: summary };
}

module.exports = { main, getValidVariationsLocales };
