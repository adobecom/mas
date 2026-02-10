import { LitElement, html, css, nothing } from 'lit';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { QUICK_ACTION, ROOT_PATH, SETTINGS_MODEL_ID } from '../constants.js';
import { showToast } from '../utils.js';
import '../mas-quick-actions.js';

class MasSettings extends LitElement {
    createRenderRoot() {
        return this;
    }

    static properties = {
        loading: { type: Boolean, state: true },
        settingsFragment: { type: Object, state: true },
        showSecureLabel: { type: Boolean, state: true },
        checkoutWorkflow: { type: String, state: true },
        hasChanges: { type: Boolean, state: true },
        disabledActions: { type: Set, state: true },
        showCreateDialog: { type: Boolean, state: true },
    };

    reactiveController = new ReactiveController(this, [Store.filters, Store.search]);

    constructor() {
        super();
        this.loading = true;
        this.settingsFragment = null;
        this.showSecureLabel = false;
        this.checkoutWorkflow = '';
        this.hasChanges = false;
        this.disabledActions = new Set([QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD]);
        this.showCreateDialog = false;
    }

    get locale() {
        return Store.localeOrRegion();
    }
    get surface() {
        return Store.surface();
    }
    get repository() {
        return document.querySelector('mas-repository');
    }
    get aem() {
        return this.repository?.aem;
    }

    get settingsFragmentPath() {
        if (!this.surface || !this.locale) return null;
        return `${ROOT_PATH}/${this.surface}/${this.locale}/settings`;
    }

    get settingsFolderPath() {
        if (!this.surface || !this.locale) return null;
        return `${ROOT_PATH}/${this.surface}/${this.locale}`;
    }

    async connectedCallback() {
        super.connectedCallback();
        await this.#loadSettings();
    }

    async updated(changedProps) {
        const pathChanged = this.settingsFragmentPath !== this._lastPath;
        if (pathChanged && this.settingsFragmentPath) {
            this._lastPath = this.settingsFragmentPath;
            await this.#loadSettings();
        }
    }

    async #loadSettings() {
        if (!this.settingsFragmentPath || !this.aem) {
            this.loading = false;
            return;
        }

        this.loading = true;
        this.settingsFragment = null;
        this.showSecureLabel = false;
        this.checkoutWorkflow = '';
        this.showCreateDialog = false;

        try {
            const fragment = await this.aem.sites.cf.fragments.getByPath(this.settingsFragmentPath);
            this.settingsFragment = fragment;

            const fields = fragment.fields || [];
            this.showSecureLabel = fields.find((f) => f.name === 'showSecureLabel')?.values?.[0] ?? false;
            this.checkoutWorkflow = fields.find((f) => f.name === 'checkoutWorkflow')?.values?.[0] ?? '';

            this.hasChanges = false;
            this.disabledActions = new Set([QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD]);
        } catch (error) {
            // Fragment not found - show create dialog
            this.showCreateDialog = true;
        } finally {
            this.loading = false;
        }
    }

    async #createSettingsFragment() {
        this.showCreateDialog = false;
        this.loading = true;

        try {
            await this.aem.ensureFolderExists(this.settingsFolderPath);

            const newFragment = await this.aem.sites.cf.fragments.create({
                title: 'Settings',
                name: 'settings',
                parentPath: this.settingsFolderPath,
                modelId: SETTINGS_MODEL_ID,
                fields: [
                    { name: 'showSecureLabel', type: 'boolean', values: [false] },
                    { name: 'checkoutWorkflow', type: 'text', values: [''] },
                ],
            });

            this.settingsFragment = newFragment;
            this.showSecureLabel = false;
            this.checkoutWorkflow = '';
            this.hasChanges = false;
            this.disabledActions = new Set([QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD]);

            showToast('Settings created!', 'positive');
        } catch (error) {
            console.error('Failed to create settings:', error);
            showToast('Failed to create settings.', 'negative');
        } finally {
            this.loading = false;
        }
    }

    #cancelCreate() {
        this.showCreateDialog = false;
    }

    #handleFieldChange() {
        this.hasChanges = true;
        this.disabledActions = new Set();
    }

    async #saveSettings() {
        if (!this.settingsFragment) return;

        showToast('Saving settings...');
        try {
            const updatedFields = this.settingsFragment.fields.map((field) => {
                if (field.name === 'showSecureLabel') {
                    return { ...field, values: [this.showSecureLabel] };
                }
                if (field.name === 'checkoutWorkflow') {
                    return { ...field, values: [this.checkoutWorkflow] };
                }
                return field;
            });

            const fragmentToSave = {
                ...this.settingsFragment,
                fields: updatedFields,
            };

            const saved = await this.aem.sites.cf.fragments.save(fragmentToSave);
            this.settingsFragment = saved;
            this.hasChanges = false;
            this.disabledActions = new Set([QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD]);
            showToast('Settings saved!', 'positive');
        } catch (error) {
            console.error('Save failed:', error);
            showToast('Failed to save settings.', 'negative');
        }
    }

    #discardChanges() {
        const fields = this.settingsFragment?.fields || [];
        this.showSecureLabel = fields.find((f) => f.name === 'showSecureLabel')?.values?.[0] ?? false;
        this.checkoutWorkflow = fields.find((f) => f.name === 'checkoutWorkflow')?.values?.[0] ?? '';
        this.hasChanges = false;
        this.disabledActions = new Set([QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD]);
    }

    async #publishSettings() {
    if (!this.settingsFragment) return;
    
    showToast('Publishing settings...');
    try {
        await this.aem.sites.cf.fragments.publish(this.settingsFragment);
        showToast('Settings published!', 'positive');
    } catch (error) {
        console.error('Publish failed:', error);
        showToast('Failed to publish settings.', 'negative');
    }
}

    get createDialog() {
        if (!this.showCreateDialog) return nothing;
        return html`
            <sp-underlay open @click=${this.#cancelCreate}></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                @sp-dialog-confirm=${this.#createSettingsFragment}
                @sp-dialog-dismiss=${this.#cancelCreate}
            >
                <h1 slot="heading">Create Settings?</h1>
                <p>No settings found for ${this.locale}. Do you want to create one?</p>
                <sp-button slot="button" variant="secondary" @click=${this.#cancelCreate}>Cancel</sp-button>
                <sp-button slot="button" variant="accent" @click=${this.#createSettingsFragment}>Create</sp-button>
            </sp-dialog>
        `;
    }

    render() {
        if (this.loading) {
            return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
        }

        if (!this.surface) {
            return html`<p>Please select a surface.</p>`;
        }

        if (!this.settingsFragment) {
            return html`
                <div class="settings-header">
                    <h2 class="settings-title">Card settings</h2>
                    <p class="settings-subtitle">Surface: ${this.surface} | Locale: ${this.locale}</p>
                </div>
                <p>No settings configured for this locale.</p>
                ${this.createDialog}
            `;
        }

        return html`
            <div class="settings-header">
                <h2 class="settings-title">Card settings</h2>
                <p class="settings-subtitle">Surface: ${this.surface} | Locale: ${this.locale}</p>
            </div>
            <div class="settings-content">
                <sp-checkbox
                    ?checked=${this.showSecureLabel}
                    @change=${(e) => {
                        this.showSecureLabel = e.target.checked;
                        this.#handleFieldChange();
                    }}
                    >Show Secure transaction</sp-checkbox
                >

                <div>
                    <sp-field-label>Checkout Workflow</sp-field-label>
                    <sp-textfield
                        value=${this.checkoutWorkflow}
                        @input=${(e) => {
                            this.checkoutWorkflow = e.target.value;
                            this.#handleFieldChange();
                        }}
                    ></sp-textfield>
                </div>
            </div>

            <mas-quick-actions
                .actions=${[QUICK_ACTION.SAVE, QUICK_ACTION.PUBLISH, QUICK_ACTION.DISCARD]}
                .disabled=${this.disabledActions}
                @save=${this.#saveSettings}
                @publish=${this.#publishSettings}
                @discard=${this.#discardChanges}
            ></mas-quick-actions>
        `;
    }
}

customElements.define('mas-settings', MasSettings);
