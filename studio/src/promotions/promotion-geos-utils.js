import { getSurfaceLocales, getLocaleCode, getLocaleByCode } from '../../../io/www/src/fragment/locales.js';

export const PROMOTION_GEOS_PICKER_SURFACE = 'acom';

const AMERICAS_COUNTRIES = new Set(['AR', 'BR', 'CA', 'CL', 'CO', 'CR', 'EC', 'GT', 'MX', 'PE', 'PR', 'US']);

const JAPAC_COUNTRIES = new Set(['AU', 'CN', 'HK', 'IN', 'ID', 'JP', 'KR', 'MY', 'NZ', 'PH', 'SG', 'TH', 'TW', 'VN']);

const EMEA_COUNTRIES = new Set([
    'AE',
    'AT',
    'BE',
    'BG',
    'CH',
    'CZ',
    'DE',
    'DK',
    'EE',
    'EG',
    'ES',
    'FI',
    'FR',
    'GB',
    'GR',
    'HU',
    'IE',
    'IL',
    'IT',
    'KE',
    'KW',
    'LT',
    'LU',
    'LV',
    'MU',
    'NG',
    'NL',
    'NO',
    'PL',
    'PT',
    'QA',
    'RO',
    'RU',
    'SA',
    'SE',
    'SI',
    'SK',
    'TR',
    'UA',
    'ZA',
]);

export const GROUP_ORDER = ['LATAM/Americas', 'JAPAC', 'EMEA'];

export function macroRegionForCountry(country) {
    if (!country) return 'EMEA';
    if (AMERICAS_COUNTRIES.has(country)) return 'LATAM/Americas';
    if (JAPAC_COUNTRIES.has(country)) return 'JAPAC';
    if (EMEA_COUNTRIES.has(country)) return 'EMEA';
    return 'EMEA';
}

export function isPznGeoValue(value) {
    if (!value || typeof value !== 'string') return false;
    return value.includes('/pzn/') || value.startsWith('mas:pzn/');
}

/**
 * @param {string[]|null|undefined} geos
 * @returns {string[]}
 */
export function normalizeGeosForTagPicker(geos) {
    return (geos || []).map((g) => {
        if (!g || typeof g !== 'string') return g;
        if (g.includes(':') || g.startsWith('/content/cq:tags/')) return g;
        if (/^[a-z]{2}_[A-Z]{2}$/.test(g)) return `mas:locale/${g}`;
        return g;
    });
}

/**
 * @param {string} geo
 * @returns {string}
 */
export function localeCodeFromGeoValue(geo) {
    if (!geo || typeof geo !== 'string') return '';
    if (isPznGeoValue(geo)) return '';
    if (/^[a-z]{2}_[A-Z]{2}$/.test(geo)) return geo;
    if (geo.includes('/locale/')) {
        const leaf = geo.split('/').filter(Boolean).pop() || '';
        return leaf.replace(/-/g, '_');
    }
    if (geo.startsWith('mas:locale/')) {
        return (geo.split('/').pop() || '').replace(/-/g, '_');
    }
    return '';
}

export function displayLocaleChip(code) {
    const parsed = getLocaleByCode(code);
    if (!parsed) return code;
    return `${parsed.country}_${parsed.lang}`;
}

/**
 * @param {string} [surface]
 * @returns {{ name: string, items: { code: string, masId: string, country: string }[] }[]}
 */
export function groupLocalesForPromotionPicker(surface = PROMOTION_GEOS_PICKER_SURFACE) {
    const items = getSurfaceLocales(surface)
        .map((loc) => {
            const code = getLocaleCode(loc);
            if (!code) return null;
            return { code, masId: `mas:locale/${code}`, country: loc.country };
        })
        .filter(Boolean);

    /** @type {Record<string, { code: string, masId: string, country: string }[]>} */
    const buckets = { 'LATAM/Americas': [], JAPAC: [], EMEA: [] };
    for (const item of items) {
        buckets[macroRegionForCountry(item.country)].push(item);
    }
    for (const name of GROUP_ORDER) {
        buckets[name].sort((a, b) => displayLocaleChip(a.code).localeCompare(displayLocaleChip(b.code)));
    }
    return GROUP_ORDER.map((name) => ({ name, items: buckets[name] }));
}

/**
 * @param {{ name: string, items: { code: string, masId: string, country: string }[] }[]} groups
 * @param {string} query
 */
export function filterGeosGroupsByQuery(groups, query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return groups;
    return groups
        .map((g) => ({
            ...g,
            items: g.items.filter(
                (it) =>
                    displayLocaleChip(it.code).toLowerCase().includes(q) ||
                    it.code.toLowerCase().includes(q) ||
                    it.masId.toLowerCase().includes(q),
            ),
        }))
        .filter((g) => g.items.length > 0);
}

/**
 * @param {{ name: string, items: { masId: string }[] }[]} groups
 * @returns {string[]}
 */
export function flattenMasIdsFromGroups(groups) {
    return groups.flatMap((g) => g.items.map((it) => it.masId));
}

/**
 * @param {string[]|null|undefined} geos
 * @returns {string[]}
 */
export function summarizePromotionGeosForDisplayLines(geos) {
    /** @type {Map<string, string[]>} */
    const byRegion = new Map(GROUP_ORDER.map((name) => [name, []]));
    for (const raw of geos || []) {
        const code = localeCodeFromGeoValue(raw);
        if (!code) continue;
        const parsed = getLocaleByCode(code);
        const country = parsed?.country || '';
        const region = macroRegionForCountry(country);
        const chip = displayLocaleChip(code);
        const list = byRegion.get(region);
        if (list) list.push(chip);
    }
    const parts = [];
    for (const name of GROUP_ORDER) {
        const chips = [...new Set(byRegion.get(name) || [])].sort((a, b) => a.localeCompare(b));
        if (!chips.length) continue;
        parts.push(`${name}: ${chips.join(', ')}`);
    }
    return parts;
}
