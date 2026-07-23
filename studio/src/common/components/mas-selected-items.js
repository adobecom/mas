import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-selected-items.css.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../../constants.js';
import { getItemTypeLabel } from '../utils/render-utils.js';
import { fetchUnresolvedVariations } from '../utils/items-loader.js';
import { noItemsSelectedIcon } from '../../icons.js';

class MasSelectedItems extends LitElement {
    static styles = styles;
    static properties = {
        getDisplayName: { type: Function },
        loading: { type: Boolean },
    };

    #lastFetchedSelectedCardsKey = null;

    constructor() {
        super();
        this.getDisplayName = (fragmentData) => fragmentData?.path ?? '';
        this.loading = false;
        this.storeController = new ReactiveController(this, [
            getItemsSelectionStore().showSelected,
            getItemsSelectionStore().selectedCards,
            getItemsSelectionStore().selectedCollections,
            getItemsSelectionStore().selectedPlaceholders,
            getItemsSelectionStore().groupedVariationsByParent,
            getItemsSelectionStore().cardsByPaths,
            getItemsSelectionStore().groupedVariationsData,
            getItemsSelectionStore().collectionsByPaths,
            getItemsSelectionStore().placeholdersByPaths,
        ]);
        this.fetchController = new ReactiveController(
            this,
            [getItemsSelectionStore().showSelected, getItemsSelectionStore().selectedCards],
            this.maybeFetchUnresolvedVariations.bind(this),
        );
    }

    /** If grouped variations for selected cards are not in the Store yet, we fetch,
     * add studioPath, offerData, and save them in the Store */
    maybeFetchUnresolvedVariations() {
        if (!this.showSelected || !this.repository) return;

        const selectedCards = getItemsSelectionStore().selectedCards.value || [];
        const selectedCardsKey = [...selectedCards].sort().join('\0');
        if (selectedCardsKey === this.#lastFetchedSelectedCardsKey) return;

        this.#lastFetchedSelectedCardsKey = selectedCardsKey;
        fetchUnresolvedVariations(
            selectedCards,
            getItemsSelectionStore().cardsByPaths.value,
            getItemsSelectionStore().groupedVariationsByParent.value,
            this.repository,
            { getDisplayName: this.getDisplayName },
        );
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    get selectedItems() {
        const cards = getItemsSelectionStore()
            .selectedCards.value?.map(
                (path) =>
                    getItemsSelectionStore().cardsByPaths.value?.get(path) ??
                    getItemsSelectionStore().groupedVariationsData.value?.get(path),
            )
            .filter(Boolean);
        const collections = getItemsSelectionStore()
            .selectedCollections.value?.map((path) => {
                return getItemsSelectionStore().collectionsByPaths.value.get(path);
            })
            .filter(Boolean);
        const placeholders = getItemsSelectionStore()
            .selectedPlaceholders.value?.map((path) => {
                return getItemsSelectionStore().placeholdersByPaths.value.get(path);
            })
            .filter(Boolean);
        return [...cards, ...collections, ...placeholders];
    }

    get showSelected() {
        return getItemsSelectionStore().showSelected.value;
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
        getItemsSelectionStore()[`selected${type}`].set(
            getItemsSelectionStore()[`selected${type}`].value?.filter((selectedPath) => selectedPath !== item.path),
        );
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
