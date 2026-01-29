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
    CONTENT: 'content',
    VERSION: 'version',
    FRAGMENT_EDITOR: 'fragment-editor',
    PROMOTIONS: 'promotions',
    PROMOTIONS_EDITOR: 'promotions-editor',
    TRANSLATIONS: 'translations',
    TRANSLATION_EDITOR: 'translation-editor',
};

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
};

export const SURFACES = {
    ACOM: {
        label: 'Adobe.com',
        name: 'acom',
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

export const QUICK_ACTION = {
    SAVE: 'save',
    DUPLICATE: 'duplicate',
    PUBLISH: 'publish',
    CANCEL: 'cancel',
    COPY: 'copy',
    LOCK: 'lock',
    DISCARD: 'discard',
    DELETE: 'delete',
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
