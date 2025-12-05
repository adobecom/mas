import { LitElement, html } from 'lit';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import { styles } from './mas-fragment-variations.css.js';
import router from './router.js';

const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

class MasFragmentVariations extends LitElement {
    static properties = {
        fragment: { type: Object, attribute: false },
        loading: { type: Boolean, attribute: false },
    };

    constructor() {
        super();
        this.fragment = null;
        this.loading = false;
    }

    createRenderRoot() {
        return this;
    }

    get variations() {
        return this.fragment?.listLocaleVariations() || [];
    }

    get hasVariations() {
        return this.variations && Array.isArray(this.variations) && this.variations.length > 0;
    }

    async handleEdit(fragmentStore) {
        const fragment = fragmentStore.value;
        if (fragment?.id) {
            await router.navigateToFragmentEditor(fragment.id);
        }
    }

    renderVariations() {
        if (this.loading) {
            return html`
                <div class="loading-container">
                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                    <p>Loading variations...</p>
                </div>
            `;
        }

        if (!this.hasVariations) {
            return html`<p>No locale variations found</p>`;
        }

        return html`
            <sp-table size="m">
                <sp-table-body>
                    ${this.variations.map((variationFragment) => {
                        const fragmentStore = new FragmentStore(new Fragment(variationFragment));
                        return html`
                            <mas-fragment-table
                                class="mas-fragment nested-fragment"
                                data-id="${variationFragment.id}"
                                .fragmentStore=${fragmentStore}
                                .nested=${true}
                                @dblclick=${(e) => this.handleEdit(fragmentStore, e)}
                            ></mas-fragment-table>
                        `;
                    })}
                </sp-table-body>
            </sp-table>
        `;
    }

    render() {
        if (!this.fragment) {
            return html``;
        }

        return html`
            <div class="expanded-content">
                ${this.loading
                    ? html`<h3 class="expanded-title">Loading Variations...</h3>`
                    : this.hasVariations
                      ? html`<h3 class="expanded-title">Variations</h3>`
                      : html`<h3 class="expanded-title">No Variations found.</h3>`}
                <sp-tabs selected="locale" quiet>
                    <sp-tab value="locale" label="Locale">Locale</sp-tab>
                    <sp-tab value="promotion" label="Promotion">Promotion</sp-tab>
                    <sp-tab value="personalization" label="Personalization">Personalization</sp-tab>
                    <sp-tab-panel value="locale"> ${this.renderVariations()} </sp-tab-panel>
                    <sp-tab-panel value="promotion">
                        <div class="tab-content-placeholder">
                            <p>Promotion content will be displayed here</p>
                        </div>
                    </sp-tab-panel>
                    <sp-tab-panel value="personalization">
                        <div class="tab-content-placeholder">
                            <p>Personalization content will be displayed here</p>
                        </div>
                    </sp-tab-panel>
                </sp-tabs>
            </div>
        `;
    }
}

customElements.define('mas-fragment-variations', MasFragmentVariations);
