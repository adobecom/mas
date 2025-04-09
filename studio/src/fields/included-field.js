import { css, html, LitElement } from 'lit';
import { EVENT_CHANGE, EVENT_INPUT } from '../constants.js';

class IncludedField extends LitElement {
    static get properties() {
        return {
            icon: { type: String, reflect: true },
            text: { type: String, reflect: true },
        };
    }

    get iconElement() {
        return this.shadowRoot.getElementById('icon');
    }

    get textElement() {
        return this.shadowRoot.getElementById('text');
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
            text: this.text ?? '',
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
            <sp-field-label for="text">Text</sp-field-label>
            <sp-textfield
                id="text"
                placeholder="Enter text"
                value="${this.text}"
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

customElements.define('mas-included-field', IncludedField);
