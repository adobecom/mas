import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-select-items-table.css.js';
import Store from '../../store.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import StoreController from '../../reactivity/store-controller.js';
import '../../translation/mas-collapsible-table-row.js';
import { TABLE_TYPE } from '../../constants.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import {
    loadAllPlaceholders,
    loadAllFragments,
    loadSelectedPlaceholders,
    loadSelectedFragments,
} from '../utils/items-loader.js';
import { shouldIgnoreRowClickForSelection, getStudioFragmentDisplayPath } from '../utils/render-utils.js';
import { fragmentIsPromoVariation } from '../../promotions/promotion-model.js';

class MasSelectItemsTable extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String },
        viewOnly: { type: Boolean },
        viewOnlyLoading: { type: Boolean },
        viewOnlyFragments: { type: Array },
        viewOnlyTabs: { type: Array },
        dataReady: { type: Boolean, state: true },
        maxSelectedCards: { type: Number },
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
        selectableTabs: { type: Array },
        hidePromoVariations: { type: Boolean },
        tabs: { type: Array },
        renderActionsCell: { type: Function },
        renderPreviewCell: { type: Function },
        promoVariationsFetchedByParent: { type: Object },
        viewOnlyFragmentsFetchedByParent: { type: Boolean },
    };

    hasMore = new StoreController(this, Store.fragments.list.hasMore);
    loading = new StoreController(this, Store.fragments.list.loading);
    firstPageLoaded = new StoreController(this, Store.fragments.list.firstPageLoaded);
    #collectionsReadyUnsub = null;

    constructor() {
        super();
        this.dataSubscription = null;
        this.processAbortController = null;
        this.dataState = { isProcessingCards: false, pendingCards: null, abortController: null };
        this.viewOnlyLoading = false;
        this.viewOnlyFragments = [];
        this.displayCardsStoreController = null;
        this.displayCollectionsStoreController = null;
        this.displayPlaceholdersStoreController = null;
        this.selectedCardsStoreController = null;
        this.selectedCollectionsStoreController = null;
        this.selectedPlaceholdersStoreController = null;
        this.wasLoading = false;
        this.dataReady = false;
        this.maxSelectedCards = Infinity;
        this.getDisplayName = getStudioFragmentDisplayPath;
        this.renderFragmentStatusCell = () => nothing;
        this.renderActionsCell = null;
        this.renderPreviewCell = null;
        this.hidePromoVariations = false;
        this.viewOnlyFragmentsFetchedByParent = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.dataState.abortController = new AbortController();
        this.dataState.isProcessingCards = false;
        this.dataState.pendingCards = null;
        if (this.viewOnly && !this.viewOnlyFragmentsFetchedByParent) {
            if (this.effectiveType === TABLE_TYPE.PLACEHOLDERS) {
                this.viewOnlyLoading = !!getItemsSelectionStore().selectedPlaceholders.value?.length;
                this.dataSubscription = loadSelectedPlaceholders(
                    getItemsSelectionStore().selectedPlaceholders.value,
                    (items) => {
                        this.viewOnlyFragments = items;
                        if (!Store.placeholders.list.loading.get()) {
                            this.viewOnlyLoading = false;
                        }
                    },
                );
            } else {
                this.viewOnlyLoading = !!getItemsSelectionStore()[`selected${this.typeUppercased}`].value?.length;
                this.processAbortController = new AbortController();
                loadSelectedFragments(
                    getItemsSelectionStore()[`selected${this.typeUppercased}`].value,
                    this.effectiveType,
                    this.repository,
                    {
                        signal: this.processAbortController.signal,
                        onItems: (items) => {
                            this.viewOnlyFragments = items;
                        },
                        getDisplayName: this.getDisplayName,
                    },
                ).finally(() => {
                    this.viewOnlyLoading = false;
                });
            }
        } else {
            if (this.effectiveType === TABLE_TYPE.PLACEHOLDERS) {
                this.dataSubscription = loadAllPlaceholders();
            } else if (this.effectiveType === TABLE_TYPE.COLLECTIONS) {
                const collectionsStore = getItemsSelectionStore().allCollections;
                if (collectionsStore.getMeta('loaded') || collectionsStore.get()?.length > 0) {
                    this.dataReady = true;
                } else {
                    const onCollectionsLoaded = () => {
                        if (!collectionsStore.getMeta('loaded') && !collectionsStore.get()?.length) return;
                        this.dataReady = true;
                        collectionsStore.unsubscribe(onCollectionsLoaded);
                        this.#collectionsReadyUnsub = null;
                    };
                    this.#collectionsReadyUnsub = onCollectionsLoaded;
                    collectionsStore.subscribe(onCollectionsLoaded);
                }
                this.dataSubscription = loadAllFragments(this.effectiveType, this.repository, this.dataState, {
                    getDisplayName: this.getDisplayName,
                });
            } else {
                this.dataSubscription = loadAllFragments(this.effectiveType, this.repository, this.dataState, {
                    getDisplayName: this.getDisplayName,
                    onReady: () => {
                        this.dataReady = true;
                    },
                });
            }
        }
        this[`selected${this.typeUppercased}StoreController`] = new ReactiveController(this, [
            Store.fragments.list.loading,
            Store.placeholders.list.loading,
            getItemsSelectionStore()[`selected${this.typeUppercased}`],
        ]);
        this[`display${this.typeUppercased}StoreController`] = new ReactiveController(this, [
            getItemsSelectionStore()[`display${this.typeUppercased}`],
        ]);
    }

    updated(changedProperties) {
        if (
            this.viewOnly &&
            this.effectiveType === TABLE_TYPE.PLACEHOLDERS &&
            this.viewOnlyLoading &&
            !Store.placeholders.list.loading.get()
        ) {
            this.viewOnlyLoading = false;
        }

        const loadingJustCompleted = this.wasLoading && !this.loading.value;
        this.wasLoading = this.loading.value;

        if (loadingJustCompleted && this.hasMore.value && !this.viewOnly && this.effectiveType !== TABLE_TYPE.PLACEHOLDERS) {
            this.repository?.loadNextPage();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.dataSubscription?.unsubscribe();
        this.dataState.abortController?.abort();
        this.processAbortController?.abort();
        this.processAbortController = null;
        if (this.#collectionsReadyUnsub) {
            const selectionStore = getItemsSelectionStore({ allowUnset: true });
            selectionStore?.allCollections.unsubscribe(this.#collectionsReadyUnsub);
            this.#collectionsReadyUnsub = null;
        }
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get typeUppercased() {
        return this.effectiveType.charAt(0).toUpperCase() + this.effectiveType.slice(1);
    }

    get effectiveType() {
        return this.type || this.getAttribute('type') || TABLE_TYPE.CARDS;
    }

    get isLoading() {
        if (this.effectiveType === TABLE_TYPE.CARDS) {
            if (this.viewOnly) return this.viewOnlyLoading;
            return !this.dataReady;
        }
        if (this.effectiveType === TABLE_TYPE.COLLECTIONS) {
            if (this.viewOnly) return this.viewOnlyLoading;
            return !this.dataReady;
        }
        if (this.effectiveType === TABLE_TYPE.PLACEHOLDERS) {
            if (this.viewOnly) return this.viewOnlyLoading;
            return Store.placeholders.list.loading.get();
        }
        return false;
    }

    get itemsToDisplay() {
        const store = getItemsSelectionStore({ allowUnset: true });
        if (!store) return [];
        const items = this.viewOnly ? this.viewOnlyFragments : store[`display${this.typeUppercased}`].value;
        return this.hidePromoVariations ? items.filter((item) => !fragmentIsPromoVariation(item)) : items;
    }

    get selectedInTable() {
        const store = getItemsSelectionStore({ allowUnset: true });
        return new Set(store?.[`selected${this.typeUppercased}`].value || []);
    }

    get loadedPaths() {
        return this.itemsToDisplay.map((item) => item.path);
    }

    get selectAllDisabled() {
        return this.viewOnly || this.isLoading || this.itemsToDisplay.length === 0;
    }

    get selectAllChecked() {
        if (this.selectAllDisabled) return false;
        const selected = this.selectedInTable;
        return this.loadedPaths.every((p) => selected.has(p));
    }

    get selectAllIndeterminate() {
        if (this.selectAllDisabled || this.selectAllChecked) return false;
        const selected = this.selectedInTable;
        return this.loadedPaths.some((p) => selected.has(p));
    }

    #toggleSelectAll(e) {
        e.stopPropagation();
        const store = getItemsSelectionStore()[`selected${this.typeUppercased}`];
        const current = new Set(store.value);
        if (this.selectAllChecked) {
            this.loadedPaths.forEach((p) => current.delete(p));
        } else {
            this.loadedPaths.forEach((p) => current.add(p));
        }
        store.set([...current]);
    }

    __test_toggleSelectAll(e) {
        return this.#toggleSelectAll(e);
    }

    get tableColumns() {
        const TABLE_COLUMNS = {
            cards: {
                selectable: [
                    { label: '', key: 'chevron', class: 'table-icon-cell table-icon-cell--chevron' },
                    { label: '', key: 'checkbox', class: 'table-icon-cell table-icon-cell--checkbox' },
                    { label: 'Offer', key: 'offer', sortable: true },
                    { label: 'Fragment title', key: 'fragmentTitle' },
                    { label: 'Offer ID', key: 'offerId' },
                    { label: 'Path', key: 'path' },
                    { label: 'Status', key: 'status' },
                ],
                viewOnly: [
                    { label: '', key: 'chevron', class: 'table-icon-cell table-icon-cell--chevron' },
                    { label: 'Offer', key: 'offer', sortable: true },
                    { label: 'Fragment title', key: 'fragmentTitle' },
                    { label: 'Offer ID', key: 'offerId' },
                    { label: 'Path', key: 'path' },
                    { label: 'Item type', key: 'itemType' },
                    { label: 'Status', key: 'status' },
                ],
            },
            collections: {
                selectable: [
                    { label: '', key: 'checkbox', class: 'table-icon-cell table-icon-cell--checkbox' },
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
                    { label: '', key: 'checkbox', class: 'table-icon-cell table-icon-cell--checkbox' },
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
        const base = TABLE_COLUMNS[this.effectiveType][this.viewOnly ? 'viewOnly' : 'selectable'];
        const supportsExtraCells = this.viewOnly && [TABLE_TYPE.CARDS, TABLE_TYPE.COLLECTIONS].includes(this.effectiveType);
        if (!supportsExtraCells) return base;
        return [
            ...base,
            ...(this.effectiveType === TABLE_TYPE.CARDS && this.renderPreviewCell
                ? [{ label: 'Preview', key: 'preview' }]
                : []),
            ...(this.renderActionsCell ? [{ label: 'Actions', key: 'actions' }] : []),
        ];
    }

    #toggleSelected(e, path) {
        e.stopPropagation();
        const newSelected = this.selectedInTable.has(path)
            ? [...this.selectedInTable].filter((selectedPath) => selectedPath !== path)
            : [...this.selectedInTable, path];
        getItemsSelectionStore()[`selected${this.typeUppercased}`].set(newSelected);
    }

    #onRowClickForSelection(e, path) {
        if (shouldIgnoreRowClickForSelection(e)) return;
        this.#toggleSelected(e, path);
    }

    #renderTableBody() {
        switch (this.effectiveType) {
            case TABLE_TYPE.CARDS:
                return html` ${repeat(
                    this.itemsToDisplay,
                    (fragment) => fragment.path,
                    (fragment) =>
                        html`<mas-collapsible-table-row
                            .topLevelCard=${fragment}
                            .viewOnly=${this.viewOnly}
                            .viewOnlyTabs=${this.viewOnlyTabs}
                            .maxSelectedCards=${this.maxSelectedCards}
                            .selectableTabs=${this.selectableTabs}
                            .getDisplayName=${this.getDisplayName}
                            .renderFragmentStatusCell=${this.renderFragmentStatusCell}
                            .tabs=${this.tabs}
                            .renderActionsCell=${this.renderActionsCell}
                            .renderPreviewCell=${this.renderPreviewCell}
                            .promoVariationsFetchedByParent=${this.promoVariationsFetchedByParent}
                        ></mas-collapsible-table-row>`,
                )}`;
            case TABLE_TYPE.COLLECTIONS:
                return html`${repeat(
                    this.itemsToDisplay,
                    (fragment) => fragment.path,
                    (fragment) =>
                        html`<sp-table-row
                            value=${fragment.path}
                            ?selected=${!this.viewOnly && this.selectedInTable.has(fragment.path)}
                            aria-selected=${!this.viewOnly && this.selectedInTable.has(fragment.path) ? 'true' : 'false'}
                            @click=${!this.viewOnly ? (e) => this.#onRowClickForSelection(e, fragment.path) : nothing}
                        >
                            ${!this.viewOnly
                                ? html`
                                      <sp-table-cell class="table-icon-cell table-icon-cell--checkbox">
                                          <sp-checkbox
                                              value=${fragment.path}
                                              ?checked=${this.selectedInTable.has(fragment.path)}
                                              @change=${(e) => this.#toggleSelected(e, fragment.path)}
                                          ></sp-checkbox>
                                      </sp-table-cell>
                                  `
                                : nothing}
                            <sp-table-cell> ${fragment.title || '-'} </sp-table-cell>
                            <sp-table-cell>${fragment.studioPath}</sp-table-cell>
                            ${this.renderFragmentStatusCell?.(fragment.status)} ${this.renderActionsCell?.(fragment)}
                        </sp-table-row>`,
                )}`;
            case TABLE_TYPE.PLACEHOLDERS:
                return html`${repeat(
                    this.itemsToDisplay,
                    (fragment) => fragment.path,
                    (fragment) =>
                        html`<sp-table-row
                            value=${fragment.path}
                            ?selected=${!this.viewOnly && this.selectedInTable.has(fragment.path)}
                            aria-selected=${!this.viewOnly && this.selectedInTable.has(fragment.path) ? 'true' : 'false'}
                            @click=${!this.viewOnly ? (e) => this.#onRowClickForSelection(e, fragment.path) : nothing}
                        >
                            ${!this.viewOnly
                                ? html`<sp-table-cell class="table-icon-cell table-icon-cell--checkbox">
                                      <sp-checkbox
                                          value=${fragment.path}
                                          ?checked=${this.selectedInTable.has(fragment.path)}
                                          @change=${(e) => this.#toggleSelected(e, fragment.path)}
                                      ></sp-checkbox>
                                  </sp-table-cell>`
                                : nothing}
                            <sp-table-cell> ${fragment.key || '-'} </sp-table-cell>
                            <sp-table-cell>
                                ${fragment.value?.length > 100 ? `${fragment.value.slice(0, 100)}...` : fragment.value || '-'}
                            </sp-table-cell>
                            ${this.renderFragmentStatusCell(fragment.status)}
                        </sp-table-row>`,
                )}`;

            default:
                return nothing;
        }
    }

    get loadingMoreIndicator() {
        if (!this.loading.value || !this.firstPageLoaded.value) return nothing;
        return html`<div class="loading-more">
            <sp-progress-circle indeterminate size="s"></sp-progress-circle>
            <span>Loading more items…</span>
        </div>`;
    }

    #renderSkeletonRows() {
        return Array.from(
            { length: 8 },
            (_, i) =>
                html`<sp-table-row class="skeleton-row" key=${i}>
                    ${this.tableColumns.map(
                        (column) =>
                            html`<sp-table-cell class=${column.class ?? ''}>
                                ${column.skeleton !== false
                                    ? html`<div class="skeleton-element skeleton-table-cell"></div>`
                                    : nothing}
                            </sp-table-cell>`,
                    )}
                </sp-table-row>`,
        );
    }

    render() {
        const fetching = this.loading.value;
        const loadingFirstPage = !this.viewOnly && fetching && !this.firstPageLoaded.value;
        const showSkeleton = this.isLoading || loadingFirstPage;
        const showEmpty = !showSkeleton && this.itemsToDisplay.length === 0;
        const showTable = !showEmpty && (showSkeleton || !this.isLoading);

        return html`
            ${showEmpty ? html`<p>No items found.</p>` : nothing}
            ${showTable
                ? html`<sp-table class="fragments-table item-table" emphasized>
                      <sp-table-head>
                          ${repeat(
                              this.tableColumns,
                              (column) => column.key,
                              (column) =>
                                  column.key === 'checkbox' && !this.viewOnly
                                      ? html`<sp-table-head-cell class=${column.class ?? ''}>
                                            <sp-checkbox
                                                ?checked=${this.selectAllChecked}
                                                ?indeterminate=${this.selectAllIndeterminate}
                                                ?disabled=${this.selectAllDisabled}
                                                @change=${(e) => this.#toggleSelectAll(e)}
                                                aria-label="Select all loaded items"
                                            ></sp-checkbox>
                                        </sp-table-head-cell>`
                                      : html`<sp-table-head-cell class=${column.class ?? ''}>
                                            ${column.label}
                                        </sp-table-head-cell>`,
                          )}
                      </sp-table-head>
                      <sp-table-body>${showSkeleton ? this.#renderSkeletonRows() : this.#renderTableBody()}</sp-table-body>
                      ${this.hasMore.value ? html`<div class="scroll-sentinel"></div>` : nothing} ${this.loadingMoreIndicator}
                  </sp-table>`
                : nothing}
        `;
    }
}

customElements.define('mas-select-items-table', MasSelectItemsTable);
