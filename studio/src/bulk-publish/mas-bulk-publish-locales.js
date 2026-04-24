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
            <h3>Locales ${n ? `(${n})` : ''}</h3>
            <p class="help">A selection here is only needed if the URLs above don't include locales already.</p>
            ${n === 0
                ? html`
                      <div
                          class="dropzone"
                          data-testid="empty-dropzone"
                          role="button"
                          tabindex="0"
                          @click=${this.emitEdit}
                          @keydown=${(e) => (e.key === 'Enter' || e.key === ' ') && this.emitEdit()}
                      >
                          <span class="plus">+</span>
                          <div>
                              <p class="label">Add locales</p>
                              <p class="sublabel">Choose one or more locales for your bulk publish project.</p>
                          </div>
                      </div>
                  `
                : html`
                      <div class="summary" data-testid="summary">
                          <span>${this.locales.join(', ')}</span>
                          <sp-action-button quiet @click=${this.emitEdit}>Edit</sp-action-button>
                      </div>
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish-locales', MasBulkPublishLocales);
