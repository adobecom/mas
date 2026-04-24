import { LitElement, html } from 'lit';
import { styles } from './mas-bulk-publish-locales.css.js';

class MasBulkPublishLocales extends LitElement {
    static styles = styles;
    static properties = { locales: { type: Array } };

    constructor() {
        super();
        this.locales = [];
    }

    emitEdit() {
        this.dispatchEvent(new CustomEvent('edit-locales', { bubbles: true, composed: true }));
    }

    render() {
        const n = this.locales.length;
        return html`
            <h3>Locales (${n})</h3>
            ${n === 0
                ? html`
                      <div class="dropzone" data-testid="empty-dropzone" @click=${this.emitEdit}>
                          <strong>+ Add locales</strong>
                          <p>Choose one or more locales for your bulk publish project.</p>
                      </div>
                  `
                : html`
                      <div data-testid="summary">${this.locales.join(', ')}</div>
                      <sp-action-button @click=${this.emitEdit}>Edit</sp-action-button>
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish-locales', MasBulkPublishLocales);
