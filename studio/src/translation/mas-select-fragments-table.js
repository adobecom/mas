import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-select-fragments-table.css.js';
import Store from '../store.js';
import NestedStoreController from '../reactivity/nested-store-controller.js';
import { MODEL_WEB_COMPONENT_MAPPING, getFragmentPartsToUse } from '../editor-panel.js';
import { ROOT_PATH, TAG_MODEL_ID_MAPPING } from '../constants.js';
import { getService, showToast } from '../utils.js';
import { Fragment } from '../aem/fragment.js';

class MasSelectFragmentsTable extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String, reflect: true, attribute: 'data-type' }, // 'fragments' | 'collections' | 'placeholders' | 'view-only'
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
        columnsToShow: { type: Set, state: true },
        selectedInTable: { type: Array, state: true },
        itemToRemove: { type: String, state: true },
    };

    constructor() {
        super();
        this.translationProjectStoreController = new NestedStoreController(this, Store.translationProjects.inEdit);
        this.fragments = [];
        this.loading = false;
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

    get translationProject() {
        return this.translationProjectStoreController.value;
    }

    get translationProjectStore() {
        return Store.translationProjects.inEdit.get();
    }

    /** @type {import('../mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    preselectItems() {
        const storeSelectedSet = new Set(
            this.translationProject?.fields?.find((field) => field.name === 'items')?.values ?? [],
        );
        const tableSelectedSet = new Set(this.selectedInTable);
        const isEqual =
            storeSelectedSet.size === tableSelectedSet.size &&
            [...storeSelectedSet].every((value) => tableSelectedSet.has(value));
        if (!isEqual) {
            this.selectedInTable = Array.from(storeSelectedSet);
        }
    }

    getFragmentName(data) {
        const webComponentName = MODEL_WEB_COMPONENT_MAPPING[data?.model?.path];
        const { fragmentParts } = getFragmentPartsToUse(Store, data);
        return `${webComponentName}: ${fragmentParts}`;
    }

    async fetchFragments() {
        this.loading = true;
        this.error = null;
        if (this.type === 'view-only' && Store.translationProjects.fragmentsByPaths.value.size) {
            this.fragments = this.translationProject
                ?.getFieldValues('items')
                .map((path) => Store.translationProjects.fragmentsByPaths.value.get(path));
            this.loading = false;
            return;
        }
        const surface = Store.search.value?.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        if (!surface) {
            this.loading = false;
            return;
        }

        const aem = this.repository?.aem;
        if (!aem) {
            this.error = 'Repository not available';
            this.loading = false;
            return;
        }

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        try {
            if (Store.translationProjects.allFragments.value.length) {
                this.fragments = Store.translationProjects.allFragments.value;
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
            this.fragments = await Promise.all(
                fetchedFragments.map(async (fragment) => ({
                    ...fragment,
                    offerData: await this.loadOfferData(fragment),
                    studioPath: this.getFragmentName(fragment),
                })),
            );
            const fragmentsByPaths = new Map(this.fragments.map((fragment) => [fragment.path, fragment]));
            Store.translationProjects.fragmentsByPaths.set(fragmentsByPaths);
            Store.translationProjects.allFragments.set(this.fragments);
            this.selectedInTable = this.translationProject?.getFieldValues('items');
            if (this.type === 'view-only') {
                this.fragments = this.selectedInTable.map((path) => Store.translationProjects.fragmentsByPaths.value.get(path));
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

    updateSelected({ target: { selected } }) {
        this.selectedInTable = selected;
        const currentSelected = this.translationProject?.getFieldValues('items');
        const withoutUnselected = currentSelected.filter((path) => selected.includes(path));
        const newSelected = new Set([...withoutUnselected, ...selected]);
        this.translationProjectStore?.updateField('items', Array.from(newSelected));
        console.log('this.translationProjectStore', this.translationProjectStore);
    }

    removeItem(path) {
        if (!path) return;
        const newSelected = this.selectedInTable.filter((selectedPath) => selectedPath !== path);
        if (newSelected.length === 0) {
            this.shadowRoot.querySelector(`sp-table-row[value="${path}"]`)?.click();
        }
        this.selectedInTable = newSelected;
        this.translationProjectStore?.updateField('items', newSelected);
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
        return html` ${this.loading
            ? html`<div class="loading-container">${this.loadingIndicator}</div>`
            : html`<sp-table
                  class="fragments-table"
                  emphasized
                  .selects=${this.type !== 'view-only' ? 'multiple' : undefined}
                  .selected=${this.selectedInTable}
                  @change=${this.updateSelected}
              >
                  ${this.renderTableHeader()}
                  <sp-table-body>
                      ${repeat(
                          this.fragments,
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
              </sp-table>`}`;
    }
}

customElements.define('mas-select-fragments-table', MasSelectFragmentsTable);
