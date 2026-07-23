import { VariantLayout } from './variant-layout';
import { html, css, nothing, unsafeCSS } from 'lit';
import { CSS } from './pro.css.js';
import { ARROW_DOWN, ARROW_UP, ENTER, TAB } from '../focus.js';
import {
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_TYPE_RESOLVED,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
} from '../constants.js';

const VARIANT = 'pro';
// syncHeights publishes this property and the shadow styles consume it; the
// single definition keeps producer and consumer from diverging.
const TOP_CARD_HEIGHT_PROP = `--consonant-merch-card-${VARIANT}-top-card-height`;

export const PRO_AEM_FRAGMENT_MAPPING = {
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
    planType: true,
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

export class Pro extends VariantLayout {
    expanded = false;
    licenseOpen = false;
    licenseQty = null;
    // Active-descendant highlight; focus stays on the trigger (combobox model).
    licenseHighlightedIndex = 0;
    #licenseDocListenerBound = null;
    #sizeObserver = null;
    lastSyncKey = null;

    constructor(card) {
        super(card);
        this.updatePriceQuantity = this.updatePriceQuantity.bind(this);
        // Restore expanded state persisted on the card element (survives layout
        // recreation caused by fragment hydration resetting card.variant).
        this.expanded = card._proExpanded ?? false;
    }

    getGlobalCSS() {
        return CSS;
    }

    // Forwards the Show Plan type setting to the legal-template price (which
    // renders the plan type line). Same pattern as plans/plans-v2.
    priceOptionsProvider(element, options) {
        if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
        options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
    }

    // Clones the main price into a legal-template sibling (as plans/plans-v2) so
    // tax/plan-type render on the clone, off the main price.
    async adjustLegal() {
        if (this.legalAdjusted) return;
        try {
            this.legalAdjusted = true;
            await this.card.updateComplete;
            await customElements.whenDefined('inline-price');
            const headingPrice = this.mainPrice;
            if (!headingPrice) return;
            const legal = headingPrice.cloneNode(true);
            await headingPrice.onceSettled();
            if (!headingPrice?.options) return;
            // Per-unit stays on the pricing line (unlike plans); only tax and
            // plan type move to the legal clone, which drops per-unit.
            if (headingPrice.options.displayTax)
                headingPrice.dataset.displayTax = 'false';
            if (headingPrice.options.displayPlanType)
                headingPrice.dataset.displayPlanType = 'false';
            legal.setAttribute('data-template', 'legal');
            legal.dataset.displayPerUnit = 'false';
            headingPrice.parentNode.insertBefore(
                legal,
                headingPrice.nextSibling,
            );
            await legal.onceSettled();
            // Re-apply the override whenever the legal price re-resolves.
            if (!this.legalResolvedHandler) {
                this.legalResolvedHandler = () => this.adjustShortDescription();
                legal.addEventListener(
                    EVENT_TYPE_RESOLVED,
                    this.legalResolvedHandler,
                );
            }
            this.adjustShortDescription();
        } catch {
            // Proceed with the other post-update adjustments
        }
    }

    // Authored Short Description replaces the derived plan type wording. Read
    // [slot="legal-text"] in place (never detached): the shadow has no matching
    // slot so it won't render, and merch-card swaps in a fresh layout per render.
    adjustShortDescription() {
        const text = this.card
            .querySelector('[slot="legal-text"]')
            ?.textContent?.trim();
        if (!text) return;
        const legalPrice = this.card.querySelector(
            '[slot="heading-m"] [data-template="legal"]',
        );
        const planType = legalPrice?.querySelector('.price-plan-type');
        if (!planType) return;
        planType.textContent = text;
        // The legal template appends ". " between the tax label and plan type, but
        // only when it rendered the plan type itself; we inject it, so add the same
        // separator so injected and WCS-sourced lines read alike (MWPW-198626).
        const tax = legalPrice.querySelector(
            '.price-tax-inclusivity:not(.disabled)',
        );
        if (tax?.textContent && !/\s$/.test(tax.textContent)) {
            tax.textContent += '. ';
        }
    }

    get hasWhatsIncluded() {
        return !!this.card.querySelector('[slot="whats-included"]');
    }

    get whatsIncludedToggleLabel() {
        // Authored as a leading <p class="whats-included-label">; English
        // fallback covers fragments authored before the label existed.
        return (
            this.card
                .querySelector('[slot="whats-included"] .whats-included-label')
                ?.textContent.trim() || "See what's included:"
        );
    }

    get hasCallout() {
        return !!this.card.querySelector('[slot="callout-content"]');
    }

    get hasQuantitySelect() {
        // Count only a configured selector (title/min/step) — the toggle authors
        // an empty <merch-quantity-select/> when off.
        const qs = this.quantitySelectEl;
        if (!qs) return false;
        return (
            !!qs.getAttribute('title') ||
            parseInt(qs.getAttribute('min'), 10) > 0 ||
            parseInt(qs.getAttribute('step'), 10) > 0
        );
    }

    get hasAddOn() {
        return !!this.card.querySelector('[slot="addon"]');
    }

    get mainPrice() {
        return this.card.querySelector(
            `[slot="heading-m"] ${SELECTOR_MAS_INLINE_PRICE}[data-template="price"]`,
        );
    }

    // Push the selected license quantity onto the main price so WCS re-prices
    // (volume promo). Mirrors mini-compare-chart — the card previously only
    // dispatched the event for checkout-link wiring, leaving the price at qty 1.
    updatePriceQuantity({ detail }) {
        if (!this.mainPrice || !detail?.option) return;
        this.mainPrice.dataset.quantity = detail.option;
    }

    async adjustAddon() {
        await this.card.updateComplete;
        const addon = this.card.addon;
        if (!addon) return;
        addon.setAttribute('custom-checkbox', '');
        const price = this.mainPrice;
        if (!price) return;
        await price.onceSettled?.();
        const planType = price.value?.[0]?.planType;
        if (planType) addon.planType = planType;
    }

    async postCardUpdateHook() {
        await this.adjustAddon();
        if (!this.legalAdjusted) {
            await this.adjustLegal();
        }
        this.adjustShortDescription();
        await super.postCardUpdateHook();
        // Line the white .top-card sections up across a row (desktop only).
        if (window.matchMedia('(min-width: 768px)').matches) this.syncHeights();
    }

    // Heading/description reflow when the Adobe Clean fonts load, so wait for
    // them before measuring. Same shape as full-pricing-express.waitForTitleFont.
    async waitForContentFonts() {
        const els = [
            this.card.querySelector('[slot="heading-xs"]'),
            this.card.querySelector('[slot="body-xs"]'),
        ].filter(Boolean);
        if (document.fonts?.load) {
            await Promise.all(
                els.map((el) => {
                    const s = window.getComputedStyle(el);
                    const font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
                    return document.fonts
                        .load(font, el.textContent)
                        .catch(() => null);
                }),
            );
        }
        await document.fonts?.ready;
    }

    // Publish each row's tallest white-card height as min-height so prices/CTAs
    // line up. Group by offsetTop, not rect.top: the tab entrance animation
    // transforms the painted tops mid-flight, which would split a row.
    async syncHeights() {
        if (this.card.heightSync === false) return;
        await this.waitForContentFonts();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const container = this.getContainer();
        if (!container || this.card.getBoundingClientRect().width <= 2) return;
        const variant = this.card.variant;
        const prop = TOP_CARD_HEIGHT_PROP;
        const cards = [
            ...container.querySelectorAll(`merch-card[variant="${variant}"]`),
        ].filter(
            (card) =>
                card.getBoundingClientRect().width > 2 &&
                card.variantLayout?.card?.heightSync !== false,
        );
        const rows = new Map();
        for (const card of cards) {
            const row = rows.get(card.offsetTop) ?? [];
            row.push(card);
            rows.set(card.offsetTop, row);
        }
        for (const row of rows.values()) {
            let max = 0;
            for (const card of row) {
                card.style.removeProperty(prop);
                const topCard = card.shadowRoot?.querySelector('.top-card');
                if (topCard)
                    max = Math.max(
                        max,
                        parseInt(getComputedStyle(topCard).height) || 0,
                    );
            }
            // A lone card has nothing to match, so it keeps its natural height.
            if (max > 0 && row.length > 1)
                row.forEach((card) => card.style.setProperty(prop, `${max}px`));
        }
    }

    // Re-sync on a real reflow (width or description-height change), keyed so
    // publishing the min-height can't loop the observer. Mirrors
    // full-pricing-express.resyncOnReflow.
    resyncOnReflow() {
        const width = this.card.getBoundingClientRect().width;
        if (width <= 2) return;
        const desc = this.card.querySelector('[slot="body-xs"]');
        const descHeight = desc
            ? Math.round(desc.getBoundingClientRect().height)
            : 0;
        const key = `${Math.round(width)}:${descHeight}`;
        if (key === this.lastSyncKey) return;
        this.lastSyncKey = key;
        this.syncHeights();
    }

    connectedCallbackHook() {
        if (!this.card) return;
        this.card.addEventListener(
            EVENT_MERCH_CARD_QUANTITY_CHANGE,
            this.#onModalQuantityChange,
        );
        this.card.addEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
        if (typeof ResizeObserver === 'undefined') return;
        this.#sizeObserver = new ResizeObserver(() => this.resyncOnReflow());
        this.#sizeObserver.observe(this.card);
        const desc = this.card.querySelector('[slot="body-xs"]');
        if (desc) this.#sizeObserver.observe(desc);
    }

    disconnectedCallbackHook() {
        this.card?.removeEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
        this.#removeLicenseDocListener();
        this.#sizeObserver?.disconnect();
        this.card?.removeEventListener(
            EVENT_MERCH_CARD_QUANTITY_CHANGE,
            this.#onModalQuantityChange,
        );
    }

    #onModalQuantityChange = ({ detail }) => {
        const next = detail?.quantity == null ? null : String(detail.quantity);
        if (next == null || next === this.licenseQty) return;
        if (!this.licenseOptions?.includes(next)) return;
        this.licenseQty = next;
        this.card.requestUpdate();
    };

    get quantitySelectEl() {
        return this.card.querySelector('merch-quantity-select');
    }

    get licenseOptions() {
        // Options come from the authored quantity selector (min→max by step).
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

    // Plural label from the authored "singular|plural" title (two dictionary
    // placeholders, resolved per locale). No "|" → unchanged for every quantity;
    // pluralization is never derived in code (appending "s" breaks most locales).
    licenseLabel(count) {
        const title = this.quantitySelectEl?.getAttribute('title') || 'License';
        const [singular, plural] = title.split('|').map((s) => s.trim());
        return Number(count) === 1 ? singular : plural || singular;
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

    // Cards sharing this card's row (same offsetTop, as syncHeights groups them);
    // stacked single-column cards land on different rows and stay independent.
    #rowCards() {
        const top = this.card.offsetTop;
        const cards = Array.from(
            this.getContainer()?.querySelectorAll(
                `merch-card[variant="${this.card.variant}"]`,
            ) ?? [],
        ).filter(
            (card) =>
                card.getBoundingClientRect().width > 2 &&
                card.offsetTop === top,
        );
        return cards.length ? cards : [this.card];
    }

    toggleExpanded = (e) => {
        e.preventDefault();
        // Cards on a row expand/collapse together (Figma). Set every row card to
        // the clicked card's new state so diverged rows converge.
        const expanded = !this.expanded;
        for (const card of this.#rowCards()) {
            const layout = card.variantLayout;
            if (!(layout instanceof Pro)) continue;
            layout.expanded = expanded;
            card._proExpanded = expanded;
            card.requestUpdate();
        }
    };

    #removeLicenseDocListener() {
        if (!this.#licenseDocListenerBound) return;
        document.removeEventListener(
            'mousedown',
            this.#licenseDocListenerBound,
        );
        this.#licenseDocListenerBound = null;
    }

    #currentLicenseIndex() {
        const idx = this.licenseOptions?.indexOf(this.currentLicenseValue);
        return idx > 0 ? idx : 0;
    }

    #openLicensePopover() {
        this.licenseOpen = true;
        // Open with the highlight on the selected option.
        this.licenseHighlightedIndex = this.#currentLicenseIndex();
        if (!this.#licenseDocListenerBound) {
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
        }
    }

    #closeLicensePopover() {
        this.licenseOpen = false;
        this.#removeLicenseDocListener();
    }

    toggleLicensePopover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.licenseOpen) {
            this.#closeLicensePopover();
        } else {
            this.#openLicensePopover();
        }
        this.card.requestUpdate();
    };

    // Select-only combobox keys (ARIA APG): arrows/Home/End move the
    // active-descendant highlight, Enter/Space commit, Escape closes, Tab commits
    // and lets focus advance. Focus stays on the trigger throughout.
    #handleLicenseKeydown = (e) => {
        const opts = this.licenseOptions;
        if (!opts?.length) return;
        const last = opts.length - 1;
        switch (e.key) {
            case ARROW_DOWN:
                e.preventDefault();
                if (this.licenseOpen) {
                    this.licenseHighlightedIndex =
                        (this.licenseHighlightedIndex + 1) % opts.length;
                } else {
                    this.#openLicensePopover();
                }
                break;
            case ARROW_UP:
                e.preventDefault();
                if (this.licenseOpen) {
                    this.licenseHighlightedIndex =
                        (this.licenseHighlightedIndex - 1 + opts.length) %
                        opts.length;
                } else {
                    this.#openLicensePopover();
                }
                break;
            case 'Home':
                if (!this.licenseOpen) return;
                e.preventDefault();
                this.licenseHighlightedIndex = 0;
                break;
            case 'End':
                if (!this.licenseOpen) return;
                e.preventDefault();
                this.licenseHighlightedIndex = last;
                break;
            case ENTER:
            case ' ':
                e.preventDefault();
                if (this.licenseOpen) {
                    this.selectLicenseQty(opts[this.licenseHighlightedIndex]);
                    return; // selectLicenseQty already requests an update
                }
                this.#openLicensePopover();
                break;
            case 'Escape':
                if (!this.licenseOpen) return;
                e.preventDefault();
                this.#closeLicensePopover();
                break;
            case TAB:
                // Commit the highlight; no preventDefault so focus advances.
                if (this.licenseOpen) {
                    this.selectLicenseQty(opts[this.licenseHighlightedIndex]);
                }
                return;
            default:
                return;
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
        const label = this.licenseLabel(Number(current));
        return html`
            <div class="license-select" ?data-open=${open}>
                <div
                    class="license-select-trigger"
                    role="combobox"
                    tabindex="0"
                    aria-expanded=${open ? 'true' : 'false'}
                    aria-controls="license-popover"
                    aria-labelledby="license-select-label"
                    aria-activedescendant=${open
                        ? `license-option-${this.licenseHighlightedIndex}`
                        : nothing}
                    @click=${this.toggleLicensePopover}
                    @keydown=${this.#handleLicenseKeydown}
                >
                    <span class="license-select-trigger-text">
                        <span class="license-select-value">${current}</span>
                        <span
                            class="license-select-label"
                            id="license-select-label"
                            >${label}</span
                        >
                    </span>
                    <span
                        class="license-select-chevron"
                        aria-hidden="true"
                    ></span>
                </div>
                <ul
                    id="license-popover"
                    class="license-select-popover"
                    role="listbox"
                    aria-labelledby="license-select-label"
                    aria-multiselectable="false"
                    tabindex="-1"
                    ?hidden=${!open}
                >
                    <li
                        class="license-select-popover-header"
                        aria-hidden="true"
                        @click=${this.toggleLicensePopover}
                    >
                        <span class="license-select-trigger-text">
                            <span class="license-select-value">${current}</span>
                            <span class="license-select-label">${label}</span>
                        </span>
                        <span
                            class="license-select-chevron"
                            aria-hidden="true"
                            style="transform: rotate(180deg);"
                        ></span>
                    </li>
                    ${opts.map(
                        (opt, index) => html`
                            <li
                                class="license-select-option ${index ===
                                this.licenseHighlightedIndex
                                    ? 'highlighted'
                                    : ''}${opt === current ? ' selected' : ''}"
                                id="license-option-${index}"
                                role="option"
                                aria-selected=${opt === current
                                    ? 'true'
                                    : 'false'}
                                @click=${() => this.selectLicenseQty(opt)}
                                @mouseenter=${() => {
                                    this.licenseHighlightedIndex = index;
                                    this.card.requestUpdate();
                                }}
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
                </div>
                <div class="pricing">
                    <div class="pricing-line">
                        <slot name="heading-m"></slot>
                        <slot name="per-unit-label"></slot>
                    </div>
                    <slot name="promo-text"></slot>
                </div>
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
                          <span class="whats-included-toggle-label">
                              ${this.whatsIncludedToggleLabel}
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
        :host([variant='pro']) {
            display: flex;
            flex-direction: column;
            background: var(
                --consonant-merch-card-pro-frame-bg,
                var(--consonant-merch-card-pro-bg-subtle, #f8f8f8)
            );
            border-radius: 16px;
            padding: 4px;
            box-sizing: border-box;
            overflow: hidden;
            position: relative;
            color: var(--consonant-merch-card-pro-frame-text, #000);
            --secure-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M9 9.2C9 8.64844 8.55156 8.2 8 8.2C7.44844 8.2 7 8.64844 7 9.2C7 9.52207 7.16289 9.7959 7.4 9.9789V10.6C7.4 10.9312 7.66875 11.2 8 11.2C8.33125 11.2 8.6 10.9312 8.6 10.6V9.9789C8.83711 9.7959 9 9.52207 9 9.2Z'/%3E%3Cpath d='M12 5.62031V5.2C12 2.99453 10.2055 1.2 8 1.2C5.79453 1.2 4 2.99453 4 5.2V5.62031C3.10274 5.72129 2.4 6.47637 2.4 7.4V12.6C2.4 13.5922 3.20782 14.4 4.2 14.4H11.8C12.7922 14.4 13.6 13.5922 13.6 12.6V7.4C13.6 6.47637 12.8973 5.72129 12 5.62031ZM8 2.4C9.54375 2.4 10.8 3.65625 10.8 5.2V5.6H5.2V5.2C5.2 3.65625 6.45625 2.4 8 2.4ZM12.4 12.6C12.4 12.9305 12.1305 13.2 11.8 13.2H4.2C3.86953 13.2 3.6 12.9305 3.6 12.6V7.4C3.6 7.06953 3.86953 6.8 4.2 6.8H11.8C12.1305 6.8 12.4 7.06953 12.4 7.4V12.6Z'/%3E%3C/svg%3E");
        }

        :host([variant='pro'][border-color='black']) {
            --consonant-merch-card-pro-frame-bg: #000;
            --consonant-merch-card-pro-frame-text: #fff;
            --consonant-merch-card-pro-divider-color: #ffffff29;
            --consonant-merch-card-pro-subtitle-color: #000;
        }

        :host([variant='pro']) .top-card {
            background: var(--consonant-merch-card-pro-bg-default, #fff);
            border-radius: 12px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            color: #000;
            /* Natural height (features-zone absorbs the slack). syncHeights
               publishes the row's max .top-card height here as min-height so
               shorter cards match; content-box, so the height maps straight. */
            flex: 0 0 auto;
            min-height: var(${unsafeCSS(TOP_CARD_HEIGHT_PROP)}, auto);
        }

        :host([variant='pro']) .mnemonic {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        :host([variant='pro']) ::slotted([slot='icons']) {
            width: 24px;
            height: 24px;
        }

        :host([variant='pro']) ::slotted([slot='subtitle']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 16px;
            line-height: 20px;
            letter-spacing: 0;
            color: var(--consonant-merch-card-pro-subtitle-color, #000000a3);
            flex: 1;
        }

        :host([variant='pro']) .name-description {
            display: flex;
            flex-direction: column;
            gap: 8px;
            /* Grow so price downward sticks to the bottom of the white card. */
            flex: 1 1 auto;
        }

        :host([variant='pro']) ::slotted([slot='heading-xs']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 24px;
            line-height: 24px;
            letter-spacing: -0.48px;
            color: #000;
        }

        :host([variant='pro']) ::slotted([slot='body-xs']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: #000;
        }

        :host([variant='pro']) .pricing {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        :host([variant='pro']) ::slotted([slot='heading-m']) {
            margin: 0;
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: #000;
        }

        :host([variant='pro']) ::slotted([slot='promo-text']) {
            margin: 0;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: #000000a3;
        }

        :host([variant='pro']) footer {
            display: flex;
            gap: 8px;
            padding: 0;
            margin: 0;
            background: transparent;
            min-height: auto;
        }

        :host([variant='pro']) footer ::slotted([slot='footer']) {
            display: flex;
            gap: 8px;
            flex: 1;
        }

        :host([variant='pro']) .secure-transaction-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
            color: #000000a3;
            padding: 0;
            margin: 0;
            align-self: flex-start;
            flex: 0 0 auto;
            white-space: normal;
        }

        :host([variant='pro']) .secure-transaction-label::before {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            background-image: var(--secure-icon);
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
        }

        :host([variant='pro']) .features-zone {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            /* Grow to fill remaining height so card bottoms align across a row. */
            flex: 1 1 auto;
            color: var(--consonant-merch-card-pro-frame-text, #000);
        }

        :host([variant='pro']) .features-zone[hidden] {
            display: none;
        }

        :host([variant='pro']) ::slotted([slot='whats-included']) {
            color: inherit;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        :host([variant='pro']) .whats-included-toggle {
            all: unset;
            display: flex;
            align-items: center;
            padding: 24px;
            cursor: pointer;
            color: var(--consonant-merch-card-pro-frame-text, #000);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-weight: 700;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0.14px;
        }

        /* Expanded state: no bottom padding — features-zone provides spacing */
        :host([variant='pro']) .whats-included-toggle[aria-expanded='true'] {
            padding-bottom: 0;
        }

        :host([variant='pro']) .whats-included-toggle-label {
            flex: 1 0 0;
        }

        :host([variant='pro']) .whats-included-toggle:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
            border-radius: 8px;
        }

        :host([variant='pro']) .whats-included-toggle-chevron {
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

        :host([variant='pro'])
            .whats-included-toggle[aria-expanded='true']
            .whats-included-toggle-chevron {
            transform: rotate(180deg);
        }

        :host([variant='pro']) .pricing-line {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 0;
        }

        :host([variant='pro']) ::slotted([slot='per-unit-label']) {
            font-family: 'Adobe Clean Display', 'adobe-clean-display',
                sans-serif;
            font-weight: 900;
            font-size: 18px;
            line-height: 21px;
            letter-spacing: -0.48px;
            color: #000;
            margin-inline-start: 4px;
        }

        :host([variant='pro']) .license-zone {
            display: flex;
            flex-direction: column;
            background: var(--consonant-merch-card-pro-bg-subtle, #f8f8f8);
            border-radius: 8px;
            overflow: visible;
        }

        :host([variant='pro']) .license-select {
            position: relative;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
        }

        :host([variant='pro']) .license-select-trigger {
            all: unset;
            box-sizing: border-box;
            width: 100%;
            height: 40px;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--consonant-merch-card-pro-bg-default, #fff);
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 8px;
            cursor: pointer;
            color: #000;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            letter-spacing: 0;
        }

        :host([variant='pro']) .license-select-trigger:focus-visible {
            outline: 2px solid #1473e6;
            outline-offset: 1px;
        }

        :host([variant='pro']) .license-select-trigger-text {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        :host([variant='pro']) .license-select-value {
            font-weight: 700;
            color: #000;
        }

        :host([variant='pro']) .license-select-label {
            font-weight: 700;
            color: rgba(0, 0, 0, 0.64);
        }

        :host([variant='pro']) .license-select-chevron {
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

        :host([variant='pro'])
            .license-select-trigger[aria-expanded='true']
            .license-select-chevron {
            transform: rotate(180deg);
        }

        :host([variant='pro']) .license-select-popover {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            margin: 0;
            padding: 0;
            list-style: none;
            background: var(--consonant-merch-card-pro-bg-default, #fff);
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

        :host([variant='pro']) .license-select-popover[hidden] {
            display: none;
        }

        /* Mirror the collapsed trigger so open/close is seamless: 39px (trigger
           40px − the popover's 1px top border) with the trigger's 12px padding. */
        :host([variant='pro']) .license-select-popover-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 39px;
            box-sizing: border-box;
            padding: 12px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            cursor: pointer;
            background: var(--consonant-merch-card-pro-bg-default, #fff);
        }

        :host([variant='pro']) .license-select-option {
            padding: 16px 12px;
            cursor: pointer;
            color: #000;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 14px;
            line-height: 18px;
            font-weight: 700;
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        :host([variant='pro']) .license-select-option:last-child {
            border-bottom: none;
        }

        :host([variant='pro']) .license-select-option:hover,
        :host([variant='pro']) .license-select-option.highlighted,
        :host([variant='pro']) .license-select-option.selected {
            background: var(--consonant-merch-card-pro-bg-subtle, #f8f8f8);
        }

        /* Focus stays on the trigger, so the highlighted option needs its own
           visible ring (WCAG 2.4.7). */
        :host([variant='pro']) .license-select-option.highlighted {
            outline: 2px solid #1473e6;
            outline-offset: -2px;
        }

        :host([variant='pro']) .callout {
            padding: 8px 12px 12px 12px;
            color: #000;
            font-family: 'Adobe Clean', adobe-clean, sans-serif;
            font-size: 12px;
            line-height: 16px;
            letter-spacing: 0.24px;
            font-weight: 700;
            text-align: start;
        }

        :host([variant='pro']) ::slotted([slot='callout-content']) {
            margin: 0;
        }

        :host([variant='pro']) .add-on {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 16px 12px;
            /* Gradient border: white fill on padding-box, gradient on border-box
               so only the 1px border shows it. */
            background:
                linear-gradient(
                        var(--consonant-merch-card-pro-bg-default, #fff),
                        var(--consonant-merch-card-pro-bg-default, #fff)
                    )
                    padding-box,
                linear-gradient(45deg, #8d88f2 0%, #8d88f2 48.8%, #eb1000 100%)
                    border-box;
            border: 1px solid transparent;
            border-radius: 8px;
            box-sizing: border-box;
        }

        :host([variant='pro']) .add-on::after {
            content: '';
            width: 16px;
            height: 16px;
            flex: 0 0 auto;
            /* Vertical red→purple sparkle (red on top, per the flipped asset). */
            background: linear-gradient(180deg, #eb1000 0%, #8d88f2 100%);
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
            -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7.498 15.61C6.369 11.154 4.842 9.627 .39 8.502c-.52-.133-.52-.871 0-1.004C4.846 6.37 6.373 4.842 7.498 .39c.133-.52.871-.52 1.004 0C9.63 4.846 11.158 6.373 15.61 7.498c.52.133.52.871 0 1.004C11.154 9.63 9.627 11.158 8.502 15.61c-.133.52-.871.52-1.004 0Z'/%3E%3C/svg%3E")
                center / contain no-repeat;
        }

        /* C2 desktop breakpoint: toggle disappears, features-zone is always visible inline */
        @media (min-width: 1280px) {
            :host([variant='pro']) .whats-included-toggle {
                display: none;
            }
            :host([variant='pro']) .features-zone[hidden] {
                display: flex;
            }
        }
    `;
}
