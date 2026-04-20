import { LitElement, html, nothing } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { Fragment } from '../aem/fragment.js';
import { MasRepository, getFromFragmentCache } from '../mas-repository.js';
import { styles } from './mas-translation-editor.css.js';
import './mas-items-selector.js';
import '../mas-quick-actions.js';
import './mas-translation-languages.js';
import router from '../router.js';
import { normalizeKey, showToast } from '../utils.js';
import { PAGE_NAMES, TRANSLATION_PROJECT_MODEL_ID, QUICK_ACTION, TABLE_TYPE } from '../constants.js';
import { getOdinLocTaskNameValidationError } from './translation-utils.js';

class MasTranslationEditor extends LitElement {
    static styles = styles;

    static properties = {
        isLoading: { type: Boolean, state: true },
        isNewTranslationProject: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        disabledActions: { type: Set, state: true },
        isSelectedItemsOpen: { type: Boolean, state: true },
        showSelectedEmptyState: { type: Boolean, state: true },
        isSelectedLangsOpen: { type: Boolean, state: true },
        showLangSelectedEmptyState: { type: Boolean, state: true },
        ioBaseUrl: { type: String, state: true },
        isProjectReadonly: { type: Boolean, state: true },
    };

    #cardsSnapshot = [];
    #collectionsSnapshot = [];
    #placeholdersSnapshot = [];
    #targetLocalesSnapshot = [];
    #itemsConfirmed = false;

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
        this.isSelectedItemsOpen = false;
        this.showSelectedEmptyState = true;
        this.showLangSelectedEmptyState = true;
        this.isSelectedLangsOpen = false;
        this.ioBaseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
        this.isProjectReadonly = false;
    }

    async connectedCallback() {
        super.connectedCallback();

        if (this.repository?.searchFragments) {
            this.repository.searchFragments();
        }
        if (this.repository?.loadPlaceholders) {
            this.repository.loadPlaceholders();
        }
        if (this.repository?.loadAllCollections) {
            this.repository.loadAllCollections();
        }

        // reset locale to default
        Store.search.set((prev) => ({ ...prev, region: null }));
        Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));

        // Check for pre-fill data from store (e.g., from missing-variation-panel)
        const prefill = Store.translationProjects.prefill.get();
        const { targetLocale, fragmentPath } = prefill || {};
        // Clear prefill state after consumption to prevent stale data
        if (prefill) {
            Store.translationProjects.prefill.set(null);
        }

        const translationProjectId = Store.translationProjects.translationProjectId.get();
        if (translationProjectId) {
            await this.#loadTranslationProjectById(translationProjectId);
            this.showLangSelectedEmptyState = this.targetLocalesCount === 0;
            this.#updateDisabledActions({ remove: [QUICK_ACTION.DELETE, QUICK_ACTION.LOC] });
        } else {
            this.#initializeNewTranslationProject(fragmentPath, targetLocale);
        }
        this.storeController = new StoreController(this, Store.translationProjects.inEdit);
        this.selectedController = new ReactiveController(this, [
            Store.translationProjects.selectedCards,
            Store.translationProjects.selectedCollections,
            Store.translationProjects.selectedPlaceholders,
            Store.translationProjects.targetLocales,
            Store.translationProjects.projectType,
            Store.translationProjects.showSelected,
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
        return (
            Store.translationProjects.selectedCards.value.length +
            Store.translationProjects.selectedPlaceholders.value.length +
            Store.translationProjects.selectedCollections.value.length
        );
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
                const translationProject = new Fragment(fragment);
                this.translationProjectStore = new FragmentStore(translationProject);
                Store.translationProjects.selectedCards.set(translationProject.getFieldValues('fragments'));
                Store.translationProjects.selectedPlaceholders.set(translationProject.getFieldValues('placeholders'));
                Store.translationProjects.selectedCollections.set(translationProject.getFieldValues('collections'));
                Store.translationProjects.targetLocales.set(translationProject.getFieldValues('targetLocales'));
                Store.translationProjects.projectType.set(translationProject.getFieldValue('projectType') ?? 'translation');
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

    #initializeNewTranslationProject(fragmentPath, targetLocale) {
        const newProject = new Fragment({
            id: null,
            title: '',
            fields: [
                { name: 'title', type: 'text', multiple: false, values: [] },
                { name: 'status', type: 'text', multiple: false, values: [] },
                { name: 'fragments', type: 'content-fragment', multiple: true, values: fragmentPath ? [fragmentPath] : [] },
                { name: 'placeholders', type: 'content-fragment', multiple: true, values: [] },
                { name: 'collections', type: 'content-fragment', multiple: true, values: [] },
                { name: 'targetLocales', type: 'text', multiple: true, values: targetLocale ? [targetLocale] : [] },
                { name: 'submissionDate', type: 'date-time', multiple: false, values: [] },
                { name: 'projectType', type: 'enumeration', multiple: false, values: ['translation'] },
            ],
        });
        this.isNewTranslationProject = true;
        this.translationProjectStore = new FragmentStore(newProject);

        if (fragmentPath) {
            Store.translationProjects.selectedCards.set([fragmentPath]);
        }
        if (targetLocale) {
            Store.translationProjects.targetLocales.set([targetLocale]);
        }
        Store.translationProjects.projectType.set('translation');

        this.showSelectedEmptyState = this.selectedCount === 0;
        this.showLangSelectedEmptyState = this.targetLocalesCount === 0;
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
        const title = translationProject.getFieldValue('title');
        if (!title || title.trim() === '') {
            return { ok: false, message: 'Please fill in all required fields.' };
        }
        const taskNameError = getOdinLocTaskNameValidationError(title.trim());
        if (taskNameError) {
            return { ok: false, message: taskNameError };
        }

        const targetLocales = Store.translationProjects.targetLocales.value;
        if (targetLocales.length === 0) {
            return { ok: false, message: 'Please fill in all required fields.' };
        }

        const fragments = Store.translationProjects.selectedCards.value;
        const placeholders = Store.translationProjects.selectedPlaceholders.value;
        const collections = Store.translationProjects.selectedCollections.value;

        if (fragments.length === 0 && placeholders.length === 0 && collections.length === 0) {
            return { ok: false, message: 'Please fill in all required fields.' };
        }

        return { ok: true };
    }

    #getValues(field) {
        switch (field.name) {
            case 'fragments':
                return Store.translationProjects.selectedCards.value;
            case 'placeholders':
                return Store.translationProjects.selectedPlaceholders.value;
            case 'collections':
                return Store.translationProjects.selectedCollections.value;
            case 'targetLocales':
                return Store.translationProjects.targetLocales.value;
            case 'projectType':
                return [Store.translationProjects.projectType.value];
            default:
                return field.values;
        }
    }

    async #createTranslationProject() {
        const validation = this.#validateRequiredFields(this.translationProject);
        if (!validation.ok) {
            showToast(validation.message, 'negative');
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
            projectType: { type: 'enumeration', multiple: false },
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
                    add: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD],
                    remove: [QUICK_ACTION.DELETE, QUICK_ACTION.LOC],
                });
            }
        } catch (error) {
            console.error('Error creating translation project', error);
            showToast('Failed to create translation project.', 'negative');
        }
    }

    async #updateTranslationProject() {
        const validation = this.#validateRequiredFields(this.translationProject);
        if (!validation.ok) {
            showToast(validation.message, 'negative');
            return;
        }
        this.translationProject.updateFieldInternal('title', this.translationProject.getFieldValue('title'));
        this.translationProject.updateField('fragments', Store.translationProjects.selectedCards.value);
        this.translationProject.updateField('placeholders', Store.translationProjects.selectedPlaceholders.value);
        this.translationProject.updateField('collections', Store.translationProjects.selectedCollections.value);
        this.translationProject.updateField('targetLocales', Store.translationProjects.targetLocales.value);
        this.translationProject.updateField('projectType', [Store.translationProjects.projectType.value]);
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
        Store.translationProjects.targetLocales.set(this.translationProject.getFieldValues('targetLocales'));
        Store.translationProjects.showSelected.set(false);
        this.#updateDisabledActions({ add: [QUICK_ACTION.DISCARD, QUICK_ACTION.SAVE] });
    }

    async #sendTranslationProject() {
        showToast('Sending translation project to localization...', 'positive');
        this.#updateDisabledActions({ add: [QUICK_ACTION.LOC] });

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
            const data = await response.json();
            const submissionDateField = this.translationProject.getField('submissionDate');
            if (submissionDateField) {
                submissionDateField.values = [data.submissionDate];
            }
        } catch (error) {
            console.error('Error sending translation project to localization:', error);
            showToast('Failed to send translation project to localization.', 'negative');
            this.#updateDisabledActions({ remove: [QUICK_ACTION.LOC] });
            return;
        }
        showToast('Translation project sent to localization successfully.', 'positive');
        this.isProjectReadonly = true;
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

    #confirmItemSelection = ({ target }) => {
        this.showSelectedEmptyState = this.selectedCount === 0;
        this.#cardsSnapshot = [];
        this.#collectionsSnapshot = [];
        this.#placeholdersSnapshot = [];
        this.#itemsConfirmed = true;
        this.#updateDisabledActions({ remove: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #cancelItemSelection = ({ target }) => {
        Store.translationProjects.selectedCards.set(this.#cardsSnapshot);
        Store.translationProjects.selectedCollections.set(this.#collectionsSnapshot);
        Store.translationProjects.selectedPlaceholders.set(this.#placeholdersSnapshot);
        this.showSelectedEmptyState = this.selectedCount === 0;
        this.#itemsConfirmed = true;
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #openAddItemsOverlay(e) {
        if (e && e.target !== e.currentTarget) return;
        this.#itemsConfirmed = false;
        this.#cardsSnapshot = Store.translationProjects.selectedCards.value;
        this.#placeholdersSnapshot = Store.translationProjects.selectedPlaceholders.value;
        this.#collectionsSnapshot = Store.translationProjects.selectedCollections.value;

        const selector = this.renderRoot.querySelector('mas-items-selector');
        if (selector) {
            selector.searchQuery = '';
            selector.selectedTab = TABLE_TYPE.CARDS;
            const searchAndFilters = selector.renderRoot.querySelector('mas-search-and-filters');
            if (searchAndFilters) {
                searchAndFilters.templateFilter = [];
                searchAndFilters.marketSegmentFilter = [];
                searchAndFilters.customerSegmentFilter = [];
                searchAndFilters.productFilter = [];
            }
        }
        Store.translationProjects.displayCards.set(Store.translationProjects.allCards.get());
        Store.translationProjects.displayCollections.set(Store.translationProjects.allCollections.get());
        Store.translationProjects.displayPlaceholders.set(Store.translationProjects.allPlaceholders.get());
    }

    #openAddLanguagesOverlay() {
        this.#targetLocalesSnapshot = Store.translationProjects.targetLocales.value;
    }

    #confirmLangSelection = ({ target }) => {
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

    #toggleSelectedItemsOpen = ({ target }) => {
        if (target.closest('mas-items-selector')) return;
        this.isSelectedItemsOpen = !this.isSelectedItemsOpen;
    };

    #handleProjectTypeChange = ({ currentTarget }) => {
        const projectType = currentTarget?.selected === 'rollout' ? 'rollout' : 'translation';
        Store.translationProjects.projectType.set(projectType);
        this.#updateDisabledActions({ remove: [QUICK_ACTION.SAVE, QUICK_ACTION.DISCARD] });
    };

    renderAddItemsDialog() {
        const footerContent = html`
            <sp-button-group>
                <sp-button variant="secondary" treatment="outline" @click=${() => this.#dispatchDialogEvent('cancel')}
                    >Cancel</sp-button
                >
                <sp-button variant="accent" @click=${() => this.#dispatchDialogEvent('confirm')}>Add selected items</sp-button>
            </sp-button-group>
        `;
        return html`
            <sp-dialog-wrapper
                class="add-items-dialog"
                slot="click-content"
                headline="Select items"
                headline-visibility="none"
                .footer=${footerContent}
                underlay
                dismissable
                no-divider
                @sp-opened=${this.#alignItemsDialogFooter}
                @confirm=${this.#confirmItemSelection}
                @cancel=${this.#cancelItemSelection}
                @close=${this.#restoreItemsSnapshot}
            >
                <mas-items-selector></mas-items-selector>
            </sp-dialog-wrapper>
        `;
    }

    #alignItemsDialogFooter = ({ target }) => {
        const slotDiv = target?.shadowRoot?.querySelector('div[slot="footer"]');
        if (!slotDiv) return;
        slotDiv.style.width = '100%';
        slotDiv.style.display = 'flex';
        slotDiv.style.justifyContent = 'flex-end';
    };

    // Flag stays sticky across the duplicate close event sp-dialog-wrapper emits after confirm/cancel;
    // it's cleared on the next #openAddItemsOverlay so a re-opened dialog starts fresh.
    #restoreItemsSnapshot = () => {
        if (this.#itemsConfirmed) return;
        Store.translationProjects.selectedCards.set(this.#cardsSnapshot);
        Store.translationProjects.selectedCollections.set(this.#collectionsSnapshot);
        Store.translationProjects.selectedPlaceholders.set(this.#placeholdersSnapshot);
        this.showSelectedEmptyState = this.selectedCount === 0;
    };

    #dispatchDialogEvent = (name) => {
        const wrapper = this.renderRoot.querySelector('.add-items-dialog');
        wrapper?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
    };

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
                <mas-translation-languages></mas-translation-languages>
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
            const isRollout = Store.translationProjects.projectType.value === 'rollout';
            const submissionDate = this.translationProject?.getFieldValue('submissionDate');
            const formattedDate = submissionDate ? new Date(submissionDate).toLocaleDateString() : '';
            const submitter = this.translationProject?.modified?.fullName;
            const operation = isRollout ? 'synchronization' : 'translation';
            metadataInfo = `This project was sent for ${operation} on ${formattedDate} by ${submitter} and can no longer be edited.`;
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
            ${this.renderConfirmDialog()}

            <div class="translation-editor-form">
                ${this.isProjectReadonly
                    ? html`<div class="metadata-info">
                          <sp-icon-alert></sp-icon-alert>
                          <h2>Read-only mode</h2>
                          <span>${metadataInfo}</span>
                      </div>`
                    : nothing}
                <div class="header">
                    <h1>${createEditLabel}</h1>
                </div>
                ${this.isLoading
                    ? html`
                          <div class="loading-container--absolute">
                              <sp-progress-circle
                                  label="Loading translation project"
                                  indeterminate
                                  size="l"
                              ></sp-progress-circle>
                          </div>
                      `
                    : html`<div class="form-field general-info">
                    <h2>General info</h2>
                    <div class="general-info-columns">
                        <div class="general-info-col">
                            <sp-field-label for="title" required>Title</sp-field-label>
                            ${
                                this.isProjectReadonly
                                    ? html`<span id="title">${this.translationProject?.getFieldValue('title') || ''}</span>`
                                    : html`<sp-textfield
                                          id="title"
                                          data-field="title"
                                          value="${this.translationProject?.getFieldValue('title') || ''}"
                                          @input=${this.#handleFragmentUpdate}
                                      ></sp-textfield>`
                            }
                        </div>
                        <div class="general-info-col">
                            <sp-field-label for="projectType" required>Project Type</sp-field-label>
                            ${
                                this.isProjectReadonly
                                    ? html`<span id="projectType"
                                          >${Store.translationProjects.projectType.value === 'rollout'
                                              ? 'Rollout'
                                              : 'Translation'}</span
                                      >`
                                    : html`<sp-radio-group
                                          id="projectType"
                                          name="projectType"
                                          .selected=${Store.translationProjects.projectType.value}
                                          @change=${this.#handleProjectTypeChange}
                                      >
                                          <sp-radio value="translation">Translation</sp-radio>
                                          <sp-radio value="rollout">Rollout</sp-radio>
                                      </sp-radio-group>`
                            }
                        </div>
                    </div>
                </div>
                ${
                    this.showLangSelectedEmptyState
                        ? html`
                              <div class="form-field select-langs">
                                  <h2>Select languages <sp-icon-asterisk100></sp-icon-asterisk100></h2>
                                  <div class="languages-empty-state">
                                      <div class="icon">
                                          <overlay-trigger
                                              type="modal"
                                              id="add-languages-overlay"
                                              triggered-by="click"
                                              @sp-opened=${this.#openAddLanguagesOverlay}
                                          >
                                              ${this.renderAddLanguagesDialog()}
                                              <sp-button
                                                  slot="trigger"
                                                  variant="secondary"
                                                  size="xl"
                                                  icon-only
                                                  class="ghost-button"
                                              >
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
                        : html`<div
                              class="form-field selected-langs"
                              @click=${() => (this.isSelectedLangsOpen = !this.isSelectedLangsOpen)}
                          >
                              <div class="selected-langs-header">
                                  <h2>
                                      Selected languages
                                      <span>(${this.targetLocalesCount})</span>
                                      <sp-icon-asterisk100></sp-icon-asterisk100>
                                  </h2>
                                  <div>
                                      ${!this.isProjectReadonly
                                          ? html` <overlay-trigger type="modal" id="add-languages-overlay" triggered-by="click">
                                                ${this.renderAddLanguagesDialog()}
                                                <sp-action-button slot="trigger" quiet @click=${this.#openAddLanguagesOverlay}>
                                                    <sp-icon-edit slot="icon" label="Edit Languages"></sp-icon-edit>
                                                    Edit
                                                </sp-action-button>
                                            </overlay-trigger>`
                                          : nothing}
                                      <sp-button icon-only class="toggle-btn ghost-button">
                                          <sp-icon-chevron-down
                                              slot="icon"
                                              label="${this.isSelectedLangsOpen ? 'Close' : 'Open'}"
                                          ></sp-icon-chevron-down>
                                      </sp-button>
                                  </div>
                              </div>
                              ${this.isSelectedLangsOpen
                                  ? html` <div class="selected-langs-list">${this.selectedLangsList}</div> `
                                  : nothing}
                          </div>`
                }
                ${
                    this.showSelectedEmptyState
                        ? html`
                              <div class="form-field select-items">
                                  <h2>Select items <sp-icon-asterisk100></sp-icon-asterisk100></h2>
                                  <div class="items-empty-state">
                                      <div class="icon">
                                          <overlay-trigger
                                              type="modal"
                                              id="add-items-overlay"
                                              triggered-by="click"
                                              @sp-opened=${this.#openAddItemsOverlay}
                                          >
                                              ${this.renderAddItemsDialog()}
                                              <sp-button
                                                  slot="trigger"
                                                  variant="secondary"
                                                  size="xl"
                                                  icon-only
                                                  class="ghost-button"
                                              >
                                                  <sp-icon-add size="xxl" slot="icon" label="Add Items"></sp-icon-add>
                                              </sp-button>
                                          </overlay-trigger>
                                      </div>
                                      <div class="label">
                                          <strong>Add Items</strong><br />
                                          <span>Choose items that need to be translated.</span>
                                      </div>
                                  </div>
                              </div>
                          `
                        : html`<div class="form-field selected-items" @click=${this.#toggleSelectedItemsOpen}>
                              <div class="selected-items-header">
                                  <h2>
                                      Selected items
                                      <span>(${this.selectedCount})</span>
                                      <sp-icon-asterisk100></sp-icon-asterisk100>
                                  </h2>
                                  <div>
                                      ${!this.isProjectReadonly
                                          ? html` <overlay-trigger type="modal" id="add-items-overlay" triggered-by="click">
                                                ${this.renderAddItemsDialog()}
                                                <sp-action-button slot="trigger" quiet @click=${this.#openAddItemsOverlay}>
                                                    <sp-icon-edit slot="icon" label="Edit Items"></sp-icon-edit>
                                                    Edit
                                                </sp-action-button>
                                            </overlay-trigger>`
                                          : nothing}
                                      <sp-button icon-only class="toggle-btn ghost-button">
                                          <sp-icon-chevron-down
                                              slot="icon"
                                              .label=${this.isSelectedItemsOpen ? 'Close' : 'Open'}
                                          ></sp-icon-chevron-down>
                                      </sp-button>
                                  </div>
                              </div>
                              ${this.isSelectedItemsOpen
                                  ? html`<mas-items-selector .viewOnly=${true}></mas-items-selector>`
                                  : nothing}
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
