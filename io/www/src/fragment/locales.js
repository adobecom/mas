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
    KR: { name: 'South Korea', flag: '🇰🇷' },
    KW: { name: 'Kuwait', flag: '🇰🇼' },
    LT: { name: 'Lithuania', flag: '🇱🇹' },
    LU: { name: 'Luxembourg', flag: '🇱🇺' },
    LV: { name: 'Latvia', flag: '🇱🇻' },
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

export const ACOM = [
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
            'AR',
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
    { lang: 'zh', country: 'HK' },
    { lang: 'zh', country: 'TW' },
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
            'AR',
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
    { lang: 'en', country: 'GB', regions: ['IN'] },
    {
        lang: 'en',
        country: 'US',
        regions: [
            'AE',
            'AR',
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
    { lang: 'pt', country: 'PT' },
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
            'AR',
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
            'AR',
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
    nala: ACOM,
    sandbox: ACOM,
    ccd: CCD,
    express: EXPRESS,
    'adobe-home': ADOBE_HOME,
    commerce: COMMERCE,
};

export const LANG_TO_LANGUAGE = {
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

const parseLocaleCode = (localeCode) => localeCode?.split('_') ?? [];

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

export function getLanguageName(lang) {
    return LANG_TO_LANGUAGE[lang] || lang;
}
