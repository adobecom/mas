import { html, css, LitElement } from 'lit';
import Store from '../store.js';

class MasFilterPanel extends LitElement {
    static properties = {
        tags: { type: String },
    };

    constructor() {
        super();
        this.tags = '';
    }

    static styles = css`
        :host {
            display: flex;
        }

        #filters-panel {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;

            & aem-tag-picker-field,
            sp-picker {
                width: 150px;
            }
        }

        #filters-label {
            color: var(--spectrum-gray-600);
        }
    `;

    connectedCallback() {
        super.connectedCallback();
        this.tags = Store.search.get().tags || '';
    }

    #handleTagChange(event) {
        this.tags = event.target.value;
        Store.search.set({ ...Store.search.get(), tags: this.tags });
    }

    #handleLocaleChange(event) {
        Store.locale.current.set(event.target.value);
    }

    render() {
        return html`
            <div id="filters-panel">
                <sp-icon-filter size="s"></sp-icon-filter>
                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="product"
                    selection="checkbox"
                    .value=${this.tags}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="customer_segment"
                    selection="checkbox"
                    .value=${this.tags}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="offer_type"
                    selection="checkbox"
                    .value=${this.tags}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="plan_type"
                    selection="checkbox"
                    .value=${this.tags}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="market_segments"
                    selection="checkbox"
                    .value=${this.tags}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <mas-locale-picker
                    @change=${this.#handleLocaleChange}
                ></mas-locale-picker>
            </div>
        `;
    }
}

customElements.define('mas-filter-panel', MasFilterPanel);
