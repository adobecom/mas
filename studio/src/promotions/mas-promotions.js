import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from '../store.js';
import { MasRepository } from '../mas-repository.js';
import styles from './mas-promotions-css.js';
import { PAGE_NAMES, PROMOTION_MODEL_ID } from '../constants.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { normalizeKey, showToast } from '../utils.js';
import { clearCaches } from '../../libs/fragment-client.js';
import './mas-promotion-duplicate-dialog.js';
import { renderPromotionStatusCell } from '../common/utils/render-utils.js';
import { canEditPromotions } from '../groups.js';
import {
    canPublishPromotionNow,
    canSchedulePromotion,
    confirmPublishDespiteUnpublishedPromoVariations,
    confirmUnpublishAlongsidePromoVariations,
    isPromotionExpiredForPublish,
    publishPromotionProject,
    unpublishPromotionProject,
    promotionDeleteConfirmMessage,
    PROMOTION_EXPIRED_PUBLISH_MESSAGE,
} from './promotion-publish-utils.js';
import { deleteAttachedPromoVariations, getAllAttachedPromoVariations } from './promotions-repository.js';
import { PROMOTION_FIELD_TYPE_MAP } from './promotion-editor-utils.js';

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
        duplicateDialogOpen: { type: Boolean, state: true },
        duplicating: { type: Boolean, state: true },
    };

    constructor() {
        super();

        this.filter = Store.promotions?.list?.filter?.get() || 'active';
        this.filterOptions = Store.promotions?.list?.filterOptions?.get() || [];
        this.sortField = 'key';
        this.sortDirection = 'asc';
        this.error = null;
        this.promotionsData = Store.promotions?.list?.data?.get() || [];
        this.promotionsLoading = Store.promotions?.list?.loading?.get() || false;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.duplicateDialogOpen = false;
        this.duplicating = false;
        this.reactiveController = new ReactiveController(this, [
            Store.promotions?.list?.data,
            Store.promotions?.list?.loading,
            Store.promotions?.list?.filter,
            Store.promotions?.list?.filterOptions,
            Store.users,
        ]);
    }

    #duplicateProposedTitle = '';
    #duplicateFragment = null;

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
        await this.loadPromotions();
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
            { key: 'title', label: 'Promotion' },
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
            { key: 'actions', label: 'Actions', align: 'center' },
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
                    ${repeat(filteredPromotions, (promotion) => {
                        const promo = promotion.get();
                        return html`
                            <sp-table-row
                                value=${promo.path}
                                data-id=${promo.id}
                                @dblclick=${(e) => this.#handlePromotionRowDblClick(e, promotion)}
                            >
                                <sp-table-cell>${promo.title}</sp-table-cell>
                                <sp-table-cell>
                                    <span class="timeline-cell">
                                        ${promo.timeline}
                                        ${promo.isEvergreen ? html`<span class="evergreen-badge">Evergreen</span>` : nothing}
                                    </span>
                                </sp-table-cell>
                                ${renderPromotionStatusCell(promo.promotionStatus)}
                                <sp-table-cell>${promo.createdBy}</sp-table-cell>
                                ${this.renderActionCell(promotion)}
                            </sp-table-row>
                        `;
                    })}
                </sp-table-body>
            </sp-table>
        `;
    }

    willUpdate() {
        this.canEdit = canEditPromotions();
    }

    render() {
        return html`
            <div class="promotions-container">
                <div class="promotions-header">
                    <sp-search size="m" placeholder="Search"></sp-search>
                    ${this.canEdit
                        ? html`<sp-button variant="accent" @click=${() => this.#handleAddPromotion()} class="create-button">
                              <sp-icon-add slot="icon"></sp-icon-add>
                              Create promotion project
                          </sp-button>`
                        : nothing}
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
                ${this.duplicating
                    ? html`<div class="duplicating-overlay">
                          <sp-progress-circle label="Duplicating project" indeterminate size="l"></sp-progress-circle>
                      </div>`
                    : nothing}
                <mas-promotion-duplicate-dialog
                    .open=${this.duplicateDialogOpen}
                    .proposedTitle=${this.#duplicateProposedTitle}
                    @duplicate-confirmed=${this.#onDuplicateConfirmed}
                    @duplicate-cancelled=${() => {
                        this.duplicateDialogOpen = false;
                    }}
                ></mas-promotion-duplicate-dialog>

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
                            style="${align === 'right'
                                ? 'text-align: right;'
                                : align === 'center'
                                  ? 'text-align: center;'
                                  : ''}"
                        >
                            ${label}
                        </sp-table-head-cell>
                    `,
                )}
            </sp-table-head>
        `;
    }

    renderActionCell(promotion) {
        if (!this.canEdit) {
            return html`
                <sp-table-cell>
                    <sp-action-menu size="m">
                        <sp-menu-item @click="${() => this.#handleEditPromotion(promotion)}">
                            <sp-icon-preview slot="icon"></sp-icon-preview>
                            View
                        </sp-menu-item>
                    </sp-action-menu>
                </sp-table-cell>
            `;
        }
        return html`
            <sp-table-cell>
                <sp-action-menu size="m">
                    ${html`
                        <sp-menu-item @click="${() => this.#handleEditPromotion(promotion)}">
                            <sp-icon-edit slot="icon"></sp-icon-edit>
                            Edit
                        </sp-menu-item>
                        ${!promotion.get().isPromotionPublished || promotion.get().isPromotionModified
                            ? html`<sp-menu-item
                                  ?disabled=${promotion.get().promotionStatus === 'expired'}
                                  @click=${() => this.#handlePublishPromotionFromList(promotion)}
                              >
                                  <sp-icon-publish slot="icon"></sp-icon-publish>
                                  Publish
                              </sp-menu-item>`
                            : nothing}
                        ${promotion.get().isPromotionPublished
                            ? html`<sp-menu-item @click=${() => this.#handleUnpublishPromotionFromList(promotion)}>
                                  <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
                                  Unpublish
                              </sp-menu-item>`
                            : nothing}
                        <sp-menu-item @click=${() => this.#handleDuplicatePromotionFromList(promotion)}>
                            <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                            Duplicate
                        </sp-menu-item>
                        <sp-menu-item disabled>
                            <sp-icon-pause slot="icon"></sp-icon-pause>
                            Pause
                        </sp-menu-item>
                        <sp-menu-item disabled>
                            <sp-icon-archive slot="icon"></sp-icon-archive>
                            Archive
                        </sp-menu-item>
                        <sp-menu-item @click=${() => this.#handleDeletePromotion(promotion)}>
                            <sp-icon-delete slot="icon"></sp-icon-delete>
                            Delete
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
                    .headline=${title}
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

    #handlePromotionRowDblClick(event, promotion) {
        if (
            event.composedPath().some((node) => {
                const name = node?.localName;
                return name === 'sp-action-menu' || name === 'sp-overlay' || name === 'sp-popover';
            })
        ) {
            return;
        }
        this.#handleEditPromotion(promotion);
    }

    async #handlePublishPromotionFromList(promotion) {
        const fragment = promotion.get();
        if (!canPublishPromotionNow(fragment) && !canSchedulePromotion(fragment)) {
            if (isPromotionExpiredForPublish(fragment)) {
                showToast(PROMOTION_EXPIRED_PUBLISH_MESSAGE, 'info');
            }
            return;
        }
        const { confirmed, variationPaths } = await confirmPublishDespiteUnpublishedPromoVariations(
            this.repository.aem,
            fragment,
            (title, message, options) => this.#showDialog(title, message, options),
        );
        if (!confirmed) return;
        try {
            this.loading = true;
            const ok = await publishPromotionProject(this.repository, fragment, variationPaths);
            if (ok) await this.loadPromotions();
        } finally {
            this.loading = false;
        }
    }

    async #handleUnpublishPromotionFromList(promotion) {
        const fragment = promotion.get();
        if (!fragment?.id) return;
        if (!fragment.isPromotionPublished) {
            return;
        }
        const { confirmed, variationPaths } = await confirmUnpublishAlongsidePromoVariations(
            this.repository.aem,
            fragment,
            (title, message, options) => this.#showDialog(title, message, options),
        );
        if (!confirmed) return;
        try {
            this.loading = true;
            const ok = await unpublishPromotionProject(this.repository, fragment, variationPaths);
            if (ok) await this.loadPromotions();
        } finally {
            this.loading = false;
        }
    }

    async #handleDeletePromotion(promotion) {
        if (this.isDialogOpen) {
            return;
        }
        const fragment = promotion.get();
        const attachedVariations = await getAllAttachedPromoVariations(this.repository.aem, fragment);
        const confirmed = await this.#showDialog(
            'Confirm Delete',
            promotionDeleteConfirmMessage(fragment.title, attachedVariations.length),
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'confirmation',
            },
        );
        if (!confirmed) return;
        try {
            this.loading = true;
            showToast('Deleting promotion campaign...');
            await deleteAttachedPromoVariations(this.repository.aem, fragment);
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

    #handleDuplicatePromotionFromList(promotion) {
        if (this.duplicating) return;
        const fragment = promotion.get();
        this.#duplicateProposedTitle = `${fragment.getFieldValue('title')} copy`;
        this.#duplicateFragment = fragment;
        this.duplicateDialogOpen = true;
    }

    #onDuplicateConfirmed = async ({ detail: { title } }) => {
        const fragment = this.#duplicateFragment;
        if (!fragment) return;
        this.duplicateDialogOpen = false;
        this.duplicating = true;
        try {
            const payload = {
                name: normalizeKey(title),
                parentPath: this.repository.getPromotionsPath(),
                modelId: PROMOTION_MODEL_ID,
                title,
                fields: fragment.fields
                    .filter((field) => field.name !== 'collections')
                    .map((field) => ({
                        name: field.name,
                        type: PROMOTION_FIELD_TYPE_MAP[field.name]?.type ?? field.type,
                        multiple: PROMOTION_FIELD_TYPE_MAP[field.name]?.multiple ?? field.multiple ?? false,
                        values: field.name === 'title' ? [title] : field.values,
                    })),
            };
            await this.repository.createFragment(payload, false);
            clearCaches();
            showToast('Project successfully duplicated.', 'positive');
            await this.loadPromotions();
        } catch {
            showToast('Failed to duplicate project.', 'negative');
        } finally {
            this.duplicating = false;
        }
    };

    #handleFilterPromotions(filter) {
        // reset promotions data
        this.promotionsData = Store.promotions.list.data.get() || [];
        this.filter = filter;
        Store.promotions.list.filter.set(filter);

        if (filter !== 'all') {
            const filteredPromotions = this.promotionsData.filter(
                (promotion) => promotion.value?.promotionListFilterKey === filter,
            );
            this.promotionsData = filteredPromotions;
        }
    }
}

customElements.define('mas-promotions', MasPromotions);
