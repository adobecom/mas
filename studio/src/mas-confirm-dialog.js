import { LitElement, html, css, nothing } from 'lit';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';

let resolver;

export function confirmation(options) {
    return new Promise((resolve) => {
        Store.confirmDialogOptions.set(options);
        resolver = resolve;
    });
}

class MasConfirmDialog extends LitElement {
    static styles = css`
        .confirm-dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1500;
        }

        .confirm-dialog-overlay sp-dialog-wrapper {
            max-width: 100vw;
        }
    `;

    constructor() {
        super();
        this.reactiveController = new ReactiveController(this, [
            Store.confirmDialogOptions,
        ]);
    }

    get options() {
        return Store.confirmDialogOptions.get();
    }

    handleDialogAction(result) {
        Store.confirmDialogOptions.set(null);
        resolver(result);
        resolver = null;
    }

    render() {
        if (!this.options) return nothing;
        const {
            variant,
            title,
            content,
            confirmLabel = 'Confirm',
            cancelLabel = 'Cancel',
        } = this.options;
        return html`<div class="confirm-dialog-overlay">
            <sp-dialog-wrapper
                open
                underlay
                id="global-confirm-dialog"
                .headline=${title}
                .variant=${variant || 'negative'}
                .confirmLabel=${confirmLabel}
                .cancelLabel=${cancelLabel}
                @confirm=${() => this.handleDialogAction(true)}
                @cancel=${() => this.handleDialogAction(false)}
            >
                <div>${content}</div>
            </sp-dialog-wrapper>
        </div>`;
    }
}

customElements.define('mas-confirm-dialog', MasConfirmDialog);
