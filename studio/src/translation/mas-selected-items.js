import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';

class MasSelectedItems extends LitElement {
    static styles = styles;

    static properties = {
        selectedItems: { type: Array },
        type: { type: String },
    };

    getTitle(item) {
        if (this.type === 'fragments') {
            return item.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || '-';
        }
    }

    getDescription(item) {
        if (this.type === 'fragments') {
            return item?.title || '-';
        }
    }

    removeItem(itemId) {
        this.dispatchEvent(
            new CustomEvent('remove-item', {
                detail: { itemId, type: this.type },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`<ul class="selected-items">
            ${repeat(
                this.selectedItems,
                (item) => item.id,
                (item) =>
                    html`<li class="file">
                        <h3 class="title">${this.getTitle(item)}</h3>
                        <div class="details">${this.getDescription(item)}</div>
                        <sp-button variant="secondary" size="l" icon-only @click=${() => this.removeItem(item.id)}>
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-button>
                    </li>`,
            )}
        </ul>`;
    }
}

customElements.define('mas-selected-items', MasSelectedItems);
