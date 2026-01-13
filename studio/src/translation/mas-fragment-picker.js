import { LitElement, html, nothing, repeat } from 'lit';
import { styles } from './mas-fragment-picker.css.js';
import './mas-selected-items.js';
import Store from '../store.js';
import { ROOT_PATH, EDITABLE_FRAGMENT_MODEL_IDS } from '../constants.js';
import { getService, showToast, copyToClipboard } from '../utils.js';
import hardcoded from './hardcoded-remove-me.js';

class MasFragmentPicker extends LitElement {
    static styles = styles;

    static properties = {
        translationProject: { type: Object },
        selectedItems: { type: Array, state: true },
        fragments: { type: Array, state: true },
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
        fragmentsById: { type: Map, state: true },
        columnsToShow: { type: Set, state: true },
        showSelected: { type: Boolean },
        selectedInTable: { type: Array, state: true },
    };

    constructor() {
        super();
        this.translationProject = null;
        this.selectedInTable = [];
        this.fragments = [];
        this.fragmentsById = new Map();
        this.loading = false;
        this.error = null;
        this.abortController = null;
        this.unsubscribe = null;
        this.columnsToShow = new Set([
            { label: 'Offer', key: 'offer', sortable: true },
            { label: 'Fragment title', key: 'fragmentTitle' },
            { label: 'Offer ID', key: 'offerId' },
            { label: 'Path', key: 'path' },
            { label: 'Status', key: 'status' },
        ]);
    }

    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = Store.search.subscribe(() => {
            this.fetchFragments();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.abortController) {
            this.abortController.abort();
        }
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    /** @type {import('../mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    async fetchFragments() {
        const surface = Store.search.value?.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        if (!surface) return;

        const aem = this.repository?.aem;
        if (!aem) {
            this.error = 'Repository not available';
            return;
        }

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.loading = true;
        this.error = null;

        try {
            const cursor = await aem.sites.cf.fragments.search(
                {
                    path: `${ROOT_PATH}/${surface}/${Store.filters.value?.locale || 'en_US'}`,
                    modelIds: EDITABLE_FRAGMENT_MODEL_IDS,
                    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                },
                null,
                this.abortController,
            );
            const fetchedFragments = [];
            for await (const result of cursor) {
                for (const item of result) {
                    fetchedFragments.push(item);
                }
            }
            // const fetchedFragments = hardcoded;
            this.fragments = await Promise.all(
                fetchedFragments.map(async (fragment) => ({
                    ...fragment,
                    offerData: await this.loadOfferData(fragment),
                })),
            );
            this.fragmentsById = new Map(this.fragments.map((fragment) => [fragment.id, fragment]));
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch fragments:', err);
                this.error = err.message;
                showToast('Failed to fetch fragments.', 'negative');
            }
        } finally {
            this.loading = false;
        }
    }

    updateSelected({ target: { selected } }) {
        this.selectedInTable = selected;
        this.dispatchEvent(
            new CustomEvent('selected', {
                detail: {
                    selected: selected.map((item) => this.fragmentsById.get(item)),
                    type: 'fragments',
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    removeItem({ detail: { itemId } }) {
        const newSelected = this.selectedInTable.filter((id) => id !== itemId);
        if (newSelected.length === 0) {
            this.shadowRoot.querySelector(`sp-table-row[value="${itemId}"]`)?.click();
        } else {
            this.selectedInTable = newSelected;
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
        if (status === 'PUBLISHED') {
            statusClass = 'green';
        } else if (status === 'MODIFIED') {
            statusClass = 'blue';
        }
        return html`<sp-table-cell class="status-cell">
            <div class="status-dot ${statusClass}"></div>
            ${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}
        </sp-table-cell>`;
    }

    render() {
        return html`
            <div class="search">
                <sp-search size="m" placeholder="Search" disabled></sp-search>
                <div>1507 result(s)</div>
            </div>

            <div class="filters">
                <sp-picker disabled>
                    <span slot="label">Template</span>
                    <sp-menu-item>TODO</sp-menu-item>
                </sp-picker>

                <sp-picker disabled>
                    <span slot="label">Market Segment</span>
                    <sp-menu-item>TODO</sp-menu-item>
                </sp-picker>

                <sp-picker disabled>
                    <span slot="label">Customer Segment</span>
                    <sp-menu-item>TODO</sp-menu-item>
                </sp-picker>

                <sp-picker disabled>
                    <span slot="label">Product</span>
                    <sp-menu-item>TODO</sp-menu-item>
                </sp-picker>
            </div>
            <div class="container">
                ${this.loading
                    ? html`<div class="loading-container">${this.loadingIndicator}</div>`
                    : this.fragments.length
                      ? html` <sp-table
                            class="fragments-table"
                            emphasized
                            selects="multiple"
                            .selected=${this.selectedInTable}
                            @change=${this.updateSelected}
                        >
                            ${this.renderTableHeader()}
                            <sp-table-body>
                                ${repeat(
                                    this.fragments,
                                    (fragment) => fragment.id,
                                    (fragment) =>
                                        html`<sp-table-row value=${fragment.id}>
                                            <sp-table-cell>
                                                ${fragment.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title ||
                                                '-'}
                                            </sp-table-cell>
                                            <sp-table-cell>${fragment.title}</sp-table-cell>
                                            <sp-table-cell class="offer-id" title=${fragment.offerData?.offerId}>
                                                <div>${fragment.offerData?.offerId}</div>
                                                ${fragment.offerData?.offerId
                                                    ? html`<sp-button
                                                          icon-only
                                                          aria-label="Copy Offer ID to clipboard"
                                                          @click=${(e) => copyToClipboard(e, fragment.offerData?.offerId)}
                                                      >
                                                          <sp-icon-copy slot="icon"></sp-icon-copy>
                                                      </sp-button>`
                                                    : 'no offer data'}
                                            </sp-table-cell>
                                            <sp-table-cell></sp-table-cell>
                                            ${this.renderStatus(fragment.status)}
                                        </sp-table-row>`,
                                )}
                            </sp-table-body>
                        </sp-table>`
                      : html`<p>No fragments found.</p>`}
                ${this.showSelected && this.selectedInTable.length
                    ? html`<mas-selected-items
                          .selectedItems=${this.selectedItems}
                          @remove-item=${this.removeItem}
                          type="fragments"
                      ></mas-selected-items>`
                    : nothing}
            </div>
        `;
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
