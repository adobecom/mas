import { LitElement, html, nothing } from 'lit';
import router from './router.js';
import StoreController from './reactivity/store-controller.js';
import { MasRepository } from './mas-repository.js';
import { styles } from './mas-localization-editor.css.js';
import { PAGE_NAMES, TRANSLATION_PROJECT_MODEL_ID } from './constants.js';
import { normalizeKey, showToast } from './utils.js';
import { TranslationProject } from './localization/translation-project.js';

class MasLocalizationEditor extends LitElement {
    static styles = styles;

    static properties = {
        storeController: { type: Object, state: true },
        confirmDialogConfig: { type: Object, state: true },
        isDialogOpen: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.storeController = null;
        this.confirmDialogConfig = null;
        this.isDialogOpen = false;
    }

    async connectedCallback() {
        super.connectedCallback();

        const newTranslationProject = this.#initializeNewTranslationProject();
        const { FragmentStore } = await import('./reactivity/fragment-store.js');
        this.fragmentStore = new FragmentStore(newTranslationProject);
        this.storeController = new StoreController(this, this.fragmentStore);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get translationStatus() {
        return 'All required languages have been preselected for this project. They are mandatory and cannot be changed.';
    }

    #initializeNewTranslationProject() {
        return new TranslationProject({
            id: null,
            title: '',
            fields: [{ name: 'title', type: 'text', values: [''] }],
        });
    }

    #handleFragmentUpdate({ target, detail, values }) {
        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }
        this.fragmentStore.updateField(fieldName, value);
    }

    #validateRequiredFields(fragment = {}) {
        const requiredFields = ['title'];
        return requiredFields.every((field) => fragment.getFieldValue(field));
    }

    async #handleCreateTranslationProject() {
        if (!this.#validateRequiredFields(this.fragment)) {
            showToast('Please fill in all required fields', 'negative');
            return;
        }

        const typeMap = {
            title: { type: 'text' },
        };

        const fragmentPayload = {
            name: normalizeKey(this.fragment.getFieldValue('title')),
            parentPath: this.repository.getTranslationsPath(),
            modelId: TRANSLATION_PROJECT_MODEL_ID,
            title: this.fragment.getFieldValue('title'),
            fields: this.fragment.fields.map((field) => ({
                name: field.name,
                ...(typeMap[field.name] && { type: typeMap[field.name].type }),
                ...(typeMap[field.name] && { multiple: typeMap[field.name].multiple }),
                values: field.values,
            })),
        };

        try {
            await this.repository.createFragment(fragmentPayload);
            showToast(
                'Translation project created successfully. You will be redirected to the list of translation projects.',
                'positive',
            );
            setTimeout(() => router.navigateToPage(PAGE_NAMES.LOCALIZATION)(), 2000);
        } catch (error) {
            console.error('Error creating translation project', error);
            showToast('Failed to create translation project', 'negative');
        }
    }

    #handleCloseAddFilesDialog = (event) => {
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        event.target.dispatchEvent(closeEvent);
    };

    renderAddFilesDialog() {
        return html`
            <sp-dialog-wrapper
                slot="click-content"
                headline="Select files"
                confirm-label="Done"
                cancel-label="Cancel"
                size="l"
                underlay
                @confirm=${this.#handleCloseAddFilesDialog}
            >
                To be implemented...
            </sp-dialog-wrapper>
        `;
    }

    renderConfirmDialog() {
        if (!this.confirmDialogConfig || !this.fragment?.hasChanges) return nothing;

        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;

        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="promotion-unsaved-changes-dialog"
                    .heading=${title}
                    .variant=${variant || 'negative'}
                    .confirmLabel=${confirmText}
                    .cancelLabel=${cancelText}
                    @confirm=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onConfirm && onConfirm();
                    }}
                    @cancel=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onCancel && onCancel();
                    }}
                >
                    <div>${message}</div>
                </sp-dialog-wrapper>
            </div>
        `;
    }

    render() {
        let form = nothing;
        if (this.fragment) {
            form = Object.fromEntries([...this.fragment.fields.map((f) => [f.name, f])]);
        }
        return html`
            <div class="localization-editor-breadcrumb">
                <sp-breadcrumbs>
                    <sp-breadcrumb-item href="/studio.html#page=localization">Localization</sp-breadcrumb-item>
                    <sp-breadcrumb-item>Create new project</sp-breadcrumb-item>
                </sp-breadcrumbs>
            </div>

            ${this.renderConfirmDialog()}

            <div class="localization-editor-form">
                <div class="header">
                    <h1>Create new project</h1>
                </div>
                <div class="form-field general-info">
                    <h2>General Info</h2>
                    <sp-field-label for="title" required>Title</sp-field-label>
                    <sp-textfield
                        id="title"
                        data-field="title"
                        value="${form.title?.values[0]}"
                        @input=${this.#handleFragmentUpdate}
                    ></sp-textfield>
                </div>
                <div class="form-field">
                    <h2>Translation languages</h2>
                    <p>${this.translationStatus}</p>
                </div>
                <div class="form-field select-files">
                    <h2>Select files</h2>
                    <div class="files-empty-state">
                        <div class="icon">
                            <overlay-trigger type="modal" id="add-files-overlay">
                                ${this.renderAddFilesDialog()}
                                <sp-button slot="trigger" variant="secondary" size="xl" icon-only>
                                    <sp-icon-add size="xxl" slot="icon" label="Add Files"></sp-icon-add>
                                </sp-button>
                            </overlay-trigger>
                        </div>
                        <div class="label">
                            <strong>Add Files.</strong><br />
                            <span>Choose files that need to be translated.</span>
                        </div>
                    </div>
                </div>
                <div class="buttons">
                    <sp-button @click=${this.#handleCreateTranslationProject}>Create</sp-button>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-localization-editor', MasLocalizationEditor);
