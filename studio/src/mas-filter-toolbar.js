import { html, css, LitElement } from 'lit';
import './editors/variant-picker.js';

class MasFilterToolbar extends LitElement {
    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 10px;
            align-self: flex-end;
        }
        sp-picker {
            width: 100px;
        }
        sp-textfield {
            width: 200px;
        }
    `;

    static properties = {
        searchText: { type: String, state: true },
        variant: { type: String, state: true },
    };

    constructor() {
        super();
        this.searchText = '';
        this.variant = 'all';
    }

    render() {
        return html`
            <sp-button
                label="Filter"
                variant="secondary"
                @click=${this.handleFilterClick}
                >Filter</sp-button
            >
            <sp-picker label="Sort">
                <sp-menu-item>Ascending</sp-menu-item>
                <sp-menu-item>Descending</sp-menu-item>
            </sp-picker>
            <div>
                <sp-search
                    placeholder="Search"
                    @change="${this.handleSearch}"
                    @submit="${this.handleSearch}"
                    value=${this.searchText}
                    size="m"
                ></sp-search>
                <variant-picker
                    id="vpick"
                    show-all="true"
                    default-value="${this.variant}"
                    @change="${this.handleVariantChange}"
                ></variant-picker>
                <sp-button @click=${this.doSearch}>Search</sp-button>
            </div>
        `;
    }

    handleSearch(e) {
        this.searchText = e.target.value;
        this.dispatchEvent(
            new CustomEvent('search-text-changed', {
                detail: { searchText: this.searchText },
                bubbles: true,
                composed: true,
            }),
        );
        if (!this.searchText) {
            this.dispatchEvent(
                new CustomEvent('clear-search', {
                    bubbles: true,
                    composed: true,
                }),
            );
        }
        if (e.type === 'submit') {
            e.preventDefault();
            this.dispatchEvent(
                new CustomEvent('search-fragments', {
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    handleVariantChange(e) {
        this.variant = e.target.value;
        this.dispatchEvent(
            new CustomEvent('variant-changed', {
                detail: { variant: this.variant },
                bubbles: true,
                composed: true,
            }),
        );
    }

    doSearch() {
        this.dispatchEvent(
            new CustomEvent('search-fragments', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleFilterClick() {
        this.dispatchEvent(
            new CustomEvent('toggle-filter-panel', {
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('mas-filter-toolbar', MasFilterToolbar);
