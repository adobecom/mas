import { BaseElement, html, on } from './base-element.js';
import { styles } from './merch-mnemonic-list.css.js';

export class MerchMnemonicList extends BaseElement {
    static styles = styles;

    static properties = {
        description: { type: String, attribute: true },
    };

    constructor() {
        super();
    }

    #hideDecorativeIcons() {
        const text = this.querySelector(
            '[slot="description"]',
        )?.textContent.trim();
        if (!text) return;
        this.querySelectorAll('merch-icon').forEach((icon) => {
            icon.alt = '';
        });
    }

    render() {
        return html`
            <slot name="icon"></slot>
            <slot name="description">${this.description}</slot>
        `;
    }

    bindEvents() {
        on(
            this.shadowRoot.querySelector('slot[name="icon"]'),
            'slotchange',
            () => this.#hideDecorativeIcons(),
        );
    }
}

customElements.define('merch-mnemonic-list', MerchMnemonicList);
