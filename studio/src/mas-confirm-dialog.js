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
        :host {
            display: contents;
        }

        sp-dialog-wrapper {
            --sp-overlay-background: rgba(0, 0, 0, 0.4);
        }
    `;

    constructor() {
        super();
        this.reactiveController = new ReactiveController(this, [Store.confirmDialogOptions]);
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
        const { variant, title, content, confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = this.options;
        return html`
            <sp-dialog-wrapper
                open
                underlay
                .headline=${title}
                .variant=${variant || 'negative'}
                .confirmLabel=${confirmLabel}
                .cancelLabel=${cancelLabel}
                @confirm=${() => this.handleDialogAction(true)}
                @cancel=${() => this.handleDialogAction(false)}
            >
                <div>${content}</div>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-confirm-dialog', MasConfirmDialog);
