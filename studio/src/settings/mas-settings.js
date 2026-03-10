import { LitElement, css, html, nothing } from 'lit';
import Store from '../store.js';
import { PAGE_NAMES, QUICK_ACTION } from '../constants.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { showToast } from '../utils.js';
import { isPowerUser } from '../groups.js';
import './mas-settings-table.js';
import '../mas-quick-actions.js';
import '../mas-locale-picker.js';
import '../aem/aem-tag-picker-field.js';
import '../common/fields/tree-picker-field.js';
import '../common/fields/quantity-select.js';
import { getVariantTreeData } from '../editors/variant-picker.js';
import { SETTING_NAME_DEFINITIONS, getSettingDefaultValue, getSettingNameDefinition } from './setting-name-map.js';
import { DELETE_BLOCKED_STATUSES } from './settings-store.js';

class MasSettings extends LitElement {
    static styles = css`
        :host {
            display: block;
            box-sizing: border-box;
            padding: 32px;
            min-width: 1100px;

            --mod-table-border-radius: 0;
        }

        :host *,
        :host *::before,
        :host *::after {
            box-sizing: border-box;
        }

        #header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        #title {
            margin: 0;
            color: var(--spectrum-alias-content-color-default);
            font-size: 25px;
            font-weight: 700;
            line-height: 30px;
        }

        #divider {
            margin: 0 0 16px 0;
        }

        .settings-dialog-layout {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            min-width: 0;
        }

        .override-dialog {
            width: 508px;
            max-width: 100%;
            border-radius: 16px;
        }

        sp-underlay:not([open]) + sp-dialog.override-dialog {
            display: none;
        }

        sp-underlay + sp-dialog.override-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 508px;
            max-width: calc(100vw - 32px);
            border-radius: 16px;
            background: var(--spectrum-white, #ffffff);
            display: flex;
            flex-direction: column;
            z-index: 1;
        }

        .settings-dialog-layout sp-textfield,
        .settings-dialog-layout sp-picker,
        .settings-dialog-layout sp-combobox,
        .settings-dialog-layout mas-locale-picker,
        .settings-dialog-layout tree-picker-field,
        .settings-dialog-layout quantity-select-field,
        .settings-dialog-layout aem-tag-picker-field,
        .settings-form-card sp-textfield,
        .settings-form-card sp-picker,
        .settings-form-card sp-combobox,
        .settings-form-card mas-locale-picker,
        .settings-form-card tree-picker-field,
        .settings-form-card quantity-select-field,
        .settings-form-card aem-tag-picker-field {
            width: 100%;
        }

        .addon-toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
        }

        .override-conflict {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 16px;
            border-radius: 14px;
            background: var(--spectrum-red-100);
        }

        .override-conflict span {
            white-space: normal;
            overflow-wrap: anywhere;
        }

        .override-conflict-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 700;
        }

        .override-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .confirm-title {
            margin: 0;
            line-height: 1.3;
            font-size: 22px;
        }

        .confirm-title.with-icon {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .confirm-body {
            margin: 16px 0 0 0;
            font-size: 16px;
            line-height: 1.5;
            color: var(--spectrum-alias-content-color-default);
        }

        .settings-form-card {
            width: min(680px, 100%);
            box-sizing: border-box;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .settings-editor-page {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: min(920px, 100%);
        }
    `;

    static properties = {
        bucket: { type: String, attribute: true },
        baseUrl: { type: String, attribute: 'base-url' },
        aem: { type: Object, attribute: false },
        dialog: { state: true },
        form: { state: true },
        showDiscardDialog: { state: true },
    };

    #loadedAem = null;
    #pendingDiscardPromise = null;

    reactiveController = new ReactiveController(this, [
        Store.search,
        Store.page,
        Store.profile,
        Store.users,
        Store.settings.fragmentId,
        Store.settings.creating,
        Store.settings.rows,
        Store.settings.loading,
        Store.placeholders.addons.data,
        Store.placeholders.addons.loading,
    ]);

    constructor() {
        super();
        this.bucket = '';
        this.baseUrl = '';
        this.aem = null;
        this.loadedSurface = '';
        this.dialog = null;
        this.form = this.#getDefaultForm();
        this.formBaseline = this.#getDefaultForm();
        this.formRouteId = null;
        this.discardPromiseResolver = null;
        this.showDiscardDialog = false;
    }

    get surface() {
        return Store.surface() || '';
    }

    get fragmentId() {
        return Store.settings.fragmentId.get();
    }

    get isCreating() {
        return Store.settings.creating.get();
    }

    get isSettingsListPage() {
        return Store.page.get() === PAGE_NAMES.SETTINGS;
    }

    get isSettingsEditorPage() {
        return Store.page.get() === PAGE_NAMES.SETTINGS_EDITOR;
    }

    get isSettingsPage() {
        return this.isSettingsListPage || this.isSettingsEditorPage;
    }

    get isCreateMode() {
        return this.isCreating;
    }

    get isSettingsFormPage() {
        return this.isSettingsEditorPage && (this.isCreateMode || Boolean(this.fragmentId));
    }

    get isSettingsFormReady() {
        if (!this.isSettingsFormPage) return false;
        if (this.isCreateMode) return true;
        if (this.currentSettingRow) return true;
        if (Store.settings.loading.get() && this.formRouteId === this.fragmentId) return true;
        return false;
    }

    get currentSettingRow() {
        if (!this.fragmentId || this.isCreateMode) return null;
        return Store.settings.getRowStore(this.fragmentId)?.value || null;
    }

    update(changedProperties) {
        const surfaceChanged = this.surface !== this.loadedSurface;
        if (
            changedProperties.has('aem') ||
            changedProperties.has('bucket') ||
            changedProperties.has('baseUrl') ||
            surfaceChanged
        ) {
            this.#loadSettings();
        }
        this.#syncFormFromRoute();
        super.update(changedProperties);
    }

    #loadSettings() {
        const surface = this.surface;
        if (this.aem) Store.settings.setAem(this.aem);
        if (!this.aem) Store.settings.initAem(this.bucket, this.baseUrl);
        const aem = Store.settings.aem;
        if (surface === this.loadedSurface && aem === this.#loadedAem) return;

        this.loadedSurface = surface;
        this.#loadedAem = aem;
        Store.settings.loadSurface(surface).then(() => {
            if (this.surface !== surface) {
                this.#loadSettings();
            }
        });
    }

    #getDefaultForm() {
        return {
            label: '',
            name: '',
            description: '',
            templateIds: [],
            tags: [],
            valueType: '',
            value: '',
            booleanValue: false,
            locales: [],
            addonEnabled: false,
        };
    }

    #toAddonPlaceholderKey(value) {
        const normalizedValue = `${value ?? ''}`.trim();
        if (!normalizedValue) return '';
        if (!normalizedValue.startsWith('{{') || !normalizedValue.endsWith('}}')) return '';
        const placeholderKey = normalizedValue.slice(2, -2).trim();
        if (placeholderKey === 'disabled') return '';
        return placeholderKey;
    }

    #toAddonValue(value) {
        const placeholderKey = this.#toAddonPlaceholderKey(value);
        if (!placeholderKey) return '';
        return `{{${placeholderKey}}}`;
    }

    #getRowTags(row) {
        const fieldTags = row.fragment.getFieldValues('tags');
        if (fieldTags.length) return fieldTags;
        return row.fragment.tags?.map((tag) => tag.id || tag.title || tag) || [];
    }

    #normalizedForm(form) {
        const definition = getSettingNameDefinition(form.name);
        const valueType = definition ? definition.valueType : form.valueType;
        const value =
            definition?.editor === 'addon'
                ? this.#toAddonValue(form.value)
                : valueType === 'boolean'
                  ? Boolean(form.value)
                  : `${form.value || ''}`;
        return {
            label: `${form.label || ''}`,
            name: `${form.name || ''}`.trim(),
            description: `${form.description || ''}`,
            templateIds: [...form.templateIds].sort(),
            tags: [...form.tags],
            valueType,
            value,
            booleanValue: Boolean(form.booleanValue),
            locales: [...(form.locales || [])].sort(),
            addonEnabled: Boolean(form.addonEnabled),
        };
    }

    get hasUnsavedChanges() {
        if (!this.isSettingsFormPage) return false;
        return JSON.stringify(this.#normalizedForm(this.form)) !== JSON.stringify(this.#normalizedForm(this.formBaseline));
    }

    #setFormField(field, value) {
        this.form = {
            ...this.form,
            [field]: value,
        };
    }

    get settingDefinition() {
        return getSettingNameDefinition(this.form.name);
    }

    get createSettingNameOptions() {
        if (!this.isCreateMode) return SETTING_NAME_DEFINITIONS;
        const existingTopLevelNames = new Set(
            Store.settings.rows
                .get()
                .map((rowStore) => rowStore.value?.name)
                .filter(Boolean),
        );
        return SETTING_NAME_DEFINITIONS.filter((definition) => !existingTopLevelNames.has(definition.name));
    }

    get formValueType() {
        if (this.dialog?.type === 'override') return this.form.valueType;
        if (this.settingDefinition) return this.settingDefinition.valueType;
        return this.currentSettingRow?.valueType || this.form.valueType;
    }

    get valueEditorType() {
        if (this.dialog?.type === 'override') {
            if (this.settingDefinition?.editor === 'quantity-select') return 'quantity-select';
            if (this.settingDefinition?.editor === 'addon') return 'addon';
            return this.formValueType === 'boolean' ? 'boolean' : 'text';
        }
        if (this.settingDefinition?.editor) return this.settingDefinition.editor;
        if (this.formValueType) return this.formValueType === 'boolean' ? 'boolean' : 'text';
        return '';
    }

    #setOverrideEditForm(row, override) {
        const settingDefinition = getSettingNameDefinition(row.name);
        const valueType = settingDefinition ? settingDefinition.valueType : row.valueType;
        const value = settingDefinition?.editor === 'addon' ? this.#toAddonValue(override.value) : override.value;
        this.dialog = { type: 'override', mode: 'edit', rowId: row.id, overrideId: override.id };
        this.form = {
            label: row.label,
            name: row.name,
            description: row.description,
            templateIds: [...(override.templateIds || [])],
            tags: [...(override.tags || [])],
            valueType,
            value,
            booleanValue: Boolean(override.booleanValue),
            locales: [...(override.locales || [])],
            addonEnabled: settingDefinition?.editor === 'addon' ? Boolean(override.booleanValue) : false,
        };
        this.formBaseline = structuredClone(this.form);
    }

    #setTopLevelFormFromRow(row) {
        const settingDefinition = getSettingNameDefinition(row.name);
        const value = settingDefinition?.editor === 'addon' ? this.#toAddonValue(row.value) : row.value;
        this.dialog = null;
        this.form = {
            label: row.label,
            name: row.name,
            description: row.description,
            templateIds: [...row.templateIds],
            tags: [...this.#getRowTags(row)],
            valueType: row.valueType || '',
            value,
            booleanValue: Boolean(row.booleanValue),
            locales: [],
            addonEnabled: settingDefinition?.editor === 'addon' ? Boolean(row.booleanValue) : false,
        };
        this.formBaseline = structuredClone(this.form);
        this.formRouteId = row.id;
    }

    #syncFormFromRoute() {
        if (!this.isSettingsPage) {
            this.formRouteId = null;
            return;
        }

        const fragmentId = this.fragmentId;
        if (fragmentId && this.isCreateMode) {
            Store.settings.creating.set(false);
            return;
        }

        if (this.isCreateMode) {
            if (this.isSettingsListPage) {
                Store.page.set(PAGE_NAMES.SETTINGS_EDITOR);
                return;
            }
            if (this.formRouteId === 'create') return;
            this.dialog = null;
            this.form = this.#getDefaultForm();
            this.formBaseline = this.#getDefaultForm();
            this.formRouteId = 'create';
            return;
        }
        if (!fragmentId) {
            this.formRouteId = null;
            return;
        }

        if (fragmentId === this.formRouteId) return;

        const row = this.currentSettingRow;
        if (row) {
            if (this.isSettingsListPage) {
                Store.page.set(PAGE_NAMES.SETTINGS_EDITOR);
                return;
            }
            this.#setTopLevelFormFromRow(row);
            return;
        }

        const overrideContext = Store.settings.getOverrideContext(fragmentId);
        if (!overrideContext) return;
        if (this.isSettingsEditorPage) {
            Store.page.set(PAGE_NAMES.SETTINGS);
            return;
        }
        Store.settings.ensureExpanded(overrideContext.row.id);
        this.#setOverrideEditForm(overrideContext.row, overrideContext.override);
        this.formRouteId = fragmentId;
    }

    #handleCreateSetting = () => {
        Store.settings.fragmentId.set(null);
        Store.settings.creating.set(true);
        Store.page.set(PAGE_NAMES.SETTINGS_EDITOR);
    };

    #openEditorForSetting(settingId) {
        Store.settings.fragmentId.set(settingId);
        Store.settings.creating.set(false);
        Store.page.set(PAGE_NAMES.SETTINGS_EDITOR);
    }

    #handleEditSettingDialog = ({ detail: { id, parentId, isOverride } }) => {
        if (isOverride) {
            Store.settings.creating.set(false);
            Store.settings.fragmentId.set(id);
            return;
        }
        this.#openEditorForSetting(id);
    };

    #handleAddOverrideDialog = ({ detail: { id } }) => {
        const row = Store.settings.getRowStore(id).value;
        const settingDefinition = getSettingNameDefinition(row.name);
        const valueType = settingDefinition ? settingDefinition.valueType : row.valueType;
        const value = settingDefinition?.editor === 'addon' ? this.#toAddonValue(row.value) : row.value;
        this.dialog = { type: 'override', rowId: id };
        this.form = {
            label: row.label,
            name: row.name,
            description: row.description,
            templateIds: [],
            tags: [],
            valueType,
            value,
            booleanValue: Boolean(row.booleanValue),
            locales: [],
            addonEnabled: settingDefinition?.editor === 'addon' ? Boolean(row.booleanValue) : false,
        };
    };

    #buildConfirmDialogConfig(action, rowId, overrideId = null) {
        const row = Store.settings.getRowStore(rowId).value;
        const settingLabel = row.label;

        if (action === 'delete-override') {
            const override = row.overrides.find((item) => item.id === overrideId);
            const localeLabel = override.locales?.join(', ');
            return {
                title: 'Delete this setting override?',
                body: [
                    `Are you sure you want to delete '${settingLabel} (${localeLabel})'?`,
                    'This action cannot be undone, and the override will be permanently removed.',
                ],
                confirmLabel: 'Delete',
                showIcon: false,
                variant: 'negative',
            };
        }

        if (action === 'publish') {
            if (overrideId) {
                const override = row.overrides.find((item) => item.id === overrideId);
                const localeLabel = override?.locales?.length ? ` (${override.locales.join(', ')})` : '';
                return {
                    title: 'Publish this override?',
                    body: [
                        `Are you sure you want to publish '${settingLabel}${localeLabel}'?`,
                        'Once published, these changes will be applied to the selected cards. Please note that it may take up to 15 minutes for the updates to appear.',
                    ],
                    confirmLabel: 'Publish',
                    showIcon: true,
                    variant: 'primary',
                };
            }
            return {
                title: 'Publish this setting?',
                body: [
                    `Are you sure you want to publish '${settingLabel}'?`,
                    'Once published, these changes will be applied to the selected cards. Please note that it may take up to 15 minutes for the updates to appear.',
                ],
                confirmLabel: 'Publish',
                showIcon: true,
                variant: 'primary',
            };
        }

        if (action === 'unpublish') {
            if (overrideId) {
                const override = row.overrides.find((item) => item.id === overrideId);
                const localeLabel = override?.locales?.length ? ` (${override.locales.join(', ')})` : '';
                return {
                    title: 'Unpublish this override?',
                    body: [
                        `This will remove '${settingLabel}${localeLabel}' from the selected cards. It may take up to 15 minutes for the changes to take effect.`,
                    ],
                    confirmLabel: 'Unpublish',
                    showIcon: true,
                    variant: 'primary',
                };
            }
            return {
                title: 'Unpublish this setting?',
                body: [
                    `This will remove '${settingLabel}' from all associated cards. It may take up to 15 minutes for the changes to take effect.`,
                ],
                confirmLabel: 'Unpublish',
                showIcon: true,
                variant: 'primary',
            };
        }

        return {
            title: 'Delete this setting?',
            body: [
                `Are you sure you want to delete '${settingLabel}'?`,
                'This action cannot be undone, and the setting will be permanently removed from all cards.',
            ],
            confirmLabel: 'Delete',
            showIcon: false,
            variant: 'negative',
        };
    }

    #openConfirmDialog(action, rowId, overrideId = null, resetOnCancel = false) {
        this.dialog = {
            type: 'confirm',
            action,
            rowId,
            overrideId,
            resetOnCancel,
            config: this.#buildConfirmDialogConfig(action, rowId, overrideId),
        };
    }

    #handlePublishDialog = ({ detail: { id, parentId, isOverride } }) => {
        this.#openConfirmDialog('publish', isOverride ? parentId : id, isOverride ? id : null);
    };

    #handleUnpublishDialog = ({ detail: { id, parentId, isOverride } }) => {
        this.#openConfirmDialog('unpublish', isOverride ? parentId : id, isOverride ? id : null);
    };

    #handleDeleteDialog = ({ detail: { id, parentId, isOverride } }) => {
        if (isOverride) {
            const row = Store.settings.getRowStore(parentId)?.value;
            const override = row?.overrides.find((item) => item.id === id);
            if (DELETE_BLOCKED_STATUSES.includes(override?.status)) {
                showToast('Published or modified settings cannot be deleted.', 'negative');
                return;
            }
            this.#openConfirmDialog('delete-override', parentId, id);
            return;
        }
        const row = Store.settings.getRowStore(id)?.value;
        if (!row) return;
        if (DELETE_BLOCKED_STATUSES.includes(row.status)) {
            showToast('Published or modified settings cannot be deleted.', 'negative');
            return;
        }
        this.#openConfirmDialog('delete', id);
    };

    #handleDialogCancel = () => {
        const resetForm = this.dialog?.type === 'override' || Boolean(this.dialog?.resetOnCancel);
        this.dialog = null;
        if (!resetForm) return;
        Store.settings.fragmentId.set(null);
        this.formRouteId = null;
        this.form = this.#getDefaultForm();
        this.formBaseline = this.#getDefaultForm();
    };

    get isAddonPlaceholderMissing() {
        return this.form.name === 'addon' && this.form.addonEnabled && !this.#toAddonPlaceholderKey(this.form.value);
    }

    get isOverrideSaveDisabled() {
        if (Store.settings.loading.get()) return true;
        if (Boolean(this.overrideConflict)) return true;
        if (this.isAddonPlaceholderMissing) return true;
        return false;
    }

    #submitOverride = async (publish = false) => {
        if (this.overrideConflict) {
            showToast('Conflict detected. Choose a different locale or template.', 'negative');
            return;
        }
        if (this.isAddonPlaceholderMissing) {
            showToast('Placeholder selection is required when Addon is enabled.', 'negative');
            return;
        }

        const settingDefinition = getSettingNameDefinition(this.form.name);
        const valueType = settingDefinition ? settingDefinition.valueType : this.form.valueType;
        if (!valueType) {
            showToast('Unsupported setting name.', 'negative');
            return;
        }

        const payload = {
            locales: [...this.form.locales],
            templateIds: [...this.form.templateIds],
            tags: [...this.form.tags],
            valueType,
            value: this.#normalizedValue(),
            booleanValue: this.#normalizedBooleanValue(),
            status: 'DRAFT',
            modifiedBy: 'Current user',
            modifiedAt: new Date().toISOString(),
        };

        let overrideId = this.dialog.overrideId;
        const saved =
            this.dialog.mode === 'edit'
                ? await Store.settings.updateOverride(this.dialog.rowId, this.dialog.overrideId, payload)
                : Boolean((overrideId = await Store.settings.addOverride(this.dialog.rowId, payload)));
        if (!saved) return;

        if (publish) {
            this.#openConfirmDialog('publish', this.dialog.rowId, overrideId, true);
            return;
        }

        this.#handleDialogCancel();
    };

    #handleOverrideSaveDraft = () => this.#submitOverride(false);

    #handleOverridePublish = () => this.#submitOverride(true);

    #normalizedValue() {
        if (this.formValueType === 'boolean') return Boolean(this.form.value);
        return `${this.form.value || ''}`;
    }

    #normalizedBooleanValue() {
        if (this.formValueType === 'boolean') return Boolean(this.form.value);
        if (this.valueEditorType === 'addon') return Boolean(this.form.addonEnabled);
        return Boolean(this.form.booleanValue);
    }

    get overrideConflict() {
        if (this.dialog?.type !== 'override') return null;
        if (!this.form.locales.length) return null;
        const row = Store.settings.getRowStore(this.dialog.rowId).value;
        return (
            row.overrides.find((override) => {
                if (this.dialog.mode === 'edit' && override.id === this.dialog.overrideId) return false;
                const overrideLocales = override.locales || [];
                const localesOverlap = overrideLocales.some((locale) => this.form.locales.includes(locale));
                if (!localesOverlap) return false;
                const formTemplates = this.form.templateIds;
                const overrideTemplates = override.templateIds || [];
                if (formTemplates.length === 0) return true;
                if (overrideTemplates.length === 0) return false;
                return formTemplates.some((t) => overrideTemplates.includes(t));
            }) || null
        );
    }

    #closeSettingsFormPage() {
        Store.settings.creating.set(false);
        Store.settings.fragmentId.set(null);
        Store.page.set(PAGE_NAMES.SETTINGS);
        this.formRouteId = null;
        this.form = this.#getDefaultForm();
        this.formBaseline = this.#getDefaultForm();
    }

    promptDiscardChanges() {
        if (!this.hasUnsavedChanges) return Promise.resolve(true);
        if (this.#pendingDiscardPromise) return this.#pendingDiscardPromise;
        this.#pendingDiscardPromise = new Promise((resolve) => {
            this.discardPromiseResolver = resolve;
            this.showDiscardDialog = true;
        });
        return this.#pendingDiscardPromise;
    }

    discardConfirmed = () => {
        this.showDiscardDialog = false;
        if (this.discardPromiseResolver) {
            this.discardPromiseResolver(true);
            this.discardPromiseResolver = null;
        }
        this.#pendingDiscardPromise = null;
    };

    cancelDiscard = () => {
        this.showDiscardDialog = false;
        if (this.discardPromiseResolver) {
            this.discardPromiseResolver(false);
            this.discardPromiseResolver = null;
        }
        this.#pendingDiscardPromise = null;
    };

    #handleFormCancel = async () => {
        const confirmed = await this.promptDiscardChanges();
        if (!confirmed) return;
        this.#closeSettingsFormPage();
    };

    #handleFormSave = async () => {
        if (this.isCreateMode && !this.form.name.trim()) {
            showToast('Name is required.', 'negative');
            return;
        }
        const settingDefinition = getSettingNameDefinition(this.form.name);
        if (this.isCreateMode && !settingDefinition) {
            showToast('Unsupported setting name.', 'negative');
            return;
        }
        const row = this.currentSettingRow;
        const valueType = settingDefinition ? settingDefinition.valueType : row?.valueType;
        if (!valueType) {
            showToast('Unsupported setting name.', 'negative');
            return;
        }
        if (this.isAddonPlaceholderMissing) {
            showToast('Placeholder selection is required when Addon is enabled.', 'negative');
            return;
        }

        const payload = {
            label: this.form.label,
            name: this.form.name,
            description: this.form.description,
            templateIds: [...this.form.templateIds],
            tags: [...this.form.tags],
            valueType,
            value: this.#normalizedValue(),
            booleanValue: this.#normalizedBooleanValue(),
        };

        if (this.isCreateMode) {
            const createdId = await Store.settings.createSetting(payload);
            if (createdId) {
                this.formBaseline = this.#normalizedForm(this.form);
                this.#openEditorForSetting(createdId);
            }
            return;
        }

        if (!row) return;
        const updated = await Store.settings.updateSetting(row.id, payload);
        if (updated) {
            const refreshedRow = Store.settings.getRowStore(row.id)?.value;
            if (refreshedRow) this.#setTopLevelFormFromRow(refreshedRow);
        }
    };

    #handleEditorSave = () => this.#handleFormSave();

    #handleEditorPublish = () => {
        const row = this.currentSettingRow;
        if (!row) return;
        this.#openConfirmDialog('publish', row.id);
    };

    #handleEditorUnpublish = () => {
        const row = this.currentSettingRow;
        if (!row) return;
        this.#openConfirmDialog('unpublish', row.id);
    };

    #handleEditorCancel = async () => {
        const confirmed = await this.promptDiscardChanges();
        if (!confirmed) return;
        this.form = structuredClone(this.formBaseline);
    };

    #handleEditorDelete = () => {
        const row = this.currentSettingRow;
        if (!row) return;
        this.#handleDeleteDialog({
            detail: {
                id: row.id,
                isOverride: false,
            },
        });
    };

    #handleDialogConfirm = async () => {
        if (this.dialog.type === 'confirm') {
            const action = this.dialog.action;
            let success = false;
            if (action === 'publish') {
                success = this.dialog.overrideId
                    ? await Store.settings.publishOverride(this.dialog.overrideId)
                    : await Store.settings.publishSetting(this.dialog.rowId);
            }
            if (action === 'unpublish') {
                success = this.dialog.overrideId
                    ? await Store.settings.unpublishOverride(this.dialog.overrideId)
                    : await Store.settings.unpublishSetting(this.dialog.rowId);
            }
            if (action === 'delete') success = await Store.settings.removeSetting(this.dialog.rowId);
            if (action === 'delete-override') {
                success = await Store.settings.removeOverride(this.dialog.rowId, this.dialog.overrideId);
            }
            if (success) {
                this.#handleDialogCancel();
                if (action === 'delete' && this.isSettingsEditorPage) {
                    this.#closeSettingsFormPage();
                }
            }
        }
    };

    #handleSettingNameChange = (event) => {
        const name = event.target.value;
        const settingDefinition = getSettingNameDefinition(name);
        if (!settingDefinition) return;
        this.form = {
            ...this.form,
            name,
            valueType: settingDefinition.valueType,
            value: getSettingDefaultValue(settingDefinition),
            booleanValue:
                settingDefinition.valueType === 'boolean'
                    ? Boolean(getSettingDefaultValue(settingDefinition))
                    : settingDefinition.editor === 'addon'
                      ? false
                      : true,
            addonEnabled: false,
        };
    };

    #handleAddonToggle = (event) => {
        const enabled = event.target.checked;
        if (!enabled) {
            this.form = {
                ...this.form,
                addonEnabled: false,
                booleanValue: false,
                value: '',
            };
            return;
        }
        this.form = {
            ...this.form,
            addonEnabled: true,
            booleanValue: true,
        };
    };

    #handleAddonPlaceholderChange = (event) => {
        const placeholderKey = event.target.value;
        this.form = {
            ...this.form,
            value: placeholderKey && placeholderKey !== 'disabled' ? `{{${placeholderKey}}}` : '',
        };
    };

    #handleTagsChange = (event) => {
        const tags = event.target.getAttribute('value');
        this.#setFormField('tags', tags ? tags.split(',') : []);
    };

    #handleTemplateChange = (event) => {
        this.#setFormField('templateIds', [...event.target.value]);
    };

    #handleOverrideLocaleChange = ({ detail }) => {
        this.#setFormField('locales', [...detail.locales]);
    };

    #handleQuantitySelectChange = (event) => {
        const value = event.detail?.value ?? event.currentTarget?.value;
        if (typeof value !== 'string') return;
        this.#setFormField('value', value);
    };

    #handleBooleanValueToggle = (event) => {
        this.#setFormField('booleanValue', event.target.checked);
    };

    get confirmDialogConfig() {
        return this.dialog.config;
    }

    get booleanToggleTemplate() {
        if (this.formValueType !== 'optional-text') return nothing;
        if (this.valueEditorType === 'addon') return nothing;
        return html`
            <sp-field-group>
                <sp-field-label>Enabled</sp-field-label>
                <sp-switch size="m" .checked=${Boolean(this.form.booleanValue)} @change=${this.#handleBooleanValueToggle}>
                    ${Boolean(this.form.booleanValue) ? 'On' : 'Off'}
                </sp-switch>
            </sp-field-group>
        `;
    }

    get overrideBooleanToggleTemplate() {
        if (this.dialog?.type !== 'override') return nothing;
        return this.booleanToggleTemplate;
    }

    get valueInputTemplate() {
        if (this.valueEditorType === 'boolean') {
            return html`
                <sp-switch
                    size="m"
                    .checked=${Boolean(this.form.value)}
                    @change=${(event) => this.#setFormField('value', event.target.checked)}
                >
                    ${Boolean(this.form.value) ? 'On' : 'Off'}
                </sp-switch>
            `;
        }
        if (this.valueEditorType === 'quantity-select') {
            return html`
                <quantity-select-field
                    layout=${this.dialog?.type === 'override' ? 'vertical' : 'grid'}
                    .value=${`${this.form.value || ''}`}
                    @change=${this.#handleQuantitySelectChange}
                ></quantity-select-field>
            `;
        }
        if (this.valueEditorType === 'addon') {
            const placeholderKey = this.#toAddonPlaceholderKey(this.form.value);
            return html`
                <div>
                    <div class="addon-toggle-row">
                        <sp-field-label for="addon-enabled-switch">Enable Addon</sp-field-label>
                        <sp-switch
                            id="addon-enabled-switch"
                            size="m"
                            .checked=${Boolean(this.form.addonEnabled)}
                            @change=${this.#handleAddonToggle}
                        ></sp-switch>
                    </div>
                    ${this.form.addonEnabled
                        ? html`
                              <sp-combobox
                                  .options=${Store.placeholders.addons.data.get()}
                                  .pending=${Store.placeholders.addons.loading.get()}
                                  .value=${placeholderKey}
                                  placeholder="Select an addon placeholder"
                                  @change=${this.#handleAddonPlaceholderChange}
                              ></sp-combobox>
                          `
                        : nothing}
                </div>
            `;
        }
        if (!this.valueEditorType) return nothing;
        return html`
            <sp-textfield
                name="setting-value"
                multiline
                .value=${`${this.form.value || ''}`}
                @input=${(event) => this.#setFormField('value', event.target.value)}
                placeholder="Enter value"
            ></sp-textfield>
        `;
    }

    get tagsTemplate() {
        return html`
            <sp-field-group>
                <sp-field-label>Tags</sp-field-label>
                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    multiple
                    value="${this.form.tags.join(',')}"
                    @change=${this.#handleTagsChange}
                ></aem-tag-picker-field>
            </sp-field-group>
        `;
    }

    get addOverrideDialogTemplate() {
        if (this.dialog?.type !== 'override') return nothing;
        const row = Store.settings.getRowStore(this.dialog.rowId).value;
        const conflict = this.overrideConflict;
        return html`
            <sp-underlay open @click=${this.#handleDialogCancel}></sp-underlay>
            <sp-dialog class="override-dialog" open @click=${(event) => event.stopPropagation()}>
                <h2 slot="heading">Add override for '${row.label}'</h2>
                <div class="settings-dialog-layout">
                    ${conflict
                        ? html`
                              <div class="override-conflict">
                                  <div class="override-conflict-title">
                                      <sp-icon-alert></sp-icon-alert>
                                      <span>Conflict detected</span>
                                  </div>
                                  <span>
                                      This override is in conflict with an existing setting '${conflict.label}
                                      (${conflict.locales?.join(', ')})'.
                                  </span>
                                  <span>View an existing setting or adjust your selection.</span>
                              </div>
                          `
                        : nothing}
                    <sp-field-group>
                        <sp-field-label>Template</sp-field-label>
                        <tree-picker-field
                            .tree=${getVariantTreeData(this.surface)}
                            .value=${this.form.templateIds}
                            .emptyValueIsSelection=${this.dialog?.mode === 'edit'}
                            placeholder=${this.dialog?.mode === 'edit' ? 'All templates' : 'Select template'}
                            @change=${this.#handleTemplateChange}
                        ></tree-picker-field>
                    </sp-field-group>
                    <sp-field-group>
                        <sp-field-label>Locale</sp-field-label>
                        <mas-locale-picker
                            surface=${this.surface}
                            selection="checkbox"
                            mode="region"
                            display-value
                            selection-label="Select locale"
                            empty-selection-label=${this.dialog?.mode === 'edit' ? 'All locales' : 'Select locale'}
                            .emptySelectionIsValue=${this.dialog?.mode === 'edit'}
                            .locale=${this.form.locales.join(',')}
                            @locale-changed=${this.#handleOverrideLocaleChange}
                        ></mas-locale-picker>
                    </sp-field-group>
                    ${this.tagsTemplate} ${this.overrideBooleanToggleTemplate}
                    <sp-field-group>
                        <sp-field-label>Value</sp-field-label>
                        ${this.valueInputTemplate}
                    </sp-field-group>
                </div>
                <sp-button slot="button" variant="secondary" @click=${this.#handleDialogCancel}>Cancel</sp-button>
                <sp-button
                    slot="button"
                    variant="secondary"
                    ?disabled=${this.isOverrideSaveDisabled}
                    @click=${this.#handleOverrideSaveDraft}
                >
                    Save as draft
                </sp-button>
                <sp-button
                    slot="button"
                    variant="accent"
                    ?disabled=${this.isOverrideSaveDisabled}
                    @click=${this.#handleOverridePublish}
                >
                    Publish
                </sp-button>
            </sp-dialog>
        `;
    }

    get confirmDialogTemplate() {
        if (this.dialog?.type !== 'confirm') return nothing;
        const config = this.confirmDialogConfig;
        return html`
            <sp-dialog-wrapper
                open
                underlay
                .variant=${config.variant}
                .confirmLabel=${config.confirmLabel}
                cancel-label="Cancel"
                @confirm=${this.#handleDialogConfirm}
                @cancel=${this.#handleDialogCancel}
            >
                <h3 class=${config.showIcon ? 'confirm-title with-icon' : 'confirm-title'}>
                    ${config.showIcon ? html`<sp-icon-alert></sp-icon-alert>` : nothing}
                    <span>${config.title}</span>
                </h3>
                ${config.body.map((line) => html`<p class="confirm-body">${line}</p>`)}
            </sp-dialog-wrapper>
        `;
    }

    get discardConfirmationDialog() {
        if (!this.showDiscardDialog) return nothing;
        return html`
            <sp-dialog-wrapper
                id="discard-confirmation-dialog"
                open
                underlay
                variant="negative"
                confirm-label="Discard"
                cancel-label="Cancel"
                @confirm=${this.discardConfirmed}
                @cancel=${this.cancelDiscard}
            >
                <h3 class="confirm-title">Confirm Discard</h3>
                <p class="confirm-body">Are you sure you want to discard changes? This action cannot be undone.</p>
            </sp-dialog-wrapper>
        `;
    }

    get settingsFormTemplate() {
        if (!this.isSettingsFormReady) return nothing;

        return html`
            <section id="settings-editor-page" class="settings-editor-page">
                <div class="settings-form-card">
                    <sp-field-group>
                        <sp-field-label>Label</sp-field-label>
                        <sp-textfield
                            name="setting-label-page"
                            .value=${this.form.label}
                            placeholder="Enter label"
                            @input=${(event) => this.#setFormField('label', event.target.value)}
                        ></sp-textfield>
                    </sp-field-group>
                    <sp-field-group>
                        <sp-field-label>Name *</sp-field-label>
                        <sp-picker
                            name="setting-name-page"
                            .value=${this.form.name}
                            placeholder="Select name"
                            ?disabled=${!this.isCreateMode}
                            @change=${this.#handleSettingNameChange}
                        >
                            ${this.createSettingNameOptions.map(
                                (definition) => html`
                                    <sp-menu-item value=${definition.name}>${definition.name}</sp-menu-item>
                                `,
                            )}
                        </sp-picker>
                    </sp-field-group>
                    <sp-field-group>
                        <sp-field-label>Description *</sp-field-label>
                        <sp-textfield
                            name="setting-description-page"
                            multiline
                            .value=${this.form.description}
                            placeholder="Enter description"
                            @input=${(event) => this.#setFormField('description', event.target.value)}
                        ></sp-textfield>
                    </sp-field-group>
                    <sp-field-group>
                        <sp-field-label>Template</sp-field-label>
                        <tree-picker-field
                            .tree=${getVariantTreeData(this.surface)}
                            .value=${this.form.templateIds}
                            .emptyValueIsSelection=${!this.isCreateMode}
                            placeholder=${this.isCreateMode ? 'Select template' : 'All templates'}
                            @change=${this.#handleTemplateChange}
                        ></tree-picker-field>
                    </sp-field-group>
                    ${this.tagsTemplate} ${this.booleanToggleTemplate}
                    ${this.valueEditorType
                        ? html`
                              <sp-field-group>
                                  <sp-field-label>Value</sp-field-label>
                                  ${this.valueInputTemplate}
                              </sp-field-group>
                          `
                        : nothing}
                </div>
            </section>
        `;
    }

    get settingsEditorActions() {
        return [QUICK_ACTION.SAVE, QUICK_ACTION.PUBLISH, QUICK_ACTION.UNPUBLISH, QUICK_ACTION.CANCEL, QUICK_ACTION.DELETE];
    }

    get disabledSettingsEditorActions() {
        const disabled = new Set();
        if (Store.settings.loading.get()) {
            disabled.add(QUICK_ACTION.SAVE);
            disabled.add(QUICK_ACTION.PUBLISH);
            disabled.add(QUICK_ACTION.UNPUBLISH);
            disabled.add(QUICK_ACTION.CANCEL);
            disabled.add(QUICK_ACTION.DELETE);
            return disabled;
        }
        if (!this.hasUnsavedChanges) {
            disabled.add(QUICK_ACTION.SAVE);
            disabled.add(QUICK_ACTION.CANCEL);
        }

        const row = this.currentSettingRow;
        if (!row) {
            disabled.add(QUICK_ACTION.PUBLISH);
            disabled.add(QUICK_ACTION.UNPUBLISH);
            disabled.add(QUICK_ACTION.DELETE);
            return disabled;
        }

        if (row.status === 'PUBLISHED') disabled.add(QUICK_ACTION.PUBLISH);
        if (row.status !== 'PUBLISHED' && row.status !== 'MODIFIED') disabled.add(QUICK_ACTION.UNPUBLISH);
        if (DELETE_BLOCKED_STATUSES.includes(row.status)) disabled.add(QUICK_ACTION.DELETE);
        return disabled;
    }

    get settingsEditorActionBarTemplate() {
        if (!this.isSettingsFormReady) return nothing;
        return html`
            <mas-quick-actions
                id="settings-editor-action-bar"
                .actions=${this.settingsEditorActions}
                .disabled=${this.disabledSettingsEditorActions}
                @save=${this.#handleEditorSave}
                @publish=${this.#handleEditorPublish}
                @unpublish=${this.#handleEditorUnpublish}
                @cancel=${this.#handleEditorCancel}
                @delete=${this.#handleEditorDelete}
            ></mas-quick-actions>
        `;
    }

    get dialogTemplate() {
        return html`${this.addOverrideDialogTemplate}${this.confirmDialogTemplate}${this.discardConfirmationDialog}`;
    }

    get headerTemplate() {
        if (!this.isSettingsListPage) return nothing;
        return html`
            <header id="header">
                <h1 id="title">Settings</h1>
                <sp-button id="create-setting-button" variant="accent" @click=${this.#handleCreateSetting}>
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Create setting
                </sp-button>
            </header>
            <sp-divider id="divider" size="s"></sp-divider>
        `;
    }

    get tableTemplate() {
        if (!this.isSettingsListPage) return nothing;
        return html`
            <mas-settings-table
                id="settings-table"
                @setting-add-override=${this.#handleAddOverrideDialog}
                @setting-edit=${this.#handleEditSettingDialog}
                @setting-publish=${this.#handlePublishDialog}
                @setting-unpublish=${this.#handleUnpublishDialog}
                @setting-delete=${this.#handleDeleteDialog}
            ></mas-settings-table>
        `;
    }

    render() {
        if (!isPowerUser()) return nothing;
        return html`${this.headerTemplate}${this.tableTemplate}${this.settingsFormTemplate}${this
            .settingsEditorActionBarTemplate}${this.dialogTemplate}`;
    }
}

customElements.define('mas-settings', MasSettings);
