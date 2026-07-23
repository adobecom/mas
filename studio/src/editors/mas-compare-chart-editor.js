import { LitElement, html, nothing, render as litRender } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
    COMPARE_CHART_FIELD,
    CARD_MODEL_PATH,
    MAS_PRODUCT_CODE_PREFIX,
    PATH_TOKENS,
    TABLE_TYPE,
    TAG_COMPARE_CHART,
    TAG_MERCH_CARD,
    TAG_PROMOTION_PREFIX,
    TAG_STUDIO_CONTENT_TYPE,
    EVENT_CHANGE,
    VARIATION_TAB_NAME,
} from '../constants.js';
import Store from '../store.js';
import { generateCodeToUse, getService } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import { normalizeTagId } from '../aem/tag-id-utils.js';
import { getFromFragmentCache } from '../mas-repository.js';
import generateFragmentStore, { createPreviewDataWithParent } from '../reactivity/source-fragment-store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import router from '../router.js';
import { getItemsSelectionStore, setItemsSelectionStore } from '../common/items-selection-store.js';
import '../common/components/mas-items-selector.js';
import {
    effectiveIsVariation as utilEffectiveIsVariation,
    isGroupedVariationFragment,
    handlePznTagsChange,
    renderGroupedVariationTagsTemplate,
    getGroupedVariationTagsValue,
    getPromotionCode,
    getVariationTabItems,
    hasAnyVariationTabItems,
    VARIATION_TABS,
} from '../editors/variation-utils.js';
import { getLocaleByCode } from '../../../io/www/src/fragment/locales.js';
import { normalizeCompareChartKey, parseCompareChartTables } from '../../../web-components/src/compare-chart-table-parser.js';
import { EVENT_COMPARE_CHART_REHYDRATE } from '../../../web-components/src/constants.js';
import { dragHandleIcon } from '../icons.js';
import { VARIANT_NAMES } from '../editors/variant-picker.js';
import { styles } from './mas-compare-chart-editor.css.js';

export const DEFAULT_COMPARE_CHART_HTML =
    '<mas-compare-chart><div name="top-features"><h4>Top features</h4></div></mas-compare-chart>';

const PREVIEW_SLOT = 'compare-chart-preview';
const MAX_COMPARE_CHART_CARDS = 4;
// Locale-aware aria/SR strings the rendered chart reads as `<key>-text`
// attributes. Stored as `{{key}}` dictionary tokens so the live page resolves
// them per locale.
const COMPARE_CHART_PLACEHOLDER_KEYS = [
    'included',
    'not-included',
    'not-applicable',
    'sr-only-not-applicable',
    'choose-table-column',
];
const COMPARE_CHART_RTE_MARKS = ['small'];
const VARIANT_TAG_PREFIX = 'mas:variant/';

class MasCompareChartEditor extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        isVariation: { type: Boolean },
        localeDefaultFragment: { type: Object, attribute: false },
        updateFragment: { type: Function },
        editorView: { state: true },
        expandedCards: { state: true },
        pickedFragments: { state: true },
        activeRteCell: { state: true },
        activeRteEditor: { state: true },
        columnFeatureDrafts: { state: true },
        cardPathToRemove: { state: true },
        offerDataByOsi: { state: true },
        loadingVariationPaths: { state: true },
        selectedVariationPaths: { state: true },
    };

    static styles = styles;

    constructor() {
        super();
        this.fragmentStore = null;
        this.isVariation = false;
        this.localeDefaultFragment = null;
        this.updateFragment = null;
        this.editorView = 'edit';
        this.expandedCards = new Set();
        this.pickedFragments = new Map();
        this.activeRteCell = null;
        this.activeRteEditor = null;
        this.columnFeatureDrafts = new Map();
        this.cardPathToRemove = '';
        this.offerDataByOsi = new Map();
        this.loadingVariationPaths = new Set();
        this.selectedVariationPaths = new Map();
        this.draggingCardIndex = -1;
        this.draggingVariation = null;
        this.draggingGroup = null;
        this.draggingFeature = null;
        this.itemsSelectionStore = null;
        this.previousItemsSelectionStore = null;
        this.reactiveController = new ReactiveController(this, [], this.#syncDirtyCardStoreState);
    }

    #fragmentReferencesMap = new Map();
    #parentPathByVariationPath = new Map();
    #previewRoot = null;
    #pendingOfferDataByOsi = new Map();
    #initFragmentReferencesMapToken = 0;
    #parseCache = { source: null, table: null, doc: null };
    #previewCacheIds = new Set();
    #lastPreviewSignature = '';

    #reactiveStores(stores) {
        return stores.filter((store) => store?.subscribe && store?.unsubscribe);
    }

    connectedCallback() {
        super.connectedCallback();
        this.previousItemsSelectionStore = getItemsSelectionStore({ allowUnset: true });
        this.itemsSelectionStore = Store.compareChart;
        setItemsSelectionStore(Store.compareChart);
        if (this.fragmentStore) {
            this.#ensureCompareChartTag();
            this.#ensureCompareChartPlaceholders();
            this.#initFragmentReferencesMap();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#clearLightDomPreview();
        setItemsSelectionStore(this.previousItemsSelectionStore);
        this.previousItemsSelectionStore = null;
        this.itemsSelectionStore = null;
        Store.editor.referencedFragmentStoresHaveChanges.set(false);
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore')) {
            this.#ensureCompareChartTag();
            this.#ensureCompareChartPlaceholders();
        }
        if (changedProperties.has('fragmentStore') || changedProperties.has('localeDefaultFragment')) {
            this.#initFragmentReferencesMapToken += 1;
            this.#initFragmentReferencesMap(this.#initFragmentReferencesMapToken);
        }
        super.update(changedProperties);
    }

    updated() {
        this.#syncLightDomPreview();
    }

    async #initFragmentReferencesMap(token = ++this.#initFragmentReferencesMapToken) {
        if (!this.fragmentStore) {
            this.reactiveController.updateStores([]);
            Store.editor.referencedFragmentStoresHaveChanges.set(false);
            return;
        }
        this.#fragmentReferencesMap.clear();
        this.#parentPathByVariationPath.clear();
        const ownReferences = this.fragment?.references || [];
        const parentReferences = this.localeDefaultFragment?.references || [];
        const allReferences = this.#collectReferences([...ownReferences, ...parentReferences]);

        const stores = [this.fragmentStore];
        for (const ref of allReferences) {
            const fragmentStore = await this.#ensureReferenceStore(ref);
            // Cancellation: rapid locale/variation switches supersede this run.
            if (token !== this.#initFragmentReferencesMapToken) return;
            if (!fragmentStore) continue;
            this.#fragmentReferencesMap.set(ref.path, fragmentStore);
            stores.push(fragmentStore, fragmentStore.previewStore);
        }
        this.reactiveController.updateStores(this.#reactiveStores(stores));
        this.#syncDirtyCardStoreState();
        this.requestUpdate();
    }

    #collectReferences(references) {
        const allReferences = [];
        const seen = new Set();
        const addReference = (ref, parentPath = '') => {
            const key = ref?.id || ref?.path;
            if (!key) return;
            if (parentPath && ref.path) this.#parentPathByVariationPath.set(ref.path, parentPath);
            if (seen.has(key)) {
                for (const childRef of ref.references || []) {
                    addReference(childRef, ref.path);
                }
                return;
            }
            seen.add(key);
            allReferences.push(ref);
            for (const childRef of ref.references || []) {
                addReference(childRef, ref.path);
            }
        };
        references.forEach((ref) => addReference(ref));
        return allReferences;
    }

    async #ensureReferenceStore(ref) {
        if (!ref?.path && !ref?.id) return null;
        const parentPath = this.#parentPathByVariationPath.get(ref.path);
        const parentFragment = parentPath ? this.#getSourceCardFragment(parentPath) : null;
        let fragmentStore = Store.fragments.list.data.get()?.find((store) => store.value.id === ref.id);
        if (fragmentStore && parentFragment && !fragmentStore.parentFragment) {
            fragmentStore = generateFragmentStore(fragmentStore.get(), parentFragment);
        }
        if (!fragmentStore) {
            const fragment = ref.fields ? ref : await getFromFragmentCache(ref.id);
            if (!fragment) return null;
            fragmentStore = generateFragmentStore(fragment, parentFragment);
        }
        return fragmentStore;
    }

    get effectiveIsVariation() {
        return utilEffectiveIsVariation(this.fragment, this.localeDefaultFragment, this.isVariation);
    }

    get isGroupedVariation() {
        return isGroupedVariationFragment(this.fragment);
    }

    #handlePznTagsChange = (event) => {
        handlePznTagsChange(this.fragmentStore, event);
    };

    get groupedVariationTagsTemplate() {
        if (!this.isGroupedVariation) return nothing;
        const locale = this.fragment?.locale;
        return renderGroupedVariationTagsTemplate({
            fragment: this.fragment,
            readonly: locale !== 'en_US',
            onChange: this.#handlePznTagsChange,
        });
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get effectiveValue() {
        return this.fragment?.getEffectiveFieldValue(COMPARE_CHART_FIELD, this.localeDefaultFragment, this.isVariation) || '';
    }

    #ensureCompareChartTag() {
        if (!this.fragmentStore || !this.fragment) return;
        const tagIds = [
            ...(this.fragment.newTags || []),
            ...(this.fragment.getFieldValues?.('tags') || []),
            ...(this.fragment.tags || []),
        ]
            .map((tag) => normalizeTagId(tag))
            .filter(Boolean);
        if (tagIds.includes(TAG_COMPARE_CHART)) return;
        this.fragmentStore.updateField('tags', [...new Set([...tagIds, TAG_COMPARE_CHART])]);
    }

    // Backfill the `{{key}}` placeholder-text attributes on load. `#emitValue`
    // only fires on structural edits, so existing charts (and ones edited only
    // at the cell level) would otherwise never get them.
    #ensureCompareChartPlaceholders() {
        if (!this.fragmentStore || !this.fragment) return;
        const { table } = this.#getDocument();
        if (!table) return;
        const hasAll = COMPARE_CHART_PLACEHOLDER_KEYS.every((key) => table.getAttribute(`${key}-text`) === `{{${key}}}`);
        if (hasAll) return;
        this.#emitValue(table);
    }

    get effectiveColumns() {
        return this.#cardPaths.map((path) => this.#buildColumn(path)).filter(Boolean);
    }

    #columnFeatures(path, features, parentFeatures = []) {
        if (!path || !this.columnFeatureDrafts.has(path)) return features;
        const draftFeatures = this.columnFeatureDrafts.get(path);
        return parentFeatures.length ? this.#effectiveFeatureValues(draftFeatures, parentFeatures) : draftFeatures;
    }

    #buildColumn(parentPath) {
        const parentFragment = this.#getSourceCardFragment(parentPath) || this.#getCardFragment(parentPath);
        if (!parentFragment) return null;
        const variationStore =
            this.#selectedVariationStore(parentPath) ||
            (this.effectiveIsVariation ? this.#matchingVariationStore(parentFragment) : null);
        const sourceFragment = variationStore?.get?.() || parentFragment;
        const displayFragment =
            variationStore && parentFragment
                ? this.#effectiveFragmentForDisplay(sourceFragment, parentFragment)
                : this.#getCardFragment(sourceFragment.path) || sourceFragment;
        const parentFeatures = this.#featureValues(parentFragment);
        const sourceFeatures = this.#featureValues(sourceFragment);
        const effectiveFeatures =
            variationStore && parentFragment ? this.#effectiveFeatureValues(sourceFeatures, parentFeatures) : sourceFeatures;
        const path = sourceFragment.path || parentPath;
        return {
            path,
            parentPath,
            title: this.#fragmentTitle(displayFragment) || 'Untitled card',
            features: this.#columnFeatures(path, effectiveFeatures, variationStore ? parentFeatures : []),
            fragment: displayFragment,
            sourceFragment,
            parentFragment,
            isVariationColumn: Boolean(variationStore && parentFragment),
        };
    }

    #featureValues(fragment) {
        return (
            fragment?.getFieldValues?.('features') || fragment?.fields?.find((field) => field.name === 'features')?.values || []
        );
    }

    #getSourceCardFragment(path) {
        const fragmentStore = this.#getColumnStore(path);
        const storedFragment = fragmentStore?.get?.();
        if (storedFragment) return storedFragment;

        const reference =
            this.fragment?.references?.find((ref) => ref.path === path) ||
            this.localeDefaultFragment?.references?.find((ref) => ref.path === path);
        return reference ? this.#normalizeFragment(reference) : null;
    }

    #effectiveFragmentForDisplay(fragment, parentFragment) {
        if (!fragment || !parentFragment) return fragment;
        const data = createPreviewDataWithParent(fragment, parentFragment);
        data.status ||= parentFragment.status;
        data.modified ||= parentFragment.modified;
        data.modifiedBy ||= parentFragment.modifiedBy;
        return new Fragment(data);
    }

    #getCardFragment(path) {
        const fragmentStore = this.#getColumnStore(path);
        const storedFragment = fragmentStore?.previewStore?.get?.() || fragmentStore?.get?.();
        if (storedFragment) return storedFragment;

        const reference = this.fragment?.references?.find((ref) => ref.path === path);
        return reference ? this.#normalizeFragment(reference) : null;
    }

    #getColumnStore(path) {
        return (
            this.#fragmentReferencesMap.get(path) ||
            Store.fragments.list.data.get()?.find((store) => store.get()?.path === path)
        );
    }

    #matchingVariationStore(parentFragment) {
        const variationPaths = parentFragment?.getFieldValues?.('variations') || [];
        if (!variationPaths.length) return null;
        for (const variationPath of variationPaths) {
            const store = this.#getColumnStore(variationPath);
            const variation = store?.get?.() || this.#variationReference(parentFragment, variationPath);
            if (variation && this.#matchesCurrentVariation(variation)) {
                return store || null;
            }
        }
        return null;
    }

    #selectedVariationStore(parentPath) {
        const variationPath = this.selectedVariationPaths.get(parentPath);
        return variationPath ? this.#getColumnStore(variationPath) : null;
    }

    #selectedVariationPath(parentPath) {
        return this.selectedVariationPaths.get(parentPath) || '';
    }

    #variationReference(parentFragment, variationPath) {
        const ref = parentFragment?.references?.find((item) => item.path === variationPath);
        return ref ? this.#normalizeFragment(ref) : null;
    }

    #matchesCurrentVariation(variation) {
        if (!variation || !this.fragment) return false;
        if (this.isGroupedVariation) {
            return (
                isGroupedVariationFragment(variation) &&
                this.#normalizedPznTags(variation) === this.#normalizedPznTags(this.fragment)
            );
        }

        const currentPromotionTags = this.#promotionTagIds(this.fragment);
        if (currentPromotionTags.length) {
            const variationPromotionTags = this.#promotionTagIds(variation);
            return variationPromotionTags.some((tag) => currentPromotionTags.includes(tag));
        }

        const currentLocale = this.#pathLocale(this.fragment.path);
        const variationLocale = this.#pathLocale(variation.path);
        return Boolean(
            currentLocale &&
                variationLocale &&
                currentLocale === variationLocale &&
                !isGroupedVariationFragment(variation) &&
                !this.#promotionTagIds(variation).length,
        );
    }

    #pathLocale(path) {
        return path?.match(PATH_TOKENS)?.groups?.parsedLocale || '';
    }

    #promotionTagIds(fragment) {
        return (fragment?.tags || [])
            .map((tag) => tag?.id || tag)
            .filter((tag) => typeof tag === 'string' && tag.startsWith(TAG_PROMOTION_PREFIX))
            .sort();
    }

    #normalizedPznTags(fragment) {
        return (fragment?.getFieldValues?.('pznTags') || []).filter(Boolean).slice().sort().join(',');
    }

    #normalizeFragment(fragment) {
        if (!fragment) return null;
        return fragment instanceof Fragment ? fragment : new Fragment(fragment);
    }

    #fragmentTitle(fragment) {
        return fragment?.getFieldValue?.('cardTitle') || fragment?.title || fragment?.path || '';
    }

    #variationOfferName(fragment) {
        const name = this.#offerName(fragment);
        const locale = getLocaleByCode(this.#pathLocale(fragment?.path));
        return locale?.country ? `${name} (${locale.country.toUpperCase()})` : name;
    }

    #offerName(fragment) {
        const hasTags = Array.isArray(fragment?.tags);
        return (
            fragment?.getCurrentTagTitle?.(MAS_PRODUCT_CODE_PREFIX) ||
            (hasTags ? fragment?.getTagTitle?.('mas:product/') : '') ||
            fragment?.fragmentName ||
            fragment?.path?.split('/').pop() ||
            this.#fragmentTitle(fragment)
        );
    }

    #offerSelectorId(fragment) {
        return fragment?.getFieldValue?.('osi') || fragment?.getFieldValue?.('stockOfferOsis') || '';
    }

    #offerData(osi) {
        if (!osi) return null;
        if (this.offerDataByOsi.has(osi)) return this.offerDataByOsi.get(osi);
        this.#resolveOfferData(osi);
        return undefined;
    }

    #offerId(fragment) {
        const osi = this.#offerSelectorId(fragment);
        return this.#offerData(osi)?.offerId || '';
    }

    #offerType(fragment) {
        const tagOfferType = fragment?.getCurrentTagTitle?.('mas:offer_type/') || fragment?.getTagTitle?.('mas:offer_type/');
        if (tagOfferType) return tagOfferType;
        const osi = this.#offerSelectorId(fragment);
        const offerData = this.#offerData(osi);
        return offerData?.offerType || '–';
    }

    async #resolveOfferData(osi) {
        if (!osi || this.offerDataByOsi.has(osi) || this.#pendingOfferDataByOsi.has(osi)) return;
        const cache = Store.translationProjects.offerDataCache;
        if (cache.has(osi)) {
            this.offerDataByOsi = new Map(this.offerDataByOsi).set(osi, cache.get(osi));
            return;
        }
        const service = getService();
        if (!service?.collectPriceOptions || !service?.resolveOfferSelectors) {
            this.offerDataByOsi = new Map(this.offerDataByOsi).set(osi, null);
            return;
        }
        const promise = (async () => {
            try {
                const priceOptions = service.collectPriceOptions({ wcsOsi: osi });
                const [offersPromise] = service.resolveOfferSelectors(priceOptions);
                const [offer] = offersPromise ? await offersPromise : [];
                if (offer) cache.set(osi, offer);
                this.offerDataByOsi = new Map(this.offerDataByOsi).set(osi, offer || null);
            } catch {
                this.offerDataByOsi = new Map(this.offerDataByOsi).set(osi, null);
            } finally {
                this.#pendingOfferDataByOsi.delete(osi);
            }
        })();
        this.#pendingOfferDataByOsi.set(osi, promise);
    }

    #authorPath(fragment) {
        if (!Array.isArray(fragment?.tags)) return fragment?.path || '';
        return generateCodeToUse(fragment, Store.search.get().path, Store.page.get())?.authorPath || fragment.path;
    }

    #renderCardOffer(fragment) {
        const icon = fragment?.getFieldValue?.('mnemonicIcon');
        return html`
            <div class="compchart-card-offer">
                ${icon
                    ? html`<img class="compchart-card-icon" src=${icon} alt="" />`
                    : html`<span class="compchart-card-icon"></span>`}
                <span class="compchart-card-offer-name compchart-truncate">${this.#offerName(fragment)}</span>
            </div>
        `;
    }

    #renderCardOfferId(fragment) {
        const osi = this.#offerSelectorId(fragment);
        const offerData = this.#offerData(osi);
        const offerId = offerData?.offerId;
        if (offerData === undefined) return html`<span>Resolving...</span>`;
        if (!offerId && osi) return html`<span class="compchart-truncate" title=${osi}>${osi}</span>`;
        if (!offerId) return html`<span>–</span>`;
        return html`
            <span class="compchart-truncate" title=${offerId}>${offerId}</span>
            <sp-action-button quiet size="s" label="Copy Offer ID" @click=${(event) => this.#copyOfferId(event, fragment)}>
                <sp-icon-copy slot="icon"></sp-icon-copy>
            </sp-action-button>
        `;
    }

    #renderCardPrice(fragment) {
        const value = fragment?.getFieldValue?.('prices') || fragment?.getFieldValue?.('price') || '';
        return value
            ? html`<span class="compchart-card-price-value compchart-truncate" title=${value}>${unsafeHTML(value)}</span>`
            : html`<span>–</span>`;
    }

    async #copyOfferId(event, fragment) {
        event.stopPropagation();
        const offerId = this.#offerId(fragment);
        if (!offerId) return;
        await navigator.clipboard?.writeText?.(offerId);
    }

    #renderCardStatus(fragment) {
        const status = fragment?.status || '';
        const variant = this.#statusLightVariant(status);
        return html`
            <span class="compchart-card-status ${status.toLowerCase()}">
                <sp-status-light size="s" variant=${variant}></sp-status-light>
                <span>${status ? status[0] + status.slice(1).toLowerCase() : 'Unknown'}</span>
            </span>
        `;
    }

    #statusLightVariant(status) {
        switch ((status || '').toLowerCase()) {
            case 'new':
            case 'draft':
                return 'info';
            case 'published':
                return 'positive';
            case 'modified':
                return 'yellow';
            case 'unpublished':
                return 'neutral';
            default:
                return 'neutral';
        }
    }

    async #toggleCardExpanded(event, path) {
        event.stopPropagation();
        const expandedCards = new Set(this.expandedCards);
        const nextExpanded = !expandedCards.has(path);
        if (nextExpanded) expandedCards.add(path);
        else expandedCards.delete(path);
        this.expandedCards = expandedCards;
        if (nextExpanded) await this.#loadVariationReferences(path);
    }

    /** True when every variation the card declares already has a hydrated reference (matched by path). */
    #variationsHydrated(fragment) {
        const variationPaths = fragment?.getVariations?.() || [];
        if (!variationPaths.length) return true;
        const refPaths = new Set((fragment.references || []).map((ref) => ref.path));
        return variationPaths.every((variationPath) => refPaths.has(variationPath));
    }

    async #loadVariationReferences(path) {
        if (this.loadingVariationPaths.has(path)) return;
        let store = this.#getColumnStore(path);
        const fragment = store?.get?.();
        // Already hydrated — nothing to fetch. A non-empty `references` is NOT enough on its own:
        // the card must have a reference for every path in its `variations` field.
        if (store && this.#variationsHydrated(fragment)) return;
        // The card id lives in the column store, or in the compare-chart's reference to it.
        const reference =
            this.fragment?.references?.find((ref) => ref.path === path) ||
            this.localeDefaultFragment?.references?.find((ref) => ref.path === path);
        if (!fragment?.id && !reference?.id) return;
        const repository = document.querySelector('mas-repository');
        if (!repository?.refreshFragment) return;
        this.loadingVariationPaths = new Set(this.loadingVariationPaths).add(path);
        try {
            // No column store yet (card arrived as an un-hydrated stub): seed one from the reference
            // so refreshFragment can fetch it by id with ?references=direct-hydrated.
            if (!store) {
                const seed = this.#normalizeFragment(reference);
                if (!seed) return;
                store = generateFragmentStore(seed);
                this.#fragmentReferencesMap.set(path, store);
            }
            await repository.refreshFragment(store);
            const refreshedFragment = store.get?.();
            const stores = [this.fragmentStore];
            for (const variationRef of refreshedFragment?.references || []) {
                if (variationRef?.path) this.#parentPathByVariationPath.set(variationRef.path, path);
                const variationStore = await this.#ensureReferenceStore(variationRef);
                if (!variationStore) continue;
                this.#fragmentReferencesMap.set(variationRef.path, variationStore);
            }
            for (const fragmentStore of this.#fragmentReferencesMap.values()) {
                stores.push(fragmentStore, fragmentStore.previewStore);
            }
            this.reactiveController.updateStores(this.#reactiveStores(stores));
        } catch (error) {
            console.error('Failed to load card variation references:', error);
        } finally {
            const loadingVariationPaths = new Set(this.loadingVariationPaths);
            loadingVariationPaths.delete(path);
            this.loadingVariationPaths = loadingVariationPaths;
        }
    }

    #renderVariationRow(fragment) {
        const parentPath = fragment?.parentPath || '';
        const variationPath = fragment?.path || '';
        const parentFragment = this.#getSourceCardFragment(parentPath);
        const displayFragment = parentFragment ? this.#effectiveFragmentForDisplay(fragment, parentFragment) : fragment;
        const selected = this.#selectedVariationPath(parentPath) === variationPath;
        return html`
            <div
                class="compchart-card-variation-row ${selected ? 'selected' : ''}"
                draggable="true"
                aria-selected=${selected}
                @click=${(event) => this.#selectVariation(event, parentPath, variationPath)}
                @dblclick=${(event) => this.#openCardFragment(event, fragment)}
                @dragstart=${(event) => this.#handleVariationDragStart(event, parentPath, variationPath)}
                @dragend=${this.#handleVariationDragEnd}
                @dragover=${(event) => this.#handleVariationDragOver(event, parentPath, variationPath)}
                @dragleave=${this.#handleVariationDragLeave}
                @drop=${(event) => this.#handleVariationDrop(event, parentPath, variationPath)}
            >
                <div class="compchart-card-cell compchart-card-cell-controls"></div>
                <div class="compchart-card-cell compchart-card-title">${this.#variationOfferName(displayFragment)}</div>
                <div class="compchart-card-cell compchart-card-title compchart-truncate">
                    ${this.#fragmentTitle(displayFragment)}
                </div>
                <div class="compchart-card-cell compchart-card-offer-id">${this.#renderCardOfferId(displayFragment)}</div>
                <div class="compchart-card-cell compchart-card-type compchart-truncate">
                    ${this.#offerType(displayFragment)}
                </div>
                <div class="compchart-card-cell compchart-card-price compchart-truncate">
                    ${this.#renderCardPrice(displayFragment)}
                </div>
                <div class="compchart-card-cell">${this.#renderCardStatus(displayFragment)}</div>
            </div>
        `;
    }

    #selectVariation(event, parentPath, variationPath) {
        if (this.#isVariationControlEvent(event)) return;
        if (!parentPath || !variationPath) return;
        const selectedVariationPaths = new Map(this.selectedVariationPaths);
        if (selectedVariationPaths.get(parentPath) === variationPath) {
            selectedVariationPaths.delete(parentPath);
        } else {
            selectedVariationPaths.set(parentPath, variationPath);
        }
        this.selectedVariationPaths = selectedVariationPaths;
        this.activeRteCell = null;
        this.activeRteEditor = null;
        this.requestUpdate();
    }

    #selectParentCard(event, parentPath) {
        if (this.#isControlEvent(event) || !this.selectedVariationPaths.has(parentPath)) return;
        const selectedVariationPaths = new Map(this.selectedVariationPaths);
        selectedVariationPaths.delete(parentPath);
        this.selectedVariationPaths = selectedVariationPaths;
        this.activeRteCell = null;
        this.activeRteEditor = null;
        this.requestUpdate();
    }

    #renderVariationPanel(fragment, path) {
        if (this.loadingVariationPaths.has(path)) {
            return html`<div class="compchart-card-variation-empty">Loading variations...</div>`;
        }
        if (!hasAnyVariationTabItems(fragment)) {
            return html`<div class="compchart-card-variation-empty">No variations found.</div>`;
        }
        return html`
            <div class="compchart-card-variation-panel">
                <sp-tabs selected="locale" quiet>
                    ${VARIATION_TABS.map((tab) => {
                        const count = getVariationTabItems(fragment, tab.id).length;
                        return html`<sp-tab value=${tab.id} label="${tab.label} (${count})">${tab.label} (${count})</sp-tab>`;
                    })}
                    ${VARIATION_TABS.map((tab) => {
                        const items = getVariationTabItems(fragment, tab.id);
                        return html`
                            <sp-tab-panel value=${tab.id}>
                                ${items.length
                                    ? html`<div class="compchart-card-variation-list">
                                          ${items.map((item) => {
                                              const variation = this.#normalizeFragment(item);
                                              variation.parentPath = path;
                                              if (tab.id === 'grouped')
                                                  variation.displayTags = getGroupedVariationTagsValue(item);
                                              if (tab.id === 'promotion') variation.displayPromoCode = getPromotionCode(item);
                                              return this.#renderVariationRow(variation);
                                          })}
                                      </div>`
                                    : html`<div class="compchart-card-variation-empty">
                                          No ${tab.label.toLowerCase()} variations found.
                                      </div>`}
                            </sp-tab-panel>
                        `;
                    })}
                </sp-tabs>
            </div>
        `;
    }

    #getDocument() {
        // Memoize: render() + #expandedGroupsAttribute() both call into #parse,
        // double-parsing the same HTML per update. Cache invalidates whenever
        // effectiveValue changes (which is what every write path triggers).
        // CONTRACT: callers must treat the returned doc/table as read-only —
        // clone before mutating, or the next consumer in the same tick sees
        // stale/edited DOM.
        const source = this.effectiveValue;
        if (this.#parseCache.source === source) {
            return { doc: this.#parseCache.doc, table: this.#parseCache.table };
        }
        const parser = new DOMParser();
        const doc = parser.parseFromString(source, 'text/html');
        const table = doc.body.querySelector('mas-compare-chart');
        this.#parseCache = { source, doc, table };
        return { doc, table };
    }

    #parseTableGroups(table) {
        if (!table) return [];
        return parseCompareChartTables(table);
    }

    #parseDivGroups(table) {
        if (!table) return [];
        return [...table.querySelectorAll(':scope > div[name]')].map((groupEl) => ({
            name: groupEl.getAttribute('name'),
            label: groupEl.querySelector(':scope > h4')?.textContent?.trim() || '',
            labelHtml: groupEl.querySelector(':scope > h4')?.innerHTML || '',
            rows: [...groupEl.querySelectorAll(':scope > p[name]')].map((rowEl) => ({
                name: rowEl.getAttribute('name'),
                html: rowEl.innerHTML,
            })),
        }));
    }

    #parse() {
        const { table } = this.#getDocument();
        if (!table) return [];
        return [...this.#parseDivGroups(table), ...this.#parseTableGroups(table)];
    }

    #expandedGroupsAttribute() {
        const { table } = this.#getDocument();
        return table?.getAttribute('expanded-groups')?.trim() || '';
    }

    #expandedGroupNames(groups) {
        const expandedGroups = this.#expandedGroupsAttribute();
        const expandedNames = new Set();
        if (!expandedGroups) {
            if (groups[0]) expandedNames.add(groups[0].name);
            return expandedNames;
        }
        if (expandedGroups === 'all') {
            groups.forEach((group) => expandedNames.add(group.name));
            return expandedNames;
        }
        if (expandedGroups === 'none') return expandedNames;
        expandedGroups.split(',').forEach((item) => {
            const token = item.trim();
            const index = parseInt(token, 10);
            if (!Number.isNaN(index) && groups[index - 1]) {
                expandedNames.add(groups[index - 1].name);
            } else if (groups.some((group) => group.name === token)) {
                expandedNames.add(token);
            }
        });
        return expandedNames;
    }

    #serializeExpandedGroups(groups, expandedNames) {
        if (!expandedNames.size) return 'none';
        if (groups.length && expandedNames.size === groups.length) return 'all';
        return groups
            .map((group, index) => (expandedNames.has(group.name) ? String(index + 1) : ''))
            .filter(Boolean)
            .join(',');
    }

    #emitValue(table) {
        if (!this.fragmentStore || !table) return;
        for (const key of COMPARE_CHART_PLACEHOLDER_KEYS) {
            table.setAttribute(`${key}-text`, `{{${key}}}`);
        }
        const newValue = table.outerHTML;
        this.#ensureCompareChartTag();
        this.fragmentStore.updateField(COMPARE_CHART_FIELD, [newValue]);
        this.requestUpdate();

        this.dispatchEvent(
            new CustomEvent(EVENT_CHANGE, {
                detail: { value: newValue },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #write(mutator) {
        const { doc, table } = this.#getDocument();
        if (!table) return;
        mutator(doc, table);
        this.#emitValue(table);
    }

    #uniqueName(base, existingNames) {
        const normalizedBase = normalizeCompareChartKey(base || 'item') || 'item';
        let name = normalizedBase;
        let index = 2;
        while (existingNames.has(name)) {
            name = `${normalizedBase}-${index}`;
            index += 1;
        }
        return name;
    }

    #handleGroupLabelChange(groupName, event) {
        const innerHtml = this.#normalizeRowHtml(event.target.value || '');
        this.#write((doc, table) => {
            const groupEl = table.querySelector(`:scope > div[name="${CSS.escape(groupName)}"]`);
            if (!groupEl) return;
            let heading = groupEl.querySelector(':scope > h4');
            if (!heading) {
                heading = doc.createElement('h4');
                groupEl.prepend(heading);
            }
            heading.innerHTML = innerHtml;
        });
    }

    // HTML helpers below (#normalizeRowHtml, #normalizeCellHtml, #displayHtml,
    // #cellInnerHtml) round-trip author-supplied markup through DOMParser. This
    // is NOT sanitization — script/event-handler/javascript: URLs survive.
    // Trust boundary: input comes from AEM RTE fields gated by IMS auth, and
    // the AEM write path strips dangerous tags/attributes server-side. Do not
    // call these helpers on untrusted input from other sources.
    #normalizeRowHtml(rawHtml) {
        const doc = new DOMParser().parseFromString(rawHtml || '', 'text/html');
        const blocks = doc.body.querySelectorAll('p, div, h4');
        if (blocks.length === 0) return doc.body.innerHTML.trim();
        return [...blocks]
            .map((b) => b.innerHTML)
            .join(' ')
            .trim();
    }

    #handleRowLabelChange(groupName, rowName, event) {
        const innerHtml = this.#normalizeRowHtml(event.target.value || '');
        this.#write((doc, table) => {
            const rowEl = this.#findRow(table, groupName, rowName);
            if (!rowEl) return;
            rowEl.innerHTML = innerHtml;
        });
    }

    #findRow(table, groupName, rowName) {
        const groupEl = table.querySelector(`:scope > div[name="${CSS.escape(groupName)}"]`);
        return groupEl?.querySelector(`:scope > p[name="${CSS.escape(rowName)}"]`) || null;
    }

    #addGroup() {
        this.#write((doc, table) => {
            const existingNames = new Set(
                [...table.querySelectorAll(':scope > div[name]')].map((el) => el.getAttribute('name')),
            );
            const groupName = this.#uniqueName('New group', existingNames);
            const groupEl = doc.createElement('div');
            groupEl.setAttribute('name', groupName);
            const heading = doc.createElement('h4');
            heading.textContent = 'New group';
            groupEl.appendChild(heading);
            const rowEl = doc.createElement('p');
            rowEl.setAttribute('name', 'new-feature');
            rowEl.textContent = 'New feature';
            groupEl.appendChild(rowEl);
            table.appendChild(groupEl);
        });
    }

    #addRow(groupName) {
        let rowName;
        this.#write((doc, table) => {
            const groupEl = table.querySelector(`:scope > div[name="${CSS.escape(groupName)}"]`);
            if (!groupEl) return;
            const existingNames = new Set(
                [...groupEl.querySelectorAll(':scope > p[name]')].map((el) => el.getAttribute('name')),
            );
            const rowEl = doc.createElement('p');
            rowName = this.#uniqueName('New feature', existingNames);
            rowEl.setAttribute('name', rowName);
            rowEl.textContent = 'New feature';
            groupEl.appendChild(rowEl);
        });
        if (rowName) {
            this.#activateRteCell(this.#editableCellKey('row', groupName, rowName), null, {
                kind: 'row',
                group: groupName,
                feature: rowName,
                value: 'New feature',
            });
        }
    }

    #removeRow(groupName, rowName) {
        this.#write((doc, table) => {
            const groupEl = table.querySelector(`:scope > div[name="${CSS.escape(groupName)}"]`);
            groupEl?.querySelector(`:scope > p[name="${CSS.escape(rowName)}"]`)?.remove();
        });
        if (this.activeRteCell?.includes(`:${groupName}:${rowName}`)) {
            this.activeRteCell = null;
            this.activeRteEditor = null;
        }
        this.#cleanupOrphanCells([{ group: groupName, feature: rowName }]);
    }

    #moveRow(groupName, sourceRowName, targetRowName, placeAfter = false) {
        if (!sourceRowName || sourceRowName === targetRowName) return;
        let moved = false;
        this.#write((doc, table) => {
            const groupEl = table.querySelector(`:scope > div[name="${CSS.escape(groupName)}"]`);
            const source = groupEl?.querySelector(`:scope > p[name="${CSS.escape(sourceRowName)}"]`);
            const target = groupEl?.querySelector(`:scope > p[name="${CSS.escape(targetRowName)}"]`);
            if (!source || !target || source === target) return;
            groupEl.insertBefore(source, placeAfter ? target.nextSibling : target);
            moved = true;
        });
        if (moved) this.#syncColumnFeatureOrder(groupName);
    }

    #removeGroup(groupName) {
        const groups = this.#parse();
        const removed = groups.find((g) => g.name === groupName);
        this.#write((doc, table) => {
            table.querySelector(`:scope > div[name="${CSS.escape(groupName)}"]`)?.remove();
        });
        if (removed) {
            this.#cleanupOrphanCells(removed.rows.map((r) => ({ group: groupName, feature: r.name })));
        }
    }

    #moveGroup(sourceGroupName, targetGroupName, placeAfter = false) {
        if (!sourceGroupName || sourceGroupName === targetGroupName) return;
        this.#write((doc, table) => {
            const source = table.querySelector(`:scope > div[name="${CSS.escape(sourceGroupName)}"]`);
            const target = table.querySelector(`:scope > div[name="${CSS.escape(targetGroupName)}"]`);
            if (!source || !target || source === target) return;
            table.insertBefore(source, placeAfter ? target.nextSibling : target);
        });
    }

    #cleanupOrphanCells(entries) {
        const columns = this.effectiveColumns;
        if (!columns.length || !entries.length) return;
        for (const column of columns) {
            const features = (column.features || []).slice();
            let changed = false;
            for (const { group, feature } of entries) {
                const re = new RegExp(`name=["']${group}@${feature}["']`);
                for (let i = features.length - 1; i >= 0; i -= 1) {
                    if (re.test(features[i])) {
                        features.splice(i, 1);
                        changed = true;
                    }
                }
            }
            if (changed) this.#stageColumnFeatures(column.path, features);
        }
    }

    #featureNameFromHtml(html) {
        const doc = new DOMParser().parseFromString(html || '', 'text/html');
        return doc.body.querySelector('p[name]')?.getAttribute('name') || '';
    }

    #featureMap(features) {
        const map = new Map();
        for (const html of features || []) {
            const name = this.#featureNameFromHtml(html);
            if (name) map.set(name, html);
        }
        return map;
    }

    #featureHtmlByName(features, name) {
        return this.#featureMap(features).get(name) || '';
    }

    #featureNameRegex(name) {
        const escapedName = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`name=["']${escapedName}["']`);
    }

    #normalizeFeatureHtmlForComparison(html) {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const p = doc.body.querySelector('p') || doc.body;
        return (p.innerHTML || '')
            .normalize('NFC')
            .trim()
            .replace(/\s+role="[^"]*"/g, '')
            .replace(/\s+aria-level="[^"]*"/g, '')
            .replace(/\s+/g, ' ');
    }

    #featureHtmlMatches(parentHtml, childHtml) {
        return this.#normalizeFeatureHtmlForComparison(parentHtml) === this.#normalizeFeatureHtmlForComparison(childHtml);
    }

    #effectiveFeatureValues(childFeatures, parentFeatures) {
        const effectiveByName = this.#featureMap(parentFeatures);
        for (const [name, html] of this.#featureMap(childFeatures)) {
            effectiveByName.set(name, html);
        }
        const orderedNames = [];
        for (const name of this.#featureMap(parentFeatures).keys()) orderedNames.push(name);
        for (const name of this.#featureMap(childFeatures).keys()) {
            if (!orderedNames.includes(name)) orderedNames.push(name);
        }
        return orderedNames.map((name) => effectiveByName.get(name)).filter(Boolean);
    }

    #sourceFeatureValues(cardPath) {
        return this.#featureValues(this.#getColumnStore(cardPath)?.get?.() || this.#getSourceCardFragment(cardPath));
    }

    #parentFeatureValues(cardPath) {
        const parentPath = this.#parentPathByVariationPath.get(cardPath);
        if (!parentPath) return [];
        return this.#featureValues(this.#getColumnStore(parentPath)?.get?.() || this.#getSourceCardFragment(parentPath));
    }

    #sourceFeatureValuesForColumn(column) {
        if (!column?.path) return [];
        return this.columnFeatureDrafts.get(column.path) || this.#sourceFeatureValues(column.path);
    }

    #toOverrideFeatureValues(features, parentFeatures) {
        const parentByName = this.#featureMap(parentFeatures);
        return (features || []).filter((html) => {
            const name = this.#featureNameFromHtml(html);
            if (!name) return true;
            const parentHtml = parentByName.get(name);
            return !parentHtml || !this.#featureHtmlMatches(parentHtml, html);
        });
    }

    #isFeatureOverridden(column, group, feature) {
        if (!column?.isVariationColumn) return false;
        const name = `${group}@${feature}`;
        const childHtml = this.#featureHtmlByName(this.#sourceFeatureValuesForColumn(column), name);
        if (!childHtml) return false;
        const parentHtml = this.#featureHtmlByName(this.#featureValues(column.parentFragment), name);
        return !parentHtml || !this.#featureHtmlMatches(parentHtml, childHtml);
    }

    #isColumnFeaturesOverridden(column) {
        if (!column?.isVariationColumn) return false;
        const childFeatures = this.#sourceFeatureValuesForColumn(column);
        if (!childFeatures.length) return false;
        const parentFeatures = this.#featureValues(column.parentFragment);
        return this.#toOverrideFeatureValues(childFeatures, parentFeatures).length > 0;
    }

    #syncColumnFeatureOrder(groupName) {
        const group = this.#parse().find((item) => item.name === groupName);
        if (!group?.rows?.length) return;
        const order = new Map(group.rows.map((row, index) => [`${groupName}@${row.name}`, index]));
        for (const column of this.effectiveColumns) {
            const features = (column.features || []).slice();
            const reordered = features
                .map((html, index) => ({ html, index, orderIndex: order.get(this.#featureNameFromHtml(html)) }))
                .sort((a, b) => {
                    if (a.orderIndex == null || b.orderIndex == null) return a.index - b.index;
                    return a.orderIndex - b.orderIndex || a.index - b.index;
                })
                .map((item) => item.html);
            if (reordered.some((html, index) => html !== features[index])) {
                this.#stageColumnFeatures(column.path, reordered);
            }
        }
    }

    #stageColumnFeatures(cardPath, features) {
        if (!cardPath) return;
        this.columnFeatureDrafts = new Map(this.columnFeatureDrafts).set(cardPath, features);
        this.#syncDirtyCardStoreState();
        this.requestUpdate();
    }

    #writeColumnFeatures(cardPath, features) {
        const store = this.#getColumnStore(cardPath);
        if (!store) return;
        const parentFeatures = this.#parentFeatureValues(cardPath);
        const nextFeatures = parentFeatures.length ? this.#toOverrideFeatureValues(features, parentFeatures) : features;
        if (parentFeatures.length && nextFeatures.length === 0) {
            store.resetFieldToParent('features');
        } else {
            store.updateField('features', nextFeatures);
        }
        this.#syncDirtyCardStoreState();
        this.requestUpdate();
    }

    get dirtyCardFragmentStores() {
        const cardPaths = new Set(this.#cardPaths);
        this.effectiveColumns.forEach((column) => {
            if (column.path) cardPaths.add(column.path);
            if (column.parentPath) cardPaths.add(column.parentPath);
        });
        const stores = [
            ...(Store.fragments.list.data.get() || []),
            ...[...this.#fragmentReferencesMap.values()].filter(Boolean),
        ];
        return [...new Set(stores)]
            .filter((store) => cardPaths.has(store.get().path))
            .filter((store) => store.get().model?.path === CARD_MODEL_PATH)
            .filter((store) => store.get().hasChanges);
    }

    #syncDirtyCardStoreState() {
        const hasPendingDrafts = this.columnFeatureDrafts.size > 0;
        Store.editor.referencedFragmentStoresHaveChanges.set(hasPendingDrafts || this.dirtyCardFragmentStores.length > 0);
    }

    discardCardFragmentChanges() {
        for (const store of this.dirtyCardFragmentStores) {
            store.discardChanges();
        }
        this.columnFeatureDrafts = new Map();
        this.#syncDirtyCardStoreState();
    }

    commitFeatureDrafts() {
        this.#commitCurrentActiveRteCell();
        this.#flushFeatureDrafts();
    }

    #flushFeatureDrafts() {
        if (!this.columnFeatureDrafts.size) return;
        const drafts = new Map(this.columnFeatureDrafts);
        this.columnFeatureDrafts = new Map();
        for (const [cardPath, features] of drafts) {
            this.#writeColumnFeatures(cardPath, features);
        }
    }

    #normalizeCellHtml(rawHtml, group, feature) {
        const doc = new DOMParser().parseFromString(rawHtml || '', 'text/html');
        const p = doc.createElement('p');
        p.setAttribute('name', `${group}@${feature}`);
        const blocks = doc.body.querySelectorAll('p, div');
        if (blocks.length === 0) {
            p.innerHTML = doc.body.innerHTML;
        } else {
            p.innerHTML = [...blocks]
                .map((b) => b.innerHTML)
                .join(' ')
                .trim();
        }
        return p;
    }

    #handleCellChange(group, feature, cardPath, event) {
        const rteKey = event.target?.dataset?.rteKey;
        if (rteKey && this.activeRteEditor?.key === rteKey) {
            this.activeRteEditor = {
                ...this.activeRteEditor,
                value: event.target.value || '',
            };
        }
        const newP = this.#normalizeCellHtml(event.target.value || '', group, feature);
        this.#updateCellFeature(cardPath, group, feature, newP.outerHTML);
    }

    #editableCellKey(kind, group, feature, cardPath = '') {
        return `${kind}:${cardPath}:${group}:${feature}`;
    }

    async #activateRteCell(key, anchor, editor) {
        if (this.activeRteCell === key) return;
        this.activeRteCell = key;
        this.activeRteEditor = { ...editor, key, toolbarTop: 8, toolbarLeft: 8, initialValue: editor.value };
        await import('../rte/rte-field.js');
        const rteAnchor = anchor || this.#getRteAnchor(key);
        if (rteAnchor) this.#positionRteToolbar(key, rteAnchor);
        await this.updateComplete;
        if (this.activeRteCell !== key) return;
        const positionedAnchor = this.#getRteAnchor(key);
        if (positionedAnchor) this.#positionRteToolbar(key, positionedAnchor);
        await this.updateComplete;
        if (this.activeRteCell !== key) return;
        const rteField = [...this.shadowRoot.querySelectorAll('rte-field')].find((field) => field.dataset.rteKey === key);
        await rteField?.updateComplete;
        if (this.activeRteCell !== key) return;
        rteField?.editorView?.focus();
    }

    #getRteAnchor(key) {
        return this.shadowRoot.querySelector(`.compchart-cell-value[data-rte-anchor-key="${CSS.escape(key)}"]`);
    }

    #positionRteToolbar(key, anchor) {
        if (!this.activeRteEditor || this.activeRteEditor.key !== key) return;
        const rect = anchor.getBoundingClientRect();
        const estimatedToolbarWidth = 520;
        const estimatedToolbarHeight = 44;
        const width = Math.min(estimatedToolbarWidth, window.innerWidth - 16);
        const left = Math.min(Math.max(rect.left, 8), Math.max(window.innerWidth - width - 8, 8));
        const preferredTop = rect.top - estimatedToolbarHeight - 8;
        const top = preferredTop >= 8 ? preferredTop : Math.min(rect.bottom + 8, Math.max(window.innerHeight - 52, 8));
        this.activeRteEditor = {
            ...this.activeRteEditor,
            toolbarTop: top,
            toolbarLeft: left,
        };
    }

    #handleStaticRteKeydown(key, editor, event) {
        if (this.activeRteCell === key || event.target !== event.currentTarget) return;
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this.#activateRteCell(key, event.currentTarget, editor);
    }

    #commitActiveRteCell(key, rteField) {
        const editor = this.activeRteEditor;
        if (!editor || editor.key !== key || !rteField) return;
        rteField.commitValue?.();
        const event = { target: rteField };
        if (editor.kind === 'section') {
            this.#handleGroupLabelChange(editor.group, event);
        } else if (editor.kind === 'row') {
            this.#handleRowLabelChange(editor.group, editor.feature, event);
        } else {
            this.#handleCellChange(editor.group, editor.feature, editor.cardPath, event);
        }
    }

    #commitCurrentActiveRteCell() {
        const key = this.activeRteCell;
        if (!key) return;
        const rteField = [...this.shadowRoot.querySelectorAll('rte-field')].find((field) => field.dataset.rteKey === key);
        this.#commitActiveRteCell(key, rteField);
    }

    #cancelActiveRteCell(key, event) {
        const currentTarget = event?.currentTarget;
        if (this.#rteFieldHasOpenModal(currentTarget)) {
            return;
        }
        const editor = this.activeRteEditor;
        if (!editor || editor.key !== key) return;
        const revertTarget = {
            value: editor.initialValue ?? editor.value,
            dataset: { rteKey: key },
        };
        if (editor.kind === 'section') {
            this.#handleGroupLabelChange(editor.group, { target: revertTarget });
        } else if (editor.kind === 'row') {
            this.#handleRowLabelChange(editor.group, editor.feature, { target: revertTarget });
        } else {
            this.#handleCellChange(editor.group, editor.feature, editor.cardPath, { target: revertTarget });
        }
        this.activeRteCell = null;
        this.activeRteEditor = null;
    }

    #rteFieldHasOpenModal(rteField) {
        return Boolean(
            rteField?.showOfferSelector || rteField?.showLinkEditor || rteField?.showIconEditor || rteField?.showMnemonicEditor,
        );
    }

    #deactivateRteCell(key, event) {
        const nextTarget = event?.relatedTarget || event?.detail?.relatedTarget;
        const currentTarget = event?.currentTarget;
        if (nextTarget && (currentTarget?.contains?.(nextTarget) || currentTarget?.shadowRoot?.contains?.(nextTarget))) {
            return;
        }
        if (this.#rteFieldHasOpenModal(currentTarget)) {
            return;
        }
        if (this.activeRteCell === key) {
            const editor = this.activeRteEditor;
            this.#commitActiveRteCell(key, currentTarget);
            if (editor.kind === 'cell') this.#flushFeatureDrafts();
            this.activeRteCell = null;
            this.activeRteEditor = null;
        }
    }

    #displayHtml(rawHtml) {
        if (!rawHtml) return '';
        const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
        return doc.body.innerHTML.trim();
    }

    #updateCellFeature(cardPath, group, feature, newHtml) {
        const column = this.effectiveColumns.find((c) => c.path === cardPath);
        if (!column) return;
        const features = column.isVariationColumn
            ? this.#sourceFeatureValues(cardPath).slice()
            : (column.features || []).slice();
        const name = `${group}@${feature}`;
        const re = this.#featureNameRegex(name);
        const idx = features.findIndex((v) => re.test(v));
        const parentHtml = column.isVariationColumn
            ? this.#featureHtmlByName(this.#featureValues(column.parentFragment), name)
            : '';
        const shouldRemoveOverride =
            newHtml == null || (column.isVariationColumn && parentHtml && this.#featureHtmlMatches(parentHtml, newHtml));
        if (shouldRemoveOverride) {
            if (idx >= 0) features.splice(idx, 1);
            else return;
        } else if (idx >= 0) {
            features[idx] = newHtml;
        } else {
            features.push(newHtml);
        }
        const toStage = column.isVariationColumn
            ? this.#toOverrideFeatureValues(features, this.#featureValues(column.parentFragment))
            : features;
        this.#stageColumnFeatures(cardPath, toStage);
    }

    #restoreCellFeature(column, group, feature, event) {
        event?.stopPropagation?.();
        const name = `${group}@${feature}`;
        const features = this.#sourceFeatureValues(column.path).slice();
        const idx = features.findIndex((html) => this.#featureNameFromHtml(html) === name);
        if (idx < 0) return;
        features.splice(idx, 1);
        const toWrite = column.isVariationColumn
            ? this.#toOverrideFeatureValues(features, this.#featureValues(column.parentFragment))
            : features;
        this.#writeColumnFeatures(column.path, toWrite);
    }

    #restoreColumnFeatures(column, event) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        const store = this.#getColumnStore(column.path);
        if (!store || !column?.isVariationColumn) return;
        const drafts = new Map(this.columnFeatureDrafts);
        drafts.delete(column.path);
        this.columnFeatureDrafts = drafts;
        store.resetFieldToParent('features');
        this.#syncDirtyCardStoreState();
        this.requestUpdate();
    }

    #cellHtmlForColumnFeature(column, group, feature) {
        const re = this.#featureNameRegex(`${group}@${feature}`);
        return (column.features || []).find((v) => re.test(v)) || '';
    }

    #cellInnerHtml(cellHtml) {
        if (!cellHtml) return '';
        const doc = new DOMParser().parseFromString(cellHtml, 'text/html');
        return doc.body.querySelector('p')?.innerHTML || '';
    }

    get #cardPaths() {
        if (!this.fragmentStore || !this.fragment) return [];
        return (
            this.fragment.getEffectiveFieldValues?.('cards', this.localeDefaultFragment, this.isVariation) ||
            this.fragment.fields?.find((field) => field.name === 'cards')?.values ||
            []
        ).slice(0, MAX_COMPARE_CHART_CARDS);
    }

    #updateCardsField(values) {
        if (!this.fragmentStore) return;
        const nextValues = values.slice(0, MAX_COMPARE_CHART_CARDS);
        // An empty array means "inherit from parent" for variation fields, so removing every
        // card would revert to the parent's cards. Use the explicit multi-value clear sentinel
        // ([''])  so clearing actually persists as empty.
        this.fragmentStore.updateField('cards', nextValues.length ? nextValues : ['']);
        this.requestUpdate();
    }

    #addFragmentReference(fragmentData) {
        if (!this.fragment || !fragmentData?.path) return;
        const existing = this.fragment.references?.find((ref) => ref.path === fragmentData.path || ref.id === fragmentData.id);
        if (!existing) {
            this.fragment.references = [...(this.fragment.references || []), fragmentData];
        }
        if (!this.#fragmentReferencesMap.has(fragmentData.path)) {
            const fragmentStore = generateFragmentStore(new Fragment(fragmentData));
            this.#fragmentReferencesMap.set(fragmentData.path, fragmentStore);
            const stores = [this.fragmentStore];
            for (const store of this.#fragmentReferencesMap.values()) {
                stores.push(store, store.previewStore);
            }
            this.reactiveController.updateStores(this.#reactiveStores(stores));
            // Placeholders are already loaded by the time a card is added, so the new preview
            // store won't get the Store.placeholders.preview trigger; resolve it now so offers
            // render without a manual page refresh.
            fragmentStore.resolvePreviewFragment();
        }
    }

    #parseCardDropData(event) {
        const raw =
            event.dataTransfer.getData('aem/fragment') ||
            event.dataTransfer.getData('application/json') ||
            event.dataTransfer.getData('text/plain') ||
            event.dataTransfer.getData('text');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    #setDragData(event, data) {
        const json = JSON.stringify(data);
        event.dataTransfer.setData('application/json', json);
        event.dataTransfer.setData('text/plain', json);
    }

    #parseInternalDragData(event) {
        try {
            const raw = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    #handleGroupDragStart(event, groupName) {
        this.draggingGroup = groupName;
        this.#setDragData(event, { isGroupDrag: true, groupName });
        event.dataTransfer.effectAllowed = 'move';
        event.currentTarget.closest('.compchart-group-header')?.classList.add('dragging');
    }

    #handleGroupDragEnd(event) {
        event.currentTarget.closest('.compchart-group-header')?.classList.remove('dragging');
        this.draggingGroup = null;
        this.shadowRoot
            .querySelectorAll('.dragover, .dragover-after')
            .forEach((el) => el.classList.remove('dragover', 'dragover-after'));
    }

    #handleGroupDragOver(event, groupName) {
        const sourceGroup = this.draggingGroup || this.#parseInternalDragData(event)?.groupName;
        if (!sourceGroup || sourceGroup === groupName) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const header = event.currentTarget;
        const { top, height } = header.getBoundingClientRect();
        const placeAfter = event.clientY > top + height / 2;
        header.classList.toggle('dragover', !placeAfter);
        header.classList.toggle('dragover-after', placeAfter);
    }

    #handleGroupDragLeave(event) {
        event.currentTarget.classList.remove('dragover', 'dragover-after');
    }

    #handleGroupDrop(event, groupName) {
        const sourceGroup = this.draggingGroup || this.#parseInternalDragData(event)?.groupName;
        if (!sourceGroup || sourceGroup === groupName) return;
        event.preventDefault();
        event.stopPropagation();
        const header = event.currentTarget;
        const placeAfter = header.classList.contains('dragover-after');
        header.classList.remove('dragover', 'dragover-after');
        this.#moveGroup(sourceGroup, groupName, placeAfter);
        this.draggingGroup = null;
    }

    #handleFeatureDragStart(event, groupName, rowName) {
        this.draggingFeature = { groupName, rowName };
        this.#setDragData(event, { isFeatureDrag: true, groupName, rowName });
        event.dataTransfer.effectAllowed = 'move';
        event.currentTarget.closest('.compchart-row-label')?.classList.add('dragging');
    }

    #handleFeatureDragEnd(event) {
        event.currentTarget.closest('.compchart-row-label')?.classList.remove('dragging');
        this.draggingFeature = null;
        this.shadowRoot
            .querySelectorAll('.dragover, .dragover-after')
            .forEach((el) => el.classList.remove('dragover', 'dragover-after'));
    }

    #handleFeatureDragOver(event, groupName, rowName) {
        const sourceFeature = this.draggingFeature || this.#parseInternalDragData(event);
        if (!sourceFeature || sourceFeature.groupName !== groupName) return;
        if (sourceFeature.rowName === rowName) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const rowLabel = event.currentTarget;
        const { top, height } = rowLabel.getBoundingClientRect();
        const placeAfter = event.clientY > top + height / 2;
        rowLabel.classList.toggle('dragover', !placeAfter);
        rowLabel.classList.toggle('dragover-after', placeAfter);
    }

    #handleFeatureDragLeave(event) {
        event.currentTarget.classList.remove('dragover', 'dragover-after');
    }

    #handleFeatureDrop(event, groupName, rowName) {
        const sourceFeature = this.draggingFeature || this.#parseInternalDragData(event);
        if (!sourceFeature || sourceFeature.groupName !== groupName) return;
        event.preventDefault();
        event.stopPropagation();
        const rowLabel = event.currentTarget;
        const placeAfter = rowLabel.classList.contains('dragover-after');
        rowLabel.classList.remove('dragover', 'dragover-after');
        this.#moveRow(groupName, sourceFeature.rowName, rowName, placeAfter);
        this.draggingFeature = null;
    }

    #handleCardDragStart(event, index) {
        this.draggingCardIndex = index;
        const path = this.#cardPaths[index];
        const data = { isInternalDrag: true, sourceIndex: index, path };
        this.#setDragData(event, data);
        event.dataTransfer.effectAllowed = 'move';
        event.currentTarget.closest('.compchart-card-row')?.classList.add('dragging');
    }

    #handleCardDragEnd(event) {
        event.currentTarget.closest('.compchart-card-row')?.classList.remove('dragging');
        this.draggingCardIndex = -1;
        this.shadowRoot
            .querySelectorAll('.dragover, .dragover-after')
            .forEach((el) => el.classList.remove('dragover', 'dragover-after'));
    }

    #handleCardDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = this.draggingCardIndex >= 0 ? 'move' : 'copy';
        const item = event.currentTarget;
        if (item?.classList?.contains('compchart-card-row')) {
            const { top, height } = item.getBoundingClientRect();
            const placeAfter = event.clientY > top + height / 2;
            item.classList.toggle('dragover', !placeAfter);
            item.classList.toggle('dragover-after', placeAfter);
        }
    }

    #handleCardDragLeave(event) {
        event.currentTarget.classList.remove('dragover', 'dragover-after');
    }

    #handleCardSectionDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = this.draggingCardIndex >= 0 ? 'move' : 'copy';
        event.currentTarget.classList.add('dragover');
    }

    #handleCardSectionDragLeave(event) {
        if (event.currentTarget === event.target) {
            event.currentTarget.classList.remove('dragover');
        }
    }

    #handleCardSectionDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('dragover');
        this.#applyCardDrop(event, this.#cardPaths.length);
    }

    #handleCardItemDrop(event, targetIndex) {
        event.preventDefault();
        event.stopPropagation();
        const placeAfter = event.currentTarget.classList.contains('dragover-after');
        event.currentTarget.classList.remove('dragover', 'dragover-after');
        this.#applyCardDrop(event, targetIndex + (placeAfter ? 1 : 0));
    }

    #handleVariationDragStart(event, parentPath, variationPath) {
        if (this.#isVariationControlEvent(event)) return;
        if (!parentPath || !variationPath) return;
        this.draggingVariation = { parentPath, variationPath };
        this.#setDragData(event, { isVariationDrag: true, parentPath, variationPath });
        event.dataTransfer.effectAllowed = 'move';
        event.currentTarget.closest('.compchart-card-variation-row')?.classList.add('dragging');
    }

    #handleVariationDragEnd(event) {
        event.currentTarget.closest('.compchart-card-variation-row')?.classList.remove('dragging');
        this.draggingVariation = null;
        this.shadowRoot
            .querySelectorAll('.dragover, .dragover-after')
            .forEach((el) => el.classList.remove('dragover', 'dragover-after'));
    }

    #handleVariationDragOver(event, parentPath, variationPath) {
        const sourceVariation = this.draggingVariation || this.#parseInternalDragData(event);
        if (
            !sourceVariation?.variationPath ||
            sourceVariation.parentPath !== parentPath ||
            sourceVariation.variationPath === variationPath
        ) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        const row = event.currentTarget;
        const { top, height } = row.getBoundingClientRect();
        const placeAfter = event.clientY > top + height / 2;
        row.classList.toggle('dragover', !placeAfter);
        row.classList.toggle('dragover-after', placeAfter);
    }

    #handleVariationDragLeave(event) {
        event.currentTarget.classList.remove('dragover', 'dragover-after');
    }

    #handleVariationDrop(event, parentPath, targetVariationPath) {
        const sourceVariation = this.draggingVariation || this.#parseInternalDragData(event);
        if (!sourceVariation?.variationPath || sourceVariation.parentPath !== parentPath) return;
        event.preventDefault();
        event.stopPropagation();
        const placeAfter = event.currentTarget.classList.contains('dragover-after');
        event.currentTarget.classList.remove('dragover', 'dragover-after');
        this.#moveVariation(parentPath, sourceVariation.variationPath, targetVariationPath, placeAfter);
        this.draggingVariation = null;
    }

    #moveVariation(parentPath, sourceVariationPath, targetVariationPath, placeAfter = false) {
        if (!parentPath || !sourceVariationPath || !targetVariationPath || sourceVariationPath === targetVariationPath) return;
        const store = this.#getColumnStore(parentPath);
        const fragment = store?.get?.();
        const variations = fragment?.getFieldValues?.('variations') || [];
        const sourceIndex = variations.indexOf(sourceVariationPath);
        const targetIndex = variations.indexOf(targetVariationPath);
        if (sourceIndex < 0 || targetIndex < 0) return;
        const nextVariations = [...variations];
        const [moved] = nextVariations.splice(sourceIndex, 1);
        const insertAt = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        nextVariations.splice(insertAt + (placeAfter ? 1 : 0), 0, moved);
        store.updateField('variations', nextVariations);
        this.#syncDirtyCardStoreState();
    }

    #applyCardDrop(event, targetIndex) {
        const data = this.#parseCardDropData(event);
        if (!data) return;
        const paths = [...this.#cardPaths];

        if (data.isInternalDrag && Number.isInteger(data.sourceIndex)) {
            const [moved] = paths.splice(data.sourceIndex, 1);
            const insertAt = data.sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
            paths.splice(insertAt, 0, moved);
            this.#updateCardsField(paths);
            this.draggingCardIndex = -1;
            return;
        }

        const path = data.path;
        if (!path) return;
        if (data.model && data.model.path && data.model.path !== CARD_MODEL_PATH) return;
        if (paths.includes(path)) return;
        if (paths.length >= MAX_COMPARE_CHART_CARDS) return;
        this.#addFragmentReference(data);
        paths.splice(targetIndex, 0, path);
        this.#updateCardsField(paths);
    }

    #openItemsSelector(event) {
        const cards = this.#cardPaths.map((path) => this.#getSourceCardFragment(path)).filter(Boolean);
        const cardsByPaths = new Map(Store.compareChart.cardsByPaths.value);
        cards.forEach((card) => cardsByPaths.set(card.path, card));
        Store.compareChart.cardsByPaths.set(cardsByPaths);
        Store.compareChart.selectedCards.set([...this.#cardPaths]);
        Store.compareChart.showSelected.set(true);
        const currentTags = Store.filters.get()?.tags;
        const tags = (Array.isArray(currentTags) ? currentTags : String(currentTags || '').split(',')).filter(
            (tag) => tag && !tag.startsWith(TAG_STUDIO_CONTENT_TYPE) && !tag.startsWith(VARIANT_TAG_PREFIX),
        );
        const pickerTags = [TAG_MERCH_CARD, ...tags, `${VARIANT_TAG_PREFIX}${VARIANT_NAMES.COMPARE_CHART_COLUMN}`];
        // Seed the picker's local filters (not global Store.filters, which is URL-synced and would dirty the hash).
        // mas-search-and-filters owns the actual repository search on connect (via defaultTemplateFilter);
        // firing one here too raced with and overruled that authoritative result.
        Store.compareChart.filters.set({ tags: pickerTags.join(',') });
    }

    get #itemsSelectorDialog() {
        return html`<sp-dialog-wrapper
            class="compchart-items-selector-dialog"
            slot="click-content"
            headline="Select items"
            headline-visibility="none"
            confirm-label="Add selected items"
            cancel-label="Cancel"
            underlay
            no-divider
            @sp-opened=${this.#openItemsSelector}
            @confirm=${this.#confirmItemsSelector}
        >
            <mas-items-selector
                .allowedTypes=${[TABLE_TYPE.CARDS]}
                .maxSelectedCards=${MAX_COMPARE_CHART_CARDS}
                .defaultTemplateFilter=${VARIANT_NAMES.COMPARE_CHART_COLUMN}
                .nonSelectableVariations=${[VARIATION_TAB_NAME.GROUPED]}
                .restrictImportSurface=${Store.surface()}
            ></mas-items-selector>
        </sp-dialog-wrapper> `;
    }

    #fragmentFromItemsSelectionStore(path) {
        return (
            this.itemsSelectionStore?.cardsByPaths.value?.get(path) ||
            this.itemsSelectionStore?.groupedVariationsData.value?.get(path) ||
            this.#getSourceCardFragment(path)
        );
    }

    #confirmItemsSelector = ({ target }) => {
        target.close();
        const paths = (this.itemsSelectionStore?.selectedCards.value || []).slice(0, MAX_COMPARE_CHART_CARDS);
        const pickedFragments = new Map(this.pickedFragments);
        paths.forEach((path) => {
            const fragment = this.#fragmentFromItemsSelectionStore(path);
            if (!fragment) return;
            pickedFragments.set(path, this.#normalizeFragment(fragment));
            this.#addFragmentReference(fragment);
        });
        this.pickedFragments = pickedFragments;
        this.#updateCardsField(paths);
    };

    #removeCard(index) {
        const paths = [...this.#cardPaths];
        if (index < 0 || index >= paths.length) return;
        const [removedPath] = paths.splice(index, 1);
        if (removedPath && this.pickedFragments.has(removedPath)) {
            const pickedFragments = new Map(this.pickedFragments);
            pickedFragments.delete(removedPath);
            this.pickedFragments = pickedFragments;
        }
        if (removedPath) {
            if (this.selectedVariationPaths.has(removedPath)) {
                const selectedVariationPaths = new Map(this.selectedVariationPaths);
                selectedVariationPaths.delete(removedPath);
                this.selectedVariationPaths = selectedVariationPaths;
            }
            const expandedCards = new Set(this.expandedCards);
            expandedCards.delete(removedPath);
            this.expandedCards = expandedCards;
            if (this.columnFeatureDrafts.has(removedPath)) {
                const drafts = new Map(this.columnFeatureDrafts);
                drafts.delete(removedPath);
                this.columnFeatureDrafts = drafts;
            }
        }
        this.#updateCardsField(paths);
    }

    #cancelRemoveCard = () => {
        this.cardPathToRemove = '';
    };

    #confirmRemoveCard = () => {
        const index = this.#cardPaths.indexOf(this.cardPathToRemove);
        this.#cancelRemoveCard();
        if (index >= 0) this.#removeCard(index);
    };

    #isControlEvent(event) {
        return event
            .composedPath()
            .some(
                (node) =>
                    node?.tagName === 'SP-ACTION-BUTTON' ||
                    node?.classList?.contains('compchart-card-handle') ||
                    node?.classList?.contains('compchart-card-cell-controls'),
            );
    }

    #isVariationControlEvent(event) {
        return event
            .composedPath()
            .some((node) => ['SP-ACTION-BUTTON', 'SP-ACTION-MENU', 'SP-MENU-ITEM'].includes(node?.tagName));
    }

    async #openCardFragment(event, fragment) {
        if (this.#isControlEvent(event)) return;
        const id = fragment?.id;
        if (!id) return;
        await router.navigateToFragmentEditor(id);
    }

    #renderRemoveCardDialog(columnsByPath) {
        if (!this.cardPathToRemove) return nothing;
        const fragment =
            columnsByPath.get(this.cardPathToRemove)?.parentFragment || columnsByPath.get(this.cardPathToRemove)?.fragment;
        const title = this.#fragmentTitle(fragment) || this.cardPathToRemove;
        return html`
            <sp-underlay open @click=${this.#cancelRemoveCard}></sp-underlay>
            <sp-dialog
                open
                variant="confirmation"
                @sp-dialog-confirm=${this.#confirmRemoveCard}
                @sp-dialog-dismiss=${this.#cancelRemoveCard}
            >
                <h1 slot="heading">Remove fragment?</h1>
                <p>Remove "${title}" from this compare chart?</p>
                <sp-button slot="button" variant="secondary" @click=${this.#cancelRemoveCard}>Cancel</sp-button>
                <sp-button slot="button" variant="accent" @click=${this.#confirmRemoveCard}>Remove</sp-button>
            </sp-dialog>
        `;
    }

    #toggleGroup(groupName) {
        const groups = this.#parse();
        const expandedNames = this.#expandedGroupNames(groups);
        if (expandedNames.has(groupName)) expandedNames.delete(groupName);
        else expandedNames.add(groupName);
        const expandedGroups = this.#serializeExpandedGroups(groups, expandedNames);
        this.#write((doc, table) => {
            table.setAttribute('expanded-groups', expandedGroups);
        });
    }

    #setEditorView(view) {
        if (!['edit', 'preview'].includes(view)) return;
        if (view === 'preview') {
            this.commitFeatureDrafts();
            this.activeRteCell = null;
            this.activeRteEditor = null;
            this.fragmentStore?.previewStore?.populateGlobalCache?.();
            this.#fragmentReferencesMap.forEach((store) => store.previewStore?.populateGlobalCache?.());
        }
        this.editorView = view;
    }

    get #viewToggle() {
        return html`
            <div class="editor-view-toggle" role="tablist" aria-label="Compare chart editor view">
                <button
                    type="button"
                    role="tab"
                    aria-selected=${this.editorView === 'edit'}
                    @click=${() => this.#setEditorView('edit')}
                >
                    Edit
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected=${this.editorView === 'preview'}
                    @click=${() => this.#setEditorView('preview')}
                >
                    Preview
                </button>
            </div>
        `;
    }

    #handleFragmentTitleUpdate(e) {
        this.fragmentStore?.updateFieldInternal('title', e.target.value);
    }

    #handleFragmentDescriptionUpdate(e) {
        this.fragmentStore?.updateFieldInternal('description', e.target.value);
    }

    get #generalInfo() {
        return html`
            <div class="compchart-general-info">
                <h3 class="compchart-general-info-title">General info</h3>
                <div class="compchart-general-info-grid">
                    <sp-field-group>
                        <sp-field-label for="compchart-fragment-title" required>Fragment title</sp-field-label>
                        <sp-textfield
                            id="compchart-fragment-title"
                            placeholder="Enter fragment title"
                            value=${this.fragment?.title || ''}
                            @input=${this.#handleFragmentTitleUpdate}
                        ></sp-textfield>
                    </sp-field-group>
                    <sp-field-group>
                        <sp-field-label for="compchart-fragment-description">Fragment description</sp-field-label>
                        <sp-textfield
                            id="compchart-fragment-description"
                            placeholder="Enter fragment description"
                            value=${this.fragment?.description || ''}
                            @input=${this.#handleFragmentDescriptionUpdate}
                        ></sp-textfield>
                    </sp-field-group>
                </div>
            </div>
        `;
    }

    #renderEditView(groups, columns) {
        const expandedGroups = this.#expandedGroupNames(groups);
        return html`
            ${this.#generalInfo} ${this.groupedVariationTagsTemplate} ${this.#renderCardsSection(columns)}
            <div class="compchart-grid" style="--compchart-editor-columns: ${columns.length}">
                <div class="compchart-header-cell">Feature</div>
                ${columns.map((column) => {
                    const overridden = this.#isColumnFeaturesOverridden(column);
                    return html`
                        <div class="compchart-header-cell ${overridden ? 'compchart-overridden-cell' : ''}">
                            <span class="compchart-header-title">${column.title}</span>
                            ${overridden
                                ? html`<a
                                      href="#"
                                      class="compchart-restore-all"
                                      @click=${(event) => this.#restoreColumnFeatures(column, event)}
                                      >Restore all</a
                                  >`
                                : nothing}
                        </div>
                    `;
                })}
                ${groups.map((group, index) => this.#renderGroup(group, columns, index, expandedGroups))}
            </div>
            <div class="compchart-add-group">
                <sp-button size="s" variant="secondary" @click=${this.#addGroup}>
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Add group
                </sp-button>
            </div>
        `;
    }

    #cloneFragmentData(fragment) {
        return fragment ? structuredClone(fragment) : null;
    }

    #upsertPreviewField(fragmentData, name, values, multiple = false) {
        fragmentData.fields ||= [];
        const field = fragmentData.fields.find((item) => item.name === name);
        if (field) {
            field.values = values;
            field.multiple = multiple;
            return;
        }
        fragmentData.fields.push({ name, values, multiple });
    }

    #previewCardSource(column) {
        return this.#getColumnStore(column.path)?.previewStore?.get?.() || column.fragment || column.sourceFragment;
    }

    #previewFragmentId(columns) {
        const AemFragment = customElements.get('aem-fragment');
        const cache = AemFragment?.cache;
        const sourceFragment = this.fragmentStore?.previewStore?.get?.() || this.fragment;
        if (!cache || !sourceFragment?.id) return '';

        const previewChartId = `${sourceFragment.id}--compare-chart-editor-preview`;
        const previewChart = this.#cloneFragmentData(sourceFragment);
        previewChart.id = previewChartId;
        previewChart.references = [];
        previewChart.referencesTree = [];

        const previewCards = columns
            .map((column, index) => {
                const sourceCard = this.#previewCardSource(column);
                const previewCard = this.#cloneFragmentData(sourceCard);
                if (!previewCard?.id) return null;
                previewCard.id = `${previewChartId}--card-${index + 1}`;
                this.#upsertPreviewField(previewCard, 'features', column.features || [], true);
                return previewCard;
            })
            .filter(Boolean);

        this.#upsertPreviewField(
            previewChart,
            'cards',
            previewCards.map((card) => card.id),
            true,
        );
        previewChart.references = previewCards;

        cache.remove(previewChartId);
        previewCards.forEach((card) => cache.remove(card.id));
        previewCards.forEach((card) => cache.add(card, false));
        cache.add(previewChart, false);
        this.#previewCacheIds.add(previewChartId);
        previewCards.forEach((card) => this.#previewCacheIds.add(card.id));
        return previewChartId;
    }

    #evictPreviewCache() {
        if (!this.#previewCacheIds.size) return;
        const cache = customElements.get('aem-fragment')?.cache;
        if (cache) {
            this.#previewCacheIds.forEach((id) => cache.remove(id));
        }
        this.#previewCacheIds.clear();
    }

    #stickyOffsetAttribute() {
        const { table } = this.#getDocument();
        return table?.getAttribute('sticky-offset')?.trim() || table?.getAttribute('sticky-top')?.trim() || '';
    }

    #renderPreviewChart(previewFragmentId) {
        const expandedGroups = this.#expandedGroupsAttribute();
        const stickyOffset = this.#stickyOffsetAttribute();
        return html`
            <mas-compare-chart
                class="compchart-preview-chart"
                non-sticky
                consonant
                expanded-groups=${expandedGroups || nothing}
                sticky-offset=${stickyOffset || nothing}
            >
                <aem-fragment author loading="cache" fragment=${previewFragmentId}></aem-fragment>
            </mas-compare-chart>
        `;
    }

    #localeSummaryItems(columns) {
        const entries = [];
        for (const column of columns || []) {
            entries.push(...this.#localeTags(column.parentFragment), ...this.#localeTags(column.sourceFragment));
        }
        const seen = new Set();
        return entries.filter((entry) => {
            if (!entry?.code || seen.has(entry.code)) return false;
            seen.add(entry.code);
            return true;
        });
    }

    #localeTags(fragment) {
        const rawValues = [
            ...(fragment?.getFieldValues?.('pznTags') || []),
            ...(fragment?.getFieldValues?.('tags') || []),
            ...(fragment?.tags || []).map((tag) => tag?.id || tag),
        ];
        return rawValues
            .map((value) => this.#localeCodeFromTag(value))
            .filter(Boolean)
            .map((code) => {
                const locale = getLocaleByCode(code);
                return {
                    code,
                    label: locale ? `${locale.country} (${locale.lang.toUpperCase()})` : code,
                };
            });
    }

    #localeCodeFromTag(value) {
        if (typeof value !== 'string') return '';
        const token = value.split('/').pop()?.trim();
        return token && getLocaleByCode(token) ? token : '';
    }

    #renderPreviewLocaleSummary(columns) {
        const locales = this.#localeSummaryItems(columns);
        if (!locales.length) return nothing;
        const label = locales.map((locale) => locale.label).join(', ');
        return html`
            <div class="compchart-preview-locale-switcher">
                <span class="compchart-preview-locale-label">Preview card for:</span>
                <div class="compchart-preview-locale-field" title=${label}>
                    <span>${label}</span>
                </div>
            </div>
        `;
    }

    #ensurePreviewRoot() {
        if (this.#previewRoot?.isConnected) return this.#previewRoot;
        this.#previewRoot = this.querySelector(`[slot="${PREVIEW_SLOT}"]`);
        if (this.#previewRoot) return this.#previewRoot;
        this.#previewRoot = document.createElement('div');
        this.#previewRoot.slot = PREVIEW_SLOT;
        this.#previewRoot.className = 'compchart-light-dom-preview';
        this.append(this.#previewRoot);
        return this.#previewRoot;
    }

    #clearLightDomPreview() {
        this.#evictPreviewCache();
        this.#lastPreviewSignature = '';
        if (!this.#previewRoot) return;
        litRender(nothing, this.#previewRoot);
        this.#previewRoot.remove();
        this.#previewRoot = null;
    }

    #previewSignature(columns) {
        // Cheap structural hash of preview inputs — skip rebuild when unchanged.
        return JSON.stringify({
            chart: this.fragmentStore?.previewStore?.get?.()?.id ?? this.fragment?.id ?? '',
            value: this.effectiveValue,
            columns: columns.map((c) => ({
                path: c.path,
                id: c.fragment?.id ?? c.sourceFragment?.id ?? '',
                features: c.features ?? [],
            })),
        });
    }

    #syncLightDomPreview() {
        if (this.editorView !== 'preview') {
            this.#clearLightDomPreview();
            return;
        }
        const groups = this.#parse();
        if (!groups.length) {
            this.#clearLightDomPreview();
            return;
        }
        const columns = this.effectiveColumns;
        const signature = this.#previewSignature(columns);
        if (signature === this.#lastPreviewSignature && this.#previewRoot?.isConnected) return;
        const previewFragmentId = this.#previewFragmentId(columns);
        if (!previewFragmentId) {
            this.#clearLightDomPreview();
            return;
        }
        this.#lastPreviewSignature = signature;
        const previewRoot = this.#ensurePreviewRoot();
        litRender(this.#renderPreviewChart(previewFragmentId), previewRoot);
        previewRoot
            .querySelector('mas-compare-chart')
            ?.dispatchEvent(new CustomEvent(EVENT_COMPARE_CHART_REHYDRATE, { bubbles: true }));
    }

    #renderPreviewView(groups, columns) {
        if (!groups.length) {
            return html`<div class="compchart-preview-empty">No compare chart content to preview.</div>`;
        }

        return html`
            <div class="compchart-preview">
                ${this.#renderPreviewLocaleSummary(columns)}
                <slot name=${PREVIEW_SLOT}></slot>
            </div>
        `;
    }

    render() {
        const groups = this.#parse();
        const columns = this.effectiveColumns;
        return html`
            <div class="compchart-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2>Create compare chart</h2>
                        <slot name="field-status"></slot>
                    </div>
                    ${this.#viewToggle}
                </div>
                ${this.editorView === 'preview'
                    ? this.#renderPreviewView(groups, columns)
                    : this.#renderEditView(groups, columns)}
            </div>
        `;
    }

    #renderInlineRte(editor, key) {
        const activeEditor = this.activeRteEditor?.key === key ? this.activeRteEditor : editor;
        const style = [
            `--rte-toolbar-top: ${activeEditor?.toolbarTop || 8}px`,
            `--rte-toolbar-left: ${activeEditor?.toolbarLeft || 8}px`,
        ].join('; ');
        const changeHandler =
            editor.kind === 'section'
                ? (event) => this.#handleGroupLabelChange(editor.group, event)
                : editor.kind === 'row'
                  ? (event) => this.#handleRowLabelChange(editor.group, editor.feature, event)
                  : (event) => this.#handleCellChange(editor.group, editor.feature, editor.cardPath, event);
        return html`
            <rte-field
                class="compchart-active-rte"
                style=${style}
                inline
                link
                emoji
                styling
                floating-toolbar
                data-rte-key=${key}
                data-group=${editor.group}
                data-feature=${editor.feature}
                data-card-path=${editor.cardPath || ''}
                .marks=${COMPARE_CHART_RTE_MARKS}
                .value=${activeEditor.value}
                @change=${changeHandler}
                @focusout=${(event) => this.#deactivateRteCell(key, event)}
                @keydown=${(event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        this.#cancelActiveRteCell(key, event);
                    }
                }}
            ></rte-field>
        `;
    }

    #renderGroup(group, columns, index, expandedGroups) {
        const expanded = expandedGroups.has(group.name);
        const key = this.#editableCellKey('section', group.name, 'title');
        const displayHtml = this.#displayHtml(group.labelHtml);
        const editor = { kind: 'section', group: group.name, feature: 'title', value: group.labelHtml };
        return html`
            <div
                class="compchart-group-header ${index > 0 ? 'section-spaced' : ''}"
                @dragover=${(event) => this.#handleGroupDragOver(event, group.name)}
                @dragleave=${this.#handleGroupDragLeave}
                @drop=${(event) => this.#handleGroupDrop(event, group.name)}
            >
                <span
                    class="compchart-group-handle"
                    draggable="true"
                    title="Reorder group"
                    aria-label="Reorder group"
                    @dragstart=${(event) => this.#handleGroupDragStart(event, group.name)}
                    @dragend=${this.#handleGroupDragEnd}
                >
                    ${dragHandleIcon}
                </span>
                <button class="compchart-chevron" @click=${() => this.#toggleGroup(group.name)} title="Toggle group">
                    ${expanded
                        ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                        : html`<sp-icon-chevron-right></sp-icon-chevron-right>`}
                </button>
                <div
                    class="compchart-cell-value compchart-group-title"
                    role="textbox"
                    aria-readonly="true"
                    tabindex="0"
                    data-rte-key=${key}
                    data-rte-anchor-key=${key}
                    @click=${(event) => this.#activateRteCell(key, event.currentTarget, editor)}
                    @keydown=${(event) => this.#handleStaticRteKeydown(key, editor, event)}
                >
                    ${this.activeRteCell === key
                        ? this.#renderInlineRte(editor, key)
                        : html`<p>
                              ${displayHtml
                                  ? unsafeHTML(displayHtml)
                                  : html`<span class="compchart-rte-placeholder">Click to edit</span>`}
                          </p>`}
                </div>
                <sp-action-button quiet title="Add row" label="Add row" @click=${() => this.#addRow(group.name)}>
                    <sp-icon-add slot="icon"></sp-icon-add>
                </sp-action-button>
                <sp-action-button quiet title="Remove group" label="Remove group" @click=${() => this.#removeGroup(group.name)}>
                    <sp-icon-delete slot="icon"></sp-icon-delete>
                </sp-action-button>
            </div>
            ${expanded ? group.rows.map((row) => this.#renderRow(group, row, columns)) : nothing}
        `;
    }

    #renderRow(group, row, columns) {
        const key = this.#editableCellKey('row', group.name, row.name);
        const displayHtml = this.#displayHtml(row.html);
        const editor = { kind: 'row', group: group.name, feature: row.name, value: row.html };
        return html`
            <div
                class="compchart-row-label"
                @dragover=${(event) => this.#handleFeatureDragOver(event, group.name, row.name)}
                @dragleave=${this.#handleFeatureDragLeave}
                @drop=${(event) => this.#handleFeatureDrop(event, group.name, row.name)}
            >
                <span
                    class="compchart-feature-handle"
                    draggable="true"
                    title="Reorder feature"
                    aria-label="Reorder feature"
                    @dragstart=${(event) => this.#handleFeatureDragStart(event, group.name, row.name)}
                    @dragend=${this.#handleFeatureDragEnd}
                >
                    ${dragHandleIcon}
                </span>
                <div
                    class="compchart-cell-value"
                    role="textbox"
                    aria-readonly="true"
                    tabindex="0"
                    data-rte-key=${key}
                    data-rte-anchor-key=${key}
                    @click=${(event) => this.#activateRteCell(key, event.currentTarget, editor)}
                    @keydown=${(event) => this.#handleStaticRteKeydown(key, editor, event)}
                >
                    ${this.activeRteCell === key
                        ? this.#renderInlineRte(editor, key)
                        : html`<p>
                              ${displayHtml
                                  ? unsafeHTML(displayHtml)
                                  : html`<span class="compchart-rte-placeholder">Click to edit</span>`}
                          </p>`}
                </div>
                <div class="compchart-row-actions">
                    <sp-action-button
                        quiet
                        size="s"
                        title="Remove row"
                        label="Remove row"
                        @click=${() => this.#removeRow(group.name, row.name)}
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                    </sp-action-button>
                </div>
            </div>
            ${columns.map((column) => this.#renderCell(group, row, column))}
        `;
    }

    #renderCell(group, row, column) {
        const cellHtml = this.#cellHtmlForColumnFeature(column, group.name, row.name);
        const innerHtml = this.#cellInnerHtml(cellHtml);
        const key = this.#editableCellKey('cell', group.name, row.name, column.path);
        const displayHtml = this.#displayHtml(innerHtml);
        const overridden = this.#isFeatureOverridden(column, group.name, row.name);
        const editor = {
            kind: 'cell',
            group: group.name,
            feature: row.name,
            cardPath: column.path,
            value: `<p>${innerHtml}</p>`,
        };
        return html`
            <div class="compchart-cell ${overridden ? 'compchart-overridden-cell' : ''}">
                <div
                    class="compchart-cell-value"
                    role="textbox"
                    aria-readonly="true"
                    tabindex="0"
                    data-rte-key=${key}
                    data-rte-anchor-key=${key}
                    @click=${(event) => this.#activateRteCell(key, event.currentTarget, editor)}
                    @keydown=${(event) => this.#handleStaticRteKeydown(key, editor, event)}
                >
                    ${this.activeRteCell === key
                        ? this.#renderInlineRte(editor, key)
                        : html`<p>
                              ${displayHtml
                                  ? unsafeHTML(displayHtml)
                                  : html`<span class="compchart-rte-placeholder">Click to edit</span>`}
                          </p>`}
                </div>
                ${overridden
                    ? html`<sp-action-button
                          quiet
                          size="s"
                          class="compchart-cell-restore"
                          label="Restore cell"
                          title="Restore cell"
                          @click=${(event) => this.#restoreCellFeature(column, group.name, row.name, event)}
                      >
                          <sp-icon-unlink slot="icon"></sp-icon-unlink>
                      </sp-action-button>`
                    : nothing}
            </div>
        `;
    }

    #renderCardsSection(columns) {
        const paths = this.#cardPaths;
        const columnsByPath = new Map(columns.map((c) => [c.parentPath || c.path, c]));
        return html`
            <div
                class="compchart-cards-section"
                @dragover=${this.#handleCardSectionDragOver}
                @dragleave=${this.#handleCardSectionDragLeave}
                @drop=${this.#handleCardSectionDrop}
            >
                <div class="compchart-cards-header">
                    <h3 class="compchart-cards-title">Selected fragments *</h3>
                    <overlay-trigger type="modal" triggered-by="click">
                        ${this.#itemsSelectorDialog}
                        <sp-button slot="trigger" size="s" variant="secondary" quiet>
                            <sp-icon-edit slot="icon"></sp-icon-edit>
                            Edit
                        </sp-button>
                    </overlay-trigger>
                </div>
                ${paths.length
                    ? html`
                          <div class="compchart-cards-table-scroll">
                              <div class="compchart-cards-table">
                                  <div class="compchart-cards-table-head" aria-hidden="true">
                                      <span aria-hidden="true"></span>
                                      <span>Offer</span>
                                      <span>Fragment title</span>
                                      <span>Offer ID</span>
                                      <span>Path</span>
                                      <span>Status</span>
                                  </div>
                                  ${repeat(
                                      paths,
                                      (path) => path,
                                      (path, index) => {
                                          const column = columnsByPath.get(path);
                                          const fragment = column?.parentFragment || column?.fragment;
                                          if (!fragment) return nothing;
                                          const expanded = this.expandedCards.has(path);
                                          return html`
                                              <div
                                                  class="compchart-card-row"
                                                  @click=${(event) => this.#selectParentCard(event, path)}
                                                  @dblclick=${(event) => this.#openCardFragment(event, fragment)}
                                                  @dragover=${this.#handleCardDragOver}
                                                  @dragleave=${this.#handleCardDragLeave}
                                                  @drop=${(event) => this.#handleCardItemDrop(event, index)}
                                              >
                                                  <div class="compchart-card-cell compchart-card-cell-controls">
                                                      <span
                                                          class="compchart-card-handle"
                                                          draggable="true"
                                                          title="Reorder fragment"
                                                          aria-label="Reorder fragment"
                                                          @dragstart=${(event) => this.#handleCardDragStart(event, index)}
                                                          @dragend=${this.#handleCardDragEnd}
                                                      >
                                                          ${dragHandleIcon}
                                                      </span>
                                                      <sp-action-button
                                                          quiet
                                                          size="s"
                                                          label=${expanded ? 'Collapse row' : 'Expand row'}
                                                          @click=${(event) => this.#toggleCardExpanded(event, path)}
                                                      >
                                                          ${expanded
                                                              ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                                                              : html`<sp-icon-chevron-right
                                                                    slot="icon"
                                                                ></sp-icon-chevron-right>`}
                                                      </sp-action-button>
                                                  </div>
                                                  <div class="compchart-card-cell">${this.#renderCardOffer(fragment)}</div>
                                                  <div class="compchart-card-cell compchart-card-title compchart-truncate">
                                                      ${this.#fragmentTitle(fragment)}
                                                  </div>
                                                  <div class="compchart-card-cell compchart-card-offer-id">
                                                      ${this.#renderCardOfferId(fragment)}
                                                  </div>
                                                  <div class="compchart-card-cell compchart-card-path compchart-truncate">
                                                      ${this.#authorPath(fragment)}
                                                  </div>
                                                  <div class="compchart-card-cell">${this.#renderCardStatus(fragment)}</div>
                                              </div>
                                              ${expanded ? this.#renderVariationPanel(fragment, path) : nothing}
                                          `;
                                      },
                                  )}
                              </div>
                          </div>
                      `
                    : nothing}
            </div>
            ${this.#renderRemoveCardDialog(columnsByPath)}
        `;
    }
}

customElements.define('mas-compare-chart-editor', MasCompareChartEditor);
