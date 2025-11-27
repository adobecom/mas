import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from './store.js';
import { MasRepository } from './mas-repository.js';
import styles from './mas-promotions-css.js';
import { PAGE_NAMES } from './constants.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { showToast } from './utils.js';

class MasPromotions extends LitElement {
    static styles = styles;

    static properties = {
        filter: { type: String, state: true },
        filterOptions: { type: Array, state: true },
        sortField: { type: String, state: true },
        sortDirection: { type: String, state: true },
        error: { type: String, state: true },
        promotionsData: { type: Array, state: true },
        promotionsLoading: { type: Boolean, state: true },
        isDialogOpen: { type: Boolean, state: true },
        confirmDialogConfig: { type: Object, state: true },
    };

    constructor() {
        super();

        this.filter = Store.promotions?.list?.filter?.get() || 'scheduled';
        this.filterOptions = Store.promotions?.list?.filterOptions?.get() || [];
        this.sortField = 'key';
        this.sortDirection = 'asc';
        this.error = null;
        this.promotionsData = Store.promotions?.list?.data?.get() || [];
        this.promotionsLoading = Store.promotions?.list?.loading?.get() || false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.reactiveController = new ReactiveController(this, [
            Store.promotions?.list?.data,
            Store.promotions?.list?.loading,
            Store.promotions?.list?.filter,
            Store.promotions?.list?.filterOptions,
        ]);
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

        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.PROMOTIONS) {
            Store.page.set(PAGE_NAMES.PROMOTIONS);
        }

        const masRepository = this.repository;
        if (!masRepository) {
            this.error = 'Repository component not found';
            return;
        }
        this.promotionsData = Store.promotions?.list?.data?.get() || [];

        Store.promotions.list.loading.set(true);
        await this.loadPromotions(true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
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

    set loading(value = true) {
        this.promotionsLoading = value;
        Store.promotions.list.loading.set(value);
    }

    async loadPromotions() {
        await this.repository.loadPromotions();
        this.promotionsData = Store.promotions.list.data.get() || [];
        this.promotionsLoading = Store.promotions.list.loading.get() || false;
        this.requestUpdate();
    }

    /**
     * Display a dialog for confirmation
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, false if canceled
     */
    async #showDialog(title, message, options = {}) {
        if (this.isDialogOpen) {
            return false;
        }

        this.isDialogOpen = true;
        const { confirmText = 'OK', cancelText = 'Cancel', variant = 'primary' } = options;

        return new Promise((resolve) => {
            this.confirmDialogConfig = {
                title,
                message,
                confirmText,
                cancelText,
                variant,
                onConfirm: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                },
            };
        });
    }

    renderPromotionsContent() {
        if (this.promotionsLoading) {
            return html`<div class="loading-container">${this.loadingIndicator}</div>`;
        }

        return this.renderPromotionsTable();
    }

    renderPromotionsTable() {
        this.#handleFilterPromotions(this.filter);
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
                                <sp-table-cell>${this.#upperCaseFirst(promotion.get().promotionStatus)}</sp-table-cell>
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
                    <sp-button variant="accent" @click=${() => this.#handleAddPromotion()} class="create-button">
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create Campaign
                    </sp-button>
                </div>

                ${this.renderError()}

                <div class="promotions-segmented-control-container">
                    <sp-action-group selects="single" emphasized size="m" justified selected='["${this.filter}"]'>
                        ${repeat(
                            this.filterOptions,
                            (filter) =>
                                html`<sp-action-button
                                    value=${filter.value}
                                    @click=${() => this.#handleFilterPromotions(filter.value)}
                                    >${filter.label}</sp-action-button
                                >`,
                        )}
                    </sp-action-group>
                </div>

                ${this.renderConfirmDialog()}

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
                        <sp-menu-item @click="${() => this.#handleEditPromotion(promotion)}">
                            <sp-icon-edit></sp-icon-edit>
                            <span>Edit</span>
                        </sp-menu-item>
                        <sp-menu-item disabled>
                            <sp-icon-duplicate></sp-icon-duplicate>
                            <span>Duplicate</span>
                        </sp-menu-item>
                        <sp-menu-item disabled>
                            <sp-icon-pause></sp-icon-pause>
                            <span>Pause</span>
                        </sp-menu-item>
                        <sp-menu-item disabled>
                            <sp-icon-archive></sp-icon-archive>
                            <span>Archive</span>
                        </sp-menu-item>
                        <sp-menu-item @click=${() => this.#handleDeletePromotion(promotion)}>
                            <sp-icon-delete></sp-icon-delete>
                            <span>Delete</span>
                        </sp-menu-item>
                    `}
                </sp-action-menu>
            </sp-table-cell>
        `;
    }

    /**
     * Renders a confirmation dialog
     * @returns {TemplateResult} - HTML template
     */
    renderConfirmDialog() {
        if (!this.confirmDialogConfig) return nothing;

        const { title, message, onConfirm, onCancel, confirmText, cancelText, variant } = this.confirmDialogConfig;

        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="promotion-delete-confirm-dialog"
                    .heading=${title}
                    .variant=${variant || 'negative'}
                    .confirmLabel=${confirmText}
                    .cancelLabel=${cancelText}
                    @confirm=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onConfirm && onConfirm();
                    }}
                    @cancel=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onCancel && onCancel();
                    }}
                >
                    <div>${message}</div>
                </sp-dialog-wrapper>
            </div>
        `;
    }

    #handleAddPromotion() {
        Store.promotions.inEdit.set(null);
        Store.promotions.promotionId.set('');
        Store.page.set(PAGE_NAMES.PROMOTIONS_EDITOR);
    }

    #handleEditPromotion(promotion) {
        Store.promotions.inEdit.set(promotion);
        Store.promotions.promotionId.set(promotion.get().id);
        Store.page.set(PAGE_NAMES.PROMOTIONS_EDITOR);
    }

    async #handleDeletePromotion(promotion) {
        if (this.isDialogOpen) {
            return;
        }
        const confirmed = await this.#showDialog(
            'Delete Promotion Campaign',
            `Are you sure you want to delete the promotion "${promotion.get().title}"? This action cannot be undone.`,
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'negative',
            },
        );
        if (!confirmed) return;
        try {
            this.loading = true;
            showToast('Deleting promotion campaign...');
            await this.repository.deleteFragment(promotion, { startToast: false, endToast: false });
            const updatedPromotions = this.promotionsData.filter((p) => p.get().id !== promotion.get().id);
            this.promotionsData = updatedPromotions;
            Store.promotions.list.data.set(updatedPromotions);
            showToast('Promotion campaign successfully deleted.', 'positive');
        } catch (error) {
            console.error('Error deleting promotion:', error);
            showToast('Failed to delete promotion campaign.', 'negative');
        } finally {
            this.loading = false;
        }
    }

    #handleFilterPromotions(filter) {
        // reset promotions data
        this.promotionsData = Store.promotions.list.data.get() || [];
        this.filter = filter;
        Store.promotions.list.filter.set(filter);

        if (filter !== 'all') {
            const filteredPromotions = this.promotionsData.filter((promotion) => promotion.value?.promotionStatus === filter);
            this.promotionsData = filteredPromotions;
        }
    }

    #upperCaseFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
}

customElements.define('mas-promotions', MasPromotions);
