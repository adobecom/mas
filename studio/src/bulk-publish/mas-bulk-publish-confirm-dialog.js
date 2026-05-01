import { LitElement, html, nothing } from 'lit';

class MasBulkPublishConfirmDialog extends LitElement {
    static properties = {
        projectTitle: { type: String },
        itemCount: { type: Number },
        open: { type: Boolean },
    };

    constructor() {
        super();
        this.projectTitle = '';
        this.itemCount = 0;
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
                <dl>
                    <dt>Project:</dt>
                    <dd>${this.projectTitle}</dd>
                    <dt>Scheduled:</dt>
                    <dd>Now</dd>
                    <dt>Items:</dt>
                    <dd>${this.itemCount}</dd>
                </dl>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-bulk-publish-confirm-dialog', MasBulkPublishConfirmDialog);
