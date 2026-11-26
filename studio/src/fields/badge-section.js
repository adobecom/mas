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

export const formatColorName = (color) =>
    color
        .replace(/(spectrum|global|color|plans|variation|-)/gi, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .replace(/\s+/g, ' ')
        .trim();

const COLOR_DISPLAY_NAMES = {
    'spectrum-yellow-300-plans': 'Yellow',
    'spectrum-gray-300-plans': 'Gray',
    'spectrum-gray-700-plans': 'Dark gray',
    'spectrum-green-900-plans': 'Green',
    'gradient-purple-blue': 'Gradient purple / blue',
};

/** White square crossed by a red diagonal line. */
export const TRANSPARENT_SWATCH_BACKGROUND =
    'linear-gradient(to top right, #fff calc(50% - 1px), var(--spectrum-red-700, #d31510) calc(50% - 1px), var(--spectrum-red-700, #d31510) calc(50% + 1px), #fff calc(50% + 1px))';

/** Figma display name of a color value; colors without one keep the formatted token name. */
export const colorDisplayName = (color) => COLOR_DISPLAY_NAMES[color] ?? formatColorName(color);

/**
 * Swatch for a picker menu item. Sized inline and placed in the `icon` slot because sp-picker
 * copies it into its shadow DOM, where `.color-swatch` class styles do not apply.
 */
export const renderColorSwatch = (background) =>
    html`<div
        class="color-swatch"
        slot="icon"
        style="width:16px;height:16px;border:1px solid var(--spectrum-gray-300);border-radius:3px;flex-shrink:0;background:${background}"
    ></div>`;

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
        fromBaseline: { type: Object },
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
        this.fromBaseline = {};
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

    #statusIndicator(component) {
        if (this.fieldStates?.[component] === 'overridden') return this.#overrideIndicator(component);
        if (!this.fromBaseline?.[component]) return nothing;
        return html`<div class="field-status-indicator field-status-indicator--baseline">
            <span class="field-status-label">From baseline</span>
        </div>`;
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
                    <sp-menu-item value="Transparent">
                        ${renderColorSwatch(TRANSPARENT_SWATCH_BACKGROUND)}
                        <span>Transparent</span>
                    </sp-menu-item>
                    ${options.map(
                        (color) => html`
                            <sp-menu-item value="${color}">
                                ${renderColorSwatch(`var(--${color})`)}
                                <span class="color-name-text" title="${colorDisplayName(color)}"
                                    >${colorDisplayName(color)}</span
                                >
                            </sp-menu-item>
                        `,
                    )}
                </sp-picker>
                ${this.#statusIndicator(component)}
            </sp-field-group>
        `;
    }

    render() {
        const { text, bgColor, borderColor, icon } = this.parsed;
        const isTrial = this.field === 'trialBadge';
        const inputId = isTrial ? 'card-trial-badge' : 'card-badge';
        return html`
            <sp-field-group class="toggle" id="${this.field}">
                <sp-field-label for="${inputId}">${isTrial ? 'Trial badge' : 'Badge'}</sp-field-label>
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
                ${this.#statusIndicator('text')}
            </sp-field-group>
            ${this.showColors && text
                ? html`
                      <div class="two-column-grid">
                          ${this.#renderColorPicker(
                              isTrial ? 'Trial badge background color' : 'Badge background color',
                              `${this.field}Color`,
                              this.colors,
                              bgColor,
                              'bgColor',
                          )}
                          ${this.#renderColorPicker(
                              isTrial ? 'Trial badge border color' : 'Badge border color',
                              `${this.field}BorderColor`,
                              this.borderColors,
                              borderColor,
                              'borderColor',
                          )}
                      </div>
                  `
                : nothing}
            ${this.showIcon
                ? html`
                      <sp-field-group class="toggle" id="${this.field}Icon">
                          <mas-mnemonic-field
                              .icon="${icon}"
                              .iconLibrary="${true}"
                              .badgeIcon="${true}"
                              .variant="${this.variant}"
                              data-field-state="${this.fieldStates?.icon ?? 'no-parent'}"
                              style="display: ${text ? 'block' : 'none'};"
                              @change=${(e) => this.#emit({ icon: e.detail.icon }, e)}
                          ></mas-mnemonic-field>
                          ${this.#statusIndicator('icon')}
                      </sp-field-group>
                  `
                : nothing}
        `;
    }
}

customElements.define('badge-section', BadgeSection);
