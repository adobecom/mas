import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { TABLE_TYPE } from '../constants.js';
import './mas-placeholder-picker.js';
import './mas-select-fragments-table.js';
import './mas-selected-items.js';
import './mas-search-and-filters.js';
import { styles } from './mas-files-selector.css.js';

export const TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragments' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collections' },
    { value: TABLE_TYPE.PLACEHOLDERS, label: 'Placeholders' },
];

class MasFilesSelector extends LitElement {
    static styles = styles;

    static properties = {
        itemToRemove: { type: String, state: true },
    };

    constructor() {
        super();
        this.showSelectedStoreController = new StoreController(this, Store.translationProjects.showSelected);
        this.inEditController = new ReactiveController(this, [Store.translationProjects.inEdit]);
        this.selectedController = new ReactiveController(this, [
            Store.translationProjects.selectedCards,
            Store.translationProjects.selectedCollections,
            Store.translationProjects.selectedPlaceholders,
        ]);
        this.itemToRemove = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.repository.searchFragments();
        this.repository.loadPlaceholders();
    }

    /** @type {import('../mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    get selectedCount() {
        return [
            ...Store.translationProjects.selectedCards.value,
            ...Store.translationProjects.selectedPlaceholders.value,
            ...Store.translationProjects.selectedCollections.value,
        ].length;
    }

    #toggleShowSelected = () => {
        Store.translationProjects.showSelected.set(!this.showSelected);
    };

    setItemToRemove({ detail: { path } }) {
        this.itemToRemove = path;
    }

    render() {
        return html`
            <sp-tabs quiet selected="cards">
                ${repeat(
                    TABS,
                    (tab) => tab.value,
                    (tab) => html`<sp-tab value=${tab.value} label=${tab.label}>${tab.label}</sp-tab>`,
                )}
                ${repeat(
                    TABS,
                    (tab) => tab.value,
                    (tab) => html`
                        <sp-tab-panel value=${tab.value}>
                            <mas-search-and-filters
                                .type=${tab.value}
                                .searchOnly=${tab.value === TABLE_TYPE.PLACEHOLDERS}
                            ></mas-search-and-filters>
                            <div class="container">
                                <mas-select-fragments-table
                                    .type=${tab.value}
                                    .itemToRemove=${this.itemToRemove}
                                ></mas-select-fragments-table>
                                <mas-selected-items @remove=${this.setItemToRemove}></mas-selected-items>
                            </div>
                        </sp-tab-panel>
                    `,
                )}
            </sp-tabs>

            <div class="selected-files-count">
                <sp-button variant="secondary" @click=${this.#toggleShowSelected} ?disabled=${!this.selectedCount}>
                    <sp-icon-export
                        slot="icon"
                        label=${this.showSelected && this.selectedCount ? 'Hide selection' : 'Selected files'}
                        class=${this.showSelected && this.selectedCount ? 'flipped' : ''}
                    ></sp-icon-export>
                    ${this.showSelected && this.selectedCount ? 'Hide selection' : 'Selected files'} (${this.selectedCount})
                </sp-button>
            </div>
        `;
    }
}

customElements.define('mas-files-selector', MasFilesSelector);
