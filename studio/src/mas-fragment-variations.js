import { LitElement, html, nothing } from 'lit';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import { createPreviewDataWithParent } from './reactivity/source-fragment-store.js';
import { styles } from './mas-fragment-variations.css.js';
import { extractLocaleFromPath, showToast } from './utils.js';
import router from './router.js';
import {
    getGroupedVariationTagsValue,
    getPromotionCode,
    hasAnyVariationTabItems,
    listGroupedVariations,
    listLocaleVariations,
    VARIATION_TABS,
} from './editors/variation-utils.js';
import './aem/aem-tag-picker-field.js';

const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

class MasFragmentVariations extends LitElement {
    static properties = {
        fragment: { type: Object, attribute: false },
        loading: { type: Boolean, attribute: false },
        expandedGroupedVariations: { type: Object, state: true },
        duplicateSource: { type: Object, state: true },
        duplicatePznTags: { type: Array, state: true },
        duplicateLoading: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.fragment = null;
        this.loading = false;
        this.expandedGroupedVariations = new Set();
        this.duplicateSource = null;
        this.duplicatePznTags = [];
        this.duplicateLoading = false;
    }

    createRenderRoot() {
        return this;
    }

    get localeVariations() {
        return listLocaleVariations(this.fragment);
    }

    get groupedVariations() {
        return listGroupedVariations(this.fragment);
    }

    get hasLocaleVariations() {
        return this.localeVariations.length > 0;
    }

    get hasGroupedVariations() {
        return this.groupedVariations.length > 0;
    }

    get hasAnyVariations() {
        return hasAnyVariationTabItems(this.fragment);
    }

    async handleEdit(fragmentStore) {
        const fragment = fragmentStore.value;
        if (fragment?.id) {
            const locale = extractLocaleFromPath(fragment.path);
            await router.navigateToFragmentEditor(fragment.id, { locale });
        }
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

    openDuplicateDialog(variationFragment) {
        const sourceTags = getGroupedVariationTagsValue(variationFragment);
        this.duplicateSource = variationFragment;
        this.duplicatePznTags = sourceTags ? sourceTags.split(',') : [];
    }

    closeDuplicateDialog() {
        if (this.duplicateLoading) return;
        this.duplicateSource = null;
        this.duplicatePznTags = [];
    }

    handleDuplicatePznTagsChange(event) {
        this.duplicatePznTags = event.target.value || [];
    }

    get canSubmitDuplicate() {
        return !this.duplicateLoading && this.duplicatePznTags.length > 0;
    }

    async handleDuplicateSubmit() {
        const repository = document.querySelector('mas-repository');
        if (!repository || !this.duplicateSource?.id) return;

        try {
            this.duplicateLoading = true;
            showToast('Duplicating grouped variation...');
            await repository.duplicateGroupedVariation(this.duplicateSource.id, this.duplicatePznTags);
            showToast('Grouped variation duplicated', 'positive');
            this.duplicateLoading = false;
            this.closeDuplicateDialog();
        } catch (err) {
            showToast(`Failed to duplicate: ${err.message}`, 'negative');
            this.duplicateLoading = false;
        }
    }

    get duplicateDialogTemplate() {
        if (!this.duplicateSource) return nothing;
        return html`
            <sp-underlay open @click=${() => this.closeDuplicateDialog()}></sp-underlay>
            <sp-dialog size="s" no-divider>
                <h2 slot="heading">Duplicate grouped variation</h2>
                <div id="duplicate-fields">
                    <sp-field-group>
                        <sp-field-label>Grouped variation tags</sp-field-label>
                        <aem-tag-picker-field
                            label="Locale and PZN tags"
                            namespace="/content/cq:tags/mas"
                            selection="checkbox-tags"
                            display-value
                            top="locale,pzn"
                            multiple
                            .value=${this.duplicatePznTags}
                            ?disabled=${this.duplicateLoading}
                            @change=${this.handleDuplicatePznTagsChange}
                        ></aem-tag-picker-field>
                    </sp-field-group>
                </div>
                <sp-button
                    slot="button"
                    variant="secondary"
                    treatment="outline"
                    ?disabled=${this.duplicateLoading}
                    @click=${() => this.closeDuplicateDialog()}
                    >Cancel</sp-button
                >
                <sp-button
                    slot="button"
                    variant="accent"
                    ?disabled=${!this.canSubmitDuplicate}
                    @click=${() => this.handleDuplicateSubmit()}
                    >Duplicate</sp-button
                >
            </sp-dialog>
        `;
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
                        const mergedData = createPreviewDataWithParent(variationFragment, this.fragment);
                        const fragmentStore = new FragmentStore(new Fragment(mergedData));
                        const tagsValue = getGroupedVariationTagsValue(variationFragment);
                        const promoCode = getPromotionCode(variationFragment);
                        const isExpanded = this.isGroupedVariationExpanded(variationFragment.id);
                        return html`
                            <mas-fragment-table
                                class="mas-fragment nested-fragment ${isExpanded ? 'expanded' : ''}"
                                data-id="${variationFragment.id}"
                                .fragmentStore=${fragmentStore}
                                .canCreateVariation=${false}
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
                                                  display-value
                                                  top="locale,pzn"
                                                  value="${tagsValue}"
                                                  readonly
                                              ></aem-tag-picker-field>
                                          </div>
                                          <div class="duplicate-action">
                                              <sp-action-button
                                                  quiet
                                                  @click=${() => this.openDuplicateDialog(variationFragment)}
                                              >
                                                  <sp-icon-copy slot="icon"></sp-icon-copy>
                                                  Duplicate
                                              </sp-action-button>
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
                    ${VARIATION_TABS.map((tab) => html`<sp-tab value=${tab.id} label=${tab.label}>${tab.label}</sp-tab>`)}
                    <sp-tab-panel value="locale">${this.localeVariationsTemplate}</sp-tab-panel>
                    <sp-tab-panel value="promotion">
                        <div class="tab-content-placeholder">
                            <p>Promotion content will be displayed here</p>
                        </div>
                    </sp-tab-panel>
                    <sp-tab-panel value="grouped">${this.groupedVariationsTemplate}</sp-tab-panel>
                </sp-tabs>
                ${this.duplicateDialogTemplate}
            </div>
        `;
    }
}

customElements.define('mas-fragment-variations', MasFragmentVariations);
