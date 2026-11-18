import { html, LitElement, unsafeCSS } from 'lit';
import { styles } from './merch-mnemonic-list.css.js';

export class MerchMnemonicList extends LitElement {
    static styles = unsafeCSS(styles);

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
            <slot name="icon" @slotchange=${this.#hideDecorativeIcons}></slot>
            <slot name="description">${this.description}</slot>
        `;
    }
}

customElements.define('merch-mnemonic-list', MerchMnemonicList);
