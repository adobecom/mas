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
import { getFragmentMapping, showToast, localeIconProvider } from '../utils.js';
import '../fields/addon-field.js';
import Store from '../store.js';
import Events from '../events.js';
import { VARIANT_NAMES } from './variant-picker.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { getItemFieldStateByIndex } from '../utils/field-state.js';
import { Fragment } from '../aem/fragment.js';
import { toAttribute } from '../aem/aem-tag-picker-field.js';

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
        this.localeSearch = '';
        this.reactiveController = new ReactiveController(this, []);
    }

    createRenderRoot() {
        return this;
    }

    get effectiveIsVariation() {
        return (this.isVariation || this.isGroupedVariation) && this.localeDefaultFragment !== null;
    }

    get isGroupedVariation() {
        return Fragment.isGroupedVariationPath(this.fragment?.path);
    }

    get pznTagsValue() {
        const pznTags = this.fragment.getFieldValues('pznTags') || [];
        // pznTags are already in tag format (e.g., "mas:locale/AE/en_AE"), just join them
        return pznTags.join(',');
    }

    #handlePznTagsChange = (event) => {
        const tagPicker = event.target;
        this.fragmentStore.updateField('pznTags', tagPicker.value || []);
    };

    get groupedVariationTagsTemplate() {
        if (!this.isGroupedVariation) return nothing;
        return html`
            <sp-field-group id="grouped-variation-tags">
                <sp-field-label>Grouped variation tags</sp-field-label>
                <aem-tag-picker-field
                    label="Locale tags"
                    namespace="/content/cq:tags/mas"
                    top="locale"
                    multiple
                    value="${this.pznTagsValue}"
                    .iconProvider=${localeIconProvider}
                    @change=${this.#handlePznTagsChange}
                ></aem-tag-picker-field>
            </sp-field-group>
        `;
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

    getTagsFieldState() {
        if (!this.effectiveIsVariation) return 'no-parent';
        const ownTags = (this.fragment.newTags || this.fragment.tags.map((t) => t.id)).slice().sort().join(',');
        const parentTags =
            this.localeDefaultFragment?.tags
                .map((t) => t.id)
                .sort()
                .join(',') || '';
        if (!ownTags && !parentTags) return 'inherited';
        if (!ownTags) return 'inherited';
        return ownTags === parentTags ? 'same-as-parent' : 'overridden';
    }

    #renderOverrideIndicatorLink(resetCallback) {
        return html`
            <div class="field-status-indicator">
                <a
                    href="javascript:void(0)"
                    @click=${(e) => {
                        e.preventDefault();
                        resetCallback();
                    }}
                >
                    <sp-icon-unlink></sp-icon-unlink>
                    Overridden. Click to restore.
                </a>
            </div>
        `;
    }

    renderTagsStatusIndicator() {
        if (!this.effectiveIsVariation) return nothing;
        if (this.getTagsFieldState() !== 'overridden') return nothing;
        return this.#renderOverrideIndicatorLink(() => this.resetTagsToParent());
    }

    async resetTagsToParent() {
        const parentTagIds = this.localeDefaultFragment?.tags?.map((t) => t.id) || [];
        this.fragmentStore.updateField('tags', parentTagIds);
        showToast('Tags restored to parent value', 'positive');
    }

    static MNEMONIC_FIELDS = ['mnemonicIcon', 'mnemonicAlt', 'mnemonicLink', 'mnemonicTooltipText', 'mnemonicTooltipPlacement'];

    /**
     * Gets the combined field state for all mnemonic fields.
     * Returns 'overridden' if ANY mnemonic field is overridden.
     */
    getMnemonicsFieldState() {
        if (!this.effectiveIsVariation) return 'no-parent';
        const isAnyOverridden = MerchCardEditor.MNEMONIC_FIELDS.some(
            (fieldName) => this.getFieldState(fieldName) === 'overridden',
        );
        return isAnyOverridden ? 'overridden' : 'inherited';
    }

    async resetMnemonicsToParent() {
        for (const fieldName of MerchCardEditor.MNEMONIC_FIELDS) {
            const parentValues = this.localeDefaultFragment?.getField(fieldName)?.values || [];
            this.fragmentStore.resetFieldToParent(fieldName, parentValues);
        }
        showToast('Visuals restored to parent value', 'positive');
    }

    renderMnemonicsStatusIndicator() {
        if (!this.effectiveIsVariation) return nothing;
        if (this.getMnemonicsFieldState() !== 'overridden') return nothing;
        return this.#renderOverrideIndicatorLink(() => this.resetMnemonicsToParent());
    }

    async resetFieldToParent(fieldName) {
        const parentValues = this.localeDefaultFragment?.getField(fieldName)?.values || [];
        const success = this.fragmentStore.resetFieldToParent(fieldName, parentValues);
        if (success) {
            showToast('Field restored to parent value', 'positive');
        }
        return success;
    }

    renderFieldStatusIndicator(fieldName) {
        if (!this.effectiveIsVariation) return nothing;
        if (this.getFieldState(fieldName) !== 'overridden') return nothing;
        return this.#renderOverrideIndicatorLink(() => this.resetFieldToParent(fieldName));
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

    renderSectionStatusIndicator(fieldNames) {
        if (!this.effectiveIsVariation) return nothing;
        if (!this.isSectionOverridden(fieldNames)) return nothing;
        return this.#renderOverrideIndicatorLink(() => this.resetSectionToParent(fieldNames));
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

    getWhatsIncludedProps(el) {
        const iconEl = el.querySelector('merch-icon');
        const icon = iconEl?.getAttribute('src') || '';
        const alt = iconEl?.getAttribute('alt') || '';
        const linkEl = el.querySelector('[slot="icon"] a');
        const link = linkEl?.getAttribute('href') || '';
        return { icon, alt, link };
    }

    get whatsIncluded() {
        const label = this.whatsIncludedElement?.querySelector('[slot="heading"]')?.textContent || '';
        const values = [];
        this.whatsIncludedElement?.querySelectorAll('[slot="content"] merch-mnemonic-list').forEach((listEl) => {
            values.push(this.getWhatsIncludedProps(listEl));
        });

        const bullets = [];
        this.whatsIncludedElement?.querySelectorAll('[slot="contentBullets"] merch-mnemonic-list').forEach((listEl) => {
            const props = this.getWhatsIncludedProps(listEl);
            if (props.icon) {
                bullets.push(props);
            } else {
                const icon = listEl.querySelector('.sp-icon')?.tagName.toLowerCase() || '';
                const desc = listEl.querySelector('[slot="description"] > span');
                const text = listEl.querySelector('[slot="description"]')?.textContent || '';
                let alt;
                if (desc?.innerHTML == text) {
                    alt = text;
                } else {
                    alt = desc?.innerHTML ? `<p>${desc.innerHTML}</p>` : '';
                }
                bullets.push({ icon, alt, link: '' });
            }
        });

        return {
            label,
            values,
            bullets,
        };
    }

    get mnemonics() {
        if (!this.fragment) return [];

        const mnemonicIcon = this.getEffectiveFieldValues('mnemonicIcon');
        const mnemonicAlt = this.getEffectiveFieldValues('mnemonicAlt');
        const mnemonicLink = this.getEffectiveFieldValues('mnemonicLink');
        const mnemonicTooltipText = this.getEffectiveFieldValues('mnemonicTooltipText');
        const mnemonicTooltipPlacement = this.getEffectiveFieldValues('mnemonicTooltipPlacement');
        const parentIcons = this.localeDefaultFragment?.getField('mnemonicIcon')?.values || [];

        return (
            mnemonicIcon?.map((icon, index) => {
                const mnemonic = {
                    icon,
                    alt: mnemonicAlt[index] ?? '',
                    link: mnemonicLink[index] ?? '',
                    mnemonicText: mnemonicTooltipText[index] ?? '',
                    mnemonicPlacement: mnemonicTooltipPlacement[index] ?? 'top',
                };

                if (this.effectiveIsVariation) {
                    const fieldState = getItemFieldStateByIndex(icon, parentIcons, index);
                    if (fieldState) mnemonic.fieldState = fieldState;
                }

                return mnemonic;
            }) ?? []
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
                /* Override styling using Spectrum's --mod-* tokens */
                sp-textfield[data-field-state='overridden'] {
                    --mod-textfield-border-color: var(--spectrum-blue-400);
                    --mod-textfield-background-color: var(--spectrum-blue-100);
                }

                sp-field-group sp-picker[data-field-state='overridden'] {
                    --mod-picker-border-color-default: var(--spectrum-blue-400);
                    --mod-picker-background-color-default: var(--spectrum-blue-100);
                }

                sp-switch[data-field-state='overridden'][checked] {
                    --mod-switch-background-color-selected-default: var(--spectrum-blue-500);
                    --mod-switch-handle-border-color-selected-default: var(--spectrum-blue-500);
                }

                .field-status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 6px;
                    font-size: 12px;
                    color: var(--spectrum-blue-700);
                }

                .field-status-indicator a {
                    color: var(--spectrum-blue-700);
                    text-decoration: none;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .field-status-indicator a:hover {
                    text-decoration: underline;
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

                sp-field-group sp-textfield {
                    width: 100%;
                }

                sp-field-group sp-picker {
                    width: 100%;
                    --mod-picker-background-color-default: var(--spectrum-white);
                    --mod-picker-border-color-default: var(--spectrum-gray-300);
                    --mod-picker-border-width: 2px;
                    --mod-picker-border-radius: 8px;
                }

                #whatsIncluded mas-multifield {
                    margin: 8px 16px 8px 0;
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
                #badge mas-mnemonic-field {
                    margin-right: 16px;
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
                            data-field="variant"
                            data-field-state="${this.getFieldState('variant')}"
                            .value="${form.variant.values[0]}"
                            @change="${this.#handleVariantChange}"
                        ></variant-picker>
                        ${this.renderFieldStatusIndicator('variant')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="cardName">
                        <sp-field-label for="card-name">Card name</sp-field-label>
                        <sp-textfield
                            placeholder="Enter card name"
                            id="card-name"
                            data-field="cardName"
                            data-field-state="${this.getFieldState('cardName')}"
                            value="${form.cardName.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                        ></sp-textfield>
                        ${this.renderFieldStatusIndicator('cardName')}
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
                        data-field-state="${this.getFieldState('cardTitle')}"
                        .osi=${form.osi.values[0]}
                        .value=${form.cardTitle.values[0] || ''}
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderFieldStatusIndicator('cardTitle')}
                </sp-field-group>
                <div class="two-column-grid">
                    <sp-field-group class="toggle" id="subtitle">
                        <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
                        <sp-textfield
                            placeholder="Enter card subtitle"
                            id="card-subtitle"
                            data-field="subtitle"
                            data-field-state="${this.getFieldState('subtitle')}"
                            value="${form.subtitle.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                        ></sp-textfield>
                        ${this.renderFieldStatusIndicator('subtitle')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="size">
                        <sp-field-label for="card-size">Size</sp-field-label>
                        <sp-picker
                            id="card-size"
                            data-field="size"
                            data-field-state="${this.getFieldState('size')}"
                            value="${form.size.values[0] || 'Default'}"
                            data-default-value="Default"
                            @change="${this.#handleFragmentUpdate}"
                        >
                            ${(this.availableSizes || []).map(
                                (size) => html` <sp-menu-item value="${size}">${this.#formatName(size)}</sp-menu-item> `,
                            )}
                        </sp-picker>
                        ${this.renderFieldStatusIndicator('size')}
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
                        data-field-state="${this.getTagsFieldState()}"
                        value="${(this.fragment.newTags || this.fragment.tags.map((tag) => tag.id)).join(',')}"
                        .parentTags="${this.effectiveIsVariation
                            ? this.localeDefaultFragment?.tags.map((t) => t.id) || []
                            : []}"
                        @change=${this.#handeTagsChange}
                    ></aem-tag-picker-field>
                    ${this.renderTagsStatusIndicator()}
                </sp-field-group>
                ${this.groupedVariationTagsTemplate}
                <div class="section-title">Visuals</div>
                <sp-field-group class="toggle" id="mnemonics">
                    <mas-multifield
                        id="mnemonics"
                        button-label="Add visual"
                        data-field-state="${this.getMnemonicsFieldState()}"
                        .value="${this.mnemonics}"
                        @change="${this.#updateMnemonics}"
                        @input="${this.#updateMnemonics}"
                    >
                        <template>
                            <mas-mnemonic-field></mas-mnemonic-field>
                        </template>
                    </mas-multifield>
                    ${this.renderMnemonicsStatusIndicator()}
                </sp-field-group>
                <div class="two-column-grid">
                    <sp-field-group class="toggle" id="badge">
                        <sp-field-label for="card-badge">Badge</sp-field-label>
                        <sp-textfield
                            placeholder="Enter badge text"
                            id="card-badge"
                            data-field="badge"
                            data-field-state="${this.getBadgeComponentState('badge', 'text')}"
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
                            data-field-state="${this.getBadgeComponentState('trialBadge', 'text')}"
                            value="${this.trialBadge.text}"
                            @input="${this.#updateTrialBadgeText}"
                        ></sp-textfield>
                        ${this.renderBadgeComponentOverrideIndicator('trialBadge', 'text')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="badgeIcon">
                        <mas-mnemonic-field
                            .icon="${this.badge.icon}"
                            .iconLibrary="${true}"
                            .variant="${this.fragment.variant}"
                            style="display: ${this.badge.text ? 'block' : 'none'};"
                            @change=${this.#updateBadgeIcon}
                        ></mas-mnemonic-field>
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
                    <sp-textfield
                        id="whatsIncludedLabel"
                        placeholder="Enter the label text"
                        data-field-state="${this.getFieldState('whatsIncluded')}"
                        value="${this.whatsIncluded.label}"
                        @input="${this.#updateWhatsIncluded}"
                    ></sp-textfield>
                    <mas-multifield
                        button-label="Add bullet"
                        data-field-state="bullet"
                        .value="${this.whatsIncluded.bullets}"
                        @change="${(e) => this.#updateWhatsIncluded(e, true)}"
                        @input="${(e) => this.#updateWhatsIncluded(e, true)}"
                    >
                        <template>
                            <mas-included-field></mas-included-field>
                        </template>
                    </mas-multifield>
                    <mas-multifield
                        button-label="Add application"
                        data-field-state="${this.getFieldState('whatsIncluded')}"
                        .value="${this.whatsIncluded.values}"
                        @change="${(e) => this.#updateWhatsIncluded(e, false)}"
                        @input="${(e) => this.#updateWhatsIncluded(e, false)}"
                    >
                        <template>
                            <mas-included-field></mas-included-field>
                        </template>
                    </mas-multifield>
                    ${this.renderFieldStatusIndicator('whatsIncluded')}
                </sp-field-group>
                <sp-field-group class="toggle" id="quantitySelect">
                    <div class="section-title">Quantity selection</div>
                    <sp-checkbox
                        size="m"
                        data-field-state="${this.getFieldState('quantitySelect')}"
                        value="${this.quantitySelectorDisplayed}"
                        .checked="${this.quantitySelectorDisplayed}"
                        @change="${this.#showQuantityFields}"
                        ?disabled=${this.disabled}
                        >Show quantity selector</sp-checkbox
                    >
                    ${this.renderFieldStatusIndicator('quantitySelect')}
                    <div id="quantitySelector" style="display: ${this.quantitySelectorDisplayed ? 'block' : 'none'};">
                        <div class="two-column-grid">
                            <sp-field-group id="quantitySelectorTitle">
                                <sp-field-label for="title-quantity">Quantity selector title</sp-field-label>
                                <sp-textfield
                                    id="title-quantity"
                                    data-field="titleQuantity"
                                    data-field-state="${this.getQuantityComponentState('title')}"
                                    value="${this.quantityTitle}"
                                    @input="${this.#updateQuantityValues}"
                                    ?disabled=${this.disabled}
                                ></sp-textfield>
                                ${this.renderQuantityComponentOverrideIndicator('title')}
                            </sp-field-group>
                            <sp-field-group id="quantitySelectorStart">
                                <sp-field-label for="start-quantity">Start quantity</sp-field-label>
                                <sp-textfield
                                    id="start-quantity"
                                    data-field="startQuantity"
                                    data-field-state="${this.getQuantityComponentState('min')}"
                                    pattern="[0-9]*"
                                    value="${this.quantityStart}"
                                    @input="${this.#updateQuantityValues}"
                                    ?disabled=${this.disabled}
                                ></sp-textfield>
                                ${this.renderQuantityComponentOverrideIndicator('min')}
                            </sp-field-group>
                        </div>
                        <sp-field-group id="quantitySelectorStep">
                            <sp-field-label for="step-quantity">Step</sp-field-label>
                            <sp-textfield
                                id="step-quantity"
                                data-field="stepQuantity"
                                data-field-state="${this.getQuantityComponentState('step')}"
                                pattern="[0-9]*"
                                value="${this.quantityStep}"
                                @input="${this.#updateQuantityValues}"
                                ?disabled=${this.disabled}
                            ></sp-textfield>
                            ${this.renderQuantityComponentOverrideIndicator('step')}
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
                            data-field-state="${this.getFieldState('backgroundImage')}"
                            value="${form.backgroundImage.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                        ></sp-textfield>
                        ${this.renderFieldStatusIndicator('backgroundImage')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="backgroundImageAltText">
                        <sp-field-label for="background-image-alt-text">Background Image Alt Text</sp-field-label>
                        <sp-textfield
                            placeholder="Enter background image Alt Text"
                            id="background-image-alt-text"
                            data-field="backgroundImageAltText"
                            data-field-state="${this.getFieldState('backgroundImageAltText')}"
                            value="${form.backgroundImageAltText.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                        ></sp-textfield>
                        ${this.renderFieldStatusIndicator('backgroundImageAltText')}
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
                        data-field-state="${this.getFieldState('prices')}"
                        .osi=${form.osi.values[0]}
                        .value=${form.prices.values[0] || ''}
                        default-link-style="primary-outline"
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderFieldStatusIndicator('prices')}
                </sp-field-group>
                <div class="two-column-grid">
                    <sp-field-group id="promoCode">
                        <sp-field-label for="promo-code">Promo Code</sp-field-label>
                        <sp-textfield
                            placeholder="Enter promo code"
                            id="promo-code"
                            data-field="promoCode"
                            data-field-state="${this.getFieldState('promoCode')}"
                            value="${form.promoCode?.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                            ?disabled=${this.disabled}
                        ></sp-textfield>
                        ${this.renderFieldStatusIndicator('promoCode')}
                    </sp-field-group>
                    <sp-field-group class="toggle" id="addonConfirmation">
                        <sp-field-label for="addon-confirmation">Addon Confirmation</sp-field-label>
                        <sp-textfield
                            placeholder="Enter addon confirmation text"
                            id="addon-confirmation"
                            data-field="addonConfirmation"
                            data-field-state="${this.getFieldState('addonConfirmation')}"
                            value="${form.addonConfirmation?.values[0]}"
                            @input="${this.#handleFragmentUpdate}"
                            ?disabled=${this.disabled}
                        ></sp-textfield>
                        ${this.renderFieldStatusIndicator('addonConfirmation')}
                    </sp-field-group>
                </div>
                <sp-field-group class="toggle" id="promoText">
                    <sp-field-label for="promo-text">Promo Text</sp-field-label>
                    <sp-textfield
                        placeholder="Enter promo text"
                        id="promo-text"
                        data-field="promoText"
                        data-field-state="${this.getFieldState('promoText')}"
                        value="${form.promoText?.values[0]}"
                        @input="${this.#handleFragmentUpdate}"
                        ?disabled=${this.disabled}
                    ></sp-textfield>
                    ${this.renderFieldStatusIndicator('promoText')}
                </sp-field-group>
                <sp-field-group>
                    <sp-field-label for="osi">OSI Search</sp-field-label>
                    <osi-field
                        id="osi"
                        data-field="osi"
                        data-field-state="${this.getFieldState('osi')}"
                        .value=${form.osi.values[0]}
                        @input="${this.#handleFragmentUpdate}"
                        @change="${this.#handleFragmentUpdate}"
                    ></osi-field>
                    ${this.renderFieldStatusIndicator('osi')}
                </sp-field-group>
                <sp-field-group id="perUnitLabel" class="toggle">
                    <sp-divider></sp-divider>
                    <sp-field-label for="per-unit-label">Per Unit Label</sp-field-label>
                    <sp-textfield
                        id="per-unit-label"
                        placeholder="Enter per unit label"
                        data-field="perUnitLabel"
                        data-field-state="${this.getFieldState('perUnitLabel')}"
                        class="full-width"
                        value="${this.#getPerUnitDisplayValue(form.perUnitLabel?.values[0])}"
                        @input="${this.#handlePerUnitLabelUpdate}"
                    ></sp-textfield>
                    ${this.renderFieldStatusIndicator('perUnitLabel')}
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
                        data-field-state="${this.getFieldState('description')}"
                        .osi=${form.osi.values[0]}
                        .value=${form.description.values[0] || ''}
                        default-link-style="secondary-link"
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderFieldStatusIndicator('description')}
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
                        data-field-state="${this.getFieldState('shortDescription')}"
                        .osi=${form.osi.values[0]}
                        .value=${form.shortDescription?.values[0] || ''}
                        default-link-style="secondary-link"
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderFieldStatusIndicator('shortDescription')}
                </sp-field-group>
                <sp-field-group class="toggle" id="callout">
                    <sp-field-label for="callout"> Callout text </sp-field-label>
                    <rte-field
                        id="callout"
                        link
                        icon
                        data-field="callout"
                        data-field-state="${this.getFieldState('callout')}"
                        .osi=${form.osi.values[0]}
                        .value=${form.callout?.values[0] || ''}
                        default-link-style="secondary-link"
                        @change="${this.#handleFragmentUpdate}"
                        ?readonly=${this.disabled}
                    ></rte-field>
                    ${this.renderFieldStatusIndicator('callout')}
                </sp-field-group>
                <div class="section-title">Footer</div>
                <sp-field-group class="toggle" id="ctas">
                    <rte-field
                        id="ctas"
                        link
                        inline
                        data-field="ctas"
                        data-field-state="${this.getFieldState('ctas')}"
                        .osi=${form.osi.values[0]}
                        .value=${form.ctas.values[0] || ''}
                        default-link-style="primary-outline"
                        @change="${this.#handleFragmentUpdate}"
                    ></rte-field>
                    ${this.renderFieldStatusIndicator('ctas')}
                </sp-field-group>
                <div class="section-title">Options and settings</div>
                <div class="two-column-grid">
                    <sp-field-group id="secureLabel" class="toggle">
                        <secure-text-field
                            id="secure-text-field"
                            label="Secure Transaction Label"
                            data-field="showSecureLabel"
                            data-field-state="${this.getFieldState('showSecureLabel')}"
                            value="${form.showSecureLabel?.values[0]}"
                            @change="${this.#handleFragmentUpdate}"
                        >
                        </secure-text-field>
                        ${this.renderFieldStatusIndicator('showSecureLabel')}
                    </sp-field-group>
                    <sp-field-group id="planType" class="toggle">
                        <mas-plan-type-field
                            id="plan-type-field"
                            label="Plan Type text"
                            data-field="showPlanType"
                            data-field-state="${this.getFieldState('showPlanType')}"
                            value="${form.showPlanType?.values[0]}"
                            @change="${this.#handleFragmentUpdate}"
                        >
                        </mas-plan-type-field>
                        ${this.renderFieldStatusIndicator('showPlanType')}
                    </sp-field-group>
                </div>
                <sp-field-group id="addon" class="toggle">
                    <mas-addon-field
                        id="addon-field"
                        label="Addon"
                        data-field="addon"
                        data-field-state="${this.getFieldState('addon')}"
                        .value="${form.addon?.values[0]}"
                        @change="${this.updateFragment}"
                    >
                    </mas-addon-field>
                    ${this.renderFieldStatusIndicator('addon')}
                </sp-field-group>
                <sp-field-group id="locReady">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <sp-field-label for="loc-ready">Send to translation?</sp-field-label>
                        <sp-switch
                            id="loc-ready"
                            data-field-state="${this.getFieldState('locReady')}"
                            ?checked="${form.locReady?.values[0]}"
                            @click="${this.#handleLocReady}"
                        ></sp-switch>
                    </div>
                    ${this.renderFieldStatusIndicator('locReady')}
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

    createMnemonicList(value, isBullet) {
        const list = document.createElement('merch-mnemonic-list');
        const iconSlot = document.createElement('div');
        iconSlot.setAttribute('slot', 'icon');
        if (value.icon?.startsWith('sp-icon-')) {
            const icon = document.createElement(value.icon);
            icon.setAttribute('class', 'sp-icon');
            iconSlot.append(icon);
        } else if (value.icon) {
            const merchIcon = document.createElement('merch-icon');
            merchIcon.setAttribute('size', isBullet ? 'xs' : 's');
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
        if (isBullet) {
            const span = document.createElement('span');
            if (value.alt?.startsWith('<p>')) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(value.alt, 'text/html');
                span.innerHTML = doc.querySelector('p').innerHTML;
            } else {
                span.textContent = value.alt || '';
            }
            description.append(span);
        } else {
            const strong = document.createElement('strong');
            strong.textContent = value.alt || '';
            description.append(strong);
        }
        list.append(iconSlot);
        list.append(description);
        return list;
    }

    createIncludedElement(label, values, bullets) {
        if (!label && !values?.length) return undefined;

        const element = document.createElement('merch-whats-included');
        const heading = document.createElement('div');
        heading.setAttribute('slot', 'heading');
        heading.textContent = label || '';
        element.append(heading);
        const contentBullets = document.createElement('div');
        contentBullets.setAttribute('slot', 'contentBullets');
        element.append(contentBullets);
        if (bullets.length) element.setAttribute('has-bullets', 'true');
        bullets.forEach((value) => {
            contentBullets.append(this.createMnemonicList(value, true));
        });
        const content = document.createElement('div');
        content.setAttribute('slot', 'content');
        element.append(content);
        values.forEach((value) => {
            content.append(this.createMnemonicList(value));
        });

        return element;
    }

    #updateWhatsIncluded(event, isBullet) {
        let label = '';
        let values = [];
        let bullets = [];
        if (Array.isArray(event.target.value)) {
            event.target.value.forEach(({ icon, alt, link }) => {
                if (isBullet) {
                    bullets.push({ icon, alt, link });
                } else {
                    values.push({ icon, alt, link });
                }
            });
            label = this.whatsIncluded.label;
            if (isBullet) {
                values = this.whatsIncluded.values;
            } else {
                bullets = this.whatsIncluded.bullets;
            }
        } else {
            label = event.target.value;
            values = this.whatsIncluded.values;
            bullets = this.whatsIncluded.bullets;
        }
        const element = this.createIncludedElement(label, values, bullets);
        this.fragmentStore.updateField(WHAT_IS_INCLUDED, [element?.outerHTML || '']);
    }

    #updateMnemonics(event) {
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

        // For variations: use empty string sentinel [""] to explicitly clear (vs [] which inherits)
        // For non-variations or when values differ from parent: update normally
        // When values match parent: auto-reset to inherited state
        const isExplicitClear = mnemonicIcon.length === 0 && this.effectiveIsVariation;
        const parent = this.effectiveIsVariation ? this.localeDefaultFragment : null;

        const values = {
            mnemonicIcon: isExplicitClear ? [''] : mnemonicIcon,
            mnemonicAlt: isExplicitClear ? [''] : mnemonicAlt,
            mnemonicLink: isExplicitClear ? [''] : mnemonicLink,
            mnemonicTooltipText: isExplicitClear ? [''] : mnemonicTooltipText,
            mnemonicTooltipPlacement: isExplicitClear ? [''] : mnemonicTooltipPlacement,
        };

        // For variations: check if ALL mnemonic values match parent before resetting
        if (parent) {
            // Compare against effective parent values (what would be inherited)
            // For fields that don't exist on parent, treat default values as matching
            const allMatchParent = MerchCardEditor.MNEMONIC_FIELDS.every((fieldName) => {
                const newValues = values[fieldName] || [];
                const parentField = parent.getField(fieldName);
                const parentValues = parentField?.values || [];

                // If parent has the field, compare directly
                if (parentField && parentValues.length > 0) {
                    return newValues.length === parentValues.length && newValues.every((v, i) => v === parentValues[i]);
                }

                // If parent doesn't have the field, check if new values are default/empty
                // Default values: empty string for text fields, 'top' for placement
                const isDefaultValue = newValues.every((v) => v === '' || v === 'top');
                return isDefaultValue;
            });

            if (allMatchParent) {
                // All values match parent - reset all mnemonic fields to inherited state
                for (const fieldName of MerchCardEditor.MNEMONIC_FIELDS) {
                    this.fragment.resetFieldToParent(fieldName);
                }
                this.fragmentStore.notify();
                this.fragmentStore.refreshAemFragment();
                this.requestUpdate();
            } else {
                // At least one field differs from parent - update all fields
                this.fragmentStore.updateField('mnemonicIcon', values.mnemonicIcon);
                this.fragmentStore.updateField('mnemonicAlt', values.mnemonicAlt);
                this.fragmentStore.updateField('mnemonicLink', values.mnemonicLink);
                this.fragmentStore.updateField('mnemonicTooltipText', values.mnemonicTooltipText);
                this.fragmentStore.updateField('mnemonicTooltipPlacement', values.mnemonicTooltipPlacement);
            }
        } else {
            // Non-variation: update all fields normally
            this.fragmentStore.updateField('mnemonicIcon', values.mnemonicIcon);
            this.fragmentStore.updateField('mnemonicAlt', values.mnemonicAlt);
            this.fragmentStore.updateField('mnemonicLink', values.mnemonicLink);
            this.fragmentStore.updateField('mnemonicTooltipText', values.mnemonicTooltipText);
            this.fragmentStore.updateField('mnemonicTooltipPlacement', values.mnemonicTooltipPlacement);
        }

        // Only count non-empty mnemonics (those with an icon) for toast notifications
        const previousCount = this.lastMnemonicState.mnemonicIcon.filter((icon) => icon).length;
        const newCount = mnemonicIcon.filter((icon) => icon).length;
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
        const icon = this.badgeElement?.getAttribute?.('icon');

        return {
            text,
            bgColor,
            borderColor,
            icon,
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

    #parseQuantityHtml(html) {
        if (!html) return { title: '', min: '', step: '' };
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const el = doc.querySelector('merch-quantity-select');
        return {
            title: el?.getAttribute('title') || '',
            min: el?.getAttribute('min') || '',
            step: el?.getAttribute('step') || '',
        };
    }

    #getCompositeComponentState(fieldName, parser, component, getOwnHtml) {
        if (!this.effectiveIsVariation) return 'no-parent';
        const ownHtml = getOwnHtml ? getOwnHtml() : this.fragment?.getFieldValue(fieldName, 0) || '';
        const parentHtml = this.localeDefaultFragment?.getFieldValue(fieldName, 0) || '';
        const ownParsed = parser(ownHtml);
        const parentParsed = parser(parentHtml);
        const ownValue = ownParsed[component];
        const parentValue = parentParsed[component];
        if (!ownValue) return 'inherited';
        return ownValue === parentValue ? 'inherited' : 'overridden';
    }

    getQuantityComponentState(component) {
        return this.#getCompositeComponentState(QUANTITY_MODEL, this.#parseQuantityHtml.bind(this), component);
    }

    renderQuantityComponentOverrideIndicator(component) {
        if (!this.effectiveIsVariation) return nothing;
        if (this.getQuantityComponentState(component) !== 'overridden') return nothing;
        return this.#renderOverrideIndicatorLink(() => this.resetQuantityComponentToParent(component));
    }

    async resetQuantityComponentToParent(component) {
        const parentHtml = this.localeDefaultFragment?.getFieldValue(QUANTITY_MODEL, 0) || '';
        const parentParsed = this.#parseQuantityHtml(parentHtml);
        const currentTitle = component === 'title' ? parentParsed.title : this.quantityTitle;
        const currentMin = component === 'min' ? parentParsed.min : this.quantityStart;
        const currentStep = component === 'step' ? parentParsed.step : this.quantityStep;
        const html = this.createQsElement(currentMin, currentStep, currentTitle).outerHTML;
        this.fragmentStore.updateField(QUANTITY_MODEL, [html]);
        this.quantitySelectorValues = html;
        showToast('Field restored to parent value', 'positive');
    }

    getBadgeComponentState(fieldName, component) {
        return this.#getCompositeComponentState(
            fieldName,
            this.#parseBadgeHtml.bind(this),
            component,
            () => this.getEffectiveFieldValue(fieldName, 0) || '',
        );
    }

    #getColorPickerFieldState(dataField, isBadgeColor, isBadgeBorderColor) {
        if (isBadgeColor) {
            const fieldName = dataField === 'badgeColor' ? 'badge' : 'trialBadge';
            return this.getBadgeComponentState(fieldName, 'bgColor');
        }
        if (isBadgeBorderColor) {
            const fieldName = dataField === 'badgeBorderColor' ? 'badge' : 'trialBadge';
            return this.getBadgeComponentState(fieldName, 'borderColor');
        }
        return this.getFieldState(dataField);
    }

    renderBadgeComponentOverrideIndicator(fieldName, component) {
        if (!this.effectiveIsVariation) return nothing;
        if (this.getBadgeComponentState(fieldName, component) !== 'overridden') return nothing;
        return this.#renderOverrideIndicatorLink(() => this.resetBadgeComponentToParent(fieldName, component));
    }

    async resetBadgeComponentToParent(fieldName, component) {
        const parentHtml = this.localeDefaultFragment?.getFieldValue(fieldName, 0) || '';
        const parentParsed = this.#parseBadgeHtml(parentHtml);

        if (fieldName === 'badge') {
            if (component === 'text') {
                this.#updateBadge(parentParsed.text, this.badge.bgColor, this.badge.borderColor, this.badge.icon);
            } else if (component === 'bgColor') {
                this.#updateBadge(this.badge.text, parentParsed.bgColor, this.badge.borderColor, this.badge.icon);
            } else if (component === 'borderColor') {
                this.#updateBadge(this.badge.text, this.badge.bgColor, parentParsed.borderColor, this.badge.icon);
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

    #createBadgeElement(text, bgColor, borderColor, icon) {
        if (!text) return;

        const element = document.createElement('merch-badge');
        if (bgColor) {
            element.setAttribute('background-color', bgColor);
            if (
                bgColor === 'spectrum-green-900-plans' ||
                bgColor === 'spectrum-gray-700-plans' ||
                bgColor === 'gradient-purple-blue'
            )
                element.setAttribute('color', '#fff');
        }
        if (borderColor) {
            element.setAttribute('border-color', borderColor);
        }
        if (icon) {
            element.setAttribute('icon', icon);
        }
        element.setAttribute('variant', this.fragment.variant);
        element.textContent = text;
        return element;
    }

    #updateBadgeText(event) {
        const text = event.target.value?.trim() || '';
        const icon = this.badge.icon;
        this.#updateBadgeTextAndIcon(text, icon);
    }

    #updateBadgeIcon(event) {
        const text = this.badge.text;
        const icon = event.detail.icon;
        this.#updateBadgeTextAndIcon(text, icon);
    }

    #updateBadgeTextAndIcon(text, icon) {
        if (this.supportsBadgeColors) {
            this.#displayBadgeColorFields(text);
            this.#updateBadge(text, this.badge.bgColor, this.badge.borderColor, icon);
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

    #updateBadge = (text, bgColor, borderColor, icon) => {
        const element = this.#createBadgeElement(text, bgColor, borderColor, icon);
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

    #removeGradientColors(colors) {
        return colors.filter((color) => !color.startsWith('gradient-'));
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
                    this.#removeGradientColors(this.availableBadgeColors),
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

    #handleFragmentUpdate(event) {
        if (this.updateFragment) {
            this.updateFragment(event);
        }
    }

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
                        this.#updateBadge(this.badge.text, '', this.badge.borderColor, this.badge.icon);
                    } else if (dataField === 'trialBadgeColor') {
                        this.#updateTrialBadge(this.trialBadge.text, '', this.trialBadge.borderColor);
                    }
                } else if (isBadgeBorderColor) {
                    if (dataField === 'badgeBorderColor') {
                        this.#updateBadge(this.badge.text, this.badge.bgColor, '', this.badge.icon);
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
                        this.#updateBadge(this.badge.text, 'transparent', this.badge.borderColor, this.badge.icon);
                    } else if (dataField === 'trialBadgeColor') {
                        this.#updateTrialBadge(this.trialBadge.text, 'transparent', this.trialBadge.borderColor);
                    }
                } else if (isBadgeBorderColor) {
                    if (dataField === 'badgeBorderColor') {
                        this.#updateBadge(this.badge.text, this.badge.bgColor, 'transparent', this.badge.icon);
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
                    this.#updateBadge(this.badge.text, value, this.badge.borderColor, this.badge.icon);
                } else if (dataField === 'trialBadgeColor') {
                    this.#updateTrialBadge(this.trialBadge.text, value, this.trialBadge.borderColor);
                }
            } else if (isBadgeBorderColor) {
                if (dataField === 'badgeBorderColor') {
                    this.#updateBadge(this.badge.text, this.badge.bgColor, value, this.badge.icon);
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
                    data-field-state="${this.#getColorPickerFieldState(dataField, isBadgeColor, isBadgeBorderColor)}"
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
                    : this.renderFieldStatusIndicator(dataField)}
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
                    data-field-state="${this.getFieldState(dataField)}"
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
                ${this.renderFieldStatusIndicator(dataField)}
            </sp-field-group>
        `;
    }
}

customElements.define('merch-card-editor', MerchCardEditor);
