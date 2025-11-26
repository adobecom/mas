import { LitElement, html, css } from 'lit';
import { EVENT_KEYDOWN, LOCALES } from './constants.js';
import { showToast, extractLocaleFromPath } from './utils.js';

export class MasVariationDialog extends LitElement {
    static properties = {
        fragment: { type: Object },
        selectedLocale: { state: true },
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
    `;

    constructor() {
        super();
        this.fragment = null;
        this.selectedLocale = '';
        this.loading = false;
        this.error = null;
        this.aem = null;
        this.existingVariationLocales = [];

        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        this.aem = document.querySelector('mas-repository')?.aem;
        this.loadExistingVariations();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    async loadExistingVariations() {
        if (!this.aem || !this.fragment?.id) return;

        try {
            const searchGenerator = this.aem.sites.cf.fragments.search({
                path: '/content/dam/mas',
                modelIds: [this.fragment.model?.id],
            });

            const existingLocales = [];
            for await (const items of searchGenerator) {
                for (const item of items) {
                    const originalIdField = item.fields?.find((f) => f.name === 'originalId');
                    if (originalIdField?.values?.[0] === this.fragment.id) {
                        const locale = extractLocaleFromPath(item.path);
                        if (locale) existingLocales.push(locale);
                    }
                }
            }
            this.existingVariationLocales = existingLocales;
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
        const sourceLocale = this.sourceLocale;
        if (!sourceLocale) return LOCALES.map((l) => ({ ...l, disabled: false }));

        const [sourceLanguage] = sourceLocale.split('_');
        return LOCALES.filter((locale) => {
            const [lang] = locale.code.split('_');
            return lang === sourceLanguage && locale.code !== sourceLocale;
        }).map((locale) => ({
            ...locale,
            disabled: this.existingVariationLocales.includes(locale.code),
        }));
    }

    get firstAvailableLocale() {
        const available = this.availableTargetLocales.find((l) => !l.disabled);
        return available?.code || '';
    }

    updated(changedProperties) {
        if (changedProperties.has('existingVariationLocales') || changedProperties.has('fragment')) {
            if (!this.selectedLocale || this.existingVariationLocales.includes(this.selectedLocale)) {
                this.selectedLocale = this.firstAvailableLocale;
            }
        }
    }

    get canSubmit() {
        return this.selectedLocale && !this.loading;
    }

    async handleSubmit() {
        if (!this.selectedLocale) {
            this.error = 'Please select a locale';
            return;
        }

        if (!this.aem) {
            this.error = 'AEM instance not available';
            return;
        }

        try {
            this.loading = true;
            showToast('Creating variation...');

            const fragmentPath = this.fragment.path;
            const pathParts = fragmentPath.split('/');
            const sourceLocale = this.sourceLocale;
            const localeIndex = pathParts.findIndex((part) => part === sourceLocale);

            if (localeIndex === -1) {
                throw new Error('Could not determine source locale from path');
            }

            const targetPathParts = [...pathParts];
            targetPathParts[localeIndex] = this.selectedLocale;
            const targetFolder = targetPathParts.slice(0, -1).join('/');

            const copiedFragment = await this.aem.sites.cf.fragments.copyToFolder(
                this.fragment,
                targetFolder,
                null,
                this.selectedLocale,
            );

            if (!copiedFragment) {
                throw new Error('Failed to create variation');
            }

            const originalIdField = copiedFragment.fields?.find((f) => f.name === 'originalId');
            if (originalIdField) {
                originalIdField.values = [this.fragment.id];
            } else {
                copiedFragment.fields.push({ name: 'originalId', values: [this.fragment.id] });
            }
            await this.aem.sites.cf.fragments.save(copiedFragment);

            showToast('Variation created successfully', 'positive');

            this.dispatchEvent(
                new CustomEvent('fragment-copied', {
                    detail: { fragment: copiedFragment },
                    bubbles: true,
                    composed: true,
                }),
            );
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

    render() {
        const localeOptions = this.availableTargetLocales;

        return html`
            <div class="dialog-backdrop" @click=${this.handleBackdropClick}>
                <div class="dialog-container" @click=${(e) => e.stopPropagation()}>
                    <div class="dialog-header">Set a variation type</div>

                    <div class="form-field">
                        <sp-field-label>Variation type</sp-field-label>
                        <sp-picker value="regional" disabled>
                            <sp-menu-item value="regional" selected>Regional</sp-menu-item>
                        </sp-picker>
                    </div>

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
                                    <sp-menu-item value="${locale.code}" ?disabled=${locale.disabled}>
                                        ${locale.name} (${locale.code.split('_')[1]})${locale.disabled ? ' (exists)' : ''}
                                    </sp-menu-item>
                                `,
                            )}
                        </sp-picker>
                    </div>

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
