import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
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
import '../fields/addon-field.js';

const merchCardCustomElementPromise = customElements.whenDefined('merch-card');

const QUANTITY_MODEL = 'quantitySelect';
const WHAT_IS_INCLUDED = 'whatsIncluded';

class MerchCardEditor extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        updateFragment: { type: Function },
        wide: { type: Boolean, state: true },
        superWide: { type: Boolean, state: true },
        availableSizes: { type: Array, state: true },
        availableColors: { type: Array, state: true },
        availableBorderColors: { type: Array, state: true },
        availableBadgeColors: { type: Array, state: true },
        availableBackgroundColors: { type: Array, state: true },
        quantitySelectorValues: { type: String, state: true },
    };

    constructor() {
        super();
        this.updateFragment = null;
        this.wide = false;
        this.superWide = false;
        this.availableSizes = [];
        this.availableColors = [];
        this.availableBorderColors = [];
        this.availableBadgeColors = [];
        this.availableBackgroundColors = [];
        this.quantitySelectorValues = '';
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    get whatsIncludedElement() {
        const whatsIncludedValues =
            this.fragment.fields.find((f) => f.name === WHAT_IS_INCLUDED)
                ?.values ?? [];
        const whatsIncludedHtml = whatsIncludedValues?.length ? whatsIncludedValues[0] : '';

        if (!whatsIncludedHtml) return undefined;

        const parser = new DOMParser();
        const doc = parser.parseFromString(whatsIncludedHtml, 'text/html');
        return doc.querySelector('merch-whats-included');
    }

    get whatsIncluded() {
        const label = this.whatsIncludedElement?.querySelector('[slot="heading"]')?.textContent || '';
        const values = [];
        this.whatsIncludedElement?.querySelectorAll('merch-mnemonic-list').forEach((listEl) => {
            const icon = listEl.querySelector('merch-icon')?.getAttribute('src') || '';
            const text = listEl.querySelector('[slot="description"]')?.textContent || '';
            values.push({
                icon,
                text,
            });
        });

        return {
            label,
            values,
        }
    }

    get mnemonics() {
        if (!this.fragment) return [];

        const mnemonicIcon =
            this.fragment.fields.find((f) => f.name === 'mnemonicIcon')
                ?.values ?? [];
        const mnemonicAlt =
            this.fragment.fields.find((f) => f.name === 'mnemonicAlt')
                ?.values ?? [];
        const mnemonicLink =
            this.fragment.fields.find((f) => f.name === 'mnemonicLink')
                ?.values ?? [];
        return (
            mnemonicIcon?.map((icon, index) => ({
                icon,
                alt: mnemonicAlt[index] ?? '',
                link: mnemonicLink[index] ?? '',
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
        return (
            this.fragment?.fields.find((f) => f.name === QUANTITY_MODEL)
                ?.values[0] || ''
        );
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
        const vals = [
            this.quantityStart,
            this.quantityStep,
            this.quantityTitle,
        ];
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
            html = this.createQsElement(
                this.quantityStart,
                this.quantityStep,
                this.quantityTitle,
            ).outerHTML;
        } else {
            const qsValues = this.fragmentStore
                .get()
                .getField(QUANTITY_MODEL)?.values;
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

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('fragmentStore')) {
            this.#updateAvailableSizes();
            this.#updateAvailableColors();
            this.#updateBackgroundColors();
            this.toggleFields();
        }
    }

    async toggleFields() {
        if (!this.fragment) return;
        const merchCardCustomElement = await merchCardCustomElementPromise;
        if (!merchCardCustomElement) return;
        this.querySelectorAll('sp-field-group.toggle').forEach((field) => {
            field.style.display = 'none';
        });
        const variant = merchCardCustomElement.getFragmentMapping(
            this.fragment.variant,
        );
        if (!variant) return;
        Object.entries(variant).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length === 0) return;
            const field = this.querySelector(`sp-field-group.toggle#${key}`);
            if (field) field.style.display = 'block';
        });
        this.wide = variant.size?.includes('wide');
        this.superWide = variant.size?.includes('super-wide');
        this.showQuantityFields(this.quantitySelectorDisplayed);
        if (variant.borderColor) {
            const borderField = this.querySelector(
                'sp-field-group.toggle#border-color',
            );
            if (borderField) borderField.style.display = 'block';
        }
        if (variant.borderColor || variant.badge?.tag) {
            this.availableBorderColors = variant.allowedBorderColors || SPECTRUM_COLORS;
            this.availableBadgeColors = variant.allowedBadgeColors || SPECTRUM_COLORS;
        } else {
            this.availableBorderColors = [];
            this.availableBadgeColors = [];
        }
        this.availableColors = variant?.allowedColors || [];
    }

    render() {
        if (!this.fragment) return nothing;
        if (this.fragment.model.path !== CARD_MODEL_PATH) return nothing;

        const form = Object.fromEntries([
            ...this.fragment.fields.map((f) => [f.name, f]),
        ]);
        return html`
            <sp-field-group id="variant">
                <sp-field-label for="card-variant">Variant</sp-field-label>
                <variant-picker
                    id="card-variant"
                    ?show-all="false"
                    data-field="variant"
                    default-value="${form.variant.values[0]}"
                    @change="${this.#handleVariantChange}"
                ></variant-picker>
            </sp-field-group>
            <sp-field-group class="toggle" id="size">
                <sp-field-label for="card-size">Size</sp-field-label>
                <sp-picker
                    id="card-size"
                    data-field="size"
                    value="${form.size.values[0] || 'Default'}"
                    data-default-value="Default"
                    @change="${this.updateFragment}"
                >
                    ${(this.availableSizes || []).map(
                        (size) => html`
                            <sp-menu-item value="${size}"
                                >${this.#formatName(size)}</sp-menu-item
                            >
                        `,
                    )}
                </sp-picker>
            </sp-field-group>
            <sp-field-group class="toggle" id="title">
                <sp-field-label for="card-title">Title</sp-field-label>
                <sp-textfield
                    placeholder="Enter card title"
                    id="card-title"
                    data-field="cardTitle"
                    value="${form.cardTitle.values[0]}"
                    @input="${this.updateFragment}"
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="subtitle">
                <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
                <sp-textfield
                    placeholder="Enter card subtitle"
                    id="card-subtitle"
                    data-field="subtitle"
                    value="${form.subtitle.values[0]}"
                    @input="${this.updateFragment}"
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="mnemonics">
                <sp-field-label for="mnemonics">Mnemonics</sp-field-label>
                <mas-multifield
                    id="mnemonics"
                    .value="${this.mnemonics}"
                    @change="${this.#updateMnemonics}"
                    @input="${this.#updateMnemonics}"
                >
                    <template>
                        <mas-mnemonic-field></mas-mnemonic-field>
                    </template>
                </mas-multifield>
            </sp-field-group>
            <sp-field-group class="toggle" id="whatsIncluded">
                <sp-field-label for="whatsIncludedLabel"
                    >What's included</sp-field-label
                >
                <sp-textfield
                    id="whatsIncludedLabel"
                    placeholder="Enter the label text"
                    value="${this.whatsIncluded.label}"
                    @input="${this.#updateWhatsIncluded}"
                ></sp-textfield>
                <mas-multifield
                    .value="${this.whatsIncluded.values}"
                    @change="${this.#updateWhatsIncluded}"
                    @input="${this.#updateWhatsIncluded}"
                >
                    <template>
                        <mas-included-field></mas-included-field>
                    </template>
                </mas-multifield>
            </sp-field-group>
            <sp-field-group class="toggle" id="badge">
                <sp-field-label for="card-badge">Badge</sp-field-label>
                <sp-textfield
                    placeholder="Enter badge text"
                    id="card-badge"
                    data-field="badge"
                    value="${this.badge.text}"
                    @input="${this.#updateBadgeText}"
                ></sp-textfield>
                ${this.#renderBadgeColors()}
            </sp-field-group>
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
            <sp-field-group class="toggle" id="backgroundImage">
                <sp-field-label for="background-image"
                    >Background Image</sp-field-label
                >
                <sp-textfield
                    placeholder="Enter background image URL"
                    id="background-image"
                    data-field="backgroundImage"
                    value="${form.backgroundImage.values[0]}"
                    @input="${this.updateFragment}"
                ></sp-textfield>
                <sp-field-label for="background-image-alt-text"
                    >Background Image Alt Text</sp-field-label
                >
                <sp-textfield
                    placeholder="Enter background image Alt Text"
                    id="background-image-alt-text"
                    data-field="backgroundImageAltText"
                    value="${form.backgroundImageAltText.values[0]}"
                    @input="${this.updateFragment}"
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="prices">
                <sp-field-label for="prices">Prices</sp-field-label>
                <rte-field
                    id="prices"
                    inline
                    link
                    data-field="prices"
                    default-link-style="primary-outline"
                    @change="${this.updateFragment}"
                    >${unsafeHTML(form.prices.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-group id="promoCode">
                <sp-field-label for="promo-code">Promo Code</sp-field-label>
                <sp-textfield
                    placeholder="Enter promo code"
                    id="promo-code"
                    data-field="promoCode"
                    value="${form.promoCode?.values[0]}"
                    @input="${this.updateFragment}"
                    ?disabled=${this.disabled}
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="promoText">
                <sp-field-label for="promo-text">Promo Text</sp-field-label>
                <sp-textfield
                    placeholder="Enter promo text"
                    id="promo-text"
                    data-field="promoText"
                    value="${form.promoText?.values[0]}"
                    @input="${this.updateFragment}"
                    ?disabled=${this.disabled}
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group class="toggle" id="description">
                <sp-field-label for="description">Description</sp-field-label>
                <rte-field
                    id="description"
                    link
                    upt-link
                    list
                    data-field="description"
                    default-link-style="secondary-link"
                    @change="${this.updateFragment}"
                    >${unsafeHTML(form.description.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-group class="toggle" id="callout">
                <sp-field-label for="callout"> Callout text </sp-field-label>
                <rte-field
                    id="callout"
                    link
                    icon
                    data-field="callout"
                    default-link-style="secondary-link"
                    @change="${this.updateFragment}"
                    ?readonly=${this.disabled}
                    >${unsafeHTML(form.callout?.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-group id="secureLabel" class="toggle">
                <secure-text-field
                    id="secure-text-field"
                    label="Secure Transaction Label"
                    data-field="showSecureLabel"
                    value="${form.showSecureLabel?.values[0]}"
                    @change="${this.updateFragment}"
                >
                </secure-text-field>
            </sp-field-group>
            <sp-field-group id="planType" class="toggle">
                <mas-plan-type-field
                    id="plan-type-field"
                    label="Plan Type text"
                    data-field="showPlanType"
                    value="${form.showPlanType?.values[0]}"
                    @change="${this.updateFragment}"
                >
                </mas-plan-type-field>
            </sp-field-group>
            <sp-field-group id="planType" class="toggle">
                <mas-plan-type-field
                    id="plan-type-field"
                    label="Plan Type text"
                    data-field="showPlanType"
                    value="${form.showPlanType?.values[0]}"
                    @change="${this.updateFragment}"
                >
                </mas-plan-type-field>
            </sp-field-group>
            <sp-field-group id="addon" class="toggle">
                <mas-addon-field
                    id="addon-field"
                    label="Addon"
                    data-field="addon"
                    .value="${form.addon?.values[0]}"
                    @change="${this.updateFragment}"
                    ?disabled=${this.disabled}
                >
                </mas-addon-field>
            </sp-field-group>
            <sp-field-group class="toggle" id="quantitySelect">
                <sp-checkbox
                    size="m"
                    value="${this.quantitySelectorDisplayed}"
                    .checked="${this.quantitySelectorDisplayed}"
                    @change="${this.#showQuantityFields}"
                    ?disabled=${this.disabled}
                    >Show Quantity selector</sp-checkbox
                >
                <sp-field-group id="quantitySelector">
                    <sp-field-label for="title-quantity"
                        >Quantity selector title</sp-field-label
                    >
                    <sp-textfield
                        id="title-quantity"
                        data-field="titleQuantity"
                        value="${this.quantityTitle}"
                        @input="${this.#updateQuantityValues}"
                        ?disabled=${this.disabled}
                    ></sp-textfield>
                    <sp-field-label for="start-quantity"
                        >Start quantity</sp-field-label
                    >
                    <sp-textfield
                        id="start-quantity"
                        data-field="startQuantity"
                        pattern="[0-9]*"
                        value="${this.quantityStart}"
                        @input="${this.#updateQuantityValues}"
                        ?disabled=${this.disabled}
                        ><sp-help-text slot="negative-help-text"
                            >Numeric values only</sp-help-text
                        ></sp-textfield
                    >
                    <sp-field-label for="step-quantity">Step</sp-field-label>
                    <sp-textfield
                        id="step-quantity"
                        data-field="stepQuantity"
                        pattern="[0-9]*"
                        value="${this.quantityStep}"
                        @input="${this.#updateQuantityValues}"
                        ?disabled=${this.disabled}
                        ><sp-help-text slot="negative-help-text"
                            >Numeric values only</sp-help-text
                        ></sp-textfield
                    >
                </sp-field-group>
            </sp-field-group>
            <sp-field-group class="toggle" id="ctas">
                <sp-field-label for="ctas">Footer</sp-field-label>
                <rte-field
                    id="ctas"
                    link
                    inline
                    data-field="ctas"
                    default-link-style="primary-outline"
                    @change="${this.updateFragment}"
                    >${unsafeHTML(form.ctas.values[0])}</rte-field
                >
            </sp-field-group>
            <sp-field-group>
                <sp-field-label for="osi">OSI Search</sp-field-label>
                <osi-field
                    id="osi"
                    data-field="osi"
                    .value=${form.osi.values[0]}
                    @input="${this.updateFragment}"
                    @change="${this.updateFragment}"
                ></osi-field>
            </sp-field-group>
            <aem-tag-picker-field
                label="Tags"
                namespace="/content/cq:tags/mas"
                multiple
                value="${this.fragment.tags.map((tag) => tag.id).join(',')}"
                @change=${this.#handeTagsChange}
            ></aem-tag-picker-field>
        `;
    }

    #handleVariantChange(e) {
        this.updateFragment(e);
        this.#updateAvailableSizes();
        this.#updateAvailableColors();
        this.#updateBackgroundColors();
        this.toggleFields();
    }

    #handeTagsChange(e) {
        const value = e.target.getAttribute('value');
        const newTags = value ? value.split(',') : []; // do not overwrite the tags array
        this.fragmentStore.updateField('tags', newTags);
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
            const icon = document.createElement('div');
            icon.setAttribute('slot', 'icon');
            if (value.icon) {
                const merchIcon = document.createElement('merch-icon');
                merchIcon.setAttribute('size', 's');
                merchIcon.setAttribute('src', value.icon);
                merchIcon.setAttribute('alt', value.text);
                icon.append(merchIcon);
            }
            const description = document.createElement('p');
            description.setAttribute('slot', 'description');
            const strong = document.createElement('strong');
            strong.textContent = value.text || '';
            description.append(strong);
            list.append(icon);
            list.append(description);
            content.append(list);
        });

        return element;
    }

    #updateWhatsIncluded(event) {
        let label = '';
        let values = [];
        if (Array.isArray(event.target.value)) {
            event.target.value.forEach(({ icon, text }) => {
                values.push({
                    icon, text,
                });
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
        const mnemonicIcon = [];
        const mnemonicAlt = [];
        const mnemonicLink = [];
        event.target.value.forEach(({ icon, alt, link }) => {
            mnemonicIcon.push(icon ?? '');
            mnemonicAlt.push(alt ?? '');
            mnemonicLink.push(link ?? '');
        });
        const fragment = this.fragmentStore.get();
        fragment.updateField('mnemonicIcon', mnemonicIcon);
        fragment.updateField('mnemonicAlt', mnemonicAlt);
        fragment.updateField('mnemonicLink', mnemonicLink);
        this.fragmentStore.set(fragment);
    }

    #formatName(name) {
        return name
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async #updateAvailableSizes() {
        if (!this.fragment) return;
        const merchCardCustomElement = await merchCardCustomElementPromise;
        const variant = merchCardCustomElement?.getFragmentMapping(
            this.fragment.variant,
        );
        this.availableSizes = ['Default', ...(variant?.size || ['Default'])];
    }

    async #updateAvailableColors() {
        if (!this.fragment) return;
        const merchCardCustomElement = await merchCardCustomElementPromise;
        const variant = merchCardCustomElement?.getFragmentMapping(
            this.fragment.variant,
        );
        this.availableColors = variant?.allowedColors || [];
        this.displayBadgeColorFields(this.badge.text);
    }

    displayBadgeColorFields(text) {
        if (!this.isPlans) return;
        document.querySelector('#badgeColor').style.display = text ? 'block' : 'none';
        document.querySelector('#badgeBorderColor').style.display = text ? 'block' : 'none';
    }

    get badgeText() {
        const badgeValues =
            this.fragment.fields.find((f) => f.name === 'badge')
                ?.values ?? [];
        return badgeValues?.length ? badgeValues[0] : '';
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
            textContent: badgeHtml
        }
    }

    get isPlans() {
        return this.fragment.variant === 'plans';
    }

    get badge() {
        if (!this.isPlans) {
            return {
                text: this.badgeText,
            }
        }

        const text = this.badgeElement?.textContent || '';
        const bgColorAttr = this.badgeElement?.getAttribute?.('background-color');
        const bgColorSelected = document.querySelector('sp-picker[data-field="badgeColor"]')?.value
        const bgColor = bgColorAttr?.toLowerCase() || bgColorSelected || 'spectrum-yellow-300';

        const borderColorAttr = this.badgeElement?.getAttribute?.('border-color');
        const borderColorSelected = document.querySelector('sp-picker[data-field="badgeBorderColor"]')?.value
        const borderColor = borderColorAttr?.toLowerCase() || borderColorSelected;

        return {
            text,
            bgColor,
            borderColor,
        }
    }

    createBadgeElement(text, bgColor, borderColor) {
        if (!text) return;

        const element = document.createElement('merch-badge');
        element.setAttribute('background-color', bgColor);
        if (bgColor === 'spectrum-green-900-plans' || bgColor === 'spectrum-gray-700-plans') element.setAttribute('color', '#fff');
        element.setAttribute('border-color', borderColor);
        element.setAttribute('variant', this.fragment.variant);
        element.textContent = text;
        return element;
    }

    #updateBadgeText(event) {
        const text = event.target.value?.trim() || '';
        if (this.isPlans) {
            this.displayBadgeColorFields(text);
            this.updateBadge(text, this.badge.bgColor, this.badge.borderColor);
        } else {
            this.fragmentStore.updateField('badge', [text]);
        }
    }

    onBadgeColorChange(event) {
        this.updateBadge(this.badge.text, event.target.value, this.badge.borderColor);
    }

    onBadgeBorderColorChange(event) {
        this.updateBadge(this.badge.text, this.badge.bgColor, event.target.value);
    }

    updateBadge(text, bgColor, borderColor) {
        const element = this.createBadgeElement(text, bgColor, borderColor);
        this.fragmentStore.updateField('badge', [element?.outerHTML || '']);
    }

    async #updateBackgroundColors() {
        if (!this.fragment) return;
        const merchCardCustomElement = await merchCardCustomElementPromise;
        const variant = merchCardCustomElement?.getFragmentMapping(
            this.fragment.variant,
        );
        this.availableBackgroundColors = {
            Default: undefined,
            ...(variant.allowedColors ?? []),
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
        if (!this.isPlans) return;

        return html`
            ${this.#renderColorPicker(
                'badgeColor',
                'Badge Color',
                this.availableBadgeColors,
                this.badge.bgColor,
                'badgeColor',
                this.onBadgeColorChange,
            )}
            ${this.#renderColorPicker(
                'badgeBorderColor',
                'Badge Border Color',
                this.availableBadgeColors,
                this.badge.borderColor,
                'badgeBorderColor',
                this.onBadgeBorderColorChange,
            )}
        `;
    }

    #renderColorPicker(id, label, colors, selectedValue, dataField, onChange) {
        const isBackground = dataField === 'backgroundColor';
        const options = isBackground
            ? ['Default', ...colors]
            : dataField === 'borderColor' || dataField === 'badgeBorderColor'
              ? ['', ...colors]
              : colors;

        return html`
            <sp-field-group class="${onChange ? '' : 'toggle'}" id="${id}">
                <sp-field-label for="${id}">${label}</sp-field-label>
                <sp-picker
                    id="${id}"
                    data-field="${dataField}"
                    value="${selectedValue || (isBackground ? 'Default' : '')}"
                    data-default-value="${isBackground ? 'Default' : ''}"
                    @change="${onChange ? onChange : this.updateFragment}"
                >
                    ${options.map(
                        (color) => html`
                            <sp-menu-item value="${color}">
                                <div
                                    style="display: flex; align-items: center; gap: 8px;"
                                >
                                    ${color
                                        ? html`
                                              ${!isBackground
                                                  ? html`
                                                        <div
                                                            style="
                                            width: 16px;
                                            height: 16px;
                                            background: var(--${color});
                                            border: 1px solid var(--spectrum-global-color-gray-300);
                                            border-radius: 3px;
                                        "
                                                        ></div>
                                                    `
                                                  : nothing}
                                              <span
                                                  >${isBackground
                                                      ? this.#formatName(color)
                                                      : this.#formatColorName(
                                                            color,
                                                        )}</span
                                              >
                                          `
                                        : html`
                                              <span
                                                  >${isBackground
                                                      ? 'Default'
                                                      : 'Transparent'}</span
                                              >
                                          `}
                                </div>
                            </sp-menu-item>
                        `,
                    )}
                </sp-picker>
            </sp-field-group>
        `;
    }

    #backgroundColorSelection(colors, selectedValue, dataField) {
        const options = { Default: undefined, ...colors };
        return html`
            <sp-field-group class="toggle" id="backgroundColor">
                <sp-field-label for="backgroundColor"
                    >Background Color</sp-field-label
                >
                <sp-picker
                    id="backgroundColor"
                    data-field="${dataField}"
                    value="${selectedValue || 'Default'}"
                    data-default-value="${selectedValue || 'Default'}"
                    @change="${this.updateFragment}"
                >
                    ${Object.entries(options)
                        .sort(([a], [b]) =>
                            a === 'Default' ? -1 : b === 'Default' ? 1 : 0,
                        )
                        .map(
                            ([colorName, colorValue]) => html`
                                <sp-menu-item value="${colorName}">
                                    <div
                                        style="display: flex; align-items: center; gap: 8px;"
                                    >
                                        ${colorName === 'Default'
                                            ? html`<span>Default</span>`
                                            : html`
                                                  <div
                                                      style="
                                            width: 16px;
                                            height: 16px;
                                            background: ${colorValue};
                                            border: 1px solid var(--spectrum-global-color-gray-300);
                                            border-radius: 3px;
                                        "
                                                  ></div>
                                                  <span>${colorName}</span>
                                              `}
                                    </div>
                                </sp-menu-item>
                            `,
                        )}
                </sp-picker>
            </sp-field-group>
        `;
    }
}

customElements.define('merch-card-editor', MerchCardEditor);
