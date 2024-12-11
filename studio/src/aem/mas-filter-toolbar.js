import { html, css, LitElement } from 'lit';
import '../editors/variant-picker.js';
import { pushState, deeplink } from '../deeplink.js';

class MasFilterToolbar extends LitElement {
    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        sp-picker {
            width: 100px;
        }

        sp-textfield {
            width: 200px;
        }

        sp-action-button {
            border: none;
            font-weight: bold;
        }

        sp-action-button:not(.filters-shown) {
            color: var(--spectrum-gray-700);
        }

        sp-action-button.filters-shown {
            background-color: var(--spectrum-blue-100);
            color: var(--spectrum-accent-color-1000);
        }

        sp-action-button.filters-shown:hover {
            background-color: var(--spectrum-blue-200);
        }

        .filters-badge {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--spectrum-accent-color-1000);
            color: var(--spectrum-white);
            border-radius: 2px;
        }

        sp-search {
            --spectrum-search-border-radius: 16px;
        }
    `;

    static properties = {
        searchText: { type: String, state: true, attribute: 'search-text' },
        variant: { type: String, state: true },
        filtersShown: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.searchText = '';
        this.variant = 'all';
        this.filtersShown = false;
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
            <sp-action-button
                toggles
                label="Filter"
                @click=${this.handleFilterClick}
                ?quiet=${!this.filtersShown}
                class="${this.filtersShown ? 'filters-shown' : ''}"
            >
                ${!this.filtersShown
                    ? html`<sp-icon-filter-add
                          slot="icon"
                      ></sp-icon-filter-add>`
                    : html`<div slot="icon" class="filters-badge">0</div>`}
                Filter</sp-action-button
            >
            <div>
                <sp-search
                    placeholder="Search"
                    @change="${this.handleSearch}"
                    @submit="${this.handleSearch}"
                    value=${this.searchText}
                    size="m"
                ></sp-search>
            </div>
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
        this.filtersShown = !this.filtersShown;
        this.dispatchEvent(
            new CustomEvent('toggle-filter-panel', {
                bubbles: true,
                composed: true,
            }),
        );
    }
}

customElements.define('mas-filter-toolbar', MasFilterToolbar);
