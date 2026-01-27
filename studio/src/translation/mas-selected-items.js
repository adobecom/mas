import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasSelectedItems extends LitElement {
    static styles = styles;

    constructor() {
        super();
        this.showSelectedStoreController = new ReactiveController(this, [
            Store.translationProjects.showSelected,
            Store.translationProjects.fragments,
            Store.translationProjects.collections,
            Store.translationProjects.placeholders,
        ]);
    }

    get selectedItems() {
        const fragments = Store.translationProjects.fragments.value.map((path) => {
            return { ...Store.translationProjects.fragmentsByPaths.value.get(path), type: 'fragment' };
        });
        // const collectionss = Store.translationProjects.collections.map((path) => {
        //     return { ...Store.translationProjects.collectionsByPath.value.get(path), type: 'collection' };
        // });
        const placeholders = Store.translationProjects.placeholders.value.map((path) => {
            return { ...Store.translationProjects.placeholdersByPaths.value.get(path), type: 'placeholder' };
        });
        return [...fragments, /*...collectionss,*/ ...placeholders];
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    getTitle(item) {
        if (!item) return '-';
        return item.title || '-';
    }

    getDetails(item) {
        if (!item) return '-';
        if (item.type === 'fragment') {
            return item.studioPath || '-';
        }
        if (item.type === 'placeholder') {
            return item.description || '-';
        }
        return '-';
    }

    removeItem(path) {
        this.dispatchEvent(
            new CustomEvent('remove', {
                detail: { path },
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
