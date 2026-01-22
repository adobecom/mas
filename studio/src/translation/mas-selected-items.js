import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import NestedStoreController from '../reactivity/nested-store-controller.js';

class MasSelectedItems extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String, state: true },
    };

    constructor() {
        super();
        this.translationProjectStoreController = new NestedStoreController(this, Store.translationProjects.inEdit);
        this.showSelectedStoreController = new StoreController(this, Store.translationProjects.showSelected);
    }

    get selectedItems() {
        const translationProject = this.translationProjectStoreController.value;
        if (this.type === 'fragments') {
            return (
                translationProject?.fields
                    ?.find((field) => field.name === 'items')
                    ?.values?.map((id) => Store.translationProjects.fragmentsByIds.value.get(id)) || []
            );
        }
        return [];
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    getTitle(item) {
        if (!item) return '-';
        if (this.type === 'fragments') {
            return item.title || '-';
        }
        return '-';
    }

    getDetails(item) {
        if (!item) return '-';
        if (this.type === 'fragments') {
            return item.studioPath || '-';
        }
        return '-';
    }

    removeItem(id) {
        this.dispatchEvent(
            new CustomEvent('remove', {
                detail: { id },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`${this.showSelected && this.selectedItems.length > 0
            ? html`<ul class="selected-items">
                  ${repeat(
                      this.selectedItems,
                      (item) => item?.id,
                      (item) =>
                          html`<li class="file">
                              <h3 class="title">${this.getTitle(item)}</h3>
                              <div class="details">${this.getDetails(item)}</div>
                              <sp-button variant="secondary" size="l" icon-only @click=${() => this.removeItem(item?.id)}>
                                  <sp-icon-close slot="icon"></sp-icon-close>
                              </sp-button>
                          </li>`,
                  )}
              </ul>`
            : nothing} `;
    }
}

customElements.define('mas-selected-items', MasSelectedItems);
