import { LitElement, html } from 'lit';
import { styles } from './mas-translation-files.css.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';

import './mas-fragment-picker.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasTranslationFiles extends LitElement {
    static styles = styles;

    static properties = {};

    constructor() {
        super();
        this.showSelectedStoreController = new StoreController(this, Store.translationProjects.showSelected);
        this.inEditController = new ReactiveController(this, [Store.translationProjects.inEdit]);
        this.selectedController = new ReactiveController(this, [
            Store.translationProjects.fragments,
            Store.translationProjects.collections,
            Store.translationProjects.placeholders,
        ]);
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    get selectedCount() {
        return [
            ...Store.translationProjects.fragments.value,
            ...Store.translationProjects.placeholders.value,
            ...Store.translationProjects.collections.value,
        ].length;
    }

    #toggleShowSelected = () => {
        Store.translationProjects.showSelected.set(!this.showSelected);
    };

    render() {
        return html`
            <sp-tabs quiet selected="fragments">
                <sp-tab value="fragments" label="Fragments">Fragments</sp-tab>
                <sp-tab value="collections" label="Collections" disabled>Collections</sp-tab>
                <sp-tab value="placeholders" label="Placeholders">Placeholders</sp-tab>

                <sp-tab-panel value="fragments">
                    <mas-fragment-picker></mas-fragment-picker>
                </sp-tab-panel>
                <sp-tab-panel value="collections">
                    <mas-collection-picker></mas-collection-picker>
                </sp-tab-panel>
                <sp-tab-panel value="placeholders">
                    <mas-placeholder-picker></mas-placeholder-picker>
                </sp-tab-panel>
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

customElements.define('mas-translation-files', MasTranslationFiles);
