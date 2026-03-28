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

const CARDS_PER_PAGE = 50;
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
        this.viewMode = 'table';
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
                this.#cachePreloadedFragments();
                this.firstPageLoaded.value = true;
            } else {
                this.loadFragments();
            }
        });
    }

    #cachePreloadedFragments() {
        const AemFragmentElement = customElements.get('aem-fragment');
        if (!AemFragmentElement || !this.preloadedFragments) return;

        this.preloadedFragments.forEach((fragment) => {
            const cacheData = {
                id: fragment.id,
                fields: this.#convertFragmentFields(fragment.fields),
            };
            AemFragmentElement.cache.add(cacheData);
        });
    }

    #convertFragmentFields(fields) {
        if (!fields) return {};

        const isAlreadyFlat = Object.values(fields).every(
            (value) => typeof value !== 'object' || value === null || Array.isArray(value),
        );

        if (isAlreadyFlat) {
            const normalizedFields = { ...fields };
            ['mnemonicIcon', 'mnemonicAlt', 'mnemonicLink'].forEach((key) => {
                if (normalizedFields[key] && !Array.isArray(normalizedFields[key])) {
                    normalizedFields[key] = [normalizedFields[key]];
                }
            });
            return normalizedFields;
        }

        let fieldsObj = fields;
        if (Array.isArray(fields)) {
            fieldsObj = fields.reduce((acc, field) => {
                if (field.name) {
                    acc[field.name] = field;
                }
                return acc;
            }, {});
        }

        return Object.entries(fieldsObj).reduce((acc, [key, field]) => {
            if (field?.value !== undefined) {
                acc[key] = field.value;
            } else if (field?.values !== undefined) {
                acc[key] = field.values.length === 1 ? field.values[0] : field.values;
            } else {
                acc[key] = field;
            }
            return acc;
        }, {});
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
            this.loadFragments();
        });
        this.createdByUsersSubscription = Store.createdByUsers.subscribe(() => {
            this.displayCount = CARDS_PER_PAGE;
            this.loadFragments();
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
        const fragmentsMap = new Map(this.filteredFragments.map((f) => [f.id, f]));

        const selectedCards = selectedIds.map((id) => {
            const fragmentStore = fragmentsMap.get(id);
            const fragment = fragmentStore?.get?.();
            const osi = fragment?.getFieldValue?.('osi') || null;
            return { id, osi };
        });

        this.cleanup();
        this.resolver(selectedCards);
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

        const filtered = this.fragments.value.filter((fragmentStore) => {
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
                <div class="filter-header">
                    <sp-search
                        size="m"
                        placeholder="Search by title or label..."
                        @input=${this.handleSearchInput}
                        @submit=${(e) => e.preventDefault()}
                        value=${this.searchQuery}
                        class="search-field"
                    ></sp-search>

                    <div class="filter-header-actions">
                        <div class="view-toggle">
                            <button
                                class="view-btn ${this.viewMode === 'render' ? 'active' : ''}"
                                @click=${() => {
                                    this.viewMode = 'render';
                                    this.displayCount = 10;
                                }}
                                title="Card view"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                                    <rect x="1" y="1" width="7" height="7" rx="1" />
                                    <rect x="10" y="1" width="7" height="7" rx="1" />
                                    <rect x="1" y="10" width="7" height="7" rx="1" />
                                    <rect x="10" y="10" width="7" height="7" rx="1" />
                                </svg>
                            </button>
                            <button
                                class="view-btn ${this.viewMode === 'table' ? 'active' : ''}"
                                @click=${() => {
                                    this.viewMode = 'table';
                                    this.displayCount = 10;
                                }}
                                title="Table view"
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                                    <rect x="1" y="2" width="16" height="2" rx="0.5" />
                                    <rect x="1" y="8" width="16" height="2" rx="0.5" />
                                    <rect x="1" y="14" width="16" height="2" rx="0.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <mas-filter-panel></mas-filter-panel>
            </div>
        `;
    }

    getFragmentPath(fragment) {
        const parts = fragment.path?.split('/') || [];
        const damIndex = parts.indexOf('mas');
        if (damIndex === -1) return fragment.path || '';
        const relevant = parts.slice(damIndex);
        const modelLabel = fragment.model?.path?.includes('collection') ? 'collection' : 'merch-card';
        return `${modelLabel}: ${relevant.join(' / ')}`;
    }

    get tableView() {
        const filtered = this.filteredFragments;

        return html`<sp-table emphasized scroller>
            <sp-table-head>
                <sp-table-head-cell class="expand-cell"></sp-table-head-cell>
                <sp-table-head-cell sortable class="name">Path</sp-table-head-cell>
                <sp-table-head-cell sortable class="title">Title</sp-table-head-cell>
                <sp-table-head-cell sortable class="offer-type">Offer Type</sp-table-head-cell>
                <sp-table-head-cell sortable class="last-modified-by">Modified By</sp-table-head-cell>
                <sp-table-head-cell sortable class="status">Status</sp-table-head-cell>
            </sp-table-head>
            <sp-table-body>
                ${repeat(
                    filtered,
                    (fragmentStore) => fragmentStore.id,
                    (fragmentStore) => {
                        const data = fragmentStore.get();
                        const isSelected = this.selection.value.includes(fragmentStore.id);
                        return html`<sp-table-row
                            value="${data.id}"
                            class="${isSelected ? 'selected' : ''}"
                            @click=${() => this.handleCardClick(fragmentStore)}
                        >
                            <sp-table-cell class="expand-cell">
                                <sp-checkbox
                                    ?checked=${isSelected}
                                    @click=${(e) => e.stopPropagation()}
                                    @change=${() => this.handleCardClick(fragmentStore)}
                                ></sp-checkbox>
                            </sp-table-cell>
                            <sp-table-cell class="name">${this.getFragmentPath(data)}</sp-table-cell>
                            <sp-table-cell class="title">${data.title}</sp-table-cell>
                            <sp-table-cell class="offer-type">${data.getFieldValue?.('offerType') || ''}</sp-table-cell>
                            <sp-table-cell class="last-modified-by">${data.modified?.by || ''}</sp-table-cell>
                            <sp-table-cell class="status">
                                <div class="status-dot"></div>
                                <span>${data.status || 'DRAFT'}</span>
                            </sp-table-cell>
                        </sp-table-row>`;
                    },
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
                    ${displayedCards.map((fragment) => {
                        const isCollection = fragment.model?.path === '/conf/mas/settings/dam/cfm/models/collection';

                        return html`
                            <div class="card-wrapper view-only ${isCollection ? 'collection-item' : ''}">
                                <div class="status-badge ${fragment.status?.toLowerCase() || 'draft'}">
                                    ${fragment.status || 'Draft'}
                                </div>

                                ${isCollection
                                    ? html`
                                          <merch-card-collection class="collection-preview">
                                              <aem-fragment fragment="${fragment.id}"></aem-fragment>
                                          </merch-card-collection>
                                      `
                                    : html`
                                          <div class="card-preview-container">
                                              <merch-card>
                                                  <aem-fragment author fragment="${fragment.id}"></aem-fragment>
                                              </merch-card>
                                          </div>
                                      `}

                                <div class="card-metadata">
                                    <sp-badge variant="info" size="s">
                                        ${isCollection
                                            ? 'Collection'
                                            : fragment.tags?.find((t) => t.id.includes('variant/'))
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
                        `;
                    })}
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
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 999;
                    display: block;
                }

                mas-card-selection-dialog sp-theme {
                    background-color: transparent;
                }

                mas-card-selection-dialog .dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.6);
                    z-index: 999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                mas-card-selection-dialog .dialog-panel {
                    background: var(--spectrum-gray-50, #fff);
                    border-radius: 20px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
                    width: 90vw;
                    height: 88vh;
                    max-width: 1400px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    z-index: 1000;
                }

                mas-card-selection-dialog .dialog-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 28px;
                    border-bottom: 1px solid var(--spectrum-gray-200);
                    flex-shrink: 0;
                }

                mas-card-selection-dialog .dialog-title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--spectrum-gray-900);
                    letter-spacing: -0.01em;
                }

                mas-card-selection-dialog .dialog-header .close-button {
                    background: transparent;
                    border: none;
                }

                mas-card-selection-dialog .dialog-body {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    overflow: hidden;
                }

                mas-card-selection-dialog .filter-bar {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 12px 28px 8px;
                    flex-shrink: 0;
                    background: transparent;
                }

                mas-card-selection-dialog .filter-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-wrap: nowrap;
                }

                mas-card-selection-dialog .search-field {
                    flex: 0 1 300px;
                    min-width: 200px;
                    max-width: 350px;
                }

                mas-card-selection-dialog .filter-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-shrink: 0;
                }

                mas-card-selection-dialog .view-toggle {
                    display: flex;
                    border: 1px solid var(--spectrum-gray-300);
                    border-radius: 4px;
                    overflow: hidden;
                    background: var(--spectrum-gray-100);
                }

                mas-card-selection-dialog .view-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    color: var(--spectrum-gray-700);
                    transition:
                        background 0.15s ease,
                        color 0.15s ease;
                }

                mas-card-selection-dialog .view-btn:hover {
                    background: var(--spectrum-gray-200);
                }

                mas-card-selection-dialog .view-btn.active {
                    background: var(--spectrum-accent-color-500);
                    color: white;
                }

                mas-card-selection-dialog .view-btn svg {
                    width: 18px;
                    height: 18px;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel {
                    width: 100%;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel #filters {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel #filters > sp-icon {
                    display: none !important;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel aem-tag-picker-field,
                mas-card-selection-dialog .filter-bar mas-filter-panel mas-locale-picker,
                mas-card-selection-dialog .filter-bar mas-filter-panel mas-user-picker {
                    min-width: 140px;
                    max-width: 200px;
                    flex: 0 1 auto;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel sp-action-button {
                    flex: 0 0 auto;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel sp-tags {
                    width: 100%;
                    margin-top: 8px;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                mas-card-selection-dialog .filter-bar mas-filter-panel sp-tags:empty {
                    display: none;
                }

                mas-card-selection-dialog .card-grid {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 24px;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    grid-auto-rows: min-content;
                    gap: 16px;
                    grid-auto-flow: row;
                    width: 100%;
                    box-sizing: border-box;
                    background: var(--spectrum-gray-50);
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
                    display: none;
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
                    border-radius: 8px;
                    border: 1px solid var(--spectrum-gray-200);
                    background: var(--spectrum-gray-50, #fff);
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    overflow: hidden;
                    transition:
                        border-color 0.15s ease,
                        box-shadow 0.15s ease;
                }

                mas-card-selection-dialog .card-wrapper .card-preview-container {
                    height: 200px;
                    overflow: hidden;
                    position: relative;
                    pointer-events: none;
                }

                mas-card-selection-dialog .card-wrapper merch-card {
                    position: absolute;
                    top: 4px;
                    left: 50%;
                    transform: translateX(-50%) scale(0.45);
                    transform-origin: top center;
                    width: 302px;
                }

                mas-card-selection-dialog .card-metadata {
                    padding: 8px 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    border-top: 1px solid var(--spectrum-gray-200);
                    background: var(--spectrum-gray-75);
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
                    border-color: var(--spectrum-gray-400);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                mas-card-selection-dialog .card-wrapper.selected {
                    border-color: var(--spectrum-accent-color-900);
                    box-shadow: 0 0 0 1px var(--spectrum-accent-color-900);
                }

                mas-card-selection-dialog .selection-overlay {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 28px;
                    height: 28px;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.15s ease;
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

                mas-card-selection-dialog .card-wrapper.collection-item {
                    min-height: auto;
                }

                mas-card-selection-dialog .card-wrapper.collection-item merch-card-collection {
                    display: block;
                    width: 100%;
                }

                mas-card-selection-dialog .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 20px;
                    flex: 1;
                    padding: 40px;
                    background: var(--spectrum-gray-100, #f5f5f5);
                }

                mas-card-selection-dialog .loading-state p {
                    font-size: 16px;
                    color: var(--spectrum-gray-700);
                    margin: 0;
                }

                mas-card-selection-dialog .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                    padding: 40px;
                    color: var(--spectrum-gray-700);
                    text-align: center;
                    background: var(--spectrum-gray-100, #f5f5f5);
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
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: auto;
                    background: var(--spectrum-gray-50);
                    --spectrum-table-cell-background-color: transparent;
                }

                mas-card-selection-dialog sp-table sp-table-body {
                    background-color: transparent;
                }

                mas-card-selection-dialog sp-table-row {
                    border-bottom: 1px solid var(--spectrum-gray-100);
                    cursor: pointer;
                }

                mas-card-selection-dialog sp-table-row:hover {
                    background-color: var(--spectrum-gray-100);
                }

                mas-card-selection-dialog sp-table-row.selected {
                    background-color: var(--spectrum-blue-100, #e8f0fe);
                }

                mas-card-selection-dialog sp-table-head-cell {
                    background-color: var(--spectrum-gray-75);
                }

                mas-card-selection-dialog sp-table-cell,
                mas-card-selection-dialog sp-table-head-cell {
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                mas-card-selection-dialog .expand-cell {
                    flex: 0 0 40px;
                    min-width: 40px;
                }

                mas-card-selection-dialog .name {
                    flex: 1.5;
                    min-width: 120px;
                }

                mas-card-selection-dialog .title {
                    flex: 1.8;
                    min-width: 120px;
                }

                mas-card-selection-dialog .offer-id {
                    flex: 1;
                    min-width: 80px;
                }

                mas-card-selection-dialog .offer-type {
                    flex: 0.8;
                    min-width: 80px;
                }

                mas-card-selection-dialog .last-modified-by {
                    flex: 1.2;
                    min-width: 100px;
                }

                mas-card-selection-dialog .price {
                    flex: 0.8;
                    min-width: 80px;
                }

                mas-card-selection-dialog .status {
                    flex: 0.6;
                    min-width: 80px;
                }

                mas-card-selection-dialog .actions {
                    flex: 0 0 50px;
                    min-width: 50px;
                }

                mas-card-selection-dialog .preview {
                    flex: 0 0 50px;
                    min-width: 50px;
                }

                mas-card-selection-dialog .dialog-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 28px;
                    background: var(--spectrum-gray-75);
                    border-top: 1px solid var(--spectrum-gray-200);
                    flex-shrink: 0;
                    border-radius: 0 0 20px 20px;
                }

                mas-card-selection-dialog .selection-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--spectrum-global-color-gray-700);
                    font-weight: 400;
                    font-size: 13px;
                }

                mas-card-selection-dialog .action-buttons {
                    display: flex;
                    gap: 12px;
                }
            </style>
            <div class="dialog-overlay">
                <sp-theme system="spectrum-two" color="light" scale="medium">
                    <div class="dialog-panel">
                        <header class="dialog-header">
                            <h2 class="dialog-title">
                                ${this.mode === 'view-only' ? 'Search Results' : 'Select Cards for Context'}
                            </h2>
                            <sp-action-button quiet class="close-button" @click=${this.handleCancel}>
                                <sp-icon-close slot="icon"></sp-icon-close>
                            </sp-action-button>
                        </header>

                        <div class="dialog-body">
                            ${this.mode === 'view-only' && !this.preloadedFragments ? '' : this.renderFilterBar()}
                            ${this.renderCardGrid()}
                        </div>

                        ${(this.mode === 'view-only' && this.preloadedFragments) ||
                        (this.firstPageLoaded.value && this.fragments.value.length > 0)
                            ? this.renderFooter()
                            : ''}
                    </div>
                </sp-theme>
            </div>
        `;
    }
}

customElements.define('mas-card-selection-dialog', MasCardSelectionDialog);
