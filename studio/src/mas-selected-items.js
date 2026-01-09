import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';

class MasSelectedItems extends LitElement {
    static styles = styles;

    static properties = {
        allSelected: { type: Array },
    };

    /** @type {Array<{id: string, offer: string, path: string}>} */
    allSelected;

    constructor() {
        super();
        this.allSelected = [];
    }

    removeItem(itemId) {
        this.dispatchEvent(
            new CustomEvent('remove-item', {
                detail: { itemId },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`<ul class="selected-items">
            ${repeat(
                this.allSelected,
                (item) => item.id,
                (item) =>
                    html`<li class="file">
                        <h3 class="title">${item.offer}</h3>
                        <div class="details">Default fragment:</div>
                        <sp-button variant="secondary" size="l" icon-only @click=${() => this.removeItem(item.id)}>
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-button>
                    </li>`,
            )}
        </ul>`;
    }
}

customElements.define('mas-selected-items', MasSelectedItems);
