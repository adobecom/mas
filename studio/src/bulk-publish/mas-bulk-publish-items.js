import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-bulk-publish-items.css.js';

class MasBulkPublishItems extends LitElement {
    static styles = styles;
    static properties = {
        items: { type: Array },
        urls: { type: String },
        collapsed: { state: true },
        editing: { state: true },
    };

    constructor() {
        super();
        this.items = [];
        this.urls = '';
        this.collapsed = false;
        this.editing = false;
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

    get hasContent() {
        return this.items.length > 0 || this.urlLines.length > 0;
    }

    get isEditing() {
        return this.editing;
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

    renderViewState() {
        const rows = this.items.length > 0 ? this.items : this.urlLines.map((url) => ({ url }));
        if (rows.length === 0) return nothing;
        return html`
            ${this.notFoundCount > 0
                ? html`<div class="warning" data-testid="items-warning">
                      <sp-icon-alert></sp-icon-alert>
                      ${this.notFoundCount} 404 error${this.notFoundCount > 1 ? 's' : ''} found
                  </div>`
                : nothing}
            <div class="items-box" data-testid="items-list">
                <ul>
                    ${rows.map(
                        (item) => html`
                            <li data-testid="item-row">
                                <a href=${item.href ?? item.url} target="_blank" rel="noopener"
                                    >${item.authorPath ?? item.url}</a
                                >
                            </li>
                        `,
                    )}
                </ul>
            </div>
        `;
    }

    renderEditState() {
        const rows = this.items.length > 0 ? this.items : this.urlLines.map((url) => ({ url }));
        return html`
            <div class="sublabel">Enter URLs</div>
            ${rows.length > 0
                ? html`<div class="items-box" data-testid="items-list">
                      <ul>
                          ${rows.map(
                              (item) => html`
                                  <li class="with-action" data-testid="item-row">
                                      <a href=${item.href ?? item.url} target="_blank" rel="noopener"
                                          >${item.authorPath ?? item.url}</a
                                      >
                                      <sp-action-button
                                          size="xs"
                                          quiet
                                          label="Remove item"
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
            <sp-textfield
                class="url-input"
                multiline
                placeholder="For example: https://www.adobe.com/products/firefly.html"
                .value=${this.urls}
                @input=${this.handleInput}
                @change=${this.handleChange}
            ></sp-textfield>
            <sp-action-button
                class="add-by-search"
                size="s"
                quiet
                data-testid="add-by-search-btn"
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
                    ${!this.isEditing
                        ? html`<sp-action-button
                              size="s"
                              quiet
                              data-testid="edit-items-btn"
                              @click=${() => (this.editing = true)}
                          >
                              <sp-icon-edit slot="icon"></sp-icon-edit>
                              Edit
                          </sp-action-button>`
                        : nothing}
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
            ${this.collapsed ? nothing : this.isEditing ? this.renderEditState() : this.renderViewState()}
        `;
    }
}

customElements.define('mas-bulk-publish-items', MasBulkPublishItems);
