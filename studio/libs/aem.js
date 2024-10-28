var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);

// ../node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t3, e4, o3) {
    if (this._$cssResult$ = true, o3 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t3, this.t = e4;
  }
  get styleSheet() {
    let t3 = this.o;
    const s2 = this.t;
    if (e && void 0 === t3) {
      const e4 = void 0 !== s2 && 1 === s2.length;
      e4 && (t3 = o.get(s2)), void 0 === t3 && ((this.o = t3 = new CSSStyleSheet()).replaceSync(this.cssText), e4 && o.set(s2, t3));
    }
    return t3;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, s);
var i = (t3, ...e4) => {
  const o3 = 1 === t3.length ? t3[0] : e4.reduce((e5, s2, o4) => e5 + ((t4) => {
    if (true === t4._$cssResult$) return t4.cssText;
    if ("number" == typeof t4) return t4;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s2) + t3[o4 + 1], t3[0]);
  return new n(o3, t3, s);
};
var S = (s2, o3) => {
  if (e) s2.adoptedStyleSheets = o3.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
  else for (const e4 of o3) {
    const o4 = document.createElement("style"), n4 = t.litNonce;
    void 0 !== n4 && o4.setAttribute("nonce", n4), o4.textContent = e4.cssText, s2.appendChild(o4);
  }
};
var c = e ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
  let e4 = "";
  for (const s2 of t4.cssRules) e4 += s2.cssText;
  return r(e4);
})(t3) : t3;

// ../node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: r2, getOwnPropertyNames: h, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t3, s2) => t3;
var u = { toAttribute(t3, s2) {
  switch (s2) {
    case Boolean:
      t3 = t3 ? l : null;
      break;
    case Object:
    case Array:
      t3 = null == t3 ? t3 : JSON.stringify(t3);
  }
  return t3;
}, fromAttribute(t3, s2) {
  let i5 = t3;
  switch (s2) {
    case Boolean:
      i5 = null !== t3;
      break;
    case Number:
      i5 = null === t3 ? null : Number(t3);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t3);
      } catch (t4) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t3, s2) => !i2(t3, s2);
var y = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), a.litPropertyMetadata ?? (a.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
var b = class extends HTMLElement {
  static addInitializer(t3) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t3);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t3, s2 = y) {
    if (s2.state && (s2.attribute = false), this._$Ei(), this.elementProperties.set(t3, s2), !s2.noAccessor) {
      const i5 = Symbol(), r4 = this.getPropertyDescriptor(t3, i5, s2);
      void 0 !== r4 && e2(this.prototype, t3, r4);
    }
  }
  static getPropertyDescriptor(t3, s2, i5) {
    const { get: e4, set: h3 } = r2(this.prototype, t3) ?? { get() {
      return this[s2];
    }, set(t4) {
      this[s2] = t4;
    } };
    return { get() {
      return e4?.call(this);
    }, set(s3) {
      const r4 = e4?.call(this);
      h3.call(this, s3), this.requestUpdate(t3, r4, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t3) {
    return this.elementProperties.get(t3) ?? y;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t3 = n2(this);
    t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t4 = this.properties, s2 = [...h(t4), ...o2(t4)];
      for (const i5 of s2) this.createProperty(i5, t4[i5]);
    }
    const t3 = this[Symbol.metadata];
    if (null !== t3) {
      const s2 = litPropertyMetadata.get(t3);
      if (void 0 !== s2) for (const [t4, i5] of s2) this.elementProperties.set(t4, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t4, s2] of this.elementProperties) {
      const i5 = this._$Eu(t4, s2);
      void 0 !== i5 && this._$Eh.set(i5, t4);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s2) {
    const i5 = [];
    if (Array.isArray(s2)) {
      const e4 = new Set(s2.flat(1 / 0).reverse());
      for (const s3 of e4) i5.unshift(c(s3));
    } else void 0 !== s2 && i5.push(c(s2));
    return i5;
  }
  static _$Eu(t3, s2) {
    const i5 = s2.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
  }
  addController(t3) {
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
  }
  removeController(t3) {
    this._$EO?.delete(t3);
  }
  _$E_() {
    const t3 = /* @__PURE__ */ new Map(), s2 = this.constructor.elementProperties;
    for (const i5 of s2.keys()) this.hasOwnProperty(i5) && (t3.set(i5, this[i5]), delete this[i5]);
    t3.size > 0 && (this._$Ep = t3);
  }
  createRenderRoot() {
    const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t3, this.constructor.elementStyles), t3;
  }
  connectedCallback() {
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), this._$EO?.forEach((t3) => t3.hostConnected?.());
  }
  enableUpdating(t3) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t3) => t3.hostDisconnected?.());
  }
  attributeChangedCallback(t3, s2, i5) {
    this._$AK(t3, i5);
  }
  _$EC(t3, s2) {
    const i5 = this.constructor.elementProperties.get(t3), e4 = this.constructor._$Eu(t3, i5);
    if (void 0 !== e4 && true === i5.reflect) {
      const r4 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s2, i5.type);
      this._$Em = t3, null == r4 ? this.removeAttribute(e4) : this.setAttribute(e4, r4), this._$Em = null;
    }
  }
  _$AK(t3, s2) {
    const i5 = this.constructor, e4 = i5._$Eh.get(t3);
    if (void 0 !== e4 && this._$Em !== e4) {
      const t4 = i5.getPropertyOptions(e4), r4 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : u;
      this._$Em = e4, this[e4] = r4.fromAttribute(s2, t4.type), this._$Em = null;
    }
  }
  requestUpdate(t3, s2, i5) {
    if (void 0 !== t3) {
      if (i5 ?? (i5 = this.constructor.getPropertyOptions(t3)), !(i5.hasChanged ?? f)(this[t3], s2)) return;
      this.P(t3, s2, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$ET());
  }
  P(t3, s2, i5) {
    this._$AL.has(t3) || this._$AL.set(t3, s2), true === i5.reflect && this._$Em !== t3 && (this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Set())).add(t3);
  }
  async _$ET() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t4) {
      Promise.reject(t4);
    }
    const t3 = this.scheduleUpdate();
    return null != t3 && await t3, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [t5, s3] of this._$Ep) this[t5] = s3;
        this._$Ep = void 0;
      }
      const t4 = this.constructor.elementProperties;
      if (t4.size > 0) for (const [s3, i5] of t4) true !== i5.wrapped || this._$AL.has(s3) || void 0 === this[s3] || this.P(s3, this[s3], i5);
    }
    let t3 = false;
    const s2 = this._$AL;
    try {
      t3 = this.shouldUpdate(s2), t3 ? (this.willUpdate(s2), this._$EO?.forEach((t4) => t4.hostUpdate?.()), this.update(s2)) : this._$EU();
    } catch (s3) {
      throw t3 = false, this._$EU(), s3;
    }
    t3 && this._$AE(s2);
  }
  willUpdate(t3) {
  }
  _$AE(t3) {
    this._$EO?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
  }
  _$EU() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t3) {
    return true;
  }
  update(t3) {
    this._$Ej && (this._$Ej = this._$Ej.forEach((t4) => this._$EC(t4, this[t4]))), this._$EU();
  }
  updated(t3) {
  }
  firstUpdated(t3) {
  }
};
b.elementStyles = [], b.shadowRootOptions = { mode: "open" }, b[d("elementProperties")] = /* @__PURE__ */ new Map(), b[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: b }), (a.reactiveElementVersions ?? (a.reactiveElementVersions = [])).push("2.0.4");

// ../node_modules/lit-html/lit-html.js
var n3 = globalThis;
var c3 = n3.trustedTypes;
var h2 = c3 ? c3.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
var f2 = "$lit$";
var v = `lit$${Math.random().toFixed(9).slice(2)}$`;
var m = "?" + v;
var _ = `<${m}>`;
var w = document;
var lt = () => w.createComment("");
var st = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var g = Array.isArray;
var $ = (t3) => g(t3) || "function" == typeof t3?.[Symbol.iterator];
var x = "[ 	\n\f\r]";
var T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var E = /-->/g;
var k = />/g;
var O = RegExp(`>|${x}(?:([^\\s"'>=/]+)(${x}*=${x}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var S2 = /'/g;
var j = /"/g;
var M = /^(?:script|style|textarea|title)$/i;
var P = (t3) => (i5, ...s2) => ({ _$litType$: t3, strings: i5, values: s2 });
var ke = P(1);
var Oe = P(2);
var Se = P(3);
var R = Symbol.for("lit-noChange");
var D = Symbol.for("lit-nothing");
var V = /* @__PURE__ */ new WeakMap();
var I = w.createTreeWalker(w, 129);
function N(t3, i5) {
  if (!g(t3) || !t3.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== h2 ? h2.createHTML(i5) : i5;
}
var U = (t3, i5) => {
  const s2 = t3.length - 1, e4 = [];
  let h3, o3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", n4 = T;
  for (let i6 = 0; i6 < s2; i6++) {
    const s3 = t3[i6];
    let r4, l2, c4 = -1, a2 = 0;
    for (; a2 < s3.length && (n4.lastIndex = a2, l2 = n4.exec(s3), null !== l2); ) a2 = n4.lastIndex, n4 === T ? "!--" === l2[1] ? n4 = E : void 0 !== l2[1] ? n4 = k : void 0 !== l2[2] ? (M.test(l2[2]) && (h3 = RegExp("</" + l2[2], "g")), n4 = O) : void 0 !== l2[3] && (n4 = O) : n4 === O ? ">" === l2[0] ? (n4 = h3 ?? T, c4 = -1) : void 0 === l2[1] ? c4 = -2 : (c4 = n4.lastIndex - l2[2].length, r4 = l2[1], n4 = void 0 === l2[3] ? O : '"' === l2[3] ? j : S2) : n4 === j || n4 === S2 ? n4 = O : n4 === E || n4 === k ? n4 = T : (n4 = O, h3 = void 0);
    const u2 = n4 === O && t3[i6 + 1].startsWith("/>") ? " " : "";
    o3 += n4 === T ? s3 + _ : c4 >= 0 ? (e4.push(r4), s3.slice(0, c4) + f2 + s3.slice(c4) + v + u2) : s3 + v + (-2 === c4 ? i6 : u2);
  }
  return [N(t3, o3 + (t3[s2] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), e4];
};
var B = class _B {
  constructor({ strings: t3, _$litType$: i5 }, s2) {
    let e4;
    this.parts = [];
    let h3 = 0, o3 = 0;
    const n4 = t3.length - 1, r4 = this.parts, [l2, a2] = U(t3, i5);
    if (this.el = _B.createElement(l2, s2), I.currentNode = this.el.content, 2 === i5 || 3 === i5) {
      const t4 = this.el.content.firstChild;
      t4.replaceWith(...t4.childNodes);
    }
    for (; null !== (e4 = I.nextNode()) && r4.length < n4; ) {
      if (1 === e4.nodeType) {
        if (e4.hasAttributes()) for (const t4 of e4.getAttributeNames()) if (t4.endsWith(f2)) {
          const i6 = a2[o3++], s3 = e4.getAttribute(t4).split(v), n5 = /([.?@])?(.*)/.exec(i6);
          r4.push({ type: 1, index: h3, name: n5[2], strings: s3, ctor: "." === n5[1] ? Y : "?" === n5[1] ? Z : "@" === n5[1] ? q : G }), e4.removeAttribute(t4);
        } else t4.startsWith(v) && (r4.push({ type: 6, index: h3 }), e4.removeAttribute(t4));
        if (M.test(e4.tagName)) {
          const t4 = e4.textContent.split(v), i6 = t4.length - 1;
          if (i6 > 0) {
            e4.textContent = c3 ? c3.emptyScript : "";
            for (let s3 = 0; s3 < i6; s3++) e4.append(t4[s3], lt()), I.nextNode(), r4.push({ type: 2, index: ++h3 });
            e4.append(t4[i6], lt());
          }
        }
      } else if (8 === e4.nodeType) if (e4.data === m) r4.push({ type: 2, index: h3 });
      else {
        let t4 = -1;
        for (; -1 !== (t4 = e4.data.indexOf(v, t4 + 1)); ) r4.push({ type: 7, index: h3 }), t4 += v.length - 1;
      }
      h3++;
    }
  }
  static createElement(t3, i5) {
    const s2 = w.createElement("template");
    return s2.innerHTML = t3, s2;
  }
};
function z(t3, i5, s2 = t3, e4) {
  if (i5 === R) return i5;
  let h3 = void 0 !== e4 ? s2.o?.[e4] : s2.l;
  const o3 = st(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o3 && (h3?._$AO?.(false), void 0 === o3 ? h3 = void 0 : (h3 = new o3(t3), h3._$AT(t3, s2, e4)), void 0 !== e4 ? (s2.o ?? (s2.o = []))[e4] = h3 : s2.l = h3), void 0 !== h3 && (i5 = z(t3, h3._$AS(t3, i5.values), h3, e4)), i5;
}
var F = class {
  constructor(t3, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t3) {
    const { el: { content: i5 }, parts: s2 } = this._$AD, e4 = (t3?.creationScope ?? w).importNode(i5, true);
    I.currentNode = e4;
    let h3 = I.nextNode(), o3 = 0, n4 = 0, r4 = s2[0];
    for (; void 0 !== r4; ) {
      if (o3 === r4.index) {
        let i6;
        2 === r4.type ? i6 = new et(h3, h3.nextSibling, this, t3) : 1 === r4.type ? i6 = new r4.ctor(h3, r4.name, r4.strings, this, t3) : 6 === r4.type && (i6 = new K(h3, this, t3)), this._$AV.push(i6), r4 = s2[++n4];
      }
      o3 !== r4?.index && (h3 = I.nextNode(), o3++);
    }
    return I.currentNode = w, e4;
  }
  p(t3) {
    let i5 = 0;
    for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t3, s2, i5), i5 += s2.strings.length - 2) : s2._$AI(t3[i5])), i5++;
  }
};
var et = class _et {
  get _$AU() {
    return this._$AM?._$AU ?? this.v;
  }
  constructor(t3, i5, s2, e4) {
    this.type = 2, this._$AH = D, this._$AN = void 0, this._$AA = t3, this._$AB = i5, this._$AM = s2, this.options = e4, this.v = e4?.isConnected ?? true;
  }
  get parentNode() {
    let t3 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t3?.nodeType && (t3 = i5.parentNode), t3;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t3, i5 = this) {
    t3 = z(this, t3, i5), st(t3) ? t3 === D || null == t3 || "" === t3 ? (this._$AH !== D && this._$AR(), this._$AH = D) : t3 !== this._$AH && t3 !== R && this._(t3) : void 0 !== t3._$litType$ ? this.$(t3) : void 0 !== t3.nodeType ? this.T(t3) : $(t3) ? this.k(t3) : this._(t3);
  }
  O(t3) {
    return this._$AA.parentNode.insertBefore(t3, this._$AB);
  }
  T(t3) {
    this._$AH !== t3 && (this._$AR(), this._$AH = this.O(t3));
  }
  _(t3) {
    this._$AH !== D && st(this._$AH) ? this._$AA.nextSibling.data = t3 : this.T(w.createTextNode(t3)), this._$AH = t3;
  }
  $(t3) {
    const { values: i5, _$litType$: s2 } = t3, e4 = "number" == typeof s2 ? this._$AC(t3) : (void 0 === s2.el && (s2.el = B.createElement(N(s2.h, s2.h[0]), this.options)), s2);
    if (this._$AH?._$AD === e4) this._$AH.p(i5);
    else {
      const t4 = new F(e4, this), s3 = t4.u(this.options);
      t4.p(i5), this.T(s3), this._$AH = t4;
    }
  }
  _$AC(t3) {
    let i5 = V.get(t3.strings);
    return void 0 === i5 && V.set(t3.strings, i5 = new B(t3)), i5;
  }
  k(t3) {
    g(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s2, e4 = 0;
    for (const h3 of t3) e4 === i5.length ? i5.push(s2 = new _et(this.O(lt()), this.O(lt()), this, this.options)) : s2 = i5[e4], s2._$AI(h3), e4++;
    e4 < i5.length && (this._$AR(s2 && s2._$AB.nextSibling, e4), i5.length = e4);
  }
  _$AR(t3 = this._$AA.nextSibling, i5) {
    for (this._$AP?.(false, true, i5); t3 && t3 !== this._$AB; ) {
      const i6 = t3.nextSibling;
      t3.remove(), t3 = i6;
    }
  }
  setConnected(t3) {
    void 0 === this._$AM && (this.v = t3, this._$AP?.(t3));
  }
};
var G = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t3, i5, s2, e4, h3) {
    this.type = 1, this._$AH = D, this._$AN = void 0, this.element = t3, this.name = i5, this._$AM = e4, this.options = h3, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = D;
  }
  _$AI(t3, i5 = this, s2, e4) {
    const h3 = this.strings;
    let o3 = false;
    if (void 0 === h3) t3 = z(this, t3, i5, 0), o3 = !st(t3) || t3 !== this._$AH && t3 !== R, o3 && (this._$AH = t3);
    else {
      const e5 = t3;
      let n4, r4;
      for (t3 = h3[0], n4 = 0; n4 < h3.length - 1; n4++) r4 = z(this, e5[s2 + n4], i5, n4), r4 === R && (r4 = this._$AH[n4]), o3 || (o3 = !st(r4) || r4 !== this._$AH[n4]), r4 === D ? t3 = D : t3 !== D && (t3 += (r4 ?? "") + h3[n4 + 1]), this._$AH[n4] = r4;
    }
    o3 && !e4 && this.j(t3);
  }
  j(t3) {
    t3 === D ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
  }
};
var Y = class extends G {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t3) {
    this.element[this.name] = t3 === D ? void 0 : t3;
  }
};
var Z = class extends G {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t3) {
    this.element.toggleAttribute(this.name, !!t3 && t3 !== D);
  }
};
var q = class extends G {
  constructor(t3, i5, s2, e4, h3) {
    super(t3, i5, s2, e4, h3), this.type = 5;
  }
  _$AI(t3, i5 = this) {
    if ((t3 = z(this, t3, i5, 0) ?? D) === R) return;
    const s2 = this._$AH, e4 = t3 === D && s2 !== D || t3.capture !== s2.capture || t3.once !== s2.once || t3.passive !== s2.passive, h3 = t3 !== D && (s2 === D || e4);
    e4 && this.element.removeEventListener(this.name, this, s2), h3 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
  }
  handleEvent(t3) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
  }
};
var K = class {
  constructor(t3, i5, s2) {
    this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t3) {
    z(this, t3);
  }
};
var si = { M: f2, P: v, A: m, C: 1, L: U, R: F, D: $, V: z, I: et, H: G, N: Z, U: q, B: Y, F: K };
var Re = n3.litHtmlPolyfillSupport;
Re?.(B, et), (n3.litHtmlVersions ?? (n3.litHtmlVersions = [])).push("3.2.0");
var Q = (t3, i5, s2) => {
  const e4 = s2?.renderBefore ?? i5;
  let h3 = e4._$litPart$;
  if (void 0 === h3) {
    const t4 = s2?.renderBefore ?? null;
    e4._$litPart$ = h3 = new et(i5.insertBefore(lt(), t4), t4, void 0, s2 ?? {});
  }
  return h3._$AI(t3), h3;
};

// ../node_modules/lit-element/lit-element.js
var r3 = class extends b {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var _a;
    const t3 = super.createRenderRoot();
    return (_a = this.renderOptions).renderBefore ?? (_a.renderBefore = t3.firstChild), t3;
  }
  update(t3) {
    const s2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this._$Do = Q(s2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return R;
  }
};
r3._$litElement$ = true, r3["finalized"] = true, globalThis.litElementHydrateSupport?.({ LitElement: r3 });
var i3 = globalThis.litElementPolyfillSupport;
i3?.({ LitElement: r3 });
(globalThis.litElementVersions ?? (globalThis.litElementVersions = [])).push("4.1.1");

// ../node_modules/lit-html/directive.js
var t2 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
var e3 = (t3) => (...e4) => ({ _$litDirective$: t3, values: e4 });
var i4 = class {
  constructor(t3) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t3, e4, i5) {
    this.t = t3, this._$AM = e4, this.i = i5;
  }
  _$AS(t3, e4) {
    return this.update(t3, e4);
  }
  update(t3, e4) {
    return this.render(...e4);
  }
};

// ../node_modules/lit-html/directives/style-map.js
var ee = "important";
var ie = " !" + ee;
var se = e3(class extends i4 {
  constructor(e4) {
    if (super(e4), e4.type !== t2.ATTRIBUTE || "style" !== e4.name || e4.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
  }
  render(t3) {
    return Object.keys(t3).reduce((e4, r4) => {
      const s2 = t3[r4];
      return null == s2 ? e4 : e4 + `${r4 = r4.includes("-") ? r4 : r4.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${s2};`;
    }, "");
  }
  update(t3, [e4]) {
    const { style: r4 } = t3.element;
    if (void 0 === this.ft) return this.ft = new Set(Object.keys(e4)), this.render(e4);
    for (const t4 of this.ft) null == e4[t4] && (this.ft.delete(t4), t4.includes("-") ? r4.removeProperty(t4) : r4[t4] = null);
    for (const t4 in e4) {
      const s2 = e4[t4];
      if (null != s2) {
        this.ft.add(t4);
        const e5 = "string" == typeof s2 && s2.endsWith(ie);
        t4.includes("-") || e5 ? r4.setProperty(t4, e5 ? s2.slice(0, -11) : s2, e5 ? ee : "") : r4[t4] = s2;
      }
    }
    return R;
  }
});

// src/events.js
var EVENT_CHANGE = "change";
var EVENT_LOAD_START = "load-start";
var EVENT_LOAD_END = "load-end";
var EVENT_LOAD = "load";

// src/aem/content-navigation.js
var MAS_RENDER_MODE = "mas-render-mode";
var ContentNavigation = class extends r3 {
  static get styles() {
    return i`
            :host {
                display: block;
                padding: 0 10px;
            }

            #toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 48px;
            }

            .divider {
                flex: 1;
            }

            sp-action-bar {
                display: none;
                flex: 1;
            }

            sp-action-bar[open] {
                display: flex;
            }
        `;
  }
  static get properties() {
    return {
      mode: { type: String, attribute: true, reflect: true },
      source: { type: Object, attribute: false },
      disabled: { type: Boolean, attribute: true },
      inSelection: {
        type: Boolean,
        attribute: "in-selection",
        reflect: true
      }
    };
  }
  constructor() {
    super();
    this.mode = sessionStorage.getItem(MAS_RENDER_MODE) ?? "render";
    this.inSelection = false;
    this.disabled = false;
    this.forceUpdate = this.forceUpdate.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    this.registerToSource();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.unregisterFromSource();
  }
  registerToSource() {
    this.source = document.getElementById(this.getAttribute("source"));
    if (!this.source) return;
    this.source.addEventListener(EVENT_LOAD, this.forceUpdate);
    this.source.addEventListener(EVENT_CHANGE, this.forceUpdate);
  }
  async forceUpdate() {
    this.requestUpdate();
  }
  unregisterFromSource() {
    this.source?.removeEventListener(EVENT_LOAD, this.forceUpdate);
    this.source?.removeEventListener(EVENT_CHANGE, this.forceUpdate);
  }
  updated(changedProperties) {
    if (changedProperties.size === 0) return;
    if (changedProperties.has("mode")) {
      sessionStorage.setItem(MAS_RENDER_MODE, this.mode);
    }
    this.forceUpdate();
  }
  get currentRenderer() {
    return [...this.children].find((child) => child.canRender());
  }
  get searchInfo() {
    return ke`<sp-icon-search></sp-icon-search> Search results for
            "${this.source.searchText}"`;
  }
  get breadcrumbs() {
    const path = this.source?.currentFolder?.path;
    if (!path) return D;
    const folders = path.split("/") ?? [];
    const breadcrumbs = folders.map((name) => {
      const [parent] = path.split(`/${name}/`);
      return ke`<sp-breadcrumb-item
                value="${parent}/${name}"
                ?disabled=${this.inSelection || this.disabled}
                >${name}</sp-breadcrumb-item
            >`;
    });
    return ke`<sp-breadcrumbs
            maxVisibleItems="10"
            @change=${this.handleBreadcrumbChange}
            value="${this.source.path}"
            >${breadcrumbs}</sp-breadcrumbs
        >`;
  }
  handleBreadcrumbChange(event) {
    this.source.path = event.detail.value;
    this.source.listFragments();
  }
  render() {
    return ke`<div id="toolbar">
                ${this.source.searchText ? this.searchInfo : this.breadcrumbs}
                <div class="divider"></div>
                ${this.actions}
            </div>
            ${this.selectionActions}
            <slot></slot> `;
  }
  toggleSelectionMode(force) {
    this.inSelection = force !== void 0 ? force : !this.inSelection;
    if (!this.inSelection) {
      this.source.clearSelection();
    }
    this.notify();
  }
  get selectionCount() {
    return this.source.selectedFragments.length ?? 0;
  }
  get selectionActions() {
    const hasSingleSelection = se({
      display: this.selectionCount === 1 ? "flex" : "none"
    });
    const hasSelection = se({
      display: this.selectionCount > 0 ? "flex" : "none"
    });
    return ke`<sp-action-bar
            emphasized
            ?open=${this.inSelection}
            variant="fixed"
            @close=${() => this.toggleSelectionMode(false)}
        >
            ${this.selectionCount} selected
            <sp-action-button
                slot="buttons"
                style=${hasSingleSelection}
                label="Duplicate"
            >
                <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Delete"
            >
                <sp-icon-delete-outline slot="icon"></sp-icon-delete-outline>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Publish"
            >
                <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Unpublish"
            >
                <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
            </sp-action-button>
        </sp-action-bar>`;
  }
  get renderActions() {
    return [...this.children].filter((child) => child.actionData).map(
      ({ actionData: [mode, label, icon] }) => ke`<sp-menu-item value="${mode}"
                        >${icon} ${label}</sp-menu-item
                    >`
    );
  }
  get actions() {
    const inNoSelectionStyle = se({
      display: !this.disabled && !this.inSelection ? "flex" : "none"
    });
    return ke`<sp-action-group emphasized>
            <slot name="toolbar-actions"></slot>
            <sp-action-button emphasized style=${inNoSelectionStyle}>
                <sp-icon-new-item slot="icon"></sp-icon-new-item>
                Create New Card
            </sp-action-button>
            <sp-action-button
                style=${inNoSelectionStyle}
                @click=${this.toggleSelectionMode}
            >
                <sp-icon-selection-checked
                    slot="icon"
                ></sp-icon-selection-checked>
                Select
            </sp-action-button>
            <sp-action-menu
                style=${inNoSelectionStyle}
                selects="single"
                value="${this.mode}"
                placement="left-end"
                @change=${this.handleRenderModeChange}
            >
                ${this.renderActions}
            </sp-action-menu>
        </sp-action-group>`;
  }
  handleRenderModeChange(e4) {
    this.mode = e4.target.value;
    this.notify();
  }
  notify() {
    this.dispatchEvent(new CustomEvent(EVENT_CHANGE));
  }
};
customElements.define("content-navigation", ContentNavigation);

// src/aem/aem.js
var NETWORK_ERROR_MESSAGE = "Network error";
var defaultSearchOptions = {
  sort: [{ on: "created", order: "ASC" }]
};
var _author;
var AEM = class {
  constructor(bucket, baseUrlOverride) {
    __privateAdd(this, _author);
    __publicField(this, "sites", {
      cf: {
        fragments: {
          /**
           * @see AEM#searchFragment
           */
          search: this.searchFragment.bind(this),
          /**
           * @see AEM#getFragmentByPath
           */
          getByPath: this.getFragmentByPath.bind(this),
          /**
           * @see AEM#getFragmentById
           */
          getById: (id) => this.getFragmentById(this.baseUrl, id, this.headers),
          /**
           * @see AEM#saveFragment
           */
          save: this.saveFragment.bind(this),
          /**
           * @see AEM#copyFragmentClassic
           */
          copy: this.copyFragmentClassic.bind(this),
          /**
           * @see AEM#createFragment
           */
          create: this.createFragment.bind(this),
          /**
           * @see AEM#publishFragment
           */
          publish: this.publishFragment.bind(this),
          /**
           * @see AEM#deleteFragment
           */
          delete: this.deleteFragment.bind(this)
        }
      }
    });
    __publicField(this, "folders", {
      /**
       * @see AEM#listFolders
       */
      list: this.listFoldersClassic.bind(this)
    });
    __privateSet(this, _author, /^author-/.test(bucket));
    const baseUrl = baseUrlOverride || `https://${bucket}.adobeaemcloud.com`;
    this.baseUrl = baseUrl;
    const sitesUrl = `${baseUrl}/adobe/sites`;
    this.cfFragmentsUrl = `${sitesUrl}/cf/fragments`;
    this.cfSearchUrl = `${this.cfFragmentsUrl}/search`;
    this.cfPublishUrl = `${this.cfFragmentsUrl}/publish`;
    this.wcmcommandUrl = `${baseUrl}/bin/wcmcommand`;
    this.csrfTokenUrl = `${baseUrl}/libs/granite/csrf/token.json`;
    this.foldersUrl = `${baseUrl}/adobe/folders`;
    this.foldersClassicUrl = `${baseUrl}/api/assets`;
    this.headers = {
      // IMS users might not have all the permissions, token in the sessionStorage is a temporary workaround
      Authorization: `Bearer ${sessionStorage.getItem("masAccessToken") ?? window.adobeid?.authorize?.()}`,
      pragma: "no-cache",
      "cache-control": "no-cache"
    };
  }
  wait(ms = 1e3) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async getCsrfToken() {
    const response = await fetch(this.csrfTokenUrl, {
      headers: this.headers
    }).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!response.ok) {
      throw new Error(
        `Failed to get CSRF token: ${response.status} ${response.statusText}`
      );
    }
    const { token } = await response.json();
    return token;
  }
  /**
   * Search for content fragments.
   * @param {Object} params - The search options
   * @param {string} [params.path] - The path to search in
   * @param {string} [params.query] - The search query
   * @returns A generator function that fetches all the matching data using a cursor that is returned by the search API
   */
  async *searchFragment({ path, query = "", sort }) {
    const filter = {
      path
    };
    if (query) {
      filter.fullText = {
        text: encodeURIComponent(query),
        queryMode: "EXACT_WORDS"
      };
    } else {
      filter.onlyDirectChildren = true;
    }
    const searchQuery = { ...defaultSearchOptions, filter };
    if (sort) {
      searchQuery.sort = sort;
    }
    const params = {
      query: JSON.stringify(searchQuery)
    };
    let cursor;
    while (true) {
      if (cursor) {
        params.cursor = cursor;
      }
      const searchParams = new URLSearchParams(params).toString();
      const response = await fetch(
        `${this.cfSearchUrl}?${searchParams}`,
        {
          headers: this.headers
        }
      ).catch((err) => {
        throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
      });
      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`
        );
      }
      let items;
      ({ items, cursor } = await response.json());
      yield items;
      if (!cursor) break;
    }
  }
  /**
   * @param {Response} res
   * @returns Fragment json
   */
  async getFragment(res) {
    const etag = res.headers.get("Etag");
    const fragment = await res.json();
    fragment.etag = etag;
    return fragment;
  }
  /**
   * Get fragment by ID
   * @param {string} baseUrl the aem base url
   * @param {string} id fragment id
   * @param {Object} headers optional request headers
   * @returns {Promise<Object>} the raw fragment item
   */
  async getFragmentById(baseUrl, id, headers) {
    const response = await fetch(
      `${baseUrl}/adobe/sites/cf/fragments/${id}`,
      {
        headers
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to get fragment: ${response.status} ${response.statusText}`
      );
    }
    return await this.getFragment(response);
  }
  /**
   * Get fragment by path
   * @param {string} path fragment path
   * @returns {Promise<Object>} the raw fragment item
   */
  async getFragmentByPath(path) {
    const headers = __privateGet(this, _author) ? this.headers : {};
    const response = await fetch(`${this.cfFragmentsUrl}?path=${path}`, {
      headers
    }).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!response.ok) {
      throw new Error(
        `Failed to get fragment: ${response.status} ${response.statusText}`
      );
    }
    const { items } = await response.json();
    if (!items || items.length === 0) {
      throw new Error("Fragment not found");
    }
    return items[0];
  }
  /**
   * Save given fragment
   * @param {Object} fragment
   * @returns {Promise<Object>} the updated fragment
   */
  async saveFragment(fragment) {
    const { title, description, fields } = fragment;
    const response = await fetch(`${this.cfFragmentsUrl}/${fragment.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": fragment.etag,
        ...this.headers
      },
      body: JSON.stringify({ title, description, fields })
    }).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!response.ok) {
      throw new Error(
        `Failed to save fragment: ${response.status} ${response.statusText}`
      );
    }
    return await this.getFragment(response);
  }
  /**
   * Copy a content fragment using the AEM classic API
   * @param {Object} fragment
   * @returns {Promise<Object>} the copied fragment
   */
  async copyFragmentClassic(fragment) {
    const csrfToken = await this.getCsrfToken();
    let parentPath = fragment.path.split("/").slice(0, -1).join("/");
    const formData = new FormData();
    formData.append("cmd", "copyPage");
    formData.append("srcPath", fragment.path);
    formData.append("destParentPath", parentPath);
    formData.append("shallow", "false");
    formData.append("_charset_", "UTF-8");
    const res = await fetch(this.wcmcommandUrl, {
      method: "POST",
      headers: {
        ...this.headers,
        "csrf-token": csrfToken
      },
      body: formData
    }).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!res.ok) {
      throw new Error(
        `Failed to copy fragment: ${res.status} ${res.statusText}`
      );
    }
    const responseText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(responseText, "text/html");
    const message = doc.getElementById("Message");
    const newPath = message?.textContent.trim();
    if (!newPath) {
      throw new Error("Failed to extract new path from copy response");
    }
    await this.wait();
    let newFragment = await this.getFragmentByPath(newPath);
    if (newFragment) {
      newFragment = await this.sites.cf.fragments.getById(newFragment.id);
    }
    return newFragment;
  }
  /**
   * Create a new fragment in a given folder
   * @param {*} fragment sample fragment with mimimum req fields: { title: 'sample title', model: {id: '123'}}
   * @param {String} parentPath - folder in which fragment will be created
   */
  async createFragment(fragment, parentPath) {
    const {
      title,
      fields,
      model: { id: modelId }
    } = fragment;
    if (!parentPath || !title || !modelId) {
      throw new Error(
        `Missing data to create a fragment: ${parentPath}, ${title}, ${modelId}`
      );
    }
    const response = await fetch(`${this.cfFragmentsUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers
      },
      body: JSON.stringify({ title, modelId, fields })
    }).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!response.ok) {
      throw new Error(
        `Failed to create fragment: ${response.status} ${response.statusText}`
      );
    }
    return await this.getFragment(response);
  }
  /**
   * Publish a fragment
   * @param {Object} fragment
   * @returns {Promise<void>}
   */
  async publishFragment(fragment) {
    const response = await fetch(this.cfPublishUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "If-Match": fragment.etag,
        ...this.headers
      },
      body: JSON.stringify({
        paths: [fragment.path],
        filterReferencesByStatus: ["DRAFT", "UNPUBLISHED"],
        workflowModelId: "/var/workflow/models/scheduled_activation_with_references"
      })
    }).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!response.ok) {
      throw new Error(
        `Failed to publish fragment: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  }
  /**
   * Delete a fragment
   * @param {Object} fragment
   * @returns {Promise<void>}
   */
  async deleteFragment(fragment) {
    const response = await fetch(`${this.cfFragmentsUrl}/${fragment.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "If-Match": fragment.etag,
        ...this.headers
      }
    }).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!response.ok) {
      throw new Error(
        `Failed to delete fragment: ${response.status} ${response.statusText}`
      );
    }
    return response;
  }
  /**
   * @param {*} path
   */
  async listFolders(path) {
    const query = new URLSearchParams({
      path
    }).toString();
    const response = await fetch(`${this.foldersUrl}/?${query}`, {
      method: "GET",
      headers: {
        ...this.headers,
        "X-Adobe-Accept-Experimental": "1"
      }
    }).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!response.ok) {
      throw new Error(
        `Failed to list folders: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  }
  /**
   * @param {*} path
   */
  async listFoldersClassic(path) {
    const relativePath = path?.replace(/^\/content\/dam/, "");
    const response = await fetch(
      `${this.foldersClassicUrl}${relativePath}.json?limit=1000`,
      // TODO: this is a workaround until Folders API is fixed.
      {
        method: "GET",
        headers: { ...this.headers }
      }
    ).catch((err) => {
      throw new Error(`${NETWORK_ERROR_MESSAGE}: ${err.message}`);
    });
    if (!response.ok) {
      throw new Error(
        `Failed to list folders: ${response.status} ${response.statusText}`
      );
    }
    const {
      properties: { name },
      entities = []
    } = await response.json();
    return {
      self: { name, path },
      children: entities.filter(({ class: [firstClass] }) => /folder/.test(firstClass)).map(({ properties: { name: name2, title } }) => ({
        name: name2,
        title,
        folderId: `${path}/${name2}`,
        path: `${path}/${name2}`
      }))
    };
  }
};
_author = new WeakMap();

// src/aem/folder.js
var _open;
var _Folder = class _Folder {
  constructor(path) {
    __privateAdd(this, _open, false);
    /** @type {Folder[]} */
    __publicField(this, "folders", []);
    /** @type {Fragment[]} */
    __publicField(this, "fragments", []);
    this.path = path;
  }
  open({ folderId, name, title }, children) {
    if (__privateGet(this, _open)) return;
    this.folderId = folderId;
    this.name = name;
    this.title = title;
    __privateSet(this, _open, open);
    children.forEach((child) => {
      const folder = new _Folder(child.path);
      this.folders.push(folder);
    });
  }
  get isOpen() {
    return __privateGet(this, _open);
  }
  clear() {
    this.fragments = [];
  }
  add(...fragments) {
    this.fragments = [...this.fragments, ...fragments];
  }
};
_open = new WeakMap();
var Folder = _Folder;

// src/aem/fragment.js
var Fragment = class {
  /**
   * @param {*} AEM Fragment JSON object
   * @param {*} eventTarget DOM element to dispatch events from
   */
  constructor({ id, etag, model, path, title, description, status, modified, fields }, eventTarget) {
    __publicField(this, "path", "");
    __publicField(this, "hasChanges", false);
    __publicField(this, "status", "");
    __publicField(this, "fields", []);
    __publicField(this, "selected", false);
    this.id = id;
    this.model = model;
    this.etag = etag;
    this.path = path;
    this.name = path.split("/").pop();
    this.title = title;
    this.description = description;
    this.status = status;
    this.modified = modified;
    this.fields = fields;
    this.eventTarget = eventTarget;
  }
  get variant() {
    return this.fields.find((field) => field.name === "variant")?.values?.[0];
  }
  get fragmentName() {
    return this.path.split("/").pop();
  }
  get statusVariant() {
    if (this.hasChanges) return "yellow";
    return this.status === "PUBLISHED" ? "positive" : "info";
  }
  refreshFrom(fragmentData) {
    Object.assign(this, fragmentData);
    this.hasChanges = false;
    this.notify();
  }
  notify() {
    this.eventTarget.dispatchEvent(
      new CustomEvent(EVENT_CHANGE, { detail: this })
    );
  }
  toggleSelection(value) {
    if (value !== void 0) this.selected = value;
    else this.selected = !this.selected;
    this.notify();
  }
  updateFieldInternal(fieldName, value) {
    this[fieldName] = value ?? "";
    this.hasChanges = true;
    this.notify();
  }
  updateField(fieldName, value) {
    let change = false;
    this.fields.filter((field) => field.name === fieldName).forEach((field) => {
      if (field.values.length === value.length && field.values.every((v2, index) => v2 === value[index]))
        return;
      field.values = value;
      this.hasChanges = true;
      change = true;
    });
    this.notify();
    return change;
  }
};

// src/aem/aem-fragments.js
var aemFragmentCache;
var _aem, _rootFolder, _folders, _loading, _searchResult, _search, _cursor;
var AemFragments = class extends r3 {
  constructor() {
    super(...arguments);
    /**
     * @type {import('@adobecom/milo/libs/features/mas/web-components').AEM}
     */
    __privateAdd(this, _aem);
    /**
     * @type {Folder}
     */
    __privateAdd(this, _rootFolder);
    /**
     * @type {Folder}
     */
    __publicField(this, "currentFolder");
    __privateAdd(this, _folders, /* @__PURE__ */ new Map());
    __privateAdd(this, _loading, true);
    /**
     * Fragments in the search result.
     */
    __privateAdd(this, _searchResult);
    __privateAdd(this, _search);
    __privateAdd(this, _cursor);
  }
  static get properties() {
    return {
      bucket: { type: String },
      baseUrl: { type: String, attribute: "base-url" },
      root: { type: String, attribute: true, reflect: true },
      path: { type: String, attribute: true, reflect: true },
      searchText: { type: String, attribute: "search" },
      fragment: { type: Object }
    };
  }
  createRenderRoot() {
    return this;
  }
  // last active cursor being processed
  connectedCallback() {
    super.connectedCallback();
    if (!this.root) throw new Error("root attribute is required");
    if (!(this.bucket || this.baseUrl))
      throw new Error(
        "Either the bucket or baseUrl attribute is required."
      );
    __privateSet(this, _aem, new AEM(this.bucket, this.baseUrl));
    __privateSet(this, _rootFolder, new Folder(this.root));
    this.style.display = "none";
  }
  async sendSearch() {
    if (this.searchText) await this.searchFragments();
    else {
      await this.openFolder(this.path || this.root);
      await this.listFragments();
    }
  }
  /**
   * @param {Folder} folder
   */
  async openFolder(folder) {
    __privateSet(this, _loading, true);
    this.dispatchEvent(new CustomEvent(EVENT_LOAD_START));
    if (typeof folder === "string") {
      this.currentFolder = __privateGet(this, _folders).get(folder);
      if (!this.currentFolder) {
        this.currentFolder = new Folder(folder);
        __privateGet(this, _folders).set(folder, this.currentFolder);
      }
    } else {
      this.currentFolder = folder;
    }
    const { self, children } = await __privateGet(this, _aem).folders.list(
      this.currentFolder.path
    );
    this.currentFolder.open(self, children);
  }
  async selectFragment(x2, y2, fragment) {
    const latest = await __privateGet(this, _aem).sites.cf.fragments.getById(fragment.id);
    Object.assign(fragment, latest);
    fragment.refreshFrom(latest);
    this.setFragment(fragment);
    this.dispatchEvent(
      new CustomEvent("select-fragment", {
        detail: { x: x2, y: y2, fragment },
        bubbles: true,
        composed: true
      })
    );
  }
  setFragment(fragment) {
    this.fragment = fragment;
  }
  async processFragments(cursor, search = false) {
    if (__privateGet(this, _cursor)) {
      __privateGet(this, _cursor).cancelled = true;
    }
    __privateSet(this, _cursor, cursor);
    __privateSet(this, _loading, true);
    __privateSet(this, _searchResult, []);
    this.currentFolder?.clear();
    this.dispatchEvent(
      new CustomEvent(EVENT_LOAD_START, {
        bubbles: true
      })
    );
    for await (const result of cursor) {
      if (cursor.cancelled) break;
      __privateSet(this, _loading, true);
      const fragments = result.map((item) => new Fragment(item, this));
      if (search) {
        __privateSet(this, _searchResult, [...__privateGet(this, _searchResult), ...fragments]);
      } else {
        this.currentFolder.add(...fragments);
      }
      if (!aemFragmentCache) {
        await customElements.whenDefined("aem-fragment").then(() => {
          aemFragmentCache = document.createElement("aem-fragment").cache;
        });
      }
      aemFragmentCache.add(...fragments);
      this.dispatchEvent(new CustomEvent(EVENT_LOAD));
    }
    __privateSet(this, _loading, false);
    this.dispatchEvent(new CustomEvent(EVENT_LOAD_END, { bubbles: true }));
  }
  async listFragments() {
    __privateSet(this, _search, {
      path: this.path || this.currentFolder.path || __privateGet(this, _rootFolder).path
    });
    const cursor = __privateGet(this, _aem).sites.cf.fragments.search(__privateGet(this, _search));
    this.processFragments(cursor);
  }
  /**
   * Searches for content fragments based on the provided query parameters.
   *
   * @param {Object} search - The search parameters.
   * @param {string} search.variant - The variant to filter by.
   */
  async searchFragments() {
    __privateSet(this, _search, {
      query: this.searchText,
      path: __privateGet(this, _rootFolder).path
    });
    const cursor = await __privateGet(this, _aem).sites.cf.fragments.search(__privateGet(this, _search));
    this.processFragments(cursor, true);
  }
  async saveFragment() {
    let fragment = await __privateGet(this, _aem).sites.cf.fragments.save(this.fragment);
    if (!fragment) throw new Error("Failed to save fragment");
    aemFragmentCache.get(fragment.id)?.refreshFrom(fragment);
  }
  async copyFragment() {
    const oldFragment = this.fragment;
    this.setFragment(null);
    const fragment = await __privateGet(this, _aem).sites.cf.fragments.copy(oldFragment);
    aemFragmentCache?.add(fragment);
    const newFragment = new Fragment(fragment);
    __privateGet(this, _search).addToResult(newFragment, oldFragment);
    this.setFragment(newFragment);
  }
  async publishFragment() {
    await __privateGet(this, _aem).sites.cf.fragments.publish(this.fragment);
  }
  async deleteFragment() {
    await __privateGet(this, _aem).sites.cf.fragments.delete(this.fragment);
    __privateGet(this, _search).removeFromResult(this.fragment);
    this.setFragment(null);
  }
  clearSelection() {
    this.fragments.forEach((fragment) => fragment.toggleSelection(false));
  }
  get fragments() {
    return (this.searchText ? __privateGet(this, _searchResult) : this.currentFolder?.fragments) ?? [];
  }
  get selectedFragments() {
    return this.fragments.filter((fragment) => fragment.selected);
  }
  get folders() {
    return this.currentFolder?.folders ?? [];
  }
  get search() {
    return { ...__privateGet(this, _search) };
  }
  get loading() {
    return __privateGet(this, _loading);
  }
  render() {
    return D;
  }
};
_aem = new WeakMap();
_rootFolder = new WeakMap();
_folders = new WeakMap();
_loading = new WeakMap();
_searchResult = new WeakMap();
_search = new WeakMap();
_cursor = new WeakMap();
customElements.define("aem-fragments", AemFragments);

// src/aem/table-view.js
var MODE = "table";
var TableView = class extends r3 {
  static get styles() {
    return i`
            :host {
                display: contents;
            }

            sp-table {
                height: var(--table-height, 100%);
            }
        `;
  }
  static get properties() {
    return {
      rowCount: { type: Number, attribute: "row-count" },
      customRenderItem: { type: Function }
    };
  }
  constructor() {
    super();
    this.forceUpdate = this.forceUpdate.bind(this);
    this.itemValue = this.itemValue.bind(this);
    this.renderItem = this.renderItem.bind(this);
  }
  get table() {
    return this.shadowRoot?.querySelector("sp-table");
  }
  get tableBody() {
    return this.table?.querySelector("sp-table-body");
  }
  canRender() {
    return this.parentElement?.mode === MODE && this.parentElement.source;
  }
  render() {
    if (!this.canRender()) return D;
    return ke`
            <sp-table
                emphasized
                scroller
                .itemValue=${this.itemValue}
                .renderItem=${this.renderItem}
                selects=${this.parentElement.inSelection ? "multiple" : void 0}
                @change=${this.handleTableSelectionChange}
                @dblclick="${this.handleDoubleClick}"
            >
                <sp-table-head>
                    <sp-table-head-cell sortable>Title</sp-table-head-cell>
                    <sp-table-head-cell sortable>Name</sp-table-head-cell>
                    <slot name="headers"></slot>
                    <sp-table-head-cell sortable>Status</sp-table-head-cell>
                    <sp-table-head-cell sortable
                        >Modified at</sp-table-head-cell
                    >
                    <sp-table-head-cell sortable
                        >Modified by</sp-table-head-cell
                    >
                </sp-table-head>
            </sp-table>
        `;
  }
  updated() {
    (async () => {
      if (this.table) {
        if (!this.parentElement.inSelection) {
          this.table.deselectAllRows();
        }
        this.table.items = this.parentElement.source.fragments;
        this.table.renderVirtualizedItems();
      }
    })();
  }
  itemValue(item) {
    return item.id;
  }
  renderItem(item) {
    if (!item) return D;
    return ke` <sp-table-cell>${item.title}</sp-table-cell>
            <sp-table-cell>${item.name}</sp-table-cell>
            ${this.customRenderItem?.(item)}
            <sp-table-cell>${item.status}</sp-table-cell>
            <sp-table-cell>${item.modified.at}</sp-table-cell>
            <sp-table-cell>${item.modified.by}</sp-table-cell>`;
  }
  handleDoubleClick(e4) {
    if (this.parentElement.inSelection) return;
    const { value } = e4.target.closest("sp-table-row");
    if (!value) return;
    const fragment = this.parentElement.source.fragments.find(
      (f3) => f3.id === value
    );
    if (!fragment) return;
    this.parentElement.source.selectFragment(
      e4.clientX,
      e4.clientY,
      fragment
    );
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.rowCount) {
      this.style.setProperty("--table-height", `${this.rowCount * 40}px`);
    }
    this.parentElement.addEventListener(EVENT_CHANGE, this.forceUpdate);
    this.parentElement.source.addEventListener(
      EVENT_LOAD,
      this.forceUpdate
    );
    this.parentElement.source.addEventListener(
      EVENT_CHANGE,
      this.forceUpdate
    );
  }
  async forceUpdate() {
    this.requestUpdate();
  }
  handleTableSelectionChange(e4) {
    const { selected } = e4.target;
    this.parentElement.source.fragments.forEach((fragment) => {
      fragment.toggleSelection(selected.includes(fragment.id));
    });
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  get actionData() {
    return [
      "table",
      "Table view",
      ke`<sp-icon-table slot="icon"></sp-icon-table>`
    ];
  }
};
customElements.define("table-view", TableView);

// ../node_modules/lit-html/directive-helpers.js
var { I: et2 } = si;
var lt2 = () => document.createComment("");
var at = (o3, t3, i5) => {
  const n4 = o3._$AA.parentNode, e4 = void 0 === t3 ? o3._$AB : t3._$AA;
  if (void 0 === i5) {
    const t4 = n4.insertBefore(lt2(), e4), l2 = n4.insertBefore(lt2(), e4);
    i5 = new et2(t4, l2, o3, o3.options);
  } else {
    const t4 = i5._$AB.nextSibling, l2 = i5._$AM, c4 = l2 !== o3;
    if (c4) {
      let t5;
      i5._$AQ?.(o3), i5._$AM = o3, void 0 !== i5._$AP && (t5 = o3._$AU) !== l2._$AU && i5._$AP(t5);
    }
    if (t4 !== e4 || c4) {
      let o4 = i5._$AA;
      for (; o4 !== t4; ) {
        const t5 = o4.nextSibling;
        n4.insertBefore(o4, e4), o4 = t5;
      }
    }
  }
  return i5;
};
var ct = (o3, t3, i5 = o3) => (o3._$AI(t3, i5), o3);
var ht = {};
var dt = (o3, t3 = ht) => o3._$AH = t3;
var ut = (o3) => o3._$AH;
var pt = (o3) => {
  o3._$AP?.(false, true);
  let t3 = o3._$AA;
  const i5 = o3._$AB.nextSibling;
  for (; t3 !== i5; ) {
    const o4 = t3.nextSibling;
    t3.remove(), t3 = o4;
  }
};

// ../node_modules/lit-html/directives/repeat.js
var Jt = (e4, s2, t3) => {
  const r4 = /* @__PURE__ */ new Map();
  for (let l2 = s2; l2 <= t3; l2++) r4.set(e4[l2], l2);
  return r4;
};
var Qt = e3(class extends i4 {
  constructor(e4) {
    if (super(e4), e4.type !== t2.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(e4, s2, t3) {
    let r4;
    void 0 === t3 ? t3 = s2 : void 0 !== s2 && (r4 = s2);
    const l2 = [], o3 = [];
    let i5 = 0;
    for (const s3 of e4) l2[i5] = r4 ? r4(s3, i5) : i5, o3[i5] = t3(s3, i5), i5++;
    return { values: o3, keys: l2 };
  }
  render(e4, s2, t3) {
    return this.dt(e4, s2, t3).values;
  }
  update(e4, [s2, t3, r4]) {
    const l2 = ut(e4), { values: o3, keys: i5 } = this.dt(s2, t3, r4);
    if (!Array.isArray(l2)) return this.ut = i5, o3;
    const n4 = this.ut ?? (this.ut = []), f3 = [];
    let u2, c4, d2 = 0, p2 = l2.length - 1, a2 = 0, h3 = o3.length - 1;
    for (; d2 <= p2 && a2 <= h3; ) if (null === l2[d2]) d2++;
    else if (null === l2[p2]) p2--;
    else if (n4[d2] === i5[a2]) f3[a2] = ct(l2[d2], o3[a2]), d2++, a2++;
    else if (n4[p2] === i5[h3]) f3[h3] = ct(l2[p2], o3[h3]), p2--, h3--;
    else if (n4[d2] === i5[h3]) f3[h3] = ct(l2[d2], o3[h3]), at(e4, f3[h3 + 1], l2[d2]), d2++, h3--;
    else if (n4[p2] === i5[a2]) f3[a2] = ct(l2[p2], o3[a2]), at(e4, l2[d2], l2[p2]), p2--, a2++;
    else if (void 0 === u2 && (u2 = Jt(i5, a2, h3), c4 = Jt(n4, d2, p2)), u2.has(n4[d2])) if (u2.has(n4[p2])) {
      const s3 = c4.get(i5[a2]), t4 = void 0 !== s3 ? l2[s3] : null;
      if (null === t4) {
        const s4 = at(e4, l2[d2]);
        ct(s4, o3[a2]), f3[a2] = s4;
      } else f3[a2] = ct(t4, o3[a2]), at(e4, l2[d2], t4), l2[s3] = null;
      a2++;
    } else pt(l2[p2]), p2--;
    else pt(l2[d2]), d2++;
    for (; a2 <= h3; ) {
      const s3 = at(e4, f3[h3 + 1]);
      ct(s3, o3[a2]), f3[a2++] = s3;
    }
    for (; d2 <= p2; ) {
      const e5 = l2[d2++];
      null !== e5 && pt(e5);
    }
    return this.ut = i5, dt(e4, f3), R;
  }
});

// src/aem/render-view.js
var MODE2 = "render";
var models = {
  merchCard: {
    path: "/conf/mas/settings/dam/cfm/models/card",
    name: "Merch Card"
  }
};
var RenderView = class extends r3 {
  constructor() {
    super();
    this.forceUpdate = this.forceUpdate.bind(this);
  }
  createRenderRoot() {
    return this;
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", (e4) => {
      e4.preventDefault();
    });
    this.parentElement.addEventListener(EVENT_CHANGE, this.forceUpdate);
    this.parentElement.source.addEventListener(
      EVENT_LOAD,
      this.forceUpdate
    );
    this.parentElement.source.addEventListener(
      EVENT_CHANGE,
      this.forceUpdate
    );
  }
  async forceUpdate(e4) {
    this.requestUpdate();
  }
  renderItem(fragment) {
    const selected = this.parentElement.source.selectedFragments.includes(fragment);
    return ke`<merch-card
            class="${selected ? "selected" : ""}"
            @dblclick="${(e4) => this.handleDoubleClick(e4, fragment)}"
        >
            <aem-fragment fragment="${fragment.id}" ims></aem-fragment>
            <sp-status-light
                size="l"
                variant="${fragment.statusVariant}"
            ></sp-status-light>
            <div class="overlay" @click="${() => fragment.toggleSelection()}">
                ${selected ? ke`<sp-icon-remove slot="icon"></sp-icon-remove>` : ke`<sp-icon-add slot="icon"></sp-icon-add>`}
            </div>
        </merch-card>`;
  }
  handleDoubleClick(e4, fragment) {
    if (this.parentElement.inSelection) return;
    this.parentElement.source.selectFragment(
      e4.clientX,
      e4.clientY,
      fragment
    );
  }
  canRender() {
    return this.parentElement?.mode === MODE2 && this.parentElement.source?.fragments;
  }
  render() {
    if (!this.canRender()) return D;
    return ke` ${Qt(
      this.parentElement.source.fragments,
      (fragment) => fragment.path,
      (fragment) => {
        switch (fragment.model.path) {
          case models.merchCard.path:
            return this.renderItem(fragment);
          default:
            return D;
        }
      }
    )}`;
  }
  get actionData() {
    return [
      MODE2,
      "Render view",
      ke`<sp-icon-view-card slot="icon"></sp-icon-view-card>`
    ];
  }
};
customElements.define("render-view", RenderView);
export {
  Folder,
  Fragment
};
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

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

lit-html/directive.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/style-map.js:
  (**
   * @license
   * Copyright 2018 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directive-helpers.js:
  (**
   * @license
   * Copyright 2020 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/directives/repeat.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=aem.js.map
