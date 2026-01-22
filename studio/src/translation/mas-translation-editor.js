import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { MasRepository, getFromFragmentCache } from '../mas-repository.js';
import { styles } from './mas-translation-editor.css.js';
import router from '../router.js';
import { PAGE_NAMES, TRANSLATION_PROJECT_MODEL_ID, QUICK_ACTION } from '../constants.js';
import { normalizeKey, showToast } from '../utils.js';
import { TranslationProject } from './translation-project.js';
import './mas-translation-files.js';
import './mas-select-fragments-table.js';
import '../mas-quick-actions.js';

class MasTranslationEditor extends LitElement {
    static styles = styles;

    static properties = {
        isLoading: { type: Boolean, state: true },
        isNewTranslationProject: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        disabledActions: { type: Set, state: true },
        isSelectedFilesOpen: { type: Boolean, state: true },
        selectedFilesSnapshot: { type: Set, state: true },
        showSelectedEmptyState: { type: Boolean, state: true },
        isOverlayOpen: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.isLoading = false;
        this.isNewTranslationProject = false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
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
        this.isSelectedFilesOpen = false;
        this.selectedFilesSnapshot = new Set();
        this.showSelectedEmptyState = true;
        this.isOverlayOpen = false;
    }

    async connectedCallback() {
        super.connectedCallback();
        const translationProjectId = Store.translationProjects.translationProjectId.get();
        if (translationProjectId) {
            if (this.translationProjectStore) {
                this.showSelectedEmptyState =
                    this.translationProject?.fields.find((field) => field.name === 'items')?.values?.length === 0;
            } else {
                await this.#loadTranslationProjectById(translationProjectId);
            }
            this.#updateDisabledActions({ remove: [QUICK_ACTION.DELETE] });
        } else {
            this.#initializeNewTranslationProject();
        }
        this.storeController = new StoreController(this, this.translationProjectStore);
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get translationProject() {
        return this.translationProjectStore?.get();
    }

    set translationProjectStore(translationProjectStore) {
        Store.translationProjects.inEdit.set(translationProjectStore);
    }

    get translationProjectStore() {
        return Store.translationProjects.inEdit.get();
    }

    get selectedFilesCount() {
        return this.translationProjectStore?.get()?.fields?.find((field) => field.name === 'items')?.values?.length;
    }

    get languages() {
        return 'All required languages have been preselected for this project. They are mandatory and cannot be changed.';
    }

    #updateDisabledActions({ add = [], remove = [] }) {
        const newSet = new Set(this.disabledActions);
        remove.forEach((action) => newSet.delete(action));
        add.forEach((action) => newSet.add(action));
        this.disabledActions = newSet;
    }

    async #loadTranslationProjectById(id) {
        if (!id) return;
        this.isLoading = true;
        try {
            let fragment = await getFromFragmentCache(id);
            if (!fragment) {
                fragment = await this.repository.aem.sites.cf.fragments.getById(id);
            }
            if (fragment) {
                const translationProject = new TranslationProject(fragment);
                this.translationProjectStore = new FragmentStore(translationProject);
                const preselected = this.translationProjectStore.get()?.fields.find((field) => field.name === 'items')?.values;
                const selectedPaths = new Set(preselected || []);
                this.showSelectedEmptyState = selectedPaths.size === 0;
            }
            this.#updateDisabledActions({ remove: [QUICK_ACTION.DELETE] });
        } catch (err) {
            console.error('Failed to load translation project:', err);
            showToast('Failed to load translation project.', 'negative');
        } finally {
            this.isLoading = false;
        }
    }

    #initializeNewTranslationProject() {
        const newProject = new TranslationProject({
            id: null,
            title: '',
            fields: [
                { name: 'title', type: 'text', multiple: false, values: [] },
                { name: 'status', type: 'text', multiple: false, values: [] },
                { name: 'items', type: 'content-fragment', multiple: true, values: [] },
                { name: 'targetLocales', type: 'text', multiple: true, values: [] },
                { name: 'submissionDate', type: 'date-time', multiple: false, values: [] },
            ],
        });
        this.isNewTranslationProject = true;
        this.translationProjectStore = new FragmentStore(newProject);
        this.showSelectedEmptyState = true;
    }

    #handleFragmentUpdate({ target, detail, values }) {
        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }
        this.translationProjectStore.updateField(fieldName, value);
        this.#updateDisabledActions({ remove: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
    }

    #validateRequiredFields(translationProject = {}) {
        const requiredFields = ['title'];
        return requiredFields.every((field) => translationProject.getFieldValue(field));
    }

    async #createTranslationProject() {
        if (!this.#validateRequiredFields(this.translationProject)) {
            showToast('Please fill in all required fields.', 'negative');
            return;
        }

        const typeMap = {
            title: { type: 'text', multiple: false },
            status: { type: 'text', multiple: false },
            items: { type: 'content-fragment', multiple: true },
            targetLocales: { type: 'text', multiple: true },
            submissionDate: { type: 'date-time', multiple: false },
        };

        const fragmentPayload = {
            name: normalizeKey(this.translationProject.getFieldValue('title')),
            parentPath: this.repository.getTranslationsPath(),
            modelId: TRANSLATION_PROJECT_MODEL_ID,
            title: this.translationProject.getFieldValue('title'),
            fields: this.translationProject.fields.map((field) => ({
                name: field.name,
                type: typeMap[field.name]?.type ?? field.type,
                multiple: typeMap[field.name]?.multiple ?? field.multiple ?? false,
                values: field.values,
            })),
        };

        showToast('Creating project...');
        try {
            const newTranslationProject = await this.repository.createFragment(fragmentPayload, false);
            if (newTranslationProject) {
                showToast('Translation project created successfully.', 'positive');
                Store.translationProjects.inEdit.set(new FragmentStore(newTranslationProject));
                Store.translationProjects.translationProjectId.set(newTranslationProject.id);
                this.isNewTranslationProject = false;

                this.storeController.hostDisconnected();
                this.storeController = new StoreController(this, this.translationProjectStore);
                this.storeController.hostConnected();
                this.#updateDisabledActions({ add: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD], remove: [QUICK_ACTION.DELETE] });
            }
        } catch (error) {
            console.error('Error creating translation project', error);
            showToast('Failed to create translation project.', 'negative');
        }
    }

    async #updateTranslationProject() {
        if (!this.#validateRequiredFields(this.translationProject)) {
            showToast('Please fill in all required fields.', 'negative');
            return;
        }
        this.translationProject.updateFieldInternal('title', this.translationProject.getFieldValue('title'));
        showToast('Updating the project...');
        try {
            await this.repository.saveFragment(this.translationProjectStore, false);
            this.#updateDisabledActions({ add: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
        } catch (error) {
            console.error('Error updating translation project', error);
            showToast('Failed to update translation project.', 'negative');
            return;
        }
        showToast('Translation project updated successfully.', 'positive');
    }

    async #deleteTranslationProject() {
        if (this.isDialogOpen) return;
        const confirmed = await this.#showDialog(
            'Delete Translation Project',
            `Are you sure you want to delete the translation project "${this.translationProject?.getFieldValue('title')}"? This action cannot be undone`,
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
            await this.repository.deleteFragment(this.translationProjectStore, {
                startToast: false,
                endToast: false,
            });
            Store.translationProjects.inEdit.set(null);
            Store.translationProjects.translationProjectId.set('');
            Store.translationProjects.showSelected.set(false);
            showToast('Translation project successfully deleted.', 'positive');
            router.navigateToPage(PAGE_NAMES.TRANSLATIONS)();
        } catch (error) {
            console.error('Error deleting translation project:', error);
            showToast('Failed to delete translation project.', 'negative');
        } finally {
            this.isLoading = false;
        }
    }

    async #discardUnsavedChanges() {
        if (this.translationProject?.hasChanges) {
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
        this.translationProjectStore.discardChanges();
        Store.translationProjects.inEdit.set(new FragmentStore(this.translationProject));
        Store.translationProjects.translationProjectId.set(this.translationProject.id);
        this.showSelectedEmptyState = this.selectedFilesCount === 0;
        Store.translationProjects.showSelected.set(false);
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
        if (!this.translationProject?.hasChanges && this.selectedFilesCount === 0) return true;
        return this.#showDialog('Discard Changes', 'You have unsaved changes. Are you sure you want to leave this page?', {
            confirmText: 'Discard',
            cancelText: 'Cancel',
            variant: 'confirmation',
        });
    }

    #confirmFileSelection = ({ target }) => {
        this.showSelectedEmptyState = this.selectedFilesCount === 0;
        this.isOverlayOpen = false;
        this.#updateDisabledActions({ remove: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #cancelFileSelection = ({ target }) => {
        this.translationProjectStore?.updateField('items', Array.from(this.selectedFilesSnapshot));
        this.showSelectedEmptyState = this.selectedFilesCount === 0;
        this.isOverlayOpen = false;
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #handleBackToBreadcrumb = () => {
        router.navigateToPage(PAGE_NAMES.TRANSLATIONS)();
    };

    createSnapshot() {
        this.isOverlayOpen = true;
        this.selectedFilesSnapshot = new Set(
            this.translationProject?.fields.find((field) => field.name === 'items')?.values || [],
        );
    }

    renderAddFilesDialog() {
        return html`
            <sp-dialog-wrapper
                class="add-files-dialog"
                slot="click-content"
                headline="Select files"
                confirm-label="Add selected files"
                cancel-label="Cancel"
                underlay
                no-divider
                @confirm=${this.#confirmFileSelection}
                @cancel=${this.#cancelFileSelection}
            >
                ${this.isOverlayOpen ? html`<mas-translation-files></mas-translation-files>` : nothing}
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
                        value="${this.translationProject?.fields.find((field) => field.name === 'title')?.values[0] ?? ''}"
                        @input=${this.#handleFragmentUpdate}
                    ></sp-textfield>
                </div>
                <div class="form-field">
                    <h2>Translation languages</h2>
                    <p>${this.languages}</p>
                </div>
                    ${
                        this.showSelectedEmptyState
                            ? html`
                                  <div class="form-field select-files">
                                      <h2>Select files</h2>
                                      <div class="files-empty-state">
                                          <div class="icon">
                                              <overlay-trigger
                                                  type="modal"
                                                  id="add-files-overlay"
                                                  triggered-by="click"
                                                  @sp-opened=${this.createSnapshot}
                                                  @sp-closed=${() => (this.isOverlayOpen = false)}
                                              >
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
                              `
                            : html`<div class="form-field selected-files">
                                  <div class="selected-files-header">
                                      <h2>
                                          Selected files
                                          <span>(${this.selectedFilesCount})</span>
                                      </h2>
                                      ${this.isSelectedFilesOpen
                                          ? html`
                                                <sp-button
                                                    icon-only
                                                    class="toggle-btn"
                                                    @click=${() => (this.isSelectedFilesOpen = false)}
                                                >
                                                    <sp-icon-chevron-up slot="icon" label="Close"></sp-icon-chevron-up>
                                                </sp-button>
                                            `
                                          : html`
                                                <div>
                                                    <overlay-trigger
                                                        type="modal"
                                                        id="add-files-overlay"
                                                        triggered-by="click"
                                                        @sp-closed=${() => (this.isOverlayOpen = false)}
                                                    >
                                                        ${this.renderAddFilesDialog()}
                                                        <sp-button
                                                            slot="trigger"
                                                            class="trigger-btn"
                                                            @click=${this.createSnapshot}
                                                        >
                                                            <sp-icon-edit slot="icon" label="Edit Files"></sp-icon-edit>
                                                            Edit
                                                        </sp-button>
                                                    </overlay-trigger>
                                                    <sp-button
                                                        icon-only
                                                        class="toggle-btn"
                                                        @click=${() => (this.isSelectedFilesOpen = true)}
                                                    >
                                                        <sp-icon-chevron-down slot="icon" label="Open"></sp-icon-chevron-down>
                                                    </sp-button>
                                                </div>
                                            `}
                                  </div>
                                  ${this.isSelectedFilesOpen
                                      ? html` <mas-select-fragments-table .type=${'view-only'}></mas-select-fragments-table> `
                                      : nothing}
                              </div>`
                    }

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
                    @save=${this.isNewTranslationProject ? this.#createTranslationProject : this.#updateTranslationProject}
                    @delete=${this.#deleteTranslationProject}
                    @discard=${this.#discardUnsavedChanges}
                ></mas-quick-actions>
            </div>`}
            </div>
        `;
    }
}

customElements.define('mas-translation-editor', MasTranslationEditor);
