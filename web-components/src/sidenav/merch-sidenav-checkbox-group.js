import { html, LitElement, css } from 'lit';
import { deeplink, pushStateFromComponent } from '../deeplink.js';
import { createTag } from '../utils.js';

export class MerchSidenavCheckboxGroup extends LitElement {
    static properties = {
        sidenavCheckboxTitle: { type: String },
        label: { type: String },
        deeplink: { type: String },
        selectedValues: { type: Array, reflect: true },
        value: { type: String },
    };

    static styles = css`
        :host {
            display: block;
            contain: content;
            border-top: 1px solid var(--color-gray-200);
            padding: var(--merch-sidenav-checkbox-group-padding);
            margin-top: var(--merch-sidenav-checkbox-group-gap);
        }

        .checkbox-group {
            display: flex;
            flex-direction: column;
        }
    `;

    constructor() {
        super();
        this.selectedValues = [];
    }

    /**
     * leaf level item change handler
     * @param {*} event
     */
    selectionChanged({ target }) {
        const name = target.getAttribute('name');
        if (name) {
            const index = this.selectedValues.indexOf(name);
            if (target.checked && index === -1) {
                this.selectedValues.push(name);
            } else if (!target.checked && index >= 0) {
                this.selectedValues.splice(index, 1);
            }
        }
        pushStateFromComponent(this, this.selectedValues.join(','));
    }

    addGroupTitle() {
        const id = 'sidenav-checkbox-group-title';
        const h3El = createTag('h3', { id });
        h3El.textContent = this.sidenavCheckboxTitle;
        this.prepend(h3El);
        this.setAttribute('role', 'group');
        this.setAttribute('aria-labelledby', id);
    }

    startDeeplink() {
        this.stopDeeplink = deeplink((state) => {
            const raw = state[this.deeplink];
            const newValues = raw ? raw.split(',') : [];
            [...new Set([...newValues, ...this.selectedValues])].forEach(
                (name) => {
                    const checkbox = this.querySelector(
                        `sp-checkbox[name=${name}]`,
                    );
                    if (checkbox) checkbox.checked = newValues.includes(name);
                },
            );
            this.selectedValues = newValues;
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this.updateComplete.then(async () => {
            this.addGroupTitle();
            this.startDeeplink();
        });
    }

    disconnectedCallback() {
        this.stopDeeplink?.();
    }

    render() {
        return html`<div aria-label="${this.label}">
            <div
                @change="${(e) => this.selectionChanged(e)}"
                class="checkbox-group"
            >
                <slot></slot>
            </div>
        </div>`;
    }
}

customElements.define(
    'merch-sidenav-checkbox-group',
    MerchSidenavCheckboxGroup,
);
