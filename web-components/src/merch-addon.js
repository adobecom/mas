import { EVENT_TYPE_RESOLVED, SELECTOR_MAS_INLINE_PRICE } from './constants.js';
import { css } from './css.js';

const MARKUP = `<input type="checkbox" id="addon-checkbox" />
    <span
        role="checkbox"
        tabindex="0"
        aria-labelledby="custom-checkbox-label"
        id="custom-checkbox"
    ></span>
    <label id="custom-checkbox-label" for="addon-checkbox"><slot></slot></label>`;

export default class MerchAddon extends HTMLElement {
    static observedAttributes = [
        'plan-type',
        'checked',
        'custom-checkbox',
        'background',
    ];

    #rendered = false;
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
        this.updatePlanType = this.updatePlanType.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleCustomClick = this.handleCustomClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.requestUpdate();
    }

    get planType() {
        return this.getAttribute('plan-type') ?? undefined;
    }

    set planType(value) {
        if (value == null) this.removeAttribute('plan-type');
        else this.setAttribute('plan-type', value);
    }

    get checked() {
        return this.hasAttribute('checked');
    }

    set checked(value) {
        this.toggleAttribute('checked', Boolean(value));
    }

    get customCheckbox() {
        return this.hasAttribute('custom-checkbox');
    }

    set customCheckbox(value) {
        this.toggleAttribute('custom-checkbox', Boolean(value));
    }

    get background() {
        return this.getAttribute('background') ?? undefined;
    }

    set background(value) {
        if (value == null) this.removeAttribute('background');
        else this.setAttribute('background', value);
    }

    attributeChangedCallback(name, oldValue, value) {
        if (oldValue !== value) this.requestUpdate();
    }

    #upgradeProperties() {
        for (const property of [
            'planType',
            'checked',
            'customCheckbox',
            'background',
        ]) {
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

    getOsi(planType, offerType) {
        const offerTypeOptions = {
            TRIAL: ['TRIAL'],
            BASE: ['BASE', 'PROMOTION', 'TRIAL'],
            PROMOTION: ['PROMOTION', 'BASE', 'TRIAL'],
        };
        // Get the priority list for this offer type
        const priorityList = offerTypeOptions[offerType] || [offerType];
        // Build the selector by joining the options with comma
        const selector = priorityList
            .map(
                (type) =>
                    `p[data-plan-type="${planType}"] ${SELECTOR_MAS_INLINE_PRICE}[data-offer-type="${type}"]`,
            )
            .join(', ');

        const el = this.querySelector(selector);
        return el?.dataset?.wcsOsi;
    }

    connectedCallback() {
        this.#upgradeProperties();
        this.#resolveConnected();
        this.addEventListener(EVENT_TYPE_RESOLVED, this.updatePlanType);
        if (this.background) {
            this.style.setProperty('--merch-addon-background', this.background);
        }
    }

    disconnectedCallback() {
        this.removeEventListener(EVENT_TYPE_RESOLVED, this.updatePlanType);
    }

    updatePlanType(e) {
        if (e.target.tagName !== 'SPAN') return;
        const price = e.target;
        const offer = price?.value?.[0];
        if (!offer) return;
        price.setAttribute('data-offer-type', offer.offerType);
        const p = price.closest('p');
        // Respect an already-set plan type (authored explicitly, or already
        // claimed by another <p> resolving to the same plan type) so two
        // blocks never simultaneously display the same plan type.
        if (p.getAttribute('data-plan-type')) return;
        const claimedBy = this.querySelector(
            `p[data-plan-type="${offer.planType}"]`,
        );
        if (claimedBy && claimedBy !== p) return;
        p.setAttribute('data-plan-type', offer.planType);
    }

    handleChange(e) {
        this.checked = e.target.checked;
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { checked: this.checked },
                bubbles: true,
                composed: true,
            }),
        );
    }

    handleCustomClick() {
        const addonCheckbox = this.shadowRoot.querySelector('input');
        addonCheckbox.click();
    }

    handleKeyDown(e) {
        if (e.key === ' ') {
            e.preventDefault();
            this.handleCustomClick();
        }
    }

    #render() {
        if (!this.#rendered) {
            this.#rendered = true;
            this.shadowRoot.innerHTML = MARKUP;
            this.shadowRoot
                .querySelector('input')
                .addEventListener('change', this.handleChange);
            const custom = this.shadowRoot.querySelector('#custom-checkbox');
            custom.addEventListener('click', this.handleCustomClick);
            custom.addEventListener('keydown', this.handleKeyDown);
        }
        const { checked } = this;
        this.shadowRoot.querySelector('input').checked = checked;
        this.shadowRoot
            .querySelector('#custom-checkbox')
            .setAttribute('aria-checked', String(checked));
    }

    static styles = css`
        :host {
            --merch-addon-gap: 9px;
            --merch-addon-align: start;
            --merch-addon-checkbox-size: unset;
            --merch-addon-checkbox-border: unset;
            --merch-addon-checkbox-radius: unset;
            --merch-addon-checkbox-checked-bg: unset;
            --merch-addon-checkbox-checked-color: unset;
            --merch-addon-label-size: unset;
            --merch-addon-label-color: unset;
            --merch-addon-label-line-height: unset;
            display: flex;
            gap: var(--merch-addon-gap);
            align-items: var(--merch-addon-align);
            cursor: pointer;
        }

        :host([custom-checkbox]) #addon-checkbox {
            display: none;
        }

        :host([custom-checkbox]) #custom-checkbox {
            display: block;
        }

        :host #custom-checkbox {
            display: none;
            width: var(--merch-addon-checkbox-size);
            height: var(--merch-addon-checkbox-size);
            border: var(--merch-addon-checkbox-border);
            border-radius: var(--merch-addon-checkbox-radius);
            box-sizing: border-box;
            background: var(--merch-addon-checkbox-bg, transparent);
        }

        :host #addon-checkbox:checked + #custom-checkbox {
            background: var(--merch-addon-checkbox-checked-bg) no-repeat
                var(
                    --merch-addon-checkbox-checked-bg-color,
                    var(--merch-addon-checkbox-checked-color)
                );
            border-color: var(--merch-addon-checkbox-checked-color);
        }

        ::slotted(p:not([data-plan-type])) {
            color: var(--merch-addon-label-color);
            font-size: var(--merch-addon-label-size);
            line-height: var(--merch-addon-label-line-height);
            font-style: normal;
            font-weight: var(--merch-addon-label-weight, 400);
            cursor: pointer;
        }

        ::slotted(p[data-plan-type]) {
            display: none;
        }

        :host([plan-type='PUF']) ::slotted(p[data-plan-type='PUF']) {
            display: block;
        }

        :host([plan-type='ABM']) ::slotted(p[data-plan-type='ABM']) {
            display: block;
        }

        :host([plan-type='M2M']) ::slotted(p[data-plan-type='M2M']) {
            display: block;
        }
    `;
}

const sheet = new CSSStyleSheet();
sheet.replaceSync(MerchAddon.styles);

customElements.define('merch-addon', MerchAddon);
