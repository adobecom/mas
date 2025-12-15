import { html, LitElement, nothing } from 'lit';
import '../fields/multifield.js';
import '../fields/included-field.js';
import '../fields/mnemonic-field.js';
import '../aem/aem-tag-picker-field.js';
import './variant-picker.js';
import { SPECTRUM_COLORS } from '../utils/spectrum-colors.js';
import '../rte/osi-field.js';
import { CARD_MODEL_PATH } from '../constants.js';
import '../fields/secure-text-field.js';
import '../fields/plan-type-field.js';
import { getFragmentMapping, showToast } from '../utils.js';
import '../fields/addon-field.js';
import Store from '../store.js';
import Events from '../events.js';
import { VARIANT_NAMES } from './variant-picker.js';
import ReactiveController from '../reactivity/reactive-controller.js';

const QUANTITY_MODEL = 'quantitySelect';
const WHAT_IS_INCLUDED = 'whatsIncluded';

const VARIANT_RTE_MARKS = {
    [VARIANT_NAMES.MINI]: {
        description: {
            marks: ['promo-text', 'promo-duration-text', 'renewal-text'],
        },
    },
};

class MerchCardEditor extends LitElement {
    static properties = {
        currentVariantMapping: { type: Object, attribute: false },
        fragmentStore: { type: Object, attribute: false },
        updateFragment: { type: Function },
        localeDefaultFragment: { type: Object, attribute: false },
        isVariation: { type: Boolean, attribute: false },
        fieldsReady: { type: Boolean, state: true },
    };

    static SECTION_FIELDS = {
        Visuals: ['mnemonics', 'badge', 'trialBadge', 'border-color'],
        "What's included": ['whatsIncluded', 'quantitySelect'],
        'Product details': ['description', 'shortDescription', 'callout'],
        Footer: ['ctas'],
        'Options and settings': ['secureLabel', 'planType', 'addon'],
    };

    availableSizes = [];
    availableColors = [];
    availableBorderColors = [];
    availableBadgeColors = [];
    availableBackgroundColors = [];
    quantitySelectorValues = '';
    lastMnemonicState = null;
    reactiveController = null;

    constructor() {
        super();
        this.fragmentStore = null;
        this.updateFragment = null;
        this.currentVariantMapping = null;
        this.localeDefaultFragment = null;
        this.isVariation = false;
        this.lastMnemonicState = null;
        this.fieldsReady = false;
        this.reactiveController = new ReactiveController(this, []);
    }

    createRenderRoot() {
        return this;
    }

    get effectiveIsVariation() {
        return this.isVariation && this.localeDefaultFragment !== null;
    }

    getEffectiveFieldValue(fieldName, index = 0) {
        return this.fragment.getEffectiveFieldValue(fieldName, this.localeDefaultFragment, this.effectiveIsVariation, index);
    }

    getEffectiveFieldValues(fieldName) {
        return this.fragment.getEffectiveFieldValues(fieldName, this.localeDefaultFragment, this.effectiveIsVariation);
    }

    isFieldOverridden(fieldName) {
        return this.fragment.isFieldOverridden(fieldName, this.localeDefaultFragment, this.effectiveIsVariation);
    }

    getFieldState(fieldName) {
        return this.fragment.getFieldState(fieldName, this.localeDefaultFragment, this.effectiveIsVariation);
    }

    async resetFieldToParent(fieldName) {
        await this.updateComplete;
        const parentValues = this.localeDefaultFragment?.getField(fieldName)?.values || [];
        const success = this.fragmentStore.resetFieldToParent(fieldName, parentValues);
        if (success) {
            showToast('Field restored to parent value', 'positive');
            await this.updateComplete;
            const rteField = this.querySelector(`rte-field[data-field="${fieldName}"]`);
            if (rteField && parentValues.length > 0) {
                rteField.updateContent(parentValues[0]);
            }
        }
        return success;
    }

    renderOverrideIndicator(fieldName) {
        if (this.isVariation && !this.localeDefaultFragment) {
            return nothing;
        }
        const state = this.getFieldState(fieldName);
        const isOverridden = state === 'overridden';
        return html`
            <div class="field-reset-link">
                ${isOverridden
                    ? html`<a
                          href="javascript:void(0)"
                          @click=${(e) => {
                              e.preventDefault();
                              this.resetFieldToParent(fieldName);
                          }}
                      >
                          ↩ Overridden. Click to restore.
                      </a>`
                    : nothing}
            </div>
        `;
    }

    isSectionOverridden(fieldNames) {
        if (!this.isVariation || !this.localeDefaultFragment) {
            return false;
        }
        return fieldNames.some((fieldName) => this.getFieldState(fieldName) === 'overridden');
    }

    async resetSectionToParent(fieldNames) {
        for (const fieldName of fieldNames) {
            if (this.getFieldState(fieldName) === 'overridden') {
                await this.resetFieldToParent(fieldName);
            }
        }
    }

    renderSectionOverrideIndicator(fieldNames) {
        if (!this.isVariation || !this.localeDefaultFragment) {
            return nothing;
        }
        const isOverridden = this.isSectionOverridden(fieldNames);
        return html`
            <div class="field-reset-link">
                ${isOverridden
                    ? html`<a
                          href="javascript:void(0)"
                          @click=${(e) => {
                              e.preventDefault();
                              this.resetSectionToParent(fieldNames);
                          }}
                      >
                          ↩ Overridden. Click to restore.
                      </a>`
                    : nothing}
            </div>
        `;
    }

    getFormWithInheritance() {
        const allFieldNames = new Set();
        this.fragment.fields.forEach((f) => allFieldNames.add(f.name));
        if (this.localeDefaultFragment) {
            this.localeDefaultFragment.fields.forEach((f) => allFieldNames.add(f.name));
        }

        const form = {};
        allFieldNames.forEach((fieldName) => {
            const effectiveValues = this.getEffectiveFieldValues(fieldName);
            form[fieldName] = {
                name: fieldName,
                values: effectiveValues,
            };
        });

        return form;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.lastMnemonicState = null;
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('fragmentStore') && this.fragmentStore) {
            this.fieldsReady = false;
            this.reactiveController.updateStores([this.fragmentStore]);
            this.#updateCurrentVariantMapping();
            this.#updateAvailableSizes();
            this.#updateAvailableColors();
            this.#updateBackgroundColors();
        }
        if (changedProperties.has('localeDefaultFragment')) {
            this.fieldsReady = false;
            this.#updateCurrentVariantMapping();
            this.#updateAvailableColors();
            this.#updateBackgroundColors();
        }
    }

    firstUpdated() {}

    get whatsIncludedElement() {
        const whatsIncludedHtml = this.getEffectiveFieldValue(WHAT_IS_INCLUDED, 0) || '';

        if (!whatsIncludedHtml) return undefined;

        const parser = new DOMParser();
        const doc = parser.parseFromString(whatsIncludedHtml, 'text/html');
        return doc.querySelector('merch-whats-included');
    }

    get whatsIncluded() {
        const label = this.whatsIncludedElement?.querySelector('[slot="heading"]')?.textContent || '';
        const values = [];
        this.whatsIncludedElement?.querySelectorAll('merch-mnemonic-list').forEach((listEl) => {
            const iconEl = listEl.querySelector('merch-icon');
            const icon = iconEl?.getAttribute('src') || '';
            const alt = iconEl?.getAttribute('alt') || '';
            const linkEl = listEl.querySelector('[slot="icon"] a');
            const link = linkEl?.getAttribute('href') || '';
            values.push({ icon, alt, link });
        });

        return {
            label,
            values,
        };
    }

    get mnemonics() {
        if (!this.fragment) return [];

        const mnemonicIcon = this.getEffectiveFieldValues('mnemonicIcon');
        const mnemonicAlt = this.getEffectiveFieldValues('mnemonicAlt');
        const mnemonicLink = this.getEffectiveFieldValues('mnemonicLink');
        const mnemonicTooltipText = this.getEffectiveFieldValues('mnemonicTooltipText');
        const mnemonicTooltipPlacement = this.getEffectiveFieldValues('mnemonicTooltipPlacement');
        return (
            mnemonicIcon?.map((icon, index) => ({
                icon,
                alt: mnemonicAlt[index] ?? '',
                link: mnemonicLink[index] ?? '',
                mnemonicText: mnemonicTooltipText[index] ?? '',
                mnemonicPlacement: mnemonicTooltipPlacement[index] ?? 'top',
            })) ?? []
        );
    }

    get fragment() {
        return this.fragmentStore.get();
    }

    get quantityValue() {
        return this.fragmentQuantityValue || this.quantitySelectorValues || '';
    }

    get fragmentQuantityValue() {
        return this.fragment?.fields.find((f) => f.name === QUANTITY_MODEL)?.values[0] || '';
    }

    getQuantityAttribute(name) {
        if (!this.quantityValue) return undefined;

        const parser = new DOMParser();
        const doc = parser.parseFromString(this.quantityValue, 'text/html');
        const element = doc.querySelector('merch-quantity-select');
        return element?.getAttribute(name);
    }

    get quantityTitle() {
        return this.getQuantityAttribute('title') ?? '';
    }

    get quantityStart() {
        return this.getQuantityAttribute('min') ?? 1;
    }

    get quantityStep() {
        return this.getQuantityAttribute('step') ?? 1;
    }

    get quantitySelectorDisplayed() {
        return !!this.fragmentQuantityValue.trim();
    }

    createQsElement(min, step, title) {
        const el = document.createElement('merch-quantity-select');
        el.setAttribute('title', title);
        el.setAttribute('min', min);
        el.setAttribute('max', '10');
        el.setAttribute('step', step);
        return el;
    }

    #updateQuantityValues(event) {
        const vals = [this.quantityStart, this.quantityStep, this.quantityTitle];
        if (event.target.dataset.field === 'startQuantity') {
            vals[0] = event.target.value;
        } else if (event.target.dataset.field === 'stepQuantity') {
            vals[1] = event.target.value;
        } else if (event.target.dataset.field === 'titleQuantity') {
            vals[2] = event.target.value;
        }

        const html = this.createQsElement(vals[0], vals[1], vals[2]).outerHTML;
        this.fragmentStore.updateField(QUANTITY_MODEL, [html]);
        this.quantitySelectorValues = html;
    }

    #showQuantityFields = (e) => {
        this.showQuantityFields(e.target.checked);

        let html = '';
        if (e.target.checked) {
            html = this.createQsElement(this.quantityStart, this.quantityStep, this.quantityTitle).outerHTML;
        } else {
            const qsValues = this.fragmentStore.get().getField(QUANTITY_MODEL)?.values;
            this.quantitySelectorValues = qsValues?.length ? qsValues[0] : '';
        }
        const fragment = this.fragmentStore.get();
        fragment.updateField(QUANTITY_MODEL, [html]);
        this.fragmentStore.set(fragment);
    };

    showQuantityFields(show) {
        const element = this.querySelector('#quantitySelector');
        if (element) element.style.display = show ? 'block' : 'none';
    }

    async updated(changedProperties) {
        super.updated(changedProperties);
        if (!this.fieldsReady && this.fragment) {
            await this.updateComplete;
            void this.offsetHeight;
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            this.toggleFields();
        }
    }

    async toggleFields() {
        if (!this.fragment) {
            return;
        }
        const variantValue = this.fragment.variant;
        if (!variantValue) {
            this.fieldsReady = true;
            return;
        }
        await customElements.whenDefined('merch-card');
        this.#updateCurrentVariantMapping();
        const variant = this.currentVariantMapping;
        if (!variant) {
            this.fieldsReady = true;
            return;
        }

        this.querySelectorAll('sp-field-group.toggle').forEach((field) => {
            field.style.display = 'none';
        });
        Object.entries(variant).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length === 0) return;
            const field = this.querySelector(`sp-field-group.toggle#${key}`);
            if (field) field.style.display = 'block';
        });
        this.showQuantityFields(this.quantitySelectorDisplayed);
        if (variant.borderColor) {
            const borderField = this.querySelector('sp-field-group.toggle#border-color');
            if (borderField) borderField.style.display = 'block';
        }
        this.#displayBadgeColorFields(this.badgeText);
        this.#displayTrialBadgeColorFields(this.trialBadgeText);

        if (variant.disabledAttributes && Array.isArray(variant.disabledAttributes)) {
            variant.disabledAttributes.forEach((attributeId) => {
                const field = this.querySelector(`sp-field-group#${attributeId}`);
                if (field) field.style.display = 'none';
            });
        }

        this.toggleSectionHeadings();
        this.fieldsReady = true;
    }

    toggleSectionHeadings() {
        Object.entries(this.constructor.SECTION_FIELDS).forEach(([sectionTitle, fieldIds]) => {
            const hasVisibleFields = fieldIds.some((fieldId) => {
                const field = this.querySelector(`#${fieldId}`);
                return field && field.style.display !== 'none';
            });

            const sectionHeadings = Array.from(this.querySelectorAll('.section-title'));
            const heading = sectionHeadings.find((h) => h.textContent.trim() === sectionTitle);

            if (heading) {
                heading.style.display = hasVisibleFields ? 'block' : 'none';
            }
        });
    }

    renderSkeleton() {
        return html`
            <style>
                .editor-skeleton {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .skeleton-element {
                    background: linear-gradient(
                        90deg,
                        var(--spectrum-gray-200) 25%,
                        var(--spectrum-gray-100) 50%,
                        var(--spectrum-gray-200) 75%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 4px;
                }
                @keyframes shimmer {
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
                .skeleton-section-title {
                    height: 20px;
                    width: 120px;
                }
                .skeleton-field {
                    height: 40px;
                    width: 100%;
                }
                .skeleton-field-short {
                    height: 40px;
                    width: 60%;
                }
            </style>
            <div class="editor-skeleton">
                <div class="skeleton-element skeleton-section-title"></div>
                <div class="skeleton-element skeleton-field"></div>
                <div class="skeleton-element skeleton-field-short"></div>
                <div class="skeleton-element skeleton-section-title"></div>
                <div class="skeleton-element skeleton-field"></div>
                <div class="skeleton-element skeleton-field"></div>
                <div class="skeleton-element skeleton-section-title"></div>
                <div class="skeleton-element skeleton-field-short"></div>
            </div>
        `;
    }

    render() {
        if (!this.fragment) return nothing;
        if (this.fragment.model.path !== CARD_MODEL_PATH) return nothing;

        const form = this.getFormWithInheritance();
        const skeletonDisplay = this.fieldsReady ? 'none' : 'block';
        const formDisplay = this.fieldsReady ? 'block' : 'none';
        return html`
            <style>
                .field-reset-link {
                    margin-top: 4px;
                }

                .field-reset-link a {
                    color: var(--spectrum-blue-600);
                    font-size: 12px;
                    text-decoration: none;
                    cursor: pointer;
                }

                .section-title {
                    font-size: 20px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    color: var(--spectrum-gray-900);
                    letter-spacing: -0.01em;
                }

                .section-description {
                    font-size: 13px;
                    color: var(--spectrum-gray-700);
                    margin-bottom: 24px;
                    line-height: 1.5;
                }

                .two-column-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .tags-spacing {
                    margin: 0;
                }

                .full-width {
                    width: 100%;
                }

                sp-field-group sp-textfield,
                sp-field-group sp-picker {
                    width: 100%;
                }

                #whatsIncluded sp-textfield {
                    margin-bottom: 16px;
                }

                .menu-item-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    overflow: hidden;
                    min-width: 0;
                    width: 100%;
                }

                .color-swatch {
                    width: 16px;
                    height: 16px;
                    border: 1px solid var(--spectrum-gray-300);
                    border-radius: 3px;
                    flex-shrink: 0;
                }

                .color-name-text {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    min-width: 0;
                }
                .editor-skeleton-wrapper {
                    display: var(--skeleton-display, none);
                }
                .editor-form-container {
                    display: var(--form-display, block);
                }
            </style>
            <div class="editor-skeleton-wrapper" style="--skeleton-display: ${skeletonDisplay}">${this.renderSkeleton()}</div>
            <div class="editor-form-container" style="--form-display: ${formDisplay}">
                <div class="section-title">General info</div>
                <div class="two-column-grid">
                    <sp-field-group id="variant">
                        <sp-field-label for="card-variant">Template</sp-field-label>
                        <variant-picker
                            id="card-variant"
                            ?show-all="false"
                            data-field="variant"
                            default-value="${form.variant.values[0]}"
                            @change="${this.#handleVariantChange}"
                        ></variant-picker>
                    </sp-field-group>
                    <sp-field-group id="style">
                        <sp-field-label for="card-style">Style</sp-field-label>
                        <sp-picker
                            id="card-style"
                            data-field="style"
                            value="${form.style?.values[0] || 'default'}"
                            data-default-value="default"
                            @change="${this.#handleFragmentUpdate}"
                        >
                            <sp-menu-item value="default">Default</sp-menu-item>
                            <sp-menu-item value="dark">Dark</sp-menu-item>
                        </sp-picker>
                    </sp-field-group>
                    <sp-field-group class="toggle" id="cardName">
                        <sp-field-label for="card-name">Card name</sp-field-label>
                        <sp-textfield
                            placeholder="Enter card name"
                            id="card-name"
                            data-field="cardName"
                            value="${form.cardName.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                        ></sp-textfield>
                        ${this.renderOverrideIndicator('cardName')}
                    </sp-field-group>
                    <sp-field-group id="fragment-title-group">
                        <sp-field-label for="fragment-title">Fragment title</sp-field-label>
                        <sp-textfield
                            placeholder="Enter fragment title"
                            id="fragment-title"
                            value="${this.fragment.title}"
                            @input="${this.#handleFragmentTitleUpdate}"
                        ></sp-textfield>
                    </sp-field-group>
                    <sp-field-group id="fragment-description-group">
                        <sp-field-label for="fragment-description">Fragment description</sp-field-label>
                        <sp-textfield
                            placeholder="Enter fragment description"
                            id="fragment-description"
                            value="${this.fragment.description}"
                            @input="${this.#handleFragmentDescriptionUpdate}"
                        ></sp-textfield>
                    </sp-field-group>
                </div>
                <sp-field-group class="toggle" id="title">
                    <sp-field-label for="card-title">Title</sp-field-label>
                    <rte-field
                        id="card-title"
                        inline
                        link
                        mnemonic
                        data-field="cardTitle"
                        .osi=${form.osi.values[0]}
                        .value=${form.cardTitle.values[0] || ''}
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderOverrideIndicator('cardTitle')}
                </sp-field-group>
                <div class="two-column-grid">
                    <sp-field-group class="toggle" id="subtitle">
                        <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
                        <sp-textfield
                            placeholder="Enter card subtitle"
                            id="card-subtitle"
                            data-field="subtitle"
                            value="${form.subtitle.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                        ></sp-textfield>
                        ${this.renderOverrideIndicator('subtitle')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="size">
                        <sp-field-label for="card-size">Size</sp-field-label>
                        <sp-picker
                            id="card-size"
                            data-field="size"
                            value="${form.size.values[0] || 'Default'}"
                            data-default-value="Default"
                            @change="${this.#handleFragmentUpdate}"
                        >
                            ${(this.availableSizes || []).map(
                                (size) => html` <sp-menu-item value="${size}">${this.#formatName(size)}</sp-menu-item> `,
                            )}
                        </sp-picker>
                        ${this.renderOverrideIndicator('size')}
                    </sp-field-group>
                </div>
                <sp-field-group id="tags">
                    <sp-field-label for="tags-field">Tags</sp-field-label>
                    <aem-tag-picker-field
                        id="tags-field"
                        label="Tags"
                        namespace="/content/cq:tags/mas"
                        multiple
                        class="tags-spacing"
                        value="${this.fragment.tags.map((tag) => tag.id).join(',')}"
                        @change=${this.#handeTagsChange}
                    ></aem-tag-picker-field>
                </sp-field-group>
                <div class="section-title">Visuals</div>
                ${this.renderSectionOverrideIndicator(['mnemonics'])}
                <sp-field-group class="toggle" id="mnemonics">
                    <mas-multifield
                        id="mnemonics"
                        button-label="Add visual"
                        .value="${this.mnemonics}"
                        @change="${this.#updateMnemonics}"
                        @input="${this.#updateMnemonics}"
                    >
                        <template>
                            <mas-mnemonic-field></mas-mnemonic-field>
                        </template>
                    </mas-multifield>
                    ${this.renderOverrideIndicator('mnemonics')}
                </sp-field-group>
                <div class="two-column-grid">
                    <sp-field-group class="toggle" id="badge">
                        <sp-field-label for="card-badge">Badge</sp-field-label>
                        <sp-textfield
                            placeholder="Enter badge text"
                            id="card-badge"
                            data-field="badge"
                            value="${this.badge.text}"
                            @input="${this.#updateBadgeText}"
                        ></sp-textfield>
                        ${this.renderBadgeComponentOverrideIndicator('badge', 'text')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="trialBadge">
                        <sp-field-label for="card-trial-badge">Trial Badge</sp-field-label>
                        <sp-textfield
                            placeholder="Enter badge text"
                            id="card-trial-badge"
                            data-field="trialBadge"
                            value="${this.trialBadge.text}"
                            @input="${this.#updateTrialBadgeText}"
                        ></sp-textfield>
                        ${this.renderBadgeComponentOverrideIndicator('trialBadge', 'text')}
                    </sp-field-group>
                </div>
                ${this.#renderBadgeColors()} ${this.#renderTrialBadgeColors()}
                <div class="two-column-grid">
                    ${this.#renderColorPicker(
                        'border-color',
                        'Border Color',
                        this.availableBorderColors,
                        form.borderColor?.values[0],
                        'borderColor',
                    )}
                    ${this.#backgroundColorSelection(
                        this.availableBackgroundColors,
                        form.backgroundColor?.values[0],
                        'backgroundColor',
                    )}
                </div>
                <sp-field-group class="toggle" id="whatsIncluded">
                    <div class="section-title">What's included</div>
                    ${this.renderSectionOverrideIndicator(['whatsIncluded'])}
                    <sp-textfield
                        id="whatsIncludedLabel"
                        placeholder="Enter the label text"
                        value="${this.whatsIncluded.label}"
                        @input="${this.#updateWhatsIncluded}"
                    ></sp-textfield>
                    <mas-multifield
                        button-label="Add application"
                        .value="${this.whatsIncluded.values}"
                        @change="${this.#updateWhatsIncluded}"
                        @input="${this.#updateWhatsIncluded}"
                    >
                        <template>
                            <mas-included-field></mas-included-field>
                        </template>
                    </mas-multifield>
                    ${this.renderOverrideIndicator('whatsIncluded')}
                </sp-field-group>
                <sp-field-group class="toggle" id="quantitySelect">
                    <div class="section-title">Quantity selection</div>
                    ${this.renderSectionOverrideIndicator(['titleQuantity', 'startQuantity', 'stepQuantity'])}
                    <sp-checkbox
                        size="m"
                        value="${this.quantitySelectorDisplayed}"
                        .checked="${this.quantitySelectorDisplayed}"
                        @change="${this.#showQuantityFields}"
                        ?disabled=${this.disabled}
                        >Show quantity selector</sp-checkbox
                    >
                    <div id="quantitySelector" style="display: ${this.quantitySelectorDisplayed ? 'block' : 'none'};">
                        <div class="two-column-grid">
                            <sp-field-group id="quantitySelectorTitle">
                                <sp-field-label for="title-quantity">Quantity selector title</sp-field-label>
                                <sp-textfield
                                    id="title-quantity"
                                    data-field="titleQuantity"
                                    value="${this.quantityTitle}"
                                    @input="${this.#updateQuantityValues}"
                                    ?disabled=${this.disabled}
                                ></sp-textfield>
                                ${this.renderOverrideIndicator('titleQuantity')}
                            </sp-field-group>
                            <sp-field-group id="quantitySelectorStart">
                                <sp-field-label for="start-quantity">Start quantity</sp-field-label>
                                <sp-textfield
                                    id="start-quantity"
                                    data-field="startQuantity"
                                    pattern="[0-9]*"
                                    value="${this.quantityStart}"
                                    @input="${this.#updateQuantityValues}"
                                    ?disabled=${this.disabled}
                                    ><sp-help-text slot="negative-help-text">Numeric values only</sp-help-text></sp-textfield
                                >
                                ${this.renderOverrideIndicator('startQuantity')}
                            </sp-field-group>
                        </div>
                        <sp-field-group id="quantitySelectorStep">
                            <sp-field-label for="step-quantity">Step</sp-field-label>
                            <sp-textfield
                                id="step-quantity"
                                data-field="stepQuantity"
                                pattern="[0-9]*"
                                value="${this.quantityStep}"
                                @input="${this.#updateQuantityValues}"
                                ?disabled=${this.disabled}
                                ><sp-help-text slot="negative-help-text">Numeric values only</sp-help-text></sp-textfield
                            >
                            ${this.renderOverrideIndicator('stepQuantity')}
                        </sp-field-group>
                    </div>
                </sp-field-group>
                <div class="two-column-grid">
                    <sp-field-group class="toggle" id="backgroundImage">
                        <sp-field-label for="background-image">Background Image</sp-field-label>
                        <sp-textfield
                            placeholder="Enter background image URL"
                            id="background-image"
                            data-field="backgroundImage"
                            value="${form.backgroundImage.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                        ></sp-textfield>
                        ${this.renderOverrideIndicator('backgroundImage')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="backgroundImageAltText">
                        <sp-field-label for="background-image-alt-text">Background Image Alt Text</sp-field-label>
                        <sp-textfield
                            placeholder="Enter background image Alt Text"
                            id="background-image-alt-text"
                            data-field="backgroundImageAltText"
                            value="${form.backgroundImageAltText.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                        ></sp-textfield>
                        ${this.renderOverrideIndicator('backgroundImageAltText')}
                    </sp-field-group>
                </div>
                <div class="section-title">Price and Promo</div>
                <sp-field-group class="toggle" id="prices">
                    <sp-field-label for="prices">Product price</sp-field-label>
                    <rte-field
                        id="prices"
                        styling
                        link
                        mnemonic
                        multiline
                        data-field="prices"
                        .osi=${form.osi.values[0]}
                        .value=${form.prices.values[0] || ''}
                        default-link-style="primary-outline"
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderOverrideIndicator('prices')}
                </sp-field-group>
                <div class="two-column-grid">
                    <sp-field-group id="promoCode">
                        <sp-field-label for="promo-code">Promo Code</sp-field-label>
                        <sp-textfield
                            placeholder="Enter promo code"
                            id="promo-code"
                            data-field="promoCode"
                            value="${form.promoCode?.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                            ?disabled=${this.disabled}
                        ></sp-textfield>
                        ${this.renderOverrideIndicator('promoCode')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="addonConfirmation">
                        <sp-field-label for="addon-confirmation">Addon Confirmation</sp-field-label>
                        <sp-textfield
                            placeholder="Enter addon confirmation text"
                            id="addon-confirmation"
                            data-field="addonConfirmation"
                            value="${form.addonConfirmation?.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                            ?disabled=${this.disabled}
                        ></sp-textfield>
                        ${this.renderOverrideIndicator('addonConfirmation')}
                    </sp-field-group>
                </div>
                <sp-field-group class="toggle" id="promoText">
                    <sp-field-label for="promo-text">Promo Text</sp-field-label>
                    <sp-textfield
                        placeholder="Enter promo text"
                        id="promo-text"
                        data-field="promoText"
                        value="${form.promoText?.values[0]}"
                        @input="${this.#handleFragmentUpdate}"
                        ?disabled=${this.disabled}
                    ></sp-textfield>
                    ${this.renderOverrideIndicator('promoText')}
                </sp-field-group>
                <sp-field-group>
                    <sp-field-label for="osi">OSI Search</sp-field-label>
                    <osi-field
                        id="osi"
                        data-field="osi"
                        .value=${form.osi.values[0]}
                        @input="${this.#handleFragmentUpdate}"
                        @change="${this.#handleFragmentUpdate}"
                    ></osi-field>
                    ${this.renderOverrideIndicator('osi')}
                </sp-field-group>
                <sp-field-group id="perUnitLabel" class="toggle">
                    <sp-divider></sp-divider>
                    <sp-field-label for="per-unit-label">Per Unit Label</sp-field-label>
                    <sp-textfield
                        id="per-unit-label"
                        placeholder="Enter per unit label"
                        data-field="perUnitLabel"
                        class="full-width"
                        value="${this.#getPerUnitDisplayValue(form.perUnitLabel?.values[0])}"
                        @input="${this.#handlePerUnitLabelUpdate}"
                    ></sp-textfield>
                    ${this.renderOverrideIndicator('perUnitLabel')}
                </sp-field-group>
                <div class="section-title">Product details</div>
                <sp-field-group class="toggle" id="description">
                    <sp-field-label for="description">Product description</sp-field-label>
                    <rte-field
                        id="description"
                        styling
                        link
                        upt-link
                        list
                        mnemonic
                        divider
                        .marks=${VARIANT_RTE_MARKS[this.fragment.variant]?.description?.marks}
                        data-field="description"
                        .osi=${form.osi.values[0]}
                        .value=${form.description.values[0] || ''}
                        default-link-style="secondary-link"
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderOverrideIndicator('description')}
                </sp-field-group>
                <sp-field-group class="toggle" id="shortDescription">
                    <sp-field-label for="shortDescription">Short Description</sp-field-label>
                    <rte-field
                        id="shortDescription"
                        styling
                        link
                        upt-link
                        list
                        mnemonic
                        data-field="shortDescription"
                        .osi=${form.osi.values[0]}
                        .value=${form.shortDescription?.values[0] || ''}
                        default-link-style="secondary-link"
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderOverrideIndicator('shortDescription')}
                </sp-field-group>
                <sp-field-group class="toggle" id="callout">
                    <sp-field-label for="callout"> Callout text </sp-field-label>
                    <rte-field
                        id="callout"
                        link
                        icon
                        data-field="callout"
                        .osi=${form.osi.values[0]}
                        .value=${form.callout?.values[0] || ''}
                        default-link-style="secondary-link"
                        @change="${this.#handleFragmentUpdate}"
                        ?readonly=${this.disabled}
                    ></rte-field>
                    ${this.renderOverrideIndicator('callout')}
                </sp-field-group>
                <div class="section-title">Footer</div>
                <sp-field-group class="toggle" id="ctas">
                    <rte-field
                        id="ctas"
                        link
                        inline
                        data-field="ctas"
                        .osi=${form.osi.values[0]}
                        .value=${form.ctas.values[0] || ''}
                        default-link-style="primary-outline"
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderOverrideIndicator('ctas')}
                </sp-field-group>
                <div class="section-title">Options and settings</div>
                <div class="two-column-grid">
                    <sp-field-group id="secureLabel" class="toggle">
                        <secure-text-field
                            id="secure-text-field"
                            label="Secure Transaction Label"
                            data-field="showSecureLabel"
                            value="${form.showSecureLabel?.values[0]}"
                            @change="${this.#handleFragmentUpdate}"
                        >
                        </secure-text-field>
                        ${this.renderOverrideIndicator('showSecureLabel')}
                    </sp-field-group>
                    <sp-field-group id="planType" class="toggle">
                        <mas-plan-type-field
                            id="plan-type-field"
                            label="Plan Type text"
                            data-field="showPlanType"
                            value="${form.showPlanType?.values[0]}"
                            @change="${this.#handleFragmentUpdate}"
                        >
                        </mas-plan-type-field>
                        ${this.renderOverrideIndicator('showPlanType')}
                    </sp-field-group>
                </div>
                <sp-field-group id="addon" class="toggle">
                    <mas-addon-field
                        id="addon-field"
                        label="Addon"
                        data-field="addon"
                        .value="${form.addon?.values[0]}"
                        @change="${this.updateFragment}"
                    >
                    </mas-addon-field>
                    ${this.renderOverrideIndicator('addon')}
                </sp-field-group>
                <sp-field-group id="locReady">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <sp-field-label for="loc-ready">Send to translation?</sp-field-label>
                        <sp-switch
                            id="loc-ready"
                            ?checked="${form.locReady?.values[0]}"
                            @click="${this.#handleLocReady}"
                        ></sp-switch>
                    </div>
                    ${this.renderOverrideIndicator('locReady')}
                </sp-field-group>
            </div>
        `;
    }

    #handleVariantChange(e) {
        this.#handleFragmentUpdate(e);
        this.#updateCurrentVariantMapping();
        this.#updateAvailableSizes();
        this.#updateAvailableColors();
        this.#updateBackgroundColors();
        this.toggleFields();
    }

    #handeTagsChange(e) {
        if (Store.showCloneDialog.get()) return;

        const value = e.target.getAttribute('value');
        const newTags = value ? value.split(',') : []; // do not overwrite the tags array
        this.fragmentStore.updateField('tags', newTags);
    }

    #handleFragmentTitleUpdate(e) {
        this.fragmentStore.updateFieldInternal('title', e.target.value);
    }

    #handleFragmentDescriptionUpdate(e) {
        this.fragmentStore.updateFieldInternal('description', e.target.value);
    }

    createIncludedElement(label, values) {
        if (!label && !values?.length) return undefined;

        const element = document.createElement('merch-whats-included');
        const heading = document.createElement('div');
        heading.setAttribute('slot', 'heading');
        heading.textContent = label || '';
        element.append(heading);
        const content = document.createElement('div');
        content.setAttribute('slot', 'content');
        element.append(content);
        values.forEach((value) => {
            const list = document.createElement('merch-mnemonic-list');
            const iconSlot = document.createElement('div');
            iconSlot.setAttribute('slot', 'icon');
            if (value.icon) {
                const merchIcon = document.createElement('merch-icon');
                merchIcon.setAttribute('size', 's');
                merchIcon.setAttribute('src', value.icon);
                merchIcon.setAttribute('alt', value.alt || '');
                if (value.link) {
                    const anchor = document.createElement('a');
                    anchor.setAttribute('href', value.link);
                    anchor.append(merchIcon);
                    iconSlot.append(anchor);
                } else {
                    iconSlot.append(merchIcon);
                }
            }
            const description = document.createElement('p');
            description.setAttribute('slot', 'description');
            const strong = document.createElement('strong');
            strong.textContent = value.alt || '';
            description.append(strong);
            list.append(iconSlot);
            list.append(description);
            content.append(list);
        });

        return element;
    }

    #updateWhatsIncluded(event) {
        let label = '';
        let values = [];
        if (Array.isArray(event.target.value)) {
            event.target.value.forEach(({ icon, alt, link }) => {
                values.push({ icon, alt, link });
            });
            label = this.whatsIncluded.label;
        } else {
            label = event.target.value;
            values = this.whatsIncluded.values;
        }
        const element = this.createIncludedElement(label, values);
        this.fragmentStore.updateField(WHAT_IS_INCLUDED, [element?.outerHTML || '']);
    }

    #updateMnemonics(event) {
        const fragment = this.fragmentStore.get();

        this.lastMnemonicState = {
            timestamp: Date.now(),
            mnemonicIcon: [...this.getEffectiveFieldValues('mnemonicIcon')],
            mnemonicAlt: [...this.getEffectiveFieldValues('mnemonicAlt')],
            mnemonicLink: [...this.getEffectiveFieldValues('mnemonicLink')],
            mnemonicTooltipText: [...this.getEffectiveFieldValues('mnemonicTooltipText')],
            mnemonicTooltipPlacement: [...this.getEffectiveFieldValues('mnemonicTooltipPlacement')],
        };

        const mnemonicIcon = [];
        const mnemonicAlt = [];
        const mnemonicLink = [];
        const mnemonicTooltipText = [];
        const mnemonicTooltipPlacement = [];
        event.target.value.forEach(({ icon, alt, link, mnemonicText, mnemonicPlacement }) => {
            mnemonicIcon.push(icon ?? '');
            mnemonicAlt.push(alt ?? '');
            mnemonicLink.push(link ?? '');
            mnemonicTooltipText.push(mnemonicText ?? '');
            mnemonicTooltipPlacement.push(mnemonicPlacement ?? 'top');
        });

        fragment.updateField('mnemonicIcon', mnemonicIcon);
        fragment.updateField('mnemonicAlt', mnemonicAlt);
        fragment.updateField('mnemonicLink', mnemonicLink);
        fragment.updateField('mnemonicTooltipText', mnemonicTooltipText);
        fragment.updateField('mnemonicTooltipPlacement', mnemonicTooltipPlacement);
        this.fragmentStore.set(fragment);

        const previousCount = this.lastMnemonicState.mnemonicIcon.length;
        const newCount = mnemonicIcon.length;
        const isAdd = newCount > previousCount;
        const isRemove = newCount < previousCount;

        if (isAdd || isRemove) {
            Events.toast.emit({
                variant: isAdd ? 'positive' : 'negative',
                content: isAdd ? 'Visual added' : 'Visual removed',
                action: {
                    label: 'UNDO',
                    handler: () => this.#undoMnemonicChange(),
                },
            });
        }
    }

    #undoMnemonicChange() {
        if (!this.lastMnemonicState) return;

        const fragment = this.fragmentStore.get();
        fragment.updateField('mnemonicIcon', this.lastMnemonicState.mnemonicIcon);
        fragment.updateField('mnemonicAlt', this.lastMnemonicState.mnemonicAlt);
        fragment.updateField('mnemonicLink', this.lastMnemonicState.mnemonicLink);
        fragment.updateField('mnemonicTooltipText', this.lastMnemonicState.mnemonicTooltipText);
        fragment.updateField('mnemonicTooltipPlacement', this.lastMnemonicState.mnemonicTooltipPlacement);
        this.fragmentStore.set(fragment);

        this.lastMnemonicState = null;

        this.requestUpdate();

        showToast('Visual change undone', 'info');
    }

    #formatName(name) {
        return name
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    #updateCurrentVariantMapping() {
        if (!this.fragment) {
            this.currentVariantMapping = null;
            return;
        }
        const variant = this.getEffectiveFieldValue('variant');
        this.currentVariantMapping = getFragmentMapping(variant);
    }

    async #updateAvailableSizes() {
        if (!this.fragment) return;
        if (!this.currentVariantMapping) {
            this.availableSizes = ['Default'];
            return;
        }

        const variantSizes = this.currentVariantMapping?.size || [];
        if (Array.isArray(variantSizes) && variantSizes.length > 0) {
            this.availableSizes = ['Default', ...variantSizes];
        } else {
            this.availableSizes = ['Default'];
        }
    }

    async #updateAvailableColors() {
        if (!this.fragment) return;
        if (!this.currentVariantMapping) {
            this.availableColors = [];
            this.availableBorderColors = [];
            this.availableBadgeColors = [];
            return;
        }
        const variant = this.currentVariantMapping;
        this.availableColors = variant?.allowedColors || [];
        if (variant.borderColor || variant.badge?.tag) {
            this.availableBorderColors = variant.allowedBorderColors || SPECTRUM_COLORS;
            this.availableBadgeColors = variant.allowedBadgeColors || SPECTRUM_COLORS;
        } else {
            this.availableBorderColors = [];
            this.availableBadgeColors = [];
        }
        this.#displayBadgeColorFields(this.badgeText);
        this.#displayTrialBadgeColorFields(this.trialBadgeText);
    }

    get supportsBadgeColors() {
        if (!this.fragment || !this.currentVariantMapping) {
            return false;
        }
        const variantMapping = this.currentVariantMapping;
        const supports = !!(variantMapping && variantMapping.badge && variantMapping.badge.tag);
        return supports;
    }

    #displayBadgeColorFields(text) {
        if (!this.supportsBadgeColors) return;
        const badgeColorField = document.querySelector('#badgeColor');
        const badgeBorderColorField = document.querySelector('#badgeBorderColor');

        if (badgeColorField) {
            badgeColorField.style.display = text ? 'block' : 'none';
        }
        if (badgeBorderColorField) {
            badgeBorderColorField.style.display = text ? 'block' : 'none';
        }
    }

    get badgeText() {
        return this.getEffectiveFieldValue('badge', 0) || '';
    }

    get badgeElement() {
        const badgeHtml = this.badgeText;

        if (!badgeHtml) return undefined;

        if (badgeHtml?.startsWith('<merch-badge')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(badgeHtml, 'text/html');
            return doc.querySelector('merch-badge');
        }

        return {
            textContent: badgeHtml,
        };
    }

    get isPlans() {
        return this.fragment.variant?.startsWith('plans');
    }

    get badge() {
        if (!this.supportsBadgeColors) {
            return {
                text: this.badgeText,
            };
        }

        const text = this.badgeElement?.textContent || '';
        const bgColorAttr = this.badgeElement?.getAttribute?.('background-color');
        const bgColorSelected = document.querySelector('sp-picker[data-field="badgeColor"]')?.value;
        const bgColor = bgColorAttr?.toLowerCase() || bgColorSelected || 'spectrum-yellow-300';

        const borderColorAttr = this.badgeElement?.getAttribute?.('border-color');
        const borderColorSelected = document.querySelector('sp-picker[data-field="badgeBorderColor"]')?.value;
        const borderColor = borderColorAttr?.toLowerCase() || borderColorSelected;

        return {
            text,
            bgColor,
            borderColor,
        };
    }

    get trialBadgeText() {
        return this.getEffectiveFieldValue('trialBadge', 0) || '';
    }

    get trialBadgeElement() {
        const trialBadgeHtml = this.trialBadgeText;

        if (!trialBadgeHtml) return undefined;

        if (trialBadgeHtml?.startsWith('<merch-badge')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(trialBadgeHtml, 'text/html');
            return doc.querySelector('merch-badge');
        }

        return {
            textContent: trialBadgeHtml,
        };
    }

    get trialBadge() {
        if (!this.supportsBadgeColors) {
            return {
                text: this.trialBadgeText,
            };
        }

        const text = this.trialBadgeElement?.textContent || '';
        const bgColorAttr = this.trialBadgeElement?.getAttribute?.('background-color');
        const bgColorSelected = document.querySelector('sp-picker[data-field="trialBadgeColor"]')?.value;
        const bgColor = bgColorAttr?.toLowerCase() || bgColorSelected || 'spectrum-yellow-300';

        const borderColorAttr = this.trialBadgeElement?.getAttribute?.('border-color');
        const borderColorSelected = document.querySelector('sp-picker[data-field="trialBadgeBorderColor"]')?.value;
        const borderColor = borderColorAttr?.toLowerCase() || borderColorSelected;

        return {
            text,
            bgColor,
            borderColor,
        };
    }

    #parseBadgeHtml(html) {
        if (!html) return { text: '', bgColor: '', borderColor: '' };
        if (html.startsWith('<merch-badge')) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const el = doc.querySelector('merch-badge');
            return {
                text: el?.textContent?.trim() || '',
                bgColor: el?.getAttribute('background-color')?.toLowerCase() || '',
                borderColor: el?.getAttribute('border-color')?.toLowerCase() || '',
            };
        }
        return { text: html.trim(), bgColor: '', borderColor: '' };
    }

    getBadgeComponentState(fieldName, component) {
        if (!this.isVariation || !this.localeDefaultFragment) {
            return 'no-parent';
        }

        const ownHtml = this.getEffectiveFieldValue(fieldName, 0) || '';
        const parentHtml = this.localeDefaultFragment?.getFieldValue(fieldName, 0) || '';

        const ownParsed = this.#parseBadgeHtml(ownHtml);
        const parentParsed = this.#parseBadgeHtml(parentHtml);

        const ownValue = ownParsed[component];
        const parentValue = parentParsed[component];

        if (!ownValue && !parentValue) return 'inherited';
        if (!ownValue) return 'inherited';
        if (ownValue === parentValue) return 'inherited';
        return 'overridden';
    }

    renderBadgeComponentOverrideIndicator(fieldName, component) {
        if (this.isVariation && !this.localeDefaultFragment) {
            return nothing;
        }
        const state = this.getBadgeComponentState(fieldName, component);
        const isOverridden = state === 'overridden';
        return html`
            <div class="field-reset-link">
                ${isOverridden
                    ? html`<a
                          href="javascript:void(0)"
                          @click=${(e) => {
                              e.preventDefault();
                              this.resetBadgeComponentToParent(fieldName, component);
                          }}
                      >
                          ↩ Overridden. Click to restore.
                      </a>`
                    : nothing}
            </div>
        `;
    }

    async resetBadgeComponentToParent(fieldName, component) {
        const parentHtml = this.localeDefaultFragment?.getFieldValue(fieldName, 0) || '';
        const parentParsed = this.#parseBadgeHtml(parentHtml);

        if (fieldName === 'badge') {
            if (component === 'text') {
                this.#updateBadge(parentParsed.text, this.badge.bgColor, this.badge.borderColor);
            } else if (component === 'bgColor') {
                this.#updateBadge(this.badge.text, parentParsed.bgColor, this.badge.borderColor);
            } else if (component === 'borderColor') {
                this.#updateBadge(this.badge.text, this.badge.bgColor, parentParsed.borderColor);
            }
        } else if (fieldName === 'trialBadge') {
            if (component === 'text') {
                this.#updateTrialBadge(parentParsed.text, this.trialBadge.bgColor, this.trialBadge.borderColor);
            } else if (component === 'bgColor') {
                this.#updateTrialBadge(this.trialBadge.text, parentParsed.bgColor, this.trialBadge.borderColor);
            } else if (component === 'borderColor') {
                this.#updateTrialBadge(this.trialBadge.text, this.trialBadge.bgColor, parentParsed.borderColor);
            }
        }
        showToast('Field restored to parent value', 'positive');
    }

    #createBadgeElement(text, bgColor, borderColor) {
        if (!text) return;

        const element = document.createElement('merch-badge');
        if (bgColor) {
            element.setAttribute('background-color', bgColor);
            if (bgColor === 'spectrum-green-900-plans' || bgColor === 'spectrum-gray-700-plans')
                element.setAttribute('color', '#fff');
        }
        if (borderColor) {
            element.setAttribute('border-color', borderColor);
        }
        element.setAttribute('variant', this.fragment.variant);
        element.textContent = text;
        return element;
    }

    #updateBadgeText(event) {
        const text = event.target.value?.trim() || '';
        if (this.supportsBadgeColors) {
            this.#displayBadgeColorFields(text);
            this.#updateBadge(text, this.badge.bgColor, this.badge.borderColor);
        } else {
            this.fragmentStore.updateField('badge', [text]);
        }
    }

    #updateTrialBadgeText(event) {
        const text = event.target.value?.trim() || '';
        if (this.supportsBadgeColors) {
            this.#displayTrialBadgeColorFields(text);
            this.#updateTrialBadge(text, this.trialBadge.bgColor, this.trialBadge.borderColor);
        } else {
            this.fragmentStore.updateField('trialBadge', [text]);
        }
    }

    #updateBadge = (text, bgColor, borderColor) => {
        const element = this.#createBadgeElement(text, bgColor, borderColor);
        this.fragmentStore.updateField('badge', [element?.outerHTML || '']);
    };

    #updateTrialBadge = (text, bgColor, borderColor) => {
        const element = this.#createBadgeElement(text, bgColor, borderColor);
        this.fragmentStore.updateField('trialBadge', [element?.outerHTML || '']);
    };

    #displayTrialBadgeColorFields(text) {
        if (!this.supportsBadgeColors) return;
        const trialBadgeColorField = document.querySelector('#trialBadgeColor');
        const trialBadgeBorderColorField = document.querySelector('#trialBadgeBorderColor');

        if (trialBadgeColorField) {
            trialBadgeColorField.style.display = text ? 'block' : 'none';
        }
        if (trialBadgeBorderColorField) {
            trialBadgeBorderColorField.style.display = text ? 'block' : 'none';
        }
    }

    async #updateBackgroundColors() {
        if (!this.fragment) return;
        if (!this.currentVariantMapping) {
            this.availableBackgroundColors = { Default: undefined };
            return;
        }
        this.availableBackgroundColors = {
            Default: undefined,
            ...(this.currentVariantMapping.allowedColors ?? []),
        };
    }

    #formatColorName(color) {
        return color
            .replace(/(spectrum|global|color|plans|-)/gi, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())
            .replace(/\s+/g, ' ')
            .trim();
    }

    #renderBadgeColors() {
        if (!this.supportsBadgeColors) return;

        return html`
            <div class="two-column-grid">
                ${this.#renderColorPicker(
                    'badgeColor',
                    'Badge Color',
                    this.availableBadgeColors,
                    this.badge.bgColor,
                    'badgeColor',
                )}
                ${this.#renderColorPicker(
                    'badgeBorderColor',
                    'Badge Border Color',
                    this.availableBadgeColors,
                    this.badge.borderColor,
                    'badgeBorderColor',
                )}
            </div>
        `;
    }

    #renderTrialBadgeColors() {
        if (!this.supportsBadgeColors) return;

        return html`
            <div class="two-column-grid">
                ${this.#renderColorPicker(
                    'trialBadgeColor',
                    'Trial Badge Color',
                    this.availableBadgeColors,
                    this.trialBadge.bgColor,
                    'trialBadgeColor',
                )}
                ${this.#renderColorPicker(
                    'trialBadgeBorderColor',
                    'Trial Badge Border Color',
                    this.availableBadgeColors,
                    this.trialBadge.borderColor,
                    'trialBadgeBorderColor',
                )}
            </div>
        `;
    }

    #handleFragmentUpdate = (event) => {
        if (this.updateFragment) {
            this.updateFragment(event);
        }
    };

    #handleLocReady() {
        const value = !this.fragment.getField('locReady')?.values[0];
        this.fragmentStore.updateField('locReady', [value]);
    }

    #getPerUnitDisplayValue(value) {
        if (!value) return '';
        const match = value.match(/LICENSE\s+\{(.+?)\}\s+other/);
        return match ? match[1].trim() : '';
    }

    #handlePerUnitLabelUpdate = (event) => {
        const userInput = event.target.value.trim();
        let transformedValue = '';

        if (userInput) {
            const cleanInput = userInput.trim();
            transformedValue = `{perUnit, select, LICENSE {${cleanInput}} other {}}`;
        }

        const syntheticEvent = {
            target: {
                ...event.target,
                value: transformedValue,
                dataset: {
                    field: 'perUnitLabel',
                },
            },
        };

        this.#handleFragmentUpdate(syntheticEvent);
    };

    #renderColorPicker(id, label, colors, selectedValue, dataField, onChange) {
        const isBackground = dataField === 'backgroundColor';
        const isBorder = dataField === 'borderColor';
        const isBadgeColor = dataField === 'badgeColor' || dataField === 'trialBadgeColor';
        const isBadgeBorderColor = dataField === 'badgeBorderColor' || dataField === 'trialBadgeBorderColor';

        let colorArray = Array.isArray(colors) ? colors : Object.keys(colors || {});

        let variantSpecialValues = {};
        if (this.fragment && isBorder && this.currentVariantMapping) {
            const variant = this.currentVariantMapping;
            variantSpecialValues = variant?.borderColor?.specialValues || {};
            if (variantSpecialValues && Object.keys(variantSpecialValues).length > 0) {
                colorArray = [...colorArray, ...Object.keys(variantSpecialValues)];
            }
        }

        const isSpecialValue = (color) => isBorder && Object.keys(variantSpecialValues).includes(color);

        let displaySelectedValue = selectedValue;
        if (isBorder && variantSpecialValues && selectedValue) {
            const specialValueKey = Object.entries(variantSpecialValues).find(([, value]) => value === selectedValue)?.[0];

            if (specialValueKey) {
                displaySelectedValue = specialValueKey;
            }
        }

        const hasNoExplicitColor = !selectedValue || selectedValue === '';
        const isTransparent = selectedValue === 'transparent';

        if (hasNoExplicitColor && (isBadgeColor || isBadgeBorderColor || isBorder)) {
            displaySelectedValue = 'Default';
        } else if (isTransparent) {
            displaySelectedValue = 'Transparent';
        }

        const options = isBackground
            ? ['Default', 'Transparent', ...colorArray]
            : ['Default', 'Transparent', ...(isBorder ? Object.keys(variantSpecialValues) : []), ...colorArray];

        const handleChange = (e) => {
            const value = e.target.value;

            if (value === 'Default') {
                if (isBadgeColor) {
                    if (dataField === 'badgeColor') {
                        this.#updateBadge(this.badge.text, '', this.badge.borderColor);
                    } else if (dataField === 'trialBadgeColor') {
                        this.#updateTrialBadge(this.trialBadge.text, '', this.trialBadge.borderColor);
                    }
                } else if (isBadgeBorderColor) {
                    if (dataField === 'badgeBorderColor') {
                        this.#updateBadge(this.badge.text, this.badge.bgColor, '');
                    } else if (dataField === 'trialBadgeBorderColor') {
                        this.#updateTrialBadge(this.trialBadge.text, this.trialBadge.bgColor, '');
                    }
                } else if (isBorder) {
                    const fragment = this.fragmentStore.get();
                    fragment.updateField(dataField, ['']);
                    this.fragmentStore.set(fragment);
                } else if (isBackground) {
                    const fragment = this.fragmentStore.get();
                    fragment.updateField(dataField, ['']);
                    this.fragmentStore.set(fragment);
                }
            } else if (value === 'Transparent') {
                if (isBadgeColor) {
                    if (dataField === 'badgeColor') {
                        this.#updateBadge(this.badge.text, 'transparent', this.badge.borderColor);
                    } else if (dataField === 'trialBadgeColor') {
                        this.#updateTrialBadge(this.trialBadge.text, 'transparent', this.trialBadge.borderColor);
                    }
                } else if (isBadgeBorderColor) {
                    if (dataField === 'badgeBorderColor') {
                        this.#updateBadge(this.badge.text, this.badge.bgColor, 'transparent');
                    } else if (dataField === 'trialBadgeBorderColor') {
                        this.#updateTrialBadge(this.trialBadge.text, this.trialBadge.bgColor, 'transparent');
                    }
                } else if (isBorder) {
                    const fragment = this.fragmentStore.get();
                    fragment.updateField(dataField, ['transparent']);
                    this.fragmentStore.set(fragment);
                }
            } else if (isBorder && isSpecialValue(value)) {
                const actualValue = variantSpecialValues[value];
                const fragment = this.fragmentStore.get();
                fragment.updateField(dataField, [actualValue]);
                this.fragmentStore.set(fragment);
            } else if (isBadgeColor) {
                if (dataField === 'badgeColor') {
                    this.#updateBadge(this.badge.text, value, this.badge.borderColor);
                } else if (dataField === 'trialBadgeColor') {
                    this.#updateTrialBadge(this.trialBadge.text, value, this.trialBadge.borderColor);
                }
            } else if (isBadgeBorderColor) {
                if (dataField === 'badgeBorderColor') {
                    this.#updateBadge(this.badge.text, this.badge.bgColor, value);
                } else if (dataField === 'trialBadgeBorderColor') {
                    this.#updateTrialBadge(this.trialBadge.text, this.trialBadge.bgColor, value);
                }
            } else {
                if (onChange) {
                    onChange(e);
                } else {
                    this.#handleFragmentUpdate(e);
                }
            }
        };

        return html`
            <sp-field-group class="${onChange ? '' : 'toggle'}" id="${id}">
                <sp-field-label for="${id}">${label}</sp-field-label>
                <sp-picker
                    id="${id}"
                    data-field="${dataField}"
                    value="${displaySelectedValue ||
                    (isBackground || isBadgeColor || isBadgeBorderColor || isBorder ? 'Default' : '')}"
                    data-default-value="${isBackground || isBadgeColor || isBadgeBorderColor || isBorder ? 'Default' : ''}"
                    @change="${handleChange}"
                >
                    ${options.map(
                        (color) => html`
                            <sp-menu-item value="${color}">
                                <div class="menu-item-container">
                                    ${color === 'Default'
                                        ? html`<span>Default</span>`
                                        : color === 'Transparent'
                                          ? html`<span>Transparent</span>`
                                          : color
                                            ? html`
                                                  ${!isBackground && !isSpecialValue(color)
                                                      ? html`
                                                            <div
                                                                class="color-swatch"
                                                                style="--swatch-bg: var(--${color})"
                                                            ></div>
                                                        `
                                                      : isSpecialValue(color)
                                                        ? html`
                                                              <div
                                                                  class="color-swatch"
                                                                  style="--swatch-bg: ${variantSpecialValues[color]}"
                                                              ></div>
                                                          `
                                                        : nothing}
                                                  <span
                                                      class="color-name-text"
                                                      title="${isBackground
                                                          ? this.#formatName(color)
                                                          : isSpecialValue(color)
                                                            ? this.#formatName(color)
                                                            : this.#formatColorName(color)}"
                                                      >${isBackground
                                                          ? this.#formatName(color)
                                                          : isSpecialValue(color)
                                                            ? this.#formatName(color)
                                                            : this.#formatColorName(color)}</span
                                                  >
                                              `
                                            : html` <span>Transparent</span> `}
                                </div>
                            </sp-menu-item>
                        `,
                    )}
                </sp-picker>
                ${isBadgeColor || isBadgeBorderColor
                    ? this.renderBadgeComponentOverrideIndicator(
                          dataField === 'badgeColor' || dataField === 'badgeBorderColor' ? 'badge' : 'trialBadge',
                          isBadgeBorderColor ? 'borderColor' : 'bgColor',
                      )
                    : this.renderOverrideIndicator(dataField)}
            </sp-field-group>
        `;
    }

    #backgroundColorSelection(colors, selectedValue, dataField) {
        const options = {
            Default: undefined,
            Transparent: 'transparent',
            ...colors,
        };

        const handleBackgroundChange = (e) => {
            const value = e.target.value;
            if (value === 'Default') {
                const fragment = this.fragmentStore.get();
                fragment.updateField(dataField, ['']);
                this.fragmentStore.set(fragment);
            } else if (value === 'Transparent') {
                const fragment = this.fragmentStore.get();
                fragment.updateField(dataField, ['transparent']);
                this.fragmentStore.set(fragment);
            } else {
                this.#handleFragmentUpdate(e);
            }
        };

        return html`
            <sp-field-group class="toggle" id="backgroundColor">
                <sp-field-label for="backgroundColor">Background Color</sp-field-label>
                <sp-picker
                    id="backgroundColor"
                    data-field="${dataField}"
                    value="${selectedValue === 'transparent' ? 'Transparent' : selectedValue || 'Default'}"
                    data-default-value="${selectedValue === 'transparent' ? 'Transparent' : selectedValue || 'Default'}"
                    @change="${handleBackgroundChange}"
                >
                    ${Object.entries(options)
                        .sort(([a], [b]) =>
                            a === 'Default' ? -1 : b === 'Default' ? 1 : a === 'Transparent' ? -1 : b === 'Transparent' ? 1 : 0,
                        )
                        .map(
                            ([colorName, colorValue]) => html`
                                <sp-menu-item value="${colorName}">
                                    <div class="menu-item-container">
                                        ${colorName === 'Default'
                                            ? html`<span>Default</span>`
                                            : colorName === 'Transparent'
                                              ? html`<span>Transparent</span>`
                                              : html`
                                                    <div class="color-swatch" style="--swatch-bg: ${colorValue}"></div>
                                                    <span class="color-name-text" title="${colorName}"> ${colorName} </span>
                                                `}
                                    </div>
                                </sp-menu-item>
                            `,
                        )}
                </sp-picker>
                ${this.renderOverrideIndicator(dataField)}
            </sp-field-group>
        `;
    }
}

customElements.define('merch-card-editor', MerchCardEditor);
