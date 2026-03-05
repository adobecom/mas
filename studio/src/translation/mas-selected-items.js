import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { Fragment } from '../aem/fragment.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../constants.js';
import { fetchUnresolvedVariations } from './translation-items-loader.js';

class MasSelectedItems extends LitElement {
    static styles = styles;

    #lastFetchedSelectedCardsKey = null;

    constructor() {
        super();
        this.storeController = new ReactiveController(this, [
            Store.translationProjects.showSelected,
            Store.translationProjects.selectedCards,
            Store.translationProjects.selectedCollections,
            Store.translationProjects.selectedPlaceholders,
            Store.translationProjects.groupedVariationsByParent,
            Store.fragments.list.loading,
            Store.placeholders.list.loading,
        ]);
        this.fetchController = new ReactiveController(
            this,
            [Store.translationProjects.showSelected, Store.translationProjects.selectedCards],
            this.maybeFetchUnresolvedVariations.bind(this),
        );
    }

    /** If grouped variations for selected cards are not in the Store yet, we fetch,
     * add studioPath, offerData, and save them in the Store */
    maybeFetchUnresolvedVariations() {
        if (!this.showSelected || !this.repository) return;

        const selectedCards = Store.translationProjects.selectedCards.value || [];
        const selectedCardsKey = [...selectedCards].sort().join('\0');
        if (selectedCardsKey === this.#lastFetchedSelectedCardsKey) return;

        this.#lastFetchedSelectedCardsKey = selectedCardsKey;
        fetchUnresolvedVariations(
            selectedCards,
            Store.translationProjects.cardsByPaths.value,
            Store.translationProjects.groupedVariationsByParent.value,
            this.repository,
        );
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get selectedItems() {
        const cards = Store.translationProjects.selectedCards.value
            ?.map(
                (path) =>
                    Store.translationProjects.cardsByPaths.value?.get(path) ??
                    Store.translationProjects.groupedVariationsData.value?.get(path),
            )
            .filter(Boolean);
        const collections = Store.translationProjects.selectedCollections.value
            ?.map((path) => {
                return Store.translationProjects.collectionsByPaths.value.get(path);
            })
            .filter(Boolean);
        const placeholders = Store.translationProjects.selectedPlaceholders.value
            ?.map((path) => {
                return Store.translationProjects.placeholdersByPaths.value.get(path);
            })
            .filter(Boolean);
        return [...cards, ...collections, ...placeholders];
    }

    get showSelected() {
        return Store.translationProjects.showSelected.value;
    }

    get isLoadingItems() {
        return Store.fragments.list.loading.get() || Store.placeholders.list.loading.get();
    }

    getType(item) {
        if (!item) return 'Unknown type';
        switch (item.model.path) {
            case CARD_MODEL_PATH:
                return Fragment.isGroupedVariationPath(item.path) ? 'Grouped variation' : 'Default card';
            case COLLECTION_MODEL_PATH:
                return 'Collection';
            default:
                return 'Placeholder';
        }
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

    removeItem(item) {
        if (!item) return;
        let type;
        switch (item.model.path) {
            case CARD_MODEL_PATH:
                type = 'Cards';
                break;
            case COLLECTION_MODEL_PATH:
                type = 'Collections';
                break;
            default:
                type = 'Placeholders';
                break;
        }
        Store.translationProjects[`selected${type}`].set(
            Store.translationProjects[`selected${type}`].value?.filter((selectedPath) => selectedPath !== item.path),
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
                          html`<li class="item">
                              <h3 class="title">${this.getTitle(item)}</h3>
                              <div class="type">${this.getType(item)}</div>
                              <sp-button
                                  class="remove-button ghost-button"
                                  variant="secondary"
                                  size="l"
                                  icon-only
                                  @click=${() => this.removeItem(item)}
                                  ?disabled=${this.isLoadingItems}
                              >
                                  <sp-icon-close slot="icon"></sp-icon-close>
                              </sp-button>
                          </li>`,
                  )}
              </ul>`
            : nothing} `;
    }
}

customElements.define('mas-selected-items', MasSelectedItems);
