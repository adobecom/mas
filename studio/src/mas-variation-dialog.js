import { LitElement, html, css, nothing } from 'lit';
import { EVENT_KEYDOWN, VARIATION_TYPES } from './constants.js';
import { showToast, extractLocaleFromPath, localeIconProvider } from './utils.js';
import Store from './store.js';
import { getCountryName, getLocaleCode, getRegionLocales } from '../../io/www/src/fragment/locales.js';
import './aem/aem-tag-picker-field.js';

export class MasVariationDialog extends LitElement {
    static properties = {
        fragment: { type: Object },
        isVariation: { type: Boolean },
        offerData: { type: Object },
        variationType: { state: true },
        selectedLocale: { state: true },
        pznTags: { state: true },
        loading: { state: true },
        error: { state: true },
        existingVariationLocales: { state: true },
    };

    static styles = css`
        :host {
            display: contents;
        }

        sp-underlay:not([open]) + sp-dialog {
            display: none;
        }

        sp-underlay + sp-dialog {
            position: fixed;
            border-radius: 16px;
            z-index: 1;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 480px;
            background: var(--spectrum-white);
        }

        sp-field-group sp-picker,
        sp-field-group aem-tag-picker-field {
            width: 100%;
        }

        #fields {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .error-message {
            color: var(--spectrum-red-600);
            font-size: 12px;
            margin-top: 8px;
        }
    `;

    constructor() {
        super();
        this.fragment = null;
        this.isVariation = false;
        this.offerData = null;
        this.variationType = 'regional';
        this.selectedLocale = '';
        this.pznTags = [];
        this.loading = false;
        this.error = null;
        this.repository = null;
        this.existingVariationLocales = [];

        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        this.repository = document.querySelector('mas-repository');
        this.loadExistingVariations();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
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
            this.close();
        }
    }

    get sourceLocale() {
        return extractLocaleFromPath(this.fragment?.path);
    }

    get availableTargetLocales() {
        return getRegionLocales(Store.surface(), this.sourceLocale || 'en_US', false).map((locale) => ({
            ...locale,
            disabled: this.existingVariationLocales.includes(getLocaleCode(locale)),
        }));
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
            return this.pznTags.length > 0;
        }
        return !!this.selectedLocale;
    }

    handleVariationTypeChange(event) {
        this.variationType = event.target.value;
        this.error = null;
    }

    handlePznTagsChange(event) {
        const tagPicker = event.target;
        this.pznTags = tagPicker.value || [];
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
                if (this.pznTags.length === 0) {
                    this.error = 'Please add at least one locale tag';
                    this.loading = false;
                    return;
                }

                showToast('Creating grouped variation...');

                const variationFragment = await this.repository.createGroupedVariation(
                    this.fragment.id,
                    this.pznTags,
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

    close() {
        this.dispatchEvent(
            new CustomEvent('cancel', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    get regionalFieldsTemplate() {
        const localeOptions = this.availableTargetLocales;
        return html`
            <sp-field-group>
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
                                ${getCountryName(locale.country)} (${locale.country})${locale.disabled ? ' (exists)' : ''}
                            </sp-menu-item>
                        `,
                    )}
                </sp-picker>
            </sp-field-group>
        `;
    }

    get groupedFieldsTemplate() {
        return html`
            <sp-field-group>
                <sp-field-label>Grouped variation tags</sp-field-label>
                <aem-tag-picker-field
                    label="Locale tags"
                    namespace="/content/cq:tags/mas"
                    top="locale"
                    multiple
                    ?disabled=${this.loading}
                    .iconProvider=${localeIconProvider}
                    @change=${this.handlePznTagsChange}
                ></aem-tag-picker-field>
            </sp-field-group>
        `;
    }

    render() {
        return html`
            <sp-underlay open></sp-underlay>
            <sp-dialog size="s" no-divider>
                <h2 slot="heading">Set a variation type</h2>
                <div id="fields">
                    <sp-field-group>
                        <sp-field-label>Variation type</sp-field-label>
                        <sp-picker
                            value=${this.variationType}
                            @change=${this.handleVariationTypeChange}
                            ?disabled=${this.loading}
                        >
                            <sp-menu-item value="regional">Regional</sp-menu-item>
                            <sp-menu-item value="grouped">${VARIATION_TYPES.GROUPED}</sp-menu-item>
                        </sp-picker>
                    </sp-field-group>
                    ${this.isGrouped ? this.groupedFieldsTemplate : this.regionalFieldsTemplate}
                    ${this.error ? html`<p class="error-message">${this.error}</p>` : nothing}
                </div>
                <sp-button slot="button" variant="secondary" treatment="outline" @click=${this.close}>Cancel</sp-button>
                <sp-button slot="button" variant="accent" ?disabled=${!this.canSubmit} @click=${this.handleSubmit}>
                    Create variation
                </sp-button>
            </sp-dialog>
        `;
    }
}

customElements.define('mas-variation-dialog', MasVariationDialog);
