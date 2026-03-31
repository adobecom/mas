import { AEM } from '../aem/aem.js';
import { Fragment } from '../aem/fragment.js';
import { ROOT_PATH } from '../constants.js';
import { ReactiveStore } from '../reactivity/reactive-store.js';
import { showToast, normalizeKey } from '../utils.js';
import { createTreeSelectionSummary } from '../common/fields/tree-picker-field.js';
import { getVariantTreeData } from '../editors/variant-picker.js';
import {
    extractValue,
    resolveSettingEntry,
    SETTING_NAME_BY_VALUE,
} from '../../../io/www/src/fragment/transformers/settings.js';

const INDEX_REFERENCES_FIELD = 'entries';
const INDEX_NOT_FOUND_MESSAGES = ['404', 'Fragment not found'];
const SETTINGS_INDEX_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3NldHRpbmdz';
const SETTINGS_ENTRY_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL3NldHRpbmdzLWVudHJ5';
const FRAGMENT_SUFFIX_LENGTH = 4;
const FRAGMENT_NAME_COLLISION_LIMIT = 20;
const TOP_LEVEL_CONFLICT_MESSAGE = 'A top-level setting already exists for this setting name.';
export const DELETE_BLOCKED_STATUSES = ['PUBLISHED', 'MODIFIED'];

const trueValues = new Set(['true', '1', 'yes', 'on']);
const falseValues = new Set(['false', '0', 'no', 'off']);
export const getSettingNameDefinition = (name) => SETTING_NAME_BY_VALUE.get(name);

const normalizeBoolean = (value) => {
    const normalized = `${value}`.trim().toLowerCase();
    if (trueValues.has(normalized)) return true;
    if (falseValues.has(normalized)) return false;
    return value;
};

/**
 * Normalizes a settings fragment into a UI row record.
 * @param {import('../aem/fragment.js').Fragment} fragment
 * @returns {object}
 */
export const normalizeSettingFragment = (fragment) => {
    const name = `${fragment.getFieldValue('name') || ''}`;
    const settingDefinition = getSettingNameDefinition(name);
    const label = `${fragment.title || ''}`;
    const dataField = fragment.getFieldValue('data');
    const data = dataField ? JSON.parse(dataField) : {};
    const valueType = settingDefinition ? settingDefinition.valueType : `${fragment.getFieldValue('valuetype') || 'text'}`;
    const booleanValue = normalizeBoolean(fragment.getFieldValue('booleanValue')) === true;
    const rawValue =
        valueType === 'boolean'
            ? booleanValue
            : valueType === 'richText'
              ? fragment.getFieldValue('richTextValue')
              : fragment.getFieldValue('textValue');
    const overridesField = fragment.getFieldValue('overrides');
    const overrides = overridesField ? JSON.parse(overridesField) : [];
    const locales = fragment.getFieldValues('locales');
    const tags = fragment.getFieldValues('tags');

    return {
        id: fragment.id,
        name,
        label,
        description: `${fragment.description || ''}`,
        locales,
        templateIds: fragment.getFieldValues('templates'),
        templateSummary: '',
        value: valueType === 'boolean' ? booleanValue : `${rawValue ?? ''}`,
        booleanValue,
        valueType,
        data,
        overrides,
        tags,
        modifiedBy: fragment.modified?.by || '',
        modifiedAt: fragment.modified?.at || '',
        status: fragment.status,
        fragment,
    };
};

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

const resolveValueType = (settingName, ...fallbacks) => {
    const definition = getSettingNameDefinition(settingName);
    if (definition) return definition.valueType;
    for (const fb of fallbacks) {
        if (fb) return fb;
    }
    return 'text';
};

const resolveBooleanValue = (valueType, value, booleanValue) =>
    valueType === 'boolean' ? Boolean(value) : Boolean(booleanValue);

const normalizedStringList = (values = []) =>
    [...new Set(values.map((value) => `${value}`.trim()).filter((value) => value))].sort();

const areStringListsEqual = (left = [], right = []) => {
    const leftList = normalizedStringList(left);
    const rightList = normalizedStringList(right);
    if (leftList.length !== rightList.length) return false;
    return leftList.every((value, index) => value === rightList[index]);
};

const templateSummaryHelper = createTreeSelectionSummary(getVariantTreeData());

const getRowRecord = (rowLike) => (rowLike?.value?.name ? rowLike.value : rowLike);

const toResolverEntry = (record) => {
    const entry = {
        name: record.name,
        templates: record.templateIds || [],
        locales: record.locales || [],
        tags: record.tags || [],
        valuetype: record.valueType || 'text',
        booleanValue: record.booleanValue,
    };

    if (entry.valuetype === 'richText') {
        entry.richTextValue = `${record.value ?? ''}`;
    } else if (entry.valuetype !== 'boolean') {
        entry.textValue = `${record.value ?? ''}`;
    }

    return entry;
};

const toResolverSetting = (rowLike) => {
    const row = getRowRecord(rowLike);
    return {
        default: row ? toResolverEntry(row) : null,
        override: (row?.overrides || []).map((override) => toResolverEntry(override)),
    };
};

const hasMeaningfulValue = (value) => {
    if (Array.isArray(value)) return value.some((item) => item !== '' && item !== null && item !== undefined);
    return value !== '' && value !== null && value !== undefined;
};

const toResolverFragment = (fragment) => {
    const fields = {};

    for (const field of fragment?.fields || []) {
        if (!field?.name) continue;
        const rawValue = field.multiple ? [...(field.values || [])] : field.values?.[0];
        if (!hasMeaningfulValue(rawValue)) continue;
        fields[field.name] = rawValue;
    }

    const tagIds = (fragment?.tags || []).map((tag) => tag?.id || tag).filter(Boolean);
    if (tagIds.length) {
        fields.tags = tagIds;
    }

    return { fields };
};

export function getGlobalSettingsDefaults(fragment, rows = []) {
    const runtimeFragment = toResolverFragment(fragment);
    const locale = fragment?.locale || '';

    return rows.reduce((defaults, rowLike) => {
        const row = getRowRecord(rowLike);
        if (!row?.name) return defaults;

        const definition = getSettingNameDefinition(row.name);
        const entry = resolveSettingEntry(runtimeFragment, locale, toResolverSetting(row));
        if (!entry) return defaults;

        defaults[definition?.propertyName || row.name] = extractValue(entry, runtimeFragment);
        return defaults;
    }, {});
}

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

    #sourceFragment = null;
    #surface = '';
    #loadingSurface = '';
    #loadSurfacePromise = null;

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

    async ensureSurfaceLoaded(surface) {
        if (!surface) return;
        if (surface === this.#surface) return this.#loadSurfacePromise;
        return this.loadSurface(surface);
    }

    async loadSurface(surface) {
        const nextSurface = surface || '';
        if (nextSurface && this.#loadingSurface === nextSurface && this.#loadSurfacePromise) {
            return this.#loadSurfacePromise;
        }

        this.#surface = nextSurface;
        if (!nextSurface) {
            this.#loadingSurface = '';
            this.#loadSurfacePromise = null;
            this.error.set(null);
            this.setSettingFragments([]);
            return;
        }

        if (!this.aem) return;

        this.#loadingSurface = nextSurface;
        const settingsPath = `${ROOT_PATH}/${nextSurface}/settings`;
        const indexPath = `${settingsPath}/index`;
        const loadPromise = (async () => {
            this.loading.set(true);
            this.error.set(null);

            try {
                let indexFragment;
                try {
                    indexFragment = await this.aem.sites.cf.fragments.getByPath(indexPath, {
                        references: 'direct-hydrated',
                    });
                } catch (error) {
                    if (!INDEX_NOT_FOUND_MESSAGES.some((message) => error.message.includes(message))) {
                        throw error;
                    }
                    await this.#createIndexFragment(settingsPath, indexPath);
                    this.setSettingFragments([]);
                    return;
                }
                this.#setRowsFromIndex(indexFragment);
            } catch (error) {
                this.error.set('Failed to load settings.');
                showToast('Failed to load settings.', 'negative');
                this.setSettingFragments([], new Map(), false);
            } finally {
                if (this.#loadingSurface === nextSurface) {
                    this.#loadingSurface = '';
                }
                this.loading.set(false);
            }
        })();

        const wrappedPromise = loadPromise.finally(() => {
            if (this.#loadSurfacePromise === wrappedPromise) {
                this.#loadSurfacePromise = null;
            }
        });
        this.#loadSurfacePromise = wrappedPromise;
        return wrappedPromise;
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
            const rowStore = existingStore || new ReactiveStore(record || normalizeSettingFragment(fragment));
            if (existingStore && record) existingStore.set({ ...existingStore.value, ...record });
            if (existingStore && !record) existingStore.set({ ...existingStore.value, ...normalizeSettingFragment(fragment) });
            currentRowsById.delete(id);

            if (!record) {
                rowStore.set({ ...rowStore.value, templateSummary: this.formatTemplateSummary(rowStore.value.templateIds) });
            }
            nextRows.push(rowStore);
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
            '',
        );

        if (!updated) return false;

        this.toast.set({
            message,
            variant: '',
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
                const valueType = resolveValueType(row.name, override.valueType, row.valueType);
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
            '',
        );

        if (!updated) return false;

        this.toast.set({
            message,
            variant: '',
        });
        return true;
    }

    async addOverride(rowId, override = {}) {
        const rowStore = this.getRowStore(rowId);
        const row = rowStore.value;
        const settingName = row.name;
        const locales = [...(override.locales || [])];
        let createdOverrideId = null;
        const valueType = resolveValueType(settingName, override.valueType, row.valueType);
        const booleanValue = resolveBooleanValue(valueType, override.value, override.booleanValue);
        const localeTitle = locales.join(', ');
        const fragmentName = await this.#resolveUniqueFragmentName({
            settingName,
            locales,
            templateIds: override.templateIds || [],
        });

        const created = await this.#runMutation(
            async () => {
                const created = await this.aem.sites.cf.fragments.create({
                    name: fragmentName,
                    title: `${row.label} ${localeTitle}`.trim(),
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
        const valueType = resolveValueType(row.name, override.valueType, currentOverride.valueType, row.valueType);
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
                    title: `${row.label} ${locales.join(', ')}`.trim(),
                    fields,
                });
            },
            'Override updated.',
            'Failed to update override.',
        );
    }

    async createSetting(setting) {
        const settingName = setting.name;
        const hasConflict = await this.#hasTopLevelSettingNameConflict(settingName);
        if (hasConflict) {
            showToast(TOP_LEVEL_CONFLICT_MESSAGE, 'negative');
            return null;
        }
        const valueType = resolveValueType(settingName, setting.valueType);
        const booleanValue = resolveBooleanValue(valueType, setting.value, setting.booleanValue);
        const fragmentName = await this.#resolveUniqueFragmentName({
            settingName,
            locales: [],
            templateIds: setting.templateIds || [],
        });
        let createdFragmentId = null;

        const created = await this.#runMutation(
            async () => {
                const created = await this.aem.sites.cf.fragments.create({
                    name: fragmentName,
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
            'positive',
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
                valueType: resolveValueType(rowStore.value.name, setting.valueType, rowStore.value.valueType),
                value: setting.value,
                booleanValue: setting.booleanValue,
            },
            'Setting updated.',
            'Failed to update setting.',
            'positive',
        );
    }

    async removeSetting(rowId) {
        const rowStore = this.getRowStore(rowId);
        if (!rowStore) return false;
        const row = rowStore.value;
        if (DELETE_BLOCKED_STATUSES.includes(row.status)) {
            showToast('Published or modified settings cannot be deleted.', 'negative');
            return false;
        }
        const fragmentPaths = [row.fragment.path, ...row.overrides.map((override) => override.path)];
        const deleteTargets = [
            ...row.overrides.map((override) => ({ id: override.id, path: override.path })),
            { id: row.id, path: row.fragment.path },
        ];

        return this.#runMutation(
            async () => {
                let indexUpdated = false;
                const deletedPaths = new Set();
                try {
                    await this.#removePathsFromIndex(fragmentPaths);
                    indexUpdated = true;

                    for (const target of deleteTargets) {
                        const fragment = await this.aem.sites.cf.fragments.getById(target.id);
                        await this.aem.sites.cf.fragments.delete(fragment);
                        deletedPaths.add(target.path);
                    }
                } catch (error) {
                    if (indexUpdated) {
                        const pathsToRestore = fragmentPaths.filter((path) => !deletedPaths.has(path));
                        if (pathsToRestore.length > 0) {
                            await this.#addPathsToIndex(pathsToRestore);
                        }
                    }
                    throw error;
                }
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
        if (DELETE_BLOCKED_STATUSES.includes(override.status)) {
            showToast('Published or modified settings cannot be deleted.', 'negative');
            return false;
        }

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
                await this.#publishIndexFragment();
            },
            'Setting has been successfully published.',
            'Failed to publish setting.',
            'positive',
        );
    }

    async publishOverride(overrideId) {
        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getWithEtag(overrideId);
                await this.aem.sites.cf.fragments.publish(fragment);
                await this.#publishIndexFragment();
            },
            'Override has been successfully published.',
            'Failed to publish override.',
            'positive',
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
            'positive',
        );
    }

    async unpublishOverride(overrideId) {
        return this.#runMutation(
            async () => {
                const fragment = await this.aem.sites.cf.fragments.getWithEtag(overrideId);
                await this.aem.sites.cf.fragments.unpublish(fragment);
            },
            'Override has been successfully unpublished.',
            'Failed to unpublish override.',
            'positive',
        );
    }

    markPublished(rowId) {
        const rowStore = this.getRowStore(rowId);
        rowStore.set({ ...rowStore.value, data: { ...rowStore.value.data, published: true } });
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
        return templateSummaryHelper.templateSummaryText(selectedTemplateIds);
    }

    destroy() {
        this.rows.set([]);
        this.expandedRowIds.set([]);
        this.activeTabByRowId.set({});
        this.loading.set(false);
        this.error.set(null);
        this.toast.set(null);
        this.#sourceFragment = null;
        this.#surface = '';
        this.#loadingSurface = '';
        this.#loadSurfacePromise = null;
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
                const valueType = resolveValueType(row.name, patch.valueType, row.valueType);
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
        let indexData;
        try {
            indexData = await this.aem.sites.cf.fragments.getByPath(this.#indexPath);
        } catch (error) {
            if (!INDEX_NOT_FOUND_MESSAGES.some((message) => error.message.includes(message))) {
                throw error;
            }
            indexData = await this.#createIndexFragment();
        }
        const indexFragment = new Fragment(indexData);
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

    async #publishIndexFragment() {
        const indexFragment = await this.aem.sites.cf.fragments.getByPath(this.#indexPath);
        const indexWithEtag = await this.aem.sites.cf.fragments.getWithEtag(indexFragment.id);
        await this.aem.sites.cf.fragments.publish(indexWithEtag, []);
    }

    #buildFragmentName({ settingName, locales = [], templateIds = [] }) {
        const baseName = normalizeKey(settingName);
        const normalizedLocales = [...new Set(locales.map((locale) => normalizeKey(`${locale}`)).filter((locale) => locale))];
        const normalizedTemplates = [...new Set(templateIds.map((id) => normalizeKey(`${id}`)).filter((id) => id))];
        const localeSegment = normalizedLocales.length ? normalizedLocales.join('-') : 'all';
        const templateSegment = normalizedTemplates.length ? normalizedTemplates.join('-') : 'all';

        return `${baseName}-${localeSegment}-${templateSegment}`;
    }

    #randomFragmentSuffix(length = FRAGMENT_SUFFIX_LENGTH) {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let suffix = '';
        for (let index = 0; index < length; index += 1) {
            suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        return suffix;
    }

    async #fragmentPathExists(path) {
        try {
            await this.aem.sites.cf.fragments.getByPath(path);
            return true;
        } catch (error) {
            const message = `${error?.message || ''}`;
            if (INDEX_NOT_FOUND_MESSAGES.some((marker) => message.includes(marker))) {
                return false;
            }
            throw error;
        }
    }

    async #createIndexFragment(settingsPath = this.#settingsPath, indexPath = this.#indexPath) {
        const surfacePath = settingsPath.slice(0, settingsPath.lastIndexOf('/'));
        await this.aem.folders.create(surfacePath, 'settings', 'settings');
        await this.aem.wait(2000);
        let fragment;
        try {
            fragment = await this.aem.sites.cf.fragments.create({
                parentPath: settingsPath,
                modelId: SETTINGS_INDEX_MODEL_ID,
                name: 'index',
                title: 'Settings Index',
                description: '',
                fields: [
                    { name: 'parentSettings', type: 'content-fragment', multiple: false, values: [] },
                    { name: 'entries', type: 'content-fragment', multiple: true, values: [] },
                ],
            });
        } catch (error) {
            if (!`${error?.message || ''}`.includes('already exists')) throw error;
            return this.aem.sites.cf.fragments.getByPath(indexPath);
        }
        await this.aem.wait(2000);
        const withEtag = await this.aem.sites.cf.fragments.getWithEtag(fragment.id);
        await this.aem.sites.cf.fragments.publish(withEtag);
        return fragment;
    }

    async #resolveUniqueFragmentName({ settingName, locales = [], templateIds = [] }) {
        const baseName = this.#buildFragmentName({ settingName, locales, templateIds });
        let candidate = baseName;

        for (let attempt = 0; attempt <= FRAGMENT_NAME_COLLISION_LIMIT; attempt += 1) {
            const existingPath = `${this.#settingsPath}/${candidate}`;
            const exists = await this.#fragmentPathExists(existingPath);
            if (!exists) return candidate;
            candidate = `${baseName}-${this.#randomFragmentSuffix()}`;
        }

        throw new Error(`Unable to find available fragment name for ${baseName}`);
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
        const nestedByFieldKey = new Map();
        const nestedByNameKey = new Map();

        for (const reference of references) {
            const fragment = new Fragment(reference);
            const record = normalizeSettingFragment(fragment);
            const hasLocales = record.locales.length > 0;
            const fieldName = reference.fieldName || INDEX_REFERENCES_FIELD;

            if (fieldName === INDEX_REFERENCES_FIELD && !hasLocales) {
                if (!topLevelByName.has(record.name)) {
                    topLevelByName.set(record.name, fragment);
                    continue;
                }

                const retainedTopLevel = normalizeSettingFragment(topLevelByName.get(record.name));
                if (areStringListsEqual(record.templateIds, retainedTopLevel.templateIds)) continue;
            }

            const nestedNameKey = fieldName === INDEX_REFERENCES_FIELD ? record.name : fieldName;
            if (!nestedByNameKey.has(nestedNameKey)) nestedByNameKey.set(nestedNameKey, []);
            nestedByNameKey.get(nestedNameKey).push(fragment);

            if (!nestedByFieldKey.has(fieldName)) nestedByFieldKey.set(fieldName, []);
            nestedByFieldKey.get(fieldName).push(fragment);
        }

        const recordOverrides = new Map();

        for (const [name, fragment] of topLevelByName) {
            const topRecord = normalizeSettingFragment(fragment);
            const nestedFragments = [...(nestedByNameKey.get(name) || []), ...(nestedByFieldKey.get(fragment.id) || [])];

            const overrideIds = new Set();
            const overrides = nestedFragments
                .filter((nestedFragment) => {
                    if (overrideIds.has(nestedFragment.id)) return false;
                    overrideIds.add(nestedFragment.id);
                    return true;
                })
                .map((nestedFragment) => this.#createOverride(nestedFragment, topRecord.label));

            const rowRecord = {
                ...topRecord,
                locales: [],
                overrides,
                templateSummary: this.formatTemplateSummary(topRecord.templateIds),
            };

            recordOverrides.set(fragment.id, rowRecord);
        }

        this.setSettingFragments([...topLevelByName.values()], recordOverrides);
    }

    async #hasTopLevelSettingNameConflict(settingName) {
        const normalizedSettingName = normalizeKey(settingName);
        let indexFragmentData = null;

        try {
            indexFragmentData = await this.aem.sites.cf.fragments.getByPath(this.#indexPath, {
                references: 'direct-hydrated',
            });
        } catch (error) {
            if (INDEX_NOT_FOUND_MESSAGES.some((message) => `${error?.message || ''}`.includes(message))) {
                return false;
            }
            throw error;
        }

        const references = indexFragmentData.references || [];
        return references.some((reference) => {
            const fragment = new Fragment(reference);
            const record = normalizeSettingFragment(fragment);
            const hasLocales = record.locales.length > 0;
            const fieldName = reference.fieldName || INDEX_REFERENCES_FIELD;
            if (fieldName !== INDEX_REFERENCES_FIELD || hasLocales) return false;
            return normalizeKey(record.name) === normalizedSettingName;
        });
    }

    #createOverride(fragment, parentLabel) {
        const record = normalizeSettingFragment(fragment);
        return {
            id: record.id,
            path: record.fragment.path,
            label: parentLabel,
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
