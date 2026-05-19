import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-collapsible-table-row.css.js';
import { Fragment } from '../aem/fragment.js';
import { getItemTypeLabel } from '../common/utils/render-utils.js';
import { getItemsSelectionStore } from '../common/items-selection-store.js';
import { loadCardVariations, fetchVariationByPath } from '../common/utils/items-loader.js';
import ReactiveController from '../reactivity/reactive-controller.js';

export class MasCollapsibleTableRow extends LitElement {
    static styles = styles;

    static properties = {
        topLevelCard: { type: Object },
        tabs: { type: Array },
        selectedTabKey: { type: String, state: true },
        viewOnly: { type: Boolean },
        isTopLevelExpanded: { type: Boolean },
        expandedVariationsPaths: { type: Set, state: true },
        isLoadingVariations: { type: Boolean, state: true },
        resizeObserver: { type: Object },
        repository: { type: Object, state: true },
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
    };

    constructor() {
        super();
        this.getDisplayName = (fragmentData) => fragmentData?.path ?? '';
        this.renderFragmentStatusCell = () => nothing;
        if (!this.tabs) {
            this.tabs = [
                { label: 'Locale', key: 'locale' },
                { label: 'Promotion', key: 'promotion', disabled: true },
                { label: 'Grouped variation', key: 'groupedVariation' },
            ];
        }
        this.selectedTabKey = 'locale';
        this.isTopLevelExpanded = false;
        this.expandedVariationsPaths = new Set();
        this.resizeObserver = null;
        this.variationsController = new ReactiveController(this, [getItemsSelectionStore().groupedVariationsByParent]);
        this.selectedCardsController = new ReactiveController(this, [getItemsSelectionStore().selectedCards]);
    }

    connectedCallback() {
        super.connectedCallback();
        this.expandedVariationsPaths = new Set(this.variationPaths);
        this.setAttribute('value', this.topLevelCard?.path ?? '');
        this.repository = document.querySelector('mas-repository');
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('isTopLevelExpanded')) {
            if (this.isTopLevelExpanded) {
                requestAnimationFrame(() => {
                    this.#updateConnectorBottom();
                    this.#observeResize();
                });
            } else {
                this.resizeObserver?.disconnect();
            }
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    get variationPaths() {
        return new Fragment(this.topLevelCard).getVariations() || [];
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

    get someGroupedVariationsSelected() {
        return this.groupedVariationPaths.some((p) => this.selectedCards.includes(p));
    }

    #toggleSelectAllGrouped(e) {
        e.stopPropagation();
        const paths = this.groupedVariationPaths;
        const current = getItemsSelectionStore().selectedCards.value || [];
        if (this.allGroupedVariationsSelected) {
            getItemsSelectionStore().selectedCards.set(current.filter((p) => !paths.includes(p)));
        } else {
            getItemsSelectionStore().selectedCards.set([...new Set([...current, ...paths])]);
        }
    }

    get groupedVariationTabTemplate() {
        if (this.isLoadingVariations) {
            return html` <div class="loading-container--flex">
                <sp-progress-circle label="Loading variations" indeterminate size="l"></sp-progress-circle>
            </div>`;
        }
        const filteredVariationPaths = this.groupedVariationPaths;
        return filteredVariationPaths.length === 0
            ? html`<div class="empty-grouped-variations">No grouped variations found</div>`
            : html`<sp-table>
                  <sp-table-row class="select-all-row">
                      <sp-table-cell class="translation-table-icon-cell"></sp-table-cell>
                      <sp-table-cell class="translation-table-icon-cell">
                          <sp-checkbox
                              ?checked=${this.allGroupedVariationsSelected}
                              ?indeterminate=${!this.allGroupedVariationsSelected && this.someGroupedVariationsSelected}
                              @change=${this.#toggleSelectAllGrouped}
                          ></sp-checkbox>
                      </sp-table-cell>
                      <sp-table-cell class="select-all-label" colspan="5">
                          <span>Select all</span>
                          <span class="fragment-count">${filteredVariationPaths.length} fragment(s)</span>
                      </sp-table-cell>
                  </sp-table-row>
                  <sp-table-body>
                      ${repeat(filteredVariationPaths, (variationPath) => {
                          const variation = this.topLevelCardVariationsByPaths.get(variationPath);
                          const isSelected = this.selectedCards.includes(variationPath);
                          const isExpanded = this.expandedVariationsPaths.has(variationPath);
                          return html` <sp-table-row
                                  value=${variationPath}
                                  ?selected=${isSelected}
                                  aria-selected=${isSelected ? 'true' : 'false'}
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
                                              ? html`<sp-icon-chevron-up></sp-icon-chevron-up>`
                                              : html`<sp-icon-chevron-down></sp-icon-chevron-down>`}
                                      </sp-button>
                                  </sp-table-cell>
                                  <sp-table-cell class="table-icon-cell">
                                      <sp-checkbox
                                          value=${variationPath}
                                          ?checked=${isSelected}
                                          @change=${(e) => this.#toggleSelect(e, variationPath)}
                                      ></sp-checkbox>
                                  </sp-table-cell>
                                  ${repeat(this.cells, (cell) => this[`render${cell}`](variation) ?? nothing)}
                              </sp-table-row>

                              ${isExpanded ? this.renderGroupedVariationDetailsRow(variationPath) : nothing}`;
                      })}
                  </sp-table-body>
              </sp-table>`;
    }

    get localeTabTemplate() {
        const localeVariations = new Fragment(this.topLevelCard).listLocaleVariations();
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
                            <sp-table-cell
                                class="translation-table-icon-cell translation-table-icon-cell--chevron"
                            ></sp-table-cell>
                            <sp-table-cell
                                class="translation-table-icon-cell translation-table-icon-cell--checkbox"
                            ></sp-table-cell>
                            ${this.renderOfferName(variation)} ${this.renderTitle(variation)} ${this.renderOfferId(variation)}
                            ${this.renderStudioPath(variation)} ${this.renderStatus(variation)}
                        </sp-table-row>`,
                )}
            </sp-table-body>
        </sp-table>`;
    }

    get promotionTabTemplate() {
        return html`<div>To be implemented</div>`;
    }

    get viewOnlyTemplate() {
        return html`<sp-table-row value=${this.topLevelCard.path}>
                ${this.isGroupedVariation
                    ? html`<sp-table-cell class="table-icon-cell">
                          <sp-button
                              class="expand-button"
                              icon-only
                              quiet
                              variant="secondary"
                              @click=${this.#toggleExpandTopLevel}
                          >
                              ${this.isTopLevelExpanded
                                  ? html`<sp-icon-chevron-up></sp-icon-chevron-up>`
                                  : html`<sp-icon-chevron-down></sp-icon-chevron-down>`}
                          </sp-button>
                      </sp-table-cell>`
                    : html`<sp-table-cell class="table-icon-cell table-icon-cell--chevron"></sp-table-cell>`}
                ${repeat(this.cells, (cell) => this[`render${cell}`](this.topLevelCard) ?? nothing)}
            </sp-table-row>

            ${this.isTopLevelExpanded ? this.renderGroupedVariationDetailsRow(this.topLevelCard.path) : nothing} `;
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
        return html` <sp-table-cell class="tags-cell">
            <div class="tags-label">Grouped variation tags</div>
            <sp-tags>${tagNames.map((tagName) => html`<sp-tag>${tagName}</sp-tag>`)}</sp-tags>
        </sp-table-cell>`;
    }

    renderPromoCode(item) {
        const code = item?.fields?.find((field) => field.name === 'promoCode')?.values[0] || 'no promo code';
        return html`<sp-table-cell>${code}</sp-table-cell>`;
    }

    renderStatus(item) {
        return this.renderFragmentStatusCell(item?.status);
    }

    renderItemType(item) {
        return html`<sp-table-cell>${getItemTypeLabel(item)}</sp-table-cell>`;
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

    #hasConnector() {
        if (this.selectedTabKey === 'groupedVariation') return this.topLevelCardVariationsByPaths.size > 0;
        if (this.selectedTabKey === 'locale') return new Fragment(this.topLevelCard).listLocaleVariations().length > 0;
        return false;
    }

    /** Updates the bottom position of the connector between the nested content and the last row of the selected tab panel */
    #updateConnectorBottom() {
        const nestedContent = this.shadowRoot?.querySelector('.nested-content');
        if (!nestedContent) return;

        const selectedTabPanel = nestedContent.querySelector('sp-tab-panel[selected]');
        const rows = selectedTabPanel?.querySelectorAll('sp-table-row:not(.variation-details-row)');
        const lastRow = rows?.[rows.length - 1];
        if (!lastRow) return;

        let connectorBottom = lastRow.offsetHeight / 2 + 16;
        if (this.expandedVariationsPaths.has(lastRow.getAttribute('value'))) {
            connectorBottom += lastRow.nextElementSibling?.offsetHeight ?? 0;
        }
        nestedContent.style.setProperty('--nested-content-connector-bottom', `${connectorBottom}px`);
    }

    /** Observes the resize of the nested content when user changes the window width, and updates the bottom position of the connector */
    #observeResize() {
        const nestedContent = this.shadowRoot?.querySelector('.nested-content');
        if (!nestedContent) return;

        this.resizeObserver?.disconnect();
        this.resizeObserver = new ResizeObserver(() => {
            this.#updateConnectorBottom();
        });
        this.resizeObserver.observe(nestedContent);
    }

    #toggleSelect(e, path) {
        e.stopPropagation();
        const current = getItemsSelectionStore().selectedCards.value || [];
        if (current.includes(path)) {
            getItemsSelectionStore().selectedCards.set(current.filter((p) => p !== path));
        } else {
            getItemsSelectionStore().selectedCards.set([...current, path]);
        }
    }

    #toggleExpandTopLevel(e) {
        e.stopPropagation();
        this.isTopLevelExpanded = !this.isTopLevelExpanded;
        if (this.isGroupedVariation) {
            if (getItemsSelectionStore().groupedVariationsData.value?.get(this.topLevelCard.path)) return;
            this.isLoadingVariations = true;
            fetchVariationByPath(this.topLevelCard.path, this.repository, {
                getDisplayName: this.getDisplayName,
            }).finally(() => {
                this.isLoadingVariations = false;
            });
        } else {
            if (
                getItemsSelectionStore().groupedVariationsByParent.value?.has(this.topLevelCard.path) ||
                !this.variationPaths.length
            )
                return;
            this.isLoadingVariations = true;
            loadCardVariations(this.topLevelCard.path, this.variationPaths, this.repository, {
                getDisplayName: this.getDisplayName,
            }).finally(() => {
                this.isLoadingVariations = false;
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
        return this.isLoadingVariations
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

    #handleTabChange({ target: { selected } }) {
        this.selectedTabKey = selected;
    }

    render() {
        if (this.viewOnly) return this.viewOnlyTemplate;
        const isSelected = this.selectedCards.includes(this.topLevelCard.path);
        return html`
            <sp-table-row
                value=${this.topLevelCard.path}
                ?selected=${isSelected}
                aria-selected=${isSelected ? 'true' : 'false'}
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
                      <div class="nested-content ${this.#hasConnector() ? 'has-connector' : ''}">
                          <sp-tabs quiet .selected=${this.selectedTabKey} @change=${this.#handleTabChange}>
                              ${this.tabs.map(
                                  (tab) =>
                                      html`<sp-tab value=${tab.key} label=${tab.label} ?disabled=${tab.disabled}>
                                          ${tab.label}
                                      </sp-tab>`,
                              )}
                              ${this.tabs.map(
                                  (tab) =>
                                      html`<sp-tab-panel value=${tab.key}>
                                          ${this[`${tab.key}TabTemplate`] ?? nothing}
                                      </sp-tab-panel>`,
                              )}
                          </sp-tabs>
                      </div>
                  </div>`
                : nothing}
        `;
    }
}

customElements.define('mas-collapsible-table-row', MasCollapsibleTableRow);
