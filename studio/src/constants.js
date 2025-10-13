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
    ccd: {
        'mas-ff-defaults': 'on',
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
    { code: 'es_AR', flag: '🇦🇷', name: 'Argentina' },
    { code: 'en_AU', flag: '🇦🇺', name: 'Australia' },
    { code: 'de_AT', flag: '🇦🇹', name: 'Austria' },
    { code: 'en_BE', flag: '🇧🇪', name: 'Belgium' },
    { code: 'fr_BE', flag: '🇧🇪', name: 'Belgium' },
    { code: 'nl_BE', flag: '🇧🇪', name: 'Belgium' },
    { code: 'pt_BR', flag: '🇧🇷', name: 'Brazil' },
    { code: 'bg_BG', flag: '🇧🇬', name: 'Bulgaria' },
    { code: 'fr_CA', flag: '🇨🇦', name: 'Canada' },
    { code: 'en_CA', flag: '🇨🇦', name: 'Canada' },
    { code: 'es_CL', flag: '🇨🇱', name: 'Chile' },
    { code: 'zh_CN', flag: '🇨🇳', name: 'China' },
    { code: 'es_CO', flag: '🇨🇴', name: 'Colombia' },
    { code: 'es_CR', flag: '🇨🇷', name: 'Costa Rica' },
    { code: 'cs_CZ', flag: '🇨🇿', name: 'Czech Republic' },
    { code: 'da_DK', flag: '🇩🇰', name: 'Denmark' },
    { code: 'es_EC', flag: '🇪🇨', name: 'Ecuador' },
    { code: 'ar_EG', flag: '🇪🇬', name: 'Egypt' },
    { code: 'en_EG', flag: '🇪🇬', name: 'Egypt' },
    { code: 'et_EE', flag: '🇪🇪', name: 'Estonia' },
    { code: 'fi_FI', flag: '🇫🇮', name: 'Finland' },
    { code: 'fr_FR', flag: '🇫🇷', name: 'France' },
    { code: 'de_DE', flag: '🇩🇪', name: 'Germany' },
    { code: 'el_GR', flag: '🇬🇷', name: 'Greece' },
    { code: 'en_GR', flag: '🇬🇷', name: 'Greece' },
    { code: 'es_GT', flag: '🇬🇹', name: 'Guatemala' },
    { code: 'en_HK', flag: '🇭🇰', name: 'Hong Kong' },
    { code: 'zh_HK', flag: '🇭🇰', name: 'Hong Kong' },
    { code: 'hu_HU', flag: '🇭🇺', name: 'Hungary' },
    { code: 'en_IN', flag: '🇮🇳', name: 'India' },
    { code: 'hi_IN', flag: '🇮🇳', name: 'India' },
    { code: 'id_ID', flag: '🇮🇩', name: 'Indonesia' },
    { code: 'en_ID', flag: '🇮🇩', name: 'Indonesia' },
    { code: 'en_IE', flag: '🇮🇪', name: 'Ireland' },
    { code: 'en_IL', flag: '🇮🇱', name: 'Israel' },
    { code: 'he_IL', flag: '🇮🇱', name: 'Israel' },
    { code: 'it_IT', flag: '🇮🇹', name: 'Italy' },
    { code: 'ja_JP', flag: '🇯🇵', name: 'Japan' },
    { code: 'ar_KW', flag: '🇰🇼', name: 'Kuwait' },
    { code: 'en_KW', flag: '🇰🇼', name: 'Kuwait' },
    { code: 'lv_LV', flag: '🇱🇻', name: 'Latvia' },
    { code: 'lt_LT', flag: '🇱🇹', name: 'Lithuania' },
    { code: 'de_LU', flag: '🇱🇺', name: 'Luxembourg' },
    { code: 'en_LU', flag: '🇱🇺', name: 'Luxembourg' },
    { code: 'fr_LU', flag: '🇱🇺', name: 'Luxembourg' },
    { code: 'en_MY', flag: '🇲🇾', name: 'Malaysia' },
    { code: 'ms_MY', flag: '🇲🇾', name: 'Malaysia' },
    { code: 'es_MX', flag: '🇲🇽', name: 'Mexico' },
    { code: 'nl_NL', flag: '🇳🇱', name: 'Netherlands' },
    { code: 'en_NZ', flag: '🇳🇿', name: 'New Zealand' },
    { code: 'en_NG', flag: '🇳🇬', name: 'Nigeria' },
    { code: 'nb_NO', flag: '🇳🇴', name: 'Norway' },
    { code: 'es_PE', flag: '🇵🇪', name: 'Peru' },
    { code: 'en_PH', flag: '🇵🇭', name: 'Philippines' },
    { code: 'fil_PH', flag: '🇵🇭', name: 'Philippines' },
    { code: 'pl_PL', flag: '🇵🇱', name: 'Poland' },
    { code: 'pt_PT', flag: '🇵🇹', name: 'Portugal' },
    { code: 'es_PR', flag: '🇵🇷', name: 'Puerto Rico' },
    { code: 'ar_QA', flag: '🇶🇦', name: 'Qatar' },
    { code: 'en_QA', flag: '🇶🇦', name: 'Qatar' },
    { code: 'ro_RO', flag: '🇷🇴', name: 'Romania' },
    { code: 'ru_RU', flag: '🇷🇺', name: 'Russia' },
    { code: 'ar_SA', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: 'en_SA', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: 'en_SG', flag: '🇸🇬', name: 'Singapore' },
    { code: 'sk_SK', flag: '🇸🇰', name: 'Slovakia' },
    { code: 'sl_SI', flag: '🇸🇮', name: 'Slovenia' },
    { code: 'en_ZA', flag: '🇿🇦', name: 'South Africa' },
    { code: 'ko_KR', flag: '🇰🇷', name: 'South Korea' },
    { code: 'es_ES', flag: '🇪🇸', name: 'Spain' },
    { code: 'sv_SE', flag: '🇸🇪', name: 'Sweden' },
    { code: 'de_CH', flag: '🇨🇭', name: 'Switzerland' },
    { code: 'fr_CH', flag: '🇨🇭', name: 'Switzerland' },
    { code: 'it_CH', flag: '🇨🇭', name: 'Switzerland' },
    { code: 'zh_TW', flag: '🇹🇼', name: 'Taiwan' },
    { code: 'th_TH', flag: '🇹🇭', name: 'Thailand' },
    { code: 'en_TH', flag: '🇹🇭', name: 'Thailand' },
    { code: 'tr_TR', flag: '🇹🇷', name: 'Türkiye' },
    { code: 'uk_UA', flag: '🇺🇦', name: 'Ukraine' },
    { code: 'ar_AE', flag: '🇦🇪', name: 'United Arab Emirates' },
    { code: 'en_AE', flag: '🇦🇪', name: 'United Arab Emirates' },
    { code: 'en_UK', flag: '🇬🇧', name: 'United Kingdom' },
    { code: 'en_US', flag: '🇺🇸', name: 'United States' },
    { code: 'vi_VN', flag: '🇻🇳', name: 'Vietnam' },
    { code: 'en_VN', flag: '🇻🇳', name: 'Vietnam' },
    { code: 'en_CIS', flag: '', name: 'Commonwealth of Independent States' },
    { code: 'ru_CIS', flag: '', name: 'Commonwealth of Independent States' },
    { code: 'en_AFRICA', flag: '', name: 'Africa' },
    { code: 'ar_MENA', flag: '', name: 'Middle East and North Africa' },
    { code: 'en_MENA', flag: '', name: 'Middle East and North Africa' },
    { code: 'es_LA', flag: '', name: 'Latin America' },
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
export const DICTIONARY_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25uYXJ5';

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
