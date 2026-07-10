import { LitElement, html, nothing, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import StoreController from '../reactivity/store-controller.js';
import Store from '../store.js';
import { getItemsSelectionStore } from '../common/items-selection-store.js';
import { SURFACES, TABLE_TYPE, VARIATION_TAB_NAME } from '../constants.js';
import { toggleSidebarIcon } from '../icons.js';
import '../common/components/mas-select-items-table.js';
import './mas-promotions-items-table.js';
import '../common/components/mas-selected-items.js';
import '../common/components/mas-search-and-filters.js';
import { styles } from '../common/components/mas-items-selector.css.js';
import { debounce, isUUID } from '../utils.js';
import {
    applyPromotionOfferProductTagsToSearch,
    collectPromotionOfferProductTags,
    normalizePromotionSearchInput,
} from './promotion-editor-utils.js';
import { renderFragmentStatusCell, getStudioFragmentDisplayPath } from '../common/utils/render-utils.js';

const OFFER_FILTER_ALL = 'all';

const PROMOTION_PICKER_TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragments' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collections' },
];

const PROMOTION_VIEW_TABS = [
    { value: TABLE_TYPE.OFFERS, label: 'Offers' },
    { value: TABLE_TYPE.CARDS, label: 'Fragments' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collections' },
];

const promotionsItemsSelectorStyles = css`
    mas-promotions-items-table {
        flex: 1;
        min-width: 0;
        min-height: 0;
        width: 100%;
        align-self: stretch;
        display: flex;
    }

    :host([view-only]) {
        min-height: auto;
        max-height: none;
        min-width: 0;
    }

    :host([view-only]) sp-tabs,
    :host([view-only]) sp-tab-panel[selected] {
        flex: 0 1 auto;
    }

    :host([view-only]) mas-promotions-items-table {
        flex: 0 1 auto;
    }

    .selected-items-count {
        bottom: 128px;
        pointer-events: auto;
    }
`;

class MasPromotionsItemsSelector extends LitElement {
    static styles = [styles, promotionsItemsSelectorStyles];

    static properties = {
        viewOnly: { type: Boolean, reflect: true, attribute: 'view-only' },
        searchQuery: { type: String, state: true },
        selectedTab: { type: String, state: true },
        activeFilterOfferId: { type: String, state: true },
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
        fragmentSurfaceOptions: { type: Array },
    };

    constructor() {
        super();
        this.viewOnly = false;
        this.searchQuery = '';
        this.selectedTab = TABLE_TYPE.CARDS;
        this.activeFilterOfferId = '';
        this.getDisplayName = getStudioFragmentDisplayPath;
        this.renderFragmentStatusCell = renderFragmentStatusCell;
        this.fragmentSurfaceOptions = [];
        this.itemPickerSurface = new StoreController(this, Store.promotions.itemPickerSurface);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('sp-opened', this.#stopPropagation);
        const s = getItemsSelectionStore();
        this.storeController = new ReactiveController(this, [
            s.inEdit,
            s.showSelected,
            s.selectedOffers,
            s.selectedCards,
            s.selectedCollections,
            s.selectedPlaceholders,
        ]);
        if (!this.viewOnly) {
            new ReactiveController(this, [s.selectedOffers], this.#onSelectedOffersChange);
            this.#syncOfferProductTagsToFragmentSearch();
        }
    }

    #onSelectedOffersChange = () => {
        if (!this.viewOnly) {
            const s = getItemsSelectionStore({ allowUnset: true });
            if (this.activeFilterOfferId && !s?.selectedOffers.value.includes(this.activeFilterOfferId)) {
                this.activeFilterOfferId = '';
            }
            this.#syncOfferProductTagsToFragmentSearch();
        }
    };
    #stopPropagation(event) {
        event.stopPropagation();
    }

    get showSelected() {
        return getItemsSelectionStore().showSelected.value;
    }

    get selectedCount() {
        const s = getItemsSelectionStore();
        return [...s.selectedCards.value, ...s.selectedPlaceholders.value, ...s.selectedCollections.value].length;
    }

    #toggleShowSelected() {
        getItemsSelectionStore().showSelected.set(!this.showSelected);
    }

    #setSearchQuery = debounce((value) => {
        this.searchQuery = value;
        this.#syncPromotionSearchToRepository(value);
    }, 300);

    #clearSearchUuidMeta() {
        Store.search.removeMeta('uuid-query');
        Store.search.removeMeta('uuid-path');
        Store.filters.removeMeta('uuid-query');
        Store.filters.removeMeta('uuid-locale');
    }

    #syncPromotionSearchToRepository(normalized) {
        if (isUUID(normalized)) {
            Store.search.set((prev) => ({ ...prev, query: normalized }));
            return;
        }
        if (!normalized) {
            this.#clearSearchUuidMeta();
            Store.search.set((prev) => ({ ...prev, query: '' }));
            return;
        }
    }

    #handleSearchInput(e) {
        const search = e.currentTarget;
        const raw = search?.value ?? '';
        const normalized = normalizePromotionSearchInput(raw);
        if (normalized !== raw && search) search.value = normalized;
        this.#setSearchQuery(normalized);
    }

    #handleSearchSubmit(e) {
        e.preventDefault();
        const search = e.currentTarget;
        const raw = search?.value ?? '';
        const normalized = normalizePromotionSearchInput(raw);
        if (normalized !== raw && search) search.value = normalized;
        this.searchQuery = normalized;
        this.#syncPromotionSearchToRepository(normalized);
    }

    #handleTabChange({ target: { selected } }) {
        this.selectedTab = selected;
        this.dispatchEvent(
            new CustomEvent('promotion-items-tab-change', {
                detail: { tab: this.selectedTab },
                bubbles: true,
                composed: true,
            }),
        );
    }

    get #tabs() {
        return this.viewOnly ? PROMOTION_VIEW_TABS : PROMOTION_PICKER_TABS;
    }

    #getSelectionStoreKey(tabValue) {
        if (tabValue === TABLE_TYPE.OFFERS) return 'selectedOffers';
        const valueUppercase = tabValue.charAt(0).toUpperCase() + tabValue.slice(1);
        return `selected${valueUppercase}`;
    }

    #getTabLabel(tab) {
        if (this.viewOnly) {
            const count = getItemsSelectionStore()[this.#getSelectionStoreKey(tab.value)].value.length;
            return `${tab.label} (${count})`;
        }
        return tab.label;
    }

    #showToast({ detail: { text, variant } }) {
        const toast = this.shadowRoot.querySelector('sp-toast');
        if (toast) {
            toast.textContent = text;
            toast.variant = variant;
            toast.open = true;
        }
    }

    #surfaceLabel(surfaceKey) {
        const entry = Object.values(SURFACES).find((s) => s.name === surfaceKey);
        return entry?.label ?? surfaceKey;
    }

    #onPromotionItemSurfaceChange(event) {
        const value = event.detail?.value ?? event.target?.value ?? event.target?.selectedItem?.value ?? '';
        if (!value) return;
        Store.promotions.itemPickerSurface.set(value);
        const repo = document.querySelector('mas-repository');
        Store.fragments.list.data.set([]);
        Store.fragments.list.hasMore.set(false);
        const s = Store.promotions;
        s.allCards.set([]);
        s.displayCards.set([]);
        s.groupedVariationsByParent.set(new Map());
        s.groupedVariationsData.set(new Map());
        s.allCollections.set([]);
        s.allCollections.setMeta('loaded', false);
        s.displayCollections.set([]);
        this.#syncOfferProductTagsToFragmentSearch();
        repo?.loadAllCollections?.();
        repo?.loadPlaceholders?.();
    }

    get #activeFilterIds() {
        const s = getItemsSelectionStore({ allowUnset: true });
        const all = s?.selectedOffers.value ?? [];
        return this.activeFilterOfferId ? [this.activeFilterOfferId] : all;
    }

    get #offerFilterOptions() {
        const s = getItemsSelectionStore({ allowUnset: true });
        return (s?.selectedOffers.value ?? []).map((id) => ({
            id,
            label: Store.promotions.offerDataCache.get(id)?.getTagTitle?.('product_code') ?? id,
        }));
    }

    #handleOfferFilterChange = (e) => {
        e.stopPropagation();
        const val = e.detail.value;
        this.activeFilterOfferId = val === OFFER_FILTER_ALL ? '' : (val ?? '');
        this.#syncOfferProductTagsToFragmentSearch();
    };

    get #offerProductTags() {
        return collectPromotionOfferProductTags(Store.promotions.offerDataCache, this.#activeFilterIds);
    }

    #syncOfferProductTagsToFragmentSearch() {
        const s = getItemsSelectionStore({ allowUnset: true });
        if (!s) return [];
        const tags = applyPromotionOfferProductTagsToSearch(Store.promotions.offerDataCache, this.#activeFilterIds);
        const filters = this.renderRoot.querySelectorAll('mas-search-and-filters');
        filters.forEach((el) => {
            if (el.type === TABLE_TYPE.CARDS) {
                el.productFilter = tags;
            }
        });
        if (Store.promotions.itemPickerSurface.get()) {
            document.querySelector('mas-repository')?.searchFragments?.();
        }
        return tags;
    }

    resetFilters() {
        this.renderRoot.querySelectorAll('mas-search-and-filters').forEach((el) => el.resetFilters());
        this.#syncOfferProductTagsToFragmentSearch();
    }

    render() {
        if (!getItemsSelectionStore({ allowUnset: true })) return nothing;
        const count = this.selectedCount;
        const showingSelection = this.showSelected && count;
        const toggleLabel = showingSelection ? 'Hide selection' : 'Selected items';
        const showSurfacePicker = !this.viewOnly && this.fragmentSurfaceOptions?.length > 1;
        const promotionSurfaceOptions = showSurfacePicker
            ? this.fragmentSurfaceOptions.map((key) => ({ id: key, title: this.#surfaceLabel(key) }))
            : [];
        const surfacePickerValue =
            this.itemPickerSurface.value && this.fragmentSurfaceOptions.includes(this.itemPickerSurface.value)
                ? this.itemPickerSurface.value
                : this.fragmentSurfaceOptions[0];
        return html`
            ${this.viewOnly
                ? nothing
                : html`
                      <div class="dialog-header">
                          <h2>Select items</h2>
                          <sp-search
                              size="m"
                              placeholder="Search..."
                              @input=${this.#handleSearchInput}
                              @submit=${this.#handleSearchSubmit}
                          ></sp-search>
                      </div>
                  `}
            <sp-tabs quiet .selected=${this.selectedTab} @change=${this.#handleTabChange}>
                ${repeat(
                    this.#tabs,
                    (tab) => tab.value,
                    (tab) => html`<sp-tab value=${tab.value} label=${tab.label}>${this.#getTabLabel(tab)}</sp-tab>`,
                )}
                ${repeat(
                    this.#tabs,
                    (tab) => tab.value,
                    (tab) => html`
                        <sp-tab-panel value=${tab.value} class=${this.viewOnly ? 'view-only' : ''}>
                            ${this.viewOnly
                                ? nothing
                                : html`
                                      <mas-search-and-filters
                                          .type=${tab.value}
                                          .searchQuery=${tab.value === this.selectedTab ? this.searchQuery : ''}
                                          .searchOnly=${[TABLE_TYPE.PLACEHOLDERS, TABLE_TYPE.COLLECTIONS].includes(tab.value)}
                                          .promotionSurfaceOptions=${promotionSurfaceOptions}
                                          .promotionSurface=${surfacePickerValue ?? ''}
                                          .productFilter=${tab.value === TABLE_TYPE.CARDS ? this.#offerProductTags : []}
                                          .offerFilterOptions=${tab.value === TABLE_TYPE.CARDS ? this.#offerFilterOptions : []}
                                          .offerFilterValue=${this.activeFilterOfferId}
                                          @promotion-surface-change=${this.#onPromotionItemSurfaceChange}
                                          @offer-filter-change=${this.#handleOfferFilterChange}
                                      ></mas-search-and-filters>
                                  `}
                            <div
                                class="container ${this.viewOnly ? 'view-only' : ''} ${showingSelection ? 'show-selected' : ''}"
                            >
                                ${this.viewOnly
                                    ? html`<mas-promotions-items-table
                                          .type=${tab.value}
                                          .getDisplayName=${this.getDisplayName}
                                          .renderFragmentStatusCell=${this.renderFragmentStatusCell}
                                          @show-toast=${this.#showToast}
                                          @promotion-offer-removed=${() =>
                                              this.dispatchEvent(
                                                  new CustomEvent('promotion-offer-removed', {
                                                      bubbles: true,
                                                      composed: true,
                                                  }),
                                              )}
                                      ></mas-promotions-items-table>`
                                    : html`<mas-select-items-table
                                          .viewOnly=${false}
                                          .type=${tab.value}
                                          .getDisplayName=${this.getDisplayName}
                                          .renderFragmentStatusCell=${this.renderFragmentStatusCell}
                                          .hidePromoVariations=${true}
                                          .tabs=${[{ label: 'Promotion', key: VARIATION_TAB_NAME.PROMOTION }]}
                                          .nonSelectableVariations=${[VARIATION_TAB_NAME.PROMOTION]}
                                          @show-toast=${this.#showToast}
                                      ></mas-select-items-table>`}
                                ${this.viewOnly
                                    ? nothing
                                    : html`<mas-selected-items .getDisplayName=${this.getDisplayName}></mas-selected-items>`}
                            </div>
                            <sp-toast timeout="6000" @close=${(event) => event.stopPropagation()}></sp-toast>
                        </sp-tab-panel>
                    `,
                )}
            </sp-tabs>

            ${this.viewOnly
                ? nothing
                : html`
                      <div class="selected-items-count">
                          <sp-button
                              variant="secondary"
                              @click=${this.#toggleShowSelected}
                              ?disabled=${!count}
                              class="ghost-button"
                          >
                              <sp-icon slot="icon" label=${toggleLabel} class=${showingSelection ? 'flipped' : ''}>
                                  ${toggleSidebarIcon}
                              </sp-icon>
                              ${toggleLabel} (${count})
                          </sp-button>
                      </div>
                  `}
        `;
    }
}

customElements.define('mas-promotions-items-selector', MasPromotionsItemsSelector);
