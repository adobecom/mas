import { LitElement, html } from 'lit';
import { styles } from './mas-translation-files.css.js';

import './mas-fragment-picker.js';

class MasTranslationFiles extends LitElement {
    static styles = styles;

    static properties = {
        translationProject: { type: Object },
        showSelected: { type: Boolean, state: true },
        selectedFragments: { type: Set, state: true },
        selectedCollections: { type: Set, state: true },
        selectedPlaceholders: { type: Set, state: true },
    };

    constructor() {
        super();
        this.translationProject = null;
        this.selectedFragments = new Set();
        this.selectedCollections = new Set();
        this.selectedPlaceholders = new Set();
        this.showSelected = false;
    }

    get selectedCount() {
        return this.selectedFragments.size + this.selectedCollections.size + this.selectedPlaceholders.size;
    }

    get allSelected() {
        return new Set([...this.selectedFragments, ...this.selectedCollections, ...this.selectedPlaceholders]);
    }

    updateSelected({ detail: { selected, source } }) {
        if (!selected) return;
        switch (source) {
            case 'fragments':
                this.selectedFragments = new Set(selected);
                break;
            case 'collections':
                this.selectedCollections = new Set(selected);
                break;
            case 'placeholders':
                this.selectedPlaceholders = new Set(selected);
                break;
        }
    }

    removeItem({ detail: { itemId } }) {
        if (this.selectedFragments.has(itemId)) {
            this.selectedFragments = new Set([...this.selectedFragments].filter((id) => id !== itemId));
        } else if (this.selectedCollections.has(itemId)) {
            this.selectedCollections = new Set([...this.selectedCollections].filter((id) => id !== itemId));
        } else if (this.selectedPlaceholders.has(itemId)) {
            this.selectedPlaceholders = new Set([...this.selectedPlaceholders].filter((id) => id !== itemId));
        }
    }

    render() {
        return html`
            <sp-tabs quiet selected="fragments" @remove-item=${this.removeItem}>
                <sp-tab value="fragments" label="Fragments">Fragments</sp-tab>
                <sp-tab value="collections" label="Collections" disabled>Collections</sp-tab>
                <sp-tab value="placeholders" label="Placeholders" disabled>Placeholders</sp-tab>

                <sp-tab-panel value="fragments">
                    <mas-fragment-picker
                        @selected=${this.updateSelected}
                        .allSelected=${this.selectedFragments}
                        .showSelected=${this.showSelected}
                    ></mas-fragment-picker>
                </sp-tab-panel>
                <sp-tab-panel value="collections">
                    <mas-collection-picker
                        @selected=${this.updateSelected}
                        .allSelected=${this.selectedCollections}
                        .showSelected=${this.showSelected}
                    ></mas-collection-picker>
                </sp-tab-panel>
                <sp-tab-panel value="placeholders">
                    <mas-placeholder-picker
                        @selected=${this.updateSelected}
                        .allSelected=${this.selectedPlaceholders}
                        .showSelected=${this.showSelected}
                    ></mas-placeholder-picker>
                </sp-tab-panel>
            </sp-tabs>
            <div class="selected-files-count">
                <sp-button
                    variant="secondary"
                    icon-only
                    @click=${() => (this.showSelected = !this.showSelected)}
                    ?disabled=${!this.selectedCount}
                >
                    <sp-icon-export
                        slot="icon"
                        label=${this.showSelected ? 'Hide selection' : 'Selected files'}
                        class=${this.showSelected ? 'flipped' : ''}
                    ></sp-icon-export>
                </sp-button>
                ${this.showSelected ? 'Hide selection' : 'Selected files'} (${this.selectedCount})
            </div>
        `;
    }
}

customElements.define('mas-translation-files', MasTranslationFiles);
