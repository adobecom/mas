import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, TABLE_TYPE } from '../../constants.js';
import { toggleSidebarIcon } from '../../icons.js';
import { Fragment } from '../../aem/fragment.js';
import { renderFragmentStatusCell, getStudioFragmentDisplayPath } from '../utils/render-utils.js';
import './mas-select-items-table.js';
import './mas-selected-items.js';
import './mas-search-and-filters.js';
import { styles } from './mas-items-selector.css.js';
import { debounce, parseStudioDeepLinksFromText } from '../../utils.js';

export const TABS = [
    { value: TABLE_TYPE.CARDS, label: 'Fragments' },
    { value: TABLE_TYPE.COLLECTIONS, label: 'Collections' },
    { value: TABLE_TYPE.PLACEHOLDERS, label: 'Placeholders' },
];

class MasItemsSelector extends LitElement {
    static styles = styles;

    static properties = {
        viewOnly: { type: Boolean, state: true },
        hideSelectedToggle: { type: Boolean, attribute: 'hide-selected-toggle' },
        searchQuery: { type: String, state: true },
        selectedTab: { type: String, state: true },
        allowedTypes: { type: Array, attribute: false },
        maxSelectedCards: { type: Number, attribute: 'max-selected-cards' },
        lockedTemplateFilter: { type: String, attribute: 'locked-template-filter' },
        defaultTemplateFilter: { type: String, attribute: 'default-template-filter' },
        disableGroupedVariationSelection: { type: Boolean, attribute: 'disable-grouped-variation-selection' },
        hideLocaleTab: { type: Boolean, attribute: 'hide-locale-tab' },
        disableLocaleVariations: { type: Boolean, attribute: 'disable-locale-variations' },
        /** @type {(fragmentData: object) => string} */
        getDisplayName: { type: Function },
        renderFragmentStatusCell: { type: Function },
        hidePromoVariations: { type: Boolean, attribute: 'hide-promo-variations' },
    };

    constructor() {
        super();
        this.viewOnly = false;
        this.hideSelectedToggle = false;
        this.searchQuery = '';
        this.selectedTab = TABLE_TYPE.CARDS;
        this.allowedTypes = TABS.map((tab) => tab.value);
        this.maxSelectedCards = Infinity;
        this.lockedTemplateFilter = '';
        this.defaultTemplateFilter = '';
        this.disableGroupedVariationSelection = false;
        this.hideLocaleTab = false;
        this.disableLocaleVariations = false;
        this.getDisplayName = getStudioFragmentDisplayPath;
        this.renderFragmentStatusCell = renderFragmentStatusCell;
        this.hidePromoVariations = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('sp-opened', this.#stopPropagation);
        const s = getItemsSelectionStore();
        this.storeController = new ReactiveController(this, [
            s.inEdit,
            s.showSelected,
            s.selectedCards,
            s.selectedCollections,
            s.selectedPlaceholders,
        ]);
    }

    #stopPropagation(event) {
        event.stopPropagation();
    }

    get showSelected() {
        return getItemsSelectionStore().showSelected.value;
    }

    get selectedCount() {
        const s = getItemsSelectionStore();
        return this.tabs.reduce((count, tab) => count + s[`selected${this.#typeUppercased(tab.value)}`].value.length, 0);
    }

    get tabs() {
        const allowedTypes = this.allowedTypes?.length ? this.allowedTypes : TABS.map((tab) => tab.value);
        return TABS.filter((tab) => allowedTypes.includes(tab.value));
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    #typeUppercased(type) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    #upsertDisplayCard(fragmentData) {
        if (!fragmentData?.path || fragmentData.model?.path !== CARD_MODEL_PATH) return;
        const store = getItemsSelectionStore();
        const fragment = {
            ...fragmentData,
            studioPath: this.getDisplayName(new Fragment(fragmentData)),
        };
        const upsert = (items = []) => [fragment, ...items.filter((item) => item.path !== fragment.path)];
        store.cardsByPaths.set(new Map(store.cardsByPaths.value).set(fragment.path, fragment));
        store.displayCards.set(upsert(store.displayCards.value));
        store.allCards.set(upsert(store.allCards.value));
        return fragment;
    }

    #appendSelectedCard(fragment) {
        if (!fragment?.path) return false;
        const store = getItemsSelectionStore();
        const selectedCards = store.selectedCards.value || [];
        if (selectedCards.includes(fragment.path)) return false;
        if (selectedCards.length >= this.maxSelectedCards) {
            this.#openToast(`You can select up to ${this.maxSelectedCards} cards.`, 'negative');
            return false;
        }
        store.selectedCards.set([...selectedCards, fragment.path]);
        return true;
    }

    #upsertDisplayCollection(fragmentData) {
        if (!fragmentData?.path || fragmentData.model?.path !== COLLECTION_MODEL_PATH) return;
        const store = getItemsSelectionStore();
        const fragment = {
            ...fragmentData,
            studioPath: this.getDisplayName(new Fragment(fragmentData)),
        };
        const upsert = (items = []) => [fragment, ...items.filter((item) => item.path !== fragment.path)];
        store.collectionsByPaths.set(new Map(store.collectionsByPaths.value).set(fragment.path, fragment));
        store.displayCollections.set(upsert(store.displayCollections.value));
        store.allCollections.set(upsert(store.allCollections.value));
        return fragment;
    }

    #appendSelectedCollection(fragment) {
        if (!fragment?.path) return false;
        const store = getItemsSelectionStore();
        const selectedCollections = store.selectedCollections.value || [];
        if (selectedCollections.includes(fragment.path)) return false;
        store.selectedCollections.set([...selectedCollections, fragment.path]);
        return true;
    }

    async #handleStudioUrls(value, search) {
        const all = parseStudioDeepLinksFromText(value);
        if (!all.length) return false;
        const parsed = all.filter(({ contentType }) =>
            this.allowedTypes.includes(contentType === 'merch-card' ? TABLE_TYPE.CARDS : TABLE_TYPE.COLLECTIONS),
        );
        search.value = '';
        this.searchQuery = '';
        if (!parsed.length) {
            this.#openToast('URL type not supported', 'negative');
            return true;
        }
        let added = 0;
        let failed = 0;
        await Promise.all(
            parsed.map(async ({ contentType, fragmentId }) => {
                try {
                    const fragment = await this.repository?.aem?.sites?.cf?.fragments?.getById?.(fragmentId);
                    const isCard = contentType === 'merch-card';
                    const display = isCard ? this.#upsertDisplayCard(fragment) : this.#upsertDisplayCollection(fragment);
                    if (isCard ? this.#appendSelectedCard(display) : this.#appendSelectedCollection(display)) added++;
                } catch {
                    failed++;
                }
            }),
        );
        if (added > 0 && failed === 0) {
            this.#openToast(added === 1 ? 'Fragment added' : `${added} fragments added`, 'positive');
        } else if (added > 0 && failed > 0) {
            this.#openToast(`${added} added, ${failed} not found`, 'negative');
        } else if (failed > 0) {
            this.#openToast(failed === 1 ? 'Fragment not found' : `${failed} fragments not found`, 'negative');
        }
        return true;
    }

    #toggleShowSelected() {
        getItemsSelectionStore().showSelected.set(!this.showSelected);
    }

    #setSearchQuery = debounce((value) => {
        this.searchQuery = value;
    }, 300);

    async #handleSearchInput(e) {
        const search = e.currentTarget;
        const value = search?.value ?? '';
        if (await this.#handleStudioUrls(value, search)) return;
        this.#setSearchQuery(value);
    }

    async #handleSearchSubmit(e) {
        e.preventDefault();
        const search = e.currentTarget;
        const value = search?.value ?? '';
        if (await this.#handleStudioUrls(value, search)) return;
        this.searchQuery = value;
    }

    #handleTabChange({ target: { selected } }) {
        this.selectedTab = selected;
    }

    #getTabLabel(tab) {
        if (this.viewOnly) {
            const valueUppercase = tab.value.charAt(0).toUpperCase() + tab.value.slice(1);
            return `${tab.label} (${getItemsSelectionStore()[`selected${valueUppercase}`].value.length})`;
        }
        return tab.label;
    }

    #openToast(text, variant = 'info') {
        const toast =
            this.shadowRoot.querySelector(`sp-tab-panel[value="${this.selectedTab}"] sp-toast`) ??
            this.shadowRoot.querySelector('sp-toast');
        if (toast) {
            toast.textContent = text;
            toast.variant = variant;
            toast.open = true;
        }
    }

    #showToast({ detail: { text, variant } }) {
        this.#openToast(text, variant);
    }

    #renderItemsTable(type) {
        return html`
            <mas-select-items-table
                type=${type}
                .viewOnly=${this.viewOnly}
                .type=${type}
                .maxSelectedCards=${this.maxSelectedCards}
                .disableGroupedVariationSelection=${this.disableGroupedVariationSelection}
                .hideLocaleTab=${this.hideLocaleTab}
                .disableLocaleVariations=${this.disableLocaleVariations}
                .getDisplayName=${this.getDisplayName}
                .renderFragmentStatusCell=${this.renderFragmentStatusCell}
                .hidePromoVariations=${this.hidePromoVariations}
                @show-toast=${this.#showToast}
            ></mas-select-items-table>
        `;
    }

    willUpdate() {
        const tabs = this.tabs;
        const next = tabs.some((tab) => tab.value === this.selectedTab) ? this.selectedTab : tabs[0]?.value || TABLE_TYPE.CARDS;
        if (next !== this.selectedTab) this.selectedTab = next;
    }

    render() {
        const count = this.selectedCount;
        const showingSelection = this.showSelected && count;
        const toggleLabel = showingSelection ? 'Hide selection' : 'Selected items';
        const tabs = this.tabs;
        return html`
            ${this.viewOnly
                ? nothing
                : html`
                      <div class="dialog-header">
                          <h2>Select items</h2>
                          <sp-search
                              size="m"
                              placeholder="Search..."
                              @input=${this.#handleSearchInput}
                              @submit=${this.#handleSearchSubmit}
                          ></sp-search>
                      </div>
                  `}
            <sp-tabs quiet .selected=${this.selectedTab} @change=${this.#handleTabChange}>
                ${repeat(
                    tabs,
                    (tab) => tab.value,
                    (tab) => html`<sp-tab value=${tab.value} label=${tab.label}>${this.#getTabLabel(tab)}</sp-tab>`,
                )}
                ${repeat(
                    tabs,
                    (tab) => tab.value,
                    (tab) => html`
                        <sp-tab-panel value=${tab.value} class=${this.viewOnly ? 'view-only' : ''}>
                            ${this.viewOnly
                                ? nothing
                                : html`
                                      <mas-search-and-filters
                                          .type=${tab.value}
                                          .searchQuery=${tab.value === this.selectedTab ? this.searchQuery : ''}
                                          .searchOnly=${[TABLE_TYPE.PLACEHOLDERS, TABLE_TYPE.COLLECTIONS].includes(tab.value)}
                                          .lockedTemplateFilter=${tab.value === TABLE_TYPE.CARDS
                                              ? this.lockedTemplateFilter
                                              : ''}
                                          .defaultTemplateFilter=${tab.value === TABLE_TYPE.CARDS
                                              ? this.defaultTemplateFilter
                                              : ''}
                                      ></mas-search-and-filters>
                                  `}
                            <div
                                class="container ${this.viewOnly ? 'view-only' : ''} ${showingSelection ? 'show-selected' : ''}"
                            >
                                ${this.#renderItemsTable(tab.value)}
                                ${this.viewOnly
                                    ? nothing
                                    : html`<mas-selected-items .getDisplayName=${this.getDisplayName}></mas-selected-items>`}
                            </div>
                            <sp-toast timeout="6000" @close=${(event) => event.stopPropagation()}></sp-toast>
                        </sp-tab-panel>
                    `,
                )}
            </sp-tabs>

            ${this.viewOnly || this.hideSelectedToggle
                ? nothing
                : html`
                      <div class="selected-items-count">
                          <sp-button
                              variant="secondary"
                              @click=${this.#toggleShowSelected}
                              ?disabled=${!count}
                              class="ghost-button"
                          >
                              <sp-icon slot="icon" label=${toggleLabel} class=${showingSelection ? 'flipped' : ''}>
                                  ${toggleSidebarIcon}
                              </sp-icon>
                              ${toggleLabel} (${count})
                          </sp-button>
                      </div>
                  `}
        `;
    }
}

customElements.define('mas-items-selector', MasItemsSelector);
