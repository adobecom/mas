import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';

class MasSelectedItems extends LitElement {
    static styles = styles;

    static properties = {
        type: { type: String },
    };

    constructor() {
        super();
        this.selectedStoreController = new StoreController(this, Store.translationProjects.selected);
        this.showSelectedStoreController = new StoreController(this, Store.translationProjects.showSelected);
    }

    get selectedItems() {
        return Array.from(Store.translationProjects.selected.value).map((path) =>
            Store.translationProjects.fragmentsByPaths.value.get(path),
        );
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    getTitle(item) {
        if (this.type === 'fragments') {
            return item.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title || '-';
        }
        return '-';
    }

    getDetails(item) {
        if (this.type === 'fragments') {
            return item?.getFieldValues('title') || '-';
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
                      (item) => item.path,
                      (item) =>
                          html`<li class="file">
                              <h3 class="title">${this.getTitle(item)}</h3>
                              <div class="details">${this.getDetails(item)}</div>
                              <sp-button variant="secondary" size="l" icon-only @click=${() => this.removeItem(item.path)}>
                                  <sp-icon-close slot="icon"></sp-icon-close>
                              </sp-button>
                          </li>`,
                  )}
              </ul>`
            : nothing} `;
    }
}

customElements.define('mas-selected-items', MasSelectedItems);
