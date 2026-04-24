import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-items.css.js';

class MasBulkPublishItems extends LitElement {
    static styles = styles;
    static properties = {
        items: { type: Array },
        urls: { type: String },
        collapsed: { state: true },
    };

    constructor() {
        super();
        this.items = [];
        this.urls = '';
        this.collapsed = false;
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

    emitAddBySearch() {
        this.dispatchEvent(new CustomEvent('add-by-search', { bubbles: true, composed: true }));
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
    }

    renderEmpty() {
        return html`
            <div class="sublabel">Enter URLs</div>
            <textarea
                placeholder="For example: https://www.adobe.com/products/firefly.html"
                .value=${this.urls}
                @input=${this.handleInput}
            ></textarea>
            <sp-button
                class="add-by-search"
                variant="secondary"
                treatment="outline"
                size="s"
                data-testid="add-by-search-btn"
                @click=${this.emitAddBySearch}
            >
                <sp-icon-add slot="icon"></sp-icon-add>
                Add by search
            </sp-button>
        `;
    }

    renderList() {
        return html`
            ${this.notFoundCount > 0
                ? html`<div class="warning" data-testid="items-warning">
                      <sp-icon-alert></sp-icon-alert>
                      ${this.notFoundCount} 404 error${this.notFoundCount > 1 ? 's' : ''} found
                  </div>`
                : nothing}
            <ul data-testid="items-list">
                ${this.items.map(
                    (item) => html`
                        <li data-testid="item-row">
                            <a href=${item.url} target="_blank" rel="noopener">${item.url}</a>
                        </li>
                    `,
                )}
            </ul>
        `;
    }

    render() {
        return html`
            <div class="header">
                <h3>Items <span class="required">*</span></h3>
                <button class="collapse" aria-label=${this.collapsed ? 'Expand' : 'Collapse'} @click=${this.toggleCollapse}>
                    ${this.collapsed
                        ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                        : html`<sp-icon-chevron-up></sp-icon-chevron-up>`}
                </button>
            </div>
            ${this.collapsed ? nothing : this.items.length ? this.renderList() : this.renderEmpty()}
        `;
    }
}

customElements.define('mas-bulk-publish-items', MasBulkPublishItems);
