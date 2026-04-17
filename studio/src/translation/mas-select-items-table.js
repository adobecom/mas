import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-select-items-table.css.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { TABLE_TYPE } from '../constants.js';
import { renderFragmentStatusCell } from './translation-utils.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { MasCollapsibleTableRow } from './mas-collapsible-table-row.js';
import {
    loadAllPlaceholders,
    loadAllFragments,
    loadSelectedPlaceholders,
    loadSelectedFragments,
} from './translation-items-loader.js';

class MasSelectItemsTable extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String }, // 'cards' | 'collections' | 'placeholders'
        viewOnly: { type: Boolean },
        viewOnlyLoading: { type: Boolean, state: true },
        viewOnlyFragments: { type: Array, state: true },
    };

    hasMore = new StoreController(this, Store.fragments.list.hasMore);
    loading = new StoreController(this, Store.fragments.list.loading);
    firstPageLoaded = new StoreController(this, Store.fragments.list.firstPageLoaded);

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
        this.observedSentinel = null;
        this.wasLoading = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.dataState.abortController = new AbortController();
        this.dataState.isProcessingCards = false;
        this.dataState.pendingCards = null;
        if (this.viewOnly) {
            if (this.type === TABLE_TYPE.PLACEHOLDERS) {
                this.viewOnlyLoading = !!Store.translationProjects.selectedPlaceholders.value?.length;
                this.dataSubscription = loadSelectedPlaceholders(
                    Store.translationProjects.selectedPlaceholders.value,
                    (items) => {
                        this.viewOnlyFragments = items;
                        if (!Store.placeholders.list.loading.get()) {
                            this.viewOnlyLoading = false;
                        }
                    },
                );
            } else {
                this.viewOnlyLoading = !!Store.translationProjects[`selected${this.typeUppercased}`].value?.length;
                this.processAbortController = new AbortController();
                loadSelectedFragments(
                    Store.translationProjects[`selected${this.typeUppercased}`].value,
                    this.type,
                    this.repository,
                    {
                        signal: this.processAbortController.signal,
                        onItems: (items) => {
                            this.viewOnlyFragments = items;
                        },
                    },
                ).finally(() => {
                    this.viewOnlyLoading = false;
                });
            }
        } else {
            if (this.type === TABLE_TYPE.PLACEHOLDERS) {
                this.dataSubscription = loadAllPlaceholders();
            } else {
                this.dataSubscription = loadAllFragments(this.type, this.repository, this.dataState);
            }
        }
        this[`selected${this.typeUppercased}StoreController`] = new ReactiveController(this, [
            Store.fragments.list.loading,
            Store.placeholders.list.loading,
            Store.translationProjects[`selected${this.typeUppercased}`],
        ]);
        this[`display${this.typeUppercased}StoreController`] = new ReactiveController(this, [
            Store.translationProjects[`display${this.typeUppercased}`],
        ]);
    }

    updated(changedProperties) {
        if (
            this.viewOnly &&
            this.type === TABLE_TYPE.PLACEHOLDERS &&
            this.viewOnlyLoading &&
            !Store.placeholders.list.loading.get()
        ) {
            this.viewOnlyLoading = false;
        }

        const loadingJustCompleted = this.wasLoading && !this.loading.value;
        this.wasLoading = this.loading.value;

        const sentinel = this.renderRoot.querySelector('.scroll-sentinel');
        const scrollRoot = this.renderRoot.querySelector('sp-table');
        if (!this.scrollObserver && scrollRoot && !this.viewOnly && this.type !== TABLE_TYPE.PLACEHOLDERS) {
            this.scrollObserver = new IntersectionObserver(
                (entries) => {
                    if (entries[0]?.isIntersecting && this.hasMore.value && !this.loading.value) {
                        this.repository?.loadNextPage();
                    }
                },
                { root: scrollRoot, rootMargin: '200px' },
            );
        }
        if (sentinel && sentinel !== this.observedSentinel) {
            this.scrollObserver?.disconnect();
            this.scrollObserver?.observe(sentinel);
            this.observedSentinel = sentinel;
        } else if (!sentinel) {
            this.scrollObserver?.disconnect();
            this.observedSentinel = null;
        } else if (loadingJustCompleted && this.hasMore.value) {
            this.scrollObserver?.unobserve(sentinel);
            requestAnimationFrame(() => this.scrollObserver?.observe(sentinel));
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.dataSubscription?.unsubscribe();
        this.dataState.abortController?.abort();
        this.processAbortController?.abort();
        this.processAbortController = null;
        this.scrollObserver?.disconnect();
        this.scrollObserver = null;
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get typeUppercased() {
        return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }

    get isLoading() {
        if (this.type === TABLE_TYPE.CARDS || this.type === TABLE_TYPE.COLLECTIONS) {
            if (this.viewOnly) return this.viewOnlyLoading;
            return Store.fragments.list.firstPageLoaded.get() === false;
        }
        if (this.type === TABLE_TYPE.PLACEHOLDERS) {
            if (this.viewOnly) return this.viewOnlyLoading;
            return Store.placeholders.list.loading.get();
        }
        return false;
    }

    get itemsToDisplay() {
        if (this.viewOnly) {
            return this.viewOnlyFragments;
        }
        return Store.translationProjects[`display${this.typeUppercased}`].value;
    }

    get selectedInTable() {
        return new Set(Store.translationProjects[`selected${this.typeUppercased}`].value);
    }

    get tableColumns() {
        const TABLE_COLUMNS = {
            cards: {
                selectable: [
                    { label: '', key: 'chevron', class: 'translation-table-icon-cell translation-table-icon-cell--chevron' },
                    { label: '', key: 'checkbox', class: 'translation-table-icon-cell translation-table-icon-cell--checkbox' },
                    { label: 'Offer', key: 'offer', sortable: true },
                    { label: 'Fragment title', key: 'fragmentTitle' },
                    { label: 'Offer ID', key: 'offerId' },
                    { label: 'Path', key: 'path' },
                    { label: 'Status', key: 'status' },
                ],
                viewOnly: [
                    { label: '', key: 'chevron', class: 'translation-table-icon-cell translation-table-icon-cell--chevron' },
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
                    { label: '', key: 'checkbox', class: 'translation-table-icon-cell translation-table-icon-cell--checkbox' },
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
                    { label: '', key: 'checkbox', class: 'translation-table-icon-cell translation-table-icon-cell--checkbox' },
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
        return TABLE_COLUMNS[this.type][this.viewOnly ? 'viewOnly' : 'selectable'];
    }

    #toggleSelected(e, path) {
        e.stopPropagation();
        const newSelected = this.selectedInTable.has(path)
            ? [...this.selectedInTable].filter((p) => p !== path)
            : [...this.selectedInTable, path];
        Store.translationProjects[`selected${this.typeUppercased}`].set(newSelected);
    }

    #renderTableBody() {
        switch (this.type) {
            case TABLE_TYPE.CARDS:
                return html` ${repeat(
                    this.itemsToDisplay,
                    (fragment) => fragment.path,
                    (fragment) =>
                        html`<mas-collapsible-table-row
                            .topLevelCard=${fragment}
                            .viewOnly=${this.viewOnly}
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
                        >
                            ${!this.viewOnly
                                ? html`
                                      <sp-table-cell class="translation-table-icon-cell translation-table-icon-cell--checkbox">
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
                            ${renderFragmentStatusCell(fragment.status)}
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
                        >
                            ${!this.viewOnly
                                ? html`<sp-table-cell class="translation-table-icon-cell translation-table-icon-cell--checkbox">
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
                            ${renderFragmentStatusCell(fragment.status)}
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

    render() {
        return html`
            ${this.isLoading
                ? html`<div class="loading-container--flex">
                      <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                  </div>`
                : html`${this.itemsToDisplay.length > 0
                      ? html`<sp-table class="fragments-table translation-table" emphasized>
                            <sp-table-head>
                                ${repeat(
                                    this.tableColumns,
                                    (column) => column.key,
                                    (column) =>
                                        html`<sp-table-head-cell class=${column.class ? column.class : ''}>
                                            ${column.label}
                                        </sp-table-head-cell>`,
                                )}
                            </sp-table-head>
                            <sp-table-body>${this.#renderTableBody()}</sp-table-body>
                            ${this.hasMore.value ? html`<div class="scroll-sentinel"></div>` : nothing}
                            ${this.loadingMoreIndicator}
                        </sp-table>`
                      : html`<p>No items found.</p>`}`}
        `;
    }
}

customElements.define('mas-select-items-table', MasSelectItemsTable);
