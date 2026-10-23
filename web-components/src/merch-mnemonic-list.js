import { escapeHTML } from './utils.js';
import { css } from './css.js';

export class MerchMnemonicList extends HTMLElement {
    static styles = css`
        :host {
            display: flex;
            flex-wrap: nowrap;
            gap: 8px;
            margin-right: 16px;
            align-items: center;
        }

        ::slotted([slot='icon']) {
            display: flex;
            justify-content: center;
            align-items: center;
            height: max-content;
        }

        ::slotted([slot='description']) {
            font-size: 14px;
            line-height: 21px;
            margin: 0;
        }

        :host .hidden {
            display: none;
        }
    `;

    static observedAttributes = ['description'];

    #markup;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [sheet];
    }

    get description() {
        return this.getAttribute('description') ?? undefined;
    }

    set description(value) {
        if (value == null) this.removeAttribute('description');
        else this.setAttribute('description', value);
    }

    connectedCallback() {
        if (Object.hasOwn(this, 'description')) {
            const { description } = this;
            delete this.description;
            this.description = description;
        }
        this.#render();
    }

    attributeChangedCallback(name, oldValue, value) {
        if (oldValue === value || !this.isConnected) return;
        this.#render();
    }

    #render() {
        const markup = `<slot name="icon"></slot><slot name="description">${escapeHTML(this.description)}</slot>`;
        if (markup === this.#markup) return;
        this.#markup = markup;
        this.shadowRoot.innerHTML = markup;
    }
}

const sheet = new CSSStyleSheet();
sheet.replaceSync(MerchMnemonicList.styles);

customElements.define('merch-mnemonic-list', MerchMnemonicList);
