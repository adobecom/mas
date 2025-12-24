const ALL_SURFACES = 'all';

const ACOM_SURFACES = ['acom', 'nala', 'sandbox'];

const ALL_NO_EXPRESS_SURFACES = ['acom', 'ccd', 'commerce', 'adobe-home', 'nala', 'sandbox'];

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

const LOCALES = [
    { lang: 'ar', country: 'AE', region: 'ALL_SURFACES' },
    { lang: 'ar', country: 'EG', region: ALL_SURFACES },
    { lang: 'ar', country: 'KW', region: ALL_SURFACES },
    { lang: 'ar', country: 'QA', region: ALL_SURFACES },
    { lang: 'ar', country: 'SA', default: ACOM_SURFACES },
    { lang: 'bg', country: 'BG', default: ACOM_SURFACES },
    { lang: 'zh', country: 'CN', default: ALL_SURFACES },
    { lang: 'zh', country: 'HK', default: ACOM_SURFACES },
    { lang: 'zh', country: 'TW', default: ALL_SURFACES },
    { lang: 'cs', country: 'CZ', default: ALL_NO_EXPRESS_SURFACES },
    { lang: 'da', country: 'DK', default: ALL_SURFACES },
    { lang: 'nl', country: 'NL', default: ALL_SURFACES },
    { lang: 'de', country: 'AT', region: ALL_SURFACES },
    { lang: 'de', country: 'CH', region: ALL_SURFACES },
    { lang: 'en', country: 'AE', region: ALL_SURFACES },
    { lang: 'en', country: 'AR', region: ALL_SURFACES },
    { lang: 'en', country: 'AU', region: ALL_SURFACES },
    { lang: 'en', country: 'BE', region: ALL_SURFACES },
    { lang: 'en', country: 'CA', region: ALL_SURFACES },
    { lang: 'en', country: 'EG', region: ALL_SURFACES },
    { lang: 'en', country: 'GR', region: ALL_SURFACES },
    { lang: 'en', country: 'HK', region: ALL_SURFACES },
    { lang: 'en', country: 'ID', region: ALL_SURFACES },
    { lang: 'en', country: 'IE', region: ALL_SURFACES },
    { lang: 'en', country: 'IL', region: ALL_SURFACES },
    { lang: 'en', country: 'IN', region: ALL_SURFACES },
    { lang: 'en', country: 'KW', region: ALL_SURFACES },
    { lang: 'en', country: 'LU', region: ALL_SURFACES },
    { lang: 'en', country: 'MY', region: ALL_SURFACES },
    { lang: 'en', country: 'NG', region: ALL_SURFACES },
    { lang: 'en', country: 'NZ', region: ALL_SURFACES },
    { lang: 'en', country: 'PH', region: ALL_SURFACES },
    { lang: 'en', country: 'QA', region: ALL_SURFACES },
    { lang: 'en', country: 'SA', region: ALL_SURFACES },
    { lang: 'en', country: 'SG', region: ALL_SURFACES },
    { lang: 'en', country: 'TH', region: ALL_SURFACES },
    { lang: 'en', country: 'US', default: ALL_SURFACES },
    { lang: 'en', country: 'VN', region: ALL_SURFACES },
    { lang: 'en', country: 'ZA', region: ALL_SURFACES },
    { lang: 'en', country: 'GB', region: ACOM_SURFACES },
    { lang: 'et', country: 'EE', region: ALL_SURFACES },
    { lang: 'fi', country: 'FI', default: ALL_SURFACES },
    { lang: 'fil', country: 'PH', region: ACOM_SURFACES },
    { lang: 'fr', country: 'FR', default: ALL_SURFACES },
    { lang: 'fr', country: 'BE', region: ALL_SURFACES },
    { lang: 'fr', country: 'CA', region: ['acom', 'express', 'ccd'] },
    { lang: 'fr', country: 'CH', region: ALL_SURFACES },
    { lang: 'de', country: 'DE', default: ALL_SURFACES },
    { lang: 'de', country: 'LU', region: ALL_SURFACES },
    { lang: 'el', country: 'GR', default: ACOM_SURFACES },
    { lang: 'fr', country: 'LU', region: ALL_SURFACES },
    { lang: 'he', country: 'IL', default: ACOM_SURFACES },
    { lang: 'hi', country: 'IN', default: ['acom', 'ccd', 'nala', 'sandbox'] },
    { lang: 'hu', country: 'HU', default: ALL_NO_EXPRESS_SURFACES },
    { lang: 'id', country: 'ID', default: ALL_SURFACES },
    { lang: 'it', country: 'CH', region: ALL_SURFACES },
    { lang: 'it', country: 'IT', default: ALL_SURFACES },
    { lang: 'ja', country: 'JP', default: ALL_SURFACES },
    { lang: 'ko', country: 'KR', default: ALL_SURFACES },
    { lang: 'lt', country: 'LT', default: ACOM_SURFACES },
    { lang: 'lv', country: 'LV', default: ACOM_SURFACES },
    { lang: 'ms', country: 'MY', default: ACOM_SURFACES },
    { lang: 'nb', country: 'NO', default: ALL_SURFACES },
    { lang: 'nl', country: 'BE', region: ALL_SURFACES },
    { lang: 'pl', country: 'PL', default: ALL_NO_EXPRESS_SURFACES },
    { lang: 'pt', country: 'BR', default: ['express', 'ccd', 'adobe-home'], region: ACOM_SURFACES },
    { lang: 'pt', country: 'PT', default: ACOM_SURFACES },
    { lang: 'ro', country: 'RO', default: ACOM_SURFACES },
    { lang: 'ru', country: 'RU', default: ALL_NO_EXPRESS_SURFACES },
    { lang: 'sk', country: 'SK', default: ACOM_SURFACES },
    { lang: 'sl', country: 'SI', default: ACOM_SURFACES },
    { lang: 'es', country: 'AR', region: ALL_SURFACES },
    { lang: 'es', country: 'CL', region: ALL_SURFACES },
    { lang: 'es', country: 'CO', region: ALL_SURFACES },
    { lang: 'es', country: 'CR', region: ALL_SURFACES },
    { lang: 'es', country: 'EC', region: ALL_SURFACES },
    { lang: 'es', country: 'ES', default: ALL_SURFACES },
    { lang: 'es', country: 'GT', region: ALL_SURFACES },
    { lang: 'es', country: 'MX', region: ALL_SURFACES },
    { lang: 'es', country: 'PE', region: ALL_SURFACES },
    { lang: 'es', country: 'PR', region: ALL_SURFACES },
    { lang: 'sv', country: 'SE', default: ALL_SURFACES },
    { lang: 'th', country: 'TH', default: ALL_NO_EXPRESS_SURFACES },
    { lang: 'tr', country: 'TR', default: ALL_NO_EXPRESS_SURFACES },
    { lang: 'uk', country: 'UA', default: ALL_NO_EXPRESS_SURFACES },
    { lang: 'vi', country: 'VN', default: ALL_NO_EXPRESS_SURFACES },
];

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

const defaultLocalesCache = {};
const regionLocalesCache = {};

// Helper to generate locale code from lang and country
export function getLocaleCode(locale) {
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

export function isDefaultLocale(locale, surface) {
    if (!locale) {
        return false;
    }
    return locale.default === ALL_SURFACES || locale.default?.indexOf(surface) > -1;
}

export function getLocaleByCode(code) {
    const [lang, country] = code.split('_');
    return LOCALES.find((locale) => locale.lang === lang && locale.country === country);
}

export function getDefaultLocales(surface) {
    if (!defaultLocalesCache[surface]) {
        defaultLocalesCache[surface] = LOCALES.filter((locale) => isDefaultLocale(locale, surface));
    }
    return defaultLocalesCache[surface];
}

export function getDefaultLocale(localeCode, surface) {
    return getDefaultLocales(surface).find((loc) => loc.lang === localeCode.split('_')[0]);
}

export function isRegionLocale(locale, surface, language, includeDefault = true) {
    if (!locale) {
        return false;
    }
    return (
        locale.lang === language &&
        (locale.region === ALL_SURFACES ||
            locale.region?.indexOf(surface) > -1 ||
            (includeDefault && isDefaultLocale(locale, surface)))
    );
}

export function getRegionLocales(surface, language, includeDefault) {
    if (!regionLocalesCache[`${surface}-${language}`]) {
        regionLocalesCache[`${surface}-${language}`] = LOCALES.filter((locale) =>
            isRegionLocale(locale, surface, language, includeDefault),
        ).sort((a, b) => getCountryName(a.country).localeCompare(getCountryName(b.country)));
    }
    return regionLocalesCache[`${surface}-${language}`];
}

export function getLanguageName(lang) {
    return LANG_TO_LANGUAGE[lang] || lang;
}
