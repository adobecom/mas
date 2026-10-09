import { LitElement, html, css, nothing } from 'lit';
import { EVENT_KEYDOWN, VARIATION_TYPES, COLLECTION_MODEL_PATH, COLLECTION_GROUPED_VARIATION_PAC } from './constants.js';
import { showToast, extractLocaleFromPath, getService } from './utils.js';
import './aem/aem-tag-picker-field.js';

const INLINE_PRICE_OSI_SELECTOR = '[data-wcs-osi]';

function getOfferSelectorId(fragment) {
    const fragmentOsi = fragment?.getFieldValue?.('osi');
    if (fragmentOsi) return fragmentOsi;

    const template = document.createElement('template');
    template.innerHTML = fragment?.getFieldValue?.('prices') || '';
    return template.content.querySelector(INLINE_PRICE_OSI_SELECTOR)?.getAttribute('data-wcs-osi') || '';
}

export class MasVariationDialog extends LitElement {
    static properties = {
        fragment: { type: Object },
        isVariation: { type: Boolean },
        offerData: { type: Object },
        variationType: { state: true },
        pznTags: { state: true },
        loading: { state: true },
        error: { state: true },
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

        .unavailable-message {
            font-size: 14px;
            margin: 0;
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
        this.variationType = 'grouped';
        this.pznTags = [];
        this.loading = false;
        this.error = null;
        this.repository = null;

        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleUnderlayClick = this.handleUnderlayClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        this.repository = document.querySelector('mas-repository');
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.close();
        }
    }

    handleUnderlayClick() {
        this.close();
    }

    get sourceLocale() {
        return extractLocaleFromPath(this.fragment?.path);
    }

    get isGrouped() {
        return this.variationType === 'grouped' && this.canShowGroupedVariation;
    }

    get canShowGroupedVariation() {
        if (this.fragment?.model?.path === COLLECTION_MODEL_PATH) return true;
        return this.sourceLocale === 'en_US';
    }

    get canSubmit() {
        return !this.loading && this.isGrouped && this.pznTags.length > 0;
    }

    handlePznTagsChange(event) {
        const tagPicker = event.target;
        this.pznTags = tagPicker.value || [];
    }

    async resolveGroupedOfferData() {
        if (this.offerData?.productArrangementCode) return this.offerData;

        if (this.fragment?.model?.path === COLLECTION_MODEL_PATH) {
            const offer = { productArrangementCode: COLLECTION_GROUPED_VARIATION_PAC };
            this.offerData = offer;
            return offer;
        }

        const wcsOsi = getOfferSelectorId(this.fragment);
        if (!wcsOsi) throw new Error('No OSI value found on the fragment');

        const service = getService();
        const priceOptions = service.collectPriceOptions({ wcsOsi });
        const [offersPromise] = service.resolveOfferSelectors(priceOptions);
        const [offer] = await offersPromise;
        if (!offer?.productArrangementCode) {
            throw new Error('Could not resolve offer data for the given OSI');
        }
        this.offerData = offer;
        return offer;
    }

    async handleSubmit() {
        if (!this.repository) {
            this.error = 'Repository not available';
            return;
        }
        if (this.isGrouped && this.pznTags.length === 0) {
            this.error = 'Please select at least one locale tag';
            return;
        }
        if (!this.isGrouped) {
            this.error = 'Locale variations can no longer be created';
            return;
        }

        try {
            this.loading = true;
            this.error = null;

            showToast('Creating grouped variation...');

            const variationFragment = await this.repository.createGroupedVariation(
                this.fragment.id,
                this.pznTags,
                await this.resolveGroupedOfferData(),
            );

            showToast('Grouped variation created successfully', 'positive');

            this.dispatchEvent(
                new CustomEvent('fragment-copied', {
                    detail: { fragment: variationFragment, parentFragment: this.fragment },
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

    close() {
        if (this.loading) return;
        this.dispatchEvent(
            new CustomEvent('cancel', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    get unavailableTemplate() {
        return html`<p class="unavailable-message">
            Locale variations can no longer be created. Grouped variations are only available for en_US fragments and
            collections.
        </p>`;
    }

    get groupedFieldsTemplate() {
        return html`
            <sp-field-group>
                <sp-field-label>Grouped variation tags</sp-field-label>
                <aem-tag-picker-field
                    label="Locale and PZN tags"
                    namespace="/content/cq:tags/mas"
                    selection="checkbox-tags"
                    display-value
                    top="locale,pzn"
                    multiple
                    ?disabled=${this.loading}
                    @change=${this.handlePznTagsChange}
                ></aem-tag-picker-field>
            </sp-field-group>
        `;
    }

    render() {
        return html`
            <sp-underlay open @click=${this.handleUnderlayClick}></sp-underlay>
            <sp-dialog size="s" no-divider>
                <h2 slot="heading">Set a variation type</h2>
                <div id="fields">
                    <sp-field-group>
                        <sp-field-label>Variation type</sp-field-label>
                        <sp-picker value=${this.variationType} disabled>
                            ${this.canShowGroupedVariation
                                ? html`<sp-menu-item value="grouped">${VARIATION_TYPES.GROUPED}</sp-menu-item>`
                                : nothing}
                        </sp-picker>
                    </sp-field-group>
                    ${this.canShowGroupedVariation ? this.groupedFieldsTemplate : this.unavailableTemplate}
                    ${this.error ? html`<p class="error-message">${this.error}</p>` : nothing}
                </div>
                <sp-button slot="button" variant="secondary" treatment="outline" ?disabled=${this.loading} @click=${this.close}
                    >Cancel</sp-button
                >
                <sp-button slot="button" variant="accent" ?disabled=${!this.canSubmit} @click=${this.handleSubmit}>
                    Create variation
                </sp-button>
            </sp-dialog>
        `;
    }
}

customElements.define('mas-variation-dialog', MasVariationDialog);
