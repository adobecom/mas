import { LitElement, html, nothing } from 'lit';
import { STAGED } from '../constants.js';

class MasPublishStagedDialog extends LitElement {
    static properties = {
        open: { type: Boolean },
        multiselect: { type: Boolean },
    };

    constructor() {
        super();
        this.open = false;
        this.multiselect = false;
    }

    confirm() {
        this.dispatchEvent(new CustomEvent('staged-confirmed', { bubbles: true, composed: true }));
    }

    cancel() {
        this.dispatchEvent(new CustomEvent('staged-cancelled', { bubbles: true, composed: true }));
    }

    render() {
        if (!this.open) return nothing;
        return html`
            <sp-dialog-wrapper
                open
                mode="modal"
                headline="${STAGED.DIALOG_TITLE}"
                cancel-label="Cancel"
                confirm-label="Publish"
                underlay
                size="m"
                no-divider
                @confirm=${this.confirm}
                @cancel=${this.cancel}
                @close=${this.cancel}
            >
                <p>${this.multiselect ? STAGED.DIALOG_CONFIRM_MULTIPLE_TEXT : STAGED.DIALOG_CONFIRM_TEXT}</p>
            </sp-dialog-wrapper>
        `;
    }

    static show(multiselect) {
        return new Promise((resolve) => {
            const dialog = document.createElement('mas-publish-staged-dialog');
            const container = document.querySelector('sp-theme') ?? document.body;
            container.appendChild(dialog);

            const cleanup = (result) => {
                dialog.remove();
                resolve(result);
            };

            dialog.addEventListener('staged-confirmed', (e) => cleanup({ confirmed: true }), { once: true });
            dialog.addEventListener('staged-cancelled', () => cleanup({ confirmed: false }), { once: true });

            dialog.open = true;
            dialog.multiselect = !!multiselect;
        });
    }
}

customElements.define('mas-publish-staged-dialog', MasPublishStagedDialog);
export { MasPublishStagedDialog };
