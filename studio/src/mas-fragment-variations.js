import { LitElement, html, nothing } from 'lit';
import { FragmentStore } from './reactivity/fragment-store.js';
import { Fragment } from './aem/fragment.js';
import generateFragmentStore, { createPreviewDataWithParent } from './reactivity/source-fragment-store.js';
import { styles } from './mas-fragment-variations.css.js';
import { extractLocaleFromPath, showToast, createKeyedAsyncLoader } from './utils.js';
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
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import {
    findPromotionProjectIdByTag,
    getPromoNameFromTag,
    getPromotionTagFromFragment,
    isPromoVariationPath,
    getPromotionInfo,
} from './promotions/promotion-model.js';
import { getPromotionProjectsForProbe } from './promotions/promotions-repository.js';

const styleElement = document.createElement('style');
styleElement.setAttribute('data-mas-fragment-variations', '');
styleElement.textContent = styles;
if (!document.head.querySelector('[data-mas-fragment-variations]')) {
    document.head.appendChild(styleElement);
}

class MasFragmentVariations extends LitElement {
    static properties = {
        fragment: { type: Object, attribute: false },
        fragmentStore: { type: Object, attribute: false },
        loading: { type: Boolean, attribute: false },
        expandedGroupedVariations: { type: Object, state: true },
        expandedPromoVariations: { type: Object, state: true },
        duplicateSource: { type: Object, state: true },
        duplicatePznTags: { type: Array, state: true },
        duplicateLoading: { type: Boolean, state: true },
        selectedTab: { type: String, state: true },
        promotionGeosByTag: { type: Object, state: true },
    };

    reactiveController = new ReactiveController(this, [
        Store.fragments.highlightedVariationId,
        Store.fragments.variationSearchTab,
    ]);

    constructor() {
        super();
        this.fragment = null;
        this.fragmentStore = null;
        this.loading = false;
        this.expandedGroupedVariations = new Set();
        this.expandedPromoVariations = new Set();
        this.duplicateSource = null;
        this.duplicatePznTags = [];
        this.duplicateLoading = false;
        this.selectedTab = Store.fragments.variationSearchTab.get() || 'locale';
        this.promotionGeosByTag = new Map();
    }

    #promotionGeosFallbackLoader = createKeyedAsyncLoader();

    createRenderRoot() {
        return this;
    }

    #unsubscribeFragmentStore;

    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        if (changedProperties.has('fragmentStore')) {
            this.#unsubscribeFragmentStore?.();
            this.#unsubscribeFragmentStore = null;
            const store = this.fragmentStore;
            if (store?.subscribe) {
                const onStoreChange = () => this.requestUpdate();
                store.subscribe(onStoreChange);
                this.#unsubscribeFragmentStore = () => store.unsubscribe(onStoreChange);
            }
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        const searchTab = Store.fragments.variationSearchTab.get();
        if (searchTab) {
            this.selectedTab = searchTab;
        }
        const highlightId = Store.fragments.highlightedVariationId.get();
        if (highlightId && this.#hasVariationInParent(highlightId)) {
            this.scrollToHighlightedVariation();
        }
        void this.#loadPromotionGeosFallback();
    }

    async #loadPromotionGeosFallback() {
        const tagsNeeded = this.fragment
            ? [
                  ...new Set(
                      this.promoVariations
                          .filter((variation) => !getGroupedVariationTagsValue(variation))
                          .map((variation) => getPromotionTagFromFragment(variation))
                          .filter(Boolean),
                  ),
              ]
            : [];
        await this.#promotionGeosFallbackLoader({
            guard: () =>
                Boolean(this.fragment && this.hasPromoVariations && this.repository?.loadPromotions && tagsNeeded.length),
            computeKey: () => tagsNeeded.slice().sort().join('|'),
            load: async () => {
                const projects = await getPromotionProjectsForProbe(() => this.repository.loadPromotions());
                const geosByTag = new Map(this.promotionGeosByTag);
                for (const tag of tagsNeeded) {
                    const project = projects.find(
                        (candidate) =>
                            getPromotionTagFromFragment(candidate) === tag &&
                            (candidate.getFieldValues?.('fragments') ?? []).includes(this.fragment.path),
                    );
                    geosByTag.set(tag, project?.getFieldValues?.('geos') || []);
                }
                return geosByTag;
            },
            apply: (geosByTag) => {
                this.promotionGeosByTag = geosByTag;
            },
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#unsubscribeFragmentStore?.();
        this.#unsubscribeFragmentStore = null;
    }

    handleTabChange({ target: { selected } }) {
        this.selectedTab = selected;
        Store.fragments.variationSearchTab.set(null);
    }

    isVariationHighlighted(variationFragmentId) {
        return Store.fragments.highlightedVariationId.get() === variationFragmentId;
    }

    #hasVariationInParent(variationId) {
        return (
            this.localeVariations.some((v) => v.id === variationId) ||
            this.groupedVariations.some((v) => v.id === variationId) ||
            this.promoVariations.some((v) => v.id === variationId)
        );
    }

    async scrollToHighlightedVariation() {
        const id = Store.fragments.highlightedVariationId.get();
        if (!id) return;
        await this.updateComplete;
        const row = this.querySelector(`[data-id="${id}"]`);
        row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    get localeVariations() {
        return listLocaleVariations(this.fragment);
    }

    get groupedVariations() {
        return listGroupedVariations(this.fragment);
    }

    get promoVariations() {
        return this.fragment.listPromoVariations();
    }

    get hasLocaleVariations() {
        return this.localeVariations.length > 0;
    }

    get hasPromoVariations() {
        return this.promoVariations.length > 0;
    }

    get hasGroupedVariations() {
        return this.groupedVariations.length > 0;
    }

    get hasAnyVariations() {
        return this.hasLocaleVariations || this.hasPromoVariations || this.hasGroupedVariations;
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    async handleEdit(fragmentStore) {
        const fragment = fragmentStore.value;
        if (!fragment?.id) return;
        const locale = extractLocaleFromPath(fragment.path);
        if (isPromoVariationPath(fragment.path)) {
            const promotionTagId = getPromotionTagFromFragment(fragment);
            if (promotionTagId && this.repository?.loadPromotions) {
                const projects = await getPromotionProjectsForProbe(() => this.repository.loadPromotions());
                const promotionId = findPromotionProjectIdByTag(promotionTagId, projects);
                if (promotionId) Store.promotions.promotionId.set(promotionId);
            }
        }
        await router.navigateToFragmentEditor(fragment.id, { locale, fragmentStore });
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

    togglePromoVariation(fragmentId) {
        const newSet = new Set(this.expandedPromoVariations);
        if (newSet.has(fragmentId)) {
            newSet.delete(fragmentId);
        } else {
            newSet.add(fragmentId);
        }
        this.expandedPromoVariations = newSet;
    }

    isPromoVariationExpanded(fragmentId) {
        return this.expandedPromoVariations.has(fragmentId);
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
                        const editStore = generateFragmentStore(variationFragment, this.fragment);
                        const isHighlighted = this.isVariationHighlighted(variationFragment.id);
                        return html`
                            <mas-fragment-table
                                class="mas-fragment nested-fragment ${isHighlighted ? 'variation-search-highlight' : ''}"
                                data-id="${variationFragment.id}"
                                .fragmentStore=${fragmentStore}
                                .editFragmentStore=${editStore}
                                .nested=${true}
                                @dblclick=${() => this.handleEdit(editStore)}
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
                        const editStore = generateFragmentStore(variationFragment, this.fragment);
                        const tagsValue = getGroupedVariationTagsValue(variationFragment);
                        const promoCode = getPromotionCode(variationFragment);
                        const isExpanded = this.isGroupedVariationExpanded(variationFragment.id);
                        const isHighlighted = this.isVariationHighlighted(variationFragment.id);
                        return html`
                            <mas-fragment-table
                                class="mas-fragment nested-fragment ${isExpanded ? 'expanded' : ''} ${isHighlighted
                                    ? 'variation-search-highlight'
                                    : ''}"
                                data-id="${variationFragment.id}"
                                .fragmentStore=${fragmentStore}
                                .editFragmentStore=${editStore}
                                .canCreateVariation=${false}
                                .nested=${true}
                                .expanded=${isExpanded}
                                .toggleExpand=${() => this.toggleGroupedVariation(variationFragment.id)}
                                @dblclick=${() => this.handleEdit(editStore)}
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

    get promotionVariationsTemplate() {
        if (this.loading) {
            return html`
                <div class="loading-container">
                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                    <p>Loading promotion variations...</p>
                </div>
            `;
        }

        if (!this.hasPromoVariations) {
            return html`<p>No promotion variations found</p>`;
        }

        return html`
            <sp-table size="m">
                <sp-table-body>
                    ${this.promoVariations.map((variationFragment) => {
                        const mergedData = createPreviewDataWithParent(variationFragment, this.fragment);
                        const fragmentStore = new FragmentStore(new Fragment(mergedData));
                        const editStore = generateFragmentStore(variationFragment, this.fragment);
                        const isExpanded = this.isPromoVariationExpanded(variationFragment.id);
                        const isHighlighted = this.isVariationHighlighted(variationFragment.id);
                        const { promotionName } = getPromotionInfo(variationFragment);
                        const ownGeosValue = getGroupedVariationTagsValue(variationFragment);
                        const promoTagId = getPromotionTagFromFragment(variationFragment);
                        const fallbackGeos = this.promotionGeosByTag.get(promoTagId) || [];
                        const geosValue = ownGeosValue || fallbackGeos.filter(Boolean).join(',');
                        return html`
                            <mas-fragment-table
                                class="mas-fragment nested-fragment ${isExpanded ? 'expanded' : ''} ${isHighlighted
                                    ? 'variation-search-highlight'
                                    : ''}"
                                data-id="${variationFragment.id}"
                                .fragmentStore=${fragmentStore}
                                .editFragmentStore=${editStore}
                                .canCreateVariation=${false}
                                .nested=${true}
                                .expanded=${isExpanded}
                                .toggleExpand=${() => this.togglePromoVariation(variationFragment.id)}
                                @dblclick=${() => this.handleEdit(editStore)}
                            ></mas-fragment-table>
                            ${isExpanded
                                ? html`
                                      <div class="grouped-variation-expanded">
                                          <div class="promo-code-field">
                                              <span class="field-label">Promotion</span>
                                              <span class="field-value">${promotionName}</span>
                                          </div>
                                          <div class="tags-group">
                                              <span class="field-label">Geos variation tags</span>
                                              <aem-tag-picker-field
                                                  namespace="/content/cq:tags/mas"
                                                  display-value
                                                  top="locale,pzn"
                                                  value="${geosValue}"
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
                <sp-tabs quiet .selected=${this.selectedTab} @change=${this.handleTabChange}>
                    ${VARIATION_TABS.map((tab) => html`<sp-tab value=${tab.id} label=${tab.label}>${tab.label}</sp-tab>`)}
                    <sp-tab-panel value="locale">${this.localeVariationsTemplate}</sp-tab-panel>
                    <sp-tab-panel value="promotion">${this.promotionVariationsTemplate}</sp-tab-panel>
                    <sp-tab-panel value="grouped">${this.groupedVariationsTemplate}</sp-tab-panel>
                </sp-tabs>
                ${this.duplicateDialogTemplate}
            </div>
        `;
    }
}

customElements.define('mas-fragment-variations', MasFragmentVariations);
