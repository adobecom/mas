import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-translation-files-table.css.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { MODEL_WEB_COMPONENT_MAPPING, getFragmentPartsToUse } from '../editor-panel.js';
import { ROOT_PATH, EDITABLE_FRAGMENT_MODEL_IDS } from '../constants.js';
import { initFragmentCache, prepopulateFragmentCache } from '../mas-repository.js';
import { copyToClipboard, getService, showToast } from '../utils.js';
import { Fragment } from '../aem/fragment.js';

class MasTranslationFilesTable extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String, state: true }, // 'fragments' | 'collections' | 'placeholders' | 'all'
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
        columnsToShow: { type: Set, state: true },
        selectedInTable: { type: Array, state: true },
        itemToRemove: { type: String, state: true },
    };

    constructor() {
        super();

        this.fragments = [];
        this.loading = false;
        this.error = null;
        this.unsubscribe = null;
        this.columnsToShow = new Set([
            { label: 'Offer', key: 'offer', sortable: true },
            { label: 'Fragment title', key: 'fragmentTitle' },
            { label: 'Offer ID', key: 'offerId' },
            { label: 'Path', key: 'path' },
            { label: 'Status', key: 'status' },
        ]);
        this.selectedInTable = [];
        this.abortController = null;
        this.selectedStoreController = new StoreController(this, Store.translationProjects.selected);
    }

    connectedCallback() {
        super.connectedCallback();
        this.fetchFragments();
    }

    willUpdate(changedProperties) {
        this.syncSelectedInTableFromStore();

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

    syncSelectedInTableFromStore() {
        const storeSelected = Array.from(this.selectedStoreController?.value || []);

        // Avoid feedback loops: only update when the sets differ.
        const current = this.selectedInTable || [];
        if (current.length === storeSelected.length) {
            const currentSet = new Set(current);
            let same = true;
            for (const id of storeSelected) {
                if (!currentSet.has(id)) {
                    same = false;
                    break;
                }
            }
            if (same) return;
        }

        this.selectedInTable = storeSelected;
    }

    /** @type {import('../mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    getFragmentName(data) {
        const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
        const { fragmentParts } = getFragmentPartsToUse(Store, data);
        return `${webComponentName}: ${fragmentParts}`;
    }

    async fetchFragments() {
        if (this.type === 'all') {
            this.fragments = Array.from(Store.translationProjects.selected.value).map((id) =>
                Store.translationProjects.fragmentsByIds.value.get(id),
            );
            return;
        }
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
            if (this.type === 'fragments') {
                if (Store.translationProjects.allFragments.value.length) {
                    this.fragments = Store.translationProjects.allFragments.value;
                    return;
                }
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
                        fetchedFragments.push(new Fragment(item));
                    }
                }
                this.fragments = await Promise.all(
                    fetchedFragments.map(async (fragment) => ({
                        ...fragment,
                        offerData: await this.loadOfferData(fragment),
                        humanFriendlyPath: this.getFragmentName(fragment),
                    })),
                );
                const fragmentsByIds = new Map(this.fragments.map((fragment) => [fragment.id, fragment]));
                Store.translationProjects.fragmentsByIds.set(fragmentsByIds);
                Store.translationProjects.allFragments.set(fetchedFragments);
                console.log('fetchedFragments', this.fragments);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Failed to fetch:', err);
                this.error = err.message;
                showToast('Failed to fetch.', 'negative');
            }
        } finally {
            this.loading = false;
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

    getFragmentPath(fragment) {
        const webComponentName = MODEL_WEB_COMPONENT_MAPPING[fragment?.model?.path];
        let fragmentParts = '';
        const surface = store.search.value.path?.toUpperCase();
        switch (fragment?.model?.path) {
            case CARD_MODEL_PATH:
                const props = {
                    cardName: fragment?.getField('name')?.values[0],
                    cardTitle: fragment?.getField('cardTitle')?.values[0],
                    variantCode: fragment?.getField('variant')?.values[0],
                    marketSegment: fragment?.getTagTitle('market_segment'),
                    customerSegment: fragment?.getTagTitle('customer_segment'),
                    product: fragment?.getTagTitle('mas:product/'),
                    promotion: fragment?.getTagTitle('mas:promotion/'),
                };

                VARIANTS.forEach((variant) => {
                    if (variant.value === props.variantCode) {
                        props.variantLabel = variant.label;
                    }
                });
                const buildPart = (part) => {
                    if (part) return ` / ${part}`;
                    return '';
                };
                fragmentParts = `${surface}${buildPart(props.variantLabel)}${buildPart(props.customerSegment)}${buildPart(props.marketSegment)}${buildPart(props.product)}${buildPart(props.promotion)}`;
                break;
            case COLLECTION_MODEL_PATH:
                fragmentParts = `${surface} / ${title}`;
                break;
        }
        return `${webComponentName}: ${fragmentParts}`;
    }

    updateSelected({ target: { selected } }) {
        this.selectedInTable = selected;
        const currentSelected = Store.translationProjects.selected.value;
        const withoutUnselected = [...currentSelected].filter((id) => selected.includes(id));
        const newSelected = new Set([...withoutUnselected, ...selected]);
        Store.translationProjects.selected.set(newSelected);
    }

    removeItem(id) {
        if (!id) return;
        const newSelected = this.selectedInTable.filter((selectedId) => selectedId !== id);
        if (newSelected.length === 0) {
            this.shadowRoot.querySelector(`sp-table-row[value="${id}"]`)?.click();
        }
        this.selectedInTable = newSelected;
        Store.translationProjects.selected.set(new Set(newSelected));
    }

    render() {
        return html` ${this.loading
            ? html`<div class="loading-container">${this.loadingIndicator}</div>`
            : html`<sp-table
                  class="fragments-table"
                  emphasized
                  .selects=${this.type !== 'all' ? 'multiple' : undefined}
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
                                      ${fragment.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || '-'}
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
                                  <sp-table-cell>${fragment.humanFriendlyPath}</sp-table-cell>
                                  ${this.renderStatus(fragment.status)}
                              </sp-table-row>`,
                      )}
                  </sp-table-body>
              </sp-table>`}`;
    }
}

customElements.define('mas-translation-files-table', MasTranslationFilesTable);
