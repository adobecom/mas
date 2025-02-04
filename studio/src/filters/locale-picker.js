import { html, css, LitElement } from 'lit';
import Store from '../store.js';

class MasLocalePicker extends LitElement {
    static styles = css`
        sp-picker {
            width: 200px;
        }
        .flag {
            margin-right: 8px;
        }
    `;

    render() {
        return html`
            <sp-combobox
                label="Select Locale"
                @change="${this.#handleChange}"
                value="${this.value}"
            >
                ${Store.locale.data.map(
                    (locale) => html`
                        <sp-menu-item value="${locale.code}">
                            <span slot="icon" class="flag"
                                >YWES ${locale.flag}</span
                            >
                            <sp-icon-add slot="icon"></sp-icon-add>
                            ${locale.name}
                        </sp-menu-item>
                    `,
                )}
            </sp-combobox>
        `;
    }

    get value() {
        return Store.locale.current.get();
    }

    #handleChange() {
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: this.value },
            }),
        );
    }
}

customElements.define('mas-locale-picker', MasLocalePicker);
