import { html, css, LitElement } from 'lit';
import Store from '../store.js';

class MasFilterPanel extends LitElement {
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

    #handleTagChange() {
        Store.search.set({ ...Store.search.get(), tags: this.tags });
    }

    #handleLocaleChange(event) {
        Store.locale.current.set(event.target.value);
    }

    get tags() {
        return [...this.shadowRoot.querySelectorAll('aem-tag-picker-field')]
            .map((p) => p.value?.[0])
            .filter((v) => v);
    }

    render() {
        return html`
            <div id="filters-panel">
                <span id="filters-label">Filters</span>
                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="product"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="customer_segment"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="offer_type"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="plan_type"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="market_segments"
                    selection="checkbox"
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
