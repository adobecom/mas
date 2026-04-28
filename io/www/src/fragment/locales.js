import { PATH_TOKENS } from './utils/paths.js';
import surfaceLocaleLists from '../locales.json' with { type: 'json' };

const { ACOM, CCD, EXPRESS, ADOBE_HOME, COMMERCE } = surfaceLocaleLists;

const COUNTRY_DATA = {
    AE: { name: 'United Arab Emirates', flag: '🇦🇪' },
    AR: { name: 'Argentina', flag: '🇦🇷' },
    AT: { name: 'Austria', flag: '🇦🇹' },
    AU: { name: 'Australia', flag: '🇦🇺' },
    BE: { name: 'Belgium', flag: '🇧🇪' },
    BG: { name: 'Bulgaria', flag: '🇧🇬' },
    BR: { name: 'Brazil', flag: '🇧🇷' },
    CA: { name: 'Canada', flag: '🇨🇦' },
    CH: { name: 'Switzerland', flag: '🇨🇭' },
    CL: { name: 'Chile', flag: '🇨🇱' },
    CN: { name: 'China', flag: '🇨🇳' },
    CO: { name: 'Colombia', flag: '🇨🇴' },
    CR: { name: 'Costa Rica', flag: '🇨🇷' },
    CZ: { name: 'Czech Republic', flag: '🇨🇿' },
    DE: { name: 'Germany', flag: '🇩🇪' },
    DK: { name: 'Denmark', flag: '🇩🇰' },
    EC: { name: 'Ecuador', flag: '🇪🇨' },
    EE: { name: 'Estonia', flag: '🇪🇪' },
    EG: { name: 'Egypt', flag: '🇪🇬' },
    ES: { name: 'Spain', flag: '🇪🇸' },
    FI: { name: 'Finland', flag: '🇫🇮' },
    FR: { name: 'France', flag: '🇫🇷' },
    GB: { name: 'United Kingdom', flag: '🇬🇧' },
    GR: { name: 'Greece', flag: '🇬🇷' },
    GT: { name: 'Guatemala', flag: '🇬🇹' },
    HK: { name: 'Hong Kong', flag: '🇭🇰' },
    HU: { name: 'Hungary', flag: '🇭🇺' },
    ID: { name: 'Indonesia', flag: '🇮🇩' },
    IE: { name: 'Ireland', flag: '🇮🇪' },
    IL: { name: 'Israel', flag: '🇮🇱' },
    IN: { name: 'India', flag: '🇮🇳' },
    IT: { name: 'Italy', flag: '🇮🇹' },
    JP: { name: 'Japan', flag: '🇯🇵' },
    KE: { name: 'Kenya', flag: '🇰🇪' },
    KR: { name: 'South Korea', flag: '🇰🇷' },
    KW: { name: 'Kuwait', flag: '🇰🇼' },
    LT: { name: 'Lithuania', flag: '🇱🇹' },
    LU: { name: 'Luxembourg', flag: '🇱🇺' },
    LV: { name: 'Latvia', flag: '🇱🇻' },
    MU: { name: 'Mauritius', flag: '🇲🇺' },
    MX: { name: 'Mexico', flag: '🇲🇽' },
    MY: { name: 'Malaysia', flag: '🇲🇾' },
    NG: { name: 'Nigeria', flag: '🇳🇬' },
    NL: { name: 'Netherlands', flag: '🇳🇱' },
    NO: { name: 'Norway', flag: '🇳🇴' },
    NZ: { name: 'New Zealand', flag: '🇳🇿' },
    PE: { name: 'Peru', flag: '🇵🇪' },
    PH: { name: 'Philippines', flag: '🇵🇭' },
    PL: { name: 'Poland', flag: '🇵🇱' },
    PR: { name: 'Puerto Rico', flag: '🇵🇷' },
    PT: { name: 'Portugal', flag: '🇵🇹' },
    QA: { name: 'Qatar', flag: '🇶🇦' },
    RO: { name: 'Romania', flag: '🇷🇴' },
    RU: { name: 'Russia', flag: '🇷🇺' },
    SA: { name: 'Saudi Arabia', flag: '🇸🇦' },
    SE: { name: 'Sweden', flag: '🇸🇪' },
    SG: { name: 'Singapore', flag: '🇸🇬' },
    SI: { name: 'Slovenia', flag: '🇸🇮' },
    SK: { name: 'Slovakia', flag: '🇸🇰' },
    TH: { name: 'Thailand', flag: '🇹🇭' },
    TR: { name: 'Türkiye', flag: '🇹🇷' },
    TW: { name: 'Taiwan', flag: '🇹🇼' },
    UA: { name: 'Ukraine', flag: '🇺🇦' },
    US: { name: 'United States', flag: '🇺🇸' },
    VN: { name: 'Vietnam', flag: '🇻🇳' },
    ZA: { name: 'South Africa', flag: '🇿🇦' },
};

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

const LANG_TO_LANGUAGE = {
    ar: 'Arabic',
    bg: 'Bulgarian',
    cs: 'Czech',
    da: 'Danish',
    de: 'German',
    el: 'Greek',
    en: 'English',
    es: 'Spanish',
    et: 'Estonian',
    fi: 'Finnish',
    fil: 'Filipino',
    fr: 'French',
    he: 'Hebrew',
    hi: 'Hindi',
    hu: 'Hungarian',
    id: 'Indonesian',
    it: 'Italian',
    ja: 'Japanese',
    ko: 'Korean',
    lt: 'Lithuanian',
    lv: 'Latvian',
    ms: 'Malay',
    nb: 'Norwegian Bokmål',
    nl: 'Dutch',
    pl: 'Polish',
    pt: 'Portuguese',
    ro: 'Romanian',
    ru: 'Russian',
    sk: 'Slovak',
    sl: 'Slovenian',
    sv: 'Swedish',
    th: 'Thai',
    tr: 'Turkish',
    uk: 'Ukrainian',
    vi: 'Vietnamese',
    zh: 'Chinese',
};

const regionLocalesCache = {};

export const parseLocaleCode = (localeCode) => localeCode?.split('_') ?? [];

/**
 * Get locale object from locale code
 * @param {string} code - Locale code (e.g., 'en_US')
 * @returns {{ lang: string, country: string } | null}
 */
export function getLocaleByCode(code) {
    if (!code) return null;
    const [lang, country] = parseLocaleCode(code);
    if (!lang || !country) return null;
    return { lang, country };
}

// Helper to generate locale code from lang and country
export function getLocaleCode(locale) {
    if (!locale) {
        return null;
    }
    return `${locale.lang}_${locale.country}`;
}

// Helper to get country name
export function getCountryName(country) {
    return COUNTRY_DATA[country]?.name || country;
}

// Helper to get country flag
export function getCountryFlag(country) {
    return COUNTRY_DATA[country]?.flag || '🏴';
}

export function getDefaultLocale(surface, localeCode) {
    const [language, country] = parseLocaleCode(localeCode);
    if (!DEFAULT_LOCALES[surface]) {
        return null;
    }
    let defaultLocale = DEFAULT_LOCALES[surface].find(
        (locale) => locale.lang === language && (locale.country === country || locale.regions?.includes(country)),
    );
    if (!defaultLocale) {
        defaultLocale = DEFAULT_LOCALES[surface].find((locale) => locale.lang === language);
    }
    return defaultLocale;
}

/**
 * get default locale for a given locale code and surface
 * some surfaces (acom) could have 2 default locales with same language but different country (en_US and en_GB)
 * this function will find the best match
 * @param {*} localeCode e.g. 'en_US'
 * @param {*} surface e.g. 'acom'
 * @returns
 */
export function getDefaultLocaleCode(surface, localeCode) {
    if (!localeCode || !surface) {
        return null;
    }
    const defaultLocale = getDefaultLocale(surface, localeCode);
    return defaultLocale ? getLocaleCode(defaultLocale) : null;
}

export function getDefaultLocales(surface) {
    return DEFAULT_LOCALES[surface] || [];
}

/**
 * Get all locales for a given surface, including default locales and region variants.
 * @param {string} surface e.g. 'acom'
 * @returns {{ lang: string, country: string }[]}
 */
export function getSurfaceLocales(surface) {
    const map = new Map();
    getDefaultLocales(surface)
        .flatMap(({ lang, country, regions = [] }) => [
            { lang, country },
            ...regions.map((region) => ({ lang, country: region })),
        ])
        .forEach((locale) => {
            map.set(getLocaleCode(locale), locale);
        });
    return [...map.values()];
}

/**
 * get region locales for a given surface and a given default locale.
 * acom: will return 'en_AU', 'en_IN' for 'en_GB', because for acom 'en_GB' is a default language.
 * ccd: will return 'en_GB', 'en_AU', 'en_IN' for 'en_US', because for ccd 'en_GB' is NOT a default language.
 * @param {*} surface e.g. 'acom'
 * @param {*} defaultLocale e.g. 'en_US'
 * @param {*} includeDefault e.g. true
 * @returns
 */
export function getRegionLocales(surface, localeCode, includeDefault) {
    const cacheKey = `${surface}-${localeCode}-${includeDefault}`;
    if (!regionLocalesCache[cacheKey]) {
        const [lang, country] = parseLocaleCode(localeCode);
        const defaultLocale = getDefaultLocale(surface, localeCode);
        const regionLocales = defaultLocale?.regions
            ? defaultLocale.regions
                  .map((region) => ({ lang, country: region }))
                  .sort((a, b) => getCountryName(a.country).localeCompare(getCountryName(b.country)))
            : [];
        if (includeDefault && defaultLocale) {
            regionLocales.push({ lang, country: defaultLocale.country });
        }
        regionLocalesCache[cacheKey] = regionLocales;
    }
    return regionLocalesCache[cacheKey];
}

/**
 * Whether a variation’s path locale belongs to the same default-locale “family” as the selected
 * locale (base locale plus regional variants for the surface). Used when filtering fragment references
 * in the studio so locale/grouped lists stay aligned with {@link getRegionLocales}.
 *
 * @param {string} surface - e.g. 'acom'
 * @param {string} selectedLocale - Locale segment to match (e.g. 'en_US')
 * @param {string} variationPath - Full AEM path of the variation
 * @returns {boolean}
 */
export function isVariationPathInParentLocaleFamily(surface, selectedLocale, variationPath) {
    if (!surface || !variationPath) return false;
    const selectedLangAndCountry = getLocaleByCode(selectedLocale);
    if (!selectedLangAndCountry) return false;
    const regionLocales = getRegionLocales(surface, selectedLocale);
    const pathMatch = variationPath.match(PATH_TOKENS);
    const variationLocaleCode = pathMatch?.groups?.parsedLocale ?? null;
    if (!variationLocaleCode) return false;
    return [selectedLangAndCountry, ...regionLocales].some((localeEntry) => variationLocaleCode === getLocaleCode(localeEntry));
}

export function getLanguageName(lang) {
    return LANG_TO_LANGUAGE[lang] || lang;
}
