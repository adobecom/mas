import { html, css, LitElement } from 'lit';

const defaultLocalesCache = {};

const LOCALES = [
    { code: 'ar_AE', lang: 'ar', flag: '🇦🇪', name: 'United Arab Emirates', region: ['acom'] },
    { code: 'ar_EG', lang: 'ar', flag: '🇪🇬', name: 'Egypt', region: ['acom'] },
    { code: 'ar_KW', lang: 'ar', flag: '🇰🇼', name: 'Kuwait', region: ['acom'] },
    { code: 'ar_QA', lang: 'ar', flag: '🇶🇦', name: 'Qatar', region: ['acom'] },
    { code: 'ar_SA', lang: 'ar', flag: '🇸🇦', name: 'Saudi Arabia', default: ALL_SURFACES },
    { code: 'bg_BG', lang: 'bg', flag: '🇧🇬', name: 'Bulgaria', default: ALL_SURFACES },
    { code: 'cs_CZ', lang: 'cs', flag: '🇨🇿', name: 'Czech Republic', default: ALL_SURFACES },
    { code: 'da_DK', lang: 'da', flag: '🇩🇰', name: 'Denmark', default: ALL_SURFACES },
    { code: 'de_AT', lang: 'de', flag: '🇦🇹', name: 'Austria', region: ['acom'] },
    { code: 'de_CH', lang: 'de', flag: '🇨🇭', name: 'Switzerland (German)', region: ['acom'] },
    { code: 'de_DE', lang: 'de', flag: '🇩🇪', name: 'Germany', default: ALL_SURFACES },
    { code: 'de_LU', lang: 'de', flag: '🇱🇺', name: 'Luxembourg (German)', region: ['acom'] },
    { code: 'el_GR', lang: 'el', flag: '🇬🇷', name: 'Greece', default: ALL_SURFACES },
    { code: 'en_AE', lang: 'en', flag: '🇦🇪', name: 'United Arab Emirates (English)', region: ['acom'] },
    { code: 'en_AR', lang: 'en', flag: '🇦🇷', name: 'Argentina (English)', region: ['acom'] },
    { code: 'en_AU', lang: 'en', flag: '🇦🇺', name: 'Australia', region: ['acom'] },
    { code: 'en_BE', lang: 'en', flag: '🇧🇪', name: 'Belgium (English)', region: ['acom'] },
    { code: 'en_CA', lang: 'en', flag: '🇨🇦', name: 'Canada (English)', region: ['acom'] },
    { code: 'en_EG', lang: 'en', flag: '🇪🇬', name: 'Egypt (English)', region: ['acom'] },
    { code: 'en_GR', lang: 'en', flag: '🇬🇷', name: 'Greece (English)', region: ['acom'] },
    { code: 'en_HK', lang: 'en', flag: '🇭🇰', name: 'Hong Kong (English)', region: ['acom'] },
    { code: 'en_ID', lang: 'en', flag: '🇮🇩', name: 'Indonesia (English)', region: ['acom'] },
    { code: 'en_IE', lang: 'en', flag: '🇮🇪', name: 'Ireland', region: ['acom'] },
    { code: 'en_IL', lang: 'en', flag: '🇮🇱', name: 'Israel (English)', region: ['acom'] },
    { code: 'en_IN', lang: 'en', flag: '🇮🇳', name: 'India (English)', region: ['acom'] },
    { code: 'en_KW', lang: 'en', flag: '🇰🇼', name: 'Kuwait (English)', region: ['acom'] },
    { code: 'en_LU', lang: 'en', flag: '🇱🇺', name: 'Luxembourg (English)', region: ['acom'] },
    { code: 'en_MY', lang: 'en', flag: '🇲🇾', name: 'Malaysia (English)', region: ['acom'] },
    { code: 'en_NG', lang: 'en', flag: '🇳🇬', name: 'Nigeria', region: ['acom'] },
    { code: 'en_NZ', lang: 'en', flag: '🇳🇿', name: 'New Zealand', region: ['acom'] },
    { code: 'en_PH', lang: 'en', flag: '🇵🇭', name: 'Philippines (English)', region: ['acom'] },
    { code: 'en_QA', lang: 'en', flag: '🇶🇦', name: 'Qatar (English)', region: ['acom'] },
    { code: 'en_SA', lang: 'en', flag: '🇸🇦', name: 'Saudi Arabia (English)', region: ['acom'] },
    { code: 'en_SG', lang: 'en', flag: '🇸🇬', name: 'Singapore', region: ['acom'] },
    { code: 'en_TH', lang: 'en', flag: '🇹🇭', name: 'Thailand (English)', region: ['acom'] },
    { code: 'en_US', lang: 'en', flag: '🇺🇸', name: 'United States', default: ALL_SURFACES },
    { code: 'en_VN', lang: 'en', flag: '🇻🇳', name: 'Vietnam (English)', region: ['acom'] },
    { code: 'en_ZA', lang: 'en', flag: '🇿🇦', name: 'South Africa', region: ['acom'] },
    { code: 'en_GB', lang: 'en', flag: '🇬🇧', name: 'United Kingdom', region: ['acom'] },
    { code: 'es_AR', lang: 'es', flag: '🇦🇷', name: 'Argentina', region: ['acom'] },
    { code: 'es_CL', lang: 'es', flag: '🇨🇱', name: 'Chile', region: ['acom'] },
    { code: 'es_CO', lang: 'es', flag: '🇨🇴', name: 'Colombia', region: ['acom'] },
    { code: 'es_CR', lang: 'es', flag: '🇨🇷', name: 'Costa Rica', region: ['acom'] },
    { code: 'es_EC', lang: 'es', flag: '🇪🇨', name: 'Ecuador', region: ['acom'] },
    { code: 'es_ES', lang: 'es', flag: '🇪🇸', name: 'Spain', default: ALL_SURFACES },
    { code: 'es_GT', lang: 'es', flag: '🇬🇹', name: 'Guatemala', region: ['acom'] },
    { code: 'es_MX', lang: 'es', flag: '🇲🇽', name: 'Mexico', region: ['acom'] },
    { code: 'es_PE', lang: 'es', flag: '🇵🇪', name: 'Peru', region: ['acom'] },
    { code: 'es_PR', lang: 'es', flag: '🇵🇷', name: 'Puerto Rico', region: ['acom'] },
    { code: 'et_EE', lang: 'et', flag: '🇪🇪', name: 'Estonia', region: ['acom'] },
    { code: 'fi_FI', lang: 'fi', flag: '🇫🇮', name: 'Finland', default: ALL_SURFACES },
    { code: 'fil_PH', lang: 'fil', flag: '🇵🇭', name: 'Philippines (Filipino)', region: ['acom'] },
    { code: 'fr_BE', lang: 'fr', flag: '🇧🇪', name: 'Belgium (French)', region: ['acom'] },
    { code: 'fr_CA', lang: 'fr', flag: '🇨🇦', name: 'Canada (French)', region: ['acom', 'express', 'ccd'] },
    { code: 'fr_CH', lang: 'fr', flag: '🇨🇭', name: 'Switzerland (French)', region: ['acom'] },
    { code: 'fr_FR', lang: 'fr', flag: '🇫🇷', name: 'France', default: ALL_SURFACES },
    { code: 'fr_LU', lang: 'fr', flag: '🇱🇺', name: 'Luxembourg (French)', region: ['acom'] },
    { code: 'he_IL', lang: 'he', flag: '🇮🇱', name: 'Israel', default: ALL_SURFACES },
    { code: 'hi_IN', lang: 'hi', flag: '🇮🇳', name: 'India (Hindi)', default: ALL_SURFACES },
    { code: 'hu_HU', lang: 'hu', flag: '🇭🇺', name: 'Hungary', default: ALL_SURFACES },
    { code: 'id_ID', lang: 'id', flag: '🇮🇩', name: 'Indonesia', default: ALL_SURFACES },
    { code: 'it_CH', lang: 'it', flag: '🇨🇭', name: 'Switzerland (Italian)', region: ['acom'] },
    { code: 'it_IT', lang: 'it', flag: '🇮🇹', name: 'Italy', default: ALL_SURFACES },
    { code: 'ja_JP', lang: 'ja', flag: '🇯🇵', name: 'Japan', default: ALL_SURFACES },
    { code: 'ko_KR', lang: 'ko', flag: '🇰🇷', name: 'South Korea', default: ALL_SURFACES },
    { code: 'lt_LT', lang: 'lt', flag: '🇱🇹', name: 'Lithuania', default: ALL_SURFACES },
    { code: 'lv_LV', lang: 'lv', flag: '🇱🇻', name: 'Latvia', default: ALL_SURFACES },
    { code: 'ms_MY', lang: 'ms', flag: '🇲🇾', name: 'Malaysia', default: ALL_SURFACES },
    { code: 'nb_NO', lang: 'nb', flag: '🇳🇴', name: 'Norway', default: ALL_SURFACES },
    { code: 'nl_BE', lang: 'nl', flag: '🇧🇪', name: 'Belgium (Dutch)', region: ['acom'] },
    { code: 'nl_NL', lang: 'nl', flag: '🇳🇱', name: 'Netherlands', default: ALL_SURFACES },
    { code: 'pl_PL', lang: 'pl', flag: '🇵🇱', name: 'Poland', default: ALL_SURFACES },
    { code: 'pt_BR', lang: 'pt', flag: '🇧🇷', name: 'Brazil', region: ALL_SURFACES },
    { code: 'pt_PT', lang: 'pt', flag: '🇵🇹', name: 'Portugal', default: ALL_SURFACES },
    { code: 'ro_RO', lang: 'ro', flag: '🇷🇴', name: 'Romania', default: ALL_SURFACES },
    { code: 'ru_RU', lang: 'ru', flag: '🇷🇺', name: 'Russia', default: ALL_SURFACES },
    { code: 'sk_SK', lang: 'sk', flag: '🇸🇰', name: 'Slovakia', default: ALL_SURFACES },
    { code: 'sl_SI', lang: 'sl', flag: '🇸🇮', name: 'Slovenia', default: ALL_SURFACES },
    { code: 'sv_SE', lang: 'sv', flag: '🇸🇪', name: 'Sweden', default: ALL_SURFACES },
    { code: 'th_TH', lang: 'th', flag: '🇹🇭', name: 'Thailand', default: ALL_SURFACES },
    { code: 'tr_TR', lang: 'tr', flag: '🇹🇷', name: 'Türkiye', default: ALL_SURFACES },
    { code: 'uk_UA', lang: 'uk', flag: '🇺🇦', name: 'Ukraine', default: ALL_SURFACES },
    { code: 'vi_VN', lang: 'vi', flag: '🇻🇳', name: 'Vietnam', default: ALL_SURFACES },
    { code: 'zh_CN', lang: 'zh', flag: '🇨🇳', name: 'China (Simplified)', default: ALL_SURFACES },
    { code: 'zh_HK', lang: 'zh', flag: '🇭🇰', name: 'Hong Kong', default: ALL_SURFACES },
    { code: 'zh_TW', lang: 'zh', flag: '🇹🇼', name: 'Taiwan', default: ALL_SURFACES },
];

const LANG_TO_LANGUAGE = {
    ar: 'Arabic',
    bg: 'Bulgarian',
    cs: 'Czech',
    da: 'Danish',
    de: 'German',
    el: 'Greek',
    en: 'English',
    es: 'Spanish',
    et: 'Estonian',
    fi: 'Finnish',
    fil: 'Filipino',
    fr: 'French',
    he: 'Hebrew',
    hi: 'Hindi',
    hu: 'Hungarian',
    id: 'Indonesian',
    it: 'Italian',
    ja: 'Japanese',
    ko: 'Korean',
    lt: 'Lithuanian',
    lv: 'Latvian',
    ms: 'Malay',
    nb: 'Norwegian Bokmål',
    nl: 'Dutch',
    pl: 'Polish',
    pt: 'Portuguese',
    ro: 'Romanian',
    ru: 'Russian',
    sk: 'Slovak',
    sl: 'Slovenian',
    sv: 'Swedish',
    th: 'Thai',
    tr: 'Turkish',
    uk: 'Ukrainian',
    vi: 'Vietnamese',
    zh: 'Chinese',
};

export class MasLocalePicker extends LitElement {
    static properties = {
        disabled: { type: Boolean },
        lang: { type: String },
        locale: { type: String },
        mode: { type: String }, //can be 'region' or 'language'
        searchEnabled: { type: Boolean },
        searchQuery: { type: String, state: true },
        surface: { type: String },
    };

    static styles = css`
        :host {
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

        .locale-picker-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        :host([disabled]) sp-action-menu {
            cursor: not-allowed;
            pointer-events: none;
            opacity: 1 !important;
            filter: none !important;
            color: var(--spectrum-gray-900, #1e1e1e);
        }

        :host([disabled]) sp-action-menu [slot='icon'] {
            color: var(--spectrum-gray-900, #1e1e1e) !important;
            opacity: 1 !important;
        }

        :host([disabled]) [slot='label'].locale-label {
            color: var(--spectrum-gray-900, #1e1e1e) !important;
        }

        :host([disabled]) {
            --mod-actionbutton-content-color-disabled: var(--spectrum-gray-900, #1e1e1e);
            --spectrum-actionbutton-content-color-disabled: var(--spectrum-gray-900, #1e1e1e);
        }

        :host([disabled]) sp-icon-chevron-down {
            color: var(--spectrum-gray-900, #1e1e1e) !important;
        }

        sp-action-menu [slot='icon'] {
            order: 2;
            margin-left: auto;
            color: var(--spectrum-gray-50, #ffffff);
        }

        [slot='label'].locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--spectrum-gray-50, #ffffff);
            font-weight: 700;
            font-size: 14px;
            font-family: 'Adobe Clean', sans-serif;
        }

        sp-menu-item .locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .flag {
            font-size: 18px;
            line-height: 1;
        }

        sp-search {
            padding: 20px 0 10px 15%;
            width: 75%;
        }

        #textfield sp-search::part(input) {
            border-radius: 12px;
            border-color: var(--spectrum-gray-600, #5a5a5a);
            border-width: 2px;
        }

        sp-menu-item {
            display: flex;
            align-items: center;
        }
    `;

    filters = new StoreController(this, Store.filters);

    constructor() {
        super();
        this.searchQuery = '';
        this.searchEnabled = true;
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

    getDefaultLocales(surface) {
        if (!defaultLocalesCache[surface]) {
            defaultLocalesCache[surface] = LOCALES.filter(
                (locale) => locale?.default === ALL_SURFACES || locale?.default?.indexOf(surface) > -1,
            );
        }
        return defaultLocalesCache[surface];
    }

    regionLocalesCache = {};

    getRegionLocales(surface, language) {
        if (!regionLocalesCache[`${surface}-${language}`]) {
            regionLocalesCache[`${surface}-${language}`] = LOCALES.filter(
                (locale) =>
                    locale?.lang === language && (locale?.region === ALL_SURFACES || locale?.region?.indexOf(surface) > -1),
            );
        }
        return regionLocalesCache[`${surface}-${language}`];
    }

    getLocales() {
        if (this.mode === 'region') {
            return this.getRegionLocales(this.surface, this.lang);
        } else {
            return this.getDefaultLocales(this.surface);
        }
    }

    getFilteredLocales() {
        if (!this.searchEnabled || !this.searchQuery) {
            return getLocales();
        }

        return getLocales().filter(({ code, name, lang }) => {
            const searchLower = this.searchQuery;
            const languageName = LANG_TO_LANGUAGE[lang] || '';
            return (
                code.toLowerCase().includes(searchLower) ||
                name.toLowerCase().includes(searchLower) ||
                languageName.toLowerCase().includes(searchLower)
            );
        });
    }

    get currentLocale() {
        return this.locale || 'en_US';
    }

    get searchField() {
        return this.searchEnabled
            ? html` <sp-search
                  size="m"
                  placeholder="Search language"
                  @input=${this.handleSearchInput}
                  .value=${this.searchQuery}
              ></sp-search>`
            : null;
    }

    render() {
        const currentLocale = this.currentLocale;

        return html`
            <div class="locale-picker-wrapper">
                <sp-action-menu size="m" value=${currentLocale.code} ?disabled=${this.disabled}>
                    <sp-icon-chevron-down dir="ltr" class="chevron" slot="icon"></sp-icon-chevron-down>
                    <span slot="label" class="locale-label">
                        <sp-icon-globe-grid class="icon-globe"></sp-icon-globe-grid>
                        <span>${currentLocale.lang.toUpperCase()} (${currentLocale.code.substring(3)})</span>
                    </span>
                    <sp-menu size="m">
                        ${this.searchField}
                        ${this.getFilteredLocales().map(({ code, flag, name, lang }) => {
                            return html`
                                <sp-menu-item
                                    .value=${code}
                                    ?selected=${this.locale === code}
                                    @click=${() => this.handleLocaleChange(code)}
                                >
                                    <div class="locale-label">
                                        <span class="flag">${flag}</span>
                                        <span>${LANG_TO_LANGUAGE[lang]} (${code.substring(3)})</span>
                                    </div>
                                </sp-menu-item>
                            `;
                        })}
                    </sp-menu>
                </sp-action-menu>
            </div>
        `;
    }
}

customElements.define('mas-locale-picker', MasLocalePicker);
