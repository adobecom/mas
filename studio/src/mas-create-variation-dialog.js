import { LitElement, html, css } from 'lit';
import { EVENT_KEYDOWN, LOCALES, VARIATION_TYPES } from './constants.js';
import { showToast } from './utils.js';

export class MasCreateVariationDialog extends LitElement {
    static properties = {
        fragment: { type: Object },
        selectedLocale: { state: true },
        loading: { state: true },
        error: { state: true },
        existingVariations: { state: true },
        cancelled: { state: true },
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
            backdrop-filter: blur(4px);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        sp-dialog-wrapper {
            z-index: 1000;
            position: relative;
            max-height: 90vh;
            width: 450px;
            max-width: 450px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .dialog-content {
            flex: 1;
            min-height: 0;
        }

        .form-field {
            margin-bottom: var(--spectrum-global-dimension-size-400);
        }

        sp-field-label {
            display: block;
            margin-bottom: var(--spectrum-global-dimension-size-100);
        }

        .error-message {
            color: var(--spectrum-global-color-red-600);
            font-size: 12px;
            margin-top: 8px;
        }

        sp-picker {
            width: 100%;
        }

        .info-text {
            font-size: 13px;
            color: var(--spectrum-global-color-gray-700);
            margin-bottom: 16px;
            line-height: 1.5;
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            gap: 16px;
        }

        .loading-text {
            font-size: 14px;
            color: var(--spectrum-global-color-gray-700);
        }
    `;

    constructor() {
        super();
        this.fragment = null;
        this.selectedLocale = null;
        this.loading = false;
        this.error = null;
        this.existingVariations = null;
        this.cancelled = false;

        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    handleKeyDown(event) {
        if (event.key === 'Escape' && this.dialog?.open) {
            this.close();
        }
    }

    get dialog() {
        return this.shadowRoot.querySelector('sp-dialog-wrapper');
    }

    extractLocaleFromPath(path) {
        if (!path) return null;
        const parts = path.split('/');
        const localeIndex = parts.indexOf('mas') + 2;
        return parts[localeIndex] || null;
    }

    getLanguageCode(locale) {
        if (!locale) return null;
        return locale.split('_')[0];
    }

    extractFragmentNameFromPath(path) {
        if (!path) return null;
        return path.split('/').pop();
    }

    async getExistingVariationLocales() {
        if (!this.fragment?.getVariations) return [];

        const variationPaths = this.fragment.getVariations();
        if (!variationPaths.length) return [];

        const parentLocale = this.extractLocaleFromPath(this.fragment.path);
        const parentFragmentName = this.extractFragmentNameFromPath(this.fragment.path);
        if (!parentLocale || !parentFragmentName) return [];

        const parentLanguage = this.getLanguageCode(parentLocale);
        if (!parentLanguage) return [];

        const locales = [];
        for (const path of variationPaths) {
            const fragmentName = this.extractFragmentNameFromPath(path);

            // Only consider variations with the same fragment name as the parent
            if (fragmentName === parentFragmentName) {
                const locale = this.extractLocaleFromPath(path);
                if (locale) {
                    const localeLanguage = this.getLanguageCode(locale);
                    if (localeLanguage === parentLanguage) {
                        locales.push(locale);
                    }
                }
            }
        }

        return [...new Set(locales)];
    }

    get availableLocales() {
        if (!this.fragment?.path) return LOCALES;
        const parentLocale = this.extractLocaleFromPath(this.fragment.path);
        if (!parentLocale) return LOCALES;
        const parentLanguage = this.getLanguageCode(parentLocale);
        if (!parentLanguage) return LOCALES;

        return LOCALES.filter((locale) => this.getLanguageCode(locale.code) === parentLanguage);
    }

    get disabledLocales() {
        if (!this.fragment?.path) return [];
        const parentLocale = this.extractLocaleFromPath(this.fragment.path);
        return [parentLocale, ...(this.existingVariations || [])];
    }

    async updated() {
        if (!this.existingVariations) {
            this.existingVariations = await this.getExistingVariationLocales();
        }
        await this.open();
    }

    async open() {
        await this.updateComplete;
        if (this.dialog) {
            this.dialog.open = true;
        }
    }

    validateInputs() {
        if (!this.selectedLocale) {
            this.error = 'Please select a locale';
            return false;
        }

        if (this.existingVariations?.includes(this.selectedLocale)) {
            const localeName = LOCALES.find((l) => l.code === this.selectedLocale)?.label || this.selectedLocale;
            this.error = `A variation for ${localeName} already exists`;
            return false;
        }

        if (!this.fragment?.path) {
            this.error = 'Fragment is missing path property';
            return false;
        }

        return true;
    }

    async handleSubmit() {
        if (!this.validateInputs()) return;

        this.dispatchEvent(
            new CustomEvent('create-variation', {
                detail: { locale: this.selectedLocale },
                bubbles: true,
                composed: true,
            }),
        );
    }

    close() {
        if (this.loading) {
            this.cancelled = true;
            this.loading = false;
            showToast('Variation creation cancelled', 'negative');
        }

        this.dialog.open = false;
        this.dispatchEvent(
            new CustomEvent('cancel', {
                detail: { cancelled: this.cancelled },
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        return html`
            <div class="dialog-backdrop" @click=${this.handleBackdropClick}>
                <sp-dialog-wrapper
                    class="${this.loading ? 'loading' : ''}"
                    headline="Create variation"
                    mode="modal"
                    confirm-label="${this.loading ? '' : 'Create variation'}"
                    cancel-label="${this.loading ? '' : 'Cancel'}"
                    @confirm=${this.handleSubmit}
                    @cancel=${this.close}
                    ?dismissable=${!this.loading}
                    @click=${(e) => e.stopPropagation()}
                >
                    <div class="dialog-content">
                        ${this.loading
                            ? html`
                                  <div class="loading-container">
                                      <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                                      <div class="loading-text">Creating variation...</div>
                                  </div>
                              `
                            : html`
                                  <div class="info-text">
                                      Create a regional variation of this fragment for a specific locale. The variation will
                                      inherit all content from the default fragment and allow you to customize it for the
                                      selected region. Only locales with the same language are shown.
                                  </div>

                                  <div class="form-field">
                                      <sp-field-label for="variation-type-picker">Variation Type</sp-field-label>
                                      <sp-picker id="variation-type-picker" value="${VARIATION_TYPES.LOCALE}" disabled>
                                          <sp-menu-item value="${VARIATION_TYPES.LOCALE}" selected>
                                              ${VARIATION_TYPES.LOCALE}
                                          </sp-menu-item>
                                      </sp-picker>
                                  </div>

                                  <div class="form-field">
                                      <sp-field-label for="locale-picker">Locale</sp-field-label>
                                      <sp-picker
                                          id="locale-picker"
                                          value=${this.selectedLocale || ''}
                                          @change=${(e) => {
                                              this.selectedLocale = e.target.value;
                                              this.error = null;
                                          }}
                                          placeholder="Select a locale"
                                      >
                                          ${this.availableLocales.map(
                                              (locale) => html`
                                                  <sp-menu-item
                                                      value="${locale.code}"
                                                      ?selected="${locale.code === this.selectedLocale}"
                                                      ?disabled="${this.disabledLocales.includes(locale.code)}"
                                                  >
                                                      ${locale.name} (${locale.code})
                                                  </sp-menu-item>
                                              `,
                                          )}
                                      </sp-picker>
                                      ${this.error ? html` <div class="error-message">${this.error}</div> ` : ''}
                                  </div>
                              `}
                    </div>
                </sp-dialog-wrapper>
            </div>
        `;
    }

    handleBackdropClick(event) {
        if (event.target.classList.contains('dialog-backdrop') && !this.loading) {
            this.close();
        }
    }
}

customElements.define('mas-create-variation-dialog', MasCreateVariationDialog);
