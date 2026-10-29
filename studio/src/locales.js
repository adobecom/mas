export {
    parseLocaleCode,
    getLocaleByCode,
    getLocaleCode,
    getLanguageName,
    getCountryName,
    getCountryFlag,
    getDefaultLocale,
    getDefaultLocaleCode,
    getDefaultLocales,
    getSurfaceLocales,
    getRegionLocales,
} from '../../io/www/src/fragment/locales.js';

import { getDefaultLocales, getSurfaceLocales, getLocaleCode } from '../../io/www/src/fragment/locales.js';

// Studio-side UI grouping: organizes locales into named regions for the locale
// picker. Lives here (not in io/www) because no io/www runtime code consumes it.
export const REGION_GROUPS = [
    { name: 'LATAM/Americas', countries: ['US', 'CA', 'MX', 'AR', 'BR', 'CL', 'CO', 'CR', 'GT', 'PE', 'PR', 'EC', 'LA'] },
    { name: 'JAPAC', countries: ['AU', 'NZ', 'JP', 'KR', 'CN', 'TW', 'HK', 'SG', 'IN', 'ID', 'MY', 'PH', 'TH', 'VN'] },
    {
        name: 'EMEA',
        countries: [
            'GB',
            'DE',
            'FR',
            'IT',
            'ES',
            'NL',
            'BE',
            'CH',
            'AT',
            'LU',
            'PT',
            'PL',
            'CZ',
            'SK',
            'HU',
            'RO',
            'BG',
            'EE',
            'LV',
            'LT',
            'FI',
            'DK',
            'SE',
            'NO',
            'GR',
            'TR',
            'RU',
            'UA',
            'SI',
            'SA',
            'AE',
            'EG',
            'KW',
            'QA',
            'IL',
            'NG',
            'ZA',
            'IE',
            'HR',
        ],
    },
];

export function groupByRegion(items, getCountry) {
    const groups = [];
    for (const region of REGION_GROUPS) {
        const inRegion = items.filter((item) => region.countries.includes(getCountry(item)));
        if (inRegion.length) groups.push({ name: region.name, items: inRegion });
    }
    const grouped = new Set(groups.flatMap((group) => group.items));
    const other = items.filter((item) => !grouped.has(item));
    if (other.length) groups.push({ name: 'Other', items: other });
    return groups;
}

export function getLocalePickerItems(surface, { includeSource = false, includeRegional = false } = {}) {
    const locales = includeRegional ? getSurfaceLocales(surface) : getDefaultLocales(surface);
    return locales
        .map((locale) => ({ value: getLocaleCode(locale), country: locale.country }))
        .filter(({ value }) => includeSource || value !== 'en_US');
}
