/**
 * Pure mapping tables and transforms for the grouped-variation `pznTags` migration.
 *
 * Two independent, idempotent set transforms over a variation's `pznTags`:
 *
 *   localeToCountry — locale → country. `mas:locale/<xx_YY>` becomes `mas:pzn/country/<cc>` for the
 *                     40 in-scope ACOM markets. Several locales of the same market collapse onto one tag.
 *   umbrellaExpansion — umbrella expansion. A variation tagged for MU / TM / DZ also gets its
 *                        constituent countries, added in country form.
 *
 * The localeToCountry market table is DERIVED from `getSurfaceLocales('acom')` — never hand-maintained —
 * so a locale added to `io/www/src/fragment/locales.js` flows through automatically.
 */

import {
    getDefaultLocaleCode,
    getDefaultLocales,
    getLocaleCode,
    getSurfaceLocales,
} from '../../io/www/src/fragment/locales.js';

export const SURFACE = 'acom';

/** Variants this work order touches, keyed by surface. Everything else is out of scope. */
export const IN_SCOPE_VARIANTS_BY_SURFACE = {
    acom: ['plans', 'plans-v2', 'plans-students', 'plans-education'],
    'acom-dc': ['product', 'segment', 'mini-compare-chart', 'image', 'headless', 'compare-chart-column', 'pro'],
};

export function inScopeVariantsFor(surface) {
    return IN_SCOPE_VARIANTS_BY_SURFACE[surface] ?? [];
}

/** Surfaces where only umbrellaExpansion (TYPE 2 geo expansion) applies — no localeToCountry (TYPE 1) rewrite. */
export const UMBRELLA_ONLY_SURFACES = ['acom-dc'];

/** The 40 localeToCountry target markets (plan §3 / P2.2). Order is the wiki's, kept for side-by-side review. */
export const LOCALE_TO_COUNTRY_MARKETS = [
    'AR',
    'AU',
    'AT',
    'BR',
    'CL',
    'CO',
    'CR',
    'DK',
    'EC',
    'EE',
    'FR',
    'DE',
    'GT',
    'IN',
    'IT',
    'JP',
    'LV',
    'MX',
    'NL',
    'NO',
    'PL',
    'PT',
    'PR',
    'SK',
    'SI',
    'KR',
    'SE',
    'CH',
    'TW',
    'UA',
    'BG',
    'CZ',
    'FI',
    'TR',
    'GB',
    'RO',
    'ES',
    'PE',
    'LT',
    'HU',
    // Added post-plan: en_AU-tree APAC English markets found in the live corpus, not on the original wiki list.
    'NZ',
    'SG',
    'TH',
    'MY',
];

/** umbrellaExpansion parents and the countries each expands into (plan §4.2). */
export const UMBRELLA_EXPANSIONS = {
    MU: ['KE', 'TZ', 'GH'],
    TM: ['AM', 'AZ', 'GE', 'MD', 'KZ', 'KG', 'TJ', 'UZ'],
    DZ: ['OM', 'MA', 'LB', 'JO', 'IQ', 'BH'],
};

export const UMBRELLA_PARENTS = Object.keys(UMBRELLA_EXPANSIONS);

export const UMBRELLA_CHILDREN = [...new Set(Object.values(UMBRELLA_EXPANSIONS).flat())];

/** Territories whose content country differs from their WCS country (mirrors `TERRITORY_MAP`, not exported there). */
export const TERRITORY_MARKETS = ['PR'];

export const FLAGS = {
    COLLISION: 'COLLISION',
    MERGED: 'MERGED',
    SCORE_DEMOTION_RISK: 'SCORE_DEMOTION_RISK',
    AMBIGUOUS_CH: 'AMBIGUOUS_CH',
    PARENT_NON_EN: 'PARENT_NON_EN',
    TAG_MISSING: 'TAG_MISSING',
    TAG_DRIFT: 'TAG_DRIFT',
    TERRITORY_PR: 'TERRITORY_PR',
    EN_GB_TREE: 'EN_GB_TREE',
    SURFACE_DEFAULT: 'SURFACE_DEFAULT',
};

/** Flags that block unattended application. `MERGED` and `SURFACE_DEFAULT` are informational. */
export const BLOCKING_FLAGS = [
    FLAGS.COLLISION,
    FLAGS.SCORE_DEMOTION_RISK,
    FLAGS.AMBIGUOUS_CH,
    FLAGS.PARENT_NON_EN,
    FLAGS.TAG_MISSING,
    FLAGS.TAG_DRIFT,
    FLAGS.TERRITORY_PR,
    FLAGS.EN_GB_TREE,
];

export const RULES = {
    LOCALE_TO_COUNTRY: 'LOCALE_TO_COUNTRY',
    UMBRELLA_EXPANSION: 'UMBRELLA_EXPANSION',
    BOTH: 'LOCALE_TO_COUNTRY+UMBRELLA_EXPANSION',
    NOOP: 'NOOP',
};

export const COUNTRY_TAG_PREFIX = 'mas:pzn/country';
export const COUNTRY_TAG_ROOT = '/content/cq:tags/mas/pzn/country';
export const LOCALE_TAG_ROOT = '/content/cq:tags/mas/locale';

// Both mirror `matchesGeo` (io/www/src/fragment/utils/common.js): the dimension segment must start
// the tag or be preceded by `/` or `:`, and one optional grouping segment may sit before the value.
const LOCALE_TAG_RE = /(?:^|[/:])locale\/(?:[^/]+\/)?([a-z]{2,3}_[a-z]{2})$/i;
const COUNTRY_TAG_RE = /(?:^|[/:])country\/(?:[^/]+\/)?([a-z]{2})$/i;

export function toCountryTag(country) {
    return `${COUNTRY_TAG_PREFIX}/${country.toLowerCase()}`;
}

/** Locale code (`es_EC`) carried by a geo locale tag, or null for any other tag. */
export function parseLocaleTag(tag) {
    const match = typeof tag === 'string' ? LOCALE_TAG_RE.exec(tag) : null;
    if (!match) return null;
    const [lang, country] = match[1].split('_');
    return `${lang.toLowerCase()}_${country.toUpperCase()}`;
}

/** Uppercase country code carried by a geo country tag, or null for any other tag. */
export function parseCountryTag(tag) {
    const match = typeof tag === 'string' ? COUNTRY_TAG_RE.exec(tag) : null;
    return match ? match[1].toUpperCase() : null;
}

/** Country a tag targets in either form — the detection rule shared with `normalizePznTagToLocaleCode`. */
export function tagCountry(tag) {
    return parseCountryTag(tag) ?? parseLocaleTag(tag)?.split('_')[1] ?? null;
}

function buildMarketTable() {
    // Pinned to 'acom': acom-dc shares this exact locale table (see DEFAULT_LOCALES); do not swap in the caller's surface.
    const surfaceLocales = getSurfaceLocales(SURFACE);
    const defaults = new Map(getDefaultLocales(SURFACE).map((locale) => [getLocaleCode(locale), locale]));
    const table = new Map();
    for (const market of LOCALE_TO_COUNTRY_MARKETS) {
        const locales = surfaceLocales
            .filter((locale) => locale.country === market)
            .map(getLocaleCode)
            .sort();
        // GB/AU/IN fall back to en_GB, so their grouped variations author under a different tree.
        const authoringTree = getDefaultLocaleCode(SURFACE, `en_${market}`) ?? 'en_US';
        table.set(market, {
            country: market,
            countryTag: toCountryTag(market),
            locales,
            surfaceDefaultsWithRegions: locales.filter((code) => defaults.get(code)?.regions?.length),
            authoringTree,
            territory: TERRITORY_MARKETS.includes(market),
        });
    }
    return table;
}

/** market code → { country, countryTag, locales[], surfaceDefaultsWithRegions[], authoringTree, territory } */
export const MARKET_TABLE = buildMarketTable();

/** locale code → market entry, for the locales that collapse under localeToCountry. */
export const LOCALE_TO_MARKET = new Map(
    [...MARKET_TABLE.values()].flatMap((entry) => entry.locales.map((code) => [code, entry])),
);

export function isEnGbTree(market) {
    return MARKET_TABLE.get(market)?.authoringTree === 'en_GB';
}

const dedupe = (tags) => [...new Set(tags)];

/**
 * localeToCountry — replace in-scope locale tags with their market's country tag, in place.
 *
 * Tags neither rule names are never touched: out-of-market locale tags (`fr_BE`, `en_CA`) and
 * non-geo `mas:pzn/<segment>` tags (which `personalizationMatchScore` weights ×100, far above geo)
 * both pass through unchanged.
 *
 * @param {string[]} tags - current `pznTags`
 * @param {string} [locale] - the variation's own DAM locale, used only for the `EN_GB_TREE` flag
 * @returns {{ tags: string[], flags: string[], mapped: {from: string, to: string, locale: string, market: string}[], markets: string[] }}
 */
export function applyLocaleToCountry(tags, locale) {
    const source = Array.isArray(tags) ? tags.filter(Boolean) : [];
    const mapped = [];
    const flags = new Set();
    const countryCounts = new Map();

    const next = source.map((tag) => {
        const localeCode = parseLocaleTag(tag);
        const market = localeCode ? LOCALE_TO_MARKET.get(localeCode) : null;
        if (!market) return tag;
        mapped.push({ from: tag, to: market.countryTag, locale: localeCode, market: market.country });
        countryCounts.set(market.country, (countryCounts.get(market.country) ?? 0) + 1);
        if (market.country === 'CH') flags.add(FLAGS.AMBIGUOUS_CH);
        if (market.territory) flags.add(FLAGS.TERRITORY_PR);
        if (isEnGbTree(market.country)) flags.add(FLAGS.EN_GB_TREE);
        if (market.surfaceDefaultsWithRegions.includes(localeCode)) flags.add(FLAGS.SURFACE_DEFAULT);
        return market.countryTag;
    });

    if ([...countryCounts.values()].some((count) => count > 1)) flags.add(FLAGS.MERGED);
    if (locale === 'en_GB' && mapped.length) flags.add(FLAGS.EN_GB_TREE);

    return { tags: dedupe(next), flags: [...flags], mapped, markets: [...countryCounts.keys()] };
}

/**
 * umbrellaExpansion — add each umbrella parent's constituent countries, always in country form.
 *
 * The children are registered only as `en_US` regions, so a parent expressed solely as a non-English
 * locale tag (`ru_TM`, `ar_DZ`) sits on a tree where en-only children would be inert. Those are
 * flagged `PARENT_NON_EN` and left alone rather than auto-expanded.
 *
 * @param {string[]} tags - current `pznTags`
 * @returns {{ tags: string[], flags: string[], expanded: {parent: string, children: string[]}[], skipped: string[] }}
 */
export function applyUmbrellaExpansion(tags) {
    const source = Array.isArray(tags) ? tags.filter(Boolean) : [];
    const flags = new Set();
    const expanded = [];
    const skipped = [];
    const additions = [];

    for (const parent of UMBRELLA_PARENTS) {
        const parentTags = source.filter((tag) => tagCountry(tag) === parent);
        if (!parentTags.length) continue;
        const hasEnglishForm = parentTags.some(
            (tag) => parseCountryTag(tag) === parent || parseLocaleTag(tag) === `en_${parent}`,
        );
        if (!hasEnglishForm) {
            flags.add(FLAGS.PARENT_NON_EN);
            skipped.push(parent);
            continue;
        }
        const children = UMBRELLA_EXPANSIONS[parent].filter(
            (child) => !source.some((tag) => tagCountry(tag) === child) && !additions.includes(toCountryTag(child)),
        );
        if (!children.length) continue;
        additions.push(...children.map(toCountryTag));
        expanded.push({ parent, children });
    }

    return { tags: dedupe([...source, ...additions]), flags: [...flags], expanded, skipped };
}

/**
 * Both transforms in sequence. localeToCountry and umbrellaExpansion never contend: no umbrella
 * parent and no umbrella child is a localeToCountry market, so neither can rewrite the other's input.
 *
 * @param {string[]} tags
 * @param {{ locale?: string, applyUmbrella?: boolean, runLocaleToCountry?: boolean }} [options] - `applyUmbrella` is false off the en_US tree; `runLocaleToCountry` is false on umbrella-only surfaces
 */
export function applyBoth(tags, { locale, applyUmbrella = true, runLocaleToCountry = true } = {}) {
    const localeToCountry = runLocaleToCountry
        ? applyLocaleToCountry(tags, locale)
        : { tags, flags: [], mapped: [], markets: [] };
    const umbrellaExpansion = applyUmbrella
        ? applyUmbrellaExpansion(localeToCountry.tags)
        : { tags: localeToCountry.tags, flags: [], expanded: [], skipped: [] };
    const changedByLocaleToCountry = localeToCountry.mapped.length > 0;
    const changedByUmbrellaExpansion = umbrellaExpansion.expanded.length > 0;
    let rule = RULES.NOOP;
    if (changedByLocaleToCountry && changedByUmbrellaExpansion) rule = RULES.BOTH;
    else if (changedByLocaleToCountry) rule = RULES.LOCALE_TO_COUNTRY;
    else if (changedByUmbrellaExpansion) rule = RULES.UMBRELLA_EXPANSION;
    return {
        tags: umbrellaExpansion.tags,
        flags: [...new Set([...localeToCountry.flags, ...umbrellaExpansion.flags])],
        rule,
        localeToCountry,
        umbrellaExpansion,
    };
}

/** Every country tag the migration can produce — the P2.2 taxonomy prerequisite set. */
export function requiredCountryTags() {
    return dedupe([...LOCALE_TO_COUNTRY_MARKETS, ...UMBRELLA_CHILDREN].map(toCountryTag)).sort();
}
