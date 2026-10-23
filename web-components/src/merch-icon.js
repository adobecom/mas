import { escapeHTML, toRelativeAssetUrl } from './utils.js';
import { css } from './css.js';

// Self-contained tooltip detection for MAS
function hasSpectrumTooltip() {
    return (
        customElements.get('sp-tooltip') !== undefined ||
        document.querySelector('sp-theme') !== null
    );
}

const DEFAULTS = { size: 'm', alt: '', loading: 'lazy' };

export default class MerchIcon extends HTMLElement {
    static observedAttributes = ['size', 'src', 'alt', 'href', 'loading'];

    #markup;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [sheet];
    }

    get size() {
        return this.getAttribute('size') ?? DEFAULTS.size;
    }

    set size(value) {
        setAttribute(this, 'size', value);
    }

    get src() {
        return this.getAttribute('src') ?? undefined;
    }

    set src(value) {
        setAttribute(this, 'src', value);
    }

    get alt() {
        return this.getAttribute('alt') ?? DEFAULTS.alt;
    }

    set alt(value) {
        setAttribute(this, 'alt', value);
    }

    get href() {
        return this.getAttribute('href') ?? undefined;
    }

    set href(value) {
        setAttribute(this, 'href', value);
    }

    get loading() {
        return this.getAttribute('loading') ?? DEFAULTS.loading;
    }

    set loading(value) {
        setAttribute(this, 'loading', value);
    }

    connectedCallback() {
        this.#upgradeProperties();
        this.#render();
        setTimeout(() => this.handleTooltips(), 0);
    }

    attributeChangedCallback(name, oldValue, value) {
        if (oldValue === value || !this.isConnected) return;
        this.#render();
    }

    #upgradeProperties() {
        for (const property of MerchIcon.observedAttributes) {
            if (!Object.hasOwn(this, property)) continue;
            const value = this[property];
            delete this[property];
            this[property] = value;
        }
    }

    handleTooltips() {
        if (hasSpectrumTooltip()) return;

        const tooltipElements = this.querySelectorAll(
            'sp-tooltip, overlay-trigger',
        );

        tooltipElements.forEach((element) => {
            let content = '';
            let placement = 'top';

            if (element.tagName === 'SP-TOOLTIP') {
                content = element.textContent;
                placement = element.getAttribute('placement') || 'top';
            } else if (element.tagName === 'OVERLAY-TRIGGER') {
                const tooltip = element.querySelector('sp-tooltip');
                if (tooltip) {
                    content = tooltip.textContent;
                    placement =
                        tooltip.getAttribute('placement') ||
                        element.getAttribute('placement') ||
                        'top';
                }
            }

            if (content) {
                const masMnemonic = document.createElement('mas-mnemonic');
                masMnemonic.setAttribute('content', content);
                masMnemonic.setAttribute('placement', placement);

                const img = this.querySelector('img');
                const link = this.querySelector('a');

                if (link && link.contains(img)) {
                    masMnemonic.appendChild(link);
                } else if (img) {
                    masMnemonic.appendChild(img);
                }

                this.innerHTML = '';
                this.appendChild(masMnemonic);

                import('./mas-mnemonic.js');
            }

            element.remove();
        });
    }

    #render() {
        const img = `<img src="${escapeHTML(toRelativeAssetUrl(this.src))}" alt="${escapeHTML(this.alt)}" loading="${escapeHTML(this.loading)}" />`;
        const markup = this.href
            ? `<a href="${escapeHTML(this.href)}">${img}</a>`
            : img;
        if (markup === this.#markup) return;
        this.#markup = markup;
        this.shadowRoot.innerHTML = markup;
    }

    static styles = css`
        :host {
            --img-width: 32px;
            --img-height: 32px;
            display: block;
            width: var(--mod-img-width, var(--img-width));
            height: var(--mod-img-height, var(--img-height));
        }

        :host([size='xxs']) {
            --img-width: 13px;
            --img-height: 13px;
        }

        :host([size='xs']) {
            --img-width: 20px;
            --img-height: 20px;
        }

        :host([size='s']) {
            --img-width: 24px;
            --img-height: 24px;
        }

        :host([size='m']) {
            --img-width: 30px;
            --img-height: 30px;
        }

        :host([size='l']) {
            --img-width: 40px;
            --img-height: 40px;
        }

        img {
            width: var(--mod-img-width, var(--img-width));
            height: var(--mod-img-height, var(--img-height));
        }
    `;
}

function setAttribute(element, name, value) {
    if (value == null) element.removeAttribute(name);
    else element.setAttribute(name, value);
}

const sheet = new CSSStyleSheet();
sheet.replaceSync(MerchIcon.styles);

customElements.define('merch-icon', MerchIcon);
