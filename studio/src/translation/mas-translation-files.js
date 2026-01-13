import { LitElement, html } from 'lit';
import { styles } from './mas-translation-files.css.js';
import Store from '../store.js';

import './mas-fragment-picker.js';

class MasTranslationFiles extends LitElement {
    static styles = styles;

    static properties = {
        translationProject: { type: Object },
        showSelected: { type: Boolean, state: true },
        selectedItems: { type: Array, state: true },
    };

    constructor() {
        super();
        this.translationProject = null;
        this.showSelected = false;
        this.selectedItems = {
            fragments: [],
            collections: [],
            placeholders: [],
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.#loadSelectedItemsFromStore();
    }

    #loadSelectedItemsFromStore() {
        const fragmentStore = Store.translationProjects.inEdit.get();
        if (!fragmentStore) return;

        const fragment = fragmentStore.get();

        const fragmentsField = fragment?.getFieldValue('fragments');
        const collectionsField = fragment?.getFieldValue('collections');
        const placeholdersField = fragment?.getFieldValue('placeholders');

        this.selectedItems = {
            fragments: fragmentsField ? this.#parseField(fragmentsField) : [],
            collections: collectionsField ? this.#parseField(collectionsField) : [],
            placeholders: placeholdersField ? this.#parseField(placeholdersField) : [],
        };
    }

    #parseField(fieldValue) {
        try {
            return JSON.parse(fieldValue);
        } catch (error) {
            console.warn('Failed to parse field value:', error);
            return [];
        }
    }

    #saveSelectedItemsToStore() {
        const fragmentStore = Store.translationProjects.inEdit.get();
        if (!fragmentStore) return;

        fragmentStore.updateField('fragments', [JSON.stringify(this.selectedItems.fragments)]);
        fragmentStore.updateField('collections', [JSON.stringify(this.selectedItems.collections)]);
        fragmentStore.updateField('placeholders', [JSON.stringify(this.selectedItems.placeholders)]);
    }

    get selectedCount() {
        const { fragments, collections, placeholders } = this.selectedItems;
        return fragments.length + collections.length + placeholders.length;
    }

    updateSelected({ detail: { selected, type } }) {
        if (!selected || !type) return;
        const currentById = new Map(this.selectedItems[type].map((obj) => [obj.id, obj]));
        this.selectedItems = {
            ...this.selectedItems,
            [type]: selected.map((obj) => currentById.get(obj.id) ?? obj),
        };
        this.#saveSelectedItemsToStore();
    }

    removeItem({ detail: { itemId, type } }) {
        if (!itemId || !type) return;
        const currentItems = this.selectedItems[type];
        if (!currentItems) return;
        const newItems = currentItems.filter((item) => item.id !== itemId);
        this.selectedItems = {
            ...this.selectedItems,
            [type]: newItems,
        };
        this.#saveSelectedItemsToStore();
    }

    render() {
        return html`
            <sp-tabs quiet selected="fragments">
                <sp-tab value="fragments" label="Fragments">Fragments</sp-tab>
                <sp-tab value="collections" label="Collections" disabled>Collections</sp-tab>
                <sp-tab value="placeholders" label="Placeholders" disabled>Placeholders</sp-tab>

                <sp-tab-panel value="fragments">
                    <mas-fragment-picker
                        .selectedItems=${this.selectedItems.fragments}
                        .showSelected=${this.showSelected}
                        @selected=${this.updateSelected}
                        @remove-item=${this.removeItem}
                    ></mas-fragment-picker>
                </sp-tab-panel>
                <sp-tab-panel value="collections">
                    <mas-collection-picker
                        .selectedItems=${this.selectedItems.collections}
                        .showSelected=${this.showSelected}
                        @selected=${this.updateSelected}
                        @remove-item=${this.removeItem}
                    ></mas-collection-picker>
                </sp-tab-panel>
                <sp-tab-panel value="placeholders">
                    <mas-placeholder-picker
                        .selectedItems=${this.selectedItems.placeholders}
                        .showSelected=${this.showSelected}
                        @selected=${this.updateSelected}
                        @remove-item=${this.removeItem}
                    ></mas-placeholder-picker>
                </sp-tab-panel>
            </sp-tabs>
            <div class="selected-files-count">
                <sp-button
                    variant="secondary"
                    @click=${() => (this.showSelected = !this.showSelected)}
                    ?disabled=${!this.selectedCount}
                >
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

customElements.define('mas-translation-files', MasTranslationFiles);
