import { LitElement, html, nothing } from 'lit';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import { VARIATION_TYPES } from './constants.js';
import { styles } from './mas-fragment-variations.css.js';
import router from './router.js';
import { getLocaleCode } from '../../io/www/src/fragment/locales.js';

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

    get localeVariations() {
        return this.fragment?.listLocaleVariations() || [];
    }

    get groupedVariations() {
        return this.fragment?.listGroupedVariations() || [];
    }

    get hasLocaleVariations() {
        return this.localeVariations.length > 0;
    }

    get hasGroupedVariations() {
        return this.groupedVariations.length > 0;
    }

    get hasAnyVariations() {
        return this.hasLocaleVariations || this.hasGroupedVariations;
    }

    async handleEdit(fragmentStore) {
        const fragment = fragmentStore.value;
        if (fragment?.id) {
            const locale = this.extractLocaleFromPath(fragment.path);
            await router.navigateToFragmentEditor(fragment.id, { locale });
        }
    }

    extractLocaleFromPath(path) {
        if (!path) return null;
        const parts = path.split('/');
        const masIndex = parts.indexOf('mas');
        if (masIndex === -1) return null;
        return parts[masIndex + 2] || null;
    }

    /**
     * Extracts locale tags from a grouped variation fragment's tags.
     * Returns locale codes derived from the fragment's locale-related tags.
     * @param {Object} variationFragment
     * @returns {string[]}
     */
    getGroupedVariationLocaleTags(variationFragment) {
        // Grouped variation tags are stored as tags with the mas:locale/ prefix
        const localeTags = variationFragment.tags
            ?.filter((tag) => tag.id?.startsWith('mas:locale/'))
            .map((tag) => tag.id.replace('mas:locale/', ''));
        return localeTags || [];
    }

    renderLocaleVariations() {
        if (this.loading) {
            return html`
                <div class="loading-container">
                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                    <p>Loading variations...</p>
                </div>
            `;
        }

        if (!this.hasLocaleVariations) {
            return html`<p>No locale variations found</p>`;
        }

        return html`
            <sp-table size="m">
                <sp-table-body>
                    ${this.localeVariations.map((variationFragment) => {
                        const fragmentStore = new FragmentStore(new Fragment(variationFragment));
                        return html`
                            <mas-fragment-table
                                class="mas-fragment nested-fragment"
                                data-id="${variationFragment.id}"
                                .fragmentStore=${fragmentStore}
                                .nested=${true}
                                @dblclick=${() => this.handleEdit(fragmentStore)}
                            ></mas-fragment-table>
                        `;
                    })}
                </sp-table-body>
            </sp-table>
        `;
    }

    renderGroupedVariations() {
        if (this.loading) {
            return html`
                <div class="loading-container">
                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                    <p>Loading grouped variations...</p>
                </div>
            `;
        }

        if (!this.hasGroupedVariations) {
            return html`<p>No grouped variations found</p>`;
        }

        return html`
            <sp-table size="m">
                <sp-table-body>
                    ${this.groupedVariations.map((variationFragment) => {
                        const fragmentStore = new FragmentStore(new Fragment(variationFragment));
                        const localeTags = this.getGroupedVariationLocaleTags(variationFragment);
                        return html`
                            <sp-table-row class="grouped-variation-row">
                                <sp-table-cell class="grouped-variation-info">
                                    <mas-fragment-table
                                        class="mas-fragment nested-fragment"
                                        data-id="${variationFragment.id}"
                                        .fragmentStore=${fragmentStore}
                                        .nested=${true}
                                        @dblclick=${() => this.handleEdit(fragmentStore)}
                                    ></mas-fragment-table>
                                </sp-table-cell>
                                <sp-table-cell class="grouped-variation-tags-cell">
                                    <span class="grouped-tags-label">Grouped variation tags</span>
                                    <div class="grouped-variation-tags">
                                        ${localeTags.length > 0
                                            ? localeTags.map(
                                                  (tag) => html`<span class="locale-tag-pill">${tag}</span>`,
                                              )
                                            : html`<span class="no-tags">No locale tags</span>`}
                                    </div>
                                </sp-table-cell>
                            </sp-table-row>
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
                    : this.hasAnyVariations
                      ? html`<h3 class="expanded-title">Variations</h3>`
                      : html`<h3 class="expanded-title">No Variations found.</h3>`}
                <sp-tabs selected="locale" quiet>
                    <sp-tab value="locale" label="Locale">Locale</sp-tab>
                    <sp-tab value="promotion" label="Promotion">Promotion</sp-tab>
                    <sp-tab value="grouped" label="${VARIATION_TYPES.GROUPED}"
                        >${VARIATION_TYPES.GROUPED}</sp-tab
                    >
                    <sp-tab-panel value="locale"> ${this.renderLocaleVariations()} </sp-tab-panel>
                    <sp-tab-panel value="promotion">
                        <div class="tab-content-placeholder">
                            <p>Promotion content will be displayed here</p>
                        </div>
                    </sp-tab-panel>
                    <sp-tab-panel value="grouped"> ${this.renderGroupedVariations()} </sp-tab-panel>
                </sp-tabs>
            </div>
        `;
    }
}

customElements.define('mas-fragment-variations', MasFragmentVariations);
