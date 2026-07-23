import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles as tableStyles } from '../common/components/mas-select-items-table.css.js';
import { promotionsItemsTableStyles } from './mas-promotions-items-table.css.js';
import { getItemsSelectionStore } from '../common/items-selection-store.js';
import { loadSelectedFragments, enrichPromoVariations } from '../common/utils/items-loader.js';
import { PAGE_NAMES, TABLE_TYPE, CARD_MODEL_PATH, VARIATION_TAB_NAME } from '../constants.js';
import { applySearchSurfaceFromPath, shouldIgnoreRowClickForSelection } from '../common/utils/render-utils.js';
import { closePreview, openPreview } from '../mas-card-preview.js';
import router from '../router.js';
import { extractLocaleFromPath, extractSurfaceFromPath, showToast } from '../utils.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import Store from '../store.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import {
    splitPromotionTagsFieldValues,
    parsePromoCodeExceptions,
    parseOfferSubstitutions,
    parseCountriesFromGeos,
    countDistinctPromoCodesForOffer,
    groupCountriesByPromoCodeForOffer,
    groupOfferSubstitutionsForOffer,
    applyPromotionOfferProductTagsToSearch,
    buildRemoveOfferConfirmationMessage,
    getPromotionItemsRemovedByOfferRemoval,
    pruneOrphanedPromotionSelectionAfterOfferRemoval,
} from './promotion-editor-utils.js';
import { isPromoVariationPath } from './promotion-model.js';
import { getUsedGeoTags } from './promotion-variations.js';
import { createPromoVariation, probePromoVariationsForFragment } from './promotions-repository.js';
import './mas-promo-variation-geos.js';
import { openOfferSelectorTool } from '../rte/ost.js';
import '../common/components/mas-select-items-table.js';

const PROMO_VARIATION_LOOKUP_FAILED_MESSAGE = 'Could not verify the promo variation. Check your connection and try again.';

const offersTableColumns = [
    { label: '', key: 'expand' },
    { label: 'Offer', key: 'offer', sortable: true },
    { label: 'Product arrangement', key: 'productArrangement' },
    { label: 'Offer type', key: 'offerType' },
    { label: 'Plan type', key: 'planType' },
    { label: 'Customer segment', key: 'customerSegment' },
    { label: 'Market segment', key: 'marketSegment' },
    { label: 'Promo code', key: 'promoCode', class: 'promo-code-head-cell' },
    { label: 'Actions', key: 'actions' },
];

class MasPromotionsItemsTable extends LitElement {
    static styles = [tableStyles, promotionsItemsTableStyles];

    static properties = {
        type: { type: String },
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
        promoCodeExceptions: { type: Array },
        defaultPromoCode: { type: String },
        geos: { type: Array },
        expandedPaths: { type: Object, state: true },
        viewOnlyLoading: { type: Boolean, state: true },
        viewOnlyFragments: { type: Array, state: true },
        confirmDialogConfig: { type: Object, state: true },
        offerRemovalDialogOpen: { type: Boolean, state: true },
        createPromoVariationLoading: { type: Boolean, state: true },
        existingPromoVariationGeosByPath: { type: Object, state: true },
        existingPromoVariationsByPath: { type: Object, state: true },
        existingPromoVariationEmptyGeoPaths: { type: Object, state: true },
        promoVariationGeosDialogItem: { type: Object, state: true },
        promoVariationSelectedGeos: { type: Array, state: true },
        promoVariationDisabledGeos: { type: Array, state: true },
        fragmentHasEmptyGeosVariation: { type: Boolean, state: true },
    };

    #loadedPathsKey = null;
    #processAbortController = null;
    #selectionController = null;

    constructor() {
        super();
        this.viewOnlyLoading = false;
        this.viewOnlyFragments = [];
        this.confirmDialogConfig = null;
        this.offerRemovalDialogOpen = false;
        this.createPromoVariationLoading = false;
        this.existingPromoVariationGeosByPath = new Map();
        this.existingPromoVariationsByPath = new Map();
        this.existingPromoVariationEmptyGeoPaths = new Set();
        this.promoVariationGeosDialogItem = null;
        this.promoVariationSelectedGeos = [];
        this.promoVariationDisabledGeos = [];
        this.fragmentHasEmptyGeosVariation = false;
        this.promoCodeExceptions = [];
        this.defaultPromoCode = '';
        this.geos = [];
        this.expandedPaths = new Set();
        this.getDisplayName = (fragmentData) => fragmentData?.path ?? '';
        this.renderFragmentStatusCell = () => nothing;
    }

    get #promotionTagId() {
        const promotionStore = Store.promotions.inEdit.get();
        const promotion = promotionStore?.get?.();
        if (!promotion) return null;
        const { promotion: promotionTags } = splitPromotionTagsFieldValues(promotion.getFieldValues('tags'));
        const first = promotionTags[0];
        return first ? normalizeTagId(first) : null;
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.#selectionController) return;
        const store = getItemsSelectionStore();
        const selectionStore =
            this.type === TABLE_TYPE.OFFERS
                ? store.selectedOffers
                : this.type === TABLE_TYPE.CARDS
                  ? store.selectedCards
                  : store.selectedCollections;
        this.#selectionController = new ReactiveController(this, [selectionStore, Store.promotions.inEdit]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#processAbortController?.abort();
        this.#processAbortController = null;
        this.viewOnlyLoading = false;
        this.confirmDialogConfig?.onCancel?.();
        this.confirmDialogConfig = null;
        this.offerRemovalDialogOpen = false;
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    get typeUppercased() {
        return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }

    get selectedPaths() {
        const store = getItemsSelectionStore();
        if (this.type === TABLE_TYPE.OFFERS) return store.selectedOffers.value;
        return store[`selected${this.typeUppercased}`].value;
    }

    get #promoCodeExceptionValues() {
        if (this.promoCodeExceptions?.length) return this.promoCodeExceptions;
        return Store.promotions.inEdit.get()?.get?.()?.getFieldValues('offers') ?? [];
    }

    get #defaultPromoCodeValue() {
        if (this.defaultPromoCode) return this.defaultPromoCode;
        return Store.promotions.inEdit.get()?.get?.()?.getFieldValues('promoCode')?.[0] ?? '';
    }

    get #geoValues() {
        if (this.geos?.length) return this.geos;
        return Store.promotions.inEdit.get()?.get?.()?.getFieldValues('geos') ?? [];
    }

    get #countries() {
        return parseCountriesFromGeos(this.#geoValues);
    }

    get #exceptionsMap() {
        return parsePromoCodeExceptions(this.#promoCodeExceptionValues);
    }

    get #offerSubstitutionsMap() {
        return parseOfferSubstitutions(this.#promoCodeExceptionValues);
    }

    #promoCodeCountForOffer(offerId) {
        return countDistinctPromoCodesForOffer(this.#exceptionsMap, offerId, this.#countries, this.#defaultPromoCodeValue);
    }

    updated(changed) {
        super.updated(changed);
        if (
            changed.has('promoVariationGeosDialogItem') ||
            changed.has('promoVariationSelectedGeos') ||
            changed.has('fragmentHasEmptyGeosVariation')
        ) {
            this.#syncPromoVariationConfirmButtonDisabled();
        }
        if (!this.type) return;
        if (this.type === TABLE_TYPE.OFFERS) {
            this.#loadSelectedOffers(this.selectedPaths);
            return;
        }
        const paths = this.selectedPaths;
        const key = paths.slice().sort().join('|');
        if (key === this.#loadedPathsKey) return;
        this.#loadedPathsKey = key;
        this.#loadSelected(paths);
    }

    #loadSelectedOffers(offerIds) {
        const key = offerIds.slice().sort().join('|');
        if (key === this.#loadedPathsKey) return;
        this.#loadedPathsKey = key;
        if (!offerIds.length) {
            this.viewOnlyFragments = [];
            this.viewOnlyLoading = false;
            return;
        }
        this.viewOnlyFragments = offerIds.map((offerId) => {
            const cached = Store.promotions.offerDataCache.get(offerId);
            if (cached) return cached;
            return {
                path: offerId,
                id: offerId,
                offerData: { offerId },
                tags: [],
                fields: [],
            };
        });
        this.viewOnlyLoading = false;
    }

    async #loadSelected(paths) {
        this.#processAbortController?.abort();
        if (!paths.length) {
            this.viewOnlyFragments = [];
            this.viewOnlyLoading = false;
            return;
        }
        this.viewOnlyLoading = true;
        this.#processAbortController = new AbortController();
        const signal = this.#processAbortController.signal;
        await loadSelectedFragments(paths, this.type, this.repository, {
            signal,
            onItems: (items) => {
                if (!signal.aborted) {
                    this.viewOnlyFragments = items;
                    if (this.type === TABLE_TYPE.CARDS) {
                        this.#syncExistingPromoVariations(items, signal);
                    }
                }
            },
            getDisplayName: this.getDisplayName,
        }).finally(() => {
            if (!signal.aborted) this.viewOnlyLoading = false;
        });
    }

    async #syncExistingPromoVariations(items, signal) {
        if (signal.aborted) return;
        const promoTag = this.#promotionTagId;
        if (!promoTag || !this.repository?.aem?.sites?.cf?.fragments?.getByPath) {
            if (signal.aborted) return;
            this.existingPromoVariationGeosByPath = new Map();
            this.existingPromoVariationsByPath = new Map();
            this.existingPromoVariationEmptyGeoPaths = new Set();
            return;
        }
        const previousGeos = this.existingPromoVariationGeosByPath;
        const previousVariations = this.existingPromoVariationsByPath;
        const geosByPath = new Map();
        const variationsByPath = new Map();
        const previousEmptyGeoPaths = this.existingPromoVariationEmptyGeoPaths;
        const emptyGeoPaths = new Set();
        await Promise.all(
            items.map(async (item) => {
                if (signal.aborted) return;
                try {
                    const variations = await probePromoVariationsForFragment(this.repository.aem, item.path, promoTag);
                    if (variations.length) {
                        const enrichedVariations = await enrichPromoVariations(variations, item, {
                            getDisplayName: this.getDisplayName,
                        });
                        geosByPath.set(item.path, getUsedGeoTags(variations));
                        variationsByPath.set(item.path, enrichedVariations);
                        if (variations.some((variation) => !variation.pznTags?.length)) {
                            emptyGeoPaths.add(item.path);
                        }
                    }
                } catch {
                    if (previousGeos.has(item.path)) {
                        geosByPath.set(item.path, previousGeos.get(item.path) || []);
                        variationsByPath.set(item.path, previousVariations.get(item.path) || []);
                        if (previousEmptyGeoPaths.has(item.path)) emptyGeoPaths.add(item.path);
                    }
                }
            }),
        );
        if (signal.aborted) return;
        this.existingPromoVariationEmptyGeoPaths = emptyGeoPaths;
        this.existingPromoVariationGeosByPath = geosByPath;
        this.existingPromoVariationsByPath = variationsByPath;
    }

    #showToast(text, variant) {
        this.dispatchEvent(
            new CustomEvent('show-toast', {
                detail: { text, variant },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #getPromotionProjectId() {
        return Store.promotions.inEdit.get()?.get?.()?.id || Store.promotions.promotionId.get() || null;
    }

    async #navigateToFragmentEditorFromProject(fragmentId, path) {
        const promotionId = this.#getPromotionProjectId();
        if (promotionId) {
            Store.promotions.promotionId.set(promotionId);
        }
        applySearchSurfaceFromPath(path);
        const locale = extractLocaleFromPath(path);
        await router.navigateToFragmentEditor(fragmentId, { locale });
        if (promotionId) {
            Store.promotions.promotionId.set(promotionId);
        }
    }

    #getSearchUrl(item) {
        if (!item?.id || !item?.path) return '';
        const surface = extractSurfaceFromPath(item.path);
        const locale = extractLocaleFromPath(item.path);
        const catalogLocale = (surface && getDefaultLocaleCode(surface, locale)) || locale;
        const params = new URLSearchParams({ page: PAGE_NAMES.CONTENT, query: item.id });
        if (surface) params.set('path', surface);
        if (catalogLocale) params.set('locale', catalogLocale);
        if (locale && locale !== catalogLocale) params.set('region', locale);
        return `${window.location.pathname}${window.location.search}#${params.toString()}`;
    }

    #canCreatePromoVariation(item) {
        if (!item?.id || !item?.path || !this.#promotionTagId) return false;
        if (isPromoVariationPath(item.path)) return false;
        if (!this.existingPromoVariationGeosByPath.has(item.path)) return true;
        const usedGeos = this.existingPromoVariationGeosByPath.get(item.path);
        const hasUnusedGeo = this.#geoValues.some((geo) => !usedGeos.includes(geo));
        const hasEmptyGeoSlotOpen = !this.existingPromoVariationEmptyGeoPaths.has(item.path);
        return hasUnusedGeo || hasEmptyGeoSlotOpen;
    }

    #closeConfirmDialog() {
        this.confirmDialogConfig = null;
    }

    get #promoVariationDialogWrapper() {
        return this.shadowRoot?.querySelector('sp-dialog-wrapper.promo-variation-geos-dialog');
    }

    async #syncPromoVariationConfirmButtonDisabled() {
        if (!this.promoVariationGeosDialogItem) return;
        await this.#promoVariationDialogWrapper?.updateComplete;
        const confirmButton = this.#promoVariationDialogWrapper?.shadowRoot?.querySelector(
            'sp-button[variant="accent"][slot="button"]',
        );
        if (!confirmButton) return;
        confirmButton.disabled = !this.promoVariationSelectedGeos.length && this.fragmentHasEmptyGeosVariation;
    }

    #closePromoVariationGeosDialog() {
        this.promoVariationGeosDialogItem = null;
        this.promoVariationSelectedGeos = [];
        this.promoVariationDisabledGeos = [];
        this.fragmentHasEmptyGeosVariation = false;
    }

    #handlePromoVariationGeosChange(e) {
        this.promoVariationSelectedGeos = e.detail.value;
    }

    async #createPromoVariation(e, item) {
        e.stopPropagation();
        const promoTag = this.#promotionTagId;
        if (!promoTag || !item?.id || !this.repository) return;

        this.promoVariationSelectedGeos = [];
        this.promoVariationDisabledGeos = [];
        this.fragmentHasEmptyGeosVariation = false;
        this.createPromoVariationLoading = true;

        try {
            const existingVariations = await probePromoVariationsForFragment(this.repository.aem, item.path, promoTag);
            this.promoVariationDisabledGeos = getUsedGeoTags(existingVariations);
            this.fragmentHasEmptyGeosVariation = existingVariations.some((variation) => !variation.pznTags?.length);
            this.promoVariationGeosDialogItem = item;
        } catch {
            showToast(PROMO_VARIATION_LOOKUP_FAILED_MESSAGE, 'negative');
        } finally {
            this.createPromoVariationLoading = false;
        }
    }

    #confirmCreatePromoVariation() {
        return new Promise((resolve) => {
            this.confirmDialogConfig = {
                title: 'Create promo variation',
                message:
                    'This creates a copy of the fragment under the promotion folder so you can edit promo content without changing the default.',
                confirmText: 'Create',
                cancelText: 'Cancel',
                variant: 'confirmation',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
            };
        });
    }

    async #handlePromoVariationGeosConfirm() {
        const item = this.promoVariationGeosDialogItem;
        const promoTag = this.#promotionTagId;
        const geoTags = this.promoVariationSelectedGeos;
        const hasEmptyGeosVariation = this.fragmentHasEmptyGeosVariation;
        this.#closePromoVariationGeosDialog();
        if (!promoTag || !item?.id || !this.repository) return;

        if (!geoTags.length && hasEmptyGeosVariation) {
            showToast(
                'A variation with no geos already exists for this project. Select one or more geos to create another variation.',
                'negative',
            );
            return;
        }

        const confirmed = await this.#confirmCreatePromoVariation();
        if (!confirmed) return;

        try {
            this.createPromoVariationLoading = true;
            showToast('Creating promo variation...');
            const created = await createPromoVariation(this.repository.aem, item.id, promoTag, geoTags, (store) =>
                this.repository.refreshFragment(store),
            );
            showToast('Promo variation created', 'positive');
            const previousGeos = this.existingPromoVariationGeosByPath.get(item.path) || [];
            this.existingPromoVariationGeosByPath = new Map(this.existingPromoVariationGeosByPath).set(item.path, [
                ...previousGeos,
                ...geoTags,
            ]);
            if (!geoTags.length) {
                this.existingPromoVariationEmptyGeoPaths = new Set([...this.existingPromoVariationEmptyGeoPaths, item.path]);
            }
            await this.#navigateToFragmentEditorFromProject(created.id, created.path);
        } catch (err) {
            showToast(err.message || 'Failed to create promo variation', 'negative');
        } finally {
            this.createPromoVariationLoading = false;
        }
    }

    #getOfferRemovalContext(selectorId) {
        const store = getItemsSelectionStore();
        return {
            store,
            removed: getPromotionItemsRemovedByOfferRemoval({
                offerSelectorId: selectorId,
                selectedOffers: store.selectedOffers.value,
                selectedCards: store.selectedCards.value,
                selectedCollections: store.selectedCollections.value,
                offerDataCache: Store.promotions.offerDataCache,
                cardsByPaths: store.cardsByPaths.value,
                collectionsByPaths: store.collectionsByPaths.value,
                groupedVariationsByParent: store.groupedVariationsByParent.value,
                groupedVariationsData: store.groupedVariationsData.value,
            }),
        };
    }

    #confirmRemoveOffer(fragmentCount, collectionCount) {
        return new Promise((resolve) => {
            this.confirmDialogConfig = {
                title: 'Remove offer',
                message: buildRemoveOfferConfirmationMessage(fragmentCount, collectionCount),
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'confirmation',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
            };
        });
    }

    #applyOfferRemoval(selectorId) {
        const store = getItemsSelectionStore();
        const remainingOffers = store.selectedOffers.value.filter((id) => id !== selectorId);
        store.selectedOffers.set(remainingOffers);
        Store.promotions.offerDataCache.delete(selectorId);
        if (!remainingOffers.length) {
            store.selectedCards.set([]);
            store.selectedCollections.set([]);
        } else {
            const pruned = pruneOrphanedPromotionSelectionAfterOfferRemoval({
                selectedCards: store.selectedCards.value,
                selectedCollections: store.selectedCollections.value,
                remainingSelectedOfferIds: remainingOffers,
                offerDataCache: Store.promotions.offerDataCache,
                cardsByPaths: store.cardsByPaths.value,
                collectionsByPaths: store.collectionsByPaths.value,
                groupedVariationsByParent: store.groupedVariationsByParent.value,
                groupedVariationsData: store.groupedVariationsData.value,
            });
            store.selectedCards.set(pruned.selectedCards);
            store.selectedCollections.set(pruned.selectedCollections);
        }
        applyPromotionOfferProductTagsToSearch(Store.promotions.offerDataCache, remainingOffers);
        this.dispatchEvent(
            new CustomEvent('promotion-offer-removed', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    async #removeFromList(e, item) {
        e.stopPropagation();
        const path = item?.path;
        if (!path) return;
        const store = getItemsSelectionStore();
        if (this.type === TABLE_TYPE.OFFERS) {
            if (this.offerRemovalDialogOpen) return;
            const selectorId = item.path || item.id;
            const { removed } = this.#getOfferRemovalContext(selectorId);
            const fragmentCount = removed.removedCards.length;
            const collectionCount = removed.removedCollections.length;
            if (fragmentCount + collectionCount > 0) {
                this.offerRemovalDialogOpen = true;
                let confirmed = false;
                try {
                    confirmed = await this.#confirmRemoveOffer(fragmentCount, collectionCount);
                } finally {
                    this.offerRemovalDialogOpen = false;
                }
                if (!confirmed) return;
            }
            this.#applyOfferRemoval(selectorId);
            return;
        }
        if (this.type === TABLE_TYPE.CARDS) {
            store.selectedCards.set(store.selectedCards.value.filter((p) => p !== path));
        } else {
            store.selectedCollections.set(store.selectedCollections.value.filter((p) => p !== path));
        }
    }

    #openOst() {
        openOfferSelectorTool(document.createElement('osi-field'), null);
    }

    #renderOfferCell(item) {
        const iconSrc =
            item?.getFieldValue?.('mnemonicIcon') ?? item?.fields?.find((f) => f.name === 'mnemonicIcon')?.values?.[0];
        const offerName = item?.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || 'no offer name';
        return html`<sp-table-cell class="offer-cell">
            ${iconSrc ? html`<img class="mnemonic-icon" src=${iconSrc} alt="" />` : nothing}
            <span>${offerName}</span>
        </sp-table-cell>`;
    }

    get confirmDialogTemplate() {
        if (!this.confirmDialogConfig) return nothing;
        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;
        return html`
            <sp-dialog-wrapper
                open
                underlay
                .headline=${title}
                .variant=${variant || 'confirmation'}
                .confirmLabel=${confirmText}
                .cancelLabel=${cancelText}
                @confirm=${() => {
                    this.#closeConfirmDialog();
                    onConfirm?.();
                }}
                @cancel=${() => {
                    this.#closeConfirmDialog();
                    onCancel?.();
                }}
            >
                <div>${message}</div>
            </sp-dialog-wrapper>
        `;
    }

    get promoVariationGeosDialogTemplate() {
        if (!this.promoVariationGeosDialogItem) return nothing;
        return html`
            <sp-dialog-wrapper
                class="promo-variation-geos-dialog"
                open
                underlay
                mode="modal"
                size="l"
                headline="Select geos"
                cancel-label="Cancel"
                confirm-label="Continue"
                @confirm=${() => this.#handlePromoVariationGeosConfirm()}
                @cancel=${() => this.#closePromoVariationGeosDialog()}
                @close=${() => this.#closePromoVariationGeosDialog()}
            >
                <mas-promo-variation-geos
                    .geos=${this.#geoValues}
                    .disabledGeos=${this.promoVariationDisabledGeos}
                    .hasEmptyGeosVariation=${this.fragmentHasEmptyGeosVariation}
                    .value=${this.promoVariationSelectedGeos}
                    @change=${(e) => this.#handlePromoVariationGeosChange(e)}
                ></mas-promo-variation-geos>
            </sp-dialog-wrapper>
        `;
    }

    #renderActionsCell(item) {
        const showCreatePromo = this.type === TABLE_TYPE.CARDS && this.#canCreatePromoVariation(item);
        return html`<sp-table-cell class="actions-cell">
            <sp-action-menu placement="bottom-end" quiet @click=${(e) => e.stopPropagation()}>
                <sp-icon-more slot="icon"></sp-icon-more>
                ${showCreatePromo
                    ? html`<sp-menu-item
                          ?disabled=${this.createPromoVariationLoading}
                          @click=${(e) => this.#createPromoVariation(e, item)}
                      >
                          <sp-icon-copy slot="icon"></sp-icon-copy>
                          Create promo variation
                      </sp-menu-item>`
                    : nothing}
                ${this.type === TABLE_TYPE.OFFERS
                    ? html`<sp-menu-item @click=${(e) => this.#removeFromList(e, item)}>
                          <sp-icon-delete slot="icon"></sp-icon-delete>
                          Remove from list
                      </sp-menu-item>`
                    : html`<sp-menu-item>
                              <sp-icon-open-in slot="icon"></sp-icon-open-in>
                              <sp-link
                                  quiet
                                  variant="secondary"
                                  href=${this.#getSearchUrl(item)}
                                  target="_blank"
                                  rel="noopener"
                              >
                                  ${this.type === TABLE_TYPE.COLLECTIONS ? 'View default collection' : 'View default fragment'}
                              </sp-link>
                          </sp-menu-item>
                          <sp-menu-item @click=${(e) => this.#removeFromList(e, item)}>
                              <sp-icon-delete slot="icon"></sp-icon-delete>
                              Remove from list
                          </sp-menu-item>`}
            </sp-action-menu>
        </sp-table-cell>`;
    }

    #toggleExpand(path) {
        const next = new Set(this.expandedPaths);
        if (next.has(path)) {
            next.delete(path);
        } else {
            next.add(path);
        }
        this.expandedPaths = next;
    }

    #onOfferRowClick(e, path) {
        if (shouldIgnoreRowClickForSelection(e)) return;
        this.#toggleExpand(path);
    }

    #renderExpandCell(item) {
        const expanded = this.expandedPaths.has(item.path);
        return html`<sp-table-cell class="expand-cell">
            <sp-action-button
                quiet
                size="s"
                aria-label=${expanded ? 'Collapse row' : 'Expand row'}
                @click=${(e) => {
                    e.stopPropagation();
                    this.#toggleExpand(item.path);
                }}
            >
                <sp-icon-chevron-down slot="icon" class=${expanded ? 'expanded' : ''}></sp-icon-chevron-down>
            </sp-action-button>
        </sp-table-cell>`;
    }

    #renderTagCell(item, tagKey) {
        const title = item?.getTagTitle?.(tagKey) || '-';
        return html`<sp-table-cell>${title}</sp-table-cell>`;
    }

    #renderProductArrangementCell(item) {
        const arrangement = item?.getTagTitle?.('product_arrangement') || item?.offerData?.product_arrangement_code || '-';
        return html`<sp-table-cell>${arrangement}</sp-table-cell>`;
    }

    #renderPromoCodeCell(item) {
        const offerId = item?.offerData?.offerId;
        const count = this.#promoCodeCountForOffer(offerId);
        return html`<sp-table-cell class="promo-code-cell">${count || '-'}</sp-table-cell>`;
    }

    #getOfferPromoCodeGroups(item) {
        const offerKeys = [item?.path, item?.offerData?.offerId].filter(Boolean);
        return groupCountriesByPromoCodeForOffer(this.#exceptionsMap, offerKeys, this.#countries, this.#defaultPromoCodeValue);
    }

    #getOfferSubstitutionGroups(item) {
        const offerKeys = [item?.path, item?.offerData?.offerId].filter(Boolean);
        const offersBySelectorId = new Map(
            (this.viewOnlyFragments ?? [])
                .map((offer) => {
                    const selectorId = offer?.path ?? offer?.id;
                    if (!selectorId) return null;
                    const label =
                        offer?.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title ||
                        offer?.offerData?.offerId ||
                        selectorId;
                    return [selectorId, label];
                })
                .filter(Boolean),
        );
        return groupOfferSubstitutionsForOffer(
            this.#offerSubstitutionsMap,
            offerKeys,
            this.#countries,
            (selectorId) => offersBySelectorId.get(selectorId) ?? selectorId,
        );
    }

    #renderExpandedDetailRow(item) {
        if (!this.expandedPaths.has(item.path)) return nothing;
        const offerId = item?.offerData?.offerId ?? '-';
        const promoCodeGroups = this.#getOfferPromoCodeGroups(item);
        const offerSubstitutionGroups = this.#getOfferSubstitutionGroups(item);
        return html`<sp-table-row class="detail-row">
            <sp-table-cell class="detail-cell-full">
                <div class="offer-detail-content">
                    <div class="detail-offer-id"><strong>Offer ID:</strong><span>${offerId}</span></div>
                    <table class="offer-promo-codes-table">
                        <thead>
                            <tr>
                                <th>Promo codes</th>
                                <th>Countries</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${promoCodeGroups.length
                                ? repeat(
                                      promoCodeGroups,
                                      (group) => group.promoCode,
                                      (group) =>
                                          html`<tr>
                                              <td>${group.promoCode}</td>
                                              <td>${group.countriesLabel}</td>
                                          </tr>`,
                                  )
                                : html`<tr>
                                      <td colspan="2">-</td>
                                  </tr>`}
                        </tbody>
                    </table>
                    ${offerSubstitutionGroups.length
                        ? html`<table class="offer-promo-codes-table">
                              <thead>
                                  <tr>
                                      <th>Substitute offers</th>
                                      <th>Countries</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  ${repeat(
                                      offerSubstitutionGroups,
                                      (group) => group.offerLabel,
                                      (group) =>
                                          html`<tr>
                                              <td>${group.offerLabel}</td>
                                              <td>${group.countriesLabel}</td>
                                          </tr>`,
                                  )}
                              </tbody>
                          </table>`
                        : nothing}
                </div>
            </sp-table-cell>
        </sp-table-row>`;
    }

    #renderPreviewCell(item) {
        const canPreview = item?.model?.path === CARD_MODEL_PATH && item?.id;
        if (!canPreview) {
            return html`<sp-table-cell class="preview-cell"></sp-table-cell>`;
        }
        return html`<sp-table-cell
            class="preview-cell"
            @mouseover=${() => openPreview(item.id, { left: '50' })}
            @mouseout=${closePreview}
        >
            <sp-icon-preview label="Preview card"></sp-icon-preview>
        </sp-table-cell>`;
    }

    #renderOfferRow(item) {
        return html`<sp-table-row class="offer-row" value=${item.path} @click=${(e) => this.#onOfferRowClick(e, item.path)}>
            ${this.#renderExpandCell(item)} ${this.#renderOfferCell(item)} ${this.#renderProductArrangementCell(item)}
            ${this.#renderTagCell(item, 'offer_type')} ${this.#renderTagCell(item, 'plan_type')}
            ${this.#renderTagCell(item, 'customer_segment')} ${this.#renderTagCell(item, 'market_segment')}
            ${this.#renderPromoCodeCell(item)} ${this.#renderActionsCell(item)}
        </sp-table-row>`;
    }

    #renderOfferRows(items) {
        return repeat(
            items,
            (item) => item.path,
            (item) => html`${this.#renderOfferRow(item)}${this.#renderExpandedDetailRow(item)}`,
        );
    }

    #renderSkeletonRows() {
        return Array.from(
            { length: 6 },
            (_, i) =>
                html`<sp-table-row class="skeleton-row" key=${i}>
                    ${offersTableColumns.map(
                        () =>
                            html`<sp-table-cell>
                                <div class="skeleton-element skeleton-table-cell"></div>
                            </sp-table-cell>`,
                    )}
                </sp-table-row>`,
        );
    }

    get #offersEmptyStateTemplate() {
        return html`<div class="offers-empty-state">
            <div class="icon">
                <sp-button variant="secondary" @click=${this.#openOst}>
                    <sp-icon-add size="xxl"></sp-icon-add>
                </sp-button>
            </div>
            <div class="label">
                <strong>Add product offers</strong><br />
                Choose offers for selected countries.
            </div>
        </div>`;
    }

    #renderOffersTable() {
        if (!this.viewOnlyLoading && this.selectedPaths.length === 0) {
            return html`${this.confirmDialogTemplate}${this.#offersEmptyStateTemplate}`;
        }
        return html`<sp-table class="fragments-table item-table promotions-view-only promotions-offers-layout" emphasized>
            <sp-table-head>
                ${repeat(
                    offersTableColumns,
                    (column) => column.key,
                    (column) => html`<sp-table-head-cell class=${column.class || ''}>${column.label}</sp-table-head-cell>`,
                )}
            </sp-table-head>
            <sp-table-body>
                ${this.viewOnlyLoading ? this.#renderSkeletonRows() : this.#renderOfferRows(this.viewOnlyFragments)}
            </sp-table-body>
        </sp-table>`;
    }

    #renderCardsTable() {
        return html`<mas-select-items-table
            .viewOnly=${true}
            .viewOnlyFragments=${this.viewOnlyFragments}
            .viewOnlyLoading=${this.viewOnlyLoading}
            .viewOnlyTabs=${[VARIATION_TAB_NAME.PROMOTION]}
            .type=${TABLE_TYPE.CARDS}
            .getDisplayName=${this.getDisplayName}
            .renderFragmentStatusCell=${this.renderFragmentStatusCell}
            .tabs=${[VARIATION_TAB_NAME.PROMOTION]}
            .selectableTabs=${[]}
            .renderActionsCell=${(item) => this.#renderActionsCell(item)}
            .renderPreviewCell=${(item) => this.#renderPreviewCell(item)}
            .promoVariationsFetchedByParent=${this.existingPromoVariationsByPath}
            @show-toast=${this.#showToast}
        >
        </mas-select-items-table>`;
    }

    #renderCollectionsTable() {
        return html`<mas-select-items-table
            .viewOnly=${true}
            .viewOnlyFragments=${this.viewOnlyFragments}
            .viewOnlyLoading=${this.viewOnlyLoading}
            .viewOnlyTabs=${[VARIATION_TAB_NAME.PROMOTION]}
            .type=${TABLE_TYPE.COLLECTIONS}
            .getDisplayName=${this.getDisplayName}
            .renderFragmentStatusCell=${this.renderFragmentStatusCell}
            .tabs=${[VARIATION_TAB_NAME.PROMOTION]}
            .selectableTabs=${[]}
            .renderActionsCell=${(item) => this.#renderActionsCell(item)}
            .promoVariationsFetchedByParent=${this.existingPromoVariationsByPath}
            @show-toast=${this.#showToast}
        ></mas-select-items-table>`;
    }

    render() {
        let tableToRender = nothing;
        switch (this.type) {
            case TABLE_TYPE.OFFERS:
                tableToRender = this.#renderOffersTable(this.viewOnlyFragments, this.viewOnlyLoading);
                break;
            case TABLE_TYPE.CARDS:
                tableToRender = this.#renderCardsTable();
                break;
            case TABLE_TYPE.COLLECTIONS:
                tableToRender = this.#renderCollectionsTable();
                break;
        }
        return html` ${this.confirmDialogTemplate} ${this.promoVariationGeosDialogTemplate} ${tableToRender} `;
    }
}

export default MasPromotionsItemsTable;
export { MasPromotionsItemsTable };
customElements.define('mas-promotions-items-table', MasPromotionsItemsTable);
