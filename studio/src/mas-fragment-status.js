import { html, css, LitElement, nothing } from 'lit';
import { toPascalCase } from './utils.js';

class MasFragmentStatus extends LitElement {
    static properties = {
        variant: { type: String, attribute: true, reflect: true },
    };

    get label() {
        return toPascalCase(this.variant);
    }

    get badgeVariant() {
        switch (this.variant) {
            case 'published':
                return 'positive';
            case 'modified':
                return 'yellow';
            case 'draft':
                return 'informative';
            default:
                return '';
        }
    }

    render() {
        if (!this.variant) return nothing;
        return html`<sp-badge size="s" variant="${this.badgeVariant}"
            >${this.label}</sp-badge
        >`;
    }
}

customElements.define('mas-fragment-status', MasFragmentStatus);
