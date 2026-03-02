import { AEM } from '../aem/aem.js';
import { Fragment } from '../aem/fragment.js';
import { ROOT_PATH } from '../constants.js';
import { ReactiveStore } from '../reactivity/reactive-store.js';
import { showToast, normalizeKey } from '../utils.js';
import { SettingStore, normalizeSettingFragment } from './setting-store.js';
import { TEMPLATE_TREE_DATA } from './template-tree-data.js';

const INDEX_REFERENCES_FIELD = 'entries';
const INDEX_NOT_FOUND_MESSAGES = ['404', 'Fragment not found'];
const SETTINGS_ENTRY_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3NldHRpbmdzLWVudHJ5';

const isBooleanValue = (value) => value === true || value === false;

const upsertField = (fields, field) => {
    const existingIndex = fields.findIndex((item) => item.name === field.name);
    if (existingIndex === -1) {
        fields.push(field);
        return;
    }

    fields[existingIndex] = {
        ...fields[existingIndex],
        ...field,
    };
};

const buildValueFields = (valueType, value, booleanValue) => {
    const fields = [
        { name: 'textValue', type: 'text', multiple: false, values: [] },
        { name: 'richTextValue', type: 'long-text', multiple: false, mimeType: 'text/html', values: [] },
        { name: 'booleanValue', type: 'boolean', multiple: false, values: [Boolean(booleanValue)] },
    ];

    if (valueType === 'boolean') {
        fields[2].values = [Boolean(booleanValue)];
        return fields;
    }

    if (valueType === 'richText') {
        fields[1].values = [`${value ?? ''}`];
        return fields;
    }

    fields[0].values = [`${value ?? ''}`];
    return fields;
};

const resolveBooleanValue = (valueType, value, booleanValue) =>
    valueType === 'boolean' ? Boolean(value) : Boolean(booleanValue);

/**
 * Flattens template tree leaves and maps each leaf to its immediate branch label.
 *
 * @param {Array<{name: string, label?: string, children?: Array}>} tree
 * @returns {{leafIds: Set<string>, branchByLeafId: Map<string, string>}}
 */
const buildTemplateLeafIndex = (tree = TEMPLATE_TREE_DATA) => {
    const leafIds = new Set();
    const branchByLeafId = new Map();

    const visitNode = (node, branchLabel = '') => {
        const nodeId = `${node.name}`;
        if (!nodeId) return;

        const children = node.children || [];
        if (!children.length) {
            leafIds.add(nodeId);
            branchByLeafId.set(nodeId, branchLabel || `${node.label || nodeId}`);
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

    return { leafIds, branchByLeafId };
};

/**
 * Settings table state holder and mutator surface.
 */
export class SettingsStore {
    fragmentId = new ReactiveStore(null);
    creating = new ReactiveStore(false);
    rows = new ReactiveStore([]);
    loading = new ReactiveStore(false);
    error = new ReactiveStore(null);
    expandedRowIds = new ReactiveStore([]);
    activeTabByRowId = new ReactiveStore({});
    toast = new ReactiveStore(null);

    bucket = '';
    baseUrl = '';
    aem = null;

    #templateLeafIndex = buildTemplateLeafIndex();
    #sourceFragment = null;
    #surface = '';

    constructor(bucket = '', baseUrl = '') {
        this.bucket = bucket;
        this.baseUrl = baseUrl;
    }

    get sourceFragment() {
        return this.#sourceFragment;
    }

    get #settingsPath() {
        return `${ROOT_PATH}/${this.#surface}/settings`;
    }

    get #indexPath() {
        return `${this.#settingsPath}/index`;
    }

    get #entryModelId() {
        return this.rows.get()[0]?.value.fragment?.model?.id || SETTINGS_ENTRY_MODEL_ID;
    }

    initAem(bucket = '', baseUrl = '') {
        if (bucket === this.bucket && baseUrl === this.baseUrl && this.aem) return;

        this.bucket = bucket;
        this.baseUrl = baseUrl;
        this.aem = new AEM(this.bucket, this.baseUrl);
    }

    setAem(aem) {
        this.aem = aem;
    }

    async loadSurface(surface) {
        this.#surface = surface || '';
        if (!this.#surface) {
            this.error.set(null);
            this.setSettingFragments([]);
            return;
        }

        if (!this.aem) return;

        this.loading.set(true);
        this.error.set(null);

        try {
            const indexFragment = await this.aem.sites.cf.fragments.getByPath(this.#indexPath, {
                references: 'direct-hydrated',
            });
            this.#setRowsFromIndex(indexFragment);
        } catch (error) {
            if (INDEX_NOT_FOUND_MESSAGES.some((message) => error.message.includes(message))) {
                this.setSettingFragments([]);
                return;
            }
            this.error.set('Failed to load settings.');
            showToast('Failed to load settings.', 'negative');
            this.setSettingFragments([], new Map(), false);
        } finally {
            this.loading.set(false);
        }
    }

    setSourceFragment(fragment) {
        this.#sourceFragment = fragment;
        this.#syncRowsFromSource();
    }

    setSettingFragments(fragments, recordOverrides = new Map(), resetError = true) {
        this.loading.set(true);
        if (resetError) this.error.set(null);

        const currentRowsById = new Map(this.rows.get().map((rowStore) => [rowStore.value.id, rowStore]));
        const nextRows = [];
        const nextIds = new Set();

        for (const fragmentData of fragments) {
            const fragment = new Fragment(fragmentData);
            const id = fragment.id;
            nextIds.add(id);

            const existingStore = currentRowsById.get(id);
            const record = recordOverrides.get(id);
            const rowStore = existingStore || new SettingStore(fragment, record);
            if (existingStore && record) existingStore.refreshFromRecord(record);
            if (existingStore && !record) existingStore.refreshFromFragment(fragment);
            currentRowsById.delete(id);

            if (!record) {
                rowStore.setTemplateSummary(this.formatTemplateSummary(rowStore.value.templateIds));
            }
            nextRows.push(rowStore);
        }

        for (const [, store] of currentRowsById) {
            store.dispose();
        }

        this.expandedRowIds.set(this.expandedRowIds.get().filter((id) => nextIds.has(id)));
        const activeTabs = this.activeTabByRowId.get();
        this.activeTabByRowId.set(Object.fromEntries(Object.entries(activeTabs).filter(([id]) => nextIds.has(id))));
        this.rows.set(nextRows);
        this.loading.set(false);
    }

    getRowStore(rowId) {
        return this.rows.get().find((rowStore) => rowStore.value.id === rowId) || null;
    }

    toggleExpanded(rowId) {
        const current = this.expandedRowIds.get();
        const next = current.includes(rowId) ? current.filter((id) => id !== rowId) : [...current, rowId];
        this.expandedRowIds.set(next);
    }

    isExpanded(rowId) {
        return this.expandedRowIds.get().includes(rowId);
    }

    ensureExpanded(rowId) {
        if (this.isExpanded(rowId)) return;
        this.expandedRowIds.set([...this.expandedRowIds.get(), rowId]);
    }

    getOverrideContext(overrideId) {
        for (const rowStore of this.rows.get()) {
            const row = rowStore.value;
            const override = row.overrides.find((item) => item.id === overrideId);
            if (!override) continue;
            return { rowStore, row, override };
        }
        return null;
    }

    getActiveTab(rowId) {
        return this.activeTabByRowId.get()[rowId] || 'locale';
    }

    setActiveTab(rowId, tab) {
        this.activeTabByRowId.set({
            ...this.activeTabByRowId.get(),
            [rowId]: tab,
        });
    }

    async toggleSetting(rowId, checked) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;
        const state = checked ? 'On' : 'Off';
        const templatePhrase = this.#templateSummaryToSentence(rowStore.value.templateSummary);
        const message = `'${rowStore.value.label}' is now [${state}]. The change has been applied to ${templatePhrase} for all locales.`;

        const updated = await this.#updateSettingFragment(
            rowStore,
            {
                valueType: rowStore.value.valueType,
                value: rowStore.value.valueType === 'boolean' ? checked : rowStore.value.value,
                booleanValue: checked,
            },
            message,
            'Failed to update setting.',
        );

        if (!updated) return false;

        this.toast.set({
            message,
        });
        return true;
    }

    async toggleOverride(rowId, overrideId, checked) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;
        const row = rowStore.value;
        const override = row.overrides.find((item) => item.id === overrideId);
        if (!override) return false;

        const localeLabel = override.locales.join(', ');
        const state = checked ? 'On' : 'Off';
        const message = `'${row.label} (${localeLabel})' is now [${state}].`;

        const updated = await this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getById(override.id);
                const fields = structuredClone(fragment.fields);
                const valueType = override.valueType || row.valueType;
                const value = valueType === 'boolean' ? checked : override.value;
                const valueFields = buildValueFields(valueType, value, checked);

                upsertField(fields, { name: 'name', type: 'text', multiple: false, values: [row.name] });
                upsertField(fields, {
                    name: 'templates',
                    type: 'text',
                    multiple: true,
                    values: override.templateIds,
                });
                upsertField(fields, { name: 'locales', type: 'text', multiple: true, values: override.locales });
                upsertField(fields, { name: 'tags', type: 'tag', multiple: true, values: override.tags });
                upsertField(fields, { name: 'valuetype', type: 'text', multiple: false, values: [valueType] });
                for (const valueField of valueFields) {
                    upsertField(fields, valueField);
                }

                await this.aem.sites.cf.fragments.save({
                    ...fragment,
                    fields,
                });
            },
            message,
            'Failed to update override.',
        );

        if (!updated) return false;

        this.toast.set({
            message,
        });
        return true;
    }

    async addOverride(rowId, override = {}) {
        const rowStore = this.getRowStore(rowId);
        const row = rowStore.value;
        const settingName = row.name;
        const locales = [...override.locales];
        let createdOverrideId = null;
        if (!locales.length) {
            showToast('Locale is required for overrides.', 'negative');
            return null;
        }
        const valueType = override.valueType || row.valueType || (isBooleanValue(override.value) ? 'boolean' : 'text');
        const booleanValue = resolveBooleanValue(valueType, override.value, override.booleanValue);
        const localeSegment = locales.map((locale) => normalizeKey(locale)).join('-');
        const localeTitle = locales.join(', ');
        const fragmentName = `${normalizeKey(settingName)}-${localeSegment}-${Date.now()}`;

        const created = await this.#runMutation(
            async () => {
                const created = await this.aem.sites.cf.fragments.create({
                    name: fragmentName,
                    title: `${row.label} ${localeTitle}`,
                    description: row.description || '',
                    parentPath: this.#settingsPath,
                    modelId: row.fragment?.model?.id || this.#entryModelId,
                    fields: this.#buildEntryFields({
                        name: settingName,
                        templateIds: override.templateIds || [],
                        locales,
                        tags: override.tags || [],
                        valueType,
                        value: override.value,
                        booleanValue,
                    }),
                });

                createdOverrideId = created.id;
                await this.#addPathsToIndex([created.path]);
            },
            'Override added.',
            'Failed to add override.',
        );
        if (!created) return null;
        return createdOverrideId;
    }

    async updateOverride(rowId, overrideId, override = {}) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;
        const row = rowStore.value;
        const currentOverride = row.overrides.find((item) => item.id === overrideId);
        if (!currentOverride) return false;

        const locales = [...(override.locales || [])];
        if (!locales.length) {
            showToast('Locale is required for overrides.', 'negative');
            return false;
        }
        const valueType =
            override.valueType ||
            currentOverride.valueType ||
            row.valueType ||
            (isBooleanValue(override.value) ? 'boolean' : 'text');
        const booleanValue = resolveBooleanValue(valueType, override.value, override.booleanValue);

        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getById(overrideId);
                const fields = structuredClone(fragment.fields);
                const valueFields = buildValueFields(valueType, override.value, booleanValue);

                upsertField(fields, { name: 'name', type: 'text', multiple: false, values: [row.name] });
                upsertField(fields, {
                    name: 'templates',
                    type: 'text',
                    multiple: true,
                    values: override.templateIds || [],
                });
                upsertField(fields, { name: 'locales', type: 'text', multiple: true, values: locales });
                upsertField(fields, { name: 'tags', type: 'tag', multiple: true, values: override.tags || [] });
                upsertField(fields, { name: 'valuetype', type: 'text', multiple: false, values: [valueType] });
                for (const valueField of valueFields) {
                    upsertField(fields, valueField);
                }

                await this.aem.sites.cf.fragments.save({
                    ...fragment,
                    title: `${row.label} ${locales.join(', ')}`,
                    fields,
                });
            },
            'Override updated.',
            'Failed to update override.',
        );
    }

    async createSetting(setting) {
        const settingName = setting.name;
        const valueType = setting.valueType || (isBooleanValue(setting.value) ? 'boolean' : 'text');
        const booleanValue = resolveBooleanValue(valueType, setting.value, setting.booleanValue);
        let createdFragmentId = null;

        const created = await this.#runMutation(
            async () => {
                const created = await this.aem.sites.cf.fragments.create({
                    name: normalizeKey(settingName),
                    title: setting.label || settingName,
                    description: setting.description || '',
                    parentPath: this.#settingsPath,
                    modelId: this.#entryModelId,
                    fields: this.#buildEntryFields({
                        name: settingName,
                        templateIds: setting.templateIds || [],
                        locales: [],
                        tags: setting.tags || [],
                        valueType,
                        value: setting.value,
                        booleanValue,
                    }),
                });

                createdFragmentId = created.id;
                await this.#addPathsToIndex([created.path]);
            },
            'Setting created.',
            'Failed to create setting.',
        );
        if (!created) return null;
        return createdFragmentId;
    }

    async updateSetting(rowId, setting) {
        const rowStore = this.getRowStore(rowId);
        return this.#updateSettingFragment(
            rowStore,
            {
                label: setting.label || rowStore.value.label,
                description: setting.description || '',
                templateIds: setting.templateIds || [],
                tags: setting.tags || [],
                valueType:
                    setting.valueType || rowStore.value.valueType || (isBooleanValue(setting.value) ? 'boolean' : 'text'),
                value: setting.value,
                booleanValue: setting.booleanValue,
            },
            'Setting updated.',
            'Failed to update setting.',
        );
    }

    async removeSetting(rowId) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;
        const row = rowStore.value;
        if (row.locales.length === 0 && `${row.status || ''}`.toUpperCase() !== 'DRAFT') {
            showToast('Top-level settings cannot be deleted.', 'negative');
            return false;
        }
        const fragmentIds = [row.id, ...row.overrides.map((override) => override.id)];
        const fragmentPaths = [row.fragment.path, ...row.overrides.map((override) => override.path)];

        return this.#runMutation(
            async () => {
                await Promise.all(
                    fragmentIds.map(async (id) => {
                        const fragment = await this.aem.sites.cf.fragments.getById(id);
                        await this.aem.sites.cf.fragments.delete(fragment);
                    }),
                );
                await this.#removePathsFromIndex(fragmentPaths);
            },
            'Setting deleted.',
            'Failed to delete setting.',
        );
    }

    async removeOverride(rowId, overrideId) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;
        const row = rowStore.value;
        const override = row.overrides.find((item) => item.id === overrideId);
        if (!override) return false;

        return this.#runMutation(
            async () => {
                await this.#removePathsFromIndex([override.path]);

                const fragment = await this.aem.sites.cf.fragments.getById(override.id);
                await this.aem.sites.cf.fragments.delete(fragment);
            },
            'Override deleted.',
            'Failed to delete override.',
        );
    }

    editSetting() {
        showToast('Edit action moved to dialog flow.');
    }

    async publishSetting(rowId) {
        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getWithEtag(rowId);
                await this.aem.sites.cf.fragments.publish(fragment);
            },
            'Setting has been successfully published.',
            'Failed to publish setting.',
        );
    }

    async publishOverride(overrideId) {
        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getWithEtag(overrideId);
                await this.aem.sites.cf.fragments.publish(fragment);
            },
            'Override has been successfully published.',
            'Failed to publish override.',
        );
    }

    async unpublishSetting(rowId) {
        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getWithEtag(rowId);
                await this.aem.sites.cf.fragments.unpublish(fragment);
            },
            'Setting has been successfully unpublished.',
            'Failed to unpublish setting.',
        );
    }

    async duplicateSetting(rowId) {
        const rowStore = this.getRowStore(rowId);
        const row = rowStore.value;
        let duplicatedFragmentId = null;

        const duplicated = await this.#runMutation(
            async () => {
                const created = await this.aem.sites.cf.fragments.create({
                    name: `${normalizeKey(row.name)}-copy-${Date.now()}`,
                    title: `${row.label} copy`,
                    description: row.description || '',
                    parentPath: this.#settingsPath,
                    modelId: row.fragment?.model?.id || this.#entryModelId,
                    fields: this.#buildEntryFields({
                        name: row.name,
                        templateIds: row.templateIds || [],
                        locales: [],
                        tags: row.tags || [],
                        valueType: row.valueType || (isBooleanValue(row.value) ? 'boolean' : 'text'),
                        value: row.value,
                        booleanValue: row.booleanValue,
                    }),
                });

                duplicatedFragmentId = created.id;
                await this.#addPathsToIndex([created.path]);
            },
            'Setting duplicated as draft.',
            'Failed to duplicate setting.',
        );
        if (!duplicated) return null;
        return duplicatedFragmentId;
    }

    async duplicateOverride(rowId, overrideId) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;
        const row = rowStore.value;
        const override = row.overrides.find((item) => item.id === overrideId);
        if (!override) return false;

        const locales = override.locales?.length
            ? override.locales
            : `${override.locale || ''}`
                  .split(',')
                  .map((locale) => locale.trim())
                  .filter((locale) => locale);
        const localeKey = locales.join('-') || 'override';
        const valueType = override.valueType || row.valueType || (isBooleanValue(override.value) ? 'boolean' : 'text');
        const booleanValue = resolveBooleanValue(valueType, override.value, override.booleanValue);

        return this.#runMutation(
            async () => {
                const created = await this.aem.sites.cf.fragments.create({
                    name: `${normalizeKey(row.name)}-${normalizeKey(localeKey)}-copy-${Date.now()}`,
                    title: `${override.label || row.label} ${override.locale || ''} copy`.trim(),
                    description: row.description || '',
                    parentPath: this.#settingsPath,
                    modelId: row.fragment?.model?.id || this.#entryModelId,
                    fields: this.#buildEntryFields({
                        name: row.name,
                        templateIds: override.templateIds || [],
                        locales,
                        tags: override.tags || [],
                        valueType,
                        value: override.value,
                        booleanValue,
                    }),
                });

                await this.#addPathsToIndex([created.path]);
            },
            'Override duplicated as draft.',
            'Failed to duplicate override.',
        );
    }

    markPublished(rowId) {
        const rowStore = this.getRowStore(rowId);
        rowStore.patchData({ published: true });
        this.toast.set({
            variant: 'positive',
            message: 'Setting has been successfully published.',
        });
    }

    /**
     * Summarizes selected template IDs for settings table display.
     *
     * Rules:
     * 1. When no valid template IDs are selected, returns `All templates selected`.
     * 2. When all valid templates are selected, returns `All templates selected`.
     * 3. When all selected templates belong to the same branch/category, returns
     *    `<Branch label> (<count> selected)`.
     * 4. Otherwise, returns `<count> templates selected`.
     *
     * Edge-case handling:
     * - Duplicate template IDs are de-duplicated before counting.
     * - Unknown/invalid template IDs are ignored.
     *
     * @param {string[]} selectedTemplateIds
     * @returns {string}
     */
    formatTemplateSummary(selectedTemplateIds) {
        const selected = [...new Set(selectedTemplateIds.filter((id) => id))];
        const normalizedSelected = selected.filter((id) => this.#templateLeafIndex.leafIds.has(id));

        if (normalizedSelected.length === 0 || normalizedSelected.length === this.#templateLeafIndex.leafIds.size) {
            return 'All templates selected';
        }

        const selectedBranches = [
            ...new Set(
                normalizedSelected.map((id) => this.#templateLeafIndex.branchByLeafId.get(id) || `${id}`),
            ),
        ];
        if (selectedBranches.length === 1) {
            return `${selectedBranches[0]} (${normalizedSelected.length} selected)`;
        }

        return `${normalizedSelected.length} templates selected`;
    }

    destroy() {
        for (const store of this.rows.get()) {
            store.dispose();
        }

        this.rows.set([]);
        this.expandedRowIds.set([]);
        this.activeTabByRowId.set({});
        this.toast.set(null);
    }

    async #runMutation(operation, successMessage, errorMessage, successVariant = '') {
        this.loading.set(true);
        this.error.set(null);

        try {
            await operation();
            await this.loadSurface(this.#surface);
            showToast(successMessage, successVariant);
            return true;
        } catch (error) {
            this.error.set(errorMessage);
            showToast(errorMessage, 'negative');
            return false;
        } finally {
            this.loading.set(false);
        }
    }

    async #updateSettingFragment(rowStore, patch, successMessage, errorMessage = successMessage, successVariant) {
        const row = rowStore.value;

        const updated = await this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getById(row.id);
                const fields = structuredClone(fragment.fields);
                const valueType = patch.valueType || row.valueType || (isBooleanValue(patch.value) ? 'boolean' : 'text');
                const booleanValue = resolveBooleanValue(valueType, patch.value, patch.booleanValue);
                const valueFields = buildValueFields(valueType, patch.value, booleanValue);

                upsertField(fields, { name: 'name', type: 'text', multiple: false, values: [row.name] });
                upsertField(fields, {
                    name: 'templates',
                    type: 'text',
                    multiple: true,
                    values: patch.templateIds || row.templateIds,
                });
                upsertField(fields, { name: 'locales', type: 'text', multiple: true, values: [] });
                upsertField(fields, { name: 'tags', type: 'tag', multiple: true, values: patch.tags || row.tags || [] });
                upsertField(fields, { name: 'valuetype', type: 'text', multiple: false, values: [valueType] });
                for (const valueField of valueFields) {
                    upsertField(fields, valueField);
                }

                await this.aem.sites.cf.fragments.save({
                    ...fragment,
                    title: patch.label || row.label,
                    description: patch.description ?? row.description ?? '',
                    fields,
                });
            },
            successMessage,
            errorMessage,
            successVariant,
        );

        if (!updated) return false;

        return true;
    }

    async #addPathsToIndex(paths = []) {
        const indexFragment = new Fragment(await this.aem.sites.cf.fragments.getByPath(this.#indexPath));
        const entries = indexFragment.getFieldValues(INDEX_REFERENCES_FIELD);
        const nextEntries = [...entries];

        for (const path of paths) {
            if (nextEntries.includes(path)) continue;
            nextEntries.push(path);
        }

        if (nextEntries.length === entries.length) return;

        indexFragment.updateField(INDEX_REFERENCES_FIELD, nextEntries);
        await this.aem.sites.cf.fragments.save(indexFragment);
    }

    async #removePathsFromIndex(paths = []) {
        const indexFragment = new Fragment(await this.aem.sites.cf.fragments.getByPath(this.#indexPath));
        const entries = indexFragment.getFieldValues(INDEX_REFERENCES_FIELD);
        const nextEntries = entries.filter((entry) => !paths.includes(entry));

        if (nextEntries.length === entries.length) return;

        indexFragment.updateField(INDEX_REFERENCES_FIELD, nextEntries);
        await this.aem.sites.cf.fragments.save(indexFragment);
    }

    #buildEntryFields({ name, templateIds, locales, tags, valueType, value, booleanValue }) {
        const fields = [
            { name: 'name', type: 'text', multiple: false, values: [name] },
            { name: 'templates', type: 'text', multiple: true, values: templateIds },
            { name: 'locales', type: 'text', multiple: true, values: locales },
            { name: 'tags', type: 'tag', multiple: true, values: tags },
            { name: 'valuetype', type: 'text', multiple: false, values: [valueType] },
        ];

        return [...fields, ...buildValueFields(valueType, value, booleanValue)];
    }

    #syncRowsFromSource() {
        if (!this.#sourceFragment) {
            this.setSettingFragments([]);
            return;
        }

        const references = this.#sourceFragment.references || [];
        if (!references.length) {
            this.setSettingFragments([]);
            return;
        }

        this.setSettingFragments(references);
    }

    #setRowsFromIndex(indexFragmentData) {
        const references = indexFragmentData.references || [];
        const topLevelByName = new Map();
        const nestedByKey = new Map();

        for (const reference of references) {
            const fragment = new Fragment(reference);
            const record = normalizeSettingFragment(fragment);
            const hasLocales = record.locales.length > 0;
            const fieldName = reference.fieldName || INDEX_REFERENCES_FIELD;

            if (fieldName === INDEX_REFERENCES_FIELD && !hasLocales && !topLevelByName.has(record.name)) {
                topLevelByName.set(record.name, fragment);
                continue;
            }

            if (!hasLocales) continue;

            const nestedKey = fieldName === INDEX_REFERENCES_FIELD ? record.name : fieldName;
            if (!nestedByKey.has(nestedKey)) nestedByKey.set(nestedKey, []);
            nestedByKey.get(nestedKey).push(fragment);
        }

        const topLevelFragments = [];
        const recordOverrides = new Map();

        for (const [name, fragment] of topLevelByName) {
            const topRecord = normalizeSettingFragment(fragment);
            const nestedFragments = [...(nestedByKey.get(name) || []), ...(nestedByKey.get(fragment.id) || [])];
            const overrides = nestedFragments.map((nestedFragment) => this.#createOverride(nestedFragment, topRecord.label));

            const rowRecord = {
                ...topRecord,
                locale: 'All',
                locales: [],
                overrides,
                templateSummary: this.formatTemplateSummary(topRecord.templateIds),
            };

            topLevelFragments.push(fragment);
            recordOverrides.set(fragment.id, rowRecord);
        }

        this.setSettingFragments(topLevelFragments, recordOverrides);
    }

    #createOverride(fragment, fallbackLabel) {
        const record = normalizeSettingFragment(fragment);
        return {
            id: record.id,
            path: record.fragment.path,
            label: record.label || fallbackLabel,
            locales: record.locales,
            locale: record.locales.join(', '),
            templateIds: record.templateIds,
            template: this.formatTemplateSummary(record.templateIds),
            value: record.value,
            booleanValue: record.booleanValue,
            valueType: record.valueType,
            tags: record.tags,
            modifiedBy: record.modifiedBy,
            modifiedAt: record.modifiedAt,
            status: record.status,
        };
    }

    #templateSummaryToSentence(summary) {
        if (summary === 'All templates selected') return 'all templates';
        const categorySummary = summary.match(/^(.+)\s\(\d+\sselected\)$/i);
        if (categorySummary) return `the ${categorySummary[1]} template`;
        return summary;
    }
}
