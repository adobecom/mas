import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-items.css.js';

class MasBulkPublishItems extends LitElement {
    static styles = styles;
    static properties = {
        items: { type: Array },
        urls: { type: String },
        disabled: { type: Boolean },
        collapsed: { state: true },
    };

    constructor() {
        super();
        this.items = [];
        this.urls = '';
        this.disabled = false;
        this.collapsed = false;
    }

    get notFoundCount() {
        return this.items.filter((i) => i.reason === 'not-found').length;
    }

    get urlLines() {
        return this.urls
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
    }

    get rows() {
        if (this.items.length > 0) return this.items;
        return this.urlLines.map((url) => ({ url }));
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

    handleChange() {
        this.dispatchEvent(new CustomEvent('validate-items', { bubbles: true, composed: true }));
    }

    emitAddBySearch() {
        this.dispatchEvent(new CustomEvent('add-by-search', { bubbles: true, composed: true }));
    }

    removeUrl(url) {
        this.dispatchEvent(
            new CustomEvent('url-remove', {
                detail: url,
                bubbles: true,
                composed: true,
            }),
        );
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
    }

    renderStatusCell(item) {
        if (!item.status || item.status === 'pending') {
            return html`<span class="status-cell status-pending">Pending…</span>`;
        }
        if (item.status === 'valid') {
            return html`<span class="status-cell status-valid">
                <sp-icon-checkmark-circle></sp-icon-checkmark-circle>
                Validated
            </span>`;
        }
        const label = item.reason === 'not-found' ? '404 - URL not found' : 'Invalid URL';
        return html`<span class="status-cell status-error">
            <sp-icon-alert></sp-icon-alert>
            ${label}
        </span>`;
    }

    renderBody() {
        if (this.collapsed) return nothing;
        const { rows } = this;
        return html`
            ${this.notFoundCount > 0
                ? html`<div class="warning" data-testid="items-warning">
                      <sp-icon-alert></sp-icon-alert>
                      ${this.notFoundCount} 404 error${this.notFoundCount > 1 ? 's' : ''} found
                  </div>`
                : nothing}
            ${rows.length > 0
                ? html`<div class="items-box" data-testid="items-list">
                      <div class="items-table-header">
                          <span>URL</span>
                          <span>Status</span>
                      </div>
                      <ul>
                          ${rows.map(
                              (item) => html`
                                  <li data-testid="item-row">
                                      <a href=${item.href ?? item.url} target="_blank" rel="noopener"
                                          >${item.authorPath ?? item.url}</a
                                      >
                                      <span class="url-spacer"></span>
                                      ${this.renderStatusCell(item)}
                                      <sp-action-button
                                          size="xs"
                                          quiet
                                          label="Remove item"
                                          ?disabled=${this.disabled}
                                          @click=${() => this.removeUrl(item.url)}
                                      >
                                          <sp-icon-delete slot="icon"></sp-icon-delete>
                                      </sp-action-button>
                                  </li>
                              `,
                          )}
                      </ul>
                  </div>`
                : nothing}
            <div class="sublabel">Enter URLs</div>
            <sp-textfield
                class="url-input"
                multiline
                placeholder="For example: https://www.adobe.com/products/firefly.html"
                .value=${this.urls}
                ?disabled=${this.disabled}
                @input=${this.handleInput}
                @change=${this.handleChange}
            ></sp-textfield>
            <sp-action-button
                class="add-by-search"
                size="s"
                quiet
                data-testid="add-by-search-btn"
                ?disabled=${this.disabled}
                @click=${this.emitAddBySearch}
            >
                <sp-icon-add slot="icon"></sp-icon-add>
                Add by search
            </sp-action-button>
        `;
    }

    render() {
        const count = this.items.length || this.urlLines.length;
        return html`
            <div class="header">
                <h3>
                    Items${count > 0 ? html`<span class="count"> (${count})</span>` : nothing}
                    <span class="required">*</span>
                </h3>
                <div class="header-actions">
                    <sp-action-button
                        size="s"
                        quiet
                        class="collapse"
                        label=${this.collapsed ? 'Expand' : 'Collapse'}
                        @click=${this.toggleCollapse}
                    >
                        ${this.collapsed
                            ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-up slot="icon"></sp-icon-chevron-up>`}
                    </sp-action-button>
                </div>
            </div>
            ${this.renderBody()}
        `;
    }
}

customElements.define('mas-bulk-publish-items', MasBulkPublishItems);
