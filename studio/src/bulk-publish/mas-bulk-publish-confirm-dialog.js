import { LitElement, html, nothing, css } from 'lit';
import { ALERT_DIAMOND_SVG } from './bulk-publish-icons.js';

class MasBulkPublishConfirmDialog extends LitElement {
    static styles = css`
        .heading {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 16px;
            font-family: var(--spectrum-sans-font-family-stack, 'Adobe Clean', sans-serif);
            font-size: 22px;
            font-weight: 700;
            line-height: 26px;
            color: var(--spectrum-heading-color, #131313);
        }
        .heading svg {
            flex-shrink: 0;
            color: #d45b00;
        }
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
        const hasSkipped = this.skippedCount > 0;
        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                cancel-label="Cancel"
                confirm-label="Publish"
                underlay
                no-divider
                @confirm=${this.confirm}
                @cancel=${this.cancel}
                @close=${this.cancel}
            >
                <h2 class="heading">
                    ${hasSkipped ? ALERT_DIAMOND_SVG : nothing}
                    <span>Publish project</span>
                </h2>
                <p>This project will be published immediately.</p>
                ${hasSkipped
                    ? html`<p class="warning">
                          Note that ${this.skippedCount} ${this.skippedCount === 1 ? 'item has' : 'items have'} a false URL and
                          will be skipped. The remaining ${this.validCount} ${this.validCount === 1 ? 'item' : 'items'} will be
                          published.
                      </p>`
                    : nothing}
                <dl>
                    <dt>Project:</dt>
                    <dd>${this.projectTitle}</dd>
                    <dt>Scheduled:</dt>
                    <dd>Now</dd>
                    <dt>Items:</dt>
                    <dd>${this.validCount} of ${total}</dd>
                </dl>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-bulk-publish-confirm-dialog', MasBulkPublishConfirmDialog);
