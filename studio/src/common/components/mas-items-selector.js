import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import ReactiveController from '../../reactivity/reactive-controller.js';
import { getItemsSelectionStore } from '../items-selection-store.js';
import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH, TABLE_TYPE } from '../../constants.js';
import { toggleSidebarIcon, uploadIcon, noItemsSelectedIcon } from '../../icons.js';
import { Fragment } from '../../aem/fragment.js';
import { renderFragmentStatusCell, getStudioFragmentDisplayPath } from '../utils/render-utils.js';
import './mas-select-items-table.js';
import './mas-selected-items.js';
import './mas-search-and-filters.js';
import { styles } from './mas-items-selector.css.js';
import { debounce, isUUID } from '../../utils.js';

const IMPORT_CONTENT_TYPES = ['merch-card', 'merch-card-collection', 'mas-compare-chart'];

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
        importMode: { type: Boolean, state: true },
        importedUrls: { type: Array, state: true },
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
        this.importMode = false;
        this.importedUrls = [];
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

    #setImportedUrlStatus(fragmentId, status, errorMessage, path = null, displayName = null) {
        this.importedUrls = this.importedUrls.map((item) =>
            item.fragmentId === fragmentId ? { ...item, status, errorMessage, path, displayName } : item,
        );
    }

    #removeAllImportedUrls() {
        const store = getItemsSelectionStore();
        const valid = this.importedUrls.filter((i) => i.status === 'valid');
        const cardPaths = valid.filter((i) => i.contentType === 'merch-card').map((i) => i.path);
        const collectionPaths = valid.filter((i) => i.contentType !== 'merch-card').map((i) => i.path);
        store.selectedCards.set(store.selectedCards.value.filter((p) => !cardPaths.includes(p)));
        store.selectedCollections.set(store.selectedCollections.value.filter((p) => !collectionPaths.includes(p)));
        this.importedUrls = [];
    }

    #removeImportedUrl(item) {
        this.importedUrls = this.importedUrls.filter((i) => i.fragmentId !== item.fragmentId);
        if (item.status !== 'valid') return;
        const store = getItemsSelectionStore();
        const key = item.contentType === 'merch-card' ? 'selectedCards' : 'selectedCollections';
        store[key].set(store[key].value.filter((p) => p !== item.path));
    }

    async #processUrlText(text) {
        const lines = text.split(/\s+/).filter(Boolean);
        const allParsed = [];
        for (const url of lines) {
            let parsedUrl;
            try {
                parsedUrl = new URL(url);
            } catch {
                continue;
            }
            const params = new URLSearchParams(parsedUrl.hash.slice(1));
            const contentType = params.get('content-type');
            const fragmentId = params.get('query');
            if (!fragmentId || !isUUID(fragmentId) || !IMPORT_CONTENT_TYPES.includes(contentType)) continue;
            if (this.importedUrls.some((item) => item.fragmentId === fragmentId)) continue;
            const allowed = this.allowedTypes.includes(
                contentType === 'merch-card' ? TABLE_TYPE.CARDS : TABLE_TYPE.COLLECTIONS,
            );
            allParsed.push({ url, fragmentId, contentType, allowed });
        }

        if (!allParsed.length) {
            this.#openToast('No valid URLs found', 'negative');
            return;
        }

        const newItems = allParsed.map(({ url, fragmentId, contentType, allowed }) => ({
            url,
            fragmentId,
            contentType,
            status: allowed ? 'loading' : 'error',
            errorMessage: allowed ? null : 'URL type not supported',
            path: null,
        }));

        this.importedUrls = [...this.importedUrls, ...newItems];

        const fetchable = newItems.filter((item) => item.status === 'loading');
        if (!fetchable.length) {
            this.#openToast('URL type not supported', 'negative');
            return;
        }

        let added = 0;
        let failed = 0;
        await Promise.all(
            fetchable.map(async (item) => {
                try {
                    const fragment = await this.repository?.aem?.sites?.cf?.fragments?.getById?.(item.fragmentId);
                    const isCard = item.contentType === 'merch-card';
                    const display = isCard ? this.#upsertDisplayCard(fragment) : this.#upsertDisplayCollection(fragment);
                    if (!display) {
                        failed++;
                        this.#setImportedUrlStatus(item.fragmentId, 'error', 'Fragment type not supported', null);
                        return;
                    }
                    if (isCard ? this.#appendSelectedCard(display) : this.#appendSelectedCollection(display)) added++;
                    const displayName = this.getDisplayName(new Fragment(fragment)) || fragment.path;
                    this.#setImportedUrlStatus(item.fragmentId, 'valid', null, fragment.path, displayName);
                } catch {
                    failed++;
                    this.#setImportedUrlStatus(item.fragmentId, 'error', 'Fragment not found', null);
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
    }

    async #handleUrlPaste(e) {
        const text = (e.clipboardData?.getData('text') || '').trim();
        if (!text) return;
        e.preventDefault();
        if (e.target?.value !== undefined) e.target.value = '';
        await this.#processUrlText(text);
    }

    async #handleImportKeydown(e) {
        if (e.key !== 'Enter' || e.shiftKey) return;
        e.preventDefault();
        const text = e.target.value.trim();
        if (!text) return;
        e.target.value = '';
        await this.#processUrlText(text);
    }

    #toggleImportMode() {
        this.importMode = !this.importMode;
        this.importedUrls = [];
        if (this.importMode) {
            getItemsSelectionStore().showSelected.set(true);
        }
    }

    #toggleShowSelected() {
        getItemsSelectionStore().showSelected.set(!this.showSelected);
    }

    #setSearchQuery = debounce((value) => {
        this.searchQuery = value;
    }, 300);

    #handleSearchInput(e) {
        this.#setSearchQuery(e.currentTarget?.value ?? '');
    }

    #handleSearchSubmit(e) {
        e.preventDefault();
        this.searchQuery = e.currentTarget?.value ?? '';
    }

    #handleTabChange({ target: { selected } }) {
        if (this.importMode) {
            this.importMode = false;
            this.importedUrls = [];
        }
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

    #renderTabs(tabs, showingSelection) {
        return html`
            <div class="tabs-container">
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
                                              .searchOnly=${[TABLE_TYPE.PLACEHOLDERS, TABLE_TYPE.COLLECTIONS].includes(
                                                  tab.value,
                                              )}
                                              .lockedTemplateFilter=${tab.value === TABLE_TYPE.CARDS
                                                  ? this.lockedTemplateFilter
                                                  : ''}
                                              .defaultTemplateFilter=${tab.value === TABLE_TYPE.CARDS
                                                  ? this.defaultTemplateFilter
                                                  : ''}
                                          ></mas-search-and-filters>
                                      `}
                                <div
                                    class="container ${this.viewOnly ? 'view-only' : ''} ${showingSelection
                                        ? 'show-selected'
                                        : ''}"
                                >
                                    ${this.#renderItemsTable(tab.value)}
                                    ${this.viewOnly
                                        ? nothing
                                        : html`<mas-selected-items
                                              .getDisplayName=${this.getDisplayName}
                                          ></mas-selected-items>`}
                                </div>
                                <sp-toast timeout="6000" @close=${(event) => event.stopPropagation()}></sp-toast>
                            </sp-tab-panel>
                        `,
                    )}
                </sp-tabs>
                ${this.viewOnly
                    ? nothing
                    : html`
                          <sp-button variant="secondary" class="import-url-btn" @click=${this.#toggleImportMode}>
                              <sp-icon slot="icon">${uploadIcon}</sp-icon>
                              Import via URL
                          </sp-button>
                      `}
            </div>
        `;
    }

    #renderImportStatusCell(item) {
        if (item.status === 'loading') {
            return html`<span class="import-item-status status-pending">Loading…</span>`;
        }
        if (item.status === 'valid') {
            return html`<span class="import-item-status status-valid">
                <sp-icon-checkmark-circle></sp-icon-checkmark-circle>
                Validated
            </span>`;
        }
        return html`<span class="import-item-status status-error">
            <sp-icon-alert></sp-icon-alert>
            ${item.errorMessage || 'Error'}
        </span>`;
    }

    #renderImportPanel() {
        const hasItems = this.selectedCount > 0;
        const count = this.importedUrls.length;
        return html`
            <div class="import-url-view">
                <h3 class="import-url-heading">Import from URL</h3>
                <div class="import-url-content">
                    <div class="import-url-left">
                        ${count > 0
                            ? html`<div class="import-items-box">
                                  <div class="import-items-header">
                                      <span>URL</span>
                                      <span>Status</span>
                                      <span>Actions</span>
                                  </div>
                                  <ul class="import-items-list">
                                      ${repeat(
                                          this.importedUrls,
                                          (item) => item.fragmentId,
                                          (item) => html`
                                              <li class="import-item-row">
                                                  <a
                                                      href=${item.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      class="import-item-link"
                                                      @click=${(e) => e.stopPropagation()}
                                                      >${item.displayName || item.path || item.url}</a
                                                  >
                                                  ${this.#renderImportStatusCell(item)}
                                                  <span class="import-actions-cell">
                                                      <sp-action-button
                                                          quiet
                                                          size="xs"
                                                          @click=${() => this.#removeImportedUrl(item)}
                                                      >
                                                          <sp-icon-delete slot="icon"></sp-icon-delete>
                                                          Remove
                                                      </sp-action-button>
                                                  </span>
                                              </li>
                                          `,
                                      )}
                                      <li class="import-footer-row">
                                          <span class="footer-count">${count} URL${count !== 1 ? 's' : ''}</span>
                                          <span></span>
                                          <span class="import-actions-cell">
                                              <sp-action-button
                                                  quiet
                                                  size="xs"
                                                  label="Remove all"
                                                  @click=${this.#removeAllImportedUrls}
                                              >
                                                  <sp-icon-delete slot="icon"></sp-icon-delete>
                                                  Remove all
                                              </sp-action-button>
                                          </span>
                                      </li>
                                  </ul>
                              </div>`
                            : nothing}
                        <div class="import-url-input-section">
                            <p class="import-url-label">Enter URLs (one per line)</p>
                            <textarea
                                class="import-url-input"
                                placeholder="https://mas.adobe.com/studio.html#..."
                                @paste=${this.#handleUrlPaste}
                                @keydown=${this.#handleImportKeydown}
                            ></textarea>
                        </div>
                    </div>
                    ${this.showSelected
                        ? html`
                              <div class="import-selected-panel">
                                  ${hasItems
                                      ? html`<mas-selected-items .getDisplayName=${this.getDisplayName}></mas-selected-items>`
                                      : html`
                                            <div class="import-empty-state">
                                                <sp-icon label="No items selected">${noItemsSelectedIcon}</sp-icon>
                                                <p>No items selected yet</p>
                                            </div>
                                        `}
                              </div>
                          `
                        : nothing}
                </div>
                <sp-toast timeout="6000" @close=${(event) => event.stopPropagation()}></sp-toast>
            </div>
        `;
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
                          ${this.importMode
                              ? nothing
                              : html`<sp-search
                                    size="m"
                                    placeholder="Search..."
                                    @input=${this.#handleSearchInput}
                                    @submit=${this.#handleSearchSubmit}
                                ></sp-search>`}
                      </div>
                  `}
            ${this.importMode
                ? html`
                      <div class="tabs-container import-mode">
                          <sp-tabs quiet .selected=${''} @change=${this.#handleTabChange}>
                              ${repeat(
                                  tabs,
                                  (tab) => tab.value,
                                  (tab) =>
                                      html`<sp-tab value=${tab.value} label=${tab.label}>${this.#getTabLabel(tab)}</sp-tab>`,
                              )}
                          </sp-tabs>
                          <sp-button variant="secondary" class="import-url-btn" @click=${this.#toggleImportMode}>
                              <sp-icon slot="icon">${uploadIcon}</sp-icon>
                              Import via URL
                          </sp-button>
                      </div>
                      ${this.#renderImportPanel()}
                  `
                : this.#renderTabs(tabs, showingSelection)}
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
