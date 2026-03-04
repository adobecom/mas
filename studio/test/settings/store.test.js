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

const createMutationHarness = ({ topLevel, overrides = [] }) => {
    let references = [topLevel, ...overrides];
    let indexEntries = references.map((reference) => reference.path);
    const byId = new Map(references.map((reference) => [reference.id, reference]));
    const settingsPath = topLevel.path.split('/').slice(0, -1).join('/');
    const indexPath = `${settingsPath}/index`;
    const calls = {
        create: [],
        save: [],
        delete: [],
        getById: [],
        getByPath: [],
        getWithEtag: [],
        publish: [],
        unpublish: [],
    };

    const aem = {
        sites: {
            cf: {
                fragments: {
                    getByPath: async (path) => {
                        calls.getByPath.push(path);
                        if (path !== indexPath) {
                            const reference = references.find((item) => item.path === path);
                            if (reference) return structuredClone(reference);
                            throw new Error('404');
                        }

                        return {
                            id: 'settings-index',
                            path,
                            fields: [{ name: 'entries', values: [...indexEntries] }],
                            references: references.filter((reference) => indexEntries.includes(reference.path)),
                        };
                    },
                    getById: async (id) => {
                        calls.getById.push(id);
                        const fragment = byId.get(id);
                        if (!fragment) throw new Error(`Missing fragment ${id}`);
                        return structuredClone(fragment);
                    },
                    getWithEtag: async (id) => {
                        calls.getWithEtag.push(id);
                        return { id, etag: 'test-etag' };
                    },
                    create: async (payload) => {
                        calls.create.push(payload);
                        const created = {
                            id: payload.name,
                            title: payload.title,
                            description: payload.description,
                            fieldName: 'entries',
                            status: 'DRAFT',
                            modified: { by: 'Test', at: '2025-10-16T11:14:00.000Z' },
                            path: `${payload.parentPath}/${payload.name}`,
                            tags: payload.tags || [],
                            fields: payload.fields,
                        };

                        byId.set(created.id, created);
                        references = [...references, created];
                        return structuredClone(created);
                    },
                    save: async (fragment) => {
                        calls.save.push(fragment);
                        const entriesField = fragment.fields?.find((field) => field.name === 'entries');
                        if (entriesField) {
                            indexEntries = [...entriesField.values];
                            return structuredClone(fragment);
                        }

                        const updated = {
                            ...(byId.get(fragment.id) || {}),
                            ...fragment,
                            fieldName: 'entries',
                        };
                        byId.set(updated.id, updated);
                        const referenceIndex = references.findIndex((reference) => reference.id === updated.id);
                        if (referenceIndex !== -1) references[referenceIndex] = updated;
                        return structuredClone(updated);
                    },
                    delete: async (fragment) => {
                        calls.delete.push(fragment.id);
                        byId.delete(fragment.id);
                        references = references.filter((reference) => reference.id !== fragment.id);
                        indexEntries = indexEntries.filter((path) => path !== fragment.path);
                    },
                    publish: async (fragment) => {
                        calls.publish.push(fragment.id);
                    },
                    unpublish: async (fragment) => {
                        calls.unpublish.push(fragment.id);
                    },
                },
            },
        },
    };

    return {
        aem,
        calls,
        getIndexEntries: () => [...indexEntries],
        getReferences: () => [...references],
    };
};

describe('Settings Store Namespace', () => {
    const { allTemplateIds, branchByTemplateId, templateIdsByBranch } = collectTemplateLeafMeta();
    const merchCardIds = allTemplateIds.filter((templateId) => branchByTemplateId.get(templateId) === 'Merch card');
    const otherTemplateId = allTemplateIds.find((templateId) => branchByTemplateId.get(templateId) !== 'Merch card');
    const crossBranchTemplateIds = [...templateIdsByBranch.values()].flatMap((ids) => ids.slice(0, 1));

    it('reuses row stores by fragment id', () => {
        const store = new SettingsStore();
        store.setSettingFragments([
            createSettingReference({ id: 'showPlanType', templates: ['catalog'], value: true }),
            createSettingReference({ id: 'displayAnnual', templates: ['catalog'], value: true }),
        ]);
        const firstStores = store.rows.get();
        const firstRow = firstStores[0];

        store.setSettingFragments([
            createSettingReference({ id: 'showPlanType', templates: ['catalog'], value: false }),
            createSettingReference({ id: 'displayAnnual', templates: ['catalog'], value: true }),
        ]);
        const secondStores = store.rows.get();
        expect(secondStores[0]).to.equal(firstRow);
        expect(secondStores[0].value.value).to.equal(false);
    });

    it('disposes removed rows', () => {
        const store = new SettingsStore();
        store.setSettingFragments([
            createSettingReference({ id: 'showAddon', templates: ['catalog'], value: true }),
            createSettingReference({ id: 'showPlanType', templates: ['catalog'], value: true }),
        ]);
        const removedStore = store.getRowStore('showPlanType');

        store.setSettingFragments([createSettingReference({ id: 'showAddon', templates: ['catalog'], value: true })]);

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

    it('keeps plain template count wording in toggle toast for cross-branch templates', async () => {
        const store = new SettingsStore();
        const templateIds = crossBranchTemplateIds.slice(0, 2);
        let currentValue = true;
        const reference = createSettingReference({
            id: 'setting-cross-branch',
            name: 'showSecureLabel',
            label: 'Show secure label',
            locales: [],
            templates: templateIds,
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
                            references: [reference],
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
                                { name: 'templates', type: 'text', multiple: true, values: templateIds },
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

        expect(store.toast.get().message).to.contain('applied to 2 templates selected for all locales');
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

    it('keeps first top-level fragment when names are duplicated', async () => {
        const topLevelA = createSettingReference({
            id: 'setting-quantity-select-a',
            name: 'quantitySelect',
            label: 'Quantity Select A',
            locales: [],
            path: '/content/dam/mas/sandbox/settings/quantityselect-all-all',
        });
        const topLevelB = createSettingReference({
            id: 'setting-quantity-select-b',
            name: 'quantitySelect',
            label: 'Quantity Select B',
            locales: [],
            path: '/content/dam/mas/sandbox/settings/quantityselect-all-all-abqp',
        });
        const nestedByName = createSettingReference({
            id: 'setting-quantity-select-fr',
            name: 'quantitySelect',
            label: 'Quantity Select Override',
            fieldName: 'entries',
            locales: ['fr_FR'],
            path: '/content/dam/mas/sandbox/settings/quantityselect-fr',
        });

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => ({
                            id: 'settings-index',
                            path: '/content/dam/mas/sandbox/settings/index',
                            fields: [{ name: 'entries', values: [topLevelA.path, topLevelB.path, nestedByName.path] }],
                            references: [topLevelA, topLevelB, nestedByName],
                        }),
                    },
                },
            },
        });

        await store.loadSurface('sandbox');

        const rows = store.rows.get().map((rowStore) => rowStore.value);
        expect(rows.length).to.equal(1);
        expect(rows.map((row) => row.id)).to.deep.equal(['setting-quantity-select-a']);
        expect(rows[0].overrides.map((override) => override.id)).to.deep.equal(['setting-quantity-select-fr']);
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
        const indexPath = '/content/dam/mas/sandbox/settings/index';

        const store = new SettingsStore();
        store.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async (path) => {
                            if (path !== indexPath) throw new Error('404');
                            return {
                                id: 'settings-index',
                                path,
                                fields: [{ name: 'entries', values: [...indexEntries] }],
                                references: [topLevel, nested].filter((reference) => indexEntries.includes(reference.path)),
                            };
                        },
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
        expect(createPayloads[0].name).to.equal('showplantype-frfr-plans');
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

    it('loads empty settings when index is missing and sets error for generic failures', async () => {
        const missingStore = new SettingsStore();
        missingStore.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => {
                            throw new Error('404 Not Found');
                        },
                    },
                },
            },
        });

        await missingStore.loadSurface('sandbox');
        expect(missingStore.rows.get()).to.deep.equal([]);
        expect(missingStore.error.get()).to.equal(null);

        const failedStore = new SettingsStore();
        failedStore.setAem({
            sites: {
                cf: {
                    fragments: {
                        getByPath: async () => {
                            throw new Error('something unexpected');
                        },
                    },
                },
            },
        });

        await failedStore.loadSurface('sandbox');
        expect(failedStore.rows.get()).to.deep.equal([]);
        expect(failedStore.error.get()).to.equal('Failed to load settings.');
    });

    it('updates source-driven rows and active tab state', () => {
        const store = new SettingsStore();
        const topLevel = createSettingReference({
            id: 'setting-show-addon',
            name: 'showAddon',
            label: 'Show addon',
            locales: [],
        });

        expect(store.getActiveTab('setting-show-addon')).to.equal('locale');
        store.setActiveTab('setting-show-addon', 'template');
        expect(store.getActiveTab('setting-show-addon')).to.equal('template');

        store.setSourceFragment(null);
        expect(store.rows.get()).to.deep.equal([]);
        expect(store.sourceFragment).to.equal(null);

        store.setSourceFragment({ references: [] });
        expect(store.rows.get()).to.deep.equal([]);

        store.setSourceFragment({ references: [topLevel] });
        expect(store.rows.get()).to.have.length(1);
        expect(store.sourceFragment.references).to.have.length(1);
    });

    it('reuses existing AEM client for matching bucket/baseUrl', () => {
        const store = new SettingsStore('bucket-a', 'https://example.com');
        store.initAem('bucket-a', 'https://example.com');
        const firstAem = store.aem;

        store.initAem('bucket-a', 'https://example.com');
        expect(store.aem).to.equal(firstAem);
    });

    it('adds and updates overrides including rich text valueType', async () => {
        const topLevel = createSettingReference({
            id: 'setting-display-plan-type',
            name: 'displayPlanType',
            label: 'Display plan type',
            locales: [],
            valueType: 'text',
            value: 'default',
            path: '/content/dam/mas/sandbox/settings/setting-display-plan-type',
        });
        const existingOverride = createSettingReference({
            id: 'setting-display-plan-type-fr',
            name: 'displayPlanType',
            label: 'Display plan type',
            locales: ['fr_FR'],
            valueType: 'text',
            value: 'bonjour',
            fieldName: 'entries',
            path: '/content/dam/mas/sandbox/settings/setting-display-plan-type-fr',
        });

        const harness = createMutationHarness({ topLevel, overrides: [existingOverride] });
        const store = new SettingsStore();
        store.setAem(harness.aem);
        await store.loadSurface('sandbox');

        const rowId = store.rows.get()[0].value.id;
        const allLocalesId = await store.addOverride(rowId, {
            locales: [],
            templateIds: ['catalog'],
            valueType: 'richText',
            value: '<p>hello</p>',
            booleanValue: true,
        });
        expect(allLocalesId).to.be.a('string');
        expect(harness.calls.create.length).to.equal(1);
        expect(harness.calls.create[0].name).to.equal('displayplantype-all-catalog');
        expect(harness.calls.create[0].fields.find((field) => field.name === 'locales').values).to.deep.equal([]);

        const createdId = await store.addOverride(rowId, {
            locales: ['de_DE'],
            templateIds: ['catalog'],
            valueType: 'richText',
            value: '<p>hello</p>',
            booleanValue: false,
            tags: ['mas:keyword/checkout'],
        });

        expect(createdId).to.be.a('string');
        expect(harness.calls.create.length).to.be.greaterThan(0);
        expect(harness.calls.create[harness.calls.create.length - 1].name).to.equal('displayplantype-dede-catalog');
        const createFields = harness.calls.create[harness.calls.create.length - 1].fields;
        expect(createFields.find((field) => field.name === 'richTextValue').values).to.deep.equal(['<p>hello</p>']);
        expect(createFields.find((field) => field.name === 'valuetype').values).to.deep.equal(['richText']);

        const overrideId = store.rows.get()[0].value.overrides.find((item) => item.id === existingOverride.id).id;
        const updatedAllLocales = await store.updateOverride(rowId, overrideId, {
            locales: [],
            templateIds: ['plans'],
            value: 'updated',
        });
        expect(updatedAllLocales).to.equal(true);
        expect(harness.calls.save.find((fragment) => fragment.id === overrideId).title).to.equal('Display plan type');

        const updated = await store.updateOverride(rowId, overrideId, {
            locales: ['it_IT'],
            templateIds: ['plans'],
            tags: ['mas:keyword/renewal'],
            valueType: 'text',
            value: 'updated',
            booleanValue: true,
        });
        expect(updated).to.equal(true);
        const savedOverride = harness.calls.save.filter((fragment) => fragment.id === overrideId).at(-1);
        expect(savedOverride.title).to.equal('Display plan type it_IT');
    });

    it('creates and updates settings, including sparse legacy fragment fields', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-secure-label',
            name: 'showSecureLabel',
            label: 'Show secure label',
            locales: [],
            valueType: 'text',
            value: 'old-value',
            path: '/content/dam/mas/sandbox/settings/setting-show-secure-label',
        });
        const harness = createMutationHarness({ topLevel, overrides: [] });
        const store = new SettingsStore();
        store.setAem(harness.aem);
        await store.loadSurface('sandbox');

        const createdId = await store.createSetting({
            name: 'showAddon',
            label: 'Show Addon',
            description: 'new setting',
            templateIds: ['catalog'],
            tags: ['mas:keyword/checkout'],
            valueType: 'boolean',
            value: true,
            booleanValue: true,
        });
        expect(createdId).to.be.a('string');
        expect(harness.calls.create[0].name).to.equal('showaddon-all-catalog');

        harness.aem.sites.cf.fragments.getById = async (id) => {
            if (id === topLevel.id) {
                return {
                    id,
                    path: topLevel.path,
                    title: topLevel.title,
                    description: topLevel.description,
                    fields: [],
                };
            }
            const fragment = harness.getReferences().find((reference) => reference.id === id);
            return structuredClone(fragment);
        };

        const updated = await store.updateSetting(topLevel.id, {
            label: 'Show secure label updated',
            description: 'updated description',
            templateIds: ['plans'],
            tags: ['mas:keyword/renewal'],
            valueType: 'text',
            value: '{{placeholder}}',
            booleanValue: false,
        });
        expect(updated).to.equal(true);
        const latestSave = harness.calls.save[harness.calls.save.length - 1];
        expect(latestSave.fields.find((field) => field.name === 'name').values).to.deep.equal(['showSecureLabel']);
        expect(latestSave.fields.find((field) => field.name === 'textValue').values).to.deep.equal(['{{placeholder}}']);
    });

    it('blocks create when top-level setting with same name already exists', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-addon-existing',
            name: 'showAddon',
            label: 'Show Addon',
            locales: [],
            templates: ['catalog'],
            path: '/content/dam/mas/sandbox/settings/showaddon-all-catalog',
        });
        const harness = createMutationHarness({ topLevel, overrides: [] });
        const store = new SettingsStore();
        store.setAem(harness.aem);
        await store.loadSurface('sandbox');

        const createdId = await store.createSetting({
            name: 'showAddon',
            label: 'Show Addon',
            templateIds: ['catalog'],
            valueType: 'boolean',
            value: true,
            booleanValue: true,
        });

        expect(createdId).to.equal(null);
        expect(harness.calls.create).to.deep.equal([]);
    });

    it('removes draft settings and supports publish/unpublish paths', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-addon',
            name: 'showAddon',
            label: 'Show Addon',
            status: 'DRAFT',
            locales: [],
            path: '/content/dam/mas/sandbox/settings/setting-show-addon',
        });
        const override = createSettingReference({
            id: 'setting-show-addon-fr',
            name: 'showAddon',
            label: 'Show Addon',
            locales: ['fr_FR'],
            fieldName: 'entries',
            path: '/content/dam/mas/sandbox/settings/setting-show-addon-fr',
        });
        const harness = createMutationHarness({ topLevel, overrides: [override] });
        const store = new SettingsStore();
        store.setAem(harness.aem);
        await store.loadSurface('sandbox');

        const removed = await store.removeSetting(topLevel.id);
        expect(removed).to.equal(true);
        expect(harness.calls.delete).to.include(topLevel.id);
        expect(harness.calls.delete).to.include(override.id);
        expect(harness.getIndexEntries()).to.deep.equal([]);

        const publishSettingResult = await store.publishSetting('setting-show-addon');
        const publishOverrideResult = await store.publishOverride('setting-show-addon-fr');
        const unpublishResult = await store.unpublishSetting('setting-show-addon');
        expect(publishSettingResult).to.equal(true);
        expect(publishOverrideResult).to.equal(true);
        expect(unpublishResult).to.equal(true);
        expect(harness.calls.publish).to.deep.equal(['setting-show-addon', 'setting-show-addon-fr']);
        expect(harness.calls.unpublish).to.deep.equal(['setting-show-addon']);
    });

    it('removes settings index entries before deleting draft top-level settings', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-addon',
            name: 'showAddon',
            label: 'Show Addon',
            status: 'DRAFT',
            locales: [],
            path: '/content/dam/mas/sandbox/settings/setting-show-addon',
        });
        const override = createSettingReference({
            id: 'setting-show-addon-fr',
            name: 'showAddon',
            label: 'Show Addon',
            locales: ['fr_FR'],
            fieldName: 'entries',
            path: '/content/dam/mas/sandbox/settings/setting-show-addon-fr',
        });
        const harness = createMutationHarness({ topLevel, overrides: [override] });

        let indexSaved = false;
        let deletedBeforeIndexUpdate = false;
        const originalSave = harness.aem.sites.cf.fragments.save;
        const originalDelete = harness.aem.sites.cf.fragments.delete;

        harness.aem.sites.cf.fragments.save = async (fragment) => {
            if (fragment?.id === 'settings-index') indexSaved = true;
            return originalSave(fragment);
        };

        harness.aem.sites.cf.fragments.delete = async (fragment) => {
            if (!indexSaved) deletedBeforeIndexUpdate = true;
            return originalDelete(fragment);
        };

        const store = new SettingsStore();
        store.setAem(harness.aem);
        await store.loadSurface('sandbox');

        const removed = await store.removeSetting(topLevel.id);
        expect(removed).to.equal(true);
        expect(deletedBeforeIndexUpdate).to.equal(false);
    });

    it('restores undeleted index entries when draft setting deletion fails', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-addon',
            name: 'showAddon',
            label: 'Show Addon',
            status: 'DRAFT',
            locales: [],
            path: '/content/dam/mas/sandbox/settings/setting-show-addon',
        });
        const override = createSettingReference({
            id: 'setting-show-addon-fr',
            name: 'showAddon',
            label: 'Show Addon',
            locales: ['fr_FR'],
            fieldName: 'entries',
            path: '/content/dam/mas/sandbox/settings/setting-show-addon-fr',
        });
        const harness = createMutationHarness({ topLevel, overrides: [override] });
        const originalDelete = harness.aem.sites.cf.fragments.delete;

        harness.aem.sites.cf.fragments.delete = async (fragment) => {
            if (fragment.id === topLevel.id) {
                throw new Error('top-level delete failed');
            }
            return originalDelete(fragment);
        };

        const store = new SettingsStore();
        store.setAem(harness.aem);
        await store.loadSurface('sandbox');

        const removed = await store.removeSetting(topLevel.id);
        expect(removed).to.equal(false);
        expect(harness.calls.delete).to.include(override.id);
        expect(harness.calls.delete).to.not.include(topLevel.id);
        expect(harness.getIndexEntries()).to.deep.equal([topLevel.path]);
    });

    it('duplicates override with multiple locales', async () => {
        const topLevel = createSettingReference({
            id: 'setting-display-plan-type',
            name: 'displayPlanType',
            label: 'Display plan type',
            locales: [],
            valueType: 'text',
            value: 'default',
            path: '/content/dam/mas/sandbox/settings/setting-display-plan-type',
        });
        const override = createSettingReference({
            id: 'setting-display-plan-type-multi',
            name: 'displayPlanType',
            label: 'Display plan type',
            locales: ['de_DE', 'fr_FR'],
            fieldName: 'entries',
            valueType: 'text',
            value: 'regional',
            path: '/content/dam/mas/sandbox/settings/setting-display-plan-type-multi',
        });

        const harness = createMutationHarness({ topLevel, overrides: [override] });
        const store = new SettingsStore();
        store.setAem(harness.aem);
        await store.loadSurface('sandbox');

        const duplicatedSettingId = await store.duplicateSetting(topLevel.id);
        expect(duplicatedSettingId).to.equal(null);
        expect(harness.calls.create).to.deep.equal([]);

        const row = store.rows.get()[0].value;
        const duplicatedOverride = await store.duplicateOverride(row.id, row.overrides[0].id);
        expect(duplicatedOverride).to.equal(true);
        const lastCreatePayload = harness.calls.create[0];
        expect(lastCreatePayload.fields.find((field) => field.name === 'locales').values).to.deep.equal(['de_DE', 'fr_FR']);
        expect(lastCreatePayload.name).to.equal('displayplantype-dede-frfr-all');
    });

    it('handles duplicate setting block, markPublished and edit action', async () => {
        const topLevel = createSettingReference({
            id: 'setting-show-addon',
            name: 'showAddon',
            label: 'Show Addon',
            status: 'DRAFT',
            locales: [],
            path: '/content/dam/mas/sandbox/settings/setting-show-addon',
        });
        const harness = createMutationHarness({ topLevel, overrides: [] });
        const store = new SettingsStore();
        store.setAem(harness.aem);
        await store.loadSurface('sandbox');

        const duplicated = await store.duplicateSetting(topLevel.id);
        expect(duplicated).to.equal(null);
        expect(store.error.get()).to.equal(null);

        store.markPublished(topLevel.id);
        expect(store.getRowStore(topLevel.id).value.data.published).to.equal(true);
        expect(store.toast.get().variant).to.equal('positive');

        store.editSetting();
    });
});
