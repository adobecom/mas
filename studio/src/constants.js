export const CHECKOUT_CTA_TEXTS = {
    'buy-now': 'Buy now',
    'free-trial': 'Free trial',
    'start-free-trial': 'Start free trial',
    'save-now': 'Save now',
    'get-started': 'Get started',
    'choose-a-plan': 'Choose a plan',
    'learn-more': 'Learn more',
    'change-plan-team-plans': 'Change Plan Team Plans',
    upgrade: 'Upgrade',
    'change-plan-team-payment': 'Change Plan Team Payment',
    'take-the-quiz': 'Take the quiz',
    'see-more': 'See more',
    'upgrade-now': 'Upgrade now',
    'get-offer': 'Get offer',
    select: 'Select',
    'see-all-plans-and-pricing': 'See all plans & pricing details',
};
export const WCS_LANDSCAPE_PUBLISHED = 'PUBLISHED';
export const WCS_LANDSCAPE_DRAFT = 'DRAFT';
export const WCS_ENV_PROD = 'prod';
export const WCS_ENV_STAGE = 'stage';

export const ANALYTICS_LINK_IDS = [
    'buy-now',
    'change-plan-team-payment',
    'change-plan-team-plans',
    'free-trial',
    'get-offer',
    'learn-more',
    'register-now',
    'see-all-plans-and-pricing',
    'see-more',
    'see-terms',
    'select',
    'start-free-trial',
    'take-the-quiz',
    'upgrade-now',
    'what-is-included',
];

export const CONSUMER_FEATURE_FLAGS = {
    'adobe-home': {
        'mas-ff-defaults': 'off',
    },
};

// TODO remove these?
export const EVENT_CHANGE = 'change';
export const EVENT_INPUT = 'input';

export const KEY_ENTER = 'Enter';
export const EVENT_KEYDOWN = 'keydown';
export const EVENT_KEYUP = 'keyup';

export const EVENT_FRAGMENT_CHANGE = 'fragment:change';

export const EVENT_OST_SELECT = 'ost-select';
export const EVENT_OST_OFFER_SELECT = 'ost-offer-select';

export const LOCALES = [
    { code: 'ar_AE', lang: 'ar', flag: '🇦🇪', name: 'United Arab Emirates', default: [], region: ['acom'] },
    { code: 'ar_EG', lang: 'ar', flag: '🇪🇬', name: 'Egypt', default: [], region: ['acom'] },
    { code: 'ar_KW', lang: 'ar', flag: '🇰🇼', name: 'Kuwait', default: [], region: ['acom'] },
    { code: 'ar_QA', lang: 'ar', flag: '🇶🇦', name: 'Qatar', default: [], region: ['acom'] },
    {
        code: 'ar_SA',
        lang: 'ar',
        flag: '🇸🇦',
        name: 'Saudi Arabia',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'bg_BG',
        lang: 'bg',
        flag: '🇧🇬',
        name: 'Bulgaria',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'cs_CZ',
        lang: 'cs',
        flag: '🇨🇿',
        name: 'Czech Republic',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'da_DK',
        lang: 'da',
        flag: '🇩🇰',
        name: 'Denmark',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    { code: 'de_AT', lang: 'de', flag: '🇦🇹', name: 'Austria', default: [], region: ['acom'] },
    { code: 'de_CH', lang: 'de', flag: '🇨🇭', name: 'Switzerland (German)', default: [], region: ['acom'] },
    {
        code: 'de_DE',
        lang: 'de',
        flag: '🇩🇪',
        name: 'Germany',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    { code: 'de_LU', lang: 'de', flag: '🇱🇺', name: 'Luxembourg (German)', default: [], region: ['acom'] },
    {
        code: 'el_GR',
        lang: 'el',
        flag: '🇬🇷',
        name: 'Greece',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
    },
    { code: 'en_AE', lang: 'en', flag: '🇦🇪', name: 'United Arab Emirates (English)', default: [], region: ['acom'] },
    { code: 'en_AR', lang: 'en', flag: '🇦🇷', name: 'Argentina (English)', default: [], region: ['acom'] },
    { code: 'en_AU', lang: 'en', flag: '🇦🇺', name: 'Australia', default: [], region: ['acom'] },
    { code: 'en_BE', lang: 'en', flag: '🇧🇪', name: 'Belgium (English)', default: [], region: ['acom'] },
    { code: 'en_CA', lang: 'en', flag: '🇨🇦', name: 'Canada (English)', default: [], region: ['acom'] },
    { code: 'en_EG', lang: 'en', flag: '🇪🇬', name: 'Egypt (English)', default: [], region: ['acom'] },
    { code: 'en_GR', lang: 'en', flag: '🇬🇷', name: 'Greece (English)', default: [], region: ['acom'] },
    { code: 'en_HK', lang: 'en', flag: '🇭🇰', name: 'Hong Kong (English)', default: [], region: ['acom'] },
    { code: 'en_ID', lang: 'en', flag: '🇮🇩', name: 'Indonesia (English)', default: [], region: ['acom'] },
    { code: 'en_IE', lang: 'en', flag: '🇮🇪', name: 'Ireland', default: [], region: ['acom'] },
    { code: 'en_IL', lang: 'en', flag: '🇮🇱', name: 'Israel (English)', default: [], region: ['acom'] },
    { code: 'en_IN', lang: 'en', flag: '🇮🇳', name: 'India (English)', default: [], region: ['acom'] },
    { code: 'en_KW', lang: 'en', flag: '🇰🇼', name: 'Kuwait (English)', default: [], region: ['acom'] },
    { code: 'en_LU', lang: 'en', flag: '🇱🇺', name: 'Luxembourg (English)', default: [], region: ['acom'] },
    { code: 'en_MY', lang: 'en', flag: '🇲🇾', name: 'Malaysia (English)', default: [], region: ['acom'] },
    { code: 'en_NG', lang: 'en', flag: '🇳🇬', name: 'Nigeria', default: [], region: ['acom'] },
    { code: 'en_NZ', lang: 'en', flag: '🇳🇿', name: 'New Zealand', default: [], region: ['acom'] },
    { code: 'en_PH', lang: 'en', flag: '🇵🇭', name: 'Philippines (English)', default: [], region: ['acom'] },
    { code: 'en_QA', lang: 'en', flag: '🇶🇦', name: 'Qatar (English)', default: [], region: ['acom'] },
    { code: 'en_SA', lang: 'en', flag: '🇸🇦', name: 'Saudi Arabia (English)', default: [], region: ['acom'] },
    { code: 'en_SG', lang: 'en', flag: '🇸🇬', name: 'Singapore', default: [], region: ['acom'] },
    { code: 'en_TH', lang: 'en', flag: '🇹🇭', name: 'Thailand (English)', default: [], region: ['acom'] },
    {
        code: 'en_US',
        lang: 'en',
        flag: '🇺🇸',
        name: 'United States',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
    },
    { code: 'en_VN', lang: 'en', flag: '🇻🇳', name: 'Vietnam (English)', default: [], region: ['acom'] },
    { code: 'en_ZA', lang: 'en', flag: '🇿🇦', name: 'South Africa', default: [], region: ['acom'] },
    { code: 'en_GB', lang: 'en', flag: '🇬🇧', name: 'United Kingdom', default: ['acom'], region: [] },
    { code: 'es_AR', lang: 'es', flag: '🇦🇷', name: 'Argentina', default: [], region: ['acom'] },
    { code: 'es_CL', lang: 'es', flag: '🇨🇱', name: 'Chile', default: [], region: ['acom'] },
    { code: 'es_CO', lang: 'es', flag: '🇨🇴', name: 'Colombia', default: [], region: ['acom'] },
    { code: 'es_CR', lang: 'es', flag: '🇨🇷', name: 'Costa Rica', default: [], region: ['acom'] },
    { code: 'es_EC', lang: 'es', flag: '🇪🇨', name: 'Ecuador', default: [], region: ['acom'] },
    {
        code: 'es_ES',
        lang: 'es',
        flag: '🇪🇸',
        name: 'Spain',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    { code: 'es_GT', lang: 'es', flag: '🇬🇹', name: 'Guatemala', default: [], region: ['acom'] },
    { code: 'es_MX', lang: 'es', flag: '🇲🇽', name: 'Mexico', default: ['acom'], region: [] },
    { code: 'es_PE', lang: 'es', flag: '🇵🇪', name: 'Peru', default: [], region: ['acom'] },
    { code: 'es_PR', lang: 'es', flag: '🇵🇷', name: 'Puerto Rico', default: [], region: ['acom'] },
    { code: 'et_EE', lang: 'et', flag: '🇪🇪', name: 'Estonia', default: [], region: ['acom'] },
    {
        code: 'fi_FI',
        lang: 'fi',
        flag: '🇫🇮',
        name: 'Finland',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    { code: 'fil_PH', lang: 'fil', flag: '🇵🇭', name: 'Philippines (Filipino)', default: [], region: ['acom'] },
    { code: 'fr_BE', lang: 'fr', flag: '🇧🇪', name: 'Belgium (French)', default: [], region: ['acom'] },
    { code: 'fr_CA', lang: 'fr', flag: '🇨🇦', name: 'Canada (French)', default: [], region: ['acom', 'express', 'ccd'] },
    { code: 'fr_CH', lang: 'fr', flag: '🇨🇭', name: 'Switzerland (French)', default: [], region: ['acom'] },
    {
        code: 'fr_FR',
        lang: 'fr',
        flag: '🇫🇷',
        name: 'France',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
    },
    { code: 'fr_LU', lang: 'fr', flag: '🇱🇺', name: 'Luxembourg (French)', default: [], region: ['acom'] },
    {
        code: 'he_IL',
        lang: 'he',
        flag: '🇮🇱',
        name: 'Israel',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'hi_IN',
        lang: 'hi',
        flag: '🇮🇳',
        name: 'India (Hindi)',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'hu_HU',
        lang: 'hu',
        flag: '🇭🇺',
        name: 'Hungary',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'id_ID',
        lang: 'id',
        flag: '🇮🇩',
        name: 'Indonesia',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    { code: 'it_CH', lang: 'it', flag: '🇨🇭', name: 'Switzerland (Italian)', default: [], region: ['acom'] },
    {
        code: 'it_IT',
        lang: 'it',
        flag: '🇮🇹',
        name: 'Italy',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'ja_JP',
        lang: 'ja',
        flag: '🇯🇵',
        name: 'Japan',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'ko_KR',
        lang: 'ko',
        flag: '🇰🇷',
        name: 'South Korea',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'lt_LT',
        lang: 'lt',
        flag: '🇱🇹',
        name: 'Lithuania',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'lv_LV',
        lang: 'lv',
        flag: '🇱🇻',
        name: 'Latvia',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'ms_MY',
        lang: 'ms',
        flag: '🇲🇾',
        name: 'Malaysia',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    {
        code: 'nb_NO',
        lang: 'nb',
        flag: '🇳🇴',
        name: 'Norway',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    { code: 'nl_BE', lang: 'nl', flag: '🇧🇪', name: 'Belgium (Dutch)', default: [], region: ['acom'] },
    {
        code: 'nl_NL',
        lang: 'nl',
        flag: '🇳🇱',
        name: 'Netherlands',
        default: ['sandbox', 'nala', 'acom', 'express', 'commerce', 'adobe-home', 'docs', 'ccd'],
        region: [],
    },
    { code: 'pl_PL', lang: 'pl', flag: '🇵🇱', name: 'Poland' },
    { code: 'pt_BR', lang: 'pt', flag: '🇧🇷', name: 'Brazil' },
    { code: 'pt_PT', lang: 'pt', flag: '🇵🇹', name: 'Portugal' },
    { code: 'ro_RO', lang: 'ro', flag: '🇷🇴', name: 'Romania' },
    { code: 'ru_CIS', lang: 'ru', flag: '🇷🇺', name: 'CIS (Russian)' },
    { code: 'ru_RU', lang: 'ru', flag: '🇷🇺', name: 'Russia' },
    { code: 'sk_SK', lang: 'sk', flag: '🇸🇰', name: 'Slovakia' },
    { code: 'sl_SI', lang: 'sl', flag: '🇸🇮', name: 'Slovenia' },
    { code: 'sv_SE', lang: 'sv', flag: '🇸🇪', name: 'Sweden' },
    { code: 'th_TH', lang: 'th', flag: '🇹🇭', name: 'Thailand' },
    { code: 'tr_TR', lang: 'tr', flag: '🇹🇷', name: 'Türkiye' },
    { code: 'uk_UA', lang: 'uk', flag: '🇺🇦', name: 'Ukraine' },
    { code: 'vi_VN', lang: 'vi', flag: '🇻🇳', name: 'Vietnam' },
    { code: 'zh_CN', lang: 'zh', flag: '🇨🇳', name: 'China (Simplified)' },
    { code: 'zh_HK', lang: 'zh', flag: '🇭🇰', name: 'Hong Kong' },
    { code: 'zh_TW', lang: 'zh', flag: '🇹🇼', name: 'Taiwan' },
];

export const OPERATIONS = {
    CREATE: 'create',
    DELETE: 'delete',
    DISCARD: 'discard',
    PUBLISH: 'publish',
    SAVE: 'save',
    CLONE: 'clone',
    UNPUBLISH: 'unpublish',
};

export const EnvColorCode = {
    proxy: 'gray',
    prod: 'negative',
    stage: 'notice',
    qa: 'positive',
};

export const ENVS = {
    stage: {
        name: 'stage',
        ims: 'stg1',
        adobeIO: 'cc-collab-stage.adobe.io',
        adminconsole: 'stage.adminconsole.adobe.com',
        account: 'stage.account.adobe.com',
        edgeConfigId: 'e065836d-be57-47ef-b8d1-999e1657e8fd',
        pdfViewerClientId: 'a76f1668fd3244d98b3838e189900a5e',
    },
    prod: {
        name: 'prod',
        ims: 'prod',
        adobeIO: 'cc-collab.adobe.io',
        adminconsole: 'adminconsole.adobe.com',
        account: 'account.adobe.com',
        edgeConfigId: '913eac4d-900b-45e8-9ee7-306216765cd2',
        pdfViewerClientId: '3c0a5ddf2cc04d3198d9e48efc390fa9',
    },
};

export const LOCALE_DEFAULT = 'en_US';

export const STATUS_PUBLISHED = 'PUBLISHED';
export const STATUS_DRAFT = 'DRAFT';
export const STATUS_MODIFIED = 'MODIFIED';

export const PAGE_NAMES = {
    WELCOME: 'welcome',
    PLACEHOLDERS: 'placeholders',
    CONTENT: 'content',
};

export const TAG_STATUS_PUBLISHED = 'mas:status/published';
export const TAG_STATUS_PUBLISHED_PATH = '/content/cq:tags/mas/status/published';
export const TAG_STATUS_DRAFT = 'mas:status/draft';
export const TAG_STATUS_DRAFT_PATH = '/content/cq:tags/mas/status/draft';

export const ROOT_PATH = '/content/dam/mas';
export const DICTIONARY_ENTRY_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25uYXJ5';
export const DICTIONARY_INDEX_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25hcnk';

// Add the card-related constants from incoming changes
export const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';
export const COLLECTION_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/collection';

export const FIELD_MODEL_MAPPING = {
    [CARD_MODEL_PATH]: 'cards',
    [COLLECTION_MODEL_PATH]: 'collections',
};

export const TAG_STUDIO_CONTENT_TYPE = 'mas:studio/content-type';

export const TAG_MODEL_ID_MAPPING = {
    'mas:studio/content-type/merch-card-collection': 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
    'mas:studio/content-type/merch-card': 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ',
};

export const EDITABLE_FRAGMENT_MODEL_IDS = Object.values(TAG_MODEL_ID_MAPPING);

// The first value in the array should be the default value
export const SORT_COLUMNS = {
    placeholders: ['key', 'value', 'status', 'locale', 'updatedBy', 'updatedAt'],
};

// Variant capabilities configuration
export const VARIANT_CAPABILITIES = {
    defaultCard: {
        supported: ['simplified-pricing-express'],
        label: 'Default Card',
        helpText: 'Drag a card here to set as default',
    },
};
