import { css, html, LitElement } from 'lit';
import { EVENT_CHANGE, EVENT_INPUT } from '../events.js';

class MnemonicField extends LitElement {
    static get properties() {
        return {
            icon: { type: String, reflect: true },
            alt: { type: String, reflect: true },
            link: { type: String, reflect: true },
        };
    }

    get iconElement() {
        return this.shadowRoot.getElementById('icon');
    }

    get altElement() {
        return this.shadowRoot.getElementById('alt');
    }

    get linkElement() {
        return this.shadowRoot.getElementById('link');
    }

    connectedCallback() {
        super.connectedCallback();
        this.shadowRoot.addEventListener(EVENT_CHANGE, this.handleChange);
        this.shadowRoot.addEventListener(EVENT_INPUT, this.handleInput);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.shadowRoot.removeEventListener(EVENT_CHANGE, this.handleChange);
        this.shadowRoot.removeEventListener(EVENT_INPUT, this.handleInput);
    }

    handleChange(event) {
        if (event.target === this) return;
        this[event.target.id] = event.target.value ?? '';
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent(EVENT_CHANGE, {
                bubbles: true,
                composed: true,
                detail: this,
            }),
        );
    }

    handleInput(event) {
        if (event.target === this) return;
        this[event.target.id] = event.target.value ?? '';
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent(EVENT_INPUT, {
                bubbles: true,
                composed: true,
                detail: this,
            }),
        );
    }

    get value() {
        return {
            icon: this.icon ?? '',
            alt: this.alt ?? '',
            link: this.link ?? '',
        };
    }

    render() {
        return html` <sp-field-label required for="icon"
                >Icon URL</sp-field-label
            >
            <sp-textfield
                id="icon"
                required
                placeholder="Enter icon URL"
                value="${this.icon}"
                @change="${this.handleChange}"
                @input="${this.handleInput}"
            ></sp-textfield>
            <sp-field-label for="alt">Alt text</sp-field-label>
            <sp-textfield
                id="alt"
                placeholder="enter alt text"
                value="${this.alt}"
                @change="${this.handleChange}"
                @input="${this.handleInput}"
            ></sp-textfield>
            <sp-field-label for="link">Link</sp-field-label>
            <sp-textfield
                id="link"
                placeholder="Enter target link"
                value="${this.link}"
                @change="${this.handleChange}"
                @input="${this.handleInput}"
            ></sp-textfield>`;
    }

    static styles = css`
        sp-textfield {
            width: 100%;
        }
    `;
}

customElements.define('mas-mnemonic-field', MnemonicField);
