'use strict';

const { Core } = require('@adobe/aio-sdk');
const { fetchFragmentByPath, fetchOdin, putToOdin, processBatchWithConcurrency, getValues } = require('../common');

const logger = Core.Logger('cleanup-variations', { level: 'info' });

const PATH_TOKENS = /\/content\/dam\/mas\/(?<surface>[\w-_]+)\/(?<parsedLocale>[\w-_]+)\/(?<fragmentPath>.+)/;

// Locale data inlined from io/www/src/fragment/locales.js (ESM — cannot cross-import into CJS studio actions)
const ACOM = [
    { lang: 'ar', country: 'SA', regions: ['AE', 'EG', 'KW', 'QA'] },
    { lang: 'bg', country: 'BG' },
    { lang: 'cs', country: 'CZ' },
    { lang: 'da', country: 'DK' },
    { lang: 'de', country: 'DE', regions: ['AT', 'CH', 'LU'] },
    { lang: 'el', country: 'GR' },
    {
        lang: 'en',
        country: 'US',
        regions: [
            'AE',
            'BE',
            'CA',
            'EG',
            'GR',
            'HK',
            'ID',
            'IE',
            'IL',
            'KW',
            'LU',
            'MY',
            'NG',
            'NZ',
            'PH',
            'QA',
            'SA',
            'SG',
            'TH',
            'VN',
            'ZA',
        ],
    },
    { lang: 'en', country: 'GB', regions: ['AU', 'IN'] },
    { lang: 'et', country: 'EE' },
    { lang: 'fi', country: 'FI' },
    { lang: 'fil', country: 'PH' },
    { lang: 'fr', country: 'FR', regions: ['BE', 'CA', 'CH', 'LU'] },
    { lang: 'he', country: 'IL' },
    { lang: 'hi', country: 'IN' },
    { lang: 'hu', country: 'HU' },
    { lang: 'id', country: 'ID' },
    { lang: 'it', country: 'IT', regions: ['CH'] },
    { lang: 'ja', country: 'JP' },
    { lang: 'ko', country: 'KR' },
    { lang: 'lt', country: 'LT' },
    { lang: 'lv', country: 'LV' },
    { lang: 'ms', country: 'MY' },
    { lang: 'nb', country: 'NO' },
    { lang: 'nl', country: 'NL', regions: ['BE'] },
    { lang: 'pl', country: 'PL' },
    { lang: 'pt', country: 'BR' },
    { lang: 'pt', country: 'PT' },
    { lang: 'ro', country: 'RO' },
    { lang: 'ru', country: 'RU' },
    { lang: 'sk', country: 'SK' },
    { lang: 'sl', country: 'SI' },
    { lang: 'es', country: 'ES', regions: ['AR', 'CL', 'CO', 'CR', 'EC', 'GT', 'MX', 'PE', 'PR'] },
    { lang: 'sv', country: 'SE' },
    { lang: 'th', country: 'TH' },
    { lang: 'tr', country: 'TR' },
    { lang: 'uk', country: 'UA' },
    { lang: 'vi', country: 'VN' },
    { lang: 'zh', country: 'CN' },
    { lang: 'zh', country: 'TW', regions: ['HK'] },
];

const CCD = [
    { lang: 'cs', country: 'CZ' },
    { lang: 'da', country: 'DK' },
    { lang: 'de', country: 'DE', regions: ['AT', 'CH', 'LU'] },
    {
        lang: 'en',
        country: 'US',
        regions: [
            'AE',
            'AU',
            'BE',
            'CA',
            'EG',
            'GR',
            'HK',
            'ID',
            'IE',
            'IL',
            'IN',
            'KW',
            'LU',
            'MY',
            'NG',
            'NZ',
            'PH',
            'QA',
            'SA',
            'SG',
            'TH',
            'VN',
            'ZA',
        ],
    },
    { lang: 'fi', country: 'FI' },
    { lang: 'fr', country: 'FR', regions: ['BE', 'CA', 'CH', 'LU'] },
    { lang: 'hi', country: 'IN' },
    { lang: 'hu', country: 'HU' },
    { lang: 'id', country: 'ID' },
    { lang: 'it', country: 'IT', regions: ['CH'] },
    { lang: 'ja', country: 'JP' },
    { lang: 'ko', country: 'KR' },
    { lang: 'nb', country: 'NO' },
    { lang: 'nl', country: 'NL', regions: ['BE'] },
    { lang: 'pl', country: 'PL' },
    { lang: 'pt', country: 'BR' },
    { lang: 'ru', country: 'RU' },
    { lang: 'es', country: 'ES', regions: ['AR', 'CL', 'CO', 'CR', 'EC', 'GT', 'MX', 'PE', 'PR'] },
    { lang: 'sv', country: 'SE' },
    { lang: 'th', country: 'TH' },
    { lang: 'tr', country: 'TR' },
    { lang: 'uk', country: 'UA' },
    { lang: 'vi', country: 'VN' },
    { lang: 'zh', country: 'CN' },
    { lang: 'zh', country: 'TW' },
];

const EXPRESS = [
    { lang: 'da', country: 'DK' },
    { lang: 'de', country: 'DE', regions: ['AT', 'CH', 'LU'] },
    { lang: 'en', country: 'GB' },
    {
        lang: 'en',
        country: 'US',
        regions: [
            'AE',
            'BE',
            'CA',
            'EG',
            'GR',
            'HK',
            'ID',
            'IE',
            'IL',
            'IN',
            'KW',
            'LU',
            'MY',
            'NG',
            'NZ',
            'PH',
            'QA',
            'SA',
            'SG',
            'TH',
            'VN',
            'ZA',
        ],
    },
    { lang: 'fi', country: 'FI' },
    { lang: 'fr', country: 'FR', regions: ['BE', 'CA', 'CH', 'LU'] },
    { lang: 'id', country: 'ID' },
    { lang: 'it', country: 'IT', regions: ['CH'] },
    { lang: 'ja', country: 'JP' },
    { lang: 'ko', country: 'KR' },
    { lang: 'nb', country: 'NO' },
    { lang: 'nl', country: 'NL', regions: ['BE'] },
    { lang: 'pt', country: 'BR' },
    { lang: 'es', country: 'ES', regions: ['AR', 'CL', 'CO', 'CR', 'EC', 'GT', 'MX', 'PE', 'PR'] },
    { lang: 'sv', country: 'SE' },
    { lang: 'zh', country: 'CN' },
    { lang: 'zh', country: 'TW' },
];

const ADOBE_HOME = [
    { lang: 'cs', country: 'CZ' },
    { lang: 'da', country: 'DK' },
    { lang: 'de', country: 'DE', regions: ['AT', 'CH', 'LU'] },
    {
        lang: 'en',
        country: 'US',
        regions: [
            'AE',
            'AU',
            'BE',
            'CA',
            'EG',
            'GR',
            'HK',
            'ID',
            'IE',
            'IL',
            'IN',
            'KW',
            'LU',
            'MY',
            'NG',
            'NZ',
            'PH',
            'QA',
            'SA',
            'SG',
            'TH',
            'VN',
            'ZA',
        ],
    },
    { lang: 'fi', country: 'FI' },
    { lang: 'fr', country: 'FR', regions: ['BE', 'CA', 'CH', 'LU'] },
    { lang: 'hu', country: 'HU' },
    { lang: 'id', country: 'ID' },
    { lang: 'it', country: 'IT', regions: ['CH'] },
    { lang: 'ja', country: 'JP' },
    { lang: 'ko', country: 'KR' },
    { lang: 'nb', country: 'NO' },
    { lang: 'nl', country: 'NL', regions: ['BE'] },
    { lang: 'pl', country: 'PL' },
    { lang: 'pt', country: 'BR' },
    { lang: 'ru', country: 'RU' },
    { lang: 'es', country: 'ES', regions: ['AR', 'CL', 'CO', 'CR', 'EC', 'GT', 'MX', 'PE', 'PR'] },
    { lang: 'sv', country: 'SE' },
    { lang: 'th', country: 'TH' },
    { lang: 'tr', country: 'TR' },
    { lang: 'uk', country: 'UA' },
    { lang: 'vi', country: 'VN' },
    { lang: 'zh', country: 'CN' },
    { lang: 'zh', country: 'TW' },
];

const COMMERCE = [
    { lang: 'cs', country: 'CZ' },
    { lang: 'da', country: 'DK' },
    { lang: 'de', country: 'DE', regions: ['AT', 'CH', 'LU'] },
    {
        lang: 'en',
        country: 'US',
        regions: [
            'AE',
            'AU',
            'BE',
            'CA',
            'EG',
            'GR',
            'HK',
            'ID',
            'IE',
            'IL',
            'IN',
            'KW',
            'LU',
            'MY',
            'NG',
            'NZ',
            'PH',
            'QA',
            'SA',
            'SG',
            'TH',
            'VN',
            'ZA',
        ],
    },
    { lang: 'fi', country: 'FI' },
    { lang: 'fr', country: 'FR', regions: ['BE', 'CA', 'CH', 'LU'] },
    { lang: 'hu', country: 'HU' },
    { lang: 'id', country: 'ID' },
    { lang: 'it', country: 'IT', regions: ['CH'] },
    { lang: 'ja', country: 'JP' },
    { lang: 'ko', country: 'KR' },
    { lang: 'nb', country: 'NO' },
    { lang: 'nl', country: 'NL', regions: ['BE'] },
    { lang: 'pl', country: 'PL' },
    { lang: 'ru', country: 'RU' },
    { lang: 'es', country: 'ES', regions: ['AR', 'CL', 'CO', 'CR', 'EC', 'GT', 'MX', 'PE', 'PR'] },
    { lang: 'sv', country: 'SE' },
    { lang: 'th', country: 'TH' },
    { lang: 'tr', country: 'TR' },
    { lang: 'uk', country: 'UA' },
    { lang: 'vi', country: 'VN' },
    { lang: 'zh', country: 'CN' },
    { lang: 'zh', country: 'TW' },
];

const DEFAULT_LOCALES = {
    acom: ACOM,
    'acom-cc': ACOM,
    'acom-dc': ACOM,
    nala: ACOM,
    sandbox: ACOM,
    ccd: CCD,
    express: EXPRESS,
    'adobe-home': ADOBE_HOME,
    commerce: COMMERCE,
};

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
 * Extracts the locale segment from a fragment path.
 * @param {string} path e.g. /content/dam/mas/acom/de_AT/some-card
 * @returns {string|null} e.g. 'de_AT'
 */
function localeFromPath(path) {
    return path?.match(PATH_TOKENS)?.groups?.parsedLocale ?? null;
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
async function listFragmentPaths(odinEndpoint, surface, locale, authToken) {
    const folderPath = `/content/dam/mas/${surface}/${locale}`;
    const paths = [];
    let cursor = null;

    do {
        const qs = cursor ? `path=${folderPath}&cursor=${encodeURIComponent(cursor)}` : `path=${folderPath}`;
        const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments?${qs}`, authToken, {
            ignoreErrors: [400, 404],
        });
        if (!response.ok) break;
        const data = await response.json();
        for (const item of data.items ?? []) {
            if (item.path) paths.push(item.path);
        }
        cursor = data.cursor ?? null;
    } while (cursor);

    logger.info(`listFragmentPaths ${surface}/${locale}: ${paths.length} total fragment(s)`);
    return paths;
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
    const validPaths = allVariationPaths.filter((vPath) => validLocales.includes(localeFromPath(vPath)));
    const removedPaths = allVariationPaths.filter((vPath) => !validLocales.includes(localeFromPath(vPath)));

    if (!removedPaths.length) return null;

    logger.info(
        `${dryRun ? '[dry-run] ' : ''}Fragment ${fragmentPath}: removing ${removedPaths.length} variation(s): ${removedPaths.join(', ')}`,
    );

    if (!dryRun) {
        // Variations field is locked by live relationships — must use PUT with full fragment
        const updatedFields = fragment.fields.map((field) =>
            field.name === 'variations' ? { ...field, values: validPaths } : field,
        );
        const result = await putToOdin(odinEndpoint, fragment.id, authToken, {
            title: fragment.title,
            description: fragment.description || '',
            fields: updatedFields,
            etag,
        });
        if (!result.success) {
            throw new Error(`PUT failed for ${fragmentPath}: ${result.error}`);
        }
    }

    return { path: fragmentPath, removed: removedPaths };
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
            .filter((l) => !(l.lang === 'en' && l.country === 'US'))
            .map((l) => `${l.lang}_${l.country}`);
        const locales = targetLocale ? [targetLocale] : allLocales;

        logger.info(`Surface '${surface}': processing ${locales.length} locale(s)`);

        for (const locale of locales) {
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

            const results = await processBatchWithConcurrency(fragmentPaths, 10, async (fragmentPath) => {
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
