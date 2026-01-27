import { html, css, LitElement } from 'lit';
import Store from './store.js';
import {
    getDefaultLocales,
    getRegionLocales,
    getDefaultLocale,
    getLanguageName,
    getLocaleCode,
    getCountryName,
    getCountryFlag,
} from '../../io/www/src/fragment/locales.js';

export class MasLocalePicker extends LitElement {
    static properties = {
        disabled: { type: Boolean },
        displayMode: { type: String }, // can be 'strong' or 'light' which is default
        label: { type: String },
        locale: { type: String },
        mode: { type: String }, //can be 'region' or 'language'
        searchDisabled: { type: Boolean },
        searchPlaceholder: { type: String },
        searchQuery: { type: String },
        surface: { type: String },
    };

    static styles = css`
        sp-label {
            font-weight: 600;
            padding-right: 8px;
            vertical-align: middle;
        }

        sp-action-menu > .locale-label {
            font-weight: bold;
        }

        .chevron {
            vertical-align: middle;
            margin-left: 6px;
            margin-top: -3px;
        }

        :host(.strong) {
            --mod-actionbutton-min-width: auto;
            --mod-actionbutton-background-color-default: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-background-color-hover: var(--spectrum-gray-900, #1e1e1e);
            --mod-actionbutton-background-color-down: var(--spectrum-gray-900, #1e1e1e);
            --mod-actionbutton-background-color-focus: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-border-color-default: transparent;
            --mod-actionbutton-border-color-hover: transparent;
            --mod-actionbutton-border-color-down: transparent;
            --mod-actionbutton-border-color-focus: transparent;
            --mod-actionbutton-content-color-default: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-hover: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-down: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-focus: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-border-radius: 16px;
            --spectrum-actionbutton-height: 32px;
            --spectrum-actionbutton-min-width: auto;
        }

        .strong [slot='label'].locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--spectrum-gray-50, #ffffff);
            font-weight: 700;
            font-size: 14px;
            font-family: 'Adobe Clean', sans-serif;
        }

        .strong sp-menu-item .locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        :host([disabled]) {
            --mod-actionbutton-background-color-disabled: var(--spectrum-gray-50, #f6f6f6);
            --mod-actionbutton-content-color-disabled: var(--spectrum-gray-600, #919191);
        }

        .flag {
            font-size: 18px;
            line-height: 1;
        }

        sp-menu {
            padding-top: 20px;
        }

        sp-search {
            display: block;
            margin-left: auto;
            margin-right: auto;
            padding-bottom: 12px;
            width: 80%;
        }

        sp-search {
            --mod-search-border-color-default: var(--spectrum-gray-400, #a9a9a9ff);
            --mod-search-border-radius: 16px;
            --mod-search-border-width: 2px;
        }

        sp-search:focus {
            --spectrum-focus-indicator-color: transparent;
        }
    `;

    constructor() {
        super();
        this.searchQuery = '';
    }

    get lang() {
        return this.locale.split('_')[0];
    }

    connectedCallback() {
        super.connectedCallback();
        this.displayMode ??= 'default';
        this.locale ??= 'en_US';
        this.mode ??= 'language';
        this.searchDisabled = this.searchDisabled ?? false;
        this.searchPlaceholder ??= 'Search language';
        this.surface ??= 'nala';
        if (this.displayMode === 'strong') {
            this.classList.add('strong');
        }
        this.searchSubscriptions = Store.filters.subscribe(() => {
            this.locale = Store.localeOrRegion();
            this.render();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.searchSubscriptions) {
            this.searchSubscriptions.unsubscribe();
        }
    }

    handleLocaleChange(locale) {
        this.locale = locale;
        this.dispatchEvent(
            new CustomEvent('locale-changed', {
                detail: { locale },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleSearchInput(e) {
        this.searchQuery = e.target.value.toLowerCase();
    }

    handleSearchFieldClick(e) {
        // Keep focus on search field, don't let click bubble to menu-item
        e.stopPropagation();
    }

    handleMenuOpen() {
        this.updateComplete.then(() => {
            const search = this.shadowRoot.querySelector('sp-search');
            if (search) {
                search.focus();
            }
        });
    }

    getLocales() {
        if (this.mode === 'region') {
            return getRegionLocales(this.surface, this.locale);
        } else {
            return getDefaultLocales(this.surface);
        }
    }

    getFilteredLocales() {
        if (this.searchDisabled || !this.searchQuery) {
            return this.getLocales();
        }

        return this.getLocales().filter(({ lang, country }) => {
            const searchLower = this.searchQuery;
            const code = `${lang}_${country}`;
            const languageName = getLanguageName(lang);
            const countryName = getCountryName(country);
            return (
                code.toLowerCase().includes(searchLower) ||
                languageName.toLowerCase().includes(searchLower) ||
                countryName.toLowerCase().includes(searchLower)
            );
        });
    }

    /** can only be one of default languages, not regional ones */
    get currentLocale() {
        const defaultLocale = getDefaultLocale(this.locale, this.surface);
        this.locale = !defaultLocale ? 'en_US' : getLocaleCode(defaultLocale);
        return defaultLocale;
    }

    get searchField() {
        return !this.searchDisabled
            ? html` <sp-search
                  size="m"
                  placeholder="${this.searchPlaceholder}"
                  @input=${this.handleSearchInput}
                  .value=${this.searchQuery}
              ></sp-search>`
            : null;
    }

    renderMenuItem(locale) {
        const { lang, country } = locale;
        const code = getLocaleCode(locale);
        return html`
            <sp-menu-item .value=${code} ?selected=${this.locale === code} @click=${() => this.handleLocaleChange(code)}>
                <div class="locale-label">
                    <span class="flag">${getCountryFlag(country)}</span>
                    ${this.mode === 'region'
                        ? html`<span>${getCountryName(country)}</span>`
                        : html`<span>${getLanguageName(lang)} (${country})</span>`}
                </div>
            </sp-menu-item>
        `;
    }

    render() {
        const currentLocale = this.currentLocale;
        const code = getLocaleCode(currentLocale);
        return html`
            ${this.label ? html`<sp-label>${this.label}</sp-label>` : ''}
            <sp-action-menu value=${code} ?disabled=${this.disabled} @sp-opened=${this.handleMenuOpen}>
                ${this.displayMode === 'strong'
                    ? html`<sp-icon-globe-grid class="icon-globe" slot="icon"></sp-icon-globe-grid>`
                    : html`<span slot="icon"></span>`}
                <span slot="label" class="locale-label">
                    <span>${currentLocale.lang.toUpperCase()} (${currentLocale.country})</span>
                </span>
                <sp-icon-chevron-down class="chevron" slot="label"></sp-icon-chevron-down>
                <sp-menu size="m">
                    ${this.searchField} ${this.getFilteredLocales().map((locale) => this.renderMenuItem(locale))}
                </sp-menu>
            </sp-action-menu>
        `;
    }
}

customElements.define('mas-locale-picker', MasLocalePicker);
