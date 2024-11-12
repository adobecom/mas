import { html, css, LitElement } from 'lit';

class MasFilterPanel extends LitElement {
    static properties = {
        source: { type: String },
    };
    static styles = css`
        :host {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 10px;
            align-self: flex-end;
        }
        sp-picker {
            width: 150px;
        }
    `;

    #source;

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.#source = document.getElementById(this.source);
    }

    handeFilterChange(event) {
        this.#source.setAttribute('tags', event.target.getAttribute('value'));
    }

    render() {
        return html`
            <aem-tag-picker-field
                label="Select filters"
                namespace="/content/cq:tags/mas"
                multiple
                @change=${this.handeFilterChange}
            ></aem-tag-picker-field>
        `;
    }
}

customElements.define('mas-filter-panel', MasFilterPanel);
