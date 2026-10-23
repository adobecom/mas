import { css } from './css.js';
import { escapeHTML } from './utils.js';

const iconMarkup = (iconName) => {
    if (!iconName) return '';
    if (iconName.startsWith('sp-icon-'))
        return `<${iconName} class="badge-icon"></${iconName}>`;
    return `<img src="${escapeHTML(iconName)}" class="badge-icon" />`;
};

const ATTRIBUTES = {
    color: 'color',
    variant: 'variant',
    backgroundColor: 'background-color',
    borderColor: 'border-color',
    icon: 'icon',
};

export default class MerchBadge extends HTMLElement {
    static observedAttributes = Object.values(ATTRIBUTES);

    #markup;
    #updatePending = false;
    #updatePromise;
    #resolveConnected;
    #connected = new Promise((resolve) => {
        this.#resolveConnected = resolve;
    });

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.requestUpdate();
    }

    get color() {
        return this.getAttribute('color') ?? '';
    }

    set color(value) {
        setAttribute(this, 'color', value);
    }

    get variant() {
        return this.getAttribute('variant') ?? '';
    }

    set variant(value) {
        setAttribute(this, 'variant', value);
    }

    get backgroundColor() {
        return this.getAttribute('background-color') ?? '';
    }

    set backgroundColor(value) {
        setAttribute(this, 'background-color', value);
    }

    get borderColor() {
        return this.getAttribute('border-color') ?? '';
    }

    set borderColor(value) {
        setAttribute(this, 'border-color', value);
    }

    get icon() {
        return this.getAttribute('icon') ?? '';
    }

    set icon(value) {
        setAttribute(this, 'icon', value);
    }

    connectedCallback() {
        this.#upgradeProperties();
        if (this.borderColor && this.borderColor !== 'transparent') {
            this.style.setProperty(
                '--merch-badge-border',
                `1px solid var(--${this.borderColor})`,
            );
        } else if (!this.backgroundColor.startsWith('gradient-')) {
            this.style.setProperty(
                '--merch-badge-border',
                `1px solid var(--${this.backgroundColor})`,
            );
        }
        this.style.setProperty(
            '--merch-badge-background-color',
            `var(--${this.backgroundColor})`,
        );

        if (
            (!this.borderColor || this.borderColor === 'transparent') &&
            this.backgroundColor.startsWith('gradient-')
        ) {
            this.style.setProperty(
                '--merch-badge-padding',
                '3px 11px 4px 11px',
            );
        } else {
            this.style.setProperty(
                '--merch-badge-padding',
                '2px 10px 3px 10px',
            );
        }

        this.style.setProperty('--merch-badge-color', this.color);
        // Border-radius is handled in global.css with RTL support
        this.style.setProperty(
            '--merch-badge-font-size',
            'var(--consonant-merch-card-body-xs-font-size)',
        );
        const card = this.closest('merch-card');
        const size = card?.getAttribute('size');
        const offset =
            card?.querySelectorAll(':scope > merch-icon').length || 0;
        this.style.setProperty('--merch-badge-offset', offset);
        this.style.setProperty('--merch-badge-with-offset', offset ? 1 : 0);
        this.style.setProperty('--merch-badge-card-size', size ? 2 : 1);

        this.#resolveConnected();
    }

    attributeChangedCallback(name, oldValue, value) {
        if (oldValue !== value) this.requestUpdate();
    }

    #upgradeProperties() {
        for (const property of Object.keys(ATTRIBUTES)) {
            if (!Object.hasOwn(this, property)) continue;
            const value = this[property];
            delete this[property];
            this[property] = value;
        }
    }

    requestUpdate() {
        if (this.#updatePending) return;
        this.#updatePending = true;
        this.#updatePromise = this.#enqueueUpdate();
    }

    get updateComplete() {
        return this.#updatePromise.then(() =>
            this.#updatePending ? this.updateComplete : true,
        );
    }

    async #enqueueUpdate() {
        await this.#connected;
        this.#updatePending = false;
        this.#render();
        return true;
    }

    #render() {
        const markup = `<div class="badge">
            ${iconMarkup(this.icon)}<slot></slot>
        </div>`;
        if (markup === this.#markup) return;
        this.#markup = markup;
        this.shadowRoot.innerHTML = markup;
    }

    static styles = css`
        :host {
            display: block;
            background: var(--merch-badge-background-color);
            color: var(--merch-badge-color, #000);
            padding: var(--merch-badge-padding);
            border-radius: var(--merch-badge-border-radius);
            font-size: var(--merch-badge-font-size);
            line-height: 21px;
            border: var(--merch-badge-border);
            position: relative;
            inset-inline-start: 1px;
        }

        :host .badge-icon {
            margin-right: 5px;
            position: relative;
            top: 3px;
            height: 18px;
            width: 18px;
        }
    `;
}

function setAttribute(element, name, value) {
    if (value == null) element.removeAttribute(name);
    else element.setAttribute(name, value);
}

const sheet = new CSSStyleSheet();
sheet.replaceSync(MerchBadge.styles);

customElements.define('merch-badge', MerchBadge);
