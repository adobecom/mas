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
    'get-for-free': 'Get for free',
    'seven-day-trial': 'Start 7-day free trial',
    'fourteen-day-trial': 'Start 14-day free trial',
    'thirty-day-trial': 'Start 30-day free trial',
    'save-today': 'Save today',
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
    'get-for-free',
    'seven-day-trial',
    'fourteen-day-trial',
    'thirty-day-trial',
    'save-today',
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
export const EVENT_OST_MULTI_OFFER_SELECT = 'ost-multi-offer-select';

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

export const STATUS_PUBLISHED = 'PUBLISHED';
export const STATUS_DRAFT = 'DRAFT';
export const STATUS_MODIFIED = 'MODIFIED';

export const PAGE_NAMES = {
    WELCOME: 'welcome',
    PLACEHOLDERS: 'placeholders',
    SETTINGS: 'settings',
    SETTINGS_EDITOR: 'settings-editor',
    CONTENT: 'content',
    VERSION: 'version',
    FRAGMENT_EDITOR: 'fragment-editor',
    PROMOTIONS: 'promotions',
    PROMOTIONS_EDITOR: 'promotions-editor',
    TRANSLATIONS: 'translations',
    TRANSLATION_EDITOR: 'translation-editor',
    AI_ASSISTANT: 'ai-assistant',
    PRODUCT_CATALOG: 'product-catalog',
    PRODUCT_DETAIL: 'product-detail',
};

const IO_DEV_NAMESPACE = '14257-merchatscale-axel';

function isLocalhostHostname(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function getAIChatBaseURL(location = window.location) {
    if (isLocalhostHostname(location.hostname)) {
        const override = new URLSearchParams(location.search).get('ai.chat');
        if (override) return override;
    }
    return `https://${IO_DEV_NAMESPACE}.adobeioruntime.net/api/v1/web/MerchAtScaleStudio`;
}
export const AI_CHAT_BASE_URL = getAIChatBaseURL();

export function getMCPServerURL(location = window.location) {
    if (isLocalhostHostname(location.hostname)) {
        const override = new URLSearchParams(location.search).get('mcp.server');
        if (override) return override;
    }
    return `https://${IO_DEV_NAMESPACE}.adobeioruntime.net/api/v1/web/MerchAtScaleMCP`;
}
export const MCP_SERVER_URL = getMCPServerURL();
export const IO_MCP_URL = `https://${IO_DEV_NAMESPACE}.adobeioruntime.net/api/v1/web/MerchAtScaleMCP`;
export const KNOWLEDGE_SERVICE_URL = `https://${IO_DEV_NAMESPACE}.adobeioruntime.net/api/v1/web/MerchAtScaleKnowledge`;

export const TAG_STATUS_PUBLISHED = 'mas:status/published';
export const TAG_STATUS_PUBLISHED_PATH = '/content/cq:tags/mas/status/published';
export const TAG_STATUS_DRAFT = 'mas:status/draft';
export const TAG_STATUS_DRAFT_PATH = '/content/cq:tags/mas/status/draft';

export const ROOT_PATH = '/content/dam/mas';
export const DICTIONARY_ENTRY_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25uYXJ5';
export const DICTIONARY_INDEX_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2RpY3Rpb25hcnk';

export const PROMOTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3Byb21vdGlvbg==';
export const TRANSLATION_PROJECT_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3RyYW5zbGF0aW9uLXByb2plY3Q=';

// Add the card-related constants from incoming changes
export const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';
export const COLLECTION_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/collection';

export const FIELD_MODEL_MAPPING = {
    [CARD_MODEL_PATH]: 'cards',
    [COLLECTION_MODEL_PATH]: 'collections',
};

export const TAG_STUDIO_CONTENT_TYPE = 'mas:studio/content-type';
export const TAG_PROMOTION_PREFIX = 'mas:promotion/';

/** Full AEM content path for product_code */
export const AEM_TAG_PATH_PRODUCT_CODE_ROOT = '/content/cq:tags/mas/product_code';

/** Tag id prefix in short form */
export const MAS_PRODUCT_CODE_PREFIX = 'mas:product_code/';

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

export const PATH_TOKENS = /\/content\/dam\/mas\/(?<surface>[\w-_]+)\/(?<parsedLocale>[\w-_]+)\/(?<fragmentPath>.+)/;

export const VARIATION_TYPES = {
    LOCALE: 'Locale',
    GROUPED: 'Grouped variation',
};

export const PZN_FOLDER = 'pzn';

/** CQ tag path for the country root under pzn (exception: not “personalization-only” for filters). */
export const PZN_COUNTRY_TAG_PATH_PREFIX = '/content/cq:tags/mas/pzn/country';

export const SURFACES = {
    ACOM: {
        label: 'Adobe.com',
        name: 'acom',
    },
    ACOM_CC: {
        label: 'ACOM CC',
        name: 'acom-cc',
    },
    ACOM_DC: {
        label: 'ACOM DC',
        name: 'acom-dc',
    },
    ADOBE_HOME: {
        label: 'Adobe Home',
        name: 'adobe-home',
    },
    CCD: {
        label: 'CCD',
        name: 'ccd',
    },
    COMMERCE: {
        label: 'Commerce',
        name: 'commerce',
    },
    EXPRESS: {
        label: 'Express',
        name: 'express',
    },
    NALA: {
        label: 'Nala',
        name: 'nala',
    },
    SANDBOX: {
        label: 'Sandbox',
        name: 'sandbox',
    },
};

export const TEMPLATE_PREVIEWS = {
    'ccd-slice': '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
    'ccd-suggested': '45783ec8-ed85-4595-a445-3f018ac4ad9d',
    mini: '03a36f0f-3e5d-4881-ae6b-273c517c9d38',
    'ah-try-buy-widget': '44520fdc-f6e1-4c21-8978-9cd25a1be158',
    'ah-promoted-plans': '031e2f50-5cbc-4e4b-af9b-c63f0e4f2a93',
    'simplified-pricing-express': 'aaa728dc-2b44-495c-b9f0-bb82044db18a',
    'full-pricing-express': '9406f1ae-7bee-48c3-9892-49af6816033e',
    plans: '1736f2c9-0931-401b-b3c0-fe87ff72ad38',
    'plans-education': 'b8cd82c8-f8fa-433a-afa2-9aba4ebe5ea5',
    fries: '8487f19d-b038-44fa-9db6-0dc55a85b326',
    catalog: '60d6f47c-8fd7-485d-a4ac-2b7baa492ab1',
    'special-offers': '0381d43f-2e1d-4074-a7a6-4a748bd81be7',
    'mini-compare-chart': 'ce03bb09-75b1-45b9-8ff7-fcd42d33c765',
    'mini-compare-chart-mweb': '127a74ee-bd16-4de2-a7a1-ad6a1ef39455',
    'plans-v2': 'aa96379a-d591-4c0c-8633-cdb4fb77c6da',
    image: '7da8f1fa-9591-445e-8542-9aa77d9dc1f4',
    'plans-students': '484739ec-72f7-4b4b-b756-bb9b42ee06c8',
    product: '5381e707-f04f-4c5f-9d2c-02455049132d',
    segment: '2f700fce-dd51-4fb0-bf20-6f046cc735a7',
    media: '339b00db-5217-4fc4-b1e9-7fec29bb3c89',
    headless: '37e60185-599a-46d3-8b26-dacd9cbc2d52',
};

export const QUICK_ACTION = {
    SAVE: 'save',
    DUPLICATE: 'duplicate',
    PUBLISH: 'publish',
    UNPUBLISH: 'unpublish',
    CANCEL: 'cancel',
    COPY: 'copy',
    LOCK: 'lock',
    DISCARD: 'discard',
    DELETE: 'delete',
    LOC: 'loc',
};

export const FILTER_TYPE = {
    TEMPLATE: 'template',
    MARKET_SEGMENT: 'marketSegment',
    CUSTOMER_SEGMENT: 'customerSegment',
    PRODUCT: 'product',
};

export const FRAGMENT_STATUS = {
    PUBLISHED: 'PUBLISHED',
    DRAFT: 'DRAFT',
    MODIFIED: 'MODIFIED',
};

export const TABLE_TYPE = {
    CARDS: 'cards',
    COLLECTIONS: 'collections',
    PLACEHOLDERS: 'placeholders',
};

export const TRANSLATIONS_ALLOWED_SURFACES = ['acom', 'acom-cc', 'acom-dc', 'express', 'sandbox', 'nala'];

/** Base URL for Odin preview fragment-by-path checks (e.g. fil_PH .json endpoint). */
export const ODIN_PREVIEW_ORIGIN = 'https://odinpreview.corp.adobe.com';
