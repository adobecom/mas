const workflow = {
    modal: 'twp',
    checkoutWorkflowStep: 'segmentation',
    checkoutClientId: 'doc_cloud',
    wcsOsi: 'vQmS1H18A6_kPd0tYBgKnp-TQIF0GbT6p8SH8rWcLMs',
    threeInOneEnabled: false,
};

const configs = [
    { PRODUCT_FAMILY: 'family', LOCALE: '', BUY_NOW_PATH: '/family' },
    { PRODUCT_FAMILY: 'code', LOCALE: '', BUY_NOW_PATH: '/code', BUY_NOW_HASH: 'base' },
    { PRODUCT_FAMILY: 'pa', LOCALE: '', BUY_NOW_PATH: '/pa', BUY_NOW_HASH: 'pa' },
    { PRODUCT_FAMILY: 'family', LOCALE: 'fr', BUY_NOW_PATH: '/fr/family', BUY_NOW_HASH: '' },
];

const configInput = { configs, productArrangementCode: 'pa', productCode: 'code', productFamily: 'family', locale: 'de' };
const modalConfig = {
    FREE_TRIAL_PATH: '/trial',
    FREE_TRIAL_HASH: 'trial',
    BUY_NOW_PATH: '/buy',
    BUY_NOW_HASH: 'buy',
    CRM_PATH: '/crm',
    CRM_HASH: 'crm',
};

export const decisionCases = [
    ...['twp', 'd2p', 'crm', 'other', undefined].flatMap((modal) => [
        { id: `modal-type-${modal}`, decision: 'is3in1Modal', input: modal, expected: ['twp', 'd2p', 'crm'].includes(modal) },
        ...[true, false, undefined].map((threeInOneEnabled) => ({
            id: `modal-enabled-${modal}-${threeInOneEnabled}`,
            decision: 'isOpen3in1Modal',
            input: { modal, threeInOneEnabled },
            expected: ['twp', 'd2p', 'crm'].includes(modal) && threeInOneEnabled !== false,
        })),
    ]),
    {
        id: 'authored-fallback-wins',
        decision: 'resolveWorkflowFallback',
        input: { ...workflow, fallbackStep: 'payment' },
        expected: { checkoutWorkflowStep: 'payment', modal: undefined, fallbackUsed: true },
    },
    {
        id: 'doc-cloud-commitment',
        decision: 'resolveWorkflowFallback',
        input: workflow,
        expected: { checkoutWorkflowStep: 'commitment', modal: undefined, fallbackUsed: true },
    },
    {
        id: 'doc-cloud-recommendation',
        decision: 'resolveWorkflowFallback',
        input: { ...workflow, modal: 'crm', wcsOsi: 'SaDEVpzcaBu6JtP_RjK0EJbNRSwiNX_UIaG8F4Lf8yI' },
        expected: { checkoutWorkflowStep: 'recommendation', modal: undefined, fallbackUsed: true },
    },
    ...[
        ['enabled', { threeInOneEnabled: true }],
        ['default-enabled', { threeInOneEnabled: undefined }],
        ['empty-authored-fallback', { fallbackStep: '' }],
        ['unknown-offer', { wcsOsi: 'unknown' }],
        ['different-client', { checkoutClientId: 'adobe_com' }],
        ['different-modal', { modal: 'other', fallbackStep: 'payment' }],
    ].map(([id, overrides]) => ({
        id: `workflow-${id}`,
        decision: 'resolveWorkflowFallback',
        input: { ...workflow, ...overrides },
        expected: { checkoutWorkflowStep: 'segmentation', modal: overrides.modal ?? 'twp', fallbackUsed: false },
    })),
    {
        id: 'authored-fallback-other-client',
        decision: 'resolveWorkflowFallback',
        input: { ...workflow, modal: 'd2p', checkoutClientId: 'adobe_com', fallbackStep: 'payment' },
        expected: { checkoutWorkflowStep: 'payment', modal: undefined, fallbackUsed: true },
    },
    {
        id: 'config-arrangement-precedence',
        decision: 'selectCheckoutConfig',
        input: configInput,
        expected: { PRODUCT_FAMILY: 'pa', LOCALE: '', BUY_NOW_PATH: '/pa', BUY_NOW_HASH: 'pa' },
    },
    {
        id: 'config-code-precedence',
        decision: 'selectCheckoutConfig',
        input: { ...configInput, productArrangementCode: 'unknown' },
        expected: { PRODUCT_FAMILY: 'code', LOCALE: '', BUY_NOW_PATH: '/code', BUY_NOW_HASH: 'base' },
    },
    {
        id: 'config-family-precedence',
        decision: 'selectCheckoutConfig',
        input: { ...configInput, productArrangementCode: undefined, productCode: undefined },
        expected: { PRODUCT_FAMILY: 'family', LOCALE: '', BUY_NOW_PATH: '/family' },
    },
    {
        id: 'config-family-locale-overrides-arrangement-base',
        decision: 'selectCheckoutConfig',
        input: { ...configInput, locale: 'fr' },
        expected: { PRODUCT_FAMILY: 'family', LOCALE: 'fr', BUY_NOW_PATH: '/fr/family', BUY_NOW_HASH: 'pa' },
    },
    {
        id: 'config-disabled-and-empty-overrides',
        decision: 'selectCheckoutConfig',
        input: {
            productFamily: 'family',
            locale: 'fr',
            configs: [
                {
                    PRODUCT_FAMILY: 'family',
                    LOCALE: '',
                    BUY_NOW_PATH: '/base',
                    FREE_TRIAL_PATH: '/trial',
                    BUY_NOW_HASH: 'keep',
                },
                { PRODUCT_FAMILY: 'family', LOCALE: 'fr', BUY_NOW_PATH: 'X', FREE_TRIAL_PATH: '\u274c', BUY_NOW_HASH: '' },
            ],
        },
        expected: { PRODUCT_FAMILY: 'family', LOCALE: 'fr', BUY_NOW_PATH: '', FREE_TRIAL_PATH: '', BUY_NOW_HASH: 'keep' },
    },
    {
        id: 'config-svar-precedence',
        decision: 'selectCheckoutConfig',
        input: {
            productFamily: 'family',
            locale: 'de',
            svar: 'variant',
            configs: [
                { PRODUCT_FAMILY: 'family', LOCALE: '', BUY_NOW_PATH: '/base' },
                { PRODUCT_FAMILY: 'family+variant', LOCALE: '', BUY_NOW_PATH: '/variant' },
            ],
        },
        expected: { PRODUCT_FAMILY: 'family+variant', LOCALE: '', BUY_NOW_PATH: '/variant' },
    },
    {
        id: 'config-missing',
        decision: 'selectCheckoutConfig',
        input: { ...configInput, configs: [] },
        expected: undefined,
    },
    {
        id: 'config-unmatched',
        decision: 'selectCheckoutConfig',
        input: { configs, productFamily: 'unknown', locale: 'fr' },
        expected: undefined,
    },
    {
        id: 'config-matched-without-base-or-locale',
        decision: 'selectCheckoutConfig',
        input: { configs: [{ PRODUCT_FAMILY: 'family', LOCALE: 'it' }], productFamily: 'family', locale: 'fr' },
        expected: {},
    },
    ...[
        ['trial', { offerType: 'TRIAL' }, '/trial', 'trial'],
        ['buy', { offerType: 'BUY' }, '/buy', 'buy'],
        ['crm', { offerType: 'TRIAL', modal: 'crm' }, '/crm', 'crm'],
        ['crm-3in1', { offerType: 'TRIAL', modal: 'crm', isOpen3in1: true }, '/trial', 'trial'],
        ['buy-3in1', { offerType: 'BUY', modal: 'twp', isOpen3in1: true }, '/buy', 'buy'],
    ].flatMap(([id, context, path, hash]) => [
        { id: `path-${id}`, decision: 'selectModalPath', input: { config: modalConfig, ...context }, expected: path },
        { id: `hash-${id}`, decision: 'selectModalHash', input: { config: modalConfig, ...context }, expected: hash },
    ]),
    ...[
        ['INDIVIDUAL', 'COM', '/individual'],
        ['TEAM', 'COM', '/team'],
        ['INDIVIDUAL', 'EDU', '/student'],
        ['TEAM', 'EDU', '/education'],
    ].map(([customerSegment, marketSegment, expected]) => ({
        id: `segment-${customerSegment}-${marketSegment}`,
        decision: 'selectModalPath',
        input: {
            config: { BUY_NOW_PATH: ' /individual | /team | /student | /education ' },
            offerType: 'BUY',
            isCheckoutLink: true,
            customerSegment,
            marketSegments: [marketSegment],
        },
        expected,
    })),
    {
        id: '3in1-does-not-split-segment-paths',
        decision: 'selectModalPath',
        input: { config: { BUY_NOW_PATH: '/a|/b' }, offerType: 'BUY', isOpen3in1: true },
        expected: '/a|/b',
    },
    { id: 'hash-missing-config', decision: 'selectModalHash', input: {}, expected: undefined },
    { id: 'hash-missing-offer', decision: 'selectModalHash', input: { config: modalConfig }, expected: undefined },
    {
        id: 'path-disabled',
        decision: 'selectModalPath',
        input: { config: { BUY_NOW_PATH: '' }, offerType: 'BUY' },
        expected: '',
    },
];
