import {
    EVENT_AEM_LOAD,
    EVENT_MAS_READY,
    FF_DEFAULTS,
    TEMPLATE_PRICE_LEGAL,
    TRIAL_ANALYTICS_IDS,
} from './constants.js';
import { getService, shouldHideStPriceLabels } from './utils.js';
import { COMPAT_VERSION_GLOBAL_PROMO_CODE } from './compat-version.js';

const MAS_FIELD_TAG = 'mas-field';
const CHECKOUT_STYLE_PATTERN = /(accent|primary|secondary)(-(outline|link))?/;
const CONTEXT_ATTRIBUTES = [
    'fragment-id',
    'variation-id',
    'mask-id',
    'data-promotion-project',
    'data-promotion-variation-project',
];

/**
 * Maps a CTA's authored style class to Milo's con-button classes.
 * Returns null for link-style and unstyled anchors, which stay plain links.
 */
function conButtonClasses(className) {
    const style = CHECKOUT_STYLE_PATTERN.exec(className ?? '')?.[0];
    if (!style || style.includes('-link')) return null;
    const outline = style.startsWith('secondary') || style.includes('-outline');
    return `con-button ${outline ? 'outline' : 'blue'}`;
}

/**
 * Resolves the promo code the mas-field should apply to its prices/CTAs,
 * honoring the global promo-code compat gate the same way merch-card's
 * option providers do: only fragments authored at or above
 * COMPAT_VERSION_GLOBAL_PROMO_CODE (or explicitly part of a promo project)
 * opt into promo codes, so older fragments are left untouched.
 */
function contextPromotionCode(masField) {
    if (
        masField.compatVersion >= COMPAT_VERSION_GLOBAL_PROMO_CODE ||
        masField.hasAttribute('data-promotion-project')
    )
        return masField.getAttribute('data-promotion-code');
    return null;
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
 * `indexed` distinguishes the two callers. For the whole `ctas` field we keep
 * every CTA when filtering would empty it, mirroring merch-card so a card is
 * never left with no CTA. For an indexed ref we return null so the single
 * requested slot renders nothing rather than shifting to its neighbour.
 */
function stripTrialCtas(html, indexed) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const anchors = [...template.content.querySelectorAll('a')];
    const trials = anchors.filter((anchor) =>
        TRIAL_ANALYTICS_IDS.has(anchor.dataset.analyticsId),
    );
    // Hand back the original string so non-trial markup never round-trips
    // through serialization, which could renormalize attribute quoting.
    if (trials.length === 0) return html;
    // All CTAs are trials: an indexed ref renders nothing, while the plain
    // field keeps them all so a card is never left with no CTA.
    if (trials.length === anchors.length) return indexed ? null : html;
    trials.forEach((anchor) => anchor.remove());
    return template.innerHTML;
}

/**
 * Opts headless mas-field-hosted inline-prices into FF_DEFAULTS so they
 * resolve displayTax / displayPerUnit from country+language defaults
 * (the same way merch-card does for its aem-fragment-backed prices).
 * Without this, prices rendered through <mas-field field="prices"> miss
 * locale-driven labels like the FR_fr "TTC" tax indicator.
 */
export function priceOptionsProvider(element, options) {
    if (!element) return options;
    // Milo's unwrap strips the <mas-field> ancestor; #stampContext leaves a
    // fragment-id on the survivor, so trust that as the ownership marker.
    const masField = element.closest(MAS_FIELD_TAG);
    const owned = masField || element.hasAttribute('fragment-id');
    if (!owned) return options;
    options[FF_DEFAULTS] = true;
    options.wrapClauses = true; // let long localized prices wrap between clauses, not mid-word

    if (shouldHideStPriceLabels(element)) {
        options.displayPerUnit = false;
        options.displayTax = false;
    }

    // Legal disclaimers show the plan type based on the fragment's
    // displayPlanType setting, mirroring the merch-card variant provider.
    // mas-field renders legal templates outside a card, so it must apply the
    // setting itself, otherwise the plan type is always dropped.
    if (masField && element.dataset.template === TEMPLATE_PRICE_LEGAL) {
        options.displayPlanType =
            masField.aemFragment?.data?.settings?.displayPlanType ?? false;
    }

    if (!options.promotionCode) {
        const promotionCode =
            element.dataset.promotionCode ??
            (masField ? contextPromotionCode(masField) : null);
        if (promotionCode) options.promotionCode = promotionCode;
    }

    if (
        options.displayAnnual === undefined &&
        typeof masField?.settings?.displayAnnual === 'boolean'
    ) {
        options.displayAnnual = masField.settings.displayAnnual;
    }
}

/**
 * Applies the mas-field promo code to checkout options, like merch-card does
 * for cards. Reads the element's own dataset first, so a CTA unwrapped out of
 * its <mas-field> still resolves; falls back to the wrapper when still nested.
 */
export function checkoutOptionsProvider(element, options) {
    if (options.promotionCode || !element) return;
    const masField = element.closest(MAS_FIELD_TAG);
    const promotionCode =
        element.dataset.promotionCode ??
        (masField ? contextPromotionCode(masField) : null);
    if (promotionCode) options.promotionCode = promotionCode;
}

function registerOptionsProviders(service) {
    if (!service?.providers || service.providers.has(priceOptionsProvider))
        return;
    service.providers.price(priceOptionsProvider);
    service.providers.checkout(checkoutOptionsProvider);
}

const MAS_FIELD_STYLES = `
mas-field {
    display: inline;
}

mas-field div[slot="footer"] {
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
   (top|bottom|left|right) drives the popover side and #decorateTooltips re-picks the
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
    background: #0469E3;
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
    border-right-color: #0469E3;
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
    border-left-color: #0469E3;
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
    border-top-color: #0469E3;
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
    border-bottom-color: #0469E3;
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

if (!document.querySelector('style[data-mas-field]')) {
    const style = document.createElement('style');
    style.setAttribute('data-mas-field', '');
    style.textContent = MAS_FIELD_STYLES;
    document.head.append(style);
}

/**
 * Renders a single field from an AEM fragment inline on the page.
 * Wraps <aem-fragment> and listens for its aem:load event to extract
 * and display the specified field content.
 *
 * Usage: <mas-field field="prices"><aem-fragment fragment="id"></aem-fragment></mas-field>
 */
class MasField extends HTMLElement {
    #field = null;
    #loaded = false;
    #fields = null;
    settings = null;
    #contentElement = null;

    /**
     * Compat version of the backing fragment, mirroring merch-card. Gates
     * global promo-code application in the option providers.
     * @type {number}
     */
    compatVersion;

    static get observedAttributes() {
        return ['field'];
    }

    /** Stores the field name from the 'field' attribute. */
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'field') {
            this.#field = newValue;
            this.#renderField();
        }
    }

    /** Starts listening for aem:load events bubbling from child aem-fragment. */
    connectedCallback() {
        this.addEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
        this.#ensureContentElement();
        this.aemFragment?.setAttribute('hidden', '');
        registerOptionsProviders(getService());
    }

    /** Cleans up the event listener when removed from the DOM. */
    disconnectedCallback() {
        this.removeEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
    }

    /** Resolves when the fragment data has loaded. Used by the autoblock timeout race. */
    checkReady() {
        if (this.#loaded) return Promise.resolve(true);
        return new Promise((resolve) => {
            this.addEventListener(EVENT_AEM_LOAD, () => resolve(true), {
                once: true,
            });
        });
    }

    /** Extracts the target field from the fragment data and renders it as innerHTML. */
    #onFragmentLoad = (event) => {
        if (event.target !== this.aemFragment) return;
        this.#fields = event.detail?.fields || null;
        this.settings = event.detail?.settings ?? null;
        this.#loaded = true;
        this.#renderField();
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

    get aemFragment() {
        return this.querySelector('aem-fragment');
    }

    #ensureContentElement() {
        if (this.#contentElement?.isConnected) return this.#contentElement;
        const existing = this.querySelector(
            ':scope > span[data-role="mas-field-content"]',
        );
        if (existing) {
            this.#contentElement = existing;
            return existing;
        }
        const content = document.createElement('span');
        content.setAttribute('data-role', 'mas-field-content');
        this.append(content);
        this.#contentElement = content;
        return content;
    }

    #normalizeFieldValue(value) {
        if (value && typeof value === 'object' && 'value' in value)
            return value.value;
        return value;
    }

    /** Parses "ctas[1]" → { fieldName: "ctas", index: 1 },
     *  "ctas[abc123xyz]" → { fieldName: "ctas", index: "abc123xyz" },
     *  "customFields[My Label]" → { fieldName: "customFields", index: "My Label" },
     *  or plain names → { fieldName, index: null }. */
    #parseFieldAndIndex(field) {
        const numericMatch = field?.match(/^(.+)\[(\d+)\]$/);
        if (numericMatch)
            return {
                fieldName: numericMatch[1],
                index: parseInt(numericMatch[2], 10),
            };
        const bracketMatch = field?.match(/^(.+)\[(.+)\]$/);
        if (bracketMatch)
            return { fieldName: bracketMatch[1], index: bracketMatch[2] };
        return { fieldName: field, index: null };
    }

    /** Extracts the Nth anchor from CTA HTML and styles it as a con-button so Milo renders
     *  it as a button; unstyled and link-style anchors stay plain links.
     *  Uses a <template> so custom elements (e.g. checkout-link) are not upgraded and their
     *  attributes (href, data-wcs-osi, etc.) are preserved exactly as stored. */
    #extractIndexedAnchor(html, index) {
        if (typeof html !== 'string') return null;
        const template = document.createElement('template');
        template.innerHTML = html;
        let anchor;
        if (!isNaN(index)) {
            const i = parseInt(index, 10);
            anchor = [...template.content.querySelectorAll('a')][i - 1];
        }
        if (!anchor) {
            anchor = template.content.querySelector(`a[data-key="${index}"]`);
        }
        if (!anchor) return null;
        const buttonClasses = conButtonClasses(anchor.className);
        if (buttonClasses) anchor.className = buttonClasses;
        else anchor.removeAttribute('class');
        return anchor.outerHTML;
    }

    #setFragmentIds() {
        if (!this.aemFragment) return;
        this.setAttribute('fragment-id', this.aemFragment.data?.id);
        const fragment = this.aemFragment.data;
        if (!fragment) return;
        if (fragment.variationId)
            this.setAttribute('variation-id', fragment.variationId);
        if (fragment.maskId) this.setAttribute('mask-id', fragment.maskId);
        if (fragment.promoProject)
            this.setAttribute('data-promotion-project', fragment.promoProject);
        if (fragment.promoVariationProject)
            this.setAttribute(
                'data-promotion-variation-project',
                fragment.promoVariationProject,
            );
        this.compatVersion = fragment.fields?.compatVersion;
        if (fragment.fields?.promoCode)
            this.setAttribute('data-promotion-code', fragment.fields.promoCode);
    }

    #renderField() {
        if (!this.#fields || !this.#field) return;
        const { fieldName, index } = this.#parseFieldAndIndex(this.#field);

        if (index !== null && isNaN(index)) {
            const labelsFieldName = `${fieldName.replace(/s$/, '')}Labels`;
            const labelsRaw = this.#fields[labelsFieldName];
            if (labelsRaw !== undefined) {
                const labels = Array.isArray(labelsRaw)
                    ? labelsRaw
                    : [labelsRaw];
                const labelIndex = labels.indexOf(index);
                if (labelIndex === -1) return;
                const valuesRaw = this.#fields[fieldName];
                const values = Array.isArray(valuesRaw)
                    ? valuesRaw
                    : valuesRaw
                      ? [valuesRaw]
                      : [];
                let html = this.#normalizeFieldValue(values[labelIndex]);
                if (!html) return;
                if (fieldName === 'ctas' && this.settings?.hideTrialCTAs) {
                    html = stripTrialCtas(html, true);
                    if (html === null) return;
                }
                this.#setFragmentIds();
                const content = this.#ensureContentElement();
                content.innerHTML = this.#unwrapSingleParagraph(html) ?? '';
                this.#decorateTooltips(content);
                this.#stampContext(content);
                return;
            }
        }

        const fieldValue = this.#normalizeFieldValue(this.#fields[fieldName]);
        if (fieldValue === undefined) return;
        this.#setFragmentIds();
        const content = this.#ensureContentElement();
        let html;
        if (index !== null) {
            html = this.#extractIndexedAnchor(fieldValue, index);
            if (html === null) return;
        } else {
            html = this.#unwrapSingleParagraph(fieldValue);
        }
        if (typeof html === 'string') {
            if (fieldName === 'ctas' && this.settings?.hideTrialCTAs) {
                html = stripTrialCtas(html, index !== null);
                if (html === null) return;
            }
            if (this.#field === 'ctas') {
                const ctaEl = this.#renderCtaField(html);
                if (ctaEl) {
                    content.replaceChildren(ctaEl);
                    this.#stampContext(content);
                    return;
                }
            }
            content.innerHTML = html;
            this.#decorateTooltips(content);
            this.#stampContext(content);
            return;
        }
        content.textContent = html == null ? '' : String(html);
    }

    /**
     * Wires any RTE tooltip nodes (.icon-button[data-tooltip]) rendered into the
     * field so they behave like Milo's tooltips: a11y attributes, an initial
     * placement class, and hover/focus listeners that reposition (#positionTooltip)
     * to whichever side fits the viewport. Idempotent per icon.
     */
    #decorateTooltips(root) {
        const icons = root.querySelectorAll('.icon-button[data-tooltip]');
        for (const icon of icons) {
            if (icon.dataset.tooltipWired) continue;
            icon.dataset.tooltipWired = '1';
            if (!icon.querySelector('svg')) {
                icon.insertAdjacentHTML(
                    'afterbegin',
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>',
                );
            }
            if (!icon.hasAttribute('tabindex'))
                icon.setAttribute('tabindex', '0');
            if (!icon.hasAttribute('role')) icon.setAttribute('role', 'button');
            if (!icon.hasAttribute('aria-label'))
                icon.setAttribute('aria-label', icon.dataset.tooltip);
            const placements = ['top', 'bottom', 'left', 'right'];
            const authored = [...icon.classList].find((c) =>
                placements.includes(c),
            );
            const original = authored || 'top';
            if (!authored) icon.classList.add(original);
            icon.dataset.originalPosition = original;
            icon.classList.add('hide-tooltip');
            const show = () => {
                icon.classList.remove('hide-tooltip');
                this.#positionTooltip(icon);
            };
            const hide = () => icon.classList.add('hide-tooltip');
            icon.addEventListener('mouseenter', show);
            icon.addEventListener('focus', show);
            icon.addEventListener('mouseleave', hide);
            icon.addEventListener('blur', hide);
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') hide();
            });
        }
    }

    /**
     * Flips a tooltip to whichever side (top/bottom/left/right) keeps its popover
     * inside the viewport. Ported from Milo's scripts/tooltip.js setTooltipPosition
     * so headless mas-field tooltips edge-flip the same way as authored Milo ones.
     */
    #positionTooltip(tooltip) {
        const placements = ['top', 'bottom', 'right', 'left'];
        const viewportWidth = window.innerWidth;
        const margin = 12;
        const headerHeight =
            document.querySelector('header')?.getBoundingClientRect().height ||
            0;
        const before = window.getComputedStyle(tooltip, '::before');
        const px = (v) => parseFloat(v) || 0;
        const width =
            px(before.width) + px(before.paddingLeft) + px(before.paddingRight);
        const height =
            px(before.height) +
            px(before.paddingTop) +
            px(before.paddingBottom);
        const rect = tooltip.getBoundingClientRect();
        const original = tooltip.dataset.originalPosition || 'top';
        const current = placements.find((c) => tooltip.classList.contains(c));
        const isVertical = original === 'top' || original === 'bottom';
        const effectiveMaxWidth = isVertical ? width / 2 : width;
        const topMargin = original === 'top' ? margin : 0;
        const effectiveHeight =
            original === 'top' ? height + topMargin : height / 2;
        const willCutoffTop = rect.top - effectiveHeight < headerHeight;
        const willCutoffBottom =
            rect.bottom + (original === 'bottom' ? height + margin : 0) >
            window.innerHeight;
        const willOverflowRight =
            rect.right + effectiveMaxWidth + margin > viewportWidth;
        const willOverflowLeft = rect.left - effectiveMaxWidth - margin < 0;
        const willOverflowRightAtBottom =
            rect.left + width / 2 + margin > viewportWidth;
        const willOverflowLeftAtBottom = rect.left - width / 2 - margin < 0;
        const hasOverflow =
            willOverflowRight ||
            willOverflowLeft ||
            willCutoffTop ||
            willCutoffBottom ||
            willOverflowRightAtBottom ||
            willOverflowLeftAtBottom;
        if (original !== current && !hasOverflow) {
            tooltip.classList.remove(...placements);
            tooltip.classList.add(original);
            return;
        }
        let updated = original;
        if (willOverflowRight && willOverflowRightAtBottom) {
            updated = 'left';
        } else if (willOverflowLeft && willOverflowLeftAtBottom) {
            updated = 'right';
        } else if (
            (willOverflowRight && willCutoffTop) ||
            (willOverflowLeft && willCutoffTop)
        ) {
            updated =
                (willOverflowRightAtBottom && 'left') ||
                (willOverflowLeftAtBottom && 'right') ||
                'bottom';
        } else if (
            willOverflowRight !== willOverflowLeft &&
            !willCutoffBottom
        ) {
            updated = willOverflowRight ? 'left' : 'right';
        } else if (
            willCutoffTop &&
            ['top', 'left', 'right'].includes(original)
        ) {
            updated = 'bottom';
        } else if (
            willCutoffBottom &&
            ['bottom', 'left', 'right'].includes(original)
        ) {
            updated = 'top';
        }
        if (current !== updated) {
            tooltip.classList.remove(...placements);
            tooltip.classList.add(updated);
        }
    }

    /**
     * Stamps context (ids, and the gated promo code) onto the commerce elements
     * mas-field renders. Milo's autoblock unwraps the mas-field, so context kept
     * only on the wrapper is lost; carrying it on the element itself survives the
     * move. Never overwrites an element's own authored value.
     */
    #stampContext(content) {
        const targets = content.querySelectorAll(
            'a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]',
        );
        if (!targets.length) return;
        const stamp = (name, value) => {
            if (value == null) return;
            for (const el of targets)
                if (!el.hasAttribute(name)) el.setAttribute(name, value);
        };
        for (const name of CONTEXT_ATTRIBUTES)
            stamp(name, this.getAttribute(name));
        stamp('data-promotion-code', contextPromotionCode(this));
    }

    /**
     * Converts a single CTA anchor from the AEM fragment into a checkout-button
     * (or styled anchor for non-commerce links) using the same Spectrum CSS
     * classes that merch-card hydration applies.
     */
    #buildCtaButton(link) {
        const isCheckout = !!link.getAttribute('data-wcs-osi');
        if (!isCheckout) return link.cloneNode(true);

        const styleMatch =
            CHECKOUT_STYLE_PATTERN.exec(link.className ?? '')?.[0] ?? 'accent';
        const isAccent = styleMatch.startsWith('accent');
        const isLinkStyle = styleMatch.includes('-link');

        const CheckoutLink = customElements.get('checkout-link');
        const button =
            CheckoutLink?.createCheckoutLink(link.dataset, link.textContent) ??
            (() => {
                const el = document.createElement('a', { is: 'checkout-link' });
                el.innerHTML = `<span style="pointer-events: none;">${link.textContent}</span>`;
                return el;
            })();

        for (const { name, value } of link.attributes) {
            if (['class', 'is', 'href'].includes(name)) continue;
            button.setAttribute(name, value);
        }
        button.firstElementChild?.classList.add('spectrum-Button-label');
        if (!isLinkStyle) {
            button.classList.add('button', 'con-button');
            if (isAccent) button.classList.add('blue');
            else if (
                styleMatch.startsWith('primary') &&
                !styleMatch.includes('-outline')
            )
                button.classList.add('fill');
        }
        return button;
    }

    /**
     * Parses the raw CTA field HTML, converts each anchor to a hydrated
     * checkout-button, and returns a <div slot="footer"> ready to render.
     * Returns null if there are no anchor elements in the field value.
     */
    #renderCtaField(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const links = [...doc.body.querySelectorAll('a')];
        if (!links.length) return null;
        const footer = document.createElement('div');
        footer.setAttribute('slot', 'footer');
        footer.append(...links.map((link) => this.#buildCtaButton(link)));
        return footer;
    }

    /** Strips <p> wrapper from single-paragraph AEM rich text so it renders inline. */
    #unwrapSingleParagraph(html) {
        if (typeof html !== 'string') return html;
        const trimmed = html.trim();
        const hasWrapper =
            trimmed.startsWith('<p>') && trimmed.endsWith('</p>');
        if (!hasWrapper) return html;
        const inner = trimmed.slice('<p>'.length, -'</p>'.length);
        return inner.includes('<p>') ? html : inner;
    }
}

customElements.define(MAS_FIELD_TAG, MasField);
