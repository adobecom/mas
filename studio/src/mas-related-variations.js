import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-related-variations.css.js';
import { Fragment } from './aem/fragment.js';
import { VARIATION_TAB_NAME, PAGE_NAMES } from './constants.js';
import Store from './store.js';
import Events from './events.js';
import { extractLocaleFromPath } from './utils.js';
import { shouldIgnoreRowClickForSelection, renderInheritedTagsNotice } from './common/utils/render-utils.js';
import { getPromotionTagFromFragment, getPromotionInfo, findPromotionProjectIdByTag } from './promotions/promotion-model.js';
import * as promotionsRepository from './promotions/promotions-repository.js';
import { enrichPromoVariations, loadCardVariations } from './common/utils/items-loader.js';
import { getGroupedVariationTagsValue } from './editors/variation-utils.js';
import { getItemsSelectionStore } from './common/items-selection-store.js';

export default class MasRelatedVariations extends LitElement {
    static styles = styles;

    static properties = {
        fragment: { type: Object },
        targetFragment: { type: Object },
        isVariation: { type: Boolean },
        isPromoVariation: { type: Boolean },
        repository: { type: Object },
        expandedVariationTypes: { type: Object, state: true },
        promoVariations: { type: Array, state: true },
        isLoadingPromoVariations: { type: Boolean, state: true },
        groupedVariations: { type: Array, state: true },
        isLoadingGroupedVariations: { type: Boolean, state: true },
    };

    #promoVariationsLoadToken = 0;
    #promoVariationsLoadedForId = null;
    #groupedVariationsLoadToken = 0;
    #groupedVariationsLoadedForId = null;

    constructor() {
        super();
        this.expandedVariationTypes = new Set();
        this.promoVariations = [];
        this.isLoadingPromoVariations = false;
        this.groupedVariations = [];
        this.isLoadingGroupedVariations = false;
    }

    willUpdate(changedProperties) {
        super.willUpdate(changedProperties);
        this.#maybeLoadPromoVariations();
        this.#maybeLoadGroupedVariations();
    }

    #maybeLoadPromoVariations() {
        if (!this.expandedVariationTypes.has(VARIATION_TAB_NAME.PROMOTION)) return;
        const targetFragment = this.targetFragment;
        if (!targetFragment?.id || targetFragment.id === this.#promoVariationsLoadedForId) return;
        void this.#loadPromoVariationsFor(targetFragment);
    }

    async #loadPromoVariationsFor(targetFragment) {
        const token = ++this.#promoVariationsLoadToken;
        this.isLoadingPromoVariations = true;
        try {
            const mergedFragmentData = await promotionsRepository.mergePromoReferencesIntoFragmentData(
                this.repository.aem,
                targetFragment,
                () => this.repository.loadPromotions(),
            );
            if (token !== this.#promoVariationsLoadToken) return;
            const promoOnly = new Fragment(mergedFragmentData).listPromoVariations();
            const enriched = await enrichPromoVariations(promoOnly, targetFragment, {
                getDisplayName: (fragmentData) => fragmentData?.path ?? '',
            });
            if (token !== this.#promoVariationsLoadToken) return;
            this.promoVariations = enriched;
            this.#promoVariationsLoadedForId = targetFragment.id;
        } catch (error) {
            if (token !== this.#promoVariationsLoadToken) return;
            console.error('Failed to load promotion variations:', error);
            Events.toast.emit({ variant: 'negative', content: 'Failed to load promotion variations' });
        } finally {
            if (token === this.#promoVariationsLoadToken) this.isLoadingPromoVariations = false;
        }
    }

    #getPromoProjectUrl(variation) {
        const promotionTagId = getPromotionTagFromFragment(variation);
        if (!promotionTagId) return null;
        let projects =
            Store.promotions.list.data
                .get()
                ?.map((store) => store.get())
                .filter(Boolean) || [];
        if (!projects.length && Store.promotions.inEdit.get()) {
            projects = [Store.promotions.inEdit.get()?.value];
        }
        const id = findPromotionProjectIdByTag(promotionTagId, projects);
        if (!id) return null;
        const params = new URLSearchParams(window.location.hash.slice(1));
        params.set('page', PAGE_NAMES.PROMOTIONS_EDITOR);
        params.set('promotionId', id);
        return `#${params.toString()}`;
    }

    #navigateToVariation(variation) {
        if (!variation?.id) return;
        const params = new URLSearchParams(window.location.hash.slice(1));
        params.set('page', PAGE_NAMES.FRAGMENT_EDITOR);
        params.set('fragmentId', variation.id);
        window.open(`#${params.toString()}`, '_blank', 'noopener');
    }

    #handleVariationRowDblClick(event, variation) {
        if (shouldIgnoreRowClickForSelection(event)) return;
        this.#navigateToVariation(variation);
    }

    #renderVariationsSkeletonRows(columnCount) {
        return Array.from(
            { length: 3 },
            (_, i) =>
                html`<sp-table-row class="skeleton-row" key=${i}>
                    ${Array.from(
                        { length: columnCount },
                        (_, j) =>
                            html`<sp-table-cell key=${j}
                                ><div class="skeleton-element skeleton-table-cell"></div
                            ></sp-table-cell>`,
                    )}
                </sp-table-row>`,
        );
    }

    #renderPromoVariationRow(variation) {
        const { promoProject } = getPromotionInfo(variation);
        const promoProjectUrl = this.#getPromoProjectUrl(variation);
        const geosValue = getGroupedVariationTagsValue(variation) || '';
        return html`
            <sp-table-row @dblclick=${(e) => this.#handleVariationRowDblClick(e, variation)}>
                ${this.#renderVariationTitleCell(variation)}
                <sp-table-cell>
                    ${promoProjectUrl
                        ? html`<a href=${promoProjectUrl} target="_blank" rel="noopener noreferrer">${promoProject}</a>`
                        : promoProject}
                </sp-table-cell>
                <sp-table-cell>
                    ${geosValue
                        ? html`<aem-tag-picker-field
                              namespace="/content/cq:tags/mas"
                              display-value
                              top="locale,pzn"
                              value="${geosValue}"
                              readonly
                          ></aem-tag-picker-field>`
                        : renderInheritedTagsNotice()}
                </sp-table-cell>
            </sp-table-row>
        `;
    }

    #renderPromoVariationsTable() {
        if (this.isLoadingPromoVariations) {
            return html`<sp-table size="m"><sp-table-body>${this.#renderVariationsSkeletonRows(3)}</sp-table-body></sp-table>`;
        }
        const promoVariations = this.promoVariations.filter((variation) => variation.path !== this.fragment?.path);
        if (!promoVariations.length) {
            return html`<div class="empty-variations-message">No promotion variations found</div>`;
        }
        return html`
            <sp-table size="m">
                <sp-table-head>
                    <sp-table-head-cell>Variation name</sp-table-head-cell>
                    <sp-table-head-cell>Promotion project</sp-table-head-cell>
                    <sp-table-head-cell>Geos variation tags</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        promoVariations,
                        (variation) => variation.path,
                        (variation) => this.#renderPromoVariationRow(variation),
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    #maybeLoadGroupedVariations() {
        if (!this.expandedVariationTypes.has(VARIATION_TAB_NAME.GROUPED)) return;
        const targetFragment = this.targetFragment;
        if (!targetFragment?.id || targetFragment.id === this.#groupedVariationsLoadedForId) return;
        void this.#loadGroupedVariationsFor(targetFragment);
    }

    async #loadGroupedVariationsFor(targetFragment) {
        const token = ++this.#groupedVariationsLoadToken;
        this.isLoadingGroupedVariations = true;
        try {
            const groupedVariationPaths = targetFragment.listGroupedVariations().map((v) => v.path);
            await loadCardVariations(targetFragment.path, groupedVariationPaths, this.repository, {
                getDisplayName: (fragmentData) => fragmentData?.path ?? '',
            });
            if (token !== this.#groupedVariationsLoadToken) return;
            const variationsByPath = getItemsSelectionStore().groupedVariationsByParent.value?.get(targetFragment.path);
            this.groupedVariations = variationsByPath ? [...variationsByPath.values()] : [];
            this.#groupedVariationsLoadedForId = targetFragment.id;
        } catch (error) {
            if (token !== this.#groupedVariationsLoadToken) return;
            console.error('Failed to load grouped variations:', error);
            Events.toast.emit({ variant: 'negative', content: 'Failed to load grouped variations' });
        } finally {
            if (token === this.#groupedVariationsLoadToken) this.isLoadingGroupedVariations = false;
        }
    }

    #renderPathCell(path) {
        return html`<sp-table-cell class="path">${path}</sp-table-cell>`;
    }

    #renderVariationTitleCell(variation) {
        const title = variation.title || 'no title';
        if (!variation?.id) return html`<sp-table-cell>${title}</sp-table-cell>`;
        const params = new URLSearchParams(window.location.hash.slice(1));
        params.set('page', PAGE_NAMES.FRAGMENT_EDITOR);
        params.set('fragmentId', variation.id);
        const href = `#${params.toString()}`;
        return html`<sp-table-cell>
            <a
                href=${href}
                target="_blank"
                rel="noopener noreferrer"
                @click=${(e) => e.stopPropagation()}
                @dblclick=${(e) => e.stopPropagation()}
                >${title}</a
            >
        </sp-table-cell>`;
    }

    #renderGroupedVariationRow(variation) {
        const tagNames = variation?.fieldTags?.map(({ name }) => name) || [];
        return html`
            <sp-table-row @dblclick=${(e) => this.#handleVariationRowDblClick(e, variation)}>
                ${this.#renderVariationTitleCell(variation)} ${this.#renderPathCell(variation.path)}
                <sp-table-cell>
                    ${tagNames.length
                        ? html`<sp-tags>${tagNames.map((tagName) => html`<sp-tag>${tagName}</sp-tag>`)}</sp-tags>`
                        : 'no tags'}
                </sp-table-cell>
            </sp-table-row>
        `;
    }

    #renderGroupedVariationsTable() {
        if (this.isLoadingGroupedVariations) {
            return html`<sp-table size="m"><sp-table-body>${this.#renderVariationsSkeletonRows(4)}</sp-table-body></sp-table>`;
        }
        const groupedVariations = this.groupedVariations.filter((variation) => variation.path !== this.fragment?.path);
        if (!groupedVariations.length) {
            return html`<div class="empty-variations-message">No grouped variations found</div>`;
        }
        return html`
            <sp-table size="m">
                <sp-table-head>
                    <sp-table-head-cell>Variation name</sp-table-head-cell>
                    <sp-table-head-cell class="path">Path</sp-table-head-cell>
                    <sp-table-head-cell>Grouped tags</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        groupedVariations,
                        (variation) => variation.path,
                        (variation) => this.#renderGroupedVariationRow(variation),
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    #renderLocaleVariationRow(variation) {
        const region = extractLocaleFromPath(variation.path) || '-';
        return html`
            <sp-table-row @dblclick=${(e) => this.#handleVariationRowDblClick(e, variation)}>
                ${this.#renderVariationTitleCell(variation)} ${this.#renderPathCell(variation.path)}
                <sp-table-cell>${region}</sp-table-cell>
            </sp-table-row>
        `;
    }

    #renderLocaleVariationsTable(targetFragment) {
        const localeVariations = targetFragment
            .listLocaleVariations()
            .filter((variation) => variation.path !== this.fragment?.path);
        if (!localeVariations.length) {
            return html`<div class="empty-variations-message">No locale variations found</div>`;
        }
        return html`
            <sp-table size="m">
                <sp-table-head>
                    <sp-table-head-cell>Variation name</sp-table-head-cell>
                    <sp-table-head-cell class="path">Path</sp-table-head-cell>
                    <sp-table-head-cell>Region</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>
                    ${repeat(
                        localeVariations,
                        (variation) => variation.path,
                        (variation) => this.#renderLocaleVariationRow(variation),
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    #toggleVariationType(type) {
        const next = new Set(this.expandedVariationTypes);
        next.has(type) ? next.delete(type) : next.add(type);
        this.expandedVariationTypes = next;
    }

    #renderVariationTypeTable(type, targetFragment) {
        if (type === VARIATION_TAB_NAME.PROMOTION) return this.#renderPromoVariationsTable();
        if (type === VARIATION_TAB_NAME.GROUPED) return this.#renderGroupedVariationsTable();
        return this.#renderLocaleVariationsTable(targetFragment);
    }

    get currentVariationType() {
        if (!this.fragment) return null;
        if (Fragment.isGroupedVariationPath(this.fragment.path)) return VARIATION_TAB_NAME.GROUPED;
        if (this.isPromoVariation) return VARIATION_TAB_NAME.PROMOTION;
        return VARIATION_TAB_NAME.LOCALE;
    }

    render() {
        const targetFragment = this.targetFragment;
        if (!targetFragment || targetFragment.getTotalVariationCount() === 0) return nothing;

        const labels = {
            [VARIATION_TAB_NAME.LOCALE]: 'Locale variations',
            [VARIATION_TAB_NAME.PROMOTION]: 'Promo variations',
            [VARIATION_TAB_NAME.GROUPED]: 'Grouped variations',
        };

        const renderSection = (type) => {
            const label = labels[type];
            const expanded = this.expandedVariationTypes.has(type);
            return html`
                <div class="variation-type-section">
                    <sp-action-button
                        quiet
                        class="variation-type-toggle"
                        label=${label}
                        @click=${() => this.#toggleVariationType(type)}
                    >
                        ${expanded
                            ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-right slot="icon"></sp-icon-chevron-right>`}
                        ${label}
                    </sp-action-button>
                    ${expanded ? this.#renderVariationTypeTable(type, targetFragment) : nothing}
                </div>
            `;
        };

        if (this.isVariation) {
            return html`
                <div class="related-variations-container">
                    <h3 class="related-variations-title">Sibling variations:</h3>
                    ${renderSection(this.currentVariationType)}
                </div>
            `;
        }

        return html`
            <div class="related-variations-container">
                ${renderSection(VARIATION_TAB_NAME.LOCALE)} ${renderSection(VARIATION_TAB_NAME.PROMOTION)}
                ${renderSection(VARIATION_TAB_NAME.GROUPED)}
            </div>
        `;
    }
}

customElements.define('mas-related-variations', MasRelatedVariations);
