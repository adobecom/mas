import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import { TABLE_TYPE } from '../../constants.js';
import { toggleSidebarIcon } from '../../icons.js';
import './mas-select-items-table.js';
import './mas-selected-items.js';
import './mas-search-and-filters.js';
import { styles } from './mas-items-selector.css.js';

export const TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragments' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collections' },
    { value: TABLE_TYPE.PLACEHOLDERS, label: 'Placeholders' },
];

class MasItemsSelector extends LitElement {
    static styles = styles;

    static properties = {
        viewOnly: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.viewOnly = false;
    }

    connectedCallback() {
        super.connectedCallback();
        const s = getItemsSelectionStore();
        this.storeController = new ReactiveController(this, [
            s.inEdit,
            s.showSelected,
            s.selectedCards,
            s.selectedCollections,
            s.selectedPlaceholders,
        ]);
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
                                      <mas-search-and-filters
                                          .type=${tab.value}
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

customElements.define('mas-items-selector', MasItemsSelector);
