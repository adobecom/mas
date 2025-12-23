import { LitElement, html, nothing } from 'lit';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { MasRepository } from './mas-repository.js';
import { styles } from './mas-translation-editor.css.js';
import router from './router.js';
import { PAGE_NAMES, TRANSLATION_PROJECT_MODEL_ID, QUICK_ACTION } from './constants.js';
import { normalizeKey, showToast } from './utils.js';
import { TranslationProject } from './translation/translation-project.js';
import './mas-quick-actions.js';

class MasTranslationEditor extends LitElement {
    static styles = styles;

    static properties = {
        isLoading: { type: Boolean, state: true },
        isNewTranslationProject: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        disabledActions: { type: Set },
    };

    inEdit = Store.translationProjects.inEdit;
    translationProjectId = Store.translationProjects.translationProjectId;
    storeController = null;

    constructor() {
        super();
        this.isLoading = false;
        this.isNewTranslationProject = false;
        this.confirmDialogConfig = null;
        this.isDialogOpen = false;
        this.disabledActions = new Set([
            QUICK_ACTION.SAVE,
            QUICK_ACTION.DISCARD,
            QUICK_ACTION.DELETE,
            QUICK_ACTION.DUPLICATE,
            QUICK_ACTION.PUBLISH,
            QUICK_ACTION.CANCEL,
            QUICK_ACTION.COPY,
            QUICK_ACTION.LOCK,
        ]);
    }

    async connectedCallback() {
        super.connectedCallback();

        const translationProjectId = this.translationProjectId.get();
        if (translationProjectId) {
            if (!this.fragmentStore) {
                this.isLoading = true;
                await this.#loadTranslationProjectById(translationProjectId);
                this.isLoading = false;
            }
            this.#updateDisabledActions({ remove: [QUICK_ACTION.DELETE] });
        } else {
            this.isNewTranslationProject = true;
            const newTranslationProject = this.#initializeNewTranslationProject();
            this.fragmentStore = new FragmentStore(newTranslationProject);
            this.#updateDisabledActions({ add: [QUICK_ACTION.SAVE] });
        }

        this.storeController = new StoreController(this, this.fragmentStore);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get fragmentStore() {
        return this.inEdit.get();
    }

    set fragmentStore(fragmentStore) {
        this.inEdit.set(fragmentStore);
    }

    #updateDisabledActions({ add = [], remove = [] }) {
        const newSet = new Set(this.disabledActions);
        remove.forEach((action) => newSet.delete(action));
        add.forEach((action) => newSet.add(action));
        this.disabledActions = newSet;
    }

    async #loadTranslationProjectById(id) {
        try {
            const fragment = await this.repository.aem.sites.cf.fragments.getById(id);
            if (fragment) {
                const translationProject = new TranslationProject(fragment);
                this.fragmentStore = new FragmentStore(translationProject);
            }
        } catch (error) {
            console.error('Failed to load translation project:', error);
            showToast('Failed to load translation project.', 'negative');
        }
    }

    #initializeNewTranslationProject() {
        return new TranslationProject({
            id: null,
            title: '',
            fields: [{ name: 'title', type: 'text', values: [''] }],
        });
    }

    get translationStatus() {
        return 'All required languages have been preselected for this project. They are mandatory and cannot be changed.';
    }

    #handleFragmentUpdate({ target, detail, values }) {
        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }
        this.fragmentStore.updateField(fieldName, value);
        this.#updateDisabledActions({ remove: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
    }

    #validateRequiredFields(fragment = {}) {
        const requiredFields = ['title'];
        return requiredFields.every((field) => fragment.getFieldValue(field));
    }

    async #handleCreateTranslationProject() {
        if (!this.#validateRequiredFields(this.fragment)) {
            showToast('Please fill in all required fields.', 'negative');
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
        showToast('Creating project...');
        try {
            const newTranslationProject = await this.repository.createFragment(fragmentPayload, false);
            showToast('Translation project created successfully.', 'positive');
            Store.translationProjects.inEdit.set(new FragmentStore(newTranslationProject));
            Store.translationProjects.translationProjectId.set(newTranslationProject.id);
            this.isNewTranslationProject = false;

            // Reconnect the StoreController to the new FragmentStore instance
            this.storeController.hostDisconnected();
            this.storeController = new StoreController(this, this.fragmentStore);
            this.storeController.hostConnected();

            this.#updateDisabledActions({ add: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD], remove: [QUICK_ACTION.DELETE] });
        } catch (error) {
            console.error('Error creating translation project', error);
            showToast('Failed to create translation project.', 'negative');
        }
    }

    async #handleUpdateTranslationProject() {
        if (!this.#validateRequiredFields(this.fragment)) {
            showToast('Please fill in all required fields.', 'negative');
            return;
        }
        this.fragment.updateFieldInternal('title', this.fragment.getFieldValue('title'));
        showToast('Updating the project...');
        try {
            await this.repository.saveFragment(this.fragmentStore, false);
            this.#updateDisabledActions({ add: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
        } catch (error) {
            console.error('Error updating translation project', error);
            showToast('Failed to update translation project.', 'negative');
            return;
        }
        showToast('Translation project updated successfully.', 'positive');
    }

    async #handleDeleteTranslationProject() {
        if (this.isDialogOpen) return;
        const confirmed = await this.#showDialog(
            'Delete Translation Project',
            `Are you sure you want to delete the translation project "${this.inEdit?.value?.value?.fields[0]?.values?.[0]}"? This action cannot be undone`,
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'confirmation',
            },
        );
        if (!confirmed) return;
        try {
            this.isLoading = true;
            showToast('Deleting translation project...');
            await this.repository.deleteFragment(this.inEdit.value.value, { startToast: false, endToast: false });
            Store.translationProjects.inEdit.set(null);
            Store.translationProjects.translationProjectId.set('');
            showToast('Translation project successfully deleted.', 'positive');
            router.navigateToPage(PAGE_NAMES.TRANSLATIONS)();
        } catch (error) {
            console.error('Error deleting translation project:', error);
            showToast('Failed to delete translation project.', 'negative');
        } finally {
            this.isLoading = false;
        }
    }

    async #handleDiscard() {
        if (this.fragment?.hasChanges) {
            const confirmed = await this.#showDialog(
                'Confirm Discard',
                'Are you sure you want to discard changes? This action cannot be undone',
                {
                    confirmText: 'Discard',
                    cancelText: 'Cancel',
                    variant: 'confirmation',
                },
            );
            if (!confirmed) return;
        }
        this.fragmentStore.discardChanges();
        Store.translationProjects.inEdit.set(new FragmentStore(this.fragment));
        Store.translationProjects.translationProjectId.set(this.fragment.id);
        this.#updateDisabledActions({ add: [QUICK_ACTION.DISCARD, QUICK_ACTION.SAVE] });
    }

    async #showDialog(title, message, options = {}) {
        if (this.isDialogOpen) return false;
        this.isDialogOpen = true;
        const { confirmText = 'OK', cancelText = 'Cancel', variant = 'primary' } = options;
        return new Promise((resolve) => {
            this.confirmDialogConfig = {
                title,
                message,
                confirmText,
                cancelText,
                variant,
                onConfirm: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                },
            };
        });
    }

    /**
     * Prompts the user to discard unsaved changes.
     * Used by router for navigation confirmation.
     * @returns {Promise<boolean>} - True if confirmed or no changes, false if canceled
     */
    async promptDiscardChanges() {
        if (!this.fragment?.hasChanges) return true;
        return this.#showDialog('Discard Changes', 'You have unsaved changes. Are you sure you want to leave this page?', {
            confirmText: 'Discard',
            cancelText: 'Cancel',
            variant: 'confirmation',
        });
    }

    #handleCloseAddFilesDialog = (event) => {
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        event.target.dispatchEvent(closeEvent);
    };

    #handleBackToBreadcrumb = () => {
        router.navigateToPage(PAGE_NAMES.TRANSLATIONS)();
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
        if (!this.confirmDialogConfig) return nothing;

        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;

        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="promotion-unsaved-changes-dialog"
                    .headline=${title}
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
            <div class="translation-editor-breadcrumb">
                <sp-breadcrumbs>
                    <sp-breadcrumb-item @click=${this.#handleBackToBreadcrumb}>Translations</sp-breadcrumb-item>
                    <sp-breadcrumb-item
                        >${this.isNewTranslationProject ? 'Create new project' : 'Edit project'}</sp-breadcrumb-item
                    >
                </sp-breadcrumbs>
            </div>

            ${this.renderConfirmDialog()}

            <div class="translation-editor-form">
                <div class="header">
                    <h1>${this.isNewTranslationProject ? 'Create new project' : 'Edit project'}</h1>
                </div>
                ${this.isLoading
                    ? html`
                          <div class="loading-container">
                              <sp-progress-circle
                                  label="Loading translation project"
                                  indeterminate
                                  size="l"
                              ></sp-progress-circle>
                          </div>
                      `
                    : html`<div class="form-field general-info">
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
                            <strong>Add files</strong><br />
                            <span>Choose files that need to be translated.</span>
                        </div>
                    </div>
                </div>

                <mas-quick-actions
                    .actions=${[
                        QUICK_ACTION.SAVE,
                        QUICK_ACTION.DUPLICATE,
                        QUICK_ACTION.PUBLISH,
                        QUICK_ACTION.CANCEL,
                        QUICK_ACTION.COPY,
                        QUICK_ACTION.LOCK,
                        QUICK_ACTION.DISCARD,
                        QUICK_ACTION.DELETE,
                    ]}
                    .disabled=${this.disabledActions}
                    @save=${
                        this.isNewTranslationProject
                            ? this.#handleCreateTranslationProject
                            : this.#handleUpdateTranslationProject
                    }
                    @delete=${this.#handleDeleteTranslationProject}
                    @discard=${this.#handleDiscard}
                ></mas-quick-actions>
            </div>`}
            </div>
        `;
    }
}

customElements.define('mas-translation-editor', MasTranslationEditor);
