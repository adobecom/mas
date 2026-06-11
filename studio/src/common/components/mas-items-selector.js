import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import { CARD_MODEL_PATH, TABLE_TYPE } from '../../constants.js';
import { toggleSidebarIcon } from '../../icons.js';
import { Fragment } from '../../aem/fragment.js';
import { renderFragmentStatusCell, getStudioFragmentDisplayPath } from '../utils/render-utils.js';
import './mas-select-items-table.js';
import './mas-selected-items.js';
import './mas-search-and-filters.js';
import { styles } from './mas-items-selector.css.js';
import { debounce } from '../../utils.js';

export const TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragments' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collections' },
    { value: TABLE_TYPE.PLACEHOLDERS, label: 'Placeholders' },
];

class MasItemsSelector extends LitElement {
    static styles = styles;

    static properties = {
        viewOnly: { type: Boolean, state: true },
        hideSelectedToggle: { type: Boolean, attribute: 'hide-selected-toggle' },
        searchQuery: { type: String, state: true },
        selectedTab: { type: String, state: true },
        allowedTypes: { type: Array, attribute: false },
        maxSelectedCards: { type: Number, attribute: 'max-selected-cards' },
        lockedTemplateFilter: { type: String, attribute: 'locked-template-filter' },
        defaultTemplateFilter: { type: String, attribute: 'default-template-filter' },
        disableGroupedVariationSelection: { type: Boolean, attribute: 'disable-grouped-variation-selection' },
        hideLocaleTab: { type: Boolean, attribute: 'hide-locale-tab' },
        disableLocaleVariations: { type: Boolean, attribute: 'disable-locale-variations' },
        /** @type {(fragmentData: object) => string} */
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
    };

    constructor() {
        super();
        this.viewOnly = false;
        this.hideSelectedToggle = false;
        this.searchQuery = '';
        this.selectedTab = TABLE_TYPE.CARDS;
        this.allowedTypes = TABS.map((tab) => tab.value);
        this.maxSelectedCards = Infinity;
        this.lockedTemplateFilter = '';
        this.defaultTemplateFilter = '';
        this.disableGroupedVariationSelection = false;
        this.hideLocaleTab = false;
        this.disableLocaleVariations = false;
        this.getDisplayName = getStudioFragmentDisplayPath;
        this.renderFragmentStatusCell = renderFragmentStatusCell;
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
            s.displayCards,
            s.displayCollections,
            s.displayPlaceholders,
        ].filter(Boolean));
    }

    #stopPropagation(event) {
        event.stopPropagation();
    }

    get showSelected() {
        return getItemsSelectionStore().showSelected.value;
    }

    get selectedCount() {
        const s = getItemsSelectionStore();
        return this.tabs.reduce((count, tab) => count + s[`selected${this.#typeUppercased(tab.value)}`].value.length, 0);
    }

    get tabs() {
        const allowedTypes = this.allowedTypes?.length ? this.allowedTypes : TABS.map((tab) => tab.value);
        return TABS.filter((tab) => allowedTypes.includes(tab.value));
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    #typeUppercased(type) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    #queryFromMerchCardStudioUrl(value) {
        const trimmed = String(value || '').trim();
        if (!trimmed) return '';
        let url;
        try {
            url = new URL(trimmed, window.location.origin);
        } catch {
            return '';
        }
        const hash = url.hash?.replace(/^#/, '');
        if (!hash) return '';
        const params = new URLSearchParams(hash);
        if (params.get('content-type') !== 'merch-card') return '';
        return params.get('query')?.trim() || '';
    }

    #upsertDisplayCard(fragmentData) {
        if (!fragmentData?.path || fragmentData.model?.path !== CARD_MODEL_PATH) return;
        const store = getItemsSelectionStore();
        const fragment = {
            ...fragmentData,
            studioPath: this.getDisplayName(new Fragment(fragmentData)),
        };
        const upsert = (items = []) => [fragment, ...items.filter((item) => item.path !== fragment.path)];
        store.cardsByPaths.set(new Map(store.cardsByPaths.value).set(fragment.path, fragment));
        store.displayCards.set(upsert(store.displayCards.value));
        store.allCards.set(upsert(store.allCards.value));
        return fragment;
    }

    #appendSelectedCard(fragment) {
        if (!fragment?.path) return;
        const store = getItemsSelectionStore();
        const selectedCards = store.selectedCards.value || [];
        if (selectedCards.includes(fragment.path)) return;
        if (selectedCards.length >= this.maxSelectedCards) {
            this.#openToast(`You can select up to ${this.maxSelectedCards} cards.`, 'negative');
            return;
        }
        store.selectedCards.set([...selectedCards, fragment.path]);
    }

    async #handleMerchCardUrl(value, search) {
        const id = this.#queryFromMerchCardStudioUrl(value);
        if (!id) return false;
        search.value = '';
        this.searchQuery = '';
        const fragment = await this.repository?.aem?.sites?.cf?.fragments?.getById?.(id);
        this.#appendSelectedCard(this.#upsertDisplayCard(fragment));
        return true;
    }

    get currentTabResultCount() {
        const s = getItemsSelectionStore();
        const tab = this.selectedTab;
        if (tab === TABLE_TYPE.CARDS) return s.displayCards?.value?.length ?? 0;
        if (tab === TABLE_TYPE.COLLECTIONS) return s.displayCollections?.value?.length ?? 0;
        if (tab === TABLE_TYPE.PLACEHOLDERS) return s.displayPlaceholders?.value?.length ?? 0;
        return 0;
    }

    #toggleShowSelected() {
        getItemsSelectionStore().showSelected.set(!this.showSelected);
    }

    #setSearchQuery = debounce((value) => {
        this.searchQuery = value;
    }, 300);

    async #handleSearchInput(e) {
        const search = e.currentTarget;
        const value = search?.value ?? '';
        if (this.selectedTab === TABLE_TYPE.CARDS && (await this.#handleMerchCardUrl(value, search))) return;
        this.#setSearchQuery(value);
    }

    async #handleSearchSubmit(e) {
        e.preventDefault();
        const search = e.currentTarget;
        const value = search?.value ?? '';
        if (this.selectedTab === TABLE_TYPE.CARDS && (await this.#handleMerchCardUrl(value, search))) return;
        this.searchQuery = value;
    }

    #handleTabChange({ target: { selected } }) {
        this.selectedTab = selected;
    }

    #getTabLabel(tab) {
        if (this.viewOnly) {
            const valueUppercase = tab.value.charAt(0).toUpperCase() + tab.value.slice(1);
            return `${tab.label} (${getItemsSelectionStore()[`selected${valueUppercase}`].value.length})`;
        }
        return tab.label;
    }

    #openToast(text, variant = 'info') {
        const toast = this.shadowRoot.querySelector('sp-toast');
        if (toast) {
            toast.textContent = text;
            toast.variant = variant;
            toast.open = true;
        }
    }

    #showToast({ detail: { text, variant } }) {
        this.#openToast(text, variant);
    }

    #renderItemsTable(type) {
        return html`
            <mas-select-items-table
                type=${type}
                .viewOnly=${this.viewOnly}
                .type=${type}
                .maxSelectedCards=${this.maxSelectedCards}
                .disableGroupedVariationSelection=${this.disableGroupedVariationSelection}
                .hideLocaleTab=${this.hideLocaleTab}
                .disableLocaleVariations=${this.disableLocaleVariations}
                .getDisplayName=${this.getDisplayName}
                .renderFragmentStatusCell=${this.renderFragmentStatusCell}
                @show-toast=${this.#showToast}
            ></mas-select-items-table>
        `;
    }

    willUpdate() {
        const tabs = this.tabs;
        const next = tabs.some((tab) => tab.value === this.selectedTab) ? this.selectedTab : tabs[0]?.value || TABLE_TYPE.CARDS;
        if (next !== this.selectedTab) this.selectedTab = next;
    }

    render() {
        const count = this.selectedCount;
        const showingSelection = this.showSelected && count;
        const toggleLabel = showingSelection ? 'Hide selection' : 'Selected items';
        const tabs = this.tabs;
        return html`
            <sp-tabs quiet .selected=${this.selectedTab} @change=${this.#handleTabChange}>
                ${repeat(
                    tabs,
                    (tab) => tab.value,
                    (tab) => html`<sp-tab value=${tab.value} label=${tab.label}>${this.#getTabLabel(tab)}</sp-tab>`,
                )}
                ${repeat(
                    tabs,
                    (tab) => tab.value,
                    (tab) => html`
                        <sp-tab-panel value=${tab.value} class=${this.viewOnly ? 'view-only' : ''}>
                            ${this.viewOnly
                                ? nothing
                                : html`
                                      <div class="dialog-header">
                                          <sp-search
                                              size="m"
                                              placeholder="Search..."
                                              @input=${this.#handleSearchInput}
                                              @submit=${this.#handleSearchSubmit}
                                          ></sp-search>
                                      </div>
                                      <mas-search-and-filters
                                          .type=${tab.value}
                                          .searchQuery=${tab.value === this.selectedTab ? this.searchQuery : ''}
                                          .searchOnly=${[TABLE_TYPE.PLACEHOLDERS, TABLE_TYPE.COLLECTIONS].includes(tab.value)}
                                          .lockedTemplateFilter=${tab.value === TABLE_TYPE.CARDS
                                              ? this.lockedTemplateFilter
                                              : ''}
                                          .defaultTemplateFilter=${tab.value === TABLE_TYPE.CARDS
                                              ? this.defaultTemplateFilter
                                              : ''}
                                      ></mas-search-and-filters>
                                  `}
                            <div
                                class="container ${this.viewOnly ? 'view-only' : ''} ${showingSelection ? 'show-selected' : ''}"
                            >
                                ${this.#renderItemsTable(tab.value)}
                                ${this.viewOnly || !showingSelection
                                    ? nothing
                                    : html`<mas-selected-items
                                          class="selected-items-panel"
                                          .getDisplayName=${this.getDisplayName}
                                      ></mas-selected-items>`}
                            </div>
                            <sp-toast timeout="6000" @close=${(event) => event.stopPropagation()}></sp-toast>
                        </sp-tab-panel>
                    `,
                )}
            </sp-tabs>

            ${this.viewOnly || this.hideSelectedToggle
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

customElements.define('mas-items-selector', MasItemsSelector);
