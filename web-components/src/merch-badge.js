import { LitElement, html, css, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

const renderIcon = iconName => {
    if (!iconName) return nothing;
    if (iconName.startsWith('sp-icon-')) return html`${unsafeHTML(`<${iconName} class="badge-icon"></${iconName}>`)}`;
    return html`<img src="${iconName}" class="badge-icon">`;
};
export default class MerchBadge extends LitElement {
    static properties = {
        color: { type: String },
        variant: { type: String },
        backgroundColor: { type: String, attribute: 'background-color' },
        borderColor: { type: String, attribute: 'border-color' },
        icon: { type: String },
    };

    constructor() {
        super();
        this.color = '';
        this.variant = '';
        this.backgroundColor = '';
        this.borderColor = '';
        this.text = this.textContent;
        this.icon = '';
    }

    connectedCallback() {
        if (this.borderColor && this.borderColor !== 'Transparent') {
            this.style.setProperty(
                '--merch-badge-border',
                `1px solid var(--${this.borderColor})`,
            );
        } else {
            this.style.setProperty(
                '--merch-badge-border',
                `1px solid var(--${this.backgroundColor})`,
            );
        }
        this.style.setProperty(
            '--merch-badge-background-color',
            `var(--${this.backgroundColor})`,
        );
        this.style.setProperty('--merch-badge-color', this.color);
        this.style.setProperty('--merch-badge-padding', '2px 10px 3px 10px');
        this.style.setProperty('--merch-badge-border-radius', '4px 0 0 4px');
        this.style.setProperty(
            '--merch-badge-font-size',
            'var(--consonant-merch-card-body-xs-font-size)',
        );
        this.textContent = '';

        const card = this.closest('merch-card');
        const size = card?.getAttribute('size');
        const offset =
            card?.querySelectorAll(':scope > merch-icon').length || 0;
        this.style.setProperty('--merch-badge-offset', offset);
        this.style.setProperty('--merch-badge-with-offset', offset ? 1 : 0);
        this.style.setProperty('--merch-badge-card-size', size ? 2 : 1);

        super.connectedCallback();
    }

    render() {
        return html`<div class="badge">${renderIcon(this.icon)}${this.text}</div>`;
    }

    static styles = css`
        :host {
            display: block;
            background-color: var(--merch-badge-background-color);
            color: var(--merch-badge-color, #000);
            padding: var(--merch-badge-padding);
            border-radius: var(--merch-badge-border-radius);
            font-size: var(--merch-badge-font-size);
            line-height: 21px;
            border: var(--merch-badge-border);
            position: relative;
            left: 1px;
        }

        :host .badge-icon {
            margin-right: 5px;
            position: relative;
            top: 3px;
            height: 18px;
            width: 18px;
        }
    `;
}

customElements.define('merch-badge', MerchBadge);
