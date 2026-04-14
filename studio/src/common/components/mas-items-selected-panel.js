import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-items-selected-panel.css.js';
import { getItemTypeLabel, getItemTitle } from '../utils/render-utils.js';

/**
 * Panel showing currently selected items with remove buttons.
 * Props-driven: receives items, emits events for removal.
 *
 * @fires remove-item - detail: { path: string, item: Object }
 *
 * @property {Array} items - Selected items to display
 * @property {boolean} visible - Whether the panel is visible
 * @property {boolean} disabled - Whether remove buttons are disabled
 */
class MasItemsSelectedPanel extends LitElement {
    static styles = styles;

    static properties = {
        items: { type: Array },
        visible: { type: Boolean },
        disabled: { type: Boolean },
    };

    constructor() {
        super();
        this.items = [];
        this.visible = false;
        this.disabled = false;
    }

    #removeItem(item) {
        this.dispatchEvent(
            new CustomEvent('remove-item', {
                detail: { path: item.path, item },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        if (!this.visible || !this.items.length) return nothing;

        return html`
            <ul class="selected-items" style="margin-left: 12px">
                ${repeat(
                    this.items,
                    (item) => item.path,
                    (item) => html`
                        <li class="item">
                            <h3 class="title">${getItemTitle(item)}</h3>
                            <div class="type">${getItemTypeLabel(item)}</div>
                            <sp-button
                                class="remove-button ghost-button"
                                variant="secondary"
                                size="l"
                                icon-only
                                @click=${() => this.#removeItem(item)}
                                ?disabled=${this.disabled}
                            >
                                <sp-icon-close slot="icon"></sp-icon-close>
                            </sp-button>
                        </li>
                    `,
                )}
            </ul>
        `;
    }
}

customElements.define('mas-items-selected-panel', MasItemsSelectedPanel);
