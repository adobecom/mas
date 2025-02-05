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
        const tags = [
            ...this.shadowRoot.querySelectorAll('aem-tag-picker-field'),
        ]
            .flatMap((tagPicker) => tagPicker.getAttribute('value').split(','))
            .filter((tag) => tag);
        Store.search.set({ ...Store.search.get(), tags });
    }

    render() {
        return html`
            <div id="filters-panel">
                ${this.filterIcon}
                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="offer_type"
                    label="Offer Type"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="plan_type"
                    label="Plan Type"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <mas-locale-picker></mas-locale-picker>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="market_segments"
                    label="Market Segments"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="customer_segment"
                    label="Customer Segment"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="status"
                    label="Status"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>
            </div>
        `;
    }

    get filterIcon() {
        // this is a copy of sp-icon-filter with outline style manually added
        return html`<sp-icon
            style="inline-size: 20px; block-size: 20px;  color: var(--spectrum-white);"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 36 36"
                role="img"
                fill="currentColor"
                height="20"
                width="20"
                aria-hidden="true"
                aria-label=""
            >
                <path
                    d="M30.946 2H3.054a1 1 0 0 0-.787 1.617L14 18.589V33.9a.992.992 0 0 0 1.68.824l3.981-4.153a1.219 1.219 0 0 0 .339-.843V18.589L31.733 3.617A1 1 0 0 0 30.946 2Z"
                    style="
    stroke: var(--spectrum-neutral-content-color-default);
    stroke-width: 3px;
"
                ></path></svg
        ></sp-icon>`;
    }
}

customElements.define('mas-filter-panel', MasFilterPanel);
