import { css } from './css.js';

export class MerchWhatsIncluded extends HTMLElement {
    static styles = css`
        :host {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            overflow: hidden;
            box-sizing: border-box;
            row-gap: 10px;
        }

        :host([has-bullets]) {
            flex-direction: column;
            align-items: start;
        }

        ::slotted([slot='heading']) {
            font-size: 14px;
            font-weight: 700;
            margin-right: 16px;
        }

        ::slotted([slot='heading']:empty) {
            display: none;
        }

        ::slotted([slot='content']) {
            display: contents;
        }

        ::slotted([slot='contentBullets']) {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 5px 0;
        }

        .hidden {
            display: none;
        }

        .see-more {
            font-size: 14px;
            text-decoration: underline;
            color: var(--link-color-dark);
        }
    `;

    static observedAttributes = ['heading', 'mobilerows'];

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
        this.showAll = false;
        this.toggle = this.toggle.bind(this);
        this.requestUpdate();
    }

    get heading() {
        return this.getAttribute('heading') ?? undefined;
    }

    set heading(value) {
        if (value == null) this.removeAttribute('heading');
        else this.setAttribute('heading', value);
    }

    get mobileRows() {
        const value = this.getAttribute('mobilerows');
        return value === null ? 5 : Number(value);
    }

    set mobileRows(value) {
        if (value == null) this.removeAttribute('mobilerows');
        else this.setAttribute('mobilerows', value);
    }

    connectedCallback() {
        for (const property of ['heading', 'mobileRows']) {
            if (!Object.hasOwn(this, property)) continue;
            const value = this[property];
            delete this[property];
            this[property] = value;
        }
        this.#resolveConnected();
    }

    attributeChangedCallback(name, oldValue, value) {
        if (oldValue !== value) this.requestUpdate();
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
        this.hideSeeMoreEls();
        return true;
    }

    hideSeeMoreEls() {
        if (this.isMobile) {
            this.rows.forEach((node, index) => {
                if (index >= 5) {
                    node.style.display = this.showAll ? 'flex' : 'none';
                }
            });
        }
    }

    toggle() {
        this.showAll = !this.showAll;

        this.dispatchEvent(
            new CustomEvent('hide-see-more-elements', {
                bubbles: true,
                composed: true,
            }),
        );
        this.requestUpdate();
    }

    #render() {
        const { isMobile, bulletsAdded } = this;
        const content =
            !isMobile || !bulletsAdded ? '<slot name="content"></slot>' : '';
        const seeMore =
            isMobile && this.rows.length > this.mobileRows && !bulletsAdded
                ? `<div class="see-more">
                      ${this.showAll ? '- See less' : '+ See more'}
                  </div>`
                : '';
        const markup = `<slot name="heading"></slot>
            <slot name="contentBullets"></slot>
            ${content}
            ${seeMore}`;
        if (markup === this.#markup) return;
        this.#markup = markup;
        this.shadowRoot.innerHTML = markup;
        this.shadowRoot
            .querySelector('.see-more')
            ?.addEventListener('click', this.toggle);
    }

    get isMobile() {
        return window.matchMedia('(max-width: 767px)').matches;
    }

    get rows() {
        return this.querySelectorAll('[slot="content"] merch-mnemonic-list');
    }

    get bulletsAdded() {
        return !!this.querySelector(
            '[slot="contentBullets"] merch-mnemonic-list',
        );
    }
}

const sheet = new CSSStyleSheet();
sheet.replaceSync(MerchWhatsIncluded.styles);

customElements.define('merch-whats-included', MerchWhatsIncluded);
