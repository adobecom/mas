import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { TABLE_TYPE } from '../../constants.js';
import { toggleSidebarIcon } from '../../icons.js';
import './mas-items-table.js';
import './mas-items-selected-panel.js';
import './mas-items-search-filters.js';
import { styles } from './mas-item-selector.css.js';

export const TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragments' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collections' },
    { value: TABLE_TYPE.PLACEHOLDERS, label: 'Placeholders' },
];

/**
 * Item selector with tabs (Fragments / Collections / Placeholders).
 * Props-driven: receives all data as props, emits events for changes.
 *
 * @fires selection-changed - detail: { path: string, selected: boolean }
 * @fires load-variations - detail: { cardPath: string, variationPaths: string[] }
 *
 * @property {Array} cards - All card items
 * @property {Array} collections - All collection items
 * @property {Array} placeholders - All placeholder items
 * @property {Set} selectedCardPaths - Selected card paths
 * @property {Set} selectedCollectionPaths - Selected collection paths
 * @property {Set} selectedPlaceholderPaths - Selected placeholder paths
 * @property {Map} variationsByParent - Map of cardPath -> Map of variationPath -> variation
 * @property {boolean} viewOnly - Read-only mode
 * @property {boolean} loadingCards - Whether cards are loading
 * @property {boolean} loadingCollections - Whether collections are loading
 * @property {boolean} loadingPlaceholders - Whether placeholders are loading
 */
class MasItemSelector extends LitElement {
    static styles = styles;

    static properties = {
        cards: { type: Array },
        collections: { type: Array },
        placeholders: { type: Array },
        selectedCardPaths: { type: Object },
        selectedCollectionPaths: { type: Object },
        selectedPlaceholderPaths: { type: Object },
        variationsByParent: { type: Object },
        viewOnly: { type: Boolean },
        loadingCards: { type: Boolean },
        loadingCollections: { type: Boolean },
        loadingPlaceholders: { type: Boolean },
        showSelected: { type: Boolean, state: true },
        filteredCards: { type: Array, state: true },
        filteredCollections: { type: Array, state: true },
        filteredPlaceholders: { type: Array, state: true },
    };

    constructor() {
        super();
        this.cards = [];
        this.collections = [];
        this.placeholders = [];
        this.selectedCardPaths = new Set();
        this.selectedCollectionPaths = new Set();
        this.selectedPlaceholderPaths = new Set();
        this.variationsByParent = new Map();
        this.viewOnly = false;
        this.loadingCards = false;
        this.loadingCollections = false;
        this.loadingPlaceholders = false;
        this.showSelected = false;
        this.filteredCards = [];
        this.filteredCollections = [];
        this.filteredPlaceholders = [];
    }

    get selectedCount() {
        return this.selectedCardPaths.size + this.selectedCollectionPaths.size + this.selectedPlaceholderPaths.size;
    }

    get selectedItems() {
        const items = [];
        const addFromList = (list, paths) => {
            for (const path of paths) {
                const item = list.find((i) => i.path === path);
                if (item) items.push(item);
            }
        };
        addFromList(this.cards, this.selectedCardPaths);
        addFromList(this.collections, this.selectedCollectionPaths);
        addFromList(this.placeholders, this.selectedPlaceholderPaths);
        return items;
    }

    #getItemsForType(type) {
        switch (type) {
            case TABLE_TYPE.CARDS:
                return this.filteredCards.length ? this.filteredCards : this.cards;
            case TABLE_TYPE.COLLECTIONS:
                return this.filteredCollections.length ? this.filteredCollections : this.collections;
            case TABLE_TYPE.PLACEHOLDERS:
                return this.filteredPlaceholders.length ? this.filteredPlaceholders : this.placeholders;
            default:
                return [];
        }
    }

    #getSelectedPathsForType(type) {
        switch (type) {
            case TABLE_TYPE.CARDS:
                return this.selectedCardPaths;
            case TABLE_TYPE.COLLECTIONS:
                return this.selectedCollectionPaths;
            case TABLE_TYPE.PLACEHOLDERS:
                return this.selectedPlaceholderPaths;
            default:
                return new Set();
        }
    }

    #getLoadingForType(type) {
        switch (type) {
            case TABLE_TYPE.CARDS:
                return this.loadingCards;
            case TABLE_TYPE.COLLECTIONS:
                return this.loadingCollections;
            case TABLE_TYPE.PLACEHOLDERS:
                return this.loadingPlaceholders;
            default:
                return false;
        }
    }

    #getAllItemsForType(type) {
        switch (type) {
            case TABLE_TYPE.CARDS:
                return this.cards;
            case TABLE_TYPE.COLLECTIONS:
                return this.collections;
            case TABLE_TYPE.PLACEHOLDERS:
                return this.placeholders;
            default:
                return [];
        }
    }

    #handleFiltered(type, e) {
        switch (type) {
            case TABLE_TYPE.CARDS:
                this.filteredCards = e.detail.items;
                break;
            case TABLE_TYPE.COLLECTIONS:
                this.filteredCollections = e.detail.items;
                break;
            case TABLE_TYPE.PLACEHOLDERS:
                this.filteredPlaceholders = e.detail.items;
                break;
        }
    }

    #handleRemoveItem(e) {
        const { path } = e.detail;
        this.dispatchEvent(
            new CustomEvent('selection-changed', {
                detail: { path, selected: false },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #toggleShowSelected() {
        this.showSelected = !this.showSelected;
    }

    #showToast({ detail: { text, variant } }) {
        const toast = this.shadowRoot?.querySelector('sp-toast');
        if (toast) {
            toast.textContent = text;
            toast.variant = variant;
            toast.open = true;
        }
    }

    #getTabLabel(tab) {
        if (this.viewOnly) {
            return `${tab.label} (${this.#getSelectedPathsForType(tab.value).size})`;
        }
        return tab.label;
    }

    render() {
        return html`
            <sp-tabs quiet selected="cards">
                ${repeat(
                    TABS,
                    (tab) => tab.value,
                    (tab) => html`<sp-tab value=${tab.value} label=${tab.label}>${this.#getTabLabel(tab)}</sp-tab>`,
                )}
                ${repeat(
                    TABS,
                    (tab) => tab.value,
                    (tab) => html`
                        <sp-tab-panel value=${tab.value} class=${this.viewOnly ? 'view-only' : ''}>
                            ${this.viewOnly
                                ? nothing
                                : html`
                                      <mas-items-search-filters
                                          .type=${tab.value}
                                          .items=${this.#getAllItemsForType(tab.value)}
                                          .searchOnly=${[TABLE_TYPE.PLACEHOLDERS, TABLE_TYPE.COLLECTIONS].includes(tab.value)}
                                          .loading=${this.#getLoadingForType(tab.value)}
                                          @items-filtered=${(e) => this.#handleFiltered(tab.value, e)}
                                      ></mas-items-search-filters>
                                  `}
                            <div class="container ${this.viewOnly ? 'view-only' : ''}">
                                <mas-items-table
                                    .type=${tab.value}
                                    .items=${this.#getItemsForType(tab.value)}
                                    .selectedPaths=${this.#getSelectedPathsForType(tab.value)}
                                    .variationsByParent=${this.variationsByParent}
                                    .viewOnly=${this.viewOnly}
                                    .loading=${this.#getLoadingForType(tab.value)}
                                    @show-toast=${this.#showToast}
                                ></mas-items-table>
                                ${this.viewOnly
                                    ? nothing
                                    : html`<mas-items-selected-panel
                                          .items=${this.selectedItems}
                                          .visible=${this.showSelected}
                                          @remove-item=${this.#handleRemoveItem}
                                      ></mas-items-selected-panel>`}
                            </div>
                            <sp-toast timeout="6000" @close=${(e) => e.stopPropagation()}></sp-toast>
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
                              ?disabled=${!this.selectedCount}
                              class="ghost-button"
                          >
                              <sp-icon
                                  slot="icon"
                                  label=${this.showSelected && this.selectedCount ? 'Hide selection' : 'Selected items'}
                                  class=${this.showSelected && this.selectedCount ? 'flipped' : ''}
                              >
                                  ${toggleSidebarIcon}
                              </sp-icon>
                              ${this.showSelected && this.selectedCount ? 'Hide selection' : 'Selected items'}
                              (${this.selectedCount})
                          </sp-button>
                      </div>
                  `}
        `;
    }
}

customElements.define('mas-item-selector', MasItemSelector);
