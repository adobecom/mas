import { LitElement, html, nothing } from 'lit';

class MasBulkPublishDuplicateDialog extends LitElement {
    static properties = {
        proposedTitle: { type: String },
        open: { type: Boolean },
        newTitle: { state: true },
    };

    constructor() {
        super();
        this.proposedTitle = '';
        this.open = false;
        this.newTitle = '';
    }

    willUpdate(changed) {
        if (changed.has('open') && this.open) {
            this.newTitle = this.proposedTitle;
        }
    }

    confirm() {
        this.dispatchEvent(
            new CustomEvent('duplicate-confirmed', {
                bubbles: true,
                composed: true,
                detail: { title: this.newTitle || this.proposedTitle },
            }),
        );
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('duplicate-cancelled', { bubbles: true, composed: true }));
    }

    handleInput(e) {
        this.newTitle = e.target.value;
    }

    render() {
        if (!this.open) return nothing;
        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                headline="Duplicate project"
                cancel-label="Cancel"
                confirm-label="Duplicate"
                underlay
                no-divider
                @confirm=${this.confirm}
                @cancel=${this.cancel}
                @close=${this.cancel}
            >
                <p>Enter a name for the duplicated project.</p>
                <sp-textfield
                    .value=${this.newTitle}
                    @input=${this.handleInput}
                    placeholder="Project name"
                    autofocus
                ></sp-textfield>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-bulk-publish-duplicate-dialog', MasBulkPublishDuplicateDialog);
