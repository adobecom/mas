import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-collapsible-table-row.css.js';
import { Fragment } from '../aem/fragment.js';
import { getItemTypeLabel, shouldIgnoreRowClickForSelection } from '../common/utils/render-utils.js';
import { getItemsSelectionStore } from '../common/items-selection-store.js';
import { loadCardVariations, fetchVariationByPath, enrichPromoVariations } from '../common/utils/items-loader.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { mergePromoReferencesIntoFragmentData } from '../promotions/promotions-repository.js';
import { getPromotionInfo, getPromotionTagFromFragment, findPromotionProjectIdByTag } from '../promotions/promotion-model.js';
import { getGroupedVariationTagsValue } from '../editors/variation-utils.js';
import Store from '../store.js';
import { PAGE_NAMES, VARIATION_TAB_NAME } from '../constants.js';
import '../aem/aem-tag-picker-field.js';

export class MasCollapsibleTableRow extends LitElement {
    static styles = styles;

    static properties = {
        topLevelCard: { type: Object },
        tabs: { type: Array },
        selectedTabKey: { type: String, state: true },
        viewOnly: { type: Boolean },
        viewOnlyTabs: { type: Array },
        isTopLevelExpanded: { type: Boolean },
        expandedVariationsPaths: { type: Set, state: true },
        isLoadingGroupedVariations: { type: Boolean, state: true },
        isLoadingPromoVariations: { type: Boolean, state: true },
        repository: { type: Object, state: true },
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
        selectableTabs: { type: Array },
        promoVariations: { type: Array, state: true },
        promoVariationsFetchedByParent: { type: Object },
        renderActionsCell: { type: Function },
        renderPreviewCell: { type: Function },
    };

    #groupedActiveLoadCount = 0;
    #promoActiveLoadCount = 0;
    #promoLoadInProgress = false;
    #loadToken = 0;
    #referencesLoaded = false;

    constructor() {
        super();
        this.getDisplayName = (fragmentData) => fragmentData?.path ?? '';
        this.renderFragmentStatusCell = () => nothing;
        this.renderActionsCell = null;
        this.renderPreviewCell = null;
        this.promoVariationsLoaded = false;
        this.isTopLevelExpanded = false;
        this.expandedVariationsPaths = new Set();
        this.variationsController = new ReactiveController(this, [getItemsSelectionStore().groupedVariationsByParent]);
        this.selectedCardsController = new ReactiveController(this, [getItemsSelectionStore().selectedCards]);
        this.promoVariations = [];
    }

    connectedCallback() {
        super.connectedCallback();
        if (!this.tabs) {
            this.tabs = [VARIATION_TAB_NAME.LOCALE, VARIATION_TAB_NAME.PROMOTION, VARIATION_TAB_NAME.GROUPED];
        }
        this.selectedTabKey ??= this.tabs[0];
        this.expandedVariationsPaths = new Set(this.variationPaths);
        this.setAttribute('value', this.topLevelCard?.path ?? '');
        this.repository = document.querySelector('mas-repository');
        this.selectableTabs ??= [VARIATION_TAB_NAME.LOCALE, VARIATION_TAB_NAME.PROMOTION, VARIATION_TAB_NAME.GROUPED];
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('topLevelCard')) {
            const prev = changedProperties.get('topLevelCard');
            if (prev?.id !== this.topLevelCard?.id) {
                this.#loadToken++;
                this.#referencesLoaded = false;
                this.promoVariationsLoaded = false;
                this.promoVariations = [];
                this.#promoLoadInProgress = false;
                this.#groupedActiveLoadCount = 0;
                this.#promoActiveLoadCount = 0;
                this.isLoadingGroupedVariations = false;
                this.isLoadingPromoVariations = false;
            }
        }
        if (changedProperties.has('promoVariationsFetchedByParent') && this.promoVariationsFetchedByParent) {
            this.promoVariations = this.promoVariationsFetchedByParent.get(this.topLevelCard?.path) || [];
        }
    }

    get topLevelCardFragment() {
        return new Fragment(this.topLevelCard);
    }

    get variationPaths() {
        return this.topLevelCardFragment.getVariations() || [];
    }

    get topLevelCardVariationsByPaths() {
        return getItemsSelectionStore().groupedVariationsByParent.value.get(this.topLevelCard.path) || new Map();
    }

    get selectedCards() {
        return getItemsSelectionStore().selectedCards.value || [];
    }

    get cells() {
        return this.viewOnly
            ? ['OfferName', 'Title', 'OfferId', 'StudioPath', 'ItemType', 'Status']
            : ['OfferName', 'Title', 'OfferId', 'StudioPath', 'Status'];
    }

    get isGroupedVariation() {
        return Fragment.isGroupedVariationPath(this.topLevelCard.path);
    }

    get groupedVariationPaths() {
        return this.variationPaths.filter(
            (path) => Fragment.isGroupedVariationPath(path) && this.topLevelCardVariationsByPaths.has(path),
        );
    }

    get allGroupedVariationsSelected() {
        const paths = this.groupedVariationPaths;
        return paths.length > 0 && paths.every((p) => this.selectedCards.includes(p));
    }

    get promoVariationPaths() {
        return this.promoVariations.map(({ path }) => path);
    }

    get somePromoVariationsSelected() {
        return this.promoVariationPaths.some((path) => this.selectedCards.includes(path));
    }

    get allPromoVariationsSelected() {
        return (
            this.promoVariationPaths.length > 0 && this.promoVariationPaths.every((path) => this.selectedCards.includes(path))
        );
    }

    get someGroupedVariationsSelected() {
        return this.groupedVariationPaths.some((p) => this.selectedCards.includes(p));
    }

    get groupedTabTemplate() {
        if (this.isLoadingGroupedVariations) {
            return html` <div class="loading-container--flex">
                <sp-progress-circle label="Loading variations" indeterminate size="l"></sp-progress-circle>
            </div>`;
        }
        const filteredVariationPaths = this.groupedVariationPaths;
        const isSelectable = this.selectableTabs.includes(VARIATION_TAB_NAME.GROUPED);
        return filteredVariationPaths.length === 0
            ? html`<div class="empty-grouped-variations">No grouped variations found</div>`
            : html`<sp-table>
                  ${isSelectable
                      ? html` <sp-table-row class="select-all-row">
                            <sp-table-cell class="table-icon-cell">
                                <sp-checkbox
                                    ?checked=${this.allGroupedVariationsSelected}
                                    ?indeterminate=${!this.allGroupedVariationsSelected && this.someGroupedVariationsSelected}
                                    @change=${(e) => this.#toggleSelectAllVariations(e, 'grouped')}
                                ></sp-checkbox>
                            </sp-table-cell>
                            <sp-table-cell class="select-all-label" colspan="5">
                                <span>Select all</span>
                                <span class="fragment-count">${filteredVariationPaths.length} fragment(s)</span>
                            </sp-table-cell>
                        </sp-table-row>`
                      : nothing}
                  <sp-table-body>
                      ${repeat(filteredVariationPaths, (variationPath) => {
                          const variation = this.topLevelCardVariationsByPaths.get(variationPath);
                          const isSelected = this.selectedCards.includes(variationPath);
                          const isExpanded = this.expandedVariationsPaths.has(variationPath);
                          return html` <sp-table-row
                                  value=${variationPath}
                                  ?selected=${isSelected}
                                  aria-selected=${isSelected ? 'true' : 'false'}
                                  @click=${isSelectable ? (event) => this.#onRowClickForSelection(event, variationPath) : null}
                              >
                                  <sp-table-cell class="table-icon-cell">
                                      <sp-button
                                          class="expand-button"
                                          icon-only
                                          quiet
                                          variant="secondary"
                                          @click=${(e) => this.#toggleExpandVariation(e, variationPath)}
                                      >
                                          ${isExpanded
                                              ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                                              : html`<sp-icon-chevron-right></sp-icon-chevron-right>`}
                                      </sp-button>
                                  </sp-table-cell>

                                  ${isSelectable
                                      ? html`<sp-table-cell class="table-icon-cell"
                                            ><sp-checkbox
                                                value=${variationPath}
                                                ?checked=${isSelected}
                                                @change=${(event) => this.#toggleSelect(event, variationPath)}
                                            ></sp-checkbox>
                                        </sp-table-cell>`
                                      : nothing}
                                  ${repeat(this.cells, (cell) => this[`render${cell}`](variation) ?? nothing)}
                              </sp-table-row>

                              ${isExpanded ? this.renderGroupedVariationDetailsRow(variationPath) : nothing}`;
                      })}
                  </sp-table-body>
              </sp-table>`;
    }

    get localeTabTemplate() {
        const localeVariations = this.topLevelCardFragment.listLocaleVariations();
        if (!localeVariations.length) {
            return html`<div class="empty-grouped-variations">No locale variations found</div>`;
        }
        return html`<sp-table>
            <sp-table-body>
                ${repeat(
                    localeVariations,
                    (variation) => variation.path,
                    (variation) =>
                        html`<sp-table-row value=${variation.path}>
                            ${this.renderOfferName(variation)} ${this.renderTitle(variation)} ${this.renderOfferId(variation)}
                            ${this.renderStudioPath(variation)} ${this.renderStatus(variation)}
                        </sp-table-row>`,
                )}
            </sp-table-body>
        </sp-table>`;
    }

    get promotionTabTemplate() {
        if (this.isLoadingPromoVariations) {
            return html` <div class="loading-container--flex">
                <sp-progress-circle label="Loading variations" indeterminate size="l"></sp-progress-circle>
            </div>`;
        }
        const isSelectable = this.selectableTabs.includes(VARIATION_TAB_NAME.PROMOTION);
        return this.promoVariations.length === 0
            ? html`<div class="empty-promotion-variations">No promotion variations found</div>`
            : html`<sp-table>
                  ${isSelectable
                      ? html`<sp-table-row class="select-all-row">
                            <sp-table-cell class="table-icon-cell">
                                <sp-checkbox
                                    ?checked=${this.allPromoVariationsSelected}
                                    ?indeterminate=${!this.allPromoVariationsSelected && this.somePromoVariationsSelected}
                                    @change=${(e) => this.#toggleSelectAllVariations(e, 'promo')}
                                ></sp-checkbox>
                            </sp-table-cell>
                            <sp-table-cell class="select-all-label" colspan="5">
                                <span>Select all</span>
                                <span class="fragment-count">${this.promoVariationPaths.length} fragment(s)</span>
                            </sp-table-cell>
                        </sp-table-row>`
                      : nothing}
                  <sp-table-body>
                      ${repeat(this.promoVariations, (variation) => {
                          const { path } = variation;
                          const isSelected = this.selectedCards.includes(path);
                          const isExpanded = this.expandedVariationsPaths.has(path);
                          return html` <sp-table-row
                                  value=${path}
                                  ?selected=${isSelected}
                                  aria-selected=${isSelected ? 'true' : 'false'}
                                  @click=${(event) => isSelectable && this.#onRowClickForSelection(event, path)}
                              >
                                  <sp-table-cell class="table-icon-cell">
                                      <sp-button
                                          class="expand-button"
                                          icon-only
                                          quiet
                                          variant="secondary"
                                          @click=${(e) => this.#toggleExpandVariation(e, path)}
                                      >
                                          ${isExpanded
                                              ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                                              : html`<sp-icon-chevron-right></sp-icon-chevron-right>`}
                                      </sp-button>
                                  </sp-table-cell>

                                  ${isSelectable
                                      ? html`<sp-table-cell class="table-icon-cell"
                                            ><sp-checkbox
                                                value=${path}
                                                ?checked=${isSelected}
                                                @change=${(event) => this.#toggleSelect(event, path)}
                                            ></sp-checkbox>
                                        </sp-table-cell>`
                                      : nothing}
                                  ${repeat(this.cells, (cell) => this[`render${cell}`](variation) ?? nothing)}
                              </sp-table-row>

                              ${isExpanded ? this.renderPromoVariationDetailsRow(variation) : nothing}`;
                      })}
                  </sp-table-body>
              </sp-table>`;
    }

    get viewOnlyTemplate() {
        const topLevelRow = html`<sp-table-row value=${this.topLevelCard.path}>
            ${this.isGroupedVariation || this.viewOnlyTabs?.length
                ? html`<sp-table-cell class="table-icon-cell">
                      <sp-button class="expand-button" icon-only quiet variant="secondary" @click=${this.#toggleExpandTopLevel}>
                          ${this.isTopLevelExpanded
                              ? html`<sp-icon-chevron-up></sp-icon-chevron-up>`
                              : html`<sp-icon-chevron-down></sp-icon-chevron-down>`}
                      </sp-button>
                  </sp-table-cell>`
                : html`<sp-table-cell class="table-icon-cell table-icon-cell--chevron"></sp-table-cell>`}
            ${repeat(this.cells, (cell) => this[`render${cell}`](this.topLevelCard) ?? nothing)}
            ${this.renderPreviewCell?.(this.topLevelCard)} ${this.renderActionsCell?.(this.topLevelCard)}
        </sp-table-row>`;

        let nestedContent = nothing;

        if (this.isTopLevelExpanded) {
            if (this.isGroupedVariation) {
                nestedContent = this.renderGroupedVariationDetailsRow(this.topLevelCard.path);
            } else if (this.viewOnlyTabs?.length) {
                if (this.viewOnlyTabs.includes(VARIATION_TAB_NAME.PROMOTION)) {
                    nestedContent = html`<div class="nested-content-container">
                        <div class="nested-content">
                            <sp-tabs quiet .selected=${this.selectedTabKey} @change=${this.#handleTabChange}>
                                ${this.tabs.map((tab) => {
                                    const label = this.#getTabLabel(tab);
                                    return html`<sp-tab value=${tab} label=${label}> ${label} </sp-tab>`;
                                })}
                                ${this.tabs.map(
                                    (tab) =>
                                        html`<sp-tab-panel value=${tab}>
                                            ${this[`${tab}TabTemplate`] ?? nothing}
                                        </sp-tab-panel>`,
                                )}
                            </sp-tabs>
                        </div>
                    </div>`;
                }
            }
        }

        return html`${topLevelRow}${nestedContent}`;
    }

    renderTitle(item) {
        return html`<sp-table-cell>${item.title || 'no title'}</sp-table-cell>`;
    }

    renderOfferName(item) {
        const iconSrc =
            item?.getFieldValue?.('mnemonicIcon') ?? item?.fields?.find((f) => f.name === 'mnemonicIcon')?.values?.[0];
        const offerName = item?.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || 'no offer name';
        return html`<sp-table-cell class="offer-cell">
            ${iconSrc ? html`<img class="mnemonic-icon" src=${iconSrc} alt="" />` : nothing}
            <span>${offerName}</span>
        </sp-table-cell>`;
    }

    renderStudioPath(item) {
        return html`<sp-table-cell class="path"><span>${item?.studioPath || 'no path'}</span></sp-table-cell>`;
    }

    renderOfferId(item) {
        const { offerId } = item?.offerData || {};
        return html`
            <sp-table-cell class="offer-id">
                ${offerId
                    ? html`<overlay-trigger triggered-by="hover">
                              <div slot="trigger">${offerId}</div>
                              <sp-tooltip slot="hover-content" placement="bottom"> ${offerId} </sp-tooltip>
                          </overlay-trigger>
                          <sp-action-button
                              icon-only
                              quiet
                              aria-label="Copy Offer ID to clipboard"
                              @click=${(e) => this.#copyToClipboard(e, offerId)}
                          >
                              <sp-icon-copy slot="icon"></sp-icon-copy>
                          </sp-action-button>`
                    : 'no offer data'}
            </sp-table-cell>
        `;
    }

    renderTags(item) {
        const tagNames = item?.fieldTags?.map(({ name }) => name) || [];
        if (!tagNames.length) return html`<sp-table-cell>no tags</sp-table-cell>`;
        return html`<sp-table-cell class="details-cell">
            <div class="details-label tags-label">Grouped variation tags</div>
            <sp-tags>${tagNames.map((tagName) => html`<sp-tag>${tagName}</sp-tag>`)}</sp-tags>
        </sp-table-cell>`;
    }

    renderGeosTags(item) {
        const geosValue = getGroupedVariationTagsValue(item) || '';
        return html`<sp-table-cell class="details-cell">
            <div class="details-label">Geos variation tags</div>
            <aem-tag-picker-field
                namespace="/content/cq:tags/mas"
                display-value
                top="locale,pzn"
                value="${geosValue}"
                readonly
            ></aem-tag-picker-field>
        </sp-table-cell>`;
    }

    renderPromoCode(item) {
        const code = item?.fields?.find((field) => field.name === 'promoCode')?.values[0] || 'no promo code';
        return html`<sp-table-cell class="details-cell">
            <div class="details-label">Promo code</div>
            <div>${code}</div>
        </sp-table-cell>`;
    }

    renderStatus(item) {
        return this.renderFragmentStatusCell(item?.status);
    }

    renderItemType(item) {
        return html`<sp-table-cell>${getItemTypeLabel(item)}</sp-table-cell>`;
    }

    #getTabLabel(tab) {
        if (!tab) return '';
        if (tab === VARIATION_TAB_NAME.GROUPED) return 'Grouped variation';
        return `${tab.slice(0, 1).toUpperCase()}${tab.slice(1, tab.length)}`;
    }

    async #copyToClipboard(e, text) {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            this.dispatchEvent(
                new CustomEvent('show-toast', {
                    detail: { text: 'Offer ID copied to clipboard', variant: 'positive' },
                    bubbles: true,
                    composed: true,
                }),
            );
        } catch (err) {
            console.error('Failed to copy:', err);
            this.dispatchEvent(
                new CustomEvent('show-toast', {
                    detail: { text: 'Failed to copy Offer ID', variant: 'negative' },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    #onRowClickForSelection(e, path) {
        if (shouldIgnoreRowClickForSelection(e)) return;
        this.#toggleSelect(e, path);
    }

    #toggleSelect = (e, path) => {
        e.stopPropagation();
        const current = getItemsSelectionStore().selectedCards.value || [];
        if (current.includes(path)) {
            getItemsSelectionStore().selectedCards.set(current.filter((p) => p !== path));
        } else {
            getItemsSelectionStore().selectedCards.set([...current, path]);
        }
    };

    #toggleSelectAllVariations(e, variationType) {
        e.stopPropagation();
        if (!['grouped', 'promo'].includes(variationType)) return;
        const paths = this[`${variationType}VariationPaths`];
        const current = getItemsSelectionStore().selectedCards.value || [];
        if (this[`all${variationType.charAt(0).toUpperCase() + variationType.slice(1)}VariationsSelected`]) {
            getItemsSelectionStore().selectedCards.set(current.filter((p) => !paths.includes(p)));
        } else {
            getItemsSelectionStore().selectedCards.set([...new Set([...current, ...paths])]);
        }
    }

    #loadTopLevelFragmentReferences() {
        if (this.#referencesLoaded || !this.topLevelCard?.id || !this.repository) return;
        this.#referencesLoaded = true;
        this.repository.aem.sites.cf.fragments
            .getById(this.topLevelCard.id)
            .then((hydrated) => {
                if (hydrated) {
                    this.topLevelCard = { ...this.topLevelCard, ...hydrated };
                }
            })
            .catch(() => {
                this.#referencesLoaded = false;
            });
    }

    async #loadPromoVariations() {
        if (this.promoVariationsLoaded || this.#promoLoadInProgress || !this.topLevelCard?.id) return;
        const token = this.#loadToken;
        this.#promoLoadInProgress = true;
        this.#promoActiveLoadCount++;
        this.isLoadingPromoVariations = true;
        mergePromoReferencesIntoFragmentData(this.repository.aem, this.topLevelCard, () => this.repository.loadPromotions())
            .then(async (mergedFragmentData) => {
                if (token !== this.#loadToken) return;
                const promoOnly = new Fragment(mergedFragmentData).listPromoVariations();
                const enriched = await enrichPromoVariations(promoOnly, this.topLevelCard, {
                    getDisplayName: this.getDisplayName,
                });
                if (token !== this.#loadToken) return;
                this.promoVariationsLoaded = true;
                this.promoVariations = enriched;
                this.expandedVariationsPaths = new Set([...this.expandedVariationsPaths, ...this.promoVariationPaths]);
            })
            .catch((error) => {
                if (token !== this.#loadToken) return;
                console.error('Failed to load promotion variations:', error);
                this.dispatchEvent(
                    new CustomEvent('show-toast', {
                        detail: { text: 'Failed to load promotion variations', variant: 'negative' },
                        bubbles: true,
                        composed: true,
                    }),
                );
            })
            .finally(() => {
                if (token !== this.#loadToken) return;
                this.#promoLoadInProgress = false;
                this.isLoadingPromoVariations = --this.#promoActiveLoadCount > 0;
            });
    }

    #toggleExpandTopLevel(e) {
        e.stopPropagation();
        this.isTopLevelExpanded = !this.isTopLevelExpanded;
        if (!this.isTopLevelExpanded) return;
        if (!this.viewOnly) {
            if (this.selectedTabKey === VARIATION_TAB_NAME.PROMOTION) {
                this.#loadPromoVariations();
            } else if (this.tabs.includes(VARIATION_TAB_NAME.LOCALE)) {
                this.#loadTopLevelFragmentReferences();
            }
        }
        if (this.isGroupedVariation) {
            if (getItemsSelectionStore().groupedVariationsData.value?.get(this.topLevelCard.path)) return;
            this.#groupedActiveLoadCount++;
            this.isLoadingGroupedVariations = true;
            fetchVariationByPath(this.topLevelCard.path, this.repository, {
                getDisplayName: this.getDisplayName,
            }).finally(() => {
                this.isLoadingGroupedVariations = --this.#groupedActiveLoadCount > 0;
            });
        } else {
            if (
                getItemsSelectionStore().groupedVariationsByParent.value?.has(this.topLevelCard.path) ||
                !this.variationPaths.length
            )
                return;
            this.#groupedActiveLoadCount++;
            this.isLoadingGroupedVariations = true;
            loadCardVariations(this.topLevelCard.path, this.variationPaths, this.repository, {
                getDisplayName: this.getDisplayName,
            }).finally(() => {
                this.isLoadingGroupedVariations = --this.#groupedActiveLoadCount > 0;
            });
        }
    }

    #toggleExpandVariation(e, path) {
        e.stopPropagation();
        const isExpanded = this.expandedVariationsPaths.has(path);
        const newSet = new Set(this.expandedVariationsPaths);
        if (isExpanded) {
            newSet.delete(path);
        } else {
            newSet.add(path);
        }
        this.expandedVariationsPaths = newSet;
    }

    renderGroupedVariationDetailsRow(variationPath) {
        return this.isLoadingGroupedVariations
            ? html`<sp-table-row class="variation-details-row variation-details-row--loading">
                  <sp-table-cell class="table-icon-cell"></sp-table-cell>
                  <sp-table-cell class="table-icon-cell"></sp-table-cell>
                  <sp-table-cell colspan="5">
                      <div class="loading-container--flex">
                          <sp-progress-circle label="Loading variation details" indeterminate size="m"></sp-progress-circle>
                      </div>
                  </sp-table-cell>
              </sp-table-row>`
            : html`<sp-table-row class="variation-details-row">
                  <sp-table-cell class="table-icon-cell"></sp-table-cell>
                  <sp-table-cell class="table-icon-cell"></sp-table-cell>
                  ${this.renderPromoCode(getItemsSelectionStore().groupedVariationsData.value?.get(variationPath))}
                  <sp-table-cell></sp-table-cell>
                  ${this.renderTags(getItemsSelectionStore().groupedVariationsData.value?.get(variationPath))}
                  <sp-table-cell></sp-table-cell>
                  <sp-table-cell></sp-table-cell>
              </sp-table-row>`;
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
        return `#page=${PAGE_NAMES.PROMOTIONS_EDITOR}&promotionId=${encodeURIComponent(id)}`;
    }

    renderPromoVariationDetailsRow(variation) {
        const { promotionName, promoProject } = getPromotionInfo(variation);
        const promoProjectUrl = this.#getPromoProjectUrl(variation);
        return html`<sp-table-row class="variation-details-row">
            <sp-table-cell class="table-icon-cell"></sp-table-cell>
            <sp-table-cell class="table-icon-cell"></sp-table-cell>
            <sp-table-cell class="details-cell">
                <div class="details-label">Promotion</div>
                <div>${promotionName}</div>
            </sp-table-cell>

            <sp-table-cell class="details-cell">
                <div class="details-label">Promotion project</div>
                <div>
                    ${promoProjectUrl
                        ? html`<a href=${promoProjectUrl} target="_blank" rel="noopener noreferrer">${promoProject}</a>`
                        : promoProject}
                </div>
            </sp-table-cell>
            ${this.renderGeosTags(variation)}
            <sp-table-cell></sp-table-cell>
            <sp-table-cell></sp-table-cell>
        </sp-table-row>`;
    }

    #handleTabChange({ target: { selected } }) {
        this.selectedTabKey = selected;
        if (selected === VARIATION_TAB_NAME.PROMOTION && this.isTopLevelExpanded && !this.viewOnly) {
            this.#loadPromoVariations();
        }
    }

    render() {
        if (this.viewOnly) return this.viewOnlyTemplate;
        const isSelected = this.selectedCards.includes(this.topLevelCard.path);
        return html`
            <sp-table-row
                value=${this.topLevelCard.path}
                ?selected=${isSelected}
                aria-selected=${isSelected ? 'true' : 'false'}
                @click=${(e) => this.#onRowClickForSelection(e, this.topLevelCard.path)}
            >
                <sp-table-cell class="table-icon-cell">
                    <sp-button class="expand-button" icon-only quiet variant="secondary" @click=${this.#toggleExpandTopLevel}>
                        ${this.isTopLevelExpanded
                            ? html`<sp-icon-chevron-up></sp-icon-chevron-up>`
                            : html`<sp-icon-chevron-down></sp-icon-chevron-down>`}
                    </sp-button>
                </sp-table-cell>
                <sp-table-cell class="table-icon-cell">
                    <sp-checkbox
                        value=${this.topLevelCard.path}
                        ?checked=${isSelected}
                        @change=${(e) => this.#toggleSelect(e, this.topLevelCard.path)}
                    ></sp-checkbox>
                </sp-table-cell>
                ${this.cells.map((cell) => this[`render${cell}`](this.topLevelCard) ?? nothing)}
            </sp-table-row>

            ${this.isTopLevelExpanded
                ? html`<div class="nested-content-container">
                      <div class="nested-content">
                          <sp-tabs quiet .selected=${this.selectedTabKey} @change=${this.#handleTabChange}>
                              ${this.tabs.map((tab) => {
                                  const label = this.#getTabLabel(tab);
                                  return html`<sp-tab value=${tab} label=${label}> ${label} </sp-tab>`;
                              })}
                              ${this.tabs.map(
                                  (tab) =>
                                      html`<sp-tab-panel value=${tab}> ${this[`${tab}TabTemplate`] ?? nothing}</sp-tab-panel>`,
                              )}
                          </sp-tabs>
                      </div>
                  </div>`
                : nothing}
        `;
    }
}

customElements.define('mas-collapsible-table-row', MasCollapsibleTableRow);
