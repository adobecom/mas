import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/search/sp-search.js';
import '@spectrum-web-components/badge/sp-badge.js';
import { SearchController } from '../controllers/search-controller.js';

const TYPE_LABELS = {
    product: 'Product',
    offer: 'Offer ID',
    osi: 'OSI',
};

export class MasOstSearch extends LitElement {
    static properties = {};

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .search-wrapper {
            display: flex;
            flex-direction: column;
            gap: var(--spectrum-spacing-100, 8px);
            padding: 4px 0;
        }

        sp-search {
            width: 100%;
            --mod-textfield-border-radius: 999px;
            --mod-textfield-focus-indicator-border-radius: 999px;
            --mod-textfield-background-color: var(--spectrum-gray-100);
            --mod-textfield-border-color: var(--spectrum-gray-300);
            --mod-textfield-height: 40px;
            --mod-textfield-font-size: 14px;
        }

        .type-badge {
            align-self: flex-start;
        }
    `;

    constructor() {
        super();
        this.search = new SearchController(this);
    }

    handleInput(event) {
        this.search.handleInput(event.target.value);
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    render() {
        const label = this.search.query
            ? TYPE_LABELS[this.search.resultType]
            : '';
        return html`
            <div class="search-wrapper">
                <sp-search
                    placeholder="Search by name, code, offer ID, or OSI"
                    size="s"
                    @input=${this.handleInput}
                    @submit=${this.handleSubmit}
                ></sp-search>
                ${label
                    ? html`<sp-badge
                          class="type-badge"
                          size="s"
                          variant="informative"
                          >${label}</sp-badge
                      >`
                    : ''}
            </div>
        `;
    }
}

customElements.define('mas-ost-search', MasOstSearch);
