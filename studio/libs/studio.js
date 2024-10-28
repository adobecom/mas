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
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

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

// src/events.js
var EVENT_CHANGE = "change";
var EVENT_SUBMIT = "submit";

// ../node_modules/@adobecom/milo/libs/features/mas/web-components/src/deeplink.js
var EVENT_HASHCHANGE = "hashchange";
function parseState(hash = window.location.hash) {
  const result = [];
  const keyValuePairs = hash.replace(/^#/, "").split("&");
  for (const pair of keyValuePairs) {
    const [key, value = ""] = pair.split("=");
    if (key) {
      result.push([key, decodeURIComponent(value.replace(/\+/g, " "))]);
    }
  }
  return Object.fromEntries(result);
}
function pushState(state) {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  Object.entries(state).forEach(([key, value2]) => {
    if (value2) {
      hash.set(key, value2);
    } else {
      hash.delete(key);
    }
  });
  hash.sort();
  const value = hash.toString();
  if (value === window.location.hash) return;
  let lastScrollTop = window.scrollY || document.documentElement.scrollTop;
  window.location.hash = value;
  window.scrollTo(0, lastScrollTop);
}
function deeplink(callback) {
  const handler = () => {
    if (window.location.hash && !window.location.hash.includes("=")) return;
    const state = parseState(window.location.hash);
    callback(state);
  };
  handler();
  window.addEventListener(EVENT_HASHCHANGE, handler);
  return () => {
    window.removeEventListener(EVENT_HASHCHANGE, handler);
  };
}

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

// ../node_modules/lit-html/directives/unsafe-html.js
var le = class extends i4 {
  constructor(i5) {
    if (super(i5), this.it = D, i5.type !== t2.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
  }
  render(t3) {
    if (t3 === D || null == t3) return this._t = void 0, this.it = t3;
    if (t3 === R) return t3;
    if ("string" != typeof t3) throw Error(this.constructor.directiveName + "() called with a non-string value");
    if (t3 === this.it) return this._t;
    this.it = t3;
    const i5 = [t3];
    return i5.raw = i5, this._t = { _$litType$: this.constructor.resultType, strings: i5, values: [] };
  }
};
le.directiveName = "unsafeHTML", le.resultType = 1;
var ae = e3(le);

// src/fields/multifield.js
var _template, _MasMultifield_instances, changed_fn;
var MasMultifield = class extends r3 {
  constructor() {
    super();
    __privateAdd(this, _MasMultifield_instances);
    /**
     * @type {HTMLElement}
     */
    __privateAdd(this, _template);
    this.draggingIndex = -1;
    this.min = 0;
    this.initValue();
  }
  static get properties() {
    return {
      min: { type: Number, attribute: true },
      value: { type: Array, attribute: false },
      draggingIndex: { type: Number, state: true }
    };
  }
  initValue() {
    this.value = this.value?.map((field, i5) => ({
      ...field
    })) ?? [];
  }
  firstUpdated() {
    this.initValue();
  }
  connectedCallback() {
    super.connectedCallback();
    this.initFieldTemplate();
  }
  // Initialize the field template
  initFieldTemplate() {
    const template = this.querySelector("template");
    if (!template) {
      console.warn("Template field not found", this);
      return;
    }
    __privateSet(this, _template, template.content);
    template.remove();
    if (this.value.length === 0) {
      for (let i5 = 0; i5 < this.min; i5++) {
        this.addField();
      }
    }
  }
  // Add a new field
  addField() {
    this.value = [...this.value, {}];
    __privateMethod(this, _MasMultifield_instances, changed_fn).call(this);
  }
  getFieldIndex(element) {
    return Array.from(
      this.shadowRoot.querySelectorAll(".field-wrapper")
    ).indexOf(element.closest(".field-wrapper"));
  }
  // Remove a field by its index
  removeField(index) {
    this.value.splice(index, 1);
    this.value = [...this.value];
    __privateMethod(this, _MasMultifield_instances, changed_fn).call(this);
  }
  // Handle the value change of a field
  handleChange(e4) {
    e4.stopPropagation();
    let newValue = e4.target.value;
    if (typeof newValue === "string") {
      newValue = { value: newValue };
    }
    const index = this.getFieldIndex(e4.target);
    const value = this.value[index];
    if (!value) return;
    Object.assign(value, newValue);
    __privateMethod(this, _MasMultifield_instances, changed_fn).call(this);
  }
  /* c8 ignore start */
  // Handle drag start
  dragStart(e4, index) {
    this.draggingIndex = index;
    e4.dataTransfer.effectAllowed = "move";
    e4.target.classList.add("dragging");
  }
  // Handle drag over
  dragOver(e4, index) {
    e4.preventDefault();
    if (this.draggingIndex !== index) {
      e4.target.classList.add("dragover");
    }
  }
  // Handle drag leave
  dragLeave(e4) {
    e4.target.classList.remove("dragover");
  }
  // Handle drop
  drop(e4, index) {
    e4.preventDefault();
    const draggingField = this.value[this.draggingIndex];
    let updatedValue = [...this.value];
    updatedValue.splice(this.draggingIndex, 1);
    updatedValue.splice(index, 0, draggingField);
    this.value = updatedValue;
    e4.target.classList.remove("dragover");
    this.draggingIndex = -1;
    __privateMethod(this, _MasMultifield_instances, changed_fn).call(this);
  }
  // Handle drag end
  dragEnd(e4) {
    e4.target.classList.remove("dragging");
  }
  /* c8 ignore end */
  // Render individual field with reorder and delete options
  renderField(field, index) {
    let fieldEl = __privateGet(this, _template).cloneNode(true).firstElementChild;
    fieldEl = fieldEl.querySelector(".field") ?? fieldEl;
    Object.keys(field).forEach((key) => {
      fieldEl.setAttribute(key, field[key]);
    });
    return ke`
            <div
                class="field-wrapper"
                draggable="true"
                @dragstart=${(e4) => this.dragStart(e4, index)}
                @dragover=${(e4) => this.dragOver(e4, index)}
                @dragleave=${this.dragLeave}
                @drop=${(e4) => this.drop(e4, index)}
                @dragend=${this.dragEnd}
            >
                ${fieldEl}
                <sp-icon-close
                    label="Remove field"
                    @click=${() => this.removeField(index)}
                ></sp-icon-close>
                <sp-icon-drag-handle label="Order"></sp-icon-drag-handle>
            </div>
        `;
  }
  render() {
    if (!__privateGet(this, _template)) return D;
    return ke`
            <div @change="${this.handleChange}">
                ${this.value.map(
      (field, index) => this.renderField(field, index)
    )}
                <sp-action-button quiet @click=${this.addField}>
                    <sp-icon-add label="Add" slot="icon"></sp-icon-add>Add
                </sp-action-button>
            </div>
        `;
  }
};
_template = new WeakMap();
_MasMultifield_instances = new WeakSet();
changed_fn = function() {
  this.dispatchEvent(
    new CustomEvent(EVENT_CHANGE, {
      bubbles: true,
      composed: true
    })
  );
};
__publicField(MasMultifield, "styles", i`
        :host {
            display: block;
        }

        :host > div {
            display: contents;
        }

        .field-wrapper {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 4px;
        }

        .field-wrapper:hover {
            outline: 2px dashed var(--spectrum-global-color-gray-400);
            border-radius: var(--spectrum-global-dimension-size-50);
        }

        .field-wrapper > *:first-child {
            flex: 1;
        }

        .field-wrapper.dragging {
            opacity: 0.5;
        }

        .field-wrapper.dragover {
            border: 1px dashed #007bff;
        }

        sp-icon-drag-handle {
            visibility: hidden;
            margin-block-start: 24px;
            cursor: grab;
            pointer-events: auto;
        }

        .field-wrapper:hover sp-icon-drag-handle {
            visibility: visible;
        }

        sp-icon-close {
            pointer-events: auto;
            padding: 8px;
            margin-block-start: 24px;
            align-self: start;
            cursor: pointer;
        }

        sp-icon-close:hover {
            cursor: pointer;
        }
    `);
customElements.define("mas-multifield", MasMultifield);

// src/fields/mnemonic-field.js
var MnemonicField = class extends r3 {
  static get properties() {
    return {
      icon: { type: String, reflect: true },
      alt: { type: String, reflect: true },
      link: { type: String, reflect: true }
    };
  }
  get iconElement() {
    return this.shadowRoot.getElementById("icon");
  }
  get altElement() {
    return this.shadowRoot.getElementById("alt");
  }
  get linkElement() {
    return this.shadowRoot.getElementById("link");
  }
  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.addEventListener(EVENT_CHANGE, this.handleChange);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.shadowRoot.removeEventListener(EVENT_CHANGE, this.handleChange);
  }
  handleChange(event) {
    if (event.target === this) return;
    this[event.target.id] = event.target.value ?? "";
    event.stopPropagation();
    this.dispatchEvent(
      new CustomEvent(EVENT_CHANGE, {
        bubbles: true,
        composed: true,
        detail: this
      })
    );
  }
  get value() {
    return {
      icon: this.icon ?? "",
      alt: this.alt ?? "",
      link: this.link ?? ""
    };
  }
  render() {
    return ke`
            <sp-field-label required for="icon">Icon URL</sp-field-label>
            <sp-textfield id="icon" required placeholder="Enter icon URL" value="${this.icon}" @change="${this.handleChange}"></sp-textfield>
            <sp-field-label for="alt">Alt text</sp-field-label>
            <sp-textfield id="alt" placeholder="enter alt text" value="${this.alt}" @change="${this.handleChange}"></sp-textfield>
            <sp-field-label for="link">Link</sp-field-label>
            <sp-textfield id="link" placeholder="Enter target link" value="${this.link}" @change="${this.handleChange}"></sp-textfield
        `;
  }
};
__publicField(MnemonicField, "styles", i`
        sp-textfield {
            width: 100%;
        }
    `);
customElements.define("mas-mnemonic-field", MnemonicField);

// src/editors/merch-card-editor.js
var MODEL_PATH = "/conf/mas/settings/dam/cfm/models/card";
var MerchCardEditor = class extends r3 {
  createRenderRoot() {
    return this;
  }
  render() {
    if (this.fragment.model.path !== MODEL_PATH) return D;
    const form = Object.fromEntries([
      ...this.fragment.fields.map((f3) => [f3.name, f3])
    ]);
    return ke` <p>${this.fragment.path}</p>
            <sp-field-label for="card-variant">Variant</sp-field-label>
            <variant-picker
                id="card-variant"
                ?show-all="false"
                data-field="variant"
                default-value="${form.variant.values[0]}"
                @change="${this.updateFragment}"
            ></variant-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="cardTitle"
                value="${form.cardTitle.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-subtitle">Subtitle</sp-field-label>
            <sp-textfield
                placeholder="Enter card subtitle"
                id="card-subtitle"
                data-field="subtitle"
                value="${form.subtitle.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-size">Size</sp-field-label>
            <sp-textfield
                placeholder="Enter card size"
                id="card-size"
                data-field="size"
                value="${form.size.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-icon">Badge</sp-field-label>
            <sp-textfield
                placeholder="Enter badge text"
                id="card-badge"
                data-field="badge"
                value="${form.badge.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="mnemonic">Mnemonics</sp-field-label>
            <mas-multifield
                id="mnemonic"
                .value="${this.fragment.computed?.mnemonics}"
                @change="${this.updateMnemonics}"
            >
                <template>
                    <mas-mnemonic-field></mas-mnemonic-field>
                </template>
            </mas-multifield>
            <sp-field-label for="card-icon">Background Image</sp-field-label>
            <sp-textfield
                placeholder="Enter backgroung image URL"
                id="background-title"
                data-field="backgroundImage"
                value="${form.backgroundImage.values[0]}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="horizontal"> Prices </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="prices" @blur="${this.updateFragment}"
                    >${ae(form.prices.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor
                    data-field="description"
                    @blur="${this.updateFragment}"
                    >${ae(form.description.values[0])}</rte-editor
                >
            </sp-field-group>
            <sp-field-label for="horizontal"> Footer </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor data-field="ctas" @blur="${this.updateFragment}"
                    >${ae(form.ctas.values[0])}</rte-editor
                >
            </sp-field-group>`;
  }
  updateFragment(e4) {
    this.dispatchEvent(new CustomEvent("update-fragment", { detail: e4 }));
  }
  updateMnemonics(e4) {
    const mnemonicIcon = [];
    const mnemonicAlt = [];
    const mnemonicLink = [];
    e4.target.value.forEach(({ icon, alt, link }) => {
      mnemonicIcon.push(icon ?? "");
      mnemonicAlt.push(alt ?? "");
      mnemonicLink.push(link ?? "");
    });
    this.fragment.updateField("mnemonicIcon", mnemonicIcon);
    this.fragment.updateField("mnemonicAlt", mnemonicAlt);
    this.fragment.updateField("mnemonicLink", mnemonicLink);
    this.dispatchEvent(new CustomEvent("refresh-fragment"));
  }
};
__publicField(MerchCardEditor, "properties", {
  fragment: { type: Object }
});
customElements.define("merch-card-editor", MerchCardEditor);

// src/rte-editor.js
var SELECTOR_DATA_WCS_OSI = "[data-wcs-osi]";
var RteEditor = class extends HTMLElement {
  constructor() {
    super(...arguments);
    __publicField(this, "editor", null);
    __publicField(this, "savedBookmark", null);
  }
  connectedCallback() {
    this.addEventListener(
      "editor-action-click",
      this.handleEditorActionClick
    );
    window.tinymce.init({
      target: this,
      toolbar: "bold italic underline | link openlink unlink | ost",
      plugins: "link",
      license_key: "gpl",
      promotion: false,
      branding: false,
      extended_valid_elements: "a[is|href|class],span[is|class]",
      content_style: ".price-strikethrough { text-decoration: line-through;}",
      setup: (editor) => {
        this.editor = editor;
        editor.on("blur", async (e4) => {
          this.savedBookmark = editor.selection.getBookmark(2);
          [...editor.contentDocument.querySelectorAll("p")].forEach(
            (p2) => {
              if (p2.innerText.trim() === "") p2.remove();
            }
          );
          [...editor.contentDocument.querySelectorAll("a")].forEach(
            (a2) => {
              Object.keys(a2.dataset).forEach((key) => {
                if (/mce/.test(key)) {
                  delete a2.dataset[key];
                }
              });
            }
          );
          let elements = [
            ...editor.contentDocument.querySelectorAll(
              SELECTOR_DATA_WCS_OSI
            )
          ];
          console.log("elements", elements);
          elements.forEach((el) => {
            if (el.dataset.wcsOsi) {
              if (el.tagName === "A") {
                el.setAttribute("is", "checkout-link");
              } else if (el.tagName === "SPAN") {
                el.setAttribute("is", "inline-price");
              }
            }
          });
          editor.contentDocument.body.innerHTML = `${editor.contentDocument.body.innerHTML}`;
          elements = [
            ...editor.contentDocument.querySelectorAll(
              SELECTOR_DATA_WCS_OSI
            )
          ];
          elements.forEach((el) => {
            if (el.isInlinePrice) {
              el.innerHTML = "";
            }
            if (el.isCheckoutLink) {
              el.setAttribute("href", "");
            }
            el.removeAttribute("class");
            el.removeAttribute("contenteditable");
          });
          removeComments(editor.contentDocument.body);
          const value = editor.contentDocument.body.innerHTML;
          elements.forEach((el) => {
            el.setAttribute("contenteditable", "false");
            el.render?.();
          });
          const changeEvent = new CustomEvent("blur", {
            bubbles: true,
            composed: true,
            detail: { value }
          });
          this.dispatchEvent(changeEvent);
        });
        editor.on("init", (e4) => {
          const masMinSource = document.querySelector('script[src$="mas.js"]')?.src ?? document.getElementById("mas-src").content;
          if (!masMinSource) return;
          const script = editor.contentDocument.createElement("script");
          script.src = masMinSource;
          script.setAttribute("type", "module");
          editor.contentDocument.head.appendChild(script);
          const masCommerceService = editor.contentDocument.createElement(
            "mas-commerce-service"
          );
          editor.contentDocument.head.appendChild(masCommerceService);
          const pandoraScript = editor.contentDocument.createElement("script");
          pandoraScript.innerHTML = "window.process = { env: {} };";
          editor.contentDocument.head.appendChild(pandoraScript);
        });
        editor.on("SetContent", (e4) => {
          [
            ...editor.contentDocument.querySelectorAll(
              "a[is],span[is]"
            )
          ].forEach((el) => {
            el.setAttribute("contenteditable", "false");
          });
        });
        editor.ui.registry.addIcon(
          "star-icon",
          `<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18">
  <title>Star</title>
  <rect id="ToDelete" fill="#ff13dc" opacity="0" width="18" height="18" /><path d="M9.24132.3l2.161,5.715,6.106.289a.255.255,0,0,1,.147.454l-4.77,3.823,1.612,5.9a.255.255,0,0,1-.386.28L9.00232,13.4l-5.11,3.358a.255.255,0,0,1-.386-.28l1.612-5.9-4.77-3.821a.255.255,0,0,1,.147-.457l6.107-.285L8.76332.3a.255.255,0,0,1,.478,0Z" />
</svg>`
        );
        editor.ui.registry.addButton("ost", {
          icon: "star-icon",
          tooltip: "Open Offer Selector Tool",
          onAction: () => {
            const customEvent = new CustomEvent("ost-open", {
              bubbles: true,
              composed: true
            });
            this.dispatchEvent(customEvent);
          }
        });
        editor.on("dblclick", (e4) => {
          e4.preventDefault();
          e4.stopImmediatePropagation();
          let target = e4.target.closest(SELECTOR_DATA_WCS_OSI);
          if (target) {
            const event = new CustomEvent("ost-open", {
              bubbles: true,
              composed: true,
              detail: { clickedElement: target }
            });
            this.dispatchEvent(event);
          }
        });
      }
    });
  }
  disconnectedCallback() {
    this.removeEventListener(
      "editor-action-click",
      this.handleEditorActionClick
    );
  }
  appendContent(html, clickedOffer2) {
    if (clickedOffer2) {
      clickedOffer2.remove();
    }
    if (this.editor) {
      if (this.savedBookmark) {
        this.editor.focus();
        this.editor.selection.moveToBookmark(this.savedBookmark);
      }
      this.editor.insertContent(html);
    }
  }
};
function removeComments(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_COMMENT,
    null,
    false
  );
  const commentNodes = [];
  let currentNode;
  while (currentNode = walker.nextNode()) {
    commentNodes.push(currentNode);
  }
  commentNodes.forEach((comment) => comment.parentNode.removeChild(comment));
}
customElements.define("rte-editor", RteEditor);

// src/mas-top-nav.js
var MasTopNav = class extends r3 {
  static get styles() {
    return i`
            :host {
                display: block;
                width: 100%;
            }
            sp-top-nav {
                width: 100%;
            }

            sp-top-nav-item {
                margin-inline-end: auto;
                margin-inline-start: 20px;
            }

            sp-top-nav-item.logo {
                color: #eb1000;
                width: 24px;
            }

            sp-top-nav-item strong {
                font-size: 21px;
                font-weight: 800;
                line-height: 20px;
                vertical-align: top;
                padding-inline-start: 5px;
            }
            sp-top-nav-item[placement='bottom-end'] {
                margin-inline-end: 10px;
            }
        `;
  }
  render() {
    return ke`
            <sp-top-nav>
                <sp-top-nav-item
                    class="logo"
                    size="l"
                    href="#"
                    label="Home"
                    quiet
                >
                    <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        x="0"
                        y="0"
                        viewBox="0 0 30 26"
                        width="24px"
                        xml:space="preserve"
                        role="img"
                        aria-label="Adobe"
                    >
                        <path
                            fill="#FA0F00"
                            d="M19 0h11v26zM11.1 0H0v26zM15 9.6L22.1 26h-4.6l-2.1-5.2h-5.2z"
                        ></path>
                    </svg>
                    <strong>Merch @ Scale Studio</strong>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Help" placement="bottom-end">
                    <sp-icon-help-outline></sp-icon-help-outline>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Help" placement="bottom-end">
                    <sp-icon-bell></sp-icon-bell>
                    <sp-top-nav-item
                        href="#"
                        label="Help"
                        placement="bottom-end"
                </sp-top-nav-item>
                </sp-top-nav-item>
            </sp-top-nav>
        `;
  }
};
customElements.define("mas-top-nav", MasTopNav);

// src/mas-filter-panel.js
var MasFilterPanel = class extends r3 {
  render() {
    return ke`
            <sp-picker label="Offer Type" selected="None">
                <sp-menu-item>Base</sp-menu-item>
                <sp-menu-item>Trial</sp-menu-item>
                <sp-menu-item>Promotion</sp-menu-item>
            </sp-picker>

            <sp-picker label="Plan Type">
                <sp-menu-item>All</sp-menu-item>
                <sp-menu-item>ABM</sp-menu-item>
                <sp-menu-item>PUF</sp-menu-item>
                <sp-menu-item>M2M</sp-menu-item>
                <sp-menu-item>P3Y</sp-menu-item>
                <sp-menu-item>Perpetual</sp-menu-item>
            </sp-picker>

            <sp-picker label="Country">
                <sp-menu-item>United States</sp-menu-item>
                <sp-menu-item>United Kingdom</sp-menu-item>
                <sp-menu-item>Canada</sp-menu-item>
                <sp-menu-item>Australia</sp-menu-item>
            </sp-picker>

            <sp-picker label="Market Segment">
                <sp-menu-item>Individual</sp-menu-item>
                <sp-menu-item>Team</sp-menu-item>
            </sp-picker>

            <sp-picker label="Tags">
                <sp-menu-item>black-friday-2024</sp-menu-item>
                <sp-menu-item>cyber-monday-2024</sp-menu-item>
            </sp-picker>
        `;
  }
};
__publicField(MasFilterPanel, "styles", i`
        :host {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 10px;
            align-self: flex-end;
        }
        sp-picker {
            width: 150px;
        }
    `);
customElements.define("mas-filter-panel", MasFilterPanel);

// src/editors/variant-picker.js
var VARIANTS = [
  { label: "All", value: "all", surface: "all" },
  { label: "Catalog", value: "catalog", surface: "acom" },
  { label: "CCD Action", value: "ccd-action", surface: "ccd" },
  { label: "Slice", value: "ccd-slice", surface: "ccd" },
  { label: "Special offers", value: "special-offers", surface: "acom" },
  { label: "Suggested", value: "ccd-suggested", surface: "ccd" }
];
var VariantPicker = class extends r3 {
  get value() {
    return this.shadowRoot.querySelector("sp-picker")?.value;
  }
  get variants() {
    return VARIANTS.filter(
      (variant) => this.showAll || variant.value != "all"
    ).map(
      (variant) => ke`<sp-menu-item value="${variant.value}"
                    >${variant.label}</sp-menu-item
                >`
    );
  }
  render() {
    return ke`<sp-picker
            label="Card Variant"
            size="m"
            value=${this.value || this.defaultValue}
        >
            ${this.variants}
        </sp-picker>`;
  }
};
__publicField(VariantPicker, "properties", {
  defaultValue: { type: String, attribute: "default-value" },
  showAll: { type: Boolean, attribute: "show-all" }
});
customElements.define("variant-picker", VariantPicker);

// src/mas-filter-toolbar.js
var MasFilterToolbar = class extends r3 {
  constructor() {
    super();
    this.searchText = "";
    this.variant = "all";
  }
  render() {
    return ke`
            <sp-button
                label="Filter"
                variant="secondary"
                @click=${this.handleFilterClick}
                >Filter</sp-button
            >
            <sp-picker label="Sort">
                <sp-menu-item>Ascending</sp-menu-item>
                <sp-menu-item>Descending</sp-menu-item>
            </sp-picker>
            <div>
                <sp-search
                    placeholder="Search"
                    @change="${this.handleSearch}"
                    @submit="${this.handleSearch}"
                    value=${this.searchText}
                    size="m"
                ></sp-search>
                <variant-picker
                    id="vpick"
                    show-all="true"
                    default-value="${this.variant}"
                    @change="${this.handleVariantChange}"
                ></variant-picker>
                <sp-button @click=${this.doSearch}>Search</sp-button>
            </div>
        `;
  }
  handleSearch(e4) {
    this.searchText = e4.target.value;
    this.dispatchEvent(
      new CustomEvent("search-text-changed", {
        detail: { searchText: this.searchText },
        bubbles: true,
        composed: true
      })
    );
    if (!this.searchText) {
      this.dispatchEvent(
        new CustomEvent("clear-search", {
          bubbles: true,
          composed: true
        })
      );
    }
    if (e4.type === "submit") {
      e4.preventDefault();
      this.dispatchEvent(
        new CustomEvent("search-fragments", {
          bubbles: true,
          composed: true
        })
      );
    }
  }
  handleVariantChange(e4) {
    this.variant = e4.target.value;
    this.dispatchEvent(
      new CustomEvent("variant-changed", {
        detail: { variant: this.variant },
        bubbles: true,
        composed: true
      })
    );
  }
  doSearch() {
    this.dispatchEvent(
      new CustomEvent("search-fragments", {
        bubbles: true,
        composed: true
      })
    );
  }
  handleFilterClick() {
    this.dispatchEvent(
      new CustomEvent("toggle-filter-panel", {
        bubbles: true,
        composed: true
      })
    );
  }
};
__publicField(MasFilterToolbar, "styles", i`
        :host {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 10px;
            align-self: flex-end;
        }
        sp-picker {
            width: 100px;
        }
        sp-textfield {
            width: 200px;
        }
    `);
__publicField(MasFilterToolbar, "properties", {
  searchText: { type: String, state: true },
  variant: { type: String, state: true }
});
customElements.define("mas-filter-toolbar", MasFilterToolbar);

// src/ost.js
var ostRoot;
var currentRte;
var currentVariant;
var clickedOffer;
var ctaTexts = {
  "buy-now": "Buy now",
  "free-trial": "Free trial",
  "start-free-trial": "Start free trial",
  "get-started": "Get started",
  "choose-a-plan": "Choose a plan",
  "learn-more": "Learn more",
  "change-plan-team-plans": "Change Plan Team Plans",
  upgrade: "Upgrade",
  "change-plan-team-payment": "Change Plan Team Payment",
  "take-the-quiz": "Take the quiz",
  "see-more": "See more",
  "upgrade-now": "Upgrade now"
};
var noPlaceholderCardVariants = ["ccd-action", "ah"];
var ostDefaults = {
  aosApiKey: "wcms-commerce-ims-user-prod",
  checkoutClientId: "creative",
  country: "US",
  environment: "PROD",
  landscape: "PUBLISHED",
  language: "en",
  searchParameters: {},
  searchOfferSelectorId: null,
  defaultPlaceholderOptions: {
    displayRecurrence: true,
    displayPerUnit: true,
    displayTax: false,
    displayOldPrice: false,
    forceTaxExclusive: true
  },
  wcsApiKey: "wcms-commerce-ims-ro-user-cc",
  ctaTextOption: {
    ctaTexts: Object.entries(ctaTexts).map(([id, name]) => ({ id, name })),
    getDefaultText() {
      return this.ctaTexts[0].id;
    },
    getTexts() {
      return this.ctaTexts;
    },
    getSelectedText(searchParameters) {
      const ctaLabel = searchParameters.get("text");
      return !!ctaLabel && this.ctaTexts.find((label) => label.id === ctaLabel) ? ctaLabel : this.getDefaultText();
    }
  }
};
var createMarkup = (offerSelectorId, type, offer, options, promo) => {
  const isCta = !!type?.startsWith("checkout");
  if (isCta) {
    const cta = document.createElement("a", { is: "checkout-link" });
    cta.setAttribute("data-checkout-workflow", options.workflow);
    cta.setAttribute(
      "data-checkout-workflow-step",
      options.workflowStep ?? "segmentation"
    );
    cta.setAttribute("data-promotion-code", promo ?? "");
    cta.setAttribute("data-quantity", "1");
    cta.setAttribute("data-wcs-osi", offerSelectorId);
    cta.href = "#";
    const span = document.createElement("span");
    let ctaText = options.ctaText ?? "buy-now";
    if (noPlaceholderCardVariants.includes(currentVariant)) {
      ctaText = ctaTexts[ctaText];
    }
    span.textContent = ctaText;
    cta.appendChild(span);
    return cta;
  } else {
    const inlinePrice = document.createElement("span", {
      is: "inline-price"
    });
    inlinePrice.setAttribute(
      "data-display-per-unit",
      options.displayPerUnit ?? "false"
    );
    inlinePrice.setAttribute(
      "data-quantity",
      offer.ordering.max_quantity ?? "1"
    );
    inlinePrice.setAttribute("data-template", type);
    inlinePrice.setAttribute("data-wcs-osi", offerSelectorId);
    inlinePrice.innerHTML = "&nbsp;";
    return inlinePrice;
  }
};
function onSelect(offerSelectorId, type, offer, options, promoOverride) {
  const link = createMarkup(
    offerSelectorId,
    type,
    offer,
    options,
    promoOverride
  );
  console.log(`Use Link: ${link.outerHTML}`);
  if (clickedOffer) {
    clickedOffer.outerHTML = link.outerHTML;
  } else {
    currentRte.appendContent(link.outerHTML);
  }
  closeOstDialog();
}
var getOstEl = () => document.getElementById("ostDialog");
var openOstDialog = () => {
  getOstEl().open = true;
};
var closeOstDialog = () => {
  getOstEl().open = false;
};
function getOffferSelectorTool() {
  return ke`
        <sp-overlay id="ostDialog" type="modal">
            <sp-dialog-wrapper dismissable underlay>
                <div id="ost"></div>
            </sp-dialog-wrapper>
        </overlay-trigger>
    `;
}
function openOfferSelectorTool(e4, rte, variant) {
  currentRte = rte;
  currentVariant = variant;
  clickedOffer = e4.detail?.clickedElement;
  let searchOfferSelectorId;
  if (!ostRoot || clickedOffer) {
    ostRoot = document.getElementById("ost");
    const aosAccessToken = localStorage.getItem("masAccessToken") ?? window.adobeid.authorize();
    const searchParameters = new URLSearchParams();
    const defaultPlaceholderOptions = {
      ...ostDefaults.defaultPlaceholderOptions
    };
    if (clickedOffer) {
      searchOfferSelectorId = clickedOffer.getAttribute("data-wcs-osi");
      Object.assign(defaultPlaceholderOptions, clickedOffer.dataset);
    }
    window.ost.openOfferSelectorTool({
      ...ostDefaults,
      rootElement: ostRoot,
      zIndex: 20,
      aosAccessToken,
      searchParameters,
      searchOfferSelectorId,
      defaultPlaceholderOptions,
      onSelect
    });
  }
  if (ostRoot) {
    openOstDialog();
  }
}

// src/studio.js
var EVENT_LOAD_START = "load-start";
var EVENT_LOAD_END = "load-end";
var MasStudio = class extends r3 {
  constructor() {
    super();
    this.newFragment = null;
    this.root = "/content/dam/mas";
    this.variant = "all";
    this.searchText = "";
    this.path = "";
    this.showFilterPanel = false;
  }
  connectedCallback() {
    super.connectedCallback();
    this.registerListeners();
    this.startDeeplink();
    this.addEventListener("toggle-filter-panel", this.toggleFilterPanel);
    this.addEventListener("clear-search", this.clearSearch);
    this.addEventListener("search-fragments", this.doSearch);
    this.addEventListener("variant-changed", this.handleVariantChange);
    this.addEventListener(
      "search-text-changed",
      this.handleSearchTextChange
    );
  }
  registerListeners() {
    this.addEventListener(EVENT_LOAD_START, () => {
      this.requestUpdate();
      this.updateDeeplink();
    });
    this.addEventListener(EVENT_LOAD_END, () => this.requestUpdate());
    document.addEventListener("keydown", (e4) => {
      if (e4.key === "Escape") {
        this.closeFragmentEditor();
        this.source.clearSelection();
        this.contentNavigation.toggleSelectionMode(false);
        document.activeElement.blur();
      }
    });
    this.addEventListener(
      "select-fragment",
      (e4) => this.handleOpenFragment(e4)
    );
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.deeplinkDisposer) {
      this.deeplinkDisposer();
    }
  }
  updateDeeplink() {
    const state = { ...this.source?.search };
    if (state.path === this.root) state.path = "";
    pushState(state);
  }
  toggleFilterPanel() {
    this.showFilterPanel = !this.showFilterPanel;
  }
  clearSearch() {
    this.searchText = "";
    pushState({
      query: void 0,
      path: void 0
    });
  }
  handleSearchTextChange(e4) {
    this.searchText = e4.detail.searchText;
  }
  updated(changedProperties) {
    if (changedProperties.has("searchText") || changedProperties.has("path") || changedProperties.has("variant")) {
      this.source?.sendSearch();
    }
  }
  get search() {
    return this.querySelector("sp-search");
  }
  get picker() {
    return this.querySelector("sp-picker");
  }
  get source() {
    return this.querySelector("aem-fragments");
  }
  get contentNavigation() {
    return this.querySelector("content-navigation");
  }
  get fragment() {
    return this.source?.fragment;
  }
  createRenderRoot() {
    return this;
  }
  get selectFragmentDialog() {
    return ke`
            ${this.newFragment ? ke`<sp-overlay type="modal" open>
                      <sp-dialog-wrapper
                          headline="You have unsaved changes!"
                          underlay
                          @confirm=${() => this.saveAndEditFragment(this.newFragment)}
                          @secondary="${() => this.editFragment(this.newFragment, true)}"
                          @cancel="${this.closeConfirmSelect}"
                          confirm-label="Save"
                          secondary-label="Discard"
                          cancel-label="Cancel"
                      >
                          <p>
                              Do you want to save your changes before selecting
                              another merch card?
                          </p>
                      </sp-dialog-wrapper>
                  </sp-overlay>` : D}
        `;
  }
  get fragmentEditorToolbar() {
    return ke`<div id="actions" slot="heading">
            <sp-action-group
                aria-label="Fragment actions"
                role="group"
                size="l"
                compact
                emphasized
            >
                <sp-action-button
                    label="Save"
                    title="Save changes"
                    value="save"
                    @click="${this.saveFragment}"
                >
                    <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
                </sp-action-button>
                <sp-action-button
                    label="Discard"
                    title="Discard changes"
                    value="discard"
                    @click="${this.discardChanges}"
                >
                    <sp-icon-undo slot="icon"></sp-icon-undo>
                </sp-action-button>
                <sp-action-button
                    label="Clone"
                    value="clone"
                    @click="${this.copyFragment}"
                >
                    <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                </sp-action-button>
                <sp-action-button
                    label="Publish"
                    value="publish"
                    @click="${this.publishFragment}"
                >
                    <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                </sp-action-button>
                <sp-action-button
                    label="Unpublish"
                    value="unpublish"
                    @click="${this.unpublishFragment}"
                >
                    <sp-icon-publish-remove
                        slot="icon"
                    ></sp-icon-publish-remove>
                </sp-action-button>
                <sp-action-button
                    label="Open in Odin"
                    value="open"
                    @click="${this.openFragmentInOdin}"
                >
                    <sp-icon-open-in slot="icon"></sp-icon-open-in>
                </sp-action-button>
                <sp-action-button
                    label="Use"
                    value="use"
                    @click="${this.copyToUse}"
                >
                    <sp-icon-code slot="icon"></sp-icon-code>
                </sp-action-button>
                <sp-action-button
                    label="Delete fragment"
                    value="delete"
                    @click="${this.deleteFragment}"
                >
                    <sp-icon-delete-outline
                        slot="icon"
                    ></sp-icon-delete-outline>
                </sp-action-button>
            </sp-action-group>
            <sp-divider vertical></sp-divider>
            <sp-action-group size="l">
                <sp-action-button
                    title="Close"
                    label="Close"
                    value="close"
                    @click="${this.closeFragmentEditor}"
                >
                    <sp-icon-close-circle slot="icon"></sp-icon-close-circle>
                </sp-action-button>
            </sp-action-group>
        </div>`;
  }
  get fragmentEditor() {
    return ke`<sp-overlay type="manual" ?open=${this.fragment}>
            <sp-popover id="editor">
                <sp-dialog no-divider>
                    ${this.fragment ? ke`
                              <merch-card-editor
                                  .fragment=${this.fragment}
                                  @ost-open="${this.openOfferSelectorTool}"
                                  @refresh-fragment="${this.refreshFragment}"
                                  @update-fragment="${this.updateFragment}"
                              >
                              </merch-card-editor>
                              <p>Fragment details (not shown on the card)</p>
                              <sp-divider size="s"></sp-divider>
                              <sp-field-label for="fragment-title"
                                  >Fragment Title</sp-field-label
                              >
                              <sp-textfield
                                  placeholder="Enter fragment title"
                                  id="fragment-title"
                                  data-field="title"
                                  value="${this.fragment.title}"
                                  @change="${this.updateFragmentInternal}"
                              ></sp-textfield>
                              <sp-field-label for="fragment-description"
                                  >Fragment Description</sp-field-label
                              >
                              <sp-textfield
                                  placeholder="Enter fragment description"
                                  id="fragment-description"
                                  data-field="description"
                                  multiline
                                  value="${this.fragment.description}"
                                  @change="${this.updateFragmentInternal}"
                              ></sp-textfield>
                              ${this.fragmentEditorToolbar}
                          ` : D}
                </sp-dialog>
            </sp-popover>
        </sp-overlay>`;
  }
  get content() {
    return ke`
            <aem-fragments
                id="aem"
                base-url="${this.baseUrl}"
                root="${this.root}"
                path="${this.path}"
                search="${this.searchText}"
                bucket="${this.bucket}"
                variant="${this.variant}"
            ></aem-fragments>
            <content-navigation source="aem" ?disabled=${this.fragment}>
                <table-view .customRenderItem=${this.customRenderItem}>
                    <sp-table-head-cell slot="headers"
                        >Variant</sp-table-head-cell
                    >
                </table-view>
                <render-view></render-view>
            </content-navigation>
        `;
  }
  customRenderItem(item) {
    if (!item) return ke`<sp-table-cell></sp-table-cell>`;
    return ke` <sp-table-cell>${item.variant}</sp-table-cell>`;
  }
  render() {
    return ke`
            <mas-top-nav></mas-top-nav>
            <side-nav></side-nav>
            <mas-filter-toolbar></mas-filter-toolbar>
            ${this.showFilterPanel ? ke`<mas-filter-panel></mas-filter-panel>` : D}
            ${this.content} ${this.fragmentEditor} ${this.selectFragmentDialog}
            ${this.toast} ${this.loadingIndicator} ${getOffferSelectorTool()}
        `;
  }
  get toast() {
    return ke`<sp-toast timeout="6000" popover></sp-toast>`;
  }
  get loadingIndicator() {
    if (!this.source?.loading) return D;
    return ke`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`;
  }
  get toastEl() {
    return this.querySelector("sp-toast");
  }
  startDeeplink() {
    this.deeplinkDisposer = deeplink(({ query, path }) => {
      this.searchText = query ?? "";
      this.path = path ?? "";
    });
  }
  showToast(message, variant = "info") {
    const toast = this.toastEl;
    if (toast) {
      toast.textContent = message;
      toast.variant = variant;
      toast.open = true;
      toast.showPopover();
    }
  }
  /**
   * If the current fragment has unsaved changes, the user will be prompted to save them before editing the new fragment.
   * @param {Fragment} fragment
   * @param {boolean} force - discard unsaved changes
   */
  async editFragment(fragment, force = false) {
    if (fragment && fragment === this.fragment) {
      this.requestUpdate();
      return;
    }
    if (this.fragment?.hasChanges && !force) {
      this.newFragment = fragment;
    } else {
      this.newFragment = null;
      this.source?.setFragment(fragment);
    }
    this.requestUpdate();
  }
  async saveAndEditFragment(fragment) {
    await this.saveFragment();
    await this.editFragment(fragment, true);
  }
  async adjustEditorPosition(x2, y2) {
    await this.updateComplete;
    const viewportCenterX = window.innerWidth / 2;
    const left = x2 > viewportCenterX ? "1em" : "inherit";
    const right = x2 <= viewportCenterX ? "1em" : "inherit";
    this.style.setProperty("--editor--left", left);
    this.style.setProperty("--editor--right", right);
    const viewportCenterY = window.innerHeight / 2;
    const top = y2 > viewportCenterY ? "1em" : "inherit";
    const bottom = y2 <= viewportCenterY ? "1em" : "inherit";
    this.style.setProperty("--editor--top", top);
    this.style.setProperty("--editor--bottom", bottom);
  }
  async handleOpenFragment(e4) {
    const { x: x2, y: y2, fragment } = e4.detail;
    await this.adjustEditorPosition(x2, y2);
    await this.editFragment(fragment);
  }
  updateFragmentInternal(e4) {
    const fieldName = e4.target.dataset.field;
    let value = e4.target.value;
    this.fragment.updateFieldInternal(fieldName, value);
  }
  updateFragment({ detail: e4 }) {
    const fieldName = e4.target.dataset.field;
    let value = e4.target.value || e4.detail?.value;
    value = e4.target.multiline ? value?.split(",") : [value ?? ""];
    if (this.fragment.updateField(fieldName, value)) {
      this.fragmentElement?.refresh(false);
    }
  }
  get fragmentElement() {
    return this.querySelector(
      `aem-fragment[fragment="${this.fragment.id}"]`
    );
  }
  /** Refresh the fragment with locally updated data and awaits until ready */
  async refreshFragment(e4) {
    var _a;
    if (!this.fragmentElement) return;
    (_a = this.fragment).eventTarget ?? (_a.eventTarget = this.fragmentElement.parentElement);
    this.fragmentElement.refresh(false);
    await this.fragmentElement.updateComplete;
  }
  async saveFragment() {
    this.showToast("Saving fragment...");
    try {
      await this.source?.saveFragment();
      await this.refreshFragment();
      this.requestUpdate();
      this.showToast("Fragment saved", "positive");
    } catch (e4) {
      this.showToast("Fragment could not be saved", "negative");
    }
  }
  async discardChanges() {
    await this.source?.discardChanges();
    this.showToast("Changes discarded", "info");
  }
  async copyFragment() {
    this.showToast("Cloning fragment...");
    try {
      await this.source?.copyFragment();
      this.showToast("Fragment cloned", "positive");
    } catch (e4) {
      this.showToast("Fragment could not be cloned", "negative");
    }
  }
  async closeFragmentEditor() {
    await this.source?.setFragment(null);
    this.requestUpdate();
  }
  closeConfirmSelect() {
    this.newFragment = null;
  }
  handleSearch(e4) {
    this.searchText = this.search.value;
    if (!this.searchText) {
      pushState({
        query: void 0,
        path: void 0
      });
    }
    if (e4.type === EVENT_SUBMIT) {
      e4.preventDefault();
      this.source?.searchFragments();
    }
  }
  handleVariantChange(e4) {
    this.variant = e4.target.value;
  }
  doSearch() {
    this.source?.searchFragments();
  }
  openFragmentInOdin() {
    window.open(
      `https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${this.fragment?.fragmentName}`,
      "_blank"
    );
  }
  async publishFragment() {
    this.showToast("Publishing fragment...");
    try {
      await this.source?.publishFragment();
      this.showToast("Fragment published", "positive");
    } catch (e4) {
      this.showToast("Fragment could not be published", "negative");
    }
  }
  async unpublishFragment() {
    this.showToast("Unpublishing fragment...");
    try {
      await this.source?.unpublishFragment();
      this.showToast("Fragment unpublished", "positive");
    } catch (e4) {
      this.showToast("Fragment could not be unpublished", "negative");
    }
  }
  async deleteFragment() {
    if (confirm("Are you sure you want to delete this fragment?")) {
      try {
        await this.source?.deleteFragment();
        this.showToast("Fragment deleted", "positive");
      } catch (e4) {
        this.showToast("Fragment could not be deleted", "negative");
      }
    }
  }
  async copyToUse() {
    const code = `<merch-card><aem-fragment fragment="${this.fragment?.id}"></aem-fragment></merch-card>`;
    try {
      await navigator.clipboard.writeText(code);
      this.showToast("Code copied to clipboard", "positive");
    } catch (e4) {
      this.showToast("Failed to copy code to clipboard", "negative");
    }
  }
  openOfferSelectorTool(e4) {
    openOfferSelectorTool(e4, e4.target, this.fragment?.variant);
  }
};
__publicField(MasStudio, "properties", {
  bucket: { type: String, attribute: "aem-bucket" },
  searchText: { type: String, state: true },
  baseUrl: { type: String, attribute: "base-url" },
  root: { type: String, state: true },
  path: { type: String, state: true },
  variant: { type: String, state: true },
  newFragment: { type: Object, state: true },
  showFilterPanel: { type: Boolean, state: true }
});
customElements.define("mas-studio", MasStudio);
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

lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=studio.js.map
