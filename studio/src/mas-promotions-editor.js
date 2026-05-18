import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { MasRepository } from './mas-repository.js';
import './aem/aem-tag-picker-field.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import styles from './mas-promotions-editor-css.js';
import { SURFACES, PAGE_NAMES, PROMOTION_MODEL_ID, TABLE_TYPE, CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from './constants.js';
import { normalizeKey, showToast, extractLocaleFromPath } from './utils.js';
import { Fragment } from './aem/fragment.js';
import { Promotion } from './aem/promotion.js';
import { getItemsSelectionStore, setItemsSelectionStore } from './common/items-selection-store.js';
import './promotions/mas-promotions-fragments-selector.js';
import router from './router.js';
import { openPreview, closePreview } from './mas-card-preview.js';
import {
    normalizeGeosForTagPicker,
    localeCodeFromGeoValue,
    groupLocalesForPromotionPicker,
    filterGeosGroupsByQuery,
    flattenMasIdsFromGroups,
    displayLocaleChip,
    PROMOTION_GEOS_PICKER_SURFACE,
    summarizePromotionGeosForDisplayLines,
} from './promotions/promotion-geos-utils.js';
import { loadSelectedFragments } from './common/utils/items-loader.js';
import {
    getPromotionFragmentName,
    promotionProductOfferTitle,
    promotionVariantDisplayLabel,
    renderPromotionFragmentStatusCell,
} from './promotions/promotion-fragments-utils.js';
import {
    buildPromotionSurfacesCreateFieldPayload,
    expandPromotionSurfacesFieldForEditor,
    flattenPromotionSurfacesToCsv,
    partitionPromotionPathsByModel,
    promotionSurfacesUsesMultilineModel,
} from './promotions/promotion-persistence-utils.js';
import { getItemTitle } from './common/utils/render-utils.js';

const typeMap = {
    title: { type: 'text' },
    promoCode: { type: 'text' },
    startDate: { type: 'date-time' },
    endDate: { type: 'date-time' },
    tags: { type: 'tag', multiple: true },
    surfaces: { type: 'text' },
    geos: { type: 'tag', multiple: true },
    fragments: { type: 'content-fragment', multiple: true },
    collections: { type: 'content-fragment', multiple: true },
};

const requiredFields = ['title', 'startDate', 'endDate'];

class MasPromotionsEditor extends LitElement {
    static styles = styles;

    static properties = {
        loadingPromotion: { type: Boolean, state: true },
        isNewPromotion: { type: Boolean, state: true },
        isCreated: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
        geosDraft: { type: Array, state: true },
        geosSearchQuery: { type: String, state: true },
        selectedCountriesCollapsed: { type: Boolean, state: true },
        /** @type {string[]} Group keys (variant labels) collapsed in the fragments summary. */
        collapsedPromotionFragmentGroups: { type: Array, state: true },
    };

    inEdit = Store.promotions.inEdit;
    promotionId = Store.promotions.promotionId;

    storeController = null;

    #itemsSelectionStoreSnapshot = null;
    #collectionsUnsubscribe = null;

    #geosSnapshot = [];
    #cardsSnapshot = [];
    #collectionsSnapshot = [];
    #itemsConfirmed = false;

    #onPreviewEscapeKeydown = (e) => {
        if (e.key !== 'Escape') return;
        if (!Store.preview.value) return;
        closePreview();
    };

    constructor() {
        super();
        this.loadingPromotion = false;
        this.isNewPromotion = false;
        this.isCreated = false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.geosDraft = [];
        this.geosSearchQuery = '';
        this.selectedCountriesCollapsed = false;
        this.collapsedPromotionFragmentGroups = [];
    }

    async connectedCallback() {
        super.connectedCallback();

        this.#itemsSelectionStoreSnapshot = getItemsSelectionStore({ allowUnset: true });
        setItemsSelectionStore(Store.promotions);
        Store.promotions.offerDataCache = new Map();
        Store.promotions.groupedVariationsByParent.set(new Map());
        Store.promotions.groupedVariationsData.set(new Map());
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.selectedPlaceholders.set([]);
        Store.promotions.showSelected.set(false);

        Store.promotions.allPlaceholders.set([]);
        Store.promotions.displayPlaceholders.set([]);
        Store.promotions.placeholdersByPaths.set(new Map());

        if (this.repository?.searchFragments) {
            this.repository.searchFragments();
        }
        if (this.repository?.loadAllCollections) {
            this.repository.loadAllCollections();
        }

        this.#collectionsUnsubscribe = Store.translationProjects.collectionsByPaths.subscribe((collectionsByPaths) => {
            Store.promotions.allCollections.set(Store.translationProjects.allCollections.get());
            Store.promotions.displayCollections.set(Store.translationProjects.displayCollections.get());
            Store.promotions.collectionsByPaths.set(collectionsByPaths);
        });

        Store.search.set((prev) => ({ ...prev, region: null }));
        Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));

        const promotionId = this.promotionId.get();
        if (promotionId) {
            if (!this.fragmentStore) {
                this.loadingPromotion = true;
                await this.#loadPromotionById(promotionId);
                this.loadingPromotion = false;
            }
        } else {
            this.isNewPromotion = true;
            const existingDraft = this.inEdit.get();
            if (existingDraft) {
                this.fragmentStore = existingDraft;
            } else {
                const newPromotion = this.#initializeNewPromotion();
                this.fragmentStore = new FragmentStore(newPromotion);
            }
        }

        await this.#syncSelectionsFromPromotionModel();
        void this.#hydratePromotionSelectedItems();
        this.storeController = new StoreController(this, this.fragmentStore);
        new ReactiveController(this, [
            Store.promotions.selectedCards,
            Store.promotions.selectedCollections,
            Store.promotions.cardsByPaths,
            Store.promotions.collectionsByPaths,
        ]);
        window.addEventListener('keydown', this.#onPreviewEscapeKeydown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('keydown', this.#onPreviewEscapeKeydown);
        closePreview();
        this.#collectionsUnsubscribe?.();
        this.#collectionsUnsubscribe = null;
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

    async #loadPromotionById(id) {
        try {
            const fragment = await this.repository.aem.sites.cf.fragments.getById(id);
            if (fragment) {
                const promotion = new Promotion(fragment);
                this.#expandPromotionSurfacesForEditor(promotion);
                if (!promotion.fields.some((f) => f.name === 'geos')) {
                    promotion.fields.push({ name: 'geos', values: [] });
                }
                if (!promotion.fields.some((f) => f.name === 'fragments')) {
                    promotion.fields.push({ name: 'fragments', values: [] });
                }

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
                { name: 'surfaces', type: 'text', multiple: false, values: [] },
                { name: 'geos', values: [] },
                { name: 'fragments', values: [] },
            ],
        });
    }

    #handeTagsChange = (event) => {
        const tags = event.target.getAttribute('value');
        const newTags = tags ? tags.split(',') : [];
        this.fragmentStore.updateField('tags', newTags);
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

    #primeGeosDialogState = () => {
        this.#geosSnapshot = [...(this.fragment?.getFieldValues('geos') ?? [])];
        this.geosDraft = [...normalizeGeosForTagPicker(this.#geosSnapshot)];
        this.geosSearchQuery = '';
    };

    #openGeosOverlay = () => {
        this.#primeGeosDialogState();
    };

    #onGeosSearchInput = (event) => {
        const t = event.composedPath?.()[0] || event.target;
        this.geosSearchQuery = t?.value ?? '';
    };

    #onLocaleGeosChange = (event, masId) => {
        const checked = event.target.checked;
        const set = new Set(this.geosDraft);
        if (checked) set.add(masId);
        else set.delete(masId);
        this.geosDraft = [...set];
    };

    #geosSelectAllLeadState(visibleMasIds) {
        const set = new Set(this.geosDraft);
        const n = visibleMasIds.filter((id) => set.has(id)).length;
        if (n === 0) return { checked: false, indeterminate: false };
        if (n === visibleMasIds.length) return { checked: true, indeterminate: false };
        return { checked: false, indeterminate: true };
    }

    #geosRegionLeadState(regionItems) {
        const set = new Set(this.geosDraft);
        const n = regionItems.filter((it) => set.has(it.masId)).length;
        if (n === 0) return { checked: false, indeterminate: false };
        if (n === regionItems.length) return { checked: true, indeterminate: false };
        return { checked: false, indeterminate: true };
    }

    #onGeosSelectAllFiltered = (event, visibleMasIds) => {
        const checked = event.target.checked;
        const set = new Set(this.geosDraft);
        if (checked) {
            for (const id of visibleMasIds) set.add(id);
        } else {
            for (const id of visibleMasIds) set.delete(id);
        }
        this.geosDraft = [...set];
    };

    #onGeosRegionHeaderChange = (event, allRegionItems) => {
        const checked = event.target.checked;
        const set = new Set(this.geosDraft);
        for (const it of allRegionItems) {
            if (checked) set.add(it.masId);
            else set.delete(it.masId);
        }
        this.geosDraft = [...set];
    };

    #handleGeosCancel = () => {
        if (this.fragmentStore) {
            this.fragmentStore.updateField('geos', [...this.#geosSnapshot]);
        }
    };

    #alignGeosDialogFooter = ({ target }) => {
        const slotDiv = target?.shadowRoot?.querySelector('div[slot="footer"]');
        if (!slotDiv) return;
        slotDiv.style.width = '100%';
        slotDiv.style.display = 'flex';
        slotDiv.style.justifyContent = 'flex-end';
    };

    #closeGeosDialog = () => {
        this.renderRoot.querySelector('.add-geos-dialog')?.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    };

    #confirmGeosDialog = () => {
        if (this.fragmentStore) {
            this.fragmentStore.updateField('geos', [...this.geosDraft]);
        }
        this.selectedCountriesCollapsed = false;
        this.#closeGeosDialog();
    };

    #cancelGeosDialog = () => {
        this.#handleGeosCancel();
        this.#closeGeosDialog();
    };

    #geoChipLabel(geo) {
        if (!geo || typeof geo !== 'string') return '';
        const code = localeCodeFromGeoValue(geo);
        if (code) return displayLocaleChip(code);
        return geo.includes('/') ? geo.split('/').filter(Boolean).pop() : geo;
    }

    get #geosDialog() {
        const allGroups = groupLocalesForPromotionPicker(PROMOTION_GEOS_PICKER_SURFACE);
        const filtered = filterGeosGroupsByQuery(allGroups, this.geosSearchQuery);
        const visibleIds = flattenMasIdsFromGroups(filtered);
        const selectAllState = this.#geosSelectAllLeadState(visibleIds);
        const geosFooter = html`
            <sp-button-group>
                <sp-button variant="secondary" treatment="outline" @click=${this.#cancelGeosDialog}>Cancel</sp-button>
                <sp-button variant="accent" ?disabled=${this.geosDraft.length === 0} @click=${this.#confirmGeosDialog}
                    >Continue</sp-button
                >
            </sp-button-group>
        `;
        return html`
            <sp-dialog-wrapper
                class="add-geos-dialog"
                slot="click-content"
                headline="Select countries"
                size="l"
                underlay
                dismissable
                no-divider
                .footer=${geosFooter}
                @sp-opened=${this.#alignGeosDialogFooter}
            >
                <div class="geos-dialog-body">
                    <sp-search
                        placeholder="Search country"
                        .value=${this.geosSearchQuery}
                        @input=${this.#onGeosSearchInput}
                    ></sp-search>
                    <div class="geos-dialog-toolbar">
                        <sp-checkbox
                            .checked=${selectAllState.checked}
                            .indeterminate=${selectAllState.indeterminate}
                            @change=${(e) => this.#onGeosSelectAllFiltered(e, visibleIds)}
                            >Select all</sp-checkbox
                        >
                        <span class="geos-locale-count">${visibleIds.length} locales</span>
                    </div>
                    ${repeat(
                        filtered,
                        (g) => g.name,
                        (g) => {
                            const fullItems = allGroups.find((x) => x.name === g.name)?.items ?? g.items;
                            const lead = this.#geosRegionLeadState(fullItems);
                            return html`
                                <section class="geos-region">
                                    <div class="geos-region-head">
                                        <sp-checkbox
                                            .checked=${lead.checked}
                                            .indeterminate=${lead.indeterminate}
                                            @change=${(e) => this.#onGeosRegionHeaderChange(e, fullItems)}
                                            >${g.name}</sp-checkbox
                                        >
                                    </div>
                                    <div class="geos-locale-grid">
                                        ${repeat(
                                            g.items,
                                            (it) => it.masId,
                                            (it) => html`
                                                <sp-checkbox
                                                    value=${it.masId}
                                                    .checked=${this.geosDraft.includes(it.masId)}
                                                    @change=${(e) => this.#onLocaleGeosChange(e, it.masId)}
                                                    >${displayLocaleChip(it.code)}</sp-checkbox
                                                >
                                            `,
                                        )}
                                    </div>
                                </section>
                            `;
                        },
                    )}
                </div>
            </sp-dialog-wrapper>
        `;
    }

    #getTotalOffersCount() {
        const frag = this.fragment;
        if (!frag) return 0;
        const paths = frag.getFieldValues('fragments') ?? [];
        const cardsBy = Store.promotions.cardsByPaths.get() ?? new Map();
        const keys = new Set();
        for (const path of paths) {
            const item = cardsBy.get(path);
            if (!item) continue;
            const oid = item?.offerData?.offerId;
            const tagTitle = item?.tags?.find((t) => t.id?.includes('mas:product_code'))?.title;
            keys.add(oid || tagTitle || path);
        }
        return keys.size;
    }

    #getPromoCodeCountryRows(form) {
        const geos = form.geos?.values ?? [];
        const promo = (form.promoCode?.values?.[0] ?? '').trim();
        if (!geos.length) return [];
        const displayCode = promo || '—';
        return geos.map((g) => ({ code: displayCode, country: this.#geoChipLabel(g) }));
    }

    #renderCountriesInsightsSection(form) {
        const geos = form.geos?.values ?? [];
        const n = geos.length;
        const offers = this.#getTotalOffersCount();
        const frags =
            (form.fragments?.values ?? []).length +
            (this.#promotionHasCollectionsField() ? (form.collections?.values ?? []).length : 0);
        const promoRows = this.#getPromoCodeCountryRows(form);
        const geosDialog = this.#geosDialog;
        if (!n) {
            return html`
                <section class="promotions-countries-stack promotions-countries-stack--empty">
                    <sp-field-label>Select countries</sp-field-label>
                    <div class="promotions-form-surfaces-panel">
                        <div class="surfaces-empty-state">
                            <div class="icon">
                                <overlay-trigger type="modal" class="add-geos-overlay" @sp-opened=${this.#openGeosOverlay}>
                                    ${geosDialog}
                                    <sp-button slot="trigger" variant="secondary">
                                        <sp-icon-add size="xxl"></sp-icon-add>
                                    </sp-button>
                                </overlay-trigger>
                            </div>
                            <div class="label">
                                <strong>Add countries</strong><br />
                                Choose one or more countries for your promotion project.
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }
        const geosOverlay = html`
            <overlay-trigger type="modal" class="add-geos-overlay" @sp-opened=${this.#openGeosOverlay}>
                ${geosDialog}
                <button type="button" slot="trigger" class="promotions-countries-edit" aria-haspopup="dialog">
                    <span class="promotions-countries-edit-label">
                        <sp-icon-edit size="s"></sp-icon-edit>
                        Edit
                    </span>
                </button>
            </overlay-trigger>
        `;
        const insightsBlock = html`
            <div class="promotions-countries-insights">
                <div class="promotions-countries-grid">
                    <div class="promotions-stat-cards">
                        <div class="promotions-stat-card">
                            <div class="promotions-stat-card-head">
                                <span>Total Offers</span>
                                <sp-icon-info size="s"></sp-icon-info>
                            </div>
                            <div class="promotions-stat-card-value">${offers}</div>
                        </div>
                        <div class="promotions-stat-card">
                            <div class="promotions-stat-card-head">
                                <span>Total Fragments</span>
                                <sp-icon-info size="s"></sp-icon-info>
                            </div>
                            <div class="promotions-stat-card-value">${frags}</div>
                        </div>
                    </div>
                    <div class="promotions-promo-codes-card">
                        <div class="promotions-promo-codes-head">
                            <span>Promo codes by country</span>
                            <sp-icon-info size="s"></sp-icon-info>
                        </div>
                        <div class="promotions-promo-codes-body">
                            ${promoRows.length
                                ? html`<div class="promotions-promo-codes-table-shell">
                                      <sp-table class="promotions-promo-codes-table" emphasized>
                                          <sp-table-head>
                                              <sp-table-head-cell>Promo codes</sp-table-head-cell>
                                              <sp-table-head-cell>Countries</sp-table-head-cell>
                                          </sp-table-head>
                                          <sp-table-body>
                                              ${repeat(
                                                  promoRows,
                                                  (r) => `${r.code}|${r.country}`,
                                                  (r) =>
                                                      html`<sp-table-row>
                                                          <sp-table-cell>${r.code}</sp-table-cell>
                                                          <sp-table-cell>${r.country}</sp-table-cell>
                                                      </sp-table-row>`,
                                              )}
                                          </sp-table-body>
                                      </sp-table>
                                  </div>`
                                : html`<div class="promotions-promo-codes-empty">
                                      Add countries to map promo codes by locale.
                                  </div>`}
                        </div>
                    </div>
                </div>
            </div>
        `;
        return html`
            <section class="promotions-countries-stack">
                <div class="promotions-countries-selected-card">
                    <div class="promotions-countries-selected-head">
                        <strong class="promotions-countries-selected-heading">Selected countries (${n})</strong>
                        <div class="promotions-countries-selected-actions">
                            ${geosOverlay}
                            <button
                                type="button"
                                class="promotions-countries-collapse-trigger"
                                aria-expanded=${this.selectedCountriesCollapsed ? 'false' : 'true'}
                                aria-label="Toggle selected countries summary"
                                @click=${this.#toggleSelectedCountriesCollapse}
                            >
                                ${this.selectedCountriesCollapsed
                                    ? html`<sp-icon-chevron-down size="m"></sp-icon-chevron-down>`
                                    : html`<sp-icon-chevron-up size="m"></sp-icon-chevron-up>`}
                            </button>
                        </div>
                    </div>
                    ${this.selectedCountriesCollapsed
                        ? nothing
                        : html`<div class="promotions-countries-selected-body">${this.#renderPromotionGeosSummary(geos)}</div>`}
                </div>
                ${insightsBlock}
            </section>
        `;
    }

    #toggleSelectedCountriesCollapse() {
        this.selectedCountriesCollapsed = !this.selectedCountriesCollapsed;
    }

    #renderPromotionGeosSummary(geos) {
        const lines = summarizePromotionGeosForDisplayLines(geos);
        if (!lines.length) {
            return html`<div class="promotions-countries-selected-line">—</div>`;
        }
        return html`${lines.map((line) => html`<div class="promotions-countries-selected-line">${line}</div>`)}`;
    }

    async #hydratePromotionSelectedItems() {
        if (!this.repository) return;
        const getDisplayName = (f) => f.title || f.path || '';
        const cardPaths = Store.promotions.selectedCards.get() ?? [];
        const collPaths = Store.promotions.selectedCollections.get() ?? [];
        const tasks = [];
        if (cardPaths.length) {
            tasks.push(
                loadSelectedFragments(cardPaths, TABLE_TYPE.CARDS, this.repository, {
                    getDisplayName,
                    onItems: (items) => {
                        const map = new Map(Store.promotions.cardsByPaths.get() || []);
                        for (const it of items) map.set(it.path, it);
                        Store.promotions.cardsByPaths.set(map);
                    },
                }),
            );
        }
        if (collPaths.length) {
            tasks.push(
                loadSelectedFragments(collPaths, TABLE_TYPE.COLLECTIONS, this.repository, {
                    getDisplayName,
                    onItems: (items) => {
                        const map = new Map(Store.promotions.collectionsByPaths.get() || []);
                        for (const it of items) map.set(it.path, it);
                        Store.promotions.collectionsByPaths.set(map);
                    },
                }),
            );
        }
        await Promise.all(tasks);
    }

    #promotionHasCollectionsField() {
        return Boolean(this.fragment?.fields?.some((f) => f.name === 'collections'));
    }

    #expandPromotionSurfacesForEditor(promotion) {
        expandPromotionSurfacesFieldForEditor(promotion.getField('surfaces'));
    }

    #serializePromotionSurfacesForSave() {
        const field = this.fragment?.getField('surfaces');
        if (!field || promotionSurfacesUsesMultilineModel(field)) return;
        const csv = flattenPromotionSurfacesToCsv(field.values);
        this.fragmentStore.updateField('surfaces', csv ? [csv] : []);
    }

    #promotionSurfaceTagValues(values) {
        if (!Array.isArray(values)) return [];
        const seen = new Set();
        const out = [];
        for (const v of values) {
            if (v == null) continue;
            const s = typeof v === 'string' ? v.trim() : String(v).trim();
            if (!s || seen.has(s)) continue;
            seen.add(s);
            out.push(s);
        }
        return out;
    }

    async #partitionPromotionPathsByModel(paths) {
        const repo = this.repository;
        const getByPath = repo?.aem?.getFragmentByPath ? (path) => repo.aem.getFragmentByPath(path) : null;
        const { cardPaths, collectionPaths } = await partitionPromotionPathsByModel(paths, getByPath, COLLECTION_MODEL_PATH);
        Store.promotions.selectedCards.set(cardPaths);
        Store.promotions.selectedCollections.set(collectionPaths);
    }

    #mergedFragmentPathsFromStore() {
        return [...(Store.promotions.selectedCards.value ?? []), ...(Store.promotions.selectedCollections.value ?? [])];
    }

    #writeFragmentReferenceFieldsFromStore() {
        if (!this.fragmentStore) return;
        if (this.#promotionHasCollectionsField()) {
            this.fragmentStore.updateField('fragments', [...(Store.promotions.selectedCards.value ?? [])]);
            this.fragmentStore.updateField('collections', [...(Store.promotions.selectedCollections.value ?? [])]);
        } else {
            this.fragmentStore.updateField('fragments', this.#mergedFragmentPathsFromStore());
        }
    }

    async #syncSelectionsFromPromotionModel() {
        if (!this.fragment) return;
        if (this.#promotionHasCollectionsField()) {
            Store.promotions.selectedCards.set([...(this.fragment.getFieldValues('fragments') ?? [])]);
            Store.promotions.selectedCollections.set([...(this.fragment.getFieldValues('collections') ?? [])]);
            return;
        }
        const paths = [...(this.fragment.getFieldValues('fragments') ?? [])];
        if (!paths.length) {
            Store.promotions.selectedCards.set([]);
            Store.promotions.selectedCollections.set([]);
            Store.promotions.selectedPlaceholders.set([]);
            return;
        }
        await this.#partitionPromotionPathsByModel(paths);
    }

    #promotionFragmentGroupIsCollapsed(key) {
        return this.collapsedPromotionFragmentGroups.includes(key);
    }

    #togglePromotionFragmentGroup(key) {
        const set = new Set(this.collapsedPromotionFragmentGroups);
        if (set.has(key)) set.delete(key);
        else set.add(key);
        this.collapsedPromotionFragmentGroups = [...set];
    }

    async #copyPromotionOfferId(e, offerId) {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(offerId);
            showToast('Offer ID copied to clipboard', 'positive');
        } catch (err) {
            console.error('Failed to copy:', err);
            showToast('Failed to copy Offer ID', 'negative');
        }
    }

    #alignFragmentDialogFooter = ({ target }) => {
        const slotDiv = target?.shadowRoot?.querySelector('div[slot="footer"]');
        if (!slotDiv) return;
        slotDiv.style.width = '100%';
        slotDiv.style.display = 'flex';
        slotDiv.style.justifyContent = 'flex-end';
    };

    #dispatchFragmentPickerDialogEvent = (name) => {
        const wrapper = this.renderRoot.querySelector('.add-fragments-dialog');
        wrapper?.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true }));
    };

    #getPromotionPayloadFieldValues(field) {
        if (field.name === 'fragments') {
            if (this.#promotionHasCollectionsField()) {
                return [...(Store.promotions.selectedCards.value ?? [])];
            }
            return this.#mergedFragmentPathsFromStore();
        }
        if (field.name === 'collections') return [...(Store.promotions.selectedCollections.value ?? [])];
        return field.values;
    }

    #mapPromotionFieldForCreatePayload(field) {
        const name = field.name;
        const type = typeMap[field.name]?.type ?? field.type;
        const multiple = typeMap[field.name]?.multiple ?? field.multiple ?? false;
        const values = this.#getPromotionPayloadFieldValues(field);
        const surfacesPayload = buildPromotionSurfacesCreateFieldPayload(name, this.fragment.getField('surfaces'), values);
        if (surfacesPayload) return surfacesPayload;
        return { name, type, multiple, values };
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

    #utcDatePart(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '';
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
    }

    #utcTimePart(iso) {
        if (!iso) return '00:00';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '00:00';
        const p = (n) => String(n).padStart(2, '0');
        return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
    }

    #isoFromUtcDateAndTime(dateStr, timeStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-').map((x) => parseInt(x, 10));
        if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
        const [y, m, d] = parts;
        const tparts = (timeStr || '00:00').split(':');
        const hh = parseInt(tparts[0], 10) || 0;
        const mm = parseInt(tparts[1], 10) || 0;
        return new Date(Date.UTC(y, m - 1, d, hh, mm, 0, 0)).toISOString();
    }

    #syncPromotionDateTimeField(fieldName) {
        const row = this.renderRoot.querySelector(`.promotions-day-time-row[data-datetime-group="${fieldName}"]`);
        const dateIn = row?.querySelector('input[type="date"]');
        const timeIn = row?.querySelector('input[type="time"]');
        const iso = this.#isoFromUtcDateAndTime(dateIn?.value ?? '', timeIn?.value ?? '00:00');
        if (iso) this.fragmentStore.updateField(fieldName, [iso]);
    }

    async #handleCreatePromotion() {
        if (!this.#validateRequiredFields(this.fragment)) {
            showToast('Please fill in all required fields', 'negative');
            return;
        }

        const parentPath = this.repository.getPromotionsPath();
        if (!parentPath) {
            showToast('Select a surface in the DAM tree before creating a promotion.', 'negative');
            return;
        }

        const promotionsFolderReady = await this.repository.ensurePromotionsFolder(parentPath);
        if (!promotionsFolderReady) {
            showToast(
                'Could not open or create the promotions folder in DAM. Ensure the surface folder exists (e.g. /content/dam/mas/sandbox).',
                'negative',
            );
            return;
        }

        const fragmentPayload = {
            name: normalizeKey(this.fragment.getFieldValue('title')),
            parentPath,
            modelId: PROMOTION_MODEL_ID,
            title: this.fragment.getFieldValue('title'),
            fields: this.fragment.fields.map((field) => this.#mapPromotionFieldForCreatePayload(field)),
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

            // Reconnect the StoreController to the new FragmentStore instance
            this.storeController.hostDisconnected();
            this.storeController = new StoreController(this, this.fragmentStore);
            this.storeController.hostConnected();
            await this.#syncSelectionsFromPromotionModel();
            void this.#hydratePromotionSelectedItems();
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
        this.#writeFragmentReferenceFieldsFromStore();
        this.#serializePromotionSurfacesForSave();
        showToast('Saving project...');
        try {
            await this.repository.saveFragment(this.fragmentStore, false);
        } catch (error) {
            showToast('Failed to save project.', 'negative');
            return;
        }
        showToast('Project successfully saved.', 'positive');
    }

    async #handleCancel() {
        if (this.fragment?.hasChanges) {
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
        if (this.fragmentStore) {
            this.fragmentStore.discardChanges();
            await this.#syncSelectionsFromPromotionModel();
        }
        Store.promotions.promotionId.set('');
        Store.promotions.inEdit.set(null);
        Store.page.set(PAGE_NAMES.PROMOTIONS);
    }

    #validateRequiredFields(fragment = {}) {
        return requiredFields.every((field) => fragment.getFieldValue(field));
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

    get selectedFragmentItemCount() {
        return (Store.promotions.selectedCards.value?.length ?? 0) + (Store.promotions.selectedCollections.value?.length ?? 0);
    }

    get selectedCardRows() {
        const cardsBy = Store.promotions.cardsByPaths.value ?? new Map();
        return (Store.promotions.selectedCards.value ?? []).map((path) => ({ path, fragment: cardsBy.get(path) }));
    }

    get selectedCollectionRows() {
        const colsBy = Store.promotions.collectionsByPaths.value ?? new Map();
        return (Store.promotions.selectedCollections.value ?? []).map((path) => ({ path, fragment: colsBy.get(path) }));
    }

    #getFragmentField(fragment, name) {
        if (!fragment) return '';
        if (typeof fragment.getFieldValue === 'function') return fragment.getFieldValue(name) ?? '';
        return fragment.fields?.find((f) => f.name === name)?.values?.[0] ?? '';
    }

    #resolveFragmentId(fragment) {
        if (!fragment) return '';
        if (fragment.id) return fragment.id;
        try {
            return new Fragment(fragment).id ?? '';
        } catch {
            return '';
        }
    }

    #fragmentDisplayName(fragment, fallbackPath) {
        if (!fragment) return fallbackPath;
        const t = getItemTitle(fragment);
        return t === '-' ? 'no title' : t;
    }

    #editPromotionFragment(e, fragment) {
        e.stopPropagation();
        const id = this.#resolveFragmentId(fragment);
        if (!id) return;
        router.navigateToFragmentEditor(id, { locale: extractLocaleFromPath(fragment.path) });
    }

    #openPromotionCardPreviewHover(fragment) {
        if (!fragment || fragment.model?.path !== CARD_MODEL_PATH) return;
        const id = this.#resolveFragmentId(fragment);
        if (!id) return;
        openPreview(id, { left: 'min(300px, 15%)' });
    }

    #removeFragmentFromPromotion(e, path) {
        e.stopPropagation();
        const next = (Store.promotions.selectedCards.value ?? []).filter((p) => p !== path);
        Store.promotions.selectedCards.set(next);
        this.#writeFragmentReferenceFieldsFromStore();
    }

    #removeCollectionFromPromotion(e, path) {
        e.stopPropagation();
        const next = (Store.promotions.selectedCollections.value ?? []).filter((p) => p !== path);
        Store.promotions.selectedCollections.set(next);
        this.#writeFragmentReferenceFieldsFromStore();
    }

    #persistFragmentPickerSelection() {
        this.#writeFragmentReferenceFieldsFromStore();
    }

    #confirmFragmentPicker = ({ target }) => {
        this.#itemsConfirmed = true;
        this.#persistFragmentPickerSelection();
        this.#cardsSnapshot = [];
        this.#collectionsSnapshot = [];
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target?.dispatchEvent(closeEvent);
    };

    #cancelFragmentPicker = ({ target }) => {
        Store.promotions.selectedCards.set([...this.#cardsSnapshot]);
        Store.promotions.selectedCollections.set([...this.#collectionsSnapshot]);
        this.#itemsConfirmed = true;
        const closeEvent = new Event('close', { bubbles: true, composed: true });
        target?.dispatchEvent(closeEvent);
    };

    #openAddFragmentsOverlay = (e) => {
        if (e && e.target !== e.currentTarget) return;
        this.#itemsConfirmed = false;
        this.#cardsSnapshot = [...(Store.promotions.selectedCards.value ?? [])];
        this.#collectionsSnapshot = [...(Store.promotions.selectedCollections.value ?? [])];

        const selector = this.renderRoot.querySelector('mas-promotions-fragments-selector');
        if (selector) {
            selector.searchQuery = '';
            selector.selectedTab = TABLE_TYPE.CARDS;
            const searchFilters = selector.renderRoot?.querySelectorAll('mas-search-and-filters');
            searchFilters?.forEach((searchAndFilters) => {
                searchAndFilters.templateFilter = [];
                searchAndFilters.marketSegmentFilter = [];
                searchAndFilters.customerSegmentFilter = [];
                searchAndFilters.productFilter = [];
            });
        }
        Store.promotions.showSelected.set(false);
        Store.promotions.displayCards.set(Store.promotions.allCards.get());
        Store.promotions.displayCollections.set(Store.promotions.allCollections.get());

        if (this.repository?.searchFragments) void this.repository.searchFragments();
    };

    #restoreFragmentSelectionSnapshot = () => {
        if (this.#itemsConfirmed) return;
        Store.promotions.selectedCards.set([...this.#cardsSnapshot]);
        Store.promotions.selectedCollections.set([...this.#collectionsSnapshot]);
    };

    #groupCardsByVariant() {
        const groups = new Map();
        for (const row of this.selectedCardRows) {
            const variant = this.#getFragmentField(row.fragment, 'variant') || 'Other';
            if (!groups.has(variant)) groups.set(variant, []);
            groups.get(variant).push(row);
        }
        return groups;
    }

    #renderFragmentRow(path, fragment) {
        const fragmentId = this.#resolveFragmentId(fragment);
        const displayName = this.#fragmentDisplayName(fragment, path);
        const mnemonicIcon = this.#getFragmentField(fragment, 'mnemonicIcon');
        const status = fragment?.status;
        const offerLabel = fragment ? promotionProductOfferTitle(fragment) || 'No offer' : html`<em>Loading…</em>`;
        const offerId = fragment?.offerData?.offerId;
        const fragModel = fragment ? new Fragment(fragment) : null;
        const localeLabel = fragModel?.locale || extractLocaleFromPath(path) || '—';
        const pagesCount = fragModel?.getVariations()?.length ?? 0;
        const offerCell = html`
            <sp-table-cell class="name">
                <div class="promotions-fragment-row-name">
                    ${mnemonicIcon ? html`<img class="promotions-fragment-row-icon" src=${mnemonicIcon} alt="" />` : nothing}
                    <span>${offerLabel}</span>
                </div>
            </sp-table-cell>
        `;
        const titleCell = html`<sp-table-cell class="title"
            >${fragment ? displayName : html`<em>Loading…</em>`}</sp-table-cell
        >`;
        const offerIdCell = html`
            <sp-table-cell class="offer-id">
                ${offerId
                    ? html`
                          <span class="offer-id-text">${offerId}</span>
                          <sp-action-button
                              icon-only
                              quiet
                              aria-label="Copy Offer ID to clipboard"
                              @click=${(e) => this.#copyPromotionOfferId(e, offerId)}
                          >
                              <sp-icon-copy slot="icon"></sp-icon-copy>
                          </sp-action-button>
                      `
                    : html`<span>—</span>`}
            </sp-table-cell>
        `;
        const typeCell = html`<sp-table-cell class="offer-type">${localeLabel}</sp-table-cell>`;
        const pagesCell = html`<sp-table-cell class="last-modified-by">${pagesCount}</sp-table-cell>`;
        return html`
            <sp-table-row value=${path}>
                ${offerCell} ${titleCell} ${offerIdCell}
                ${status
                    ? renderPromotionFragmentStatusCell(status)
                    : html`<sp-table-cell class="status-cell">—</sp-table-cell>`}
                ${typeCell} ${pagesCell}
                <sp-table-cell class="actions">
                    <div class="promotions-fragment-actions-inner">
                        <sp-action-menu placement="bottom" quiet @click=${(e) => e.stopPropagation()}>
                            <sp-icon-more slot="icon"></sp-icon-more>
                            <sp-menu-item @click=${(e) => this.#editPromotionFragment(e, fragment)} ?disabled=${!fragmentId}>
                                <sp-icon-edit slot="icon"></sp-icon-edit>
                                Edit
                            </sp-menu-item>
                            <sp-menu-item @click=${(e) => this.#removeFragmentFromPromotion(e, path)}>
                                <sp-icon-delete slot="icon"></sp-icon-delete>
                                Delete
                            </sp-menu-item>
                        </sp-action-menu>
                    </div>
                </sp-table-cell>
                ${fragment?.model?.path === CARD_MODEL_PATH && fragmentId
                    ? html`<sp-table-cell
                          class="preview promotions-preview-cell--interactive"
                          @mouseover=${() => this.#openPromotionCardPreviewHover(fragment)}
                          @mouseout=${closePreview}
                      >
                          <span class="promotions-preview-icon-wrap">
                              <sp-icon-preview label="Preview fragment"></sp-icon-preview>
                          </span>
                      </sp-table-cell>`
                    : html`<sp-table-cell class="preview promotions-preview-cell--static">
                          <span class="promotions-preview-icon-wrap">
                              <sp-icon-preview label="Preview not available for this fragment"></sp-icon-preview>
                          </span>
                      </sp-table-cell>`}
            </sp-table-row>
        `;
    }

    #renderFragmentGroup(variant, rows) {
        const title = promotionVariantDisplayLabel(variant);
        const collapsed = this.#promotionFragmentGroupIsCollapsed(variant);
        return html`
            <div class="promotions-fragments-group">
                <div
                    class="promotions-fragments-group-head"
                    role="button"
                    tabindex="0"
                    aria-expanded=${collapsed ? 'false' : 'true'}
                    @click=${() => this.#togglePromotionFragmentGroup(variant)}
                    @keydown=${(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.#togglePromotionFragmentGroup(variant);
                        }
                    }}
                >
                    <h3 class="promotions-fragments-group-title">${title} (${rows.length})</h3>
                    ${collapsed
                        ? html`<sp-icon-chevron-down size="m"></sp-icon-chevron-down>`
                        : html`<sp-icon-chevron-up size="m"></sp-icon-chevron-up>`}
                </div>
                ${collapsed
                    ? nothing
                    : html`
                          <sp-table class="promotions-fragments-table item-table" emphasized scroller>
                              <sp-table-head>
                                  <sp-table-head-cell class="name">Offer</sp-table-head-cell>
                                  <sp-table-head-cell class="title">Fragment title</sp-table-head-cell>
                                  <sp-table-head-cell class="offer-id">Offer ID</sp-table-head-cell>
                                  <sp-table-head-cell class="status">Status</sp-table-head-cell>
                                  <sp-table-head-cell class="offer-type">Type</sp-table-head-cell>
                                  <sp-table-head-cell class="last-modified-by">Pages</sp-table-head-cell>
                                  <sp-table-head-cell class="actions">Actions</sp-table-head-cell>
                                  <sp-table-head-cell class="preview">Preview</sp-table-head-cell>
                              </sp-table-head>
                              <sp-table-body>
                                  ${repeat(
                                      rows,
                                      (row) => row.path,
                                      ({ path, fragment }) => this.#renderFragmentRow(path, fragment),
                                  )}
                              </sp-table-body>
                          </sp-table>
                      `}
            </div>
        `;
    }

    #renderCollectionsGroup(rows) {
        if (!rows.length) return nothing;
        const groupKey = '__collections__';
        const collapsed = this.#promotionFragmentGroupIsCollapsed(groupKey);
        return html`
            <div class="promotions-fragments-group">
                <div
                    class="promotions-fragments-group-head"
                    role="button"
                    tabindex="0"
                    aria-expanded=${collapsed ? 'false' : 'true'}
                    @click=${() => this.#togglePromotionFragmentGroup(groupKey)}
                    @keydown=${(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.#togglePromotionFragmentGroup(groupKey);
                        }
                    }}
                >
                    <h3 class="promotions-fragments-group-title">Collections (${rows.length})</h3>
                    ${collapsed
                        ? html`<sp-icon-chevron-down size="m"></sp-icon-chevron-down>`
                        : html`<sp-icon-chevron-up size="m"></sp-icon-chevron-up>`}
                </div>
                ${collapsed
                    ? nothing
                    : html`
                          <sp-table class="promotions-fragments-table item-table" emphasized scroller>
                              <sp-table-head>
                                  <sp-table-head-cell class="name">Offer</sp-table-head-cell>
                                  <sp-table-head-cell class="title">Collection</sp-table-head-cell>
                                  <sp-table-head-cell class="offer-id">Path</sp-table-head-cell>
                                  <sp-table-head-cell class="status">Status</sp-table-head-cell>
                                  <sp-table-head-cell class="offer-type">Type</sp-table-head-cell>
                                  <sp-table-head-cell class="last-modified-by">Pages</sp-table-head-cell>
                                  <sp-table-head-cell class="actions">Actions</sp-table-head-cell>
                                  <sp-table-head-cell class="preview">Preview</sp-table-head-cell>
                              </sp-table-head>
                              <sp-table-body>
                                  ${repeat(
                                      rows,
                                      (row) => row.path,
                                      ({ path, fragment }) => {
                                          const collModel = fragment ? new Fragment(fragment) : null;
                                          const localeLabel = collModel?.locale || extractLocaleFromPath(path) || '—';
                                          return html`
                                              <sp-table-row value=${path}>
                                                  <sp-table-cell class="name"
                                                      ><span class="promotions-table-cell-dash">—</span></sp-table-cell
                                                  >
                                                  <sp-table-cell class="title">${fragment?.title ?? path}</sp-table-cell>
                                                  <sp-table-cell class="offer-id"
                                                      >${fragment?.studioPath ?? path}</sp-table-cell
                                                  >
                                                  ${fragment?.status
                                                      ? renderPromotionFragmentStatusCell(fragment.status)
                                                      : html`<sp-table-cell class="status-cell">—</sp-table-cell>`}
                                                  <sp-table-cell class="offer-type">${localeLabel}</sp-table-cell>
                                                  <sp-table-cell class="last-modified-by">0</sp-table-cell>
                                                  <sp-table-cell class="actions">
                                                      <div class="promotions-fragment-actions-inner">
                                                          <sp-action-menu
                                                              placement="bottom"
                                                              quiet
                                                              @click=${(e) => e.stopPropagation()}
                                                          >
                                                              <sp-icon-more slot="icon"></sp-icon-more>
                                                              <sp-menu-item
                                                                  @click=${(e) => this.#editPromotionFragment(e, fragment)}
                                                                  ?disabled=${!this.#resolveFragmentId(fragment)}
                                                              >
                                                                  <sp-icon-edit slot="icon"></sp-icon-edit>
                                                                  Edit
                                                              </sp-menu-item>
                                                              <sp-menu-item
                                                                  @click=${(e) => this.#removeCollectionFromPromotion(e, path)}
                                                              >
                                                                  <sp-icon-delete slot="icon"></sp-icon-delete>
                                                                  Delete
                                                              </sp-menu-item>
                                                          </sp-action-menu>
                                                      </div>
                                                  </sp-table-cell>
                                                  <sp-table-cell class="preview promotions-preview-cell--static">
                                                      <span class="promotions-preview-icon-wrap">
                                                          <sp-icon-preview
                                                              label="Preview not available for collections"
                                                          ></sp-icon-preview>
                                                      </span>
                                                  </sp-table-cell>
                                              </sp-table-row>
                                          `;
                                      },
                                  )}
                              </sp-table-body>
                          </sp-table>
                      `}
            </div>
        `;
    }

    get addFragmentsDialog() {
        const footerContent = html`
            <sp-button-group>
                <sp-button
                    variant="secondary"
                    treatment="outline"
                    @click=${() => this.#dispatchFragmentPickerDialogEvent('cancel')}
                    >Cancel</sp-button
                >
                <sp-button variant="accent" @click=${() => this.#dispatchFragmentPickerDialogEvent('confirm')}
                    >Add selected fragments</sp-button
                >
            </sp-button-group>
        `;
        return html`
            <sp-dialog-wrapper
                class="add-fragments-dialog"
                slot="click-content"
                headline="Select fragments"
                headline-visibility="none"
                .footer=${footerContent}
                underlay
                dismissable
                no-divider
                @sp-opened=${this.#alignFragmentDialogFooter}
                @confirm=${this.#confirmFragmentPicker}
                @cancel=${this.#cancelFragmentPicker}
                @close=${this.#restoreFragmentSelectionSnapshot}
            >
                <mas-promotions-fragments-selector
                    .getDisplayName=${getPromotionFragmentName}
                    .renderFragmentStatusCell=${renderPromotionFragmentStatusCell}
                ></mas-promotions-fragments-selector>
            </sp-dialog-wrapper>
        `;
    }

    get fragmentsSection() {
        const count = this.selectedFragmentItemCount;
        const groups = this.#groupCardsByVariant();
        return html`
            <div class="promotions-fragments-section">
                <div class="promotions-fragments-header">
                    <h2 class="promotions-fragments-heading">Fragments (${count})</h2>
                    <overlay-trigger
                        type="modal"
                        id="add-fragments-overlay"
                        triggered-by="click"
                        @sp-opened=${this.#openAddFragmentsOverlay}
                    >
                        ${this.addFragmentsDialog}
                        <sp-button slot="trigger" variant="secondary" size="s">+ Add fragments</sp-button>
                    </overlay-trigger>
                </div>
                ${count > 0
                    ? html`
                          <div class="promotions-fragments-content">
                              ${[...groups.entries()].map(([variant, rows]) => this.#renderFragmentGroup(variant, rows))}
                              ${this.#renderCollectionsGroup(this.selectedCollectionRows)}
                          </div>
                      `
                    : html`<p class="promotions-fragments-empty">No fragments selected yet.</p>`}
            </div>
        `;
    }

    render() {
        let form = nothing;
        if (this.fragment) {
            form = Object.fromEntries([...this.fragment.fields.map((f) => [f.name, f])]);
        }
        const surfaceTagValues = this.#promotionSurfaceTagValues(form.surfaces?.values);
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
                    <div class="promotions-general-info-wrap">
                        <div class="promotions-general-unified-card">
                            <div class="promotions-form-panel-content">
                                <div class="promotions-general-column promotions-general-column--left">
                                    <h2 class="promotions-general-heading">General info</h2>
                                    <div class="promotions-form-fields promotions-general-left">
                                        <sp-field-label for="campaignTitle" required>Title</sp-field-label>
                                        <sp-textfield
                                            id="campaignTitle"
                                            class="promotions-title-field"
                                            data-field="title"
                                            value="${form.title?.values[0]}"
                                            @input=${this.#handleFragmentUpdate}
                                        ></sp-textfield>
                                        <sp-field-label for="promoCode">Promo code</sp-field-label>
                                        <sp-textfield
                                            id="promoCode"
                                            data-field="promoCode"
                                            value="${form.promoCode?.values[0]}"
                                            @input=${this.#handleFragmentUpdate}
                                        ></sp-textfield>
                                        <sp-field-label>Tags</sp-field-label>
                                        <aem-tag-picker-field
                                            label="Tags"
                                            namespace="/content/cq:tags/mas"
                                            multiple
                                            value="${form.tags?.values.join(',') || ''}"
                                            @change=${this.#handeTagsChange}
                                        ></aem-tag-picker-field>
                                    </div>
                                </div>
                                <sp-divider class="promotions-general-divider" size="m" vertical></sp-divider>
                                <div class="promotions-general-column promotions-general-column--right">
                                    <div class="promotions-general-right">
                                        <div class="promotions-day-time-row" data-datetime-group="startDate">
                                            <div class="promotions-date-col">
                                                <sp-field-label for="startDate" required>Start day</sp-field-label>
                                                <input
                                                    type="date"
                                                    id="startDate"
                                                    class="promotions-date-input"
                                                    value="${this.#utcDatePart(form.startDate?.values?.[0])}"
                                                    @change=${() => this.#syncPromotionDateTimeField('startDate')}
                                                />
                                            </div>
                                            <div class="promotions-time-col">
                                                <sp-field-label for="startTime" required>Time (GMT)</sp-field-label>
                                                <input
                                                    type="time"
                                                    id="startTime"
                                                    class="promotions-time-input"
                                                    step="60"
                                                    value="${this.#utcTimePart(form.startDate?.values?.[0])}"
                                                    @change=${() => this.#syncPromotionDateTimeField('startDate')}
                                                />
                                            </div>
                                        </div>
                                        <div class="promotions-day-time-row" data-datetime-group="endDate">
                                            <div class="promotions-date-col">
                                                <sp-field-label for="endDate">End day</sp-field-label>
                                                <input
                                                    type="date"
                                                    id="endDate"
                                                    class="promotions-date-input"
                                                    value="${this.#utcDatePart(form.endDate?.values?.[0])}"
                                                    @change=${() => this.#syncPromotionDateTimeField('endDate')}
                                                />
                                            </div>
                                            <div class="promotions-time-col">
                                                <sp-field-label for="endTime">Time (GMT)</sp-field-label>
                                                <input
                                                    type="time"
                                                    id="endTime"
                                                    class="promotions-time-input"
                                                    step="60"
                                                    value="${this.#utcTimePart(form.endDate?.values?.[0])}"
                                                    @change=${() => this.#syncPromotionDateTimeField('endDate')}
                                                />
                                            </div>
                                        </div>
                                        <sp-field-label>Surfaces</sp-field-label>
                                        <div class="promotions-form-surfaces-panel">
                                            ${surfaceTagValues.length === 0
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
                                                          <sp-tags>
                                                              ${repeat(
                                                                  surfaceTagValues,
                                                                  (surface) => surface,
                                                                  (surface) => {
                                                                      const surfaceLabel =
                                                                          Object.values(SURFACES).find(
                                                                              (s) => s.name === surface,
                                                                          )?.label || surface;
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
                        </div>
                    </div>
                    ${this.#renderCountriesInsightsSection(form)} ${this.fragment ? this.fragmentsSection : nothing}
                    <div class="promotions-form-buttons">
                        <sp-button @click=${this.#handleCancel}>Cancel</sp-button>
                        ${this.isNewPromotion
                            ? html`<sp-button @click=${this.#handleCreatePromotion} ?disabled=${this.isCreated}
                                  >Create</sp-button
                              >`
                            : html`<sp-button @click=${this.#handleUpdatePromotion} ?disabled=${!this.fragment?.hasChanges}
                                  >Update</sp-button
                              >`}
                    </div>
                </div>
            </div>
        `;
    }

    renderAddSurfacesDialog() {
        const surfaces = this.fragment?.fields.find((field) => field.name === 'surfaces')?.values || [];
        const surfacesSelected = this.#promotionSurfaceTagValues(surfaces);
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
                <sp-table selects="multiple" scroller="true" emphasized id="surfaces-table" .selected=${surfacesSelected}>
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
        if (!this.confirmDialogConfig || !this.fragment?.hasChanges) return nothing;

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
customElements.define('mas-promotions-editor', MasPromotionsEditor);
