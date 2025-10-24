var E = Object.defineProperty;
var l = (o, e, t) =>
    e in o
        ? E(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t })
        : (o[e] = t);
var i = (o, e, t) => l(o, typeof e != 'symbol' ? e + '' : e, t);
import { html as p, LitElement as m } from '/deps/lit-all.min.js';
import { css as d } from '/deps/lit-all.min.js';
var a = d`
    :host {
        --merch-radio: rgba(82, 88, 228);
        --merch-radio-hover: rgba(64, 70, 202);
        --merch-radio-down: rgba(50, 54, 168);
        --merch-radio-selected: rgb(2, 101, 220);
        --merch-hovered-shadow: 0 0 0 1px #aaa;
        --merch-selected-shadow: 0 0 0 2px var(--merch-radio-selected);
        box-sizing: border-box;
    }
    .merch-Radio {
        align-items: flex-start;
        display: flex;
        max-inline-size: 100%;
        margin-inline-end: 19px;
        min-block-size: 32px;
        position: relative;
        vertical-align: top;
    }

    .merch-Radio-input {
        block-size: 100%;
        box-sizing: border-box;
        cursor: pointer;
        font-family: inherit;
        font-size: 100%;
        inline-size: 100%;
        line-height: 1.3;
        margin: 0;
        opacity: 0;
        overflow: visible;
        padding: 0;
        position: absolute;
        z-index: 1;
    }

    .merch-Radio-button {
        block-size: 14px;
        box-sizing: border-box;
        flex-grow: 0;
        flex-shrink: 0;
        inline-size: 14px;
        margin-block-start: 9px;
        position: relative;
    }

    .merch-Radio-button:before {
        border-color: rgb(109, 109, 109);
        border-radius: 50%;
        border-style: solid;
        border-width: 2px;
        box-sizing: border-box;
        content: '';
        display: block;
        height: 14px;
        position: absolute;
        transition:
            border 0.13s ease-in-out,
            box-shadow 0.13s ease-in-out;
        width: 14px;
        z-index: 0;
    }

    .merch-Radio-button:after {
        border-radius: 50%;
        content: '';
        display: block;
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
        transition:
            opacity 0.13s ease-out,
            margin 0.13s ease-out;
    }

    :host(:active) .merch-Radio-button:before {
        border-color: var(--merch-radio-down);
    }

    :host(:hover) .merch-Radio-button:before {
        border-color: var(--merch-radio-hover);
    }

    :host([aria-selected]) .merch-Radio-button::before {
        border-color: var(--merch-radio-selected);
        border-width: 5px;
    }

    .merch-Radio-label {
        color: rgb(34, 34, 34);
        font-size: 14px;
        line-height: 18.2px;
        margin-block-end: 9px;
        margin-block-start: 6px;
        margin-inline-start: 10px;
        text-align: start;
        transition: color 0.13s ease-in-out;
    }

    input {
        height: 0;
        outline: none;
        position: absolute;
        width: 0;
        z-index: -1;
    }

    .label {
        background-color: white;
        border: 1px solid transparent;
        border-radius: var(--consonant-merch-spacing-xxxs);
        cursor: pointer;
        display: block;
        margin: var(--consonant-merch-spacing-xs) 0;
        padding: var(--consonant-merch-spacing-xs);
        position: relative;
    }

    label:hover {
        box-shadow: var(--merch-hovered-shadow);
    }

    :host([aria-selected]) label {
        box-shadow: var(--merch-selected-shadow);
    }

    sp-icon-info-outline {
        color: #6e6e6e;
        content: '';
    }

    ::slotted(p),
    ::slotted(h5) {
        margin: 0;
    }

    ::slotted([slot='commitment']) {
        font-size: 14px !important;
        font-weight: normal !important;
        line-height: 17px !important;
    }

    #condition {
        line-height: 15px;
    }

    ::slotted([slot='condition']) {
        display: inline-block;
        font-style: italic;
        font-size: 12px;
    }

    ::slotted([slot='teaser']) {
        color: #2d9d78;
        font-size: 14px;
        font-weight: bold;
        line-height: 17px;
    }

    :host([type='subscription-option']) slot[name='price'] {
        display: flex;
        flex-direction: row-reverse;
        align-self: baseline;
        gap: 6px;
    }

    ::slotted(span[is='inline-price']) {
        font-size: 16px;
        font-weight: bold;
        line-height: 20px;
    }

    ::slotted(span[data-template='strikethrough']) {
        font-weight: normal;
    }

    :host([type='subscription-option']) {
        background-color: #fff;
        box-sizing: border-box;
        border-width: 2px;
        border-radius: 5px;
        border-style: solid;
        border-color: #eaeaea;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        min-height: 102px;
    }

    :host([type='subscription-option']:hover) {
        border-color: #cacaca;
    }

    :host([type='subscription-option'][aria-selected]) {
        border-color: #1473e6;
    }

    :host([type='subscription-option']) #condition {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    :host([type='subscription-option'])
        ::slotted([is='inline-price'][data-display-tax='true']) {
        position: relative;
        height: 40px;
    }
`;
var b = Object.freeze({
        MONTH: 'MONTH',
        YEAR: 'YEAR',
        TWO_YEARS: 'TWO_YEARS',
        THREE_YEARS: 'THREE_YEARS',
        PERPETUAL: 'PERPETUAL',
        TERM_LICENSE: 'TERM_LICENSE',
        ACCESS_PASS: 'ACCESS_PASS',
        THREE_MONTHS: 'THREE_MONTHS',
        SIX_MONTHS: 'SIX_MONTHS',
    }),
    u = Object.freeze({
        ANNUAL: 'ANNUAL',
        MONTHLY: 'MONTHLY',
        TWO_YEARS: 'TWO_YEARS',
        THREE_YEARS: 'THREE_YEARS',
        P1D: 'P1D',
        P1Y: 'P1Y',
        P3Y: 'P3Y',
        P10Y: 'P10Y',
        P15Y: 'P15Y',
        P3D: 'P3D',
        P7D: 'P7D',
        P30D: 'P30D',
        HALF_YEARLY: 'HALF_YEARLY',
        QUARTERLY: 'QUARTERLY',
    });
var _ = 'span[is="inline-price"][data-wcs-osi]',
    n =
        'a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';
var h = 'a[is="upt-link"]',
    S = `${_},${n},${h}`,
    c = 'merch-offer:ready';
var N = Object.freeze({
    SEGMENTATION: 'segmentation',
    BUNDLE: 'bundle',
    COMMITMENT: 'commitment',
    RECOMMENDATION: 'recommendation',
    EMAIL: 'email',
    PAYMENT: 'payment',
    CHANGE_PLAN_TEAM_PLANS: 'change-plan/team-upgrade/plans',
    CHANGE_PLAN_TEAM_PAYMENT: 'change-plan/team-upgrade/payment',
});
var g = Object.freeze({
    STAGE: 'STAGE',
    PRODUCTION: 'PRODUCTION',
    LOCAL: 'LOCAL',
});
var A = 'merch-offer',
    r = class extends m {
        constructor() {
            super();
            i(this, 'tr');
            (this.type = 'radio'), (this.selected = !1);
        }
        getOptionValue(t) {
            return this.querySelector(`[slot="${t}"]`);
        }
        connectedCallback() {
            super.connectedCallback(),
                this.initOffer(),
                (this.configuration = this.closest('quantity-selector')),
                !this.hasAttribute('tabindex') &&
                    !this.configuration &&
                    (this.tabIndex = 0),
                !this.hasAttribute('role') &&
                    !this.configuration &&
                    (this.role = 'radio');
        }
        get asRadioOption() {
            return p` <div class="merch-Radio">
            <input tabindex="-1" type="radio" class="merch-Radio-input" />
            <span class="merch-Radio-button"></span>
            <span class="merch-Radio-label">${this.text}</span>
        </div>`;
        }
        get asSubscriptionOption() {
            return p`<slot name="commitment"></slot>
            <slot name="price"></slot>
            <slot name="teaser"></slot>
            <div id="condition">
                <slot name="condition"></slot>
                <span id="info">
                    <sp-icon-info-outline size="s"></sp-icon-info-outline
                ></span>
                <sp-overlay placement="top" trigger="info@hover" type="hint">
                    <sp-tooltip
                        ><slot name="condition-tooltip"></slot
                    ></sp-tooltip>
                </sp-overlay>
            </div>`;
        }
        render() {
            return this.configuration || !this.price
                ? ''
                : this.type === 'subscription-option'
                  ? this.asSubscriptionOption
                  : this.asRadioOption;
        }
        get price() {
            return this.querySelector(
                'span[is="inline-price"]:not([data-template="strikethrough"])',
            );
        }
        get cta() {
            return this.querySelector(n);
        }
        get prices() {
            return this.querySelectorAll('span[is="inline-price"]');
        }
        get customerSegment() {
            return this.price?.value?.[0].customerSegment;
        }
        get marketSegment() {
            return this.price?.value?.[0].marketSegments[0];
        }
        async initOffer() {
            if (!this.price) return;
            this.prices.forEach((s) => s.setAttribute('slot', 'price')),
                await this.updateComplete,
                await Promise.all([...this.prices].map((s) => s.onceSettled()));
            let {
                value: [t],
            } = this.price;
            (this.planType = t.planType),
                await this.updateComplete,
                this.dispatchEvent(new CustomEvent(c, { bubbles: !0 }));
        }
    };
i(r, 'properties', {
    text: { type: String },
    selected: { type: Boolean, attribute: 'aria-selected', reflect: !0 },
    badgeText: { type: String, attribute: 'badge-text' },
    type: { type: String, attribute: 'type', reflect: !0 },
    planType: { type: String, attribute: 'plan-type', reflect: !0 },
}),
    i(r, 'styles', [a]);
customElements.define(A, r);
