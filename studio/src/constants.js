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

export const ANALYTICS_LINK_IDS = ['learn-more', 'see-terms', 'what-is-included', 'register-now'];

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
    { code: 'pt_BR', flag: '🇧🇷', name: 'Brazil' },
    { code: 'fr_CA', flag: '🇨🇦', name: 'Canada' },
    { code: 'zh_CN', flag: '🇨🇳', name: 'China' },
    { code: 'cs_CZ', flag: '🇨🇿', name: 'Czech Republic' },
    { code: 'da_DK', flag: '🇩🇰', name: 'Denmark' },
    { code: 'fi_FI', flag: '🇫🇮', name: 'Finland' },
    { code: 'fr_FR', flag: '🇫🇷', name: 'France' },
    { code: 'de_DE', flag: '🇩🇪', name: 'Germany' },
    { code: 'hu_HU', flag: '🇭🇺', name: 'Hungary' },
    { code: 'id_ID', flag: '🇮🇩', name: 'Indonesia' },
    { code: 'it_IT', flag: '🇮🇹', name: 'Italy' },
    { code: 'ja_JP', flag: '🇯🇵', name: 'Japan' },
    { code: 'es_MX', flag: '🇲🇽', name: 'Mexico' },
    { code: 'nl_NL', flag: '🇳🇱', name: 'Netherlands' },
    { code: 'nb_NO', flag: '🇳🇴', name: 'Norway' },
    { code: 'pl_PL', flag: '🇵🇱', name: 'Poland' },
    { code: 'ru_RU', flag: '🇷🇺', name: 'Russia' },
    { code: 'ko_KR', flag: '🇰🇷', name: 'South Korea' },
    { code: 'es_ES', flag: '🇪🇸', name: 'Spain' },
    { code: 'sv_SE', flag: '🇸🇪', name: 'Sweden' },
    { code: 'th_TH', flag: '🇹🇭', name: 'Thailand' },
    { code: 'tr_TR', flag: '🇹🇷', name: 'Türkiye' },
    { code: 'uk_UA', flag: '🇺🇦', name: 'Ukraine' },
    { code: 'en_US', flag: '🇺🇸', name: 'United States' },
    { code: 'vi_VN', flag: '🇻🇳', name: 'Vietnam' },
    { code: 'zh_TW', flag: '🇹🇼', name: 'Taiwan' },
];

export const OPERATIONS = {
    CREATE: 'create',
    DELETE: 'delete',
    DISCARD: 'discard',
    PUBLISH: 'publish',
    SAVE: 'save',
    CLONE: 'clone',
    UNPUBLISH: 'unpublish',
    CREATE: 'create',
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
