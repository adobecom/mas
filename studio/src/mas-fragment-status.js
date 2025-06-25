import { html, css, LitElement } from 'lit';
import { toPascalCase } from './utils.js';

class MasFragmentStatus extends LitElement {
    static styles = css`
        :host {
            display: flex;
            align-items: center;
            color: var(--mas-status-accent-color);
            background-color: var(--mas-status-background-color);
            border: 1px solid var(--mas-status-accent-color);
            border-radius: 12px;
            padding-block: 3px;
            padding-inline: 6px;
            gap: 6px;
            font-size: 12px;
            user-select: none;
            cursor: pointer;
        }

        :host(:hover) {
            background-color: var(--mas-status-hover-color);
        }

        :host([variant='draft']) {
            --mas-status-background-color: rgba(var(--spectrum-blue-100-rgb), 0.4);
            --mas-status-hover-color: var(--spectrum-blue-100);
            --mas-status-accent-color: var(--spectrum-blue-800);
        }

        :host([variant='modified']) {
            --mas-status-background-color: rgba(var(--spectrum-yellow-100-rgb), 0.4);
            --mas-status-hover-color: var(--spectrum-yellow-100);
            --mas-status-accent-color: var(--spectrum-yellow-600);
        }

        :host([variant='published']) {
            --mas-status-background-color: rgba(var(--spectrum-green-100-rgb), 0.4);
            --mas-status-hover-color: var(--spectrum-green-100);
            --mas-status-accent-color: var(--spectrum-green-700);
        }

        sp-status-light {
            min-block-size: initial;
            padding: 0;
            --spectrum-statuslight-spacing-top-to-dot: 0;
            --spectrum-statuslight-spacing-top-to-label: 0;
            --spectrum-statuslight-spacing-dot-to-label: 0;
        }
    `;

    static properties = {
        variant: { type: String, attribute: true },
    };

    get label() {
        return toPascalCase(this.variant);
    }

    get lightVariant() {
        switch (this.variant) {
            case 'published':
                return 'positive';
            case 'modified':
                return 'yellow';
            default:
                return 'info';
        }
    }

    render() {
        return html`<sp-status-light size="l" variant="${this.lightVariant}"></sp-status-light> ${this.label}`;
    }
}

customElements.define('mas-fragment-status', MasFragmentStatus);
