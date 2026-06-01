import { VariantLayout } from './variant-layout';
import { html, css, nothing } from 'lit';
import { CSS } from './plans-bizpro.css.js';
import {
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    SELECTOR_MAS_INLINE_PRICE,
} from '../constants.js';

export const BIZPRO_PLANS_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    subtitle: { tag: 'p', slot: 'subtitle' },
    title: { tag: 'h3', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 's' },
    prices: { tag: 'p', slot: 'heading-m' },
    promoText: { tag: 'p', slot: 'promo-text' },
    perUnitLabel: { tag: 'span', slot: 'per-unit-label' },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'License callout',
    },
    quantitySelect: { tag: 'div', slot: 'quantity-select' },
    shortDescription: { tag: 'div', slot: 'legal-text' },
    secureLabel: true,
    // TODO(MWPW-192902): The functional AI Assistant add-on stays inert in
    // production until its add-on placeholder is authored in AEM (proposed
    // {{addon-acrobat-ai-assistant}}) so it shows in the editor's add-on picker
    // and resolves to the offer + inline price. Code-side wiring is complete.
    addon: true,
    ctas: { slot: 'footer', size: 'm' },
    whatsIncluded: { tag: 'div', slot: 'whats-included' },
    borderColor: {
        attribute: 'border-color',
        specialValues: { Black: 'black' },
    },
    allowedBorderColors: [],
    style: 'consonant',
};

export class BizProPlans extends VariantLayout {
    expanded = false;
    licenseOpen = false;
    licenseQty = null;
    #licenseDocListenerBound = null;

    getGlobalCSS() {
        return CSS;
    }

    get hasWhatsIncluded() {
        return !!this.card.querySelector('[slot="whats-included"]');
    }

    get hasCallout() {
        return !!this.card.querySelector('[slot="callout-content"]');
    }

    get hasQuantitySelect() {
        // The "Show quantity selector" toggle authors an empty sentinel
        // (<merch-quantity-select/>) when off, which hydrate still wraps in a
        // slot div. Only count a *configured* selector (title/min/step) so an
        // empty one doesn't trigger the styled license-zone.
        const qs = this.quantitySelectEl;
        if (!qs) return false;
        return (
            !!qs.getAttribute('title') ||
            parseInt(qs.getAttribute('min'), 10) > 0 ||
            parseInt(qs.getAttribute('step'), 10) > 0
        );
    }

    get hasPriceOriginal() {
        return !!this.card.querySelector('[slot="price-original"]');
    }

    get hasTermsLink() {
        return !!this.card.querySelector('[slot="terms-link"]');
    }

    get hasAddOn() {
        return !!this.card.querySelector('[slot="addon"]');
    }

    get mainPrice() {
        return this.card.querySelector(
            `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
        );
    }

    async adjustAddon() {
        await this.card.updateComplete;
        const addon = this.card.addon;
        if (!addon) return;
        addon.setAttribute('custom-checkbox', '');
        const price = this.mainPrice;
        if (!price) return;
        await price.onceSettled();
        const planType = price.value?.[0]?.planType;
        if (planType) addon.planType = planType;
    }

    async postCardUpdateHook() {
        await this.adjustAddon();
        await super.postCardUpdateHook();
    }

    disconnectedCallbackHook() {
        this.#removeLicenseDocListener();
    }

    get hasLegalText() {
        return !!this.card.querySelector('[slot="legal-text"]');
    }

    get quantitySelectEl() {
        return this.card.querySelector('merch-quantity-select');
    }

    get licenseOptions() {
        // Options are driven by the authored quantity selector (min→max by step)
        // so the styled dropdown follows the "Show quantity selector" toggle.
        const qs = this.quantitySelectEl;
        if (!qs) return null;
        const min = parseInt(qs.getAttribute('min'), 10);
        const max = parseInt(qs.getAttribute('max'), 10);
        const step = parseInt(qs.getAttribute('step'), 10) || 1;
        if (Number.isNaN(min) || Number.isNaN(max) || max < min) return null;
        const opts = [];
        for (let v = min; v <= max; v += step) opts.push(String(v));
        return opts.length ? opts : null;
    }

    get licenseLabel() {
        // TODO(MWPW-192902): 'License' fallback is English-only; source it from
        // a placeholder/literal once the add-on copy is authored in AEM.
        return this.quantitySelectEl?.getAttribute('title') || 'License';
    }

    get licenseLabelPlural() {
        // TODO(MWPW-192902): naive English pluralization; replace with a
        // localized plural form when the copy is authored in AEM.
        return `${this.licenseLabel}s`;
    }

    get hasLicenseSelector() {
        return (this.licenseOptions?.length ?? 0) > 0;
    }

    get currentLicenseValue() {
        const opts = this.licenseOptions;
        if (!opts?.length) return null;
        if (this.licenseQty != null) return this.licenseQty;
        const def = this.quantitySelectEl?.getAttribute('default-value');
        return def != null && opts.includes(def) ? def : opts[0];
    }

    formatLicenseRow(value) {
        const isOne = String(value).replace(/\D/g, '') === '1';
        const label = isOne ? this.licenseLabel : this.licenseLabelPlural;
        return { value, label };
    }

    toggleExpanded = (e) => {
        e.preventDefault();
        this.expanded = !this.expanded;
        this.card.requestUpdate();
    };

    #removeLicenseDocListener() {
        if (!this.#licenseDocListenerBound) return;
        document.removeEventListener(
            'mousedown',
            this.#licenseDocListenerBound,
        );
        this.#licenseDocListenerBound = null;
    }

    toggleLicensePopover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.licenseOpen = !this.licenseOpen;
        if (this.licenseOpen) {
            this.#licenseDocListenerBound = (evt) => {
                if (!evt.composedPath().includes(this.card)) {
                    this.licenseOpen = false;
                    this.card.requestUpdate();
                    this.#removeLicenseDocListener();
                }
            };
            document.addEventListener(
                'mousedown',
                this.#licenseDocListenerBound,
            );
        } else {
            this.#removeLicenseDocListener();
        }
        this.card.requestUpdate();
    };

    selectLicenseQty = (value) => {
        this.licenseQty = value;
        this.licenseOpen = false;
        this.#removeLicenseDocListener();
        // Route the selection through the authored quantity selector so the
        // existing merch-card → checkout-link quantity wiring stays intact.
        const qs = this.quantitySelectEl;
        if (qs) {
            qs.selectedValue = Number(value);
            qs.dispatchEvent(
                new CustomEvent(EVENT_MERCH_QUANTITY_SELECTOR_CHANGE, {
                    detail: { option: Number(value) },
                    bubbles: true,
                }),
            );
        }
        this.card.requestUpdate();
    };

    renderLicenseSelector() {
        if (!this.hasLicenseSelector) {
            return html`<slot name="quantity-select"></slot>`;
        }
        const opts = this.licenseOptions;
        const current = this.currentLicenseValue;
        const open = !!this.licenseOpen;
        const { value, label } = this.formatLicenseRow(current);
        return html`
            <div class="license-select" ?data-open=${open}>
                <button
                    class="license-select-trigger"
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded=${open ? 'true' : 'false'}
                    aria-controls="license-popover"
                    @click=${this.toggleLicensePopover}
                >
                    <span class="license-select-trigger-text">
                        <span class="license-select-value">${value}</span>
                        <span class="license-select-label">${label}</span>
                    </span>
                    <span
                        class="license-select-chevron"
                        aria-hidden="true"
                    ></span>
                </button>
                <ul
                    id="license-popover"
                    class="license-select-popover"
                    role="listbox"
                    ?hidden=${!open}
                >
                    <li
                        class="license-select-popover-header"
                        @click=${this.toggleLicensePopover}
                    >
                        <span class="license-select-trigger-text">
                            <span class="license-select-value">${value}</span>
                            <span class="license-select-label">${label}</span>
                        </span>
                        <span
                            class="license-select-chevron"
                            aria-hidden="true"
                            style="transform: rotate(180deg);"
                        ></span>
                    </li>
                    ${opts.map(
                        (opt) => html`
                            <li
                                class="license-select-option ${opt === current
                                    ? 'selected'
                                    : ''}"
                                role="option"
                                aria-selected=${opt === current
                                    ? 'true'
                                    : 'false'}
                                @click=${() => this.selectLicenseQty(opt)}
                            >
                                ${opt}
                            </li>
                        `,
                    )}
                </ul>
            </div>
        `;
    }

    renderLayout() {
        const expanded = !!this.expanded;
        return html`
            <div class="top-card">
                <div class="mnemonic">
                    <slot name="icons"></slot>
                    <slot name="subtitle"></slot>
                </div>
                <div class="name-description">
                    <slot name="heading-xs"></slot>
                    <slot name="body-xs"></slot>
                    ${this.hasTermsLink
                        ? html`<div class="terms-link">
                              <slot name="terms-link"></slot>
                          </div>`
                        : nothing}
                </div>
                <div class="pricing">
                    ${this.hasPriceOriginal
                        ? html`<slot name="price-original"></slot>`
                        : nothing}
                    <div class="pricing-line">
                        <slot name="heading-m"></slot>
                        <slot name="per-unit-label"></slot>
                    </div>
                    <slot name="promo-text"></slot>
                </div>
                ${this.hasLegalText
                    ? html`<div class="legal-text">
                          <slot name="legal-text"></slot>
                      </div>`
                    : nothing}
                ${this.hasLicenseSelector ||
                this.hasCallout ||
                this.hasQuantitySelect
                    ? html`<div class="license-zone">
                          ${this.renderLicenseSelector()}
                          ${this.hasCallout
                              ? html`<div class="callout">
                                    <slot name="callout-content"></slot>
                                </div>`
                              : nothing}
                      </div>`
                    : nothing}
                ${this.hasAddOn
                    ? html`<div class="add-on">
                          <slot name="addon"></slot>
                      </div>`
                    : nothing}
                <footer>
                    <slot name="footer"></slot>
                </footer>
                ${this.secureLabel}
            </div>
            ${this.hasWhatsIncluded
                ? html`
                      <button
                          class="whats-included-toggle"
                          type="button"
                          aria-expanded=${expanded ? 'true' : 'false'}
                          aria-controls="features-zone"
                          @click=${this.toggleExpanded}
                      >
                          <!-- TODO(MWPW-192902): English-only; source from a
                               placeholder/literal once copy is authored in AEM. -->
                          <span class="whats-included-toggle-label">
                              See what's included:
                          </span>
                          <span
                              class="whats-included-toggle-chevron"
                              aria-hidden="true"
                          ></span>
                      </button>
                      <div
                          id="features-zone"
                          class="features-zone"
                          ?hidden=${!expanded}
                      >
                          <slot name="whats-included"></slot>
                      </div>
                  `
                : nothing}
            <slot></slot>
        `;
    }

    static variantStyle = css`
        :host([variant='plans-bizpro']) {
            display: flex;
            flex-direction: column;
            background: var(
                --consonant-merch-card-plans-bizpro-frame-bg,
                var(--s2a-color-background-subtle, #f8f8f8)
            );
            border-radius: var(--s2a-border-radius-md, 16px);
            padding: var(--s2a-spacing-xs, 8px);
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            color: var(
                --consonant-merch-card-plans-bizpro-frame-text,
                var(--s2a-color-content-default, #000)
            );
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M9 9.2C9 8.64844 8.55156 8.2 8 8.2C7.44844 8.2 7 8.64844 7 9.2C7 9.52207 7.16289 9.7959 7.4 9.9789V10.6C7.4 10.9312 7.66875 11.2 8 11.2C8.33125 11.2 8.6 10.9312 8.6 10.6V9.9789C8.83711 9.7959 9 9.52207 9 9.2Z'/%3E%3Cpath d='M12 5.62031V5.2C12 2.99453 10.2055 1.2 8 1.2C5.79453 1.2 4 2.99453 4 5.2V5.62031C3.10274 5.72129 2.4 6.47637 2.4 7.4V12.6C2.4 13.5922 3.20782 14.4 4.2 14.4H11.8C12.7922 14.4 13.6 13.5922 13.6 12.6V7.4C13.6 6.47637 12.8973 5.72129 12 5.62031ZM8 2.4C9.54375 2.4 10.8 3.65625 10.8 5.2V5.6H5.2V5.2C5.2 3.65625 6.45625 2.4 8 2.4ZM12.4 12.6C12.4 12.9305 12.1305 13.2 11.8 13.2H4.2C3.86953 13.2 3.6 12.9305 3.6 12.6V7.4C3.6 7.06953 3.86953 6.8 4.2 6.8H11.8C12.1305 6.8 12.4 7.06953 12.4 7.4V12.6Z'/%3E%3C/svg%3E");
        }

        :host([variant='plans-bizpro'][border-color='black']) {
            --consonant-merch-card-plans-bizpro-frame-bg: var(
                --s2a-color-background-knockout,
                #000
            );
            --consonant-merch-card-plans-bizpro-frame-text: var(
                --s2a-color-content-knockout,
                #fff
            );
            --consonant-merch-card-plans-bizpro-divider-color: var(
                --s2a-color-transparent-white-16,
                #ffffff29
            );
            --consonant-merch-card-plans-bizpro-subtitle-color: var(
                --s2a-color-content-default,
                #000
            );
        }

        :host([variant='plans-bizpro']) .top-card {
            background: var(--s2a-color-background-default, #fff);
            border-radius: 12px;
            padding: var(--s2a-spacing-lg, 24px);
            display: flex;
            flex-direction: column;
            gap: var(--s2a-spacing-lg, 24px);
            color: var(--s2a-color-content-default, #000);
            /* Fill the merch-card's height so price/CTA/secure-label
               anchor to the bottom of the white card. Combined with
               .name-description flex-grow below, this aligns the price
               + CTA rows across cards in the same grid row. */
            flex: 1 1 auto;
        }

        :host([variant='plans-bizpro']) .mnemonic {
            display: flex;
            align-items: center;
            gap: var(--s2a-spacing-sm, 12px);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='icons']) {
            width: 24px;
            height: 24px;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='subtitle']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 16px;
            line-height: 20px;
            letter-spacing: var(--s2a-typography-letter-spacing-eyebrow, 0);
            color: var(
                --consonant-merch-card-plans-bizpro-subtitle-color,
                var(--s2a-color-content-subtle, #000000a3)
            );
            flex: 1;
        }

        :host([variant='plans-bizpro']) .name-description {
            display: flex;
            flex-direction: column;
            gap: var(--s2a-spacing-xs, 8px);
            /* Grow to absorb height differences so everything from price
               downward sticks to the bottom edge of the white card. */
            flex: 1 1 auto;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='heading-xs']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: var(--s2a-typography-font-size-title-4, 24px);
            line-height: var(--s2a-typography-line-height-title-4, 24px);
            letter-spacing: var(--s2a-font-letter-spacing-4xl, -0.48px);
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='body-xs']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) .pricing {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='heading-m']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='promo-text']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-subtle, #000000a3);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='price-original']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-subtle, #000000a3);
            text-decoration: line-through;
            text-decoration-skip-ink: none;
        }

        :host([variant='plans-bizpro']) .terms-link {
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='terms-link']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) .legal-text {
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) ::slotted([slot='legal-text']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-subtle, #000000a3);
        }

        :host([variant='plans-bizpro']) footer {
            display: flex;
            gap: var(--s2a-spacing-xs, 8px);
            padding: 0;
            margin: 0;
            background: transparent;
            min-height: auto;
        }

        :host([variant='plans-bizpro']) footer ::slotted([slot='footer']) {
            display: flex;
            gap: var(--s2a-spacing-xs, 8px);
            flex: 1;
        }

        :host([variant='plans-bizpro']) .secure-transaction-label {
            display: inline-flex;
            align-items: center;
            gap: var(--s2a-spacing-xs, 8px);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: var(--s2a-color-content-subtle, #000000a3);
            padding: 0;
            margin: 0;
            align-self: flex-start;
            flex: 0 0 auto;
            white-space: normal;
        }

        :host([variant='plans-bizpro']) .secure-transaction-label::before {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            background-image: var(--secure-icon);
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
        }

        :host([variant='plans-bizpro']) .features-zone {
            padding: var(--s2a-spacing-lg, 24px);
            display: flex;
            flex-direction: column;
            gap: var(--s2a-spacing-lg, 24px);
            color: var(
                --consonant-merch-card-plans-bizpro-frame-text,
                var(--s2a-color-content-default, #000)
            );
        }

        :host([variant='plans-bizpro']) .features-zone[hidden] {
            display: none;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='whats-included']) {
            color: inherit;
            display: flex;
            flex-direction: column;
            gap: var(--s2a-spacing-lg, 24px);
        }

        :host([variant='plans-bizpro']) .whats-included-toggle {
            all: unset;
            display: flex;
            align-items: center;
            padding: var(--s2a-spacing-lg, 24px);
            cursor: pointer;
            color: var(
                --consonant-merch-card-plans-bizpro-frame-text,
                var(--s2a-color-content-default, #000)
            );
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
        }

        /* Expanded state: no bottom padding — features-zone provides spacing */
        :host([variant='plans-bizpro'])
            .whats-included-toggle[aria-expanded='true'] {
            padding-bottom: 0;
        }

        :host([variant='plans-bizpro']) .whats-included-toggle-label {
            flex: 1 0 0;
        }

        :host([variant='plans-bizpro']) .whats-included-toggle:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
            border-radius: 8px;
        }

        :host([variant='plans-bizpro']) .whats-included-toggle-chevron {
            width: 20px;
            height: 20px;
            background-color: currentColor;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            transition: transform 200ms ease;
            flex: 0 0 auto;
        }

        :host([variant='plans-bizpro'])
            .whats-included-toggle[aria-expanded='true']
            .whats-included-toggle-chevron {
            transform: rotate(180deg);
        }

        :host([variant='plans-bizpro']) .pricing-line {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 0;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='per-unit-label']) {
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: var(--s2a-color-content-default, #000);
            margin-inline-start: var(--s2a-spacing-2xs, 4px);
        }

        :host([variant='plans-bizpro']) .license-zone {
            display: flex;
            flex-direction: column;
            background: var(--s2a-color-background-subtle, #f8f8f8);
            border-radius: 8px;
            overflow: visible;
        }

        :host([variant='plans-bizpro']) .license-select {
            position: relative;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
        }

        :host([variant='plans-bizpro']) .license-select-trigger {
            all: unset;
            box-sizing: border-box;
            width: 100%;
            height: 40px;
            padding: var(--s2a-spacing-sm, 12px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--s2a-color-background-default, #fff);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            cursor: pointer;
            color: var(--s2a-color-content-default, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
        }

        :host([variant='plans-bizpro']) .license-select-trigger:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: 1px;
        }

        :host([variant='plans-bizpro']) .license-select-trigger-text {
            display: flex;
            align-items: center;
            gap: var(--s2a-spacing-xs, 8px);
        }

        :host([variant='plans-bizpro']) .license-select-value {
            font-weight: 700;
            color: var(--s2a-color-content-default, #000);
        }

        :host([variant='plans-bizpro']) .license-select-label {
            font-weight: 700;
            color: rgba(0, 0, 0, 0.64);
        }

        :host([variant='plans-bizpro']) .license-select-chevron {
            width: 16px;
            height: 16px;
            background-color: currentColor;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 13.5a.75.75 0 0 1-.53-.22l-5-5a.75.75 0 0 1 1.06-1.06L10 11.69l4.47-4.47a.75.75 0 0 1 1.06 1.06l-5 5a.75.75 0 0 1-.53.22Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            transition: transform 200ms ease;
            flex: 0 0 auto;
        }

        :host([variant='plans-bizpro'])
            .license-select-trigger[aria-expanded='true']
            .license-select-chevron {
            transform: rotate(180deg);
        }

        :host([variant='plans-bizpro']) .license-select-popover {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            margin: 0;
            padding: 0;
            list-style: none;
            background: var(--s2a-color-background-default, #fff);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            box-shadow:
                0 7px 15px rgba(0, 0, 0, 0.1),
                0 27px 27px rgba(0, 0, 0, 0.09),
                0 61px 36px rgba(0, 0, 0, 0.05),
                0 108px 43px rgba(0, 0, 0, 0.01);
            overflow: hidden;
            z-index: 10;
        }

        :host([variant='plans-bizpro']) .license-select-popover[hidden] {
            display: none;
        }

        :host([variant='plans-bizpro']) .license-select-popover-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--s2a-spacing-sm, 12px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            cursor: pointer;
            background: var(--s2a-color-background-default, #fff);
        }

        :host([variant='plans-bizpro']) .license-select-option {
            padding: 16px 12px;
            cursor: pointer;
            color: var(--s2a-color-content-default, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        :host([variant='plans-bizpro']) .license-select-option:last-child {
            border-bottom: none;
        }

        :host([variant='plans-bizpro']) .license-select-option:hover,
        :host([variant='plans-bizpro']) .license-select-option.selected {
            background: var(--s2a-color-background-subtle, #f8f8f8);
        }

        :host([variant='plans-bizpro']) .callout {
            padding: 8px 12px 12px 12px;
            color: var(--s2a-color-content-default, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 12px;
            line-height: 16px;
            letter-spacing: 0.24px;
            font-weight: 700;
            text-align: start;
        }

        :host([variant='plans-bizpro']) ::slotted([slot='callout-content']) {
            margin: 0;
        }

        :host([variant='plans-bizpro']) .add-on {
            display: flex;
            align-items: center;
            gap: var(--s2a-spacing-xs, 8px);
            padding: var(--s2a-spacing-md, 16px) var(--s2a-spacing-sm, 12px);
            /* Gradient border (Figma 1098:33812) — same purple→red AI gradient
               as the trailing sparkle. Paint the white fill on padding-box and
               the gradient on border-box so only the 1px border shows it. */
            background:
                linear-gradient(
                        var(--s2a-color-background-default, #fff),
                        var(--s2a-color-background-default, #fff)
                    )
                    padding-box,
                linear-gradient(45deg, #8d88f2 0%, #8d88f2 48.8%, #eb1000 100%)
                    border-box;
            border: 1px solid transparent;
            border-radius: var(--s2a-border-radius-sm, 8px);
            box-sizing: border-box;
        }

        :host([variant='plans-bizpro']) .add-on::after {
            content: '';
            width: 16px;
            height: 16px;
            flex: 0 0 auto;
            /* Sparkle gradient is the raw 2-stop Linear Gradient (not the
               48.8%-stop AI Gradient): vertical, red top → purple bottom — the
               Figma asset is purple→red top-to-bottom inside a -scale-y-100
               flip, so as displayed it reads red on top. */
            background: linear-gradient(180deg, #eb1000 0%, #8d88f2 100%);
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
        }

        /* C2 desktop breakpoint: toggle disappears, features-zone is always visible inline */
        @media (min-width: 1280px) {
            :host([variant='plans-bizpro']) .whats-included-toggle {
                display: none;
            }
            :host([variant='plans-bizpro']) .features-zone[hidden] {
                display: flex;
            }
        }
    `;
}
