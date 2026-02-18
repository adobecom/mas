import { LitElement, css, html, nothing } from 'lit';
import Store from '../store.js';
import { PAGE_NAMES } from '../constants.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { showToast } from '../utils.js';
import { SettingsStore } from './settings-store.js';
import './mas-settings-table.js';
import '../aem/aem-tag-picker-field.js';
import '../common/fields/tree-picker-field.js';

const TEMPLATE_TREE_TEST_DATA = [
    { id: 'blade', label: 'Blade' },
    {
        id: 'catalog-group',
        label: 'Catalog',
        children: [
            { id: 'catalog', label: 'Catalog' },
            { id: 'comp-chart', label: 'Comp chart' },
            { id: 'countdown-timer', label: 'Countdown timer' },
            { id: 'fries', label: 'Fries' },
            { id: 'catalog-mini', label: 'Mini' },
            { id: 'catalog-special-offers', label: 'Special offers' },
            { id: 'catalog-other', label: 'Other' },
        ],
    },
    {
        id: 'gnav-bar-group',
        label: 'Gnav bar',
        children: [
            { id: 'gnav-bar', label: 'Gnav bar' },
            { id: 'gnav-bar-catalog', label: 'Gnav bar' },
            { id: 'gnav-bar-mini-comp-chart', label: 'Gnav bar' },
            { id: 'gnav-bar-plans', label: 'Gnav bar' },
            { id: 'gnav-bar-special-offers', label: 'Gnav bar' },
        ],
    },
    {
        id: 'global-group',
        label: 'Global',
        children: [
            { id: 'marquee', label: 'Marquee' },
            { id: 'modal', label: 'Modal' },
            { id: 'promo-bar', label: 'Promo bar' },
            {
                id: 'merch-card-group',
                label: 'Merch card',
                children: [
                    { id: 'merch-card-badge-banner', label: 'Merch card' },
                    { id: 'merch-card-catalog', label: 'Merch card' },
                    { id: 'merch-card-gnav', label: 'Merch card' },
                    { id: 'merch-card-mini-compare-chart', label: 'Merch card' },
                    { id: 'merch-card-plans', label: 'Merch card' },
                    { id: 'merch-card-product', label: 'Merch card' },
                    { id: 'merch-card-segment', label: 'Merch card' },
                    { id: 'merch-card-special-offers', label: 'Merch card' },
                ],
            },
        ],
    },
    { id: 'homepage-pod', label: 'Homepage pod' },
    { id: 'mini', label: 'Mini' },
    { id: 'mpp-promo-element', label: 'MPP Promo element' },
    {
        id: 'plans-group',
        label: 'Plans',
        children: [
            { id: 'plans', label: 'Plans' },
            { id: 'simplified-pricing-express', label: 'Simplified pricing Express' },
            { id: 'special-offers', label: 'Special offers' },
            { id: 'sticky-banner', label: 'Sticky banner' },
            { id: 'suggested', label: 'Suggested' },
            { id: 'terms-and-conditions', label: 'Terms & Conditions' },
        ],
    },
    { id: 'try-buy-widget', label: 'Try buy widget' },
    { id: 'twp-subscription-panel', label: 'TwP Subscription panel' },
    { id: 'other', label: 'Other' },
];

class MasSettings extends LitElement {
    static styles = css`
        :host {
            display: block;
            box-sizing: border-box;
            padding: 32px;
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
            min-width: 500px;
            max-width: 500px;
        }

        .settings-dialog-layout sp-textfield,
        .settings-dialog-layout sp-picker,
        .settings-dialog-layout tree-picker-field,
        .settings-dialog-layout aem-tag-picker-field,
        .settings-form-card sp-textfield,
        .settings-form-card sp-picker,
        .settings-form-card tree-picker-field,
        .settings-form-card aem-tag-picker-field {
            width: 100%;
        }

        .value-definition {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .value-type-row {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }

        .value-type-button[variant='accent'] {
            --spectrum-button-m-textonly-fill-background-color-default: var(--spectrum-gray-900);
            --spectrum-button-m-textonly-fill-text-color-default: var(--spectrum-white);
        }

        .override-conflict {
            display: flex;
            flex-direction: column;
            gap: 6px;
            padding: 16px;
            border-radius: 14px;
            background: var(--spectrum-red-100);
        }

        .override-conflict-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 18px;
            font-weight: 700;
        }

        .confirm-dialog-layout {
            min-width: 420px;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .confirm-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .confirm-header h3 {
            margin: 0;
            line-height: 1.3;
            font-size: 22px;
        }

        .confirm-copy {
            margin: 0;
            font-size: 16px;
            line-height: 1.5;
            color: var(--spectrum-alias-content-color-default);
        }

        .settings-form-card {
            width: 468px;
            box-sizing: border-box;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
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
        Store.filters,
        Store.page,
        Store.settings.fragmentId,
        Store.settings.creating,
        SettingsStore.rows,
        SettingsStore.loading,
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

    get isCreateMode() {
        return this.isCreating;
    }

    get isSettingsFormPage() {
        return this.isSettingsListPage && (this.isCreateMode || Boolean(this.fragmentId));
    }

    get isSettingsFormReady() {
        if (!this.isSettingsFormPage) return false;
        if (this.isCreateMode) return true;
        if (SettingsStore.loading.get()) return false;
        return Boolean(this.currentSettingRow);
    }

    get currentSettingRow() {
        if (!this.fragmentId || this.isCreateMode) return null;
        return SettingsStore.getRowStore(this.fragmentId)?.value || null;
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
        if (this.aem) SettingsStore.setAem(this.aem);
        if (!this.aem) SettingsStore.initAem(this.bucket, this.baseUrl);
        const aem = SettingsStore.aem;
        if (surface === this.loadedSurface && aem === this.#loadedAem) return;

        SettingsStore.loadSurface(surface);
        this.loadedSurface = surface;
        this.#loadedAem = aem;
    }

    #getDefaultForm() {
        return {
            label: '',
            name: '',
            description: '',
            templateIds: [],
            tags: [],
            valueType: 'boolean',
            value: true,
            locale: '',
        };
    }

    #getRowTags(row) {
        const fieldTags = row.fragment.getFieldValues('tags');
        if (fieldTags.length) return fieldTags;
        return row.fragment.tags?.map((tag) => tag.id || tag.title || tag) || [];
    }

    #normalizedForm(form) {
        const valueType = form.valueType || 'boolean';
        const value = valueType === 'boolean' ? Boolean(form.value) : `${form.value || ''}`;
        return {
            label: `${form.label || ''}`,
            name: `${form.name || ''}`.trim(),
            description: `${form.description || ''}`,
            templateIds: [...form.templateIds].sort(),
            tags: [...form.tags],
            valueType,
            value,
            locale: `${form.locale || ''}`,
        };
    }

    get hasUnsavedChanges() {
        if (!this.isSettingsFormPage) return false;
        return JSON.stringify(this.#normalizedForm(this.form)) !== JSON.stringify(this.#normalizedForm(this.formBaseline));
    }

    #valueTypeFromValue(value) {
        if (value === true || value === false) return 'boolean';
        return 'text';
    }

    #setFormField(field, value) {
        this.form = {
            ...this.form,
            [field]: value,
        };
    }

    #syncFormFromRoute() {
        if (!this.isSettingsListPage) {
            this.formRouteId = null;
            return;
        }

        const fragmentId = this.fragmentId;
        if (fragmentId && this.isCreateMode) {
            Store.settings.creating.set(false);
            return;
        }

        if (this.isCreateMode) {
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
        if (!row) return;

        this.dialog = null;
        this.form = {
            label: row.label,
            name: row.name,
            description: row.description,
            templateIds: [...row.templateIds],
            tags: [...this.#getRowTags(row)],
            valueType: row.valueType || this.#valueTypeFromValue(row.value),
            value: row.value,
            locale: '',
        };
        this.formBaseline = structuredClone(this.form);
        this.formRouteId = fragmentId;
    }

    #handleCreateSetting = () => {
        Store.settings.fragmentId.set(null);
        Store.settings.creating.set(true);
    };

    #handleEditSettingDialog = ({ detail: { id } }) => {
        Store.settings.creating.set(false);
        Store.settings.fragmentId.set(id);
    };

    #handleAddOverrideDialog = ({ detail: { id } }) => {
        const row = SettingsStore.getRowStore(id).value;
        this.dialog = { type: 'override', rowId: id };
        this.form = {
            label: row.label,
            name: row.name,
            description: row.description,
            templateIds: [...row.templateIds],
            tags: [],
            valueType: row.valueType || this.#valueTypeFromValue(row.value),
            value: row.value,
            locale: '',
        };
    };

    #openConfirmDialog(action, rowId, overrideId = null) {
        this.dialog = { type: 'confirm', action, rowId, overrideId };
    }

    #handlePublishDialog = ({ detail: { id } }) => {
        this.#openConfirmDialog('publish', id);
    };

    #handleUnpublishDialog = ({ detail: { id } }) => {
        this.#openConfirmDialog('unpublish', id);
    };

    #handleDeleteDialog = ({ detail: { id, parentId, isOverride } }) => {
        if (isOverride) {
            this.#openConfirmDialog('delete-override', parentId, id);
            return;
        }
        const row = SettingsStore.getRowStore(id)?.value;
        if (!row) return;
        if (row.locales.length === 0) {
            showToast('Top-level settings cannot be deleted.', 'negative');
            return;
        }
        this.#openConfirmDialog('delete', id);
    };

    #handleDialogCancel = () => {
        const resetForm = this.dialog?.type === 'override';
        this.dialog = null;
        if (!resetForm) return;
        this.form = this.#getDefaultForm();
    };

    #normalizedValue() {
        if (this.form.valueType === 'boolean') return Boolean(this.form.value);
        return `${this.form.value || ''}`;
    }

    get overrideConflict() {
        if (this.dialog?.type !== 'override') return null;
        if (!this.form.locale) return null;
        const row = SettingsStore.getRowStore(this.dialog.rowId).value;
        return row.overrides.find((override) => override.locale === this.form.locale) || null;
    }

    #closeSettingsFormPage() {
        Store.settings.creating.set(false);
        Store.settings.fragmentId.set(null);
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

        const payload = {
            label: this.form.label,
            name: this.form.name,
            description: this.form.description,
            templateIds: [...this.form.templateIds],
            tags: [...this.form.tags],
            valueType: this.form.valueType,
            value: this.#normalizedValue(),
        };

        if (this.isCreateMode) {
            const created = await SettingsStore.createSetting(payload);
            if (created) {
                this.formBaseline = this.#normalizedForm(this.form);
                this.#closeSettingsFormPage();
            }
            return;
        }

        const row = this.currentSettingRow;
        if (!row) return;
        const updated = await SettingsStore.updateSetting(row.id, payload);
        if (updated) {
            this.formBaseline = this.#normalizedForm(this.form);
            this.#closeSettingsFormPage();
        }
    };

    #handleDialogConfirm = async () => {
        if (this.dialog.type === 'override') {
            if (!this.form.locale) {
                showToast('Locale is required for overrides.', 'negative');
                return;
            }
            if (this.overrideConflict) {
                showToast('Conflict detected. Choose a different locale.', 'negative');
                return;
            }
            const created = await SettingsStore.addOverride(this.dialog.rowId, {
                locale: this.form.locale,
                templateIds: [...this.form.templateIds],
                tags: [...this.form.tags],
                valueType: this.form.valueType,
                value: this.#normalizedValue(),
                status: 'DRAFT',
                modifiedBy: 'Current user',
                modifiedAt: new Date().toISOString(),
            });
            if (created) this.#handleDialogCancel();
            return;
        }

        if (this.dialog.type === 'confirm') {
            let success = false;
            if (this.dialog.action === 'publish') success = await SettingsStore.publishSetting(this.dialog.rowId);
            if (this.dialog.action === 'unpublish') success = await SettingsStore.unpublishSetting(this.dialog.rowId);
            if (this.dialog.action === 'delete') success = await SettingsStore.removeSetting(this.dialog.rowId);
            if (this.dialog.action === 'delete-override') {
                success = await SettingsStore.removeOverride(this.dialog.rowId, this.dialog.overrideId);
            }
            if (success) this.#handleDialogCancel();
        }
    };

    #handleValueType = (valueType) => {
        const value = valueType === 'boolean' ? Boolean(this.form.value) : `${this.form.value || ''}`;
        this.form = {
            ...this.form,
            valueType,
            value,
        };
    };

    #handleTagsChange = (event) => {
        const tags = event.target.getAttribute('value');
        this.#setFormField('tags', tags ? tags.split(',') : []);
    };

    #handleTemplateChange = (event) => {
        this.#setFormField('templateIds', [...event.target.value]);
    };

    get localeOptions() {
        const locale = Store.filters.get().locale || 'en_US';
        const rows = SettingsStore.rows.get();
        const overrideLocales = rows.flatMap((rowStore) => rowStore.value.overrides.map((override) => override.locale));
        return [...new Set([locale, ...overrideLocales])];
    }

    get confirmDialogConfig() {
        const row = SettingsStore.getRowStore(this.dialog.rowId).value;
        const settingLabel = row.label;
        if (this.dialog.action === 'delete-override') {
            const override = row.overrides.find((item) => item.id === this.dialog.overrideId);
            return {
                title: 'Delete this setting override?',
                body: [
                    `Are you sure you want to delete '${override.label} (${override.locale})'?`,
                    'This action cannot be undone, and the override will be permanently removed.',
                ],
                confirmLabel: 'Delete',
                showIcon: false,
                variant: 'negative',
            };
        }
        if (this.dialog.action === 'publish') {
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
        if (this.dialog.action === 'unpublish') {
            return {
                title: 'Unpublish this setting?',
                body: [
                    `Are you sure you want to unpublish '${settingLabel}'?`,
                    'This will remove the setting from all associated cards. It may take up to 15 minutes for the changes to take effect.',
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

    get valueInputTemplate() {
        if (this.form.valueType === 'boolean') {
            return html`
                <sp-field-group>
                    <sp-field-label>Value</sp-field-label>
                    <sp-switch
                        size="m"
                        .checked=${Boolean(this.form.value)}
                        @change=${(event) => this.#setFormField('value', event.target.checked)}
                    >
                        ${Boolean(this.form.value) ? 'On' : 'Off'}
                    </sp-switch>
                </sp-field-group>
            `;
        }
        return html`
            <sp-field-group>
                <sp-field-label>Value</sp-field-label>
                <sp-textfield
                    name="setting-value"
                    multiline
                    .value=${`${this.form.value || ''}`}
                    @input=${(event) => this.#setFormField('value', event.target.value)}
                    placeholder="Enter value"
                ></sp-textfield>
            </sp-field-group>
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
        const row = SettingsStore.getRowStore(this.dialog.rowId).value;
        return html`
            <sp-dialog-wrapper
                open
                underlay
                .headline=${`Add override for '${row.label}'`}
                confirm-label="Add override"
                cancel-label="Cancel"
                @confirm=${this.#handleDialogConfirm}
                @cancel=${this.#handleDialogCancel}
            >
                <div class="settings-dialog-layout">
                    ${this.overrideConflict
                        ? html`
                              <div class="override-conflict">
                                  <div class="override-conflict-title">
                                      <sp-icon-alert></sp-icon-alert>
                                      <span>Conflict detected</span>
                                  </div>
                                  <span>
                                      This override is in conflict with an existing setting '${this.overrideConflict.label}
                                      (${this.overrideConflict.locale})'.
                                  </span>
                                  <span>View an existing setting or adjust your selection.</span>
                              </div>
                          `
                        : nothing}
                    <sp-field-group>
                        <sp-field-label>Template</sp-field-label>
                        <tree-picker-field
                            .tree=${TEMPLATE_TREE_TEST_DATA}
                            .value=${this.form.templateIds}
                            placeholder="Select template"
                            @change=${this.#handleTemplateChange}
                        ></tree-picker-field>
                    </sp-field-group>
                    <sp-field-group>
                        <sp-field-label>Locale</sp-field-label>
                        <sp-picker
                            name="setting-override-locale"
                            .value=${this.form.locale}
                            @change=${(event) => this.#setFormField('locale', event.target.value)}
                        >
                            <sp-menu-item value="">Select locale</sp-menu-item>
                            ${this.localeOptions.map(
                                (locale) => html`<sp-menu-item value=${locale}>${locale.replace('_', ' (')})</sp-menu-item>`,
                            )}
                        </sp-picker>
                    </sp-field-group>
                    ${this.tagsTemplate}
                    <sp-field-group>
                        <sp-field-label>Local value</sp-field-label>
                        <div class="value-type-row">
                            ${['boolean', 'text', 'richText', 'placeholder'].map(
                                (type) => html`
                                    <sp-button
                                        size="s"
                                        class="value-type-button"
                                        variant=${this.form.valueType === type ? 'accent' : 'secondary'}
                                        @click=${() => this.#handleValueType(type)}
                                    >
                                        ${type === 'richText' ? 'Rich text' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </sp-button>
                                `,
                            )}
                        </div>
                        ${this.valueInputTemplate}
                    </sp-field-group>
                </div>
            </sp-dialog-wrapper>
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
                <div class="confirm-dialog-layout">
                    <div class="confirm-header">
                        ${config.showIcon ? html`<sp-icon-alert></sp-icon-alert>` : nothing}
                        <h3>${config.title}</h3>
                    </div>
                    ${config.body.map((line) => html`<p class="confirm-copy">${line}</p>`)}
                </div>
            </sp-dialog-wrapper>
        `;
    }

    get discardConfirmationDialog() {
        if (!this.showDiscardDialog) return nothing;
        return html`
            <sp-underlay open @click=${this.cancelDiscard}></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                @sp-dialog-confirm=${this.discardConfirmed}
                @sp-dialog-dismiss=${this.cancelDiscard}
            >
                <h1 slot="heading">Confirm Discard</h1>
                <p>Are you sure you want to discard changes? This action cannot be undone.</p>
                <sp-button slot="button" variant="secondary" @click=${this.cancelDiscard}>Cancel</sp-button>
                <sp-button slot="button" variant="accent" id="btn-discard-setting" @click=${this.discardConfirmed}>
                    Discard
                </sp-button>
            </sp-dialog>
        `;
    }

    get settingsFormTemplate() {
        if (!this.isSettingsFormReady) return nothing;

        const heading = this.isCreateMode ? 'Create new setting' : 'Edit setting';
        const saveLabel = this.isCreateMode ? 'Create setting' : 'Save setting';

        return html`
            <sp-dialog-wrapper
                class="settings-editor-dialog"
                open
                underlay
                .headline=${heading}
                .confirmLabel=${saveLabel}
                cancel-label="Cancel"
                @confirm=${this.#handleFormSave}
                @cancel=${this.#handleFormCancel}
            >
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
                        <sp-textfield
                            name="setting-name-page"
                            ?readonly=${!this.isCreateMode}
                            .value=${this.form.name}
                            placeholder="Enter name"
                            @input=${(event) => this.#setFormField('name', event.target.value)}
                        ></sp-textfield>
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
                            .tree=${TEMPLATE_TREE_TEST_DATA}
                            .value=${this.form.templateIds}
                            placeholder="Select template"
                            @change=${this.#handleTemplateChange}
                        ></tree-picker-field>
                    </sp-field-group>
                    ${this.tagsTemplate}
                    <div class="value-definition">
                        <sp-field-label>Value type *</sp-field-label>
                        <div class="value-type-row">
                            ${['boolean', 'text', 'richText', 'placeholder'].map(
                                (type) => html`
                                    <sp-button
                                        size="s"
                                        class="value-type-button"
                                        variant=${this.form.valueType === type ? 'accent' : 'secondary'}
                                        @click=${() => this.#handleValueType(type)}
                                    >
                                        ${type === 'richText' ? 'Rich text' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </sp-button>
                                `,
                            )}
                        </div>
                        ${this.valueInputTemplate}
                    </div>
                </div>
            </sp-dialog-wrapper>
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
        return html`${this.headerTemplate}${this.tableTemplate}${this.settingsFormTemplate}${this.dialogTemplate}`;
    }
}

customElements.define('mas-settings', MasSettings);
