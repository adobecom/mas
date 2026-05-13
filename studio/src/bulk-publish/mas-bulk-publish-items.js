import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-items.css.js';

const ERROR_LABELS = {
    'not-found': '404 - URL not found',
    duplicate: 'Duplicate item',
};

function emit(target, type, detail) {
    target.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
}

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

    get errorCount() {
        return this.items.filter((i) => i.status === 'error').length;
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
        emit(this, 'urls-change', e.target.value);
    }

    handleChange() {
        emit(this, 'validate-items');
    }

    emitAddBySearch() {
        emit(this, 'add-by-search');
    }

    removeUrl(url) {
        emit(this, 'url-remove', url);
    }

    removeAll() {
        emit(this, 'remove-all');
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
        const label = ERROR_LABELS[item.reason] ?? 'Invalid URL';
        return html`<span class="status-cell status-error">
            <sp-icon-alert></sp-icon-alert>
            ${label}
        </span>`;
    }

    renderBody() {
        if (this.collapsed) return nothing;
        const { rows } = this;
        const errorCount = this.errorCount;
        return html`
            ${rows.length > 0
                ? html`<div class="items-box" data-testid="items-list">
                      <div class="items-table-header">
                          <span>URL</span>
                          <span>Status</span>
                          <span>Actions</span>
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
                                      <span class="actions-cell">
                                          <sp-action-button
                                              size="xs"
                                              quiet
                                              label="Remove item"
                                              ?disabled=${this.disabled}
                                              @click=${() => this.removeUrl(item.url)}
                                          >
                                              <sp-icon-delete slot="icon"></sp-icon-delete>
                                              Remove
                                          </sp-action-button>
                                      </span>
                                  </li>
                              `,
                          )}
                          <li class="footer-row" data-testid="items-footer">
                              <span class="footer-count">${rows.length} URL${rows.length !== 1 ? 's' : ''}</span>
                              <span class="url-spacer"></span>
                              ${errorCount > 0
                                  ? html`<span class="status-cell status-error">
                                        <sp-icon-alert></sp-icon-alert>
                                        ${errorCount} error${errorCount !== 1 ? 's' : ''} found
                                    </span>`
                                  : html`<span class="status-cell"></span>`}
                              <span class="actions-cell">
                                  <sp-action-button
                                      size="xs"
                                      quiet
                                      label="Remove all"
                                      ?disabled=${this.disabled}
                                      @click=${this.removeAll}
                                  >
                                      <sp-icon-delete slot="icon"></sp-icon-delete>
                                      Remove all
                                  </sp-action-button>
                              </span>
                          </li>
                      </ul>
                  </div>`
                : nothing}
            <div class="sublabel">Enter URLs</div>
            <sp-textfield
                class="url-input"
                multiline
                placeholder="https://mas.adobe.com/studio.html#&lt;fragment-id&gt;"
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
