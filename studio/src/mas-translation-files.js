import { LitElement, html } from 'lit';

import './mas-fragment-picker.js';
// import './mas-collection-picker.js';
// import './mas-placeholder-picker.js';

class MasTranslationFiles extends LitElement {
    static properties = {
        translationProject: { type: Object },
    };

    constructor() {
        super();
        this.translationProject = null;
    }

    render() {
        return html`
            <sp-tabs quiet selected="fragments">
                <sp-tab value="fragments" label="Fragments">Fragments</sp-tab>
                <sp-tab value="collections" label="Collections">Collections</sp-tab>
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
        `;
    }
}

customElements.define('mas-translation-files', MasTranslationFiles);
