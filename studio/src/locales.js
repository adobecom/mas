const ALL_SURFACES = 'all';

const ACOM_SURFACES = ['acom', 'nala', 'sandbox'];

const ALL_NO_EXPRESS_SURFACES = ['acom', 'ccd', 'adobe-home', 'nala', 'sandbox'];

const LOCALES = [
    { code: 'ar_AE', lang: 'ar', flag: '🇦🇪', name: 'United Arab Emirates', region: 'ALL_SURFACES' },
    { code: 'ar_EG', lang: 'ar', flag: '🇪🇬', name: 'Egypt', region: ALL_SURFACES },
    { code: 'ar_KW', lang: 'ar', flag: '🇰🇼', name: 'Kuwait', region: ALL_SURFACES },
    { code: 'ar_QA', lang: 'ar', flag: '🇶🇦', name: 'Qatar', region: ALL_SURFACES },
    { code: 'ar_SA', lang: 'ar', flag: '🇸🇦', name: 'Saudi Arabia', default: ACOM_SURFACES },
    { code: 'bg_BG', lang: 'bg', flag: '🇧🇬', name: 'Bulgaria', default: ACOM_SURFACES },
    { code: 'cs_CZ', lang: 'cs', flag: '🇨🇿', name: 'Czech Republic', default: ALL_NO_EXPRESS_SURFACES },
    { code: 'da_DK', lang: 'da', flag: '🇩🇰', name: 'Denmark', default: ALL_SURFACES },
    { code: 'de_AT', lang: 'de', flag: '🇦🇹', name: 'Austria', region: ALL_SURFACES },
    { code: 'de_CH', lang: 'de', flag: '🇨🇭', name: 'Switzerland (German)', region: ALL_SURFACES },
    { code: 'de_DE', lang: 'de', flag: '🇩🇪', name: 'Germany', default: ALL_SURFACES },
    { code: 'de_LU', lang: 'de', flag: '🇱🇺', name: 'Luxembourg (German)', region: ALL_SURFACES },
    { code: 'el_GR', lang: 'el', flag: '🇬🇷', name: 'Greece', default: ACOM_SURFACES },
    { code: 'en_AE', lang: 'en', flag: '🇦🇪', name: 'United Arab Emirates (English)', region: ALL_SURFACES },
    { code: 'en_AR', lang: 'en', flag: '🇦🇷', name: 'Argentina (English)', region: ALL_SURFACES },
    { code: 'en_AU', lang: 'en', flag: '🇦🇺', name: 'Australia', region: ALL_SURFACES },
    { code: 'en_BE', lang: 'en', flag: '🇧🇪', name: 'Belgium (English)', region: ALL_SURFACES },
    { code: 'en_CA', lang: 'en', flag: '🇨🇦', name: 'Canada (English)', region: ALL_SURFACES },
    { code: 'en_EG', lang: 'en', flag: '🇪🇬', name: 'Egypt (English)', region: ALL_SURFACES },
    { code: 'en_GR', lang: 'en', flag: '🇬🇷', name: 'Greece (English)', region: ALL_SURFACES },
    { code: 'en_HK', lang: 'en', flag: '🇭🇰', name: 'Hong Kong (English)', region: ALL_SURFACES },
    { code: 'en_ID', lang: 'en', flag: '🇮🇩', name: 'Indonesia (English)', region: ALL_SURFACES },
    { code: 'en_IE', lang: 'en', flag: '🇮🇪', name: 'Ireland', region: ALL_SURFACES },
    { code: 'en_IL', lang: 'en', flag: '🇮🇱', name: 'Israel (English)', region: ALL_SURFACES },
    { code: 'en_IN', lang: 'en', flag: '🇮🇳', name: 'India (English)', region: ALL_SURFACES },
    { code: 'en_KW', lang: 'en', flag: '🇰🇼', name: 'Kuwait (English)', region: ALL_SURFACES },
    { code: 'en_LU', lang: 'en', flag: '🇱🇺', name: 'Luxembourg (English)', region: ALL_SURFACES },
    { code: 'en_MY', lang: 'en', flag: '🇲🇾', name: 'Malaysia (English)', region: ALL_SURFACES },
    { code: 'en_NG', lang: 'en', flag: '🇳🇬', name: 'Nigeria', region: ALL_SURFACES },
    { code: 'en_NZ', lang: 'en', flag: '🇳🇿', name: 'New Zealand', region: ALL_SURFACES },
    { code: 'en_PH', lang: 'en', flag: '🇵🇭', name: 'Philippines (English)', region: ALL_SURFACES },
    { code: 'en_QA', lang: 'en', flag: '🇶🇦', name: 'Qatar (English)', region: ALL_SURFACES },
    { code: 'en_SA', lang: 'en', flag: '🇸🇦', name: 'Saudi Arabia (English)', region: ALL_SURFACES },
    { code: 'en_SG', lang: 'en', flag: '🇸🇬', name: 'Singapore', region: ALL_SURFACES },
    { code: 'en_TH', lang: 'en', flag: '🇹🇭', name: 'Thailand (English)', region: ALL_SURFACES },
    { code: 'en_US', lang: 'en', flag: '🇺🇸', name: 'United States', default: ALL_SURFACES },
    { code: 'en_VN', lang: 'en', flag: '🇻🇳', name: 'Vietnam (English)', region: ALL_SURFACES },
    { code: 'en_ZA', lang: 'en', flag: '🇿🇦', name: 'South Africa', region: ALL_SURFACES },
    { code: 'en_GB', lang: 'en', flag: '🇬🇧', name: 'United Kingdom', region: ACOM_SURFACES },
    { code: 'es_AR', lang: 'es', flag: '🇦🇷', name: 'Argentina', region: ALL_SURFACES },
    { code: 'es_CL', lang: 'es', flag: '🇨🇱', name: 'Chile', region: ALL_SURFACES },
    { code: 'es_CO', lang: 'es', flag: '🇨🇴', name: 'Colombia', region: ALL_SURFACES },
    { code: 'es_CR', lang: 'es', flag: '🇨🇷', name: 'Costa Rica', region: ALL_SURFACES },
    { code: 'es_EC', lang: 'es', flag: '🇪🇨', name: 'Ecuador', region: ALL_SURFACES },
    { code: 'es_ES', lang: 'es', flag: '🇪🇸', name: 'Spain', default: ALL_SURFACES },
    { code: 'es_GT', lang: 'es', flag: '🇬🇹', name: 'Guatemala', region: ALL_SURFACES },
    { code: 'es_MX', lang: 'es', flag: '🇲🇽', name: 'Mexico', region: ALL_SURFACES },
    { code: 'es_PE', lang: 'es', flag: '🇵🇪', name: 'Peru', region: ALL_SURFACES },
    { code: 'es_PR', lang: 'es', flag: '🇵🇷', name: 'Puerto Rico', region: ALL_SURFACES },
    { code: 'et_EE', lang: 'et', flag: '🇪🇪', name: 'Estonia', region: ALL_SURFACES },
    { code: 'fi_FI', lang: 'fi', flag: '🇫🇮', name: 'Finland', default: ALL_SURFACES },
    { code: 'fil_PH', lang: 'fil', flag: '🇵🇭', name: 'Philippines (Filipino)', region: ACOM_SURFACES },
    { code: 'fr_BE', lang: 'fr', flag: '🇧🇪', name: 'Belgium (French)', region: ALL_SURFACES },
    { code: 'fr_CA', lang: 'fr', flag: '🇨🇦', name: 'Canada (French)', region: ['acom', 'express', 'ccd'] },
    { code: 'fr_CH', lang: 'fr', flag: '🇨🇭', name: 'Switzerland (French)', region: ALL_SURFACES },
    { code: 'fr_FR', lang: 'fr', flag: '🇫🇷', name: 'France', default: ALL_SURFACES },
    { code: 'fr_LU', lang: 'fr', flag: '🇱🇺', name: 'Luxembourg (French)', region: ALL_SURFACES },
    { code: 'he_IL', lang: 'he', flag: '🇮🇱', name: 'Israel', default: ACOM_SURFACES },
    { code: 'hi_IN', lang: 'hi', flag: '🇮🇳', name: 'India (Hindi)', default: ['acom', 'ccd', 'nala', 'sandbox'] },
    { code: 'hu_HU', lang: 'hu', flag: '🇭🇺', name: 'Hungary', default: ALL_NO_EXPRESS_SURFACES },
    { code: 'id_ID', lang: 'id', flag: '🇮🇩', name: 'Indonesia', default: ALL_SURFACES },
    { code: 'it_CH', lang: 'it', flag: '🇨🇭', name: 'Switzerland (Italian)', region: ALL_SURFACES },
    { code: 'it_IT', lang: 'it', flag: '🇮🇹', name: 'Italy', default: ALL_SURFACES },
    { code: 'ja_JP', lang: 'ja', flag: '🇯🇵', name: 'Japan', default: ALL_SURFACES },
    { code: 'ko_KR', lang: 'ko', flag: '🇰🇷', name: 'South Korea', default: ALL_SURFACES },
    { code: 'lt_LT', lang: 'lt', flag: '🇱🇹', name: 'Lithuania', default: ACOM_SURFACES },
    { code: 'lv_LV', lang: 'lv', flag: '🇱🇻', name: 'Latvia', default: ACOM_SURFACES },
    { code: 'ms_MY', lang: 'ms', flag: '🇲🇾', name: 'Malaysia', default: ACOM_SURFACES },
    { code: 'nb_NO', lang: 'nb', flag: '🇳🇴', name: 'Norway', default: ALL_SURFACES },
    { code: 'nl_BE', lang: 'nl', flag: '🇧🇪', name: 'Belgium (Dutch)', region: ALL_SURFACES },
    { code: 'nl_NL', lang: 'nl', flag: '🇳🇱', name: 'Netherlands', default: ALL_SURFACES },
    { code: 'pl_PL', lang: 'pl', flag: '🇵🇱', name: 'Poland', default: ALL_NO_EXPRESS_SURFACES },
    { code: 'pt_BR', lang: 'pt', flag: '🇧🇷', name: 'Brazil', default: ['express', 'ccd', 'adobe-home'], region: ACOM_SURFACES },
    { code: 'pt_PT', lang: 'pt', flag: '🇵🇹', name: 'Portugal', default: ACOM_SURFACES },
    { code: 'ro_RO', lang: 'ro', flag: '🇷🇴', name: 'Romania', default: ACOM_SURFACES },
    { code: 'ru_RU', lang: 'ru', flag: '🇷🇺', name: 'Russia', default: ALL_NO_EXPRESS_SURFACES },
    { code: 'sk_SK', lang: 'sk', flag: '🇸🇰', name: 'Slovakia', default: ACOM_SURFACES },
    { code: 'sl_SI', lang: 'sl', flag: '🇸🇮', name: 'Slovenia', default: ACOM_SURFACES },
    { code: 'sv_SE', lang: 'sv', flag: '🇸🇪', name: 'Sweden', default: ALL_SURFACES },
    { code: 'th_TH', lang: 'th', flag: '🇹🇭', name: 'Thailand', default: ALL_NO_EXPRESS_SURFACES },
    { code: 'tr_TR', lang: 'tr', flag: '🇹🇷', name: 'Türkiye', default: ALL_NO_EXPRESS_SURFACES },
    { code: 'uk_UA', lang: 'uk', flag: '🇺🇦', name: 'Ukraine', default: ALL_NO_EXPRESS_SURFACES },
    { code: 'vi_VN', lang: 'vi', flag: '🇻🇳', name: 'Vietnam', default: ALL_NO_EXPRESS_SURFACES },
    { code: 'zh_CN', lang: 'zh', flag: '🇨🇳', name: 'China (Simplified)', default: ALL_SURFACES },
    { code: 'zh_HK', lang: 'zh', flag: '🇭🇰', name: 'Hong Kong', default: ACOM_SURFACES },
    { code: 'zh_TW', lang: 'zh', flag: '🇹🇼', name: 'Taiwan', default: ALL_SURFACES },
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

export function isDefaultLocale(locale, surface) {
    if (!locale) {
        return false;
    }
    return locale.default === ALL_SURFACES || locale.default?.indexOf(surface) > -1;
}

export function getLocaleByCode(code) {
    return LOCALES.find((locale) => locale.code === code);
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
        );
    }
    return regionLocalesCache[`${surface}-${language}`];
}

export function getLanguageName(lang) {
    return LANG_TO_LANGUAGE[lang] || lang;
}
