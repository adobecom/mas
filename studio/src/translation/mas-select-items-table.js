import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './mas-select-items-table.css.js';
import Store from '../store.js';
import { MODEL_WEB_COMPONENT_MAPPING, getFragmentPartsToUse } from '../editor-panel.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, FRAGMENT_STATUS, TABLE_TYPE } from '../constants.js';
import { getService } from '../utils.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { Fragment } from '../aem/fragment.js';

class MasSelectItemsTable extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String }, // 'cards' | 'collections' | 'placeholders'
        selectedInTable: { type: Array, state: true },
        itemToRemove: { type: String, state: true },
        tableKey: { type: Number, state: true },
        viewOnly: { type: Boolean },
        viewOnlyLoading: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.tableKey = 0;
        this.selectedInTable = [];
        this.dataSubscription = null;
        this.OFFER_DATA_CONCURRENCY_LIMIT = 5;
        this.processAbortController = null;
        this.isProcessingCards = false;
        this.viewOnlyLoading = false;
        this.displayCardsStoreController = null;
        this.displayCollectionsStoreController = null;
        this.displayPlaceholdersStoreController = null;
        this.selectedCardsStoreController = null;
        this.selectedCollectionsStoreController = null;
        this.selectedPlaceholdersStoreController = null;
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.viewOnly && this.type !== TABLE_TYPE.PLACEHOLDERS) {
            this.#fetchSelectedFragments();
        } else {
            this.type === TABLE_TYPE.PLACEHOLDERS ? this.#getPlaceholdersData() : this.#getFragmentsData();
        }
        this.#initStoreControllers();
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('itemToRemove')) {
            this.#removeItem(this.itemToRemove);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.dataSubscription?.unsubscribe();
        this.processAbortController?.abort();
        this.processAbortController = null;
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
            return Store.placeholders.list.loading.get();
        }
        return false;
    }

    get columnsToShow() {
        switch (this.type) {
            case TABLE_TYPE.CARDS:
                return new Set([
                    { label: 'Offer', key: 'offer', sortable: true },
                    { label: 'Fragment title', key: 'fragmentTitle' },
                    { label: 'Offer ID', key: 'offerId' },
                    { label: 'Path', key: 'path' },
                    { label: 'Status', key: 'status' },
                ]);
            case TABLE_TYPE.COLLECTIONS:
                return new Set([
                    { label: 'Collection title', key: 'collectionTitle' },
                    { label: 'Path', key: 'path' },
                    { label: 'Status', key: 'status' },
                ]);
            case TABLE_TYPE.PLACEHOLDERS:
                return new Set([
                    { label: 'Key', key: 'key' },
                    { label: 'Value', key: 'value' },
                    { label: 'Status', key: 'status' },
                ]);
            default:
                return new Set();
        }
    }

    get itemsToDisplay() {
        if (this.viewOnly) {
            return Store.translationProjects[`selected${this.typeUppercased}`].value
                .map((path) => Store.translationProjects[`${this.type}ByPaths`]?.value.get(path))
                .filter(Boolean);
        } else {
            return Store.translationProjects[`display${this.typeUppercased}`].value;
        }
    }

    #getPlaceholdersData() {
        if (Store.translationProjects.allPlaceholders.get()?.length) return;
        this.dataSubscription = Store.placeholders.list.data.subscribe(() => {
            const placeholderValues = Store.placeholders.list.data.get().map((placeholder) => placeholder.value);
            const placeholdersByPaths = new Map(placeholderValues.map((placeholder) => [placeholder.path, placeholder]));
            Store.translationProjects.allPlaceholders.set(placeholderValues);
            Store.translationProjects.placeholdersByPaths.set(placeholdersByPaths);
            Store.translationProjects.displayPlaceholders.set(placeholderValues);
        });
    }

    #getFragmentsData() {
        if (Store.translationProjects[`all${this.typeUppercased}`].get()?.length) return;
        this.dataSubscription = Store.fragments.list.data.subscribe(async () => {
            const { allCards, allCollections } = this.#parseFragmentsFromStore(Store.fragments.list.data.get() || []);
            this.type === TABLE_TYPE.CARDS
                ? await this.#processCardsData(allCards)
                : this.#processCollectionsData(allCollections);
        });
    }

    async #fetchSelectedFragments() {
        if (!this.repository) return;
        const selectedPaths = Store.translationProjects[`selected${this.typeUppercased}`].value || [];
        if (!selectedPaths.length) return;
        this.viewOnlyLoading = true;
        try {
            const fragments = await this.processConcurrently(
                selectedPaths,
                async (path) => {
                    try {
                        const fragmentData = await this.repository.aem.getFragmentByPath(path);
                        const fragment = new Fragment(fragmentData);
                        return {
                            ...fragmentData,
                            studioPath: this.getFragmentName(fragment),
                        };
                    } catch (err) {
                        console.warn(`Failed to fetch fragment at ${path}:`, err.message);
                        return null;
                    }
                },
                this.OFFER_DATA_CONCURRENCY_LIMIT,
            );

            const validFragments = fragments.filter(Boolean);

            if (this.type === TABLE_TYPE.CARDS) {
                await this.#processCardsDataForViewOnly(validFragments);
            } else {
                const byPathsMap = new Map(validFragments.map((f) => [f.path, f]));
                Store.translationProjects[`${this.type}ByPaths`].set(byPathsMap);
            }
        } finally {
            this.viewOnlyLoading = false;
        }
    }

    /**
     * Process cards data for view-only mode (enriches cardsByPaths with offer data)
     * @param {Array<Object>} cards - Array of card objects to enrich with offer data
     */
    async #processCardsDataForViewOnly(cards) {
        this.processAbortController = new AbortController();
        const { signal } = this.processAbortController;

        const offerDataResults = await this.processConcurrently(
            cards,
            (card) => this.loadOfferData(card, signal),
            this.OFFER_DATA_CONCURRENCY_LIMIT,
        );

        if (signal.aborted) return;

        const enrichedCards = cards.map((card, i) => ({
            ...card,
            offerData: offerDataResults[i] ?? null,
        }));

        const cardsByPaths = new Map(enrichedCards.map((card) => [card.path, card]));
        Store.translationProjects.cardsByPaths.set(cardsByPaths);
    }

    /**
     * Splits fragments from store into cards and collections and returns them with studioPath added
     * @param {Array} allFragments - Array of all fragments (cards and collections)
     * @returns {Object} - Object with two fields: allCards and allCollections
     */
    #parseFragmentsFromStore(allFragments) {
        return allFragments.reduce(
            (acc, fragment) => {
                const withPath = {
                    ...fragment.value,
                    studioPath: this.getFragmentName(fragment.value),
                };

                if (fragment.value.model.path === CARD_MODEL_PATH) {
                    acc.allCards.push(withPath);
                } else if (fragment.value.model.path === COLLECTION_MODEL_PATH) {
                    acc.allCollections.push(withPath);
                }
                return acc;
            },
            { allCards: [], allCollections: [] },
        );
    }

    /**
     * Loads offer data for each card
     * @param {Array<Object>} allCards - Array of card objects to process and enrich with offer data
     * @returns {Promise<void>} Resolves when processing and store updates are complete
     */
    async #processCardsData(allCards) {
        if (this.isProcessingCards) {
            this.processAbortController?.abort();
        }
        this.isProcessingCards = true;
        this.processAbortController = new AbortController();
        const { signal } = this.processAbortController;

        try {
            const existingCards = Store.translationProjects.allCards.get() || [];
            const existingOfferDataByPath = new Map(
                existingCards.filter((card) => card.offerData !== undefined).map((card) => [card.path, card.offerData]),
            );

            const cardsNeedingOfferData = allCards.filter((card) => !existingOfferDataByPath.has(card.path));

            if (cardsNeedingOfferData.length > 0) {
                const offerDataResults = await this.processConcurrently(
                    cardsNeedingOfferData,
                    (card) => this.loadOfferData(card, signal),
                    this.OFFER_DATA_CONCURRENCY_LIMIT,
                );

                if (signal.aborted) return;

                await this.yieldToMain();

                cardsNeedingOfferData.forEach((card, i) => {
                    existingOfferDataByPath.set(card.path, offerDataResults[i]);
                });
            }

            if (signal.aborted) return;

            const enrichedCards = allCards.map((card) => ({
                ...card,
                offerData: existingOfferDataByPath.get(card.path) ?? null,
            }));

            if (enrichedCards.length > 50) {
                await this.yieldToMain();
            }

            if (signal.aborted) return;

            const cardsByPaths = new Map(enrichedCards.map((card) => [card.path, card]));
            Store.translationProjects.allCards.set(enrichedCards);
            Store.translationProjects.cardsByPaths.set(cardsByPaths);
            Store.translationProjects.displayCards.set([...enrichedCards]);
        } finally {
            this.isProcessingCards = false;
        }
    }

    #processCollectionsData(allCollections) {
        Store.translationProjects.allCollections.set(allCollections);
        const collectionsByPaths = new Map(allCollections.map((fragment) => [fragment.path, fragment]));
        Store.translationProjects.collectionsByPaths.set(collectionsByPaths);
        Store.translationProjects.displayCollections.set(allCollections);
    }

    #initStoreControllers() {
        if (this.viewOnly) {
            this[`selected${this.typeUppercased}StoreController`] = new ReactiveController(this, [
                Store.placeholders.list.loading,
                Store.translationProjects[`selected${this.typeUppercased}`],
            ]);
        } else {
            this[`display${this.typeUppercased}StoreController`] = new ReactiveController(
                this,
                [Store.translationProjects[`display${this.typeUppercased}`]],
                () => {
                    this.tableKey++;
                    this.#preselectItems();
                },
            );
            this[`selected${this.typeUppercased}StoreController`] = new ReactiveController(this, [
                Store.fragments.list.loading,
                Store.placeholders.list.loading,
                Store.translationProjects[`selected${this.typeUppercased}`],
            ]);
        }
    }

    async loadOfferData(fragment, signal) {
        const TIMEOUT_MS = 10000;
        const cache = Store.translationProjects.offerDataCache;
        try {
            const wcsOsi = fragment?.fields?.find(({ name }) => name === 'osi')?.values?.[0];
            if (!wcsOsi) return null;
            if (cache.has(wcsOsi)) {
                return cache.get(wcsOsi);
            }
            if (signal?.aborted) return null;

            const service = getService();
            const priceOptions = service.collectPriceOptions({ wcsOsi });
            const [offersPromise] = service.resolveOfferSelectors(priceOptions);
            if (!offersPromise) return null;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
            });
            const [offer] = await Promise.race([offersPromise, timeoutPromise]);
            if (signal?.aborted) return null;
            cache.set(wcsOsi, offer);
            return offer;
        } catch (err) {
            console.warn(`Failed to load offer data for fragment ${fragment.id}:`, err.message);
            const wcsOsi = fragment?.fields?.find(({ name }) => name === 'osi')?.values?.[0];
            if (wcsOsi && !signal?.aborted) {
                cache.set(wcsOsi, null);
            }
            return null;
        }
    }

    /**
     * Yields control to the browser event loop
     */
    async yieldToMain() {
        return new Promise((resolve) => {
            setTimeout(resolve, 0);
        });
    }

    /**
     * Process an array of async tasks with concurrency limiting and periodic UI updates
     * @param {Array} items - Items to process
     * @param {Function} asyncFn - Async function to apply to each item
     * @param {Number} concurrencyLimit - Maximum number of concurrent operations
     * @param {Number} batchSize - Number of items to process before yielding to UI
     * @returns {Promise<Array>} Results in the same order as input items
     */
    async processConcurrently(items, asyncFn, concurrencyLimit, batchSize = 20) {
        const results = new Array(items.length);
        const executing = [];
        let processedCount = 0;

        for (let i = 0; i < items.length; i++) {
            const promise = Promise.resolve().then(() => asyncFn(items[i], i));
            results[i] = promise;

            if (concurrencyLimit <= items.length) {
                const e = promise.then(() => {
                    executing.splice(executing.indexOf(e), 1);
                    processedCount++;
                });
                executing.push(e);
                if (executing.length >= concurrencyLimit) {
                    await Promise.race(executing);
                }

                // Yield to browser event loop periodically to keep UI responsive
                if (processedCount % batchSize === 0) {
                    await this.yieldToMain();
                }
            }
        }

        await Promise.all(executing);
        return Promise.all(results);
    }

    #preselectItems() {
        if (this.viewOnly) return;
        const storeSelected = Store.translationProjects[`selected${this.typeUppercased}`].value || [];
        const displayedPaths = new Set(Store.translationProjects[`display${this.typeUppercased}`].value.map((f) => f.path));
        // Only pass visible selections to the table (sp-table rejects selections for non-existent rows)
        const visibleSelections = storeSelected.filter((path) => displayedPaths.has(path));
        const isEqual =
            visibleSelections.length === this.selectedInTable.length &&
            visibleSelections.every((value) => this.selectedInTable.includes(value));
        if (!isEqual) {
            this.selectedInTable = visibleSelections;
        }
    }

    #updateSelected({ target: { selected } }) {
        this.selectedInTable = selected;
        const currentSelected = Store.translationProjects[`selected${this.typeUppercased}`].value || [];
        const displayedPaths = new Set(Store.translationProjects[`display${this.typeUppercased}`].value.map((f) => f.path));
        // We need to preserve selections for items not currently displayed (hidden by filters) to show them when filters are removed
        const hiddenSelections = currentSelected.filter((path) => !displayedPaths.has(path));
        const newSelected = [...new Set([...hiddenSelections, ...selected])];
        Store.translationProjects[`selected${this.typeUppercased}`].set(newSelected);
    }

    #removeItem(path) {
        if (!path) return;
        const newSelected = this.selectedInTable.filter((selectedPath) => selectedPath !== path);
        if (newSelected.length === 0) {
            const row = [...this.shadowRoot.querySelectorAll('sp-table-row')].find((r) => r.value === path);
            row?.click();
        }
        this.selectedInTable = newSelected;
        Store.translationProjects[`selected${this.typeUppercased}`].set(
            Store.translationProjects[`selected${this.typeUppercased}`].get().filter((selectedPath) => selectedPath !== path),
        );
    }

    async #copyToClipboard(e, text) {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            this.dispatchEvent(
                new CustomEvent('show-toast', { detail: { text: 'Offer ID copied to clipboard', variant: 'positive' } }),
            );
        } catch (err) {
            console.error('Failed to copy:', err);
            this.dispatchEvent(
                new CustomEvent('show-toast', { detail: { text: 'Failed to copy Offer ID', variant: 'negative' } }),
            );
        }
    }

    getFragmentName(data) {
        const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
        const { fragmentParts } = getFragmentPartsToUse(Store, data);
        return `${webComponentName}: ${fragmentParts}`;
    }

    #renderStatus(status) {
        if (!status) return nothing;
        let statusClass = '';
        if (status === FRAGMENT_STATUS.PUBLISHED) {
            statusClass = 'green';
        } else if (status === FRAGMENT_STATUS.MODIFIED) {
            statusClass = 'blue';
        }
        return html`<sp-table-cell class="status-cell">
            <div class="status-dot ${statusClass}"></div>
            ${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}
        </sp-table-cell>`;
    }

    #renderTableHeader() {
        return html`
            <sp-table-head>
                ${repeat(
                    this.columnsToShow,
                    (column) => column.key,
                    (column) => html`<sp-table-head-cell> ${column.label} </sp-table-head-cell>`,
                )}
            </sp-table-head>
        `;
    }

    #renderTableBody() {
        switch (this.type) {
            case TABLE_TYPE.CARDS:
                return html` <sp-table-body>
                    ${repeat(
                        this.itemsToDisplay,
                        (fragment) => fragment.path,
                        (fragment) =>
                            html`<sp-table-row value=${fragment.path}>
                                <sp-table-cell>
                                    ${fragment.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || '-'}
                                </sp-table-cell>
                                <sp-table-cell>${fragment.title}</sp-table-cell>
                                <sp-table-cell class="offer-id">
                                    ${fragment.offerData?.offerId
                                        ? html`<overlay-trigger triggered-by="hover">
                                                  <div slot="trigger">${fragment.offerData?.offerId}</div>
                                                  <sp-tooltip slot="hover-content" placement="bottom">
                                                      ${fragment.offerData?.offerId}
                                                  </sp-tooltip>
                                              </overlay-trigger>
                                              <sp-action-button
                                                  icon-only
                                                  quiet
                                                  aria-label="Copy Offer ID to clipboard"
                                                  @click=${(e) => this.#copyToClipboard(e, fragment.offerData?.offerId)}
                                              >
                                                  <sp-icon-copy slot="icon"></sp-icon-copy>
                                              </sp-action-button>`
                                        : 'no offer data'}
                                </sp-table-cell>
                                <sp-table-cell>${fragment.studioPath}</sp-table-cell>
                                ${this.#renderStatus(fragment.status)}
                            </sp-table-row>`,
                    )}
                </sp-table-body>`;
            case TABLE_TYPE.COLLECTIONS:
                return html` <sp-table-body>
                    ${repeat(
                        this.itemsToDisplay,
                        (fragment) => fragment.path,
                        (fragment) =>
                            html`<sp-table-row value=${fragment.path}>
                                <sp-table-cell> ${fragment.title || '-'} </sp-table-cell>
                                <sp-table-cell>${fragment.studioPath}</sp-table-cell>
                                ${this.#renderStatus(fragment.status)}
                            </sp-table-row>`,
                    )}
                </sp-table-body>`;
            case TABLE_TYPE.PLACEHOLDERS:
                return html` <sp-table-body>
                    ${repeat(
                        this.itemsToDisplay,
                        (fragment) => fragment.path,
                        (fragment) =>
                            html`<sp-table-row value=${fragment.path}>
                                <sp-table-cell> ${fragment.key || '-'} </sp-table-cell>
                                <sp-table-cell>
                                    ${fragment.value?.length > 100
                                        ? `${fragment.value.slice(0, 100)}...`
                                        : fragment.value || '-'}
                                </sp-table-cell>
                                ${this.#renderStatus(fragment.status)}
                            </sp-table-row>`,
                    )}
                </sp-table-body>`;

            default:
                return nothing;
        }
    }

    render() {
        return html`
            ${this.isLoading
                ? html`<div class="loading-container"><sp-progress-circle indeterminate size="l"></sp-progress-circle></div>`
                : html`${this.itemsToDisplay.length > 0
                      ? keyed(
                            this.tableKey,
                            html`<sp-table
                                class="fragments-table"
                                emphasized
                                .selects=${this.viewOnly ? undefined : 'multiple'}
                                .selected=${this.viewOnly ? [] : this.selectedInTable}
                                @change=${this.#updateSelected}
                            >
                                ${this.#renderTableHeader()} ${this.#renderTableBody()}
                            </sp-table>`,
                        )
                      : html`<p>No items found.</p>`}`}
        `;
    }
}

customElements.define('mas-select-items-table', MasSelectItemsTable);
