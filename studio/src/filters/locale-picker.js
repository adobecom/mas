import { html, css, LitElement } from 'lit';
import { LOCALES } from '../constants.js';

class MasLocalePicker extends LitElement {
    static get properties() {
        return {
            value: { type: String, reflect: true },
        };
    }

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
                ${LOCALES.map(
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

    #handleChange(event) {
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { value: event.target.value },
            }),
        );
    }
}

customElements.define('mas-locale-picker', MasLocalePicker);
