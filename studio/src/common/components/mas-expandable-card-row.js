import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-expandable-card-row.css.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../constants.js';
import { renderFragmentStatusCell } from '../utils/render-utils.js';
import { Fragment } from '../../aem/fragment.js';

/**
 * An expandable table row for cards with grouped variations and promotions.
 * Props-driven: receives card data and variations, emits events for interactions.
 *
 * @fires selection-changed - detail: { path: string, selected: boolean }
 * @fires load-variations - detail: { cardPath: string, variationPaths: string[] }
 * @fires show-toast - detail: { text: string, variant: string }
 *
 * @property {Object} card - The card fragment data
 * @property {Map} variationsByPath - Map of variationPath -> variation data for this card
 * @property {Set} selectedPaths - Set of currently selected paths
 * @property {boolean} viewOnly - Whether in read-only mode
 * @property {boolean} loadingVariations - Whether variations are being loaded
 */
export class MasExpandableCardRow extends LitElement {
    static styles = styles;

    static properties = {
        card: { type: Object },
        variationsByPath: { type: Object },
        selectedPaths: { type: Object },
        viewOnly: { type: Boolean },
        loadingVariations: { type: Boolean },
        isExpanded: { type: Boolean, state: true },
        expandedVariationsPaths: { type: Object, state: true },
    };

    constructor() {
        super();
        this.card = null;
        this.variationsByPath = new Map();
        this.selectedPaths = new Set();
        this.viewOnly = false;
        this.loadingVariations = false;
        this.isExpanded = false;
        this.expandedVariationsPaths = new Set();
        this.tabs = [
            { label: 'Promotion', key: 'promotion', disabled: true },
            { label: 'Grouped variation', key: 'groupedVariation', selected: true },
        ];
    }

    connectedCallback() {
        super.connectedCallback();
        this.setAttribute('value', this.card?.path ?? '');
    }

    get variationPaths() {
        return new Fragment(this.card).getVariations() || [];
    }

    get cells() {
        return this.viewOnly
            ? ['OfferName', 'Title', 'OfferId', 'StudioPath', 'ItemType', 'Status']
            : ['OfferName', 'Title', 'OfferId', 'StudioPath', 'Status'];
    }

    get isGroupedVariation() {
        return Fragment.isGroupedVariationPath(this.card?.path);
    }

    #toggleSelect(e, path) {
        e.stopPropagation();
        const isSelected = this.selectedPaths.has(path);
        this.dispatchEvent(
            new CustomEvent('selection-changed', {
                detail: { path, selected: !isSelected },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #toggleExpand(e) {
        e.stopPropagation();
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded && this.variationPaths.length > 0 && this.variationsByPath.size === 0) {
            this.dispatchEvent(
                new CustomEvent('load-variations', {
                    detail: { cardPath: this.card.path, variationPaths: this.variationPaths },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    #toggleExpandVariation(e, path) {
        e.stopPropagation();
        const newSet = new Set(this.expandedVariationsPaths);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        this.expandedVariationsPaths = newSet;
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
        }
    }

    renderTitle(item) {
        return html`<sp-table-cell>${item?.title || 'no title'}</sp-table-cell>`;
    }

    renderOfferName(item) {
        return html`<sp-table-cell>
            ${item?.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || 'no offer name'}
        </sp-table-cell>`;
    }

    renderStudioPath(item) {
        return html`<sp-table-cell>${item?.studioPath || 'no path'}</sp-table-cell>`;
    }

    renderOfferId(item) {
        const { offerId } = item?.offerData || {};
        return html`
            <sp-table-cell class="offer-id">
                ${offerId
                    ? html`<overlay-trigger triggered-by="hover">
                              <div slot="trigger">${offerId}</div>
                              <sp-tooltip slot="hover-content" placement="bottom">${offerId}</sp-tooltip>
                          </overlay-trigger>
                          <sp-action-button
                              icon-only
                              quiet
                              aria-label="Copy Offer ID"
                              @click=${(e) => this.#copyToClipboard(e, offerId)}
                          >
                              <sp-icon-copy slot="icon"></sp-icon-copy>
                          </sp-action-button>`
                    : 'no offer data'}
            </sp-table-cell>
        `;
    }

    renderStatus(item) {
        return renderFragmentStatusCell(item?.status);
    }

    renderItemType(item) {
        if (Fragment.isGroupedVariationPath(item?.path)) return html`<sp-table-cell>Grouped variation</sp-table-cell>`;
        if (item?.model?.path?.includes('/dictionary/')) return html`<sp-table-cell>Placeholder</sp-table-cell>`;
        if (item?.model?.path === COLLECTION_MODEL_PATH) return html`<sp-table-cell>Collection</sp-table-cell>`;
        if (item?.model?.path === CARD_MODEL_PATH) return html`<sp-table-cell>Default</sp-table-cell>`;
        return html`<sp-table-cell>no type</sp-table-cell>`;
    }

    renderTags(item) {
        const tagNames = item?.fieldTags?.map(({ name }) => name) || [];
        if (!tagNames.length) return html`<sp-table-cell>no tags</sp-table-cell>`;
        return html`<sp-table-cell class="tags-cell">
            <div class="tags-label">Grouped variation tags</div>
            <sp-tags>${repeat(tagNames, (name) => html`<sp-tag>${name}</sp-tag>`)}</sp-tags>
        </sp-table-cell>`;
    }

    renderPromoCode(item) {
        const code = item?.fields?.find((f) => f.name === 'promoCode')?.values[0] || 'no promo code';
        return html`<sp-table-cell>${code}</sp-table-cell>`;
    }

    get groupedVariationTabTemplate() {
        if (this.loadingVariations) {
            return html`<div class="loading-container--flex">
                <sp-progress-circle label="Loading variations" indeterminate size="l"></sp-progress-circle>
            </div>`;
        }

        const filteredPaths = this.variationPaths.filter(
            (path) => Fragment.isGroupedVariationPath(path) && this.variationsByPath.has(path),
        );

        if (filteredPaths.length === 0) {
            return html`<div>No grouped variations found</div>`;
        }

        return html`<sp-table>
            <sp-table-body>
                ${repeat(filteredPaths, (variationPath) => {
                    const variation = this.variationsByPath.get(variationPath);
                    const isSelected = this.selectedPaths.has(variationPath);
                    const isExpanded = this.expandedVariationsPaths.has(variationPath);
                    return html`
                        <sp-table-row value=${variationPath} ?selected=${isSelected}>
                            <sp-table-cell class="icon-cell">
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
                            <sp-table-cell class="icon-cell">
                                <sp-checkbox
                                    value=${variationPath}
                                    ?checked=${isSelected}
                                    @change=${(e) => this.#toggleSelect(e, variationPath)}
                                ></sp-checkbox>
                            </sp-table-cell>
                            ${repeat(this.cells, (cell) => this[`render${cell}`](variation) ?? nothing)}
                        </sp-table-row>
                        ${isExpanded ? this.#renderVariationDetailsRow(variationPath) : nothing}
                    `;
                })}
            </sp-table-body>
        </sp-table>`;
    }

    get promotionTabTemplate() {
        return html`<div>To be implemented</div>`;
    }

    #renderVariationDetailsRow(variationPath) {
        const variation = this.variationsByPath.get(variationPath);
        if (this.loadingVariations) {
            return html`<sp-table-row class="variation-details-row">
                <sp-table-cell class="icon-cell"></sp-table-cell>
                <sp-table-cell class="icon-cell"></sp-table-cell>
                <sp-table-cell colspan="5">
                    <div class="loading-container--flex">
                        <sp-progress-circle label="Loading" indeterminate size="m"></sp-progress-circle>
                    </div>
                </sp-table-cell>
            </sp-table-row>`;
        }
        return html`<sp-table-row class="variation-details-row">
            <sp-table-cell class="icon-cell"></sp-table-cell>
            <sp-table-cell class="icon-cell"></sp-table-cell>
            ${this.renderPromoCode(variation)}
            <sp-table-cell></sp-table-cell>
            ${this.renderTags(variation)}
            <sp-table-cell></sp-table-cell>
            <sp-table-cell></sp-table-cell>
        </sp-table-row>`;
    }

    render() {
        if (!this.card) return nothing;

        const isSelected = this.selectedPaths.has(this.card.path);
        const selectedTab = this.tabs.find((t) => t.selected);

        if (this.viewOnly) {
            return html`
                <sp-table-row value=${this.card.path}>
                    ${this.isGroupedVariation
                        ? html`<sp-table-cell class="icon-cell">
                              <sp-button class="expand-button" icon-only quiet variant="secondary" @click=${this.#toggleExpand}>
                                  ${this.isExpanded
                                      ? html`<sp-icon-chevron-up></sp-icon-chevron-up>`
                                      : html`<sp-icon-chevron-down></sp-icon-chevron-down>`}
                              </sp-button>
                          </sp-table-cell>`
                        : html`<sp-table-cell class="icon-cell icon-cell--chevron"></sp-table-cell>`}
                    ${repeat(this.cells, (cell) => this[`render${cell}`](this.card) ?? nothing)}
                </sp-table-row>
                ${this.isExpanded ? this.#renderVariationDetailsRow(this.card.path) : nothing}
            `;
        }

        return html`
            <sp-table-row value=${this.card.path} ?selected=${isSelected}>
                <sp-table-cell class="icon-cell">
                    <sp-button class="expand-button" icon-only quiet variant="secondary" @click=${this.#toggleExpand}>
                        ${this.isExpanded
                            ? html`<sp-icon-chevron-up></sp-icon-chevron-up>`
                            : html`<sp-icon-chevron-down></sp-icon-chevron-down>`}
                    </sp-button>
                </sp-table-cell>
                <sp-table-cell class="icon-cell">
                    <sp-checkbox
                        value=${this.card.path}
                        ?checked=${isSelected}
                        @change=${(e) => this.#toggleSelect(e, this.card.path)}
                    ></sp-checkbox>
                </sp-table-cell>
                ${repeat(this.cells, (cell) => this[`render${cell}`](this.card) ?? nothing)}
            </sp-table-row>

            ${this.isExpanded
                ? html`<div class="nested-content-container">
                      <div class="nested-content ${this.variationsByPath.size > 0 ? 'has-connector' : ''}">
                          <sp-tabs quiet .selected=${selectedTab?.key}>
                              ${repeat(
                                  this.tabs,
                                  (tab) =>
                                      html`<sp-tab value=${tab.key} label=${tab.label} ?disabled=${tab.disabled}
                                          >${tab.label}</sp-tab
                                      >`,
                              )}
                              ${repeat(
                                  this.tabs,
                                  (tab) =>
                                      html`<sp-tab-panel value=${tab.key}
                                          >${this[`${tab.key}TabTemplate`] ?? nothing}</sp-tab-panel
                                      >`,
                              )}
                          </sp-tabs>
                      </div>
                  </div>`
                : nothing}
        `;
    }
}

customElements.define('mas-expandable-card-row', MasExpandableCardRow);
