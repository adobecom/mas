import { html, css, LitElement } from 'lit';
import '../editors/variant-picker.js';
import { pushState, deeplink } from '../deeplink.js';

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
        searchText: { type: String, state: true, attribute: 'search-text' },
        variant: { type: String, state: true },
    };

    constructor() {
        super();
        this.searchText = '';
        this.variant = 'all';
    }

    connectedCallback() {
        super.connectedCallback();
        this.deeplinkDisposer = deeplink(({ query }) => {
            this.searchText = query;
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.deeplinkDisposer();
    }

    render() {
        return html`
            <sp-button
                label="Filter"
                variant="secondary"
                @click=${this.handleFilterClick}
                >Filter</sp-button
            >
            <sp-picker label="Sort" disabled>
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
                    disabled
                    @change="${this.handleVariantChange}"
                ></variant-picker>
            </div>
            <sp-button @click=${this.doSearch}>Search</sp-button>
        `;
    }

    handleSearch(e) {
        e.preventDefault();
        this.searchText = e.target.value;
        pushState({ query: this.searchText });
    }

    handleVariantChange(e) {
        this.variant = e.target.value;
        pushState({ variant: this.variant });
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
