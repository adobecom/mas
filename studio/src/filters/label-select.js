import { html, css, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

class MasLabelSelect extends LitElement {
    static properties = {
        value: { type: String, reflect: true },
        options: { type: Array },
        open: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            position: relative;
        }

        #label {
            font-weight: bold;
            cursor: pointer;
        }

        #label:hover {
            text-decoration: underline;
        }

        sp-popover {
            z-index: 1;
            position: absolute;
            top: calc(100% + 10px);
            left: 0;
            max-height: unset;
        }

        sp-menu-item {
            white-space: nowrap;
        }
    `;

    constructor() {
        super();
        this.value = null;
        this.options = [];
        this.open = false;
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('click', this.handleOutsideClick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('click', this.handleOutsideClick);
    }

    handleOutsideClick(event) {
        if (!event.composedPath().includes(this)) this.open = false;
    }

    get selectedLabel() {
        return this.options.find((o) => o.value === this.value)?.label;
    }

    toggleMenu() {
        this.open = !this.open;
    }

    handleSelection(event) {
        event.stopPropagation();
        const value = event.target.value;
        this.dispatchEvent(new CustomEvent('change', { detail: value }));
        this.open = false;
    }

    render() {
        console.log('huuh??', this.open);
        return html`<div>
            <span id="label" @click=${this.toggleMenu}>${this.selectedLabel}</span>
            <sp-popover id="label-select-popover" ?open=${this.open}>
                <sp-menu @change=${this.handleSelection}>
                    ${repeat(
                        this.options,
                        (option) => option.value,
                        (option) => html`<sp-menu-item value=${option.value}>${option.label}</sp-menu-item>`,
                    )}
                </sp-menu>
            </sp-popover>
        </div>`;
    }
}

customElements.define('mas-label-select', MasLabelSelect);
