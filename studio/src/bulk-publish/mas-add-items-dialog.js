import { LitElement, html, nothing } from 'lit';
import { debounce } from '../utils.js';
import { styles } from './mas-add-items-dialog.css.js';
import { TABLE_TYPE } from '../constants.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import '../translation/mas-select-items-table.js';
import '../translation/mas-search-and-filters.js';

const TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragment' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collection' },
    { value: TABLE_TYPE.PLACEHOLDERS, label: 'Placeholder' },
];

class MasAddItemsDialog extends LitElement {
    static styles = styles;

    static properties = {
        open: { type: Boolean },
        targetStore: { type: Object },
        selectedTab: { state: true },
        searchQuery: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.targetStore = Store.bulkPublishProjects;
        this.selectedTab = TABLE_TYPE.CARDS;
        this.searchQuery = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this.resultsController = new ReactiveController(this, [
            Store.translationProjects.displayCards,
            Store.translationProjects.displayCollections,
            Store.translationProjects.displayPlaceholders,
        ]);
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            Store.translationProjects.allCards.set([]);
            Store.translationProjects.displayCards.set([]);
            Store.translationProjects.groupedVariationsByParent.set(new Map());
            Store.translationProjects.groupedVariationsData.set(new Map());
            Store.translationProjects.allCollections.set([]);
            Store.translationProjects.displayCollections.set([]);
            Store.translationProjects.allPlaceholders.set([]);
            Store.translationProjects.displayPlaceholders.set([]);
        }
    }

    get resultCount() {
        switch (this.selectedTab) {
            case TABLE_TYPE.CARDS:
                return Store.translationProjects.displayCards.value?.length ?? 0;
            case TABLE_TYPE.COLLECTIONS:
                return Store.translationProjects.displayCollections.value?.length ?? 0;
            case TABLE_TYPE.PLACEHOLDERS:
                return Store.translationProjects.displayPlaceholders.value?.length ?? 0;
            default:
                return 0;
        }
    }

    #handleTabChange({ target: { selected } }) {
        this.selectedTab = selected;
        this.searchQuery = '';
    }

    #setSearchQuery = debounce((value) => {
        this.searchQuery = value;
    }, 300);

    #handleSearchInput(e) {
        this.#setSearchQuery(e.currentTarget?.value ?? '');
    }

    #handleSearchSubmit(e) {
        e.preventDefault();
        this.searchQuery = e.currentTarget?.value ?? '';
    }

    #handleConfirm() {
        this.dispatchEvent(new CustomEvent('confirm', { bubbles: true, composed: true }));
    }

    #handleCancel() {
        this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
    }

    render() {
        if (!this.open) return nothing;
        const isCards = this.selectedTab === TABLE_TYPE.CARDS;

        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                size="l"
                headline="Select items"
                underlay
                no-divider
                @close=${this.#handleCancel}
            >
                <div class="dialog-content">
                    <sp-tabs class="tabs-row" quiet .selected=${this.selectedTab} @change=${this.#handleTabChange}>
                        ${TABS.map((tab) => html`<sp-tab value=${tab.value} label=${tab.label}>${tab.label}</sp-tab>`)}
                    </sp-tabs>
                    <sp-divider size="s"></sp-divider>
                    ${isCards
                        ? html`
                              <div class="search-row">
                                  <sp-search
                                      size="m"
                                      placeholder="Search..."
                                      @input=${this.#handleSearchInput}
                                      @submit=${this.#handleSearchSubmit}
                                  ></sp-search>
                                  <span class="result-count">${this.resultCount} result(s)</span>
                              </div>
                              <div class="filter-row">
                                  <mas-search-and-filters
                                      .type=${TABLE_TYPE.CARDS}
                                      .searchQuery=${this.searchQuery}
                                  ></mas-search-and-filters>
                              </div>
                          `
                        : nothing}
                    <div class="table-wrapper">
                        ${TABS.map(
                            (tab) =>
                                html`<mas-select-items-table
                                    .type=${tab.value}
                                    .targetStore=${this.targetStore}
                                    ?hidden=${this.selectedTab !== tab.value}
                                ></mas-select-items-table>`,
                        )}
                    </div>
                    <div class="dialog-footer">
                        <sp-button variant="secondary" treatment="outline" @click=${this.#handleCancel}> Cancel </sp-button>
                        <sp-button variant="accent" @click=${this.#handleConfirm}> Add selected items </sp-button>
                    </div>
                </div>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-add-items-dialog', MasAddItemsDialog);
