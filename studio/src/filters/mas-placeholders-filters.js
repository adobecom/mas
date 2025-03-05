import { LitElement, html, nothing } from 'lit';

export class MasPlaceholdersFilters extends LitElement {
    static get properties() {
        return {
            isOpen: { type: Boolean },
            selectedFilters: { type: Object },
            availableLocales: { type: Array },
            availableKeys: { type: Array },
        };
    }

    constructor() {
        super();
        this.isOpen = false;
        this.selectedFilters = {
            locale: [],
            key: [],
        };
        this.availableLocales = [
            'Global',
            'India_English',
            'India_Hindi',
            'Germany_English',
            'Germany_German',
            'France_French',
            'France_English',
            'USA_Default',
            'Japan_Japanese',
            'Japan_English',
            'China_Chinese',
            'China_English',
        ];
        this.availableKeys = [
            'Adobe- Creative Cloud All',
            'Adobe-Photoshop',
            'Adobe-Premiere Pro',
            'Adobe-Illustrator',
            'Adobe-After Effects',
            'Adobe-In Design',
            'Adobe-Lightroom',
            'Adobe-Audition',
            'Adobe-Black Friday',
            'Adobe-In Design',
        ];
        this.searchLocale = '';
        this.searchKey = '';
    }

    createRenderRoot() {
        return this;
    }

    open() {
        this.isOpen = true;
        this.requestUpdate();
    }

    close() {
        this.isOpen = false;
        this.requestUpdate();
    }

    handleClickOutside(event) {
        if (
            this.isOpen &&
            !event.target.closest('.filters-modal-content') &&
            !event.target.closest('.filter-button')
        ) {
            this.close();
        }
    }

    handleLocaleSearch(e) {
        this.searchLocale = e.target.value;
        this.requestUpdate();
    }

    handleKeySearch(e) {
        this.searchKey = e.target.value;
        this.requestUpdate();
    }

    toggleFilter(type, value) {
        const index = this.selectedFilters[type].indexOf(value);
        if (index === -1) {
            this.selectedFilters[type] = [...this.selectedFilters[type], value];
        } else {
            this.selectedFilters[type] = this.selectedFilters[type].filter(
                (item) => item !== value,
            );
        }
        this.requestUpdate();
    }

    removeFilter(type, value) {
        this.selectedFilters[type] = this.selectedFilters[type].filter(
            (item) => item !== value,
        );
        this.requestUpdate();
    }

    resetFilters() {
        this.selectedFilters = {
            locale: [],
            key: [],
        };
        this.requestUpdate();
    }

    applyFilters() {
        // Dispatch event with selected filters
        this.dispatchEvent(
            new CustomEvent('filters-applied', {
                detail: {
                    filters: this.selectedFilters,
                },
                bubbles: true,
                composed: true,
            }),
        );
        this.close();
    }

    getFilteredLocales() {
        if (!this.searchLocale) {
            return this.availableLocales;
        }
        const searchTerm = this.searchLocale.toLowerCase();
        return this.availableLocales.filter((locale) =>
            locale.toLowerCase().includes(searchTerm),
        );
    }

    getFilteredKeys() {
        if (!this.searchKey) {
            return this.availableKeys;
        }
        const searchTerm = this.searchKey.toLowerCase();
        return this.availableKeys.filter((key) =>
            key.toLowerCase().includes(searchTerm),
        );
    }

    renderSelectedFilters() {
        const allFilters = [
            ...this.selectedFilters.locale.map((value) => ({
                type: 'locale',
                value,
            })),
            ...this.selectedFilters.key.map((value) => ({
                type: 'key',
                value,
            })),
        ];

        if (allFilters.length === 0) {
            return nothing;
        }

        return html`
            <div class="selected-filters">
                ${allFilters.map(
                    (filter) => html`
                        <div class="filter-tag">
                            <span>${filter.value}</span>
                            <button
                                class="remove-filter"
                                @click=${() =>
                                    this.removeFilter(
                                        filter.type,
                                        filter.value,
                                    )}
                            >
                                <sp-icon-close></sp-icon-close>
                            </button>
                        </div>
                    `,
                )}
                ${allFilters.length > 0
                    ? html`
                          <button class="clear-all" @click=${this.resetFilters}>
                              Clear All
                          </button>
                      `
                    : nothing}
            </div>
        `;
    }

    render() {
        if (!this.isOpen) return nothing;

        const filteredLocales = this.getFilteredLocales();
        const filteredKeys = this.getFilteredKeys();

        return html`
            <div class="filters-modal-overlay">
                <div class="filters-modal">
                    <div class="filters-modal-content">
                        <div class="filters-modal-header">
                            <h2 class="filters-modal-title">Filters</h2>
                            <button class="close-button" @click=${this.close}>
                                <sp-icon-close></sp-icon-close>
                            </button>
                        </div>

                        <div class="filters-modal-body">
                            <div class="filters-columns">
                                <div class="filter-column">
                                    <h3 class="filter-column-title">Locale</h3>
                                    <sp-search
                                        placeholder="Search"
                                        @input=${this.handleLocaleSearch}
                                        value=${this.searchLocale}
                                    ></sp-search>
                                    <div class="filter-options">
                                        ${filteredLocales.map(
                                            (locale) => html`
                                                <div class="filter-option">
                                                    <sp-checkbox
                                                        ?checked=${this.selectedFilters.locale.includes(
                                                            locale,
                                                        )}
                                                        @change=${() =>
                                                            this.toggleFilter(
                                                                'locale',
                                                                locale,
                                                            )}
                                                        >${locale}</sp-checkbox
                                                    >
                                                </div>
                                            `,
                                        )}
                                    </div>
                                </div>

                                <div class="filter-column">
                                    <h3 class="filter-column-title">Key</h3>
                                    <sp-search
                                        placeholder="Search"
                                        @input=${this.handleKeySearch}
                                        value=${this.searchKey}
                                    ></sp-search>
                                    <div class="filter-options">
                                        ${filteredKeys.map(
                                            (key) => html`
                                                <div class="filter-option">
                                                    <sp-checkbox
                                                        ?checked=${this.selectedFilters.key.includes(
                                                            key,
                                                        )}
                                                        @change=${() =>
                                                            this.toggleFilter(
                                                                'key',
                                                                key,
                                                            )}
                                                        >${key}</sp-checkbox
                                                    >
                                                </div>
                                            `,
                                        )}
                                    </div>
                                </div>
                            </div>

                            ${this.renderSelectedFilters()}
                        </div>

                        <div class="filters-modal-footer">
                            <sp-button
                                variant="secondary"
                                @click=${this.resetFilters}
                            >
                                Reset
                            </sp-button>
                            <sp-button
                                variant="accent"
                                @click=${this.applyFilters}
                            >
                                Apply
                            </sp-button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-placeholders-filters', MasPlaceholdersFilters);

// Add styles
const style = document.createElement('style');
style.textContent = `
    .filters-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .filters-modal {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        width: 800px;
        max-width: 90vw;
        max-height: 90vh;
        overflow: auto;
    }
    
    .filters-modal-content {
        padding: 24px;
    }
    
    .filters-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    
    .filters-modal-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
    }
    
    .close-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .filters-modal-body {
        margin-bottom: 24px;
    }
    
    .filters-columns {
        display: flex;
        gap: 24px;
        margin-bottom: 24px;
    }
    
    .filter-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    
    .filter-column-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px 0;
    }
    
    .filter-options {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 300px;
        overflow-y: auto;
        padding-right: 8px;
    }
    
    .filter-option {
        display: flex;
        align-items: center;
    }
    
    .selected-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--spectrum-global-color-gray-200);
    }
    
    .filter-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: var(--spectrum-global-color-gray-100);
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 14px;
    }
    
    .remove-filter {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .remove-filter sp-icon-close {
        width: 12px;
        height: 12px;
    }
    
    .clear-all {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--spectrum-global-color-blue-500);
        font-size: 14px;
        padding: 4px 8px;
    }
    
    .filters-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }
`;
document.head.appendChild(style);
