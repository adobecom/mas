import { BaseElement, html, on } from '../merch-card.js';
import { deeplink, pushStateFromComponent } from '../deeplink.js';
import { createTag } from '../utils.js';
import { styles } from './merch-sidenav-checkbox-group.css.js';

export class MerchSidenavCheckboxGroup extends BaseElement {
    static properties = {
        sidenavCheckboxTitle: { type: String },
        label: { type: String },
        deeplink: { type: String },
        selectedValues: { type: Array, reflect: true },
        value: { type: String },
    };

    static styles = styles;

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
            <div class="checkbox-group">
                <slot></slot>
            </div>
        </div>`;
    }

    bindEvents() {
        on(
            this.shadowRoot.querySelector('.checkbox-group'),
            'change',
            (event) => this.selectionChanged(event),
        );
    }
}

customElements.define(
    'merch-sidenav-checkbox-group',
    MerchSidenavCheckboxGroup,
);
