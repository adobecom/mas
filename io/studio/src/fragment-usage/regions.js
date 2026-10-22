/**
 * Country -> region grouping for the usage rollup (MWPW-185891).
 *
 * Mirrors REGION_GROUPS in studio/src/locales.js, the grouping the locale picker uses. It is copied
 * rather than imported because the rollup is a CommonJS Adobe I/O action while studio/src/locales.js
 * is a browser ES module, and the two runtimes share no module format here -- keep the lists in sync.
 * Akamai reports ISO 3166-1 codes, so both lists hold ISO codes only: `LA`, for instance, is Laos.
 *
 * Region totals are summed here, over every country a page was served from, so the reader can file a
 * page by region without the per-country display cap deciding the outcome. A country in no list
 * votes for no region, so traffic we cannot attribute pushes a page toward Global rather than toward
 * a region it may not belong to -- the same rule studio applies.
 */

const REGION_GROUPS = [
    { name: 'LATAM/Americas', countries: ['US', 'CA', 'MX', 'AR', 'BR', 'CL', 'CO', 'CR', 'GT', 'PE', 'PR', 'EC'] },
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

const REGION_BY_COUNTRY = new Map(REGION_GROUPS.flatMap(({ name, countries }) => countries.map((country) => [country, name])));

/**
 * Sums a page's per-country requests into per-region totals, over every country rather than the
 * capped display set, so a region spread across a long tail of countries is still measured whole.
 * @param {object} countries country code -> request count
 * @returns {object} region name -> request count, holding only regions with traffic
 */
function sumRegions(countries) {
    const totals = {};
    for (const [country, requests] of Object.entries(countries ?? {})) {
        const count = Number(requests) || 0;
        if (count <= 0) continue;
        const region = REGION_BY_COUNTRY.get(String(country).toUpperCase());
        if (region) totals[region] = (totals[region] ?? 0) + count;
    }
    return totals;
}

module.exports = {
    REGION_GROUPS,
    REGION_BY_COUNTRY,
    sumRegions,
};
