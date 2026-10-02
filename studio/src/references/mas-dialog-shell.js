import { LitElement, html } from 'lit';

/**
 * Base for the fragment editor's reference modals. It owns the overlay, the framed panel and the
 * header so the pieces that are easy to get subtly wrong -- the underlay's close contract and the
 * scroll plumbing in the shared stylesheet -- exist in exactly one place.
 *
 * Subclasses set `open`, provide `static styles = [dialogShellStyles, styles]`, and return
 * `this.renderShell(title, content)` from render().
 */
export class MasDialogShell extends LitElement {
    static properties = {
        open: { type: Boolean },
    };

    constructor() {
        super();
        this.open = false;
    }

    close() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    /**
     * Wraps dialog content in the shared overlay and frame.
     *
     * @param {string} title Heading shown in the dialog header
     * @param {unknown} content Lit template rendered below the header
     */
    renderShell(title, content) {
        // sp-underlay overrides click() to emit its own non-bubbling "close" event, so it never
        // fires a click event to bind against; @click here would silently never run.
        return html`
            <sp-underlay open @close=${() => this.close()}></sp-underlay>
            <sp-dialog no-divider size="l" class="dialog-shell">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h2 class="dialog-title">${title}</h2>
                        <sp-action-button quiet label="Close" class="dialog-close" @click=${() => this.close()}>
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-action-button>
                    </div>
                    ${content}
                </div>
            </sp-dialog>
        `;
    }
}
