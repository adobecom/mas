import { LitElement, html, nothing, css } from 'lit';

class MasBulkPublishConfirmDialog extends LitElement {
    static styles = css`
        p {
            margin: 0 0 4px;
        }
        .warning {
            font-weight: 700;
            margin: 0 0 16px;
        }
        dl {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 4px 12px;
            margin: 0;
        }
        dt {
            font-weight: 700;
        }
        dd {
            margin: 0;
        }
    `;

    static properties = {
        projectTitle: { type: String },
        validCount: { type: Number },
        skippedCount: { type: Number },
        open: { type: Boolean },
    };

    constructor() {
        super();
        this.projectTitle = '';
        this.validCount = 0;
        this.skippedCount = 0;
        this.open = false;
    }

    confirm() {
        this.dispatchEvent(new CustomEvent('publish-confirmed', { bubbles: true, composed: true }));
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('publish-cancelled', { bubbles: true, composed: true }));
    }

    render() {
        if (!this.open) return nothing;
        const total = this.validCount + this.skippedCount;
        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                headline="Publish project"
                cancel-label="Cancel"
                confirm-label="Publish"
                underlay
                no-divider
                @confirm=${this.confirm}
                @cancel=${this.cancel}
                @close=${this.cancel}
            >
                <p>This project will be published immediately.</p>
                ${this.skippedCount > 0
                    ? html`<p class="warning">
                          Note that ${this.skippedCount}
                          ${this.skippedCount === 1 ? 'item has' : 'items have'} a false URL and will be skipped. The
                          remaining ${this.validCount} ${this.validCount === 1 ? 'item' : 'items'} will be published.
                      </p>`
                    : nothing}
                <dl>
                    <dt>Project:</dt>
                    <dd>${this.projectTitle}</dd>
                    <dt>Items:</dt>
                    <dd>${this.validCount} of ${total}</dd>
                </dl>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-bulk-publish-confirm-dialog', MasBulkPublishConfirmDialog);
