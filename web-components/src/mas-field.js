import { EVENT_AEM_LOAD, FF_DEFAULTS } from './constants.js';
import { getService } from './utils.js';

const MAS_FIELD_TAG = 'mas-field';
const CHECKOUT_STYLE_PATTERN = /(accent|primary|secondary)(-(outline|link))?/;

/**
 * Opts headless mas-field-hosted inline-prices into FF_DEFAULTS so they
 * resolve displayTax / displayPerUnit from country+language defaults
 * (the same way merch-card does for its aem-fragment-backed prices).
 * Without this, prices rendered through <mas-field field="prices"> miss
 * locale-driven labels like the FR_fr "TTC" tax indicator.
 */
export function priceOptionsProvider(element, options) {
    if (!element?.closest?.(MAS_FIELD_TAG)) return options;
    options[FF_DEFAULTS] = true;
}

function registerPriceOptionsProvider(service) {
    if (!service?.providers || service.providers.has(priceOptionsProvider))
        return;
    service.providers.price(priceOptionsProvider);
}

const MAS_FIELD_STYLES = `
mas-field div[slot="footer"] {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    align-items: center;
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
    #contentElement = null;

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
        registerPriceOptionsProvider(getService());
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
        this.#loaded = true;
        this.#renderField();
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

    /** Parses "ctas[0]" into { fieldName: "ctas", index: 0 }, or { fieldName, index: null } for plain names. */
    #parseFieldAndIndex(field) {
        const match = field?.match(/^(.+)\[(\d+)\]$/);
        if (!match) return { fieldName: field, index: null };
        return { fieldName: match[1], index: parseInt(match[2], 10) };
    }

    /** Extracts the Nth anchor from CTA HTML, stripping only CSS classes so Milo can restyle it.
     *  Uses a <template> element so custom elements (e.g. checkout-link) are never upgraded
     *  and their attributes (href, data-wcs-osi, etc.) are preserved exactly as stored. */
    #extractIndexedAnchor(html, index) {
        if (typeof html !== 'string') return null;
        const template = document.createElement('template');
        template.innerHTML = html;
        const anchor = [...template.content.querySelectorAll('a')][index - 1];
        if (!anchor) return null;
        anchor.removeAttribute('class');
        return anchor.outerHTML;
    }

    #renderField() {
        if (!this.#fields || !this.#field) return;
        const { fieldName, index } = this.#parseFieldAndIndex(this.#field);
        const fieldValue = this.#normalizeFieldValue(this.#fields[fieldName]);
        if (fieldValue === undefined) return;
        const content = this.#ensureContentElement();
        let html;
        if (index !== null) {
            html = this.#extractIndexedAnchor(fieldValue, index);
            if (html === null) return;
        } else {
            html = this.#unwrapSingleParagraph(fieldValue);
        }
        if (typeof html === 'string') {
            if (this.#field === 'ctas') {
                const ctaEl = this.#renderCtaField(html);
                if (ctaEl) {
                    content.replaceChildren(ctaEl);
                    return;
                }
            }
            content.innerHTML = html;
            return;
        }
        content.textContent = html == null ? '' : String(html);
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
