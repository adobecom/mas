import {
    EVENT_AEM_ERROR,
    EVENT_AEM_LOAD,
    EVENT_MAS_READY,
    FF_DEFAULTS,
    MERCH_CARD_LOAD_TIMEOUT,
    TEMPLATE_PRICE_LEGAL,
    TRIAL_ANALYTICS_IDS,
} from './constants.js';
import {
    getService,
    hydrateHeadlessCta,
    injectStyle,
    toCheckoutLink,
} from './utils.js';
import { hostOsi } from './plan-type-text.js';
import {
    applyContextPromotionCode,
    applyDisplayAnnualDefault,
    applyHideStPriceLabels,
    mergePriceLiterals,
    registerContextOptionsProviders,
    resolveContextPromotionCode,
} from './mas-context.js';
import {
    buildPictureInnerMarkup,
    createPicture,
    escapeAttribute,
    extractBackgroundUrl,
    sanitizeAssetUrl,
} from './image-markup.js';
import { css } from './css.js';

const MAS_FIELD_TAG = 'mas-field';
const CONTEXT_ATTRIBUTES = [
    'fragment-id',
    'variation-id',
    'mask-id',
    'data-promotion-project',
    'data-promotion-variation-project',
];
const CONTENT_SELECTOR = ':scope > [data-role="mas-field-content"]';
const COMMERCE_SELECTOR =
    'a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]';
const BUY_NOW_SELECTOR = 'a[data-analytics-id="buy-now"]';
const IMAGE_FIELDS = ['image', 'backgroundImage', 'backgrounds'];
const CHECKOUT_STYLE_PATTERN =
    /\b(accent|primary|secondary)\b(-\b(outline|link)\b)?/g;
const BUTTON_SIZE = /^button-(s|m|l|xl|xxl)$/;
const TOOLTIP_PLACEMENTS = ['top', 'bottom', 'left', 'right'];
const INFO_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>';

const MAS_FIELD_STYLES = css`
    mas-field {
        display: contents;
    }

    /* An :empty span still counts as a flex gap item under display:contents; hide it. */
    mas-field > [data-role='mas-field-content']:empty {
        display: none;
    }

    /* A headless mas-field is often authored with CTA classes (e.g. feds-cta) directly
   on the host. Those classes can carry their own display value at the same
   specificity as the rule above, which can beat display:contents and leave an
   empty, still-styled CTA box visible when the field resolves to nothing (e.g. a
   trial CTA stripped by hideTrialCTAs). #render sets [hidden] in that case;
   force it to win regardless of what other classes are on the host. */
    mas-field[hidden] {
        display: none !important;
    }

    mas-field div[slot='footer'] {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        align-items: center;
    }

    mas-field span.placeholder-resolved[data-template='priceStrikethrough'],
    mas-field span.placeholder-resolved[data-template='strikethrough'],
    mas-field span.price.price-strikethrough,
    mas-field span.price.price-promo-strikethrough {
        text-decoration: line-through;
        color: var(--merch-color-inline-price-strikethrough);
    }

    /* Render the RTE tooltip node (serialized as a bare .icon-button span) as an info
   glyph with a tooltip when a placeholder is consumed through mas-field outside a
   merch-card (e.g. a headless DA page). Ports Milo's tooltip model (libs/features/
   icons/icons.css) so it looks/behaves like production: a placement class
   (top|bottom|left|right) drives the popover side and decorateTooltips re-picks the
   side on hover/focus so it never clips. Kept self-contained because mas-field is a
   bundled component and Milo does not decorate mas-field content. */
    mas-field .icon-button {
        position: relative;
        text-decoration: none;
        border-bottom: none;
        margin-inline-start: 7px;
    }

    mas-field .icon-button svg {
        height: 1em;
        width: auto;
        position: relative;
        top: 0.1em;
    }

    /* Default (right) popover. */
    mas-field .icon-button::before {
        content: attr(data-tooltip);
        position: absolute;
        top: 50%;
        left: 100%;
        transform: translateY(-50%);
        margin-left: 7px;
        width: max-content;
        max-width: 140px;
        padding: 10px;
        border-radius: 5px;
        background: #0469e3;
        color: #fff;
        text-align: left;
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        z-index: 10;
        display: none;
    }

    mas-field .icon-button::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 100%;
        margin-left: -8px;
        transform: translateY(-50%);
        border: 8px solid transparent;
        border-right-color: #0469e3;
        z-index: 10;
        display: none;
    }

    mas-field .icon-button.left::before {
        left: initial;
        margin: initial;
        right: 100%;
        margin-right: 8px;
    }

    mas-field .icon-button.left::after {
        left: initial;
        right: 100%;
        margin-left: 0;
        margin-right: -8px;
        border-right-color: transparent;
        border-left-color: #0469e3;
    }

    mas-field .icon-button.top::before {
        left: calc(50% - 11px);
        right: initial;
        top: -6px;
        margin: 0 0 15px 7px;
        transform: translateX(-50%) translateY(-100%);
    }

    mas-field .icon-button.top::after {
        left: 50%;
        right: initial;
        top: 2px;
        margin-left: -8px;
        transform: translateY(-50%);
        border-right-color: transparent;
        border-top-color: #0469e3;
    }

    mas-field .icon-button.bottom::before {
        left: calc(50% - 11px);
        right: initial;
        top: 100%;
        margin: 9px 0 0 7px;
        transform: translateX(-50%);
    }

    mas-field .icon-button.bottom::after {
        left: 50%;
        right: initial;
        top: calc(100% + 1px);
        margin-left: -8px;
        transform: translateY(-50%);
        border-right-color: transparent;
        border-bottom-color: #0469e3;
    }

    mas-field .icon-button:hover::before,
    mas-field .icon-button:focus::before,
    mas-field .icon-button:active::before,
    mas-field .icon-button:hover::after,
    mas-field .icon-button:focus::after,
    mas-field .icon-button:active::after {
        display: block;
    }

    mas-field .icon-button.hide-tooltip::before,
    mas-field .icon-button.hide-tooltip::after {
        display: none;
    }

    @media (max-width: 600px) {
        mas-field .icon-button::before {
            max-width: 180px;
        }
    }
`;

const ANNUAL_PRICE_STYLES = css`
    .table .row-heading .col-heading .pricing:has(.price-annual-prefix) {
        display: flex;
        flex-direction: column;
    }

    .table
        .row-heading
        .col-heading
        .pricing
        .price-annual-prefix
        + .price-annual,
    .table .row-heading .col-heading .pricing .price-annual-prefix,
    .table .row-heading .col-heading .pricing .price-annual-suffix {
        font-size: var(--type-heading-xxs-size);
        line-height: var(--type-heading-xxs-size);
        font-weight: 400;
        position: relative;
    }

    .pricing.has-pricing-after .price-annual-prefix {
        display: none;
    }

    .pricing.has-pricing-after:has(.price-annual-prefix)
        .price:not(.price-annual) {
        display: block;
    }

    .pricing.has-pricing-after .price-annual-prefix + .price-annual::before {
        content: '(';
    }
`;

// Styles Milo table prices too, not only mas-field ones: injected on load.
injectStyle('mas-annual-price', ANNUAL_PRICE_STYLES);

/** Parses markup with a <template>, so nothing loads or upgrades until inserted. */
function parseTemplate(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template;
}

const toList = (value) => (Array.isArray(value) ? value : [value]);

/** Unwraps `{ value }` field values. */
const normalizeFieldValue = (value) => value?.value ?? value;

/** Strips the <p> wrapper from single-paragraph AEM rich text so it renders inline. */
function unwrapSingleParagraph(html) {
    const inner = html?.trim?.().match(/^<p>([\s\S]*)<\/p>$/)?.[1];
    return inner === undefined || inner.includes('<p>') ? html : inner;
}

/** Parses "ctas[1]" → { name: "ctas", index: 1 },
 *  "ctas[abc123xyz]" → { name: "ctas", index: "abc123xyz" },
 *  "customFields[My Label]" → { name: "customFields", index: "My Label" },
 *  or plain names → { name, index: null }. */
function parseField(field) {
    const [, name = field, key = null] = field.match(/^(.+)\[(.+)\]$/) ?? [];
    return { name, index: /^\d+$/.test(key) ? Number(key) : key };
}

/**
 * Reduces the template to one anchor (1-based position, or data-key) without
 * reordering the field. A page-owned CTA loses its presentation classes;
 * otherwise the strong/em wrapping the anchor is kept around it.
 * @returns {HTMLTemplateElement|null}
 */
function extractIndexedAnchor(template, index, pageOwnsCta) {
    const { content } = template;
    const anchor =
        content.querySelectorAll('a')[index - 1] ??
        content.querySelector(`a[data-key="${index}"]`);
    if (!anchor) return null;
    let node = anchor;
    if (pageOwnsCta) {
        anchor.removeAttribute('class');
    } else {
        for (
            let parent = anchor.parentElement;
            parent?.matches('strong, em');
            parent = parent.parentElement
        ) {
            const wrapper = content.ownerDocument.createElement(
                parent.localName,
            );
            wrapper.append(node);
            node = wrapper;
        }
    }
    content.replaceChildren(node);
    return template;
}

/**
 * Drops trial CTAs (by analytics id) from already-resolved CTA markup when the
 * fragment's hideTrialCTAs setting is on. merch-card applies this in its
 * hydration path, but compare-plans tables render CTAs through mas-field
 * instead, so the setting would otherwise have no effect there.
 *
 * This matches only the static TRIAL_ANALYTICS_IDS allowlist. merch-card also
 * removes CTAs whose resolved WCS offerType is TRIAL (hydrate.js), a runtime
 * check mas-field does not replicate, so a trial CTA carrying an unlisted
 * analytics id still renders here.
 *
 * Runs AFTER an indexed ref has been resolved, never before: filtering the
 * anchor list first would renumber it, and a positional ref such as ctas[4]
 * would then silently resolve to a different CTA.
 *
 * A trial CTA carrying data-replaced-osi becomes the buy-now CTA unless one
 * exists: in the field, or for an indexed ref, in a neighbour ctas mas-field
 * (waited for up to MERCH_CARD_LOAD_TIMEOUT, after which nothing is stripped).
 * Mutates the template content and returns its markup.
 */
export async function stripTrialCtas(template, indexed, self) {
    const { content } = template;
    const trials = [...content.querySelectorAll('a')].filter((anchor) =>
        TRIAL_ANALYTICS_IDS.has(anchor.dataset.analyticsId),
    );
    if (!trials.length) return template.innerHTML;

    let buyNowCta = content.querySelector(BUY_NOW_SELECTOR);
    if (indexed && !buyNowCta) {
        const field = self.getAttribute('field');
        const { parentElement } = self;
        const scope =
            parentElement.querySelectorAll(MAS_FIELD_TAG).length > 1
                ? parentElement
                : parentElement.parentElement;
        const neighbours = [
            ...scope.querySelectorAll('mas-field[field^="ctas"]'),
        ].filter((masField) => masField.getAttribute('field') !== field);
        let timeoutId;
        const ready = await Promise.race([
            Promise.all(neighbours.map((masField) => masField.checkReady())),
            new Promise((resolve) => {
                timeoutId = setTimeout(resolve, MERCH_CARD_LOAD_TIMEOUT);
            }),
        ]);
        clearTimeout(timeoutId);
        if (!ready) return template.innerHTML;
        if (ready.includes(true)) {
            for (const masField of neighbours) {
                buyNowCta ??= masField.querySelector(BUY_NOW_SELECTOR);
            }
        }
    }

    let trialCtaSwapped = false;
    const buyNowText = self.aemFragment?.data?.priceLiterals?.buyNow;
    for (const anchor of trials) {
        if (!anchor.hasAttribute('data-replaced-osi')) {
            anchor.remove();
            continue;
        }
        trialCtaSwapped = true;
        if (buyNowCta || !buyNowText || buyNowText === 'buy-now') {
            anchor.remove();
            continue;
        }
        anchor.removeAttribute('aria-label');
        anchor.dataset.analyticsId = 'buy-now';
        if (anchor.hasAttribute('data-modal')) anchor.dataset.modal = 'crm';
        anchor.textContent = buyNowText;
    }

    const buyNow = content.querySelector(BUY_NOW_SELECTOR) ?? buyNowCta;
    if (buyNow && trialCtaSwapped) {
        buyNow.classList.remove(
            ...(buyNow.className.match(CHECKOUT_STYLE_PATTERN) ?? []),
        );
        buyNow.classList.add('button', 'con-button', 'blue');
    }
    return template.innerHTML;
}

/**
 * Applies the field's promo code: the element's own first, so a CTA or price
 * unwrapped out of its <mas-field> still resolves, else the gated code of the
 * mas-field still wrapping it. Never overrides an earlier provider's code.
 */
function applyFieldPromotionCode(element, masField, options) {
    applyContextPromotionCode(
        masField,
        options,
        element.dataset.promotionCode ??
            (masField && resolveContextPromotionCode(masField)),
    );
}

/**
 * Opts headless mas-field-hosted inline-prices into FF_DEFAULTS so they
 * resolve displayTax / displayPerUnit from country+language defaults
 * (the same way merch-card does for its aem-fragment-backed prices).
 * Without this, prices rendered through <mas-field field="prices"> miss
 * locale-driven labels like the FR_fr "TTC" tax indicator.
 */
export function priceOptionsProvider(element, options) {
    // Milo's unwrap strips the <mas-field> ancestor; #stampContext leaves a
    // fragment-id on the survivor, so trust that as the ownership marker.
    const masField = element.closest(MAS_FIELD_TAG);
    if (!masField && !element.hasAttribute('fragment-id')) return;
    options[FF_DEFAULTS] = true;
    options.wrapClauses = true; // let long localized prices wrap between clauses, not mid-word
    const data = masField?.aemFragment?.data;

    // Apply the fragment's resolved price literals (e.g. the locale's plan-type
    // label), mirroring merch-card — otherwise labels fall back to the built-in
    // defaults and locale-specific plan types render empty.
    mergePriceLiterals(data?.priceLiterals, options);

    applyHideStPriceLabels(element, options);

    // Legal disclaimers show the plan type based on the fragment's
    // displayPlanType setting, mirroring the merch-card variant provider.
    // mas-field renders legal templates outside a card, so it must apply the
    // setting itself, otherwise the plan type is always dropped.
    if (masField && element.dataset.template === TEMPLATE_PRICE_LEGAL) {
        options.displayPlanType = data?.settings?.displayPlanType ?? false;
    }

    applyFieldPromotionCode(element, masField, options);
    applyDisplayAnnualDefault(masField, options);
}

/** Applies the mas-field promo code to checkout options, like merch-card does for cards. */
export function checkoutOptionsProvider(element, options) {
    applyFieldPromotionCode(element, element.closest(MAS_FIELD_TAG), options);
}

function registerOptionsProviders() {
    registerContextOptionsProviders(
        getService(),
        priceOptionsProvider,
        checkoutOptionsProvider,
    );
}

/**
 * Upgrades the data-wcs-osi anchors of fragment HTML into checkout-links:
 * customized built-ins are only constructed when `is=` is present at parse
 * time, and stored fragment HTML for non-ctas fields never carries it.
 */
function upgradeCheckoutLinks(container) {
    for (const link of container.querySelectorAll(
        'a[data-wcs-osi]:not([is])',
    )) {
        link.replaceWith(toCheckoutLink(link));
    }
}

/**
 * Wires any RTE tooltip nodes (.icon-button[data-tooltip]) rendered into the
 * field so they behave like Milo's tooltips: a11y attributes, an initial
 * placement class, and hover/focus listeners that reposition (positionTooltip)
 * to whichever side fits the viewport. Idempotent per icon.
 */
function decorateTooltips(root) {
    for (const icon of root.querySelectorAll(
        '.icon-button[data-tooltip]:not([data-tooltip-wired])',
    )) {
        icon.dataset.tooltipWired = '1';
        if (!icon.querySelector('svg')) {
            icon.insertAdjacentHTML('afterbegin', INFO_ICON);
        }
        for (const [name, value] of [
            ['tabindex', '0'],
            ['role', 'button'],
            ['aria-label', icon.dataset.tooltip],
        ]) {
            if (!icon.hasAttribute(name)) icon.setAttribute(name, value);
        }
        const original =
            [...icon.classList].find((value) =>
                TOOLTIP_PLACEMENTS.includes(value),
            ) ?? 'top';
        icon.classList.add(original, 'hide-tooltip');
        icon.dataset.originalPosition = original;
        const show = () => {
            icon.classList.remove('hide-tooltip');
            positionTooltip(icon);
        };
        const hide = () => icon.classList.add('hide-tooltip');
        icon.addEventListener('mouseenter', show);
        icon.addEventListener('focus', show);
        icon.addEventListener('mouseleave', hide);
        icon.addEventListener('blur', hide);
        icon.addEventListener('keydown', ({ key }) => {
            if (key === 'Escape') hide();
        });
    }
}

/**
 * Flips a tooltip to whichever side (top/bottom/left/right) keeps its popover
 * inside the viewport. Ported from Milo's scripts/tooltip.js setTooltipPosition
 * so headless mas-field tooltips edge-flip the same way as authored Milo ones.
 */
function positionTooltip(tooltip) {
    const { innerWidth, innerHeight } = window;
    const margin = 12;
    const headerHeight =
        document.querySelector('header')?.getBoundingClientRect().height || 0;
    const before = window.getComputedStyle(tooltip, '::before');
    const px = (value) => parseFloat(value) || 0;
    const width =
        px(before.width) + px(before.paddingLeft) + px(before.paddingRight);
    const height =
        px(before.height) + px(before.paddingTop) + px(before.paddingBottom);
    const rect = tooltip.getBoundingClientRect();
    const original = tooltip.dataset.originalPosition || 'top';
    const current = TOOLTIP_PLACEMENTS.find((value) =>
        tooltip.classList.contains(value),
    );
    const isVertical = original === 'top' || original === 'bottom';
    const effectiveMaxWidth = isVertical ? width / 2 : width;
    const effectiveHeight = original === 'top' ? height + margin : height / 2;
    const willCutoffTop = rect.top - effectiveHeight < headerHeight;
    const willCutoffBottom =
        rect.bottom + (original === 'bottom' ? height + margin : 0) >
        innerHeight;
    const willOverflowRight =
        rect.right + effectiveMaxWidth + margin > innerWidth;
    const willOverflowLeft = rect.left - effectiveMaxWidth - margin < 0;
    const willOverflowRightAtBottom =
        rect.left + width / 2 + margin > innerWidth;
    const willOverflowLeftAtBottom = rect.left - width / 2 - margin < 0;
    const hasOverflow =
        willOverflowRight ||
        willOverflowLeft ||
        willCutoffTop ||
        willCutoffBottom ||
        willOverflowRightAtBottom ||
        willOverflowLeftAtBottom;
    let updated = original;
    if (original !== current && !hasOverflow) {
        updated = original;
    } else if (willOverflowRight && willOverflowRightAtBottom) {
        updated = 'left';
    } else if (willOverflowLeft && willOverflowLeftAtBottom) {
        updated = 'right';
    } else if ((willOverflowRight || willOverflowLeft) && willCutoffTop) {
        updated =
            (willOverflowRightAtBottom && 'left') ||
            (willOverflowLeftAtBottom && 'right') ||
            'bottom';
    } else if (willOverflowRight !== willOverflowLeft && !willCutoffBottom) {
        updated = willOverflowRight ? 'left' : 'right';
    } else if (willCutoffTop && original !== 'bottom') {
        updated = 'bottom';
    } else if (willCutoffBottom && original !== 'top') {
        updated = 'top';
    }
    if (current === updated) return;
    tooltip.classList.remove(...TOOLTIP_PLACEMENTS);
    tooltip.classList.add(updated);
}

/**
 * Renders a single field from an AEM fragment inline on the page.
 * Wraps <aem-fragment> and listens for its aem:load event to extract
 * and display the specified field content.
 *
 * Usage: <mas-field field="prices"><aem-fragment fragment="id"></aem-fragment></mas-field>
 */
class MasField extends HTMLElement {
    static observedAttributes = ['field'];

    #field = null;
    #fields = null;
    #loaded = false;
    #failed = false;
    settings = null;

    /**
     * Compat version of the backing fragment, mirroring merch-card. Gates
     * global promo-code application in the option providers.
     * @type {number}
     */
    compatVersion;

    /**
     * Raw promo code carried by this mas-field, mirroring merch-card's
     * contextPromotionCode property so both hosts share the same interface
     * for the promo-code gate in mas-context.js.
     * @type {?string}
     */
    get contextPromotionCode() {
        return this.getAttribute('data-promotion-code');
    }

    get aemFragment() {
        return this.querySelector('aem-fragment');
    }

    get osi() {
        return hostOsi(this);
    }

    attributeChangedCallback(name, oldValue, value) {
        this.#field = value;
        this.#render();
    }

    /** Starts listening for aem:load and aem:error events bubbling from child aem-fragment. */
    connectedCallback() {
        injectStyle(MAS_FIELD_TAG, MAS_FIELD_STYLES);
        this.addEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
        this.addEventListener(EVENT_AEM_ERROR, this.#onFragmentError);
        if (!this.querySelector(CONTENT_SELECTOR)) this.#contentSpan();
        this.aemFragment?.setAttribute('hidden', '');
        registerOptionsProviders();
    }

    disconnectedCallback() {
        this.removeEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
        this.removeEventListener(EVENT_AEM_ERROR, this.#onFragmentError);
    }

    /**
     * Resolves true when the fragment data has loaded and false when the fragment
     * failed (including a failure that happened before this call), so callers never
     * wait on a fragment that can no longer load. Unlike merch-card, which resolves
     * undefined on failure, the failure value is an explicit false.
     * Used by the autoblock timeout race.
     */
    checkReady() {
        if (this.#loaded) return Promise.resolve(true);
        if (this.#failed) return Promise.resolve(false);
        return new Promise((resolve) => {
            const settle = (event) => {
                if (event.target !== this.aemFragment) return;
                this.removeEventListener(EVENT_AEM_LOAD, settle);
                this.removeEventListener(EVENT_AEM_ERROR, settle);
                resolve(event.type === EVENT_AEM_LOAD);
            };
            this.addEventListener(EVENT_AEM_LOAD, settle);
            this.addEventListener(EVENT_AEM_ERROR, settle);
        });
    }

    /** Remembers that the fragment failed, so checkReady() can settle without waiting. */
    #onFragmentError = ({ target }) => {
        if (target === this.aemFragment) this.#failed = true;
    };

    /** Renders the field from the loaded fragment, then dispatches mas:ready. */
    #onFragmentLoad = async (event) => {
        if (event.target !== this.aemFragment) return;
        const { fields, settings = null } = event.detail;
        this.#fields = fields || null;
        this.settings = settings;
        this.#loaded = true;
        // Prices are created by the render: register even if the service was not active on connect.
        registerOptionsProviders();
        await this.#render();
        // Signal that this field finished loading and rendering, so a host (e.g. Milo's
        // merch autoblock) can decorate a CTA that resolved after its block decorated.
        this.dispatchEvent(
            new CustomEvent(EVENT_MAS_READY, {
                bubbles: true,
                composed: true,
                detail: event.detail,
            }),
        );
    };

    #hide() {
        this.hidden = true;
    }

    #setContent(content) {
        content.dataset.role = 'mas-field-content';
        const current = this.querySelector(CONTENT_SELECTOR);
        if (current) current.replaceWith(content);
        else this.append(content);
    }

    #contentSpan() {
        const current = this.querySelector(CONTENT_SELECTOR);
        if (current?.localName === 'span') return current;
        const span = document.createElement('span');
        this.#setContent(span);
        return span;
    }

    /** Renders stored image markup as the content root itself (no wrapping span). */
    #renderPicture(inner) {
        if (!inner) {
            this.querySelector(CONTENT_SELECTOR)?.remove();
            this.#hide();
            return;
        }
        this.#setContent(createPicture(inner));
    }

    /** Real alt text when authored,
     *  otherwise role="none" (not an empty alt) to mark the image decorative. */
    #backgroundImageMarkup(url) {
        const alt = unwrapSingleParagraph(
            normalizeFieldValue(this.#fields.backgroundImageAltText),
        );
        const altAttribute = alt
            ? `alt="${escapeAttribute(alt)}"`
            : 'role="none"';
        return `<img loading="lazy" ${altAttribute} src="${sanitizeAssetUrl(url)}">`;
    }

    #setFragmentIds() {
        const { aemFragment } = this;
        if (!aemFragment) return;
        const data = aemFragment.data;
        this.setAttribute('fragment-id', data?.id);
        if (!data) return;
        const {
            variationId,
            maskId,
            promoProject,
            promoVariationProject,
            fields,
        } = data;
        for (const [name, value] of [
            ['variation-id', variationId],
            ['mask-id', maskId],
            ['data-promotion-project', promoProject],
            ['data-promotion-variation-project', promoVariationProject],
            ['data-promotion-code', fields?.promoCode],
        ]) {
            if (value) this.setAttribute(name, value);
        }
        this.compatVersion = fields?.compatVersion;
    }

    async #render() {
        const fields = this.#fields;
        if (!fields || !this.#field) return;
        this.hidden = false;
        const { name, index } = parseField(this.#field);
        const indexed = index !== null;
        const isCtas = name === 'ctas';
        const stripTrials = isCtas && this.settings?.hideTrialCTAs;

        const labels =
            typeof index === 'string'
                ? fields[`${name.replace(/s$/, '')}Labels`]
                : undefined;
        if (labels !== undefined) {
            let html = normalizeFieldValue(
                toList(fields[name])[toList(labels).indexOf(index)],
            );
            if (!html) return this.#hide();
            this.#setFragmentIds();
            if (stripTrials) {
                html = await stripTrialCtas(parseTemplate(html), true, this);
                if (!html.trim()) return this.#hide();
            }
            const content = this.#contentSpan();
            content.innerHTML = unwrapSingleParagraph(html);
            return this.#decorate(content);
        }

        const value = normalizeFieldValue(fields[name]);
        if (value === undefined) return this.#hide();
        this.#setFragmentIds();

        if (!indexed && IMAGE_FIELDS.includes(name)) {
            const image = unwrapSingleParagraph(value);
            return this.#renderPicture(
                image && name === 'backgroundImage'
                    ? this.#backgroundImageMarkup(image)
                    : image,
            );
        }
        if (name === 'backgrounds') {
            const url = unwrapSingleParagraph(
                extractBackgroundUrl(value, index),
            );
            return this.#renderPicture(url && buildPictureInnerMarkup(url));
        }

        // FEDS wrappers own presentation even without emphasis; Milo can hoist emphasis inside mas-field.
        const pageOwnsCta =
            isCtas &&
            indexed &&
            Boolean(
                this.closest('strong, em, .feds-cta-wrapper') ||
                    this.querySelector(':scope > strong, :scope > em'),
            );
        const content = this.#contentSpan();
        let template;
        if (indexed) {
            template =
                typeof value === 'string' &&
                extractIndexedAnchor(parseTemplate(value), index, pageOwnsCta);
            if (!template) return this.#hide();
        } else {
            const html = unwrapSingleParagraph(value);
            if (html == null) return this.#hide();
            if (typeof html !== 'string') {
                content.textContent = html;
                return undefined;
            }
            template = parseTemplate(html);
        }
        if (stripTrials) {
            const html = await stripTrialCtas(template, indexed, this);
            if (!html.trim()) return this.#hide();
        }
        const links =
            isCtas && !pageOwnsCta && template.content.querySelectorAll('a');
        if (links?.length) {
            const cta = indexed
                ? hydrateHeadlessCta(links[0])
                : this.#ctaFooter(links);
            this.#applyCtaPresentation(cta);
            content.replaceChildren(cta);
            return this.#stampContext(content);
        }
        content.replaceChildren(template.content);
        return this.#decorate(content);
    }

    /** Groups the CTAs of a whole ctas field like a card footer. */
    #ctaFooter(links) {
        const footer = document.createElement('div');
        footer.slot = 'footer';
        footer.className = 'action-area';
        footer.append(...Array.from(links, hydrateHeadlessCta));
        return footer;
    }

    /** Upgrades checkout links, wires tooltips and stamps context on rendered fragment HTML. */
    #decorate(content) {
        upgradeCheckoutLinks(content);
        decorateTooltips(content);
        this.#stampContext(content);
    }

    /**
     * Stamps context (ids, and the gated promo code) onto the commerce elements
     * mas-field renders. Milo's autoblock unwraps the mas-field, so context kept
     * only on the wrapper is lost; carrying it on the element itself survives the
     * move. Never overwrites an element's own authored value.
     */
    #stampContext(content) {
        const targets = content.querySelectorAll(COMMERCE_SELECTOR);
        if (!targets.length) return;
        const context = [
            ...CONTEXT_ATTRIBUTES.map((name) => [
                name,
                this.getAttribute(name),
            ]),
            ['data-promotion-code', resolveContextPromotionCode(this)],
        ].filter(([, value]) => value != null);
        for (const target of targets) {
            for (const [name, value] of context) {
                if (!target.hasAttribute(name))
                    target.setAttribute(name, value);
            }
        }
    }

    /** Studio-owned CTAs bypass Milo's inline CTA decorator and inherit block presentation here. */
    #applyCtaPresentation(cta) {
        const section = this.closest('.section');
        if (!section) return;
        let wrapper = this.parentElement;
        while (
            wrapper.matches('strong, em') &&
            wrapper.childElementCount === 1 &&
            wrapper.firstElementChild === this &&
            wrapper.textContent.trim() === this.textContent.trim()
        ) {
            wrapper.replaceWith(...wrapper.childNodes);
            wrapper = this.parentElement;
        }
        let block = this;
        while (block.parentElement !== section) block = block.parentElement;
        const sizeOf = (element) =>
            [...element.classList].find((value) => BUTTON_SIZE.test(value));
        const sibling = [...block.querySelectorAll('.con-button')].find(
            (button) => !this.contains(button) && sizeOf(button),
        );
        let size;
        let utilities = [];
        if (sibling) {
            size = sizeOf(sibling);
            utilities = [...sibling.classList].filter(
                (value) =>
                    value.startsWith('button-') && !BUTTON_SIZE.test(value),
            );
        } else {
            const authoredSize = [...block.classList].find((value) =>
                /^(s|m|l|xl|xxl)-button$/.test(value),
            );
            if (authoredSize) {
                size = `button-${authoredSize.split('-')[0]}`;
            } else if (block.classList.contains('hero-marquee')) {
                size = 'button-xl';
                utilities = ['button-justified-mobile'];
            } else if (!block.matches('.accordion, .media')) {
                size = block.matches('.large, .xlarge')
                    ? 'button-xl'
                    : 'button-l';
            }
        }
        for (const [, utility] of this.merchLink?.matchAll(
            /(?:&|#)_button-([a-zA-Z-]+)/g,
        ) ?? []) {
            utilities.push(utility);
        }
        const buttons = cta.matches('.con-button')
            ? [cta]
            : cta.querySelectorAll('.con-button');
        for (const button of buttons) {
            if (size && !sizeOf(button)) button.classList.add(size);
            button.classList.add(...utilities);
        }
        const paragraph = this.closest('p');
        if (
            paragraph &&
            (buttons.length ||
                [...paragraph.childNodes].every(
                    (node) =>
                        node === this ||
                        (node.nodeType === Node.TEXT_NODE &&
                            !node.textContent.trim()),
                ))
        ) {
            paragraph.classList.add('action-area');
        }
    }
}

customElements.define(MAS_FIELD_TAG, MasField);
