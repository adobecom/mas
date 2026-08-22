import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import ItemsSelectionController from '../../reactivity/items-selection-controller.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../constants.js';
import { getItemTypeLabel } from '../utils/render-utils.js';
import { fetchUnresolvedVariations } from '../utils/items-loader.js';
import { noItemsSelectedIcon } from '../../icons.js';
import { Fragment } from '../../aem/fragment.js';

class MasSelectedItems extends LitElement {
    static styles = styles;
    static properties = {
        getDisplayName: { type: Function },
        loading: { type: Boolean },
        hideGroupedVariations: { type: Boolean },
    };

    #lastFetchedSelectedCardsKey = null;
    itemsSelection = new ItemsSelectionController(this);
    storeController = null;
    fetchController = null;

    constructor() {
        super();
        this.getDisplayName = (fragmentData) => fragmentData?.path ?? '';
        this.loading = false;
        this.hideGroupedVariations = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.#registerStores();
    }

    #registerStores() {
        const store = this.itemsSelection.value;
        const stores = [
            store.showSelected,
            store.selectedCards,
            store.selectedCollections,
            store.selectedPlaceholders,
            store.groupedVariationsByParent,
            store.cardsByPaths,
            store.groupedVariationsData,
            store.collectionsByPaths,
            store.placeholdersByPaths,
        ];
        if (this.storeController) {
            this.storeController.updateStores(stores);
        } else {
            this.storeController = new ReactiveController(this, stores);
        }
        const fetchStores = [store.showSelected, store.selectedCards];
        if (this.fetchController) {
            this.fetchController.updateStores(fetchStores);
        } else {
            this.fetchController = new ReactiveController(this, fetchStores, this.maybeFetchUnresolvedVariations.bind(this));
        }
    }

    /** If grouped variations for selected cards are not in the Store yet, we fetch,
     * add studioPath, offerData, and save them in the Store */
    maybeFetchUnresolvedVariations() {
        if (!this.showSelected || !this.repository) return;

        const store = this.itemsSelection.value;
        const selectedCards = store.selectedCards.value || [];
        const selectedCardsKey = [...selectedCards].sort().join('\0');
        if (selectedCardsKey === this.#lastFetchedSelectedCardsKey) return;

        this.#lastFetchedSelectedCardsKey = selectedCardsKey;
        fetchUnresolvedVariations(
            selectedCards,
            store.cardsByPaths.value,
            store.groupedVariationsByParent.value,
            this.repository,
            {
                getDisplayName: this.getDisplayName,
                store,
            },
        );
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get selectedItems() {
        const store = this.itemsSelection.value;
        const selectedCardPaths = this.hideGroupedVariations
            ? store.selectedCards.value?.filter((path) => !Fragment.isGroupedVariationPath(path))
            : store.selectedCards.value;
        const cards = selectedCardPaths
            ?.map((path) => store.cardsByPaths.value?.get(path) ?? store.groupedVariationsData.value?.get(path))
            .filter(Boolean);
        const collections = store.selectedCollections.value
            ?.map((path) => store.collectionsByPaths.value.get(path))
            .filter(Boolean);
        const placeholders = store.selectedPlaceholders.value
            ?.map((path) => store.placeholdersByPaths.value.get(path))
            .filter(Boolean);
        return [...cards, ...collections, ...placeholders];
    }

    get showSelected() {
        return this.itemsSelection.value.showSelected.value;
    }

    getType(item) {
        return getItemTypeLabel(item);
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
        const store = this.itemsSelection.value;
        store[`selected${type}`].set(store[`selected${type}`].value?.filter((selectedPath) => selectedPath !== item.path));
        this.dispatchEvent(
            new CustomEvent('selected-item-removed', {
                bubbles: true,
                composed: true,
                detail: { path: item.path },
            }),
        );
    }

    render() {
        if (!this.showSelected) return nothing;
        if (this.loading) {
            return html`<div class="empty-state"><sp-progress-circle indeterminate size="m"></sp-progress-circle></div>`;
        }
        if (this.selectedItems.length === 0) {
            return html`
                <div class="empty-state">
                    <sp-icon label="No items selected">${noItemsSelectedIcon}</sp-icon>
                    <p>No items selected yet</p>
                </div>
            `;
        }
        return html`<ul class="selected-items">
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
                        >
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-button>
                    </li>`,
            )}
        </ul>`;
    }
}

customElements.define('mas-selected-items', MasSelectedItems);
