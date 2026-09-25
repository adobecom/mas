import { LitElement, html, nothing } from 'lit';
import '../rte/rte-field.js';
import './mnemonic-field.js';

const isDarkBadgeBg = (bgColor) =>
    bgColor.includes('-green-900-') || bgColor.includes('-gray-700-') || bgColor === 'gradient-purple-blue';

export function parseBadgeHtml(value) {
    if (!value) return { text: '', bgColor: '', borderColor: '', icon: '' };
    if (value.startsWith('<merch-badge')) {
        const el = new DOMParser().parseFromString(value, 'text/html').querySelector('merch-badge');
        const hasInlinePrice = el?.querySelector('span[is="inline-price"]');
        return {
            text: hasInlinePrice ? el.innerHTML : el?.textContent?.trim() || '',
            bgColor: el?.getAttribute('background-color')?.toLowerCase() || '',
            borderColor: el?.getAttribute('border-color')?.toLowerCase() || '',
            icon: el?.getAttribute('icon') || '',
        };
    }
    return { text: value.trim(), bgColor: '', borderColor: '', icon: '' };
}

export function serializeBadgeHtml({ text, bgColor, borderColor, icon, variant }) {
    if (!text) return '';
    if (!bgColor && !borderColor && !icon && !variant) return text;
    const attrs = [];
    if (bgColor) {
        attrs.push(`background-color="${bgColor}"`);
        if (isDarkBadgeBg(bgColor)) attrs.push('color="#fff"');
    }
    if (borderColor && borderColor !== 'Default') attrs.push(`border-color="${borderColor}"`);
    if (icon) attrs.push(`icon="${icon}"`);
    if (variant) attrs.push(`variant="${variant}"`);
    return `<merch-badge ${attrs.join(' ')}>${text}</merch-badge>`;
}

const formatColorName = (color) =>
    color
        .replace(/(spectrum|global|color|plans|variation|-)/gi, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Reusable badge authoring section: badge text (RTE), badge icon, badge background color and
 * badge border color. Owns parse/serialize of `<merch-badge>` HTML and emits a single `change`
 * event carrying the fully serialized value, so consumers only write the field. Renders into
 * light DOM so it inherits the host's field styling (swatches, field-status, two-column-grid).
 */
class BadgeSection extends LitElement {
    static properties = {
        value: { type: String },
        field: { type: String },
        colors: { type: Array },
        borderColors: { type: Array },
        variant: { type: String },
        osi: { type: String },
        showIcon: { type: Boolean, attribute: 'show-icon' },
        showColors: { type: Boolean, attribute: 'show-colors' },
        isVariation: { type: Boolean, attribute: 'is-variation' },
        fieldStates: { type: Object },
    };

    constructor() {
        super();
        this.value = '';
        this.field = 'badge';
        this.colors = [];
        this.borderColors = [];
        this.variant = '';
        this.osi = '';
        this.showIcon = false;
        this.showColors = false;
        this.isVariation = false;
        this.fieldStates = {};
    }

    createRenderRoot() {
        return this;
    }

    get parsed() {
        // When colors are unsupported the field stores plain text, not a `<merch-badge>`.
        if (!this.showColors) return { text: this.value || '', bgColor: '', borderColor: '', icon: '' };
        return parseBadgeHtml(this.value);
    }

    #emit(changes, sourceEvent) {
        // Inner controls (rte-field, sp-picker, mnemonic) dispatch their own bubbling/composed
        // `change`; stop it so consumers only ever see this section's single serialized `change`.
        sourceEvent?.stopPropagation();
        const next = { ...this.parsed, ...changes };
        const value = this.showColors ? serializeBadgeHtml({ ...next, variant: this.variant }) : next.text || '';
        // Accumulate locally so a burst of synchronous edits (text, then colors) each build on the
        // previous one instead of the stale `value` prop, which only refreshes on the host re-render.
        this.value = value;
        this.dispatchEvent(new CustomEvent('change', { detail: { value }, bubbles: true, composed: true }));
    }

    #restore(component) {
        this.dispatchEvent(
            new CustomEvent('restore', { detail: { field: this.field, component }, bubbles: true, composed: true }),
        );
    }

    #overrideIndicator(component) {
        if (!this.isVariation || this.fieldStates?.[component] !== 'overridden') return nothing;
        return html`
            <div class="field-status-indicator">
                <sp-icon-unlink class="field-status-icon"></sp-icon-unlink>
                <span class="field-status-label">Overridden.</span>
                <a
                    href="#"
                    class="field-status-restore-link"
                    @click=${(event) => {
                        event.preventDefault();
                        this.#restore(component);
                    }}
                    ><span class="field-status-restore-link-prefix" aria-hidden="true">Overridden. </span>
                    <span class="field-status-restore-link-text">Click to restore.</span></a
                >
            </div>
        `;
    }

    #colorPickerValue(color) {
        if (!color) return 'Default';
        if (color === 'transparent') return 'Transparent';
        return color;
    }

    #pickedColor(value) {
        if (value === 'Default') return '';
        if (value === 'Transparent') return 'transparent';
        return value;
    }

    #renderColorPicker(label, dataField, options, selected, component) {
        return html`
            <sp-field-group id="${dataField}">
                <sp-field-label for="${dataField}">${label}</sp-field-label>
                <sp-picker
                    id="${dataField}"
                    data-field="${dataField}"
                    data-field-state="${this.fieldStates?.[component] ?? 'no-parent'}"
                    value="${this.#colorPickerValue(selected)}"
                    @change=${(e) => this.#emit({ [component]: this.#pickedColor(e.target.value) }, e)}
                >
                    <sp-menu-item value="Default"><span>Default</span></sp-menu-item>
                    <sp-menu-item value="Transparent"><span>Transparent</span></sp-menu-item>
                    ${options.map(
                        (color) => html`
                            <sp-menu-item value="${color}">
                                <div class="menu-item-container">
                                    <div class="color-swatch" style="--swatch-bg: var(--${color})"></div>
                                    <span class="color-name-text" title="${formatColorName(color)}"
                                        >${formatColorName(color)}</span
                                    >
                                </div>
                            </sp-menu-item>
                        `,
                    )}
                </sp-picker>
                ${this.#overrideIndicator(component)}
            </sp-field-group>
        `;
    }

    render() {
        const { text, bgColor, borderColor, icon } = this.parsed;
        const isTrial = this.field === 'trialBadge';
        const inputId = isTrial ? 'card-trial-badge' : 'card-badge';
        return html`
            <div class="two-column-grid">
                <sp-field-group class="toggle" id="${this.field}">
                    <sp-field-label for="${inputId}">${isTrial ? 'Trial Badge' : 'Badge'}</sp-field-label>
                    <rte-field
                        id="${inputId}"
                        inline
                        hide-format-buttons
                        data-field="${this.field}"
                        data-field-state="${this.fieldStates?.text ?? 'no-parent'}"
                        .osi="${this.osi}"
                        .value="${text}"
                        @change=${(e) => this.#emit({ text: e.target.value }, e)}
                    ></rte-field>
                    ${this.#overrideIndicator('text')}
                </sp-field-group>
                ${
                    this.showIcon
                        ? html`
                              <sp-field-group class="toggle" id="${this.field}Icon">
                                  <mas-mnemonic-field
                                      .icon="${icon}"
                                      .iconLibrary="${true}"
                                      .variant="${this.variant}"
                                      data-field-state="${this.fieldStates?.icon ?? 'no-parent'}"
                                      style="display: ${text ? 'block' : 'none'};"
                                      @change=${(e) => this.#emit({ icon: e.detail.icon }, e)}
                                  ></mas-mnemonic-field>
                                  ${this.#overrideIndicator('icon')}
                              </sp-field-group>
                          `
                        : nothing
                }
                </div>
                ${
                    this.showColors && text
                        ? html`
                              <div class="two-column-grid">
                                  ${this.#renderColorPicker(
                                      isTrial ? 'Trial Badge Color' : 'Badge Color',
                                      `${this.field}Color`,
                                      this.colors,
                                      bgColor,
                                      'bgColor',
                                  )}
                                  ${this.#renderColorPicker(
                                      isTrial ? 'Trial Badge Border Color' : 'Badge Border Color',
                                      `${this.field}BorderColor`,
                                      this.borderColors,
                                      borderColor,
                                      'borderColor',
                                  )}
                              </div>
                          `
                        : nothing
                }
            </div>
        `;
    }
}

customElements.define('badge-section', BadgeSection);
