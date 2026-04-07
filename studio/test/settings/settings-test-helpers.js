const defaultModified = {
    by: 'Mr Bean',
    at: '2025-10-16T11:14:00.000Z',
};

const buildValueFields = (valueType, value, booleanValue) => [
    { name: 'textValue', values: valueType === 'text' || valueType === 'optional-text' ? [`${value ?? ''}`] : [] },
    { name: 'richTextValue', values: valueType === 'richText' ? [`${value ?? ''}`] : [] },
    { name: 'booleanValue', values: [Boolean(booleanValue)] },
];

/**
 * Creates a settings reference fragment payload.
 * @param {object} overrides Override fields for this reference.
 * @returns {object} Settings reference payload.
 */
export const createSettingReference = (overrides = {}) => {
    const value = overrides.value ?? true;
    const valueType = overrides.valueType || (value === true || value === false ? 'boolean' : 'text');
    const booleanValue = overrides.booleanValue ?? (valueType === 'boolean' ? Boolean(value) : true);
    const id = overrides.id || 'setting-unknown';
    const name = overrides.name || id;
    const label = overrides.label || overrides.title || id;
    const templates = overrides.templates || [];
    const locales = overrides.locales || [];

    return {
        id,
        title: overrides.title || label,
        description: overrides.description || '',
        fieldName: overrides.fieldName || 'entries',
        status: overrides.status || 'PUBLISHED',
        modified: overrides.modified || defaultModified,
        path: overrides.path || `/content/dam/mas/acom/settings/${id}`,
        tags: overrides.tags || [],
        fields: [
            { name: 'name', values: [name] },
            { name: 'label', values: [label] },
            { name: 'templates', values: templates },
            { name: 'locales', values: locales },
            { name: 'valuetype', values: [valueType] },
            ...buildValueFields(valueType, value, booleanValue),
            ...(overrides.fields || []),
        ],
    };
};

/**
 * Builds common settings references used by settings page/table tests.
 * @returns {object[]} Settings references.
 */
export const createDefaultSettingsReferences = () => [
    createSettingReference({
        id: 'setting-show-addon',
        title: 'Show Addon',
        name: 'addon',
        label: 'Show Addon',
        status: 'PUBLISHED',
        templates: [],
        tags: [{ id: 'mas:keyword/checkout', title: 'Checkout' }],
        value: '{{test-value}}',
    }),
    createSettingReference({
        id: 'setting-display-plan-type',
        title: 'Display Plan type',
        name: 'displayPlanType',
        label: 'Display Plan type',
        status: 'DRAFT',
        modified: { by: 'Mr Bean', at: '2025-10-14T09:11:00.000Z' },
        templates: ['catalog', 'mini'],
    }),
    createSettingReference({
        id: 'setting-show-secure-label',
        title: 'Show secure label',
        name: 'secureLabel',
        label: 'Show secure label',
        status: 'PUBLISHED',
        modified: { by: 'Mr Bean', at: '2025-10-14T09:11:00.000Z' },
        templates: ['catalog', 'plans'],
    }),
];

/**
 * Creates an AEM mock that serves settings index content and records calls.
 * @param {object} options Mock options.
 * @param {object[]} [options.references=[]] References returned by the index.
 * @returns {{aem: object, calls: object, state: object}} AEM mock and trackers.
 */
export const createSettingsIndexAemMock = ({ references = [] } = {}) => {
    const state = {
        references: [...references],
    };
    const calls = {
        getByPath: [],
    };

    const aem = {
        sites: {
            cf: {
                fragments: {
                    getByPath: async (path, options) => {
                        calls.getByPath.push({ path, options });
                        return {
                            id: 'settings-index',
                            path,
                            fields: [{ name: 'entries', values: state.references.map((reference) => reference.path) }],
                            references: state.references,
                        };
                    },
                },
            },
        },
    };

    return { aem, calls, state };
};

/**
 * Waits until the expected number of setting rows render in the table.
 * @param {HTMLElement} table Settings table element.
 * @param {number} expectedCount Expected row count.
 * @returns {Promise<void>} Resolves when the expected count is reached.
 */
export const waitForSettingRows = async (table, expectedCount) => {
    let attempts = 0;
    while (attempts < 20) {
        await table.updateComplete;
        const count = table.shadowRoot.querySelectorAll('.mas-setting-row').length;
        if (count === expectedCount) return;
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
};

/**
 * Wraps fetch to mock AEM querybuilder tag responses.
 * @param {Function} originalFetch Native fetch implementation.
 * @returns {Function} Wrapped fetch implementation.
 */
export const createQueryBuilderFetchMock = (originalFetch) => async (input, init) => {
    const requestUrl = typeof input === 'string' ? input : input.url;
    if (requestUrl.includes('/bin/querybuilder.json')) {
        return originalFetch('/test/mocks/tags.json');
    }
    return originalFetch(input, init);
};
