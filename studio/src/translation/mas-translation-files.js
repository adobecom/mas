import { LitElement, html } from 'lit';
import { styles } from './mas-translation-files.css.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';

import './mas-fragment-picker.js';

class MasTranslationFiles extends LitElement {
    static styles = styles;

    constructor() {
        super();
        this.selectedStoreController = new StoreController(this, Store.translationProjects.selected);
        this.showSelectedStoreController = new StoreController(this, Store.translationProjects.showSelected);
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    get selectedFilesCount() {
        return Store.translationProjects.selectedFilesCount;
    }

    render() {
        return html`
            <sp-tabs quiet selected="fragments">
                <sp-tab value="fragments" label="Fragments">Fragments</sp-tab>
                <sp-tab value="collections" label="Collections" disabled>Collections</sp-tab>
                <sp-tab value="placeholders" label="Placeholders" disabled>Placeholders</sp-tab>

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
                <sp-button
                    variant="secondary"
                    @click=${() => Store.translationProjects.showSelected.set(!Store.translationProjects.showSelected.value)}
                    ?disabled=${!this.selectedFilesCount}
                >
                    <sp-icon-export
                        slot="icon"
                        label=${this.showSelected && this.selectedFilesCount ? 'Hide selection' : 'Selected files'}
                        class=${this.showSelected && this.selectedFilesCount ? 'flipped' : ''}
                    ></sp-icon-export>
                    ${this.showSelected && this.selectedFilesCount ? 'Hide selection' : 'Selected files'}
                    (${this.selectedFilesCount})
                </sp-button>
            </div>
        `;
    }
}

customElements.define('mas-translation-files', MasTranslationFiles);
