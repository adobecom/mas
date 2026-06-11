import { LitElement, html, nothing, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import StoreController from '../reactivity/store-controller.js';
import Store from '../store.js';
import { getItemsSelectionStore } from '../common/items-selection-store.js';
import { SURFACES, TABLE_TYPE } from '../constants.js';
import { toggleSidebarIcon } from '../icons.js';
import '../common/components/mas-select-items-table.js';
import './mas-promotions-items-table.js';
import '../common/components/mas-selected-items.js';
import '../common/components/mas-search-and-filters.js';
import { styles } from '../common/components/mas-items-selector.css.js';
import { debounce, isUUID } from '../utils.js';
import { normalizePromotionSearchInput } from './promotion-editor-utils.js';
import { renderFragmentStatusCell, getStudioFragmentDisplayPath } from '../common/utils/render-utils.js';

const PROMOTION_TABS = [
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

    .selected-items-count {
        bottom: 128px;
        pointer-events: auto;
    }
`;

class MasPromotionsItemsSelector extends LitElement {
    static styles = [styles, promotionsItemsSelectorStyles];

    static properties = {
        viewOnly: { type: Boolean, state: true },
        searchQuery: { type: String, state: true },
        selectedTab: { type: String, state: true },
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
        fragmentSurfaceOptions: { type: Array },
    };

    constructor() {
        super();
        this.viewOnly = false;
        this.searchQuery = '';
        this.selectedTab = TABLE_TYPE.CARDS;
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
            s.selectedCards,
            s.selectedCollections,
            s.selectedPlaceholders,
        ]);
    }

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

    #getTabLabel(tab) {
        if (this.viewOnly) {
            const valueUppercase = tab.value.charAt(0).toUpperCase() + tab.value.slice(1);
            return `${tab.label} (${getItemsSelectionStore()[`selected${valueUppercase}`].value.length})`;
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
        repo?.searchFragments?.();
        repo?.loadAllCollections?.();
        repo?.loadPlaceholders?.();
    }

    resetFilters() {
        this.renderRoot.querySelectorAll('mas-search-and-filters').forEach((el) => el.resetFilters());
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
                    PROMOTION_TABS,
                    (tab) => tab.value,
                    (tab) => html`<sp-tab value=${tab.value} label=${tab.label}>${this.#getTabLabel(tab)}</sp-tab>`,
                )}
                ${repeat(
                    PROMOTION_TABS,
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
                                          @promotion-surface-change=${this.#onPromotionItemSurfaceChange}
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
                                      ></mas-promotions-items-table>`
                                    : html`<mas-select-items-table
                                          .viewOnly=${false}
                                          .type=${tab.value}
                                          .disableCardExpansion=${true}
                                          .getDisplayName=${this.getDisplayName}
                                          .renderFragmentStatusCell=${this.renderFragmentStatusCell}
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
