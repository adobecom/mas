import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles as tableStyles } from '../common/components/mas-select-items-table.css.js';
import { getItemsSelectionStore } from '../common/items-selection-store.js';
import { loadSelectedFragments } from '../common/utils/items-loader.js';
import { TABLE_TYPE, CARD_MODEL_PATH } from '../constants.js';
import { getItemTypeLabel } from '../common/utils/render-utils.js';
import { closePreview, openPreview } from '../mas-card-preview.js';
import router from '../router.js';
import { extractLocaleFromPath } from '../utils.js';
import ReactiveController from '../reactivity/reactive-controller.js';

const localStyles = css`
    :host {
        width: 100%;
        display: flex;
        min-height: 0;
    }

    .promotions-view-only .offer-cell {
        display: flex;
        align-items: center;
        gap: var(--spectrum-spacing-100);
        min-width: 0;
    }

    .promotions-view-only .mnemonic-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
    }

    .promotions-view-only sp-table-cell,
    .promotions-view-only sp-table-head-cell {
        word-break: normal;
        overflow-wrap: anywhere;
    }

    .promotions-view-only .path {
        min-width: 0;
        overflow: hidden;
    }

    .promotions-view-only .path span {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        overflow-wrap: anywhere;
        white-space: normal;
    }

    .promotions-view-only .offer-id {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: var(--spectrum-spacing-75);
        color: var(--spectrum-blue-900);
    }

    .promotions-view-only .offer-id overlay-trigger {
        flex: 1;
        min-width: 0;
    }

    .promotions-view-only .offer-id div[slot='trigger'] {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        overflow-wrap: anywhere;
        white-space: normal;
    }

    .promotions-view-only .offer-id sp-action-button {
        flex-shrink: 0;
        --mod-actionbutton-content-color-default: var(--spectrum-blue-900);
    }

    .promotions-view-only .preview-cell {
        justify-content: flex-start;
        text-align: start;
    }

    .promotions-view-only .preview-cell sp-icon-preview {
        cursor: default;
    }

    .promotions-view-only .actions-cell {
        justify-content: flex-start;
        align-items: center;
    }

    .promotions-view-only .actions-cell sp-action-menu {
        flex: 0 0 auto;
    }

    .promotions-view-only sp-action-menu {
        --mod-actionbutton-edge-to-text: 6px;
    }

    .promotions-view-only {
        width: 100%;
        min-width: 100%;
        box-sizing: border-box;
    }

    .promotions-view-only sp-table-head,
    .promotions-view-only sp-table-body {
        width: 100%;
        box-sizing: border-box;
    }

    .promotions-view-only sp-table-head {
        display: flex;
        min-width: 0;
    }

    .promotions-view-only sp-table-row {
        min-width: 0;
    }

    .promotions-view-only sp-table-head-cell {
        display: flex;
        align-items: center;
    }

    .promotions-cards-layout sp-table-head-cell,
    .promotions-cards-layout sp-table-cell,
    .promotions-collections-layout sp-table-head-cell,
    .promotions-collections-layout sp-table-cell {
        justify-content: flex-start;
        text-align: start;
    }

    .promotions-cards-layout sp-table-head-cell:nth-child(1),
    .promotions-cards-layout sp-table-cell:nth-child(1) {
        flex: 1.05 1 0;
        min-width: 0;
    }

    .promotions-cards-layout sp-table-head-cell:nth-child(2),
    .promotions-cards-layout sp-table-cell:nth-child(2) {
        flex: 0.95 1 0;
        min-width: 0;
    }

    .promotions-cards-layout sp-table-head-cell:nth-child(3),
    .promotions-cards-layout sp-table-cell:nth-child(3) {
        flex: 1.15 1 0;
        min-width: 0;
    }

    .promotions-cards-layout sp-table-head-cell:nth-child(4),
    .promotions-cards-layout sp-table-cell:nth-child(4) {
        flex: 1.45 1 0;
        min-width: 0;
    }

    .promotions-cards-layout sp-table-head-cell:nth-child(5),
    .promotions-cards-layout sp-table-cell:nth-child(5) {
        flex: 0.65 1 0;
        min-width: 6rem;
    }

    .promotions-cards-layout sp-table-head-cell:nth-child(6),
    .promotions-cards-layout sp-table-cell:nth-child(6) {
        flex: 0.8 1 0;
        min-width: 7.25rem;
    }

    .promotions-cards-layout sp-table-cell:nth-child(5),
    .promotions-cards-layout sp-table-cell:nth-child(6) {
        white-space: nowrap;
    }

    .promotions-cards-layout sp-table-head-cell:nth-child(7),
    .promotions-cards-layout sp-table-cell:nth-child(7) {
        flex: 0 0 6.5rem;
        width: 6.5rem;
        min-width: 6.5rem;
        max-width: 6.5rem;
        white-space: nowrap;
    }

    .promotions-cards-layout sp-table-head-cell:nth-child(8),
    .promotions-cards-layout sp-table-cell:nth-child(8) {
        flex: 0 0 6rem;
        width: 6rem;
        min-width: 6rem;
        max-width: 6rem;
        white-space: nowrap;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(1),
    .promotions-collections-layout sp-table-cell:nth-child(1) {
        flex: 1 1 0;
        min-width: 0;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(2),
    .promotions-collections-layout sp-table-cell:nth-child(2) {
        flex: 1.55 1 0;
        min-width: 0;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(3),
    .promotions-collections-layout sp-table-cell:nth-child(3) {
        flex: 0.85 1 0;
        min-width: 7.25rem;
    }

    .promotions-collections-layout sp-table-cell:nth-child(3) {
        white-space: nowrap;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(4),
    .promotions-collections-layout sp-table-cell:nth-child(4) {
        flex: 0 0 6.5rem;
        width: 6.5rem;
        min-width: 6.5rem;
        max-width: 6.5rem;
        white-space: nowrap;
    }

    .promotions-collections-layout sp-table-head-cell:nth-child(5),
    .promotions-collections-layout sp-table-cell:nth-child(5) {
        flex: 0 0 6rem;
        width: 6rem;
        min-width: 6rem;
        max-width: 6rem;
        white-space: nowrap;
    }
`;

class MasPromotionsItemsTable extends LitElement {
    static styles = [tableStyles, localStyles];

    static properties = {
        type: { type: String },
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
        viewOnlyLoading: { type: Boolean, state: true },
        viewOnlyFragments: { type: Array, state: true },
    };

    #loadedPathsKey = null;
    #processAbortController = null;
    #selectionController = null;

    constructor() {
        super();
        this.viewOnlyLoading = false;
        this.viewOnlyFragments = [];
        this.getDisplayName = (fragmentData) => fragmentData?.path ?? '';
        this.renderFragmentStatusCell = () => nothing;
    }

    connectedCallback() {
        super.connectedCallback();
        const upper = this.typeUppercased;
        this.#selectionController = new ReactiveController(this, [getItemsSelectionStore()[`selected${upper}`]]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#processAbortController?.abort();
        this.#processAbortController = null;
        this.viewOnlyLoading = false;
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    get typeUppercased() {
        return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }

    get selectedPaths() {
        return getItemsSelectionStore()[`selected${this.typeUppercased}`].value ?? [];
    }

    get tableColumns() {
        if (this.type === TABLE_TYPE.CARDS) {
            return [
                { label: 'Offer', key: 'offer', sortable: true },
                { label: 'Fragment title', key: 'fragmentTitle' },
                { label: 'Offer ID', key: 'offerId' },
                { label: 'Path', key: 'path' },
                { label: 'Item type', key: 'itemType' },
                { label: 'Status', key: 'status' },
                { label: 'Actions', key: 'actions' },
                { label: 'Preview', key: 'preview' },
            ];
        }
        return [
            { label: 'Collection title', key: 'collectionTitle' },
            { label: 'Path', key: 'path' },
            { label: 'Status', key: 'status' },
            { label: 'Actions', key: 'actions' },
            { label: 'Preview', key: 'preview' },
        ];
    }

    updated(changed) {
        super.updated(changed);
        if (!this.type) return;
        const paths = this.selectedPaths;
        const key = paths.slice().sort().join('|');
        if (key === this.#loadedPathsKey) return;
        this.#loadedPathsKey = key;
        this.#loadSelected(paths);
    }

    async #loadSelected(paths) {
        this.#processAbortController?.abort();
        if (!paths.length) {
            this.viewOnlyFragments = [];
            this.viewOnlyLoading = false;
            return;
        }
        this.viewOnlyLoading = true;
        this.#processAbortController = new AbortController();
        const signal = this.#processAbortController.signal;
        await loadSelectedFragments(paths, this.type, this.repository, {
            signal,
            onItems: (items) => {
                if (!signal.aborted) this.viewOnlyFragments = items;
            },
            getDisplayName: this.getDisplayName,
        }).finally(() => {
            if (!signal.aborted) this.viewOnlyLoading = false;
        });
    }

    #showToast(text, variant) {
        this.dispatchEvent(
            new CustomEvent('show-toast', {
                detail: { text, variant },
                bubbles: true,
                composed: true,
            }),
        );
    }

    async #copyOfferId(e, offerId) {
        e.stopPropagation();
        if (!offerId) return;
        try {
            await navigator.clipboard.writeText(offerId);
            this.#showToast('Offer ID copied to clipboard', 'positive');
        } catch (err) {
            console.error('Failed to copy offer ID:', err);
            this.#showToast('Failed to copy Offer ID', 'negative');
        }
    }

    #openCardPreview(fragmentId) {
        if (!fragmentId) return;
        openPreview(fragmentId, { left: 'min(300px, 15%)' });
    }

    async #editFragment(e, item) {
        e.stopPropagation();
        const id = item?.id;
        if (!id) return;
        const locale = extractLocaleFromPath(item.path);
        await router.navigateToFragmentEditor(id, { locale });
    }

    #removeFromList(e, item) {
        e.stopPropagation();
        const path = item?.path;
        if (!path) return;
        const store = getItemsSelectionStore();
        if (this.type === TABLE_TYPE.CARDS) {
            store.selectedCards.set(store.selectedCards.value.filter((p) => p !== path));
        } else {
            store.selectedCollections.set(store.selectedCollections.value.filter((p) => p !== path));
        }
    }

    #renderOfferCell(item) {
        const iconSrc =
            item?.getFieldValue?.('mnemonicIcon') ?? item?.fields?.find((f) => f.name === 'mnemonicIcon')?.values?.[0];
        const offerName = item?.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || 'no offer name';
        return html`<sp-table-cell class="offer-cell">
            ${iconSrc ? html`<img class="mnemonic-icon" src=${iconSrc} alt="" />` : nothing}
            <span>${offerName}</span>
        </sp-table-cell>`;
    }

    #renderOfferIdCell(item) {
        const { offerId } = item?.offerData || {};
        return html`<sp-table-cell class="offer-id">
            ${offerId
                ? html`<overlay-trigger triggered-by="hover">
                          <div slot="trigger">${offerId}</div>
                          <sp-tooltip slot="hover-content" placement="bottom">${offerId}</sp-tooltip>
                      </overlay-trigger>
                      <sp-action-button
                          icon-only
                          quiet
                          aria-label="Copy Offer ID to clipboard"
                          @click=${(e) => this.#copyOfferId(e, offerId)}
                      >
                          <sp-icon-copy slot="icon"></sp-icon-copy>
                      </sp-action-button>`
                : html`<span>no offer data</span>`}
        </sp-table-cell>`;
    }

    #renderActionsCell(item) {
        return html`<sp-table-cell class="actions-cell">
            <sp-action-menu placement="bottom-end" quiet @click=${(e) => e.stopPropagation()}>
                <sp-icon-more slot="icon"></sp-icon-more>
                <sp-menu-item @click=${(e) => this.#editFragment(e, item)}>
                    <sp-icon-edit slot="icon"></sp-icon-edit>
                    ${this.type === TABLE_TYPE.COLLECTIONS ? 'Edit collection' : 'Edit fragment'}
                </sp-menu-item>
                <sp-menu-item @click=${(e) => this.#removeFromList(e, item)}>
                    <sp-icon-delete slot="icon"></sp-icon-delete>
                    Remove from list
                </sp-menu-item>
            </sp-action-menu>
        </sp-table-cell>`;
    }

    #renderPreviewCell(item) {
        const canPreview = item?.model?.path === CARD_MODEL_PATH && item?.id;
        if (!canPreview) {
            return html`<sp-table-cell class="preview-cell"></sp-table-cell>`;
        }
        return html`<sp-table-cell
            class="preview-cell"
            @mouseover=${() => this.#openCardPreview(item.id)}
            @mouseout=${closePreview}
        >
            <sp-icon-preview label="Preview card"></sp-icon-preview>
        </sp-table-cell>`;
    }

    #renderCardRow(item) {
        return html`<sp-table-row value=${item.path}>
            ${this.#renderOfferCell(item)}
            <sp-table-cell>${item.title || 'no title'}</sp-table-cell>
            ${this.#renderOfferIdCell(item)}
            <sp-table-cell class="path"><span>${item?.studioPath || 'no path'}</span></sp-table-cell>
            <sp-table-cell>${getItemTypeLabel(item)}</sp-table-cell>
            ${this.renderFragmentStatusCell(item?.status)} ${this.#renderActionsCell(item)} ${this.#renderPreviewCell(item)}
        </sp-table-row>`;
    }

    #renderCollectionRow(item) {
        return html`<sp-table-row value=${item.path}>
            <sp-table-cell>${item.title || '-'}</sp-table-cell>
            <sp-table-cell class="path"><span>${item.studioPath || '-'}</span></sp-table-cell>
            ${this.renderFragmentStatusCell(item?.status)} ${this.#renderActionsCell(item)} ${this.#renderPreviewCell(item)}
        </sp-table-row>`;
    }

    #renderSkeletonRows() {
        return Array.from(
            { length: 6 },
            (_, i) =>
                html`<sp-table-row class="skeleton-row" key=${i}>
                    ${this.tableColumns.map(
                        (column) =>
                            html`<sp-table-cell>
                                <div class="skeleton-element skeleton-table-cell"></div>
                            </sp-table-cell>`,
                    )}
                </sp-table-row>`,
        );
    }

    render() {
        const showSkeleton = this.viewOnlyLoading;
        const items = this.viewOnlyFragments;
        const showEmpty = !showSkeleton && items.length === 0;
        const showTable = showSkeleton || items.length > 0;
        const layoutClass = this.type === TABLE_TYPE.CARDS ? 'promotions-cards-layout' : 'promotions-collections-layout';

        return html`
            ${showEmpty ? html`<p>No items found.</p>` : nothing}
            ${showTable
                ? html`<sp-table class="fragments-table item-table promotions-view-only ${layoutClass}" emphasized>
                      <sp-table-head>
                          ${repeat(
                              this.tableColumns,
                              (column) => column.key,
                              (column) => html`<sp-table-head-cell>${column.label}</sp-table-head-cell>`,
                          )}
                      </sp-table-head>
                      <sp-table-body>
                          ${showSkeleton
                              ? this.#renderSkeletonRows()
                              : this.type === TABLE_TYPE.CARDS
                                ? repeat(
                                      items,
                                      (f) => f.path,
                                      (f) => this.#renderCardRow(f),
                                  )
                                : repeat(
                                      items,
                                      (f) => f.path,
                                      (f) => this.#renderCollectionRow(f),
                                  )}
                      </sp-table-body>
                  </sp-table>`
                : nothing}
        `;
    }
}

export default MasPromotionsItemsTable;
export { MasPromotionsItemsTable };
customElements.define('mas-promotions-items-table', MasPromotionsItemsTable);
