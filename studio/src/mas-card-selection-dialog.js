import { LitElement, html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import { CARD_MODEL_PATH, TAG_MODEL_ID_MAPPING } from './constants.js';
import { toggleSelection } from './store.js';
import { VARIANTS } from './editors/variant-picker.js';
import './mas-fragment.js';
import './aem/mas-filter-panel.js';

const TAG_VARIANT_PREFIX = 'mas:variant/';
const TAG_STUDIO_CONTENT_TYPE = 'mas:studio/content-type';

const CARDS_PER_PAGE = 10;
const variantValues = VARIANTS.map((v) => v.value);

class MasCardSelectionDialog extends LitElement {
    static properties = {
        selectionCount: { state: true },
        loading: { state: true },
        searchQuery: { state: true },
        displayCount: { state: true },
        viewMode: { state: true },
        currentFilters: { state: true },
        cardsRendering: { state: true },
        mode: { type: String },
        preloadedFragments: { type: Array },
    };

    selection = new StoreController(this, Store.selection);
    fragments = new StoreController(this, Store.fragments.list.data);
    fragmentsLoading = new StoreController(this, Store.fragments.list.loading);
    firstPageLoaded = new StoreController(this, Store.fragments.list.firstPageLoaded);
    filters = new StoreController(this, Store.filters);
    createdByUsers = new StoreController(this, Store.createdByUsers);

    constructor() {
        super();
        this.selectionCount = 0;
        this.searchQuery = '';
        this.resolver = null;
        this.previousSelectingState = false;
        this.displayCount = CARDS_PER_PAGE;
        this.cardGridElement = null;
        this.boundHandleScroll = this.handleScroll.bind(this);
        this.viewMode = 'render';
        this.currentFilters = {};
        this.resizeObserver = null;
        this.cardLoadObserver = null;
        this.loadedCardsSet = new Set();
        this.reflowTimeout = null;
        this.mode = 'selection';
        this.preloadedFragments = null;
    }

    createRenderRoot() {
        return this;
    }

    async open(options = {}) {
        this.mode = options.mode || 'selection';
        this.preloadedFragments = options.fragments || null;

        return new Promise((resolve) => {
            this.resolver = resolve;

            if (this.mode === 'selection') {
                this.previousSelectingState = Store.selecting.get();
                Store.selecting.set(true);
            }

            if (this.preloadedFragments) {
                this.firstPageLoaded.value = true;
            } else {
                this.loadFragments();
            }
        });
    }

    async loadFragments() {
        if (this.preloadedFragments) {
            return;
        }

        try {
            const repository = document.querySelector('mas-repository');
            if (!repository) {
                throw new Error('Repository not found');
            }

            const currentPath = Store.search.get().path;
            if (!currentPath) {
                const folders = Store.folders.data.get();
                if (folders.length > 0) {
                    Store.search.set((prev) => ({
                        ...prev,
                        path: folders[0],
                    }));
                }
            }

            await repository.searchFragments();
        } catch (error) {
            console.error('Failed to load fragments:', error);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.currentFilters = Store.filters.get();
        this.selectionSubscription = Store.selection.subscribe(() => {
            this.selectionCount = Store.selection.get().length;
            this.requestUpdate();
        });
        this.filtersSubscription = Store.filters.subscribe(() => {
            this.currentFilters = Store.filters.get();
            this.displayCount = CARDS_PER_PAGE;
            this.scheduleGridReflow();
        });
        this.createdByUsersSubscription = Store.createdByUsers.subscribe(() => {
            this.displayCount = CARDS_PER_PAGE;
            this.scheduleGridReflow();
        });
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        if (!this.cardGridElement) {
            const selector = this.viewMode === 'table' ? 'sp-table' : '.card-grid';
            this.cardGridElement = this.querySelector(selector);
            if (this.cardGridElement) {
                this.cardGridElement.addEventListener('scroll', this.boundHandleScroll);
                this.setupResizeObserver();
                this.setupCardLoadObserver();
            }
        }

        if (changedProperties.has('viewMode') && changedProperties.get('viewMode') !== undefined) {
            if (this.cardGridElement) {
                this.cardGridElement.removeEventListener('scroll', this.boundHandleScroll);
                this.cleanupResizeObserver();
                this.cleanupCardLoadObserver();
            }
            const selector = this.viewMode === 'table' ? 'sp-table' : '.card-grid';
            this.cardGridElement = this.querySelector(selector);
            if (this.cardGridElement) {
                this.cardGridElement.addEventListener('scroll', this.boundHandleScroll);
                this.setupResizeObserver();
                this.setupCardLoadObserver();
            }
        }

        if (changedProperties.has('displayCount') && this.cardGridElement && this.viewMode === 'render') {
            this.scheduleGridReflow();
        }
    }

    setupResizeObserver() {
        if (this.viewMode !== 'render' || !this.cardGridElement) return;

        this.cleanupResizeObserver();

        this.resizeObserver = new ResizeObserver(() => {
            this.forceGridReflow();
        });

        this.resizeObserver.observe(this.cardGridElement);
    }

    cleanupResizeObserver() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
    }

    setupCardLoadObserver() {
        if (this.viewMode !== 'render' || !this.cardGridElement) return;

        this.cleanupCardLoadObserver();

        this.cardLoadObserver = new MutationObserver(() => {
            this.scheduleGridReflow();
        });

        this.cardLoadObserver.observe(this.cardGridElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
        });
    }

    cleanupCardLoadObserver() {
        if (this.cardLoadObserver) {
            this.cardLoadObserver.disconnect();
            this.cardLoadObserver = null;
        }
        if (this.reflowTimeout) {
            clearTimeout(this.reflowTimeout);
            this.reflowTimeout = null;
        }
    }

    scheduleGridReflow() {
        if (this.reflowTimeout) {
            clearTimeout(this.reflowTimeout);
        }
        this.reflowTimeout = setTimeout(() => {
            this.forceGridReflow();
            this.reflowTimeout = null;
        }, 100);
    }

    forceGridReflow() {
        if (!this.cardGridElement || this.viewMode !== 'render') return;

        const currentDisplay = this.cardGridElement.style.display;
        this.cardGridElement.style.display = 'none';
        void this.cardGridElement.offsetHeight;
        this.cardGridElement.style.display = currentDisplay || 'grid';
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.selectionSubscription) {
            this.selectionSubscription.unsubscribe();
        }
        if (this.filtersSubscription) {
            this.filtersSubscription.unsubscribe();
        }
        if (this.createdByUsersSubscription) {
            this.createdByUsersSubscription.unsubscribe();
        }
        if (this.cardGridElement) {
            this.cardGridElement.removeEventListener('scroll', this.boundHandleScroll);
        }
        this.cleanupResizeObserver();
        this.cleanupCardLoadObserver();
    }

    handleScroll(event) {
        const element = event.target;
        const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

        if (scrollBottom < 200 && !this.fragmentsLoading.value) {
            const filtered = this.filteredFragments;
            if (this.displayCount < filtered.length) {
                this.displayCount = Math.min(this.displayCount + CARDS_PER_PAGE, filtered.length);
            }
        }
    }

    handleConfirm() {
        const selectedIds = Store.selection.get();
        this.cleanup();
        this.resolver(selectedIds);
    }

    handleCancel() {
        this.cleanup();
        this.resolver(null);
    }

    cleanup() {
        Store.selecting.set(this.previousSelectingState);
        Store.selection.set([]);
        this.remove();
    }

    handleSearchInput(event) {
        this.searchQuery = event.target.value.toLowerCase();
        this.displayCount = CARDS_PER_PAGE;
    }

    handleViewModeChange(event) {
        this.viewMode = event.target.value;
        this.displayCount = CARDS_PER_PAGE;
    }

    handleCardClick(fragmentStore) {
        toggleSelection(fragmentStore.id);
    }

    updateTableSelection(event) {
        Store.selection.set(Array.from(event.target.selectedSet));
    }

    async handleOpenCard(fragment) {
        const { Fragment } = await import('./aem/fragment.js');
        const { FragmentStore } = await import('./reactivity/fragment-store.js');
        const { editFragment } = await import('./store.js');

        const fragmentInstance = new Fragment(fragment);
        const fragmentStore = new FragmentStore(fragmentInstance);
        editFragment(fragmentStore);

        this.dispatchEvent(
            new CustomEvent('card-opened', {
                detail: { fragment },
                bubbles: true,
                composed: true,
            }),
        );
    }

    get filteredFragments() {
        if (this.preloadedFragments) {
            let filtered = this.preloadedFragments;

            if (this.searchQuery) {
                filtered = filtered.filter((fragment) => {
                    const title = (fragment.title || '').toLowerCase();
                    return title.includes(this.searchQuery);
                });
            }

            return filtered;
        }

        const filterTags = this.currentFilters?.tags ? this.currentFilters.tags.split(',').filter(Boolean) : [];

        const variantFilters = filterTags
            .filter((tag) => tag.startsWith(TAG_VARIANT_PREFIX))
            .map((tag) => tag.replace(TAG_VARIANT_PREFIX, ''));

        const contentTypeFilters = filterTags
            .filter((tag) => tag.startsWith(TAG_STUDIO_CONTENT_TYPE))
            .map((tag) => TAG_MODEL_ID_MAPPING[tag]);

        const tagFilters = filterTags.filter(
            (tag) => !tag.startsWith(TAG_STUDIO_CONTENT_TYPE) && !tag.startsWith(TAG_VARIANT_PREFIX),
        );

        const createdByUsers = Store.createdByUsers.get();
        const createdByUsernames = createdByUsers.map((user) => user.userPrincipalName);

        console.log('[Card Selection Dialog] Filtering cards:', {
            totalFragments: this.fragments.value.length,
            variantFilters,
            contentTypeFilters,
            tagFilters,
            createdByUsernames,
            searchQuery: this.searchQuery,
        });

        let filtered = this.fragments.value.filter((fragmentStore) => {
            const fragment = fragmentStore.get();
            if (!fragment) return false;
            if (fragment.model?.path !== CARD_MODEL_PATH) return false;
            if (!fragmentStore.new && !variantValues.includes(fragment.variant)) return false;

            if (variantFilters.length > 0) {
                const fragmentVariant = fragment.variant || fragment.getFieldValue('variant');
                if (!variantFilters.includes(fragmentVariant)) return false;
            }

            if (contentTypeFilters.length > 0) {
                const fragmentModelId = fragment.model?.id;
                if (!contentTypeFilters.includes(fragmentModelId)) return false;
            }

            if (tagFilters.length > 0) {
                const fragmentTags = fragment.tags || [];
                const fragmentTagIds = fragmentTags.map((tag) => tag.id || tag);

                const hasAllRequiredTags = tagFilters.every((filterTag) => {
                    return fragmentTagIds.some(
                        (fragTag) => fragTag === filterTag || fragTag.endsWith(filterTag.replace('mas:', '')),
                    );
                });

                if (!hasAllRequiredTags) return false;
            }

            if (createdByUsernames.length > 0) {
                const fragmentCreatedBy = fragment.created?.by;
                if (!fragmentCreatedBy || !createdByUsernames.includes(fragmentCreatedBy)) {
                    return false;
                }
            }

            if (this.searchQuery) {
                const title = (fragment.title || '').toLowerCase();
                const label = (fragment.getFieldValue('label') || '').toLowerCase();
                return title.includes(this.searchQuery) || label.includes(this.searchQuery);
            }

            return true;
        });

        console.log('[Card Selection Dialog] Filter results:', {
            filteredCount: filtered.length,
            sampleFragments: filtered.slice(0, 3).map((fs) => {
                const f = fs.get();
                return {
                    id: f.id,
                    title: f.title,
                    variant: f.getFieldValue('variant'),
                    modelPath: f.model?.path,
                    tags: f.tags?.map((t) => t.id || t),
                };
            }),
        });

        return filtered;
    }

    renderFilterBar() {
        return html`
            <div class="filter-bar">
                <div class="filter-controls">
                    <sp-search
                        label="Search cards"
                        placeholder="Search by title or label..."
                        @input=${this.handleSearchInput}
                        value=${this.searchQuery}
                    ></sp-search>

                    <sp-action-menu
                        selects="single"
                        value="${this.viewMode}"
                        placement="bottom"
                        @change=${this.handleViewModeChange}
                    >
                        <sp-menu-item value="render">
                            <sp-icon-view-card slot="icon"></sp-icon-view-card>
                            Card view
                        </sp-menu-item>
                        <sp-menu-item value="table">
                            <sp-icon-table slot="icon"></sp-icon-table>
                            Table view
                        </sp-menu-item>
                    </sp-action-menu>
                </div>

                <mas-filter-panel></mas-filter-panel>
            </div>
        `;
    }

    get tableView() {
        const filtered = this.filteredFragments;

        return html`<sp-table
            emphasized
            scroller
            selects="multiple"
            selected=${JSON.stringify(this.selection.value)}
            @change=${this.updateTableSelection}
        >
            <sp-table-head>
                <sp-table-head-cell sortable class="name">Path</sp-table-head-cell>
                <sp-table-head-cell sortable class="title">Title</sp-table-head-cell>
                <sp-table-head-cell sortable class="offer-type">Offer type</sp-table-head-cell>
                <sp-table-head-cell sortable class="price">Price</sp-table-head-cell>
                <sp-table-head-cell sortable class="offer-id">Offer ID</sp-table-head-cell>
                <sp-table-head-cell sortable class="status">Status</sp-table-head-cell>
                <sp-table-head-cell class="preview"></sp-table-head-cell>
            </sp-table-head>
            <sp-table-body>
                ${repeat(
                    filtered,
                    (fragmentStore) => fragmentStore.id,
                    (fragmentStore) => html`<mas-fragment .fragmentStore=${fragmentStore} view="table"></mas-fragment>`,
                )}
            </sp-table-body>
        </sp-table>`;
    }

    renderCardGrid() {
        if (this.viewMode === 'table' && !this.preloadedFragments) {
            return this.tableView;
        }

        const filtered = this.filteredFragments;

        if (this.fragmentsLoading.value && filtered.length === 0 && !this.preloadedFragments) {
            return html`
                <div class="loading-state">
                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                    <p>Loading cards...</p>
                </div>
            `;
        }

        if (filtered.length === 0) {
            return html`
                <div class="empty-state">
                    <sp-icon-view-grid></sp-icon-view-grid>
                    <h3>No cards found</h3>
                    <p>Try adjusting your${this.preloadedFragments ? '' : ' filters or'} search query.</p>
                </div>
            `;
        }

        const displayedCards = filtered.slice(0, this.displayCount);
        const hasMore = this.displayCount < filtered.length;
        const isViewOnly = this.mode === 'view-only';

        if (this.preloadedFragments) {
            return html`
                <div class="card-grid">
                    ${displayedCards.map(
                        (fragment) => html`
                            <div class="card-wrapper view-only">
                                <div class="status-badge ${fragment.status?.toLowerCase() || 'draft'}">
                                    ${fragment.status || 'Draft'}
                                </div>

                                <merch-card>
                                    <aem-fragment author fragment="${fragment.id}"></aem-fragment>
                                </merch-card>

                                <div class="card-metadata">
                                    <sp-badge variant="info" size="s">
                                        ${fragment.tags?.find((t) => t.id.includes('variant/'))
                                            ? fragment.tags
                                                  .find((t) => t.id.includes('variant/'))
                                                  .id.split('/')
                                                  .pop()
                                            : 'N/A'}
                                    </sp-badge>
                                    <div class="card-title" title="${fragment.title}">${fragment.title}</div>
                                </div>

                                <div class="card-actions-overlay">
                                    <sp-button size="s" variant="accent" @click=${() => this.handleOpenCard(fragment)}>
                                        <sp-icon-edit slot="icon"></sp-icon-edit>
                                        Open in Editor
                                    </sp-button>
                                </div>
                            </div>
                        `,
                    )}
                    ${hasMore
                        ? html`
                              <div class="loading-more">
                                  <sp-progress-circle indeterminate size="m"></sp-progress-circle>
                              </div>
                          `
                        : ''}
                </div>
            `;
        }

        return html`
            <div class="card-grid">
                ${repeat(
                    displayedCards,
                    (fragmentStore) => fragmentStore.id,
                    (fragmentStore) => {
                        const fragment = fragmentStore.previewStore.get();
                        const fullFragment = fragmentStore.get();
                        const isSelected = this.selection.value.includes(fragmentStore.id);
                        const status = fullFragment?.status?.toLowerCase() || 'draft';
                        const variant = fullFragment?.variant || fullFragment?.getFieldValue?.('variant') || 'N/A';
                        const title = fullFragment?.title || 'Untitled';
                        const osi = fullFragment?.getFieldValue?.('osi') || '';

                        return html`
                            <div
                                class="card-wrapper ${isSelected ? 'selected' : ''} ${isViewOnly ? 'view-only' : ''}"
                                @click=${() => (isViewOnly ? null : this.handleCardClick(fragmentStore))}
                            >
                                <div class="status-badge ${status}">${fullFragment?.status || 'Draft'}</div>

                                ${!isViewOnly
                                    ? html`
                                          <div
                                              class="selection-overlay ${isSelected ? 'selected' : ''}"
                                              @click=${(e) => {
                                                  e.stopPropagation();
                                                  this.handleCardClick(fragmentStore);
                                              }}
                                          >
                                              ${isSelected
                                                  ? html`<sp-icon-checkmark-circle size="s"></sp-icon-checkmark-circle>`
                                                  : html`<sp-icon-add-circle size="s"></sp-icon-add-circle>`}
                                          </div>
                                      `
                                    : ''}

                                <merch-card>
                                    <aem-fragment author fragment="${fragment.id}"></aem-fragment>
                                </merch-card>

                                <div class="card-metadata">
                                    <sp-badge variant="info" size="s">${variant}</sp-badge>
                                    <div class="card-title" title="${title}">${title}</div>
                                    ${osi ? html`<div class="card-osi">OSI: ${osi}</div>` : ''}
                                </div>

                                ${isViewOnly
                                    ? html`
                                          <div class="card-actions-overlay">
                                              <sp-button
                                                  size="s"
                                                  variant="accent"
                                                  @click=${() => this.handleOpenCard(fullFragment)}
                                              >
                                                  <sp-icon-edit slot="icon"></sp-icon-edit>
                                                  Open in Editor
                                              </sp-button>
                                          </div>
                                      `
                                    : ''}
                            </div>
                        `;
                    },
                )}
                ${hasMore
                    ? html`
                          <div class="loading-more">
                              <sp-progress-circle indeterminate size="m"></sp-progress-circle>
                          </div>
                      `
                    : ''}
            </div>
        `;
    }

    renderFooter() {
        if (this.mode === 'view-only') {
            return html`
                <div class="dialog-footer">
                    <div class="action-buttons">
                        <sp-button variant="secondary" @click=${this.handleCancel}>Close</sp-button>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="dialog-footer">
                <div class="selection-info">
                    <sp-icon-selection-checked size="s"></sp-icon-selection-checked>
                    <span>${this.selectionCount} card${this.selectionCount !== 1 ? 's' : ''} selected</span>
                </div>

                <div class="action-buttons">
                    <sp-button variant="secondary" @click=${this.handleCancel}>Cancel</sp-button>
                    <sp-button variant="accent" @click=${this.handleConfirm} ?disabled=${this.selectionCount === 0}>
                        Select Cards
                    </sp-button>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <style>
                mas-card-selection-dialog {
                    --dialog-padding: 24px;
                    --filter-gap: 16px;
                }

                mas-card-selection-dialog sp-dialog-wrapper sp-dialog {
                    height: 100vh;
                    width: 100vw;
                    max-width: none;
                    overflow: hidden;
                }

                mas-card-selection-dialog .close-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    background: var(--spectrum-global-color-gray-50);
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }

                mas-card-selection-dialog .close-button:hover {
                    background: var(--spectrum-global-color-gray-200);
                }

                mas-card-selection-dialog .dialog-content {
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 160px);
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                }

                mas-card-selection-dialog .filter-bar {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spectrum-global-dimension-size-200);
                    padding: var(--spectrum-global-dimension-size-300);
                    border-bottom: 1px solid var(--spectrum-gray-200);
                    flex: 0 0 auto;
                }

                mas-card-selection-dialog .filter-controls {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                mas-card-selection-dialog sp-search {
                    flex: 1 1 auto;
                    min-width: 250px;
                    max-width: 400px;
                }

                mas-card-selection-dialog .filter-controls sp-action-menu {
                    flex: 0 0 auto;
                    margin-left: auto;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel {
                    width: 100%;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel #filters > sp-icon {
                    display: none !important;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel aem-tag-picker-field,
                mas-card-selection-dialog .filter-bar mas-filter-panel mas-locale-picker,
                mas-card-selection-dialog .filter-bar mas-filter-panel mas-user-picker {
                    min-width: 160px;
                    flex: 0 0 auto;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel sp-action-button {
                    flex: 0 0 auto;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel sp-tags {
                    width: 100%;
                    margin-top: var(--spectrum-global-dimension-size-100);
                    display: flex;
                    gap: var(--spectrum-global-dimension-size-100);
                    flex-wrap: wrap;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel sp-tags:empty {
                    display: none;
                }

                mas-card-selection-dialog .card-grid {
                    flex: 1 1 auto;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 32px 48px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    grid-auto-rows: min-content;
                    gap: 24px;
                    grid-auto-flow: row;
                    width: 100%;
                    box-sizing: border-box;
                }

                @media (max-width: 1400px) {
                    mas-card-selection-dialog .card-grid {
                        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    }
                }

                @media (max-width: 1000px) {
                    mas-card-selection-dialog .card-grid {
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    }
                }

                mas-card-selection-dialog .loading-more {
                    display: flex;
                    justify-content: center;
                    padding: 20px;
                    grid-column: 1 / -1;
                }

                mas-card-selection-dialog .status-badge {
                    position: absolute;
                    top: 12px;
                    left: 12px;
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    transition: all 0.2s ease;
                }

                mas-card-selection-dialog .status-badge.published {
                    background: #2d9d78;
                    color: white;
                }

                mas-card-selection-dialog .status-badge.draft {
                    background: #f5a623;
                    color: white;
                }

                mas-card-selection-dialog .status-badge.modified {
                    background: #4a90e2;
                    color: white;
                }

                mas-card-selection-dialog .status-badge.archived {
                    background: #95a5a6;
                    color: white;
                }

                mas-card-selection-dialog .card-wrapper:hover .status-badge {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                }

                mas-card-selection-dialog .card-wrapper {
                    position: relative;
                    border-radius: 12px;
                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    min-height: 400px;
                    overflow: hidden;
                    contain: layout;
                }

                mas-card-selection-dialog .card-wrapper merch-card {
                    flex: 1;
                }

                mas-card-selection-dialog .card-metadata {
                    padding: 12px 8px 8px 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    background: var(--spectrum-global-color-gray-50);
                    border-radius: 0 0 12px 12px;
                    margin-top: -4px;
                }

                mas-card-selection-dialog .card-metadata sp-badge {
                    align-self: flex-start;
                    text-transform: capitalize;
                }

                mas-card-selection-dialog .card-metadata .card-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--spectrum-global-color-gray-800);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    line-height: 1.4;
                }

                mas-card-selection-dialog .card-metadata .card-osi {
                    font-size: 11px;
                    color: var(--spectrum-global-color-gray-600);
                    font-family: monospace;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                mas-card-selection-dialog .card-wrapper:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                }

                mas-card-selection-dialog .card-wrapper.selected {
                    border: 1px solid var(--spectrum-accent-color-900);
                    border-radius: 12px;
                    padding: 12px;
                }

                mas-card-selection-dialog .card-wrapper.selected::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(20, 115, 230, 0.08);
                    pointer-events: none;
                    z-index: 1;
                }

                mas-card-selection-dialog .selection-overlay {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 32px;
                    height: 32px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s ease;
                }

                mas-card-selection-dialog .selection-overlay:hover {
                    transform: scale(1.15);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                }

                mas-card-selection-dialog .selection-overlay.selected {
                    background: var(--spectrum-accent-color-900);
                    color: white;
                }

                mas-card-selection-dialog .card-actions-overlay {
                    position: absolute;
                    bottom: 60px;
                    left: 50%;
                    transform: translateX(-50%);
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    z-index: 20;
                }

                mas-card-selection-dialog .card-wrapper.view-only:hover .card-actions-overlay {
                    opacity: 1;
                }

                mas-card-selection-dialog .card-wrapper.view-only {
                    cursor: default;
                }

                mas-card-selection-dialog .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    padding: 80px 40px;
                    min-height: 400px;
                }

                mas-card-selection-dialog .loading-state p {
                    font-size: 16px;
                    color: var(--spectrum-global-color-gray-700);
                    margin: 0;
                }

                mas-card-selection-dialog .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 40px;
                    min-height: 400px;
                    color: var(--spectrum-global-color-gray-700);
                    text-align: center;
                }

                mas-card-selection-dialog .empty-state sp-icon {
                    width: 80px;
                    height: 80px;
                    margin-bottom: 20px;
                    color: var(--spectrum-global-color-gray-400);
                }

                mas-card-selection-dialog .empty-state h3 {
                    margin: 0 0 8px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--spectrum-global-color-gray-800);
                }

                mas-card-selection-dialog .empty-state p {
                    margin: 0;
                    font-size: 14px;
                    color: var(--spectrum-global-color-gray-600);
                }

                mas-card-selection-dialog sp-table {
                    width: 100%;
                    flex: 1 1 auto;
                    overflow-y: auto;
                    overflow-x: hidden;
                    --table-content-name-flex-grow: 1.6;
                    --table-content-title-flex-grow: 1;
                    --table-content-offer-type-flex-grow: 0.4;
                    --table-content-price-flex-grow: 0.4;
                    --table-content-offer-id-flex-grow: 1.2;
                    --table-content-status-flex-grow: 0.3;
                    --table-content-preview-flex-grow: 0.2;
                }

                mas-card-selection-dialog sp-table sp-table-body {
                    background-color: var(--spectrum-gray-100);
                }

                mas-card-selection-dialog sp-table-cell {
                    display: flex;
                    align-items: center;
                }

                mas-card-selection-dialog sp-table-head-cell.name {
                    flex-grow: var(--table-content-name-flex-grow);
                }

                mas-card-selection-dialog sp-table-head-cell.title {
                    flex-grow: var(--table-content-title-flex-grow);
                }

                mas-card-selection-dialog sp-table-head-cell.offer-type {
                    flex-grow: var(--table-content-offer-type-flex-grow);
                }

                mas-card-selection-dialog sp-table-head-cell.price {
                    flex-grow: var(--table-content-price-flex-grow);
                }

                mas-card-selection-dialog sp-table-head-cell.offer-id {
                    flex-grow: var(--table-content-offer-id-flex-grow);
                }

                mas-card-selection-dialog sp-table-head-cell.status {
                    flex-grow: var(--table-content-status-flex-grow);
                }

                mas-card-selection-dialog sp-table-head-cell.preview {
                    flex-grow: var(--table-content-preview-flex-grow);
                }

                mas-card-selection-dialog sp-table-cell.name {
                    flex-grow: var(--table-content-name-flex-grow);
                }

                mas-card-selection-dialog sp-table-cell.title {
                    flex-grow: var(--table-content-title-flex-grow);
                }

                mas-card-selection-dialog sp-table-cell.offer-type {
                    flex-grow: var(--table-content-offer-type-flex-grow);
                }

                mas-card-selection-dialog sp-table-cell.price {
                    flex-grow: var(--table-content-price-flex-grow);
                }

                mas-card-selection-dialog sp-table-cell.offer-id {
                    flex-grow: var(--table-content-offer-id-flex-grow);
                    word-break: break-all;
                }

                mas-card-selection-dialog sp-table-cell.status {
                    flex-grow: var(--table-content-status-flex-grow);
                }

                mas-card-selection-dialog sp-table-cell.preview {
                    flex-grow: var(--table-content-preview-flex-grow);
                }

                mas-card-selection-dialog .dialog-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 24px;
                    background: var(--spectrum-global-color-gray-50);
                    border-radius: 0;
                    border-top: 1px solid var(--spectrum-global-color-gray-200);
                    flex: 0 0 auto;
                }

                mas-card-selection-dialog .selection-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--spectrum-global-color-gray-800);
                    font-weight: 500;
                    font-size: 14px;
                }

                mas-card-selection-dialog .action-buttons {
                    display: flex;
                    gap: 12px;
                }
            </style>
            <div class="collection-dialog-container">
                <sp-theme system="express" color="light" scale="medium">
                    <sp-dialog-wrapper mode="fullscreen" open underlay dismissable @close=${this.handleCancel}>
                        <h2 slot="headline">${this.mode === 'view-only' ? 'Search Results' : 'Select Cards'}</h2>

                        <sp-action-button quiet class="close-button" @click=${this.handleCancel}>
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-action-button>

                        <div class="dialog-content">
                            ${this.mode === 'view-only' && !this.preloadedFragments ? '' : this.renderFilterBar()}
                            ${this.renderCardGrid()}
                            ${(this.mode === 'view-only' && this.preloadedFragments) ||
                            (this.firstPageLoaded.value && this.fragments.value.length > 0)
                                ? this.renderFooter()
                                : ''}
                        </div>
                    </sp-dialog-wrapper>
                </sp-theme>
            </div>
        `;
    }
}

customElements.define('mas-card-selection-dialog', MasCardSelectionDialog);
