import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-items-table.css.js';
import { TABLE_TYPE } from '../../constants.js';
import { renderFragmentStatusCell } from '../utils/render-utils.js';
import './mas-expandable-card-row.js';

/**
 * Table component for displaying and selecting items (cards, collections, placeholders).
 * Props-driven: receives items and selected state, emits events for selection changes.
 *
 * @fires selection-changed - detail: { path: string, selected: boolean }
 * @fires load-variations - detail: { cardPath: string, variationPaths: string[] }
 * @fires show-toast - detail: { text: string, variant: string }
 *
 * @property {string} type - 'cards' | 'collections' | 'placeholders'
 * @property {Array} items - Items to display
 * @property {Set} selectedPaths - Currently selected paths
 * @property {Map} variationsByParent - Map of cardPath -> Map of variationPath -> variation
 * @property {boolean} viewOnly - Read-only mode
 * @property {boolean} loading - Whether data is loading
 * @property {boolean} hasMore - Whether more pages are available
 * @property {boolean} loadingMore - Whether loading additional pages
 */
class MasItemsTable extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String },
        items: { type: Array },
        selectedPaths: { type: Object },
        variationsByParent: { type: Object },
        viewOnly: { type: Boolean },
        loading: { type: Boolean },
        hasMore: { type: Boolean },
        loadingMore: { type: Boolean },
    };

    constructor() {
        super();
        this.type = TABLE_TYPE.CARDS;
        this.items = [];
        this.selectedPaths = new Set();
        this.variationsByParent = new Map();
        this.viewOnly = false;
        this.loading = false;
        this.hasMore = false;
        this.loadingMore = false;
    }

    get tableColumns() {
        const COLUMNS = {
            cards: {
                selectable: [
                    { label: '', key: 'chevron', class: 'icon-cell icon-cell--chevron' },
                    { label: '', key: 'checkbox', class: 'icon-cell icon-cell--checkbox' },
                    { label: 'Offer', key: 'offer' },
                    { label: 'Fragment title', key: 'fragmentTitle' },
                    { label: 'Offer ID', key: 'offerId' },
                    { label: 'Path', key: 'path' },
                    { label: 'Status', key: 'status' },
                ],
                viewOnly: [
                    { label: '', key: 'chevron', class: 'icon-cell icon-cell--chevron' },
                    { label: 'Offer', key: 'offer' },
                    { label: 'Fragment title', key: 'fragmentTitle' },
                    { label: 'Offer ID', key: 'offerId' },
                    { label: 'Path', key: 'path' },
                    { label: 'Item type', key: 'itemType' },
                    { label: 'Status', key: 'status' },
                ],
            },
            collections: {
                selectable: [
                    { label: '', key: 'checkbox', class: 'icon-cell icon-cell--checkbox' },
                    { label: 'Collection title', key: 'collectionTitle' },
                    { label: 'Path', key: 'path' },
                    { label: 'Status', key: 'status' },
                ],
                viewOnly: [
                    { label: 'Collection title', key: 'collectionTitle' },
                    { label: 'Path', key: 'path' },
                    { label: 'Status', key: 'status' },
                ],
            },
            placeholders: {
                selectable: [
                    { label: '', key: 'checkbox', class: 'icon-cell icon-cell--checkbox' },
                    { label: 'Key', key: 'key' },
                    { label: 'Value', key: 'value' },
                    { label: 'Status', key: 'status' },
                ],
                viewOnly: [
                    { label: 'Key', key: 'key' },
                    { label: 'Value', key: 'value' },
                    { label: 'Status', key: 'status' },
                ],
            },
        };
        return COLUMNS[this.type]?.[this.viewOnly ? 'viewOnly' : 'selectable'] || [];
    }

    #toggleSelected(e, path) {
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

    #renderCardsBody() {
        return html`${repeat(
            this.items,
            (card) => card.path,
            (card) => html`
                <mas-expandable-card-row
                    .card=${card}
                    .variationsByPath=${this.variationsByParent.get(card.path) || new Map()}
                    .selectedPaths=${this.selectedPaths}
                    .viewOnly=${this.viewOnly}
                ></mas-expandable-card-row>
            `,
        )}`;
    }

    #renderCollectionsBody() {
        return html`${repeat(
            this.items,
            (item) => item.path,
            (item) => html`
                <sp-table-row value=${item.path} ?selected=${!this.viewOnly && this.selectedPaths.has(item.path)}>
                    ${!this.viewOnly
                        ? html`<sp-table-cell class="icon-cell icon-cell--checkbox">
                              <sp-checkbox
                                  value=${item.path}
                                  ?checked=${this.selectedPaths.has(item.path)}
                                  @change=${(e) => this.#toggleSelected(e, item.path)}
                              ></sp-checkbox>
                          </sp-table-cell>`
                        : nothing}
                    <sp-table-cell>${item.title || '-'}</sp-table-cell>
                    <sp-table-cell>${item.studioPath}</sp-table-cell>
                    ${renderFragmentStatusCell(item.status)}
                </sp-table-row>
            `,
        )}`;
    }

    #renderPlaceholdersBody() {
        return html`${repeat(
            this.items,
            (item) => item.path,
            (item) => html`
                <sp-table-row value=${item.path} ?selected=${!this.viewOnly && this.selectedPaths.has(item.path)}>
                    ${!this.viewOnly
                        ? html`<sp-table-cell class="icon-cell icon-cell--checkbox">
                              <sp-checkbox
                                  value=${item.path}
                                  ?checked=${this.selectedPaths.has(item.path)}
                                  @change=${(e) => this.#toggleSelected(e, item.path)}
                              ></sp-checkbox>
                          </sp-table-cell>`
                        : nothing}
                    <sp-table-cell>${item.key || '-'}</sp-table-cell>
                    <sp-table-cell>
                        ${item.value?.length > 100 ? `${item.value.slice(0, 100)}...` : item.value || '-'}
                    </sp-table-cell>
                    ${renderFragmentStatusCell(item.status)}
                </sp-table-row>
            `,
        )}`;
    }

    #renderTableBody() {
        switch (this.type) {
            case TABLE_TYPE.CARDS:
                return this.#renderCardsBody();
            case TABLE_TYPE.COLLECTIONS:
                return this.#renderCollectionsBody();
            case TABLE_TYPE.PLACEHOLDERS:
                return this.#renderPlaceholdersBody();
            default:
                return nothing;
        }
    }

    render() {
        if (this.loading) {
            return html`<div class="loading-container--flex">
                <sp-progress-circle indeterminate size="l"></sp-progress-circle>
            </div>`;
        }

        if (!this.items.length) {
            return html`<p>No items found.</p>`;
        }

        return html`
            <sp-table class="items-table" emphasized>
                <sp-table-head>
                    ${repeat(
                        this.tableColumns,
                        (col) => col.key,
                        (col) => html`<sp-table-head-cell class=${col.class || ''}>${col.label}</sp-table-head-cell>`,
                    )}
                </sp-table-head>
                <sp-table-body>${this.#renderTableBody()}</sp-table-body>
            </sp-table>
            ${this.hasMore ? html`<div class="scroll-sentinel"></div>` : nothing}
            ${this.loadingMore
                ? html`<div class="loading-more">
                      <sp-progress-circle indeterminate size="s"></sp-progress-circle>
                      <span>Loading more items…</span>
                  </div>`
                : nothing}
        `;
    }
}

customElements.define('mas-items-table', MasItemsTable);
