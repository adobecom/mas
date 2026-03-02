import { expect } from '@esm-bundle/chai';
import { SettingsStore } from '../../src/settings/settings-store.js';
import { TEMPLATE_TREE_DATA } from '../../src/settings/template-tree-data.js';
import { createSettingReference } from './settings-test-helpers.js';

const collectTemplateLeafMeta = (tree = TEMPLATE_TREE_DATA) => {
    const allTemplateIds = [];
    const branchByTemplateId = new Map();
    const templateIdsByBranch = new Map();

    const visitNode = (node, branchLabel = '') => {
        const templateId = `${node.name}`;
        if (!templateId) return;

        const children = node.children || [];
        if (!children.length) {
            allTemplateIds.push(templateId);
            const normalizedBranch = branchLabel || `${node.label || templateId}`;
            branchByTemplateId.set(templateId, normalizedBranch);
            if (!templateIdsByBranch.has(normalizedBranch)) {
                templateIdsByBranch.set(normalizedBranch, []);
            }
            templateIdsByBranch.get(normalizedBranch).push(templateId);
            return;
        }

        const nextBranchLabel = `${node.label || branchLabel}`;
        for (const child of children) {
            visitNode(child, nextBranchLabel);
        }
    };

    for (const rootNode of tree) {
        visitNode(rootNode, '');
    }

    return { allTemplateIds, branchByTemplateId, templateIdsByBranch };
};

describe('Settings Store Namespace', () => {
    const { allTemplateIds, branchByTemplateId, templateIdsByBranch } = collectTemplateLeafMeta();
    const merchCardIds = allTemplateIds.filter((templateId) => branchByTemplateId.get(templateId) === 'Merch card');
    const otherTemplateId = allTemplateIds.find((templateId) => branchByTemplateId.get(templateId) !== 'Merch card');
    const crossBranchTemplateIds = [...templateIdsByBranch.values()].flatMap((ids) => ids.slice(0, 1));

    const buildValueFields = (valueType, value, booleanValue) => [
        { name: 'textValue', values: valueType === 'text' ? [`${value ?? ''}`] : [] },
        { name: 'richTextValue', values: valueType === 'richText' ? [`${value ?? ''}`] : [] },
        { name: 'booleanValue', values: [Boolean(booleanValue)] },
    ];

    const createFragment = (id, overrides = {}) => {
        const value = overrides.value ?? true;
        const valueType = overrides.valueType || (value === true || value === false ? 'boolean' : 'text');
        const booleanValue = overrides.booleanValue ?? (valueType === 'boolean' ? Boolean(value) : true);
        return {
            id,
            title: overrides.title || overrides.label || `Setting ${id}`,
            description: overrides.description || '',
            status: overrides.status || 'PUBLISHED',
            modified: {
                by: 'Mr Bean',
                at: '2025-10-16T11:14:00.000Z',
            },
            tags: [],
            path: `/content/dam/mas/acom/en_US/${id}`,
            fields: [
                { name: 'name', values: [id] },
                { name: 'templates', values: overrides.templates || ['catalog'] },
                { name: 'locales', values: overrides.locales || [] },
                { name: 'valuetype', values: [valueType] },
                ...buildValueFields(valueType, value, booleanValue),
                ...(overrides.fields || []),
            ],
        };
    };

    it('reuses row stores by fragment id', () => {
        const store = new SettingsStore();
        store.setSettingFragments([createFragment('showPlanType'), createFragment('displayAnnual')]);
        const firstStores = store.rows.get();
        const firstRow = firstStores[0];

        store.setSettingFragments([
            createFragment('showPlanType', { value: false }),
            createFragment('displayAnnual', { value: true }),
        ]);
        const secondStores = store.rows.get();
        expect(secondStores[0]).to.equal(firstRow);
        expect(secondStores[0].value.value).to.equal(false);
    });

    it('disposes removed rows', () => {
        const store = new SettingsStore();
        store.setSettingFragments([createFragment('showAddon'), createFragment('showPlanType')]);
        const removedStore = store.getRowStore('showPlanType');

        store.setSettingFragments([createFragment('showAddon')]);

        expect(removedStore.getMeta('disposed')).to.equal(true);
        expect(store.getRowStore('showPlanType')).to.equal(null);
    });

    it('shows "All templates selected" when nothing is selected', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary([])).to.equal('All templates selected');
    });

    it('shows "All templates selected" when all templates are selected', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary(allTemplateIds)).to.equal('All templates selected');
    });

    it('shows "All templates selected" when selected ids are invalid', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary(['missing-template-id'])).to.equal('All templates selected');
    });

    it('shows "All templates selected" when selected ids are empty values', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary(['', null, undefined])).to.equal('All templates selected');
    });

    it('shows branch summary when selected templates are all from one branch', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary(['merch-card-plans'])).to.equal('Merch card (1 selected)');
        expect(store.formatTemplateSummary(['merch-card-plans', 'merch-card-product', 'merch-card-product'])).to.equal(
            'Merch card (2 selected)',
        );
    });

    it('shows count summary when selected templates span multiple categories', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary([merchCardIds[0], otherTemplateId])).to.equal('2 templates selected');
    });

    it('shows "5 templates selected" when five templates are selected across branches', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary(crossBranchTemplateIds.slice(0, 5))).to.equal('5 templates selected');
    });

    it('ignores invalid values and still shows branch summary for a single branch', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary(['merch-card-plans', 'missing-template-id', '', null])).to.equal(
            'Merch card (1 selected)',
        );
    });

    it('ignores invalid values and duplicates when all templates are effectively selected', () => {
        const store = new SettingsStore();
        expect(store.formatTemplateSummary([...allTemplateIds, 'missing-template-id', allTemplateIds[0]])).to.equal(
            'All templates selected',
        );
    });

    it('toggles a setting and updates toast state', async () => {
        const store = new SettingsStore();
        let currentValue = true;
        const reference = createSettingReference({
            id: 'setting-show-secure-label',
            name: 'showSecureLabel',
            label: 'Show secure label',
            locales: [],
            templates: ['catalog'],
            value: currentValue,
        });

        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => ({
                            id: 'settings-index',
                            path: '/content/dam/mas/sandbox/settings/index',
                            fields: [{ name: 'entries', values: [reference.path] }],
                            references: [
                                {
                                    ...reference,
                                    fields: reference.fields.map((field) =>
                                        field.name === 'booleanValue' ? { ...field, values: [currentValue] } : field,
                                    ),
                                },
                            ],
                        }),
                        getById: async () => ({
                            id: reference.id,
                            title: reference.title,
                            description: '',
                            path: reference.path,
                            status: 'PUBLISHED',
                            tags: [],
                            fields: [
                                { name: 'name', type: 'text', multiple: false, values: ['showSecureLabel'] },
                                { name: 'templates', type: 'text', multiple: true, values: ['catalog'] },
                                { name: 'locales', type: 'text', multiple: true, values: [] },
                                { name: 'tags', type: 'tag', multiple: true, values: [] },
                                { name: 'valuetype', type: 'text', multiple: false, values: ['boolean'] },
                                { name: 'textValue', type: 'text', multiple: false, values: [] },
                                { name: 'richTextValue', type: 'long-text', multiple: false, values: [] },
                                { name: 'booleanValue', type: 'boolean', multiple: false, values: [currentValue] },
                            ],
                        }),
                        save: async (fragment) => {
                            currentValue = fragment.fields.find((field) => field.name === 'booleanValue').values[0];
                            return fragment;
                        },
                    },
                },
            },
        });

        await store.loadSurface('sandbox');

        await store.toggleSetting(reference.id, false);
        const rowStore = store.getRowStore(reference.id);

        expect(rowStore.value.value).to.equal(false);
        expect(store.toast.get().message).to.contain("'Show secure label' is now [Off]");
    });

    it('toggles text settings via booleanValue and keeps text value intact', async () => {
        const store = new SettingsStore();
        const reference = createSettingReference({
            id: 'setting-show-addon',
            name: 'showAddon',
            label: 'Show Addon',
            locales: [],
            templates: ['catalog'],
            valueType: 'text',
            value: '{{test-value}}',
            booleanValue: true,
        });

        let currentEnabled = true;
        const savedFragments = [];
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => ({
                            id: 'settings-index',
                            path: '/content/dam/mas/sandbox/settings/index',
                            fields: [{ name: 'entries', values: [reference.path] }],
                            references: [
                                {
                                    ...reference,
                                    fields: reference.fields.map((field) =>
                                        field.name === 'booleanValue' ? { ...field, values: [currentEnabled] } : field,
                                    ),
                                },
                            ],
                        }),
                        getById: async () => ({
                            id: reference.id,
                            title: reference.title,
                            description: '',
                            path: reference.path,
                            status: 'PUBLISHED',
                            tags: [],
                            fields: [
                                { name: 'name', type: 'text', multiple: false, values: ['showAddon'] },
                                { name: 'templates', type: 'text', multiple: true, values: ['catalog'] },
                                { name: 'locales', type: 'text', multiple: true, values: [] },
                                { name: 'tags', type: 'tag', multiple: true, values: [] },
                                { name: 'valuetype', type: 'text', multiple: false, values: ['text'] },
                                { name: 'textValue', type: 'text', multiple: false, values: ['{{test-value}}'] },
                                { name: 'richTextValue', type: 'long-text', multiple: false, values: [] },
                                { name: 'booleanValue', type: 'boolean', multiple: false, values: [currentEnabled] },
                            ],
                        }),
                        save: async (fragment) => {
                            savedFragments.push(fragment);
                            currentEnabled = fragment.fields.find((field) => field.name === 'booleanValue').values[0];
                            return fragment;
                        },
                    },
                },
            },
        });

        await store.loadSurface('sandbox');
        const updated = await store.toggleSetting(reference.id, false);

        expect(updated).to.equal(true);
        expect(savedFragments).to.have.length(1);
        const savedFields = savedFragments[0].fields;
        expect(savedFields.find((field) => field.name === 'valuetype').values).to.deep.equal(['text']);
        expect(savedFields.find((field) => field.name === 'textValue').values).to.deep.equal(['{{test-value}}']);
        expect(savedFields.find((field) => field.name === 'booleanValue').values).to.deep.equal([false]);
        expect(store.getRowStore(reference.id).value.value).to.equal('{{test-value}}');
        expect(store.getRowStore(reference.id).value.booleanValue).to.equal(false);
    });

    it('loads settings index for surface and nests localized entries by fieldName and name', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-secure-label',
            name: 'showSecureLabel',
            label: 'Show secure label',
            locales: [],
            templates: ['catalog', 'plans'],
        });
        const nestedByName = createSettingReference({
            id: 'setting-show-secure-label-fr',
            name: 'showSecureLabel',
            label: 'Show secure label',
            fieldName: 'entries',
            locales: ['fr_FR'],
            templates: [],
            value: false,
        });
        const nestedByFieldName = createSettingReference({
            id: 'setting-show-secure-label-de',
            name: 'showSecureLabel-de',
            label: 'Show secure label',
            fieldName: 'showSecureLabel',
            locales: ['de_DE'],
            templates: ['plans'],
            value: false,
        });

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => ({
                            id: 'settings-index',
                            path: '/content/dam/mas/sandbox/settings/index',
                            fields: [{ name: 'entries', values: [topLevel.path, nestedByName.path, nestedByFieldName.path] }],
                            references: [topLevel, nestedByName, nestedByFieldName],
                        }),
                    },
                },
            },
        });

        await store.loadSurface('sandbox');

        const [row] = store.rows.get();
        expect(store.rows.get().length).to.equal(1);
        expect(row.value.name).to.equal('showSecureLabel');
        expect(row.value.locales).to.deep.equal([]);
        expect(row.value.overrides.length).to.equal(2);
        expect(row.value.overrides.map((override) => override.locale)).to.deep.equal(['fr_FR', 'de_DE']);
    });

    it('returns override context by override fragment id', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-addon',
            name: 'showAddon',
            label: 'Show addon',
            locales: [],
        });
        const nested = createSettingReference({
            id: 'setting-show-addon-fr',
            name: 'showAddon',
            label: 'Show addon',
            fieldName: 'entries',
            locales: ['fr_FR'],
        });

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => ({
                            id: 'settings-index',
                            path: '/content/dam/mas/sandbox/settings/index',
                            fields: [{ name: 'entries', values: [topLevel.path, nested.path] }],
                            references: [topLevel, nested],
                        }),
                    },
                },
            },
        });

        await store.loadSurface('sandbox');

        const context = store.getOverrideContext('setting-show-addon-fr');
        expect(context.row.id).to.equal('setting-show-addon');
        expect(context.override.id).to.equal('setting-show-addon-fr');
    });

    it('ensures a row is expanded once', async () => {
        const store = new SettingsStore();
        store.expandedRowIds.set([]);

        store.ensureExpanded('setting-show-addon');
        store.ensureExpanded('setting-show-addon');

        expect(store.expandedRowIds.get()).to.deep.equal(['setting-show-addon']);
    });

    it('only keeps top-level rows with empty locales', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-plan-type',
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
        });
        const nestedOnly = createSettingReference({
            id: 'setting-show-plan-type-fr',
            name: 'showPlanType',
            label: 'Show plan type',
            locales: ['fr_FR'],
        });

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => ({
                            id: 'settings-index',
                            path: '/content/dam/mas/sandbox/settings/index',
                            fields: [{ name: 'entries', values: [topLevel.path, nestedOnly.path] }],
                            references: [nestedOnly, topLevel],
                        }),
                    },
                },
            },
        });

        await store.loadSurface('sandbox');

        const [row] = store.rows.get();
        expect(store.rows.get().length).to.equal(1);
        expect(row.value.locales).to.deep.equal([]);
        expect(row.value.overrides.length).to.equal(1);
        expect(row.value.overrides[0].locale).to.equal('fr_FR');
    });

    it('does not delete top-level settings', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-plan-type',
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
        });

        let getByPathCalls = 0;
        let getByIdCalls = 0;
        let deleteCalls = 0;
        let saveCalls = 0;

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => {
                            getByPathCalls++;
                            return {
                                id: 'settings-index',
                                path: '/content/dam/mas/sandbox/settings/index',
                                fields: [{ name: 'entries', values: [topLevel.path] }],
                                references: [topLevel],
                            };
                        },
                        getById: async () => {
                            getByIdCalls++;
                            return topLevel;
                        },
                        delete: async () => {
                            deleteCalls++;
                        },
                        save: async (fragment) => {
                            saveCalls++;
                            return fragment;
                        },
                    },
                },
            },
        });

        await store.loadSurface('sandbox');
        const callsBeforeDelete = getByPathCalls;
        const deleted = await store.removeSetting(topLevel.id);

        expect(deleted).to.equal(false);
        expect(getByPathCalls).to.equal(callsBeforeDelete);
        expect(getByIdCalls).to.equal(0);
        expect(deleteCalls).to.equal(0);
        expect(saveCalls).to.equal(0);
    });

    it('deletes only the targeted override', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-plan-type',
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type',
        });
        const nested = createSettingReference({
            id: 'setting-show-plan-type-fr',
            name: 'showPlanType',
            label: 'Show plan type',
            fieldName: 'entries',
            locales: ['fr_FR'],
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type-fr',
        });

        let indexEntries = [topLevel.path, nested.path];
        const deletedIds = [];

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async (path) => ({
                            id: 'settings-index',
                            path,
                            fields: [{ name: 'entries', values: [...indexEntries] }],
                            references: [topLevel, nested].filter((reference) => indexEntries.includes(reference.path)),
                        }),
                        getById: async (id) => (id === nested.id ? nested : topLevel),
                        delete: async (fragment) => {
                            deletedIds.push(fragment.id);
                        },
                        save: async (fragment) => {
                            indexEntries = fragment.fields.find((field) => field.name === 'entries').values;
                            return fragment;
                        },
                    },
                },
            },
        });

        await store.loadSurface('sandbox');
        const rowId = store.rows.get()[0].value.id;
        const overrideId = store.rows.get()[0].value.overrides[0].id;
        const removed = await store.removeOverride(rowId, overrideId);

        expect(removed).to.equal(true);
        expect(deletedIds).to.deep.equal([nested.id]);
    });

    it('duplicates override as a localized override', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-plan-type',
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
            templates: ['catalog'],
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type',
        });
        const nested = createSettingReference({
            id: 'setting-show-plan-type-fr',
            name: 'showPlanType',
            label: 'Show plan type',
            fieldName: 'entries',
            locales: ['fr_FR'],
            templates: ['plans'],
            value: false,
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type-fr',
        });

        let indexEntries = [topLevel.path, nested.path];
        const createPayloads = [];

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async (path) => ({
                            id: 'settings-index',
                            path,
                            fields: [{ name: 'entries', values: [...indexEntries] }],
                            references: [topLevel, nested].filter((reference) => indexEntries.includes(reference.path)),
                        }),
                        create: async (payload) => {
                            createPayloads.push(payload);
                            return { path: '/content/dam/mas/sandbox/settings/duplicated-override' };
                        },
                        save: async (fragment) => {
                            indexEntries = fragment.fields.find((field) => field.name === 'entries').values;
                            return fragment;
                        },
                    },
                },
            },
        });

        await store.loadSurface('sandbox');
        const rowId = store.rows.get()[0].value.id;
        const overrideId = store.rows.get()[0].value.overrides[0].id;
        const duplicated = await store.duplicateOverride(rowId, overrideId);

        expect(duplicated).to.equal(true);
        expect(createPayloads.length).to.equal(1);

        const createdFields = createPayloads[0].fields;
        const localesField = createdFields.find((field) => field.name === 'locales');
        const nameField = createdFields.find((field) => field.name === 'name');

        expect(localesField.values).to.deep.equal(['fr_FR']);
        expect(nameField.values).to.deep.equal(['showPlanType']);
    });

    it('toggles override value and updates the override fragment', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-plan-type',
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
            templates: ['catalog'],
            value: true,
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type',
        });
        let currentOverrideValue = true;
        const nested = createSettingReference({
            id: 'setting-show-plan-type-fr',
            name: 'showPlanType',
            label: 'Show plan type',
            fieldName: 'entries',
            locales: ['fr_FR'],
            templates: ['plans'],
            value: currentOverrideValue,
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type-fr',
        });

        const getByIdCalls = [];

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async (path) => ({
                            id: 'settings-index',
                            path,
                            fields: [{ name: 'entries', values: [topLevel.path, nested.path] }],
                            references: [
                                topLevel,
                                {
                                    ...nested,
                                    fields: nested.fields.map((field) =>
                                        field.name === 'booleanValue' ? { ...field, values: [currentOverrideValue] } : field,
                                    ),
                                },
                            ],
                        }),
                        getById: async (id) => {
                            getByIdCalls.push(id);
                            return {
                                id,
                                title: nested.title,
                                description: nested.description,
                                path: nested.path,
                                status: nested.status,
                                tags: [],
                                fields: [
                                    { name: 'name', type: 'text', multiple: false, values: ['showPlanType'] },
                                    { name: 'templates', type: 'text', multiple: true, values: ['plans'] },
                                    { name: 'locales', type: 'text', multiple: true, values: ['fr_FR'] },
                                    { name: 'tags', type: 'tag', multiple: true, values: [] },
                                    { name: 'valuetype', type: 'text', multiple: false, values: ['boolean'] },
                                    { name: 'textValue', type: 'text', multiple: false, values: [] },
                                    { name: 'richTextValue', type: 'long-text', multiple: false, values: [] },
                                    { name: 'booleanValue', type: 'boolean', multiple: false, values: [currentOverrideValue] },
                                ],
                            };
                        },
                        save: async (fragment) => {
                            currentOverrideValue = fragment.fields.find((field) => field.name === 'booleanValue').values[0];
                            return fragment;
                        },
                    },
                },
            },
        });

        await store.loadSurface('sandbox');
        const rowId = store.rows.get()[0].value.id;
        const overrideId = store.rows.get()[0].value.overrides[0].id;
        const updated = await store.toggleOverride(rowId, overrideId, false);

        expect(updated).to.equal(true);
        expect(getByIdCalls).to.deep.equal([overrideId]);
        expect(store.rows.get()[0].value.overrides[0].value).to.equal(false);
        expect(store.toast.get().message).to.contain("'Show plan type (fr_FR)' is now [Off]");
    });
});
