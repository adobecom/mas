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
            <sp-picker
                label="Select Locale"
                @change="${this.#handleChange}"
                value="${this.value}"
            >
                ${Store.locale.data.map(
                    (locale) => html`
                        <sp-menu-item value="${locale.code}">
                            <span class="flag">${locale.flag}</span>
                            ${locale.name}
                        </sp-menu-item>
                    `,
                )}
            </sp-picker>
        `;
    }

    get value() {
        return Store.locale.current.get();
    }

    #handleChange(event) {
        Store.locale.current.set(event.target.value);
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: this.value },
            }),
        );
    }
}

customElements.define('mas-locale-picker', MasLocalePicker);
