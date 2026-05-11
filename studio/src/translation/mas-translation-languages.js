import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-translation-languages.css.js';
import Store from '../store.js';
import { getSurfaceLocales, getLocaleCode, REGION_GROUPS } from '../locales.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasTranslationLanguages extends LitElement {
    static styles = styles;

    static properties = {
        localesArray: { type: Array, state: true },
        targetStore: { type: Object },
        searchQuery: { type: String, state: true },
        includeSource: { type: Boolean, attribute: 'include-source' },
    };

    constructor() {
        super();
        this.targetStore = Store.translationProjects;
        this.searchQuery = '';
        this.includeSource = false;
    }

    connectedCallback() {
        super.connectedCallback();
        const surface = Store.search.value.path;
        const all = getSurfaceLocales(surface).map((item) => ({ ...item, locale: getLocaleCode(item) }));
        const filtered = this.includeSource ? all : all.filter((item) => item.locale !== 'en_US');
        this.localesArray = filtered.sort((a, b) => a.locale.localeCompare(b.locale));
        this.targetLocalesController = new ReactiveController(this, [this.targetStore?.targetLocales].filter(Boolean));
    }

    get selectedLocales() {
        return this.targetStore.targetLocales.value;
    }

    get filteredLocales() {
        if (!this.searchQuery) return this.localesArray;
        const q = this.searchQuery.toLowerCase();
        return this.localesArray.filter((item) => item.locale.toLowerCase().includes(q));
    }

    get selectAllChecked() {
        return this.selectedLocales.length === this.localesArray.length;
    }

    get selectAllIndeterminate() {
        return this.selectedLocales.length > 0 && this.selectedLocales.length < this.localesArray.length;
    }

    get numberOfLocales() {
        const count = this.selectedLocales.length;
        if (count) return `${count} ${count === 1 ? 'language' : 'languages'} selected`;
        return `${this.localesArray.length} languages`;
    }

    get groupedLocales() {
        const { filteredLocales } = this;
        const groups = [];
        for (const region of REGION_GROUPS) {
            const locales = filteredLocales.filter((item) => region.countries.includes(item.country));
            if (locales.length) groups.push({ name: region.name, locales });
        }
        const grouped = new Set(groups.flatMap((group) => group.locales));
        const other = filteredLocales.filter((item) => !grouped.has(item));
        if (other.length) groups.push({ name: 'Other', locales: other });
        return groups;
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
    }

    selectAll(e) {
        const next = e.target.checked ? this.localesArray.map((item) => item.locale) : [];
        this.targetStore.targetLocales.set(next);
    }

    toggleRegion(regionLocales, e) {
        const regionCodes = regionLocales.map((item) => item.locale);
        const allSelected = regionCodes.every((code) => this.selectedLocales.includes(code));
        if (allSelected || e.target.indeterminate) {
            this.targetStore.targetLocales.set(this.selectedLocales.filter((code) => !regionCodes.includes(code)));
        } else {
            this.targetStore.targetLocales.set([...new Set([...this.selectedLocales, ...regionCodes])]);
        }
    }

    toggleLocale(e) {
        e.stopPropagation();
        const locale = e.target.textContent.trim();
        if (e.target.checked) {
            this.targetStore.targetLocales.set([...this.selectedLocales, locale]);
        } else {
            this.targetStore.targetLocales.set(this.selectedLocales.filter((l) => l !== locale));
        }
    }

    isRegionAllSelected(locales) {
        return locales.every((item) => this.selectedLocales.includes(item.locale));
    }

    isRegionIndeterminate(locales) {
        const codes = locales.map((item) => item.locale);
        const selected = codes.filter((code) => this.selectedLocales.includes(code));
        return selected.length > 0 && selected.length < codes.length;
    }

    renderLocaleGrid(locales) {
        const columns = 4;
        const colSize = Math.ceil(locales.length / columns);
        const cols = Array.from({ length: columns }, (_, i) => locales.slice(i * colSize, (i + 1) * colSize));
        return html`
            <div class="locale-grid">
                ${cols.map(
                    (col) => html`
                        <div class="locale-col">
                            ${col.map(
                                (item) => html`
                                    <sp-checkbox
                                        ?checked=${this.selectedLocales.includes(item.locale)}
                                        @change=${this.toggleLocale}
                                    >
                                        ${item.locale}
                                    </sp-checkbox>
                                `,
                            )}
                        </div>
                    `,
                )}
            </div>
        `;
    }

    renderRegion(group) {
        const allSelected = this.isRegionAllSelected(group.locales);
        const indeterminate = this.isRegionIndeterminate(group.locales);
        return html`
            <div class="region-card">
                <div class="region-header">
                    <sp-checkbox
                        ?checked=${allSelected}
                        ?indeterminate=${indeterminate}
                        @change=${(e) => this.toggleRegion(group.locales, e)}
                    ></sp-checkbox>
                    <span class="region-name">${group.name}</span>
                </div>
                ${this.renderLocaleGrid(group.locales)}
            </div>
        `;
    }

    render() {
        return html`
            <div class="select-lang-content">
                <div class="sticky-header">
                    <sp-search
                        placeholder="Search locale"
                        .value=${this.searchQuery}
                        @input=${this.handleSearch}
                        @change=${this.handleSearch}
                    ></sp-search>
                    <div class="select-all-row">
                        <sp-checkbox
                            ?checked=${this.selectAllChecked}
                            ?indeterminate=${this.selectAllIndeterminate}
                            @change=${this.selectAll}
                        >
                            Select all
                        </sp-checkbox>
                        <span class="locale-count">${this.numberOfLocales}</span>
                    </div>
                    <sp-divider size="s"></sp-divider>
                </div>
                <div class="regions">
                    ${this.groupedLocales.map((group) => this.renderRegion(group))}
                    ${this.groupedLocales.length === 0
                        ? html`<p class="no-results">No locales match your search.</p>`
                        : nothing}
                </div>
            </div>
        `;
    }
}

customElements.define('mas-translation-languages', MasTranslationLanguages);
