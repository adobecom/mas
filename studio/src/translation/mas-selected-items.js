import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../constants.js';

class MasSelectedItems extends LitElement {
    static styles = styles;

    constructor() {
        super();
        this.showSelectedStoreController = new ReactiveController(this, [
            Store.translationProjects.showSelected,
            Store.translationProjects.selectedCards,
            Store.translationProjects.selectedCollections,
            Store.translationProjects.selectedPlaceholders,
        ]);
    }

    get selectedItems() {
        const cards = Store.translationProjects.selectedCards.value.map((path) => {
            return Store.translationProjects.cardsByPaths.value.get(path);
        });
        const collections = Store.translationProjects.selectedCollections.value.map((path) => {
            return Store.translationProjects.collectionsByPaths.value.get(path);
        });
        const placeholders = Store.translationProjects.selectedPlaceholders.value.map((path) => {
            return Store.translationProjects.placeholdersByPaths.value.get(path);
        });
        return [...cards, ...collections, ...placeholders];
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    getTitle(item) {
        if (!item) return '-';
        switch (item.model.path) {
            case CARD_MODEL_PATH:
                return (item.title?.length > 54 ? `${item.title.slice(0, 54)}...` : item.title) || '-';
            case COLLECTION_MODEL_PATH:
                return (item.title?.length > 54 ? `${item.title.slice(0, 54)}...` : item.title) || '-';
            default:
                return item.getFieldValue('key') || '-';
        }
    }

    getDetails(item) {
        if (!item) return '-';
        switch (item.model.path) {
            case CARD_MODEL_PATH:
                return item.studioPath || '-';
            case COLLECTION_MODEL_PATH:
                return item.studioPath || '-';
            default:
                return (
                    (item.getFieldValue('value')?.length > 60
                        ? `${item.getFieldValue('value').slice(0, 60)}...`
                        : item.getFieldValue('value')) || '-'
                );
        }
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
            ? html`<ul
                  class="selected-items"
                  style="margin-left: ${this.showSelected && this.selectedItems.length > 0 ? '12px' : '0'}"
              >
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
