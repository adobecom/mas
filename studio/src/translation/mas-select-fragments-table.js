import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './mas-select-fragments-table.css.js';
import Store from '../store.js';
import { MODEL_WEB_COMPONENT_MAPPING, getFragmentPartsToUse } from '../editor-panel.js';
import { ROOT_PATH, TAG_MODEL_ID_MAPPING } from '../constants.js';
import { getService, showToast } from '../utils.js';
import { Fragment } from '../aem/fragment.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasSelectFragmentsTable extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String, reflect: true, attribute: 'data-type' }, // 'fragments' | 'collections' | 'placeholders' | 'view-only'
        error: { type: String, state: true },
        columnsToShow: { type: Set, state: true },
        selectedInTable: { type: Array, state: true },
        itemToRemove: { type: String, state: true },
        tableKey: { type: Number, state: true },
    };

    constructor() {
        super();
        this.tableKey = 0;
        this.displayFragmentsStoreController = new ReactiveController(
            this,
            [Store.translationProjects.displayFragments],
            () => {
                this.tableKey++
                this.preselectItems();
            },
        );
        this.error = null;
        this.columnsToShow = new Set([
            { label: 'Offer', key: 'offer', sortable: true },
            { label: 'Fragment title', key: 'fragmentTitle' },
            { label: 'Offer ID', key: 'offerId' },
            { label: 'Path', key: 'path' },
            { label: 'Status', key: 'status' },
        ]);
        this.selectedInTable = [];
        this.abortController = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchFragments();
    }

    willUpdate(changedProperties) {
        this.preselectItems();
        if (changedProperties.has('itemToRemove')) {
            this.removeItem(this.itemToRemove);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    /** @type {import('../mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get loadingIndicator() {
        if (!Store.translationProjects.isLoading.get()) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    preselectItems() {
        const storeSelected = Store.translationProjects.fragments.value;
        const isEqual =
            storeSelected.length === this.selectedInTable.length &&
            [...storeSelected].every((value) => this.selectedInTable.includes(value));
        if (!isEqual) {
            this.selectedInTable = storeSelected;
        }
    }

    getFragmentName(data) {
        const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
        const { fragmentParts } = getFragmentPartsToUse(Store, data);
        return `${webComponentName}: ${fragmentParts}`;
    }

    async fetchFragments() {
        Store.translationProjects.isLoading.set(true);
        this.error = null;
        let fragments = [];
        if (this.type === 'view-only' && Store.translationProjects.fragmentsByPaths.value.size) {
            fragments = Store.translationProjects.fragments.value.map((path) =>
                Store.translationProjects.fragmentsByPaths.value.get(path),
            );
             Store.translationProjects.isLoading.set(false);
            return;
        }
        const surface = Store.search.value?.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        if (!surface) {
             Store.translationProjects.isLoading.set(false);
            return;
        }

        const aem = this.repository?.aem;
        if (!aem) {
            this.error = 'Repository not available';
             Store.translationProjects.isLoading.set(false);
            return;
        }

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        try {
            if (Store.translationProjects.allFragments.value.length) {
                fragments = Store.translationProjects.allFragments.value;
                return;
            }
            const cursor = await aem.sites.cf.fragments.search(
                {
                    path: `${ROOT_PATH}/${surface}/${Store.filters.value?.locale || 'en_US'}`,
                    modelIds: [TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card']],
                    sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
                },
                null,
                this.abortController,
            );
            const fetchedFragments = [];
            const result = await cursor.next();
            for (const item of result.value) {
                fetchedFragments.push(new Fragment(item));
            }
            fragments = await Promise.all(
                fetchedFragments.map(async (fragment) => ({
                    ...fragment,
                    offerData: await this.loadOfferData(fragment),
                    studioPath: this.getFragmentName(fragment),
                })),
            );
            const fragmentsByPaths = new Map(fragments.map((fragment) => [fragment.path, fragment]));
            Store.translationProjects.fragmentsByPaths.set(fragmentsByPaths);
            Store.translationProjects.allFragments.set(fragments);
            Store.translationProjects.displayFragments.set(fragments);
            this.selectedInTable = Store.translationProjects.fragments.value;
            if (this.type === 'view-only') {
                Store.translationProjects.displayFragments.set(
                    this.selectedInTable.map((path) => Store.translationProjects.fragmentsByPaths.value.get(path)),
                );
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch:', err);
                this.error = err.message;
                showToast('Failed to fetch.', 'negative');
            }
        } finally {
             Store.translationProjects.isLoading.set(false);
        }
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

    updateSelected({ target: { selected } }) {
        this.selectedInTable = selected;
        const currentSelected = Store.translationProjects.fragments.value;
        const withoutUnselected = currentSelected.filter((path) => selected.includes(path));
        const newSelected = new Set([...withoutUnselected, ...selected]);
        Store.translationProjects.fragments.set(Array.from(newSelected));
    }

    removeItem(path) {
        if (!path) return;
        const newSelected = this.selectedInTable.filter((selectedPath) => selectedPath !== path);
        if (newSelected.length === 0) {
            this.shadowRoot.querySelector(`sp-table-row[value="${path}"]`)?.click();
        }
        this.selectedInTable = newSelected;
        Store.translationProjects.fragments.set(newSelected);
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

    render() {
        return html`
            ${Store.translationProjects.isLoading.get()
                ? html`<div class="loading-container">${this.loadingIndicator}</div>`
                : html`${Store.translationProjects.displayFragments.value?.length > 0
                ? keyed(
                      this.tableKey,
                      html`<sp-table
                          class="fragments-table"
                          emphasized
                          .selects=${this.type === 'view-only' ? undefined : 'multiple'}
                          .selected=${this.selectedInTable}
                          @change=${this.updateSelected}
                      >
                          ${this.renderTableHeader()}
                          <sp-table-body>
                              ${repeat(
                                  Store.translationProjects.displayFragments.value,
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
                          </sp-table-body>
                      </sp-table>`,
                  )
              : html`<p>No items found.</p>`}`}
    `;
    }
}

customElements.define('mas-select-fragments-table', MasSelectFragmentsTable);
