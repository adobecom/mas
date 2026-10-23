import { LitElement, html, css, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import {
    BASELINE_CREATE_TYPE,
    COMPARE_CHART_CREATE_TYPE,
    COMPARE_CHART_FIELD,
    COMPAT_VERSION,
    EVENT_KEYDOWN,
    EVENT_OST_CLOSE,
    EVENT_OST_OFFER_SELECT,
    TAG_COMPARE_CHART,
    TAG_MERCH_CARD,
    TAG_MERCH_CARD_COLLECTION,
    TAG_MODEL_ID_MAPPING,
} from './constants.js';
import router from './router.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import './rte/osi-field.js';
import './aem/aem-tag-picker-field.js';
import generateFragmentStore from './reactivity/source-fragment-store.js';
import { showToast } from './utils.js';
import { DEFAULT_COMPARE_CHART_HTML } from './editors/mas-compare-chart-editor.js';
import { createBaseline, resolveBaselineOffer } from './baselines/baseline-model.js';

const BASELINE_EXISTS_ERROR = 'A baseline with this title already exists';
const INVALID_TITLE_ERROR = 'Title must contain letters or digits';
const MISSING_PA_CODE_ERROR = 'No PA code found for this offer';

const INITIAL_TOUCHED = { title: false, osi: false, template: false };
const INITIAL_ERRORS = { title: '', offer: '' };

const fieldMessage = (id, message) =>
    html`<div class="field-message" aria-live="polite">
        ${message ? html`<sp-help-text id=${id} variant="negative">${message}</sp-help-text>` : nothing}
    </div>`;

const DEFAULT_TYPE_CONFIG = {
    label: 'Merch Card Collection',
    titleLabel: 'Internal title',
    placeholder: 'Enter internal fragment title',
};

const TYPE_CONFIG = {
    'merch-card': { ...DEFAULT_TYPE_CONFIG, label: 'Merch Card' },
    [COMPARE_CHART_CREATE_TYPE]: { ...DEFAULT_TYPE_CONFIG, label: 'Compare Chart' },
    [BASELINE_CREATE_TYPE]: { label: 'Baseline', titleLabel: 'Title', placeholder: '' },
};

export class MasCreateDialog extends LitElement {
    static properties = {
        type: { type: String, reflect: true },
        title: { state: true },
        touched: { state: true },
        errors: { state: true },
        loading: { state: true },
        productArrangementCode: { state: true },
        marketSegment: { state: true },
        template: { state: true },
    };

    #selectionId = 0;

    search = new StoreController(this, Store.search);
    filters = new StoreController(this, Store.filters);

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

        .loading-overlay {
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

        .form-field {
            margin-bottom: calc(var(--swc-scale-factor) * 32px);
        }

        .form-field.with-message {
            margin-bottom: calc(var(--swc-scale-factor) * 12px);
        }

        .field-message {
            min-height: calc(var(--swc-scale-factor) * 20px);
        }

        sp-picker,
        sp-textfield {
            width: 100%;
        }

        .full-width {
            width: 100%;
        }

        .full-width.invalid {
            --spectrum-actionbutton-border-color-default: var(--spectrum-negative-border-color-default);
            border: 1px solid var(--spectrum-negative-border-color-default);
        }

        .offer-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 8px;
        }

        .offer-details {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
            overflow-wrap: anywhere;
        }

        .offer-details p {
            margin: 0;
        }

        sp-help-text {
            display: flex;
            align-items: center;
        }
    `;

    constructor() {
        super();
        this.type = 'merch-card';
        this.tags = [];
        this.#resetForm();

        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.#onOstSelect);
        document.addEventListener(EVENT_OST_CLOSE, this.#onOstClose);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.#onOstSelect);
        document.removeEventListener(EVENT_OST_CLOSE, this.#onOstClose);
    }

    handleKeyDown(event) {
        if (event.key === 'Escape' && !this.loading) {
            this.close();
        }
    }

    handleBackdropClick(event) {
        if (event.target.classList.contains('dialog-backdrop')) {
            this.close();
        }
    }

    /**
     * Normalizes a string to be used as a fragment name
     * Converts to lowercase, replaces spaces with hyphens, and removes special characters
     * @param {string} str - The string to normalize
     * @returns {string} - The normalized string
     */
    normalizeFragmentName(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    handleTitleChange(value) {
        this.title = value;
        this.#setError('title', '');
    }

    #resetForm() {
        this.title = '';
        this.touched = INITIAL_TOUCHED;
        this.errors = INITIAL_ERRORS;
        this.offerSelectorOpened = false;
        this.osi = '';
        this.#selectionId++;
        this.productArrangementCode = '';
        this.marketSegment = '';
        this.template = '';
        this.loading = false;
    }

    #touch(...fields) {
        this.touched = { ...this.touched, ...Object.fromEntries(fields.map((field) => [field, true])) };
    }

    #setError(field, message) {
        this.errors = { ...this.errors, [field]: message };
    }

    #onOstClose = () => {
        if (!this.offerSelectorOpened) return;
        this.offerSelectorOpened = false;
        this.#touch('osi');
    };

    #onOstSelect = async ({ detail: { offerSelectorId, offer } }) => {
        if (!offer) return;
        this.osi = offerSelectorId;
        this.marketSegment = offer.market_segments?.[0] ?? '';
        const selectionId = ++this.#selectionId;
        if (this.type !== BASELINE_CREATE_TYPE) return;
        this.productArrangementCode = '';
        this.#setError('offer', '');
        const { productArrangementCode, marketSegment } = await resolveBaselineOffer(offerSelectorId, offer);
        if (selectionId !== this.#selectionId) return;
        this.productArrangementCode = productArrangementCode ?? '';
        this.marketSegment = marketSegment ?? this.marketSegment;
        this.#setError('offer', productArrangementCode ? '' : MISSING_PA_CODE_ERROR);
    };

    #handleTemplateChange(event) {
        this.#touch('template');
        this.template = event.target.value;
    }

    _onTagSelect = ({ detail: { tags } }) => {
        this.tags = tags;
    };

    #handeTagsChange(e) {
        const value = e.target.getAttribute('value');
        this.tags = value ? value.split(',') : [];
    }

    async createFragment(masRepository, fragmentData) {
        const fragment = await masRepository.createFragment(fragmentData);
        if (!fragment?.id) {
            throw new Error('Fragment was not created.');
        }
        const sourceStore = generateFragmentStore(fragment);
        sourceStore.new = true;
        const currentList = Store.fragments.list.data.get() ?? [];
        Store.fragments.list.data.set([sourceStore, ...currentList]);
        this.close();
        await this.#openFragmentEditor(fragment.id);
    }

    async #openFragmentEditor(fragmentId) {
        try {
            await router.navigateToFragmentEditor(fragmentId);
        } catch (error) {
            console.error(error.message, error.stack);
            showToast(`${this.typeConfig.label} was created but could not be opened: ${error.message}`, 'negative');
        }
    }

    async tryToCreateFragment(masRepository, fragmentData) {
        try {
            await this.createFragment(masRepository, fragmentData);
            return true;
        } catch (error) {
            if (error.message?.includes(': 409')) {
                console.error(`${error.message} Will try to create again`, error.stack);
                return false;
            }
            throw error;
        }
    }

    getSuffix(offset) {
        let suffix = '';
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        const length = offset + 3;
        for (let i = 0; i < length; i++) {
            suffix += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return suffix;
    }

    async handleSubmit(event) {
        if (event) {
            event.preventDefault();
        }

        this.#touch('title', 'osi', 'template');

        if (!this.title) {
            return;
        }

        if (!this.normalizeFragmentName(this.title)) {
            this.#setError('title', INVALID_TITLE_ERROR);
            return;
        }

        if (this.type === BASELINE_CREATE_TYPE) {
            if (this.osi && !this.productArrangementCode) this.#setError('offer', MISSING_PA_CODE_ERROR);
            if (!this.osi || !this.productArrangementCode || !this.surface || !this.template) return;
            await this.#submitBaseline();
            return;
        }

        const hasOfferlessTag = this.tags.some((tag) => tag?.includes('offerless'));
        if (this.type === 'merch-card' && !this.osi && !hasOfferlessTag) {
            return;
        }

        this.loading = true;

        const modelId =
            this.type === 'merch-card' ? TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD] : TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION];

        const fragmentData = {
            modelId,
            title: this.title,
            name: this.normalizeFragmentName(this.title),
        };
        if (this.type === 'merch-card') {
            fragmentData.data = {
                osi: this.osi,
                tags: this.tags,
                compatVersion: COMPAT_VERSION,
            };
        } else {
            fragmentData.data = { label: this.title };
            if (this.type === COMPARE_CHART_CREATE_TYPE) {
                fragmentData.data[COMPARE_CHART_FIELD] = DEFAULT_COMPARE_CHART_HTML;
                fragmentData.tags = [TAG_COMPARE_CHART];
            }
        }

        const masRepository = this.repository;
        const firstName = fragmentData.name;
        let nmbOfTries = 0;
        let created = false;
        try {
            while (!created && nmbOfTries <= 10) {
                created = await this.tryToCreateFragment(masRepository, fragmentData);
                if (created) break;
                nmbOfTries += 1;
                fragmentData.name = `${firstName}-${this.getSuffix(nmbOfTries)}`;
            }
            if (!created) this.loading = false;
        } catch (error) {
            if (error.message !== 'Fragment was not created.') {
                console.error(error.message, error.stack);
                showToast(`Failed to create fragment: ${error.message}`, 'negative');
            }
            this.loading = false;
        }
    }

    async #submitBaseline() {
        this.loading = true;
        let result;
        try {
            result = await createBaseline(this.repository, {
                title: this.title,
                name: this.normalizeFragmentName(this.title),
                osi: this.osi,
                surface: this.surface,
                locale: this.filters.value.locale,
                template: this.template,
                productArrangementCode: this.productArrangementCode,
                marketSegment: this.marketSegment,
            });
        } catch (error) {
            console.error(error.message, error.stack);
            showToast(`Failed to create baseline: ${error.message}`, 'negative');
        } finally {
            this.loading = false;
        }
        if (result?.exists) {
            this.#setError('title', BASELINE_EXISTS_ERROR);
            return;
        }
        if (!result?.fragment?.id) return;
        this.close();
        await this.#openFragmentEditor(result.fragment.id);
    }

    close() {
        this.#resetForm();
        this.dispatchEvent(new CustomEvent('close'));
    }

    get typeConfig() {
        return TYPE_CONFIG[this.type] ?? DEFAULT_TYPE_CONFIG;
    }

    get dialogTitle() {
        return `Create New ${this.typeConfig.label}`;
    }

    get titleErrorMessage() {
        return this.touched.title && !this.title ? 'Enter a title' : this.errors.title;
    }

    get surface() {
        return this.search.value.path;
    }

    get repository() {
        return document.querySelector('mas-repository');
    }

    get osiField() {
        return this.shadowRoot.querySelector('osi-field');
    }

    #markOfferSelectorOpened() {
        this.offerSelectorOpened = true;
    }

    openOfferSelector() {
        this.#markOfferSelectorOpened();
        this.osiField.handleOpenOfferSelector();
    }

    get offerErrorMessage() {
        return this.touched.osi && !this.osi ? 'Select an offer' : this.errors.offer;
    }

    get offerFieldTemplate() {
        const errorMessage = this.offerErrorMessage;
        const pendingProductArrangementCode = this.errors.offer ? '—' : '…';
        return html`
            <div class="form-field with-message">
                <sp-field-label id="offer-label" required>Offer</sp-field-label>
                <osi-field hidden></osi-field>
                <div role="group" aria-labelledby="offer-label" class=${this.osi ? 'offer-card' : nothing}>
                    ${this.osi
                        ? html`<sp-icon-shopping-cart></sp-icon-shopping-cart>
                              <div class="offer-details">
                                  <p>OSI: <strong>${this.osi}</strong></p>
                                  <p>
                                      PA code:
                                      <strong>${this.productArrangementCode || pendingProductArrangementCode}</strong>
                                  </p>
                                  ${this.marketSegment
                                      ? html`<p>Market segment: <strong>${this.marketSegment}</strong></p>`
                                      : nothing}
                              </div>`
                        : nothing}
                    <sp-action-button
                        class=${classMap({ 'full-width': !this.osi, invalid: !this.osi && Boolean(errorMessage) })}
                        ?quiet=${Boolean(this.osi)}
                        aria-invalid=${errorMessage ? 'true' : nothing}
                        aria-describedby=${errorMessage ? 'offer-error' : nothing}
                        @click=${this.openOfferSelector}
                    >
                        ${this.osi
                            ? html`<sp-icon-edit slot="icon"></sp-icon-edit>`
                            : html`<sp-icon-shopping-cart slot="icon"></sp-icon-shopping-cart>`}
                        ${this.osi ? 'Change offer' : 'Select offer…'}
                    </sp-action-button>
                </div>
                ${fieldMessage('offer-error', errorMessage)}
            </div>
        `;
    }

    get templateFieldTemplate() {
        const errorMessage = this.touched.template && !this.template ? 'Select a template' : '';
        return html`
            <div class="form-field with-message">
                <sp-field-label id="template-label" for="template" required>Template</sp-field-label>
                <variant-picker
                    id="template"
                    .value=${this.template}
                    .surface=${this.surface}
                    .description=${errorMessage}
                    ?disabled=${!this.surface}
                    ?invalid=${Boolean(errorMessage)}
                    @change=${this.#handleTemplateChange}
                ></variant-picker>
                <div class="field-message" aria-hidden="true">
                    ${errorMessage
                        ? html`<sp-help-text id="template-error" variant="negative">${errorMessage}</sp-help-text>`
                        : nothing}
                </div>
            </div>
        `;
    }

    get baselineFields() {
        return html`${this.offerFieldTemplate} ${this.templateFieldTemplate}`;
    }

    render() {
        if (this.loading) {
            return html`
                <div class="loading-overlay">
                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                </div>
            `;
        }

        return html`
            <div class="dialog-backdrop" @click=${this.handleBackdropClick}>
                <div class="dialog-container" @click=${(e) => e.stopPropagation()}>
                    <div class="dialog-header">${this.dialogTitle}</div>
                    <div class="dialog-content">
                        <form @submit=${this.handleSubmit}>
                            <div class="form-field with-message">
                                <sp-field-label for="fragment-title" required>${this.typeConfig.titleLabel}</sp-field-label>
                                <sp-textfield
                                    id="fragment-title"
                                    placeholder=${this.typeConfig.placeholder}
                                    value=${this.title}
                                    ?required=${this.touched.title && !this.errors.title}
                                    ?invalid=${Boolean(this.errors.title)}
                                    aria-describedby=${this.titleErrorMessage ? 'title-error' : nothing}
                                    @input=${(e) => this.handleTitleChange(e.target.value)}
                                    @focusout=${() => this.#touch('title')}
                                ></sp-textfield>
                                ${fieldMessage('title-error', this.titleErrorMessage)}
                            </div>
                            ${this.type === 'merch-card'
                                ? html`
                                      <div class="form-field">
                                          <sp-field-label for="osi" required>OSI Search</sp-field-label>
                                          <osi-field
                                              id="osi"
                                              data-field="osi"
                                              ?suppress-error=${!this.touched.osi}
                                              @click=${this.#markOfferSelectorOpened}
                                          ></osi-field>
                                      </div>
                                      <aem-tag-picker-field
                                          label="Tags"
                                          namespace="/content/cq:tags/mas"
                                          multiple
                                          @change=${this.#handeTagsChange}
                                      ></aem-tag-picker-field>
                                  `
                                : nothing}
                            ${this.type === BASELINE_CREATE_TYPE ? this.baselineFields : nothing}
                        </form>
                    </div>
                    <div class="dialog-footer">
                        <sp-button variant="secondary" @click=${this.close}>Cancel</sp-button>
                        <sp-button variant="accent" @click=${this.handleSubmit}>Create</sp-button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-create-dialog', MasCreateDialog);
