import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from './store.js';
import { MasRepository } from './mas-repository.js';
import styles from './mas-promotions-css.js';
import { PAGE_NAMES } from './constants.js';
import ReactiveController from './reactivity/reactive-controller.js';

class MasPromotions extends LitElement {
    static styles = styles;

    static properties = {
        searchQuery: { type: String, state: true },
        sortField: { type: String, state: true },
        sortDirection: { type: String, state: true },
        error: { type: String, state: true },
        promotionsData: { type: Array, state: true },
        promotionsLoading: { type: Boolean, state: true },
        modifiedPromotions: { type: Object, state: true },
    };

    constructor() {
        super();

        this.searchQuery = '';
        this.sortField = 'key';
        this.sortDirection = 'asc';
        this.error = null;
        this.selectedFolder = {};
        this.selectedLocale = 'en_US';
        this.folderData = [];
        this.foldersLoaded = false;
        this.promotionsData = [];
        this.promotionsLoading = false;

        this.reactiveController = new ReactiveController(this, [
            Store.search,
            Store.filters,
            Store.folders.data,
            Store.folders.loaded,
            Store.promotions?.list?.data,
            Store.promotions?.list?.loading,
        ]);

        if (Store.promotions?.list?.data) {
            this.promotionsData = Store.promotions.list.data.get() || [];
            console.log(this.promotionsData.length);
        }
        if (Store.promotions?.list?.loading) {
            this.promotionsLoading = Store.promotions.list.loading.get() || false;
        }
        if (Store.search) {
            this.selectedFolder = Store.search.get() || {};
        }
        if (Store.filters) {
            this.selectedLocale = Store.filters.get().locale || 'en_US';
        }
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /**
     * Ensures the repository is available
     * @param {string} [errorMessage='Repository component not found'] - Custom error message
     * @throws {Error} If repository is not available
     * @returns {MasRepository} The repository instance
     */
    ensureRepository(errorMessage = 'Repository component not found') {
        const repository = this.repository;
        if (!repository) {
            this.error = errorMessage;
            throw new Error(errorMessage);
        }
        return repository;
    }

    async connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.handleClickOutside);

        console.log('connectedCallback');

        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.PROMOTIONS) {
            Store.page.set(PAGE_NAMES.PROMOTIONS);
        }

        const masRepository = this.repository;
        if (!masRepository) {
            this.error = 'Repository component not found';
            return;
        }

        this.selectedFolder = Store.search.get();
        this.selectedLocale = Store.filters.get().locale || 'en_US';
        this.promotionsData = Store.promotions?.list?.data?.get() || [];

        Store.promotions.list.loading.set(true);
        await this.loadPromotions(true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this.handleClickOutside);
    }

    renderError() {
        if (!this.error) return nothing;

        return html`
            <div class="error-message">
                <sp-icon-alert></sp-icon-alert>
                <span>${this.error}</span>
            </div>
        `;
    }

    get loading() {
        return this.promotionsLoading;
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    async loadPromotions() {
        console.log('loadPromotions');
        await this.repository.loadPromotions();
        this.promotionsData = Store.promotions.list.data.get() || [];
        this.promotionsLoading = Store.promotions.list.loading.get() || false;
        this.requestUpdate();
    }

    renderPromotionsContent() {
        if (this.promotionsLoading) {
            return html`<div class="loading-container">${this.loadingIndicator}</div>`;
        }

        return this.renderPromotionsTable();
    }

    renderPromotionsTable() {
        const filteredPromotions = this.promotionsData;

        const columns = [
            { key: 'title', label: 'Campaign' },
            {
                key: 'timeline',
                label: 'Timeline',
                sortable: true,
            },
            {
                key: 'status',
                label: 'Status',
            },
            {
                key: 'createdBy',
                label: 'Owner',
            },
            { key: 'actions', label: 'Actions', align: 'right' },
        ];

        if (!filteredPromotions || filteredPromotions.length === 0) {
            return html`
                <div class="no-promotions-message">
                    <p>No promotions found.</p>
                </div>
            `;
        }

        return html`
            <sp-table emphasized scroller @change=${this.updateTableSelection} class="promotions-table">
                ${this.renderTableHeader(columns)}
                <sp-table-body>
                    ${repeat(
                        filteredPromotions,
                        (promotion) => html`
                            <sp-table-row value=${promotion.get().path} data-id=${promotion.get().id}>
                                <sp-table-cell>${promotion.get().title}</sp-table-cell>
                                <sp-table-cell>${promotion.get().timeline}</sp-table-cell>
                                <sp-table-cell>${promotion.get().promotionStatus}</sp-table-cell>
                                <sp-table-cell>${promotion.get().createdBy}</sp-table-cell>
                                ${this.renderActionCell(promotion)}
                            </sp-table-row>
                        `,
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    render() {
        return html`
            <div class="promotions-container">
                <div class="promotions-header">
                    <sp-search
                        size="m"
                        placeholder="Search by campaign or status"
                        @input=${this.handleSearch}
                        value=${this.searchQuery}
                    ></sp-search>
                    <sp-button variant="accent" @click=${() => this.handleAddPromotion()} class="create-button">
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create Campaign
                    </sp-button>
                </div>

                ${this.renderError()}

                <div class="promotions-segmented-control-container">
                    <sp-action-group selects="single" emphasized size="m" justified selected='["scheduled"]'>
                        <sp-action-button value="all">All</sp-action-button>
                        <sp-action-button value="active">Active</sp-action-button>
                        <sp-action-button value="scheduled">Scheduled</sp-action-button>
                        <sp-action-button value="expired">Expired</sp-action-button>
                        <sp-action-button value="archived">Archived</sp-action-button>
                    </sp-action-group>
                </div>

                <div class="promotions-filters-container">
                    <div class="filters-container"><sp-icon-filter></sp-icon-filter><span>Filters:</span></div>
                    <div class="result-count-container">${(this.promotionsData || []).length} results</div>
                </div>

                <div class="promotions-content">${this.renderPromotionsContent()}</div>
            </div>
        `;
    }

    renderTableHeader(columns) {
        return html`
            <sp-table-head>
                ${columns.map(
                    ({ key, label, sortable, align }) => html`
                        <sp-table-head-cell
                            class=${key}
                            ?sortable=${sortable}
                            @click=${sortable ? () => this.handleSort(key) : undefined}
                            style="${align === 'right' ? 'text-align: right;' : ''}"
                        >
                            ${label}
                        </sp-table-head-cell>
                    `,
                )}
            </sp-table-head>
        `;
    }

    renderActionCell(promotion) {
        return html`
            <sp-table-cell class="action-cell">
                <sp-action-menu size="m">
                    ${html`
                        <sp-menu-item
                            @click=${(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <sp-icon-edit></sp-icon-edit>
                            <span>Edit</span>
                        </sp-menu-item>
                        <sp-menu-item
                            @click=${(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <sp-icon-duplicate></sp-icon-duplicate>
                            <span>Duplicate</span>
                        </sp-menu-item>
                        <sp-menu-item
                            @click=${(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <sp-icon-pause></sp-icon-pause>
                            <span>Pause</span>
                        </sp-menu-item>
                        <sp-menu-item
                            @click=${(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <sp-icon-archive></sp-icon-archive>
                            <span>Archive</span>
                        </sp-menu-item>
                        <sp-menu-item
                            @click=${(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <sp-icon-delete></sp-icon-delete>
                            <span>Delete</span>
                        </sp-menu-item>
                    `}
                </sp-action-menu>
            </sp-table-cell>
        `;
    }

    handleAddPromotion() {
        console.log('handleAddPromotion');
        Store.page.set(PAGE_NAMES.PROMOTIONS_FORM);
        this.requestUpdate();
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
        this.requestUpdate();
    }
}

customElements.define('mas-promotions', MasPromotions);
