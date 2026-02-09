import { LitElement, html, css, nothing } from 'lit';
import { EVENT_KEYDOWN, VARIATION_TYPES } from './constants.js';
import { showToast, extractLocaleFromPath } from './utils.js';
import Store from './store.js';
import {
    getCountryName,
    getLocaleCode,
    getRegionLocales,
    LOCALES,
} from '../../io/www/src/fragment/locales.js';

export class MasVariationDialog extends LitElement {
    static properties = {
        fragment: { type: Object },
        isVariation: { type: Boolean },
        offerData: { type: Object },
        variationType: { state: true },
        selectedLocale: { state: true },
        selectedLocaleTags: { state: true },
        localeSearch: { state: true },
        showLocaleDropdown: { state: true },
        loading: { state: true },
        error: { state: true },
        existingVariationLocales: { state: true },
    };

    static styles = css`
        :host {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999;
            display: block;
        }

        .dialog-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .form-field {
            margin-bottom: 24px;
        }

        sp-field-label {
            display: block;
            margin-bottom: 8px;
        }

        sp-picker {
            width: 100%;
        }

        .dialog-container {
            background: var(--spectrum-white);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            padding: 24px;
            min-width: 400px;
            z-index: 1000;
            position: relative;
        }

        .dialog-header {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--spectrum-gray-200);
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
        }

        .error-message {
            color: var(--spectrum-red-600);
            font-size: 12px;
            margin-top: 8px;
        }

        .locale-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }

        .locale-tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: var(--spectrum-gray-200);
            border-radius: 16px;
            padding: 4px 8px 4px 12px;
            font-size: 13px;
            color: var(--spectrum-gray-800);
        }

        .locale-tag button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            color: var(--spectrum-gray-600);
            font-size: 14px;
            line-height: 1;
        }

        .locale-tag button:hover {
            color: var(--spectrum-gray-900);
        }

        .locale-picker {
            position: relative;
        }

        .locale-search {
            width: 100%;
            box-sizing: border-box;
            padding: 8px 12px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 4px;
            font-size: 14px;
            outline: none;
        }

        .locale-search:focus {
            border-color: var(--spectrum-blue-500);
        }

        .locale-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            background: var(--spectrum-white, #fff);
            border: 1px solid var(--spectrum-gray-200);
            border-radius: 4px;
            margin-top: 4px;
            z-index: 10;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .locale-option {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            color: var(--spectrum-gray-800);
        }

        .locale-option:hover {
            background: var(--spectrum-gray-100);
        }

        .locale-option.disabled {
            color: var(--spectrum-gray-400);
            cursor: default;
        }

        .locale-option.disabled:hover {
            background: none;
        }
    `;

    constructor() {
        super();
        this.fragment = null;
        this.isVariation = false;
        this.offerData = null;
        this.variationType = 'regional';
        this.selectedLocale = '';
        this.selectedLocaleTags = [];
        this.localeSearch = '';
        this.showLocaleDropdown = false;
        this.loading = false;
        this.error = null;
        this.repository = null;
        this.existingVariationLocales = [];

        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        document.addEventListener('click', this.handleDocumentClick);
        this.repository = document.querySelector('mas-repository');
        this.loadExistingVariations();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        document.removeEventListener('click', this.handleDocumentClick);
    }

    async loadExistingVariations() {
        if (!this.repository || !this.fragment?.id) return;

        try {
            this.existingVariationLocales = await this.repository.getExistingVariationLocales(this.fragment.id);
        } catch (err) {
            console.error('Failed to load existing variations:', err);
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            if (this.showLocaleDropdown) {
                this.showLocaleDropdown = false;
            } else {
                this.close();
            }
        }
    }

    handleDocumentClick() {
        this.showLocaleDropdown = false;
    }

    get sourceLocale() {
        return extractLocaleFromPath(this.fragment?.path);
    }

    get availableTargetLocales() {
        const [sourceLanguage] = (this.sourceLocale || 'en_US').split('_');
        return getRegionLocales(Store.surface(), sourceLanguage, false).map((locale) => ({
            ...locale,
            disabled: this.existingVariationLocales.includes(getLocaleCode(locale)),
        }));
    }

    get allLocales() {
        return LOCALES.map((locale) => ({
            ...locale,
            code: getLocaleCode(locale),
        }));
    }

    get filteredLocales() {
        const search = this.localeSearch.toLowerCase();
        return this.allLocales.filter((locale) => {
            if (this.selectedLocaleTags.includes(locale.code)) return false;
            if (!search) return true;
            const countryName = getCountryName(locale.country).toLowerCase();
            return locale.code.toLowerCase().includes(search) || countryName.includes(search);
        });
    }

    get firstAvailableLocale() {
        const available = this.availableTargetLocales.find((l) => !l.disabled);
        return getLocaleCode(available);
    }

    updated(changedProperties) {
        if (changedProperties.has('existingVariationLocales') || changedProperties.has('fragment')) {
            if (!this.selectedLocale || this.existingVariationLocales.includes(this.selectedLocale)) {
                this.selectedLocale = this.firstAvailableLocale;
            }
        }
    }

    get isGrouped() {
        return this.variationType === 'grouped';
    }

    get canSubmit() {
        if (this.loading) return false;
        if (this.isGrouped) {
            return this.selectedLocaleTags.length > 0;
        }
        return !!this.selectedLocale;
    }

    handleVariationTypeChange(event) {
        this.variationType = event.target.value;
        this.error = null;
    }

    handleLocaleSearchInput(event) {
        this.localeSearch = event.target.value;
        this.showLocaleDropdown = true;
    }

    handleLocaleSearchFocus() {
        this.showLocaleDropdown = true;
    }

    addLocaleTag(localeCode) {
        if (!this.selectedLocaleTags.includes(localeCode)) {
            this.selectedLocaleTags = [...this.selectedLocaleTags, localeCode];
        }
        this.localeSearch = '';
        this.showLocaleDropdown = false;
    }

    removeLocaleTag(localeCode) {
        this.selectedLocaleTags = this.selectedLocaleTags.filter((code) => code !== localeCode);
    }

    async handleSubmit() {
        if (!this.repository) {
            this.error = 'Repository not available';
            return;
        }

        try {
            this.loading = true;
            this.error = null;

            if (this.isGrouped) {
                if (this.selectedLocaleTags.length === 0) {
                    this.error = 'Please add at least one locale tag';
                    this.loading = false;
                    return;
                }

                showToast('Creating grouped variation...');

                const variationFragment = await this.repository.createGroupedVariation(
                    this.fragment.id,
                    this.selectedLocaleTags,
                    this.offerData,
                );

                showToast('Grouped variation created successfully', 'positive');

                this.dispatchEvent(
                    new CustomEvent('fragment-copied', {
                        detail: { fragment: variationFragment },
                        bubbles: true,
                        composed: true,
                    }),
                );
            } else {
                if (!this.selectedLocale) {
                    this.error = 'Please select a locale';
                    this.loading = false;
                    return;
                }

                showToast('Creating variation...');

                const variationFragment = await this.repository.createVariation(
                    this.fragment.id,
                    this.selectedLocale,
                    this.isVariation,
                );

                showToast('Variation created successfully', 'positive');
                Store.search.set((prev) => ({ ...prev, region: this.selectedLocale }));

                this.dispatchEvent(
                    new CustomEvent('fragment-copied', {
                        detail: { fragment: variationFragment },
                        bubbles: true,
                        composed: true,
                    }),
                );
            }
        } catch (err) {
            this.error = err.message || 'Failed to create variation';
            this.loading = false;
            showToast(`Failed to create variation: ${err.message}`, 'negative');
        }
    }

    handleBackdropClick(event) {
        if (event.target.classList.contains('dialog-backdrop') && !this.loading) {
            this.close();
        }
    }

    close() {
        this.dispatchEvent(
            new CustomEvent('cancel', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    renderRegionalFields() {
        const localeOptions = this.availableTargetLocales;
        return html`
            <div class="form-field">
                <sp-field-label>Regional</sp-field-label>
                <sp-picker
                    value=${this.selectedLocale}
                    @change=${(e) => (this.selectedLocale = e.target.value)}
                    ?disabled=${this.loading}
                    placeholder="Select a locale"
                >
                    ${localeOptions.map(
                        (locale) => html`
                            <sp-menu-item value="${getLocaleCode(locale)}" ?disabled=${locale.disabled}>
                                ${getCountryName(locale.country)}
                                (${locale.country})${locale.disabled ? ' (exists)' : ''}
                            </sp-menu-item>
                        `,
                    )}
                </sp-picker>
            </div>
        `;
    }

    renderGroupedFields() {
        return html`
            <div class="form-field">
                <sp-field-label>Grouped variation tags</sp-field-label>
                <div class="locale-picker" @click=${(e) => e.stopPropagation()}>
                    <input
                        class="locale-search"
                        type="text"
                        placeholder="Search locales..."
                        .value=${this.localeSearch}
                        @input=${this.handleLocaleSearchInput}
                        @focus=${this.handleLocaleSearchFocus}
                        ?disabled=${this.loading}
                    />
                    ${this.showLocaleDropdown && this.filteredLocales.length > 0
                        ? html`
                              <div class="locale-dropdown">
                                  ${this.filteredLocales.map(
                                      (locale) => html`
                                          <div
                                              class="locale-option"
                                              @click=${() => this.addLocaleTag(locale.code)}
                                          >
                                              ${locale.code}
                                          </div>
                                      `,
                                  )}
                              </div>
                          `
                        : nothing}
                </div>
                ${this.selectedLocaleTags.length > 0
                    ? html`
                          <div class="locale-tags">
                              ${this.selectedLocaleTags.map(
                                  (code) => html`
                                      <span class="locale-tag">
                                          ${code}
                                          <button
                                              @click=${() => this.removeLocaleTag(code)}
                                              aria-label="Remove ${code}"
                                              ?disabled=${this.loading}
                                          >
                                              &times;
                                          </button>
                                      </span>
                                  `,
                              )}
                          </div>
                      `
                    : nothing}
            </div>
        `;
    }

    render() {
        return html`
            <div class="dialog-backdrop" @click=${this.handleBackdropClick}>
                <div class="dialog-container" @click=${(e) => e.stopPropagation()}>
                    <div class="dialog-header">Set a variation type</div>

                    <div class="form-field">
                        <sp-field-label>Variation type</sp-field-label>
                        <sp-picker
                            value=${this.variationType}
                            @change=${this.handleVariationTypeChange}
                            ?disabled=${this.loading}
                        >
                            <sp-menu-item value="regional">Regional</sp-menu-item>
                            <sp-menu-item value="grouped">${VARIATION_TYPES.GROUPED}</sp-menu-item>
                        </sp-picker>
                    </div>

                    ${this.isGrouped ? this.renderGroupedFields() : this.renderRegionalFields()}

                    ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}

                    <div class="dialog-footer">
                        <sp-button variant="secondary" treatment="outline" @click=${this.close}> Cancel </sp-button>
                        <sp-button variant="accent" ?disabled=${!this.canSubmit} @click=${this.handleSubmit}>
                            Create variation
                        </sp-button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-variation-dialog', MasVariationDialog);
