import { LitElement, html, nothing, css } from 'lit';

class MasBulkPublishDeleteDialog extends LitElement {
    static styles = css`
        p {
            margin: 0;
        }
        strong {
            font-weight: 700;
        }
    `;

    static properties = {
        projectTitle: { type: String },
        open: { type: Boolean },
    };

    constructor() {
        super();
        this.projectTitle = '';
        this.open = false;
    }

    confirm() {
        this.dispatchEvent(new CustomEvent('delete-confirmed', { bubbles: true, composed: true }));
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('delete-cancelled', { bubbles: true, composed: true }));
    }

    render() {
        if (!this.open) return nothing;
        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                headline="Delete project"
                cancel-label="Cancel"
                confirm-label="Delete"
                underlay
                no-divider
                @confirm=${this.confirm}
                @cancel=${this.cancel}
                @close=${this.cancel}
            >
                <p>Delete <strong>${this.projectTitle}</strong>? This cannot be undone.</p>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-bulk-publish-delete-dialog', MasBulkPublishDeleteDialog);
