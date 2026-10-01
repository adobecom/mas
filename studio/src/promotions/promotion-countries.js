import { getCountryName, getSurfaceLocales, REGION_GROUPS } from '../locales.js';

/** AEM tag id prefix for a high-level (language-agnostic) country geo tag, e.g. 'mas:locale/US'. */
export const COUNTRY_GEO_TAG_PREFIX = 'mas:locale/';

/**
 * Matches the existing `geos` field convention for a bare country tag (e.g. 'mas:locale/US',
 * 'mas:locale/CA_en'), uppercase country code.
 * @param {string} code - two-letter country code, e.g. 'fr'
 * @returns {string} AEM tag id, e.g. 'mas:locale/FR'
 */
export function toCountryGeoTag(code) {
    return `${COUNTRY_GEO_TAG_PREFIX}${code.toUpperCase()}`;
}

/**
 * True for a bare two-letter country geo tag (e.g. 'mas:locale/US'), as opposed to a
 * language-locale tag (e.g. 'mas:locale/fr_FR') or any other geo value.
 * @param {unknown} tag
 * @returns {boolean}
 */
export function isCountryGeoTag(tag) {
    if (typeof tag !== 'string' || !tag.startsWith(COUNTRY_GEO_TAG_PREFIX)) return false;
    return /^[a-z]{2}$/i.test(tag.slice(COUNTRY_GEO_TAG_PREFIX.length));
}

/**
 * @param {string[]} [geoValues] - raw `geos` field values
 * @returns {string[]} selected country codes, e.g. ['US', 'FR']
 */
export function getSelectedCountriesFromGeos(geoValues = []) {
    return geoValues.filter(isCountryGeoTag).map((tag) => tag.slice(COUNTRY_GEO_TAG_PREFIX.length).toUpperCase());
}

/**
 * Replaces the country geo tags in `geoValues` with tags for `countries`, leaving every other
 * geo value (e.g. personalization tags) untouched.
 * @param {string[]} [geoValues]
 * @param {string[]} [countries]
 * @returns {string[]}
 */
export function mergeCountriesIntoGeos(geoValues = [], countries = []) {
    const nonCountryTags = geoValues.filter((tag) => !isCountryGeoTag(tag));
    return [...nonCountryTags, ...countries.map(toCountryGeoTag)];
}

/**
 * Deduped, sorted union of country codes across every surface's locales.
 * @param {string[]} [surfaces]
 * @returns {string[]}
 */
export function getCountriesForSurfaces(surfaces = []) {
    const codes = new Set();
    for (const surface of surfaces) {
        for (const locale of getSurfaceLocales(surface)) {
            codes.add(locale.country);
        }
    }
    return [...codes].sort();
}

/**
 * Countries available across `surfaces`, grouped the same way as the Translations language
 * picker (see mas-translation-languages.js), for the shared grouped selector component.
 * @param {string[]} [surfaces]
 * @returns {{ name: string, items: { value: string, label: string }[] }[]}
 */
export function getCountryGroups(surfaces = []) {
    const countries = getCountriesForSurfaces(surfaces);
    const toItem = (code) => ({ value: code, label: getCountryName(code) });
    const groups = [];
    for (const region of REGION_GROUPS) {
        const items = countries.filter((code) => region.countries.includes(code)).map(toItem);
        if (items.length) groups.push({ name: region.name, items });
    }
    const grouped = new Set(groups.flatMap((group) => group.items.map((item) => item.value)));
    const other = countries.filter((code) => !grouped.has(code)).map(toItem);
    if (other.length) groups.push({ name: 'Other', items: other });
    return groups;
}
