import { LitElement, html, nothing, css } from 'lit';

class MasBulkPublishRevertDialog extends LitElement {
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
        this.dispatchEvent(new CustomEvent('revert-confirmed', { bubbles: true, composed: true }));
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('revert-cancelled', { bubbles: true, composed: true }));
    }

    render() {
        if (!this.open) return nothing;
        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                headline="Revert project"
                cancel-label="Cancel"
                confirm-label="Revert"
                underlay
                no-divider
                @confirm=${this.confirm}
                @cancel=${this.cancel}
                @close=${this.cancel}
            >
                <p>
                    Revert <strong>${this.projectTitle}</strong>? All items will be rolled back to the snapshot taken before
                    publishing.
                </p>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-bulk-publish-revert-dialog', MasBulkPublishRevertDialog);
