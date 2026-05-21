import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { MasRepository } from './mas-repository.js';
import './aem/aem-tag-picker-field.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import styles from './mas-promotions-editor-css.js';
import { SURFACES, PAGE_NAMES, PROMOTION_MODEL_ID, TABLE_TYPE } from './constants.js';
import { normalizeKey, showToast, extractSurfaceFromPath } from './utils.js';
import { getFragmentPartsToUse, MODEL_WEB_COMPONENT_MAPPING } from './editor-panel.js';
import { Promotion } from './aem/promotion.js';
import './promotions/mas-promotions-items-selector.js';
import { getItemsSelectionStore, setItemsSelectionStore } from './common/items-selection-store.js';
import {
    classifyPromotionPathsForSelection,
    isPromotionItemSelectionDirty,
    isPromotionRequiredFieldsValid,
    parsePromotionSurfacesFieldValues,
    serializePromotionSurfacesForAem,
} from './promotions/promotion-editor-utils.js';
import { renderFragmentStatusCell } from './common/utils/render-utils.js';

function getPromotionPickerFragmentLabel(data) {
    const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
    const fragmentPath = typeof data?.path === 'string' ? data.path : data?.get?.()?.path;
    const pathSurface = extractSurfaceFromPath(fragmentPath);
    const searchSnapshot = Store.search.get();
    const storeLike = {
        search: {
            value: {
                ...searchSnapshot,
                path: pathSurface ?? searchSnapshot.path,
            },
        },
    };
    const { fragmentParts } = getFragmentPartsToUse(storeLike, data);
    return `${webComponentName}: ${fragmentParts}`;
}

const typeMap = {
    title: { type: 'text' },
    promoCode: { type: 'text' },
    startDate: { type: 'date-time' },
    endDate: { type: 'date-time' },
    tags: { type: 'tag', multiple: true },
    surfaces: { type: 'text', multiple: true },
    geos: { type: 'tag', multiple: true },
    fragments: { type: 'content-fragment', multiple: true },
};

class MasPromotionsEditor extends LitElement {
    static styles = styles;

    static properties = {
        loadingPromotion: { type: Boolean, state: true },
        isNewPromotion: { type: Boolean, state: true },
        isCreated: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        isSelectedItemsOpen: { type: Boolean, state: true },
        showSelectedEmptyState: { type: Boolean, state: true },
        promotionItemsAddButtonLabel: { type: String, state: true },
    };

    #promotionItemsReactive;

    inEdit = Store.promotions.inEdit;
    promotionId = Store.promotions.promotionId;

    storeController = null;
    #itemsSelectionStoreSnapshot = null;
    #cardsSnapshot = [];
    #collectionsSnapshot = [];
    #itemsConfirmed = false;

    constructor() {
        super();
        this.loadingPromotion = false;
        this.isNewPromotion = false;
        this.isCreated = false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.isSelectedItemsOpen = false;
        this.showSelectedEmptyState = true;
        this.promotionItemsAddButtonLabel = 'Add selected fragments';
    }

    async connectedCallback() {
        super.connectedCallback();
        this.#itemsSelectionStoreSnapshot = getItemsSelectionStore({ allowUnset: true });
        setItemsSelectionStore(Store.promotions);

        const promotionId = this.promotionId.get();
        if (promotionId) {
            this.isNewPromotion = false;
            this.loadingPromotion = true;
            try {
                this.#resetPromotionItemStores();
                if (!this.fragmentStore) {
                    await this.#loadPromotionById(promotionId);
                }
                await this.#hydratePromotionItemSelectionFromFragment();
            } finally {
                this.loadingPromotion = false;
            }
        } else {
            this.#resetPromotionItemStores();
            if (!this.fragmentStore) {
                this.isNewPromotion = true;
                const newPromotion = this.#initializeNewPromotion();
                this.fragmentStore = new FragmentStore(newPromotion);
            } else {
                const existing = this.fragmentStore.get?.();
                this.isNewPromotion = !existing?.id;
            }
            await this.#hydratePromotionItemSelectionFromFragment();
        }

        this.showSelectedEmptyState = this.selectedItemsCount === 0;

        if (this.repository?.searchFragments) {
            this.repository.searchFragments();
        }
        if (this.repository?.loadAllCollections) {
            this.repository.loadAllCollections();
        }

        this.storeController = new StoreController(this, this.fragmentStore);
        this.#promotionItemsReactive = new ReactiveController(this, [
            Store.promotions.selectedCards,
            Store.promotions.selectedCollections,
        ]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        Store.promotions.itemPickerSurface.set(null);
        setItemsSelectionStore(this.#itemsSelectionStoreSnapshot);
        this.#itemsSelectionStoreSnapshot = null;
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

    get selectedItemsCount() {
        return Store.promotions.selectedCards.value.length + Store.promotions.selectedCollections.value.length;
    }

    get promotionPickerSurfaces() {
        return parsePromotionSurfacesFieldValues(this.fragment?.fields?.find((f) => f.name === 'surfaces')?.values ?? []);
    }

    get #itemsSelectionDirty() {
        return isPromotionItemSelectionDirty(
            this.fragment,
            Store.promotions.selectedCards.value,
            Store.promotions.selectedCollections.value,
            Store.promotions.itemHydrateUnreachablePaths.value,
        );
    }

    #resetPromotionItemStores() {
        Store.promotions.allCards.set([]);
        Store.promotions.cardsByPaths.set(new Map());
        Store.promotions.displayCards.set([]);
        Store.promotions.selectedCards.set([]);
        Store.promotions.offerDataCache = new Map();
        Store.promotions.groupedVariationsByParent.set(new Map());
        Store.promotions.groupedVariationsData.set(new Map());
        Store.promotions.allCollections.set([]);
        Store.promotions.collectionsByPaths.set(new Map());
        Store.promotions.displayCollections.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.allPlaceholders.set([]);
        Store.promotions.placeholdersByPaths.set(new Map());
        Store.promotions.displayPlaceholders.set([]);
        Store.promotions.selectedPlaceholders.set([]);
        Store.promotions.showSelected.set(false);
        Store.promotions.itemHydrateUnreachablePaths.set([]);
    }

    async #hydratePromotionItemSelectionFromFragment() {
        const f = this.fragment;
        if (!f || !this.repository?.aem?.getFragmentByPath) {
            Store.promotions.selectedCards.set([]);
            Store.promotions.selectedCollections.set([]);
            Store.promotions.itemHydrateUnreachablePaths.set([]);
            return;
        }
        const fromFragments = f.getFieldValues('fragments');
        const fromCollections = f.getField('collections') ? f.getFieldValues('collections') : [];
        const seen = new Set();
        const allPaths = [];
        for (const p of [...fromFragments, ...fromCollections]) {
            if (p && !seen.has(p)) {
                seen.add(p);
                allPaths.push(p);
            }
        }
        if (!allPaths.length) {
            Store.promotions.selectedCards.set([]);
            Store.promotions.selectedCollections.set([]);
            Store.promotions.itemHydrateUnreachablePaths.set([]);
            return;
        }
        const { cards, cols, unreachable } = await classifyPromotionPathsForSelection(allPaths, (path) =>
            this.repository.aem.getFragmentByPath(path),
        );
        Store.promotions.itemHydrateUnreachablePaths.set(unreachable);
        Store.promotions.selectedCards.set(cards);
        Store.promotions.selectedCollections.set(cols);
        this.requestUpdate();
    }

    #ensurePromotionModelFields(promotion) {
        const names = new Set(promotion.fields.map((field) => field.name));
        const defaults = [
            { name: 'geos', type: 'tag', multiple: true, values: [] },
            { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
        ];
        for (const field of defaults) {
            if (!names.has(field.name)) {
                promotion.fields.push({ ...field });
                names.add(field.name);
            }
        }
    }

    async #loadPromotionById(id) {
        try {
            const fragment = await this.repository.aem.sites.cf.fragments.getById(id);
            if (fragment) {
                const promotion = new Promotion(fragment);

                // Create a new FragmentStore and set it in the store
                this.#ensurePromotionModelFields(promotion);
                const fragmentStore = new FragmentStore(promotion);
                Store.promotions.inEdit.set(fragmentStore);
            }
        } catch (error) {
            console.error('Failed to load promotion:', error);
            showToast('Failed to load promotion.', 'negative');
        }
    }

    #initializeNewPromotion() {
        return new Promotion({
            id: null,
            title: '',
            fields: [
                { name: 'title', type: 'text', values: [''] },
                { name: 'promoCode', values: [''] },
                { name: 'startDate', values: [''] },
                { name: 'endDate', values: [''] },
                { name: 'tags', values: [] },
                { name: 'surfaces', type: 'text', multiple: true, values: [] },
                { name: 'geos', type: 'tag', multiple: true, values: [] },
                { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
            ],
        });
    }

    #handeTagsChange = (event) => {
        const tags = event.target.getAttribute('value');
        const newTags = tags ? tags.split(',') : [];
        this.fragmentStore.updateField('tags', newTags);
    };

    #handleGeosChange = (event) => {
        const value = event.target.getAttribute('value');
        const newGeos = value ? value.split(',') : [];
        this.fragmentStore.updateField('geos', newGeos);
    };

    #handleCloseAddSurfacesDialog = (event) => {
        // Get the table element and its selected rows
        const table = event.target.querySelector('#surfaces-table');
        const selectedSurfaces = table?.selected || [];

        // Update the fragment with the selected surfaces
        if (selectedSurfaces.length > 0) {
            this.fragmentStore.updateField('surfaces', selectedSurfaces);
        }

        const closeEvent = new Event('close', { bubbles: true, composed: true });
        event.target.dispatchEvent(closeEvent);
    };

    #handleSurfaceDelete = (event) => {
        const deletedSurface = event.target.attributes.getNamedItem('value').value;
        const surfaces = this.fragment.fields.find((field) => field.name === 'surfaces')?.values || [];
        this.fragmentStore.updateField(
            'surfaces',
            surfaces.filter((surface) => surface !== deletedSurface),
        );
    };

    #handleFragmentUpdate({ target, detail, values }) {
        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }
        this.fragmentStore.updateField(fieldName, value);
    }

    #handleDateUpdate({ target }) {
        const fieldName = target.dataset.field;

        const utcDate = new Date(`${target.value}Z`).toISOString();
        this.fragmentStore.updateField(fieldName, [utcDate]);
    }

    #patchPromotionSurfacesFieldForAem() {
        const field = this.fragment?.getField?.('surfaces');
        if (!field) return;
        field.type = 'text';
        field.multiple = true;
        field.values = serializePromotionSurfacesForAem(field.values);
        this.fragment.hasChanges = true;
    }

    #getPayloadValues(field) {
        switch (field.name) {
            case 'surfaces':
                return serializePromotionSurfacesForAem(field.values);
            case 'fragments':
                return [...Store.promotions.selectedCards.value, ...Store.promotions.selectedCollections.value];
            default:
                return field.values;
        }
    }

    async #handleCreatePromotion() {
        if (!this.#validateRequiredFields(this.fragment)) {
            showToast('Please fill in all required fields', 'negative');
            return;
        }

        const fragmentPayload = {
            name: normalizeKey(this.fragment.getFieldValue('title')),
            parentPath: this.repository.getPromotionsPath(),
            modelId: PROMOTION_MODEL_ID,
            title: this.fragment.getFieldValue('title'),
            fields: this.fragment.fields
                .filter((field) => field.name !== 'collections')
                .map((field) => ({
                    name: field.name,
                    type: typeMap[field.name]?.type ?? field.type,
                    multiple: typeMap[field.name]?.multiple ?? field.multiple ?? false,
                    values: this.#getPayloadValues(field),
                })),
        };

        showToast('Creating project...');
        try {
            const newPromotion = await this.repository.createFragment(fragmentPayload, false);
            if (newPromotion) {
                this.isCreated = true;
            }

            showToast('Project successfully created.', 'positive');

            Store.promotions.inEdit.set(new FragmentStore(newPromotion));
            Store.promotions.promotionId.set(newPromotion.id);

            this.isNewPromotion = false;
            Store.promotions.selectedPlaceholders.set([]);
            await this.#hydratePromotionItemSelectionFromFragment();

            this.storeController.hostDisconnected();
            this.storeController = new StoreController(this, this.fragmentStore);
            this.storeController.hostConnected();
        } catch (error) {
            showToast('Failed to create project.', 'negative');
            return;
        }
    }

    async #handleUpdatePromotion() {
        if (!this.#validateRequiredFields(this.fragment)) {
            showToast('Please fill in all required fields', 'negative');
            return;
        }
        this.fragment.updateFieldInternal('title', this.fragment.getFieldValue('title'));
        this.#patchPromotionSurfacesFieldForAem();
        const mergedPaths = [...Store.promotions.selectedCards.value, ...Store.promotions.selectedCollections.value];
        this.fragment.updateField('fragments', mergedPaths);
        if (this.fragment.getField('collections')) {
            this.fragment.updateField('collections', []);
        }
        showToast('Saving project...');
        try {
            await this.repository.saveFragment(this.fragmentStore, false);
        } catch (error) {
            showToast('Failed to save project.', 'negative');
            return;
        }
        showToast('Project successfully saved.', 'positive');
        Store.promotions.selectedPlaceholders.set([]);
        await this.#hydratePromotionItemSelectionFromFragment();
    }

    async #handleCancel() {
        if (this.fragment?.hasChanges || this.#itemsSelectionDirty) {
            const confirmed = await this.#showDialog(
                'Confirm Discard',
                'Are you sure you want to discard changes? This action cannot be undone.',
                {
                    confirmText: 'Discard',
                    cancelText: 'Cancel',
                    variant: 'confirmation',
                },
            );
            if (!confirmed) return;
        }
        this.fragmentStore.discardChanges();
        Store.promotions.selectedPlaceholders.set([]);
        await this.#hydratePromotionItemSelectionFromFragment();
        Store.promotions.inEdit.set();
        Store.page.set(PAGE_NAMES.PROMOTIONS);
    }

    #validateRequiredFields(fragment = {}) {
        const itemCount = Store.promotions.selectedCards.value.length + Store.promotions.selectedCollections.value.length;
        return isPromotionRequiredFieldsValid(fragment, itemCount);
    }

    /**
     * Display a dialog for confirmation
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, false if canceled
     */
    async #showDialog(title, message, options = {}) {
        if (this.isDialogOpen) {
            return false;
        }

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

    async promptDiscardChanges() {
        if (!this.fragment?.hasChanges && !this.#itemsSelectionDirty) return true;
        return this.#showDialog('Discard Changes', 'You have unsaved changes. Are you sure you want to leave this page?', {
            confirmText: 'Discard',
            cancelText: 'Cancel',
            variant: 'confirmation',
        });
    }

    #clearPromotionItemPickerSurface() {
        Store.promotions.itemPickerSurface.set(null);
        if (Store.page.get() === PAGE_NAMES.PROMOTIONS_EDITOR) {
            this.repository?.searchFragments?.();
        }
    }

    #confirmItemSelection = ({ target }) => {
        this.showSelectedEmptyState = this.selectedItemsCount === 0;
        this.#cardsSnapshot = [];
        this.#collectionsSnapshot = [];
        this.#itemsConfirmed = true;
        this.#clearPromotionItemPickerSurface();
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #cancelItemSelection = ({ target }) => {
        Store.promotions.selectedCards.set(this.#cardsSnapshot);
        Store.promotions.selectedCollections.set(this.#collectionsSnapshot);
        this.showSelectedEmptyState = this.selectedItemsCount === 0;
        this.#itemsConfirmed = true;
        this.#clearPromotionItemPickerSurface();
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target.dispatchEvent(closeEvent);
    };

    #onPromotionItemsTabChange = (e) => {
        this.promotionItemsAddButtonLabel =
            e.detail?.tab === TABLE_TYPE.COLLECTIONS ? 'Add selected collections' : 'Add selected fragments';
    };

    #openAddItemsOverlay() {
        this.promotionItemsAddButtonLabel = 'Add selected fragments';
        this.#itemsConfirmed = false;
        this.#cardsSnapshot = Store.promotions.selectedCards.value;
        this.#collectionsSnapshot = Store.promotions.selectedCollections.value;

        const selector = this.renderRoot.querySelector('mas-promotions-items-selector');
        if (selector) {
            selector.searchQuery = '';
            selector.selectedTab = TABLE_TYPE.CARDS;
            selector.shadowRoot?.querySelectorAll('mas-search-and-filters').forEach((el) => el.resetFilters());
        }
        const surfaces = this.promotionPickerSurfaces;
        if (surfaces.length) {
            const current = Store.promotions.itemPickerSurface.get();
            Store.promotions.itemPickerSurface.set(surfaces.includes(current) ? current : surfaces[0]);
        } else {
            Store.promotions.itemPickerSurface.set(null);
        }
        if (this.repository?.searchFragments) this.repository.searchFragments();
        if (this.repository?.loadAllCollections) this.repository.loadAllCollections();
        if (this.repository?.loadPlaceholders) this.repository.loadPlaceholders();
    }

    #restoreItemsSnapshot = () => {
        if (this.#itemsConfirmed) return;
        Store.promotions.selectedCards.set(this.#cardsSnapshot);
        Store.promotions.selectedCollections.set(this.#collectionsSnapshot);
        this.showSelectedEmptyState = this.selectedItemsCount === 0;
        this.#clearPromotionItemPickerSurface();
    };

    #dispatchDialogEvent = (name) => {
        const wrapper = this.renderRoot.querySelector('.add-items-dialog');
        wrapper?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
    };

    #toggleSelectedItemsOpen = ({ target }) => {
        if (target.closest('mas-promotions-items-selector')) return;
        this.isSelectedItemsOpen = !this.isSelectedItemsOpen;
    };

    renderAddItemsDialog() {
        const footerContent = html`
            <sp-button-group>
                <sp-button variant="secondary" treatment="outline" @click=${() => this.#dispatchDialogEvent('cancel')}
                    >Cancel</sp-button
                >
                <sp-button variant="accent" @click=${() => this.#dispatchDialogEvent('confirm')}
                    >${this.promotionItemsAddButtonLabel}</sp-button
                >
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
                @confirm=${this.#confirmItemSelection}
                @cancel=${this.#cancelItemSelection}
                @close=${this.#restoreItemsSnapshot}
            >
                <mas-promotions-items-selector
                    .fragmentSurfaceOptions=${this.promotionPickerSurfaces}
                    .getDisplayName=${getPromotionPickerFragmentLabel}
                    .renderFragmentStatusCell=${renderFragmentStatusCell}
                    @promotion-items-tab-change=${this.#onPromotionItemsTabChange}
                ></mas-promotions-items-selector>
            </sp-dialog-wrapper>
        `;
    }

    render() {
        let form = nothing;
        if (this.fragment) {
            form = Object.fromEntries([...this.fragment.fields.map((f) => [f.name, f])]);
        }
        const updateDisabled = !(this.fragment?.hasChanges || this.#itemsSelectionDirty);
        return html`
            ${this.renderConfirmDialog()}
            <div class="promotions-form-container">
                <div class="promotions-form-header">
                    <h1>${this.isNewPromotion ? 'Create new project' : 'Edit project'}</h1>
                </div>
                <div class="promotions-form-panel">
                    ${this.loadingPromotion
                        ? html`
                              <div class="promotion-loading">
                                  <sp-progress-circle label="Loading promotion" indeterminate></sp-progress-circle>
                              </div>
                          `
                        : nothing}
                    <div><h2>General Info</h2></div>
                    <div class="promotions-form-panel-content">
                        <div class="promotions-form-fields">
                            <sp-field-label for="campaignTitle" required>Title</sp-field-label>
                            <sp-textfield
                                id="campaignTitle"
                                data-field="title"
                                value="${form.title?.values[0]}"
                                @input=${this.#handleFragmentUpdate}
                            ></sp-textfield>
                            <sp-field-label for="promoCode">Promo Code</sp-field-label>
                            <sp-textfield
                                id="promoCode"
                                data-field="promoCode"
                                value="${form.promoCode?.values[0]}"
                                @input=${this.#handleFragmentUpdate}
                            ></sp-textfield>
                            <sp-field-label for="startDate" required>Start Date (UTC)</sp-field-label>
                            <input
                                type="datetime-local"
                                id="startDate"
                                value="${form.startDate?.values[0].slice(0, 16)}"
                                data-field="startDate"
                                @change=${this.#handleDateUpdate}
                            />
                            <sp-field-label for="endDate" required>End Date (UTC)</sp-field-label>
                            <input
                                type="datetime-local"
                                id="endDate"
                                value="${form.endDate?.values[0].slice(0, 16)}"
                                data-field="endDate"
                                @change=${this.#handleDateUpdate}
                            />
                            <sp-field-label>Tags</sp-field-label>
                            <aem-tag-picker-field
                                label="Tags"
                                namespace="/content/cq:tags/mas"
                                multiple
                                value="${form.tags?.values.join(',') || ''}"
                                @change=${this.#handeTagsChange}
                            ></aem-tag-picker-field>
                            <sp-field-group id="promotion-geos-tags">
                                <sp-field-label>Geos</sp-field-label>
                                <aem-tag-picker-field
                                    selection="checkbox-tags"
                                    display-value
                                    label="Locale tags"
                                    namespace="/content/cq:tags/mas"
                                    top="locale,pzn"
                                    multiple
                                    value="${form.geos?.values.join(',') || ''}"
                                    @change=${this.#handleGeosChange}
                                ></aem-tag-picker-field>
                            </sp-field-group>
                        </div>
                        <sp-divider size="m" style="align-self: stretch; height: auto;" vertical></sp-divider>
                        <div class="promotions-form-surfaces">
                            <sp-field-label>Surfaces</sp-field-label>
                            <div class="promotions-form-surfaces-panel">
                                ${!form.surfaces?.values || form.surfaces.values.length === 0
                                    ? html`
                                          <div class="surfaces-empty-state">
                                              <div class="icon">
                                                  <overlay-trigger type="modal" id="add-surfaces-overlay">
                                                      ${this.renderAddSurfacesDialog()}
                                                      <sp-button slot="trigger" variant="secondary">
                                                          <sp-icon-add size="xxl"></sp-icon-add>
                                                      </sp-button>
                                                  </overlay-trigger>
                                              </div>
                                              <div class="label">
                                                  <strong>Add Surfaces</strong><br />
                                                  Select at least one surface to publish your campaign.
                                              </div>
                                          </div>
                                      `
                                    : html`
                                          <div class="surfaces-list">
                                              <sp-tags data-foo="${form.surfaces.values}">
                                                  ${repeat(
                                                      form.surfaces.values,
                                                      (surface) => surface,
                                                      (surface) => {
                                                          const surfaceLabel =
                                                              Object.values(SURFACES).find((s) => s.name === surface)?.label ||
                                                              surface;
                                                          return html`
                                                              <sp-tag
                                                                  value="${surface}"
                                                                  deletable
                                                                  @delete=${this.#handleSurfaceDelete}
                                                              >
                                                                  ${surfaceLabel}
                                                              </sp-tag>
                                                          `;
                                                      },
                                                  )}
                                                  <overlay-trigger type="modal" id="add-surfaces-overlay">
                                                      ${this.renderAddSurfacesDialog()}
                                                      <sp-button slot="trigger" variant="secondary" icon-only>
                                                          <sp-icon-add slot="icon" size="m"></sp-icon-add>
                                                      </sp-button>
                                                  </overlay-trigger>
                                              </sp-tags>
                                          </div>
                                      `}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="promotions-form-items-outer">
                    ${this.showSelectedEmptyState
                        ? html`
                              <div class="form-field select-items">
                                  <h2>Fragments <sp-icon-asterisk100></sp-icon-asterisk100></h2>
                                  <div class="items-empty-state">
                                      <div class="icon">
                                          <overlay-trigger
                                              type="modal"
                                              id="add-promotion-items-overlay"
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
                                                  <sp-icon-add size="xxl" slot="icon" label="Add fragments"></sp-icon-add>
                                              </sp-button>
                                          </overlay-trigger>
                                      </div>
                                      <div class="label">
                                          <strong>Add fragments</strong><br />
                                          <span>Select cards and collections this promotion applies to.</span>
                                      </div>
                                  </div>
                              </div>
                          `
                        : html`<div class="form-field selected-items" @click=${this.#toggleSelectedItemsOpen}>
                              <div class="selected-items-header">
                                  <h2>
                                      Selected items
                                      <span>(${this.selectedItemsCount})</span>
                                      <sp-icon-asterisk100></sp-icon-asterisk100>
                                  </h2>
                                  <div>
                                      <overlay-trigger type="modal" id="add-promotion-items-overlay" triggered-by="click">
                                          ${this.renderAddItemsDialog()}
                                          <sp-action-button slot="trigger" quiet @click=${this.#openAddItemsOverlay}>
                                              <sp-icon-edit slot="icon" label="Edit items"></sp-icon-edit>
                                              Edit
                                          </sp-action-button>
                                      </overlay-trigger>
                                      <sp-button icon-only class="toggle-btn ghost-button">
                                          <sp-icon-chevron-down
                                              slot="icon"
                                              .label=${this.isSelectedItemsOpen ? 'Close' : 'Open'}
                                          ></sp-icon-chevron-down>
                                      </sp-button>
                                  </div>
                              </div>
                              ${this.isSelectedItemsOpen
                                  ? html`<mas-promotions-items-selector
                                        .viewOnly=${true}
                                        .getDisplayName=${getPromotionPickerFragmentLabel}
                                        .renderFragmentStatusCell=${renderFragmentStatusCell}
                                    ></mas-promotions-items-selector>`
                                  : nothing}
                          </div>`}
                </div>
                <div class="promotions-form-buttons">
                    <sp-button @click=${this.#handleCancel}>Cancel</sp-button>
                    ${this.isNewPromotion
                        ? html`<sp-button @click=${this.#handleCreatePromotion} ?disabled=${this.isCreated}>Create</sp-button>`
                        : html`<sp-button @click=${this.#handleUpdatePromotion} ?disabled=${updateDisabled}>Update</sp-button>`}
                </div>
            </div>
        `;
    }

    renderAddSurfacesDialog() {
        const surfaces = this.fragment?.fields.find((field) => field.name === 'surfaces')?.values || [];
        return html`
            <sp-dialog-wrapper
                slot="click-content"
                headline="Add surfaces"
                confirm-label="Done"
                cancel-label="Cancel"
                size="l"
                underlay
                @confirm=${this.#handleCloseAddSurfacesDialog}
            >
                <sp-search placeholder="Search surface"></sp-search>
                <div class="surfaces-results"><span>0</span> results</div>
                <sp-table selects="multiple" scroller="true" emphasized id="surfaces-table" .selected=${surfaces}>
                    <sp-table-head>
                        <sp-table-head-cell>All surfaces</sp-table-head-cell>
                    </sp-table-head>
                    <sp-table-body>
                        ${repeat(
                            Object.values(SURFACES),
                            (surface) => surface.name,
                            (surface) => html`
                                <sp-table-row value="${surface.name}">
                                    <sp-table-cell>${surface.label}</sp-table-cell>
                                </sp-table-row>
                            `,
                        )}
                    </sp-table-body>
                </sp-table>
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
}

export default MasPromotionsEditor;
export { MasPromotionsEditor };
customElements.define('mas-promotions-editor', MasPromotionsEditor);
