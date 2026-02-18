import { expect } from '@esm-bundle/chai';
import { SettingsStoreModel } from '../../src/settings/settings-store.js';
import { getTemplates } from '../../src/editors/variant-picker.js';

describe('Settings Store Namespace', () => {
    const templates = getTemplates().filter((template) => template.value !== 'all');
    const allTemplateIds = templates.map((template) => template.value);
    const merchCardIds = templates.filter((template) => template.category === 'Merch card').map((template) => template.value);
    const otherTemplate = templates.find((template) => template.category !== 'Merch card');

    const buildValueFields = (valueType, value) => [
        { name: 'textValue', values: valueType === 'text' ? [`${value ?? ''}`] : [] },
        { name: 'richTextValue', values: valueType === 'richText' ? [`${value ?? ''}`] : [] },
        { name: 'booleanValue', values: valueType === 'boolean' ? [Boolean(value)] : [] },
    ];

    const createFragment = (id, overrides = {}) => {
        const value = overrides.value ?? true;
        const valueType = overrides.valueType || (value === true || value === false ? 'boolean' : 'text');
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
                ...buildValueFields(valueType, value),
                ...(overrides.fields || []),
            ],
        };
    };

    const createIndexReference = (id, overrides = {}) => ({
        id,
        fieldName: overrides.fieldName || 'entries',
        title: overrides.title || overrides.label || id,
        description: overrides.description || '',
        status: overrides.status || 'PUBLISHED',
        modified: {
            by: 'Mr Bean',
            at: '2025-10-16T11:14:00.000Z',
        },
        tags: [],
        path: `/content/dam/mas/sandbox/settings/${id}`,
        fields: [
            { name: 'name', values: [overrides.name || id] },
            { name: 'label', values: [overrides.label || id] },
            { name: 'templates', values: overrides.templates || ['catalog'] },
            { name: 'locales', values: overrides.locales || [] },
            { name: 'valuetype', values: ['boolean'] },
            { name: 'textValue', values: [] },
            { name: 'richTextValue', values: [] },
            { name: 'booleanValue', values: [Boolean(overrides.value ?? true)] },
        ],
    });

    it('reuses row stores by fragment id', () => {
        const orchestrator = new SettingsStoreModel();
        orchestrator.setSettingFragments([createFragment('showAddon'), createFragment('showPlanType')]);
        const firstStores = orchestrator.rows.get();
        const firstRow = firstStores[0];

        orchestrator.setSettingFragments([
            createFragment('showAddon', { value: false }),
            createFragment('showPlanType', { value: true }),
        ]);
        const secondStores = orchestrator.rows.get();
        expect(secondStores[0]).to.equal(firstRow);
        expect(secondStores[0].value.value).to.equal(false);
    });

    it('disposes removed rows', () => {
        const orchestrator = new SettingsStoreModel();
        orchestrator.setSettingFragments([createFragment('showAddon'), createFragment('showPlanType')]);
        const removedStore = orchestrator.getRowStore('showPlanType');

        orchestrator.setSettingFragments([createFragment('showAddon')]);

        expect(removedStore.getMeta('disposed')).to.equal(true);
        expect(orchestrator.getRowStore('showPlanType')).to.equal(null);
    });

    it('shows "All templates selected" when nothing is selected', () => {
        const orchestrator = new SettingsStoreModel();
        expect(orchestrator.formatTemplateSummary([])).to.equal('All templates selected');
    });

    it('shows "All templates selected" when all templates are selected', () => {
        const orchestrator = new SettingsStoreModel();
        expect(orchestrator.formatTemplateSummary(allTemplateIds)).to.equal('All templates selected');
    });

    it('shows "All templates selected" when selected ids are invalid', () => {
        const orchestrator = new SettingsStoreModel();
        expect(orchestrator.formatTemplateSummary(['missing-template-id'])).to.equal('All templates selected');
    });

    it('shows "All templates selected" when selected ids are empty values', () => {
        const orchestrator = new SettingsStoreModel();
        expect(orchestrator.formatTemplateSummary(['', null, undefined])).to.equal('All templates selected');
    });

    it('shows category summary when selected templates are all from one category', () => {
        const orchestrator = new SettingsStoreModel();
        expect(orchestrator.formatTemplateSummary(['catalog'])).to.equal('Merch card (1 selected)');
        expect(orchestrator.formatTemplateSummary(['catalog', 'plans', 'plans'])).to.equal('Merch card (2 selected)');
    });

    it('shows count summary when selected templates span multiple categories', () => {
        const orchestrator = new SettingsStoreModel();
        expect(orchestrator.formatTemplateSummary([merchCardIds[0], otherTemplate.value])).to.equal('2 templates selected');
    });

    it('toggles a setting and updates toast state', async () => {
        const orchestrator = new SettingsStoreModel();
        let currentValue = true;
        const reference = createIndexReference('setting-show-secure-transaction', {
            name: 'showSecureTransaction',
            label: 'Show secure transaction',
            locales: [],
            templates: ['catalog'],
            value: currentValue,
        });

        orchestrator.setAem({
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
                                { name: 'name', type: 'text', multiple: false, values: ['showSecureTransaction'] },
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

        await orchestrator.loadSurface('sandbox');

        await orchestrator.toggleSetting(reference.id, false);
        const store = orchestrator.getRowStore(reference.id);

        expect(store.value.value).to.equal(false);
        expect(orchestrator.toast.get().message).to.contain("'Show secure transaction' is now [Off]");
    });

    it('loads settings index for surface and nests localized entries by fieldName and name', async () => {
        const topLevel = createIndexReference('setting-show-secure-label', {
            name: 'showSecureLabel',
            label: 'Show secure label',
            locales: [],
            templates: ['catalog', 'plans'],
        });
        const nestedByName = createIndexReference('setting-show-secure-label-fr', {
            name: 'showSecureLabel',
            label: 'Show secure label',
            fieldName: 'entries',
            locales: ['fr_FR'],
            templates: [],
            value: false,
        });
        const nestedByFieldName = createIndexReference('setting-show-secure-label-de', {
            name: 'showSecureLabel-de',
            label: 'Show secure label',
            fieldName: 'showSecureLabel',
            locales: ['de_DE'],
            templates: ['plans'],
            value: false,
        });

        const orchestrator = new SettingsStoreModel();
        orchestrator.setAem({
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

        await orchestrator.loadSurface('sandbox');

        const [row] = orchestrator.rows.get();
        expect(orchestrator.rows.get().length).to.equal(1);
        expect(row.value.name).to.equal('showSecureLabel');
        expect(row.value.locales).to.deep.equal([]);
        expect(row.value.overrides.length).to.equal(2);
        expect(row.value.overrides.map((override) => override.locale)).to.deep.equal(['fr_FR', 'de_DE']);
    });

    it('only keeps top-level rows with empty locales', async () => {
        const topLevel = createIndexReference('setting-show-plan-type', {
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
        });
        const nestedOnly = createIndexReference('setting-show-plan-type-fr', {
            name: 'showPlanType',
            label: 'Show plan type',
            locales: ['fr_FR'],
        });

        const orchestrator = new SettingsStoreModel();
        orchestrator.setAem({
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

        await orchestrator.loadSurface('sandbox');

        const [row] = orchestrator.rows.get();
        expect(orchestrator.rows.get().length).to.equal(1);
        expect(row.value.locales).to.deep.equal([]);
        expect(row.value.overrides.length).to.equal(1);
        expect(row.value.overrides[0].locale).to.equal('fr_FR');
    });

    it('does not delete top-level settings', async () => {
        const topLevel = createIndexReference('setting-show-plan-type', {
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
        });

        let getByPathCalls = 0;
        let getByIdCalls = 0;
        let deleteCalls = 0;
        let saveCalls = 0;

        const orchestrator = new SettingsStoreModel();
        orchestrator.setAem({
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

        await orchestrator.loadSurface('sandbox');
        const callsBeforeDelete = getByPathCalls;
        const deleted = await orchestrator.removeSetting(topLevel.id);

        expect(deleted).to.equal(false);
        expect(getByPathCalls).to.equal(callsBeforeDelete);
        expect(getByIdCalls).to.equal(0);
        expect(deleteCalls).to.equal(0);
        expect(saveCalls).to.equal(0);
    });

    it('deletes only the targeted override', async () => {
        const topLevel = createIndexReference('setting-show-plan-type', {
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type',
        });
        const nested = createIndexReference('setting-show-plan-type-fr', {
            name: 'showPlanType',
            label: 'Show plan type',
            fieldName: 'entries',
            locales: ['fr_FR'],
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type-fr',
        });

        let indexEntries = [topLevel.path, nested.path];
        const deletedIds = [];

        const orchestrator = new SettingsStoreModel();
        orchestrator.setAem({
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

        await orchestrator.loadSurface('sandbox');
        const rowId = orchestrator.rows.get()[0].value.id;
        const overrideId = orchestrator.rows.get()[0].value.overrides[0].id;
        const removed = await orchestrator.removeOverride(rowId, overrideId);

        expect(removed).to.equal(true);
        expect(deletedIds).to.deep.equal([nested.id]);
    });

    it('duplicates override as a localized override', async () => {
        const topLevel = createIndexReference('setting-show-plan-type', {
            name: 'showPlanType',
            label: 'Show plan type',
            locales: [],
            templates: ['catalog'],
            path: '/content/dam/mas/sandbox/settings/setting-show-plan-type',
        });
        const nested = createIndexReference('setting-show-plan-type-fr', {
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

        const orchestrator = new SettingsStoreModel();
        orchestrator.setAem({
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

        await orchestrator.loadSurface('sandbox');
        const rowId = orchestrator.rows.get()[0].value.id;
        const overrideId = orchestrator.rows.get()[0].value.overrides[0].id;
        const duplicated = await orchestrator.duplicateOverride(rowId, overrideId);

        expect(duplicated).to.equal(true);
        expect(createPayloads.length).to.equal(1);

        const createdFields = createPayloads[0].fields;
        const localesField = createdFields.find((field) => field.name === 'locales');
        const nameField = createdFields.find((field) => field.name === 'name');

        expect(localesField.values).to.deep.equal(['fr_FR']);
        expect(nameField.values).to.deep.equal(['showPlanType']);
    });
});
