// Constants for MAS MCP Server

export const TAG_MODEL_ID_MAPPING = {
    'mas:studio/content-type/merch-card-collection': 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
    'mas:studio/content-type/merch-card': 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ',
};

export const ROOT_PATH = '/content/dam/mas';

// Surface to AEM path mapping (enforces folder-first design)
export const SURFACES = {
    ACOM: 'acom',
    CCD: 'ccd',
    ADOBE_HOME: 'adobe-home',
    COMMERCE: 'commerce',
    SANDBOX: 'sandbox',
    NALA: 'nala',
};

export const SURFACE_PATHS = {
    [SURFACES.ACOM]: `${ROOT_PATH}/acom`,
    [SURFACES.CCD]: `${ROOT_PATH}/ccd`,
    [SURFACES.ADOBE_HOME]: `${ROOT_PATH}/adobe-home`,
    [SURFACES.COMMERCE]: `${ROOT_PATH}/commerce`,
    [SURFACES.SANDBOX]: `${ROOT_PATH}/sandbox`,
    [SURFACES.NALA]: `${ROOT_PATH}/nala`,
};

export const DEFAULT_LOCALE = 'en_US';

export const WCS_LANDSCAPE_PUBLISHED = 'PUBLISHED';
export const WCS_LANDSCAPE_DRAFT = 'DRAFT';

export const PLAN_TYPES = {
    ABM: 'ABM',
    PUF: 'PUF',
    M2M: 'M2M',
    PERPETUAL: 'PERPETUAL',
    P3Y: 'P3Y',
};

export const OFFER_TYPES = {
    BASE: 'BASE',
    TRIAL: 'TRIAL',
    PROMOTION: 'PROMOTION',
};

export const CUSTOMER_SEGMENTS = {
    INDIVIDUAL: 'INDIVIDUAL',
    TEAM: 'TEAM',
};

export const MARKET_SEGMENTS = {
    COM: 'COM',
    EDU: 'EDU',
    GOV: 'GOV',
};

export const COMMITMENT_TYPES = {
    YEAR: 'YEAR',
    MONTH: 'MONTH',
    PERPETUAL: 'PERPETUAL',
    TERM_LICENSE: 'TERM_LICENSE',
};

export const TERM_TYPES = {
    MONTHLY: 'MONTHLY',
    ANNUAL: 'ANNUAL',
    P3Y: 'P3Y',
};

export const DEFAULT_AOS_PARAMS = {
    buyingProgram: 'RETAIL',
    merchant: 'ADOBE',
    salesChannel: 'DIRECT',
};

export const PLACEHOLDER_TYPES = [
    { type: 'price', name: 'Price' },
    { type: 'optical', name: 'Optical price' },
    { type: 'annual', name: 'Annual price' },
    { type: 'strikethrough', name: 'Strikethrough price' },
    { type: 'legal', name: 'Legal disclaimer' },
    { type: 'checkoutUrl', name: 'Checkout URL' },
];

export const WORKFLOW_STEPS = {
    EMAIL: 'email',
    BUNDLE: 'bundle',
    COMMITMENT: 'commitment',
    SEGMENTATION: 'segmentation',
    RECOMMENDATION: 'recommendation',
    PAYMENT: 'payment',
    CHANGE_PLAN_TEAM_PLANS: 'change-plan/team-upgrade/plans',
    CHANGE_PLAN_TEAM_PAYMENT: 'change-plan/team-upgrade/payment',
};

export const MODAL_TYPES = {
    TWP: 'twp',
    D2P: 'd2p',
    CRM: 'crm',
};

export const LOCALE_DEFAULTS = [
    'ar_MENA',
    'bg_BG',
    'cs_CZ',
    'da_DK',
    'de_DE',
    'en_US',
    'es_ES',
    'fi_FI',
    'fr_FR',
    'he_IL',
    'hu_HU',
    'id_ID',
    'it_IT',
    'ja_JP',
    'ko_KR',
    'nb_NO',
    'nl_NL',
    'pl_PL',
    'pt_BR',
    'ro_RO',
    'ru_RU',
    'sk_SK',
    'sl_SI',
    'sv_SE',
    'th_TH',
    'tr_TR',
    'uk_UA',
    'vi_VN',
    'zh_CN',
    'zh_TW',
];

export const TRANSLATION_PROJECT_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3RyYW5zbGF0aW9uLXByb2plY3Q=';

export const TRANSLATIONS_ALLOWED_SURFACES = ['acom', 'express', 'sandbox', 'nala'];
