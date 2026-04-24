import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-items.css.js';

class MasBulkPublishItems extends LitElement {
    static styles = styles;
    static properties = {
        items: { type: Array },
        urls: { type: String },
    };

    constructor() {
        super();
        this.items = [];
        this.urls = '';
    }

    get notFoundCount() {
        return this.items.filter((i) => i.reason === 'not-found').length;
    }

    handleInput(e) {
        this.dispatchEvent(
            new CustomEvent('urls-change', {
                detail: e.target.value,
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderEmpty() {
        return html`
            <textarea
                rows="6"
                placeholder="Enter URLs (one per line)"
                .value=${this.urls}
                @input=${this.handleInput}
            ></textarea>
            <sp-button variant="secondary" size="m">+ Add by search</sp-button>
        `;
    }

    renderList() {
        return html`
            ${this.notFoundCount > 0
                ? html`<div class="warning" data-testid="items-warning">404 error found (${this.notFoundCount})</div>`
                : nothing}
            <ul data-testid="items-list">
                ${this.items.map(
                    (item) => html`
                        <li data-testid="item-row">
                            <a href=${item.url}>${item.url}</a>
                        </li>
                    `,
                )}
            </ul>
        `;
    }

    render() {
        return html`<h3>Items (${this.items.length})</h3>
            ${this.items.length ? this.renderList() : this.renderEmpty()}`;
    }
}

customElements.define('mas-bulk-publish-items', MasBulkPublishItems);
