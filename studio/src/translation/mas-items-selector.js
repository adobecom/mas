import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { TABLE_TYPE } from '../constants.js';
import { toggleSidebarIcon } from '../icons.js';
import './mas-select-items-table.js';
import './mas-selected-items.js';
import './mas-search-and-filters.js';
import { styles } from './mas-items-selector.css.js';
import { debounce } from '../utils.js';

export const TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragments' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collections' },
    { value: TABLE_TYPE.PLACEHOLDERS, label: 'Placeholders' },
];

class MasItemsSelector extends LitElement {
    static styles = styles;

    static properties = {
        viewOnly: { type: Boolean, state: true },
        searchQuery: { type: String, state: true },
        selectedTab: { type: String, state: true },
    };

    constructor() {
        super();
        this.viewOnly = false;
        this.searchQuery = '';
        this.selectedTab = TABLE_TYPE.CARDS;
    }

    connectedCallback() {
        super.connectedCallback();
        this.storeController = new ReactiveController(this, [
            Store.translationProjects.inEdit,
            Store.translationProjects.showSelected,
            Store.translationProjects.selectedCards,
            Store.translationProjects.selectedCollections,
            Store.translationProjects.selectedPlaceholders,
        ]);
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    get selectedCount() {
        return (
            Store.translationProjects.selectedCards.value.length +
            Store.translationProjects.selectedPlaceholders.value.length +
            Store.translationProjects.selectedCollections.value.length
        );
    }

    #toggleShowSelected() {
        Store.translationProjects.showSelected.set(!this.showSelected);
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

    #handleTabChange({ target: { selected } }) {
        this.selectedTab = selected;
    }

    #getTabLabel(tab) {
        if (this.viewOnly) {
            const valueUppercase = tab.value.charAt(0).toUpperCase() + tab.value.slice(1);
            return `${tab.label} (${Store.translationProjects[`selected${valueUppercase}`].value.length})`;
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

    render() {
        const count = this.selectedCount;
        const showingSelection = this.showSelected && count;
        const toggleLabel = showingSelection ? 'Hide selection' : 'Selected items';
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
                                      <mas-search-and-filters
                                          .type=${tab.value}
                                          .searchQuery=${tab.value === this.selectedTab ? this.searchQuery : ''}
                                          .searchOnly=${[TABLE_TYPE.PLACEHOLDERS, TABLE_TYPE.COLLECTIONS].includes(tab.value)}
                                      ></mas-search-and-filters>
                                  `}
                            <div class="container ${this.viewOnly ? 'view-only' : ''}">
                                <mas-select-items-table
                                    .viewOnly=${this.viewOnly}
                                    .type=${tab.value}
                                    @show-toast=${this.#showToast}
                                ></mas-select-items-table>
                                ${this.viewOnly ? nothing : html`<mas-selected-items></mas-selected-items>`}
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

customElements.define('mas-items-selector', MasItemsSelector);
