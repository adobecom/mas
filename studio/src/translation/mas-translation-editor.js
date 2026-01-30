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
import './mas-files-selector.js';
import './mas-select-fragments-table.js';
import './mas-translation-languages.js';
import '../mas-quick-actions.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasTranslationEditor extends LitElement {
    static styles = styles;

    static properties = {
        isLoading: { type: Boolean, state: true },
        isNewTranslationProject: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        disabledActions: { type: Set, state: true },
        isSelectedFilesOpen: { type: Boolean, state: true },
        showSelectedEmptyState: { type: Boolean, state: true },
        isOverlayOpen: { type: Boolean, state: true },
        isSelectedLangsOpen: { type: Boolean, state: true },
        showLangSelectedEmptyState: { type: Boolean, state: true },
        selectedLangs: { type: Array, state: true },
        ioBaseUrl: { type: String, state: true },
        isProjectReadonly: { type: Boolean, state: true },
    };

    #cardsSnapshot = [];
    #collectionsSnapshot = [];
    #placeholdersSnapshot = [];
    #targetLocalesSnapshot = [];

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
            QUICK_ACTION.CANCEL,
            QUICK_ACTION.COPY,
            QUICK_ACTION.LOCK,
            QUICK_ACTION.LOC,
        ]);
        this.isSelectedFilesOpen = false;
        this.showSelectedEmptyState = true;
        this.isOverlayOpen = false;
        this.showLangSelectedEmptyState = true;
        this.isSelectedLangsOpen = false;
        this.selectedLangs = [];
        this.ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
        this.isProjectReadonly = false;
    }

    async connectedCallback() {
        super.connectedCallback();
        const translationProjectId = Store.translationProjects.translationProjectId.get();
        if (translationProjectId) {
            await this.#loadTranslationProjectById(translationProjectId);
            this.showLangSelectedEmptyState = this.targetLocalesCount === 0;
            this.#updateDisabledActions({ remove: [QUICK_ACTION.DELETE, QUICK_ACTION.LOC] });
        } else {
            this.#initializeNewTranslationProject();
        }
        this.storeController = new StoreController(this, Store.translationProjects.inEdit);
        this.selectedController = new ReactiveController(this, [
            Store.translationProjects.selectedCards,
            Store.translationProjects.selectedCollections,
            Store.translationProjects.selectedPlaceholders,
            Store.translationProjects.targetLocales,
        ]);
        this.isProjectReadonly = !!this.translationProject?.getFieldValue('submissionDate');
        if (this.isProjectReadonly) {
            this.#updateDisabledActions({ add: [QUICK_ACTION.LOC] });
        }
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

    get selectedCount() {
        return [
            ...Store.translationProjects.selectedCards.value,
            ...Store.translationProjects.selectedPlaceholders.value,
            ...Store.translationProjects.selectedCollections.value,
        ].length;
    }

    get targetLocalesCount() {
        return Store.translationProjects.targetLocales.value.length;
    }

    get selectedLangsList() {
        return Store.translationProjects.targetLocales.value.sort().join(', ');
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
                Store.translationProjects.selectedCards.set(translationProject.getFieldValues('fragments'));
                Store.translationProjects.selectedPlaceholders.set(translationProject.getFieldValues('placeholders'));
                Store.translationProjects.selectedCollections.set(translationProject.getFieldValues('collections'));
                Store.translationProjects.targetLocales.set(translationProject.getFieldValues('targetLocales'));
                this.showSelectedEmptyState = this.selectedCount === 0;
                this.showLangSelectedEmptyState = Store.translationProjects.targetLocales.value.length === 0;
            }
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
                { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
                { name: 'placeholders', type: 'content-fragment', multiple: true, values: [] },
                { name: 'collections', type: 'content-fragment', multiple: true, values: [] },
                { name: 'targetLocales', type: 'text', multiple: true, values: [] },
                { name: 'submissionDate', type: 'date-time', multiple: false, values: [] },
            ],
        });
        this.isNewTranslationProject = true;
        this.translationProjectStore = new FragmentStore(newProject);
        this.showSelectedEmptyState = true;
        this.showLangSelectedEmptyState = true;
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

    #getValues(field) {
        switch (field.name) {
            case 'fragments':
                return Store.translationProjects.selectedCards.value;
            case 'placeholders':
                return Store.translationProjects.selectedPlaceholders.value;
            case 'collections':
                return Store.translationProjects.selectedCollections.value;
            default:
                return field.values;
        }
    }

    async #createTranslationProject() {
        if (!this.#validateRequiredFields(this.translationProject)) {
            showToast('Please fill in all required fields.', 'negative');
            return;
        }

        const typeMap = {
            title: { type: 'text', multiple: false },
            status: { type: 'text', multiple: false },
            fragments: { type: 'content-fragment', multiple: true },
            placeholders: { type: 'content-fragment', multiple: true },
            collections: { type: 'content-fragment', multiple: true },
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
                values: this.#getValues(field),
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
                this.storeController = new StoreController(this, Store.translationProjects.inEdit);
                this.storeController.hostConnected();
                this.#updateDisabledActions({
                    add: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD, QUICK_ACTION.PUBLISH],
                    remove: [QUICK_ACTION.DELETE],
                });
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
        this.translationProject.updateField('fragments', Store.translationProjects.selectedCards.value);
        this.translationProject.updateField('placeholders', Store.translationProjects.selectedPlaceholders.value);
        this.translationProject.updateField('collections', Store.translationProjects.selectedCollections.value);
        this.translationProject.updateField('targetLocales', Store.translationProjects.targetLocales.value);
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
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
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
        if (this.translationProject?.hasChanges || this.selectedCount > 0 || this.targetLocalesCount > 0) {
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
        this.showSelectedEmptyState = this.selectedCount === 0;
        this.showLangSelectedEmptyState = this.targetLocalesCount === 0;
        Store.translationProjects.selectedCards.set(this.translationProject.getFieldValues('fragments'));
        Store.translationProjects.selectedCollections.set(this.translationProject.getFieldValues('collections'));
        Store.translationProjects.selectedPlaceholders.set(this.translationProject.getFieldValues('placeholders'));
        // @TODO: discarding changes for target locales
        Store.translationProjects.showSelected.set(false);
        this.#updateDisabledActions({ add: [QUICK_ACTION.DISCARD, QUICK_ACTION.SAVE] });
    }

    async #sendTranslationProject() {
        showToast('Sending translation project to localization...', 'positive');

        try {
            const params = {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${window.adobeIMS?.getAccessToken()?.token}`,
                },
            };
            const url = `${this.ioBaseUrl}/translation-project-start?projectId=${this.translationProject.id}&surface=${Store.surface()}`;
            const response = await fetch(url, params);
            if (!response.ok) {
                throw new Error('Failed to send translation project to localization');
            }
        } catch (error) {
            console.error('Error sending translation project to localization:', error);
            showToast('Failed to send translation project to localization.', 'negative');
            return;
        }
        showToast('Translation project sent to localization successfully.', 'positive');
        this.isProjectReadonly = true;
        this.#updateDisabledActions({ add: [QUICK_ACTION.LOC] });
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
        if (!this.translationProject?.hasChanges && this.selectedCount === 0) return true;
        return this.#showDialog('Discard Changes', 'You have unsaved changes. Are you sure you want to leave this page?', {
            confirmText: 'Discard',
            cancelText: 'Cancel',
            variant: 'confirmation',
        });
    }

    #confirmFileSelection = ({ target }) => {
        this.isOverlayOpen = false;
        this.showSelectedEmptyState = this.selectedCount === 0;
        this.#cardsSnapshot = [];
        this.#collectionsSnapshot = [];
        this.#placeholdersSnapshot = [];
        this.#updateDisabledActions({ remove: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #cancelFileSelection = ({ target }) => {
        Store.translationProjects.selectedCards.set(this.#cardsSnapshot);
        Store.translationProjects.selectedCollections.set(this.#collectionsSnapshot);
        Store.translationProjects.selectedPlaceholders.set(this.#placeholdersSnapshot);
        this.showSelectedEmptyState = this.selectedCount === 0;
        this.isOverlayOpen = false;
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #handleBackToBreadcrumb = () => {
        router.navigateToPage(PAGE_NAMES.TRANSLATIONS)();
    };

    openAddFilesOverlay() {
        this.isOverlayOpen = true;
        this.#cardsSnapshot = Store.translationProjects.selectedCards.value;
        this.#placeholdersSnapshot = Store.translationProjects.selectedPlaceholders.value;
        this.#collectionsSnapshot = Store.translationProjects.selectedCollections.value;
    }
    createLangSnapshot() {
        this.#targetLocalesSnapshot = Array.from(Store.translationProjects.targetLocales.value);
    }

    #confirmLangSelection = ({ target }) => {
        const targetLocales = target.querySelector('mas-translation-langs').selectedLanguages;
        Store.translationProjects.targetLocales.set(targetLocales);
        this.showLangSelectedEmptyState = this.targetLocalesCount === 0;
        this.#updateDisabledActions({ remove: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #cancelLangSelection = ({ target }) => {
        Store.translationProjects.targetLocales.set(this.#targetLocalesSnapshot);
        this.showLangSelectedEmptyState = this.targetLocalesCount === 0;
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

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
                ${this.isOverlayOpen ? html`<mas-files-selector></mas-files-selector>` : nothing}
            </sp-dialog-wrapper>
        `;
    }

    renderAddLanguagesDialog() {
        return html`
            <sp-dialog-wrapper
                class="add-langs-dialog"
                slot="click-content"
                headline="Select languages"
                confirm-label="Confirm"
                cancel-label="Cancel"
                underlay
                no-divider
                @confirm=${this.#confirmLangSelection}
                @cancel=${this.#cancelLangSelection}
            >
                <mas-translation-langs
                    .selectedLanguages=${Store.translationProjects.targetLocales.value}
                ></mas-translation-langs>
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
        let metadataInfo = '';
        if (this.isProjectReadonly) {
            const submissionDate = this.translationProject?.getFieldValue('submissionDate');
            const formattedDate = submissionDate ? new Date(submissionDate).toLocaleDateString() : '';
            const submitter = this.translationProject?.modified?.fullName;
            metadataInfo = `Sent to translation on ${formattedDate} by ${submitter}`;
        }
        let createEditLabel = '';
        if (this.isNewTranslationProject) {
            createEditLabel = 'Create new project';
        } else if (this.isProjectReadonly) {
            createEditLabel = 'Translation Project';
        } else {
            createEditLabel = 'Edit project';
        }
        return html`
            <div class="translation-editor-breadcrumb">
                <sp-breadcrumbs>
                    <sp-breadcrumb-item @click=${this.#handleBackToBreadcrumb}>Translations</sp-breadcrumb-item>
                    <sp-breadcrumb-item
                        >${this.isNewTranslationProject
                            ? 'Create new project'
                            : this.isProjectReadonly
                              ? 'Translation Project'
                              : 'Edit project'}</sp-breadcrumb-item
                    >
                </sp-breadcrumbs>
            </div>

            ${this.renderConfirmDialog()}

            <div class="translation-editor-form">
                <div class="header">
                    <h1>${createEditLabel}</h1>
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
                    ${
                        this.isProjectReadonly
                            ? html`<div class="metadata-info">
                                  <h2>Metadata</h2>
                                  <sp-textfield readonly value="${metadataInfo}"></sp-textfield>
                              </div>`
                            : nothing
                    }
                    <h2>General Info</h2>
                    <sp-field-label for="title" required>Title</sp-field-label>
                    <sp-textfield
                        id="title"
                        data-field="title"
                        value="${this.translationProject?.getFieldValue('title') || ''}"
                        ?readonly=${this.isProjectReadonly}
                        @input=${this.#handleFragmentUpdate}
                    ></sp-textfield>
                </div>
                ${
                    this.showLangSelectedEmptyState
                        ? html`
                              <div class="form-field select-langs">
                                  <h2>Select languages</h2>
                                  <div class="languages-empty-state">
                                      <div class="icon">
                                          <overlay-trigger
                                              type="modal"
                                              id="add-languages-overlay"
                                              triggered-by="click"
                                              @sp-opened=${this.createLangSnapshot}
                                          >
                                              ${this.renderAddLanguagesDialog()}
                                              <sp-button slot="trigger" variant="secondary" size="xl" icon-only>
                                                  <sp-icon-add size="xxl" slot="icon" label="Add Languages"></sp-icon-add>
                                              </sp-button>
                                          </overlay-trigger>
                                      </div>
                                      <div class="label">
                                          <strong>Add languages</strong><br />
                                          <span>Choose one or more languages for your translation project.</span>
                                      </div>
                                  </div>
                              </div>
                          `
                        : html`<div class="form-field selected-langs">
                              <div class="selected-langs-header">
                                  <h2>
                                      Selected languages
                                      <span>(${this.targetLocalesCount})</span>
                                  </h2>
                                  ${this.isSelectedLangsOpen
                                      ? html`
                                            <sp-button
                                                icon-only
                                                class="toggle-btn"
                                                @click=${() => (this.isSelectedLangsOpen = false)}
                                            >
                                                <sp-icon-chevron-up slot="icon" label="Close"></sp-icon-chevron-up>
                                            </sp-button>
                                        `
                                      : html`
                                            <div>
                                                ${!this.isProjectReadonly
                                                    ? html`
                                                          <overlay-trigger
                                                              type="modal"
                                                              id="add-languages-overlay"
                                                              triggered-by="click"
                                                          >
                                                              ${this.renderAddLanguagesDialog()}
                                                              <sp-button
                                                                  slot="trigger"
                                                                  class="trigger-btn"
                                                                  @click=${this.createLangSnapshot}
                                                              >
                                                                  <sp-icon-edit
                                                                      slot="icon"
                                                                      label="Edit Languages"
                                                                  ></sp-icon-edit>
                                                                  Edit
                                                              </sp-button>
                                                          </overlay-trigger>
                                                      `
                                                    : nothing}
                                                <sp-button
                                                    icon-only
                                                    class="toggle-btn"
                                                    @click=${() => (this.isSelectedLangsOpen = true)}
                                                >
                                                    <sp-icon-chevron-down slot="icon" label="Open"></sp-icon-chevron-down>
                                                </sp-button>
                                            </div>
                                        `}
                              </div>
                              ${this.isSelectedLangsOpen
                                  ? html` <div class="selected-langs-list">${this.selectedLangsList}</div> `
                                  : nothing}
                          </div>`
                }
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
                                              @sp-opened=${this.openAddFilesOverlay}
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
                                      <span>(${this.selectedCount})</span>
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
                                                ${!this.isProjectReadonly
                                                    ? html`
                                                          <overlay-trigger
                                                              type="modal"
                                                              id="add-files-overlay"
                                                              triggered-by="click"
                                                          >
                                                              ${this.renderAddFilesDialog()}
                                                              <sp-button
                                                                  slot="trigger"
                                                                  class="trigger-btn"
                                                                  @click=${this.openAddFilesOverlay}
                                                              >
                                                                  <sp-icon-edit slot="icon" label="Edit Files"></sp-icon-edit>
                                                                  Edit
                                                              </sp-button>
                                                          </overlay-trigger>
                                                      `
                                                    : nothing}
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
                              ${this.isSelectedFilesOpen ? html` <p>TO BE IMPLEMENTED...</p> ` : nothing}
                          </div>`
                }
                <mas-quick-actions
                    .actions=${[
                        QUICK_ACTION.SAVE,
                        QUICK_ACTION.DUPLICATE,
                        QUICK_ACTION.LOC,
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
                    @loc=${this.#sendTranslationProject}
                ></mas-quick-actions>
            </div>`}
            </div>
        `;
    }
}

customElements.define('mas-translation-editor', MasTranslationEditor);
