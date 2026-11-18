import { VariantLayout } from './variant-layout';
import { html, on } from '../base-element.js';
import { CSS, SHADOW_CSS } from './pro.css.js';
import { ARROW_DOWN, ARROW_UP, ENTER, TAB } from '../focus.js';
import {
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_TYPE_RESOLVED,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
    PRO_TOP_CARD_HEIGHT_PROP,
    PRO_MNEMONIC_HEIGHT_PROP,
    PRO_NAME_DESCRIPTION_HEIGHT_PROP,
} from '../constants.js';
import { createMasElement, Log } from '../commerce.js';

const VARIANT = 'pro';
const log = Log.module('merch-card/pro');
// Match these blocks across a row so the price lands at the same height on
// every card, the way Figma lays it out.
const SYNCED_BANDS = [
    { prop: PRO_MNEMONIC_HEIGHT_PROP, selector: '.mnemonic' },
    { prop: PRO_NAME_DESCRIPTION_HEIGHT_PROP, selector: '.name-description' },
];
// Reserve the struck price's row so cards without one keep the same price
// offset. Published per row, so a wrapped second row doesn't inherit it.
const STRIKE_RESERVE_PROP = `--consonant-merch-card-${VARIANT}-strike-reserve`;
const STRIKE_SELECTOR =
    '[slot="heading-m"] :is(.price-strikethrough, .price-promo-strikethrough, [data-template="strikethrough"])';
const SYNC_MIN_WIDTH = '(min-width: 768px)';
// Both forms `replace` can leave behind: the bare key (key missing) or the raw token (no dictionary).
const UNRESOLVED_TOGGLE_LABELS = [
    'see-whats-included',
    '{{see-whats-included}}',
];

// A hidden CTA has no box, so only visible ones count as wrapped.
const hasWrappedCtas = (card) =>
    new Set(
        [...card.querySelectorAll('[slot="footer"] a, [slot="footer"] button')]
            .filter((cta) => cta.getClientRects().length)
            .map((cta) => Math.round(cta.getBoundingClientRect().top)),
    ).size > 1;

export const PRO_AEM_FRAGMENT_MAPPING = {
    cardName: { attribute: 'name' },
    subtitle: { tag: 'p', slot: 'subtitle' },
    title: { tag: 'h3', slot: 'heading-xs' },
    description: { tag: 'div', slot: 'body-xs' },
    mnemonics: { size: 's' },
    size: ['wide', 'edu'],
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
    eduDisclaimer: { tag: 'div', slot: 'edu-disclaimer' },
    backgroundColor: {
        attribute: 'background-color',
        editorLabel: 'Theme',
        specialValues: { Light: 'light', Dark: 'dark' },
    },
    borderColor: {
        attribute: 'border-color',
        specialValues: { Black: 'black' },
        // editor: only Default + Black, and disabled when Theme = Dark
        hideTransparent: true,
        disableWhenBackgroundColor: 'dark',
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
    #onPriceResolved = () => {
        this.adjustLegal();
        this.requestReflowCheck();
    };
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
    // renders the plan type line). Same pattern as plans/plans-v2. An authored
    // Short Description is rendered by the template itself as the plan type,
    // whatever the setting, so every (re-)render of the legal price paints it in
    // the same pass, never the derived WCS wording (MWPW-214359).
    priceOptionsProvider(element, options) {
        if (element.dataset.template !== TEMPLATE_PRICE_LEGAL) return;
        const label = this.customPlanTypeLabel;
        if (label && element.closest('[slot="heading-m"]')) {
            options.displayPlanType = true;
            options.customPlanTypeLabel = label;
            return;
        }
        options.displayPlanType = this.card?.settings?.displayPlanType ?? false;
    }

    // The authored Short Description. Read [slot="legal-text"] in place (never
    // detached): the shadow has no matching slot so it won't render, and
    // merch-card swaps in a fresh layout per render.
    get customPlanTypeLabel() {
        const source = this.card?.querySelector('[slot="legal-text"]');
        if (!source?.textContent?.trim()) return '';
        return source.innerHTML.trim();
    }

    // Creates a legal-template sibling so tax/plan-type render off the main price.
    async adjustLegal() {
        if (this.legalAdjusted) return;
        try {
            await this.card.updateComplete;
            await customElements.whenDefined('inline-price');
            const headingPrice = this.mainPrice;
            if (!headingPrice) return;
            await headingPrice.onceSettled();
            // merch-card may have swapped in a fresh layout meanwhile; that one
            // owns the legal price.
            if (
                !headingPrice.options ||
                this.legalAdjusted ||
                this.card.variantLayout !== this ||
                this.mainPrice !== headingPrice
            )
                return;
            // Use the registered constructor: importing inline-price here can register it before Safari's polyfill.
            const legal = createMasElement(customElements.get('inline-price'));
            for (const { name, value } of headingPrice.attributes) {
                legal.setAttribute(name, value);
            }
            legal.innerHTML = headingPrice.innerHTML;
            // Per-unit stays on the pricing line (unlike plans); only tax and
            // plan type move to the legal clone, which drops per-unit.
            if (headingPrice.options.displayTax)
                headingPrice.dataset.displayTax = 'false';
            if (headingPrice.options.displayPlanType)
                headingPrice.dataset.displayPlanType = 'false';
            legal.setAttribute('data-template', 'legal');
            legal.dataset.displayPerUnit = 'false';
            // The dataset outranks priceOptionsProvider; a plan type flag cloned
            // from the main price must not hide the authored Short Description.
            if (this.customPlanTypeLabel) delete legal.dataset.displayPlanType;
            headingPrice.parentNode.insertBefore(
                legal,
                headingPrice.nextSibling,
            );
            this.legalAdjusted = true;
            await legal.onceSettled();
        } catch (error) {
            log.error(`Failed to initialize legal price: ${error.message}`, {
                cardId: this.card.id,
            });
        }
    }

    get hasWhatsIncluded() {
        return !!this.card.querySelector('[slot="whats-included"]');
    }

    get hasEduDisclaimer() {
        return !this.card?.settings?.hideEduDisclaimer;
    }

    get whatsIncludedToggleLabel() {
        const authored = this.card
            .querySelector('[slot="whats-included"] .whats-included-label')
            ?.textContent.trim();
        const localized = this.card.placeholders?.whatsIncludedToggleLabel;
        return (
            authored ||
            (!UNRESOLVED_TOGGLE_LABELS.includes(localized) && localized) ||
            ''
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

    // The Grey add-on style rides the same authored `background` attribute
    // the "Addon Background" editor control already persists on the slotted
    // <merch-addon> (see merch-card-editor.js #renderAddonStylePicker) — the
    // frame lives in this shadow root, so it can't be reached by the
    // light-DOM attribute selector pro.css.js uses for the checkbox alone.
    get addonBackground() {
        return (
            this.card
                .querySelector('[slot="addon"]')
                ?.getAttribute('background') ?? null
        );
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
        this.adjustEduWhatsIncluded();
        await this.adjustAddon();
        if (!this.legalAdjusted) {
            await this.adjustLegal();
        }
        await super.postCardUpdateHook();
        // Line the white .top-card sections up across a row (desktop only).
        if (window.matchMedia('(min-width: 768px)').matches) this.syncHeights();
    }

    // pro/edu only: the authored whats-included leading paragraph is the panel
    // title, styled big but promotional copy rather than a heading. Restyle it
    // and inject the server-resolved (already localized) "What's included"
    // heading + disclaimer strings published on the card's `placeholders` map
    // (settings.js -> replace transformer -> here). Idempotent via the
    // `.whats-included-title` guard so re-renders don't double-apply.
    adjustEduWhatsIncluded() {
        if (this.card.size !== 'edu') return;
        const slot = this.card.querySelector('[slot="whats-included"]');
        if (!slot || slot.querySelector('.whats-included-title')) return;
        const authoredTitle = slot.querySelector('.whats-included-label');
        if (!authoredTitle) return;
        const title = document.createElement('p');
        title.className = 'whats-included-title';
        title.innerHTML = authoredTitle.innerHTML;
        authoredTitle.replaceWith(title);
        const { whatsIncludedLabel, eduDisclaimer } =
            this.card.placeholders ?? {};
        // A blank label stays a paragraph so the panel never gets an empty
        // heading.
        const label = document.createElement(
            whatsIncludedLabel?.trim() ? 'h4' : 'p',
        );
        label.className = 'whats-included-label';
        label.textContent = whatsIncludedLabel ?? '';
        title.after(label);
        // :scope keeps page wrappers (Milo's div.section) from matching the
        // label above.
        slot.querySelectorAll(':scope .section h4').forEach((h4) => {
            const row = document.createElement('p');
            row.innerHTML = h4.innerHTML;
            h4.replaceWith(row);
        });
        if (eduDisclaimer) {
            const disclaimer = document.createElement('div');
            disclaimer.className = 'whats-included-disclaimer';
            disclaimer.innerHTML = eduDisclaimer;
            slot.append(disclaimer);
        }
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
        // Opting out after a sync has already run must undo it, not just stop.
        if (this.card.heightSync === false) {
            this.clearSyncedHeights(this.card);
            return;
        }
        await this.waitForContentFonts();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const container = this.getContainer();
        if (!container || this.card.getBoundingClientRect().width <= 2) return;
        const variant = this.card.variant;
        const prop = PRO_TOP_CARD_HEIGHT_PROP;
        const cards = [
            ...container.querySelectorAll(`merch-card[variant="${variant}"]`),
        ].filter(
            (card) =>
                card.getBoundingClientRect().width > 2 &&
                card.variantLayout?.card?.heightSync !== false,
        );
        // Stacked cards are each their own row, so there's nothing to line up,
        // and a leftover desktop reserve would leave a gap above the price.
        if (!window.matchMedia(SYNC_MIN_WIDTH).matches) {
            cards.forEach((card) => this.clearSyncedHeights(card));
            return;
        }
        const rows = new Map();
        for (const card of cards) {
            const row = rows.get(card.offsetTop) ?? [];
            row.push(card);
            rows.set(card.offsetTop, row);
        }
        const maxHeight = (row, getElement) =>
            row.reduce((max, card) => {
                const el = getElement(card);
                return el
                    ? Math.max(max, parseInt(getComputedStyle(el).height) || 0)
                    : max;
            }, 0);
        for (const row of rows.values()) {
            row.forEach((card) => this.clearSyncedHeights(card));
            // A lone card has nothing to match, so it keeps its natural height.
            if (row.length < 2) continue;
            // A wrapped CTA stacks every card in the row so the buttons line up.
            const stack = row.some(hasWrappedCtas);
            row.forEach((card) => card.toggleAttribute('stacked', stack));
            // Reserve first — it grows the price block everything below measures.
            // A per-card shortfall covers short, wrapped and missing strikes alike.
            const strikes = row.map((card) =>
                card.querySelector(STRIKE_SELECTOR)
                    ? parseInt(
                          getComputedStyle(card.querySelector(STRIKE_SELECTOR))
                              .height,
                      ) || 0
                    : 0,
            );
            const tallestStrike = Math.max(0, ...strikes);
            if (tallestStrike > 0)
                row.forEach((card, i) => {
                    const shortfall = tallestStrike - strikes[i];
                    if (shortfall > 0)
                        card.style.setProperty(
                            STRIKE_RESERVE_PROP,
                            `${shortfall}px`,
                        );
                });
            for (const band of SYNCED_BANDS) {
                const max = maxHeight(row, (card) =>
                    card.shadowRoot?.querySelector(band.selector),
                );
                if (max > 0)
                    row.forEach((card) =>
                        card.style.setProperty(band.prop, `${max}px`),
                    );
            }
            const max = maxHeight(row, (card) =>
                card.shadowRoot?.querySelector('.top-card'),
            );
            if (max > 0)
                row.forEach((card) => card.style.setProperty(prop, `${max}px`));
        }
    }

    clearSyncedHeights(card) {
        card.removeAttribute('stacked');
        card.style.removeProperty(PRO_TOP_CARD_HEIGHT_PROP);
        card.style.removeProperty(STRIKE_RESERVE_PROP);
        SYNCED_BANDS.forEach((band) => card.style.removeProperty(band.prop));
    }

    // Re-sync on a real reflow, keyed so our own writes can't loop the observer.
    // A late price resolution adds the struck and legal rows after the first pass.
    resyncOnReflow() {
        const width = this.boxOf(this.card).width;
        if (width <= 2) return;
        const height = (selector, root = this.card) =>
            this.heightOf(root?.querySelector(selector));
        // Measure inside the price block, never [slot="heading-m"] itself: the
        // reserve lands on its padding, so keying on that would feed back.
        const key = [
            Math.round(width),
            height('[slot="body-xs"]'),
            height(STRIKE_SELECTOR),
            height('[slot="heading-m"] span[is="inline-price"]'),
            height(
                '[slot="heading-m"] :is(.price-legal, [data-template="legal"])',
            ),
            height('.license-zone', this.card.shadowRoot),
            height('.add-on', this.card.shadowRoot),
        ].join(':');
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
        // A promo can swap the price without resizing either observed box, so a
        // price resolution (it bubbles here) asks the observer for a fresh report.
        this.card.addEventListener(EVENT_TYPE_RESOLVED, this.#onPriceResolved);
        this.observeReflow(
            this.card,
            this.card.querySelector('[slot="body-xs"]'),
        );
    }

    disconnectedCallbackHook() {
        this.card?.removeEventListener(
            EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
            this.updatePriceQuantity,
        );
        this.card?.removeEventListener(
            EVENT_TYPE_RESOLVED,
            this.#onPriceResolved,
        );
        this.#removeLicenseDocListener();
        this.disconnectReflow();
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
        // A negative step counts away from max forever and hangs the page.
        // merch-quantity-select shows nothing below step 1, so do the same.
        if (Number.isNaN(min) || Number.isNaN(max) || max < min || step < 1)
            return null;
        const opts = [];
        // min <= max and step >= 1, so this always yields at least one option.
        for (let v = min; v <= max; v += step) opts.push(String(v));
        return opts;
    }

    // Plural label from the authored "singular|plural" title (two dictionary
    // placeholders, resolved per locale). No "|" → unchanged for every quantity;
    // pluralization is never derived in code (appending "s" breaks most locales).
    licenseLabel(count) {
        const title =
            this.quantitySelectEl?.getAttribute('title') ||
            this.card.placeholders?.licenseLabel ||
            '';
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
        // The card title tells each card's dropdown apart. The title lives in
        // light DOM, so a hidden copy in this shadow root is what gets referenced.
        const product = this.card.title;
        const labelledBy = product
            ? 'license-select-product license-select-label'
            : 'license-select-label';
        return html`
            <div class="license-select" ${open ? 'data-open' : ''}>
                ${product
                    ? html`<span id="license-select-product" hidden
                          >${product}</span
                      >`
                    : ''}
                <div
                    class="license-select-trigger"
                    role="combobox"
                    tabindex="0"
                    aria-expanded="${open ? 'true' : 'false'}"
                    aria-controls="license-popover"
                    aria-labelledby="${labelledBy}"
                    ${open
                        ? html`aria-activedescendant="license-option-${this
                              .licenseHighlightedIndex}"`
                        : ''}
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
                    aria-labelledby="${labelledBy}"
                    aria-multiselectable="false"
                    tabindex="-1"
                    ${open ? '' : 'hidden'}
                >
                    <li
                        class="license-select-popover-header"
                        aria-hidden="true"
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
                                aria-selected="${opt === current
                                    ? 'true'
                                    : 'false'}"
                            >
                                ${opt}
                            </li>
                        `,
                    )}
                </ul>
            </div>
        `;
    }

    bindEvents(root) {
        const trigger = root.querySelector('.license-select-trigger');
        on(trigger, 'click', this.toggleLicensePopover);
        on(trigger, 'keydown', this.#handleLicenseKeydown);
        on(
            root.querySelector('.license-select-popover-header'),
            'click',
            this.toggleLicensePopover,
        );
        const options = root.querySelectorAll('.license-select-option');
        options.forEach((option, index) => {
            const value = this.licenseOptions[index];
            on(option, 'click', () => this.selectLicenseQty(value));
            on(option, 'mouseenter', () => {
                this.licenseHighlightedIndex = index;
                this.card.requestUpdate();
            });
        });
        on(
            root.querySelector('.whats-included-toggle'),
            'click',
            this.toggleExpanded,
        );
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
                              : ''}
                      </div>`
                    : ''}
                ${this.hasAddOn
                    ? html`<div
                          class="add-on"
                          ${this.addonBackground === 'grey'
                              ? 'data-addon-grey'
                              : ''}
                      >
                          <slot name="addon"></slot>
                      </div>`
                    : ''}
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
                          aria-expanded="${expanded ? 'true' : 'false'}"
                          aria-controls="features-zone"
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
                          ${expanded ? '' : 'hidden'}
                      >
                          <slot name="whats-included"></slot>
                      </div>
                  `
                : ''}
            ${this.hasEduDisclaimer
                ? html`<div class="edu-disclaimer">
                      <slot name="edu-disclaimer"></slot>
                  </div>`
                : ''}
            <slot></slot>
        `;
    }

    static variantStyle = SHADOW_CSS;
}
