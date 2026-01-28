import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './mas-select-fragments-table.css.js';
import Store from '../store.js';
import { MODEL_WEB_COMPONENT_MAPPING, getFragmentPartsToUse } from '../editor-panel.js';
import {
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    FRAGMENT_STATUS,
    ROOT_PATH,
    TABLE_TYPE,
    TAG_MODEL_ID_MAPPING,
} from '../constants.js';
import { getService, showToast } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasSelectFragmentsTable extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String }, // 'cards' | 'collections' | 'placeholders'
        error: { type: String, state: true },
        selectedInTable: { type: Array, state: true },
        itemToRemove: { type: String, state: true },
        tableKey: { type: Number, state: true },
    };

    constructor() {
        super();
        this.tableKey = 0;
        this.displayCardsStoreController = new ReactiveController(this, [Store.translationProjects.displayCards], () => {
            this.tableKey++;
            this.preselectItems();
        });
        this.displayCollectionsStoreController = new ReactiveController(
            this,
            [Store.translationProjects.displayCollections],
            () => {
                this.tableKey++;
                this.preselectItems();
            },
        );
        this.displayPlaceholdersStoreController = new ReactiveController(
            this,
            [Store.translationProjects.displayPlaceholders],
            () => {
                this.tableKey++;
                this.preselectItems();
            },
        );
        this.error = null;
        this.selectedInTable = [];
        this.dataSubscription = null;
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.type === TABLE_TYPE.CARDS || this.type === TABLE_TYPE.COLLECTIONS) {
            this.dataSubscription = Store.fragments.list.data.subscribe(async () => {
                const { allCards, allCollections, offerDataPromises } = Store.fragments.list.data.get().reduce(
                    (acc, fragment) => {
                        const withPath = {
                            ...fragment.value,
                            studioPath: this.getFragmentName(fragment.value),
                        };

                        if (fragment.value.model.path === CARD_MODEL_PATH) {
                            acc.allCards.push(withPath);
                            acc.offerDataPromises.push(this.loadOfferData(withPath));
                        } else if (fragment.value.model.path === COLLECTION_MODEL_PATH) {
                            acc.allCollections.push(withPath);
                        }
                        return acc;
                    },
                    {
                        allCards: [],
                        allCollections: [],
                        offerDataPromises: [],
                    },
                );

                if (this.type === TABLE_TYPE.CARDS) {
                    const offerDataResults = await Promise.all(offerDataPromises);
                    allCards.forEach((card, i) => {
                        card.offerData = offerDataResults[i];
                    });
                }

                Store.translationProjects.allCards.set(allCards);
                Store.translationProjects.allCollections.set(allCollections);

                const cardsByPaths = new Map(allCards.map((fragment) => [fragment.path, fragment]));
                const collectionsByPaths = new Map(allCollections.map((fragment) => [fragment.path, fragment]));
                Store.translationProjects.cardsByPaths.set(cardsByPaths);
                Store.translationProjects.collectionsByPaths.set(collectionsByPaths);

                Store.translationProjects.displayCards.set(allCards);
                Store.translationProjects.displayCollections.set(allCollections);
                // console.log('allMerchCards', Store.translationProjects.allCards.get());
                // console.log('allCollections', Store.translationProjects.allCollections.get());
                // console.log('merchCardsByPaths', Store.translationProjects.cardsByPaths.get());
                // console.log('collectionsByPaths', Store.translationProjects.collectionsByPaths.get());
                // console.log('displayMerchCards', Store.translationProjects.displayCards.get());
                // console.log('displayCollections', Store.translationProjects.displayCollections.get());
            });
        }
        if (this.type === TABLE_TYPE.PLACEHOLDERS) {
            this.dataSubscription = Store.placeholders.list.data.subscribe(() => {
                Store.translationProjects.displayPlaceholders.set(
                    Store.placeholders.list.data.get().map((placeholder) => placeholder.value),
                );
                const placeholdersByPaths = new Map(
                    Store.placeholders.list.data.get().map((placeholder) => [placeholder.value.path, placeholder.value]),
                );
                Store.translationProjects.placeholdersByPaths.set(placeholdersByPaths);
                // console.log('placeholdersByPaths', Store.translationProjects.placeholdersByPaths.get());
                // console.log('displayPlaceholders', Store.translationProjects.displayPlaceholders.get());
            });
        }
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('itemToRemove')) {
            this.removeItem(this.itemToRemove);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.dataSubscription?.unsubscribe();
    }

    get typeUppercased() {
        return this.type.charAt(0).toUpperCase() + this.type.slice(1);
    }

    get isLoading() {
        if (this.type === TABLE_TYPE.CARDS || this.type === TABLE_TYPE.COLLECTIONS) {
            return Store.fragments.list.loading.get();
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

    preselectItems() {
        const storeSelected = Store.translationProjects[`selected${this.typeUppercased}`].value;
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

    getFragmentName(data) {
        const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
        const { fragmentParts } = getFragmentPartsToUse(Store, data);
        return `${webComponentName}: ${fragmentParts}`;
    }

    async loadOfferData(fragment) {
        try {
            const wcsOsi = fragment?.fields?.find(({ name }) => name === 'osi')?.values?.[0];
            if (!wcsOsi) return;
            const service = getService();
            const priceOptions = service.collectPriceOptions({ wcsOsi });
            const [offersPromise] = service.resolveOfferSelectors(priceOptions);
            if (!offersPromise) return;
            const [offer] = await offersPromise;
            return offer;
        } catch (err) {
            console.warn(`Failed to load offer data for fragment ${fragment.id}:`, err.message);
            return null;
        }
    }

    renderStatus(status) {
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

    updateSelected({ target: { selected } }) {
        this.selectedInTable = selected;
        const currentSelected = Store.translationProjects[`selected${this.typeUppercased}`].value;
        const displayedPaths = new Set(Store.translationProjects[`display${this.typeUppercased}`].value.map((f) => f.path));
        // We need to preserve selections for items not currently displayed (hidden by filters) to show them when filters are removed
        const hiddenSelections = currentSelected.filter((path) => !displayedPaths.has(path));
        const newSelected = [...new Set([...hiddenSelections, ...selected])];
        Store.translationProjects[`selected${this.typeUppercased}`].set(newSelected);
    }

    removeItem(path) {
        if (!path) return;
        const newSelected = this.selectedInTable.filter((selectedPath) => selectedPath !== path);
        if (newSelected.length === 0) {
            this.shadowRoot.querySelector(`sp-table-row[value="${path}"]`)?.click();
        }
        this.selectedInTable = newSelected;
        Store.translationProjects[`selected${this.typeUppercased}`].set(newSelected);
    }

    async copyToClipboard(e, text) {
        e.stopPropagation();
        const button = e.currentTarget;
        try {
            await navigator.clipboard.writeText(text);
            button.classList.add('copied');
            setTimeout(() => button.classList.remove('copied'), 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    renderTableHeader() {
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

    renderTableBody() {
        switch (this.type) {
            case TABLE_TYPE.CARDS:
                return html` <sp-table-body>
                    ${repeat(
                        Store.translationProjects.displayCards.value,
                        (fragment) => fragment.path,
                        (fragment) =>
                            html`<sp-table-row value=${fragment.path}>
                                <sp-table-cell>
                                    ${fragment.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || '-'}
                                </sp-table-cell>
                                <sp-table-cell>${fragment.title}</sp-table-cell>
                                <sp-table-cell class="offer-id" title=${fragment.offerData?.offerId}>
                                    <div>${fragment.offerData?.offerId}</div>
                                    ${fragment.offerData?.offerId
                                        ? html`<sp-button
                                              icon-only
                                              aria-label="Copy Offer ID to clipboard"
                                              .disabled=${!fragment.offerData?.offerId}
                                              @click=${(e) => this.copyToClipboard(e, fragment.offerData?.offerId)}
                                          >
                                              <sp-icon-copy slot="icon"></sp-icon-copy>
                                              <sp-icon-checkmark slot="icon"></sp-icon-checkmark>
                                          </sp-button>`
                                        : 'no offer data'}
                                </sp-table-cell>
                                <sp-table-cell>${fragment.studioPath}</sp-table-cell>
                                ${this.renderStatus(fragment.status)}
                            </sp-table-row>`,
                    )}
                </sp-table-body>`;
            case TABLE_TYPE.COLLECTIONS:
                return html` <sp-table-body>
                    ${repeat(
                        Store.translationProjects.displayCollections.value,
                        (fragment) => fragment.path,
                        (fragment) =>
                            html`<sp-table-row value=${fragment.path}>
                                <sp-table-cell> ${fragment.title || '-'} </sp-table-cell>
                                <sp-table-cell>${fragment.studioPath}</sp-table-cell>
                                ${this.renderStatus(fragment.status)}
                            </sp-table-row>`,
                    )}
                </sp-table-body>`;
            case TABLE_TYPE.PLACEHOLDERS:
                return html` <sp-table-body>
                    ${repeat(
                        Store.translationProjects.displayPlaceholders.value,
                        (fragment) => fragment.path,
                        (fragment) =>
                            html`<sp-table-row value=${fragment.path}>
                                <sp-table-cell> ${fragment.key || '-'} </sp-table-cell>
                                <sp-table-cell>
                                    ${fragment.value.value && fragment.value.length > 60
                                        ? `${fragment.value.slice(0, 60)}...`
                                        : fragment.value || '-'}
                                </sp-table-cell>
                                ${this.renderStatus(fragment.status)}
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
                : html`${Store.translationProjects[`display${this.typeUppercased}`].value?.length > 0
                      ? keyed(
                            this.tableKey,
                            html`<sp-table
                                class="fragments-table"
                                emphasized
                                .selects=${this.type === 'view-only' ? undefined : 'multiple'}
                                .selected=${this.selectedInTable}
                                @change=${this.updateSelected}
                            >
                                ${this.renderTableHeader()} ${this.renderTableBody()}
                            </sp-table>`,
                        )
                      : html`<p>No items found.</p>`}`}
        `;
    }
}

customElements.define('mas-select-fragments-table', MasSelectFragmentsTable);
