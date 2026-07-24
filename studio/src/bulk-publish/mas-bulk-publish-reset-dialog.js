import { LitElement, html, nothing, css } from 'lit';

class MasBulkPublishResetDialog extends LitElement {
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
        this.dispatchEvent(new CustomEvent('reset-confirmed', { bubbles: true, composed: true }));
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('reset-cancelled', { bubbles: true, composed: true }));
    }

    render() {
        if (!this.open) return nothing;
        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                headline="Reset project to Draft"
                cancel-label="Cancel"
                confirm-label="Reset to Draft"
                underlay
                no-divider
                @confirm=${this.confirm}
                @cancel=${this.cancel}
                @close=${this.cancel}
            >
                <p>
                    Reset <strong>${this.projectTitle}</strong> to Draft? Use this only if a publish has stalled. Anything
                    already published stays published — this clears the status so you can publish again. If a publish is still
                    running, resetting will abandon it.
                </p>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-bulk-publish-reset-dialog', MasBulkPublishResetDialog);
