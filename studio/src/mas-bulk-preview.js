import { LitElement, html, css } from 'lit';

/**
 * Bulk Operation Preview Component
 * Shows preview of bulk update/publish/delete operations with approve/cancel actions
 */
export class MasBulkPreview extends LitElement {
    static properties = {
        previewData: { type: Object },
        operation: { type: String },
    };

    createRenderRoot() {
        return this;
    }

    handleApprove() {
        this.dispatchEvent(
            new CustomEvent('approve-preview', {
                detail: { previewData: this.previewData, operation: this.operation },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleCancel() {
        this.dispatchEvent(
            new CustomEvent('cancel-preview', {
                detail: { operation: this.operation },
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderUpdatePreview() {
        const { previews = [], summary } = this.previewData;

        return html`
            <div class="bulk-preview-container">
                <div class="bulk-preview-header">
                    <sp-icon-edit size="m"></sp-icon-edit>
                    <h4>Bulk Update Preview</h4>
                </div>

                <div class="bulk-preview-summary">
                    <sp-badge size="m">${summary.willUpdate} cards will be updated</sp-badge>
                    ${summary.noChanges > 0
                        ? html`<sp-badge size="m" variant="neutral">${summary.noChanges} no changes</sp-badge>`
                        : ''}
                    ${summary.errors > 0 ? html`<sp-badge size="m" variant="negative">${summary.errors} errors</sp-badge>` : ''}
                </div>

                <div class="bulk-preview-items">
                    ${previews
                        .filter((item) => item.willUpdate)
                        .slice(0, 10)
                        .map(
                            (item) => html`
                                <div class="preview-item">
                                    <div class="preview-item-header">
                                        <sp-icon-check-circle size="s"></sp-icon-check-circle>
                                        <strong>${item.fragmentName}</strong>
                                    </div>
                                    <div class="preview-item-changes">
                                        ${item.changes.map((change) => html`<div class="change-text">• ${change}</div>`)}
                                    </div>
                                </div>
                            `,
                        )}
                    ${previews.filter((item) => item.willUpdate).length > 10
                        ? html`<div class="preview-more">
                              + ${previews.filter((item) => item.willUpdate).length - 10} more cards...
                          </div>`
                        : ''}
                </div>

                <div class="bulk-preview-actions">
                    <sp-button size="m" variant="accent" @click=${this.handleApprove}>
                        <sp-icon-checkmark slot="icon"></sp-icon-checkmark>
                        Approve & Execute
                    </sp-button>
                    <sp-button size="m" variant="secondary" @click=${this.handleCancel}>
                        <sp-icon-close slot="icon"></sp-icon-close>
                        Cancel
                    </sp-button>
                </div>
            </div>
        `;
    }

    renderPublishPreview() {
        const { previews = [], summary, action } = this.previewData;
        const actionLabel = action === 'publish' ? 'Published' : 'Unpublished';

        return html`
            <div class="bulk-preview-container">
                <div class="bulk-preview-header">
                    <sp-icon-publish-check size="m"></sp-icon-publish-check>
                    <h4>Bulk ${actionLabel} Preview</h4>
                </div>

                <div class="bulk-preview-summary">
                    <sp-badge size="m">${summary.willChange} cards will be ${action}ed</sp-badge>
                    ${summary.alreadyInState > 0
                        ? html`<sp-badge size="m" variant="neutral">${summary.alreadyInState} already ${action}ed</sp-badge>`
                        : ''}
                    ${summary.errors > 0 ? html`<sp-badge size="m" variant="negative">${summary.errors} errors</sp-badge>` : ''}
                </div>

                <div class="bulk-preview-items">
                    ${previews
                        .filter((item) => item.willChange)
                        .slice(0, 10)
                        .map(
                            (item) => html`
                                <div class="preview-item">
                                    <sp-icon-check-circle size="s"></sp-icon-check-circle>
                                    <span>${item.fragmentName}</span>
                                </div>
                            `,
                        )}
                    ${previews.filter((item) => item.willChange).length > 10
                        ? html`<div class="preview-more">
                              + ${previews.filter((item) => item.willChange).length - 10} more cards...
                          </div>`
                        : ''}
                </div>

                <div class="bulk-preview-actions">
                    <sp-button size="m" variant="accent" @click=${this.handleApprove}>
                        <sp-icon-checkmark slot="icon"></sp-icon-checkmark>
                        Approve & ${actionLabel}
                    </sp-button>
                    <sp-button size="m" variant="secondary" @click=${this.handleCancel}>
                        <sp-icon-close slot="icon"></sp-icon-close>
                        Cancel
                    </sp-button>
                </div>
            </div>
        `;
    }

    renderDeletePreview() {
        const { previews = [], summary } = this.previewData;

        return html`
            <div class="bulk-preview-container bulk-preview-danger">
                <div class="bulk-preview-header">
                    <sp-icon-alert size="m"></sp-icon-alert>
                    <h4>⚠️ Bulk Delete Preview</h4>
                </div>

                <div class="bulk-preview-warning">
                    <sp-icon-alert size="s"></sp-icon-alert>
                    <strong>Warning:</strong> This action cannot be undone. ${summary.willDelete} cards will be permanently
                    deleted.
                </div>

                <div class="bulk-preview-items">
                    ${previews
                        .filter((item) => item.willDelete)
                        .slice(0, 10)
                        .map(
                            (item) => html`
                                <div class="preview-item preview-item-danger">
                                    <sp-icon-delete size="s"></sp-icon-delete>
                                    <span>${item.fragmentName}</span>
                                    <sp-badge size="s" variant="negative">Will Delete</sp-badge>
                                </div>
                            `,
                        )}
                    ${previews.filter((item) => item.willDelete).length > 10
                        ? html`<div class="preview-more">
                              + ${previews.filter((item) => item.willDelete).length - 10} more cards...
                          </div>`
                        : ''}
                </div>

                <div class="bulk-preview-actions">
                    <sp-button size="m" variant="negative" @click=${this.handleApprove}>
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                        Confirm Delete
                    </sp-button>
                    <sp-button size="m" variant="secondary" @click=${this.handleCancel}>
                        <sp-icon-close slot="icon"></sp-icon-close>
                        Cancel
                    </sp-button>
                </div>
            </div>
        `;
    }

    render() {
        if (!this.previewData) {
            return html`<div class="bulk-preview-error">No preview data available</div>`;
        }

        if (this.operation === 'studio_preview_bulk_update') {
            return this.renderUpdatePreview();
        }

        if (this.operation === 'studio_preview_bulk_publish') {
            return this.renderPublishPreview();
        }

        if (this.operation === 'studio_preview_bulk_delete') {
            return this.renderDeletePreview();
        }

        return html`<div class="bulk-preview-error">Unknown preview operation: ${this.operation}</div>`;
    }
}

customElements.define('mas-bulk-preview', MasBulkPreview);
