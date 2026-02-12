import { LitElement, html, nothing } from 'lit';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import { VARIATION_TYPES } from './constants.js';
import { createPreviewDataWithParent } from './reactivity/source-fragment-store.js';
import { styles } from './mas-fragment-variations.css.js';
import router from './router.js';
import { localeIconProvider } from './utils.js';
import './aem/aem-tag-picker-field.js';

const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

class MasFragmentVariations extends LitElement {
    static properties = {
        fragment: { type: Object, attribute: false },
        loading: { type: Boolean, attribute: false },
        expandedGroupedVariations: { type: Object, state: true },
    };

    constructor() {
        super();
        this.fragment = null;
        this.loading = false;
        this.expandedGroupedVariations = new Set();
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
     * Returns pznTags value as a comma-separated string for aem-tag-picker-field.
     * @param {Object} variationFragment
     * @returns {string}
     */
    getGroupedVariationTagsValue(variationFragment) {
        const pznTagsField = variationFragment.fields?.find((field) => field.name === 'pznTags');
        const tags = pznTagsField?.values || [];
        return tags.join(',');
    }

    /**
     * Extracts promo code from a fragment's fields.
     * @param {Object} variationFragment
     * @returns {string}
     */
    getPromoCode(variationFragment) {
        const promoCodeField = variationFragment.fields?.find((field) => field.name === 'promoCode');
        return promoCodeField?.values?.[0] || '';
    }

    /**
     * Toggles the expanded state of a grouped variation.
     * @param {string} fragmentId
     */
    toggleGroupedVariation(fragmentId) {
        const newSet = new Set(this.expandedGroupedVariations);
        if (newSet.has(fragmentId)) {
            newSet.delete(fragmentId);
        } else {
            newSet.add(fragmentId);
        }
        this.expandedGroupedVariations = newSet;
    }

    /**
     * Checks if a grouped variation is expanded.
     * @param {string} fragmentId
     * @returns {boolean}
     */
    isGroupedVariationExpanded(fragmentId) {
        return this.expandedGroupedVariations.has(fragmentId);
    }

    get localeVariationsTemplate() {
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
                        const mergedData = createPreviewDataWithParent(variationFragment, this.fragment);
                        const fragmentStore = new FragmentStore(new Fragment(mergedData));
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

    get groupedVariationsTemplate() {
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
                        const tagsValue = this.getGroupedVariationTagsValue(variationFragment);
                        const promoCode = this.getPromoCode(variationFragment);
                        const isExpanded = this.isGroupedVariationExpanded(variationFragment.id);
                        return html`
                            <mas-fragment-table
                                class="mas-fragment nested-fragment ${isExpanded ? 'expanded' : ''}"
                                data-id="${variationFragment.id}"
                                .fragmentStore=${fragmentStore}
                                .expanded=${isExpanded}
                                .toggleExpand=${() => this.toggleGroupedVariation(variationFragment.id)}
                                @dblclick=${() => this.handleEdit(fragmentStore)}
                            ></mas-fragment-table>
                            ${isExpanded
                                ? html`
                                      <div class="grouped-variation-expanded">
                                          <div class="promo-code-field">
                                              <span class="field-label">Promo code</span>
                                              <span class="field-value">${promoCode}</span>
                                          </div>
                                          <div class="tags-group">
                                              <span class="field-label">Grouped variation tags</span>
                                              <aem-tag-picker-field
                                                  namespace="/content/cq:tags/mas"
                                                  top="locale"
                                                  value="${tagsValue}"
                                                  .iconProvider=${localeIconProvider}
                                                  readonly
                                              ></aem-tag-picker-field>
                                          </div>
                                      </div>
                                  `
                                : nothing}
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
                    <sp-tab value="grouped" label="${VARIATION_TYPES.GROUPED}">${VARIATION_TYPES.GROUPED}</sp-tab>
                    <sp-tab-panel value="locale">${this.localeVariationsTemplate}</sp-tab-panel>
                    <sp-tab-panel value="promotion">
                        <div class="tab-content-placeholder">
                            <p>Promotion content will be displayed here</p>
                        </div>
                    </sp-tab-panel>
                    <sp-tab-panel value="grouped">${this.groupedVariationsTemplate}</sp-tab-panel>
                </sp-tabs>
            </div>
        `;
    }
}

customElements.define('mas-fragment-variations', MasFragmentVariations);
