var Dt = Object.defineProperty;
var ct = (o) => {
    throw TypeError(o);
};
var Ut = (o, t, e) =>
    t in o
        ? Dt(o, t, { enumerable: !0, configurable: !0, writable: !0, value: e })
        : (o[t] = e);
var A = (o, t, e) => Ut(o, typeof t != 'symbol' ? t + '' : t, e),
    ht = (o, t, e) => t.has(o) || ct('Cannot ' + e);
var B = (o, t, e) => (
        ht(o, t, 'read from private field'), e ? e.call(o) : t.get(o)
    ),
    dt = (o, t, e) =>
        t.has(o)
            ? ct('Cannot add the same private member more than once')
            : t instanceof WeakSet
              ? t.add(o)
              : t.set(o, e),
    pt = (o, t, e, s) => (
        ht(o, t, 'write to private field'), s ? s.call(o, e) : t.set(o, e), e
    );
var jt = Object.freeze({
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
    Wt = Object.freeze({
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
var It = 'span[is="inline-price"][data-wcs-osi]',
    G =
        'a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';
var kt = 'a[is="upt-link"]',
    Kt = `${It},${G},${kt}`,
    C = 'merch-offer:ready',
    ut = 'merch-offer-select:ready';
var Et = 'merch-offer:selected';
var q = 'merch-quantity-selector:change';
var Qt = Object.freeze({
    SEGMENTATION: 'segmentation',
    BUNDLE: 'bundle',
    COMMITMENT: 'commitment',
    RECOMMENDATION: 'recommendation',
    EMAIL: 'email',
    PAYMENT: 'payment',
    CHANGE_PLAN_TEAM_PLANS: 'change-plan/team-upgrade/plans',
    CHANGE_PLAN_TEAM_PAYMENT: 'change-plan/team-upgrade/payment',
});
var Xt = Object.freeze({
    STAGE: 'STAGE',
    PRODUCTION: 'PRODUCTION',
    LOCAL: 'LOCAL',
});
var y,
    R = class extends _ {
        constructor() {
            super();
            dt(this, y);
            (this.defaults = {}), (this.variant = 'plans');
        }
        saveContainerDefaultValues() {
            let e = this.closest(this.getAttribute('container')),
                s = e
                    ?.querySelector('[slot="description"]:not(merch-offer > *)')
                    ?.cloneNode(!0),
                i = e?.badgeText;
            return { description: s, badgeText: i };
        }
        getSlottedElement(e, s) {
            return (
                s || this.closest(this.getAttribute('container'))
            ).querySelector(`[slot="${e}"]:not(merch-offer > *)`);
        }
        updateSlot(e, s) {
            let i = this.getSlottedElement(e, s);
            if (!i) return;
            let n = this.selectedOffer.getOptionValue(e)
                ? this.selectedOffer.getOptionValue(e)
                : this.defaults[e];
            n && i.replaceWith(n.cloneNode(!0));
        }
        handleOfferSelection(e) {
            let s = e.detail;
            this.selectOffer(s);
        }
        handleOfferSelectionByQuantity(e) {
            let s = e.detail.option,
                i = Number.parseInt(s),
                n = this.findAppropriateOffer(i);
            this.selectOffer(n),
                this.getSlottedElement('cta').setAttribute('data-quantity', i);
        }
        selectOffer(e) {
            if (!e) return;
            let s = this.selectedOffer;
            s && (s.selected = !1),
                (e.selected = !0),
                (this.selectedOffer = e),
                (this.planType = e.planType),
                this.updateContainer(),
                this.updateComplete.then(() => {
                    this.dispatchEvent(
                        new CustomEvent(Et, { detail: this, bubbles: !0 }),
                    );
                });
        }
        findAppropriateOffer(e) {
            let s = null;
            return (
                this.offers.find((n) => {
                    let r = Number.parseInt(n.getAttribute('value'));
                    if (r === e) return !0;
                    if (r > e) return !1;
                    s = n;
                }) || s
            );
        }
        updateBadgeText(e) {
            this.selectedOffer.badgeText === ''
                ? (e.badgeText = null)
                : this.selectedOffer.badgeText
                  ? (e.badgeText = this.selectedOffer.badgeText)
                  : (e.badgeText = this.defaults.badgeText);
        }
        updateContainer() {
            let e = this.closest(this.getAttribute('container'));
            !e ||
                !this.selectedOffer ||
                (this.updateSlot('cta', e),
                this.updateSlot('secondary-cta', e),
                this.updateSlot('price', e),
                !this.manageableMode &&
                    (this.updateSlot('description', e),
                    this.updateBadgeText(e)));
        }
        render() {
            return N`<fieldset><slot class="${this.variant}"></slot></fieldset>`;
        }
        connectedCallback() {
            super.connectedCallback(),
                this.addEventListener('focusin', this.handleFocusin),
                this.addEventListener('click', this.handleFocusin),
                this.addEventListener(C, this.handleOfferSelectReady);
            let e = this.closest('merch-quantity-select');
            (this.manageableMode = e),
                (this.offers = [...this.querySelectorAll('merch-offer')]),
                pt(this, y, this.handleOfferSelectionByQuantity.bind(this)),
                this.manageableMode
                    ? e.addEventListener(q, B(this, y))
                    : (this.defaults = this.saveContainerDefaultValues()),
                (this.selectedOffer = this.offers[0]),
                this.planType && this.updateContainer();
        }
        get miniCompareMobileCard() {
            return (
                this.merchCard?.variant === 'mini-compare-chart' &&
                this.isMobile
            );
        }
        get merchCard() {
            return this.closest('merch-card');
        }
        get isMobile() {
            return window.matchMedia('(max-width: 767px)').matches;
        }
        disconnectedCallback() {
            super.disconnectedCallback(),
                this.removeEventListener(q, B(this, y)),
                this.removeEventListener(C, this.handleOfferSelectReady),
                this.removeEventListener('focusin', this.handleFocusin),
                this.removeEventListener('click', this.handleFocusin);
        }
        get price() {
            return this.querySelector(
                'merch-offer[aria-selected] [is="inline-price"]',
            );
        }
        get customerSegment() {
            return this.selectedOffer?.customerSegment;
        }
        get marketSegment() {
            return this.selectedOffer?.marketSegment;
        }
        handleFocusin(e) {
            e.target?.nodeName === 'MERCH-OFFER' &&
                (e.preventDefault(),
                e.stopImmediatePropagation(),
                this.selectOffer(e.target));
        }
        async handleOfferSelectReady() {
            this.planType ||
                this.querySelector('merch-offer:not([plan-type])') ||
                ((this.planType = this.selectedOffer.planType),
                await this.updateComplete,
                this.selectOffer(
                    this.selectedOffer ??
                        this.querySelector('merch-offer[aria-selected]') ??
                        this.querySelector('merch-offer'),
                ),
                this.dispatchEvent(new CustomEvent(ut, { bubbles: !0 })));
        }
    };
(y = new WeakMap()),
    A(
        R,
        'styles',
        O`
        :host {
            display: inline-block;
        }

        :host .horizontal {
            display: flex;
            flex-direction: row;
        }

        fieldset {
            display: contents;
        }

        :host([variant='subscription-options']) {
            display: flex;
            flex-direction: column;
            gap: var(--consonant-merch-spacing-xs);
        }
    `,
    ),
    A(R, 'properties', {
        offers: { type: Array },
        selectedOffer: { type: Object },
        defaults: { type: Object },
        variant: { type: String, attribute: 'variant', reflect: !0 },
        planType: { type: String, attribute: 'plan-type', reflect: !0 },
        stock: { type: Boolean, reflect: !0 },
    });
customElements.define('merch-offer-select', R);
var k = window,
    V =
        k.ShadowRoot &&
        (k.ShadyCSS === void 0 || k.ShadyCSS.nativeShadow) &&
        'adoptedStyleSheets' in Document.prototype &&
        'replace' in CSSStyleSheet.prototype,
    j = Symbol(),
    _t = new WeakMap(),
    L = class {
        constructor(t, e, s) {
            if (((this._$cssResult$ = !0), s !== j))
                throw Error(
                    'CSSResult is not constructable. Use `unsafeCSS` or `css` instead.',
                );
            (this.cssText = t), (this.t = e);
        }
        get styleSheet() {
            let t = this.o,
                e = this.t;
            if (V && t === void 0) {
                let s = e !== void 0 && e.length === 1;
                s && (t = _t.get(e)),
                    t === void 0 &&
                        ((this.o = t = new CSSStyleSheet()).replaceSync(
                            this.cssText,
                        ),
                        s && _t.set(e, t));
            }
            return t;
        }
        toString() {
            return this.cssText;
        }
    },
    ft = (o) => new L(typeof o == 'string' ? o : o + '', void 0, j),
    O = (o, ...t) => {
        let e =
            o.length === 1
                ? o[0]
                : t.reduce(
                      (s, i, n) =>
                          s +
                          ((r) => {
                              if (r._$cssResult$ === !0) return r.cssText;
                              if (typeof r == 'number') return r;
                              throw Error(
                                  "Value passed to 'css' function must be a 'css' function result: " +
                                      r +
                                      ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.",
                              );
                          })(i) +
                          o[n + 1],
                      o[0],
                  );
        return new L(e, o, j);
    },
    W = (o, t) => {
        V
            ? (o.adoptedStyleSheets = t.map((e) =>
                  e instanceof CSSStyleSheet ? e : e.styleSheet,
              ))
            : t.forEach((e) => {
                  let s = document.createElement('style'),
                      i = k.litNonce;
                  i !== void 0 && s.setAttribute('nonce', i),
                      (s.textContent = e.cssText),
                      o.appendChild(s);
              });
    },
    Y = V
        ? (o) => o
        : (o) =>
              o instanceof CSSStyleSheet
                  ? ((t) => {
                        let e = '';
                        for (let s of t.cssRules) e += s.cssText;
                        return ft(e);
                    })(o)
                  : o;
var K,
    F = window,
    mt = F.trustedTypes,
    Vt = mt ? mt.emptyScript : '',
    At = F.reactiveElementPolyfillSupport,
    X = {
        toAttribute(o, t) {
            switch (t) {
                case Boolean:
                    o = o ? Vt : null;
                    break;
                case Object:
                case Array:
                    o = o == null ? o : JSON.stringify(o);
            }
            return o;
        },
        fromAttribute(o, t) {
            let e = o;
            switch (t) {
                case Boolean:
                    e = o !== null;
                    break;
                case Number:
                    e = o === null ? null : Number(o);
                    break;
                case Object:
                case Array:
                    try {
                        e = JSON.parse(o);
                    } catch {
                        e = null;
                    }
            }
            return e;
        },
    },
    vt = (o, t) => t !== o && (t == t || o == o),
    Q = {
        attribute: !0,
        type: String,
        converter: X,
        reflect: !1,
        hasChanged: vt,
    },
    J = 'finalized',
    f = class extends HTMLElement {
        constructor() {
            super(),
                (this._$Ei = new Map()),
                (this.isUpdatePending = !1),
                (this.hasUpdated = !1),
                (this._$El = null),
                this._$Eu();
        }
        static addInitializer(t) {
            var e;
            this.finalize(),
                ((e = this.h) !== null && e !== void 0
                    ? e
                    : (this.h = [])
                ).push(t);
        }
        static get observedAttributes() {
            this.finalize();
            let t = [];
            return (
                this.elementProperties.forEach((e, s) => {
                    let i = this._$Ep(s, e);
                    i !== void 0 && (this._$Ev.set(i, s), t.push(i));
                }),
                t
            );
        }
        static createProperty(t, e = Q) {
            if (
                (e.state && (e.attribute = !1),
                this.finalize(),
                this.elementProperties.set(t, e),
                !e.noAccessor && !this.prototype.hasOwnProperty(t))
            ) {
                let s = typeof t == 'symbol' ? Symbol() : '__' + t,
                    i = this.getPropertyDescriptor(t, s, e);
                i !== void 0 && Object.defineProperty(this.prototype, t, i);
            }
        }
        static getPropertyDescriptor(t, e, s) {
            return {
                get() {
                    return this[e];
                },
                set(i) {
                    let n = this[t];
                    (this[e] = i), this.requestUpdate(t, n, s);
                },
                configurable: !0,
                enumerable: !0,
            };
        }
        static getPropertyOptions(t) {
            return this.elementProperties.get(t) || Q;
        }
        static finalize() {
            if (this.hasOwnProperty(J)) return !1;
            this[J] = !0;
            let t = Object.getPrototypeOf(this);
            if (
                (t.finalize(),
                t.h !== void 0 && (this.h = [...t.h]),
                (this.elementProperties = new Map(t.elementProperties)),
                (this._$Ev = new Map()),
                this.hasOwnProperty('properties'))
            ) {
                let e = this.properties,
                    s = [
                        ...Object.getOwnPropertyNames(e),
                        ...Object.getOwnPropertySymbols(e),
                    ];
                for (let i of s) this.createProperty(i, e[i]);
            }
            return (this.elementStyles = this.finalizeStyles(this.styles)), !0;
        }
        static finalizeStyles(t) {
            let e = [];
            if (Array.isArray(t)) {
                let s = new Set(t.flat(1 / 0).reverse());
                for (let i of s) e.unshift(Y(i));
            } else t !== void 0 && e.push(Y(t));
            return e;
        }
        static _$Ep(t, e) {
            let s = e.attribute;
            return s === !1
                ? void 0
                : typeof s == 'string'
                  ? s
                  : typeof t == 'string'
                    ? t.toLowerCase()
                    : void 0;
        }
        _$Eu() {
            var t;
            (this._$E_ = new Promise((e) => (this.enableUpdating = e))),
                (this._$AL = new Map()),
                this._$Eg(),
                this.requestUpdate(),
                (t = this.constructor.h) === null ||
                    t === void 0 ||
                    t.forEach((e) => e(this));
        }
        addController(t) {
            var e, s;
            ((e = this._$ES) !== null && e !== void 0
                ? e
                : (this._$ES = [])
            ).push(t),
                this.renderRoot !== void 0 &&
                    this.isConnected &&
                    ((s = t.hostConnected) === null ||
                        s === void 0 ||
                        s.call(t));
        }
        removeController(t) {
            var e;
            (e = this._$ES) === null ||
                e === void 0 ||
                e.splice(this._$ES.indexOf(t) >>> 0, 1);
        }
        _$Eg() {
            this.constructor.elementProperties.forEach((t, e) => {
                this.hasOwnProperty(e) &&
                    (this._$Ei.set(e, this[e]), delete this[e]);
            });
        }
        createRenderRoot() {
            var t;
            let e =
                (t = this.shadowRoot) !== null && t !== void 0
                    ? t
                    : this.attachShadow(this.constructor.shadowRootOptions);
            return W(e, this.constructor.elementStyles), e;
        }
        connectedCallback() {
            var t;
            this.renderRoot === void 0 &&
                (this.renderRoot = this.createRenderRoot()),
                this.enableUpdating(!0),
                (t = this._$ES) === null ||
                    t === void 0 ||
                    t.forEach((e) => {
                        var s;
                        return (s = e.hostConnected) === null || s === void 0
                            ? void 0
                            : s.call(e);
                    });
        }
        enableUpdating(t) {}
        disconnectedCallback() {
            var t;
            (t = this._$ES) === null ||
                t === void 0 ||
                t.forEach((e) => {
                    var s;
                    return (s = e.hostDisconnected) === null || s === void 0
                        ? void 0
                        : s.call(e);
                });
        }
        attributeChangedCallback(t, e, s) {
            this._$AK(t, s);
        }
        _$EO(t, e, s = Q) {
            var i;
            let n = this.constructor._$Ep(t, s);
            if (n !== void 0 && s.reflect === !0) {
                let r = (
                    ((i = s.converter) === null || i === void 0
                        ? void 0
                        : i.toAttribute) !== void 0
                        ? s.converter
                        : X
                ).toAttribute(e, s.type);
                (this._$El = t),
                    r == null
                        ? this.removeAttribute(n)
                        : this.setAttribute(n, r),
                    (this._$El = null);
            }
        }
        _$AK(t, e) {
            var s;
            let i = this.constructor,
                n = i._$Ev.get(t);
            if (n !== void 0 && this._$El !== n) {
                let r = i.getPropertyOptions(n),
                    c =
                        typeof r.converter == 'function'
                            ? { fromAttribute: r.converter }
                            : ((s = r.converter) === null || s === void 0
                                    ? void 0
                                    : s.fromAttribute) !== void 0
                              ? r.converter
                              : X;
                (this._$El = n),
                    (this[n] = c.fromAttribute(e, r.type)),
                    (this._$El = null);
            }
        }
        requestUpdate(t, e, s) {
            let i = !0;
            t !== void 0 &&
                ((
                    (s = s || this.constructor.getPropertyOptions(t))
                        .hasChanged || vt
                )(this[t], e)
                    ? (this._$AL.has(t) || this._$AL.set(t, e),
                      s.reflect === !0 &&
                          this._$El !== t &&
                          (this._$EC === void 0 && (this._$EC = new Map()),
                          this._$EC.set(t, s)))
                    : (i = !1)),
                !this.isUpdatePending && i && (this._$E_ = this._$Ej());
        }
        async _$Ej() {
            this.isUpdatePending = !0;
            try {
                await this._$E_;
            } catch (e) {
                Promise.reject(e);
            }
            let t = this.scheduleUpdate();
            return t != null && (await t), !this.isUpdatePending;
        }
        scheduleUpdate() {
            return this.performUpdate();
        }
        performUpdate() {
            var t;
            if (!this.isUpdatePending) return;
            this.hasUpdated,
                this._$Ei &&
                    (this._$Ei.forEach((i, n) => (this[n] = i)),
                    (this._$Ei = void 0));
            let e = !1,
                s = this._$AL;
            try {
                (e = this.shouldUpdate(s)),
                    e
                        ? (this.willUpdate(s),
                          (t = this._$ES) === null ||
                              t === void 0 ||
                              t.forEach((i) => {
                                  var n;
                                  return (n = i.hostUpdate) === null ||
                                      n === void 0
                                      ? void 0
                                      : n.call(i);
                              }),
                          this.update(s))
                        : this._$Ek();
            } catch (i) {
                throw ((e = !1), this._$Ek(), i);
            }
            e && this._$AE(s);
        }
        willUpdate(t) {}
        _$AE(t) {
            var e;
            (e = this._$ES) === null ||
                e === void 0 ||
                e.forEach((s) => {
                    var i;
                    return (i = s.hostUpdated) === null || i === void 0
                        ? void 0
                        : i.call(s);
                }),
                this.hasUpdated ||
                    ((this.hasUpdated = !0), this.firstUpdated(t)),
                this.updated(t);
        }
        _$Ek() {
            (this._$AL = new Map()), (this.isUpdatePending = !1);
        }
        get updateComplete() {
            return this.getUpdateComplete();
        }
        getUpdateComplete() {
            return this._$E_;
        }
        shouldUpdate(t) {
            return !0;
        }
        update(t) {
            this._$EC !== void 0 &&
                (this._$EC.forEach((e, s) => this._$EO(s, this[s], e)),
                (this._$EC = void 0)),
                this._$Ek();
        }
        updated(t) {}
        firstUpdated(t) {}
    };
(f[J] = !0),
    (f.elementProperties = new Map()),
    (f.elementStyles = []),
    (f.shadowRootOptions = { mode: 'open' }),
    At?.({ ReactiveElement: f }),
    ((K = F.reactiveElementVersions) !== null && K !== void 0
        ? K
        : (F.reactiveElementVersions = [])
    ).push('1.6.3');
var Z,
    z = window,
    x = z.trustedTypes,
    gt = x ? x.createPolicy('lit-html', { createHTML: (o) => o }) : void 0,
    et = '$lit$',
    m = `lit$${(Math.random() + '').slice(9)}$`,
    Ct = '?' + m,
    Yt = `<${Ct}>`,
    S = document,
    w = () => S.createComment(''),
    M = (o) => o === null || (typeof o != 'object' && typeof o != 'function'),
    Rt = Array.isArray,
    Ft = (o) => Rt(o) || typeof o?.[Symbol.iterator] == 'function',
    tt = `[ 	
\f\r]`,
    P = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,
    St = /-->/g,
    bt = />/g,
    v = RegExp(
        `>|${tt}(?:([^\\s"'>=/]+)(${tt}*=${tt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,
        'g',
    ),
    yt = /'/g,
    xt = /"/g,
    Ot = /^(?:script|style|textarea|title)$/i,
    Nt =
        (o) =>
        (t, ...e) => ({ _$litType$: o, strings: t, values: e }),
    N = Nt(1),
    pe = Nt(2),
    b = Symbol.for('lit-noChange'),
    p = Symbol.for('lit-nothing'),
    $t = new WeakMap(),
    g = S.createTreeWalker(S, 129, null, !1);
function Lt(o, t) {
    if (!Array.isArray(o) || !o.hasOwnProperty('raw'))
        throw Error('invalid template strings array');
    return gt !== void 0 ? gt.createHTML(t) : t;
}
var zt = (o, t) => {
        let e = o.length - 1,
            s = [],
            i,
            n = t === 2 ? '<svg>' : '',
            r = P;
        for (let c = 0; c < e; c++) {
            let a = o[c],
                l,
                h,
                d = -1,
                u = 0;
            for (
                ;
                u < a.length &&
                ((r.lastIndex = u), (h = r.exec(a)), h !== null);

            )
                (u = r.lastIndex),
                    r === P
                        ? h[1] === '!--'
                            ? (r = St)
                            : h[1] !== void 0
                              ? (r = bt)
                              : h[2] !== void 0
                                ? (Ot.test(h[2]) &&
                                      (i = RegExp('</' + h[2], 'g')),
                                  (r = v))
                                : h[3] !== void 0 && (r = v)
                        : r === v
                          ? h[0] === '>'
                              ? ((r = i ?? P), (d = -1))
                              : h[1] === void 0
                                ? (d = -2)
                                : ((d = r.lastIndex - h[2].length),
                                  (l = h[1]),
                                  (r =
                                      h[3] === void 0
                                          ? v
                                          : h[3] === '"'
                                            ? xt
                                            : yt))
                          : r === xt || r === yt
                            ? (r = v)
                            : r === St || r === bt
                              ? (r = P)
                              : ((r = v), (i = void 0));
            let E = r === v && o[c + 1].startsWith('/>') ? ' ' : '';
            n +=
                r === P
                    ? a + Yt
                    : d >= 0
                      ? (s.push(l), a.slice(0, d) + et + a.slice(d) + m + E)
                      : a + m + (d === -2 ? (s.push(void 0), c) : E);
        }
        return [Lt(o, n + (o[e] || '<?>') + (t === 2 ? '</svg>' : '')), s];
    },
    H = class o {
        constructor({ strings: t, _$litType$: e }, s) {
            let i;
            this.parts = [];
            let n = 0,
                r = 0,
                c = t.length - 1,
                a = this.parts,
                [l, h] = zt(t, e);
            if (
                ((this.el = o.createElement(l, s)),
                (g.currentNode = this.el.content),
                e === 2)
            ) {
                let d = this.el.content,
                    u = d.firstChild;
                u.remove(), d.append(...u.childNodes);
            }
            for (; (i = g.nextNode()) !== null && a.length < c; ) {
                if (i.nodeType === 1) {
                    if (i.hasAttributes()) {
                        let d = [];
                        for (let u of i.getAttributeNames())
                            if (u.endsWith(et) || u.startsWith(m)) {
                                let E = h[r++];
                                if ((d.push(u), E !== void 0)) {
                                    let Ht = i
                                            .getAttribute(E.toLowerCase() + et)
                                            .split(m),
                                        I = /([.?@])?(.*)/.exec(E);
                                    a.push({
                                        type: 1,
                                        index: n,
                                        name: I[2],
                                        strings: Ht,
                                        ctor:
                                            I[1] === '.'
                                                ? it
                                                : I[1] === '?'
                                                  ? ot
                                                  : I[1] === '@'
                                                    ? rt
                                                    : T,
                                    });
                                } else a.push({ type: 6, index: n });
                            }
                        for (let u of d) i.removeAttribute(u);
                    }
                    if (Ot.test(i.tagName)) {
                        let d = i.textContent.split(m),
                            u = d.length - 1;
                        if (u > 0) {
                            i.textContent = x ? x.emptyScript : '';
                            for (let E = 0; E < u; E++)
                                i.append(d[E], w()),
                                    g.nextNode(),
                                    a.push({ type: 2, index: ++n });
                            i.append(d[u], w());
                        }
                    }
                } else if (i.nodeType === 8)
                    if (i.data === Ct) a.push({ type: 2, index: n });
                    else {
                        let d = -1;
                        for (; (d = i.data.indexOf(m, d + 1)) !== -1; )
                            a.push({ type: 7, index: n }), (d += m.length - 1);
                    }
                n++;
            }
        }
        static createElement(t, e) {
            let s = S.createElement('template');
            return (s.innerHTML = t), s;
        }
    };
function $(o, t, e = o, s) {
    var i, n, r, c;
    if (t === b) return t;
    let a =
            s !== void 0
                ? (i = e._$Co) === null || i === void 0
                    ? void 0
                    : i[s]
                : e._$Cl,
        l = M(t) ? void 0 : t._$litDirective$;
    return (
        a?.constructor !== l &&
            ((n = a?._$AO) === null || n === void 0 || n.call(a, !1),
            l === void 0 ? (a = void 0) : ((a = new l(o)), a._$AT(o, e, s)),
            s !== void 0
                ? (((r = (c = e)._$Co) !== null && r !== void 0
                      ? r
                      : (c._$Co = []))[s] = a)
                : (e._$Cl = a)),
        a !== void 0 && (t = $(o, a._$AS(o, t.values), a, s)),
        t
    );
}
var st = class {
        constructor(t, e) {
            (this._$AV = []),
                (this._$AN = void 0),
                (this._$AD = t),
                (this._$AM = e);
        }
        get parentNode() {
            return this._$AM.parentNode;
        }
        get _$AU() {
            return this._$AM._$AU;
        }
        u(t) {
            var e;
            let {
                    el: { content: s },
                    parts: i,
                } = this._$AD,
                n = (
                    (e = t?.creationScope) !== null && e !== void 0 ? e : S
                ).importNode(s, !0);
            g.currentNode = n;
            let r = g.nextNode(),
                c = 0,
                a = 0,
                l = i[0];
            for (; l !== void 0; ) {
                if (c === l.index) {
                    let h;
                    l.type === 2
                        ? (h = new D(r, r.nextSibling, this, t))
                        : l.type === 1
                          ? (h = new l.ctor(r, l.name, l.strings, this, t))
                          : l.type === 6 && (h = new nt(r, this, t)),
                        this._$AV.push(h),
                        (l = i[++a]);
                }
                c !== l?.index && ((r = g.nextNode()), c++);
            }
            return (g.currentNode = S), n;
        }
        v(t) {
            let e = 0;
            for (let s of this._$AV)
                s !== void 0 &&
                    (s.strings !== void 0
                        ? (s._$AI(t, s, e), (e += s.strings.length - 2))
                        : s._$AI(t[e])),
                    e++;
        }
    },
    D = class o {
        constructor(t, e, s, i) {
            var n;
            (this.type = 2),
                (this._$AH = p),
                (this._$AN = void 0),
                (this._$AA = t),
                (this._$AB = e),
                (this._$AM = s),
                (this.options = i),
                (this._$Cp =
                    (n = i?.isConnected) === null || n === void 0 || n);
        }
        get _$AU() {
            var t, e;
            return (e =
                (t = this._$AM) === null || t === void 0 ? void 0 : t._$AU) !==
                null && e !== void 0
                ? e
                : this._$Cp;
        }
        get parentNode() {
            let t = this._$AA.parentNode,
                e = this._$AM;
            return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
        }
        get startNode() {
            return this._$AA;
        }
        get endNode() {
            return this._$AB;
        }
        _$AI(t, e = this) {
            (t = $(this, t, e)),
                M(t)
                    ? t === p || t == null || t === ''
                        ? (this._$AH !== p && this._$AR(), (this._$AH = p))
                        : t !== this._$AH && t !== b && this._(t)
                    : t._$litType$ !== void 0
                      ? this.g(t)
                      : t.nodeType !== void 0
                        ? this.$(t)
                        : Ft(t)
                          ? this.T(t)
                          : this._(t);
        }
        k(t) {
            return this._$AA.parentNode.insertBefore(t, this._$AB);
        }
        $(t) {
            this._$AH !== t && (this._$AR(), (this._$AH = this.k(t)));
        }
        _(t) {
            this._$AH !== p && M(this._$AH)
                ? (this._$AA.nextSibling.data = t)
                : this.$(S.createTextNode(t)),
                (this._$AH = t);
        }
        g(t) {
            var e;
            let { values: s, _$litType$: i } = t,
                n =
                    typeof i == 'number'
                        ? this._$AC(t)
                        : (i.el === void 0 &&
                              (i.el = H.createElement(
                                  Lt(i.h, i.h[0]),
                                  this.options,
                              )),
                          i);
            if (
                ((e = this._$AH) === null || e === void 0 ? void 0 : e._$AD) ===
                n
            )
                this._$AH.v(s);
            else {
                let r = new st(n, this),
                    c = r.u(this.options);
                r.v(s), this.$(c), (this._$AH = r);
            }
        }
        _$AC(t) {
            let e = $t.get(t.strings);
            return e === void 0 && $t.set(t.strings, (e = new H(t))), e;
        }
        T(t) {
            Rt(this._$AH) || ((this._$AH = []), this._$AR());
            let e = this._$AH,
                s,
                i = 0;
            for (let n of t)
                i === e.length
                    ? e.push(
                          (s = new o(
                              this.k(w()),
                              this.k(w()),
                              this,
                              this.options,
                          )),
                      )
                    : (s = e[i]),
                    s._$AI(n),
                    i++;
            i < e.length &&
                (this._$AR(s && s._$AB.nextSibling, i), (e.length = i));
        }
        _$AR(t = this._$AA.nextSibling, e) {
            var s;
            for (
                (s = this._$AP) === null ||
                s === void 0 ||
                s.call(this, !1, !0, e);
                t && t !== this._$AB;

            ) {
                let i = t.nextSibling;
                t.remove(), (t = i);
            }
        }
        setConnected(t) {
            var e;
            this._$AM === void 0 &&
                ((this._$Cp = t),
                (e = this._$AP) === null || e === void 0 || e.call(this, t));
        }
    },
    T = class {
        constructor(t, e, s, i, n) {
            (this.type = 1),
                (this._$AH = p),
                (this._$AN = void 0),
                (this.element = t),
                (this.name = e),
                (this._$AM = i),
                (this.options = n),
                s.length > 2 || s[0] !== '' || s[1] !== ''
                    ? ((this._$AH = Array(s.length - 1).fill(new String())),
                      (this.strings = s))
                    : (this._$AH = p);
        }
        get tagName() {
            return this.element.tagName;
        }
        get _$AU() {
            return this._$AM._$AU;
        }
        _$AI(t, e = this, s, i) {
            let n = this.strings,
                r = !1;
            if (n === void 0)
                (t = $(this, t, e, 0)),
                    (r = !M(t) || (t !== this._$AH && t !== b)),
                    r && (this._$AH = t);
            else {
                let c = t,
                    a,
                    l;
                for (t = n[0], a = 0; a < n.length - 1; a++)
                    (l = $(this, c[s + a], e, a)),
                        l === b && (l = this._$AH[a]),
                        r || (r = !M(l) || l !== this._$AH[a]),
                        l === p
                            ? (t = p)
                            : t !== p && (t += (l ?? '') + n[a + 1]),
                        (this._$AH[a] = l);
            }
            r && !i && this.j(t);
        }
        j(t) {
            t === p
                ? this.element.removeAttribute(this.name)
                : this.element.setAttribute(this.name, t ?? '');
        }
    },
    it = class extends T {
        constructor() {
            super(...arguments), (this.type = 3);
        }
        j(t) {
            this.element[this.name] = t === p ? void 0 : t;
        }
    },
    Bt = x ? x.emptyScript : '',
    ot = class extends T {
        constructor() {
            super(...arguments), (this.type = 4);
        }
        j(t) {
            t && t !== p
                ? this.element.setAttribute(this.name, Bt)
                : this.element.removeAttribute(this.name);
        }
    },
    rt = class extends T {
        constructor(t, e, s, i, n) {
            super(t, e, s, i, n), (this.type = 5);
        }
        _$AI(t, e = this) {
            var s;
            if (
                (t =
                    (s = $(this, t, e, 0)) !== null && s !== void 0 ? s : p) ===
                b
            )
                return;
            let i = this._$AH,
                n =
                    (t === p && i !== p) ||
                    t.capture !== i.capture ||
                    t.once !== i.once ||
                    t.passive !== i.passive,
                r = t !== p && (i === p || n);
            n && this.element.removeEventListener(this.name, this, i),
                r && this.element.addEventListener(this.name, this, t),
                (this._$AH = t);
        }
        handleEvent(t) {
            var e, s;
            typeof this._$AH == 'function'
                ? this._$AH.call(
                      (s =
                          (e = this.options) === null || e === void 0
                              ? void 0
                              : e.host) !== null && s !== void 0
                          ? s
                          : this.element,
                      t,
                  )
                : this._$AH.handleEvent(t);
        }
    },
    nt = class {
        constructor(t, e, s) {
            (this.element = t),
                (this.type = 6),
                (this._$AN = void 0),
                (this._$AM = e),
                (this.options = s);
        }
        get _$AU() {
            return this._$AM._$AU;
        }
        _$AI(t) {
            $(this, t);
        }
    };
var Tt = z.litHtmlPolyfillSupport;
Tt?.(H, D),
    ((Z = z.litHtmlVersions) !== null && Z !== void 0
        ? Z
        : (z.litHtmlVersions = [])
    ).push('2.8.0');
var Pt = (o, t, e) => {
    var s, i;
    let n = (s = e?.renderBefore) !== null && s !== void 0 ? s : t,
        r = n._$litPart$;
    if (r === void 0) {
        let c = (i = e?.renderBefore) !== null && i !== void 0 ? i : null;
        n._$litPart$ = r = new D(t.insertBefore(w(), c), c, void 0, e ?? {});
    }
    return r._$AI(o), r;
};
var at, lt;
var _ = class extends f {
    constructor() {
        super(...arguments),
            (this.renderOptions = { host: this }),
            (this._$Do = void 0);
    }
    createRenderRoot() {
        var t, e;
        let s = super.createRenderRoot();
        return (
            ((t = (e = this.renderOptions).renderBefore) !== null &&
                t !== void 0) ||
                (e.renderBefore = s.firstChild),
            s
        );
    }
    update(t) {
        let e = this.render();
        this.hasUpdated || (this.renderOptions.isConnected = this.isConnected),
            super.update(t),
            (this._$Do = Pt(e, this.renderRoot, this.renderOptions));
    }
    connectedCallback() {
        var t;
        super.connectedCallback(),
            (t = this._$Do) === null || t === void 0 || t.setConnected(!0);
    }
    disconnectedCallback() {
        var t;
        super.disconnectedCallback(),
            (t = this._$Do) === null || t === void 0 || t.setConnected(!1);
    }
    render() {
        return b;
    }
};
(_.finalized = !0),
    (_._$litElement$ = !0),
    (at = globalThis.litElementHydrateSupport) === null ||
        at === void 0 ||
        at.call(globalThis, { LitElement: _ });
var wt = globalThis.litElementPolyfillSupport;
wt?.({ LitElement: _ });
((lt = globalThis.litElementVersions) !== null && lt !== void 0
    ? lt
    : (globalThis.litElementVersions = [])
).push('3.3.3');
var Mt = O`
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
var Gt = 'merch-offer',
    U = class extends _ {
        constructor() {
            super();
            A(this, 'tr');
            (this.type = 'radio'), (this.selected = !1);
        }
        getOptionValue(e) {
            return this.querySelector(`[slot="${e}"]`);
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
            return N` <div class="merch-Radio">
            <input tabindex="-1" type="radio" class="merch-Radio-input" />
            <span class="merch-Radio-button"></span>
            <span class="merch-Radio-label">${this.text}</span>
        </div>`;
        }
        get asSubscriptionOption() {
            return N`<slot name="commitment"></slot>
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
            return this.querySelector(G);
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
                value: [e],
            } = this.price;
            (this.planType = e.planType),
                await this.updateComplete,
                this.dispatchEvent(new CustomEvent(C, { bubbles: !0 }));
        }
    };
A(U, 'properties', {
    text: { type: String },
    selected: { type: Boolean, attribute: 'aria-selected', reflect: !0 },
    badgeText: { type: String, attribute: 'badge-text' },
    type: { type: String, attribute: 'type', reflect: !0 },
    planType: { type: String, attribute: 'plan-type', reflect: !0 },
}),
    A(U, 'styles', [Mt]);
customElements.define(Gt, U);
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
