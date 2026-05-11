import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-add-items-dialog.css.js';
import { TABLE_TYPE } from './constants.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { getItemsSelectionStore, setItemsSelectionStore } from './common/items-selection-store.js';
import { renderFragmentStatusCell } from './common/utils/render-utils.js';
import './common/components/mas-select-items-table.js';
import './common/components/mas-search-and-filters.js';

const TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragment' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collection' },
    { value: TABLE_TYPE.PLACEHOLDERS, label: 'Placeholder' },
];

class MasAddItemsDialog extends LitElement {
    static styles = styles;

    static properties = {
        open: { type: Boolean },
        selectedTab: { state: true },
        searchQuery: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.selectedTab = TABLE_TYPE.CARDS;
        this.searchQuery = '';
    }

    connectedCallback() {
        super.connectedCallback();
        setItemsSelectionStore(Store.bulkPublishProjects);
        this.resultsController = new ReactiveController(this, [
            Store.bulkPublishProjects.displayCards,
            Store.bulkPublishProjects.displayCollections,
            Store.bulkPublishProjects.displayPlaceholders,
        ]);
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            const s = Store.bulkPublishProjects;
            s.allCards.set([]);
            s.displayCards.set([]);
            s.groupedVariationsByParent.set(new Map());
            s.groupedVariationsData.set(new Map());
            s.allCollections.set([]);
            s.allCollections.setMeta('loaded', false);
            s.displayCollections.set([]);
            s.allPlaceholders.set([]);
            s.displayPlaceholders.set([]);
            if (this.repository?.loadAllCollections) this.repository.loadAllCollections();
        }
    }

    get resultCount() {
        const s = getItemsSelectionStore();
        switch (this.selectedTab) {
            case TABLE_TYPE.CARDS:
                return s.displayCards.value?.length ?? 0;
            case TABLE_TYPE.COLLECTIONS:
                return s.displayCollections.value?.length ?? 0;
            case TABLE_TYPE.PLACEHOLDERS:
                return s.displayPlaceholders.value?.length ?? 0;
            default:
                return 0;
        }
    }

    #handleTabChange({ target: { selected } }) {
        this.selectedTab = selected;
        this.searchQuery = '';
    }

    #handleSearchInput(e) {
        this.searchQuery = e.currentTarget?.value ?? '';
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
                    <div class="search-row">
                        <sp-search
                            size="m"
                            placeholder="Search..."
                            .value=${this.searchQuery}
                            @input=${this.#handleSearchInput}
                            @submit=${this.#handleSearchSubmit}
                        ></sp-search>
                        <span class="result-count">${this.resultCount} result(s)</span>
                    </div>
                    ${isCards
                        ? html`
                              <div class="filter-row">
                                  <mas-search-and-filters
                                      .type=${TABLE_TYPE.CARDS}
                                      .searchQuery=${this.searchQuery}
                                  ></mas-search-and-filters>
                              </div>
                          `
                        : html`<mas-search-and-filters
                              search-only
                              hidden
                              .type=${this.selectedTab}
                              .searchQuery=${this.searchQuery}
                          ></mas-search-and-filters>`}
                    <div class="table-wrapper">
                        ${TABS.map(
                            (tab) =>
                                html`<mas-select-items-table
                                    .type=${tab.value}
                                    ?hidden=${this.selectedTab !== tab.value}
                                    .renderFragmentStatusCell=${renderFragmentStatusCell}
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
