import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-locales.css.js';

class MasBulkPublishLocales extends LitElement {
    static styles = styles;
    static properties = {
        locales: { type: Array },
        collapsed: { state: true },
    };

    constructor() {
        super();
        this.locales = [];
        this.collapsed = false;
    }

    emitEdit() {
        this.dispatchEvent(new CustomEvent('edit-locales', { bubbles: true, composed: true }));
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
    }

    render() {
        const n = this.locales.length;
        return html`
            <div class="header">
                <h3>Locales<span class="count"> (${n})</span></h3>
                <div class="header-actions">
                    <sp-action-button size="s" quiet data-testid="edit-locales-btn" @click=${this.emitEdit}>
                        <sp-icon-edit slot="icon"></sp-icon-edit>
                        Edit
                    </sp-action-button>
                    <button class="collapse" aria-label=${this.collapsed ? 'Expand' : 'Collapse'} @click=${this.toggleCollapse}>
                        ${this.collapsed
                            ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-up></sp-icon-chevron-up>`}
                    </button>
                </div>
            </div>
            ${this.collapsed
                ? nothing
                : html`
                      ${n > 0
                          ? html`<div class="locales-box" data-testid="summary">
                                <ul>
                                    ${this.locales.map((locale) => html`<li data-testid="locale-row">${locale}</li>`)}
                                </ul>
                            </div>`
                          : html`<p class="empty" data-testid="no-locales">No locales selected</p>`}
                  `}
        `;
    }
}

customElements.define('mas-bulk-publish-locales', MasBulkPublishLocales);
