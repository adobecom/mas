import { html, css, LitElement, nothing } from 'lit';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import {
    getDefaultLocales,
    getRegionLocales,
    getSurfaceLocales,
    getDefaultLocale,
    getLocaleByCode,
    getLanguageName,
    getLocaleCode,
    getCountryName,
    getCountryFlag,
} from './locales.js';

export class MasLocalePicker extends LitElement {
    static properties = {
        disabled: { type: Boolean },
        displayMode: { type: String }, // can be 'strong' or 'light' which is default
        displayValue: { type: Boolean, attribute: 'display-value' },
        label: { type: String },
        locale: { type: String },
        mode: { type: String }, // can be 'region' or 'language'
        selection: { type: String }, // can be 'checkbox' or default action-menu
        selectionLabel: { type: String, attribute: 'selection-label' },
        emptySelectionLabel: { type: String, attribute: 'empty-selection-label' },
        emptySelectionIsValue: { type: Boolean, attribute: 'empty-selection-is-value' },
        searchDisabled: { type: Boolean },
        searchPlaceholder: { type: String },
        searchQuery: { type: String },
        surface: { type: String },
        dialogOpen: { type: Boolean, state: true },
        selectedLocales: { type: Array, state: true },
        tempSelectedLocales: { type: Array, state: true },
    };

    reactiveController = new ReactiveController(this, [Store.fragmentEditor.translatedLocales]);

    static styles = css`
        /* Hide the strong-mode pill until the Spectrum shadow stylesheet
           has been adopted (see firstUpdated) — otherwise it paints with
           default Spectrum padding/sizes briefly before flipping to our
           Figma values. */
        :host(.strong:not([data-shadow-ready])) sp-action-menu {
            visibility: hidden;
        }

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
            margin-top: -3px;
            /* No margin-left — Spectrum's text-to-visual gap (6px, set on
               :host) already provides the spacing to the label, and adding a
               second 6px makes the right side look 12px while the left
               (icon→text) is only 6px. */
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
            /* Figma 15382:308970 — 12px outer padding + 6px icon-to-label gap.
               Spectrum computes its internal gap as
               text-to-visual + edge-to-text − edge-to-visual-only,
               so edge-to-text and edge-to-visual-only must be equal for the
               gap to reduce to exactly text-to-visual (6px). */
            /* Padding/gap tokens applied via JS on the inner sp-action-button
               (see firstUpdated) — CSS inheritance can't override sp-action-button's
               own :host([size=m]) declarations for these tokens. */
        }

        /* Component/M/Bold per Figma — Spectrum tokens for size 100. */
        .strong [slot='label'].locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--spectrum-gray-50, #ffffff);
            font-family: var(--spectrum-sans-font-family-stack, 'Adobe Clean', sans-serif);
            font-size: var(--spectrum-font-size-100, 14px);
            line-height: var(--spectrum-line-height-100, 18px);
            font-weight: var(--spectrum-bold-font-weight, 700);
            letter-spacing: var(--spectrum-letter-spacing, 0);
        }

        .strong sp-menu-item .locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* Same menu-item style as the folder picker (Figma 22245:321219).
           Only active in .strong (top-nav) mode. */
        :host(.strong) sp-menu-item {
            --mod-menu-item-label-inline-edge-to-content: 12px;
            --mod-menu-item-min-height: 32px;
            --mod-menu-item-top-edge-to-text: 7px;
            --mod-menu-item-bottom-edge-to-text: 7px;
            --mod-menu-item-label-font-size: 14px;
            --mod-menu-item-label-line-height: 18px;
            --mod-menu-item-label-content-color-default: var(--alias-content-neutral-default, #292929);
            padding-inline-start: 12px !important;
            padding-inline-end: 12px !important;
            padding-block-start: 7px !important;
            padding-block-end: 7px !important;
            border-radius: 8px;
            font-weight: 500;
            margin: 0 !important;
        }
        :host(.strong) sp-menu-item + sp-menu-item {
            margin-top: 4px !important;
        }

        sp-menu-item .locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
        }

        .not-translated {
            color: var(--spectrum-gray-500);
            font-size: 12px;
            margin-left: auto;
        }

        :host([disabled]) {
            --mod-actionbutton-background-color-disabled: var(--spectrum-gray-50, #f6f6f6);
            --mod-actionbutton-content-color-disabled: var(--spectrum-gray-600, #919191);
        }

        .flag {
            font-size: 18px;
            line-height: 1;
        }

        /* Top-nav popover layout per Figma 11769:183597. sp-popover provides
           8px padding inset; sp-menu lays out search + scrollable items list
           with a 4px gap. The extra space between search and the items list
           (12px total per Figma) comes from a margin-bottom on sp-search
           below (12 − 4 = 8px). */
        :host(.strong) sp-menu {
            padding: 0 !important;
            display: flex;
            flex-direction: column;
            gap: 4px;
            /* No min-width — let the popover hug its longest menu item.
               The Figma's 233px was the design's nominal width, but the
               real content (English (GB), Bulgarian (BG), etc.) is much
               narrower; forcing 233px left a lot of empty space on the
               right side of every row. */
        }

        /* Scroll is scoped to the items wrapper, NOT sp-menu — that way the
           scrollbar track sits only beside the items list and never beneath
           the search field above it.
           max-height = 9 items × 32 + 8 inter-item gaps × 4 = 320px. */
        :host(.strong) .locale-items-scroll {
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-height: 320px;
            overflow-y: auto;
        }

        /* Search field per Figma — 32px h, 16px radius, 2px gray-300 border.
           8px margin-bottom + the 4px sp-menu flex gap = 12px gap to the
           first menu item, matching Figma. */
        :host(.strong) sp-search {
            display: block;
            width: 100%;
            margin-bottom: 8px;
            --mod-search-border-color-default: var(--spectrum-gray-300, #dadada);
            --mod-search-border-radius: 16px;
            --mod-search-border-width: 2px;
            --mod-search-height: 32px;
        }

        :host(.strong) sp-search:focus {
            --spectrum-focus-indicator-color: transparent;
        }

        /* Items list — no flex gap from sp-menu (which is set to 12px between
           search and items list); use sibling margin between items for the
           4px row gap. */
        :host(.strong) sp-search + sp-menu-item {
            margin-top: 0 !important;
        }

        .selection-trigger {
            align-items: center;
            appearance: none;
            background: var(--palette-gray-25, #ffffff);
            border: 2px solid var(--alias-border-disabled-default, #dadada);
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            font-family: 'Adobe Clean', sans-serif;
            font-size: 14px;
            gap: 6px;
            height: 32px;
            justify-content: space-between;
            line-height: 18px;
            padding: 0 11px 0 12px;
            width: 100%;
        }

        .selection-trigger:disabled {
            cursor: not-allowed;
        }

        .selection-trigger:focus-visible {
            outline: none;
        }

        .selection-trigger-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-align: left;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .selection-trigger-label.is-placeholder {
            color: var(--spectrum-gray-600);
        }

        .selection-trigger-chevron {
            color: var(--palette-gray-700, #505050);
            flex-shrink: 0;
        }

        sp-underlay:not([open]) + sp-dialog.selection-dialog {
            display: none;
        }

        sp-underlay + sp-dialog.selection-dialog {
            position: fixed;
            border-radius: 16px;
            z-index: 1;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 684px;
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 32px);
            background: var(--spectrum-white, #ffffff);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .selection-dialog-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 50vh;
            min-height: 0;
            overflow: hidden;
        }

        .selection-dialog-content sp-search {
            width: 100%;
            padding: 0;
        }

        .selection-controls {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .selection-count {
            font-size: 12px;
            color: var(--spectrum-gray-700, #464646);
            white-space: nowrap;
        }

        .checkbox-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 132px), 1fr));
            column-gap: 12px;
            row-gap: 4px;
            flex: 1 1 auto;
            min-height: 0;
            overflow-y: auto;
            padding: 4px 0;
            align-content: start;
        }

        .checkbox-item {
            min-width: 0;
            padding: 4px 0;
        }
    `;

    constructor() {
        super();
        this.searchQuery = '';
        this.selection = '';
        this.selectionLabel = '';
        this.emptySelectionLabel = '';
        this.emptySelectionIsValue = false;
        this.displayValue = false;
        this.dialogOpen = false;
        this.selectedLocales = [];
        this.tempSelectedLocales = [];
        this.skipLocaleSync = false;
    }

    get lang() {
        return (this.locale || '').split('_')[0];
    }

    connectedCallback() {
        super.connectedCallback();
        this.displayMode ??= 'default';
        this.mode ??= 'language';
        this.searchDisabled = this.searchDisabled ?? false;
        this.searchPlaceholder ??= 'Search language';
        this.surface ??= 'nala';
        if (!this.isCheckboxSelection) this.locale ??= Store.localeOrRegion();
        this.selectedLocales = this.parseSelectedLocales(this.locale);
        if (this.displayMode === 'strong') {
            this.classList.add('strong');
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    handleLocaleChange(locale, fragmentId) {
        this.locale = locale;
        this.dispatchEvent(
            new CustomEvent('locale-changed', {
                detail: { locale, fragmentId },
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
            if (this.isCheckboxSelection) {
                return getSurfaceLocales(this.surface).sort((a, b) => {
                    const codeA = getLocaleCode(a);
                    const codeB = getLocaleCode(b);
                    return codeA.localeCompare(codeB) || getCountryName(a.country).localeCompare(getCountryName(b.country));
                });
            }
            return getRegionLocales(this.surface, this.locale, true);
        } else {
            return getDefaultLocales(this.surface);
        }
    }

    parseSelectedLocales(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        return String(value)
            .split(',')
            .map((locale) => locale.trim())
            .filter(Boolean);
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

    #tempSelectedSet = new Set();

    willUpdate(changedProperties) {
        if (!this.isCheckboxSelection && changedProperties.has('locale')) {
            const surfaceLocale = this.getLocales().find((l) => getLocaleCode(l) === this.locale);
            if (!surfaceLocale && this.locale !== Store.localeOrRegion()) this.locale = 'en_US';
        }
        if (changedProperties.has('tempSelectedLocales')) {
            this.#tempSelectedSet = new Set(this.tempSelectedLocales);
        }
    }

    get currentLocale() {
        const surfaceLocale = this.getLocales().find((l) => getLocaleCode(l) === this.locale);
        if (surfaceLocale) return surfaceLocale;
        if (Store.localeOrRegion() === this.locale) return getLocaleByCode(this.locale);
        return getDefaultLocale(this.surface, this.locale);
    }

    get searchField() {
        return !this.searchDisabled
            ? html` <sp-search
                  size="m"
                  placeholder="${this.searchPlaceholder}"
                  autocomplete="off"
                  @input=${this.handleSearchInput}
                  @click=${this.handleSearchFieldClick}
                  .value=${this.searchQuery}
              ></sp-search>`
            : null;
    }

    getTranslationInfo(localeCode) {
        const translatedLocales = Store.fragmentEditor.translatedLocales.get();
        if (!translatedLocales) return null;
        return translatedLocales.find((item) => item.locale === localeCode);
    }

    renderMenuItem(locale) {
        const { lang, country } = locale;
        const code = getLocaleCode(locale);
        const translationInfo = this.getTranslationInfo(code);
        const translatedLocales = Store.fragmentEditor.translatedLocales.get();
        const isTranslated = !translatedLocales || translationInfo;
        const localeLabel = this.displayValue
            ? code
            : this.mode === 'region'
              ? getCountryName(country)
              : `${getLanguageName(lang)} (${country})`;
        return html`
            <sp-menu-item
                .value=${code}
                ?selected=${this.locale === code}
                @click=${() => this.handleLocaleChange(code, translationInfo?.id)}
            >
                <div class="locale-label">
                    <span class="flag">${getCountryFlag(country)}</span>
                    <span>${localeLabel}</span>
                    ${!isTranslated ? html`<span class="not-translated">Not translated</span>` : ''}
                </div>
            </sp-menu-item>
        `;
    }

    get isCheckboxSelection() {
        return this.selection === 'checkbox';
    }

    get localizedSelectionLabel() {
        return this.selectionLabel || this.label || 'Select languages';
    }

    get localizedEmptySelectionLabel() {
        return this.emptySelectionLabel || this.localizedSelectionLabel;
    }

    get selectedSummary() {
        const count = this.selectedLocales.length;
        if (!count) return '';
        return count > 1 ? `${count} locales selected` : `${count} locale selected`;
    }

    get selectionTriggerText() {
        if (!this.selectedLocales.length) {
            return this.localizedEmptySelectionLabel;
        }
        return this.selectedLocales.map((localeCode) => this.formatLocaleLabel(localeCode)).join(', ');
    }

    get selectionTriggerIsPlaceholder() {
        return this.selectedLocales.length === 0 && !this.emptySelectionIsValue;
    }

    get filteredLocaleCodes() {
        const locales = this.isCheckboxSelection ? this.getLocales() : this.getFilteredLocales();
        return locales.map((locale) => getLocaleCode(locale));
    }

    get allFilteredSelected() {
        const filteredCodes = this.filteredLocaleCodes;
        if (!filteredCodes.length) return false;
        return filteredCodes.every((code) => this.#tempSelectedSet.has(code));
    }

    get someFilteredSelected() {
        const filteredCodes = this.filteredLocaleCodes;
        if (!filteredCodes.length) return false;
        return filteredCodes.some((code) => this.#tempSelectedSet.has(code));
    }

    get selectionCountLabel() {
        const count = this.tempSelectedLocales.length;
        return count > 1 ? `${count} locales selected` : `${count} locale selected`;
    }

    handleSelectionDialogOpen() {
        if (this.disabled) return;
        this.searchQuery = '';
        this.tempSelectedLocales = [...this.selectedLocales];
        this.dialogOpen = true;
    }

    handleSelectionDialogCancel() {
        this.dialogOpen = false;
        this.tempSelectedLocales = [];
        this.searchQuery = '';
    }

    handleSelectionDialogApply() {
        const selectedLocales = [...new Set(this.tempSelectedLocales)];
        this.selectedLocales = selectedLocales;
        this.skipLocaleSync = true;
        this.locale = selectedLocales[0] || '';
        this.dialogOpen = false;
        this.tempSelectedLocales = [];
        this.searchQuery = '';

        this.dispatchEvent(
            new CustomEvent('locale-changed', {
                detail: {
                    locale: this.locale,
                    locales: selectedLocales,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleCheckboxSelection(event) {
        event.stopPropagation();
        const checkbox = event.composedPath?.()[0] || event.target;
        const checked = checkbox?.checked;
        const value = checkbox?.value || checkbox?.getAttribute?.('value');
        if (!value) return;

        const selectedLocales = [...this.tempSelectedLocales];
        const index = selectedLocales.indexOf(value);
        if (checked && index === -1) {
            selectedLocales.push(value);
        } else if (!checked && index !== -1) {
            selectedLocales.splice(index, 1);
        }
        this.tempSelectedLocales = selectedLocales;
    }

    handleSelectAllToggle(event) {
        event.stopPropagation();
        const checkbox = event.composedPath?.()[0] || event.target;
        const checked = !!checkbox?.checked;
        const filteredCodes = this.filteredLocaleCodes;
        if (!filteredCodes.length) return;

        const selectedSet = new Set(this.tempSelectedLocales);
        if (checked) {
            filteredCodes.forEach((code) => selectedSet.add(code));
        } else {
            filteredCodes.forEach((code) => selectedSet.delete(code));
        }
        this.tempSelectedLocales = [...selectedSet];
    }

    formatLocaleLabel(localeCode) {
        if (this.displayValue) {
            return localeCode;
        }
        const [lang, country] = localeCode.split('_');
        if (!lang || !country) return localeCode;
        if (this.mode === 'region') {
            return `${getCountryName(country)} (${localeCode})`;
        }
        return `${getLanguageName(lang)} (${country})`;
    }

    renderSelectionCheckbox(locale) {
        const { lang, country } = locale;
        const code = getLocaleCode(locale);
        const localeLabel = this.formatLocaleLabel(code);
        return html`
            <sp-checkbox
                class="checkbox-item"
                value=${code}
                ?checked=${this.#tempSelectedSet.has(code)}
                @change=${this.handleCheckboxSelection}
            >
                ${localeLabel}
            </sp-checkbox>
        `;
    }

    get renderSelectionDialog() {
        if (!this.dialogOpen) return nothing;
        return html`
            <sp-underlay open @click=${this.handleSelectionDialogCancel}></sp-underlay>
            <sp-dialog class="selection-dialog" open @click=${(event) => event.stopPropagation()}>
                <h2 slot="heading">${this.localizedSelectionLabel}</h2>
                <div class="selection-dialog-content">
                    <div class="selection-controls">
                        <sp-checkbox
                            value="all"
                            ?checked=${this.allFilteredSelected}
                            .indeterminate=${this.someFilteredSelected && !this.allFilteredSelected}
                            @change=${this.handleSelectAllToggle}
                        >
                            Select all
                        </sp-checkbox>
                        <span class="selection-count">${this.selectionCountLabel}</span>
                    </div>
                    <div class="checkbox-list">${this.getLocales().map((locale) => this.renderSelectionCheckbox(locale))}</div>
                </div>
                <sp-button slot="button" variant="secondary" @click=${this.handleSelectionDialogCancel}>Cancel</sp-button>
                <sp-button slot="button" variant="accent" @click=${this.handleSelectionDialogApply}>Apply</sp-button>
            </sp-dialog>
        `;
    }

    updated(changedProperties) {
        if (this.isCheckboxSelection && changedProperties.has('locale')) {
            if (this.skipLocaleSync) {
                this.skipLocaleSync = false;
                return;
            }
            this.selectedLocales = this.parseSelectedLocales(this.locale);
        }
    }

    // Override Spectrum's action-button size-m padding tokens directly on the
    // inner sp-action-button, since :host([size=m]) declarations inside the
    // action-button shadow always beat inherited custom-property values from
    // outside (cascade beats inheritance regardless of !important). Inline
    // style on the element wins via specificity (1,0,0,0). Only runs in the
    // "strong" display mode (the pill variant shown in the top nav).
    // Adopt a stylesheet into sp-action-menu's shadow root so both the
    // inner sp-action-button (the EN(US) pill) and the sp-popover (its
    // dropdown) are styled BEFORE either first paints. Only applies in
    // .strong display mode (the top-nav variant).
    //
    // Important: do NOT `await actionMenu.updateComplete` first — by then
    // the action-button is in the DOM and the browser has typically already
    // painted with Spectrum defaults, producing a visible "default → custom"
    // flash on reload. Spectrum custom elements create their shadow root in
    // the constructor, so it's available synchronously when firstUpdated
    // runs. Adopt the sheet right here, before Lit yields to paint.
    firstUpdated() {
        if (this.displayMode !== 'strong') return;
        const actionMenu = this.shadowRoot?.querySelector('sp-action-menu');
        if (!actionMenu) return;
        // Adopt synchronously when sp-action-button is already in the shadow
        // (so it paints with our styles), and defer to actionMenu.updateComplete
        // only when the button isn't there yet — that way we never miss the
        // first paint with default styles.
        if (actionMenu.shadowRoot?.querySelector('sp-action-button')) {
            this.#adoptShadowStyles(actionMenu);
        } else {
            actionMenu.updateComplete.then(() => this.#adoptShadowStyles(actionMenu));
        }
    }

    #adoptShadowStyles(actionMenu) {
        if (!actionMenu.shadowRoot || actionMenu.dataset.shadowPatched) {
            this.toggleAttribute('data-shadow-ready', true);
            return;
        }
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            sp-action-button {
                --spectrum-actionbutton-edge-to-text: 12px;
                --spectrum-actionbutton-edge-to-visual: 12px;
                --spectrum-actionbutton-edge-to-visual-only: 12px;
                --spectrum-actionbutton-text-to-visual: 6px;
            }
            sp-popover {
                padding: 8px !important;
                border-radius: 10px !important;
                border: 1px solid transparent !important;
                background-color: #ffffff !important;
                box-shadow:
                    0 0 2px rgba(0, 0, 0, 0.12),
                    0 2px 6px rgba(0, 0, 0, 0.04),
                    0 4px 12px rgba(0, 0, 0, 0.08) !important;
                min-width: auto !important;
                width: fit-content !important;
            }
        `);
        actionMenu.shadowRoot.adoptedStyleSheets = [...actionMenu.shadowRoot.adoptedStyleSheets, sheet];
        actionMenu.dataset.shadowPatched = 'true';
        this.toggleAttribute('data-shadow-ready', true);
    }

    render() {
        if (this.isCheckboxSelection) {
            return html`
                <button
                    type="button"
                    class="selection-trigger"
                    ?disabled=${this.disabled}
                    @click=${this.handleSelectionDialogOpen}
                >
                    <span class="selection-trigger-label ${this.selectionTriggerIsPlaceholder ? 'is-placeholder' : ''}">
                        ${this.selectionTriggerText}
                    </span>
                    <sp-icon-chevron-down class="selection-trigger-chevron"></sp-icon-chevron-down>
                </button>
                ${this.renderSelectionDialog}
            `;
        }

        const currentLocale = this.currentLocale;
        const code = getLocaleCode(currentLocale);
        if (!currentLocale) return nothing;
        return html`
            ${this.label ? html`<sp-label>${this.label}</sp-label>` : ''}
            <sp-action-menu value=${code} ?disabled=${this.disabled} @sp-opened=${this.handleMenuOpen}>
                ${this.displayMode === 'strong'
                    ? html`<sp-icon-globe-grid class="icon-globe" slot="icon"></sp-icon-globe-grid>`
                    : html`<span slot="icon"></span>`}
                <span slot="label" class="locale-label">
                    <span>${this.displayValue ? code : `${currentLocale.lang.toUpperCase()} (${currentLocale.country})`}</span>
                </span>
                <sp-icon-chevron-down class="chevron" slot="label"></sp-icon-chevron-down>
                <sp-menu size="m">
                    ${this.searchField}
                    <div class="locale-items-scroll">
                        ${this.getFilteredLocales().map((locale) => this.renderMenuItem(locale))}
                    </div>
                </sp-menu>
            </sp-action-menu>
        `;
    }
}

customElements.define('mas-locale-picker', MasLocalePicker);
