import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles as tableStyles } from '../common/components/mas-select-items-table.css.js';
import { getItemsSelectionStore } from '../common/items-selection-store.js';
import { loadSelectedFragments } from '../common/utils/items-loader.js';
import { PAGE_NAMES, TABLE_TYPE, CARD_MODEL_PATH } from '../constants.js';
import {
    applySearchSurfaceFromPath,
    getItemTypeLabel,
    shouldIgnoreRowClickForSelection,
} from '../common/utils/render-utils.js';
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

const localStyles = css`
    :host {
        width: 100%;
        display: flex;
        min-height: 0;
    }

    .promotions-view-only .offer-cell {
        display: flex;
        align-items: center;
        gap: var(--spectrum-spacing-100);
        min-width: 0;
    }

    .promotions-view-only .mnemonic-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
    }

    .promotions-view-only sp-table-cell,
    .promotions-view-only sp-table-head-cell {
        word-break: normal;
        overflow-wrap: anywhere;
    }

    .promotions-view-only .path {
        min-width: 0;
        overflow: hidden;
    }

    .promotions-view-only .path span {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        overflow-wrap: anywhere;
        white-space: normal;
    }

    .promotions-view-only .offer-id {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: var(--spectrum-spacing-75);
        color: var(--spectrum-blue-900);
    }

    .promotions-view-only .offer-id overlay-trigger {
        flex: 1;
        min-width: 0;
    }

    .promotions-view-only .offer-id div[slot='trigger'] {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        overflow-wrap: anywhere;
        white-space: normal;
    }

    .promotions-view-only .offer-id sp-action-button {
        flex-shrink: 0;
        --mod-actionbutton-content-color-default: var(--spectrum-blue-900);
    }

    .promotions-view-only .preview-cell {
        justify-content: flex-start;
        text-align: start;
    }

    .promotions-view-only .preview-cell sp-icon-preview {
        cursor: default;
    }

    .promotions-view-only .actions-cell {
        justify-content: flex-start;
        align-items: center;
    }

    .promotions-view-only .actions-cell sp-action-menu {
        flex: 0 0 auto;
    }

    .promotions-view-only .expand-cell {
        flex: 0 0 2.5rem;
        width: 2.5rem;
        min-width: 2.5rem;
        max-width: 2.5rem;
        justify-content: center;
    }

    .promotions-offers-layout .promo-code-head-cell,
    .promotions-offers-layout .promo-code-cell {
        justify-content: center;
        text-align: center;
    }

    .promotions-view-only .expand-cell sp-icon-chevron-down {
        transition: transform 0.2s;
    }

    .promotions-view-only .expand-cell sp-icon-chevron-down.expanded {
        transform: rotate(180deg);
    }

    .promotions-view-only .detail-row {
        width: 100%;
    }

    .promotions-offers-layout {
        --offer-expand-column-width: 2.5rem;
        --offer-actions-column-width: 4.5rem;
        --offer-promo-actions-gap: var(--spectrum-spacing-500);
        --offer-detail-end-inset: calc(
            var(--offer-actions-column-width) + var(--offer-promo-actions-gap) + var(--spectrum-spacing-200)
        );
    }

    .promotions-offers-layout sp-table-body > sp-table-row.offer-row {
        border-bottom: 1px solid var(--spectrum-gray-200);
    }

    .promotions-offers-layout sp-table-body > sp-table-row.offer-row > sp-table-cell {
        border-bottom: 0;
    }

    .promotions-offers-layout .detail-row sp-table-cell.detail-cell-full {
        flex: 1 1 100%;
        width: 100%;
        max-width: 100%;
        min-width: 0;
        box-sizing: border-box;
        background: var(--spectrum-gray-75);
        padding-block: var(--spectrum-spacing-200);
        padding-inline-start: calc(var(--offer-expand-column-width) + var(--spectrum-spacing-200));
        padding-inline-end: var(--offer-detail-end-inset);
        display: block;
    }

    .promotions-view-only .offer-detail-content {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--spectrum-spacing-200);
        width: 100%;
        min-width: 0;
    }

    .promotions-view-only .detail-offer-id {
        font-size: var(--spectrum-font-size-75);
        color: var(--spectrum-gray-800);
        line-height: 1.4;
    }

    .promotions-view-only .detail-offer-id strong {
        font-weight: 600;
        margin-inline-end: var(--spectrum-spacing-75);
    }

    .promotions-view-only .detail-offer-id span {
        overflow-wrap: anywhere;
    }

    .promotions-view-only .offer-promo-codes-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--spectrum-font-size-75);
        color: var(--spectrum-gray-800);
        table-layout: fixed;
    }

    .promotions-view-only .offer-promo-codes-table th,
    .promotions-view-only .offer-promo-codes-table td {
        border: 1px solid var(--spectrum-gray-200);
        padding: 10px 20px;
        text-align: left;
        vertical-align: top;
    }

    .promotions-view-only .offer-promo-codes-table th {
        background: var(--spectrum-gray-100);
        font-weight: 600;
    }

    .promotions-view-only .offer-promo-codes-table th:first-child,
    .promotions-view-only .offer-promo-codes-table td:first-child {
        width: 32%;
    }

    .promotions-view-only .offer-promo-codes-table th:last-child,
    .promotions-view-only .offer-promo-codes-table td:last-child {
        width: 68%;
    }

    .promotions-view-only .offer-promo-codes-table tbody td {
        background: var(--spectrum-white);
    }

    .promotions-view-only .offer-promo-codes-table td:first-child {
        font-family: var(--spectrum-code-font-family, monospace);
        white-space: nowrap;
    }

    .promotions-offers-layout sp-table-row.offer-row {
        cursor: pointer;
    }

    .promotions-view-only sp-action-menu {
        --mod-actionbutton-edge-to-text: 6px;
    }

    .promotions-view-only {
        width: 100%;
        min-width: 100%;
        box-sizing: border-box;
        flex: 0 1 auto;
        overflow: visible;
    }

    .promotions-view-only sp-table-head,
    .promotions-view-only sp-table-body {
        width: 100%;
        box-sizing: border-box;
    }

    .promotions-view-only sp-table-head {
        display: flex;
        min-width: 0;
    }

    .promotions-view-only sp-table-row {
        min-width: 0;
    }

    .promotions-view-only sp-table-head-cell {
        display: flex;
        align-items: center;
    }

    .promotions-offers-layout sp-table-head-cell,
    .promotions-offers-layout sp-table-cell,
    .promotions-fragments-layout sp-table-head-cell,
    .promotions-fragments-layout sp-table-cell,
    .promotions-collections-layout sp-table-head-cell,
    .promotions-collections-layout sp-table-cell {
        justify-content: flex-start;
        text-align: start;
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(1),
    .promotions-offers-layout sp-table-cell:nth-child(1) {
        flex: 0 0 var(--offer-expand-column-width);
        width: var(--offer-expand-column-width);
        min-width: var(--offer-expand-column-width);
        max-width: var(--offer-expand-column-width);
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(2),
    .promotions-offers-layout sp-table-cell:nth-child(2) {
        flex: 1.1 1 0;
        min-width: 0;
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(3),
    .promotions-offers-layout sp-table-cell:nth-child(3),
    .promotions-offers-layout sp-table-head-cell:nth-child(4),
    .promotions-offers-layout sp-table-cell:nth-child(4),
    .promotions-offers-layout sp-table-head-cell:nth-child(5),
    .promotions-offers-layout sp-table-cell:nth-child(5),
    .promotions-offers-layout sp-table-head-cell:nth-child(6),
    .promotions-offers-layout sp-table-cell:nth-child(6),
    .promotions-offers-layout sp-table-head-cell:nth-child(7),
    .promotions-offers-layout sp-table-cell:nth-child(7) {
        flex: 0.75 1 0;
        min-width: 5rem;
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(8),
    .promotions-offers-layout sp-table-cell:nth-child(8) {
        flex: 0 0 calc(5.5rem + var(--offer-promo-actions-gap));
        width: calc(5.5rem + var(--offer-promo-actions-gap));
        min-width: calc(5.5rem + var(--offer-promo-actions-gap));
        max-width: calc(5.5rem + var(--offer-promo-actions-gap));
        white-space: nowrap;
        padding-inline-end: var(--offer-promo-actions-gap);
        box-sizing: border-box;
    }

    .promotions-offers-layout sp-table-head-cell:nth-child(9),
    .promotions-offers-layout sp-table-cell:nth-child(9) {
        flex: 0 0 calc(var(--offer-actions-column-width) + var(--spectrum-spacing-300));
        width: calc(var(--offer-actions-column-width) + var(--spectrum-spacing-300));
        min-width: calc(var(--offer-actions-column-width) + var(--spectrum-spacing-300));
        max-width: calc(var(--offer-actions-column-width) + var(--spectrum-spacing-300));
        white-space: nowrap;
        padding-inline-end: var(--spectrum-spacing-300);
        box-sizing: border-box;
    }

    .promotions-fragments-layout sp-table-head-cell:nth-child(1),
    .promotions-fragments-layout sp-table-cell:nth-child(1) {
        flex: 1.05 1 0;
        min-width: 0;
    }

    .promotions-fragments-layout sp-table-head-cell:nth-child(2),
    .promotions-fragments-layout sp-table-cell:nth-child(2) {
        flex: 0.95 1 0;
        min-width: 0;
    }

    .promotions-fragments-layout sp-table-head-cell:nth-child(3),
    .promotions-fragments-layout sp-table-cell:nth-child(3) {
        flex: 1.15 1 0;
        min-width: 0;
    }

    .promotions-fragments-layout sp-table-head-cell:nth-child(4),
    .promotions-fragments-layout sp-table-cell:nth-child(4) {
        flex: 1.45 1 0;
        min-width: 0;
    }

    .promotions-fragments-layout sp-table-head-cell:nth-child(5),
    .promotions-fragments-layout sp-table-cell:nth-child(5) {
        flex: 0.65 1 0;
        min-width: 6rem;
    }

    .promotions-fragments-layout sp-table-head-cell:nth-child(6),
    .promotions-fragments-layout sp-table-cell:nth-child(6) {
        flex: 0.8 1 0;
        min-width: 7.25rem;
    }

    .promotions-fragments-layout sp-table-cell:nth-child(5),
    .promotions-fragments-layout sp-table-cell:nth-child(6) {
        white-space: nowrap;
    }

    .promotions-fragments-layout sp-table-head-cell:nth-child(7),
    .promotions-fragments-layout sp-table-cell:nth-child(7) {
        flex: 0 0 6.5rem;
        width: 6.5rem;
        min-width: 6.5rem;
        max-width: 6.5rem;
        white-space: nowrap;
    }

    .promotions-fragments-layout sp-table-head-cell:nth-child(8),
    .promotions-fragments-layout sp-table-cell:nth-child(8) {
        flex: 0 0 6rem;
        width: 6rem;
        min-width: 6rem;
        max-width: 6rem;
        white-space: nowrap;
    }

    .offers-empty-state {
        display: flex;
        flex-direction: row;
        gap: 12px;
        padding: 12px;
        border: 2px dashed var(--spectrum-gray-400);
        border-radius: 8px;
        width: 100%;
        box-sizing: border-box;
    }

    .offers-empty-state .label {
        align-content: center;
    }

    .offers-empty-state sp-button {
        background: white;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(1),
    .promotions-collections-layout sp-table-cell:nth-child(1) {
        flex: 1 1 0;
        min-width: 0;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(2),
    .promotions-collections-layout sp-table-cell:nth-child(2) {
        flex: 1.55 1 0;
        min-width: 0;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(3),
    .promotions-collections-layout sp-table-cell:nth-child(3) {
        flex: 0.85 1 0;
        min-width: 7.25rem;
    }

    .promotions-collections-layout sp-table-cell:nth-child(3) {
        white-space: nowrap;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(4),
    .promotions-collections-layout sp-table-cell:nth-child(4) {
        flex: 0 0 6.5rem;
        width: 6.5rem;
        min-width: 6.5rem;
        max-width: 6.5rem;
        white-space: nowrap;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(5),
    .promotions-collections-layout sp-table-cell:nth-child(5) {
        flex: 0 0 6rem;
        width: 6rem;
        min-width: 6rem;
        max-width: 6rem;
        white-space: nowrap;
    }

    sp-dialog-wrapper {
        z-index: 11;
    }
`;

const PROMO_VARIATION_MISSING_MESSAGE =
    'The promo variation for this fragment could not be found. It may have been removed. Use Create promo variation to add it again.';
const PROMO_VARIATION_LOOKUP_FAILED_MESSAGE = 'Could not verify the promo variation. Check your connection and try again.';

class MasPromotionsItemsTable extends LitElement {
    static styles = [tableStyles, localStyles];

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
        existingPromoVariationDefaultPaths: { type: Object, state: true },
        existingPromoVariationGeosByPath: { type: Object, state: true },
        promoVariationGeosDialogItem: { type: Object, state: true },
        promoVariationSelectedGeos: { type: Array, state: true },
        promoVariationDisabledGeos: { type: Array, state: true },
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
        this.existingPromoVariationDefaultPaths = new Set();
        this.existingPromoVariationGeosByPath = new Map();
        this.promoVariationGeosDialogItem = null;
        this.promoVariationSelectedGeos = [];
        this.promoVariationDisabledGeos = [];
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

    get tableColumns() {
        if (this.type === TABLE_TYPE.OFFERS) {
            return [
                { label: '', key: 'expand' },
                { label: 'Offer', key: 'offer', sortable: true },
                { label: 'Product arrangement', key: 'productArrangement' },
                { label: 'Offer type', key: 'offerType' },
                { label: 'Plan type', key: 'planType' },
                { label: 'Customer segment', key: 'customerSegment' },
                { label: 'Market segment', key: 'marketSegment' },
                { label: 'Promo code', key: 'promoCode' },
                { label: 'Actions', key: 'actions' },
            ];
        }
        if (this.type === TABLE_TYPE.CARDS) {
            return [
                { label: 'Offer', key: 'offer', sortable: true },
                { label: 'Fragment title', key: 'fragmentTitle' },
                { label: 'Offer ID', key: 'offerId' },
                { label: 'Path', key: 'path' },
                { label: 'Item type', key: 'itemType' },
                { label: 'Status', key: 'status' },
                { label: 'Actions', key: 'actions' },
                { label: 'Preview', key: 'preview' },
            ];
        }
        return [
            { label: 'Collection title', key: 'collectionTitle' },
            { label: 'Path', key: 'path' },
            { label: 'Status', key: 'status' },
            { label: 'Actions', key: 'actions' },
            { label: 'Preview', key: 'preview' },
        ];
    }

    updated(changed) {
        super.updated(changed);
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
            this.existingPromoVariationDefaultPaths = new Set();
            this.existingPromoVariationGeosByPath = new Map();
            return;
        }
        const previousPaths = this.existingPromoVariationDefaultPaths;
        const previousGeos = this.existingPromoVariationGeosByPath;
        const existingPaths = new Set();
        const geosByPath = new Map();
        await Promise.all(
            items.map(async (item) => {
                if (signal.aborted) return;
                try {
                    const variations = await probePromoVariationsForFragment(this.repository.aem, item.path, promoTag);
                    if (variations.length) {
                        existingPaths.add(item.path);
                        geosByPath.set(item.path, getUsedGeoTags(variations));
                    }
                } catch {
                    if (previousPaths.has(item.path)) {
                        existingPaths.add(item.path);
                        geosByPath.set(item.path, previousGeos.get(item.path) || []);
                    }
                }
            }),
        );
        if (signal.aborted) return;
        this.existingPromoVariationDefaultPaths = existingPaths;
        this.existingPromoVariationGeosByPath = geosByPath;
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

    async #copyOfferId(e, offerId) {
        e.stopPropagation();
        if (!offerId) return;
        try {
            await navigator.clipboard.writeText(offerId);
            this.#showToast('Offer ID copied to clipboard', 'positive');
        } catch (err) {
            console.error('Failed to copy offer ID:', err);
            this.#showToast('Failed to copy Offer ID', 'negative');
        }
    }

    #openCardPreview(fragmentId) {
        if (!fragmentId) return;
        openPreview(fragmentId, { left: 'min(300px, 15%)' });
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
        return this.#geoValues.some((geo) => !usedGeos.includes(geo));
    }

    #hasPromoVariationForItem(item) {
        if (!item?.path || !this.#promotionTagId) return false;
        if (isPromoVariationPath(item.path)) return false;
        return this.existingPromoVariationDefaultPaths.has(item.path);
    }

    async #viewPromoVariation(e, item) {
        e.stopPropagation();
        const promoTag = this.#promotionTagId;
        if (!this.repository?.aem) return;

        let variations;
        try {
            variations = await probePromoVariationsForFragment(this.repository.aem, item.path, promoTag);
        } catch {
            showToast(PROMO_VARIATION_LOOKUP_FAILED_MESSAGE, 'negative');
            return;
        }
        const variation = variations[0];
        if (!variation?.id) {
            showToast(PROMO_VARIATION_MISSING_MESSAGE, 'negative');
            this.existingPromoVariationDefaultPaths = new Set(
                [...this.existingPromoVariationDefaultPaths].filter((path) => path !== item.path),
            );
            return;
        }

        await this.#navigateToFragmentEditorFromProject(variation.id, variation.path);
    }

    #closeConfirmDialog() {
        this.confirmDialogConfig = null;
    }

    #closePromoVariationGeosDialog() {
        this.promoVariationGeosDialogItem = null;
        this.promoVariationSelectedGeos = [];
        this.promoVariationDisabledGeos = [];
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
        this.createPromoVariationLoading = true;

        try {
            const existingVariations = await probePromoVariationsForFragment(this.repository.aem, item.path, promoTag);
            this.promoVariationDisabledGeos = getUsedGeoTags(existingVariations);
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
        this.#closePromoVariationGeosDialog();
        if (!promoTag || !item?.id || !this.repository) return;
        if (!geoTags.length) {
            showToast('Select at least one geo to create the promo variation.', 'negative');
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
            this.existingPromoVariationDefaultPaths = new Set([...this.existingPromoVariationDefaultPaths, item.path]);
            const previousGeos = this.existingPromoVariationGeosByPath.get(item.path) || [];
            this.existingPromoVariationGeosByPath = new Map(this.existingPromoVariationGeosByPath).set(item.path, [
                ...previousGeos,
                ...geoTags,
            ]);
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

    #renderOfferIdCell(item) {
        const { offerId } = item?.offerData || {};
        return html`<sp-table-cell class="offer-id">
            ${offerId
                ? html`<overlay-trigger triggered-by="hover">
                          <div slot="trigger">${offerId}</div>
                          <sp-tooltip slot="hover-content" placement="bottom">${offerId}</sp-tooltip>
                      </overlay-trigger>
                      <sp-action-button
                          icon-only
                          quiet
                          aria-label="Copy Offer ID to clipboard"
                          @click=${(e) => this.#copyOfferId(e, offerId)}
                      >
                          <sp-icon-copy slot="icon"></sp-icon-copy>
                      </sp-action-button>`
                : html`<span>no offer data</span>`}
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
                    .value=${this.promoVariationSelectedGeos}
                    @change=${(e) => this.#handlePromoVariationGeosChange(e)}
                ></mas-promo-variation-geos>
            </sp-dialog-wrapper>
        `;
    }

    #renderActionsCell(item) {
        const showCreatePromo = this.type === TABLE_TYPE.CARDS && this.#canCreatePromoVariation(item);
        const showViewPromo = this.type === TABLE_TYPE.CARDS && this.#hasPromoVariationForItem(item);
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
                ${showViewPromo
                    ? html`<sp-menu-item @click=${(e) => this.#viewPromoVariation(e, item)}>
                          <sp-icon-open-in slot="icon"></sp-icon-open-in>
                          View promo variation
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
            @mouseover=${() => this.#openCardPreview(item.id)}
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

    #renderFragmentRow(item) {
        return html`<sp-table-row value=${item.path}>
            ${this.#renderOfferCell(item)}
            <sp-table-cell>${item.title || 'no title'}</sp-table-cell>
            ${this.#renderOfferIdCell(item)}
            <sp-table-cell class="path"><span>${item?.studioPath || 'no path'}</span></sp-table-cell>
            <sp-table-cell>${getItemTypeLabel(item)}</sp-table-cell>
            ${this.renderFragmentStatusCell(item?.status)} ${this.#renderActionsCell(item)} ${this.#renderPreviewCell(item)}
        </sp-table-row>`;
    }

    #renderCollectionRow(item) {
        return html`<sp-table-row value=${item.path}>
            <sp-table-cell>${item.title || '-'}</sp-table-cell>
            <sp-table-cell class="path"><span>${item.studioPath || '-'}</span></sp-table-cell>
            ${this.renderFragmentStatusCell(item?.status)} ${this.#renderActionsCell(item)} ${this.#renderPreviewCell(item)}
        </sp-table-row>`;
    }

    #renderSkeletonRows() {
        return Array.from(
            { length: 6 },
            (_, i) =>
                html`<sp-table-row class="skeleton-row" key=${i}>
                    ${this.tableColumns.map(
                        () =>
                            html`<sp-table-cell>
                                <div class="skeleton-element skeleton-table-cell"></div>
                            </sp-table-cell>`,
                    )}
                </sp-table-row>`,
        );
    }

    get #layoutClass() {
        if (this.type === TABLE_TYPE.OFFERS) return 'promotions-offers-layout';
        if (this.type === TABLE_TYPE.CARDS) return 'promotions-fragments-layout';
        return 'promotions-collections-layout';
    }

    get #emptySelectionMessage() {
        if (this.type === TABLE_TYPE.CARDS) {
            return 'No fragments selected. Use Add fragments to pick cards matching your offers.';
        }
        if (this.type === TABLE_TYPE.COLLECTIONS) {
            return 'No collections selected.';
        }
        return 'No items found.';
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

    render() {
        if (this.type === TABLE_TYPE.OFFERS && !this.viewOnlyLoading && this.selectedPaths.length === 0) {
            return html`${this.confirmDialogTemplate}${this.#offersEmptyStateTemplate}`;
        }

        const showSkeleton = this.viewOnlyLoading;
        const items = this.viewOnlyFragments;
        const showEmpty = !showSkeleton && items.length === 0;
        const showTable = showSkeleton || items.length > 0;

        return html`
            ${this.confirmDialogTemplate} ${this.promoVariationGeosDialogTemplate}
            ${showEmpty ? html`<p>${this.#emptySelectionMessage}</p>` : nothing}
            ${showTable
                ? html`<sp-table class="fragments-table item-table promotions-view-only ${this.#layoutClass}" emphasized>
                      <sp-table-head>
                          ${repeat(
                              this.tableColumns,
                              (column) => column.key,
                              (column) =>
                                  html`<sp-table-head-cell class=${column.key === 'promoCode' ? 'promo-code-head-cell' : ''}
                                      >${column.label}</sp-table-head-cell
                                  >`,
                          )}
                      </sp-table-head>
                      <sp-table-body>
                          ${showSkeleton
                              ? this.#renderSkeletonRows()
                              : this.type === TABLE_TYPE.OFFERS
                                ? this.#renderOfferRows(items)
                                : this.type === TABLE_TYPE.CARDS
                                  ? repeat(
                                        items,
                                        (f) => f.path,
                                        (f) => this.#renderFragmentRow(f),
                                    )
                                  : repeat(
                                        items,
                                        (f) => f.path,
                                        (f) => this.#renderCollectionRow(f),
                                    )}
                      </sp-table-body>
                  </sp-table>`
                : nothing}
        `;
    }
}

export default MasPromotionsItemsTable;
export { MasPromotionsItemsTable };
customElements.define('mas-promotions-items-table', MasPromotionsItemsTable);
